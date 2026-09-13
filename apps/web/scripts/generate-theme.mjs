/**
 * Gera docs/design/03-theme-strategy.md + 04-color-system.md como CSS real:
 * deriva os Color Schemes Light e Dark do M3 a partir das seeds de marca
 * (#3156A3 primary, #586578 secondary, #006B5E tertiary), usando o
 * algoritmo oficial do Material (@material/material-color-utilities) —
 * não se aproxima a paleta manualmente (docs/technical/13-frontend-m3-
 * implementation.md §2).
 *
 * Roda em build-time (não é dependência de runtime do bundle). Saída:
 * src/theme/tokens.css.
 *
 * Extensões de domínio (não substituem M3, são tokens adicionais —
 * docs/design/04-color-system.md §4):
 *   --md-ext-color-success*      -> alias da família tertiary (decisão do
 *                                    Design: "base visual recomendada:
 *                                    família tertiary")
 *   --md-ext-color-attention*    -> seed âmbar/ocre própria, acessível
 */
import { argbFromHex, hexFromArgb, TonalPalette } from '@material/material-color-utilities';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const PRIMARY_SEED = '#3156A3';
const SECONDARY_SEED = '#586578';
const TERTIARY_SEED = '#006B5E';
const ERROR_SEED = '#B3261E'; // baseline M3 error hue
const ATTENTION_SEED = '#8C5000'; // âmbar/ocre acessível — extensão de domínio

const primary = TonalPalette.fromInt(argbFromHex(PRIMARY_SEED));
const secondary = TonalPalette.fromInt(argbFromHex(SECONDARY_SEED));
const tertiary = TonalPalette.fromInt(argbFromHex(TERTIARY_SEED));
const error = TonalPalette.fromInt(argbFromHex(ERROR_SEED));
const attention = TonalPalette.fromInt(argbFromHex(ATTENTION_SEED));
const neutral = TonalPalette.fromHueAndChroma(primary.hue, 4);
const neutralVariant = TonalPalette.fromHueAndChroma(primary.hue, 8);

const tone = (palette, t) => hexFromArgb(palette.tone(t));

