# BRAÇO — Responsive & Adaptive Rules

## 1. Princípio

> **Simples no celular. Completo no desktop.**

A experiência deve se adaptar ao espaço disponível, não ao nome do dispositivo.

## 2. Window Size Classes

Usar classes Material como referência:

- Compact
- Medium
- Expanded
- Large
- Extra Large

Decisões principais devem considerar largura disponível.

## 3. Compact

Priorizar:
- uma tarefa por vez;
- status;
- atenção;
- CTA principal;
- navegação simples;
- detalhes em drill-down.

Evitar:
- tabelas largas;
- múltiplos painéis simultâneos;
- excesso de ações visíveis.

## 4. Medium

Permitir:
- maior contexto;
- navegação persistente quando adequado;
- layouts lista/detalhe em casos selecionados.

## 5. Expanded e acima

Permitir:
- supporting panes;
- lista + detalhe;
- maior densidade de monitoramento;
- comparação de informações;
- configuração contextual.

## 6. Padrões canônicos

Priorizar padrões adaptativos Material:

- list-detail;
- supporting pane;
- feed quando aplicável.

## 7. Navegação

Compact:
- Navigation Bar ou padrão equivalente quando houver poucas áreas principais;
- menu contextual quando necessário.

Medium/Expanded:
- Navigation Rail ou Navigation Drawer conforme densidade e hierarquia.

## 8. Reflow

Elementos devem reorganizar, não apenas diminuir.

## 9. Teste

Toda experiência relevante deve ser validada pelo menos em:
- compact;
- medium;
- expanded.
