# BRAÇO — Catalog Availability UI Spec

**Status:** Approved — Design Ready  
**Owner:** GPT — Product Manager + Product Designer  
**Aplica-se a:** Sprint 01 — US01, US02, US03  
**Design System canônico:** Google Material Design 3 (M3)

## 1. Objetivo

Definir visualmente e comportamentalmente como o catálogo de funcionários
comunica a disponibilidade de contratação sem confundir esse conceito com
o status operacional de um funcionário já contratado.

Conceitos separados:

- **Catalog Availability:** `Disponível` | `Em breve`
- **Employee Status:** `Contratado` | `Preparando` | `Pronto` |
  `Trabalhando` | `Pausado` | `Precisa de atenção` | `Desativado`

`Catalog Availability` existe somente no catálogo e no detalhe de um tipo
de funcionário ainda não contratado.

## 2. Princípio

> **Em breve é informação, não incapacidade da interface.**

Um funcionário `Em breve` continua sendo compreensível, explorável e
navegável. O produto apenas impede a contratação.

Não usar:

- opacity reduzida no card inteiro;
- botão `Contratar` desabilitado;
- cursor/estado visual que faça o card parecer quebrado;
- cor como único indicador;
- lock icon como metáfora principal.

## 3. Componente base

O card de catálogo é uma composição M3.

Base:

- Card / Outlined Card;
- Material Symbols quando aplicável;
- typography roles M3;
- semantic color roles;
- Text Button;
- Filled Button;
- Surface/Container para o label de disponibilidade.

O label de disponibilidade é **informativo e não interativo**.

Não deve receber comportamento de Chip clicável.

## 4. Anatomia do card

Ordem recomendada:

1. identificação visual do tipo de funcionário;
2. nome;
3. função;
4. label de disponibilidade;
5. missão em uma frase;
6. resultado esperado;
7. até 3 responsabilidades principais;
8. área de ações.

### Hierarquia

**Nome**
- role sugerido: `titleMedium`.

**Função**
- role sugerido: `bodyMedium` ou `labelLarge`, conforme densidade.

**Missão**
- role sugerido: `bodyMedium`.

**Resultado esperado**
- conteúdo curto e escaneável;
- pode usar superfície tonal leve para destaque, sem competir com a ação.

**Responsabilidades**
- máximo de 3 no card;
- conteúdo completo permanece no detalhe.

## 5. Label — Disponível

Texto:

> **Disponível**

Direção visual:

- label estático;
- container semântico de sucesso/working já previsto pela fundação BRAÇO;
- texto sempre presente;
- ícone de confirmação é opcional e apenas complementar.

A cor nunca substitui o texto.

## 6. Label — Em breve

Texto:

> **Em breve**

Direção visual:

- label estático;
- `secondaryContainer` / role equivalente do Tema BRAÇO;
- `onSecondaryContainer` / role equivalente para texto;
- contraste normal;
- sem opacity reduzida.

Não usar visual de erro ou warning. `Em breve` não é um problema.

## 7. Card — Disponível

Ações:

- `Ver detalhes` — Text Button;
- `Contratar funcionário` — Filled Button.

O card em si não precisa ser uma superfície clicável quando os controles
acima estiverem presentes. Isso evita interação aninhada e torna o foco
mais previsível.

### Wireframe

```text
┌──────────────────────────────────────────┐
│ [ícone]  Braço Atendimento   [Disponível]│
│          Recepcionista Digital           │
│                                          │
│ Atende seus clientes e conduz cada       │
│ conversa para o próximo passo.           │
│                                          │
│ Resultado                                │
│ Mais clientes atendidos e agendados.     │
│                                          │
│ • Responde dúvidas                       │
│ • Apresenta serviços                     │
│ • Realiza agendamentos                   │
│                                          │
│ Ver detalhes     [Contratar funcionário] │
└──────────────────────────────────────────┘
```

## 8. Card — Em breve

Ações:

- `Ver detalhes` — Text Button;
- **não existe** `Contratar funcionário`;
- não existe botão desabilitado ocupando o espaço da ação ausente.

### Wireframe

