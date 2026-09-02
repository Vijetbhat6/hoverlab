/**
 * What you actually get, per framework — one honest answer, in one place.
 *
 * ── WHY THIS FILE EXISTS ────────────────────────────────────────────────
 *
 * Multi-framework output has shipped here for months and has never been on
 * a page anyone reads before deciding. It lives in two tab strips: an
 * export panel inside an effect page, and a markup panel inside a block
 * page. Both are three clicks deep, and neither is reachable from the
 * landing page, the nav, or a search result.
 *
 * Meanwhile Flowbite and React Bits both market multi-framework as a
 * headline — React Bits went as far as shipping Vue Bits and Svelte Bits as
 * separate sites. A capability a competitor puts in its masthead and we
 * hide in a tab is a capability we are not being credited for.
 *
 * ── WHY IT IS A DATA FILE AND NOT COPY ──────────────────────────────────
 *
 * Because the two surfaces are genuinely different, and a marketing page
 * that flattened them would be lying in a way that is easy to check.
 *
 *   An EFFECT is CSS. Converting it to Vue or Svelte is a real translation
 *   — a single-file component with scoped styles — and the conversion is
 *   tested. Saying "this effect, in Vue" is true.
 *
 *   A BLOCK is a React component with state and handlers. What ships for
 *   Vue, Svelte and Astro is its rendered MARKUP, wrapped as a component
 *   file that framework compiles. That is a genuinely useful thing and a
 *   normal shape for a presentational component — but "the block, in Vue"
 *   would be false, and `blocks/markup-frameworks.ts` says so at length.
 *
 * So every entry below carries what it gives you at each rung, in those
 * words. The moment this reads as "everything, everywhere" it has become
 * the claim the codebase spent a docblock refusing to make.
 *
 * Pure data, client-safe. `lib/export` and `lib/blocks/markup-frameworks`
 * remain the implementations; this is what they amount to, for a reader.
 */

export type FrameworkSupport =
  /** A real conversion, tested — the artifact, in that framework. */
  | 'full'
  /** The rendered markup as a component file that framework compiles. */
  | 'markup'
  /** Not offered at this rung. */
  | 'none'

export interface FrameworkStory {
  id: string
  label: string
  /** One line for a card. What this framework gets, in plain words. */
  summary: string
  /** Effects — 973 of them, CSS, converted properly. */
  effects: FrameworkSupport
  /** Blocks and pages — React source; markup wrappers for the rest. */
  blocks: FrameworkSupport
  /** File extension a download lands as, for the ones that produce a file. */
  extension: string
  /** True where the website's own panel gates it behind a licence. */
  proOnWebsite: boolean
}

/**
 * Ordered by how much of the catalog the framework reaches, not
 * alphabetically and not by popularity. A reader scanning this wants to
 * know where they sit, and the honest answer for a Svelte developer is
 * different from the one for a React developer.
 */
export const FRAMEWORK_STORIES: readonly FrameworkStory[] = [
  {
    id: 'react',
    label: 'React',
    summary:
      'Everything, as it was written. Blocks and pages are React source; effects convert to a self-contained function component.',
    effects: 'full',
    blocks: 'full',
    extension: 'tsx',
    proOnWebsite: false,
  },
  {
    id: 'html',
    label: 'HTML + CSS',
    summary:
      'Everything, with no framework at all. An effect is a class and its rules; a block is its rendered markup. Nothing to install and nothing to hydrate.',
    effects: 'full',
    blocks: 'markup',
    extension: 'html',
    proOnWebsite: false,
  },
  {
    id: 'vue',
    label: 'Vue',
    summary:
      'Effects convert to a single-file component with scoped styles. Blocks and pages give you their markup as a .vue file — a presentational component, without the React state.',
    effects: 'full',
    blocks: 'markup',
    extension: 'vue',
    proOnWebsite: true,
  },
  {
    id: 'svelte',
    label: 'Svelte',
    summary:
      'Effects convert to a Svelte component with scoped styles. Blocks and pages give you their markup as a .svelte file, without the React state.',
    effects: 'full',
    blocks: 'markup',
    extension: 'svelte',
    proOnWebsite: true,
  },
  {
    id: 'astro',
    label: 'Astro',
    summary:
      'Blocks and pages give you their markup as an .astro file — which, for Astro, is not a compromise: a component that is only markup is the normal shape of one.',
    effects: 'none',
    blocks: 'markup',
    extension: 'astro',
    proOnWebsite: false,
  },
  {
    id: 'tailwind',
    label: 'Tailwind',
    summary:
      'Effects rewritten as utility classes rather than a stylesheet, for a project that keeps everything in the markup.',
    effects: 'full',
    blocks: 'full',
    extension: 'html',
    proOnWebsite: true,
  },
  {
    id: 'styled-components',
    label: 'styled-components',
    summary:
      'Effects as a styled component, with keyframes hoisted and the root scoped, for a CSS-in-JS codebase.',
    effects: 'full',
    blocks: 'none',
    extension: 'tsx',
    proOnWebsite: true,
  },
]

export const SUPPORT_LABELS: Record<FrameworkSupport, string> = {
  full: 'Converted',
  markup: 'Markup only',
  none: '—',
}

/**
 * The one-line version, for a landing band or a meta description.
 *
 * Derived rather than typed, because the list above is the thing that
 * changes and a hand-written "React, Vue and Svelte" would survive exactly
 * one addition. Names only — the caveats need more room than a line.
 */
export const FRAMEWORK_LINE: string = FRAMEWORK_STORIES.map((f) => f.label).join(' · ')

/** How many frameworks the catalog reaches at all. */
export const FRAMEWORK_COUNT = FRAMEWORK_STORIES.length

/**
 * The caveat, in one sentence, wherever the count is claimed.
 *
 * Exported rather than repeated so it cannot drift: a page that prints
 * `FRAMEWORK_COUNT` without this next to it is making the flat claim this
 * file exists to avoid.
 */
export const FRAMEWORK_CAVEAT =
  'Effects are converted — a real single-file component with scoped styles. Blocks and pages ship their rendered markup wrapped as a component file, which is a presentational component rather than a port of the React logic.'
