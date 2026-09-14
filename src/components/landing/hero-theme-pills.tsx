'use client'

/**
 * Four themes, in the hero, applied to the page you are already looking at.
 *
 * ── WHY THIS IS ON THE FRONT DOOR AND NOT ONLY ABOVE THE GRID ───────────
 *
 * The theme system already existed in two places: one line above every
 * catalog grid (`theme-studio-bar`) and a gallery of eight at /themes. Both
 * are behind a click, and both are reached by someone who has already
 * decided to browse. The question a theme answers — "would my product look
 * like this" — is the question a visitor is asking in the first ten seconds
 * on the landing page, before they have clicked anything at all.
 *
 * So this is the same mechanism, hoisted to where the question is asked.
 * Nothing here is new: `useThemeStudio` is the same hook the bar uses,
 * `THEME_PRESETS` is the same list /themes renders, and the tokens land on
 * <html> exactly as they do everywhere else. The only new thing is the
 * placement, and the placement is the whole point.
 *
 * ── IT ALSO FIXES A HOLE ────────────────────────────────────────────────
 *
 * `useThemeStudio` applies the saved theme on mount, and until now nothing
 * on "/" mounted it. Someone who picked Editorial on /blocks and then
 * clicked the wordmark landed on a default-emerald homepage — the one page
 * on the site that forgot their theme, and the one they were most likely to
 * show somebody else. Mounting the hook here is what restores it.
 *
 * ── FOUR, NOT EIGHT ─────────────────────────────────────────────────────
 *
 * /themes exists for the full set; a hero is not a gallery. These four are
 * chosen to be unmistakable from across the room rather than to cover the
 * space evenly: each moves the accent, the neutrals, the typeface AND the
 * corner radius, so the page visibly becomes a different product rather
 * than the same page in a different green. Console and Clinic are better
 * themes than Storefront for most real products and are deliberately not
 * here — they differ from the default mostly in hue, which at hero scale
 * reads as "the button changed colour" and undersells what is happening.
 *
 * Hoverlab is one of the four on purpose. It is the way back, and a pill
 * that is already pressed teaches what the other three do before anyone
 * touches one.
 *
 * ── WHAT ACTUALLY CHANGES, SINCE THE COPY HAS TO BE TRUE ────────────────
 *
 * Every token-driven surface on this page and every other: typeface,
 * corners, borders, cards, buttons, the neutrals under all of it. What does
 * NOT change is the inside of the four effect tiles below — those inject
 * their own CSS with their own colours, because an effect called "Aurora"
 * is a gradient, not a themed component. The note under the pills says
 * "every block, page and template", which is the claim that is true; it
 * does not say "everything you can see".
 *
 * ── ACCESSIBILITY ───────────────────────────────────────────────────────
 *
 * A labelled group of `aria-pressed` buttons, not a row of swatches: the
 * name is real text in every pill, the group says what the pills are for,
 * and the result note is a polite live region so the change is announced to
 * somebody who cannot see the page repaint. The swatch is `aria-hidden` —
 * it is a picture of the name that follows it.
 *
 * ── HYDRATION ───────────────────────────────────────────────────────────
 *
 * The saved theme is in `localStorage`, which the server cannot read, so
 * the first render is always the default theme on both sides — matching
 * markup — and the saved one lands in the hook's mount effect. Same
 * compromise the bar documents: a colour changing on an already-legible
 * page, rather than a guess that throws the subtree away.
 */

import * as React from 'react'
import Link from 'next/link'
import { Check, SlidersHorizontal } from 'lucide-react'

import { useThemeStudio } from '@/hooks/use-theme-studio'
import {
  accentSwatch,
  baseSwatch,
  THEME_PRESETS,
  tokenGeneratorState,
  type ThemePreset,
} from '@/lib/theme-studio'
import { encodeSharedState } from '@/lib/shared-tool-state'
import { track } from '@/lib/analytics'
import { cn } from '@/lib/utils'

/**
 * The four, by id, in the order they are shown.
 *
 * Resolved out of `THEME_PRESETS` rather than redeclared, so a preset
 * retuned at /themes is retuned here too and the two surfaces cannot drift
 * into showing different things under the same name.
 */
const HERO_PRESET_IDS = ['default', 'terminal', 'editorial', 'storefront'] as const

