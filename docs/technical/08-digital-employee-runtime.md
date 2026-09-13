# BRAÇO — Digital Employee Runtime

## 1. Princípio de desenho

> O BRAÇO não é um chatbot genérico. O runtime representa uma função com
> responsabilidade e limites definidos.

Isso tem uma consequência arquitetural direta: **o LLM não é o tomador de
decisão final**. O Runtime é um sistema com duas camadas separadas:

1. **Camada de linguagem** (LLM): entende a mensagem do cliente, classifica
   intenção, gera texto de resposta, propõe uma ação estruturada
   (function/tool call).
2. **Policy Engine** (determinístico, código comum, sem IA): recebe a ação
   proposta e decide se ela pode ser executada, com base em `AutonomyPolicy`,
   `Rule` e `Limit` do Manual de Trabalho daquele funcionário — dados que
   vêm do banco, não do modelo.

O LLM nunca executa uma ação com efeito colateral (agendar, prometer preço,
encerrar atendimento) diretamente. Ele **propõe**; o Policy Engine
**autoriza, condiciona ou escala**. Isso é o que torna o funcionário digital
"uma função com limites" e não "um agente autônomo geral" — e é o que
sustenta a promessa de produto de "não trabalhar é melhor que trabalhar
errado".

## 2. Componentes do Runtime

```text
Evento (mensagem, lembrete, follow-up vencido)
        │
        ▼
┌───────────────────┐
│ Context Loader      │  carrega: WorkManual, Rules/Limits/Autonomy,
│                      │  histórico da Attendance, perfil do Customer
└─────────┬──────────┘
          ▼
┌───────────────────┐
│ Language Layer (LLM) │  classifica intenção, gera resposta candidata,
│                      │  propõe tool call estruturado (schema validado)
└─────────┬──────────┘
          ▼
┌───────────────────┐
│ Policy Engine        │  🟢 autoriza  |  🟡 autoriza sob condição  |
│  (determinístico)    │  🔴 bloqueia e cria Handoff
└─────────┬──────────┘
          ▼
┌───────────────────┐
│ Action Executor      │  chama Integration Hub (WhatsApp/Calendar/Tasks)
│                      │  só se autorizado
└─────────┬──────────┘
          ▼
┌───────────────────┐
│ Work Event Logger    │  registra o que foi tentado e o que aconteceu
└───────────────────┘
```

## 3. Identidade e função

Cada `DigitalEmployee` carrega, via `EmployeeType` + `WorkManual`: nome,
função, missão, tom de comunicação, produtos/serviços que pode citar, e o
conjunto de `tools` (ferramentas) habilitadas para seu tipo (ex.: Atendimento
tem `check_availability`, `create_appointment`, `create_task`,
`request_handoff`; um futuro Braço Financeiro teria outro conjunto). Isso
evita que um funcionário "aja fora da função" mesmo que o LLM, por erro,
proponha uma ação de outro domínio.

## 4. Contexto — empresa, cliente, conversa

A cada evento processado, o Context Loader monta um contexto delimitado:
- **Empresa:** dados relevantes do Manual de Trabalho (não o banco inteiro).
- **Cliente:** histórico relevante e resumido (não a base completa de
  clientes da empresa).
- **Conversa:** janela recente de mensagens da `Attendance` atual + estado.

Esse contexto é **reconstruído a cada chamada**, não mantido como sessão de
longa duração em memória do processo — permite escalar horizontalmente o
Runtime sem afinidade de sessão e sobrevive a reinício/deploy.

## 5. Regras, limites e autonomia em runtime

O Policy Engine avalia, para a ação proposta pelo LLM:
1. A `action_category` está entre as `tools` permitidas para este
   `EmployeeType`? Se não → bloqueado, log de anomalia.
