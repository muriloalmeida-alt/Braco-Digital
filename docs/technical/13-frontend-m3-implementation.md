# BRAÇO — Implementação Frontend / Material Design 3

**Importante:** este documento não redefine UX. Toda decisão de fluxo,
arquitetura de informação, navegação, estados e conteúdo já está definida em
`docs/design/` e é tratada aqui como requisito. O que segue são riscos
técnicos, limitações, implicações e opções de implementação para cumprir
essa experiência com fidelidade ao M3.

## 1. Opções de biblioteca M3 avaliadas

| Opção | Fidelidade ao M3 | Maturidade para app complexo | Trade-off |
|---|---|---|---|
| **Material Web Components** (`@material/web`, oficial Google, Lit/Web Components) | Alta — é a implementação oficial de referência do M3 | Média — cobre bem componentes base (Button, Card, TextField, Switch, Dialog, Snackbar, Navigation), mas tem cobertura mais fraca para padrões adaptativos complexos (list-detail, supporting pane) e para uso profundo em React (interop via wrappers) | Melhor fidelidade; mais trabalho de integração em React |
| **MUI (Material UI)** | Média — historicamente M2, suporte a M3 ainda parcial/evoluindo | Alta — ecossistema React maduro, muitos componentes prontos | Risco de a fidelidade ao M3 real ficar comprometida sem esforço extra de tema |
| **Construir do zero sobre tokens M3 + primitivos acessíveis (Radix/shadcn-like)** | Alta, se bem executado | Alta em produtividade para padrões adaptativos custom | Mais esforço inicial de construção de componentes-base; risco de reinventar o que o M3 já resolve, contrariando `02-m3-governance.md` |

**Recomendação:** **Material Web Components como base de componentes**
(cumpre a governança de "usar o padrão M3 quando existir, sem criar sistema
paralelo"), envolvidos em wrappers React finos para integração ergonômica,
**complementados** por primitivos acessíveis próprios apenas para os
padrões adaptativos de layout (list-detail, navigation rail/drawer
responsivo) que a biblioteca ainda não resolve de forma completa — nunca
para reinventar um componente que o M3 já cobre (Button, Card, TextField,
Dialog, Snackbar, etc., conforme lista de `docs/design/02-m3-governance.md`
§6).

Isso é registrado como decisão técnica reversível em
`17-technical-decisions.md`: se a maturidade de `@material/web` para React
se mostrar insuficiente em produção, a camada de wrapper isola o custo de
troca ao componente, não ao produto inteiro.

## 2. Design tokens e tema

Seeds de cor definidos pelo Design (`03-theme-strategy.md`,
`04-color-system.md`: `#3156A3` primary, `#586578` secondary, `#006B5E`
tertiary) são processados pelo utilitário oficial do Material
(`@material/material-color-utilities`) para gerar os Color Schemes Light e
Dark completos — não se deriva a paleta manualmente. Isso garante que os
color roles (primary/onPrimary/surface/outline/error etc.) fiquem
matematicamente consistentes com o algoritmo M3, em vez de aproximados à
mão.

Tokens de extensão de domínio (`success/working`, `attention/warning`,
descritos em `04-color-system.md` §4) são implementados como tokens
adicionais no mesmo sistema de tema — nunca como cores soltas em componentes.

## 3. Light/Dark Scheme

Ambos os esquemas são gerados a partir das mesmas seeds desde o primeiro
componente construído — não é um "modo escuro" adicionado depois. Nenhuma
tela pode fixar cor de fundo/texto/borda; tudo consome token semântico (regra
de `03-theme-strategy.md` §3), o que é verificável em revisão de código
(lint de estilo bloqueando cores hex literais em componentes de produto).

## 4. Typography e Shape

Roboto/Roboto Flex com a escala de tipos M3 (Display/Headline/Title/Body/
Label) via variáveis CSS geradas a partir do tema. Shape segue a escala M3
(`06-shape-elevation-iconography.md`) — aplicada via tokens de shape do
tema, não valores de `border-radius` soltos por componente.

## 5. Responsivo/adaptativo — implicação técnica

`docs/design/08-responsive-adaptive.md` exige suporte a Window Size Classes
(Compact/Medium/Expanded) e padrões como list-detail e supporting pane.
Implicações técnicas:
- Layout deve reagir a **largura de container**, não a media query de
  viewport pura, para telas com painéis (ex.: list-detail dentro de uma área
  já estreitada por navegação lateral) — recomenda-se Container Queries
  (suporte moderno amplo nos browsers-alvo) além de breakpoints globais.
- Navigation Bar (compact) vs. Navigation Rail/Drawer (medium/expanded,
  `11-navigation.md`) deve ser um único componente de navegação que decide
  sua própria apresentação pela largura disponível, não duas implementações
  paralelas mantidas separadamente — reduz risco de divergência de
  comportamento entre os dois modos ao longo do tempo.
- Teste automatizado de snapshot visual nos três breakpoints (compact/
  medium/expanded) é recomendado desde a primeira tela, dado que
  `08-responsive-adaptive.md` §9 exige validação nos três tamanhos como
  critério de qualidade, não só em revisão manual.

## 6. Acessibilidade — implicação técnica

- Componentes de status nunca comunicam só por cor (regra de produto) — em
  código, isso significa que todo componente de status renderiza texto +
  ícone opcional, e cor é reforço, nunca único canal, verificável em
  testes de acessibilidade automatizados (axe-core no CI).
- Motion respeita `prefers-reduced-motion` nativamente — tratado como
  requisito de implementação, não decisão visual op cional.
- Padrões M3 usados (Material Web Components) já vêm com boa base de ARIA;
  o trabalho de engenharia é não quebrar essa semântica ao compor
  (ex.: wrapper React não pode remover atributos ARIA do componente base).

## 7. Riscos técnicos identificados (sem alterar requisito)

| Risco | Onde aparece no Design | Implicação técnica |
|---|---|---|
| Interop React ↔ Web Components ainda tem atrito de ergonomia (props complexos, eventos customizados) | Toda tela | Camada de wrapper fina e testada é obrigatória, não opcional; aumenta esforço inicial de setup |
| Container Queries têm suporte variável em navegadores mais antigos | `08-responsive-adaptive.md` | Definir baseline de navegadores suportados antes da Sprint 01 (ver `14-sprint-01-tech-readiness.md`) |
| M3 Expressive é mencionado como "adoção seletiva" | `02-m3-governance.md` §3 | Engenharia não deve depender de API experimental como peça crítica do MVP (já é regra explícita do Design) — qualquer uso de Expressive precisa ser isolado e opcional |

## 8. O que Engenharia decide (e o que não decide) nesta camada

Decide: framework de componente, estrutura de wrapper, estratégia de bundle,
performance de renderização, ferramenta de teste visual.

Não decide sozinha: hierarquia de informação, significado de status, labels,
comportamento de navegação — qualquer limitação técnica real nessas frentes
volta para o PM/Product Designer, conforme `docs/design/17-design-
engineering-handoff.md`.
