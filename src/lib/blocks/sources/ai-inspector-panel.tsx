/**
 * <AiInspectorPanel> — the model adjusts real properties in an inspector,
 * and every change is shown, reversible and attributed.
 *
 * The "agent edits your document" pattern, applied to design properties. Its
 * whole risk is silent mutation: a model that changes six values and reports
 * "done" leaves a user unable to tell what happened. So every control here
 * carries provenance — who set it, you or the agent — and a per-property
 * revert.
 *
 *  - Changed properties are marked in text ("set by agent"), not by a dot.
 *  - Revert is per property and per panel, because "undo everything" is
 *    useless when five of six changes were wanted.
 *  - The prompt field is a real form, so Enter submits it, and the result is
 *    announced through `role="status"` rather than only appearing visually.
 *  - Sliders are native `<input type="range">` with `aria-valuetext`, so the
 *    announced value is "16 pixels" rather than "16" — the unit is the part
 *    that makes it meaningful.
 *  - The colour input is a real `type="color"` paired with a text field, so
 *    it is usable both by picking and by typing a hex, and the swatch is
 *    never the only representation.
 *
 * The preview updates from state through inline styles, which is the honest
 * way to demo a live inspector — Tailwind cannot express an arbitrary
 * runtime value without a class it has never seen.
 */

'use client'

import * as React from 'react'
import { RotateCcw, Sparkles, Undo2 } from 'lucide-react'

/*
  Contrast ratio, inlined rather than imported from `@/lib/color-tools`:
  the registry serves this file standalone, and that module is app-internal
  (the Designer Tools), not part of the component catalog it can package.
  Just the WCAG relative-luminance/contrast-ratio pair this block needs.
*/
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(hex.trim())
  if (!m) return null
  let s = m[1]
  if (s.length === 3) {
    s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2]
  }
  return {
    r: parseInt(s.slice(0, 2), 16),
    g: parseInt(s.slice(2, 4), 16),
    b: parseInt(s.slice(4, 6), 16),
  }
}

