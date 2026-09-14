/**
 * <VariationsRail> — the seven public variations under every effect.
 *
 * ── WHY THIS IS A SERVER COMPONENT ──────────────────────────────────────
 *
 * Because "public" has to mean *in the HTML*. The rail this replaces read
 * localStorage, which meant its contents existed only in one browser; a
 * client-rendered replacement would have been the same mistake one layer up,
 * with the seven variations absent from the document that Googlebot fetches
 * and from the page a reader gets with JavaScript off. The effect pages are
 * this product's entire long-tail search surface and are statically
 * generated for exactly that reason, so the variations are generated with
 * them. The rail ships one client component, and it is the Copy button.
 *
 * ── WHY THE WRAPPER CLASS IS DERIVED AND NOT GENERATED ──────────────────
 *
 * Seven copies of one effect on one page need seven scopes, and the obvious
 * source of a unique class is `React.useId()` — which is a hook, and hooks
 * are not available here. That turns out to be the better constraint:
 * `fx-var-<effectId>-<variationId>` is stable across the build, every
 * rebuild, and any client render, so a card's class cannot drift between the
 * HTML and a hydration pass the way a module-level counter's did. Both parts
 * are catalog slugs, so the result is always a valid class name.
 *
 * ── WHY ONE <style> AND NOT SEVEN ───────────────────────────────────────
 *
 * Same reason `<EffectStaticCard>`'s callers emit one: the scoped sheets
 * cannot collide — every selector is prefixed with a class unique to its
 * card, and the generator already namespaces animation names per effect — so
 * concatenating them is safe, and one tag beats eight on a page that already
 * carries the effect's own stylesheet.
 *
 * ── WHAT THE CARD LINKS TO ──────────────────────────────────────────────
 *
 * The customize panel on this same page, at that variation's exact slider
 * positions, via the `#hue=…&sat=…` hash the panel already reads on mount.
 * No new route: 7,329 thin URLs that each restate one effect would be the
 * indexable-doorway version of this feature, and `lib/variations.ts` picks
 * slider-legal values precisely so that landing there gives the reader four
 * sliders they can keep moving rather than a dead end.
 */

import Link from 'next/link'
import { ExternalLink, Sparkles } from 'lucide-react'

import { VariationCopy } from '@/components/variation-copy'
import { MyRemixesRail } from '@/components/my-remixes-rail'
import { customizeCss, optsToHash } from '@/lib/customize'
import type { Effect } from '@/lib/effects'
import { namespaceKeyframes, scopeCss } from '@/lib/scope-css'
import { cn } from '@/lib/utils'
import {
  FAMILY_LABEL,
  authorHref,
  authorLabel,
  supportsVariations,
  variationsFor,
  type Variation,
} from '@/lib/variations'

/** `fx-var-<effect>-<variation>` — see the header on why this is derived. */
function wrapperFor(effectId: string, variationId: string): string {
  return `fx-var-${effectId}-${variationId}`.replace(/[^a-zA-Z0-9_-]/g, '-')
}

