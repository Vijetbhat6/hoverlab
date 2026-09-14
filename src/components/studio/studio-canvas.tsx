'use client'

/**
 * The canvas — one screen of real UI, wearing the system being edited.
 *
 * ── WHY A SCREEN AND NOT A ROW OF SWATCHES ──────────────────────────────
 *
 * Swatches answer "what colour is this" and nobody is asking that. The
 * question in an editor like this is "does my interface look right in it",
 * and only an interface can answer it. So the canvas is a small but real
 * screen: a heading in the chosen face, a card, a primary and a secondary
 * button, a muted caption, an input with a focus ring, a destructive
 * action, a badge, a table row and a disabled state — chosen because those
 * are the surfaces where a theme actually fails. A palette that looks
 * excellent as five rectangles routinely produces an unreadable muted
 * caption or a focus ring nobody can see, and neither is visible until
 * something is drawn.
 *
 * ── BOTH THEMES, SIDE BY SIDE, ALWAYS ───────────────────────────────────
 *
 * Not a toggle. A toggle means half the work is done blind, and the failure
 * this catches is specifically the one that only appears in the theme you
 * are not looking at — an accent that reads on white and vanishes on the
 * dark ground. Rule 4 in `GENERATED_UI_RULES` is "check both themes before
 * calling anything finished"; a canvas with a toggle would be shipping
 * advice the editor itself does not follow.
 *
 * They stack on narrow screens, where side-by-side would make each half
 * too small to read. That loses the comparison at phone width, which is
 * the honest trade — an unreadable comparison is not one.
 *
 * ── WHY THE TOKENS ARE SET INLINE ───────────────────────────────────────
 *
 * See `tokenVars`. The short version: the site's own theming writes nine
 * inputs on `<html>` and lets `globals.css` derive from them, which cannot
 * be scoped to a container — so a preview that must not repaint the editor
 * around it sets the finished tokens, which inherit and stop where the
 * container does.
 *
 * Every colour in here is therefore a `var(--token)` and not a Tailwind
 * `bg-*` class. Tailwind's utilities resolve to the `@theme` aliases from
 * the real stylesheet, which are wired to the *document's* tokens — so
 * `bg-card` inside this container would paint the editor's card colour,
 * not the canvas's. That is the one trap in this file, and it is silent:
 * the class works, it just previews the wrong system.
 */

import * as React from 'react'
import { AlertTriangle, Check, Search } from 'lucide-react'

import { fontById } from '@/lib/theme-studio'
import { oklchStringToHex, tokenVars } from '@/lib/tools/token-css'
import { contrastRatio, oklchToRgb, rgbToHex, wcagLevel } from '@/lib/color-tools'
import {
  studioTokenOverrides,
  studioTokenState,
  type StudioState,
} from '@/lib/studio/state'
import { cn } from '@/lib/utils'

/**
 * One measured pair: a ratio, the level, and whether that level passes.
 *
 * ── WHY `passes` IS NOT `level !== 'Fail'` ─────────────────────────
 *
 * `wcagLevel(ratio, false)` returns `'AA Large'` for anything between 3 and
 * 4.5 — informational, and correct as a statement about *large* text. Both
 * pairs measured here are normal-size body copy, where 3.2:1 is a failure,
 * so rendering that label unstyled put a reassuring "AA Large" on a caption
 * nobody can read. 4.5 is the floor; the label still says what the ratio
 * would be worth at a larger size, and `passes` decides the colour.
 */
interface Measured {
  ratio: number
  level: string
  passes: boolean
}

function measure(fg: string | undefined, bg: string | undefined): Measured | null {
  /*
    Returns null rather than a guess when either token is not a plain
    `oklch()` — `--border` in dark is a translucent white, and a ratio
    computed against an unresolved alpha would be a number that looks
    authoritative and is not. The 7-character check is what rejects the
    8-digit (alpha) hex `oklchStringToHex` returns for those.
  */
  const fgHex = oklchStringToHex(fg ?? '')
  const bgHex = oklchStringToHex(bg ?? '')
  if (!fgHex || !bgHex || fgHex.length !== 7 || bgHex.length !== 7) return null
  const ratio = contrastRatio(fgHex, bgHex)
  if (ratio === null) return null
  return { ratio, level: wcagLevel(ratio, false), passes: ratio >= 4.5 }
}

