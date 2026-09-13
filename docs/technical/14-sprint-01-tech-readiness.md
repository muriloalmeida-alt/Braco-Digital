# BRAÇO — Sprint 01: Tech Readiness

Escopo: US01, US02, US03, US04, US05, US06, US53, US54.
Referências obrigatórias: `docs/design/flows/01-hiring.md`,
`docs/design/flows/02-preparation.md`, `09-product-patterns.md`,
`10-information-architecture.md`, `11-navigation.md`,
`12-status-and-states.md`.

## 0. Pré-requisito transversal não coberto por nenhuma User Story

**Achado crítico:** nenhuma das 76 User Stories do backlog, nem
`docs/05-customer-journey.md`, cobre **criação de conta, criação da
empresa (tenant) e provisionamento do primeiro usuário Owner**. Toda a
Sprint 01 pressupõe uma `Company` e um `User` autenticado já existentes.
Isso é registrado como item próprio em `16-product-decisions-required.md`
(#1) porque não é uma decisão que Engenharia deva resolver sozinha
silenciosamente (poderia implicar tela, fluxo e cópia novos, fora do que
Design aprovou até aqui).
**Para fins desta Sprint 01, assume-se** que empresa/usuário demo já
existem via seed/fixture, o que é suficiente para desenvolver e demonstrar
as 8 histórias abaixo sem bloquear o time.

## 1. Nota sobre a qualidade das User Stories

As 8 User Stories da Sprint 01, como escritas no backlog, usam texto
padronizado praticamente idêntico entre si (mesmos critérios de aceitação
genéricos, mesmas regras de negócio). O conteúdo realmente específico de
cada uma vem dos documentos de Design (`flows/01-hiring.md`,
`flows/02-preparation.md`, `09-product-patterns.md`) e do PRD, não do texto
da própria US. A análise abaixo usa Design+PRD como fonte primária de
critério técnico, e sinaliza onde o texto da US sozinho seria insuficiente
para implementar sem ambiguidade — ver também `16-product-decisions-
required.md` (#2).

## 2. US01 — Visualizar funcionários disponíveis

- **Dependências:** Company/User autenticados (pré-requisito §0); catálogo
  de `EmployeeType` semeado no banco (ao menos Atendimento).
- **Componentes:** Employee Card (padrão M3/BRAÇO, `09-product-patterns.md`
  §1), grid/list de catálogo (`flows/01-hiring.md`).
- **Entidades:** `EmployeeType` (leitura).
- **API:** `GET /employee-types` — retorna tipos disponíveis para
  contratação (nome, função, missão, resultado esperado, responsabilidades
  principais).
- **Estados:** loading, catálogo vazio/indisponível, populado
  (`12-status-and-states.md`).
- **Riscos:** nenhum tecnicamente relevante.
- **Caveat de produto:** `docs/04-employee-catalog.md` já descreve 5
  funcionários (Atendimento, Vendas, Orçamentos, Pós-venda, Financeiro), mas
  só Atendimento está no MVP (`docs/06-mvp.md`). Não está explícito no
  Design se o catálogo da Sprint 01 deve **mostrar só Atendimento** ou
  **mostrar os 5 com os 4 futuros bloqueados/"em breve"**. Assunção adotada:
  mostrar apenas Atendimento nesta sprint, tratado como confirmação
  pendente de baixo risco (não elevado a Product Decision formal, mas
  registrado aqui para validação antes do desenvolvimento).
- **Classificação: Tech Ready** (com a assunção acima documentada).

## 3. US02 — Visualizar detalhes do funcionário

- **Dependências:** US01 (navegação a partir do catálogo).
- **Componentes:** tela de detalhe (`flows/01-hiring.md` — "Detalhe do
  funcionário"), CTA de contratação.
- **Entidades:** `EmployeeType` (leitura, mesmo registro de US01).
- **API:** `GET /employee-types/:id`.
- **Estados:** loading, erro (tipo inexistente/indisponível), populado.
- **Riscos:** nenhum.
- **Classificação: Tech Ready.**

## 4. US03 — Contratar funcionário

- **Dependências:** US02 (CTA de contratação); RBAC (quem pode contratar —
  Owner/Admin, conforme `04-multi-tenancy.md` §3).
- **Componentes:** confirmação contextual/Dialog M3, Progress/feedback,
  Snackbar (`flows/01-hiring.md` — "Padrões M3").
- **Entidades:** cria `DigitalEmployee` (status inicial `Contratado`, que o
  fluxo evolui imediatamente para `Preparando` conforme
  `flows/01-hiring.md`: "Status: Contratado/Preparando").
- **API:** `POST /companies/:companyId/digital-employees { employeeTypeId }`
  — idempotente via chave de idempotência gerada pelo cliente, para evitar
  contratação duplicada em duplo clique/retry de rede.
- **Contrato de resposta:** `DigitalEmployee` criado + próximo passo
  (reaproveitado por US05).
- **Estados:** loading, erro de contratação, contratação concluída
  (`flows/01-hiring.md` — "Estados").
- **Riscos:** duplo submit sem idempotência geraria dois funcionários iguais
  — mitigado pelo contrato acima.
- **Classificação: Tech Ready.**

## 5. US04 — Visualizar funcionário contratado

- **Dependências:** US03.
- **Componentes:** Employee Card em Minha Equipe (mesma base de US53/US54).
- **Entidades:** `DigitalEmployee` (leitura, com `status`).
- **API:** coberta pela mesma API de listagem usada em US53
  (`GET /companies/:companyId/digital-employees`).
- **Estados:** populado; nenhum estado extra além dos já cobertos por
  US53/US54.
- **Classificação: Tech Ready.** (Na prática, é uma consequência direta de
  US53 — ver nota de granularidade no item 16 de
  `16-product-decisions-required.md` se aplicável.)

## 6. US05 — Identificar próximo passo

- **Dependências:** US03/US04.
- **Componentes:** não é uma entidade nova — é lógica de apresentação que
  mapeia `DigitalEmployee.status` → CTA (`09-product-patterns.md` §2
  "Employee Status" + `flows/01-hiring.md`: "próximo passo é explícito").
- **Contrato:** a API de US03/US04 já retorna (ou permite derivar no
  frontend) o próximo passo esperado para o status atual. Para Sprint 01, o
  único mapeamento necessário é `Contratado/Preparando → "Preparar
  funcionário"`.
- **Riscos:** o mapeamento completo status→CTA para **todos** os 7 status
  (`12-status-and-states.md`) só é totalmente necessário a partir da Sprint
  03 (Ativação) em diante; nesta sprint, implementar de forma extensível
  (tabela de mapeamento, não `if/else` pontual) evita retrabalho.
- **Classificação: Tech Ready.**

## 7. US06 — Iniciar preparação

- **Dependências:** US03 (funcionário contratado existente).
- **Componentes:** Home da preparação (`flows/02-preparation.md`) — mostra
  progresso e seções, mesmo que as seções em si (Empresa, Produtos, Regras
  etc.) só ganhem formulário completo na Sprint 02 (US07–US15).
- **Entidades:** cria `WorkManual` vazio associado ao `DigitalEmployee`
  (estado "não iniciado"/"em andamento" — `flows/02-preparation.md` §
  "Estados").
- **API:** `POST /digital-employees/:id/work-manual` (idempotente — iniciar
  preparação duas vezes não deve recriar o manual) e
  `GET /digital-employees/:id/work-manual` (para render da home de
  preparação com estado de cada seção).
- **Escopo explícito da Sprint 01:** esta história cobre **entrar** na
  preparação e ver a estrutura de seções com status "não iniciado" — não
  cobre preencher nenhuma seção (isso é US07 em diante, Sprint 02). Esse
  limite de escopo não está explícito no texto da US06 nem no PRD e é uma
  interpretação de engenharia a partir do agrupamento por sprint no backlog;
  deve ser confirmada com o PM antes do desenvolvimento (risco baixo, mas
  registrado).
- **Riscos:** nenhum técnico relevante além do limite de escopo acima.
- **Classificação: Tech Ready with caveats** (o caveat é de escopo/
  confirmação com PM, não um bloqueio técnico).

## 8. US53 — Visualizar equipe

- **Dependências:** pré-requisito §0 (Company/User).
- **Componentes:** lista de Employee Cards, empty state (`docs/design/
  12-status-and-states.md` §4 — "Sua equipe digital ainda está vazia...").
- **Entidades:** `DigitalEmployee` (leitura, todos da empresa).
- **API:** `GET /companies/:companyId/digital-employees`.
- **Estados:** empty (com CTA "Conhecer funcionários" → catálogo/US01),
  loading, populado.
- **Riscos:** nenhum.
- **Classificação: Tech Ready.**

## 9. US54 — Visualizar status

- Mesma tela/API de US53; o status (`DigitalEmployee.status`) já é parte do
  mesmo payload. Não introduz entidade, API ou componente novo além do
  Employee Status badge (`09-product-patterns.md` §2), que deve exibir
  sempre texto (nunca só cor), conforme `12-status-and-states.md` §2.
- **Classificação: Tech Ready.**

## 10. Resumo de prontidão

| História | Classificação | Observação |
|---|---|---|
| US01 | Tech Ready | assunção de catálogo só-Atendimento a confirmar |
| US02 | Tech Ready | — |
| US03 | Tech Ready | idempotência de contratação é requisito de implementação |
| US04 | Tech Ready | reaproveita API de US53 |
| US05 | Tech Ready | implementar mapeamento extensível, não hardcoded |
| US06 | Tech Ready with caveats | limite de escopo (só "iniciar", não preencher) a confirmar com PM |
| US53 | Tech Ready | — |
| US54 | Tech Ready | reaproveita tela/API de US53 |

**Nenhuma história da Sprint 01 está "Not Tech Ready".** O único item que
bloqueia o **produto em produção** (não a Sprint 01 em si, que pode usar
dados seed) é o pré-requisito §0 — tratado formalmente em
`16-product-decisions-required.md`.

## 11. O que precisa existir tecnicamente antes da primeira linha de código de produto

1. Schema mínimo: `Company`, `User`, `CompanyMembership`, `EmployeeType`
   (seed), `DigitalEmployee`, `WorkManual` (vazio/placeholder).
2. Autenticação + tenant context + RBAC básico (`04-multi-tenancy.md`),
   mesmo que simplificado para o MVP.
3. API Gateway com as rotas listadas acima.
4. Frontend: tema M3 base (cores/tipografia/shape) e componente de
   navegação responsivo (`13-frontend-m3-implementation.md`) — histórias de
   Sprint 01 já exercitam Minha Equipe e navegação, então a fundação de
   tema não pode ser adiada para depois da Sprint 01.
5. Seed de dados de demonstração (empresa + usuário) para suprir a lacuna do
   item §0 até que exista uma decisão de produto sobre onboarding/signup.
