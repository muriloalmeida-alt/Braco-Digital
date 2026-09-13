# BRAÇO — Google Calendar

Recurso operacional de agenda (PRD 01/02, `docs/design/flows/05-scheduling.md`).

## 1. OAuth e contas

Cada empresa conecta **sua própria conta Google** (OAuth 2.0, escopo
`calendar` mínimo necessário — leitura + escrita de eventos, não escopo
administrativo amplo). Token de acesso + refresh token armazenados
criptografados em `Integration.credentials_encrypted`
(`03-data-model.md`, `10-security-lgpd.md`). Refresh automático antes da
expiração; falha de refresh gera `Alert` do tipo "integração precisa de
atenção" (padrão M3/BRAÇO já previsto em `09-product-patterns.md` —
Integration Status).

## 2. Qual calendário

MVP: um calendário por empresa (ou um calendário selecionado dentro da conta
conectada). Múltiplos calendários por funcionário/recurso é evolução
possível, não bloqueante para Sprint 01–04.

## 3. Disponibilidade (leitura)

Usar `freebusy.query` para consultar intervalos ocupados antes de oferecer
horários (US32). Cache curto (segundos) em Redis para reduzir chamadas
repetidas durante uma mesma conversa, sempre revalidando imediatamente antes
de confirmar (regra de produto: "nunca oferecer horário sabidamente
indisponível" + "revalidar antes da confirmação").

## 4. Criação, alteração e cancelamento

`events.insert` / `events.patch` / `events.delete` via `ScheduleAdapter`.
Todo agendamento criado pelo BRAÇO grava `external_calendar_event_id` em
`Appointment` — é a chave de reconciliação entre os dois lados.

## 5. Conflito

Fluxo (`flows/05-scheduling.md`): revalidar disponibilidade **imediatamente
antes** de confirmar, dentro de uma janela curta o suficiente para tornar
condição de corrida improvável, mas não impossível — Google Calendar não
oferece lock pessimista. Mitigação: `events.insert` é a operação atômica que
"reserva" o horário; se duas conversas simultâneas tentarem o mesmo slot, a
segunda falha a revalidação pós-insert (double-booking check) e o Runtime
escala ou oferece novo horário. Comunicar sucesso ao cliente **somente**
após confirmação real da API (nunca UI/mensagem otimista — regra de
`07-motion-feedback.md`: "ações como agendamento... devem refletir o estado
real confirmado").

## 6. Sincronização — webhooks vs. polling

Google Calendar oferece **push notifications** (`watch` channels), mas com
limitações relevantes:
- canal expira em no máximo 30 dias — precisa de job de renovação recorrente;
- a notificação não traz o diff, apenas avisa "algo mudou" — é preciso buscar
  o estado atual (`events.list` com `syncToken`) para saber o que mudou.

**Recomendação:** usar push notifications como gatilho primário (evita
polling constante), com **polling de reconciliação** de baixa frequência
(ex.: a cada poucas horas, por empresa) como rede de segurança para cobrir
canais expirados/silenciosamente perdidos. Isso equilibra custo de API,
atualidade e resiliência.

## 7. Falhas e reconciliação

| Falha | Tratamento |
|---|---|
| Token expirado/revogado pelo usuário | `Alert` "integração precisa de atenção"; funcionário não confirma novos agendamentos até reconexão (regra: não trabalhar é melhor que trabalhar errado) |
| Evento alterado manualmente no Google (fora do BRAÇO) | Reconciliação periódica detecta divergência entre `Appointment.status` e o evento real; superfície gerencial reflete o estado mais recente do Google como fonte de verdade para data/hora |
| Evento apagado no Google | `Appointment` marcado como cancelado; se havia cliente aguardando confirmação, gerar alerta |
| Rate limit da API do Google | Fila com backoff; não bloqueia a experiência do cliente (mensagem de "estou verificando" enquanto retry ocorre, se a latência exceder limiar aceitável) |

## 8. Múltiplas contas/empresas

Cada `Integration` de tipo `google_calendar` é escopada por `company_id` —
nenhuma credencial é compartilhada entre empresas. Job de renovação de
webhook/token itera por integração, não globalmente, para isolar falha de
uma empresa das demais.
