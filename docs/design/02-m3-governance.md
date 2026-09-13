# BRAÇO — Governança Material 3

## 1. Fonte canônica

A especificação oficial do Google Material Design 3 é a referência principal
para interface.

A implementação tecnológica pode variar, mas deve preservar a semântica e o
comportamento dos padrões M3.

## 2. Relação com a identidade BRAÇO

O Guia de Identidade Visual BRAÇO Digital v1.0 não substitui o M3.

Ele fornece a camada de expressão:

- logo;
- cores de marca;
- tipografia;
- iconografia;
- tom visual.

Regra:

> **M3 define como funciona. BRAÇO define como se expressa.**

## 3. Theming

O tema BRAÇO deve ser estruturado sobre os subsistemas do M3:

- **Color Scheme**
- **Typography**
- **Shapes**

Motion segue recomendações Material aplicáveis à plataforma.

Os valores do tema devem partir da identidade oficial registrada em:

- `03-theme-strategy.md`
- `04-color-system.md`
- `05-typography.md`
- `06-shape-elevation-iconography.md`

## 4. Material 3 Expressive

M3 Expressive é tratado como evolução dentro do ecossistema Material 3.

Pode ser adotado seletivamente quando:

- aumenta hierarquia;
- melhora percepção de estado;
- melhora foco;
- deixa transições mais compreensíveis;
- aumenta proximidade sem prejudicar operação.

Não deve ser usado apenas para ornamentação.

## 5. Ordem de decisão

1. Existe componente/padrão M3?
2. Se sim, usar.
3. Aplicar identidade BRAÇO.
4. É composição? Combinar M3.
5. É específico do domínio? Criar padrão BRAÇO sobre M3.

## 6. Tokens

Usar tokens semânticos.

Preferir:

- primary
- onPrimary
- primaryContainer
- surface
- onSurface
- outline
- error

A identidade BRAÇO pode adicionar aliases semânticos como:

- brand-primary;
- brand-primary-dark;
- success;
- success-background;
- brand-nav-surface.

Não usar cores hex diretamente espalhadas pelos componentes.

## 7. Componentes base

Não criar variantes arbitrárias de:

- Button
- Icon Button
- FAB
- Text Field
- Checkbox
- Radio
- Switch
- Card
- List
- Tabs
- Dialog
- Snackbar
- Menu
- Tooltip
- Progress Indicator
- Navigation

## 8. Biblioteca vs. Design System

M3 é o Design System.

Nenhuma biblioteca específica de componentes é obrigatória por definição
de Produto/Design.

Engenharia pode usar implementação própria ou biblioteca compatível desde
que preserve:

- semântica M3;
- comportamento;
- tokens;
- acessibilidade;
- responsividade;
- consistência.

## 9. Exceções

Qualquer exceção ao M3 deve documentar:

- problema;
- padrão M3 considerado;
- razão da insuficiência;
- proposta;
- acessibilidade;
- responsividade;
- impacto técnico.

## 10. Regra final

> **Material 3 define a linguagem do sistema. BRAÇO define a experiência e a identidade do trabalho.**
