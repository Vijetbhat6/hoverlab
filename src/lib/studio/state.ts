/**
 * One editor's state — identity, look, and the palette it was picked from.
 *
 * ── WHAT WAS FOLDED IN, AND WHAT THAT COST ──────────────────────────────
 *
 * Four surfaces in this repo were each holding a quarter of a design
 * system:
 *
 *   `/tools/tokens`        four numbers → a complete shadcn token block
 *   `/tools/palette`       a hex + a harmony → five swatches
 *   `lib/brand-presets`    a curated accent, applied live to the whole app
 *   `lib/theme-studio`     accent + neutrals + typeface + radius, live
 *
 * You could get a palette from the second, carry one of its colours to the
 * first by hand, generate tokens that had nothing to do with the accent the
 * third was applying, and end up with three descriptions of a brand that
 * did not agree. That is not four tools; it is one job with three seams in
 * it, and the seams are where the design went wrong.
 *
 * ── THE SEAM THAT MATTERED: INPUTS VERSUS OUTPUTS ───────────────────────
 *
 * `theme-studio.ts` argues — correctly, and its docblock is worth reading —
 * that merging it with the token generator would mean one of them giving up
 * the shape that makes it useful. It holds theme-INDEPENDENT inputs
 * (`--brand-hue`, `--base-chroma`) that `globals.css` derives finished
 * tokens from, and it has to: an inline style on `<html>` outranks the
 * `.dark` rule, so writing a finished `--background` there would break the
 * theme toggle. The generator emits the finished tokens, for someone who
 * has no `globals.css` to derive anything with.
 *
 * This file does not merge them. It makes one of them the source and the
 * other a view: the studio's state IS a `ThemeStudioValue` — the inputs —
 * and the finished shadcn block is *derived* from it through
 * `tokenGeneratorState`, which already existed as the handoff between the
 * two. So the canvas can apply the theme live (inputs, inline, toggle
 * intact) and the Variables tab can hand out eighty finished declarations,
 * and there is exactly one place either could disagree from.
 *
 * What that costs is stated rather than hidden, and it is the same cost
 * `tokenGeneratorState` already documents: the neutral *hue* does not
 * survive the trip into the finished block. This module runs warm surfaces
 * against cool ink and swaps them in dark; the generator tints its greys
 * toward the brand hue with one number. There is no pair of values that
 * expresses the first in the second. `NEUTRAL_HUE_NOTE` is that sentence,
 * shown on the tab rather than buried here.
 *
 * ── THE PALETTE IS AN INPUT TO THE ACCENT, NOT A PARALLEL OUTPUT ────────
 *
 * A five-colour harmony is not a design system — the catalog has exactly
 * one chromatic token and the rules say so. So the palette generator folds
 * in as the *way you choose* the accent: pick a base and a harmony, see
 * five candidates, click one and it becomes the accent the whole canvas is
 * wearing. `paletteBase` and `paletteScheme` are kept in the state so that
 * choice is reproducible in a shared link, not because the other four
 * colours mean anything downstream.
 *
 * DATA-FREE and dependency-free apart from sibling libs, so the client
 * bundles can have it and the tests can run it in Node.
 */

import {
  DEFAULT_THEME,
  FONT_CHOICES,
  RADIUS_STOPS,
  coerceTheme,
  tokenGeneratorState,
  type ThemeStudioValue,
} from '@/lib/theme-studio'
import {
  PALETTE_DEFAULTS,
  PALETTE_SCHEMES,
  paletteColors,
  type PaletteState,
} from '@/lib/tools/permalinks/palette'
import { TOKEN_DEFAULTS, type TokenState } from '@/lib/tools/permalinks/tokens'
import type { TokenOverrides } from '@/lib/tools/token-css'
import {
  brandFromHex,
  formatOklch,
  normalizeHex,
  oklchToRgb,
  rgbToHex,
  type PaletteScheme,
} from '@/lib/color-tools'
import { coerceIdentity, IDENTITY_DEFAULTS, type StudioIdentity } from '@/lib/studio/identity'

