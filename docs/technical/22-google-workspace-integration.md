# BRAÇO — Integração real de Google Calendar + Google Tasks via OAuth

Issue #31, US14. Implementação real (não simulada) da conexão de Google
Calendar e Google Tasks por empresa/tenant, com uma única autorização
OAuth compartilhada entre os dois recursos. Este documento descreve o
que existe em código hoje — mesmo espírito de
`docs/technical/21-zernio-whatsapp-integration.md`: `06-google-
calendar.md`/`07-google-tasks.md` continuam sendo a visão de arquitetura
operacional futura (sincronização, webhooks/push, polling, criação real
de eventos/tarefas), não o estado implementado por esta issue.

## 1. Escopo

Implementado: conexão OAuth real, armazenamento seguro da autorização,
seleção/validação de um calendário operacional, criação/reuso
idempotente da lista de Tasks, status da integração, reconexão/
desconexão, integração com a readiness existente (US14).

**Fora de escopo desta issue** (pertence a etapas operacionais
posteriores — nenhuma linha de código aqui implementa isto):
criação/edição/cancelamento de eventos, execução de follow-ups via
Tasks, Runtime, Policy Engine operacional, polling periódico de Tasks,
Calendar push notifications/`watch`, sincronização de eventos.

## 2. Onde vive o código

```
apps/api/src/integrations/google/
  google.module.ts                  módulo Nest — DI, providers condicionais
  google.tokens.ts                  tokens de injeção (GOOGLE_OAUTH_CONFIG, GOOGLE_FETCH, CREDENTIALS_CIPHER)
  google-config.ts                  leitura/validação de env vars, escopos OAuth
  credentials-cipher.ts             abstração de criptografia + implementação AES-256-GCM (não produção — ver §9)
  google-api-client.ts              cliente HTTP (OAuth token/revoke + Calendar API + Tasks API)
  google-api-types.ts               tipos mínimos das respostas do Google consumidas
  google-connection.service.ts      orquestração: OAuth, seleção de Calendar, setup de Tasks, disconnect, refresh
  google-connection.controller.ts   POST /connect, GET /callback, GET /calendars, POST /calendar/select, POST /tasks/setup, GET /status, POST .../disconnect
  dto/select-calendar.dto.ts
```

`ResourcesService`/`PreparationReadinessService` (Track A, TD19,
`docs/technical/17-technical-decisions.md`) **não foram alterados**.
`GoogleConnectionService` só escreve nas mesmas linhas `Integration`
(`type: GOOGLE_CALENDAR`/`GOOGLE_TASKS`) que essas duas classes já leem,
sempre com `connectionMode: REAL` — nunca `SIMULATED`, que continua
sendo o caminho de `ResourcesService.confirmConnection`. O teste e2e
"Readiness" (§12) confirma isso na prática: depois de conectar
Calendar/Tasks reais, `GET /digital-employees/:id/resources` (rota
existente, código não tocado) já reflete `CONNECTED`/`REAL`.

## 3. Modelo de dados

Duas tabelas novas (`apps/api/prisma/schema.prisma`, migração
`20260914120553_google_oauth_integration`):

- **`GoogleConnection`** (1 por empresa, `@@unique([companyId])`) —
  infraestrutura de autorização: `status` (`NOT_CONNECTED`/
  `CONNECTING`/`CONNECTED`/`DEGRADED`/`DISCONNECTED`/`FAILED`),
  `accessTokenEncrypted`/`refreshTokenEncrypted` (sempre cifrados —
  nunca texto plano), `tokenExpiresAt`, `grantedScopes`, `calendarId`/
  `calendarSummary` (recurso Calendar selecionado), `taskListId`
  (recurso Tasks configurado), `connectedAt`/`disconnectedAt`/
  `lastRefreshAt`/`failureReason`.
