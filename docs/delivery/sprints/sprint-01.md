# Sprint 01

**Status:** Concluída e aceita por Product Management + Product Design  
**Implementação:** PR #11 — mergeada em `main`  
**Merge commit:** `80ddec0cb9b0e8c5e14d2d3d18c7ac9514d1c38d`

## Objetivo

> **Permitir que o gestor inicie a contratação de um Braço Atendimento e tenha um funcionário criado dentro da sua equipe.**

## Contexto

Parte do plano de entrega dos PRDs 01 e 02.

A Sprint 01 foi a primeira fatia implementada em código do BRAÇO.

## Resultado esperado

O gestor vê os 5 funcionários do portfólio no catálogo (Atendimento
Disponível; Vendas, Orçamentos, Pós-venda e Financeiro Em breve), escolhe
e contrata Atendimento, e visualiza o funcionário em Minha Equipe como
preparando.

## Resultado entregue

Resultado esperado atingido.

O produto permite:

- visualizar os 5 funcionários do catálogo;
- distinguir `Disponível` de `Em breve`;
- acessar o detalhe dos 5 tipos;
- contratar somente Braço Atendimento;
- impedir contratação de tipos `Em breve` também no backend;
- evitar contratação duplicada via idempotência;
- visualizar o funcionário contratado em Minha Equipe;
- visualizar status operacional em texto;
- identificar o próximo passo;
- iniciar a preparação;
- visualizar as 9 seções do Manual de Trabalho em estado inicial/incompleto;
- manter o escopo de preenchimento das seções fora da Sprint 01.

## Onboarding (PD1)

Esta sprint opera com **empresa e usuário Owner pré-provisionados**
(onboarding manual/piloto — ver `docs/06-mvp.md` e
`docs/technical/16-product-decisions-required.md` PD1). Nenhuma história
desta sprint cobre criação de conta/empresa.

## Escopo de US06 confirmado

US06 cobre apenas entrar na preparação, ver a visão geral e a estrutura de
seções com estado inicial/incompleto, e identificar o próximo passo.

Não inclui preencher nenhuma seção.

O preenchimento pertence a US07–US15 na Sprint 02; US16 e US17 completam
o controle de incompletude e status de preparação.

## Histórias selecionadas

- US01 — Visualizar funcionários disponíveis
- US02 — Visualizar detalhes do funcionário
- US03 — Contratar funcionário
- US04 — Visualizar funcionário contratado
- US05 — Identificar próximo passo
- US06 — Iniciar preparação
- US53 — Visualizar equipe
- US54 — Visualizar status

## Dependências

- Base do produto e PRDs aprovados.
- Histórias com Definition of Ready.
- Technical Discovery concluída.
- Product Decisions PD1–PD5 tratadas.
- Product Design Patch 03 aplicado.

## Critérios de sucesso

- [x] fluxo principal executável;
- [x] histórias críticas validadas;
- [x] resultado esperado demonstrável;
- [x] nenhuma decisão relevante incorporada silenciosamente;
- [x] segurança multi-tenant validada;
- [x] experiência visual principal validada contra a especificação.

## Definition of Done

- [x] código implementado;
- [x] testes automatizados;
- [x] critérios atendidos;
- [x] revisão técnica;
- [x] validação visual;
- [x] docs atualizados quando necessário;
- [x] implementação mergeada em `main`.

## Evidências

### Código

- PR #11 — Sprint 01
- merge commit: `80ddec0cb9b0e8c5e14d2d3d18c7ac9514d1c38d`
- backend: `apps/api`
- frontend: `apps/web`

### Testes

13 testes automatizados passando:

- 7 unitários;
- 6 e2e contra PostgreSQL real.

Os testes e2e cobrem, entre outros:

- autenticação;
- RBAC;
- isolamento entre tenants;
- idempotência;
- proteção contra contratação de `Em breve`;
- início da preparação.

### Design

Validação visual realizada no app real, incluindo viewport Compact de
380px.

A implementação respeitou:

