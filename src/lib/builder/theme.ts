/**
 * The builder's theme: one URL parameter, three things made out of it.
 *
 * ── WHY THIS MODULE EXISTS AT ALL ───────────────────────────────────────
 *
 * `/compare` names the gap in its own data, and the row is called
 * Composition: React Bits' Landing Builder and Shadcnblocks' page builder
 * let you edit *inside* the composition, ours chose sections and ordered
 * them. Most of what "edit inside" means for those tools is prop editing,
 * which this catalog cannot honestly offer — blocks here take no props;
 * they are files you leave with and change in your editor.
 *
 * What it can offer is the half that actually changes how a composed page
 * looks: the tokens. Every block in the catalog styles itself entirely
 * through `bg-background`, `text-muted-foreground`, `rounded-lg` — never a
 * literal colour — which is a property the catalog maintains on purpose
 * and which means one token sheet restyles all thirty sections at once.
 * That is a real edit inside the composition, and it is the one edit that
 * survives the trip out: it leaves as CSS the reader installs, not as a
 * setting on our side.
 *
 * ── WHY THE TOKENS ARE A SCOPED STYLESHEET AND NOT INLINE STYLES ────────
 *
 * `/tools/shadcn` previews a theme with custom properties in a `style`
 * attribute, and that works there because it renders its preview twice —
 * once in a light wrapper, once in a `.dark` one. The builder renders the
 * composition once, inside a page whose mode the reader controls from the
 * site header, so it needs the light values AND the dark values with a
 * selector to choose between them. A `style` attribute holds one set and
 * cannot express "unless an ancestor is dark", so the light theme would
 * leak into dark mode — every surface repainted, every `dark:` utility
 * inside a block still pointing the other way. That is the exact class of
 * bug a preview exists to catch, so it must not be the preview that has it.
 *
 * ── WHAT IS NOT HERE ────────────────────────────────────────────────────
 *
 * The colour maths, the encoding and the validation. All three are
 * `lib/shadcn-theme`, shipped for the theme generator, already tested, and
 * already hardened — `decodeTheme` range-checks every field because it
 * reads a string a stranger controls. Re-deriving any of it here would be a
 * second implementation of the one part of this feature where being wrong
 * means writing a hostile value into somebody's stylesheet.
 */

import {
  buildTheme,
  decodeTheme,
  themeCss,
  TOKEN_NAMES,
  type ThemeState,
} from '@/lib/shadcn-theme'

/**
 * Class the scoped theme is written against.
 *
 * A constant rather than a hash of the theme: exactly one composition
 * theme is ever on a page, and a stable name means the stylesheet and the
 * wrapper cannot drift apart by one render.
 */
export const COMPOSITION_THEME_CLASS = 'hl-composition-theme'

export interface CompositionTheme {
  /** The decoded theme, or null when the URL asked for no theme. */
  state: ThemeState | null
  /**
   * The encoded parameter, echoed back so every edit link can carry it.
   * Null whenever `state` is null, including when the input was garbage —
   * a malformed value must not be propagated into the next URL.
   */
  param: string | null
  /** Scoped stylesheet for the preview wrapper, or null when unthemed. */
  css: string | null
  /**
   * True when `?t=` was present and could not be read.
   *
   * Surfaced rather than swallowed, for the same reason `parseComposition`
   * reports dropped ids: a shared link whose theme got truncated by a chat
   * client should say so, not quietly render in the default palette and let
   * the reader conclude the builder ignores themes.
   */
  malformed: boolean
}

const NONE: CompositionTheme = { state: null, param: null, css: null, malformed: false }

/**
 * Read the theme out of a `?t=` parameter.
 *
 * Total, like `parseComposition`: this runs on a server route whose input
 * is a URL anyone can type, and the only acceptable behaviour for garbage
 * is an unthemed builder that says the theme could not be read.
 */
export function compositionTheme(raw: string | string[] | undefined): CompositionTheme {
  const param = Array.isArray(raw) ? raw[0] : raw
  if (typeof param !== 'string' || param.length === 0) return NONE

  const state = decodeTheme(param)
  if (!state) return { ...NONE, malformed: true }

  return { state, param, css: scopedThemeCss(state), malformed: false }
}

/**
 * The theme as a stylesheet scoped to one wrapper, in both modes.
 *
 * Both selectors are needed and they are not the same case. `.dark .x` is
 * the site, where `dark` sits on `<html>` and the wrapper is a descendant.
 * `.x.dark` is the wrapper itself being the dark root, which is what the
 * StackBlitz scaffold does. Writing one and not the other produces a theme
 * that works on the site and not in the sandbox, or the reverse.
 */
export function scopedThemeCss(state: ThemeState): string {
  const { light, dark, radius } = buildTheme(state)

  return [
    `.${COMPOSITION_THEME_CLASS} {`,
    `  --radius: ${radius};`,
    declarations(light),
    '}',
    `.dark .${COMPOSITION_THEME_CLASS}, .${COMPOSITION_THEME_CLASS}.dark {`,
    declarations(dark),
    '}',
  ].join('\n')
}

/**
 * The same values against `:root` and `.dark`, for a project we generate.
 *
 * Used by the composition sandbox, where the token sheet is already in the
 * project and this lands after it — same specificity, later rule, so it
 * overrides. Deliberately without the `@theme inline` map that
 * `compositionThemeSheet` carries: in a sandbox that map is already there,
 * and emitting a second copy would be another place for the token list to
 * drift from the generator's.
 */
export function themeOverrideCss(state: ThemeState): string {
  const { light, dark, radius } = buildTheme(state)

  return [
    '/* The theme this layout was composed under, from hoverlab /builder. */',
    ':root {',
    `  --radius: ${radius};`,
    declarations(light),
    '}',
    '',
    '.dark {',
    declarations(dark),
    '}',
    '',
  ].join('\n')
}

/**
 * One token per line, plus the one token shadcn does not have.
 *
 * `--field` is Hoverlab's own, derived here the same way
 * `/tools/shadcn`'s preview derives it: our inputs resolve their border
 * through it, so a theme that left it alone would draw every form field in
 * the page's colours instead of the composition's.
 */
function declarations(tokens: Record<string, string>): string {
  return [
    ...TOKEN_NAMES.map((name) => `  --${name}: ${tokens[name]};`),
    `  --field: ${tokens.border};`,
  ].join('\n')
}

/**
 * The full `globals.css` block for a composed page's theme.
 *
 * Deliberately the generator's own output rather than `scopedThemeCss`:
 * what the reader pastes into their project must be `:root` and `.dark`
 * plus the `@theme inline` map, because in Tailwind v4 the custom
 * properties alone give you nothing — without that map `bg-primary` does
 * not exist. The scoped version is for our preview and would be wrong in
 * their repo; this one is for their repo and would be wrong in our preview.
 */
export function compositionThemeSheet(state: ThemeState): string {
  return themeCss(state)
}

/**
 * The one command that installs a composition's theme.
 *
 * Points at `/r/theme.json?t=`, which already serves any encoded theme as a
 * shadcn registry item — the route `/tools/shadcn` hands out. Nothing new
 * is stored and the same URL produces the same theme in a year, which is
 * what makes it safe to paste into a README beside the block install.
 */
export function themeInstallCommand(param: string | null, origin: string): string | null {
  if (!param) return null
  return `npx shadcn@latest add ${origin}/r/theme.json?t=${param}`
}