function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }): number {
  const channel = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function contrastRatio(fg: string, bg: string): number | null {
  const fgRgb = hexToRgb(fg)
  const bgRgb = hexToRgb(bg)
  if (!fgRgb || !bgRgb) return null
  const l1 = relativeLuminance(fgRgb)
  const l2 = relativeLuminance(bgRgb)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Ink for text painted directly on a solid accent fill. The accent is a
 * live, user-picked colour (the whole point of this inspector), so a fixed
 * `text-white` is only an accident away from failing 1.4.3 — pick whichever
 * of black or white actually contrasts against the value in hand.
 */
function readableInk(hex: string): string {
  const onWhite = contrastRatio(hex, '#ffffff') ?? 0
  const onBlack = contrastRatio(hex, '#0a0a0a') ?? 0
  return onWhite >= onBlack ? '#ffffff' : '#0a0a0a'
}

export interface InspectorState {
  radius: number
  padding: number
  accent: string
  weight: string
  shadow: boolean
}

export interface AiInspectorPanelProps {
  heading?: string
  /** The agent's last instruction, replayed in the field. */
  lastPrompt?: string
  initial?: Partial<InspectorState>
  /** Which properties the agent changed, for provenance marks. */
  agentTouched?: Array<keyof InspectorState>
  /**
   * Id for the field. A server component cannot call `useId`, so this is
   * the escape hatch for a page that renders two of these: give the second
   * one its own id rather than letting both labels resolve to the first.
   */
  promptId?: string
  className?: string
}

const BASE: InspectorState = {
  radius: 12,
  padding: 20,
  accent: '#4f46e5',
  weight: '600',
  shadow: true,
}

const WEIGHTS = [
  { value: '400', label: 'Regular' },
  { value: '600', label: 'Semibold' },
  { value: '800', label: 'Extrabold' },
]

export function AiInspectorPanel({
  heading = 'Flavour card',
  lastPrompt = 'make it softer and a bit more premium',
  initial,
  promptId = 'inspector-prompt',
  agentTouched = ['radius', 'accent', 'shadow'],
  className = '',
}: AiInspectorPanelProps) {
  const start = React.useMemo(() => ({ ...BASE, ...initial }), [initial])

  const [state, setState] = React.useState<InspectorState>(start)
  const [touched, setTouched] = React.useState<Array<keyof InspectorState>>(agentTouched)
  const [prompt, setPrompt] = React.useState(lastPrompt)
  const [note, setNote] = React.useState('Agent adjusted 3 properties.')

  function set<K extends keyof InspectorState>(key: K, value: InspectorState[K]) {
    setState((s) => ({ ...s, [key]: value }))
    // A property the human has just moved is no longer the agent's.
    setTouched((list) => list.filter((k) => k !== key))
    setNote('')
  }

  function revert(key: keyof InspectorState) {
    setState((s) => ({ ...s, [key]: start[key] }))
    setTouched((list) => list.filter((k) => k !== key))
    setNote(`Reverted ${key}.`)
  }

  return (
    <div className={`mx-auto grid w-full max-w-3xl gap-5 p-6 md:grid-cols-[1fr_18rem] ${className}`}>
      {/* -- Preview ------------------------------------------------------ */}
      <div className="flex items-center justify-center rounded-2xl border border-border/60 bg-muted/30 p-8">
        <div
          style={{
            borderRadius: `${state.radius}px`,
            padding: `${state.padding}px`,
            boxShadow: state.shadow ? '0 18px 40px -18px rgb(0 0 0 / 0.45)' : 'none',
          }}
          className="w-full max-w-xs border border-border/60 bg-card"
        >
          <span
            style={{ backgroundColor: `${state.accent}1a` }}
            className="inline-flex max-w-full truncate rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-foreground"
          >
            Seasonal
          </span>

          <p
            style={{ fontWeight: Number(state.weight) }}
            className="mt-3 text-lg leading-tight"
          >
            Burnt honey &amp; sea salt
          </p>

          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            Slow-churned with wildflower honey, finished with flaked salt.
          </p>

          <button
            type="button"
            style={{
              backgroundColor: state.accent,
              color: readableInk(state.accent),
              borderRadius: `${state.radius * 0.7}px`,
            }}
            className="mt-4 w-full px-3 py-2 text-sm font-semibold transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Add to case
          </button>
        </div>
      </div>

      {/* -- Inspector ----------------------------------------------------- */}
      <div className="overflow-y-hidden rounded-2xl border border-border/60 bg-card">
        <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
          <Sparkles aria-hidden className="h-4 w-4 shrink-0 text-primary" />
          {heading ? (
            <h3 data-stress-ignore className="min-w-0 flex-1 break-words text-sm font-semibold">
              {heading}
            </h3>
          ) : null}
          <button
            type="button"
            onClick={() => {
              setState(start)
              setTouched([])
              setNote('Reverted every change.')
            }}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg px-1.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <RotateCcw aria-hidden className="h-3 w-3" />
            Reset
          </button>
        </div>

        <div className="space-y-4 px-4 py-4">
          <Row label="Corner radius" owned={touched.includes('radius')} onRevert={() => revert('radius')}>
            <input
              type="range"
              min={0}
              max={28}
              step={1}
              value={state.radius}
              aria-label="Corner radius"
              aria-valuetext={`${state.radius} pixels`}
              onChange={(e) => set('radius', Number(e.target.value))}
              className="w-full accent-primary"
            />
            <span className="w-10 shrink-0 text-end font-mono text-xs tabular-nums text-muted-foreground">
              {state.radius}px
            </span>
          </Row>

          <Row label="Padding" owned={touched.includes('padding')} onRevert={() => revert('padding')}>
            <input
              type="range"
              min={8}
              max={40}
              step={2}
              value={state.padding}
              aria-label="Padding"
              aria-valuetext={`${state.padding} pixels`}
              onChange={(e) => set('padding', Number(e.target.value))}
              className="w-full accent-primary"
            />
            <span className="w-10 shrink-0 text-end font-mono text-xs tabular-nums text-muted-foreground">
              {state.padding}px
            </span>
          </Row>

          <Row label="Accent" owned={touched.includes('accent')} onRevert={() => revert('accent')}>
            <input
              type="color"
              value={state.accent}
              aria-label="Accent colour"
              onChange={(e) => set('accent', e.target.value)}
              className="h-7 w-9 shrink-0 cursor-pointer rounded border border-border/60 bg-transparent"
            />
            {/* The hex is typeable, not just pickable — a colour input alone
                excludes anyone working from a spec. */}
            <input
              type="text"
              value={state.accent}
              aria-label="Accent hex value"
              onChange={(e) => set('accent', e.target.value)}
              className="w-full rounded-lg border border-border/60 bg-background px-2 py-1 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </Row>

          <Row label="Title weight" owned={touched.includes('weight')} onRevert={() => revert('weight')}>
            <select
              value={state.weight}
              aria-label="Title weight"
              onChange={(e) => set('weight', e.target.value)}
              className="w-full rounded-lg border border-border/60 bg-background px-2 py-1.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {WEIGHTS.map((w) => (
                <option key={w.value} value={w.value}>
                  {w.label}
                </option>
              ))}
            </select>
          </Row>

          <Row label="Shadow" owned={touched.includes('shadow')} onRevert={() => revert('shadow')}>
            <label className="flex cursor-pointer items-center gap-2 text-xs">
              <input
                type="checkbox"
                role="switch"
                checked={state.shadow}
                onChange={(e) => set('shadow', e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              {state.shadow ? 'On' : 'Off'}
            </label>
          </Row>
        </div>

        {/* -- Prompt -------------------------------------------------- */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setNote(`Asked the agent to “${prompt}”.`)
          }}
          className="border-t border-border/60 bg-muted/30 p-3"
        >
          <label htmlFor={promptId} className="sr-only">
            Tell the agent what to change
          </label>
          <div className="flex gap-2">
            <input
              id={promptId}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe a change…"
              className="min-w-0 flex-1 rounded-lg border border-border/60 bg-background px-2.5 py-1.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <button
              type="submit"
              className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Adjust
            </button>
          </div>

          <p role="status" className="mt-2 min-h-4 text-[11px] text-muted-foreground">
            {note}
          </p>
        </form>
      </div>
    </div>
  )
}

/**
 * One inspector row.
 *
 * `owned` marks a property the agent set. Rendered as words rather than a
 * coloured border — "which of these did the machine touch" has to be
 * answerable without seeing the colour.
 */
function Row({
  label,
  owned,
  onRevert,
  children,
}: {
  label: string
  owned: boolean
  onRevert: () => void
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-xs font-medium">{label}</span>

        {owned ? (
          <>
            <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
              set by agent
            </span>
            <button
              type="button"
              onClick={onRevert}
              className="ms-auto inline-flex items-center gap-1 rounded px-1 py-0.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Undo2 aria-hidden className="h-3 w-3 rtl:rotate-180" />
              Revert
              <span className="sr-only"> {label}</span>
            </button>
          </>
        ) : null}
      </div>

      <div className="flex items-center gap-2">{children}</div>
    </div>
  )
}
