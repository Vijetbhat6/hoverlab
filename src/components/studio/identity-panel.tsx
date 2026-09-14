'use client'

/**
 * The Identity fields — persistent, not a tab.
 *
 * ── WHY THIS SITS OUTSIDE THE TABS ──────────────────────────────────────
 *
 * Style, Variables and Agent are three views of one system, and you switch
 * between them. Identity is not a fourth view; it is the thing the other
 * three are describing, and it belongs on screen while you use them. Put
 * behind a tab it becomes a form to fill in once and forget, which is
 * exactly how brand guidelines end up describing a product that has since
 * changed — and the Agent tab's document would be quoting fields the person
 * editing it cannot see.
 *
 * It collapses, because a rail of textareas above a colour editor is a rail
 * of textareas in the way of a colour editor. It starts OPEN on a blank
 * canvas and CLOSED once there is something in it: the first visit needs to
 * see that this exists at all, and a returning one does not need to
 * re-read their own brief.
 *
 * ── WHY THE ANTI-PATTERNS ARE A LIST AND NOT A TEXTAREA ─────────────────
 *
 * A textarea would have been three lines of code. It produces a paragraph,
 * and a paragraph of prohibitions is one thing an agent averages rather
 * than eight things it checks. Discrete rows also make the count visible,
 * which is the honest pressure: eight is the cap, and a ninth rule means
 * choosing which of the eight matters less.
 *
 * ACCESSIBILITY: every field has a real `<label>` tied by id, the
 * character counters are `aria-live="polite"` only when close to the cap
 * (a counter announcing every keystroke is unusable), each removal button
 * names the rule it removes rather than saying "remove", and the suggestion
 * chips are buttons in a labelled group rather than a bare row.
 */

import * as React from 'react'
import { ChevronDown, Plus, Sparkles, X } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  ANTI_PATTERN_SUGGESTIONS,
  IDENTITY_FIELDS,
  IDENTITY_LIMITS,
  IDENTITY_PRESETS,
  identityCoverage,
  type StudioIdentity,
} from '@/lib/studio/identity'
import { cn } from '@/lib/utils'

/**
 * When the counter starts speaking.
 *
 * A live counter on every keystroke is noise that makes a screen reader
 * unusable in a textarea; a counter that appears at 80% is a warning
 * arriving in time to change what you are typing.
 */
const COUNTER_THRESHOLD = 0.8

function Counter({ value, max }: { value: number; max: number }) {
  const near = value >= max * COUNTER_THRESHOLD
  return (
    <span
      aria-live={near ? 'polite' : 'off'}
      className={cn(
        'font-mono text-[11px]',
        value >= max ? 'font-bold text-destructive' : 'text-muted-foreground',
      )}
    >
      {value}/{max}
    </span>
  )
}

export interface IdentityPanelProps {
  identity: StudioIdentity
  /**
   * An updater, not a value.
   *
   * The anti-pattern chips are a row of eight buttons that invite being
   * clicked in quick succession, and `onChange(nextValue)` built from this
   * render's `identity` drops every click but the last one that lands
   * inside a single render pass. Taking a function makes each click apply
   * to whatever is actually there.
   */
  onChange: (update: (current: StudioIdentity) => StudioIdentity) => void
  /** True until the stored identity has been read — see `useToolState`. */
  hydrating?: boolean
}

