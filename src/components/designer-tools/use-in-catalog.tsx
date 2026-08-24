'use client'

/**
 * The way out of a designer tool and into the catalog.
 *
 * The tools are the biggest acquisition surface on this site and, until
 * this component existed, a dead end: someone arrived from a search for
 * "css spacing scale generator", got the scale, copied it, and left. There
 * was no sentence anywhere on the page telling them that the same site has
 * a thousand components already built against tokens exactly like the ones
 * they had just made.
 *
 * Three exits, in the order they are worth taking:
 *
 *   Preview the catalog in this brand. Applies the tool's hue and chroma
 *   as the site-wide brand colour and sends them to /browse. It is the
 *   cheapest possible demonstration that the catalog is not a screenshot
 *   gallery — every artifact repaints. This is the exit that converts,
 *   because it answers "would this look like my product" in one click.
 *
 *   Install the tokens. `npx shadcn add` against the registry base preset,
 *   which carries the token block, the fonts and the Tailwind config. The
 *   command is the same one the docs give, so nothing here has to be kept
 *   in step with a second copy of it.
 *
 *   Hand the tokens to an agent. Design DNA, which is the same values in
 *   the form v0, Cursor and Claude will read. Tokens without components is
 *   a style guide; tokens plus `npx hoverlab add` is a build, and that
 *   sentence is the pitch.
 *
 * Deliberately NOT a paywall, an email gate or a modal. The tools convert by
 * being useful and then pointing somewhere; every interstitial between those
 * two halves costs more traffic than it captures.
 */

import * as React from 'react'
import Link from 'next/link'
import { ArrowRight, Sparkles, Terminal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { copyWithToast } from '@/components/designer-tools/tool-layout'
import { useBrandColor } from '@/hooks/use-brand-color'
import { REGISTRY_NAME } from '@/lib/registry/name'
import { track } from '@/lib/analytics'
import { cn } from '@/lib/utils'

export interface UseInCatalogProps {
  /**
   * The brand colour this tool's state implies, when it implies one.
   *
   * Optional because not every tool produces a colour — a spacing scale
   * does not, and offering to repaint the catalog from one would be a
   * button that changes nothing. Those tools get the other two exits.
   */
  brand?: { hue: number; chroma: number } | null
  /** Which tool this is, for knowing which of them actually convert. */
  tool: string
  className?: string
}

/**
 * The base preset's URL form, which needs no `components.json` entry.
 *
 * `/docs/registry` gives the namespaced form (`npx shadcn add
 * @hoverlab/hoverlab`) because a project installing several items should
 * configure the registry once. Someone arriving from a tool has installed
 * nothing yet, so the URL form is the one that works on the first try.
 * `REGISTRY_NAME` is the same constant the route serves from, so a rename
 * cannot leave this pointing at a 404.
 */
function installCommand(origin: string): string {
  return `npx shadcn@latest add ${origin}/r/${REGISTRY_NAME}.json`
}

export function UseInCatalog({ brand, tool, className }: UseInCatalogProps) {
  const { set: setBrand } = useBrandColor()

  /*
    Origin from the browser, after mount.

    `lib/site.ts` is the canonical source but reads server-side runtime
    variables, and this is a client component in a statically rendered page
    — it would bake in whatever the build host thought the origin was. The
    placeholder renders on the server and for one client frame, so it has to
    be a URL that is true rather than a spinner.
  */
  const [origin, setOrigin] = React.useState('https://hoverlab.dev')
  React.useEffect(() => setOrigin(window.location.origin), [])
  const install = installCommand(origin)

  function previewInBrand() {
    if (!brand) return
    /*
      Lightness is not taken from the tool.

      A token generator's job is to produce a ramp, and the ramp's lightness
      is chosen for the surface it sits on. The site's own --primary carries
      every button, link and focus ring, and its lightness is set to the
      value measured at 5.01:1 against the page background (see the note on
      --brand-light-l in globals.css). Importing a tool's lightness here
      would let a preview repaint the site's chrome to something that fails
      WCAG AA — on the accessibility tool's own site.

      Hue and chroma carry the identity and cannot break contrast on their
      own, so those are what travel.
    */
    setBrand({
      hue: brand.hue,
      chroma: brand.chroma,
      lightL: 0.49,
      darkL: 0.7,
    })
    track('tool_preview_in_brand', { tool })
  }

  return (
    <section
      className={cn(
        'rounded-2xl border border-border/60 bg-gradient-to-br from-primary/5 via-card to-card p-5',
        className,
      )}
      aria-labelledby="use-in-catalog"
    >
      <h2 id="use-in-catalog" className="text-sm font-semibold">
        Now use it on something
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Every effect, block, page and template in the catalog is styled
        against tokens shaped exactly like these — so they take your values
        rather than fighting them.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {brand ? (
          <Button asChild size="sm" onClick={previewInBrand}>
            {/*
              A real link, not a button that navigates. The brand is applied
              on click and the href does the navigation, so this still works
              in a new tab and still reads as a link to a screen reader.
            */}
            <Link href="/browse">
              <Sparkles className="h-4 w-4" />
              Preview the catalog in this palette
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        ) : null}

        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            void copyWithToast(install, 'Install command copied')
            track('tool_copy_install', { tool })
          }}
        >
          <Terminal className="h-4 w-4" />
          Copy the install command
        </Button>

        <Button asChild size="sm" variant="ghost">
          <Link href="/docs/dna" onClick={() => track('tool_open_dna', { tool })}>
            Hand these tokens to an agent
          </Link>
        </Button>
      </div>

      <p className="mt-3 break-all font-mono text-xs text-muted-foreground">{install}</p>
    </section>
  )
}
