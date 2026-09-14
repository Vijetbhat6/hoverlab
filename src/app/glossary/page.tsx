/**
 * /glossary — sixty interface terms, each one illustrated by the catalog.
 *
 * The editorial argument for this page is in `lib/glossary/catalog.ts`. The
 * argument for it being *this* page rather than sixty pages is here.
 *
 * A term per URL is what most sites do with a glossary, and it is the wrong
 * shape for this one. Each entry is two short paragraphs; sixty of them at
 * one URL each is sixty documents that are mostly navigation, which is the
 * definition of the thin-content pattern `check-hubs.mts` exists to keep this
 * site out of. As one page they are a reference someone can search with ⌘F,
 * read end to end, and link into precisely — every term has a stable `#slug`,
 * and the JSON-LD gives each one a `DefinedTerm` at that anchor.
 *
 * RENDER COST
 *
 * Sixty illustrations is the thing that could make this page bad. Three
 * decisions keep it cheap:
 *
 *   Effects render inline as markup plus one document-level <style>, the same
 *   way the category hubs do. They are single elements; the whole set costs
 *   less than one block does.
 *
 *   Primitives render their real demo. They are single controls, so a demo is
 *   a few dozen elements and needs no crop.
 *
 *   Blocks are page sections — hundreds of elements each — so they go through
 *   `<ArtifactThumbnail>`, which scales them down and, crucially, carries
 *   `content-visibility: auto`. That is what stops thirty off-screen sections
 *   being laid out and painted on load. See the measurement note in
 *   `artifact-preview.tsx`; the same fix is why /pages is usable.
 *
 * Nothing on the page hydrates except the copy buttons, which are one button
 * per entry and hold nothing but a string.
 */

import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowUpRight, BookOpen } from 'lucide-react'

import { JsonLd } from '@/components/json-ld'
import { GlossaryCopy } from '@/components/glossary-copy'
import { ArtifactThumbnail } from '@/components/artifact-preview'
import { getBlockPreview } from '@/lib/blocks/registry'
import { getPrimitivePreview } from '@/lib/primitives/registry'
import { hoverPeekCssFor, PEEK_CLASS } from '@/lib/hover-peek-css'
import { breadcrumbLd, definedTermSetLd } from '@/lib/structured-data'
import { absoluteUrl } from '@/lib/site'
import { LEVEL_LABEL } from '@/lib/artifact-types'
import { cn } from '@/lib/utils'
import {
  GLOSSARY,
  GLOSSARY_ALPHABETICAL,
  GLOSSARY_COUNT,
  getTerm,
  type GlossaryTerm,
} from '@/lib/glossary/catalog'
import { resolveTerm, type ResolvedTerm } from '@/lib/glossary/resolve'

const TITLE = `UI glossary — ${GLOSSARY_COUNT} interface terms, each with working code — Hoverlab`
const DESCRIPTION = `What a hero, a scrim, a combobox, a skeleton and a reasoning trace actually are — ${GLOSSARY_COUNT} interface terms defined in plain language, each one illustrated by a real component from this catalog with the code on a copy button.`

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'ui glossary',
    'ui terms',
    'ui component names',
    'what is a bento grid',
    'what is a scrim',
    'design system vocabulary',
  ],
  alternates: { canonical: '/glossary' },
  openGraph: {
    url: absoluteUrl('/glossary'),
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    siteName: 'Hoverlab',
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
}

/* ------------------------------------------------------------------ *
 *  Illustration
 * ------------------------------------------------------------------ */

/**
 * The picture under a definition, chosen by rung.
 *
 * A missing preview renders nothing rather than a placeholder box: the entry
 * still has its definition, its link and its copy button, so the page is
 * degraded rather than broken. The build check is what makes sure this branch
 * never actually runs in production.
 */
