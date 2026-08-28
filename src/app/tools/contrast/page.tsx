'use client'

/**
 * Contrast Checker tool.
 *
 * WCAG 2.1 contrast ratio calculator with live preview at three text
 * sizes (small / normal / large), pass/fail verdicts for AA / AAA at
 * each size, and suggested darker / lighter variants when failing.
 *
 * The colour-vision section at the bottom is here, rather than on a page
 * of its own, because it corrects the number at the top of this one.
 *
 * A contrast ratio is computed from relative luminance, and luminance is
 * not a property of the colour — it is a property of the colour *and the
 * eye reading it*. Without a working red cone a red loses most of what
 * made it bright, so a pair measured once at 7:1 is a different pair for
 * one man in twelve. Sampling 138,000 pairs that clear AA as authored,
 * 46% of them fall below 4.5:1 under at least one simulation. That is not
 * an edge case; it is nearly half, and this page reported none of it.
 *
 * What this section deliberately does NOT claim: that the two colours
 * might become the same colour. They do not — across that same sample the
 * closest any AA-passing pair came after simulation was ΔE 0.22, twice
 * the distance at which two colours stop being separable. Convergence is
 * a real failure and it is a failure of *palettes*, where two foregrounds
 * share a background; it cannot happen to a pair that already holds a
 * luminance difference. That question belongs to /tools/colorblind, which
 * is what the footnote links to.
 */

import * as React from 'react'
import Link from 'next/link'
import { Accessibility, Eye, Shuffle, ArrowRightLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CopyCssCard } from '@/components/designer-tools/copy-css-card'
import { ToolLayout } from '@/components/designer-tools/tool-layout'
import { ToolPresetsBar } from '@/components/designer-tools/tool-presets-bar'
import { UseInCatalog } from '@/components/designer-tools/use-in-catalog'
import { useToolState } from '@/hooks/use-tool-state'
import {
  brandFromHex,
  contrastRatio,
  wcagLevel,
  normalizeHex,
  randomHex,
  hexToHsl,
  hslToHex,
} from '@/lib/color-tools'
import { VISIONS, simulateHex, type Vision } from '@/lib/color-blindness'
import { cn } from '@/lib/utils'

const TOOL = '/tools/contrast'

/**
 * A pair, which is what this tool is actually about.
 *
 * Stored as `{ fg, bg }` before this hook existed too, so a returning
 * visitor's colours survive the change unaltered.
 */
interface ContrastState {
  fg: string
  bg: string
}

const DEFAULT_STATE: ContrastState = { fg: '#0f172a', bg: '#f8fafc' }

