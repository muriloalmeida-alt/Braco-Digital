# BRAÇO — Technical Discovery v1

**Autor:** Claude (Engineering / Development)
**Status:** Aguardando aprovação de Murilo (PO/Sponsor) e alinhamento com
GPT (PM/Product Designer) nos itens de `16-product-decisions-required.md`.
**Escopo:** PRD 01 (Braço Atendimento), PRD 02 (Plataforma Gerencial), MVP,
Sprint 01 e visão de próximas Sprints/futuros Braços.
**Regra seguida:** nenhuma decisão de produto ou de design foi alterada
silenciosamente. Conflitos e limitações estão em
`16-product-decisions-required.md`.

Este documento é o índice e resumo executivo dos 17 documentos técnicos em
`docs/technical/`. Não implementa código — é o produto da etapa de
Technical Discovery solicitada.

## Atualização v1.1 — Product Decisions resolvidas

Murilo (PO) decidiu PD1–PD5 (`16-product-decisions-required.md`):
**PD1 RESOLVED, PD2 RESOLVED, PD3 PENDING LEGAL VALIDATION (gate antes da
Sprint 03, não bloqueia Sprint 01), PD4 RESOLVED, PD5 RESOLVED.** O escopo
de US06 foi confirmado. Como resultado, **as 8 histórias da Sprint 01 estão
agora Product Ready + Design Ready + Tech Ready** — ver
`14-sprint-01-tech-readiness.md` (v2) e `docs/11-decision-log.md`. O
conteúdo original desta Discovery (v1) permanece abaixo como histórico;
apenas as seções 10 e 12 foram atualizadas para refletir o novo status.

## 1. Executive Summary

BRAÇO é tecnicamente viável com uma arquitetura deliberadamente simples para
o estágio atual: monólito modular multi-tenant, um LLM (Claude) usado como
componente de linguagem dentro de um runtime de decisão determinístico (não
como agente autônomo), e três integrações externas (WhatsApp, Google
Calendar, Google Tasks) isoladas atrás de adaptadores trocáveis. As 8
histórias da Sprint 01 estão tecnicamente prontas para desenvolvimento. O
maior risco não é técnico, é de gap de escopo de produto: não existe hoje um
fluxo aprovado de criação de conta/empresa em nenhum dos 76 User Stories —
resolvido para a Sprint 01 via dado seed, mas bloqueante para lançamento
real (ver seção 12).

## 2. Recommended Architecture

Ver `01-architecture.md`. Três planos lógicos — gerencial (App Service),
atendimento (Runtime Service) e integrações (Integration Hub) — hoje como
módulos de um único deployável, com fronteiras de código que permitem
separá-los em serviços independentes quando o volume justificar. Banco
único (PostgreSQL) com isolamento por `company_id` + Row-Level Security.
Filas (Redis/BullMQ) absorvem tudo que é assíncrono ou depende de terceiro
(mensageria, agenda, tarefas), para que uma falha externa nunca trave a
experiência do gestor.

## 3. Stack

Ver `02-technology-stack.md`. TypeScript full-stack (NestJS + React),
PostgreSQL, Redis, Anthropic Claude, BSP de WhatsApp sobre Cloud API,
Material Web Components para o frontend M3. Deliberadamente **sem**
Kubernetes, sem microserviços, sem RAG/vetor DB, sem IaC formal e sem
multi-região neste estágio — cada uma dessas é uma decisão adiável
documentada, não esquecida.

## 4. Data Model

Ver `03-data-model.md`. Vinte e duas entidades conceituais organizadas em
torno de `Company` (raiz do tenant), `DigitalEmployee` + `WorkManual`
(o núcleo do produto), e `Attendance`/`Message`/`Appointment`/`Task`/
`FollowUp`/`Handoff`/`Intervention` (o ciclo de trabalho). `WorkEvent`
(append-only) é a espinha dorsal de auditoria e observabilidade. "Métrica"
é deliberadamente **derivada** por agregação, não uma entidade editável.

## 5. Integrations

- **WhatsApp** (`05-whatsapp.md`): BSP no MVP, webhook único +
  processamento assíncrono, idempotência por `whatsapp_message_id`. Limite
  real de plataforma: janela de 24h para mensagem livre — impacta follow-up
  (ver PD2).
- **Google Calendar** (`06-google-calendar.md`): OAuth por empresa, push
  notification + polling de reconciliação, revalidação de disponibilidade
  imediatamente antes de confirmar para minimizar (não eliminar) conflito.
- **Google Tasks** (`07-google-tasks.md`): mesmo OAuth do Calendar; sem
  webhook nativo (limitação de plataforma) ⇒ polling; sem campo customizado
  nativo ⇒ vínculo com cliente/atendimento vive só no BRAÇO (ver PD4).

## 6. Digital Employee Runtime

