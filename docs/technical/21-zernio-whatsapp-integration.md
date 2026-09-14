# BRAÇO — Integração real de WhatsApp via Zernio

Issue #30. Implementação real (não simulada) da conexão de WhatsApp por
empresa/tenant, usando o Zernio como intermediário para a Meta Cloud
API. Este documento descreve o que existe em código hoje — não o
`Integration Hub`/`Runtime Service`/`MessagingAdapter` aspiracionais de
`01-architecture.md` e `05-whatsapp.md`, que continuam sendo a visão de
arquitetura futura, não o estado implementado.

> **Fonte da API:** contrato fornecido diretamente pelo Product Owner
> (`docs.zernio.com` está fora do allowlist de rede deste ambiente de
> desenvolvimento). O OpenAPI (`/api/openapi`) não pôde ser consultado —
> os tipos em `zernio-api-types.ts` são transcritos dos exemplos dados,
> não validados contra o OpenAPI real. **Revisar contra o OpenAPI antes
> de habilitar em produção.**

## 1. Onde vive o código

```
apps/api/src/integrations/zernio/
  zernio.module.ts                    módulo Nest — DI, providers condicionais
  zernio.tokens.ts                    tokens de injeção (ZERNIO_CONFIG, ZERNIO_FETCH)
  zernio-config.ts                    leitura/validação de env vars
  zernio-client.ts                    cliente HTTP centralizado (Bearer, timeout, retry)
  zernio-signature.ts                 verificação HMAC-SHA256 do webhook
  zernio-api-types.ts                 tipos transcritos do contrato dado
  zernio-metrics.ts                   contadores in-process (placeholder documentado)
  zernio-connection.service.ts        profile, onboarding, callback, status, disconnect
  zernio-connection.controller.ts     POST /connect, POST /refresh, GET /callback
  zernio-messages.service.ts          envio idempotente de mensagem
  zernio-webhook.service.ts           verificação + dedup + roteamento de eventos
  zernio-webhook.controller.ts        POST /webhooks/zernio (rota pública)
  zernio-webhook.middleware.ts        corpo bruto só na rota do webhook

apps/api/scripts/register-zernio-webhook.ts  registro idempotente do webhook (npm run zernio:register-webhook)
```

`ResourcesService`/`PreparationReadinessService` (Track A, TD19,
`docs/technical/17-technical-decisions.md`) **não foram alterados**.
`ZernioConnectionService` só escreve na mesma linha `Integration`
(`type: WHATSAPP`) que essas duas classes já leem, sempre com
`connectionMode: REAL` — nunca `SIMULATED`, que continua sendo o
caminho de `ResourcesService.confirmConnection`.

## 2. Modelo de dados

Cinco tabelas novas (`apps/api/prisma/schema.prisma`, migração
`20260913223000_zernio_whatsapp_integration`):

- **`ZernioConnection`** (1 por empresa, `@@unique([companyId])`; também
  única por `profileId` e por `accountId`) — `profileId`, `accountId`,
  `phoneNumber`, `status` (`NOT_CONNECTED`/`CONNECTING`/`CONNECTED`/
  `DEGRADED`/`DISCONNECTED`/`FAILED`), `providerStatus`,
  `qualityRating`, `nameStatus`, `wabaVerificationStatus`,
  `lastHealthCheckAt`, `lastWebhookAt`, `connectedAt`,
  `disconnectedAt`, `failureReason`.
- **`ZernioOnboardingAttempt`** — a correlação interna de uso único do
  fluxo de onboarding (`id` = `correlationId`), com `profileId`
  esperado, `expiresAt` (10 min) e `consumedAt` (marcado no instante em
  que o callback chega, antes de qualquer outro efeito — impede replay).
- **`ZernioWebhookEvent`** — dedup persistente por `eventId`
  (`@@unique`); `companyId` **nullable** (evento órfão — `accountId`
  desconhecido — é persistido para auditoria, nunca descartado
  silenciosamente); `payload` (JSON bruto), `processedAt`,
  `processingError`.