export default function ContrastToolPage() {
  // Working state stays local and ungated; named presets need an account.
  // See `use-tool-state.ts` for why the two layers are separate.
  const tool = useToolState<ContrastState>(TOOL, DEFAULT_STATE)
  const { setState } = tool
  /*
    Normalized at the point of use, not on the way in.

    These two strings feed inline `color` and `backgroundColor`, and used to
    be normalized on the one path that could carry a stale value — the
    localStorage restore. They now arrive from three: stored state, the
    palette tool's `?fg=`/`?bg=` handoff, and a preset restored off the
    account. Normalizing here covers all three, and a value that is not a
    colour falls back to the default rather than painting the preview with
    whatever was in storage — which on a contrast checker would mean
    reporting a ratio for a colour nobody can see.
  */
  const fg = normalizeHex(tool.state.fg) ?? DEFAULT_STATE.fg
  const bg = normalizeHex(tool.state.bg) ?? DEFAULT_STATE.bg
  const setFg = (v: string) => setState((s) => ({ ...s, fg: v }))
  const setBg = (v: string) => setState((s) => ({ ...s, bg: v }))

  React.useEffect(() => {
    // Handoff from the palette tool: ?fg=#hex / ?bg=#hex win over the
    // restored state. window.location rather than useSearchParams — the hook
    // would force a Suspense boundary around the whole page for one optional
    // param. Stripped after applying so a reload keeps later edits.
    const params = new URLSearchParams(window.location.search)
    const qFg = params.get('fg')
    const qBg = params.get('bg')
    const nFg = qFg ? normalizeHex(qFg) : null
    const nBg = qBg ? normalizeHex(qBg) : null
    if (nFg || nBg) {
      setState((s) => ({ fg: nFg ?? s.fg, bg: nBg ?? s.bg }))
    }
    if (qFg !== null || qBg !== null) {
      window.history.replaceState(null, '', window.location.pathname)
    }
    // `setState` is stable; the handoff is read once, on mount. Declared
    // after `useToolState`, so the hook's restore has already run and the
    // link wins, which is the precedence this comment claims.
  }, [])

  const ratio = React.useMemo(() => contrastRatio(fg, bg), [fg, bg])
  const ratioDisplay = ratio ? ratio.toFixed(2) : '—'

  const verdicts = React.useMemo(() => {
    if (!ratio) return null
    return {
      small: wcagLevel(ratio, false),
      large: wcagLevel(ratio, true),
    }
  }, [ratio])

  // Suggested fixes: lighten/darken the foreground to reach AA (4.5).
  const suggestions = React.useMemo(() => {
    if (!ratio || ratio >= 4.5) return null
    const fgHsl = hexToHsl(fg)
    const bgHsl = hexToHsl(bg)
    if (!fgHsl || !bgHsl) return null
    const bgIsLight = bgHsl.l > 50
    const candidates: { hex: string; ratio: number; direction: string }[] = []
    for (let delta = 1; delta <= 60; delta++) {
      const newL = bgIsLight ? Math.max(0, fgHsl.l - delta) : Math.min(100, fgHsl.l + delta)
      const candidate = hslToHex({ ...fgHsl, l: newL })
      const r = contrastRatio(candidate, bg)
      if (r && r >= 4.5) {
        candidates.push({ hex: candidate, ratio: r, direction: bgIsLight ? 'darker' : 'lighter' })
        break
      }
    }
    return candidates[0] ?? null
  }, [fg, bg, ratio])

  /*
    The same pair, re-measured through four more eyes.

    `normal` is dropped — it is the pair already shown at the top of the
    page, and repeating it as a fifth card would bury the four that carry
    new information.

    Full severity, deliberately, with no slider: dichromacy is the
    conservative case, and a pair that survives it survives every anomalous
    trichromacy below it. Severity is a palette question rather than a pair
    question, and it belongs on the simulator this links out to.
  */
  const visionChecks = React.useMemo(
    () =>
      VISIONS.filter((v) => v.id !== 'normal').map((v) => {
        const simFg = simulateHex(fg, v.matrix)
        const simBg = simulateHex(bg, v.matrix)
        const simRatio = contrastRatio(simFg, simBg)
        return {
          vision: v,
          fg: simFg,
          bg: simBg,
          ratio: simRatio,
          level: simRatio ? wcagLevel(simRatio, false) : null,
        }
      }),
    [fg, bg],
  )

  /*
    One sentence, rather than four cards to read and compare.

    Only the crossings are worth a headline: a pair that already failed has
    nothing new to learn here, and a ratio that moves without crossing 4.5
    is a number, not a finding.
  */
  const visionVerdict = React.useMemo(() => {
    if (!ratio) return null
    const dropped = visionChecks.filter(
      (c) => c.ratio !== null && c.ratio < 4.5 && ratio >= 4.5,
    )
    return { dropped, clear: dropped.length === 0, passedAuthored: ratio >= 4.5 }
  }, [visionChecks, ratio])

  const swap = () => {
    setFg(bg)
    setBg(fg)
  }

  return (
    <ToolLayout
      name="Contrast Checker"
      tagline="WCAG 2.1 AA / AAA in real time"
      icon={<Accessibility className="h-5 w-5" />}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[420px_1fr]">
        {/* Inputs */}
        <div className="space-y-5">
          <ColorRow
            label="Foreground (text)"
            value={fg}
            onChange={setFg}
          />
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={swap}
              className="gap-1.5"
            >
              <ArrowRightLeft className="h-3.5 w-3.5" /> Swap fg / bg
            </Button>
          </div>
          <ColorRow
            label="Background"
            value={bg}
            onChange={setBg}
          />

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5"
              onClick={() => {
                setFg(randomHex())
                setBg(randomHex())
              }}
            >
              <Shuffle className="h-3.5 w-3.5" /> Random pair
            </Button>
          </div>

          {/* Ratio card */}
          <div className="rounded-lg border border-border bg-card p-5 text-center">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Contrast ratio
            </div>
            <div className="my-1 text-5xl font-extrabold tabular-nums">
              {ratioDisplay}
              <span className="ml-1 text-2xl text-muted-foreground">:1</span>
            </div>
            <div className="text-xs text-muted-foreground">
              WCAG 2.1 (range 1:1 – 21:1)
            </div>
          </div>

          {/* Verdicts */}
          {verdicts && (
            <div className="grid grid-cols-2 gap-3">
              <VerdictCard label="Normal text" level={verdicts.small} />
              <VerdictCard label="Large text" level={verdicts.large} />
            </div>
          )}

          {/* Suggestion */}
          {suggestions && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4">
              <div className="mb-1 text-xs font-medium text-amber-700 dark:text-amber-500">
                Suggested fix to reach AA (4.5:1)
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="h-8 w-8 rounded border border-border"
                  style={{ backgroundColor: suggestions.hex }}
                />
                <code className="font-mono text-sm">{suggestions.hex}</code>
                <span className="ml-auto text-xs text-muted-foreground">
                  ratio {suggestions.ratio.toFixed(2)}:1
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setFg(suggestions.hex)}
                >
                  Use
                </Button>
              </div>
            </div>
          )}

          <CopyCssCard
            code={`.text {\n  color: ${fg};\n  background-color: ${bg};\n}`}
            title="CSS"
            language="css"
          />

          {/* After the pair, never before it — the ask lands once there is a
              combination worth keeping. A checked pair is the clearest case
              on the site for naming one: it is evidence, and evidence is
              worth having next week. */}
          <ToolPresetsBar tool={tool} noun="pair" />
        </div>

        {/* Live preview */}
        <div className="space-y-4">
          <PreviewBlock fg={fg} bg={bg} size="small" label="Small (14px)" />
          <PreviewBlock fg={fg} bg={bg} size="normal" label="Normal (16px)" />
          <PreviewBlock fg={fg} bg={bg} size="large" label="Large (24px bold)" />

          {/* Component previews */}
          <div className="overflow-hidden rounded-lg border border-border">
            <div className="border-b border-border/60 bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground">
              Real components
            </div>
            <div className="space-y-4 p-6" style={{ backgroundColor: bg }}>
              <button
                type="button"
                className="rounded-md px-4 py-2 text-sm font-semibold transition-transform hover:scale-105"
                style={{
                  backgroundColor: fg,
                  color: bg,
                }}
              >
                Primary button
              </button>
              <div className="rounded-md border p-4" style={{ borderColor: fg }}>
                <div className="text-sm font-semibold" style={{ color: fg }}>
                  Card title
                </div>
                <p className="mt-1 text-sm" style={{ color: fg, opacity: 0.85 }}>
                  Card body text describing something important.
                </p>
              </div>
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="text-sm underline underline-offset-2"
                style={{ color: fg }}
              >
                A link with underline
              </a>
            </div>
          </div>

          {/* The foreground is the colour being tested, so it is the one
              worth previewing the catalog in. */}
          <UseInCatalog tool={TOOL} brand={brandFromHex(fg)} />
        </div>
      </div>

      <section className="mt-8 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-start gap-x-3 gap-y-1 border-b border-border/60 px-5 py-4">
          <Eye className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold">Under colour vision deficiency</h2>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              A contrast ratio is computed from luminance, and luminance is not a
              property of the colour alone — it is a property of the colour and the eye
              reading it. The same pair, re-measured with each cone missing, at full
              severity.
            </p>
          </div>
        </div>

        {/* The finding first. Four recoloured cards are a picture; the
            sentence about what crossed the line is the answer. */}
        {visionVerdict ? (
          <div
            className={cn(
              'border-b border-border/60 px-5 py-3.5 text-xs leading-relaxed',
              visionVerdict.clear
                ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                : 'bg-amber-500/10 text-amber-800 dark:text-amber-300',
            )}
          >
            {visionVerdict.clear ? (
              visionVerdict.passedAuthored ? (
                <>
                  <span className="font-semibold">This pair holds up.</span> It stays
                  above 4.5:1 under all four simulations, which is not automatic —
                  across a sample of 138,000 pairs that clear AA as authored, 46% fall
                  below it for at least one of these readers.
                </>
              ) : (
                <>
                  <span className="font-semibold">
                    This pair already fails AA as authored,
                  </span>{' '}
                  so there is nothing for a simulation to take away. Fix the ratio
                  above first; the cards below show what each reader would be left with.
                </>
              )
            ) : (
              <>
                <span className="font-semibold">
                  This pair falls below AA under{' '}
                  {visionVerdict.dropped.map((c) => c.vision.name).join(' and ')}.
                </span>{' '}
                It measures {ratioDisplay}:1 as authored and{' '}
                {visionVerdict.dropped
                  .map((c) => `${c.ratio?.toFixed(2)}:1`)
                  .join(' / ')}{' '}
                for those readers. Nothing about the colours changed — the eye reading
                them lost a cone, and with it most of what made one of them bright.
              </>
            )}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-px bg-border/60 sm:grid-cols-2 lg:grid-cols-4">
          {visionChecks.map((check) => (
            <VisionCard key={check.vision.id} {...check} authored={ratio} />
          ))}
        </div>

        <p className="border-t border-border/60 bg-muted/20 px-5 py-3 text-[11px] leading-relaxed text-muted-foreground">
          Machado, Oliveira &amp; Fernandes (2009), applied in linear-light sRGB — the
          same model the well-known simulators use. It is a good model and it is not an
          eye; treat a clear result as &ldquo;no obvious failure&rdquo; rather than as a
          conformance claim. The failure this cannot show you is two colours becoming
          one, which needs a third colour to happen and so belongs to a palette rather
          than a pair — that is the{' '}
          <Link
            href="/tools/colorblind"
            className="font-medium text-foreground underline underline-offset-2"
          >
            colour blindness simulator
          </Link>
          .
        </p>
      </section>
    </ToolLayout>
  )
}

