import Link from 'next/link'
import { Check, Gauge, Info, Minus, TriangleAlert } from 'lucide-react'

import { getEffectMotion } from '@/lib/effect-motion-data'
import { FLASH_LIMIT_HZ, classifyProperty } from '@/lib/effect-motion'
import { cn } from '@/lib/utils'

/**
 * The motion-safety profile for one effect, stated on its page.
 *
 * Four rows, one per question a person has before pasting an animation into a
 * product: does it stop for reduced-motion visitors, what does it cost the
 * browser, could it flash, could it move other content. Each row is a word
 * (not only a colour) plus one sentence saying why.
 *
 * HONESTY IS THE FEATURE. Three of the four rows are estimates read out of
 * the CSS text, and the panel says so in its header and footer. The fourth
 * (layout shift) is a category unless this effect is one of the sample that
 * was actually run in a browser, in which case the measured figure is shown
 * beside it and labelled as measured. No number appears anywhere that was not
 * either computed from the source (flash rate) or read from Chromium (CLS).
 *
 * A server component with no state: the profile is looked up by id from the
 * generated file, so the badge is in the statically generated HTML and costs
 * no client JavaScript. See lib/effect-motion.ts for the analysis and
 * scripts/check-effect-motion.mts for the gate that keeps the file current.
 *
 * RTL: logical utilities only (`ms-`, `text-start`), and no directional icons.
 */

type Tone = 'good' | 'note' | 'warn' | 'bad' | 'na'

/*
 * Text colours are the -800 / -300 steps, not the -500 the Insights panel
 * uses: 500-on-a-10%-tint is about 2.5:1 in light mode, and this is body-size
 * text that has to be read.
 */
const TONE: Record<Tone, string> = {
  good: 'border-emerald-700/30 bg-emerald-500/10 text-emerald-800 dark:border-emerald-400/30 dark:text-emerald-300',
  note: 'border-border bg-muted/50 text-foreground',
  warn: 'border-amber-700/30 bg-amber-500/10 text-amber-900 dark:border-amber-400/30 dark:text-amber-300',
  bad: 'border-rose-700/30 bg-rose-500/10 text-rose-800 dark:border-rose-400/30 dark:text-rose-300',
  na: 'border-border bg-transparent text-muted-foreground',
}

const TONE_ICON = {
  good: Check,
  note: Info,
  warn: TriangleAlert,
  bad: TriangleAlert,
  na: Minus,
} as const

function Verdict({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  const Icon = TONE_ICON[tone]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        TONE[tone],
      )}
    >
      <Icon aria-hidden className="h-3.5 w-3.5 shrink-0" />
      {children}
    </span>
  )
}

function Row({
  label,
  tone,
  verdict,
  children,
}: {
  label: string
  tone: Tone
  verdict: string
  children: React.ReactNode
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="m-0 mt-1.5 space-y-1.5">
        <Verdict tone={tone}>{verdict}</Verdict>
        <p className="text-sm leading-snug text-muted-foreground">{children}</p>
      </dd>
    </div>
  )
}

/** `width, height and 2 more`, with the properties set in code style. */
function PropList({ props }: { props: string[] }) {
  const shown = props.slice(0, 4)
  return (
    <>
      {shown.map((p, i) => (
        <span key={p}>
          {i > 0 ? ', ' : null}
          <code className="font-mono text-xs text-foreground">{p}</code>
        </span>
      ))}
      {props.length > shown.length ? ` and ${props.length - shown.length} more` : null}
    </>
  )
}