- **`ZernioMessage`** — histórico mínimo de mensagens (`@@unique` em
  `platformMessageId`), `direction` (`INBOUND`/`OUTBOUND`), `status`
  (`RECEIVED`/`SENT`/`DELIVERED`/`READ`/`FAILED`), `senderIdentity`,
  `standby`, `idempotencyKey`.
- **`ZernioWebhookRegistration`** — singleton (`id: "default"`,
  catálogo sem RLS como `EmployeeType`) para tornar
  `ensureWebhookRegistered()` idempotente entre deploys.

Reaproveitado sem alteração: `IdempotencyKey` (mesmo modelo genérico já
usado em `digital-employees.service.ts`, US03) para o envio de
mensagem.

### RLS — dois padrões novos

Multi-tenancy é por RLS de Postgres (`04-multi-tenancy.md`). Duas
situações não cabiam no padrão trivial `company_id = app.current_company_id`:

1. **Resolver o tenant a partir de um identificador externo, antes de
   sabê-lo.** O webhook chega só com `accountId`; o callback do OAuth
   só com `correlationId`. Extensão do precedente já existente de
   `company_memberships_self_lookup` (`ALTER POLICY ... OR user_id =
   current_setting('app.current_user_id', true)`): a policy de
   `zernio_connections` ganha `OR account_id =
   current_setting('app.current_zernio_lookup_account_id', true)`, e a
   de `zernio_onboarding_attempts` ganha `OR id =
   current_setting('app.current_zernio_lookup_attempt_id', true)`.
   `PrismaService.withZernioAccountLookup(accountId, fn)` e
   `withZernioAttemptLookup(attemptId, fn)` fazem o `set_config`
   correspondente dentro de uma transação, espelhando exatamente
   `withUser()`.
2. **Linha órfã com `company_id IS NULL`.** A policy de
   `zernio_webhook_events` precisa de um `OR company_id IS NULL`
   explícito — sem ele, o `WITH CHECK` implícito do Postgres (igual ao
   `USING` quando nenhuma cláusula própria é dada) rejeitaria o INSERT
   de uma linha com `company_id = NULL` quando nenhuma variável de
   sessão de tenant está setada (`NULL = NULL` é `NULL`/falso, não
   verdadeiro).

## 3. Fluxos

### 3.1 Profile (idempotente do ponto de vista do BRAÇO)

`ensureProfile()` olha primeiro `ZernioConnection.profileId` da própria
empresa; só chama `POST /profiles` se a empresa ainda não tem um. Uma
vez atribuído, o `profileId` é definitivo para aquela empresa — não é
re-negociado nem substituído por uma chamada futura.

### 3.2 Onboarding (`POST /integrations/zernio/whatsapp/connect`, OWNER/ADMIN)

1. `ensureProfile()`.
2. Cria `ZernioOnboardingAttempt` (10 min de validade) dentro do
   tenant.
3. `GET /connect/whatsapp?profileId=&redirect_url=&onboarding=api&signup=hosted`
   — `redirect_url` carrega `?correlationId=<attemptId>`.
4. Marca a conexão como `CONNECTING`.
5. Devolve **só** `{ authUrl }` ao frontend — nunca o `state` bruto do
   Zernio nem qualquer detalhe interno.

### 3.3 Callback (`GET /integrations/zernio/whatsapp/callback`, público)

Nunca confia nos parâmetros da query isoladamente — a validação real é
a correlação interna:

1. Sem `correlationId`, tentativa inexistente, já consumida
   (`consumedAt`) ou expirada (`expiresAt`) → mesmo resultado
   genérico (`reason=session_expired`) para os três casos, para não
   revelar qual deles ocorreu.
2. **Consome a tentativa imediatamente**, antes de qualquer outro
   efeito — uma segunda chamada com o mesmo `correlationId` cai no
   passo 1 na próxima vez.