function Illustration({ entry }: { entry: ResolvedTerm }) {
  const { level, id } = entry.term.example

  if (level === 'effect' && entry.effect) {
    const effect = entry.effect
    return (
      <div
        className={cn(
          PEEK_CLASS,
          'flex min-h-[132px] items-center justify-center overflow-hidden rounded-xl border border-border/60 p-6',
          effect.darkSurface ? 'bg-slate-950' : effect.previewClass ?? 'bg-muted/30',
        )}
        // Decoration for the definition beside it. The named link below is
        // the real control, and several effects ship their own buttons and
        // headings that would otherwise be announced twice.
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: effect.html }}
      />
    )
  }

  if (level === 'primitive') {
    const preview = getPrimitivePreview(id)
    if (!preview) return null
    return (
      <div
        aria-hidden
        inert
        className="flex min-h-[132px] items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-muted/20 p-6"
      >
        {preview}
      </div>
    )
  }

  const preview = getBlockPreview(id)
  if (!preview) return null
  return <ArtifactThumbnail preview={preview} missingKey={id} height="h-48" />
}

/* ------------------------------------------------------------------ *
 *  One entry
 * ------------------------------------------------------------------ */

function Entry({ entry }: { entry: ResolvedTerm }) {
  const { term } = entry
  const level = term.example.level

  return (
    <article
      id={term.slug}
      // The anchor is the point of the page, and a bare `#slug` scrolls the
      // heading flush against a sticky header. `scroll-mt` is the fix, and it
      // has to be on the element the fragment names.
      className="scroll-mt-24 border-t border-border/50 py-8 first:border-t-0 sm:py-10"
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-10">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3 className="text-lg font-bold tracking-tight">
              <a
                href={`#${term.slug}`}
                className="hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {term.term}
              </a>
            </h3>
            {term.aka?.length ? (
              <p className="text-xs text-muted-foreground">
                also called{' '}
                {term.aka.map((name, i) => (
                  <span key={name}>
                    {i > 0 ? ', ' : ''}
                    <span className="italic">{name}</span>
                  </span>
                ))}
              </p>
            ) : null}
          </div>

          <p className="mt-3 text-pretty text-sm leading-relaxed sm:text-base">
            {term.definition}
          </p>

          <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground/80">In practice — </span>
            {term.inPractice}
          </p>

          {term.see?.length ? (
            <p className="mt-3 text-xs text-muted-foreground">
              See also{' '}
              {term.see.map((slug, i) => {
                const other = getTerm(slug)
                if (!other) return null
                return (
                  <span key={slug}>
                    {i > 0 ? ', ' : ''}
                    <a
                      href={`#${slug}`}
                      className="underline decoration-border underline-offset-2 hover:text-primary hover:decoration-primary"
                    >
                      {other.term.toLowerCase()}
                    </a>
                  </span>
                )
              })}
            </p>
          ) : null}
        </div>

        <div className="min-w-0">
          <Illustration entry={entry} />

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <GlossaryCopy
              code={entry.copy.code}
              label={entry.copy.label}
              noun={entry.copy.noun}
              artifactId={term.example.id}
            />
            <Link
              href={entry.href}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="rounded bg-muted/60 px-1.5 py-0.5 font-medium">
                {LEVEL_LABEL[level].one}
              </span>
              {entry.name}
              <ArrowUpRight aria-hidden className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}

/* ------------------------------------------------------------------ *
 *  Page
 * ------------------------------------------------------------------ */

export default function GlossaryPage() {
  /*
   * Resolved once, up front, so the effect CSS can be collected for the
   * single <style> below before any entry renders. A term whose example has
   * vanished is dropped rather than rendered half-formed; the build check is
   * what makes sure that never silently happens.
   */
  const groups = GLOSSARY.map((group) => ({
    ...group,
    entries: group.terms
      .map(resolveTerm)
      .filter((entry): entry is ResolvedTerm => entry !== undefined),
  })).filter((group) => group.entries.length > 0)

  const effects = groups.flatMap((g) => g.entries.map((e) => e.effect)).filter(Boolean)
  const shown = groups.reduce((n, g) => n + g.entries.length, 0)

  /*
   * The A–Z index lists only terms that resolved, so it can never link at a
   * fragment the document does not contain.
   */
  const resolvedSlugs = new Set(groups.flatMap((g) => g.entries.map((e) => e.term.slug)))
  const alphabetical: GlossaryTerm[] = GLOSSARY_ALPHABETICAL.filter((t) =>
    resolvedSlugs.has(t.slug),
  )

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Every illustrated effect's CSS in one document-level tag, then the
          hover-to-play rules derived from it. Class names are unique per
          effect (`fx-<slug>-<seq>`), so concatenating cannot collide. */}
      <style
        dangerouslySetInnerHTML={{
          __html: [
            effects.map((e) => e!.css).join('\n'),
            hoverPeekCssFor(effects.map((e) => e!.css)),
          ]
            .filter(Boolean)
            .join('\n'),
        }}
      />

      <JsonLd
        data={breadcrumbLd([
          { name: 'Hoverlab', path: '/' },
          { name: 'Glossary', path: '/glossary' },
        ])}
      />
      <JsonLd
        data={definedTermSetLd({
          name: 'The Hoverlab UI glossary',
          description: DESCRIPTION,
          path: '/glossary',
          terms: alphabetical.map((t) => ({
            slug: t.slug,
            term: t.term,
            definition: t.definition,
          })),
        })}
      />

      <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <BookOpen aria-hidden className="h-3.5 w-3.5" />
            Glossary
          </span>
          <h1 className="type-hub mt-5">The words, with the thing itself under them</h1>
          <p className="mt-4 text-pretty text-body">
            {shown} interface terms, defined in plain language. Every one of them
            is illustrated by a real artifact from this catalog — the live
            component, not a screenshot of one — with its code on a copy button.
            It is the only version of this page where reading the definition and
            using the thing are the same click.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Each entry adds what a dictionary leaves out: the rule, the trap, and
            the case where the obvious control is the wrong one.
          </p>
        </header>

        {/* A–Z index. Sixty anchors is a lot of links, and it is the right
            amount for a reference someone arrives at from a search for one
            word. */}
        <nav aria-label="All terms, alphabetically" className="mt-10">
          <ul className="flex flex-wrap justify-center gap-x-1.5 gap-y-1.5">
            {alphabetical.map((term) => (
              <li key={term.slug}>
                <a
                  href={`#${term.slug}`}
                  className="inline-block rounded-full border border-border/50 bg-card/40 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {term.term}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {groups.map((group) => (
          <section key={group.id} id={group.id} className="mt-16 scroll-mt-24">
            <div className="border-b border-border/60 pb-4">
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                {group.title}
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{group.blurb}</p>
            </div>
            {group.entries.map((entry) => (
              <Entry key={entry.term.slug} entry={entry} />
            ))}
          </section>
        ))}

        <section className="mt-16 rounded-2xl border border-border/60 bg-card/40 p-6 sm:p-8">
          <h2 className="text-lg font-bold tracking-tight">
            Knowing the word is the easy half
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Every term here links at one artifact, which is enough to see the
            pattern and not enough to build with. The catalog has the rest of
            each family, and the guided paths put them in the order a real page
            needs them.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold">
            <Link
              href="/browse"
              className="rounded-lg border border-border/60 px-3 py-1.5 transition-colors hover:border-primary/40 hover:text-primary"
            >
              Search everything
            </Link>
            <Link
              href="/paths"
              className="rounded-lg border border-border/60 px-3 py-1.5 transition-colors hover:border-primary/40 hover:text-primary"
            >
              Guided paths
            </Link>
            <Link
              href="/blocks"
              className="rounded-lg border border-border/60 px-3 py-1.5 transition-colors hover:border-primary/40 hover:text-primary"
            >
              Browse blocks
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
