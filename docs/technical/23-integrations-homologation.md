# BRAÇO — Homologação das integrações reais (Zernio WhatsApp + Google Calendar/Tasks)

**Issue:** homologação das integrações reais (aberta a partir do fechamento da #31, ver `docs/technical/17-technical-decisions.md` TD22/TD23).
**Depende de:** `docs/technical/21-zernio-whatsapp-integration.md` (issue #30, em `main`) e `docs/technical/22-google-workspace-integration.md` (issue #31, PR #37, em `main`).

## 1. Objetivo e status deste documento

WhatsApp/Zernio e Google Calendar/Tasks têm implementação real completa,
coberta por 142 testes unitários + 78 testes e2e contra PostgreSQL real
(RLS incluída) — mas com o HTTP do provedor **mockado** em todos eles
(`ZERNIO_FETCH`/`GOOGLE_FETCH` injetáveis, nunca uma conta real). Este
documento registra o roteiro de homologação contra os provedores de
verdade e, quando credenciais reais estiverem disponíveis no ambiente de
execução, a evidência de cada cenário.

**Estado atual (nesta revisão): nenhum cenário abaixo foi executado
contra um provedor real.** Este ambiente de desenvolvimento não tem
`ZERNIO_API_KEY` nem `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` reais
configurados — só a suíte automatizada com HTTP mockado foi validada (ver
`docs/technical/21-zernio-whatsapp-integration.md` §7 e
`22-google-workspace-integration.md` §13). O roteiro abaixo é o que falta
rodar manualmente assim que essas credenciais existirem (ver §5, "Pré-requisitos externos").

## 2. Formato de evidência

Cada cenário executado deve ser registrado na tabela de §4/§5 com, no
mínimo: data, ambiente (ex. "homologação Railway"), SHA do commit
testado, resultado esperado, resultado observado, PASS/FAIL. **Nunca**
incluir token, client secret, número de telefone real ou e-mail de conta
de teste no texto — usar só identificadores técnicos não sensíveis (ex.
"conta de teste Google #1", "número Zernio de homologação").

## 3. Escopo

Cobre validação ponta a ponta contra os provedores reais. **Não** cobre
(fora de escopo, igual às issues #30/#31 que implementaram o código):
Runtime, criação/reagendamento/cancelamento operacional de evento,
execução de follow-up, polling periódico, watch channels do Calendar.

## 4. Roteiro — Zernio (WhatsApp)

Pré-requisito: reconciliar os tipos/contratos em
`apps/api/src/integrations/zernio/zernio-api-types.ts` com a
documentação oficial do Zernio vigente no momento da execução (a
implementação atual foi feita a partir do contrato fornecido pelo PO
diretamente — `docs/technical/17-technical-decisions.md` TD22 —, não de
`docs.zernio.com`, inacessível a partir deste ambiente).

| # | Cenário | Resultado esperado | Data | SHA | Ambiente | Observado | PASS/FAIL |
|---|---|---|---|---|---|---|---|
| Z1 | Hosted Embedded Signup ponta a ponta (`POST /connect`, redirect real ao Zernio) | Usuário completa o signup no Zernio e retorna ao BRAÇO | | | | | |
| Z2 | Conectar um número de teste real | `GoogleConnection`/`ZernioConnection` reflete o número | | | | | |
| Z3 | Confirmação real do provedor (`GET /whatsapp/number-info`) | `Integration(WHATSAPP)` = `REAL` + `CONNECTED` só após a consulta confirmar `phone.status = CONNECTED` | | | | | |
| Z4 | Registro do webhook via script existente (`docs/technical/21-zernio-whatsapp-integration.md` §8) | Webhook registrado uma única vez, idempotente numa segunda execução | | | | | |
| Z5 | Validação de assinatura HMAC de um evento real | Evento com assinatura válida é aceito; assinatura inválida retorna 403 | | | | | |
| Z6 | Receber mensagem de teste real | `ZernioMessage` persistida, sem endpoint de debug público novo criado para isto | | | | | |
| Z7 | Enviar mensagem de teste real | Mensagem chega no WhatsApp de teste | | | | | |
| Z8 | Dedup de evento repetido (reenvio real do provedor) | Mesmo `eventId` não duplica efeito | | | | | |
| Z9 | Disconnect real (`POST /integrations/zernio/whatsapp/disconnect`) | Zernio confirma `DELETE /accounts/{accountId}`; `Integration(WHATSAPP)` = `DISCONNECTED` | | | | | |
| Z10 | Reconectar após disconnect | Novo `authUrl` funcional, sem erro de estado anterior | | | | | |

Se for necessário um harness para facilitar a execução manual destes
cenários (ex.: um pequeno CLI para dispar `sendMessage`/consultar
status), criar como script operacional **explicitamente excluído do
build de produção** — nunca um endpoint HTTP novo exposto pela API.

## 5. Roteiro — Google (Calendar + Tasks)

### 5.1 Pré-requisitos externos (config manual do PO)

Ver `docs/technical/22-google-workspace-integration.md` §15 para o passo
a passo completo. Resumo do checklist:

- [ ] Google Calendar API ativa no projeto GCP.
- [ ] Google Tasks API ativa no **mesmo** projeto.
- [ ] OAuth Consent Screen configurado (modo Testing, com e-mails de teste cadastrados).
- [ ] OAuth Client tipo "Web application" criado.
- [ ] `GOOGLE_REDIRECT_URI` exata registrada como Authorized redirect URI.
- [ ] `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`/`GOOGLE_CREDENTIALS_ENCRYPTION_KEY` nas variáveis de ambiente do serviço `apps/api` (nunca versionados).
- [ ] Pelo menos uma conta Google de teste com um calendário próprio (accessRole owner/writer).

### 5.2 Smoke test

| # | Cenário | Resultado esperado | Data | SHA | Ambiente | Observado | PASS/FAIL |
|---|---|---|---|---|---|---|---|
| G1 | OAuth real (`POST /integrations/google/connect` → redirect → consentimento → callback) | `GoogleConnection.status = CONNECTED`, tokens cifrados persistidos | | | | | |
| G2 | Listar calendários (`GET /integrations/google/calendars`) | Lista real da conta de teste, com `accessRole` correto por item | | | | | |
| G3 | Selecionar um calendário com `accessRole` owner/writer | `POST /calendar/select` aceita | | | | | |
| G4 | Confirmar Calendar `REAL` + `CONNECTED` | `Integration(GOOGLE_CALENDAR)` reflete o `calendarId` selecionado | | | | | |
| G5 | Setup de Tasks (`POST /integrations/google/tasks/setup`) | Cria (1ª vez) ou reusa (se já existir) a lista `BRAÇO — Follow-ups` | | | | | |
| G6 | Confirmar criação/reuso de `BRAÇO — Follow-ups` | Lista visível na conta Google de teste com esse nome exato | | | | | |
| G7 | Confirmar Tasks `REAL` + `CONNECTED` | `Integration(GOOGLE_TASKS)` reflete o `taskListId` | | | | | |
| G8 | Disconnect Calendar preservando Tasks (`POST /calendar/disconnect`) | Calendar vira `DISCONNECTED`; Tasks continua `CONNECTED`; `GoogleConnection` permanece ativa (nenhuma revogação, já que Tasks ainda está conectado) | | | | | |
| G9 | Reconectar Calendar | Sem novo consentimento OAuth (conexão compartilhada já ativa) — só nova seleção de calendário | | | | | |
| G10 | Disconnect Tasks preservando Calendar (`POST /tasks/disconnect`) | Tasks vira `DISCONNECTED`; Calendar continua `CONNECTED` | | | | | |
| G11 | Disconnect de ambos (Calendar e Tasks) | Nenhum recurso Google ativo → `GoogleConnection` revogada best-effort (`revokeToken`) e credenciais locais limpas | | | | | |
| G12 | Revogar externamente no Google (painel "Apps de terceiros com acesso à conta") | Ação feita fora do BRAÇO, sem chamada nossa | | | | | |
| G13 | Confirmar `NEEDS_ATTENTION` no próximo refresh após G12 | Próxima chamada que precisar de `ensureValidAccessToken` detecta o refresh falho e marca `GoogleConnection = DEGRADED` + recursos ativos `NEEDS_ATTENTION` (nunca `CONNECTED` silenciosamente) | | | | | |

## 6. Critérios de aceite desta issue

- Todos os cenários Z1–Z10 e G1–G13 executados e registrados como PASS,
  ou FAIL com issue de acompanhamento aberta e linkada aqui.
- Nenhum segredo (token, client secret, número de telefone real, e-mail
  de conta de teste) versionado neste documento.
- Se algum passo revelar uma divergência entre o contrato assumido no
  código (`zernio-api-types.ts`/`google-api-types.ts`) e o comportamento
  real do provedor, registrar a correção necessária como item de dívida
  técnica (ou abrir PR de correção, se pequena) — nunca silenciar a
  divergência só para marcar o cenário como PASS.

## 7. Relação com US14

Enquanto a tabela acima não estiver PASS de ponta a ponta, US14
permanece **Parcial** mesmo com UI real implementada (issue dedicada) e
KMS production-grade implementado (issue dedicada) — ver
`docs/delivery/sprints/sprint-02-review.md` para a avaliação consolidada.
