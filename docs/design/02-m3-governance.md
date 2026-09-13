# BRAÇO — Governança Material 3

## 1. Fonte canônica

A especificação oficial do Google Material Design 3 é a referência principal para interface.

A implementação tecnológica pode variar, mas deve preservar a semântica e comportamento dos padrões M3.

## 2. Theming

O tema BRAÇO deve ser estruturado sobre os subsistemas do M3:

- **Color Scheme**
- **Typography**
- **Shapes**

Motion deve seguir as recomendações Material aplicáveis à plataforma.

## 3. Material 3 Expressive

M3 Expressive é tratado como evolução dentro do ecossistema Material 3.

Pode ser adotado seletivamente quando:

- aumenta hierarquia;
- melhora percepção de estado;
- melhora foco;
- deixa transições mais compreensíveis.

Não deve ser usado apenas para ornamentação.

Engenharia não deve depender de API experimental como peça crítica do MVP sem decisão técnica explícita.

## 4. Ordem de decisão

1. Existe componente/padrão M3?
2. Se sim, usar.
3. Precisa de identidade? Aplicar tema.
4. É composição? Combinar M3.
5. É específico do domínio? Criar padrão BRAÇO sobre M3.

## 5. Tokens

Usar tokens semânticos.

Preferir:
- primary
- onPrimary
- primaryContainer
- surface
- onSurface
- outline
- error

Evitar nomenclatura de implementação como:
- blue500
- grey200
- redError

## 6. Componentes base

Não criar variantes próprias arbitrárias de:

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

## 7. Exceções

Qualquer exceção ao M3 deve documentar:

- problema;
- padrão M3 considerado;
- razão da insuficiência;
- proposta;
- acessibilidade;
- responsividade;
- impacto técnico.

## 8. Regra final

> **Material 3 define a linguagem do sistema. BRAÇO define a experiência do trabalho.**
