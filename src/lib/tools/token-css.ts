/**
 * The finished shadcn token block, in CSS and in the file Figma reads.
 *
 * ── WHY THIS IS NOT STILL INSIDE THE TOKEN GENERATOR ────────────────────
 *
 * It was, and it had exactly one reader. Now it has two — the generator at
 * `/tools/tokens` and the Variables tab of `/studio` — and the second one
 * is the reason this had to move rather than be copied: both surfaces
 * promise "the tokens the catalog is styled against", and two copies of
 * that promise is how one of them quietly starts emitting a different
 * lightness ladder. The same argument is already made at length on
 * `buildScheme` in `permalinks/tokens.ts`, which this builds on; this file
 * is the formatting layer over it.
 *
 * Pure, data-free and dependency-free, so the client bundles can have it
 * and a test can run it in Node.
 */

import { buildScheme, type Scheme, type TokenState } from '@/lib/tools/permalinks/tokens'
import { oklchToRgb, rgbToHex } from '@/lib/color-tools'

/**
 * The `@theme inline` half of the file.
 *
 * A constant rather than a loop over the token list, because it is not a
 * transformation of it: Tailwind needs `--color-*` aliases for the colours,
 * `--radius-*` for the four derived radii, and nothing at all for
 * `--radius` itself. A generated version would have to special-case every
 * one of those, and the special cases would be longer than the literal.
 *
 * `@theme inline` and not `@theme` — see the long note in `globals.css`.
 * The non-inline form bakes the value at build time, so `.dark` would stop
 * working, which is the bug this whole token convention exists to avoid.
 */
const THEME_INLINE = `@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}`

/**
 * Token values that replace what `buildScheme` derived.
 *
 * ── WHY THIS EXISTS ────────────────────────────────────────────────
 *
 * `buildScheme` pins `--primary` to the shadcn lightness ladder —
 * `oklch(0.52 C H)` in light, `oklch(0.72 C H)` in dark — and its docblock
 * argues, rightly, that those are the values the whole catalog was designed
 * against. For the token generator, whose entire state is four numbers and
 * not one of them a lightness, that is the correct behaviour.
 *
 * The studio does hold a lightness — two of them, one per theme, because an
 * accent has to read on both grounds — and with no way to say so the bug
 * was silent and total: moving either slider changed `--primary` by nothing
 * at all, while the prose above the token block quoted the value the slider
 * was set to. One document, two different accents.
 *
 * So: an override map, applied after the scheme is built and before it is
 * formatted, so the CSS, the DTCG files and the live canvas cannot disagree
 * with each other or with the prose. An unknown token name is ignored
 * rather than appended — a caller inventing `--brand` should not be able to
 * add a variable to somebody else's stylesheet through here.
 */
export type TokenOverrides = Record<string, string>

function overridden(scheme: Scheme, overrides?: TokenOverrides): Scheme {
  if (!overrides) return scheme
  return {
    label: scheme.label,
    tokens: scheme.tokens.map((token) =>
      Object.hasOwn(overrides, token.name)
        ? { ...token, value: overrides[token.name]! }
        : token,
    ),
  }
}

/**
 * The scheme a caller actually gets: derived, then overridden.
 *
 * Exported because the Variables tab renders the token *table* from it. A
 * table built straight off `buildScheme` would print the derived
 * `--primary` beside a code block emitting the overridden one — the exact
 * contradiction the overrides exist to remove.
 */
export function tokenScheme(
  state: TokenState,
  dark: boolean,
  overrides?: TokenOverrides,
): Scheme {
  return overridden(buildScheme(state, dark), overrides)
}

function declarations(scheme: Scheme, indent: string): string {
  return scheme.tokens.map((t) => `${indent}${t.name}: ${t.value};`).join('\n')
}

/**
 * A complete `globals.css` token block — both themes, ready to paste.
 *
 * `banner` lets the studio sign the file with the product's own name while
 * the tool keeps the generic line, without either of them owning a second
 * copy of the token list.
 */
export function tokenBlockCss(
  state: TokenState,
  banner?: string,
  /*
    A FUNCTION of the theme, not a single map, and that distinction is a
    bug this signature already caught once. This is the one builder that
    emits both themes from one call, so a single override map would have
    put the light accent into the `.dark` block — an accent chosen to read
    on white, written into the rule for the dark ground, which is the exact
    failure the two lightness values exist to prevent. Every other builder
    here handles one theme and takes the map directly.
  */
  overridesFor?: (dark: boolean) => TokenOverrides,
): string {
  const head =
    banner ??
    `Generated by Hoverlab — hoverlab design tokens
   Drop this into your globals.css. Every block in the catalog
   is styled against these names.`

  return `/* ${head} */

:root {
${declarations(tokenScheme(state, false, overridesFor?.(false)), '  ')}
}

.dark {
${declarations(tokenScheme(state, true, overridesFor?.(true)), '  ')}
}

${THEME_INLINE}
`
}

