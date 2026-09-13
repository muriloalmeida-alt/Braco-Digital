# BRAÇO — Product Decisions Required

Itens em que a Technical Discovery encontrou requisito inviável, limitado
por API externa, conflitante ou tecnicamente inconsistente. Nenhum foi
alterado silenciosamente. Cada um segue o formato: requisito atual →
problema → impacto → alternativas → recomendação de Engenharia → decisão
necessária.

**Status geral (após decisão de Murilo/PO):**

| # | Decisão | Status | Bloqueia Sprint 01? |
|---|---|---|---|
| PD1 | Registro e Onboarding de Conta | **RESOLVED** | Não |
| PD2 | WhatsApp: Follow-up e Templates | **RESOLVED** | Não |
| PD3 | Retenção, Exclusão e LGPD | **PENDING LEGAL VALIDATION** | **Não** (gate é antes da Sprint 03) |
| PD4 | Google Tasks | **RESOLVED** | Não |
| PD5 | Catálogo de Funcionários | **RESOLVED** | Não (já aplicada) |

O histórico completo de cada decisão (problema original → alternativas →
recomendação → decisão tomada) é mantido abaixo — nada foi apagado.

---

## PD1 — Registro e Onboarding de Conta — **RESOLVED**

**Requisito atual (histórico):** o backlog (76 histórias, 10 épicos) e
`docs/05-customer-journey.md` começam a jornada em "Contratar" — nenhuma
história cobre cadastro de empresa, criação do primeiro usuário Owner ou
onboarding inicial.

**Problema (histórico):** tecnicamente, toda história de Sprint 01
pressupõe uma `Company` e um `User` autenticado existentes. Sem uma
história/fluxo aprovado para esse passo, Engenharia teria que inventar essa
experiência sem gate de Design.

**Impacto (histórico):** não bloqueia o desenvolvimento da Sprint 01
(Engenharia pode usar empresa/usuário via seed de demonstração), mas
bloqueia qualquer lançamento real a clientes.

**Alternativas avaliadas:**
1. PM cria um épico/histórias formais de "Registro e Onboarding de Conta"
   antes da Sprint 02 ou 03.
2. Tratar como responsabilidade operacional manual no curtíssimo prazo
   (equipe BRAÇO provisiona a empresa manualmente para os primeiros
   clientes piloto), adiando o fluxo self-service.

**Recomendação de Engenharia:** opção 2 para viabilizar os primeiros
clientes piloto mais rápido, com opção 1 planejada explicitamente para
antes de qualquer lançamento self-service.

**Decisão tomada (Murilo/PO, registrada em `docs/11-decision-log.md`):**
- Sprints 01–06 operam com **onboarding manual/provisionado pela equipe
  BRAÇO** — sem criação self-service de conta/empresa.
- Empresa e primeiro usuário Owner provisionados administrativamente;
  Engenharia usa seed/admin tooling apropriado.
- Fluxo self-service formalizado futuramente como **PRD 03 — Registro e
  Onboarding** / **E11 — Registro e Onboarding**, planejamento inicial em
  **Sprint 07**, obrigatório antes de lançamento público/self-service.

**Arquivos atualizados:** `docs/11-decision-log.md`,
`docs/05-customer-journey.md`, `docs/06-mvp.md`,
`docs/10-product-roadmap.md`, `docs/delivery/backlog.md`.

---

## PD2 — WhatsApp: Follow-up e Templates — **RESOLVED**

**Requisito atual (histórico):** PRD 01 prevê explicitamente follow-up,
recuperação de oportunidade perdida e lembretes proativos (seções 8, 11;
épico E06).

**Problema (histórico):** a política do WhatsApp Business Platform só
permite iniciar uma nova mensagem fora da janela de 24h desde a última
mensagem do cliente usando **templates pré-aprovados pela Meta** — texto
fixo, com variáveis limitadas, sujeito a aprovação prévia (dias) e a
rejeição.

**Impacto (histórico):** direto na Sprint 05 (E06) e em qualquer lembrete
espontâneo fora da janela ativa.

**Alternativas avaliadas:**
1. Catalogar os tipos de follow-up/lembrete e submetê-los como templates
   aprovados na Meta/BSP com antecedência.
2. Restringir follow-up proativo a variáveis dentro de um template
   aprovado, em vez de texto livre gerado pelo LLM.
3. Aceitar que follow-up proativo fora da janela simplesmente não ocorra no
   MVP (reduz escopo de E06).

**Recomendação de Engenharia:** opção 1 combinada com 2.

**Decisão tomada (Murilo/PO):**
- Aprovada a submissão antecipada de templates oficiais. Mensagens
  proativas fora da janela nunca são texto livre gerado pelo LLM.
