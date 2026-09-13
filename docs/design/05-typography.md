# BRAÇO — Typography

## 1. Fonte

Tipografia oficial:

> **Manrope**

Fallback:

> **Inter**

Fallback de sistema pode ser usado depois de Inter quando necessário.

A adoção de Manrope substitui a recomendação provisória anterior de
Roboto/Roboto Flex.

## 2. Relação com Material 3

Os **typography roles M3 continuam canônicos**.

O que muda é a família e os pesos usados pelo Tema BRAÇO.

## 3. Pesos

### Display / Headline
- Manrope Bold / ExtraBold
- peso recomendado: 700–800

### Title / Subtítulo
- Manrope SemiBold
- peso recomendado: 600–700

### Body
- Manrope Regular / Medium
- peso recomendado: 400–500

### Label / Controls
- Manrope Medium / SemiBold
- peso recomendado: 500–600

### Números e indicadores
- Manrope SemiBold
- peso recomendado: 600

## 4. Roles M3

### Display
Uso institucional/onboarding e destaques raros.

### Headline
Títulos de página.

### Title
Cards, seções, dialogs.

### Body
Conteúdo operacional.

### Label
Botões, labels, campos, metadados.

## 5. Diretriz

BRAÇO é produto de trabalho.

Priorizar:

1. leitura;
2. hierarquia;
3. escaneabilidade;
4. proximidade;
5. consistência.

Não usar títulos exageradamente grandes em telas operacionais.

## 6. Aplicação de marca

A logo já possui lettering próprio.

Não tentar recriar a logo usando Manrope.

Manrope é a tipografia da interface e comunicação, não o desenho da marca.

## 7. Conteúdo operacional

Dar hierarquia forte a:

- nome do funcionário;
- status;
- cliente;
- horário;
- valor;
- ação requerida.

## 8. Implementação

Engenharia decide a forma de carregamento da fonte.

Requisitos:

- não bloquear leitura se a fonte falhar;
- usar `Manrope, Inter, system-ui, sans-serif`;
- evitar layout shift significativo;
- não misturar famílias sem necessidade.