- **`GoogleOAuthAttempt`** — a correlação interna de uso único do fluxo
  OAuth (`id` = o `state` enviado ao Google e devolvido no callback),
  com `expiresAt` (10 min) e `consumedAt` (marcado no instante em que o
  callback chega, antes de qualquer outro efeito — impede replay).
  Mesmo padrão de `ZernioOnboardingAttempt` (issue #30).

`Integration` (modelo já existente, tipos `GOOGLE_CALENDAR`/
`GOOGLE_TASKS`) não muda — continua sendo a fonte funcional de estado
de recurso que `ResourcesService`/`PreparationReadinessService` leem.

### RLS

- **`google_connections`**: policy padrão de tenant (`company_id =
  current_setting('app.current_company_id', true)`). Diferente do
  Zernio, não precisa de uma policy de lookup por identificador externo
  — o Google nunca entrega nada (callback incluso) sem o `state`
  correlacionado primeiro, e a partir daí o fluxo já sabe o
  `companyId`.
- **`google_oauth_attempts`**: mesma extensão aditiva já usada em
  `zernio_onboarding_attempts` (`OR id = current_setting
  ('app.current_google_lookup_attempt_id', true)`) — o callback público
  (sem JWT) localiza a tentativa pelo próprio `id` antes de saber a
  que empresa ela pertence. `PrismaService.withGoogleAttemptLookup`
  faz o `set_config` correspondente, espelhando
  `withZernioAttemptLookup`.

Testado com testes negativos reais contra Postgres (`test/google.e2e-
spec.ts`, seção "Isolamento entre tenants"): empresa B não lê a
`GoogleConnection` de A, não lista calendários usando o token de A
(sem conexão própria, recebe 403), não desconecta o recurso de A
(404 — B nunca teve esse recurso).

## 4. Decisão de Produto — uma conexão OAuth por empresa

Existe **uma** `GoogleConnection` por empresa; a mesma autorização
atende `GOOGLE_CALENDAR` e `GOOGLE_TASKS` — nunca dois consentimentos
OAuth independentes, nunca o refresh token duplicado em duas fontes de
verdade. Para o usuário, os dois recursos continuam aparecendo
separados (duas linhas `Integration`, dois estados, dois botões de
desconectar) — ver TD23 (`docs/technical/17-technical-decisions.md`)
para a justificativa arquitetural completa.

## 5. Escopos OAuth

Só os mínimos necessários (nunca o escopo amplo `calendar`):

```
https://www.googleapis.com/auth/calendar.calendarlist.readonly
https://www.googleapis.com/auth/calendar.events
https://www.googleapis.com/auth/calendar.events.freebusy
https://www.googleapis.com/auth/tasks
```

Pedidos no mesmo consentimento (`GoogleApiClient.buildAuthorizationUrl`,
`google-config.ts#GOOGLE_OAUTH_SCOPES`). `access_type=offline` +
`prompt=consent` são enviados para maximizar a chance de receber um
`refresh_token` mesmo em reautorizações.

## 6. Fluxo OAuth

1. `POST /integrations/google/connect` (JWT, OWNER/ADMIN): cria
   `GoogleOAuthAttempt` (10 min de validade), marca `GoogleConnection`
   como `CONNECTING` (upsert), devolve `{ authorizationUrl }` — o
   `state` embutido é o próprio `id` da tentativa. **Nunca** confia em
   `companyId`/`userId` isolados da query string do callback — a
   correlação é 100% via esse `state`.
2. Frontend redireciona ao Google.
3. Google redireciona para `GET /integrations/google/callback` (rota
   pública — o Google chega sem JWT). O callback:
   - sem `state` ou `state` desconhecido/expirado/já consumido
     (replay) → mesmo resultado genérico (`reason=session_expired`)
     para os três casos, para não revelar qual ocorreu;
   - **consome a tentativa imediatamente**, antes de qualquer outro
     efeito;
   - `error` presente (usuário negou/cancelou) → persiste
     `failureReason=connection_cancelled`, redireciona com esse motivo
     (nunca um erro técnico cru);
   - código presente → troca `code` por tokens
     (`GoogleApiClient.exchangeCodeForTokens`), cifra e persiste
     (`accessTokenEncrypted`/`refreshTokenEncrypted`/
     `tokenExpiresAt`/`grantedScopes`), marca `GoogleConnection`
     `CONNECTED`. **Nunca sobrescreve um `refreshTokenEncrypted`
     válido com null** quando o Google não devolve um novo refresh
     token nesta troca (comportamento documentado do Google — comum em
     reautorizações).
4. `GoogleConnection.CONNECTED` significa só que a autorização em si
   está saudável — os recursos (`Integration` GOOGLE_CALENDAR/
   GOOGLE_TASKS) só ficam `CONNECTED`+`REAL` depois das etapas
   específicas abaixo.

## 7. Fluxo Calendar

1. `GET /integrations/google/calendars` — lista os calendários da conta
   conectada (`calendarList.list`), com `accessRole` de cada um.
2. `POST /integrations/google/calendar/select` `{ calendarId }` —
   valida via `calendarList.get(calendarId)` (metadata oficial da API,
   nunca um evento fake criado só para provar acesso). Exige
   `accessRole` `owner` ou `writer` — `reader`/`freeBusyReader` são
   rejeitados (403) **sem persistir nada**. Só então grava `calendarId`/
   `calendarSummary` em `GoogleConnection` e marca `Integration
   (GOOGLE_CALENDAR)` → `status: CONNECTED`, `connectionMode: REAL`,
   `externalAccountRef: calendarId`.

## 8. Fluxo Tasks

`POST /integrations/google/tasks/setup` — nunca pede ao gestor para
escolher uma lista. Busca em `tasklists.list` por um título exatamente
`BRAÇO — Follow-ups`; se existir, reutiliza (idempotente — nunca cria
duplicata); senão, cria via `tasklists.insert`. Persiste `taskListId`
e marca `Integration(GOOGLE_TASKS)` → `CONNECTED`/`REAL`/
`externalAccountRef: taskListId`.

## 9. Criptografia

`CredentialsCipher` (`credentials-cipher.ts`) é a única abstração que
lida com bytes de chave/cifra — nada mais no módulo toca nisso
diretamente. Dois providers implementam a interface hoje (issue de KMS
production-grade, TD24):

**`EnvKeyAesGcmCipher`** — AES-256-GCM real (IV aleatório por chamada,
autenticação por tag, nunca texto plano) com uma chave simétrica fixa
vinda de `GOOGLE_CREDENTIALS_ENCRYPTION_KEY` (env var, base64 de 32
bytes). `isProductionGrade: false` de propósito — **não satisfaz
sozinha** o requisito de produção de `docs/technical/10-security-
lgpd.md` §4 ("chave gerida por KMS com rotação"). Continua válida para
desenvolvimento/homologação controlada.

**`GoogleCloudKmsCipher`** (`kms/google-cloud-kms-cipher.ts`) —
`isProductionGrade: true`. A chave nunca sai do Google Cloud KMS; só as
operações `Encrypt`/`Decrypt` da API REST do Cloud KMS
(`cloudkms.googleapis.com`) são chamadas, autenticadas via uma service
account dedicada (fluxo OAuth2 "JWT Bearer" de service account, RFC
7523 — implementado em cima de `node:crypto`/`fetch`, sem SDK oficial
novo, mesmo padrão de `GoogleApiClient`/`ZernioClient`: cliente HTTP
fino, `fetch` injetável, testável sem rede real). A identidade usada
deve ter **só** `roles/cloudkms.cryptoKeyEncrypterDecrypter` na chave
usada, nunca um papel mais amplo.

**Ciphertext versionado**: `GoogleCloudKmsCipher.encrypt()` sempre
grava com o prefixo `gcpkms:v1:`; ciphertext sem esse prefixo é tratado
como o formato legado do `EnvKeyAesGcmCipher`. Isso permite os dois
formatos coexistirem no banco durante uma migração — `decrypt()` lê
qualquer um dos dois (delegando para um `EnvKeyAesGcmCipher` interno só
para leitura do formato legado, nunca para escrita), mas **nunca
reescreve** o formato antigo como efeito colateral de uma leitura
normal. A reencriptação de fato é sempre uma ação explícita:
`scripts/reencrypt-google-credentials.ts` (dry-run por padrão,
`--apply` para gravar; nunca loga plaintext) ou o próximo refresh de
token real de cada conexão (que sempre grava no formato novo).

**Seleção do provider**: `CREDENTIALS_CIPHER_PROVIDER=env|gcp-kms`
(default `env`, retrocompatível). Fail-closed em produção
(`assertCredentialsCipherEnvValid`, chamado em `main.ts` ao lado de
`assertGoogleEnvValid`): se o Google está habilitado em produção e o
provider não é `gcp-kms` totalmente configurado, o boot falha — nunca
um fallback silencioso para `env`.

`assertGoogleEnvValid()` (chamado em `bootstrap()`, `main.ts`) exige
`GOOGLE_CREDENTIALS_ENCRYPTION_KEY` junto das demais variáveis
obrigatórias **só quando `CREDENTIALS_CIPHER_PROVIDER` é `env`**
(default) — falha o boot em produção se `GOOGLE_CLIENT_ID` estiver
presente mas a chave de cifra (ou qualquer outra obrigatória) estiver
ausente, mesmo padrão do Zernio. **Com `CREDENTIALS_CIPHER_PROVIDER=
gcp-kms`, `GOOGLE_CREDENTIALS_ENCRYPTION_KEY` vira opcional** (TD25) —
um ambiente novo, sem ciphertext legado para ler, não precisa dela;
continua útil só temporariamente, num ambiente em migração. A exigência
de `GCP_KMS_*` em si é responsabilidade separada de
`assertCredentialsCipherEnvValid` (§9 acima) — as duas funções compõem
sem se sobrepor: `assertGoogleEnvValid` cobre as variáveis do OAuth,
`assertCredentialsCipherEnvValid` cobre as do provider de cifra.

## 10. Refresh e revogação

`GoogleConnectionService` (privado, `ensureValidAccessToken`) decifra o
access token corrente; se estiver a menos de 60s de expirar, renova via
`refresh_token` antes de qualquer chamada à API. **Nunca sobrescreve um
refresh token válido por `null`** quando o Google não devolve um novo
na renovação (testado em `test/google.e2e-spec.ts`).

Falha definitiva de refresh (ex.: `invalid_grant` — revogado
externamente pelo usuário no painel do Google, ou pela própria conta
Google) → `markDegraded`: `GoogleConnection` vira `DEGRADED`, e
qualquer `Integration` (GOOGLE_CALENDAR/GOOGLE_TASKS) hoje `CONNECTED`
vira `NEEDS_ATTENTION` — nunca considerada válida para readiness (TD19
já exige `status === CONNECTED`, que deixa de valer aqui) e nunca
mantida `CONNECTED` silenciosamente.

## 11. Desconexão

Calendar e Tasks aparecem separados para o usuário, mas compartilham a
mesma `GoogleConnection`. `disconnectCalendar`/`disconnectTasks`:

1. Marcam a `Integration` correspondente `DISCONNECTED` (404 se o
   recurso nunca esteve configurado).
2. Limpam o campo específico em `GoogleConnection` (`calendarId`/
   `calendarSummary` ou `taskListId`).
3. Só fazem *best-effort* revoke do token compartilhado + limpam
   `accessTokenEncrypted`/`refreshTokenEncrypted` **quando nenhum dos
   dois recursos continuar `CONNECTED`** — desconectar um não derruba
   o outro.
4. Erro remoto no revoke nunca deixa o recurso `CONNECTED` de novo: os
   dois já foram marcados `DISCONNECTED` no passo 1, antes da tentativa
   de revoke — o *best-effort* só decide se as credenciais locais são
   limpas mesmo assim (sim, sempre, já que a intenção local de
   desconectar deve valer mesmo se o Google não confirmar).

## 12. Endpoints

| Rota | Guard | Descrição |
|---|---|---|
| `POST /integrations/google/connect` | JWT, OWNER/ADMIN | Inicia OAuth, devolve `authorizationUrl` |
| `GET /integrations/google/callback` | público | Callback OAuth — correlação só via `state` |
| `GET /integrations/google/calendars` | JWT | Lista calendários da conta conectada |
| `POST /integrations/google/calendar/select` | JWT, OWNER/ADMIN | Valida e seleciona o calendário operacional |
| `POST /integrations/google/tasks/setup` | JWT, OWNER/ADMIN | Encontra/cria a lista "BRAÇO — Follow-ups" |
| `GET /integrations/google/status` | JWT | Estado da conexão compartilhada + dos dois recursos |
| `POST /integrations/google/calendar/disconnect` | JWT, OWNER/ADMIN | Desconecta Calendar |
| `POST /integrations/google/tasks/disconnect` | JWT, OWNER/ADMIN | Desconecta Tasks |

Deliberadamente um controller separado de
`preparation/resources.controller.ts` (o caminho **simulado**
permanece intocado) — mesmo padrão de
`integrations/zernio/zernio-connection.controller.ts`.

## 13. Testes

- **Unit** (`*.spec.ts`, sem banco): `credentials-cipher.spec.ts`
  (round-trip, IV aleatório, falha com chave errada, falha com
  ciphertext adulterado, nunca "production grade"); `google-
  config.spec.ts` (validação de env, gate só em produção, nunca
  vazamento de client_secret); `google-api-client.spec.ts`
  (authorization URL sem client_secret, escopos mínimos, client_secret
  só no corpo form-encoded do POST do token endpoint, refresh nunca
  confundido com code, revoke, mapa de erro por status, retry só em
  GET, timeout).
- **E2E** (`test/google.e2e-spec.ts`, Postgres real, RLS de verdade,
  Google substituído por um fake em `GOOGLE_FETCH` que valida o
  contrato HTTP completo a cada chamada — **21/21 passando**): start
  OAuth; callback válido/state inexistente/expirado/replay/cancelado/
  falha na troca de token; seleção de Calendar (accessRole
  owner/writer aceito, reader rejeitado sem persistir, calendarId
  inexistente); setup de Tasks (cria quando ausente, reutiliza sem
  duplicar); readiness (`/digital-employees/:id/resources` reflete
  `CONNECTED`/`REAL` sem nenhuma mudança em `ResourcesService`);
  disconnect (Calendar sem quebrar Tasks e vice-versa, revoke só no
  último recurso, revoke best-effort mesmo com falha remota); refresh
  (renovação automática preservando refresh token antigo, falha
  definitiva degradando conexão + recursos); isolamento entre tenants
  (3 cenários contra Postgres real).

Resultado na branch (no momento em que esta issue foi entregue): **40
novos testes unitários** (142/142 no total de `apps/api`, 17 suítes) e
**21 novos testes e2e** (74/74 no total, 5 suítes). `tsc --noEmit` e
`nest build` limpos. Boot testado em três cenários (dev sem config,
produção parcialmente configurada — falha clara, produção totalmente
configurada — sobe normal).

Atualização (issue de UI real de Recursos): +4 testes e2e no módulo
Zernio (desconexão real). Total consolidado do `apps/api` nesta
revisão: **142/142 testes unitários** (17 suítes) e **78/78 testes
e2e** (5 suítes).

## 14. Variáveis de ambiente

| Variável | Obrigatória | Observação |
|---|---|---|
| `GOOGLE_CLIENT_ID` | Habilita a integração | Ausente = integração desabilitada (não é erro) |
| `GOOGLE_CLIENT_SECRET` | Sim, se `GOOGLE_CLIENT_ID` presente | Nunca enviado ao frontend, nunca logado |
| `GOOGLE_REDIRECT_URI` | Sim, se `GOOGLE_CLIENT_ID` presente | Deve ser cadastrado exatamente igual no Google Cloud Console; aponta para `apps/api` |
| `GOOGLE_CREDENTIALS_ENCRYPTION_KEY` | Sim, se `CREDENTIALS_CIPHER_PROVIDER=env` (default); opcional com `gcp-kms` (só leitura de legado, TD25) | Base64 de 32 bytes (`openssl rand -base64 32`) — ver §9 |
| `GOOGLE_REQUEST_TIMEOUT_MS` | Não | Padrão `10000` |
| `CREDENTIALS_CIPHER_PROVIDER` | Não (default `env`) | `gcp-kms` obrigatório em produção com Google habilitado (fail-closed) — ver §9 |
| `GCP_KMS_KEY_NAME` | Sim, se `CREDENTIALS_CIPHER_PROVIDER=gcp-kms` | Resource name completo da chave no Cloud KMS |
| `GCP_KMS_CLIENT_EMAIL` | Sim, se `CREDENTIALS_CIPHER_PROVIDER=gcp-kms` | Service account com só `roles/cloudkms.cryptoKeyEncrypterDecrypter` na chave |
| `GCP_KMS_PRIVATE_KEY` | Sim, se `CREDENTIALS_CIPHER_PROVIDER=gcp-kms` | PEM da service account; `\n` literal aceito |
| `GCP_KMS_REQUEST_TIMEOUT_MS` | Não | Padrão `10000` |

## 15. Configuração manual necessária (Google Cloud Console)

1. No mesmo projeto Google Cloud que já tem a Calendar API ativada,
   ativar também a **Google Tasks API**.
2. Configurar a **OAuth Consent Screen** (modo "Testing" é suficiente
   para esta fase — cadastrar os e-mails de teste da equipe BRAÇO como
   testadores; verificação formal do Google só é necessária antes de
   abrir para usuários externos reais).
3. Criar um **OAuth Client** do tipo **Web application**.
4. Registrar exatamente o valor de `GOOGLE_REDIRECT_URI` como
   **Authorized redirect URI**.
5. Copiar `client_id`/`client_secret` para as variáveis de ambiente do
   `apps/api` (nunca versionar).
6. **Ambiente dev/test/homologação controlada** (provider `env`, default):
   gerar `GOOGLE_CREDENTIALS_ENCRYPTION_KEY` (`openssl rand -base64
   32`) e configurá-la. **Produção deve pular este passo e ir direto
   para o 7** — sob `CREDENTIALS_CIPHER_PROVIDER=gcp-kms`, esta chave é
   opcional (TD25): só é necessária se o ambiente estiver migrando de
   `env` para `gcp-kms` e precisar ler ciphertext legado.
7. **Para produção (KMS production-grade — issue de KMS):** no mesmo
   projeto GCP, ativar a **Cloud KMS API**; criar um key ring + uma
   crypto key (`gcloud kms keyrings create`/`gcloud kms keys create`,
   ou pelo Console); criar uma service account dedicada só para
   cifrar/decifrar nessa chave (nome sugerido: `braco-kms`); conceder a
   ela **apenas** o papel `roles/cloudkms.cryptoKeyEncrypterDecrypter`
   na chave (nunca no projeto inteiro); gerar uma chave JSON dessa
   service account e configurar `GCP_KMS_KEY_NAME`/
   `GCP_KMS_CLIENT_EMAIL`/`GCP_KMS_PRIVATE_KEY` no `apps/api` com
   `CREDENTIALS_CIPHER_PROVIDER=gcp-kms`.

## 16. Limitações conhecidas (fora de escopo desta issue)

- **Cifra em produção (atualizado).** `GoogleCloudKmsCipher`
  (`isProductionGrade: true`) já existe — ver §9. O que continua
  pendente: a issue de homologação ainda não validou o fluxo contra um
  projeto GCP/chave KMS reais (sem credenciais disponíveis neste
  ambiente até aqui); e nenhuma empresa real foi de fato migrada do
  formato legado via `scripts/reencrypt-google-credentials.ts`.
- **Frontend (atualizado).** A UI real de `docs/design/24-work-
  resources-ui-spec.md` (conectar, selecionar calendário, configurar
  Tasks, mostrar estados) foi implementada em `apps/web` na issue de UI
  real de Recursos — `GoogleResourceCard` em `RecursosStep.tsx` fala
  direto com `googleApi.*`. `resultUrl()` (callback) redireciona para
  `${CORS_ORIGIN}/integrations/callback?google=success|error&reason=`,
  lido por `IntegrationsCallbackPage.tsx` (mesmo handler central do
  Zernio) — nunca pede novo consentimento OAuth se a `GoogleConnection`
  compartilhada já estiver `CONNECTED`.
- **Sem uso operacional.** Nenhuma criação/edição real de evento ou
  tarefa acontece — só a conexão e a seleção do recurso. `06-google-
  calendar.md`/`07-google-tasks.md` continuam descrevendo essa camada
  operacional futura.
- **`GET /integrations/google/status` não faz uma checagem ativa
  contra o Google a cada chamada** — lê o estado persistido. A saúde
  da conexão é verificada de forma reativa (na hora de qualquer chamada
  autenticada real: listar calendários, selecionar calendário,
  configurar Tasks) — não há job periódico de verificação (explicitamente
  fora de escopo, "não implementar polling periódico").
