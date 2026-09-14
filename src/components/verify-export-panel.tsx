'use client'

/**
 * The Verify tab — the export rendered beside the original.
 *
 * ── WHAT THIS IS FOR ────────────────────────────────────────────────────
 *
 * The Code tab's whole proposition is that one effect is seven exports,
 * and until now a reader could only take that on faith. The preview at the
 * top of the page is rendered from the original HTML and CSS. The Vue
 * single-file component underneath it is *text*. Nothing on the page ever
 * connected the two, which is a strange place to leave the one claim the
 * catalog is differentiated on.
 *
 * So this renders the export as well, in a second frame, from the
 * generated file — and then, because two small previews side by side will
 * not reveal a `letter-spacing` that moved, walks both documents and
 * compares every computed property on every element and pseudo-element.
 * The verdict is a count, not an impression.
 *
 * ── WHY IT IS NOT GATED, WHEN THREE OF THE FOUR TARGETS ARE ─────────────
 *
 * Vue, Svelte and Tailwind are Pro exports in the panel above. This tab
 * shows all four to everyone, and that is not an oversight.
 *
 * What Pro buys is the artifact: the `.vue` file, the copy button, the
 * download. What this tab hands over is *evidence that the artifact is
 * good*, which is a reason to buy rather than the thing being bought. The
 * export panel already argues the same point in the other direction — a
 * locked target still renders its tab, because a visitor who cannot see
 * that Svelte exists cannot want it. A visitor who cannot see that it
 * works has no reason to trust it either.
 *
 * The line is drawn at source: this tab shows the *rendering* and the file
 * names, never the generated code. The gate stays exactly where
 * `FREE_FRAMEWORK_IDS` puts it.
 *
 * ── WHY THE FINDINGS ARE SPLIT THREE WAYS ───────────────────────────────
 *
 * A panel that says "verified" and nothing else is a logo, not a check.
 * The three kinds — a problem with the export, a gap in the verifier, a
 * note about the framework's own behaviour — are the difference between a
 * reader trusting this and a reader learning to skip it. In particular the
 * gap row exists so that a class this codebase cannot resolve reads as
 * "we did not check that" rather than as a defect.
 */

import * as React from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  HelpCircle,
  Info,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'

import {
  type DiffReport,
  diffRendered,
  freezeAnimations,
  verdictOf,
} from '@/lib/export/computed-diff'
import {
  type VerifyTarget,
  UNVERIFIABLE_TARGETS,
  VERIFY_TARGETS,
  verifyExport,
} from '@/lib/export/verify'
import { cn } from '@/lib/utils'

const TARGET_LABEL: Record<VerifyTarget, string> = {
  css: 'CSS',
  vue: 'Vue',
  svelte: 'Svelte',
  tailwind: 'Tailwind',
}

interface VerifyExportPanelProps {
  effect: {
    id: string
    name: string
    description: string
    category?: string
  }
  html: string
  /** The customized stylesheet, so this verifies what the page is showing. */
  css: string
  isCustomized: boolean
  darkSurface?: boolean
}

/**
 * The document both frames are built from.
 *
 * Identical on both sides down to the byte apart from the markup and the
 * stylesheet — if the shell differed at all, every property that inherits
 * from `body` would differ with it and the whole comparison would be
 * noise about our own wrapper.
 */
