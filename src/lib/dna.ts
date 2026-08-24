import tokens from './generated-dna.json'
import { BRAND_PRESETS, DEFAULT_BRAND_COLOR, type BrandColor } from './brand-presets'
import { getBlockMeta } from './blocks/block-index'
import { getPageMeta } from './pages/page-index'
import { getTemplateMeta } from './templates/template-index'
import { getEffect } from './effects'

/**
 * Design DNA — the design system as something an AI tool can read.
 *
 * The problem it solves: an agent asked for "a pricing page" has no design
 * system, so it invents one — a different grey every section, arbitrary
 * radii, a palette that collapses in dark mode. Handing it the tokens up
 * front is the difference between generated output that looks generic and
 * output that looks like the rest of the product.
 *
 * UI8 ships the same idea as a "Copy Design DNA" button on Figma files.
 * The difference worth keeping is at the bottom of every document this
 * produces: a Figma file's DNA describes something the agent then has to
 * rebuild by hand, and ours ends with the command that installs the real
 * source. Tokens without the components is a style guide; tokens plus
 * `npx hoverlab add` is a build.
 *
 * Values come from `generated-dna.json`, parsed out of the very
 * `globals.css` every scaffolded project ships with — so a DNA export
 * cannot describe a palette the templates do not actually use.
 */

/** What a DNA document can be built for. */
export type DnaSubject =
  | { kind: 'catalog' }
  | { kind: 'artifact'; level: 'effect' | 'block' | 'page' | 'template'; id: string }

export interface DnaOptions {
  /** Brand preset id, or a raw brand colour, to override `--primary`. */
  brand?: string | BrandColor | null
  /** Absolute site origin, for the links in the document. */
  origin?: string
}

export interface DnaDocument {
  id: string
  title: string
  markdown: string
  /** The same content as data, for tools that would rather not parse prose. */
  json: {
    source: string
    subject: string
    format: string
    radius: string
    brand: (BrandColor & { id: string | null }) | null
    light: Record<string, string>
    dark: Record<string, string>
    composedOf?: string[]
    install?: string
  }
}

const DEFAULT_ORIGIN = 'https://hoverlab.dev'

/** Resolve whatever the caller passed for `brand` into a colour, or null. */
function resolveBrand(brand: DnaOptions['brand']): (BrandColor & { id: string | null }) | null {
  if (!brand) return null
  if (typeof brand === 'string') {
    const preset = BRAND_PRESETS.find((p) => p.id === brand)
    return preset ? { ...preset, id: preset.id } : null
  }
  return { ...brand, id: null }
}

/**
 * OKLCH string for a brand colour in one theme.
 *
 * The brand system is OKLCH and the token file is HSL channels, and they
 * are not interconvertible without a colour library. Rather than pretend
 * otherwise, a document with a brand override states both and says which
 * one wins — an agent that reads "override --primary with this OKLCH
 * value" does the right thing, where a silently converted approximation
 * would ship a slightly wrong accent.
 */
function oklch(color: BrandColor, theme: 'light' | 'dark'): string {
  const l = theme === 'light' ? color.lightL : color.darkL
  return `oklch(${l} ${color.chroma} ${color.hue})`
}

function tokenTable(theme: 'light' | 'dark'): string {
  const values = theme === 'light' ? tokens.light : tokens.dark
  return (tokens.colorKeys as string[])
    .filter((key) => values[key as keyof typeof values])
    .map((key) => `  --${key}: ${values[key as keyof typeof values]};`)
    .join('\n')
}

/**
 * Detail-page path for a child id.
 *
 * `composedOf` means different things one rung apart — a page is made of
 * blocks, a template is made of pages — so the level has to be looked up
 * rather than assumed. Assuming it produced a DNA document that sent every
 * reader of a template to `/block/saas-landing-page`, which is a 404.
 */
function childHref(id: string): string {
  if (getBlockMeta(id)) return `/block/${id}`
  if (getPageMeta(id)) return `/page/${id}`
  if (getTemplateMeta(id)) return `/template/${id}`
  return `/browse?q=${encodeURIComponent(id)}`
}

/** Metadata for the artifact a document is about, or null for the catalog. */
function describeSubject(subject: DnaSubject) {
  if (subject.kind === 'catalog') return null

  switch (subject.level) {
    case 'effect': {
      const effect = getEffect(subject.id)
      return effect
        ? { name: effect.name, description: effect.description, composedOf: [] as string[] }
        : null
    }
    case 'block': {
      const block = getBlockMeta(subject.id)
      return block
        ? { name: block.name, description: block.description, composedOf: [] as string[] }
        : null
    }
    case 'page': {
      const page = getPageMeta(subject.id)
      return page
        ? { name: page.name, description: page.description, composedOf: page.composedOf ?? [] }
        : null
    }
    case 'template': {
      const template = getTemplateMeta(subject.id)
      return template
        ? {
            name: template.name,
            description: template.description,
            composedOf: template.composedOf ?? [],
          }
        : null
    }
  }
}

/**
 * Build a DNA document.
 *
 * Returns null when the subject names an artifact that does not exist —
 * the caller turns that into a 404 rather than emitting a document about
 * nothing.
 */