- Material Design 3 como fonte de verdade;
- tema gerado a partir das seeds da marca;
- Catalog Availability separado de Employee Status;
- card `Em breve` sem opacity reduzida;
- ausência de CTA de contratação em `Em breve`;
- status sempre comunicado em texto.

## Riscos e impedimentos

Nenhum bloqueio funcional permanece para o encerramento da Sprint 01.

Permanecem gates futuros já conhecidos:

- PD2 — submissão/aprovação dos templates WhatsApp;
- PD3 — validação jurídica de retenção/exclusão antes da Sprint 03.

### Dívida técnica conhecida — não bloqueante da Sprint 01

Registrada em `docs/technical/18-running-the-app.md`:

- bcryptjs no lugar de Argon2id;
- JWT em `localStorage`;
- componentes próprios consumindo tokens M3 em vez de Material Web Components.

Direção de PM/Product Design:

- escolha de biblioteca de componentes continua sendo decisão técnica,
  desde que o comportamento, acessibilidade e linguagem M3 sejam preservados;
- autenticação deve ser endurecida antes de uso externo com dados reais;
- estratégia de hash deve ser reavaliada antes de produção real.

## Encerramento

### Resultado

**Sprint 01 concluída com sucesso e aceita por Product Management + Product Design.**

O objetivo da sprint foi atingido e o resultado está implementado,
testado e mergeado em `main`.

### Histórias concluídas

- US01
- US02
- US03
- US04
- US05
- US06
- US53
- US54

**Total: 8 de 8.**

### Histórias carregadas

Nenhuma.

### Decisões

- contratação cria o funcionário diretamente em `Preparando` na
  implementação atual; aceito para o fluxo aprovado;
- `Contratado` permanece como estado válido do domínio, mas não é uma etapa
  persistida obrigatória do happy path atual;
- detalhes técnicos de RLS, hashing, armazenamento de token e biblioteca de
  componentes permanecem sob responsabilidade de Engenharia, respeitando
  os gates de segurança e Design.

### Aprendizados

1. A arquitetura multi-tenant consegue sustentar a primeira fatia funcional.
2. O padrão `Catalog Availability` é implementável sem confundir disponibilidade com status operacional.
3. O Design System M3 pode ser preservado por tokens e comportamento sem depender obrigatoriamente de uma biblioteca específica.
4. O fluxo `Contratar → Minha Equipe → Preparar` está validado de ponta a ponta.
5. A estrutura inicial do Manual de Trabalho está pronta para receber o conteúdo da Sprint 02.
6. Decisões técnicas explícitas e documentadas evitam mudanças silenciosas de Produto/Design.

## Próxima Sprint

A Sprint 02 permanece com o escopo aprovado:

- US07 — Informar dados da empresa
- US08 — Cadastrar produtos e serviços
- US09 — Definir responsabilidades
- US10 — Definir regras e limites
- US11 — Definir autonomia
- US12 — Informar equipe e responsáveis
- US13 — Definir estilo de comunicação
- US14 — Configurar recursos de trabalho
- US15 — Revisar Manual de Trabalho
- US16 — Identificar preparação incompleta
- US17 — Visualizar status de preparação

Antes de desenvolvimento, essas histórias devem passar novamente pelo gate:

> **Product Ready + Design Ready + Tech Ready**

## Design Readiness

- [x] fluxo aplicável definido;
- [x] padrão M3/padrão BRAÇO identificado;
- [x] estados relevantes definidos;
- [x] comportamento Compact definido;
- [x] comportamento Medium/Expanded definido quando relevante;
- [x] conteúdo crítico definido;
- [x] acessibilidade considerada;
- [x] implementação visual validada no app real.

Gate final da Sprint 01:

> **Product Ready + Design Ready + Tech Ready + Implemented + Validated**

### Referências de Design

- `docs/design/flows/01-hiring.md`
- `docs/design/flows/02-preparation.md`
- `docs/design/09-product-patterns.md`
- `docs/design/10-information-architecture.md`
- `docs/design/11-navigation.md`
- `docs/design/12-status-and-states.md`
- `docs/design/18-catalog-availability-ui-spec.md`