function sandboxDocument(html: string, css: string, dark: boolean, stamp: string): string {
  /*
   * A stylesheet cannot close its own tag. No effect's CSS contains
   * `</style`, and the customization that feeds this comes off a URL hash
   * as four numbers — but a `<style>` element built by string concatenation
   * is the shape of the problem, so it is closed here rather than argued
   * about later.
   */
  const stylesheet = css.replace(/<\/(style)/gi, '<\\/$1')

  /*
   * The stamp is how `measure` knows it is looking at the right document.
   * Counting `load` events is not enough: an iframe can fire `load` for the
   * `about:blank` it starts on before the srcdoc commits, and an
   * `about:blank` is `readyState: 'complete'` with an empty body — which
   * reads as "the export renders no elements", the single most damaging
   * thing this panel could say wrongly.
   */
  return `<!doctype html>
<html lang="en" data-hoverlab-run="${stamp}"><head><meta charset="utf-8">
<style>
  html, body { margin: 0; padding: 0; }
  body {
    box-sizing: border-box;
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 28px;
    background: ${dark ? '#020617' : '#ffffff'};
    color: ${dark ? '#e2e8f0' : '#0f172a'};
    color-scheme: ${dark ? 'dark' : 'light'};
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    font-size: 14px;
    line-height: 1.5;
  }
</style>
<style>${stylesheet}</style>
</head><body>${html}</body></html>`
}

type Status = 'waiting' | 'measured' | 'unreadable'

