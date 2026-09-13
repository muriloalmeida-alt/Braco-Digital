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

Cada opção apresenta:
- nome;
- função;
- missão;
- resultado esperado;
- principais responsabilidades.

## Detalhe do funcionário

Priorizar:
- o que faz;
- resultado;
- responsabilidades;
- limites;
- como trabalha;
- CTA de contratação.

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
