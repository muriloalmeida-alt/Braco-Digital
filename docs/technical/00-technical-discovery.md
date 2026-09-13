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

## 10. Sprint 01 Readiness

Ver `14-sprint-01-tech-readiness.md`. **US01, US02, US03, US04, US05, US53,
US54: Tech Ready. US06: Tech Ready with caveats** (limite de escopo da
história — "iniciar" vs. "preencher" a preparação — precisa de confirmação
rápida do PM, não é bloqueio técnico). **Nenhuma história está Not Tech
Ready.** O que precisa existir antes da primeira linha de código de produto
está listado em `14-sprint-01-tech-readiness.md` §11 (schema mínimo, auth/
tenant/RBAC, tema M3 base, dados seed).

## 11. Risks

Ver `15-technical-risks.md`. Críticos: vazamento entre tenants (R1),
LLM agindo fora dos limites configurados (R2), janela de 24h do WhatsApp
quebrando follow-up (R3) — todos com mitigação arquitetural desenhada,
nenhum bloqueia a Sprint 01.

## 12. Product Decisions Required

Ver `16-product-decisions-required.md` — resumo:

| # | Decisão | Bloqueia Sprint 01? | Bloqueia lançamento real? |
|---|---|---|---|
| PD1 | Não existe fluxo de criação de conta/empresa no backlog | Não (seed) | **Sim** |
| PD2 | Janela de 24h do WhatsApp limita follow-up/lembrete proativo | Não (WhatsApp só entra na Sprint 03) | Sim, para E06 |
| PD3 | Retenção/exclusão de dados de cliente final (LGPD) | Não | Sim, antes de dados reais de cliente |
| PD4 | Google Tasks sem campo customizado — confirmar que gestor nunca precisa abrir o Google Tasks diretamente | Não | Baixo risco, só confirmação |
| PD5 | Catálogo da Sprint 01: só Atendimento ou 5 tipos com bloqueio | **Sim, antes de codar US01** | — |

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

**Decisões que precisam voltar para Produto/Design:** as cinco listadas na
seção 12 (PD1–PD5), com destaque para PD5 (bloqueia o início de US01) e PD1
(não bloqueia a Sprint 01, mas bloqueia qualquer lançamento real).

**A Sprint 01 está tecnicamente pronta?** Sim — 7 de 8 histórias Tech
Ready, 1 (US06) Tech Ready with caveats por um ponto de escopo a confirmar
com o PM, não por limitação técnica.

**O que precisa ser resolvido antes da primeira linha de código:**
1. PD5 (catálogo da Sprint 01 — decisão rápida);
2. Fundação técnica: schema multi-tenant mínimo, auth/RBAC, testes de
   isolamento de tenant, tema M3 base;
3. Confirmação do caveat de escopo de US06 com o PM.

Nenhum outro item bloqueia o início do desenvolvimento da Sprint 01.

---

**Este documento aguarda aprovação de Murilo (PO/Sponsor) antes de
qualquer início de implementação, conforme solicitado.**