export function IdentityPanel({ identity, onChange, hydrating }: IdentityPanelProps) {
  const uid = React.useId()
  const coverage = identityCoverage(identity)
  const [draft, setDraft] = React.useState('')
  const [open, setOpen] = React.useState(true)

  /*
    Close once there is something to keep, and only once. Written as a ref
    -guarded effect rather than derived from `coverage.empty`, because
    deriving it would slam the panel shut on the keystroke that fills the
    first field — while the user is still typing in it.

    Waits on `hydrating`: on a returning visit the first render has the
    defaults and the stored identity lands a frame later, so reading
    `coverage` before then would decide "blank canvas, stay open" for
    everyone.
  */
  const decided = React.useRef(false)
  React.useEffect(() => {
    if (hydrating || decided.current) return
    decided.current = true
    if (!coverage.empty) setOpen(false)
  }, [hydrating, coverage.empty])

  const set = <K extends keyof StudioIdentity>(key: K, value: StudioIdentity[K]) =>
    onChange((current) => ({ ...current, [key]: value }))

  const atCap = identity.antiPatterns.length >= IDENTITY_LIMITS.antiPatterns

  function addRule(rule: string) {
    const clean = rule.replace(/\s+/g, ' ').trim().slice(0, IDENTITY_LIMITS.antiPattern)
    if (!clean) return
    /*
      The cap and the duplicate check both run against `current`, not
      against this render's `identity`. Two chips clicked in the same frame
      would otherwise both see a list of length seven and both append, so
      the cap is one off and a ninth rule can slip past it.

      Case-insensitive, because a chip tapped twice and a rule retyped by
      hand are the same rule, and two near-identical prohibitions in the
      document read as sloppiness rather than emphasis.
    */
    onChange((current) => {
      if (current.antiPatterns.length >= IDENTITY_LIMITS.antiPatterns) return current
      if (current.antiPatterns.some((r) => r.toLowerCase() === clean.toLowerCase())) {
        return current
      }
      return { ...current, antiPatterns: [...current.antiPatterns, clean] }
    })
  }

  return (
    <section
      aria-labelledby={`${uid}-heading`}
      className="rounded-2xl border border-border/60 bg-card/60"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={`${uid}-panel`}
          className="inline-flex items-center gap-2 rounded-lg text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span id={`${uid}-heading`}>Identity</span>
          <ChevronDown
            aria-hidden
            className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')}
          />
        </button>

        <span className="text-xs text-muted-foreground">
          {coverage.empty
            ? 'The half a token file cannot carry — who this is for and how it sounds.'
            : `${coverage.filled} of ${coverage.total} filled`}
        </span>

        {!open && !coverage.empty && identity.product ? (
          <span className="min-w-0 truncate text-xs font-medium">{identity.product}</span>
        ) : null}
      </div>

      {open ? (
        <div id={`${uid}-panel`} className="space-y-5 border-t border-border/60 px-4 py-4">
          {/*
            The presets first, and labelled as examples rather than as
            starting points. The blank-page problem here is not "what do I
            type" but "how specific is specific enough", and only an example
            more specific than the reader expected answers that.
          */}
          <fieldset className="border-0 p-0">
            <legend className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Or start from an example
            </legend>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {IDENTITY_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  title={preset.note}
                  onClick={() =>
                    onChange(() => ({
                      product: preset.product,
                      audience: preset.audience,
                      voice: preset.voice,
                      antiPatterns: preset.antiPatterns,
                    }))
                  }
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Sparkles aria-hidden className="h-3 w-3 text-primary" />
                  {preset.name}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Replaces the four fields below. The look is a separate decision and is left alone.
            </p>
          </fieldset>

          {IDENTITY_FIELDS.map((field) => {
            const id = `${uid}-${field.key}`
            const value = identity[field.key]
            return (
              <div key={field.key}>
                <div className="flex items-baseline justify-between gap-2">
                  <label htmlFor={id} className="text-sm font-medium">
                    {field.label}
                  </label>
                  <Counter value={value.length} max={field.max} />
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{field.prompt}</p>
                {field.multiline ? (
                  <Textarea
                    id={id}
                    value={value}
                    maxLength={field.max}
                    rows={3}
                    placeholder={field.placeholder}
                    onChange={(e) => set(field.key, e.target.value)}
                    className="mt-2 text-sm"
                  />
                ) : (
                  <Input
                    id={id}
                    value={value}
                    maxLength={field.max}
                    placeholder={field.placeholder}
                    onChange={(e) => set(field.key, e.target.value)}
                    className="mt-2 text-sm"
                  />
                )}
                <p className="mt-1 text-[11px] text-muted-foreground">{field.why}</p>
              </div>
            )
          })}

          {/* ---- Anti-patterns ------------------------------------- */}
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-medium">Anti-patterns</span>
              <span className="font-mono text-[11px] text-muted-foreground">
                {identity.antiPatterns.length}/{IDENTITY_LIMITS.antiPatterns}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              What it must never do. One rule per row.
            </p>

            {identity.antiPatterns.length ? (
              <ul className="mt-2 space-y-1.5">
                {identity.antiPatterns.map((rule) => (
                  <li
                    key={rule}
                    className="flex items-start gap-2 rounded-lg border border-border/60 bg-background px-2.5 py-1.5"
                  >
                    <span className="min-w-0 flex-1 text-xs">{rule}</span>
                    <button
                      type="button"
                      onClick={() =>
                        onChange((current) => ({
                          ...current,
                          antiPatterns: current.antiPatterns.filter((r) => r !== rule),
                        }))
                      }
                      className="shrink-0 rounded text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <X aria-hidden className="h-3.5 w-3.5" />
                      {/* "Remove" alone gives a screen-reader user eight
                          identical buttons and no way to tell them apart. */}
                      <span className="sr-only">Remove “{rule}”</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            <form
              className="mt-2 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                addRule(draft)
                setDraft('')
              }}
            >
              <label htmlFor={`${uid}-rule`} className="sr-only">
                Add an anti-pattern
              </label>
              <Input
                id={`${uid}-rule`}
                value={draft}
                maxLength={IDENTITY_LIMITS.antiPattern}
                disabled={atCap}
                placeholder={atCap ? 'Eight is the cap' : 'Never use an exclamation mark'}
                onChange={(e) => setDraft(e.target.value)}
                className="text-sm"
              />
              <button
                type="submit"
                disabled={atCap || !draft.trim()}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border px-2.5 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              >
                <Plus aria-hidden className="h-3.5 w-3.5" />
                Add
              </button>
            </form>

            <fieldset className="mt-3 border-0 p-0">
              <legend className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Common ones
              </legend>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {ANTI_PATTERN_SUGGESTIONS.filter(
                  (rule) => !identity.antiPatterns.includes(rule),
                ).map((rule) => (
                  <button
                    key={rule}
                    type="button"
                    disabled={atCap}
                    onClick={() => addRule(rule)}
                    className="rounded-full border border-dashed border-border px-2.5 py-1 text-[11px] transition-colors hover:border-solid hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
                  >
                    + {rule}
                  </button>
                ))}
              </div>
            </fieldset>

            <p className="mt-2 text-[11px] text-muted-foreground">
              These land in the Agent tab as numbered <strong>Never</strong> rules. A
              positive brief is a suggestion a model averages out; a prohibition is
              something it checks against — which is why they are listed separately
              from voice rather than folded into it.
            </p>
          </div>

          {coverage.missing.length > 0 && !coverage.empty ? (
            <p className="text-xs text-muted-foreground">
              Still empty: {coverage.missing.join(', ')}. The document builds without
              them — it just says less.
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
