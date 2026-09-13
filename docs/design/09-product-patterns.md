# BRAÇO — Product Patterns

Padrões de domínio são construídos sobre componentes M3.

## 1. Employee Card

Objetivo: representar um funcionário digital em Minha Equipe.

Conteúdo mínimo:
- identidade;
- função;
- status;
- resumo de atividade ou próximo passo;
- atenção;
- ação principal.

Base M3:
- Card;
- List-like content;
- Icon/Avatar;
- Badge/label;
- Button/Menu.

## 1.1 Catalog Availability

Estados:
- **Disponível**
- **Em breve**

Especificação:
- `docs/design/18-catalog-availability-ui-spec.md`

### Disponível
- `Ver detalhes`
- `Contratar funcionário`

### Em breve
- conteúdo legível;
- label `Em breve`;
- `Ver detalhes`;
- sem CTA de contratação;
- sem card disabled.

## 2. Employee Status

- Contratado
- Preparando
- Pronto
- Trabalhando
- Pausado
- Precisa de atenção
- Desativado

Sempre exibir texto.

## 3. Work Manual

Experiência para ensinar ao funcionário como trabalhar.

### Estrutura

8 etapas + Revisão:
- Empresa
- Produtos/Serviços
- Responsabilidades
- Regras e limites
- Autonomia
- Pessoas e responsáveis
- Comunicação
- Recursos
- Revisão

### Padrão

- overview;
- progresso;
- section status;
- autosave;
- validação;
- CTA Continuar;
- review final;
- pendências acionáveis.

### Regras

- não é prompt builder;
- contexto compartilhado é identificado;
- limites de sistema são read-only;
- autonomia é por responsabilidade;
- recursos são condicionais às responsabilidades;
- concluir preparação é explícito;
- concluir preparação muda para `Pronto`, não `Trabalhando`.

Referências:
- `docs/design/22-work-manual-content-model.md`
- `docs/design/23-preparation-experience-spec.md`
- `docs/design/24-work-resources-ui-spec.md`

## 4. Activation Checklist

Lista clara de pré-requisitos antes da ativação.

A Activation Checklist é Sprint 03 e não deve ser confundida com a Revisão
do Manual da Sprint 02.

## 5. Work Timeline

Eventos relevantes do trabalho, não logs técnicos.

## 6. Human Handoff

Estados:
- solicitado;
- aguardando;
- assumido;
- resolvido;
- devolvido.

## 7. Attention Item

Responder:
- o que aconteceu?
- por que importa?
- o que fazer?
- quem resolve?

## 8. Result Card

- indicador;
- contexto;
- período;
- variação;
- exploração.

## 9. Integration Status

Estados:
- Não configurado
- Conectando
- Conectado
- Precisa de atenção
- Desconectado
- Não necessário

Status sempre textual.

## 10. Conversation Surface

Diferenciar:
- cliente;
- funcionário digital;
- humano;
- eventos relevantes.

Não expor modelo/prompt.
