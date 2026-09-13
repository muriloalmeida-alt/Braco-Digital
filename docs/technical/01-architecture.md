# BRAÇO — Arquitetura Técnica

**Status:** Discovery — aguardando aprovação
**Autor:** Claude (Engineering)
**Baseado em:** `docs/00-master.md`, PRD 01, PRD 02, `docs/design/`

## 1. Visão geral

BRAÇO é um SaaS B2B multiempresa. Cada empresa cliente ("tenant") contrata um ou mais
funcionários digitais, prepara um Manual de Trabalho, ativa o funcionário e o
acompanha. O funcionário digital atende clientes finais pelo WhatsApp e usa
Google Calendar/Tasks como recursos operacionais.

Isso implica três planos de execução distintos, com requisitos diferentes:

| Plano | Quem usa | Padrão de carga | Latência aceitável |
|---|---|---|---|
| **Gerencial (BRAÇO)** | Gestor/equipe da empresa cliente | Baixa, interativa, CRUD | UI: <300ms percebido |
| **Atendimento (Runtime)** | Cliente final via WhatsApp | Assíncrona, orientada a evento (webhook) | Resposta ao cliente: segundos, não ms |
| **Integrações externas** | Google/WhatsApp/LLM | Chamadas de saída, sujeitas a rate limit e falha | Deve tolerar retry/latência de terceiros |

A arquitetura separa esses planos para que picos de atendimento (ex.: muitos
clientes escrevendo ao mesmo tempo) não degradem a experiência gerencial, e
para que uma falha de integração externa nunca trave a interface do gestor.

## 2. Diagrama lógico

```text
                        ┌─────────────────────────┐
                        │   BRAÇO Web App (M3)     │
                        │  (gestor, multi-empresa) │
                        └───────────┬─────────────┘
                                    │ HTTPS/JSON (REST)
                                    ▼
                        ┌─────────────────────────┐
                        │       API Gateway         │
                        │  (Auth, tenant context,   │
                        │   RBAC, rate limit)        │
                        └───────────┬─────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              ▼                     ▼                     ▼
     ┌────────────────┐   ┌──────────────────┐   ┌──────────────────┐
     │  App Service     │   │  Runtime Service   │   │  Integration Hub  │
     │  (CRUD gerencial, │   │  (Digital Employee │   │  (Google, futuros  │
     │   Manual, Equipe, │   │   Runtime — decide  │   │   canais/CRMs)     │
     │   Resultados)     │   │   agir/escalar)     │   │                    │
     └────────┬────────┘   └─────────┬─────────┘   └─────────┬─────────┘
              │                       │                       │
              └───────────┬───────────┴───────────┬───────────┘
                          ▼                       ▼
                ┌──────────────────┐   ┌───────────────────────┐
                │   PostgreSQL       │   │   Redis (fila + cache)  │
                │  (multi-tenant,    │   │  jobs assíncronos:       │
                │   RLS por empresa) │   │  follow-up, retry,       │
                └──────────────────┘   │  sync de agenda           │
                                        └───────────────────────┘
                          ▲
                          │
     ┌────────────────────┴─────────────────────┐
     │      Webhooks de entrada (públicos)         │
     │  WhatsApp Cloud API/BSP · Google Calendar    │
     └──────────────────────────────────────────────┘
```

`App Service` e `Runtime Service` podem começar como **módulos do mesmo
processo** (um monólito modular) e só ser separados em serviços distintos
quando o volume de atendimento justificar escala independente — ver
`17-technical-decisions.md`.

## 3. Componentes

### 3.1 Frontend (BRAÇO Web)
SPA/SSR em React, tema M3 (ver `13-frontend-m3-implementation.md`). Único
front para todas as áreas do PRD 02 (Minha Equipe, Trabalho, Resultados,
Empresa). Fala apenas com a API Gateway — nunca acessa banco ou integrações
diretamente.

### 3.2 API Gateway / BFF
Único ponto de entrada HTTP autenticado. Responsabilidades:
- autenticação (sessão/JWT);
- resolução do **tenant context** (empresa ativa do usuário logado);
- autorização (RBAC por papel dentro da empresa);
- validação de payload;
- rate limiting por empresa e por usuário.

### 3.3 App Service (domínio gerencial)
Implementa os casos de uso do PRD 02: contratação, preparação, ativação,
Minha Equipe, monitoramento, resultados, configuração de empresa e
integrações. É o dono do modelo de dados relacional (ver `03-data-model.md`).