/**
 * The two pairs worth measuring live, and why only these two.
 *
 * ── MUTED ON THE BACKGROUND ────────────────────────────────────
 *
 * The pair that breaks first and the one nobody checks. `--primary` gets
 * attention because it is the brand; `--muted-foreground` carries most of
 * the words on a page and its lightness is a derived value two steps from
 * anything the user touched. This site's own contrast checker once caught
 * this exact token failing on this site.
 *
 * ── PRIMARY-FOREGROUND ON PRIMARY ───────────────────────────────
 *
 * The pair the accent-lightness sliders endanger, and the reason they are
 * measured rather than clamped. `--primary-foreground` is near-white in
 * light and near-black in dark in both CSS spellings — `globals.css` does
 * the same — so dragging the lightness far enough makes the button label
 * vanish into the button. Deriving a contrast-aware foreground instead
 * would mean this editor quietly emitting a token the scaffolded
 * stylesheet does not, so the honest move is to show the number and let
 * the person decide.
 */
function measurePairs(vars: Record<string, string>): Array<[string, Measured]> {
  const pairs: Array<[string, Measured | null]> = [
    ['muted', measure(vars['--muted-foreground'], vars['--background'])],
    ['button', measure(vars['--primary-foreground'], vars['--primary'])],
  ]
  return pairs.filter((pair): pair is [string, Measured] => pair[1] !== null)
}

interface PaneProps {
  state: StudioState
  dark: boolean
}