export function VariationsRail({ effect }: { effect: Effect }) {
  /*
   * Nothing at all for the shader effects. `supportsVariations` carries the
   * argument: their CSS is a fallback gradient, not the effect, so seven
   * recolourings of it would be seven cards making a claim that is false for
   * anyone whose GPU works.
   */
  if (!supportsVariations(effect.renderer)) return null

  const variations = variationsFor(effect.id)

  /*
   * Derive each variation's CSS twice, for two different jobs: `css` is what
   * the reader copies and must be pasteable as-is, `scoped` is what this page
   * renders and must not leak out of a 112px box. Scoping the copyable one
   * would hand somebody a stylesheet full of `.fx-var-…` selectors that
   * match nothing in their project.
   */
  const cards = variations.map((variation) => {
    const wrapper = wrapperFor(effect.id, variation.id)
    const css = customizeCss(effect.css, variation.opts)
    /*
     * `namespaceKeyframes` before `scopeCss`, and only on the rendered copy.
     * Scoping a selector does not scope an @keyframes NAME, and those are
     * global and last-wins: without this, seven copies of
     * `@keyframes fx-dots-bounce` at seven different scales collapse to
     * whichever came last, taking the effect's own preview higher up the page
     * with them. 166 effects in the catalog animate through keyframes that
     * customization changes. `css` stays un-namespaced because that is the
     * string the Copy button hands over.
     */
    const scoped = scopeCss(namespaceKeyframes(css, wrapper), wrapper)
    return { variation, wrapper, css, scoped }
  })

  return (
    <section
      id="variations"
      aria-labelledby="variations-heading"
      className="mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6 lg:px-8"
    >
      {/* One tag for all seven. See the header. */}
      <style dangerouslySetInnerHTML={{ __html: cards.map((c) => c.scoped).join('\n') }} />

      <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-border/60 pt-6">
        <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
        {/*
          The heading carries the count, so there is no badge beside it. The
          first draft had both and read "7 variations of X" followed by a chip
          saying "7" — the two can never disagree, because both come from the
          same array.
        */}
        <h2 id="variations-heading" className="text-sm font-semibold tracking-tight">
          {cards.length} variations of {effect.name}
        </h2>
        <p className="w-full text-xs text-muted-foreground sm:w-auto">
          Finished looks, each one a position in the customizer above. Copy any
          of them, or open it and keep moving the sliders.
        </p>
      </div>

      {/*
        `relative` is load-bearing, not cosmetic. An `overflow-x-auto` that is
        statically positioned establishes no containing block, so an
        absolutely positioned descendant — Tailwind's `sr-only` is one — lays
        out against an ancestor instead and escapes the scroller, giving the
        whole document a horizontal scrollbar on a phone. That bug has been
        found on /compare and in seven catalog blocks; `check:overflow` is the
        gate, and this class is what satisfies it.
      */}
      <ul
        className="fx-no-scrollbar relative -mx-1 flex list-none gap-3 overflow-x-auto px-1 pb-2"
        role="list"
      >
        {cards.map(({ variation, wrapper, css }) => (
          <VariationCard
            key={variation.id}
            effect={effect}
            variation={variation}
            wrapper={wrapper}
            css={css}
          />
        ))}
      </ul>

      {/*
        The private lane, kept. A visitor's own saved remixes of THIS effect
        sit under the published seven, labelled as theirs — the rail went
        public without taking anything away from the person reading it. It is
        a client component and renders nothing at all when there are none,
        which on most visits is the case.
      */}
      <MyRemixesRail effectId={effect.id} />
    </section>
  )
}

/* ============================================================
 *  One variation
 * ========================================================== */

function VariationCard({
  effect,
  variation,
  wrapper,
  css,
}: {
  effect: Effect
  variation: Variation
  wrapper: string
  css: string
}) {
  const hash = optsToHash(variation.opts)
  const href = hash ? `/effect/${effect.id}#${hash}` : `/effect/${effect.id}`
  const byline = authorLabel(variation.author)
  const profile = authorHref(variation.author)

  return (
    <li className="flex w-56 shrink-0 flex-col overflow-hidden rounded-xl border border-border/60 bg-card/80 transition-colors hover:border-primary/40">
      {/*
        `inert` and `aria-hidden`: a third of these effects render a real
        <button> or <input>, and seven scaled-down copies of one would
        otherwise add seven sets of tab stops and announce seven times. The
        controls below are the real ones.
      */}
      <div
        inert
        aria-hidden="true"
        className={cn(
          'flex h-28 items-center justify-center overflow-hidden',
          effect.darkSurface ? 'bg-slate-950' : effect.previewClass ?? 'bg-muted/30',
        )}
      >
        <div
          className={wrapper}
          style={{ transform: 'scale(0.55)', transformOrigin: 'center' }}
          dangerouslySetInnerHTML={{ __html: effect.html }}
        />
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="truncate text-sm font-semibold">{variation.name}</h3>
          {variation.family ? (
            <span className="shrink-0 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
              {FAMILY_LABEL[variation.family]}
            </span>
          ) : null}
        </div>

        {/*
          The byline. Plain text for ours, a link for a person's — and
          `nofollow ugc` on that link, because a profile URL somebody submitted
          is user-generated content and passing it our authority would make
          this rail worth spamming.
        */}
        <p className="text-[11px] text-muted-foreground">
          by{' '}
          {profile ? (
            <a
              href={profile}
              rel="nofollow ugc noopener noreferrer"
              target="_blank"
              className="font-medium text-foreground underline decoration-dotted underline-offset-2 hover:text-primary"
            >
              {byline}
            </a>
          ) : (
            <span className="font-medium text-foreground">{byline}</span>
          )}
        </p>

        <p className="line-clamp-2 text-[11px] leading-snug text-muted-foreground/80">
          {variation.blurb}
        </p>

        <div className="mt-auto flex items-center gap-1.5 pt-1.5">
          <VariationCopy name={variation.name} html={effect.html} css={css} />
          <Link
            href={href}
            /*
             * `scroll={false}` because the href is a hash on the page the
             * reader is already on: Next would otherwise jump them to the top
             * of the document, away from the rail, while the panel silently
             * updated behind them.
             */
            scroll={false}
            className="inline-flex h-7 shrink-0 items-center gap-1 rounded-md border border-border/60 px-2 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            title={`Open ${effect.name} in the customizer with ${variation.name} applied`}
          >
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
            Open
          </Link>
        </div>
      </div>
    </li>
  )
}
