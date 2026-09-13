# BRAÇO — Observabilidade

## Pergunta que a observabilidade precisa responder

> O que o funcionário tentou fazer e o que realmente aconteceu?

Essa pergunta é o critério de design de toda esta seção — não é a mesma
pergunta que "o sistema está no ar?" (observabilidade de infraestrutura
tradicional). Por isso o BRAÇO precisa de **duas camadas** de
observabilidade que se complementam:

## 1. Observabilidade de negócio/domínio (a mais importante para este produto)

Fonte primária: **`WorkEvent`** (`03-data-model.md`), uma linha por tentativa
de ação do funcionário digital, contendo: o que foi tentado, qual decisão o
Policy Engine tomou (autônomo/sob regra/escalado) e qual foi o resultado
real (sucesso, falha, motivo).

Essa tabela alimenta diretamente:
- **Work Timeline** (padrão de produto, `09-product-patterns.md`) — visão
  humana e legível do que aconteceu, por atendimento/funcionário.
- **Relatórios** (PRD 01 seção 15 — "o que fez, que resultado produziu, onde
  precisou de pessoa").
- **Alertas** — condições anômalas (ex.: taxa de escalonamento acima do
  normal, integração falhando repetidamente) geram `Alert`.

## 2. Observabilidade técnica (infraestrutura e chamadas externas)

| Sinal | Ferramenta | O que cobre |
|---|---|---|
| Logs estruturados | stdout → coletor (ex.: Axiom/Better Stack) | Erros de aplicação, sem PII (ver `10-security-lgpd.md` §7) |
| Traces distribuídos | OpenTelemetry | Latência ponta a ponta: webhook → fila → LLM → integração → resposta |
| Erros/exceções | Sentry | Stack traces, agrupamento, alertas de regressão |
| Métricas de infraestrutura | Provedor de nuvem/APM | CPU, memória, latência de fila, profundidade de fila |
| Uptime de webhooks públicos | Health check externo | Disponibilidade do endpoint que recebe WhatsApp/Calendar |

## 3. O que é monitorado especificamente

### Mensagens
Volume por empresa, taxa de falha de envio, tempo até primeira resposta
(métrica de produto, `docs/09-metrics.md`).

### Integrações
Status de cada `Integration` (conectada/precisa de atenção/desconectada —
padrão M3 "Integration Status"), taxa de erro por provedor, tempo desde
último sync bem-sucedido.

### Jobs
Taxa de sucesso/retry/falha final por tipo de job (envio, follow-up, sync de
calendário, renovação de webhook); profundidade e idade da fila (fila
crescendo = sinal de degradação antes que vire incidente visível).

### Agendamentos
Taxa de conflito detectado, taxa de confirmação vs. oferta, falhas de
sincronização com Google Calendar.

### Ações do funcionário
Distribuição de decisões 🟢/🟡/🔴 por funcionário/empresa — permite detectar,
por exemplo, um funcionário escalando demais (Manual de Trabalho mal
configurado) ou de menos (risco de agir fora do combinado, sinal de bug no
Policy Engine).

### LLM
Latência, tokens, custo por chamada, taxa de saída fora de schema, taxa de
fallback/retry — tudo já capturado em `WorkEvent` (`09-ai-llm.md` §10 e
§12) mais dashboards agregados.

### Erros
Agrupados por camada (integração externa vs. domínio vs. LLM) para
diferenciar rapidamente "Google está fora do ar" de "nosso Policy Engine tem
um bug".

### Custos
Custo de LLM por empresa/funcionário/mês; custo de mensageria (BSP) por
empresa — necessário tanto para saúde financeira do produto quanto para
eventualmente informar precificação por volume.

### Latência
Fim a fim (cliente manda mensagem → funcionário responde) é a métrica de
experiência mais próxima do que o cliente final percebe.

### Handoffs
Volume, tempo até um humano assumir, tempo até resolução — informa tanto
saúde operacional da empresa cliente quanto qualidade da configuração de
autonomia.

### Falhas externas
Painel dedicado a status dos três provedores externos críticos (WhatsApp/
BSP, Google, Anthropic) — quando um está degradado, isso deve ser visível
imediatamente, distinto de um bug do BRAÇO.

## 4. O que nunca vai para a stack de observabilidade técnica

Conteúdo de mensagem do cliente, nome, telefone completo — fica apenas nas
tabelas de domínio com controle de acesso próprio (`10-security-lgpd.md`
§7). Ferramentas de terceiros (Sentry, APM) recebem apenas identificadores
internos e metadados técnicos.

## 5. Alertas operacionais (para a equipe BRAÇO, não para o cliente)

Separado dos `Alert` de produto (visíveis ao gestor da empresa dentro do
BRAÇO): a equipe de engenharia precisa de alerta próprio para degradação de
plataforma (ex.: fila de mensagens crescendo, taxa de erro do LLM acima do
normal, integração de um BSP fora do ar para múltiplas empresas
simultaneamente) — via canal interno (ex.: Slack/e-mail), não confundido com
o alerta que aparece na tela do gestor.
