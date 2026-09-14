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
 *
 * ── WHY EACH ENTRY CARRIES A TOOLCHAIN AND A SETUP LIST ─────────────────
 *
 * Because "we support Vue" and "this is for Vue developers" are different
 * claims, and only the second one wins anybody. React Bits shipped Vue Bits
 * and Svelte Bits as whole separate sites; Preline publishes a setup guide
 * per framework, Laravel and Rails included. What those do that a support
 * matrix cannot is address the reader in their own toolchain — Nuxt, not
 * "Vue"; `src/lib/components`, not "your components folder".
 *
 * So every entry below names the toolchain, the dependency our own CLI
 * looks for in a package.json, and what to do with the file once it lands.
 * `/frameworks/[slug]` renders that, next to output generated at build time
 * by the real converter. The page cannot claim a conversion that does not
 * run, because the conversion is what is printed on it.
 */

import type { FrameworkId } from './export'
import type { MarkupFramework } from './blocks/markup-frameworks'

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

  /**
   * The `<h1>` of this framework's own page.
   *
   * Written per framework rather than templated, because the honest
   * headline genuinely differs: Astro's page cannot promise effects, and
   * pretending otherwise to keep the sentence parallel is how the matrix
   * would start lying again.
   */
  headline: string

  /**
   * The converter that produces an effect in this framework, or null where
   * there is none.
   *
   * Typed as `FrameworkId` so that deleting a converter is a compile error
   * here rather than a page that offers a target nothing can build. Null is
   * only correct for Astro, whose story says `effects: 'none'` — and
   * `frameworks.test.ts` asserts the two agree.
   */
  exportTarget: FrameworkId | null

  /**
   * The block-markup wrapper for this framework, or null.
   *
   * Null does not mean "no blocks". React gets the source as written and
   * Tailwind blocks already *are* Tailwind, so neither needs a wrapper;
   * `blocks: 'full'` covers both. styled-components is the one real gap.
   */
  markupTarget: MarkupFramework | null

  /**
   * The toolchain, in the words its users use.
   *
   * "Vue" is a library; "Nuxt" is what somebody actually has open. A reader
   * scanning for whether this is for them is looking for the second.
   */
  ecosystem: readonly string[]

  /**
   * The package.json dependency `packages/cli/src/detect.mjs` looks for to
   * pick this target with no flag, phrased as the CLI phrases it.
   *
   * Quoted on the page to back a specific claim — run `hoverlab add` in
   * your project and it emits your framework without being told. Null where
   * detection cannot reach it: Astro has no effect converter to detect for,
   * and plain HTML/CSS is the fallback rather than a detection.
   */
  detectedFrom: string | null

  /** What to do with the file once it lands, in this framework. */
  setup: readonly string[]

  /**
   * Queries this page is the answer to.
   *
   * Per framework, because "vue tailwind components" and "astro components"
   * are different searches and the hub page can only rank for one of them.
   */
  keywords: readonly string[]
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
    headline: 'Tailwind hover effects, blocks and pages for React',
    exportTarget: 'react',
    markupTarget: null,
    ecosystem: ['React 19', 'Next.js', 'Vite', 'Remix'],
    detectedFrom: 'react is a dependency',
    setup: [
      'Drop the file in your components folder. It is valid as .tsx and as .jsx — there are no type annotations to strip.',
      'Import it and render it. The styles travel inside the component, so there is no stylesheet to register.',
      'Blocks and pages arrive as the React source they were written in, with their Tailwind classes and their hooks intact.',
    ],
    keywords: ['react tailwind components', 'react hover effects', 'react tailwind blocks'],
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
    headline: 'Tailwind hover effects in plain HTML and CSS',
    exportTarget: 'html',
    markupTarget: 'html',
    /*
     * The frameworks that have no framework — and the reason this entry is
     * not a booby prize. A Rails, Laravel, Django or Phoenix template is
     * server-rendered HTML with Tailwind classes in it, which is exactly
     * what this produces. Preline publishes a guide per backend framework;
     * this row is the honest version of all of them at once, because the
     * artifact genuinely is the same file in every one.
     */
    ecosystem: ['Rails', 'Laravel', 'Django', 'Phoenix', 'Hugo', 'no build step at all'],
    detectedFrom: null,
    setup: [
      'Paste the markup into your template. Server-rendered templates in Rails, Laravel, Django and Phoenix take it unchanged — it is HTML with Tailwind classes.',
      'Either keep the <style> block where it is or move the rules into your stylesheet. Nothing here depends on where it lives.',
      'No build step, no install, nothing to hydrate.',
    ],
    keywords: [
      'tailwind css hover effects',
      'html css hover effects',
      'tailwind components for rails',
      'tailwind components for laravel',
    ],
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
    headline: 'Tailwind hover effects and UI blocks for Vue',
    exportTarget: 'vue',
    markupTarget: 'vue',
    ecosystem: ['Vue 3', 'Nuxt', 'Vite', 'VitePress'],
    detectedFrom: 'vue is a dependency',
    setup: [
      'Save the file under src/components. It is a single-file component — nothing to register and no plugin to install.',
      'The <style> block is scoped, so the rules cannot leak into the rest of your app. Vue rewrites @keyframes names inside a scoped block for you.',
      'To style something a child component renders, wrap that selector in :deep().',
    ],
    keywords: [
      'vue tailwind components',
      'vue hover effects',
      'nuxt tailwind components',
      'vue css animations',
    ],
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
    headline: 'Tailwind hover effects and UI blocks for Svelte',
    exportTarget: 'svelte',
    markupTarget: 'svelte',
    ecosystem: ['Svelte 5', 'SvelteKit', 'Vite'],
    detectedFrom: 'svelte is a dependency',
    setup: [
      'Save the file under src/lib/components. A .svelte file that is markup and a <style> block is a complete component.',
      'Svelte scopes component styles and prunes selectors it cannot statically match.',
      'If the compiler reports an unused selector, wrap it in :global(...). That is expected for rules targeting pseudo-elements, and it is not a mistake in the output.',
    ],
    keywords: [
      'svelte ui components',
      'svelte tailwind components',
      'svelte hover effects',
      'sveltekit components',
    ],
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
    /*
     * The one headline that does not mention effects, and it stays that
     * way. There is no Astro effect converter — `exportTarget` is null and
     * the test asserts that matches `effects: 'none'`. An Astro page
     * promising hover effects would be the matrix lying in a bigger font.
     */
    headline: 'Tailwind UI blocks and page sections for Astro',
    exportTarget: null,
    markupTarget: 'astro',
    ecosystem: ['Astro 5', 'Starlight', 'content sites'],
    detectedFrom: null,
    setup: [
      'Save the file under src/components. The frontmatter fence is there and empty, which is where your props go.',
      'A component that is only markup is not a compromise in Astro — it is the normal shape of one, and it ships zero JavaScript.',
      'For an effect, take the HTML and CSS target instead and keep the <style> block: Astro scopes component styles for you.',
    ],
    keywords: [
      'astro components tailwind',
      'astro ui components',
      'astro page sections',
      'astro blocks',
    ],
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
    headline: 'Hover effects as Tailwind utility classes',
    exportTarget: 'tailwind',
    markupTarget: null,
    ecosystem: ['Tailwind v4', 'Tailwind v3', 'any framework'],
    detectedFrom: 'tailwindcss is a dependency',
    setup: [
      'Paste the markup. The effect is in the class list rather than in a stylesheet, so there is nothing else to add.',
      'Arbitrary values have to appear as complete literal strings for Tailwind to detect them — do not build these class names by concatenation.',
      'Blocks and pages are already written in Tailwind, so at that rung this target is simply the source.',
    ],
    keywords: [
      'tailwind hover effects',
      'tailwind utility animations',
      'tailwind css effects',
    ],
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
    headline: 'Hover effects as styled-components',
    exportTarget: 'styled-components',
    markupTarget: null,
    ecosystem: ['styled-components', 'CSS-in-JS'],
    /*
     * Checked before React in `detect.mjs`, and the reason is worth
     * repeating here because it looks like a bug otherwise: a project with
     * both dependencies is telling you which one it prefers.
     */
    detectedFrom: 'styled-components is a dependency',
    setup: [
      'Save the file in your components folder. The @keyframes are hoisted into keyframes helpers, so there is no global animation name to collide with.',
      'The root class selector is rewritten to &, which binds the styles to the component rather than to a global class name.',
      'This is the one target with nothing at the block rung: blocks are React plus Tailwind, and rewriting hundreds of utility classes as CSS-in-JS would be a worse block wearing the same name.',
    ],
    keywords: [
      'styled-components animations',
      'styled-components hover effects',
      'css-in-js effects',
    ],
  },
]

/** One framework by its slug, for `/frameworks/[slug]`. */
export function getFrameworkStory(slug: string): FrameworkStory | undefined {
  return FRAMEWORK_STORIES.find((f) => f.id === slug)
}

/**
 * The effect every per-framework page converts, and the block every one
 * wraps.
 *
 * Shared rather than chosen per framework, and that is the point: seven
 * pages showing the same artifact make the comparison a reader is actually
 * running — "what does this look like in mine" — answerable by opening two
 * tabs. Picking a flattering effect per framework would defeat it.
 *
 * The block is a magic-link form, and it is interactive, which is the
 * deliberately unflattering choice. Its wrapper prints the caveat at its
 * strongest — the submit handler is genuinely not in that file — and a
 * reader who sees that and takes it anyway is a reader who will not file a
 * bug in a week. A logo strip would have shown a caveat reading "nothing is
 * missing", which is true and proves nothing.
 */
export const SAMPLE_EFFECT_ID = 'btn-gradient'
export const SAMPLE_BLOCK_ID = 'auth-magic-link-form'

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