export function buildDna(subject: DnaSubject, options: DnaOptions = {}): DnaDocument | null {
  const origin = (options.origin ?? DEFAULT_ORIGIN).replace(/\/$/, '')
  const brand = resolveBrand(options.brand)
  const meta = describeSubject(subject)

  if (subject.kind === 'artifact' && !meta) return null

  const id = subject.kind === 'catalog' ? 'catalog' : subject.id
  const title = meta ? `${meta.name} — Design DNA` : 'Hoverlab — Design DNA'
  const installCommand =
    subject.kind === 'artifact'
      ? subject.level === 'template'
        ? `npx hoverlab init ${subject.id} ./my-app`
        : `npx hoverlab add ${subject.id}`
      : undefined

  const lines: string[] = []

  lines.push(`# ${title}`)
  lines.push('')
  lines.push(
    meta
      ? `${meta.description}`
      : 'The design system every Hoverlab template, page and block is built on.',
  )
  lines.push('')
  lines.push(
    'Paste this into your AI tool before asking it for UI. Everything it ' +
      'generates will follow this system instead of inventing one.',
  )
  lines.push('')

  lines.push('## Colour tokens')
  lines.push('')
  lines.push(
    'Bare HSL channels, not `hsl(...)` calls — that is what lets Tailwind ' +
      'compose an alpha suffix, so `bg-primary/10` expands to ' +
      '`hsl(var(--primary) / 0.1)`. Keep the format.',
  )
  lines.push('')
  lines.push('```css')
  lines.push(':root {')
  lines.push(tokenTable('light'))
  lines.push(`  --radius: ${tokens.radius};`)
  lines.push('}')
  lines.push('')
  lines.push('.dark {')
  lines.push(tokenTable('dark'))
  lines.push('}')
  lines.push('```')
  lines.push('')

  if (brand) {
    lines.push('### Brand accent')
    lines.push('')
    lines.push(
      'This export carries a brand override. Use these in place of the ' +
        '`--primary` and `--ring` values above; they are OKLCH rather than ' +
        'HSL channels, so set them as complete colour values:',
    )
    lines.push('')
    lines.push('```css')
    lines.push(`:root  { --primary: ${oklch(brand, 'light')}; --ring: ${oklch(brand, 'light')}; }`)
    lines.push(`.dark  { --primary: ${oklch(brand, 'dark')};  --ring: ${oklch(brand, 'dark')}; }`)
    lines.push('```')
    lines.push('')
    lines.push(
      `Hue ${brand.hue}, chroma ${brand.chroma}. The two lightness values are ` +
        'not decoration: a single accent lightness that reads on white ' +
        'disappears on the dark ground.',
    )
    lines.push('')
  }

  lines.push('## Shape and type')
  lines.push('')
  lines.push(`- **Radius**: \`--radius: ${tokens.radius}\`. Tailwind maps \`rounded-lg\` to it, with \`md\` and \`sm\` derived 2px and 4px tighter. Do not hand-pick radii per component.`)
  lines.push('- **Spacing**: Tailwind\'s default scale, untouched. Sections run `py-16 sm:py-24`; card padding is `p-6`.')
  lines.push('- **Type**: one display face and one text face, set on `body` and inherited. Headings carry `text-wrap: balance`; body text stays near 65 characters.')
  lines.push('- **Borders**: `border-border` everywhere, never a literal grey. The global base layer already applies it to `*`.')
  lines.push('')

  lines.push('## Motion')
  lines.push('')
  lines.push('- Entrances are short — under ~400ms — and staggered rather than simultaneous.')
  lines.push('- Hover and focus transitions are `transition-colors`, ~150ms.')
  lines.push('- Animation is written with Tailwind\'s `motion-safe:` prefix, and a global `prefers-reduced-motion` block neutralises anything that forgets. Keep both.')
  lines.push('')

  lines.push('## Rules for generated UI')
  lines.push('')
  lines.push('1. Style with the semantic classes — `bg-card`, `text-muted-foreground`, `border-border`, `bg-primary` — never a literal hex or a Tailwind palette colour. That is what makes both themes work at once.')
  lines.push('2. Every surface pairs with its own foreground token: `bg-card` with `text-card-foreground`, `bg-primary` with `text-primary-foreground`.')
  lines.push('3. One accent. `--primary` is the only chromatic colour in the system; `--destructive` is for destructive actions and nothing else.')
  lines.push('4. Check both themes before calling anything finished.')
  lines.push('5. Give every interactive element a visible focus state, using `--ring`.')
  lines.push('')

  if (meta && meta.composedOf.length) {
    lines.push('## What this is built from')
    lines.push('')
    for (const child of meta.composedOf) {
      lines.push(`- \`${child}\` — ${origin}${childHref(child)}`)
    }
    lines.push('')
  }

  lines.push('## Get the real source')
  lines.push('')
  lines.push(
    'This document describes the system. The components themselves are ' +
      'free, and land in your project as source you own:',
  )
  lines.push('')
  lines.push('```bash')
  if (installCommand) lines.push(installCommand)
  lines.push('npx hoverlab search "pricing section"   # find more')
  lines.push('npx hoverlab skill hoverlab             # teach your agent the catalog')
  lines.push('```')
  lines.push('')
  lines.push(`Catalog: ${origin} · API: ${origin}/api/v1 · No account needed for any of it.`)
  lines.push('')

  return {
    id,
    title,
    markdown: lines.join('\n'),
    json: {
      source: origin,
      subject: id,
      format: tokens.format,
      radius: tokens.radius,
      brand,
      light: tokens.light as Record<string, string>,
      dark: tokens.dark as Record<string, string>,
      ...(meta?.composedOf.length ? { composedOf: meta.composedOf } : {}),
      ...(installCommand ? { install: installCommand } : {}),
    },
  }
}

/** Preset ids a caller may pass as `brand`. */
export const BRAND_IDS: string[] = BRAND_PRESETS.map((p) => p.id)

/** The default accent, for callers that want to name it. */
export const DEFAULT_BRAND: BrandColor = DEFAULT_BRAND_COLOR
