# BRAÇO — Sprint 01 Review

**Status:** Accepted  
**Review owner:** GPT — Product Manager + Product Designer  
**Data:** 2026-09-13  
**PR de implementação:** #11  
**Merge commit:** `80ddec0cb9b0e8c5e14d2d3d18c7ac9514d1c38d`

## 1. Executive Summary

A Sprint 01 foi concluída com sucesso.

As oito histórias planejadas foram implementadas, testadas e mergeadas em
`main`.

O objetivo de Produto foi atingido:

> o gestor consegue conhecer o portfólio, contratar o Braço Atendimento,
> visualizá-lo em Minha Equipe e iniciar sua preparação.

Não houve mudança silenciosa de requisito ou de Design.

## 2. Stories Accepted

| Story | Resultado |
|---|---|
| US01 | Accepted |
| US02 | Accepted |
| US03 | Accepted |
| US04 | Accepted |
| US05 | Accepted |
| US06 | Accepted |
| US53 | Accepted |
| US54 | Accepted |

Total:

> **8/8 Accepted**

## 3. Product Acceptance

Produto valida que:

- catálogo comunica a estratégia de equipe digital;
- 5 tipos são apresentados;
- somente Atendimento é contratável;
- `Em breve` é disponibilidade de catálogo, não Employee Status;
- contratação gera funcionário real dentro de Minha Equipe;
- próximo passo é explícito;
- preparação começa sem antecipar escopo da Sprint 02.

## 4. Product Design Acceptance

Product Design valida que:

- Material Design 3 permanece a fonte de verdade;
- Light/Dark theme é derivado das seeds da marca;
- `Em breve` não usa semântica visual de erro ou disabled;
- não existe botão de contratação quebrado/desabilitado para tipos futuros;
- status possui texto;
- Compact foi validado em 380px;
- a implementação preserva o modelo mental de equipe, não de automação.

## 5. Quality & Security Evidence

Foram reportados 13 testes automatizados passando:

- 7 unitários;
- 6 e2e usando banco real.

O isolamento multi-tenant foi validado contra duas empresas reais de teste,
incluindo tentativa de acesso cruzado por identificador.

RBAC, autenticação, idempotência e fluxo de preparação também possuem
cobertura automatizada.

## 6. Engineering Decisions Review

### 6.1 Status inicial direto em Preparando

**PM/Product Design:** Accepted.

Não existe necessidade de apresentar ao gestor uma etapa persistida
`Contratado` no happy path atual.

`Contratado` permanece disponível como estado de domínio para futuros
casos, mas não é uma tela/etapa obrigatória.

### 6.2 Ajuste de RLS para self-lookup

**PM/Product Design:** Technical decision accepted.

Não altera experiência ou regra de negócio.

### 6.3 bcryptjs

**PM/Product Design:** Technical debt accepted for current development
stage.

Gate:

> revisar estratégia de password hashing antes de produção real.

### 6.4 JWT em localStorage

**PM/Product Design:** Technical debt accepted somente para a fase atual de
desenvolvimento/demonstração.

Gate:

> autenticação deve ser endurecida antes de qualquer piloto externo ou
> processamento de dados reais.

A forma técnica de endurecimento permanece responsabilidade de Engenharia.

### 6.5 Componentes próprios em vez de Material Web Components

**PM/Product Design:** Accepted.

Material Design 3 é a fonte de verdade de experiência, não uma biblioteca
específica.

A implementação pode usar componentes próprios quando:

- consome tokens corretos;
- preserva comportamento;
- preserva acessibilidade;
- preserva responsividade;
- não cria Design System paralelo.

Não há requisito de migração para `@material/web` neste momento.

## 7. Carry-over

Nenhuma história da Sprint 01 foi carregada.

## 8. Known Future Gates

### PD2 — WhatsApp Templates

- Content Design Ready;
- submissão Meta/BSP pendente;
- aprovação Meta/BSP pendente.

### PD3 — Data Privacy & Retention

- direção de Produto definida;
- validação jurídica ainda pendente;
- gate antes da Sprint 03 / dados reais de cliente final.

### Security Hardening

Antes de piloto externo/produção real:

- revisar armazenamento de sessão/token;
- revisar password hashing;
- executar nova revisão de segurança da superfície exposta.

## 9. Learnings

- A distinção entre catálogo e equipe funciona bem como modelo mental.
- A distinção `Catalog Availability` vs. `Employee Status` deve ser
  preservada nas próximas sprints.
- A estrutura da preparação é suficientemente estável para evoluir sem
  refazer a Sprint 01.
- Especificações de Design detalhadas antes do desenvolvimento reduziram
  ambiguidades na implementação.
- Testar multi-tenancy já na primeira sprint reduziu um risco crítico cedo.

## 10. Sprint 02 Readiness — Next PM/Design Work

A próxima etapa não é começar a codar imediatamente.

Produto + Design devem refinar o escopo completo da Sprint 02:

> **US07–US17**

O foco será transformar a estrutura vazia do Manual de Trabalho em uma
experiência completa de preparação.

Antes do handoff para Engenharia será necessário fechar:

- estrutura e conteúdo de cada seção;
- campos;
- obrigatoriedade;
- validações;
- progressão;
- salvamento;
- estados completo/incompleto;
- regras de autonomia;
- revisão final;
- responsividade;
- acessibilidade;
- critérios de Design específicos por história.

## 11. Decision

> **SPRINT 01 ACCEPTED AND CLOSED**

Próximo gate:

> **Sprint 02 — Product Ready + Design Ready + Tech Ready**
