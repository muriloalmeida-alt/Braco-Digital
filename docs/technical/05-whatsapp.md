# BRAÇO — WhatsApp

Canal transversal de todos os Braços que falam com clientes (PRD 01/02,
`docs/design/flows/04-whatsapp-attendance.md`).

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
3. grava o status retornado (enviando → enviado → entregue/falha) via
   callbacks de status do provedor.

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
- **Janela de 24h e mensagens de template** (follow-up/lembretes proativos).
- **Tempo de aprovação de número e templates** pela Meta/BSP (impacta o
  "tempo até ativação" — métrica de `docs/09-metrics.md`).
