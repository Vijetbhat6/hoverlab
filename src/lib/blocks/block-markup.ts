import 'server-only'

import GENERATED_MARKUP from './generated-block-markup.json'

/**
 * A block's rendered markup, for people who are not writing React.
 *
 * The block API route says, correctly, that there is no `framework` param
 * for this tier: a block is hundreds of lines of React with hooks, generics
 * and event handlers, and a machine translation of that is a worse block
 * wearing the same name. Nothing here walks that back — this does not
 * translate anything.
 *
 * What it does is render the component once and hand back the HTML that
 * comes out. That is a genuinely different artifact with different honest
 * uses, and it is the thing a Vue, Svelte, Astro, Rails or plain-HTML
 * developer actually wants from a Tailwind block: the markup and the class
 * names. Tailwind utilities are framework-agnostic, so the *design* — which
 * is the part that took the work — transfers intact.
 *
 * What is lost is stated plainly by `markupNotes()` rather than left for
 * someone to discover: this is one frame of a component, in its initial
 * state, with every handler gone. A block with a mobile menu exports with
 * the menu closed and no way to open it. Sold as "the markup", that is
 * fine; sold as "the block in Vue", it would be a lie.
 *
 * The rendering itself happens at build time, in
 * `scripts/build-block-markup.mts` — Next's App Router refuses an import of
 * `react-dom/server`, and the catalog is fixed per deploy anyway, so this
 * reads the JSON that pass produces. Server-only regardless: it is ~490 KB
 * of HTML with no business in a client bundle.
 */

const MARKUP = GENERATED_MARKUP as Record<string, string>

/**
 * One block's rendered HTML, or null if it has none.
 *
 * Keyed by block **id**, not by `previewComponent`. The two are equal for
 * every block today, but the id is what the route and the detail page
 * already have in hand, and keying on the registry name would make this
 * the one place that breaks the day they diverge.
 */
export function blockMarkup(blockId: string): string | null {
  return MARKUP[blockId] ?? null
}

/**
 * What a consumer of this markup needs to be told, unprompted.
 *
 * Returned alongside the HTML everywhere it is served, so the caveats
 * travel with the artifact instead of living in documentation nobody
 * reads at the moment they paste.
 */
export function markupNotes(isInteractive: boolean): string[] {
  const notes = [
    'This is rendered HTML, not a translation of the React source. The Tailwind classes carry the design and work in any framework.',
    'It is one frame: the component in its initial state, with no props applied beyond the defaults.',
  ]

  if (isInteractive) {
    notes.push(
      'This block is interactive in React — toggles, menus or form state. None of that survives here; the markup is the closed/default state and the handlers are gone. Re-wire them in your own framework.',
    )
  }

  notes.push(
    'Requires Tailwind, and the design tokens the classes reference (bg-card, text-muted-foreground, and so on). The template ZIPs ship a globals.css that defines them.',
  )

  return notes
}