- MVP com **5 intenções de template**: (1) Follow-up de interesse,
  (2) Agendamento incompleto, (3) Lembrete de agendamento,
  (4) Reagendamento, (5) Recuperação de oportunidade.
- Conteúdo final **Design Ready até o fim da Sprint 02**; submissão à
  Meta/BSP **antes do início da Sprint 03**. E06 permanece na Sprint 05;
  follow-up proativo fora da janela fica condicionado ao template aprovado
  aplicável.

**Atualização (Patch 03 — Product Design):** conteúdo v1 completo
formalizado antecipadamente em `docs/design/19-whatsapp-template-library.md`
— texto, variáveis, transparência digital, regra de dados sensíveis
(vertical clínicas), fallback, guardrails de contato do MVP, estados de
envio e opt-out. Templates inicialmente **body-only** (sem botões/quick
reply/link). Status atualizado: **Content Design Ready**. Isso não
significa aprovado pela Meta/BSP — submissão e aprovação externa
permanecem pendentes, como próximo passo antes da Sprint 03.

**Arquivos atualizados:** `docs/11-decision-log.md`,
`docs/prd/01-braco-atendimento.md`,
`docs/delivery/epics/E06-follow-up-e-recuperacao/epic.md`, US40–US45,
`docs/delivery/sprints/sprint-05.md`, `docs/design/flows/06-follow-up.md`,
`docs/design/13-content-design.md`, `docs/design/19-whatsapp-template-
library.md` (novo), `docs/technical/05-whatsapp.md`,
`docs/technical/08-digital-employee-runtime.md`,
`docs/technical/09-ai-llm.md`, `docs/technical/03-data-model.md`.

---

## PD3 — Retenção e exclusão de dados de conversa do cliente final (LGPD) — **PENDING LEGAL VALIDATION**

**Requisito atual (histórico):** nenhum documento de produto definia por
quanto tempo conversas, dados de agendamento e histórico de atendimento do
cliente final deveriam ser retidos, nem o que acontece a esses dados quando
uma empresa cancela o BRAÇO.

**Problema (histórico):** decisão de negócio/compliance que a arquitetura
precisa implementar de qualquer forma.

**Impacto (histórico):** médio-alto a partir da Sprint 03 (dados reais de
clientes finais).

**Alternativas avaliadas:**
1. Retenção indefinida até solicitação de exclusão.
2. Retenção por período fixo configurável (ex.: 24 meses) com exclusão
   automática programada.
3. Retenção diferenciada por tipo de dado.

**Recomendação de Engenharia:** opção 3, com período inicial conservador
definido em conjunto com jurídico/PM.

**Decisão tomada (Murilo/PO) — direção de produto definida, valor final
pendente de validação jurídica:**
- Sem retenção indefinida como padrão; sem número arbitrário (ex.: 24
  meses) adotado agora.
- Arquitetura deve suportar: políticas configuráveis de retenção; exclusão
  sob demanda; exclusão associada ao encerramento de uma empresa cliente;
  retenção diferenciada por categoria de dado; conservação restrita quando
  houver obrigação legal legítima.
- **Gate: período definitivo por categoria exige validação jurídica antes
  do início da Sprint 03.** Nenhum dado real de cliente final entra em
  produção antes desse gate.
- Novo documento: `docs/13-data-privacy-and-retention.md` (Status: Pending
  Legal Validation), com a tabela de categorias/retenção/exclusão/exceções.

**Não bloqueia Sprint 01.** É gate para Sprint 03 / uso de dados reais.

**Arquivos atualizados/criados:** `docs/13-data-privacy-and-retention.md`
(novo), `docs/11-decision-log.md`, `docs/12-development-governance.md`,
`docs/prd/01-braco-atendimento.md`, `docs/prd/02-plataforma-gerencial.md`,
`docs/technical/03-data-model.md`, `docs/technical/10-security-lgpd.md`,
`docs/technical/12-infrastructure.md`.

---

## PD4 — Google Tasks não suporta campos customizados (vínculo cliente/atendimento) — **RESOLVED**

**Requisito atual (histórico):** PRD e histórias (E08, E06) pressupõem
visibilidade de tarefas vinculadas a cliente/atendimento na interface do
BRAÇO.

**Problema (histórico):** a API do Google Tasks não permite anexar
metadados estruturados a uma tarefa nativa do Google.

**Impacto (histórico):** baixo, condicionado à confirmação de que a
experiência gerencial nunca dependeria do Google Tasks nativo.

**Alternativas avaliadas:** nenhuma alternativa técnica resolve a
limitação da API; a única alternativa era de produto — confirmar o uso do
Google Tasks apenas como motor de persistência/lembrete.