/** The whole editor, in one serialisable object. */
export interface StudioState {
  /** The half that is not in the CSS. See `identity.ts`. */
  identity: StudioIdentity
  /** The look, as the inputs `globals.css` derives tokens from. */
  theme: ThemeStudioValue
  /** The hex the accent candidates are generated from. */
  paletteBase: string
  /** Which harmony those candidates use. */
  paletteScheme: PaletteScheme
}

export const STUDIO_DEFAULTS: StudioState = {
  identity: IDENTITY_DEFAULTS,
  theme: DEFAULT_THEME,
  paletteBase: PALETTE_DEFAULTS.base,
  paletteScheme: PALETTE_DEFAULTS.scheme,
}

/**
 * The studio's key in `localStorage` and in the preset list.
 *
 * Not under `/tools/` — the studio is not one of the thirty-six, and
 * pretending otherwise would put it in the hub grid and the related-tools
 * rail as a peer of the unit converter. `tool-presets.ts` widened its id
 * pattern for exactly this one id; see the note there.
 */
export const STUDIO_TOOL_ID = '/studio'

/**
 * The sentence that has to appear wherever the finished token block does.
 *
 * See the docblock above: the neutral hue pair is the one thing the
 * derivation cannot carry, and a token file that silently dropped it would
 * be a token file that is subtly not the theme on screen.
 */
export const NEUTRAL_HUE_NOTE =
  'The finished block tints its greys toward the accent hue with a single ' +
  'number, where the live canvas runs warm surfaces against cool ink and ' +
  'swaps them in dark. The neutral chroma travels; the warm/cool pair does ' +
  'not. Paste the nine input variables instead if you want that too.'

/* ------------------------------------------------------------------ *
 *  Derivations
 * ------------------------------------------------------------------ */

/** The accent as an sRGB hex, for the colour inputs and the palette base. */
export function accentHex(theme: ThemeStudioValue): string {
  return rgbToHex(
    oklchToRgb({ l: theme.accent.lightL, c: theme.accent.chroma, h: theme.accent.hue }),
  )
}

/** The accent as the `oklch(...)` string the token file will carry. */
export function accentOklch(theme: ThemeStudioValue, dark = false): string {
  const { accent } = theme
  return formatOklch({
    l: dark ? accent.darkL : accent.lightL,
    c: accent.chroma,
    h: accent.hue,
  })
}

/**
 * The five accent candidates the Style tab offers.
 *
 * Guarded through `normalizeHex` inside `paletteColors`, because
 * `paletteBase` is a string that may have arrived off a shared link and a
 * broken hex should produce the default harmony rather than five copies of
 * an unparseable value.
 */
export function accentCandidates(state: StudioState): string[] {
  return paletteColors({ base: state.paletteBase, scheme: state.paletteScheme })
}

/**
 * Adopt a hex as the accent.
 *
 * ── THE HEX'S OWN LIGHTNESS IS DISCARDED ────────────────────────────────
 *
 * Only hue and chroma travel, and that is the same call `UseInCatalog`
 * makes for the same reason — worth repeating here because it looks like a
 * bug until you know why. A brand accent's lightness is not a property of
 * the colour, it is chosen against the surface it lands on: `--primary`
 * carries every button, link and focus ring on the page, and its lightness
 * is the value measured at 5.01:1 against the background. Importing it from
 * a swatch would let clicking a pale yellow in the harmony row drop the
 * whole canvas below WCAG AA — and there are two surfaces to satisfy, not
 * one, because the dark theme needs a different lightness for the same
 * identity.
 *
 * So the pair already in the state is kept. On a fresh canvas that is the
 * measured default; once someone has moved the lightness sliders it is
 * their tuning, and picking a new hue should not silently undo it. Hue and
 * chroma carry the identity and cannot break contrast on their own.
 *
 * Returns the state unchanged on an unparseable hex. A colour input cannot
 * produce one, but a pasted value and a shared link both can.
 */
export function withAccentHex(state: StudioState, hex: string): StudioState {
  const brand = brandFromHex(hex)
  if (!brand) return state
  return {
    ...state,
    theme: {
      ...state.theme,
      accent: { ...state.theme.accent, hue: brand.hue, chroma: brand.chroma },
    },
  }
}

