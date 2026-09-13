# BRAÇO — Governança de Desenvolvimento

## Papéis
### Murilo — Product Owner / Sponsor
Visão, estratégia, prioridades e aprovação.

### ChatGPT — Product Manager
PRDs, requisitos, épicos, histórias, critérios, prioridades, sprints e documentação.

### Claude — Engineering / Development
Implementação, decisões técnicas, testes, PRs e impedimentos.

## Hierarquia
```text
MASTER
  ↓
PRD
  ↓
EPIC
  ↓
USER STORY
  ↓
GITHUB ISSUE
  ↓
CODE
```

## Regra
> **Docs definem. Issues operacionalizam. Código implementa.**

## Definition of Ready
- objetivo e contexto;
- critérios;
- regras;
- dependências;
- referência ao PRD/épico;
- escopo claro.

## Definition of Done
- código;
- testes;
- critérios atendidos;
- revisão;
- PR aprovado;
- docs atualizados;
- issue atualizada;
- sem pendências conhecidas diretamente relacionadas.

## Mudança de produto
Descoberta técnica que muda comportamento retorna ao PM antes da implementação.

## Sprints
Planning → Desenvolvimento → Validação → Review → Retrospectiva → Encerramento.

## Governança de Design

### Papéis atualizados

**Murilo — Product Owner / Sponsor**
- visão;
- estratégia;
- prioridades;
- decisão final de negócio.

**GPT — Product Manager + Product Designer**
- requisitos;
- PRDs;
- backlog;
- critérios;
- fluxos;
- arquitetura de informação;
- UX;
- UI;
- Design Foundation;
- padrões;
- Design Ready.

**Claude — Engineering / Development**
- arquitetura técnica;
- implementação;
- testes;
- infraestrutura;
- integrações;
- Tech Ready.

### Gate para desenvolvimento

Histórias com impacto de interface exigem:

> **Product Ready + Design Ready + Tech Ready**

### Fonte de verdade de Design

Google Material Design 3 é o Design System canônico.

A documentação de Product Design fica em `docs/design/`.

## Gate de dados reais de cliente final (PD3)

Nenhum dado real de cliente final entra em produção antes de validação
jurídica da política de retenção/exclusão — gate obrigatório **antes do
início da Sprint 03**. Ver `docs/13-data-privacy-and-retention.md` (Status:
Pending Legal Validation) e
`docs/technical/16-product-decisions-required.md` (PD3). Não bloqueia
Sprint 01 ou Sprint 02.