3. Código de erro do Zernio na query → persiste `failureReason` e
   redireciona com o motivo.
4. `profileId` da query ≠ `profileId` da tentativa registrada, ou
   `connected≠whatsapp`, ou `accountId` ausente → `zernio=error`
   (nunca confia no `profileId` isolado da query).
5. Sucesso: persiste `accountId`/`phoneNumber` **provisoriamente** e
   **só então** chama `refreshStatus()` — o callback sozinho nunca
   marca `CONNECTED`; só uma consulta real ao Zernio faz isso.

### 3.4 Status real (`refreshStatus`, `GET /whatsapp/number-info`)

Chamado ao final do callback, sob demanda
(`POST /integrations/zernio/whatsapp/refresh`) ou por eventos de
webhook de conta/número. Nunca infere estado a partir da ausência de
webhook — sempre pergunta ao provedor:

- `phone.status === 'CONNECTED'` e `quality_rating !== 'RED'` →
  `CONNECTED`.
- `phone.status === 'CONNECTED'` com `quality_rating === 'RED'`, ou
  qualquer outro `phone.status` → `DEGRADED` (o vocabulário completo de
  `phone.status` não está documentado além de `CONNECTED` no exemplo
  dado — tratado com cautela, nunca como confirmação silenciosa).
- Erro `not_found` do provedor → `DISCONNECTED` (desconexão
  confirmada). Qualquer outro erro (timeout, 5xx, rate limit,
  credencial) → `DEGRADED` (falha transitória, nunca vira
  `DISCONNECTED` sem confirmação).

### 3.5 Webhook (`POST /webhooks/zernio`, público)

1. Corpo bruto capturado por `express.raw()` **antes** do parser JSON
   global — ver `zernio-webhook.middleware.ts` e a nota crítica na
   seção 5.
2. HMAC-SHA256 sobre o corpo bruto
   (`lowercase_hex(HMAC-SHA256(rawBody, ZERNIO_WEBHOOK_SECRET))`),
   comparação em tempo constante (`crypto.timingSafeEqual`). Ausente ou
   inválida → 403, sem nunca logar o segredo nem a assinatura recebida.
3. `payload.id`/`payload.event` obrigatórios; `X-Zernio-Event-Id`
   precisa bater com `payload.id`.
4. `companyId` resolvido por `accountId` (`findCompanyIdByAccountId`) —
   **nunca** por telefone do remetente.
5. Dedup **persistente**: `INSERT` em `ZernioWebhookEvent` com
   `eventId` único; violação de unicidade (`P2002`) = entrega repetida
   (at-least-once) → 200 sem repetir nenhum efeito de domínio.
6. Processamento acontece **dentro da mesma requisição** (ver
   limitação na seção 6) e nunca relança depois de persistir o evento —
   uma falha de processamento fica em `processingError` para
   investigação manual, não faz o Zernio reentregar infinitamente algo
   que vai falhar do mesmo jeito de novo.

`message.received`: `senderIdentity` prefere
`sender.businessScopedUserId`; cai para `sender.phoneNumber` só na
ausência do BSUID; nunca usa `whatsappUsername` como chave estável.
`metadata.standby === true` é persistido no campo `standby` —
`shouldAutoRespond()` documenta a regra para quem construir um
consumidor de resposta automática no futuro (fora de escopo aqui, ver
seção 6).

### 3.6 Envio (`ZernioMessagesService.sendMessage`)

Reaproveita o `IdempotencyKey` genérico (mesmo contrato do Zernio:
mesma chave + corpo igual devolve a mesma resposta; corpo diferente
rejeita). `accountId` é **sempre** o da própria conexão da empresa —
nunca aceito do chamador. Recusa (`ForbiddenException`) sem conexão
real ou fora do estado `CONNECTED`. Em falha ambígua (timeout/5xx), não
persiste mensagem nem `IdempotencyKey` — permite retry legítimo depois
que o chamador reconciliar, em vez de arriscar nunca mais poder
reenviar com a mesma chave.

