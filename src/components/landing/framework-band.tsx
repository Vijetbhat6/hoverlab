/**
 * <FrameworkBand> — the capability that was three clicks deep.
 *
 * Vue, Svelte and Astro output has shipped here for months, inside a tab
 * strip inside a detail page. Flowbite and React Bits both put
 * multi-framework in the masthead; React Bits shipped whole separate sites
 * for Vue and Svelte. A reader deciding between us and them never saw ours.
 *
 * So this is a band, not a footnote, and it sits next to <AgentBand> for
 * the same reason that one exists: it is a real claim that was being made
 * at the size of a tab label.
 *
 * WHAT IT MUST NOT DO. Claim the blocks are ported. They are not — what
 * ships for the non-React frameworks is rendered markup wrapped as a
 * component file, and `lib/frameworks.ts` and `lib/blocks/markup-frameworks.ts`
 * both spend a docblock being precise about the difference. The caveat is
 * rendered here, in the band, rather than left for the page behind it: a
 * reader who never clicks through must not come away with the flat claim.
 */

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { Reveal } from '@/components/reveal'
import {
  FRAMEWORK_CAVEAT,
  FRAMEWORK_STORIES,
  SUPPORT_LABELS,
} from '@/lib/frameworks'

export function FrameworkBand() {
  return (
    <section
      aria-labelledby="frameworks-heading"
      className="border-y border-border/60 bg-muted/20 py-16 sm:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Reveal className="max-w-2xl">
          <p className="text-sm font-medium text-primary">Not just React</p>
          <h2
            id="frameworks-heading"
            className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl"
          >
            Take it out in the framework you actually use
          </h2>
          <p className="mt-4 text-body text-muted-foreground">
            {FRAMEWORK_CAVEAT}
          </p>
        </Reveal>

        <Reveal delay={80}>
          {/*
            Cards rather than a table at this width, and a table on the page
            behind it. A band is scanned; the per-rung detail is what
            somebody reads once they care, and cramming both here would make
            the honest version illegible.

            Separated cards with their own borders, NOT the `gap-px` over a
            `bg-border` parent this file used first. That trick makes the
            seams even, and it also paints every empty cell of the last row
            in the border colour — with seven frameworks in a four-column
            grid, that is a grey rectangle sitting where an eighth would be,
            and it reads as a card that failed to load. A real gap has no
            cells to leak through.
          */}
          <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FRAMEWORK_STORIES.map((framework) => (
              <li
                key={framework.id}
                className="rounded-xl border border-border bg-card p-5"
              >
                <p className="text-sm font-semibold text-foreground">
                  {framework.label}
                </p>
                <dl className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-baseline justify-between gap-3">
                    <dt>Effects</dt>
                    <dd className="font-medium text-foreground">
                      {SUPPORT_LABELS[framework.effects]}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <dt>Blocks &amp; pages</dt>
                    <dd className="font-medium text-foreground">
                      {SUPPORT_LABELS[framework.blocks]}
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={160} className="mt-8">
          <Link
            href="/frameworks"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            What each framework gets, rung by rung
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Reveal>
      </div>
    </section>
  )
}
