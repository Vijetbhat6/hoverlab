'use client'

/**
 * Tailwind ↔ CSS Translator.
 *
 * Three tools here already emit a Tailwind config — the token generator,
 * the palette generator, the spacing scale — and nothing read one back.
 * The traffic runs both ways in practice: you inherit a stylesheet and want
 * it as utilities, or you inherit a component and want to know what its
 * classes actually do before you touch one.
 *
 * The interesting design decision is what to do with what it cannot map,
 * and the answer is: say so, per line. A converter that silently drops a
 * declaration is worse than one that refuses it, because you find out in
 * production. So every input line comes back with a verdict — exact, an
 * arbitrary value, an arbitrary property, or unsupported with a reason —
 * and the count of each is shown above the output.
 *
 * The translation itself lives in `lib/tailwind-convert.ts` with its own
 * tests. The mapping tables are the part that rots when a scale changes,
 * and that is the part worth pinning down in a test rather than in a page.
 */

import * as React from 'react'
import { ArrowLeftRight, Wind } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { CopyCssCard } from '@/components/designer-tools/copy-css-card'
import { ToolLayout } from '@/components/designer-tools/tool-layout'
import { ToolPresetsBar } from '@/components/designer-tools/tool-presets-bar'
import { UseInCatalog } from '@/components/designer-tools/use-in-catalog'
import { useToolState } from '@/hooks/use-tool-state'
import { cssToTailwind, tailwindToCss } from '@/lib/tailwind-convert'
import { cn } from '@/lib/utils'

const TOOL = '/tools/tailwind'

type Direction = 'to-tailwind' | 'to-css'

interface TailwindState {
  direction: Direction
  css: string
  classes: string
}

const SAMPLE_CSS = `.card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: 12px;
  background-color: #0f172a;
  font-size: 0.875rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
}`

const SAMPLE_CLASSES =
  'flex flex-col gap-4 p-6 rounded-xl bg-[#0f172a] text-sm md:grid-cols-3 [mask-image:linear-gradient(black,_transparent)]'

const DEFAULT_STATE: TailwindState = {
  direction: 'to-tailwind',
  css: SAMPLE_CSS,
  classes: SAMPLE_CLASSES,
}

const KIND_STYLE: Record<string, string> = {
  exact: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  'arbitrary-value': 'border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300',
  'arbitrary-property':
    'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  unsupported: 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300',
}

const KIND_LABEL: Record<string, string> = {
  exact: 'exact',
  'arbitrary-value': 'arbitrary value',
  'arbitrary-property': 'arbitrary property',
  unsupported: 'not converted',
}

