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
→ Braço Atendimento
→ Detalhe da função
→ Contratar
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
esperado, mais uma mensagem objetiva de indisponibilidade (ex.: "Em breve.
Este funcionário ainda não está disponível para contratação."), sem CTA de
contratação e sem lista de espera/"Avise-me" nesta fase.

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
- Dialog ou confirmação contextual quando necessário
- Progress/feedback
- Snackbar quando apropriado

## Estados
- loading;
- catálogo vazio/indisponível;
- erro de contratação;
- contratação concluída.

## Compact
Fluxo linear.

## Expanded
Catálogo pode usar grid/list-detail.
