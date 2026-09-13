# BRAÇO — Modelo de Dados Conceitual

Modelo relacional, PostgreSQL. Toda entidade não-global carrega `company_id`
(tenant) — ver `04-multi-tenancy.md`. Chaves e tipos são ilustrativos, não
DDL final.

## 1. Visão geral de entidades e ownership

| Entidade | Pertence a | Cardinalidade principal |
|---|---|---|
| Company | — (raiz do tenant) | 1 |
| User | Global (identidade) | N:M com Company via `CompanyMembership` |
| CompanyMembership / Permission | Company | 1 Company : N Membership; 1 User : N Membership |
| EmployeeType (catálogo) | Global (catálogo de produto) | 1 : N DigitalEmployee |
| DigitalEmployee (Funcionário Digital) | Company | 1 Company : N DigitalEmployee |
| WorkManual (Manual de Trabalho) | DigitalEmployee | 1:1 |
| Product/Service (Produto/Serviço) | Company | 1 Company : N; N:M com WorkManual |
| Rule (Regra) | WorkManual | 1 WorkManual : N Rule |
| Limit (Limite) | Rule ou WorkManual | 1 : N |
| AutonomyPolicy (Autonomia) | WorkManual | 1 WorkManual : N (por categoria de ação) |
| Responsible (Responsável) | Company (é um User com papel de escalonamento) | N:M via `EscalationTarget` |
| Integration | Company | 1 Company : N (whatsapp, calendar, tasks) |
| Customer (Cliente) | Company | 1 Company : N |
| Attendance (Atendimento/Conversa) | Company, DigitalEmployee, Customer | 1 Customer : N Attendance |
| Message (Mensagem) | Attendance | 1 Attendance : N Message |
| Appointment (Agendamento) | Company, Customer, DigitalEmployee | 1 Customer : N Appointment |
| Task (Tarefa) | Company, opcionalmente Customer/Attendance | 1 Company : N |
| FollowUp | Customer, Attendance de origem | 1 Attendance : N FollowUp |
| Handoff | Attendance | 1 Attendance : N Handoff (histórico) |
| Intervention (Intervenção) | Handoff | 1 Handoff : N Intervention (ações do humano) |
| Alert (Alerta) | Company, referência polimórfica | 1 Company : N |
| WorkEvent (Evento de Trabalho) | Company, DigitalEmployee, Attendance opcional | 1 : N (append-only) |
| Metric (Métrica) | Derivada — agregação sobre WorkEvent/Attendance/Appointment | view/rollup, não entidade editável |

## 2. Entidades centrais

### Company (Empresa)
Raiz do tenant. `id, name, document (CNPJ), vertical, timezone, status,
created_at`.

### User / CompanyMembership / Permission
`User` é identidade global (login único, pode existir em mais de uma
empresa — ex.: consultor que atende vários clientes). `CompanyMembership`
liga `User` a `Company` com um `role` (Owner, Admin, Operador, Visualizador).
`Permission` é derivada do `role` (RBAC por papel, não por ACL individual no
MVP — ver `10-security-lgpd.md`).

### EmployeeType (Tipo de Funcionário)
Catálogo de produto (Atendimento, Vendas, Orçamentos, Pós-venda,
Financeiro — `docs/04-employee-catalog.md`). Global, versionado, define o
template default de responsabilidades/capacidades/ferramentas disponíveis
para um `DigitalEmployee` daquele tipo. Não pertence a nenhuma empresa.

### DigitalEmployee (Funcionário Digital)
`id, company_id, employee_type_id, name (definido pela empresa ou default),
status (Contratado/Preparando/Pronto/Trabalhando/Pausado/Precisa de
atenção/Desativado), hired_at, activated_at`.

### WorkManual (Manual de Trabalho)
1:1 com `DigitalEmployee`. Guarda o conteúdo estruturado descrito no PRD:
dados da empresa (snapshot/link), missão, responsabilidades, estilo de
comunicação, recursos habilitados. Campos de texto livre/semi-estruturado em
JSONB; campos que precisam ser **avaliados em runtime** (regras, limites,
autonomia) são tabelas relacionais próprias — não JSONB — porque o Policy
Engine do Runtime precisa consultá-los com garantias transacionais e índices,
não parsear JSON a cada decisão.

