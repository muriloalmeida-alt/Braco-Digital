# BRAÇO — Google Tasks

Recurso operacional de tarefas e follow-ups (PRD 01/02).

## 1. OAuth

Reaproveita o mesmo consentimento OAuth do Google Calendar sempre que
possível (mesmo projeto Google Cloud, escopo `tasks` adicionado ao mesmo
fluxo de conexão) — evita pedir à empresa duas conexões Google separadas,
alinhado ao princípio de experiência "o gestor configura tudo pelo BRAÇO".

## 2. Listas

MVP: uma Google Tasks list dedicada ao BRAÇO por empresa (criada
automaticamente na conexão, ex. "BRAÇO — Follow-ups"), para não misturar com
listas pessoais do usuário e não exigir que o gestor escolha/organize listas
manualmente.

## 3. Criação e vínculo com cliente/atendimento

`Task.external_google_task_id` grava o id retornado pela API. A API do
Google Tasks **não suporta campos customizados** — não é possível anexar
`customer_id`/`attendance_id` como metadado nativo do Google. Solução: o
vínculo vive inteiramente no lado BRAÇO (tabela `Task` em
`03-data-model.md`), e o campo `notes` da tarefa no Google recebe um texto
legível para humano (nome do cliente, referência curta) apenas para o caso
de o gestor abrir o Google Tasks diretamente — nunca é a fonte de verdade do
vínculo.

## 4. Atualização e conclusão

Marcar concluída no BRAÇO reflete via `tasks.patch` (`status: completed`).
Marcar concluída **no Google diretamente** (fora do BRAÇO) só é percebida
por polling (ver seção 6) — não há webhook nativo do Google Tasks.

## 5. Sincronização — limitação relevante

A **Google Tasks API não oferece push notifications/webhooks**, diferente do
Calendar. Isso é uma limitação de plataforma, não uma escolha de arquitetura.

**Consequência de arquitetura:** toda sincronização de estado de tarefas é
por **polling periódico** (ex.: a cada poucos minutos, por integração ativa),
suficiente porque tarefas não são o canal principal de interação com o
cliente (o WhatsApp é) — a tarefa é um artefato operacional de apoio ao
follow-up, então uma defasagem de minutos é aceitável.

## 6. Limitações → impacto de produto

- Sem campo customizado nativo ⇒ qualquer relatório que dependa de abrir o
  Google Tasks diretamente (fora do BRAÇO) perde o vínculo estruturado com
  cliente/atendimento. Isso é aceitável **desde que a experiência gerencial
  do PRD 02 nunca dependa de o gestor abrir o Google Tasks diretamente** —
  confirmar esse pressuposto de produto (ver `16-product-decisions-
  required.md` se houver expectativa contrária).
- Ausência de webhook ⇒ "conclusão de tarefa" feita fora do BRAÇO não é
  refletida em tempo real — apenas no próximo ciclo de polling.