/**
 * The four numbers the finished token block is built from.
 *
 * A thin wrapper on `tokenGeneratorState` so every caller in the studio
 * goes through one name, and so the lossy step has a single place to be
 * documented against (`NEUTRAL_HUE_NOTE`).
 */
export function studioTokenState(state: StudioState): TokenState {
  return { ...TOKEN_DEFAULTS, ...tokenGeneratorState(state.theme) }
}

/**
 * The two tokens the derived scheme gets wrong for a studio state.
 *
 * `studioTokenState` throws the accent lightness away — `tokenGeneratorState`
 * has nowhere to put it, because the generator owns its own ladder on
 * purpose. For the generator that is right. For an editor with two
 * lightness sliders on screen it meant the sliders did nothing: `--primary`
 * stayed at the shadcn `oklch(0.52 C H)` however far either one moved,
 * while the document above the token block quoted the value the slider was
 * set to. Measured before the fix: at lightL 0.30, 0.55 and 0.78 the token
 * block emitted the identical `oklch(0.520 0.200 160.0)` all three times.
 *
 * `--ring` takes the same value as `--primary` rather than the generator's
 * dimmed `chroma * 0.4`, because that is what `globals.css` does — the two
 * are literally the same declaration there. So this override also closes a
 * gap between the studio's two CSS spellings instead of opening one.
 *
 * `--primary-foreground` is deliberately NOT overridden. It is near-white
 * in light and near-black in dark in both spellings, and inventing a
 * contrast-aware value here would be this module quietly disagreeing with
 * the stylesheet every scaffolded project ships. The canvas measures the
 * pair instead, so a lightness that breaks it is visible rather than
 * silently corrected.
 */
export function studioTokenOverrides(
  theme: ThemeStudioValue,
  dark: boolean,
): TokenOverrides {
  const accent = accentOklch(theme, dark)
  return { '--primary': accent, '--ring': accent }
}

/** The palette half of the state, in the shape the palette tool speaks. */
export function studioPaletteState(state: StudioState): PaletteState {
  return { base: state.paletteBase, scheme: state.paletteScheme }
}

/* ------------------------------------------------------------------ *
 *  Guards
 * ------------------------------------------------------------------ */

/**
 * Narrow an unknown value into a studio state.
 *
 * Passed to `useToolState` as `sanitizeShared`, and it is one of the few
 * states that genuinely needs it. `shapeMatched` guarantees the shape and
 * nothing else, and this state has three things a shape guard cannot check:
 *
 *   - free prose, which is capped and de-newlined by `coerceIdentity`.
 *     This is the untrusted part that matters most, because the Agent tab's
 *     whole job is to render it into a document a human is invited to paste
 *     into a coding agent. A stranger's link is not allowed to put 40 KB of
 *     anything into that.
 *   - a `fontId` and a `paletteScheme`, which are enum-shaped strings. A
 *     `fontId` naming nothing resolves to the first font via `fontById`
 *     rather than to `undefined.stack`, so this is belt and braces — but
 *     `paletteScheme` reaches `generatePalette`'s switch, and an unknown
 *     arm there returns a shorter array than the UI maps over.
 *   - numbers that have to be in range. `coerceTheme` owns that, and
 *     returning null from it is the one case that rejects the link whole:
 *     an out-of-range theme is not a theme with a bad field, it is a theme
 *     whose every derived token would be out of gamut.
 */
export function coerceStudio(raw: unknown): StudioState | null {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return null
  const v = raw as Partial<Record<keyof StudioState, unknown>>

  const theme = coerceTheme(v.theme)
  if (!theme) return null

  const base = typeof v.paletteBase === 'string' ? normalizeHex(v.paletteBase) : null
  const scheme = PALETTE_SCHEMES.find((s) => s === v.paletteScheme)

  return {
    identity: coerceIdentity(v.identity),
    theme,
    paletteBase: base ?? STUDIO_DEFAULTS.paletteBase,
    paletteScheme: scheme ?? STUDIO_DEFAULTS.paletteScheme,
  }
}