Ver `08-digital-employee-runtime.md`. O ponto arquitetural mais importante
desta Discovery: o LLM **propõe**, um **Policy Engine determinístico**
**decide** com base em `AutonomyPolicy`/`Rule`/`Limit` vindos do banco — o
modelo nunca é a autoridade final sobre agir ou escalar. Isso é o que
transforma "funcionário digital" de metáfora de marketing em garantia de
engenharia: o funcionário literalmente não consegue, em código, ultrapassar
os limites configurados pelo gestor.

## 7. AI Architecture

Ver `09-ai-llm.md`. Claude via API oficial, atrás de abstração própria
(`LLMProvider`), tool/function calling validado por schema, sem RAG no MVP
(o Manual de Trabalho cabe em contexto), memória operacional em Postgres
estruturado (não vetorial), guardrails em duas camadas (prompt + Policy
Engine determinístico), custo e latência registrados por chamada.

## 8. Security

Ver `10-security-lgpd.md`. RBAC por papel dentro da empresa, isolamento de
tenant como requisito de segurança de primeira classe (testado no CI),
criptografia de credenciais de integração via KMS, PII nunca em log técnico,
auditoria via `WorkEvent`. Retenção/exclusão de dados de cliente final ainda
sem decisão de produto (PD3).

## 9. Frontend/M3 Strategy

Ver `13-frontend-m3-implementation.md`. Nenhuma decisão de UX é alterada.
Material Web Components como base de componentes (fidelidade real ao M3,
não um sistema paralelo), tema gerado a partir das seeds de cor definidas
pelo Design via algoritmo oficial do Material, Container Queries para os
padrões adaptativos (Compact/Medium/Expanded), acessibilidade verificada
automaticamente no CI (axe-core), nunca status comunicado só por cor.

## 10. Sprint 01 Readiness (atualizado — v1.1)

Ver `14-sprint-01-tech-readiness.md` (v2). Após a resolução de PD1–PD5 e a
confirmação do escopo de US06 por Murilo (PO): **as 8 histórias (US01,
US02, US03, US04, US05, US06, US53, US54) estão Product Ready + Design
Ready + Tech Ready.** O caveat anterior de US06 foi removido após
confirmação explícita do PO. O que precisa existir antes da primeira linha
de código de produto está listado em `14-sprint-01-tech-readiness.md` §13
(schema mínimo com os 5 `EmployeeType` + `availability`, auth/tenant/RBAC,
tema M3 base incluindo o padrão Catalog Availability, dados seed cobrindo
onboarding manual — PD1).

*(Histórico v1, antes da resolução: 7 de 8 histórias Tech Ready, US06 Tech
Ready with caveats por um ponto de escopo pendente de confirmação com o
PM.)*

## 11. Risks

Ver `15-technical-risks.md`. Críticos: vazamento entre tenants (R1),
LLM agindo fora dos limites configurados (R2), janela de 24h do WhatsApp
quebrando follow-up (R3) — todos com mitigação arquitetural desenhada,
nenhum bloqueia a Sprint 01.

## 12. Product Decisions Required (atualizado — v1.1: todas decididas)

Ver `16-product-decisions-required.md` — resumo pós-decisão de Murilo (PO):

| # | Decisão | Status | Bloqueia Sprint 01? |
|---|---|---|---|
| PD1 | Registro e Onboarding de Conta | **RESOLVED** — onboarding manual nas Sprints 01–06; self-service vira PRD 03/E11 (Sprint 07) | Não |
| PD2 | WhatsApp: Follow-up e Templates | **RESOLVED** — 5 templates pré-aprovados, Design Ready fim da Sprint 02, submissão antes da Sprint 03 | Não |
| PD3 | Retenção, Exclusão e LGPD | **PENDING LEGAL VALIDATION** — direção de produto definida em `docs/13-data-privacy-and-retention.md`, valor final é gate antes da Sprint 03 | Não |
| PD4 | Google Tasks | **RESOLVED** — gestão de tarefas sempre dentro do BRAÇO | Não |
| PD5 | Catálogo de Funcionários | **RESOLVED** — 5 no catálogo, só Atendimento Disponível, demais Em breve (Catalog Availability) | Não (já aplicada) |

*(Histórico v1: PD5 bloqueava o início de US01 antes de decidida; PD1
bloqueava lançamento real; ambas resolvidas acima.)*

## 13. Technical Decisions

Ver `17-technical-decisions.md` — 10 decisões técnicas registradas (TD1–
TD10), todas com contexto, opções, justificativa, trade-offs,
reversibilidade e impacto futuro. Destaques: multi-tenancy por RLS (TD1),
monólito modular (TD2), LLM atrás de abstração própria (TD4), Runtime com
Policy Engine determinístico como consequência arquitetural de TD4+design
do Runtime.

## 14. Recommended Implementation Sequence

1. **Fundação (antes de qualquer feature):** schema mínimo multi-tenant,
   autenticação + RBAC, testes automatizados de isolamento de tenant (R1),
   tema M3 base (cores/tipografia/shape) e navegação responsiva.
