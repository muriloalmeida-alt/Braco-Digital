# BRAÇO — Sprint 01: Tech Readiness (v2 — pós Product Decisions)

**Atualização:** esta é a reavaliação da Sprint 01 após a resolução de
PD1–PD5 (`16-product-decisions-required.md`) e a confirmação do escopo de
US06 por Murilo (PO). A versão anterior (que registrava caveats/assunções
pendentes) fica preservada em espírito nas seções "Histórico" de cada
história, para rastreabilidade — nada foi apagado silenciosamente.

Escopo: US01, US02, US03, US04, US05, US06, US53, US54.
Referências obrigatórias: `docs/design/flows/01-hiring.md`,
`docs/design/flows/02-preparation.md`, `09-product-patterns.md`,
`10-information-architecture.md`, `11-navigation.md`,
`12-status-and-states.md`.

## 0. Pré-requisito transversal — resolvido (PD1)

**Histórico:** nenhuma das 76 User Stories do backlog cobria criação de
conta/empresa/Owner. Registrado como PD1.

**Resolução:** Murilo (PO) decidiu que as Sprints 01–06 operam em
**onboarding manual/provisionado pela equipe BRAÇO** — empresa e usuário
Owner são provisionados administrativamente (seed/admin tooling).
Self-service fica para o futuro PRD 03/E11 (Sprint 07). Isso deixa de ser
uma lacuna e passa a ser uma decisão explícita de produto: **Engenharia usa
seed/admin tooling para provisionar Company + Owner antes de qualquer
demonstração ou uso piloto da Sprint 01.**

## 1. Nota sobre a qualidade das User Stories — resolvida onde aplicável

As User Stories da Sprint 01 usavam texto padronizado praticamente idêntico
entre si. Onde isso gerava ambiguidade de escopo real (US06), a
interpretação de Engenharia foi submetida e **confirmada por Murilo (PO)**,
com critérios de aceitação reescritos na própria história. As demais
histórias (US01–US05, US53, US54) tinham critério técnico suficiente nos
documentos de Design (`flows/01-hiring.md`, `09-product-patterns.md`) e
PRD, e permanecem Tech Ready sem caveat.

## 2. US01 — Visualizar funcionários disponíveis

- **Dependências:** Company/User pré-provisionados (§0); catálogo de
  `EmployeeType` semeado no banco com os 5 tipos do portfólio.
- **Componentes:** Employee Card com Catalog Availability
  (`09-product-patterns.md` §1.1 — Disponível/Em breve), grid/list de
  catálogo (`flows/01-hiring.md`). Especificação visual completa e
  aprovada (anatomia, wireframes, responsividade, estados, acessibilidade):
  `docs/design/18-catalog-availability-ui-spec.md` — fecha o detalhamento
  visual desta história (nada pendente de mockup).
- **Entidades:** `EmployeeType` (leitura) + campo de disponibilidade
  (`available | coming_soon`), distinto de `DigitalEmployee.status`.
- **API:** `GET /employee-types` — retorna os 5 tipos (nome, função,
  missão, resultado esperado, responsabilidades principais,
  `availability`).
- **Estados:** loading, catálogo vazio/indisponível, populado
  (`12-status-and-states.md`).
- **Contrato confirmado (PD5):** Atendimento = `available`; Vendas,
  Orçamentos, Pós-venda, Financeiro = `coming_soon`. Cards `coming_soon`
  não exibem CTA de contratação, mas mantêm conteúdo completo e navegação
  ao detalhe.
- **Histórico:** anteriormente havia uma assunção não confirmada de
  mostrar só Atendimento — **substituída pela decisão PD5** (mostrar os 5,
  com disponibilidade).
- **Riscos:** nenhum tecnicamente relevante.
- **Product Ready:** Sim. **Design Ready:** Sim (`09-product-patterns.md`
  §1.1 define o card "Em breve"). **Tech Ready:** Sim.

## 3. US02 — Visualizar detalhes do funcionário

- **Dependências:** US01.
- **Componentes:** tela de detalhe (`flows/01-hiring.md`), com CTA de
  contratação condicional a `availability = available`.
- **Entidades:** `EmployeeType` (leitura, mesmo registro de US01).
- **API:** `GET /employee-types/:id` — inclui `availability` e, quando
  `coming_soon`, a mensagem padrão de indisponibilidade.
- **Estados:** loading, erro (tipo inexistente), populado (disponível/em
  breve).
- **Contrato confirmado (PD5):** os 5 tipos têm detalhe visualizável;
  somente Atendimento exibe CTA de contratação; os demais mostram missão,
  responsabilidades e resultado esperado normalmente, mais a mensagem de
  indisponibilidade — sem lista de espera/"Avise-me" nesta fase.
