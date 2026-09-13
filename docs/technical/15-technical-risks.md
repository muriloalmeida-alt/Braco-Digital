# BRAÇO — Riscos Técnicos

Riscos identificados na Technical Discovery, ordenados por severidade
combinada (impacto × probabilidade). Riscos que exigem decisão de Produto
(não apenas engenharia) estão referenciados em
`16-product-decisions-required.md` em vez de repetidos aqui.

## Críticos

### R1 — Vazamento de dados entre empresas (multi-tenant)
**Impacto:** catastrófico para confiança e LGPD. **Mitigação:** RLS +
filtro de aplicação + suíte de testes de isolamento no CI, conforme
`04-multi-tenancy.md`. **Status:** mitigação desenhada, não implementada
ainda — deve ser o primeiro conjunto de testes automatizados do projeto,
antes de qualquer feature de negócio.

### R2 — LLM executando ação fora dos limites configurados
**Impacto:** alto — é exatamente o que o produto promete nunca deixar
acontecer ("nunca ultrapassar regras e limites"). **Mitigação:** Policy
Engine determinístico como autoridade final, nunca o LLM
(`08-digital-employee-runtime.md`). **Status:** mitigação arquitetural
definida; depende de disciplina de implementação — nenhuma tool pode ganhar
um atalho que pule o Policy Engine, nem "temporariamente" para acelerar
entrega.

### R3 — Janela de 24h do WhatsApp quebrando follow-up/lembrete proativo
**Impacto:** alto — afeta diretamente PRD 01 (follow-up, recuperação,
lembretes) e métricas-chave (`docs/09-metrics.md`). **Status: PD2
RESOLVED, conteúdo Content Design Ready** — os 5 templates têm texto v1,
variáveis, guardrails de contato e fallback formalizados em
`docs/design/19-whatsapp-template-library.md` (antecipado do gate original
de fim da Sprint 02). Risco residual: submissão à Meta/BSP (antes do
início da Sprint 03) ainda não ocorreu — atraso ou rejeição na aprovação
externa pode atrasar o início efetivo de E06. Content Design Ready ≠
Meta/BSP Approved.

## Altos

### R4 — Ausência de webhook nativo do Google Tasks
**Impacto:** médio-alto para US relacionadas a follow-up caso se espere
tempo real. **Mitigação:** polling periódico (`07-google-tasks.md`), com
expectativa de defasagem de minutos comunicada ao produto.

### R5 — Maturidade de Material Web Components para padrões adaptativos complexos
**Impacto:** médio-alto para velocidade de entrega das telas mais ricas
(list-detail, supporting pane em Expanded). **Mitigação:**
`13-frontend-m3-implementation.md` — camada de wrapper isolando o custo de
eventual troca; complementar com primitivos próprios só onde necessário.

### R6 — Custo de LLM crescendo de forma não observável
**Impacto:** médio-alto no modelo de negócio (margem por empresa).
**Mitigação:** custo por chamada registrado em `WorkEvent`
(`09-ai-llm.md` §10), dashboards por empresa desde o início — não pós-fato.

### R7 — Lacuna de onboarding/criação de empresa no backlog
**Impacto:** alto para chegar a produção real (não bloqueia Sprint 01 com
dados seed). **Status: PD1 RESOLVED** — onboarding manual/provisionado
pela equipe BRAÇO nas Sprints 01–06 (decisão explícita, não mais uma
lacuna); self-service formalizado como PRD 03/E11, Sprint 07. Risco
residual: E11 precisa ser planejado a tempo de não atrasar um lançamento
público além da Sprint 06.

### R8 — Dependência de disponibilidade de terceiros (Meta/WhatsApp, Google, Anthropic)
**Impacto:** alto — qualquer um fora do ar degrada a função central do
produto (atendimento). **Mitigação:** fallback e circuit breaker por
provedor (`09-ai-llm.md` §9, `05-whatsapp.md` §3, `06-google-calendar.md`
§7), estado "aguardando humano" nunca deixa o cliente final sem resposta
silenciosa.

## Médios

### R9 — Condição de corrida em agendamento (double-booking)
**Impacto:** médio, visível ao cliente final. **Mitigação:** revalidação
imediatamente antes da confirmação (`06-google-calendar.md` §5) — reduz mas
não elimina 100% a janela de corrida (limitação da própria API do Google,
sem lock pessimista nativo).

### R10 — Templates de User Stories genéricos mascarando ambiguidade de escopo
**Impacto:** médio — risco de retrabalho se Engenharia interpretar escopo
diferente do pretendido pelo PM. **Status:** exemplo concreto (US06)
**confirmado por Murilo/PO** com critérios de aceitação reescritos — ver
`14-sprint-01-tech-readiness.md` §7. Mitigação permanece em vigor para
histórias futuras: todo caveat de interpretação é documentado e confirmado
antes da implementação, nunca assumido silenciosamente.

### R11 — Retenção de dados de cliente final sem política definida
**Impacto:** médio-alto no médio prazo (LGPD). **Status: PD3 — direção de
produto definida, valor final PENDING LEGAL VALIDATION** (gate antes do
início da Sprint 03). Ver `docs/13-data-privacy-and-retention.md` e
`16-product-decisions-required.md` (PD3). Risco residual: validação
jurídica não concluída a tempo da Sprint 03 atrasaria o início de dados
reais de cliente final.

### R12 — Escalonamento de custo de mensageria (BSP) com crescimento de empresas
**Impacto:** médio, financeiro. **Mitigação:** observabilidade de custo por
empresa desde o início (`11-observability.md`), decisão de trocar BSP por
Cloud API direto é reversível (`02-technology-stack.md`).

## Baixos

### R13 — Divergência entre estado do Google Calendar/Tasks alterado manualmente e o BRAÇO
**Impacto:** baixo-médio, tratável por reconciliação periódica
(`06-google-calendar.md` §7).

### R14 — Ausência de MFA no MVP
**Impacto:** baixo no MVP com poucos usuários administrativos por empresa,
crescente conforme a base cresce. **Recomendação:** adicionar antes de GA
público amplo, não bloqueante para Sprint 01–04.

## Resumo por criticidade

| Risco | Severidade | Status | Bloqueia Sprint 01? |
|---|---|---|---|
| R1 | Crítica | Mitigação desenhada, a implementar | Não (mas deve ser o primeiro teste do projeto) |
| R2 | Crítica | Mitigação arquitetural definida | Não (Sprint 01 não usa Runtime ainda) |
| R3 | Crítica | **PD2 RESOLVED** | Não (WhatsApp começa na Sprint 03) |
| R7 | Alta | **PD1 RESOLVED** | Não |
| R4, R5, R6, R8 | Alta | Mitigação definida | Não |
| R9, R10 | Média | R10 confirmado (US06) | Não |
| R11 | Média | **PD3 pending legal validation** | Não (gate é antes da Sprint 03) |
| R12 | Média | Mitigação definida | Não |
| R13, R14 | Baixa | Mitigação definida | Não |
