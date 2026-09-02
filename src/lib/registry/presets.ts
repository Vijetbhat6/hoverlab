/**
 * Named design-system presets, published on the shadcn rail.
 *
 * ── WHAT A PRESET IS, AND WHAT THIS IS NOT ──────────────────────────────
 *
 * shadcn added presets in April 2026. A preset is a whole design system in
 * one install — colour, radius, spacing, type, icon library — and
 * `shadcn apply --preset <code>` switches an existing project onto one
 * without starting over.
 *
 * Those `<code>` values are first-party. They are minted by
 * ui.shadcn.com/create, decoded by the CLI, and a third-party registry
 * cannot issue one. So this is deliberately NOT a claim to ship
 * "a shadcn preset" in that sense, and nothing here should ever be
 * described that way.
 *
 * What it ships is the thing a preset code *resolves to*. The CLI turns a
 * preset into a `registry:base` item and applies that — which is a document
 * we can publish ourselves, at a URL, installable by name:
 *
 *     npx shadcn add @hoverlab/preset-console
 *
 * Same payload, same effect on the project, no code to mint. And it is
 * reachable by the shadcn MCP server and by registry.directory, which a
 * `?preset=` link on somebody else's site is not.
 *
 * ── WHY THIS IS WORTH DOING AT ALL ──────────────────────────────────────
 *
 * Ninety percent of it already existed and was not connected to anything.
 * `shadcn-theme.ts` derives a full light/dark oklch token set from four
 * knobs and has done since the /tools/shadcn page shipped.
 * `theme-shape.ts` derives radius, spacing density and the type ramp, and
 * its own docblock notes that the export "has accepted a `radius` option
 * since it was written and nothing has ever passed one". One is colour, the
 * other is everything that is not colour, and a design system is both.
 * Pairing them and giving the pairs names is the entire content of this
 * file.
 *
 * ── WHY PAIRS AND NOT A GRID ────────────────────────────────────────────
 *
 * Five colours × four shapes is twenty items, and twenty unnamed
 * combinations is a slider with extra steps — the thing `SHAPE_PRESETS`
 * already argues against. A preset is an opinion: "this is what a
 * developer tool looks like". So each one below pairs the colour and the
 * shape that argue for the same thing, and the pairs are chosen to be
 * recognisably different from each other rather than to fill a matrix.
 * Anyone who wants a twenty-first goes to /tools/shadcn and moves the
 * sliders, which is what that page is for.
 *
 * Pure, and client-safe: no `server-only`, no catalog import. The install
 * command is rendered in the browser and needs the same names.
 */

import {
  buildTheme,
  type ThemeState,
  DEFAULT_THEME,
} from '../shadcn-theme'
import {
  DEFAULT_THEME_SHAPE,
  shapeThemeVars,
  type ThemeShape,
} from '../theme-shape'

export interface DesignPreset {
  /** Registry item name. Always `preset-` prefixed. */
  name: string
  /** The bare slug, for a UI that has already said "preset". */
  id: string
  title: string
  /** One sentence on what this reads as. Shown on the card and in the item. */
  note: string
  /** What kind of product it is for — the reason to pick this one. */
  suits: string
  colour: Pick<ThemeState, 'hue' | 'chroma' | 'neutralChroma'>
  shape: ThemeShape
}

/**
 * The named systems.
 *
 * Each `note` is written to be readable next to the others: if two of them
 * could be swapped without anyone noticing, one of them should not exist.
 */
