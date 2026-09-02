'use client'

/**
 * HeroEffectWall — the ghosted card wall behind the landing headline.
 *
 * This replaced four blurred colour blobs. The blobs carried no
 * information and were the same backdrop every other SaaS hero ships;
 * this one is the merchandise, running.
 *
 * The point of difference worth protecting: a marketplace puts static
 * JPEGs behind its headline because third-party authors upload marketing
 * art. Hoverlab renders its own catalog, so the backdrop can be the live
 * thing — a demo and a background at once.
 *
 * Three constraints shape the implementation:
 *
 *  1. It must not cost a catalog import. `BUNDLED_EFFECTS` is the ~64
 *     hand-crafted effects that already ship in the landing page's bundle
 *     for <LandingShowcase>, so the wall adds DOM and CSS but no download.
 *     Reaching for `@/lib/effect-index` here would put 772 KB of metadata
 *     on the highest-traffic page — see the note above HERO_TIERS.
 *
 *  2. `EffectCard` is not reusable for this. One of those is 876 px tall
 *     and carries two code panes, a tab bar and eleven buttons; a wall of
 *     them would ship the whole code-viewer stack to `/`. This renders the
 *     effect's markup and nothing else.
 *
 *  3. Decoration must not animate when nobody is looking at it, and must
 *     not animate at all for someone who asked it not to. Offscreen
 *     pausing is `useInView({ once: false })`; reduced motion drops the
 *     wall entirely via `.fx-hero-wall` in globals.css. The effects
 *     themselves already carry their own guards — `BUNDLED_EFFECTS` runs
 *     every one through `withMotionGuard` — but a decorative layer should
 *     not rely on each of 18 snippets having got that right.
 */

import * as React from 'react'
import { BUNDLED_EFFECTS } from '@/lib/bundled-effects'
import { useInView } from '@/hooks/use-in-view'
import { cn } from '@/lib/utils'
import type { Effect } from '@/lib/effect-types'

/** How many tiles the wall renders. Three rows of six on a wide screen. */
const WALL_SIZE = 18

/**
 * The four the showcase further down the page already renders in full.
 * Excluded so the same effect is not both the ghost and the demo, and so
 * their CSS is injected once rather than twice.
 */
const SHOWCASE_IDS = new Set(['btn-gradient', 'loader-orbit', 'text-shimmer', 'bg-aurora'])

/**
 * One effect per category, in catalog order, then topped up.
 *
 * A cross-section rather than a random sample: eighteen buttons behind
 * the headline would say the catalog is buttons. Deterministic, so the
 * server and client agree — picking at random here would be a hydration
 * mismatch.
 */
function pickWallEffects(): Effect[] {
  const out: Effect[] = []
  const chosen = new Set<string>()
  const seenCategory = new Set<string>()

  for (const effect of BUNDLED_EFFECTS) {
    if (out.length >= WALL_SIZE) break
    if (SHOWCASE_IDS.has(effect.id) || seenCategory.has(effect.category)) continue
    seenCategory.add(effect.category)
    chosen.add(effect.id)
    out.push(effect)
  }

  // Fewer categories than slots — fill the rest in catalog order.
  for (const effect of BUNDLED_EFFECTS) {
    if (out.length >= WALL_SIZE) break
    if (SHOWCASE_IDS.has(effect.id) || chosen.has(effect.id)) continue
    chosen.add(effect.id)
    out.push(effect)
  }

  return out
}

export function HeroEffectWall() {
  const effects = React.useMemo(() => pickWallEffects(), [])
  // once: false — this is a pause switch, not a reveal trigger.
  const [ref, inView] = useInView<HTMLDivElement>({ once: false, threshold: 0 })

  return (
    <div
      ref={ref}
      aria-hidden
      /*
       * `inert` is the other half of `aria-hidden`, and the same omission
       * `ArtifactThumbnail` already had to fix.
       *
       * `aria-hidden` takes the wall out of the accessibility tree but
       * leaves every button and input inside it in the tab order. The wall
       * renders before <SiteHeader> in the DOM, so seven decorative demo
       * controls — Activate, two text fields, Press Me, Continue, Discover,
       * Subscribe — sat in front of "Skip to content" on the front door.
       * A keyboard user had to tab through the decoration to reach the link
       * whose entire purpose is to skip past decoration.
       */
      inert
      className={cn(
        /*
         * z-0, not -z-10.
         *
         * The four blobs this replaced sat at -z-10 and were invisible on
         * this page — worth knowing, because it means the decorative
         * layer had not rendered for some time and nobody noticed. A
         * negative z-index puts the element behind the in-flow content of
         * its stacking context, and here that includes the ground the
         * page paints. So the wall sits at z-0 and the hero section
         * claims z-10 above it instead.
         */
        'fx-hero-wall pointer-events-none absolute inset-x-0 top-0 z-0 h-[680px] overflow-hidden',
        !inView && 'fx-hero-wall-paused',
      )}
    >
      {/*
        One <style> for the whole wall rather than one per tile. The
        catalog's CSS is class-based and `.fx-`-prefixed, which is what
        makes injecting it at document level safe — the same thing
        /library does with its 24 visible cards.
      */}
      <style
        dangerouslySetInnerHTML={{
          __html: effects.map((effect) => effect.css).join('\n'),
        }}
      />

      <div className="grid grid-cols-3 gap-4 p-4 opacity-50 sm:grid-cols-4 lg:grid-cols-6 dark:opacity-45">
        {effects.map((effect) => (
          <div
            key={effect.id}
            className={cn(
              'flex h-32 items-center justify-center overflow-hidden rounded-xl border border-border/40 p-3',
              effect.darkSurface ? 'bg-slate-950' : effect.previewClass ?? 'bg-muted/40',
            )}
            dangerouslySetInnerHTML={{ __html: effect.html }}
          />
        ))}
      </div>

      {/*
        The legibility layer, in two passes.

        The first draft was a single vertical wash at 85% over tiles set
        to 14% opacity, which multiplied out to a wall nobody could see —
        all of the cost and none of the effect. So the clearing is
        targeted instead of global: a radial that goes opaque exactly
        where the 72 px headline sits and falls away at the edges, then a
        vertical fade so the wall ends into the page rather than being
        sliced off at the section boundary. The tiles can stay legible
        because the type has its own ground.
      */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_58%_42%_at_50%_36%,var(--background)_38%,transparent_100%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-background" />
    </div>
  )
}
