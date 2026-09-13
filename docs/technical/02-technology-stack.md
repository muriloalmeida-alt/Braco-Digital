# BRAÇO — Stack Tecnológica

**Critérios de decisão:** velocidade de desenvolvimento, baixo custo inicial,
equipe pequena, manutenção, segurança, escalabilidade, ecossistema,
facilidade de integração (WhatsApp, Google, LLM).

## 1. Resumo da recomendação

| Camada | Escolha recomendada | Necessária agora? |
|---|---|---|
| Linguagem | TypeScript (front e back) | Sim |
| Backend | Node.js + NestJS | Sim |
| Frontend | React + Vite (SPA) | Sim |
| Design system | Material Web Components (M3) + camada de tema BRAÇO | Sim |
| Banco de dados | PostgreSQL (gerenciado) | Sim |
| Cache/Fila | Redis + BullMQ | Sim |
| Storage de arquivos | S3-compatível (Cloudflare R2) | Sim (mídia do WhatsApp) |
| Auth | Auth.js/próprio sobre Postgres, com RBAC próprio | Sim |
| LLM | Claude (Anthropic API) via camada de abstração própria | Sim |
| WhatsApp | BSP (ex.: 360dialog/Twilio) sobre WhatsApp Cloud API | Sim |
| Observabilidade | OpenTelemetry + Sentry + Grafana Cloud/Axiom | Sim (mínimo viável) |
| Infra | Docker + PaaS (Fly.io/Render) ou AWS ECS Fargate | Decisão pode ser adiada |
| IaC (Terraform) | — | **Adiar** até 2º ambiente gerenciado à mão ficar doloroso |
| Filas distribuídas (Kafka/SNS+SQS) | — | **Adiar** |
| Microserviços | — | **Adiar** |
| Mobile nativo | — | **Adiar** (responsivo web cobre o MVP, ver `13-frontend-m3-implementation.md`) |
| Vetor DB / RAG | — | **Adiar** (ver `09-ai-llm.md`) |

## 2. Por que Node.js + TypeScript

- Um único idioma para front e back reduz custo de contexto em equipe
  pequena.
- Ecossistema maduro para as três integrações críticas do MVP: SDKs oficiais
  e comunitários para WhatsApp Cloud API, `googleapis` (Calendar/Tasks) e
  Anthropic SDK.
- NestJS fornece estrutura modular (módulos, providers, guards) que mapeia bem
  para a separação App Service / Runtime Service / Integration Hub sem forçar
  microserviços desde o início.
- Alternativas consideradas: Python (ótimo para IA, mas ecossistema web/
  integração ligeiramente mais fragmentado para este perfil de produto) e
  Go (excelente performance, mas maior custo de velocidade inicial para
  equipe pequena fazendo muito CRUD). TypeScript full-stack maximiza
  velocidade sem comprometer qualidade para o estágio atual.

## 3. Frontend

React + TypeScript, Vite. SSR não é necessário no MVP (produto autenticado,
sem necessidade de SEO); pode ser adotado depois com Next.js se necessário
para performance de carregamento inicial — **decisão adiável**.

Design system: ver `13-frontend-m3-implementation.md` para a análise
completa de bibliotecas M3 e a estratégia recomendada (Material Web
Components + tokens BRAÇO, com fallback de primitivos acessíveis para
padrões adaptativos que a lib M3 ainda não cobre bem).

## 4. Backend

NestJS sobre Node.js (Fastify como adapter HTTP, por performance). Módulos
propostos: `auth`, `tenancy`, `companies`, `employees`, `work-manual`,
`whatsapp`, `conversations`, `scheduling`, `tasks`, `handoff`, `alerts`,
`metrics`, `integrations`, `runtime` (o motor de decisão do funcionário
digital).

ORM: Prisma. Motivo: migrations declarativas, type-safety de ponta a ponta
com TypeScript, boa relação produtividade/controle para o time pequeno.
Alternativa considerada: Drizzle (mais leve, SQL-first) — viável, mas Prisma
tem melhor ergonomia para migrations em equipe pequena sem DBA dedicado.
Reversível: a camada de repositório deve isolar Prisma do domínio para não
travar uma troca futura.

## 5. Banco de dados

PostgreSQL gerenciado (ex.: RDS, Neon, Supabase Postgres ou Cloud SQL).
Motivos:
- suporta bem o modelo relacional do domínio (empresas, funcionários,
  regras, conversas) com integridade referencial forte;
- Row-Level Security nativo é a base da estratégia de multi-tenancy (ver
  `04-multi-tenancy.md`);
- JSONB permite guardar estruturas semi-flexíveis do Manual de Trabalho sem
  exigir um banco documental separado.

Não recomendado agora: banco de grafo, vetor DB dedicado, ou
multi-banco (Postgres + Mongo). Nenhum requisito do MVP justifica essa
complexidade.

## 6. Cache e filas

Redis cobre dois papéis no início: cache de leitura (ex.: disponibilidade de
agenda consultada com frequência) e broker de filas via BullMQ (jobs:
envio de mensagem, execução de follow-up, renovação de webhook do Calendar,
recalculo de indicadores). Separar em duas instâncias Redis é uma
**decisão adiável** — só necessária quando o volume de jobs afetar a
latência de cache ou vice-versa.

## 7. LLM

Anthropic Claude via API oficial, atrás de uma camada de abstração própria
(`LLMProvider`) que não vaza detalhes do provedor para o domínio — ver
`09-ai-llm.md`. Isso é decisão técnica reversível: trocar de modelo/provedor
não deve exigir mudança em nenhum módulo de domínio.

## 8. Autenticação

Recomendação: implementação própria mínima (e-mail+senha com hash Argon2,
sessão via JWT de curta duração + refresh token) mais OAuth do Google
reaproveitado — o mesmo fluxo OAuth usado para conectar Calendar/Tasks pode,
opcionalmente, servir de login social. Evitar dependência total de um
provedor de auth gerenciado de terceiros (Clerk/Auth0) não é obrigatório,
mas é uma **decisão adiável**: começar com solução própria simples é mais
barato e suficiente para RBAC por empresa; migrar para um provedor gerenciado
depois é possível sem reescrever o domínio, desde que a fronteira
`AuthProvider` seja respeitada desde o início.

## 9. Observabilidade mínima viável

Sentry (erros), OpenTelemetry (traces/métricas) exportando para um backend
gerenciado de baixo custo (Grafana Cloud free tier, Axiom ou Better Stack).
Ver `11-observability.md`.

## 10. O que fica fora do MVP por decisão de custo/complexidade

- Kubernetes — desnecessário no volume esperado; PaaS/ECS Fargate resolve.
- Service mesh — não há microserviços suficientes para justificar.
- Data warehouse dedicado — métricas do MVP são bem servidas por tabelas de
  agregação no próprio Postgres; considerar depois (ex.: ClickHouse) apenas
  se o volume de eventos de trabalho crescer muito.
- Feature flag service dedicado — usar flags simples em configuração até
  haver necessidade de experimentação sofisticada.