### 3.7 Desconexão real (`disconnectAccount`, `POST /integrations/zernio/whatsapp/disconnect`, OWNER/ADMIN)

Issue de UI real de Recursos — antes só existia `ResourcesService.
disconnect` genérico (apaga a linha `Integration` local, sem avisar o
Zernio). Este caminho é *provider-aware*:

1. Com `accountId` local: `DELETE /accounts/{accountId}` no Zernio.
   404 do provedor (a conta já não existe do lado dele) é tratado como
   "já desconectado", nunca como erro — qualquer outro erro propaga.
2. `ZernioConnection` vira `DISCONNECTED` (`accountId`/`phoneNumber`
   limpos) via `upsert` — funciona mesmo se a empresa nunca chegou a
   criar uma linha (`profileId` inexistente), sem lançar `P2025`.
3. `Integration(WHATSAPP)` sincronizada para `DISCONNECTED` do mesmo
   jeito que os outros fluxos (`syncGenericIntegration`).

Idempotente: chamar duas vezes seguidas nunca falha nem repete a
chamada ao Zernio na segunda vez (sem `accountId` local, não há nada
para deletar remotamente).

## 4. Variáveis de ambiente

| Variável | Obrigatória | Observação |
|---|---|---|
| `ZERNIO_API_KEY` | Habilita a integração | Ausente = integração desabilitada (não é erro) |
| `ZERNIO_BASE_URL` | Não | Padrão `https://zernio.com/api/v1` |
| `ZERNIO_WEBHOOK_SECRET` | Sim, se `ZERNIO_API_KEY` presente | Nunca logado |
| `ZERNIO_REDIRECT_URL` | Sim, se `ZERNIO_API_KEY` presente | Deve apontar para `apps/api` (o callback é tratado no backend, não no frontend) |
| `ZERNIO_REQUEST_TIMEOUT_MS` | Não | Padrão `10000` |

`assertZernioEnvValid()` (chamado em `bootstrap()`, `main.ts`) falha o
boot **em produção** (`isProductionEnvironment()`) se `ZERNIO_API_KEY`
estiver presente mas alguma das outras três variáveis obrigatórias
faltar — nunca em silêncio, nunca só descoberto no primeiro request
real. Em qualquer outro ambiente, configuração parcial apenas desabilita
a integração (o módulo nunca falha o DI/boot por causa disto).

## 5. Decisão crítica descoberta em teste: `bodyParser: false`

`NestFactory.create(AppModule)` (e `TestingModule.createNestApplication()`)
registram o parser JSON padrão do Nest **internamente, antes de
retornar** — ou seja, antes de qualquer `app.use()` chamado depois,
inclusive o `express.raw()` do webhook. Isso consumia o corpo da
requisição antes da captura bruta rodar, quebrando a verificação HMAC
silenciosamente (só descoberto rodando a aplicação de verdade em
`test/zernio.e2e-spec.ts`, não no typecheck/build/unit). Corrigido
passando `{ bodyParser: false }` para `NestFactory.create` (`main.ts`) e
para `createNestApplication` (spec), com `applyZernioWebhookRawBody()`
sendo a única fonte de parsing de corpo, na ordem correta (raw só em
`/webhooks/zernio`, JSON em tudo mais). **Este era um bug real de
produção, não um artefato do ambiente de teste.**

## 6. Limitações conhecidas (fora de escopo desta issue)

- **Sem fila/Runtime.** O processamento do webhook é síncrono, dentro
  da mesma requisição HTTP — não há Redis/BullMQ neste código
  (`01-architecture.md`/`11-observability.md` descrevem uma arquitetura
  futura que ainda não existe). Aceitável para o volume do MVP; se se
  tornar gargalo, mover para uma fila é uma troca local (o contrato de
  dedup por `eventId` já é o que uma fila exigiria).
