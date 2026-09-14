'use client'

/**
 * The band on the tools the studio folded in.
 *
 * ── WHY THE TOOLS STILL EXIST ───────────────────────────────────────────
 *
 * The studio supersedes `/tools/tokens` and `/tools/palette` as the place
 * to do this work, and neither was deleted. They are the highest-intent
 * entry points on the site — "design token generator" and "colour palette
 * generator" are things people type into a search engine, and between them
 * they carry twenty curated permalinks that are indexed as documents with
 * the colours in the HTML. Redirecting those to an editor that opens on a
 * blank identity form would trade a page that answers the query for one
 * that asks a question back.
 *
 * So the tools keep answering the narrow question, and this is the sentence
 * that says there is a bigger one. It is deliberately NOT in
 * `UseInCatalog`, which all thirty-four tools mount: a grid generator has
 * nothing to hand a design system, and an offer that appears everywhere is
 * an offer nobody reads.
 *
 * ── THE LINK CARRIES THE WORK ───────────────────────────────────────────
 *
 * `params` is the tool's own state in its own query format, which
 * `studioSeedFromParams` reads. That is the whole difference between a
 * cross-link and a handoff: someone who has spent two minutes on a hue
 * arrives with the hue, not with an invitation to set it again.
 */

import Link from 'next/link'
import { ArrowRight, Layers } from 'lucide-react'

import { cn } from '@/lib/utils'

export interface OpenInStudioProps {
  /**
   * The tool's state as query parameters — `hue`/`chroma`/`radius`/
   * `neutral` from the token generator, `base`/`scheme` from the palette
   * one. Read by `studioSeedFromParams`, which ignores what it does not
   * recognise and falls back to the visitor's stored state entirely when
   * it recognises nothing.
   */
  params?: Record<string, string | number>
  /**
   * What this tool cannot do, in the tool's own terms.
   *
   * Written per caller rather than generically, because "and much more" is
   * the phrasing of an upsell and a specific missing thing is the phrasing
   * of an answer. The palette tool's gap is not the token generator's.
   */
  gap: string
  className?: string
}

export function OpenInStudio({ params, gap, className }: OpenInStudioProps) {
  const query = new URLSearchParams(
    Object.entries(params ?? {}).map(([k, v]) => [k, String(v)]),
  ).toString()

  return (
    <section
      aria-labelledby="open-in-studio"
      className={cn(
        'rounded-2xl border border-border/60 bg-gradient-to-br from-primary/5 via-card to-card p-5',
        className,
      )}
    >
      <h2 id="open-in-studio" className="flex items-center gap-1.5 text-sm font-semibold">
        <Layers aria-hidden className="h-4 w-4 text-primary" />
        Carry this into the Studio
      </h2>
      <p className="text-body mt-1.5 max-w-2xl text-xs">
        {gap} The Studio is the same controls plus the half a token file cannot carry
        — who the product is for, how it sounds, and what it must never do — and it
        leaves as a document your coding agent reads rather than as CSS you still have
        to explain.
      </p>
      <Link
        href={query ? `/studio?${query}` : '/studio'}
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Open in the Studio
        <ArrowRight aria-hidden className="h-3.5 w-3.5" />
      </Link>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Opens with what is on this page already set.
      </p>
    </section>
  )
}