export function VerifyExportPanel({
  effect,
  html,
  css,
  isCustomized,
  darkSurface = false,
}: VerifyExportPanelProps) {
  const [target, setTarget] = React.useState<VerifyTarget>('css')
  const [report, setReport] = React.useState<DiffReport | null>(null)
  const [status, setStatus] = React.useState<Status>('waiting')

  const originalRef = React.useRef<HTMLIFrameElement>(null)
  const convertedRef = React.useRef<HTMLIFrameElement>(null)
  const loadedRef = React.useRef(0)
  /** Which target the frames on screen belong to — see `measure`. */
  const runKeyRef = React.useRef('')
  /** Lets `measure` re-schedule itself without depending on itself. */
  const measureRef = React.useRef<(forKey?: string, attempt?: number) => void>(() => {})

  const verification = React.useMemo(
    () =>
      verifyExport(
        {
          id: effect.id,
          name: effect.name,
          description: effect.description,
          category: effect.category,
          html,
          css,
        },
        target,
      ),
    [effect.id, effect.name, effect.description, effect.category, html, css, target],
  )

  /*
   * Remounting both frames rather than letting React patch `srcDoc` in
   * place. A patched srcdoc reloads asynchronously with no event we can
   * hang the load count off reliably, and measuring a frame that is still
   * showing the previous target is the one failure mode that would make
   * this panel lie.
   */
  const runKey = `${effect.id}:${target}:${isCustomized ? 'custom' : 'stock'}`

  const originalDoc = sandboxDocument(
    verification.original.html,
    verification.original.css,
    darkSurface,
    runKey,
  )
  const convertedDoc = sandboxDocument(
    verification.converted.html,
    verification.converted.css,
    darkSurface,
    runKey,
  )

  /*
   * Reset before the new frames mount, not after.
   *
   * This was a `useEffect` on `runKey`, which runs *after* the commit —
   * long enough for a `requestAnimationFrame` left over from the previous
   * target to fire against the new frames while they are still empty. The
   * comparison then read one populated document against one blank one and
   * reported that the export renders different markup, which is a
   * catastrophic thing for this panel of all panels to say wrongly.
   *
   * Adjusting state during render is React's own answer to deriving state
   * from a prop change; the alternative here is a verdict that is
   * occasionally a lie.
   */
  runKeyRef.current = runKey

  const [lastRunKey, setLastRunKey] = React.useState(runKey)
  if (lastRunKey !== runKey) {
    setLastRunKey(runKey)
    loadedRef.current = 0
    setReport(null)
    setStatus('waiting')
  }

  const measure = React.useCallback((forKey?: string, attempt = 0) => {
    // A measurement scheduled for a target the reader has already moved on
    // from is thrown away rather than shown against the wrong frames.
    if (forKey !== undefined && forKey !== runKeyRef.current) return

    const originalDocument = originalRef.current?.contentDocument
    const convertedDocument = convertedRef.current?.contentDocument

    if (!originalDocument || !convertedDocument) {
      setStatus('unreadable')
      return
    }

    /*
     * Both frames have to be finished AND be the documents this run wrote.
     * The stamp is the part that matters: a frame still on `about:blank`
     * reports `readyState: 'complete'` with an empty body, and comparing a
     * full document against an empty one reads as "the export renders
     * different markup" — a false accusation, in the one panel whose whole
     * value is not making them.
     */
    const ready = (doc: Document) =>
      doc.readyState === 'complete' &&
      doc.documentElement?.getAttribute('data-hoverlab-run') === runKeyRef.current

    if (!ready(originalDocument) || !ready(convertedDocument)) {
      if (attempt >= 90) {
        setStatus('unreadable')
        return
      }
      requestAnimationFrame(() => measureRef.current(forKey, attempt + 1))
      return
    }

    // Rewound for the duration of the read and released immediately after,
    // so the frames go back to animating in front of the reader. Measuring
    // a running animation would report whichever millisecond each frame
    // happened to be on, which is a fact about the clock and not about the
    // conversion.
    let release: Array<() => void> = []

    try {
      release = [freezeAnimations(originalDocument), freezeAnimations(convertedDocument)]
      setReport(diffRendered(originalDocument, convertedDocument))
      setStatus('measured')
    } catch {
      // Reaching into a frame can throw if the browser decides the two
      // documents are not same-origin after all. Say so rather than
      // showing a stale verdict from the previous target.
      setStatus('unreadable')
    } finally {
      for (const stop of release) stop()
    }
  }, [])

  measureRef.current = measure

  const onFrameLoad = React.useCallback(() => {
    loadedRef.current += 1
    if (loadedRef.current < 2) return
    // Two frames after layout, so a web font or a late style recalculation
    // has landed on both sides before anything is read. Tagged with the
    // target it was scheduled for, so switching targets mid-flight
    // discards it instead of measuring the new frames too early.
    const forKey = runKeyRef.current
    requestAnimationFrame(() => requestAnimationFrame(() => measureRef.current(forKey)))
  }, [])

  const verdict = report ? verdictOf(report) : null
  const problems = verification.findings.filter((f) => f.kind === 'problem')
  const gaps = verification.findings.filter((f) => f.kind === 'gap')
  const notes = verification.findings.filter((f) => f.kind === 'note')
  const realDifferences = report?.differences.filter((d) => d.severity === 'real') ?? []
  const equivalents = report?.differences.filter((d) => d.severity === 'equivalent') ?? []

  return (
    <div className="space-y-4">
      {/* Target first — it decides what the right-hand frame is. */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/20 p-2.5">
        <div
          role="group"
          aria-label="Export to verify"
          className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4"
        >
          {VERIFY_TARGETS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setTarget(id)}
              aria-pressed={target === id}
              className={cn(
                'rounded-lg border px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                target === id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:bg-muted/50',
              )}
            >
              {TARGET_LABEL[id]}
            </button>
          ))}
        </div>
      </div>

      {/* The verdict, before the frames: a reader who scrolls no further
          should still have the answer. */}
      <div
        className={cn(
          'flex items-start gap-2.5 rounded-xl border px-4 py-3',
          status === 'waiting' && 'border-border bg-muted/20',
          status === 'unreadable' && 'border-border bg-muted/20',
          verdict?.status === 'match' && 'border-emerald-500/40 bg-emerald-500/10',
          verdict?.status === 'equivalent' && 'border-sky-500/40 bg-sky-500/10',
          verdict?.status === 'differs' && 'border-amber-500/40 bg-amber-500/10',
        )}
      >
        {status === 'waiting' ? (
          <CircleDashed className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
        ) : status === 'unreadable' ? (
          // Not the reassuring shield: nothing was checked. This branch
          // fell through to the same icon a clean equivalent result gets,
          // which is the one state where looking verified is worst.
          <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        ) : verdict?.status === 'differs' ? (
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
        ) : verdict?.status === 'match' ? (
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
        ) : (
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" aria-hidden />
        )}

        <div className="min-w-0 flex-1" aria-live="polite">
          <p className="text-xs font-semibold">
            {status === 'waiting'
              ? 'Rendering both sides…'
              : status === 'unreadable'
                ? 'The two frames could not be read back for comparison.'
                : verdict?.headline}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            {status === 'unreadable'
              ? 'The previews above are still the real thing — only the automatic property-by-property comparison is unavailable in this browser.'
              : verification.method}
          </p>
        </div>

        {/*
          `measure` is called with no arguments on purpose. Handing it to
          onClick directly passes the MouseEvent as `forKey`, which never
          equals `runKeyRef.current`, so the guard at the top of `measure`
          returns and this button does nothing at all.
        */}
        {status !== 'waiting' ? (
          <button
            type="button"
            onClick={() => measure()}
            className="shrink-0 rounded-md border border-border bg-background/60 p-1.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            title="Measure again"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            <span className="sr-only">Measure again</span>
          </button>
        ) : null}
      </div>

      {/* The two renderings. */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Frame
          key={`${runKey}:original`}
          title="The original"
          subtitle={
            isCustomized
              ? `${effect.id}.html with your customized CSS`
              : `${effect.id}.html and ${effect.id}.css, as authored`
          }
          srcDoc={originalDoc}
          frameRef={originalRef}
          onLoad={onFrameLoad}
        />
        <Frame
          key={`${runKey}:converted`}
          title={`The ${verification.label} export`}
          subtitle={verification.files.map((f) => f.path).join(' + ')}
          srcDoc={convertedDoc}
          frameRef={convertedRef}
          onLoad={onFrameLoad}
        />
      </div>

      {problems.length ? (
        <FindingList
          tone="problem"
          heading="Problems with this export"
          items={problems.map((f) => f.message)}
        />
      ) : null}

      {realDifferences.length ? (
        <div className="overflow-hidden rounded-xl border border-amber-500/40 bg-amber-500/5">
          <div className="flex items-center gap-2 border-b border-amber-500/30 px-4 py-2.5">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" aria-hidden />
            <h3 className="text-xs font-semibold text-amber-800 dark:text-amber-300">
              Where the two renderings disagree
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead className="text-muted-foreground">
                <tr className="border-b border-amber-500/20">
                  <th scope="col" className="px-4 py-2 font-medium">Element</th>
                  <th scope="col" className="px-4 py-2 font-medium">Property</th>
                  <th scope="col" className="px-4 py-2 font-medium">Original</th>
                  <th scope="col" className="px-4 py-2 font-medium">Export</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-500/20">
                {realDifferences.slice(0, 25).map((d, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2 font-mono text-[10px] text-muted-foreground">
                      {d.path}
                      {d.pseudo ? <span className="text-amber-700 dark:text-amber-400">{d.pseudo}</span> : null}
                    </td>
                    <td className="px-4 py-2 font-mono text-[10px]">{d.property}</td>
                    <td className="px-4 py-2 font-mono text-[10px] break-all">{d.original || '—'}</td>
                    <td className="px-4 py-2 font-mono text-[10px] break-all">{d.converted || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {realDifferences.length > 25 ? (
            <p className="border-t border-amber-500/20 px-4 py-2 text-[11px] text-muted-foreground">
              … and {realDifferences.length - 25} more
              {report?.truncated ? ' (the comparison stopped early)' : ''}.
            </p>
          ) : null}
        </div>
      ) : null}

      {report?.structural.length ? (
        <FindingList
          tone="problem"
          heading="The markup itself differs"
          items={report.structural.map((s) => `${s.path} — ${s.message}`)}
        />
      ) : null}

      {equivalents.length ? (
        <FindingList
          tone="note"
          heading="Different values, nothing different on screen"
          items={equivalents
            .slice(0, 8)
            .map(
              (d) =>
                `${d.path}${d.pseudo ?? ''} — ${d.property} is "${d.original}" in the original and "${d.converted}" in the export. Neither value can be painted here.`,
            )}
        />
      ) : null}

      {notes.length ? (
        <FindingList tone="note" heading={`Worth knowing about ${verification.label}`} items={notes.map((f) => f.message)} />
      ) : null}

      {gaps.length ? (
        <FindingList
          tone="gap"
          heading="What this check could not cover"
          items={gaps.map((f) => f.message)}
        />
      ) : null}

      <FindingList
        tone="gap"
        heading="What a clean result here does not prove"
        items={verification.limits}
      />

      {/* The three exports that cannot be shown this way, said plainly and
          in the place where somebody would go looking for them. */}
      <div className="rounded-xl border border-border bg-muted/20 px-5 py-4">
        <h3 className="text-sm font-semibold">The three exports that are not on this tab</h3>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          Anything this page could draw for them would be a re-rendering of the original
          wearing their name, which would prove precisely nothing.
        </p>
        <dl className="mt-3 space-y-2">
          {(['react', 'styled-components', 'html'] as const).map((id) => (
            <div key={id} className="text-xs leading-relaxed">
              <dt className="inline font-medium">{id} — </dt>
              <dd className="inline text-muted-foreground">{UNVERIFIABLE_TARGETS[id]}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          <Link href="/frameworks" className="underline underline-offset-2 hover:text-foreground">
            Every framework target is documented here
          </Link>
          .
        </p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 *  Pieces
 * ------------------------------------------------------------------ */

function Frame({
  title,
  subtitle,
  srcDoc,
  frameRef,
  onLoad,
}: {
  title: string
  subtitle: string
  srcDoc: string
  frameRef: React.RefObject<HTMLIFrameElement | null>
  onLoad: () => void
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-baseline justify-between gap-3 border-b border-border/60 px-3 py-2">
        <h3 className="text-xs font-semibold">{title}</h3>
        <p className="truncate font-mono text-[10px] text-muted-foreground" title={subtitle}>
          {subtitle}
        </p>
      </div>
      {/*
        `allow-same-origin` without `allow-scripts` is the whole point: the
        parent can read the document to compare it, and nothing inside the
        frame can run. Every effect in this catalog is markup and CSS, so
        there is nothing to lose by refusing scripts — and an inline
        handler that silently did not fire would be a difference the
        comparison could not see anyway, which is why the panel says the
        frames show the resting state.
      */}
      <iframe
        ref={frameRef}
        title={title}
        srcDoc={srcDoc}
        onLoad={onLoad}
        sandbox="allow-same-origin"
        className="block h-64 w-full border-0 sm:h-72"
      />
    </div>
  )
}

function FindingList({
  tone,
  heading,
  items,
}: {
  tone: 'problem' | 'note' | 'gap'
  heading: string
  items: string[]
}) {
  if (!items.length) return null

  const Icon = tone === 'problem' ? AlertTriangle : Info

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border',
        tone === 'problem' ? 'border-amber-500/40 bg-amber-500/5' : 'border-border bg-card',
      )}
    >
      <div
        className={cn(
          'flex items-center gap-2 border-b px-4 py-2.5',
          tone === 'problem' ? 'border-amber-500/30' : 'border-border/60',
        )}
      >
        <Icon
          className={cn(
            'h-3.5 w-3.5',
            tone === 'problem' ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground',
          )}
          aria-hidden
        />
        <h3
          className={cn(
            'text-xs font-semibold',
            tone === 'problem' ? 'text-amber-800 dark:text-amber-300' : '',
          )}
        >
          {heading}
        </h3>
      </div>
      <ul
        className={cn(
          'divide-y',
          tone === 'problem' ? 'divide-amber-500/20' : 'divide-border/60',
        )}
      >
        {items.map((item, i) => (
          <li
            key={i}
            className={cn(
              'px-4 py-2.5 text-[11px] leading-relaxed',
              tone === 'problem'
                ? 'text-amber-900 dark:text-amber-200'
                : 'text-muted-foreground',
            )}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