/* ============================================================
 *  Color row
 * ========================================================== */

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <Label className="mb-2 block text-sm font-medium">{label}</Label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 cursor-pointer rounded border border-field bg-transparent"
          aria-label={label}
        />
        <Input
          value={value}
          onChange={(e) => {
            const n = normalizeHex(e.target.value)
            onChange(n ?? e.target.value)
          }}
          className="font-mono"
        />
      </div>
    </div>
  )
}

/* ============================================================
 *  Verdict card
 * ========================================================== */

function VerdictCard({ label, level }: { label: string; level: string }) {
  const isPass = level !== 'Fail'
  return (
    <div
      className={cn(
        'rounded-lg border p-3 text-center',
        isPass
          ? 'border-emerald-500/40 bg-emerald-500/5'
          : 'border-red-500/40 bg-red-500/5',
      )}
    >
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={cn(
          'mt-1 text-lg font-bold',
          isPass ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
        )}
      >
        {level}
      </div>
    </div>
  )
}

/* ============================================================
 *  Preview block
 * ========================================================== */

function PreviewBlock({
  fg,
  bg,
  size,
  label,
}: {
  fg: string
  bg: string
  size: 'small' | 'normal' | 'large'
  label: string
}) {
  const sizeClass =
    size === 'small'
      ? 'text-sm'
      : size === 'normal'
        ? 'text-base'
        : 'text-2xl font-bold'
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="flex items-center justify-between border-b border-border/60 bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
        <span>{label}</span>
        <span className="font-mono tabular-nums">{size === 'small' ? '14px' : size === 'normal' ? '16px' : '24px bold'}</span>
      </div>
      <div className="p-6" style={{ backgroundColor: bg }}>
        <p className={sizeClass} style={{ color: fg }}>
          The quick brown fox jumps over the lazy dog.
        </p>
      </div>
    </div>
  )
}