/**
 * An `oklch(...)` string from `buildScheme` as hex, or null if it is not one.
 *
 * Handles the alpha form (`oklch(1 0 0 / 10%)`) as well as the plain one,
 * and that is not a nicety: `--border` and `--input` are opaque in the light
 * theme and translucent white in the dark one. Skipping the alpha form left
 * the dark token file two variables shorter than the light one, so a
 * designer mapping the two as modes in Figma would find the pair missing on
 * one side — the exact seam a mode-mapped import is supposed to remove.
 *
 * Alpha comes out as 8-digit hex, which Figma reads and which every DTCG
 * importer accepts.
 */
export function oklchStringToHex(value: string): string | null {
  const parsed = /^oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+)(%?))?\)$/.exec(
    value.trim(),
  )
  if (!parsed) return null

  const hex = rgbToHex(
    oklchToRgb({ l: Number(parsed[1]), c: Number(parsed[2]), h: Number(parsed[3]) }),
  )
  if (parsed[4] === undefined) return hex

  const raw = Number(parsed[4])
  const alpha = parsed[5] === '%' ? raw / 100 : raw
  if (!Number.isFinite(alpha) || alpha >= 1) return hex

  const byte = Math.round(Math.max(0, alpha) * 255)
  return `${hex}${byte.toString(16).padStart(2, '0')}`
}

/**
 * One theme as a W3C Design Tokens (DTCG) document — the file Figma reads.
 *
 * The second channel for the same artifact. Rather than hand-drawing Figma
 * kits nobody will maintain, the tokens a designer needs are generated from
 * the same state that produces the CSS, so the two cannot describe
 * different systems.
 *
 * DTCG because it is the format that is actually accepted: every current
 * Figma import plugin reads it (Variables JSON Import, Tokens Studio,
 * TokensBrücke), and Figma's own native variable import reads it by
 * dragging the file in. The same reasoning, at more length, is in
 * `lib/export/design-system.ts`, which produces this shape for a customer's
 * whole brand — this is the free, tool-shaped half of it.
 *
 * Free, and deliberately. The identical values are already one click away
 * as CSS on the same screen, so withholding them behind a paywall in a
 * different file extension would be a wall with a door beside it — the
 * thing this codebase argues against everywhere else it draws a line. The
 * Pro export sells the whole derived system, not this.
 *
 * ONE FILE PER MODE. DTCG has no settled syntax for modes, so every tool
 * invented its own and none agree; a file that is unambiguously "the light
 * theme" imports everywhere.
 *
 * Hex, not OKLCH. Figma has no OKLCH variable type, so `oklch(0.52 0.19
 * 250)` would import as a string — a note to a human rather than a colour a
 * rectangle can use. The OKLCH original is carried in `$description` so
 * nothing is lost on the way.
 */
export function tokenDtcg(
  state: TokenState,
  dark: boolean,
  name?: string,
  overrides?: TokenOverrides,
): string {
  const scheme = tokenScheme(state, dark, overrides)
  const colors: Record<string, unknown> = { $type: 'color' }

  for (const token of scheme.tokens) {
    const hex = oklchStringToHex(token.value)
    if (!hex) continue
    colors[token.name.replace(/^--/, '')] = {
      $value: hex,
      // The OKLCH the value came from, carried across. A designer opening
      // this in a token editor can see what the hex was derived from, and
      // the CSS beside it and the JSON stay traceable to each other.
      $description: token.value,
    }
  }

  return `${JSON.stringify(
    {
      $description: `${name ?? 'Hoverlab design tokens'} — ${dark ? 'dark' : 'light'} theme`,
      color: colors,
      radius: {
        $type: 'dimension',
        base: { $value: `${state.radius}rem` },
      },
    },
    null,
    2,
  )}\n`
}

/**
 * The same tokens as a style object, for a scoped live preview.
 *
 * ── WHY A PREVIEW CANNOT JUST SET THE THEME'S INPUTS ────────────────────
 *
 * `applyThemeToDocument` writes nine theme-independent inputs onto `<html>`
 * and lets `globals.css` derive the finished tokens from them. That is the
 * right mechanism for theming the whole site and it cannot be scoped to a
 * container: the derivations are declared on `:root` and `.dark`, so a
 * `--brand-hue` set on a `<div>` inherits into the subtree and nothing
 * recomputes `--primary` from it — the declaration only exists one level up.
 *
 * So a preview that has to sit *inside* an editor whose own chrome must not
 * change colour sets the finished tokens directly, which inherit normally
 * and stop at the container. That also makes the preview and the CSS on the
 * next tab the same values by construction rather than by coincidence,
 * which is the property an editor whose output is a token file most needs.
 *
 * `--radius` is included, so `rounded-lg` inside the container follows too.
 */
export function tokenVars(
  state: TokenState,
  dark: boolean,
  overrides?: TokenOverrides,
): Record<string, string> {
  const vars: Record<string, string> = { '--radius': `${state.radius}rem` }
  for (const token of tokenScheme(state, dark, overrides).tokens) vars[token.name] = token.value
  return vars
}