const HERO_PRESETS: ThemePreset[] = HERO_PRESET_IDS.map((id) => {
  const preset = THEME_PRESETS.find((p) => p.id === id)
  /*
    A hard failure at module load, not a filtered-out pill.

    Renaming a preset in `theme-studio.ts` is a two-line change that would
    otherwise silently leave the hero with three pills — the kind of gap
    nobody notices until someone screenshots the landing page. `!` is not
    enough on its own here; the array is built once, so the check costs
    nothing and it fires in the build rather than in production.
  */
  if (!preset) throw new Error(`hero-theme-pills: no theme preset "${id}"`)
  return preset
})

export function HeroThemePills({ className }: { className?: string }) {
  const uid = React.useId()
  const { theme, ready, isCustom, preset, set, reset } = useThemeStudio()

  /*
    The "Edit theme" href, built from whatever is applied right now.

    It carries the current theme into `/tools/tokens` through the same
    `#s=` link the tool's own Copy-link button produces, so the generator
    opens with its four sliders already at this theme rather than at its
    own defaults — which is the difference between "here is a tool" and
    "here is the thing you just picked, opened for editing".

    `encodeSharedState` returns null only for a state JSON cannot express,
    which four numbers never are; the fallback is the bare tool, which is
    still a working link.
  */
  const editHref =
    `/tools/tokens${encodeSharedState(tokenGeneratorState(theme)) ?? ''}`

  function apply(option: ThemePreset) {
    /*
      The default preset clears the override instead of writing it.

      `set` marks the theme as customised even when the value equals the
      default, which would leave the catalog bar offering a Reset for a
      theme nobody had changed. `reset` is what "back to Hoverlab" means,
      and `matchingPreset` still reports the default afterwards — so this
      pill reads as pressed either way.
    */
    if (option.id === 'default') reset()
    else
      set({
        accent: option.accent,
        base: option.base,
        fontId: option.fontId,
        radiusRem: option.radiusRem,
      })
    track('hero_theme_applied', { preset: option.id })
  }

  /*
    Which pill is lit.

    `preset` is the match across all eight, so a theme picked at /themes
    that is not one of these four correctly lights none of them — and the
    note below says which theme is actually on, rather than leaving the row
    looking untouched.
  */
  const activeId = preset?.id ?? null
  const offList = ready && isCustom && !HERO_PRESET_IDS.some((id) => id === activeId)

  return (
    <div className={cn('mx-auto max-w-2xl', className)}>
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
        <span
          id={`${uid}-label`}
          className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
        >
          See it in
        </span>

        <div
          role="group"
          aria-labelledby={`${uid}-label`}
          className="flex flex-wrap items-center justify-center gap-1.5"
        >
          {HERO_PRESETS.map((option) => {
            const on = activeId === option.id
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => apply(option)}
                aria-pressed={on}
                title={option.note}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  on
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border/60 bg-card/60 text-muted-foreground hover:border-primary/40 hover:bg-card hover:text-foreground',
                )}
              >
                {/*
                  Two colours, not one: the accent and the surface. The
                  accent alone cannot tell Terminal from Console, and the
                  neutrals are the axis this catalog is unusual for moving.
                */}
                <span
                  aria-hidden
                  className="relative flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/60"
                  style={{ background: baseSwatch(option.base) }}
                >
                  <span
                    className="absolute inset-y-0 end-0 w-1/2"
                    style={{ background: accentSwatch(option.accent) }}
                  />
                  {on ? (
                    <Check className="relative h-3 w-3 text-white drop-shadow" />
                  ) : null}
                </span>
                {option.name}
              </button>
            )
          })}
        </div>

        {/*
          The exit, and the reason the pills are not a toy.

          A link rather than a button so it opens in a new tab, is
          middle-clickable and reads as navigation — the href already
          carries the theme, so nothing has to happen on click for it to
          arrive correctly.
        */}
        <Link
          href={editHref}
          onClick={() => track('hero_theme_applied', { preset: 'edit' })}
          className="inline-flex items-center gap-1.5 rounded-full px-2 py-1.5 text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <SlidersHorizontal aria-hidden className="h-3.5 w-3.5" />
          Edit theme
        </Link>
      </div>

      <p aria-live="polite" className="mt-2 text-xs text-muted-foreground">
        {offList
          ? `Showing ${preset?.name ?? 'your own theme'}. Every block, page and template on the site is rendered in it.`
          : 'Repaints this page and every block, page and template on the site — live, in your browser, nothing sent anywhere.'}
      </p>
    </div>
  )
}