2. Qual o nível de `AutonomyPolicy` para essa categoria neste funcionário?
   - 🟢 → executa.
   - 🟡 → executa somente se todas as `Rule`/`Limit` aplicáveis passarem
     (ex.: desconto dentro do teto, nº de tentativas de follow-up dentro do
     limite); se alguma falhar, vira 🔴 automaticamente.
   - 🔴 → nunca executa; cria `Handoff` com o contexto necessário
     (`docs/design/flows/07-human-handoff.md`).
3. Toda decisão (🟢/🟡/🔴, e qual regra decidiu) é registrada no `WorkEvent`
   — é o que permite responder "o que o funcionário tentou fazer e o que
   realmente aconteceu" (`11-observability.md`).

## 6. Ferramentas (tools) disponíveis ao Runtime

Cada ferramenta é uma função tipada e validada (JSON Schema/Zod), implementada
sobre o `Integration Hub`:

| Tool | Efeito | Adapter |
|---|---|---|
| `send_message` | Responder ao cliente (dentro da janela ativa) ou disparar template pré-aprovado (fora da janela — `docs/design/19-whatsapp-template-library.md`, PD2) | MessagingAdapter (WhatsApp) |
| `check_availability` | Consultar horários livres | ScheduleAdapter (Calendar) |
| `create_appointment` / `update_appointment` / `cancel_appointment` | Agendar/alterar/cancelar | ScheduleAdapter (Calendar) |
| `create_task` | Criar tarefa/follow-up | TaskAdapter (Tasks) |
| `request_handoff` | Escalar para humano | Domínio interno (Handoff) |
| `close_attendance` | Encerrar atendimento | Domínio interno |

Nenhuma tool executa chamada de rede diretamente a partir da Language Layer
— sempre passa pelo Policy Engine primeiro.

### 6.1 Guardrails de contato proativo (PD2)

Os limites de contato do MVP (`docs/design/19-whatsapp-template-library.md`
§11) são avaliados pelo Policy Engine como `Rule`/`Limit` do
`AutonomyPolicy`, não como lógica hardcoded na tool: máximo de 1 mensagem
proativa por cliente em 24h (global); follow-up/recuperação com no máximo
2 tentativas automáticas e intervalo mínimo de 48h, encerrando a automação
após a 2ª tentativa sem resposta; agendamento incompleto com 1 retomada
automática; lembrete com 1 envio automático por compromisso; reagendamento
event-driven, sem repetição em sequência. Um pedido de opt-out do cliente é
tratado como `Rule` de bloqueio permanente para follow-up/recuperação
daquele `Customer` — nunca contornável trocando de `template_key`.

## 7. Memória operacional

- **Curto prazo:** histórico da conversa atual (`Message` da `Attendance`),
  truncado/resumido quando excede a janela de contexto do modelo.
- **Longo prazo (operacional, não vetorial):** perfil do `Customer`
  (preferências conhecidas, histórico de agendamentos/follow-ups) — dados
  estruturados no Postgres, consultados sob demanda, não "lembrados" pelo
  modelo entre chamadas. Ver `09-ai-llm.md` sobre por que RAG/vetor não é
  necessário no MVP.

## 8. Auditoria

Todo ciclo do diagrama da seção 2 gera pelo menos um `WorkEvent`. Isso não é
opcional nem "log de debug" — é requisito de produto (PRD 01, seção 14 "Log
de trabalho") e de LGPD (rastreabilidade de decisão automatizada que afeta
uma pessoa — o cliente final).

## 9. Decisão entre agir e escalar — resumo

```text
Ação proposta pelo LLM
   → está fora do conjunto de tools do tipo de funcionário? → bloqueia (anomalia)
   → autonomia = 🔴 para esta categoria? → Handoff
   → autonomia = 🟡 e alguma Rule/Limit falha? → Handoff
   → autonomia = 🟢, ou 🟡 com todas as regras satisfeitas → executa e loga
```

Este é o mecanismo central que faz cumprir, em código, a promessa central do
produto: **o funcionário nunca ultrapassa regras e limites** (PRD 01, seção
17), mesmo que o LLM "erre" ou tente algo fora do combinado.
