# Fluxo 01 — Contratação de Funcionário

## Objetivo
Permitir que o gestor encontre, compreenda e contrate um funcionário digital.

## Entrada
Minha Equipe.

## Empty state inicial
Se não houver funcionário:

Mensagem:
> Sua equipe digital ainda está vazia. Contrate seu primeiro funcionário para começar.

CTA:
**Conhecer funcionários**

## Fluxo

```text
Minha Equipe
→ Conhecer funcionários
→ Catálogo
→ Detalhe da função
→ Contratar (somente Disponível)
→ Confirmação
→ Funcionário criado em Minha Equipe
→ Status: Contratado/Preparando
→ CTA: Preparar funcionário
```

## Catálogo

Exibe os 5 funcionários do portfólio (`docs/04-employee-catalog.md`). Cada
opção apresenta:
- nome;
- função;
- missão;
- resultado esperado;
- principais responsabilidades;
- disponibilidade (Catalog Availability — `09-product-patterns.md` §1.1):
  **Disponível** (Braço Atendimento) ou **Em breve** (Vendas, Orçamentos,
  Pós-venda, Financeiro).

Apenas o card **Disponível** mostra CTA de contratação. Cards **Em breve**
permanecem com conteúdo legível e acessível ao detalhe.

Especificação visual executável:

- `docs/design/18-catalog-availability-ui-spec.md`

## Ações do card

### Disponível
- `Ver detalhes`
- `Contratar funcionário`

### Em breve
- `Ver detalhes`
- sem CTA de contratação;
- sem botão de contratação desabilitado.

## Detalhe do funcionário

Priorizar:
- o que faz;
- resultado;
- responsabilidades;
- limites;
- como trabalha;
- CTA de contratação — **somente quando Disponível**.

Todos os 5 funcionários têm detalhe visualizável. Para um funcionário **Em
breve**, mostrar normalmente missão, responsabilidades e resultado
esperado e a mensagem:

> **Este funcionário ainda não está disponível para contratação.**

Sem CTA de contratação e sem lista de espera/"Avise-me" nesta fase.

Não mostrar detalhes técnicos.

## Contratação

A contratação deve ser curta.

Após conclusão:
- feedback claro;
- funcionário aparece na equipe;
- próximo passo é explícito.

## Padrões M3
- Cards
- Buttons
- Surface/Container para disponibilidade
- Dialog ou confirmação contextual quando necessário
- Progress/feedback
- Snackbar quando apropriado

## Estados
- loading;
- catálogo vazio/indisponível;
- erro de carregamento;
- erro de contratação;
- contratação concluída.

## Compact
- fluxo linear;
- catálogo em uma coluna;
- no card Disponível, CTA principal mantém prioridade visual.

## Medium
- catálogo preferencialmente em duas colunas.

## Expanded
- catálogo preferencialmente em três colunas;
- detalhe pode usar composição com área contextual de ação.

As decisões finais de layout seguem Window Size Classes e
`docs/design/08-responsive-adaptive.md`.