### 3.4 Runtime Service (Digital Employee Runtime)
Processa eventos de atendimento (mensagem recebida via webhook, lembrete
agendado, follow-up vencido). Não é acionado por request síncrono do gestor.
Ver `08-digital-employee-runtime.md` para o desenho completo.

### 3.5 Integration Hub
Camada de adaptadores para serviços externos (WhatsApp, Google Calendar,
Google Tasks, e no futuro outros canais/ERPs). Cada integração expõe uma
interface interna estável (`ScheduleAdapter`, `MessagingAdapter`,
`TaskAdapter`) para que o Runtime e o App Service nunca dependam do SDK do
provedor diretamente — isso é o que permite trocar BSP de WhatsApp ou trocar
Google Calendar por outra agenda no futuro sem reescrever o domínio.

### 3.6 Filas e jobs
Redis + fila de jobs para tudo que é assíncrono ou pode falhar e precisar de
retry: envio de mensagem de saída, execução de follow-up, renovação de
webhook do Calendar, reconciliação de agenda, cálculo de indicadores.

### 3.7 Banco de dados
PostgreSQL único, multi-tenant por `company_id` + Row-Level Security. Ver
`04-multi-tenancy.md`.

## 4. Fluxo de dados — exemplo (mensagem de cliente no WhatsApp)

```text
Cliente envia mensagem no WhatsApp
→ Provedor (Cloud API/BSP) chama webhook público do BRAÇO
→ API Gateway valida assinatura do webhook, identifica a empresa pelo número
→ Evento é gravado (idempotente, chave = id da mensagem) e enfileirado
→ Worker do Runtime Service consome o evento
→ Runtime carrega: Manual de Trabalho, Regras/Limites/Autonomia, estado da
  Conversa/Cliente
→ LLM classifica intenção e propõe resposta/ação
→ Policy Engine (determinístico) decide: agir autônomo (🟢), agir sob regra
  (🟡) ou escalar (🔴)
→ Ação executada via Integration Hub (responder, agendar, criar tarefa) OU
  Handoff é criado
→ Evento de Trabalho é registrado (auditoria) e refletido em Minha Equipe/
  Trabalho no App Service
```

Esse fluxo é o núcleo do produto e é detalhado em `08-digital-employee-runtime.md`.

## 5. Ambientes

| Ambiente | Propósito | Dados |
|---|---|---|
| `local` | Desenvolvimento | Mocks de WhatsApp/Google; sem PII real |
| `staging` | Homologação, QA, demo interna | Dados sintéticos; integrações em modo sandbox (Meta test numbers, Google test account) |
| `production` | Clientes reais | Dados reais, região Brasil |

## 6. Deploy

Deploy contínuo por ambiente a partir da branch principal (staging) e por tag
(production), com pipeline único rodando lint, testes, build e migração de
banco. Ver `12-infrastructure.md` para detalhes de hospedagem.

## 7. Trade-offs principais desta arquitetura

| Decisão | Ganho | Custo/risco | Mitigação |
|---|---|---|---|
| Monólito modular no início | Velocidade de entrega, menos complexidade operacional | Acoplamento se módulos não forem bem isolados | Módulos com fronteiras de código claras (domínio próprio, sem import cruzado de repositórios internos) desde o dia 1 |
| Banco único multi-tenant (RLS) | Custo baixo, uma única fonte de verdade para relatórios cross-tenant internos | Risco de vazamento entre tenants se RLS falhar | RLS + filtro de aplicação em toda query (defesa em profundidade) — ver `04-multi-tenancy.md` |
| Fila assíncrona para atendimento | Resiliência a picos e falhas externas; nunca bloqueia o gestor | Pequeno atraso adicional no primeiro processamento | Aceitável — atendimento via WhatsApp já opera em escala de segundos, não ms |
| Integration Hub com adaptadores | Troca de provedor (BSP, calendário) sem reescrever domínio | Camada extra de abstração | Justificado dado o risco documentado de mudança de provedor de WhatsApp (`16-product-decisions-required.md`) |

## 8. O que esta arquitetura evita deliberadamente (anti-overengineering)

- **Sem microserviços fragmentados no MVP** — não há times múltiplos nem
  necessidade de escala independente ainda.
- **Sem Kafka/event bus distribuído** — Redis + fila cobre o volume esperado
  de um MVP com dezenas/centenas de empresas.
- **Sem multi-região** — clientes são PMEs brasileiras; uma região (São
  Paulo) resolve latência e LGPD.
- **Sem plataforma de agentes de IA genérica** — o Runtime é um domínio de
  negócio com um LLM como componente, não um framework de agentes autônomos
  (ver `08-digital-employee-runtime.md`, seção 1).