export const DESIGN_PRESETS: readonly DesignPreset[] = [
  {
    name: 'preset-hoverlab',
    id: 'hoverlab',
    title: 'Hoverlab',
    note: 'What this site wears — a green brand over faintly warm neutrals, 12px corners, standard gutters.',
    suits: 'The catalog as it ships. Start here if you like how the blocks look on this site.',
    colour: { hue: 160, chroma: 0.2, neutralChroma: 0.008 },
    shape: DEFAULT_THEME_SHAPE,
  },
  {
    name: 'preset-console',
    id: 'console',
    title: 'Console',
    note: 'Almost no chroma anywhere, square corners, tighter gutters and slightly smaller type.',
    suits: 'Developer tools and anything data-heavy, where colour should mean something rather than decorate.',
    colour: { hue: 240, chroma: 0.08, neutralChroma: 0.012 },
    shape: { radiusRem: 0.125, density: 0.9, typeScale: 0.97 },
  },
  {
    name: 'preset-studio',
    id: 'studio',
    title: 'Studio',
    note: 'A warm brand over warm neutrals with large corners and generous spacing.',
    suits: 'Marketing sites and consumer products — the shape that reads as calm rather than capable.',
    colour: { hue: 15, chroma: 0.21, neutralChroma: 0.012 },
    shape: { radiusRem: 1.25, density: 1.15, typeScale: 1.05 },
  },
  {
    name: 'preset-cockpit',
    id: 'cockpit',
    title: 'Cockpit',
    note: 'Cool violet accent, small corners, tight gutters, smaller type throughout.',
    suits: 'Dashboards and admin panels that have to show a lot at once without shouting.',
    colour: { hue: 250, chroma: 0.19, neutralChroma: 0.006 },
    shape: { radiusRem: 0.375, density: 0.8, typeScale: 0.92 },
  },
  {
    name: 'preset-signal',
    id: 'signal',
    title: 'Signal',
    note: 'High-chroma amber on lightly tinted neutrals, at the catalog’s own proportions.',
    suits: 'Consumer apps and launches — the one that looks least like a developer tool.',
    colour: { hue: 70, chroma: 0.17, neutralChroma: 0.01 },
    shape: DEFAULT_THEME_SHAPE,
  },
]

const BY_NAME = new Map(DESIGN_PRESETS.map((preset) => [preset.name, preset]))

export function findPreset(name: string): DesignPreset | undefined {
  return BY_NAME.get(name)
}

export const PRESET_NAMES: readonly string[] = DESIGN_PRESETS.map((p) => p.name)

/* ------------------------------------------------------------------ *
 *  As a registry item
 * ------------------------------------------------------------------ */

export interface PresetRegistryItem {
  name: string
  type: 'registry:base'
  title: string
  description: string
  cssVars: {
    theme: Record<string, string>
    light: Record<string, string>
    dark: Record<string, string>
  }
  iconLibrary: string
  docs: string
  meta: Record<string, unknown>
}

/**
 * One preset as the `registry:base` document the CLI applies.
 *
 * THREE SCOPES, AND THEY ARE NOT INTERCHANGEABLE. `light` and `dark` are
 * ordinary custom properties on `:root` and `.dark`. `theme` is Tailwind
 * v4's `@theme` block, and `--spacing` and the `--text-*` ramp have to be
 * there rather than in `light`: they are read by the utility generator, so
 * a `:root` declaration of `--spacing` sets a property that no `p-*` class
 * ever looks at. It would apply cleanly, change nothing, and give no error.
 *
 * `--radius` is emitted in `theme` too. It is this project's own variable,
 * consumed through `var()`, so it works in either place — putting it beside
 * the two that only work in one keeps the whole shape in a single object
 * rather than split across two on a technicality.
 */
export function presetRegistryItem(preset: DesignPreset, origin?: string): PresetRegistryItem {
  const state: ThemeState = {
    ...DEFAULT_THEME,
    ...preset.colour,
    /*
     * The shape owns radius, not the colour half.
     *
     * `ThemeState` carries a radius of its own because /tools/shadcn puts
     * all four knobs on one page, and every entry in `THEME_PRESETS` sets
     * one. If that value were used here, `preset-console` would advertise
     * square corners in its note and install 8px ones — the colour
     * preset's radius silently winning over the shape's. Reading it from
     * the shape is what makes the note true.
     */
    radius: preset.shape.radiusRem,
  }

  const { light, dark } = buildTheme(state)
  const site = origin?.replace(/\/$/, '')

  return {
    name: preset.name,
    type: 'registry:base',
    title: `${preset.title} — a Hoverlab preset`,
    description: `${preset.note} ${preset.suits}`,
    cssVars: {
      theme: shapeThemeVars(preset.shape),
      light,
      dark,
    },
    iconLibrary: 'lucide',
    docs:
      `Installs a complete token set: colour, radius, spacing density and the type ramp. ` +
      `It replaces the equivalent variables in your stylesheet, so install it before any ` +
      `Hoverlab block or page and everything you add afterwards inherits it.` +
      (site ? ` Preview and adjust it at ${site}/tools/shadcn.` : ''),
    meta: {
      tier: 'preset',
      preset: preset.id,
      ...(site ? { href: `${site}/tools/shadcn` } : {}),
      shape: preset.shape,
      colour: preset.colour,
    },
  }
}