- **Riscos:** nenhum.
- **Product Ready:** Sim. **Design Ready:** Sim. **Tech Ready:** Sim.

## 4. US03 — Contratar funcionário

- **Dependências:** US02; RBAC (Owner/Admin, `04-multi-tenancy.md` §3).
- **Componentes:** confirmação contextual/Dialog M3, Progress/feedback,
  Snackbar (`flows/01-hiring.md`).
- **Entidades:** cria `DigitalEmployee` (status inicial `Contratado` →
  `Preparando`).
- **API:** `POST /companies/:companyId/digital-employees { employeeTypeId }`
  — idempotente via chave de idempotência; **rejeita** (400/409) uma
  tentativa de contratar um `employeeTypeId` com `availability =
  coming_soon`, como salvaguarda de backend além da UI já não oferecer o
  CTA.
- **Contrato de resposta:** `DigitalEmployee` criado + próximo passo
  (reaproveitado por US05).
- **Estados:** loading, erro de contratação (incluindo "funcionário ainda
  não disponível"), contratação concluída.
- **Riscos:** duplo submit sem idempotência geraria dois funcionários
  iguais — mitigado pelo contrato acima.
- **Product Ready:** Sim. **Design Ready:** Sim. **Tech Ready:** Sim.

## 5. US04 — Visualizar funcionário contratado

- **Dependências:** US03.
- **Componentes:** Employee Card em Minha Equipe (mesma base de
  US53/US54) — Employee **Status**, não Catalog Availability (conceitos
  agora explicitamente separados, `09-product-patterns.md`).
- **Entidades:** `DigitalEmployee` (leitura, com `status`).
- **API:** `GET /companies/:companyId/digital-employees` (mesma de US53).
- **Estados:** populado; nenhum estado extra além dos já cobertos por
  US53/US54.
- **Product Ready:** Sim. **Design Ready:** Sim. **Tech Ready:** Sim.

## 6. US05 — Identificar próximo passo

- **Dependências:** US03/US04.
- **Componentes:** lógica de apresentação que mapeia
  `DigitalEmployee.status` → CTA (`09-product-patterns.md` §2 +
  `flows/01-hiring.md`).
- **Contrato:** para Sprint 01, mapeamento necessário é
  `Contratado/Preparando → "Preparar funcionário"`. Implementar como
  tabela de mapeamento extensível (não `if/else` pontual), pois os demais
  status (Pronto, Trabalhando, Pausado, Precisa de atenção, Desativado)
  precisarão de CTA própria a partir da Sprint 03.
- **Riscos:** nenhum.
- **Product Ready:** Sim. **Design Ready:** Sim. **Tech Ready:** Sim.

## 7. US06 — Iniciar preparação (escopo confirmado)

- **Dependências:** US03 (funcionário contratado existente).
- **Escopo confirmado por Murilo (PO):**
  > Funcionário contratado → CTA "Preparar funcionário" → Entrar na
  > preparação → Visualizar visão geral → Visualizar estrutura de seções →
  > Visualizar estado inicial/incompleto → Entender próximo passo
  Não inclui preencher nenhuma seção (US07–US15, Sprint 02). Fora do
  escopo: editar dados da empresa; cadastrar produtos/serviços; definir
  responsabilidades, regras, limites ou autonomia; informar responsáveis;
  configurar comunicação/recursos; revisão final do Manual de Trabalho.
- **Componentes:** Home da preparação (`flows/02-preparation.md`) —
  progresso, seções, estado de cada seção, próximo item recomendado.
- **Entidades:** cria `WorkManual` vazio associado ao `DigitalEmployee`
  (estado "não iniciado"/"em andamento").
- **API:** `POST /digital-employees/:id/work-manual` (idempotente) e
  `GET /digital-employees/:id/work-manual` (estado de cada seção).
- **Critérios de aceitação (reescritos na própria história):**
  - [ ] O gestor consegue iniciar a preparação a partir do funcionário
        contratado.
  - [ ] A tela inicial apresenta todas as seções previstas.
  - [ ] Cada seção apresenta estado inicial/incompleto.
  - [ ] O produto informa claramente qual é o próximo passo.
  - [ ] O gestor consegue navegar para a primeira etapa de preenchimento.
  - [ ] Nenhuma informação de US07–US15 precisa ser preenchida para
        concluir US06.
  - [ ] O funcionário permanece em estado Preparando.
- **Histórico:** anteriormente classificada "Tech Ready with caveats" pelo
  limite de escopo não confirmado — **caveat removido após confirmação
  explícita do PO**.
- **Riscos:** nenhum técnico relevante.
- **Product Ready:** Sim. **Design Ready:** Sim. **Tech Ready:** Sim.

## 8. US53 — Visualizar equipe

- **Dependências:** §0 (Company/User pré-provisionados).
- **Componentes:** lista de Employee Cards (Employee Status, não Catalog
  Availability), empty state (`12-status-and-states.md` §4).
- **Entidades:** `DigitalEmployee` (leitura, todos da empresa).
- **API:** `GET /companies/:companyId/digital-employees`.
- **Estados:** empty (CTA "Conhecer funcionários" → catálogo/US01),
  loading, populado.
- **Nota de não confusão (PD5):** esta tela mostra apenas funcionários já
  **contratados** (Employee Status) — nunca deve reaproveitar ou misturar
  com a lista de Catalog Availability do catálogo de contratação (US01).
- **Product Ready:** Sim. **Design Ready:** Sim. **Tech Ready:** Sim.

## 9. US54 — Visualizar status

- Mesma tela/API de US53; `DigitalEmployee.status` no mesmo payload.
  Employee Status badge sempre com texto (nunca só cor),
  `12-status-and-states.md` §2.
- **Product Ready:** Sim. **Design Ready:** Sim. **Tech Ready:** Sim.

## 10. Tabela final de readiness

| Story | Product Ready | Design Ready | Tech Ready | Observação |
|---|---|---|---|---|
| US01 | Sim | Sim | Sim | Catálogo com 5 tipos; Catalog Availability definida (PD5) |
| US02 | Sim | Sim | Sim | Detalhe dos 5 tipos; CTA só para Disponível |
| US03 | Sim | Sim | Sim | Backend rejeita contratação de `coming_soon` como salvaguarda |
| US04 | Sim | Sim | Sim | Reaproveita API de US53 |
| US05 | Sim | Sim | Sim | Mapeamento status→CTA extensível |
| US06 | Sim | Sim | Sim | Escopo confirmado pelo PO; caveat anterior removido |
| US53 | Sim | Sim | Sim | Não confundir com catálogo (US01) |
| US54 | Sim | Sim | Sim | Reaproveita tela/API de US53 |

**Todas as 8 histórias da Sprint 01 estão Product Ready + Design Ready +
Tech Ready.** Nenhuma está "Tech Ready with caveats" ou "Not Tech Ready".

## 11. Verificação específica — Engenharia não precisa inventar requisitos

- **US01:** catálogo com 5 funcionários; 1 Disponível (Atendimento), 4 Em
  breve. ✅ coberto por PD5 + `09-product-patterns.md` §1.1.
- **US02:** os 5 têm detalhe visualizável; apenas Atendimento tem CTA de
  contratação. ✅ coberto.
- **US03:** só é possível contratar Braço Atendimento (UI não oferece CTA
  para os demais; backend rejeita como salvaguarda). ✅ coberto.
- **US04:** após contratação, Atendimento aparece em Minha Equipe. ✅
  coberto (API de US53/US04 compartilhada).
- **US05:** próximo passo = "Preparar funcionário". ✅ coberto.
- **US06:** abre overview da preparação; não preenche conteúdo. ✅
  coberto pelo escopo confirmado.
- **US53:** Minha Equipe mostra funcionários já contratados — distinto do
  catálogo. ✅ coberto.
- **US54:** status operacional claramente visível (texto + reforço visual,
  nunca só cor). ✅ coberto.

## 12. Remaining blockers (reais)

**Nenhum.** PD5 (único item que bloqueava o início de US01) está
**RESOLVED**. PD1 está **RESOLVED** (onboarding manual cobre o
pré-requisito §0). PD3 é gate para a **Sprint 03**, não para a Sprint 01.
PD2 e PD4 não afetam a Sprint 01 (WhatsApp/Tasks entram nas Sprints 03+).

## 13. O que precisa existir tecnicamente antes da primeira linha de código de produto

1. Schema mínimo: `Company`, `User`, `CompanyMembership`, `EmployeeType`
   (seed com os 5 tipos + `availability`), `DigitalEmployee`, `WorkManual`
   (vazio/placeholder).
2. Autenticação + tenant context + RBAC básico (`04-multi-tenancy.md`).
3. API Gateway com as rotas listadas acima.
4. Frontend: tema M3 base (cores/tipografia/shape) e navegação responsiva
   (`13-frontend-m3-implementation.md`), incluindo o padrão Catalog
   Availability (badge "Em breve") do Employee Card.
5. Seed de dados: empresa + usuário Owner (cobre PD1/onboarding manual) e
   os 5 `EmployeeType` com `availability` correta (cobre PD5).

## 14. Recomendação

> **SPRINT 01 READY FOR DEVELOPMENT**

Todas as 8 histórias estão Product Ready + Design Ready + Tech Ready. A
implementação em código, entretanto, só deve começar mediante autorização
explícita em um próximo prompt, conforme instruído.
