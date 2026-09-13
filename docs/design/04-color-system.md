# BRAÇO — Color System

## 1. Regra

M3 color roles são canônicos.

A paleta oficial BRAÇO fornece os valores de marca.

Não espalhar hex diretamente por componentes.

## 2. Brand tokens

| Token | Valor | Uso |
|---|---|---|
| brand-primary | `#0B4F86` | marca, CTA principal, destaque |
| brand-primary-dark | `#07345A` | navegação, fundos escuros |
| brand-accent | `#32B44A` | sucesso/resultado positivo |
| background | `#F7F9FA` | fundo principal |
| surface | `#FFFFFF` | cards/superfícies |
| surface-secondary | `#E8F3FB` | área informativa |
| text-primary | `#1C2530` | texto principal |
| text-secondary | `#66717D` | apoio |
| border | `#E8ECEF` | bordas/divisores |
| success | `#32B44A` | estados positivos |
| success-background | `#DDF5E2` | container positivo |

## 3. Seeds M3

| Papel | Seed |
|---|---|
| Primary | `#0B4F86` |
| Secondary | `#66717D` |
| Tertiary | `#32B44A` |

Os esquemas M3 continuam sendo derivados/organizados por roles semânticos.

## 4. Mapeamento light recomendado

Objetivo de Produto/Design:

- `primary` → Azul BRAÇO;
- `onPrimary` → Branco;
- `surface` / background principal → Off White;
- `surfaceContainerLowest` / cards de maior contraste → Branco;
- `onSurface` → Grafite;
- `onSurfaceVariant` → Cinza Médio;
- `outlineVariant` → Cinza Claro.

Engenharia pode gerar tonais intermediários pelo algoritmo oficial M3.

Os valores oficiais acima devem permanecer reconhecíveis como âncoras da
marca.

## 5. App Shell

Token de domínio permitido:

`brand-nav-surface = #07345A`

Uso:

- navigation drawer/rail expandido;
- superfícies institucionais escuras.

Texto/ícones sobre essa superfície precisam usar contraste suficiente,
normalmente branco ou roles derivados equivalentes.

## 6. Verde Capacidade

Verde é acento funcional.

Usar para:

- Trabalhando;
- Conectado;
- Concluído;
- Sucesso;
- resultado positivo;
- ganho de capacidade.

Não usar como:

- CTA padrão;
- cor principal de navegação;
- decoração sem significado.

## 7. Azul Claro

`#E8F3FB`

Uso:

- informação;
- suporte;
- superfícies secundárias;
- empty states leves;
- áreas educativas.

Não substituir `primaryContainer` indiscriminadamente se isso quebrar a
semântica do M3.

## 8. Estados de produto

### Working / Success

- base: Verde Capacidade `#32B44A`;
- container preferencial: Verde Claro `#DDF5E2`.

### Attention / Warning

Continuar como extensão semântica própria, em família âmbar/ocre acessível.

Não usar Verde Capacidade para warning.

### Error

Usar `error` / `errorContainer` do M3.

## 9. Status nunca depende só de cor

Todo status deve combinar:

- texto;
- cor;
- ícone quando útil;
- contexto.

## 10. Contraste

- branco sobre Azul BRAÇO/Azul Profundo;
- Grafite sobre Off White/Branco/Azul Claro/Verde Claro;
- evitar Verde Capacidade em textos pequenos sobre branco;
- cumprir contraste aplicável de WCAG.

## 11. Proporção

Referência:

- 60% branco/off white;
- 25% azul;
- 10% cinzas;
- 5% verde.

O verde deve permanecer acento.