function Pane({ state, dark }: PaneProps) {
  const vars = tokenVars(
    studioTokenState(state),
    dark,
    studioTokenOverrides(state.theme, dark),
  )
  const font = fontById(state.theme.fontId)
  const radius = `${state.theme.radiusRem}rem`

  /*
    A style object carrying custom properties. React passes any key starting
    `--` straight through, but its types do not know that, so the cast is
    required and is the whole reason this is built as an object rather than
    spread inline — one cast here instead of one per element.
  */
  const style = {
    ...vars,
    fontFamily: font.stack,
    background: 'var(--background)',
    color: 'var(--foreground)',
  } as React.CSSProperties

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60">
      <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-muted/40 px-3 py-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {dark ? 'Dark' : 'Light'}
        </span>
        {/*
          The measurements sit in the editor's chrome, not inside the
          canvas, on purpose: they are facts *about* the preview, and a
          contrast warning painted in the failing colours it is warning
          about is a joke rather than a warning.
        */}
        <span className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
          {measurePairs(vars).map(([name, m]) => (
            <span
              key={name}
              className={cn(
                'font-mono text-[11px]',
                m.passes ? 'text-muted-foreground' : 'font-bold text-destructive',
              )}
              title={
                name === 'muted'
                  ? 'Muted body copy on the page background — the pair that fails first'
                  : 'The label on a primary button — the pair the accent lightness endangers'
              }
            >
              {name} {m.ratio.toFixed(2)}:1 {m.passes ? m.level : 'fails AA'}
            </span>
          ))}
        </span>
      </div>

      <div style={style} className="space-y-4 p-5">
        <div>
          <h3 className="text-lg font-semibold tracking-tight" style={{ textWrap: 'balance' }}>
            Deployments
          </h3>
          <p className="mt-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
            Four services, two regions. Last run 6 minutes ago.
          </p>
        </div>

        {/* A card, because a card is where the surface/border pair shows. */}
        <div
          className="p-4"
          style={{
            background: 'var(--card)',
            color: 'var(--card-foreground)',
            border: '1px solid var(--border)',
            borderRadius: radius,
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold">api-gateway</div>
              <div className="mt-0.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                v2.14.0 · eu-west-1
              </div>
            </div>
            <span
              className="inline-flex shrink-0 items-center gap-1 px-2 py-0.5 text-[11px] font-semibold"
              style={{
                background: 'var(--accent)',
                color: 'var(--accent-foreground)',
                borderRadius: `calc(${radius} - 2px)`,
              }}
            >
              <Check aria-hidden className="h-3 w-3" />
              Healthy
            </span>
          </div>

          {/* An input with a real focus ring. The ring is a token most
              editors never show, and it is the one that decides whether a
              keyboard user can use the product at all. */}
          <div className="mt-4">
            <div
              className="flex items-center gap-2 px-2.5 py-1.5 text-xs"
              style={{
                background: 'var(--background)',
                border: '1px solid var(--input)',
                borderRadius: `calc(${radius} - 2px)`,
                boxShadow: '0 0 0 2px var(--ring)',
              }}
            >
              <Search aria-hidden className="h-3.5 w-3.5" style={{ color: 'var(--muted-foreground)' }} />
              <span style={{ color: 'var(--muted-foreground)' }}>Filter services</span>
            </div>
            <p className="mt-1 text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
              Focus ring, drawn at its real width.
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span
              className="px-3 py-1.5 text-xs font-semibold"
              style={{
                background: 'var(--primary)',
                color: 'var(--primary-foreground)',
                borderRadius: `calc(${radius} - 2px)`,
              }}
            >
              Deploy
            </span>
            <span
              className="px-3 py-1.5 text-xs font-semibold"
              style={{
                background: 'var(--secondary)',
                color: 'var(--secondary-foreground)',
                borderRadius: `calc(${radius} - 2px)`,
              }}
            >
              History
            </span>
            {/* Disabled, because a theme where the disabled and enabled
                states are indistinguishable is a theme that ships a
                button nobody knows they cannot press. */}
            <span
              className="px-3 py-1.5 text-xs font-semibold opacity-50"
              style={{
                background: 'var(--secondary)',
                color: 'var(--secondary-foreground)',
                borderRadius: `calc(${radius} - 2px)`,
              }}
            >
              Roll back
            </span>
          </div>
        </div>

        {/* Destructive next to the accent, which is the pairing the rules
            call out: one is for destructive actions and nothing else, and
            they have to be tellable apart at a glance. */}
        <div
          className="flex items-center gap-2 px-3 py-2 text-xs"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: radius,
          }}
        >
          <AlertTriangle aria-hidden className="h-3.5 w-3.5" style={{ color: 'var(--destructive)' }} />
          <span style={{ color: 'var(--destructive)' }} className="font-semibold">
            worker-queue failed
          </span>
          <span className="ms-auto" style={{ color: 'var(--muted-foreground)' }}>
            2m ago
          </span>
        </div>

        {/* The muted/border pair over three rows, where a border that has
            collapsed into the background becomes obvious and one row
            never would. */}
        <div
          className="overflow-hidden text-xs"
          style={{ border: '1px solid var(--border)', borderRadius: radius }}
        >
          {['eu-west-1', 'us-east-1', 'ap-south-1'].map((region, i) => (
            <div
              key={region}
              className="flex items-center justify-between px-3 py-2"
              style={{
                background: i % 2 ? 'var(--muted)' : 'var(--card)',
                borderTop: i ? '1px solid var(--border)' : undefined,
              }}
            >
              <span>{region}</span>
              <span style={{ color: 'var(--muted-foreground)' }}>{4 - i} services</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * The four numbers the canvas is currently drawn from, in one line.
 *
 * Under the canvas rather than on the Style tab because this is where they
 * are worth reading: the hex is the answer to "what green is that on the
 * button", and hue/chroma/radius are what someone pastes into a ticket or
 * hands to a colleague. The tab has the controls; this is the readout.
 */
function AccentStrip({ state }: { state: StudioState }) {
  const { accent } = state.theme
  const hex = rgbToHex(oklchToRgb({ l: accent.lightL, c: accent.chroma, h: accent.hue }))
  return (
    <p className="text-center font-mono text-[11px] text-muted-foreground">
      accent {hex.toUpperCase()} · hue {Math.round(accent.hue)} · chroma{' '}
      {accent.chroma.toFixed(3)} · radius {state.theme.radiusRem}rem
    </p>
  )
}

export function StudioCanvas({ state, className }: { state: StudioState; className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="grid gap-4 md:grid-cols-2">
        <Pane state={state} dark={false} />
        <Pane state={state} dark />
      </div>
      <AccentStrip state={state} />
    </div>
  )
}