**Recomendação de Engenharia:** confirmar por escrito o pressuposto no
PRD/Design.

**Decisão tomada (Murilo/PO):**
- Confirmado: toda a experiência de gestão de tarefas acontece dentro do
  BRAÇO. Google Tasks é recurso operacional integrado, não superfície de
  gestão. O produto não garante contexto estruturado do BRAÇO ao abrir o
  Google Tasks diretamente.
- Princípio: **o gestor configura e acompanha no BRAÇO; as integrações
  trabalham nos bastidores.**

**Arquivos atualizados:** `docs/11-decision-log.md`,
`docs/prd/02-plataforma-gerencial.md`, `docs/02-product-brief.md`,
`docs/design/10-information-architecture.md`,
`docs/delivery/epics/E06-follow-up-e-recuperacao/epic.md`.

---

## PD5 — Catálogo de funcionários na Sprint 01 — **RESOLVED**

**Requisito atual (histórico):** `docs/04-employee-catalog.md` já descreve
5 funcionários; `docs/06-mvp.md` limita o MVP a Braço Atendimento.

**Problema (histórico):** o fluxo de contratação não especificava se o
catálogo da Sprint 01 deveria exibir só o funcionário disponível ou os 5
com 4 marcados como indisponíveis.

**Impacto (histórico):** baixo — decisão de conteúdo/apresentação, não
estrutural. **Bloqueava o início de US01** até ser resolvida.

**Alternativas avaliadas:** (a) só Atendimento; (b) os 5, com 4 bloqueados/
"em breve".

**Recomendação de Engenharia:** (b), condicionada a Design definir o
estado "bloqueado" do Employee Card.

**Decisão tomada (Murilo/PO):**
- A Sprint 01 exibe os **5 funcionários** do portfólio no catálogo.
- Braço Atendimento → **Disponível** (único contratável). Vendas,
  Orçamentos, Pós-venda, Financeiro → **Em breve**.
- **"Em breve" não é Employee Status** — é um conceito novo e separado,
  **Catalog Availability** (Disponível/Em breve), documentado em
  `docs/design/09-product-patterns.md` §1.1.
- Employee Card "Em breve": conteúdo legível, sem redução de opacity, sem
  botão quebrado; label/badge M3 "Em breve"; acesso ao detalhe; nenhum CTA
  de contratação.
- Página de detalhe "Em breve": mostra missão, responsabilidades e
  resultado esperado normalmente, mais mensagem objetiva de
  indisponibilidade. Sem lista de espera/"Avise-me" nesta fase (exigiria
  histórias próprias).
- **Aplicada antes do início de US01/US02/US03** (já refletida nas
  histórias e nos documentos de Design).

**Atualização (Patch 03 — Product Design):** especificação visual completa
e aprovada em `docs/design/18-catalog-availability-ui-spec.md` — anatomia
do card, wireframes (Disponível/Em breve), hierarquia tipográfica M3,
página de detalhe, responsividade (Compact/Medium/Expanded), estados de
interação/loading/error e critérios de aceite visual. Princípio
confirmado: **"Em breve é informação, não incapacidade da interface"** —
sem opacity reduzida, sem botão desabilitado, sem lock icon. Fecha
definitivamente o detalhamento visual de US01/US02/US03 (nenhuma pendência
de mockup restante).

**Arquivos atualizados:** `docs/11-decision-log.md`,
`docs/04-employee-catalog.md`, `docs/06-mvp.md`,
`docs/design/09-product-patterns.md`, `docs/design/flows/01-hiring.md`,
`docs/design/18-catalog-availability-ui-spec.md` (novo), US01, US02, US03,
`docs/delivery/sprints/sprint-01.md`,
`docs/technical/13-frontend-m3-implementation.md`,
`docs/technical/14-sprint-01-tech-readiness.md`.

---

## Item relacionado — US06 (escopo, não uma Product Decision formal)

**Interpretação de Engenharia:** US06 (Iniciar preparação) cobre apenas
entrar na preparação e ver a estrutura de seções vazias — não preencher
nenhuma seção (isso é US07–US15, Sprint 02).

**Confirmado por Murilo/PO.** Critérios de aceitação de US06 reescritos.
Após atualização documental: **Product Ready: Sim / Design Ready: Sim.**

**Arquivos atualizados:**
`docs/delivery/epics/E02-preparacao-do-funcionario/US06-iniciar-preparacao.md`,
`docs/delivery/epics/E02-preparacao-do-funcionario/epic.md`,
`docs/design/flows/02-preparation.md`,
`docs/delivery/sprints/sprint-01.md`,
`docs/delivery/sprints/sprint-02.md`.