function roles(scheme) {
  const isDark = scheme === 'dark';
  const t = isDark
    ? {
        primary: 80, onPrimary: 20, primaryContainer: 30, onPrimaryContainer: 90,
        secondary: 80, onSecondary: 20, secondaryContainer: 30, onSecondaryContainer: 90,
        tertiary: 80, onTertiary: 20, tertiaryContainer: 30, onTertiaryContainer: 90,
        error: 80, onError: 20, errorContainer: 30, onErrorContainer: 90,
        attention: 80, onAttention: 20, attentionContainer: 30, onAttentionContainer: 90,
        surface: 6, onSurface: 90, surfaceVariant: 30, onSurfaceVariant: 80,
        outline: 60, outlineVariant: 30,
        surfaceDim: 6, surfaceBright: 24,
        surfaceContainerLowest: 4, surfaceContainerLow: 10, surfaceContainer: 12,
        surfaceContainerHigh: 17, surfaceContainerHighest: 22,
        inverseSurface: 90, inverseOnSurface: 20, inversePrimary: 40,
      }
    : {
        primary: 40, onPrimary: 100, primaryContainer: 90, onPrimaryContainer: 10,
        secondary: 40, onSecondary: 100, secondaryContainer: 90, onSecondaryContainer: 10,
        tertiary: 40, onTertiary: 100, tertiaryContainer: 90, onTertiaryContainer: 10,
        error: 40, onError: 100, errorContainer: 90, onErrorContainer: 10,
        attention: 40, onAttention: 100, attentionContainer: 90, onAttentionContainer: 10,
        surface: 98, onSurface: 10, surfaceVariant: 90, onSurfaceVariant: 30,
        outline: 50, outlineVariant: 80,
        surfaceDim: 87, surfaceBright: 98,
        surfaceContainerLowest: 100, surfaceContainerLow: 96, surfaceContainer: 94,
        surfaceContainerHigh: 92, surfaceContainerHighest: 90,
        inverseSurface: 20, inverseOnSurface: 95, inversePrimary: 80,
      };

  return `
  --md-sys-color-primary: ${tone(primary, t.primary)};
  --md-sys-color-on-primary: ${tone(primary, t.onPrimary)};
  --md-sys-color-primary-container: ${tone(primary, t.primaryContainer)};
  --md-sys-color-on-primary-container: ${tone(primary, t.onPrimaryContainer)};
  --md-sys-color-secondary: ${tone(secondary, t.secondary)};
  --md-sys-color-on-secondary: ${tone(secondary, t.onSecondary)};
  --md-sys-color-secondary-container: ${tone(secondary, t.secondaryContainer)};
  --md-sys-color-on-secondary-container: ${tone(secondary, t.onSecondaryContainer)};
  --md-sys-color-tertiary: ${tone(tertiary, t.tertiary)};
  --md-sys-color-on-tertiary: ${tone(tertiary, t.onTertiary)};
  --md-sys-color-tertiary-container: ${tone(tertiary, t.tertiaryContainer)};
  --md-sys-color-on-tertiary-container: ${tone(tertiary, t.onTertiaryContainer)};
  --md-sys-color-error: ${tone(error, t.error)};
  --md-sys-color-on-error: ${tone(error, t.onError)};
  --md-sys-color-error-container: ${tone(error, t.errorContainer)};
  --md-sys-color-on-error-container: ${tone(error, t.onErrorContainer)};
  --md-sys-color-surface: ${tone(neutral, t.surface)};
  --md-sys-color-on-surface: ${tone(neutral, t.onSurface)};
  --md-sys-color-surface-variant: ${tone(neutralVariant, t.surfaceVariant)};
  --md-sys-color-on-surface-variant: ${tone(neutralVariant, t.onSurfaceVariant)};
  --md-sys-color-outline: ${tone(neutralVariant, t.outline)};
  --md-sys-color-outline-variant: ${tone(neutralVariant, t.outlineVariant)};
  --md-sys-color-surface-dim: ${tone(neutral, t.surfaceDim)};
  --md-sys-color-surface-bright: ${tone(neutral, t.surfaceBright)};
  --md-sys-color-surface-container-lowest: ${tone(neutral, t.surfaceContainerLowest)};
  --md-sys-color-surface-container-low: ${tone(neutral, t.surfaceContainerLow)};
  --md-sys-color-surface-container: ${tone(neutral, t.surfaceContainer)};
  --md-sys-color-surface-container-high: ${tone(neutral, t.surfaceContainerHigh)};
  --md-sys-color-surface-container-highest: ${tone(neutral, t.surfaceContainerHighest)};
  --md-sys-color-inverse-surface: ${tone(neutral, t.inverseSurface)};
  --md-sys-color-inverse-on-surface: ${tone(neutral, t.inverseOnSurface)};
  --md-sys-color-inverse-primary: ${tone(primary, t.inversePrimary)};

  /* Extensões de domínio BRAÇO — docs/design/04-color-system.md §4 */
  --md-ext-color-success: var(--md-sys-color-tertiary);
  --md-ext-color-on-success: var(--md-sys-color-on-tertiary);
  --md-ext-color-success-container: var(--md-sys-color-tertiary-container);
  --md-ext-color-on-success-container: var(--md-sys-color-on-tertiary-container);
  --md-ext-color-attention: ${tone(attention, t.attention)};
  --md-ext-color-on-attention: ${tone(attention, t.onAttention)};
  --md-ext-color-attention-container: ${tone(attention, t.attentionContainer)};
  --md-ext-color-on-attention-container: ${tone(attention, t.onAttentionContainer)};`;
}

const css = `/* Gerado por scripts/generate-theme.mjs — não editar à mão.
 * Seeds: primary ${PRIMARY_SEED}, secondary ${SECONDARY_SEED}, tertiary ${TERTIARY_SEED}
 * (docs/design/03-theme-strategy.md, 04-color-system.md).
 * Para alterar cores, edite as seeds acima e rode: npm run theme:generate
 */
:root {${roles('light')}
}

@media (prefers-color-scheme: dark) {
  :root {${roles('dark')}
  }
}

:root[data-theme='dark'] {${roles('dark')}
}

:root[data-theme='light'] {${roles('light')}
}
`;

const outPath = fileURLToPath(new URL('../src/theme/tokens.css', import.meta.url));
writeFileSync(outPath, css, 'utf-8');
console.log(`Tema M3 gerado em ${outPath}`);