export function EffectMotionBadge({ id }: { id: string }) {
  const motion = getEffectMotion(id)
  if (!motion) return null

  if (!motion.applicable) {
    return (
      <section
        id="motion-safety"
        aria-labelledby="motion-safety-title"
        className="mt-8 rounded-xl border border-border/60 bg-card/50 p-5"
      >
        <h2 id="motion-safety-title" className="flex items-center gap-1.5 text-sm font-semibold">
          <Gauge aria-hidden className="h-4 w-4 text-primary" />
          Motion safety
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Not profiled. {motion.reason}
        </p>
      </section>
    )
  }

  const layout = motion.offending.filter((p) => classifyProperty(p) === 'layout')
  const paint = motion.offending.filter((p) => classifyProperty(p) !== 'layout')

  return (
    <section
      id="motion-safety"
      aria-labelledby="motion-safety-title"
      className="mt-8 rounded-xl border border-border/60 bg-card/50 p-5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="motion-safety-title" className="flex items-center gap-1.5 text-sm font-semibold">
          <Gauge aria-hidden className="h-4 w-4 text-primary" />
          Motion safety
        </h2>
        <p className="text-xs text-muted-foreground">Static estimate, read from the CSS</p>
      </div>

      <dl className="mt-4 grid gap-x-8 gap-y-5 sm:grid-cols-2">
        {/* ---- 1. Reduced motion ------------------------------------ */}
        {motion.reducedMotion === 'guarded' ? (
          <Row label="Reduced motion" tone="good" verdict="Guarded">
            Ships a <code className="font-mono text-xs text-foreground">prefers-reduced-motion</code> block, so
            the loop settles into its end state for visitors who ask for less motion.
          </Row>
        ) : motion.reducedMotion === 'brief' ? (
          <Row label="Reduced motion" tone="note" verdict="Brief motion, no guard">
            Animates briefly or on interaction. Only looping motion gets a guard in this catalog; copy the
            one from the Insights tab if this ships on a critical path.
          </Row>
        ) : motion.reducedMotion === 'unguarded' ? (
          <Row label="Reduced motion" tone="bad" verdict="Loops with no guard">
            Runs forever and ships no <code className="font-mono text-xs text-foreground">prefers-reduced-motion</code>{' '}
            block. Add one before using it.
          </Row>
        ) : (
          <Row label="Reduced motion" tone="na" verdict="Nothing animates">
            No animation or transition, so there is nothing to switch off.
          </Row>
        )}

        {/* ---- 2. Property class ------------------------------------ */}
        {motion.propertyClass === 'compositor' ? (
          <Row label="What it animates" tone="good" verdict="Compositor only">
            Only <code className="font-mono text-xs text-foreground">transform</code>,{' '}
            <code className="font-mono text-xs text-foreground">opacity</code> or{' '}
            <code className="font-mono text-xs text-foreground">filter</code>: the GPU can run it without
            re-laying-out or repainting the page.
          </Row>
        ) : motion.propertyClass === 'paint' ? (
          <Row label="What it animates" tone="warn" verdict="Repaints">
            Animates <PropList props={paint} />. No reflow, but the browser repaints every frame, which is
            fine for one element and costly across many.
          </Row>
        ) : motion.propertyClass === 'layout' ? (
          <Row label="What it animates" tone="bad" verdict="Reflows">
            Animates <PropList props={layout} />
            {paint.length ? (
              <>
                {' '}
                (and <PropList props={paint} />)
              </>
            ) : null}
            . The browser re-lays-out the page on every frame; prefer{' '}
            <code className="font-mono text-xs text-foreground">transform</code> if you can.
          </Row>
        ) : (
          <Row label="What it animates" tone="na" verdict="Nothing">
            No property is animated.
          </Row>
        )}

        {/* ---- 3. Flash rate ---------------------------------------- */}
        {motion.flash.verdict === 'fail' ? (
          <Row label="Flashing (WCAG 2.3.1)" tone="bad" verdict={`Over ${FLASH_LIMIT_HZ} flashes/s`}>
            Estimated up to about {motion.flash.hz} flashes a second across a large, high-contrast area. That
            is above the general-flash threshold of {FLASH_LIMIT_HZ}; do not ship it without changing the
            timing.
          </Row>
        ) : motion.flash.verdict === 'caution' ? (
          <Row label="Flashing (WCAG 2.3.1)" tone="warn" verdict="Caution">
            Estimated up to about {motion.flash.hz} flashes a second, close to or over the limit of{' '}
            {FLASH_LIMIT_HZ} on a small or subtle area. Check it against your own background.
          </Row>
        ) : motion.flash.hz !== null ? (
          <Row label="Flashing (WCAG 2.3.1)" tone="good" verdict={`Under ${FLASH_LIMIT_HZ} flashes/s`}>
            Its brightest loop is about {motion.flash.hz} a second. Estimated from duration, iterations and
            keyframes, not from rendered frames.
          </Row>
        ) : (
          <Row label="Flashing (WCAG 2.3.1)" tone="good" verdict="No flashing found">
            No repeating change in opacity, colour or brightness large enough to count as a flash.
          </Row>
        )}

        {/* ---- 4. Layout shift -------------------------------------- */}
        {motion.layoutShift === 'shifts' ? (
          <Row label="Layout shift (CLS)" tone="warn" verdict="May shift layout">
            Animates <PropList props={layout} /> on a box in flow, so content beside or after it can move.
            {motion.measured && motion.measured.entries > 0 ? (
              <>
                {' '}
                <strong className="font-semibold text-foreground">Measured</strong> in Chromium: layout-shift
                score {motion.measured.cls.toFixed(4)} across {motion.measured.entries} shift
                {motion.measured.entries === 1 ? '' : 's'} in {motion.measured.windowSeconds} s, one preview
                with a neighbour beside it. Not a page-level CLS.
              </>
            ) : motion.measured ? (
              <>
                {' '}
                <strong className="font-semibold text-foreground">Measured</strong> in Chromium: no layout
                shifts in {motion.measured.windowSeconds} s. Its detector skips movement under about 3 px a
                frame, so slow layout motion still moves content but is not counted.
              </>
            ) : (
              <> A category from the CSS, not a measurement for this effect.</>
            )}
          </Row>
        ) : (
          <Row label="Layout shift (CLS)" tone="good" verdict="No shift expected">
            Nothing it animates moves or resizes the box in flow.
            {motion.measured ? (
              <>
                {' '}
                <strong className="font-semibold text-foreground">Measured</strong> in Chromium:{' '}
                {motion.measured.entries === 0
                  ? `no layout shifts in ${motion.measured.windowSeconds} s`
                  : `layout-shift score ${motion.measured.cls.toFixed(4)} in ${motion.measured.windowSeconds} s`}
                .
              </>
            ) : (
              <> A category from the CSS, not a measurement for this effect.</>
            )}
          </Row>
        )}
      </dl>

      <p className="mt-5 border-t border-border/60 pt-3 text-xs leading-relaxed text-muted-foreground">
        Every row is read from the shipped CSS. Only a figure marked <em>measured</em> came from a browser.
        Customizing the speed changes the timing, so recheck a customized copy.{' '}
        <Link href="/docs/api#motion-safety" className="underline underline-offset-2 hover:text-foreground">
          How it is computed
        </Link>
      </p>
    </section>
  )
}
