# BRAÇO — Color System

## 1. Regra

M3 color roles são canônicos.

Não usar cor diretamente em componentes de produto quando existir role semântico correspondente.

## 2. Seeds

| Papel | Seed |
|---|---|
| Brand Primary | `#3156A3` |
| Secondary | `#586578` |
| Tertiary | `#006B5E` |
| Neutral reference | `#5F6368` |

Os esquemas Light e Dark devem ser derivados como Color Schemes M3.

## 3. Roles principais

O produto deve consumir roles como:

- primary
- onPrimary
- primaryContainer
- onPrimaryContainer
- secondary
- secondaryContainer
- tertiary
- tertiaryContainer
- surface
- surfaceContainer
- surfaceContainerLow
- surfaceContainerHigh
- onSurface
- onSurfaceVariant
- outline
- outlineVariant
- error
- errorContainer

## 4. Estados de produto

M3 não cobre sozinho todas as semânticas operacionais do BRAÇO.

Podem existir extensões semânticas controladas para:

- success / working;
- warning / attention.

Esses tokens são extensões de domínio, não substituições do M3.

### Working / Success
Base visual recomendada: família tertiary.

### Attention / Warning
Base visual recomendada: família âmbar/ocre acessível, definida como token de domínio.

### Error
Usar `error` e `errorContainer` do M3.

## 5. Status nunca depende só de cor

Todo status deve combinar:

- texto;
- cor;
- ícone quando útil;
- posição/contexto.

## 6. Uso

Primary:
- CTA principal;
- seleção;
- navegação ativa.

Surface:
- maior parte das superfícies.

Error:
- falha;
- impedimento;
- ação destrutiva quando aplicável.

Attention:
- requer ação, mas não é necessariamente erro.

## 7. Acessibilidade

Contraste deve respeitar os requisitos aplicáveis de WCAG.

Não reduzir contraste por estética.
