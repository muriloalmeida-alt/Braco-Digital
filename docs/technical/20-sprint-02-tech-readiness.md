# BRAÇO — Sprint 02 Technical Readiness (Track A + Track B)

**Status:** Tech Ready — ver classificação por história (§22)
**Gate:** Product Ready ✅ + Design Ready ✅ + Tech Ready (este documento)
**Código autorizado nesta execução:** NÃO — este documento é só análise/arquitetura.

> **Nota de numeração:** o pacote de instruções pedia este documento em
> `docs/technical/19-sprint-02-tech-readiness.md`. Esse número já foi
> ocupado por `19-deploy-railway.md`, criado por uma PR paralela
> (`chore/railway-deploy-config`/PR #15) mesclada à `main` entre a
> conclusão da Brand UI Foundation e o início desta execução. Para não
> sobrescrever nem renumerar um documento já mesclado, este documento usa
> `20-sprint-02-tech-readiness.md`. Nenhum conteúdo foi perdido ou alterado.

## 1. Executive Summary

A Sprint 02 tem dois tracks. **Track A** (US07–US17) evolui a Preparação do
Funcionário de "estrutura vazia" (Sprint 01/US06) para um Manual de
Trabalho completo, com conteúdo real, autosave, e uma máquina de estados
`PREPARANDO ⇄ PRONTO` cuja autoridade vive no backend. **Track B** (E12/
US77–US83) é o primeiro fluxo **público, não autenticado, com escrita de
dados** do produto — uma landing + diagnóstico determinístico que gera até
3 recomendações de Braço e, opcionalmente, um lead.

Nenhum bloqueio técnico impede o **início** do desenvolvimento de nenhum
dos dois tracks. Os itens de maior atenção são:

1. **US14 (Recursos de trabalho)** depende de credenciais externas (BSP de
   WhatsApp, app OAuth do Google) que ainda não existem no ambiente — não
   bloqueia o início da Sprint, mas deve ser provisionado o quanto antes
   (§18, §19, §24.2).
2. **Track B introduz superfície pública com escrita** — exige isolamento
   de dados novo (fora do modelo de tenant), rate limiting e validação de
   input que não existem hoje no backend (§7, §16).
3. **Duas lacunas de especificação** (não conflitos, lacunas) foram
   identificadas e registradas em `16-product-decisions-required.md`
   como PD6 e PD7 — nenhuma bloqueia o início da implementação porque
   Engenharia registra uma interpretação padrão e segue (§25).
4. **Privacidade do lead da landing é Launch Gate, não bloqueio técnico**
   — desenvolvimento segue; captação real de lead publicado não (§24.3).

**Track A Ready for Development: YES**
**Track B Ready for Development: YES**
**Sprint 02 Ready for Development: YES**

## 2. Sprint Tracks

| | Track A — Core Product | Track B — Growth |
|---|---|---|
| Épicos | E02 (US07–US16), E03 (US17 — ponte) | E12 (US77–US83) |
| Prioridade | Principal | P1 — não pode reduzir Track A silenciosamente |
| Autenticação | Autenticado, multi-tenant | Público, sem login |
| Escreve dados | Sim (dados da empresa/funcionário) | Sim (lead) — fora do modelo de tenant |
| Resultado no fim da sprint | `PREPARANDO → PRONTO` (sem ativação) | Lead qualificado (sem conta/tenant) |

Os dois tracks são funcionalmente independentes: nenhuma entidade de
Track B referencia `Company`/`DigitalEmployee` de Track A. O único
acoplamento real é de **leitura**: Track B consulta a mesma tabela
`EmployeeType` (Catalog Availability) que Track A/Sprint 01 já usa — nunca
a duplica (§12).

## 3. Architecture Impact

- **Monólito modular continua válido** (TD2, `17-technical-decisions.md`).
  Track A estende o módulo `work-manual` existente; Track B entra como um
  módulo novo e isolado (`growth` ou `public`), sem dependência de módulos
  autenticados além de reutilizar o `EmployeeTypesService` internamente
  (nunca o `Controller` autenticado).
- **Nenhuma fila/worker assíncrono é necessária ainda** (confirmado por
  `01-architecture.md`/`18-running-the-app.md` §1 — Runtime só entra na
  Sprint 03). Autosave e diagnóstico são síncronos, request/response.
- **Primeira vez que o backend precisa de uma segunda "classe de acesso ao
  banco"**: hoje só existem `withTenant` (empresa ativa) e `withUser`
  (login). Track B precisa de um terceiro modo — acesso público, sem
  tenant e sem usuário — tratado como decisão técnica própria (§16, TD15).

## 4. Data Model — Track A

O schema atual (`apps/api/prisma/schema.prisma`) só tem o necessário para
US01–US06: `WorkManual.sections` é um JSON opaco com só `status`. US07–US16
exigem modelar de verdade o conteúdo descrito em
`docs/design/22-work-manual-content-model.md`. Segue o mapeamento
proposto (nomes ilustrativos, não DDL final):

| Conceito | Ownership | Modelo proposto | Observação |
|---|---|---|---|
| Empresa (US07) | `Company` (compartilhado) | Novos campos escalares em `Company` (nome de atendimento, sobre, forma de atendimento, endereço, horários, fuso, site, rede social, observações) | Não é um novo agregado — é o próprio `Company` crescendo. Horários como `Json` (lista de períodos) é aceitável aqui: não é avaliado por policy engine em runtime nesta sprint. |
| Produtos/serviços (US08) | `Company` (compartilhado) | `ProductService` — tabela própria, `company_id`, sem `digital_employee_id` | N:M conceitual com `WorkManual` não é necessária na Sprint 02 (nenhuma história pede "apresentar só um subconjunto por Braço" ainda) — **todo produto da empresa é visível a todo Braço**, mais simples que `03-data-model.md` antecipava; se Product mudar isso depois, é aditivo. |
| Responsabilidades (US09) | `DigitalEmployee` (específico) | Catálogo fixo por `EmployeeType` **em código** (constante, mesmo padrão de `work-manual-sections.ts`) + `EmployeeResponsibility` (`digital_employee_id`, `key`, `enabled`) | Catálogo não é customizável no MVP — não precisa ser tabela; só a seleção por funcionário precisa persistir. |
| Regras e limites (US10) | Limite = produto (estático); Regra = empresa | `SYSTEM_LIMITS` constante em código (não editável, não é linha de banco) + `CompanyRule` (`company_id ou digital_employee_id`, texto, condição opcional) | Ver §25 sobre onde a regra se aplica — o conteúdo já resolve isso (regras são "da empresa", plural entre funcionários é possível; modelar como `company_id`, reaproveitável entre Braços, consistente com "contexto compartilhado" mesmo não estando listada explicitamente como tal em §14 do content model). |
| Autonomia (US11) | `DigitalEmployee` | `EmployeeAutonomyPolicy` (`digital_employee_id`, `responsibility_key`, `level` enum, `condition` texto opcional) | Nível máximo permitido por responsabilidade também vira constante em código (`RESPONSIBILITY_MAX_AUTONOMY`) — ver PD7 (§25) sobre o valor dessa constante. |
| Pessoas (US12) | `DigitalEmployee` | `EmployeeResponsible` (`digital_employee_id`, `user_id`, `kind`: principal/reserva) | `user_id` só pode referenciar `CompanyMembership` ativo da mesma empresa — validado no service, reforçado por RLS (mesmo padrão de `company_memberships`). |
| Comunicação (US13) | `DigitalEmployee` | `EmployeeCommunicationStyle` (`digital_employee_id`, tom, tratamento, tamanho, emojis, termos preferidos/evitar) | Sem geração via LLM — preview é só interpolação de texto estático por combinação de opção, calculável no frontend ou backend indiferentemente (não requer chamada de rede própria). |
| Recursos (US14) | `Company` (a conta/número conectado) + derivado de responsabilidades (a obrigatoriedade) | `Integration` (`company_id`, `type`: whatsapp\|google_calendar\|google_tasks, `status`, `credentials_encrypted`, `external_account_ref`) — já antecipada conceitualmente em `03-data-model.md` | Obrigatoriedade **não é uma coluna** — é sempre derivada em runtime de `EmployeeResponsibility` (US09) cruzada com o tipo de recurso (regra determinística, mesmo espírito do motor de Track B). Evita que os dois fiquem dessincronizados. |
| Revisão/conclusão (US15/US16/US17) | `WorkManual` + `DigitalEmployee.status` | Sem tabela nova — **serviço** de leitura (`PreparationReadinessService`) computa status de cada etapa a partir das tabelas acima, nunca de um campo cacheado isolado que possa dessincronizar | Ver §10 — autoridade de completude é 100% backend. |

`WorkManual` continua existindo como o registro 1:1 com `DigitalEmployee`
(já existe desde a Sprint 01), mas passa a ser mais um "cabeçalho" (status
geral, timestamps) do que o dono do conteúdo — o conteúdo vive nas tabelas
acima, todas com `company_id` (RLS) e a maioria com `digital_employee_id`.

**Migrations:** todas aditivas (novas tabelas + novas colunas nullable em
`Company`). Nenhuma migração destrutiva sobre dados da Sprint 01.

## 5. Data Model — Track B

Seguindo a lista conceitual pedida (§17 das instruções) — nomes não são
obrigatórios, e a recomendação de Engenharia é **não** criar 5 tabelas
separadas quando uma única tabela audível resolve com menos superfície:

| Conceito pedido | Recomendação | Justificativa |
|---|---|---|
| `DiagnosticSession` | **Não persistir no backend.** Um id de sessão gerado no cliente (UUID em `sessionStorage`), usado só para correlacionar eventos de analytics (§14) e como parte do estado de URL (§8). | Instrução explícita: "não criar conta anônima desnecessariamente" e "evite complexidade excessiva". Sem lead, uma sessão de diagnóstico abandonada não tem valor de negócio para persistir — persistir mesmo assim custa RLS/retention/PII a mais para zero benefício até a Sprint 02. |
| `DiagnosticAnswer` | Idem — vive só no estado do cliente até o resultado. Enviada ao backend **uma vez**, junto com o cálculo da recomendação. | Evita escrita pública a cada passo (superfície de abuso menor — só 1–2 chamadas públicas por visitante em vez de 5). |
| `Recommendation` | Não persistida isoladamente — o resultado do motor (ranking + motivos + disponibilidade) é **campo do próprio `Lead`**, calculado on-the-fly antes disso via endpoint de leitura (§11). | Só precisa sobreviver de verdade quando vira lead — antes disso é descartável. |
| `Lead` | **Tabela nova, única fonte de verdade de Track B.** Campos: contato (nome, empresa, whatsapp, e-mail opcional), segmento, tamanho de equipe, necessidades (array), prioridade, volume, ranking resultante (json), disponibilidade observada (json), `rule_version`, origem, `created_at`, metadados de privacidade (ver §24.3). | Cobre 100% do requisito de auditoria (§17 das instruções) numa única tabela, sem overhead de joins para um fluxo que não tem consulta operacional além de "ver o lead". |
| `RecommendationRuleVersion` | **Constante versionada em código**, não tabela (`RECOMMENDATION_RULE_VERSION = 'v1'` junto do módulo puro que implementa `docs/design/27-team-diagnostic-model.md`). O valor da versão é gravado no `Lead.rule_version`. | O motor é uma função pura determinística — versionar em código (com histórico no git) já satisfaz auditabilidade para o v1. Vira tabela no dia em que precisar rodar duas versões simultaneamente em produção (não é o caso na Sprint 02). |

`Lead` **não tem `company_id`** — não pertence a nenhum tenant. Vive fora
do modelo de RLS por-empresa; isolamento é feito por um mecanismo
diferente (§16).

## 6. API Changes

### Track A (autenticado, dentro do módulo `work-manual` existente)

Padrão: um recurso por etapa, todos com o mesmo formato de resposta
(`{ status, data, updatedAt }`), todos atrás de `JwtAuthGuard` +
`RolesGuard` (Owner/Admin podem editar; Operador/Visualizador só leem —
`04-multi-tenancy.md` §3).

| Rota | Método | Etapa |
|---|---|---|
| `/companies/current/profile` | GET/PATCH | Empresa (US07) |
| `/companies/current/products` | GET/POST/PATCH/DELETE | Produtos e serviços (US08) |
| `/digital-employees/:id/responsibilities` | GET/PATCH | Responsabilidades (US09) |
| `/digital-employees/:id/rules` | GET/POST/PATCH/DELETE | Regras e limites (US10) |
| `/digital-employees/:id/autonomy` | GET/PATCH | Autonomia (US11) |
| `/digital-employees/:id/responsibles` | GET/PATCH | Pessoas (US12) |
| `/digital-employees/:id/communication-style` | GET/PATCH | Comunicação (US13) |
| `/digital-employees/:id/resources` | GET/PATCH | Recursos (US14) |
| `/digital-employees/:id/work-manual/review` | GET | Revisão — agregado (US15/US16) |
| `/digital-employees/:id/work-manual/complete` | POST | Concluir preparação (US15) |

Todo `PATCH`/`POST`/`DELETE` acima, ao terminar, invoca
`PreparationReadinessService.recompute(digitalEmployeeId)` antes de
responder — é o mecanismo de autoridade de backend (§10).

### Track B (público, módulo novo, sem guard)

| Rota | Método | Uso |
|---|---|---|
| `/public/employee-types` | GET | Portfólio da landing — reusa `EmployeeTypesService`, nunca duplica disponibilidade |
| `/public/diagnostics/recommendation` | POST | Recebe respostas do diagnóstico, retorna ranking + motivos + disponibilidade. **Não persiste nada.** |
| `/public/leads` | POST | Persiste o `Lead` — único endpoint de escrita pública do produto até hoje |

Os três atrás de rate limiting dedicado (§7). Nenhum aceita ou retorna
identificador interno de outra empresa/tenant.

## 7. Public API Architecture

Esta é a primeira vez que o BRAÇO expõe escrita pública. Superfície nova
de risco — tratada com defesa em profundidade, não só validação de
aplicação:

1. **Módulo isolado** (`growth`/`public`) sem qualquer import de guards
   autenticados — impossível herdar um bug de autorização de outro módulo
   porque não há autorização nenhuma para herdar.
2. **Payload validation & limits:** DTOs com `class-validator` (já usado
   no projeto — `LoginDto`), `whitelist: true` no `ValidationPipe` global
   (rejeita campos não esperados), limite de tamanho de payload no nível
   do NestJS/Express (`json({ limit: '20kb' })` — nenhum campo do
   diagnóstico ou lead justifica payload maior).
3. **Rate limiting:** nova dependência `@nestjs/throttler`, aplicado por
   IP nas 3 rotas públicas (ex.: 10 req/min em `/recommendation`, 5
   req/min em `/leads` — valores iniciais conservadores, ajustáveis).
4. **CORS:** landing/diagnóstico vivem no mesmo domínio do `apps/web`
   (mesma SPA, rota pública nova — §15), então não abrem CORS novo. Se no
   futuro a landing for servida por domínio/app separado (ex.: para SSR —
   §15), o CORS dessas 3 rotas precisa ser explicitamente restrito a esse
   domínio, nunca `*`.
5. **CSRF:** não aplicável no sentido clássico — não há cookie de sessão
   autenticando essas rotas (nenhum estado ambiente é lido a partir de um
   cookie do navegador). O risco real é **abuso/spam automatizado**, não
   forjar uma ação em nome de uma vítima logada — por isso a mitigação é
   rate limiting + validação, não um token CSRF tradicional.
6. **Sem enumeração:** `/public/employee-types` já é, por natureza, dado
   de catálogo público (nome, missão, disponibilidade) — nenhum dos três
   endpoints aceita ou retorna `company_id`, `user_id` ou qualquer
   identificador de tenant.
7. **Logging:** logs técnicos das 3 rotas seguem a mesma regra de
   `10-security-lgpd.md` §7 — nunca nome/telefone/e-mail em texto claro no
   log de aplicação; só IDs internos (`lead_id`) e IP (ver retenção em
   §24.3).
8. **Anti-bot (recomendação, não obrigatório para Tech Ready):** um
   captcha invisível (ex. Cloudflare Turnstile) no formulário de lead é a
   adição de menor atrito; requer uma conta/site-key externa — listado em
   §24.2 como "External Credential/Environment Pending", não como bloqueio.

## 8. Frontend Architecture

- **Track A** estende `AppShell`/rotas autenticadas existentes — a tela de
  Preparação (`PreparationOverviewPage`, hoje só estrutural) ganha
  sub-rotas ou um painel interno por etapa, seguindo o padrão
  lista-detalhe do M3 já usado (`docs/design/23-preparation-experience-
  spec.md` §3). Nenhuma mudança na árvore de rotas autenticadas existente
  além de aprofundar `/equipe/:id/preparar`.
- **Track B exige restruturar `App.tsx`.** Hoje `/` e `*` redirecionam
  incondicionalmente para `/equipe` (app autenticado). Isso precisa virar:
  `/` → landing pública; `/monte-sua-equipe` (ou similar) → diagnóstico;
  `/login` → inalterado; `/equipe*` → app autenticado, só alcançável
  explicitamente (link "Entrar" na landing) ou por deep link direto.
  `ProtectedRoute` continua exatamente como está para tudo que já existe.
- **Novo componente de layout público** (`PublicShell` ou equivalente),
  deliberadamente **sem** o Navigation Drawer/Top App Bar do app
  gerencial — a landing não é uma tela "dentro" do produto.
- **Estado do diagnóstico (US78) — state management, URL e navegação:**
  - o passo atual é refletido na URL como query param (`/monte-sua-
    equipe?step=2`) — permite **back/forward** nativos do navegador
    (`popstate`) sem estado próprio de histórico, e permite compartilhar/
    retomar um link em um passo específico;
  - as respostas acumuladas ficam em `sessionStorage` (não
    `localStorage` — não deve sobreviver ao fechamento da aba/sessão,
    reforçando "não criar conta anônima" e reduzindo janela de
    persistência de dado ainda não confirmado pelo visitante), sob uma
    chave única por sessão de diagnóstico (o mesmo `sessionId` usado em
    analytics, §14);
  - **refresh** no meio do diagnóstico rehidrata de `sessionStorage` +
    do `step` da URL — não perde progresso, mas também não depende de
    round-trip ao servidor (nada é persistido no backend antes do
    resultado, §5);
  - **voltar** (`Voltar` na UI ou botão do navegador) preserva as
    respostas já dadas — nunca limpa o formulário;
  - **acessibilidade:** troca de passo move o foco para o heading do
    novo passo (mesmo padrão já exigido em `docs/design/26-growth-
    landing-experience.md` §15), evitando que um leitor de tela "perca"
    a navegação;
  - **mobile:** uma pergunta por passo é decisão de conteúdo já definida
    pelo Design (`docs/design/26-growth-landing-experience.md` §13) — o
    encaixe técnico é natural porque cada passo já é uma rota/estado
    próprio, não uma seção de scroll.

## 9. Autosave Strategy

Especificação (`docs/design/23-preparation-experience-spec.md` §5,
instruções §5) exige: sem botão Salvar, feedback `Salvando…/Salvo/Não foi
possível salvar`, sem perda silenciosa. Desenho técnico:

- **Debounce no cliente:** ~500–800ms após o usuário parar de digitar
  antes de disparar o `PATCH`. Trocar de campo ou sair da etapa força o
  flush imediato (não espera o debounce).
- **Uma requisição em voo por vez, por etapa:** se uma nova edição chega
  enquanto uma `PATCH` anterior ainda está em voo, ela é enfileirada (não
  disparada em paralelo) — evita duas respostas fora de ordem
  sobrescreverem uma à outra no estado do cliente.
- **Concorrência entre abas/dispositivos (multi-tab do mesmo gestor, ou
  dois gestores editando o mesmo Braço):** `PATCH` é *last-write-wins* por
  campo — aceitável para o MVP porque o dado é formulário de configuração
  (não é dinheiro nem agendamento), e o cenário de dois gestores editando
  a mesma etapa ao mesmo tempo é raro. Onde o custo de colisão é mais alto
  — **operações estruturais** (adicionar/excluir um produto, uma regra) —
  usar o mesmo padrão de `Idempotency-Key` já validado na Sprint 01
  (contratação) para blindar contra duplo clique/retry de rede, não
  contra concorrência real entre pessoas.
- **Retry:** falha de rede → estado `Não foi possível salvar` +
  `Tentar novamente` explícito (nunca retry silencioso infinito, para não
  mascarar um erro de validação real como se fosse de rede).
- **Race entre autosave e "Continuar":** `Continuar` só é habilitado após
  a última resposta de autosave conhecida (não permite avançar com uma
  escrita ainda em voo) — evita "perda de estado" onde o usuário avança
  antes do servidor confirmar.
- **Optimistic vs. confirmed UI:** o *status do campo* (valor digitado) é
  otimista (aparece imediato). O *status da etapa* (Completa/Em andamento)
  é sempre **confirmado pelo backend** — nunca calculado só no cliente,
  porque é ele quem decide `PREPARANDO ⇄ PRONTO` (§10). Isso está alinhado
  com a spec: "não avançar fingindo que o dado está persistido."
- **Idempotência de leitura:** reabrir uma etapa sempre busca o estado
  atual do servidor (GET), nunca confia em cache local como fonte de
  verdade após navegação.

## 10. Preparation Completion Engine

Requisito explícito das instruções: **"A autoridade de readiness precisa
existir no backend, não somente no frontend."**

`PreparationReadinessService` (novo) é chamado:
1. ao final de toda mutação em qualquer etapa (§6 API Changes);
2. explicitamente em `POST .../work-manual/complete` (Concluir
   preparação).

Ele:
- recomputa, a partir das tabelas de domínio (§4), o status de cada uma
  das 8 etapas (Não iniciada/Em andamento/Completa) — nunca lê um campo
  "cache" sem revalidar contra o dado real;
- em `complete`, **revalida as 8 do zero** antes de permitir a transição —
  o frontend pode estar desatualizado (aba antiga aberta), o backend não
  confia nele;
- se `complete` for chamado com alguma etapa inválida, retorna 422 com a
  lista de pendências (mesmo contrato que alimenta US16);
- se uma mutação em qualquer etapa **invalidar** um requisito obrigatório
  de um `DigitalEmployee` já `PRONTO`, o mesmo serviço rebaixa
  `DigitalEmployee.status` para `PREPARANDO` **na mesma transação** da
  mutação que causou a invalidação — nunca como job assíncrono separado
  (evita janela em que o produto mostra `PRONTO` já inválido).

Isso é o mesmo princípio já usado em `PrismaService.withTenant`/
`withUser` (Sprint 01): a garantia de negócio vive na camada de dados/
serviço, nunca só na UI.

## 11. Recommendation Engine

Implementado como **módulo puro** (função determinística, sem I/O), no
mesmo espírito de `apps/api/src/digital-employees/next-step.ts` (já
existe e já tem 7 testes unitários — precedente direto no próprio repo):

```
computeRecommendation(answers, availabilityByType) => {
  ranking: [{ typeKey, score, reason, availability }],
  ruleVersion: 'v1',
}
```

- **Entradas:** `needs[]`, `priority`, e o mapa de disponibilidade lido em
  runtime de `EmployeeType` (nunca hardcoded, nunca duplicado — §12).
- **Determinístico por construção:** nenhuma chamada de rede, nenhum
  `Date.now()`/random dentro da função — mesmos `answers` +
  `availabilityByType` sempre produzem o mesmo `ranking`.
- **Onde roda:** no **backend**, atrás de `/public/diagnostics/
  recommendation`. Rodar no cliente exporia a tabela de pesos no bundle
  JS sem necessidade e obrigaria duplicar a leitura de disponibilidade no
  cliente (reabrindo exatamente o risco que `docs/prd/04-aquisicao-e-
  diagnostico-de-equipe.md` pede para evitar). Rodar no servidor mantém a mesma função reutilizável também na
  hora de persistir o `Lead` (evita recalcular/duplicar lógica).
- **Testável 1:1** com a tabela de `docs/design/27-team-diagnostic-
  model.md` §3–§9 — cada linha da tabela de pontos e cada regra de
  desempate vira um caso de teste unitário puro, sem precisar de banco.

## 12. Catalog Availability Source of Truth

Track B **nunca** lê/escreve uma cópia própria de `AVAILABLE`/
`COMING_SOON`. Tanto `/public/employee-types` quanto
`/public/diagnostics/recommendation` consultam `EmployeeTypesService`
(o mesmo serviço, não duplicado) por trás — o único requisito novo é que
esse serviço não pode carregar nada tenant-scoped (já é o caso: `
EmployeeType` é uma tabela global, sem `company_id`). Consequência
prática: **quando Produto mudar Vendas de "Em breve" para "Disponível" no
catálogo (uma linha no banco), a landing e o diagnóstico refletem no
próximo request, sem deploy e sem editar Track B.**

## 13. Lead Capture

Ver Data Model — Track B (§5) para o schema. Escrita via
`POST /public/leads`, validação:
- `name`, `companyName`, `whatsapp` obrigatórios; `email` opcional;
- normalização de WhatsApp para E.164 antes de persistir (mesmo formato
  já usado conceitualmente em `05-whatsapp.md` §4, reaproveita a mesma
  convenção);
- erro de envio preserva o estado do diagnóstico no cliente (requisito
  explícito de US83/wireframe "Error") — o backend não precisa fazer
  nada especial para isso além de responder um erro claro; a preservação
  é responsabilidade do estado do cliente (sessionStorage, §8).

## 14. Analytics

Recomendação de Engenharia (Produto não define fornecedor, por
instrução): **eventos relayados pelo servidor para o pipeline de
observabilidade já previsto em `11-observability.md`**, não um SDK de
terceiro carregado direto no browser.

- Frontend dispara eventos para `POST /public/analytics/events` (mesmo
  módulo público, mesmo rate limit) com um schema fixo: `{ event, sessionId,
  properties }`, `properties` restrito a uma allowlist por evento (nunca
  nome/telefone/e-mail — a allowlist é a garantia técnica de "PII não deve
  ser enviada", não uma convenção de boa vontade).
- `sessionId` é o UUID de cliente (§5) — permite reconstruir o funil
  (`Landing View → Diagnostic Start → ... → Lead Submit`) sem nunca ligar
  a um dado de contato até o momento em que o próprio `Lead` é criado (aí
  sim, opcionalmente, o backend pode gravar `sessionId` no `Lead.source`
  para reconciliar funil↔conversão — é dado interno, nunca exposto).
- Deduplicação: cliente inclui um id de evento (`crypto.randomUUID()`);
  backend ignora reentrega do mesmo id dentro de uma janela curta (mesmo
  padrão de idempotência já usado em `IdempotencyKey`, mais leve).
- Evolução futura: trocar o destino do relay (de log estruturado para um
  data warehouse/produto de funil dedicado) é uma mudança só no
  `AnalyticsRelay` do backend — o contrato de evento do frontend não muda.

## 15. SEO / Public Web

`apps/web` é uma SPA client-side-rendered (Vite + React, sem SSR/SSG). Para
a Sprint 02, a landing entra como **mais uma rota client-side da mesma
SPA** (§8) — decisão técnica pragmática, não a melhor opção de SEO
possível:

| Item | Situação na Sprint 02 | Observação |
|---|---|---|
| `<title>`/meta description | Estático no `index.html` + atualizado via `document.title` na rota | Suficiente para compartilhamento/aba do navegador |
| Open Graph | Tags estáticas no `index.html` | Sem imagem OG dinâmica por rota nesta fase (não há CMS) |
| Canonical | Uma URL fixa para a landing | Sem parametrização de UTM afetando canonical |
| robots.txt / sitemap.xml | Arquivos estáticos em `public/` | Baixo custo, deve entrar na Sprint 02 |
| Indexabilidade | **Limitada** — crawlers que não executam JS veem uma página quase vazia | Googlebot moderno executa JS na maioria dos casos, mas com atraso/custo de crawl budget maior que HTML estático |
| Core Web Vitals | Depende do bundle da SPA autenticada não vazar para a rota pública | Recomendado: code-splitting explícito (a landing não deve carregar o bundle do app gerencial) |
| Fontes | Reaproveita Manrope/Inter já carregadas via Google Fonts (Brand UI Foundation) | Sem custo novo |

**Recomendação:** aceitável para o MVP da Sprint 02 (não é um produto de
aquisição orgânica ainda — o canal inicial é tráfego direto/pago/social).
**Caveat registrado, não bloqueio:** se SEO orgânico for uma métrica de
Growth relevante, um passo de pré-renderização estática só da rota da
landing (ex. `vite-plugin-ssg` ou prerender em build) é a evolução
natural — isolado, não exige reescrever a SPA.

## 16. Multi-tenancy / Data Isolation

- **Track A** não muda a estratégia (RLS por `company_id`, TD1). Toda
  tabela nova de §4 carrega `company_id` (direta ou via
  `digital_employee_id` com o mesmo padrão de `WorkManual` — denormalizado
  quando necessário para a policy, como já documentado para
  `work_manuals`).
- **Track B introduz uma segunda categoria de acesso a dados**, que não é
  "tenant" nem "usuário": acesso **público**. Ver TD15 (`17-technical-
  decisions.md`) para a decisão completa — resumo: um terceiro helper no
  `PrismaService` (`withPublicAccess`, nome ilustrativo) que roda sob uma
  role de banco distinta, sem `SET LOCAL app.current_company_id`, com
  policies de RLS que permitem **somente** `INSERT` em `leads` e
  `SELECT` em `employee_types` — nenhuma outra tabela é alcançável por
  essa role, nem em teoria. Isso é defesa em profundidade: mesmo um bug
  de autorização na camada de aplicação não abriria acesso a dado de
  tenant, porque a conexão de banco usada pelo caminho público
  literalmente não tem permissão de ler `companies`/`digital_employees`/
  etc. no nível do Postgres.

## 17. Security / Abuse Prevention

Resumo consolidado (detalhe em §7/§16):

| Vetor | Mitigação |
|---|---|
| Spam/bot no lead form | Rate limit por IP + validação de payload + (opcional) captcha invisível |
| Scraping do endpoint de recomendação | Rate limit; resposta não expõe score interno (já é requisito de produto, reforça segurança por obscuridade mínima) |
| Payload gigante/DoS de aplicação | Limite de tamanho de body no Express/Nest |
| SQL injection | Prisma parametriza tudo por padrão — nenhuma query raw nova prevista em Track B |
| Enumeração de tenant | Nenhum endpoint público aceita/retorna identificador de tenant |
| Vazamento de PII em log | Regra já existente (`10-security-lgpd.md` §7) estendida às 3 rotas novas |
| RLS/segregação | Nova role de banco dedicada ao caminho público (§16, TD15) |
| IP handling | IP é usado só para rate limit; não persistido em texto pleno junto ao `Lead` sem necessidade — se guardado para auditoria antifraude, hash/truncamento, com retenção curta definida junto ao gate de privacidade (§24.3) |

## 18. WhatsApp Readiness

`docs/technical/05-whatsapp.md` já cobre o desenho de produção completo
(BSP, webhooks, templates) — mas isso é escopo de **uso operacional**
(Sprint 03+). Para US14 (Sprint 02), o que precisa existir **agora** é só
a **conexão**:

- Escolha de BSP para o MVP ainda não foi feita tecnicamente (documento
  05 recomenda BSP, mas não fecha qual — reversível via `MessagingAdapter`,
  TD já prevista). **Não bloqueia Tech Ready** porque a UI de US14 só
  precisa de: iniciar conexão → redirecionar → voltar autenticado →
  marcar `Conectado`. Isso funciona com qualquer BSP escolhido, inclusive
  em modo sandbox/teste.
- **Pendência real:** uma conta de BSP (mesmo que sandbox/trial) para
  testar o fluxo de conexão ponta a ponta. Listado em §24.2 como External
  Credential/Environment Pending.
- Armazenamento de credencial (`Integration.credentials_encrypted`) exige
  criptografia em repouso — hoje **não existe** nenhum mecanismo de
  KMS/secrets manager no ambiente (`10-security-lgpd.md` §4/§5 descreve
  a intenção, não há implementação). Isso é trabalho de engenharia real
  desta sprint (não é um gate externo), mas é esforço novo, não reuso.

## 19. Google Readiness

Mesma lógica do WhatsApp, para Calendar/Tasks (US14):

- Requer um app OAuth no Google Cloud Console com os escopos `calendar` e
  `tasks`. Em modo de teste ("Testing" no OAuth consent screen), o Google
  permite conectar sem passar por verificação formal, desde que os
  e-mails de teste (equipe BRAÇO + ambiente de demo) estejam cadastrados
  como testadores — **suficiente para Sprint 02**, verificação formal do
  Google só é necessária antes de abrir para usuários externos reais.
- **Pendência real:** criar o projeto/app OAuth no Google Cloud (uma
  tarefa única, ~30 minutos, mas requer uma conta Google Cloud da
  organização). Listado em §24.2.
- Push notifications do Calendar (`watch` channels) e polling de Tasks
  (`06-google-calendar.md`, `07-google-tasks.md`) são escopo de operação
  real (Sprint 04/05) — **não precisam existir na Sprint 02**, US14 só
  cobre "conectar e selecionar calendário/lista", não sincronizar eventos.

## 20. Testing Strategy

Segue o mesmo padrão já validado na Sprint 01 (13/13 testes, e2e contra
Postgres real via RLS) — nenhuma mudança de filosofia, só de superfície:

**Track A**
- Unit: validação de cada DTO de etapa; `PreparationReadinessService`
  (completude de cada etapa, revalidação em `complete`, rebaixamento
  `PRONTO → PREPARANDO`); enforcement de teto de autonomia por
  responsabilidade.
- E2e (Postgres real, RLS): isolamento cross-tenant das novas tabelas
  (mesmo teste-molde de `tenant-isolation.e2e-spec.ts`, estendido);
  fluxo completo das 8 etapas → revisão → `Concluir preparação` →
  `PRONTO`; invalidar um obrigatório pós-`PRONTO` → volta a `PREPARANDO`;
  RBAC (Visualizador não edita etapa).
- Regressão: os 13 testes da Sprint 01 continuam passando sem alteração
  de contrato das rotas existentes.

**Track B**
- Unit (motor): ranking determinístico linha-a-linha da tabela de pontos;
  todos os casos de desempate (`docs/design/27-team-diagnostic-model.md`
  §5); máximo 3
  resultados; score zero nunca aparece; "Comece por aqui" só quando
  Atendimento é 1º **e** disponível; nenhuma recomendação forçada quando
  todos "Em breve".
- Integração: `/public/diagnostics/recommendation` lê disponibilidade real
  do banco (não mock) — prova em teste que mudar `EmployeeType.availability`
  muda a resposta sem redeploy.
- E2e público: `POST /public/leads` persiste todos os campos exigidos por
  §5/§13; erro de validação não persiste lead parcial; rate limit responde
  429 após o limite; role de banco pública não consegue `SELECT` em
  `companies`/`digital_employees` (teste negativo direto de RLS, mesmo
  espírito do teste de isolamento de tenant da Sprint 01).
- Analytics: evento com campo fora da allowlist é rejeitado/filtrado, não
  silenciosamente aceito.
- Responsivo/a11y: Playwright nos 3 breakpoints (380/768/1440), como já
  feito na Brand UI Foundation.
- Regressão: app autenticado existente inalterado (rotas, RLS, Sprint 01).

## 21. Migration Strategy

Todas as migrations desta sprint são **aditivas**:
- Track A: novas colunas nullable em `Company`; novas tabelas
  (`ProductService`, `EmployeeResponsibility`, `CompanyRule`,
  `EmployeeAutonomyPolicy`, `EmployeeResponsible`,
  `EmployeeCommunicationStyle`, `Integration`) — nenhuma altera/remove
  coluna existente.
- Track B: uma tabela nova (`Lead`), sem RLS por `company_id` (RLS
  própria restringindo a role pública, §16) — nenhuma alteração em tabela
  de tenant existente.
- Nenhuma migration desta sprint precisa de *backfill* de dado histórico
  (todas as tabelas novas começam vazias).
- Seed (`prisma/seed.ts`) ganha dados de exemplo para as novas tabelas de
  Track A no funcionário de demonstração, para não deixar o ambiente de
  demo com Manual "vazio" depois da Sprint 02 (mesmo espírito do seed
  atual).

## 22. Story-by-story Readiness

Product Ready e Design Ready são **YES** para as 18 histórias (confirmado
pelo manifesto do pacote e por cada arquivo de história). A coluna
relevante desta análise é Tech Ready.

### Track A

| Story | Product Ready | Design Ready | Tech Ready | Caveats |
|---|---|---|---|---|
| US07 — Informar dados da empresa | YES | YES | **TECH READY WITH CAVEATS** | Novos campos em `Company`; edição concorrente por dois gestores é last-write-wins (aceitável, §9) |
| US08 — Cadastrar produtos e serviços | YES | YES | **TECH READY WITH CAVEATS** | Nova tabela `ProductService`; definir política de exclusão de item referenciado (nenhum Braço "trava" a exclusão nesta sprint — confirmar não-bloqueio é suficiente) |
| US09 — Definir responsabilidades | YES | YES | **TECH READY** | Catálogo fixo em código; desbloqueia obrigatoriedade dinâmica de US14 |
| US10 — Definir regras e limites | YES | YES | **TECH READY** | Limites de sistema são conteúdo estático versionado em código, não linha de banco |
| US11 — Definir autonomia | YES | YES | **TECH READY WITH CAVEATS** | Depende de PD7 (§25) para o valor exato do teto por responsabilidade; mecanismo de enforcement já está definido |
| US12 — Informar equipe e responsáveis | YES | YES | **TECH READY** | Reaproveita `CompanyMembership` existente |
| US13 — Definir estilo de comunicação | YES | YES | **TECH READY** | Sem LLM; preview é interpolação estática |
| US14 — Configurar recursos de trabalho | YES | YES | **TECH READY WITH CAVEATS** | Depende de credenciais externas (BSP/Google, §24.2) e de KMS/secrets manager ainda não implementado; UI/modelo/estado podem ser construídos com credenciais sandbox |
| US15 — Revisar Manual de Trabalho | YES | YES | **TECH READY** | Depende do `PreparationReadinessService` (§10), que precisa existir antes |
| US16 — Identificar preparação incompleta | YES | YES | **TECH READY** | Mesma dependência de US15 |
| US17 — Visualizar status de preparação | YES | YES | **TECH READY** | Extensão direta do Employee Status já existente |

### Track B

| Story | Product Ready | Design Ready | Tech Ready | Caveats |
|---|---|---|---|---|
| US77 — Visualizar Landing Page | YES | YES | **TECH READY WITH CAVEATS** | Exige reestruturar rotas públicas/autenticadas (§8); nenhum asset de imagem para o hero foi entregue — recomenda-se composição tipográfica/cor, sem imagem, para não bloquear |
| US78 — Iniciar diagnóstico de equipe | YES | YES | **TECH READY WITH CAVEATS** | Estratégia de URL/estado precisa ser implementada como descrito em §8 (não existe hoje) |
| US79 — Informar necessidades da empresa | YES | YES | **TECH READY** | Puramente client-side até o resultado |
| US80 — Priorizar problemas da empresa | YES | YES | **TECH READY** | Idem |
| US81 — Gerar equipe recomendada | YES | YES | **TECH READY** | Motor determinístico especificado por completo em `docs/design/27-team-diagnostic-model.md`; testável 1:1 (§20) |
| US82 — Visualizar disponibilidade dos Braços recomendados | YES | YES | **TECH READY** | Consulta a mesma fonte de catálogo (§12), sem duplicação |
| US83 — Registrar lead interessado | YES | YES | **TECH READY WITH CAVEATS** | Primeiro endpoint público de escrita do produto — depende de rate limiting, role de banco isolada e validação novos (§7, §16), nenhum dos quais existe hoje; nenhum é bloqueio, todos são trabalho previsto desta sprint |

## 23. Risks

| Risco | Track | Mitigação |
|---|---|---|
| Credencial externa (BSP/Google) atrasa só US14 | A | Provisionar em paralelo, no início da sprint (§24.2); as outras 9 histórias de Track A não dependem disso |
| KMS/secrets manager inexistente vira gargalo de US14 | A | Sequenciar primeiro em US14 (§26), antes da UI de conexão |
| Autosave mal calibrado gera excesso de requests | A | Debounce + fila de 1 requisição em voo (§9) mitigam desde o design |
| Landing pública ser o primeiro alvo de abuso do produto | B | Rate limit + role de banco isolada desde o primeiro commit, não como retrofit (§7/§16) |
| SEO fraco por ser SPA CSR | B | Aceito para MVP; pré-renderização é evolução isolada (§15) |
| Ambiguidade de teto de autonomia (PD7) implementada errado | A | Registrado antes de codificar (§25), não durante revisão de PR |
| Track B consumir capacidade de Track A | Ambos | Nenhum sinal disso nesta análise — todas as 18 histórias são Tech Ready/Tech Ready with Caveats; se surgir durante a sprint, volta ao PO/PM, não é decidido por Engenharia sozinha (regra explícita das instruções) |

## 24. External Gates

### 24.1 Technical Blockers

Nenhum. Nenhuma história de Track A ou Track B tem um bloqueio técnico
que impeça o início da implementação (ver classificação completa em §22).

### 24.2 External Credential/Environment Pending

Não bloqueiam o início da sprint, mas precisam ser provisionados durante
ela (idealmente logo no início, em paralelo ao código) para que as
histórias que dependem deles não fiquem paradas quando chegar a vez:

- **Conta/contrato de BSP de WhatsApp** (mesmo sandbox/trial) — US14, §18.
- **App OAuth no Google Cloud Console** com escopos `calendar`+`tasks`,
  em modo de teste — US14, §19.
- **KMS/secrets manager** para `Integration.credentials_encrypted` — não
  existe hoje no ambiente; é trabalho de Engenharia (não uma credencial
  externa a pedir), mas precisa ser sequenciado **antes** da UI de
  conexão de US14 (§26).
- **(Opcional, hardening) conta de provedor de captcha invisível**
  (ex.: Cloudflare Turnstile) para o formulário de lead — §7.

### 24.3 Launch Gates

- **Launch Gate / Legal — Privacidade do lead da landing (Track B):**
  desenvolvimento não é bloqueado; **publicação com captação real de
  lead é bloqueada** até validação jurídico/compliance do aviso de
  privacidade e do tratamento do dado do lead. Registrado como PD6 (§25).
- **Launch Gate — WhatsApp templates (herdado de PD2):** segue como já
  registrado — submissão à Meta/BSP antes do início da Sprint 03,
  ortogonal a esta sprint.
- **Launch Gate — PD3 (retenção/LGPD de dado de cliente final):** segue
  como já registrado, não afetado por esta sprint (Track A/B da Sprint 02
  não processam dado de cliente final de atendimento real).

## 25. Product Decisions Required

Dois itens novos, adicionados a `docs/technical/16-product-decisions-
required.md` preservando o histórico existente:

- **PD6 — Privacidade do lead da landing (Launch Gate).**
- **PD7 — Teto de autonomia por responsabilidade não tabulado
  separadamente da recomendação inicial.**

Detalhe completo de cada um em `16-product-decisions-required.md`.

## 26. Recommended Implementation Sequence

### Track A

```
1. Shared context/data model
   Company (novos campos) + ProductService + migrations
2. Preparation completion engine
   PreparationReadinessService (esqueleto: lê tabelas ainda vazias,
   sempre "incompleto") — construído ANTES do conteúdo para que cada
   etapa seguinte já nasça integrada a uma autoridade real, não a um
   cálculo local que precisaria ser jogado fora depois
3. Formulários simples (autosave end-to-end provado 1x)
   US07 (Empresa) — valida o padrão de autosave/debounce/retry
   US08 (Produtos e serviços) — valida o padrão de lista com CRUD
4. Responsabilidades
   US09 — desbloqueia a obrigatoriedade dinâmica de recursos (US14) e
   a lista de autonomia (US11)
5. Regras/autonomia
   US10, US11 — dependem de US09
6. Pessoas / Comunicação
   US12, US13 — independentes entre si, podem ser paralelas
7. Recursos
   US14 — por último no conteúdo porque depende de US09 (obrigatoriedade)
   e das credenciais externas (§24.2) — sequenciar o provisionamento de
   credencial em paralelo com os passos 1-6, não depois deles
8. Review/completion/status
   US15, US16, US17 — puramente agregação sobre tudo acima
```

### Track B

```
1. Public route/layout
   PublicShell + reestruturação de App.tsx (§8) + landing estática
   (US77) — sem depender de nenhum backend novo
2. Diagnostic state
   US78, US79, US80 — client-side, URL/sessionStorage (§8)
3. Recommendation engine
   Módulo puro + testes unitários (US81) — pode ser construído em
   paralelo ao passo 2, já que não depende de UI
4. Result
   US82 — junta motor + disponibilidade real via /public/employee-types
5. Lead persistence/public endpoint
   US83 — última porque é a única com escrita pública (maior superfície
   de risco); entra depois de rate limiting/isolamento de role (§7/§16)
   já estarem prontos, não como afterthought
6. Analytics
   Instrumentação incremental — pode começar já no passo 1 (Landing View)
   e crescer junto com cada história
7. SEO/hardening
   meta tags, robots.txt, sitemap, rate limit tuning, captcha opcional —
   último porque é polimento, não bloqueia nenhuma história
```

**Dependência cruzada entre tracks:** nenhuma união de dados. A única
dependência de sequenciamento é de **capacidade**, não técnica — cabe ao
PO/PM decidir se as duas trilhas rodam em paralelo (dois desenvolvedores)
ou em série dentro da sprint; esta análise não identificou razão técnica
para forçar uma ordem entre os tracks.

## 27. Final Sprint Readiness

> **Track A Ready for Development: YES**
> **Track B Ready for Development: YES**
> **Sprint 02 Ready for Development: YES**

Nenhum Technical Blocker impede o início. Pendências reais são External
Credential/Environment (§24.2) e Launch Gates (§24.3) — nenhuma delas
impede começar a escrever código nesta sprint.