- **Sem resposta automática.** `shouldAutoRespond()`/`standby` só
  documentam a regra — nenhum consumidor de `ZernioMessage` dispara
  resposta automática hoje. Isso é o próximo passo natural (Runtime/IA
  de atendimento), fora do escopo desta issue.
- **UI real de Recursos (atualizado).** `resultUrl()` redireciona para
  `${CORS_ORIGIN}/integrations/callback?zernio=success|error&reason=` —
  `apps/web/src/pages/IntegrationsCallbackPage.tsx` (issue de UI real de
  Recursos) lê essa querystring, reconstrói o *return path* guardado em
  `sessionStorage` antes do redirect e volta para
  `RecursosStep`/`WhatsAppResourceCard`, que já falam com
  `zernioApi.connect()`/`zernioApi.disconnect()` de verdade — não é mais
  um caminho fora de escopo do `apps/web`.
- **Desconexão real, provider-aware.** `POST /integrations/zernio/
  whatsapp/disconnect` (`ZernioConnectionService.disconnectAccount`)
  chama `DELETE /accounts/{accountId}` no Zernio antes de marcar
  `Integration(WHATSAPP) = DISCONNECTED` — nunca só o `ResourcesService.
  disconnect` genérico, que apagaria a linha local sem avisar o
  provedor. Idempotente: sem `accountId` local, ou 404 do provedor, é
  tratado como "já desconectado".
- **Registro do webhook é manual.** `ensureWebhookRegistered()` existe
  e é idempotente, mas não é chamado automaticamente no bootstrap —
  precisa ser disparado manualmente (`npm run zernio:register-webhook`,
  `apps/api/scripts/register-zernio-webhook.ts`) após configurar
  produção, para nunca recriar a assinatura a cada deploy sem
  necessidade.
- **Métricas são um placeholder in-process.** `ZernioMetrics` usa
  contadores em `Map`, não Prometheus/OpenTelemetry (nenhuma dependência
  nova de infra foi adicionada só para esta feature). Os nomes já
  seguem a convenção pedida (`zernio_http_requests_total`, etc.), então
  trocar por um `Counter`/`Histogram` real é uma troca local. Uma
  lacuna específica: `zernio_http_request_duration` não existe como
  métrica nomeada separada — as durações de `zernio_http_requests_total`
  são coletadas num array interno sem breakdown por bucket/label; revisar
  ao migrar para um backend de métricas real.
- **Tipos do contrato não validados contra o OpenAPI.** Ver aviso no
  topo deste documento.

## 7. Testes

- **Unit** (`*.spec.ts`, sem banco): assinatura HMAC (válida, corpo
  adulterado, segredo errado, assinatura ausente/malformada,
  sensibilidade a espaçamento do corpo bruto); validação de env
  (parcial em produção falha, parcial fora de produção desabilita);
  cliente HTTP (Bearer nunca em query/body, `Idempotency-Key`, mapa de
  erro por status, retry só em GET, `Retry-After` respeitado, timeout);
  mapeamento `toIntegrationStatus`; mapeamento de `message.received`
  (BSUID preferido, fallback de telefone, `standby`); webhook (via um
  duplo fiel de `PrismaService` que reproduz `P2002` de verdade — não
  um mock genérico): dedup, evento órfão, `account.disconnected`,
  `X-Zernio-Event-Id` inconsistente; envio idempotente (reuso de
  chave, corpo diferente rejeitado, `accountId` nunca do chamador, sem
  conexão real recusa, falha ambígua não persiste nada).
