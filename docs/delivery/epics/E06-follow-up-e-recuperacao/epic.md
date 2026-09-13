# E06 — Follow-up e Recuperação

## Objetivo
Garantir continuidade por follow-ups e recuperação de oportunidades.

## Dependência — Templates de WhatsApp (PD2)

Follow-up/lembrete proativo fora da janela de 24h do WhatsApp depende de
**templates pré-aprovados pela Meta/BSP** (não texto livre do LLM). MVP com
5 intenções de template: follow-up de interesse, agendamento incompleto,
lembrete de agendamento, reagendamento, recuperação de oportunidade.
Conteúdo final deve estar **Design Ready até o fim da Sprint 02** e
**submetido à Meta/BSP antes do início da Sprint 03**, dado o lead time de
aprovação. Este épico permanece planejado para a Sprint 05; a
implementação do follow-up proativo fora da janela ativa fica condicionada
ao template aplicável já aprovado. Ver
`docs/technical/16-product-decisions-required.md` (PD2) e
`docs/technical/05-whatsapp.md`.

## Referências
- `docs/00-master.md`
- `docs/prd/01-braco-atendimento.md`
- `docs/prd/02-plataforma-gerencial.md`

## Tarefas (PD4)

Follow-ups que geram tarefas no Google Tasks são acompanhados sempre pela
interface do BRAÇO — a gestão nunca depende de abrir o Google Tasks
diretamente (confirmado em `docs/prd/02-plataforma-gerencial.md`, PD4).

## Histórias
- US40 — Identificar necessidade de follow-up
- US41 — Criar follow-up
- US42 — Executar follow-up
- US43 — Registrar resultado do follow-up
- US44 — Recuperar oportunidade perdida
- US45 — Respeitar limites de contato

## Critério de conclusão
Histórias necessárias ao escopo implementadas, validadas e documentadas conforme Definition of Done.