2. **Decisão PD5** (catálogo Sprint 01) — bloqueia início de US01, é rápida
   de resolver.
3. **Sprint 01** (US01–US06, US53, US54) sobre a fundação acima, com dados
   seed cobrindo a lacuna de PD1.
4. **Em paralelo à Sprint 01/02:** PM formalizar decisão de PD1 (onboarding)
   antes de qualquer cliente piloto real acessar o produto.
5. **Antes da Sprint 05 (E06 — Follow-up):** resolver PD2 — submeter
   templates de WhatsApp para aprovação (lead time de dias, começar cedo).
6. **Antes de processar o primeiro dado real de cliente final (Sprint 03):**
   resolver PD3 (retenção/exclusão) e confirmar PD4.
7. **Runtime do funcionário digital** (`08-digital-employee-runtime.md`)
   entra a partir da Sprint 03 (Ativação + Atendimento) — Policy Engine e
   `WorkEvent` devem ser construídos junto com a primeira ativação real, não
   depois, pois são a garantia de segurança do produto.

---

## Índice dos documentos técnicos

| Arquivo | Conteúdo |
|---|---|
| `01-architecture.md` | Arquitetura geral, componentes, fluxo de dados, ambientes |
| `02-technology-stack.md` | Stack recomendada e o que fica fora do MVP |
| `03-data-model.md` | Modelo de dados conceitual, cardinalidade, ownership |
| `04-multi-tenancy.md` | Isolamento, tenant context, RBAC, riscos de vazamento |
| `05-whatsapp.md` | API oficial/BSP, webhooks, idempotência, limites |
| `06-google-calendar.md` | OAuth, disponibilidade, conflito, sync, falhas |
| `07-google-tasks.md` | OAuth, listas, vínculo com domínio, limitações |
| `08-digital-employee-runtime.md` | Arquitetura lógica do funcionário digital |
| `09-ai-llm.md` | Provider, tools, prompts, RAG, guardrails, custo |
| `10-security-lgpd.md` | Auth, RBAC, criptografia, PII, retenção, auditoria |
| `11-observability.md` | O que monitorar e por quê |
| `12-infrastructure.md` | Região, hospedagem, ambientes, deploy |
| `13-frontend-m3-implementation.md` | Implementação do Design System M3 |
| `14-sprint-01-tech-readiness.md` | Análise por história da Sprint 01 |
| `15-technical-risks.md` | Riscos técnicos consolidados |
| `16-product-decisions-required.md` | Decisões que voltam para Produto |
| `17-technical-decisions.md` | Decisões puramente técnicas |

---

## Resposta direta às perguntas de encerramento

**Arquitetura recomendada:** monólito modular multi-tenant (Node.js/
NestJS + React), PostgreSQL com RLS, Redis para fila/cache, LLM (Claude)
como componente de linguagem dentro de um Runtime com Policy Engine
determinístico, integrações via adaptadores trocáveis (BSP de WhatsApp,
Google Calendar, Google Tasks).

**Principais decisões técnicas:** multi-tenancy por RLS (TD1); monólito
modular em vez de microserviços (TD2); LLM atrás de abstração própria com
Policy Engine determinístico como autoridade de ação (TD4 +
`08-digital-employee-runtime.md`); WhatsApp via BSP no MVP (TD5); Material
Web Components como base do frontend M3 (TD7); auditoria de domínio via
`WorkEvent` append-only (TD8).

**Riscos críticos:** vazamento entre tenants (R1), LLM agindo fora dos
limites configurados (R2), janela de 24h do WhatsApp quebrando follow-up
proativo (R3) — todos com mitigação arquitetural definida nesta Discovery.

**Decisões que precisam voltar para Produto/Design (atualizado):** todas as
cinco (PD1–PD5) já foram decididas por Murilo (PO) — ver seção 12. Único
item ainda aberto: **PD3 aguarda validação jurídica** do período de
retenção por categoria (gate antes da Sprint 03, não bloqueia Sprint 01).

**A Sprint 01 está tecnicamente pronta? (atualizado)** Sim — **as 8
histórias estão Product Ready + Design Ready + Tech Ready** após a
resolução de PD1–PD5 e a confirmação do escopo de US06 pelo PO. Nenhuma
está mais "Tech Ready with caveats".

**O que precisa ser resolvido antes da primeira linha de código
(atualizado):**
1. Fundação técnica: schema multi-tenant mínimo (incluindo os 5
   `EmployeeType` com `availability`), auth/RBAC, testes de isolamento de
   tenant, tema M3 base (incluindo o padrão Catalog Availability);
2. Seed de dados cobrindo o onboarding manual (PD1: Company + Owner
   pré-provisionados).

Nenhum outro item bloqueia o início do desenvolvimento da Sprint 01.

---

**Este documento aguarda aprovação de Murilo (PO/Sponsor) antes de
qualquer início de implementação, conforme solicitado.**