/**
 * The same guard, for a restore that must not reject.
 *
 * `coerceStudio` returns null for a state it cannot salvage, which is right
 * for a shared link — the visitor still has their own session underneath
 * it. It is wrong for `localStorage` and for a saved preset, where
 * underneath there is nothing but defaults: discarding somebody's brand
 * because one field is malformed is worse than repairing it, and
 * `coerceStudio` already repairs every field it can.
 *
 * Passed to `useToolState` as `coerce`. The studio is the first state in
 * this codebase with nested objects, and the hook's shallow
 * `{ ...defaults, ...stored }` cannot repair those — see the note on the
 * option.
 */
export function repairStudio(restored: StudioState): StudioState {
  return coerceStudio(restored) ?? STUDIO_DEFAULTS
}

/* ------------------------------------------------------------------ *
 *  Seeding from the tools this folds in
 * ------------------------------------------------------------------ */

/**
 * Read a studio state out of the query parameters the folded-in tools use.
 *
 * The point of this is continuity, not a second permalink format. Someone
 * arriving from `/tools/tokens?hue=250&chroma=0.19&radius=0.625` or
 * `/tools/palette?base=10b981&scheme=triadic` has already made those
 * decisions, and landing on a blank canvas would ask them to make them
 * again — which is the single most likely reason to bounce off a surface
 * that says it replaces the tool you were just using.
 *
 * Deliberately NOT a `ToolPermalink` spec. Those exist to be indexed, and
 * `lib/tools/permalinks.ts` curates which URLs are; a studio state is
 * mostly free prose and there is no set of studio URLs worth putting in a
 * sitemap. So these params seed and are then dropped from the address bar,
 * and the sharing story stays the `#s=` fragment, which can carry the prose.
 *
 * Returns null when nothing recognisable was passed, which is what tells
 * the caller to fall back to `localStorage` rather than overwrite it with
 * defaults.
 */
export function studioSeedFromParams(params: URLSearchParams): StudioState | null {
  const number = (key: string, min: number, max: number): number | null => {
    const raw = params.get(key)
    if (raw === null) return null
    const n = Number(raw)
    if (!Number.isFinite(n) || n < min || n > max) return null
    return n
  }

  let state = STUDIO_DEFAULTS
  let seeded = false

  // The palette tool's two params. Applied first, so an explicit hue below
  // still wins over the hue implied by a base colour.
  const base = params.get('base')
  const hex = base ? normalizeHex(base) : null
  if (hex) {
    state = withAccentHex({ ...state, paletteBase: hex }, hex)
    seeded = true
  }
  const scheme = PALETTE_SCHEMES.find((s) => s === params.get('scheme'))
  if (scheme) {
    state = { ...state, paletteScheme: scheme }
    seeded = true
  }

  // The token generator's. `neutral` is an absolute chroma there and a
  // multiplier here, so it is divided by what a multiplier of 1 means —
  // the inverse of the conversion `tokenGeneratorState` does on the way
  // out, so a round trip through both lands where it started.
  const hue = number('hue', 0, 360)
  const chroma = number('chroma', 0, 0.32)
  const radius = number('radius', 0, 2)
  const neutral = number('neutral', 0, 0.03)

  if (hue !== null || chroma !== null) {
    state = {
      ...state,
      theme: {
        ...state.theme,
        accent: {
          ...state.theme.accent,
          hue: hue ?? state.theme.accent.hue,
          chroma: chroma ?? state.theme.accent.chroma,
        },
      },
    }
    seeded = true
  }
  if (radius !== null) {
    state = { ...state, theme: { ...state.theme, radiusRem: radius } }
    seeded = true
  }
  if (neutral !== null) {
    state = {
      ...state,
      theme: { ...state.theme, base: { ...state.theme.base, chroma: neutral / 0.006 } },
    }
    seeded = true
  }

  // A named font, for the one param `/themes` could hand over.
  const fontId = FONT_CHOICES.find((f) => f.id === params.get('font'))?.id
  if (fontId) {
    state = { ...state, theme: { ...state.theme, fontId } }
    seeded = true
  }

  return seeded ? state : null
}

/** The name of the radius stop a value has landed on, if it is one. */
export function radiusStopName(rem: number): string | null {
  return RADIUS_STOPS.find((s) => Math.abs(s.rem - rem) < 0.001)?.name ?? null
}