export default function TailwindToolPage() {
  const tool = useToolState<TailwindState>(TOOL, DEFAULT_STATE)
  const { state, setState } = tool

  const update = (patch: Partial<TailwindState>) => setState((s) => ({ ...s, ...patch }))

  const toTailwind = state.direction === 'to-tailwind'

  const forward = React.useMemo(() => cssToTailwind(state.css), [state.css])
  const backward = React.useMemo(() => tailwindToCss(state.classes), [state.classes])

  const counts = React.useMemo(() => {
    const out: Record<string, number> = {}
    for (const line of forward.lines) out[line.kind] = (out[line.kind] ?? 0) + 1
    return out
  }, [forward.lines])

  const backwardCss = backward
    .map((r) => r.css)
    .filter(Boolean)
    .join('\n')

  const unresolved = backward.filter((r) => !r.css)

  return (
    <ToolLayout
      name="Tailwind to CSS Converter"
      tagline="Both directions, with a verdict on every line — nothing is silently dropped"
      icon={<Wind className="h-5 w-5" />}
    >
      <div className="space-y-6">
        {/* Direction switch, above everything: it changes what both panes
            mean, so it cannot live in a sidebar below them. */}
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4">
          <div className="grid flex-1 grid-cols-2 gap-2 sm:max-w-md">
            {(
              [
                ['to-tailwind', 'CSS → Tailwind'],
                ['to-css', 'Tailwind → CSS'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => update({ direction: value })}
                aria-pressed={state.direction === value}
                className={cn(
                  'rounded-lg border px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  state.direction === value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:bg-muted/50',
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground"
            onClick={() =>
              update({ direction: toTailwind ? 'to-css' : 'to-tailwind' })
            }
          >
            <ArrowLeftRight className="h-3.5 w-3.5" /> Swap
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Input */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="tw-input" className="text-sm font-medium">
                {toTailwind ? 'CSS in' : 'Classes in'}
              </Label>
              <button
                type="button"
                className="text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                onClick={() =>
                  toTailwind
                    ? update({ css: SAMPLE_CSS })
                    : update({ classes: SAMPLE_CLASSES })
                }
              >
                Load an example
              </button>
            </div>
            <textarea
              id="tw-input"
              spellCheck={false}
              value={toTailwind ? state.css : state.classes}
              onChange={(e) =>
                toTailwind
                  ? update({ css: e.target.value })
                  : update({ classes: e.target.value })
              }
              rows={toTailwind ? 16 : 8}
              placeholder={
                toTailwind
                  ? 'Paste declarations, or a whole rule with its selector and braces.'
                  : 'Paste a className — space separated.'
              }
              className="w-full resize-y rounded-lg border border-border bg-background p-4 font-mono text-xs leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {toTailwind
                ? 'A bare list of declarations or a full rule — the selector and braces are stripped for you, because people paste what they have.'
                : 'Variants are reported rather than expanded: `hover:` is a pseudo-class and `md:` is a breakpoint that lives in your config, which a text box cannot read.'}
            </p>
          </div>

          {/* Output */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              {toTailwind ? 'Tailwind out' : 'CSS out'}
            </Label>

            {toTailwind ? (
              <>
                <CopyCssCard
                  code={forward.classes || '/* nothing to convert yet */'}
                  title="className"
                  language="html"
                />
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(counts).map(([kind, count]) => (
                    <span
                      key={kind}
                      className={cn(
                        'rounded border px-2 py-0.5 text-[10px] font-semibold',
                        KIND_STYLE[kind],
                      )}
                    >
                      {count} {KIND_LABEL[kind]}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <>
                <CopyCssCard
                  code={backwardCss || '/* nothing to convert yet */'}
                  title="CSS"
                  language="css"
                />
                {unresolved.length ? (
                  <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[11px] leading-relaxed text-amber-700 dark:text-amber-300">
                    {unresolved.length} class
                    {unresolved.length === 1 ? '' : 'es'} could not be expanded:{' '}
                    <span className="font-mono">
                      {unresolved.map((u) => u.className).join(', ')}
                    </span>
                    . They are listed in full below with the reason.
                  </p>
                ) : null}
              </>
            )}
          </div>
        </div>

        {/* The per-line report. This is the part that makes the output
            trustworthy — a class list on its own gives you no way to know
            which parts were translated and which were escaped. */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border/60 px-4 py-3">
            <h2 className="text-sm font-semibold">Line by line</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Every input line, and exactly how it was handled.
            </p>
          </div>

          <ul className="divide-y divide-border/60">
            {toTailwind
              ? forward.lines.map((line, i) => (
                  <li key={i} className="flex flex-wrap items-start gap-x-3 gap-y-1 px-4 py-2.5">
                    <code className="min-w-0 flex-1 break-all font-mono text-[11px] text-muted-foreground">
                      {line.source}
                    </code>
                    <code className="min-w-0 flex-1 break-all font-mono text-[11px] font-semibold">
                      {line.output ?? '—'}
                    </code>
                    <span
                      className={cn(
                        'shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide',
                        KIND_STYLE[line.kind],
                      )}
                    >
                      {KIND_LABEL[line.kind]}
                    </span>
                    {line.note ? (
                      <p className="w-full text-[11px] leading-snug text-muted-foreground">
                        {line.note}
                      </p>
                    ) : null}
                  </li>
                ))
              : backward.map((line, i) => (
                  <li key={i} className="flex flex-wrap items-start gap-x-3 gap-y-1 px-4 py-2.5">
                    <code className="min-w-0 flex-1 break-all font-mono text-[11px] font-semibold">
                      {line.className}
                    </code>
                    <code className="min-w-0 flex-1 break-all font-mono text-[11px] text-muted-foreground">
                      {line.css ?? '—'}
                    </code>
                    <span
                      className={cn(
                        'shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide',
                        line.css ? KIND_STYLE.exact : KIND_STYLE.unsupported,
                      )}
                    >
                      {line.css ? 'expanded' : 'unknown'}
                    </span>
                    {line.note ? (
                      <p className="w-full text-[11px] leading-snug text-muted-foreground">
                        {line.note}
                      </p>
                    ) : null}
                  </li>
                ))}
          </ul>
        </div>

        {/* Said plainly, once, rather than implied by a disclaimer nobody
            reads: this is a translator, not the compiler. */}
        <div className="rounded-xl border border-border bg-muted/20 px-5 py-4">
          <h2 className="text-sm font-semibold">What this is not</h2>
          <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-muted-foreground">
            <li>
              <span className="font-semibold text-foreground">Not your config.</span>{' '}
              The scales here are Tailwind&rsquo;s defaults. If your theme has a custom
              spacing ramp or named colours, a value that is exact in your project may
              come back as an arbitrary value here — correct, just not the utility you
              would have written.
            </li>
            <li>
              <span className="font-semibold text-foreground">Not a compiler.</span>{' '}
              Variants, plugins, `@apply` and the theme function need a build. What this
              covers is the common utility surface, which is most of what a component
              actually uses.
            </li>
            <li>
              <span className="font-semibold text-foreground">Never lossy in silence.</span>{' '}
              Anything without a utility becomes an arbitrary property —{' '}
              <code className="font-mono">[mask-image:…]</code> — which is a valid class
              and exact. The only lines that come back empty are the ones that genuinely
              are not declarations, and they are listed above with the reason.
            </li>
          </ul>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
          <UseInCatalog tool={TOOL} />
          <ToolPresetsBar tool={tool} noun="snippet" />
        </div>
      </div>
    </ToolLayout>
  )
}
