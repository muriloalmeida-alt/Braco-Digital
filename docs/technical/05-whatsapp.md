# BRAÇO — WhatsApp

Canal transversal de todos os Braços que falam com clientes (PRD 01/02,
`docs/design/flows/04-whatsapp-attendance.md`).

> **Nota de implementação (issue #30):** este documento descreve a
> visão de arquitetura (`Integration Hub`/`MessagingAdapter`/`Runtime
> Service`), que ainda não existe em código. A conexão real de
> WhatsApp implementada hoje usa o Zernio como BSP (Meta Cloud API) e
> está documentada em
> `docs/technical/21-zernio-whatsapp-integration.md` — sem fila/Runtime
> (processamento síncrono) e sem resposta automática ainda.

## 1. API oficial vs. BSP

| Opção | Prós | Contras |
|---|---|---|
| WhatsApp Cloud API direto (Meta) | Custo por mensagem mais baixo em escala; sem intermediário | Onboarding de número mais lento/manual; BRAÇO assume toda a operação de webhook, templates, rate limit e verificação de negócio |
| **BSP (ex.: 360dialog, Twilio, Gupshup) — recomendado para o MVP** | Onboarding de número mais rápido; suporte a gerenciar múltiplos números de múltiplas empresas; abstrai parte da complexidade de templates e compliance | Custo por mensagem/assinatura mensal do BSP; mais uma dependência de terceiro |

**Recomendação:** iniciar com um BSP para reduzir tempo até o primeiro
cliente ativo, migrando (ou operando em paralelo) para Cloud API direto
quando o volume justificar a economia — decisão adiável e reversível porque
o `Integration Hub` (ver `01-architecture.md`) isola esse provedor atrás de
um `MessagingAdapter`.

## 2. Webhooks (recebimento)

- Endpoint público único (`POST /webhooks/whatsapp`), validado por
  assinatura HMAC do provedor.
- Cada mensagem recebida chega com um identificador de número/canal
  (`phone_number_id` ou equivalente do BSP) — mapeado para `company_id` via
  tabela `Integration`. Mensagem sem mapeamento válido é rejeitada e
  registrada como alerta de configuração, nunca processada "às cegas".
- Processamento é assíncrono: o webhook grava o evento e responde 200
  imediatamente; o Runtime Service consome da fila. Isso protege contra
  timeouts do provedor durante picos e durante chamadas ao LLM.

## 3. Envio

Todo envio passa pelo `MessagingAdapter`, que:
1. verifica se está dentro da janela de atendimento (24h desde a última
   mensagem do cliente) ou se precisa de **template pré-aprovado**;
2. enfileira com retry exponencial em caso de falha de rede/rate limit do
   provedor;
3. grava o status retornado (enviando → enviado → entregue/falha/
   **rejeitado**) via callbacks de status do provedor.

### 3.1 Templates de follow-up/lembrete (PD2 — RESOLVED, conteúdo Content Design Ready)

Decisão de produto (`16-product-decisions-required.md`, PD2): mensagens
proativas fora da janela de 24h nunca são texto livre gerado pelo LLM —
sempre um template pré-aprovado pela Meta/BSP. Conteúdo v1 (texto,
variáveis, condições de uso, guardrails de contato, fallback) formalizado
por Produto/Design em `docs/design/19-whatsapp-template-library.md` —
Status: **Content Design Ready** (não confundir com aprovado pela
Meta/BSP). MVP com 5 intenções de template, cada uma mapeada a uma
`template_key` estável no `MessagingAdapter`:

| Intenção | `template_key` | Épico/US |
|---|---|---|
| Follow-up de interesse | `follow_up_interest` | US40, US41 |
| Agendamento incompleto | `follow_up_incomplete_booking` | US40, US41 |
| Lembrete de agendamento | `appointment_reminder` | E05 |
| Reagendamento | `appointment_reschedule` | US36 |
| Recuperação de oportunidade | `opportunity_recovery` | US44 |

O `MessagingAdapter` decide: se a `Attendance` está dentro da janela de 24h
→ mensagem livre; se fora da janela → resolve a `template_key` aplicável à
intenção e envia com as variáveis controladas (sempre vindas de dados
estruturados — `Customer`, `Appointment`, `Product/Service` — nunca geradas
pelo LLM, ver `09-ai-llm.md` §8); se não há template aprovado para a
intenção → **não envia texto livre como fallback**, e o produto expõe o
estado "Precisa de atenção — template de WhatsApp indisponível"
(`docs/design/19-whatsapp-template-library.md` §12).

**Decisão de conteúdo (Produto/Design):** os 5 templates são inicialmente
**body-only** — sem quick reply, CTA externo, link ou botão de telefone
nesta primeira submissão. Engenharia não adiciona botões por conta própria.

**Vocabulário de estado exposto ao gestor** (`19-whatsapp-template-
library.md` §13) — Programado, Enviando, Enviado, Entregue, Não enviado,
Precisa de atenção — mapeia para os estados técnicos internos do
`MessagingAdapter` (`sending/sent/delivered/failed/rejected`); o gestor
nunca vê o código técnico, só a linguagem de produto.

Submissão à Meta/BSP deve ocorrer antes do início da Sprint 03, dado o
lead time de aprovação (dias). Um template rejeitado pela Meta gera estado
`rejected`, nunca é substituído automaticamente por outra copy nem por
texto gerado por LLM — o caso retorna a Produto/Design para revisão
(`19-whatsapp-template-library.md` §12).

## 4. Identificação do cliente e contexto

Cliente identificado por telefone (E.164) + `company_id` (mesmo número pode
existir como `Customer` distinto em duas empresas). Contexto de conversa
(`Attendance` + histórico de `Message`) é carregado a cada evento processado
— ver `03-data-model.md` e `08-digital-employee-runtime.md`.

## 5. Estado da conversa

Estados definidos pelo produto (PRD 01, seção 10): novo, em atendimento,
aguardando cliente, aguardando humano, concluído, follow-up pendente.
Mapeados 1:1 para `Attendance.state` — engenharia não introduz estados
adicionais sem retornar ao PM (regra de `17-design-engineering-handoff.md`).

## 6. Múltiplos números, múltiplas empresas

Cada empresa deve ter seu próprio número/identidade de WhatsApp Business
(coerente com a marca — "Ana, assistente digital da Clínica Vida"). O
`Integration Hub` mantém `phone_number_id → company_id` como mapeamento
central e único ponto de verdade; qualquer novo número passa por esse
cadastro antes de poder receber tráfego.

## 7. Armazenamento

Mensagens (texto e metadados de mídia) ficam em `Message`
(`03-data-model.md`). Arquivos de mídia (imagem, áudio, documento) são
baixados do provedor e armazenados em storage próprio (S3-compatível) com
URL assinada de curta duração — não se depende de o provedor manter o
arquivo indefinidamente.

## 8. Retry e idempotência

- **Idempotência de entrada:** `Message.whatsapp_message_id` é `UNIQUE`;
  reentrega do mesmo webhook (comum em providers) não duplica processamento.
- **Retry de saída:** fila com backoff exponencial; mensagens que falham após
  N tentativas geram `Alert` (não falham silenciosamente).
- **Idempotência de ação:** toda ação de negócio disparada pelo Runtime
  (agendar, criar tarefa) usa uma chave de idempotência derivada do evento de
  origem, para que reprocessamento de fila não duplique agendamentos.

## 9. Handoff

Transferência para humano não é uma "mensagem especial" — é uma mudança de
`Attendance.state` e criação de `Handoff` (ver `07-human-handoff.md` no
design e `08-digital-employee-runtime.md` aqui). O canal continua sendo o
mesmo WhatsApp; o que muda é quem está autorizado a responder.

## 10. Limites e segurança

- Rate limits do provedor (mensagens por segundo, por número) são
  respeitados pela fila de saída (throttling por `company_id`/número).
- Templates de mensagem fora da janela de 24h precisam de aprovação prévia
  da Meta — isso tem **impacto direto de produto** (lembretes proativos,
  recuperação de oportunidade) e está registrado em
  `16-product-decisions-required.md`.
- Nenhum dado de PII do cliente final é logado em texto pleno em logs de
  aplicação — ver `10-security-lgpd.md`.

## 11. Limitações que impactam o PRD → Product Decisions Required

Ver `16-product-decisions-required.md`, itens:
- **Janela de 24h e mensagens de template** (follow-up/lembretes proativos)
  — **PD2: RESOLVED**, ver seção 3.1 acima.
- **Tempo de aprovação de número e templates** pela Meta/BSP (impacta o
  "tempo até ativação" — métrica de `docs/09-metrics.md`); submissão dos 5
  templates do MVP deve iniciar antes do início da Sprint 03.
