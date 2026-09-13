/**
 * Gera docs/design/03-theme-strategy.md + 04-color-system.md como CSS real:
 * deriva os Color Schemes Light e Dark do M3 a partir das seeds oficiais de
 * marca (Guia de Identidade Visual BRAÇO Digital v1.0), usando o algoritmo
 * oficial do Material (@material/material-color-utilities) — não se
 * aproxima a paleta manualmente (docs/technical/13-frontend-m3-
 * implementation.md §2).
 *
 * Roda em build-time (não é dependência de runtime do bundle). Saída:
 * src/theme/tokens.css.
 *
 * Seeds oficiais (docs/design/03-theme-strategy.md, 04-color-system.md §3):
 *   Primary   -> Azul BRAÇO      #0B4F86
 *   Secondary -> Cinza Médio     #66717D
 *   Tertiary  -> Verde Capacidade #32B44A
 *
 * Âncoras de marca do Light Scheme (docs/design/03-theme-strategy.md §3,
 * docs/design/04-color-system.md §2/§4) — o M3 continua responsável pelos
 * demais roles e tons intermediários, mas estes valores precisam permanecer
 * reconhecíveis e por isso são fixados em vez de puramente calculados:
 *   surface (fundo principal)     -> #F7F9FA (Off White)
 *   onSurface (texto principal)   -> #1C2530 (Grafite)
 *   onSurfaceVariant (texto sec.) -> #66717D (Cinza Médio)
 *   outlineVariant (bordas)       -> #E8ECEF (Cinza Claro)
 *   tertiaryContainer (success-background) -> #DDF5E2 (Verde Claro)
 *   primary (CTA principal)       -> #0B4F86 (Azul BRAÇO), exato — é o
 *      único role de marca citado nominalmente como "CTA principal" nos
 *      critérios de aceite; contraste com onPrimary branco é 8.5:1 (WCAG AAA),
 *      então fixar o tom exato não tem custo de acessibilidade.
 * `surfaceContainerLowest` (cards) já resulta em #FFFFFF por definição do
 * algoritmo (tone 100 é sempre branco), sem necessidade de override.
 *
 * O tom 40 algorítmico de tertiary (usado como `--md-sys-color-tertiary`,
 * texto de status "success") NÃO é fixado no hex cru do seed (#32B44A):
 * como texto sobre superfícies claras, o verde puro da marca dá ~2.5:1 de
 * contraste (reprova WCAG AA), enquanto o tom 40 gerado pelo algoritmo dá
 * ~5.8:1. O hex de marca continua vivo em `tertiaryContainer`
 * (success-background) e em qualquer preenchimento sólido/ícone maior, que
 * são os usos onde a marca precisa ser reconhecível — texto pequeno usa o
 * tom acessível.
 *
 * Extensões de domínio (não são roles M3, são tokens adicionais de marca —
 * docs/design/04-color-system.md §4/§5/§7):
 *   --braco-color-nav-surface        -> Azul Profundo #07345A, fixo nos dois
 *                                        schemes (App Shell/navegação, não
 *                                        varia com light/dark — é a mesma
 *                                        superfície institucional escura).
 *   --braco-color-surface-secondary  -> Azul Claro (#E8F3FB no light;
 *                                        derivado do primary no dark) para
 *                                        áreas informativas/empty states.
 *   --md-ext-color-success*          -> alias da família tertiary (decisão
 *                                        de Design: "base visual recomendada:
 *                                        família tertiary")
 *   --md-ext-color-attention*        -> seed âmbar/ocre própria, acessível
 */
import { argbFromHex, hexFromArgb, TonalPalette } from '@material/material-color-utilities';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const PRIMARY_SEED = '#0B4F86'; // Azul BRAÇO
const SECONDARY_SEED = '#66717D'; // Cinza Médio
const TERTIARY_SEED = '#32B44A'; // Verde Capacidade
const ERROR_SEED = '#B3261E'; // baseline M3 error hue
const ATTENTION_SEED = '#8C5000'; // âmbar/ocre acessível — extensão de domínio

const BRAND_NAV_SURFACE = '#07345A'; // Azul Profundo — fixo, não varia com o scheme
const BRAND_SURFACE_SECONDARY_LIGHT = '#E8F3FB'; // Azul Claro

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

  let css = `
  --md-sys-color-primary: ${isDark ? tone(primary, t.primary) : PRIMARY_SEED};
  --md-sys-color-on-primary: ${tone(primary, t.onPrimary)};
  --md-sys-color-primary-container: ${tone(primary, t.primaryContainer)};
  --md-sys-color-on-primary-container: ${tone(primary, t.onPrimaryContainer)};
  --md-sys-color-secondary: ${tone(secondary, t.secondary)};
  --md-sys-color-on-secondary: ${tone(secondary, t.onSecondary)};
  --md-sys-color-secondary-container: ${tone(secondary, t.secondaryContainer)};
  --md-sys-color-on-secondary-container: ${tone(secondary, t.onSecondaryContainer)};
  --md-sys-color-tertiary: ${tone(tertiary, t.tertiary)};
  --md-sys-color-on-tertiary: ${tone(tertiary, t.onTertiary)};
  --md-sys-color-tertiary-container: ${isDark ? tone(tertiary, t.tertiaryContainer) : '#DDF5E2'};
  --md-sys-color-on-tertiary-container: ${tone(tertiary, t.onTertiaryContainer)};
  --md-sys-color-error: ${tone(error, t.error)};
  --md-sys-color-on-error: ${tone(error, t.onError)};
  --md-sys-color-error-container: ${tone(error, t.errorContainer)};
  --md-sys-color-on-error-container: ${tone(error, t.onErrorContainer)};
  --md-sys-color-surface: ${isDark ? tone(neutral, t.surface) : '#F7F9FA'};
  --md-sys-color-on-surface: ${isDark ? tone(neutral, t.onSurface) : '#1C2530'};
  --md-sys-color-surface-variant: ${tone(neutralVariant, t.surfaceVariant)};
  --md-sys-color-on-surface-variant: ${isDark ? tone(neutralVariant, t.onSurfaceVariant) : '#66717D'};
  --md-sys-color-outline: ${tone(neutralVariant, t.outline)};
  --md-sys-color-outline-variant: ${isDark ? tone(neutralVariant, t.outlineVariant) : '#E8ECEF'};
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
  --md-ext-color-on-attention-container: ${tone(attention, t.onAttentionContainer)};

  /* App Shell / marca — docs/design/04-color-system.md §5, §7 */
  --braco-color-nav-surface: ${BRAND_NAV_SURFACE};
  --braco-color-on-nav-surface: #FFFFFF;
  --braco-color-surface-secondary: ${isDark ? tone(primary, 24) : BRAND_SURFACE_SECONDARY_LIGHT};
  --braco-color-on-surface-secondary: ${isDark ? tone(primary, 90) : tone(primary, 20)};`;

  return css;
}

const css = `/* Gerado por scripts/generate-theme.mjs — não editar à mão.
 * Seeds oficiais (Guia de Identidade Visual BRAÇO Digital v1.0):
 *   primary ${PRIMARY_SEED} (Azul BRAÇO), secondary ${SECONDARY_SEED} (Cinza Médio),
 *   tertiary ${TERTIARY_SEED} (Verde Capacidade)
 * (docs/design/03-theme-strategy.md, 04-color-system.md).
 * Para alterar cores, edite as seeds no script e rode: npm run theme:generate
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