- **E2E** (`test/zernio.e2e-spec.ts`, Postgres real via
  `Test.createTestingModule`, RLS de verdade — Zernio substituído por
  um fake em `ZERNIO_FETCH` que valida o contrato HTTP completo a cada
  chamada): criação/reuso de profile; callback válido/degradado/
  expirado/replay/adulterado/erro reportado; webhook válido/assinatura
  inválida/evento repetido/`account.disconnected`; envio idempotente
  com Bearer + `Idempotency-Key`; isolamento entre tenants.

  Cada cenário de callback/webhook que precisa controlar seu próprio
  `profileId`/`accountId` usa uma empresa própria, provisionada sob
  demanda (`provisionCompany()`) — `ensureProfile()` é (corretamente)
  "pegajosa" por empresa, então reusar uma empresa entre cenários com
  `profileId` esperado diferente faria o callback detectar uma
  "adulteração" que não existe de verdade.

  **Achado de teste (não de implementação):** `supertest`/`superagent`
  serializa (`JSON.stringify`) qualquer corpo que não seja `string`
  sempre que o `Content-Type` é JSON — inclusive um `Buffer`, virando
  `{"type":"Buffer","data":[...]}` no corpo real da requisição. Os
  testes de webhook enviam a versão `string` (utf8) do buffer
  assinado, não o `Buffer` em si, para evitar essa serialização e
  preservar os bytes exatos sobre os quais a assinatura foi calculada.

Resultado na branch (no momento em que esta issue foi entregue):
**102/102** testes unitários (14 suítes, 60 novos + 42 pré-existentes) e
**53/53** testes e2e (4 suítes, 14 novos + 39 pré-existentes) passando.
`tsc --noEmit` e `nest build` limpos. `npm run lint` continua
indisponível nesta workspace (ESLint não instalado — débito
pré-existente, já documentado em PRs anteriores; não introduzido nem
resolvido por esta issue).

Atualização (issue de UI real de Recursos): +4 testes e2e cobrindo
`disconnectAccount` (desconexão real, 404 tratado como idempotente,
idempotência numa segunda chamada, isolamento entre tenants) — ver
`docs/technical/22-google-workspace-integration.md` §13 para o total
consolidado mais recente do módulo `apps/api`.

## 8. Passos manuais para produção

1. Criar a conta/chave no Zernio e obter `ZERNIO_API_KEY`.
2. Definir `ZERNIO_WEBHOOK_SECRET` (gerado pelo BRAÇO, configurado
   também no Zernio ao registrar o webhook — não é o Zernio quem
   escolhe este valor).
3. Definir `ZERNIO_REDIRECT_URL` apontando para
   `https://<domínio-do-apps-api>/integrations/zernio/whatsapp/callback`
   — **nunca** para o domínio do `apps/web` (o callback é tratado pelo
   backend).
4. Definir `ZERNIO_BASE_URL`/`ZERNIO_REQUEST_TIMEOUT_MS` só se
   precisar sobrescrever os padrões.
5. Rodar a migração `20260913223000_zernio_whatsapp_integration` no
   banco de produção.
6. Rodar `npm run zernio:register-webhook` (dentro de `apps/api`, com as
   variáveis do passo 1-4 já definidas no ambiente — em produção via
   `railway run npm run zernio:register-webhook`, nunca passando
   segredo por linha de comando). O script
   (`apps/api/scripts/register-zernio-webhook.ts`) deriva a URL pública
   do webhook a partir de `ZERNIO_REDIRECT_URL` e chama
   `ZernioConnectionService.ensureWebhookRegistered()` com a lista
   completa de eventos (`message.received`, `message.sent`,
   `message.delivered`, `message.read`, `message.failed`,
   `account.connected`, `account.disconnected`, e os
   `whatsapp.number.*` listados na seção 3.5) — é idempotente, seguro
   rodar de novo sem criar assinatura duplicada.
7. Confirmar que `ZERNIO_API_KEY`/`ZERNIO_WEBHOOK_SECRET` nunca chegam
   ao `apps/web` (nenhuma rota do frontend precisa delas — o backend é
   o único que fala com o Zernio).
8. Antes do primeiro cliente real: revisar `zernio-api-types.ts`
   contra o OpenAPI real do Zernio (ver aviso na seção 1).