/* ============================================================
 *  Vision card
 * ========================================================== */

/**
 * One vision type, as the pair actually looks under it.
 *
 * The tile is painted with the simulated colours rather than filtered with
 * a CSS `filter`, so what is on screen is the same arithmetic the verdict
 * above was computed from — a preview and a finding that could disagree
 * would be worse than no preview.
 */
function VisionCard({
  vision,
  fg,
  bg,
  ratio,
  level,
  authored,
}: {
  vision: Vision
  fg: string
  bg: string
  ratio: number | null
  level: string | null
  authored: number | null
}) {
  // A ratio that moves by less than a tenth is noise from the round trip
  // through 8-bit sRGB, not a finding worth putting a number on.
  const drift = ratio !== null && authored !== null ? ratio - authored : 0
  const moved = Math.abs(drift) >= 0.1

  return (
    <div className="bg-card">
      <div className="px-4 pb-2 pt-3.5">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-xs font-semibold">{vision.name}</span>
          <span className="text-[10px] text-muted-foreground">{vision.prevalence}</span>
        </div>
      </div>

      <div className="px-4">
        <div
          className="rounded-lg border border-border/40 p-3"
          style={{ backgroundColor: bg }}
        >
          <p className="text-[13px] leading-snug" style={{ color: fg }}>
            The quick brown fox.
          </p>
          <p className="mt-1 text-[13px] leading-snug" style={{ color: fg, opacity: 0.9 }}>
            <span className="underline underline-offset-2">A link</span> in a sentence.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 px-4 py-3">
        <span className="font-mono text-sm font-bold tabular-nums">
          {ratio ? ratio.toFixed(2) : '—'}
        </span>
        {moved ? (
          <span
            className={cn(
              'font-mono text-[10px] tabular-nums',
              drift < 0 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground',
            )}
          >
            {drift > 0 ? '+' : ''}
            {drift.toFixed(2)}
          </span>
        ) : null}
        {level ? (
          <span
            className={cn(
              'ml-auto rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide',
              level === 'Fail'
                ? 'border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400'
                : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
            )}
          >
            {level}
          </span>
        ) : null}
      </div>

      {/* Why the number moved, in the card that moved it. */}
      <p className="border-t border-border/60 bg-muted/20 px-4 py-2 text-[11px] leading-snug text-muted-foreground">
        {vision.what}
      </p>
    </div>
  )
}