```text
┌──────────────────────────────────────────┐
│ [ícone]  Braço Vendas        [Em breve]  │
│          Vendedor Digital                │
│                                          │
│ Transforma interesse em oportunidade     │
│ e oportunidade em venda.                 │
│                                          │
│ Resultado                                │
│ Mais oportunidades convertidas.          │
│                                          │
│ • Qualifica oportunidades                │
│ • Conduz a conversa comercial            │
│ • Faz acompanhamento                     │
│                                          │
│ Ver detalhes                             │
└──────────────────────────────────────────┘
```

## 9. Página de detalhe — Disponível

Estrutura:

```text
Voltar para catálogo

Braço Atendimento                    [Disponível]
Recepcionista Digital

Missão
[...]

Resultado esperado
[...]

O que faz
[...]

Quando chama uma pessoa
[...]

Como trabalha
[...]

[Contratar funcionário]
```

Em Compact, o CTA pode ficar ao final do conteúdo ou em região persistente
quando a implementação preservar acessibilidade e não cobrir conteúdo.

Em Expanded, o CTA pode ocupar área de ação lateral/contextual.

## 10. Página de detalhe — Em breve

Manter a mesma estrutura informacional do funcionário disponível.

No topo:

```text
Braço Vendas                         [Em breve]
Vendedor Digital
```

Inserir uma superfície tonal informativa:

> **Este funcionário ainda não está disponível para contratação.**

Sem:

- CTA `Contratar`;
- lista de espera;
- `Avise-me`;
- captura de lead;
- data prometida de lançamento.

CTA permitido:

- `Voltar para catálogo`.

## 11. Responsive

### Compact
- 1 coluna;
- cards ocupam largura disponível;
- ações do card Disponível podem empilhar:
  1. `Contratar funcionário`;
  2. `Ver detalhes`.
- prioridade visual da ação principal permanece clara.

### Medium
- preferencialmente 2 colunas;
- manter alturas visualmente coerentes sem truncar informação crítica.

### Expanded
- preferencialmente 3 colunas;
- não esticar cards excessivamente;
- permitir comparação rápida entre funções.

A implementação deve seguir Window Size Classes e padrões adaptativos
definidos em `docs/design/08-responsive-adaptive.md`.

## 12. Interaction states

Todos os controles interativos devem possuir estados M3 aplicáveis:

- hover;
- focus;
- pressed;
- loading quando a ação realmente processar algo;
- error quando aplicável.

`Em breve` não possui estado disabled de card.

## 13. Loading

Catálogo:

- usar skeleton/progress coerente com M3;
- preservar a estrutura geral para reduzir layout shift;
- não exibir falsamente disponibilidade antes do dado chegar.

## 14. Error

Quando o catálogo não puder ser carregado:

Título:

> Não foi possível carregar os funcionários.

Mensagem:

> Tente novamente. Se o problema continuar, volte mais tarde.

Ação:

> **Tentar novamente**

## 15. Accessibility

Obrigatório:

- disponibilidade lida como texto;
- contraste conforme fundação de acessibilidade;
- ordem de foco coerente;
- controles nomeados;
- nenhum significado comunicado só por cor;
- `Em breve` não deve usar semântica de `disabled`;
- touch target e focus target conforme M3/plataforma;
- screen reader deve conseguir identificar:
  - nome;
  - função;
  - disponibilidade;
  - ações disponíveis.

Exemplo de nome acessível:

> "Braço Vendas, Vendedor Digital, Em breve. Ver detalhes."

## 16. Regra de conteúdo

`Em breve` comunica disponibilidade, não promessa de prazo.

Não usar:

- "Lançando em breve";
- "Chega logo";
- datas estimadas sem decisão formal de roadmap.

## 17. Critério de aceite visual

US01/US02/US03 estão visualmente Design Ready quando:

- os 5 tipos aparecem com hierarquia consistente;
- Atendimento é claramente `Disponível`;
- os outros 4 são claramente `Em breve`;
- `Em breve` continua legível/navegável;
- apenas Atendimento oferece contratação;
- detalhe dos 5 é acessível;
- Compact/Medium/Expanded respeitam esta especificação;
- estados de foco/loading/error são implementados;
- não há mistura entre Catalog Availability e Employee Status.