### Product/Service (Produto/Serviço)
Pertence à empresa, não ao funcionário — evita duplicação entre múltiplos
Braços da mesma empresa (US08, e regra de IA "Empresa configura contexto
compartilhado"). Referenciado pelo Manual de Trabalho via tabela de
associação (nem todo funcionário precisa apresentar todos os produtos).

### Rule (Regra) / Limit (Limite) / AutonomyPolicy (Autonomia)
- `Rule`: condição/política textual + `action_category` (ex.: "conceder
  desconto", "confirmar agendamento sem checar disponibilidade") +
  `constraint` estruturado quando aplicável (ex.: desconto máximo).
- `Limit`: um `Rule` numérico com operador e valor (ex.: `max_per_week = 3`
  para follow-ups) — modelado como especialização de `Rule` para permitir
  avaliação genérica no Policy Engine.
- `AutonomyPolicy`: mapeia `action_category → nível` (🟢/🟡/🔴). É a tabela
  que o Runtime consulta antes de qualquer ação (ver `08-digital-employee-
  runtime.md`).

### Responsible / EscalationTarget
Liga uma categoria de escalonamento (ex.: "reclamação sensível", "exceção de
preço") a um ou mais `User` da empresa que deve receber o Handoff.

### Integration
`id, company_id, type (whatsapp|google_calendar|google_tasks), status,
credentials_encrypted, external_account_ref, connected_at, last_sync_at`.
Credenciais nunca em texto plano — ver `10-security-lgpd.md`.

### Customer (Cliente)
Cliente final da empresa (não usuário do BRAÇO). Identificado primariamente
pelo telefone WhatsApp (E.164) + `company_id` (mesmo número pode ser cliente
de duas empresas diferentes — são registros distintos). `id, company_id,
phone, name (quando obtido), created_at, lgpd_consent_state`.

### Attendance (Atendimento)
Representa o ciclo de vida de um contato-a-caso: `id, company_id,
digital_employee_id, customer_id, channel (whatsapp), state (novo | em
atendimento | aguardando cliente | aguardando humano | concluído |
follow-up pendente), started_at, closed_at`. É o agregador ao qual
`Message`, `Handoff`, `Appointment` (quando originado dali) e `FollowUp`
se referenciam.

### Message (Mensagem)
`id, attendance_id, sender_type (customer|employee|human|system),
content, whatsapp_message_id (idempotência — unique), direction (in|out),
status (sending|sent|delivered|failed|received), created_at`.

### Appointment (Agendamento)
`id, company_id, customer_id, digital_employee_id, attendance_id
(opcional), external_calendar_event_id, service_ref, starts_at, ends_at,
status (scheduled|confirmed|rescheduled|canceled), source`.

### Task (Tarefa)
`id, company_id, external_google_task_id, related_customer_id (opcional),
related_attendance_id (opcional), type (follow_up|generic), status
(pending|completed), due_at`.

### FollowUp
`id, company_id, customer_id, origin_attendance_id, scheduled_at, status
(pending|executed|resulted), result, contact_attempt_count` (usado para
"respeitar limites de contato" — US45).

### Handoff
`id, attendance_id, requested_by (digital_employee_id), reason,
assigned_responsible_id (nullable), status (solicitado|aguardando|
assumido|resolvido|devolvido), requested_at, resolved_at`.

### Intervention (Intervenção)
`id, handoff_id, user_id (humano que assumiu), notes/motivo,
actions_taken, started_at, ended_at`. Separado de `Handoff` porque um
handoff pode ter mais de um ciclo de assunção/devolução ao longo do tempo
(US51 — "Retornar conversa ao funcionário").

### Alert (Alerta)
`id, company_id, type, severity, related_entity_type, related_entity_id
(referência polimórfica — DigitalEmployee, Attendance, Integration), status
(open|resolved), created_at, resolved_at`.

### WorkEvent (Evento de Trabalho)
Tabela **append-only**, é a espinha dorsal de auditoria e observabilidade
(ver `11-observability.md`). `id, company_id, digital_employee_id,
attendance_id (opcional), action, decision_type (auto|rule_checked|
escalated), tool_calls (JSONB), result, latency_ms, llm_cost_usd, error,
created_at`. Nunca é atualizada ou apagada por fluxo de negócio — só por
política de retenção LGPD (ver `10-security-lgpd.md`).

### Metric (Métrica)
Não é uma entidade mutável independente. Métricas de negócio (US69–US76) são
**derivadas** por agregação sobre `Attendance`, `Appointment`, `FollowUp`,
`Intervention` e `WorkEvent`, materializadas em tabelas/views de rollup
(diário/semanal por empresa) para performance dos relatórios. Modelar
"Métrica" como tabela editável introduziria uma segunda fonte de verdade —
evitado deliberadamente.

## 3. Diagrama simplificado de relacionamento

```text
Company 1──N CompanyMembership N──1 User
Company 1──N DigitalEmployee N──1 EmployeeType
DigitalEmployee 1──1 WorkManual 1──N Rule/Limit/AutonomyPolicy
Company 1──N Product/Service N──M WorkManual
Company 1──N Integration
Company 1──N Customer 1──N Attendance N──1 DigitalEmployee
Attendance 1──N Message
Attendance 1──N Handoff 1──N Intervention
Customer 1──N Appointment N──1 DigitalEmployee
Company 1──N Task
Attendance 1──N FollowUp
Company 1──N Alert
Company 1──N WorkEvent N──1 DigitalEmployee
```

## 4. Notas de design do schema

- Toda tabela de tenant tem `company_id NOT NULL` e um índice composto
  `(company_id, id)` — sustenta RLS e evita scans cross-tenant acidentais.
- `Message.whatsapp_message_id` com constraint `UNIQUE` é o mecanismo central
  de idempotência de entrada (ver `05-whatsapp.md`).
- Credenciais de integração (`Integration.credentials_encrypted`) usam
  criptografia de coluna (KMS), nunca ficam em claro nem em log.
- `WorkEvent` deve ser particionado por tempo (`created_at`) desde o desenho
  inicial do schema, mesmo que a partição física só seja ativada quando o
  volume justificar — a chave de particionamento é decisão barata de tomar
  cedo e cara de corrigir depois.
