'use client'

/**
 * The knobs — a block rendered live with props the reader is changing, and
 * the JSX call that reproduces what they are looking at.
 *
 * ── HOW THIS GOT BUILT WITHOUT BREAKING THE REGISTRY ────────────────────
 *
 * `props-table.ts` argued that a playground was not worth inverting
 * `blocks/registry.tsx` for, and it was right: that map holds ELEMENTS on
 * purpose, so their identity is stable, and every preview in the catalog
 * comes out of it. Nothing here changes that. A second, generated map —
 * `playground-registry.ts` — holds component TYPES, lazily, and is read by
 * this component and nothing else. The trade the old comment refused is
 * still refused; this pays a different price instead, which is one more
 * generated file that cannot drift because it derives from the same
 * verified JSON the builder does.
 *
 * ── WHY IT LOADS ON CLICK ───────────────────────────────────────────────
 *
 * The block's source enters the browser only when someone opens the panel.
 * A detail page that eagerly imported its own block would put 200-odd lines
 * of component into the client graph of all 250 pages to serve the readers
 * who want to drag a slider. Closed, this costs a button.
 *
 * ── WHY THE PREVIEW ABOVE STAYS ─────────────────────────────────────────
 *
 * The page's main preview is still the server-rendered one out of the
 * element registry, and it is still what a crawler reads and what the
 * screenshot script captures. This panel is a second, opt-in rendering of
 * the same component — not a replacement for the first — so the block a
 * reader sees on arrival never depends on client JavaScript having run.
 */

import * as React from 'react'
import { Check, Copy, RotateCcw, SlidersHorizontal } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getPlaygroundBlock } from '@/lib/blocks/playground-registry'
import { jsxCall, type Knob } from '@/lib/blocks/props-knobs'
import { reportUsage } from '@/lib/report-usage'

export function BlockPlayground({
  blockId,
  exportName,
  knobs,
  /** Props the registry hands this block for its preview, e.g. `embedded`. */
  fixedProps,
}: {
  blockId: string
  exportName: string
  knobs: Knob[]
  fixedProps?: Record<string, unknown>
}) {
  const [open, setOpen] = React.useState(false)
  const [values, setValues] = React.useState<Record<string, unknown>>(() =>
    Object.fromEntries(knobs.map((knob) => [knob.name, knob.value])),
  )
  const [copied, setCopied] = React.useState(false)

  const Block = getPlaygroundBlock(blockId)
  const dirty = knobs.some((knob) => values[knob.name] !== knob.value)
  const call = jsxCall(exportName, knobs, values)

  // No knobs, or a block with no entry in the generated map. Both mean the
  // props table below is the honest answer to "what can I change?", and a
  // panel that opened onto nothing would be worse than no panel.
  if (knobs.length === 0 || !Block) return null

  function set(name: string, value: unknown) {
    setValues((current) => ({ ...current, [name]: value }))
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(call)
      setCopied(true)
      // The same intent as copying the source: this is the line they are
      // about to paste.
      reportUsage(blockId, 'copy')
      setTimeout(() => setCopied(false), 2000)
      toast.success('Copied the call', {
        description: dirty
          ? 'Only the props you changed are in it.'
          : 'This block needs no props at all.',
      })
    } catch {
      toast.error('Copy failed — select the call and copy it by hand.')
    }
  }

  return (
    <section className="mt-12">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        <SlidersHorizontal aria-hidden className="h-4 w-4" />
        Customize
      </h2>
      <p className="mb-4 max-w-2xl text-sm text-muted-foreground">
        {knobs.length} of this block&rsquo;s props are simple enough to drive
        from here. Change them and the block below re-renders — it is the same
        component whose source is above, not a mock of it. Everything else it
        accepts is in the table underneath.
      </p>

      {!open ? (
        <Button variant="outline" onClick={() => setOpen(true)}>
          <SlidersHorizontal aria-hidden className="me-2 h-4 w-4" />
          Open the controls
        </Button>
      ) : (
        <div className="rounded-xl border border-border">
          <div className="grid gap-4 border-b border-border bg-muted/30 p-4 sm:grid-cols-2">
            {knobs.map((knob) => (
              <KnobRow
                key={knob.name}
                knob={knob}
                value={values[knob.name]}
                onChange={(next) => set(knob.name, next)}
              />
            ))}
          </div>

          {/*
            The live thing. `fixedProps` first so a reader's values win, and
            so an overlay block keeps the `embedded` prop that is the only
            reason it can be shown in place at all.

            ── WHY createElement AND NOT <Block /> ──────────────────────

            Written as JSX this is `react-hooks/static-components`, which
            fires on any component value obtained during a render: it
            cannot tell a module-level map from one rebuilt every time, and
            a component whose identity changes remounts and drops its
            state. That rule is why `blocks/registry.tsx` holds elements,
            and the warning is worth taking seriously.

            Here the identity genuinely is stable. `PLAYGROUND_BLOCKS` is a
            module-level constant built once at import; each entry is a
            single `dynamic()` call evaluated at module load, not per
            render; nothing mutates it. So for a given `blockId` this
            returns the very same component object on every render, and the
            only time it changes is when `blockId` does — a different block,
            which SHOULD mount fresh.

            `createElement` is that invariant written in the form the rule
            can accept. It is not a way around the rule: turn this back into
            `<Block … />` and the build fails, which is the point — there
            are no eslint-disable directives anywhere in this tree and this
            is not the place to add the first one.
          */}
          <div className="overflow-x-auto">
            {React.createElement(Block, { ...fixedProps, ...values })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/30 p-4">
            <code className="min-w-0 flex-1 whitespace-pre-wrap break-all font-mono text-xs text-muted-foreground">
              {call}
            </code>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setValues(Object.fromEntries(knobs.map((k) => [k.name, k.value])))
                }
                disabled={!dirty}
              >
                <RotateCcw aria-hidden className="me-1.5 h-3.5 w-3.5" />
                Reset
              </Button>
              <Button size="sm" onClick={copy}>
                {copied ? (
                  <Check aria-hidden className="me-1.5 h-3.5 w-3.5" />
                ) : (
                  <Copy aria-hidden className="me-1.5 h-3.5 w-3.5" />
                )}
                {copied ? 'Copied' : 'Copy the call'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

/**
 * One control.
 *
 * Every kind labels itself with `htmlFor`/`id` rather than wrapping, so the
 * name is announced with the control and the description is tied to it by
 * `aria-describedby` — these are the same props the table below names, and
 * a control announced as a bare textbox would be the worse half of the two.
 */
function KnobRow({
  knob,
  value,
  onChange,
}: {
  knob: Knob
  value: unknown
  onChange: (value: unknown) => void
}) {
  const id = React.useId()
  const describedBy = knob.description ? `${id}-description` : undefined

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-semibold">
        <code className="font-mono">{knob.name}</code>
      </label>

      {knob.kind === 'string' ? (
        <Input
          id={id}
          aria-describedby={describedBy}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 text-sm"
        />
      ) : null}

      {knob.kind === 'number' ? (
        <Input
          id={id}
          type="number"
          aria-describedby={describedBy}
          value={Number(value ?? 0)}
          onChange={(e) => {
            // An empty box is not zero — it is mid-edit. Holding the last
            // good number keeps the block from collapsing while someone
            // clears the field to type a different one.
            const next = Number(e.target.value)
            if (e.target.value !== '' && Number.isFinite(next)) onChange(next)
          }}
          className="h-8 text-sm"
        />
      ) : null}

      {knob.kind === 'boolean' ? (
        <Switch
          id={id}
          aria-describedby={describedBy}
          checked={Boolean(value)}
          onCheckedChange={onChange}
        />
      ) : null}

      {knob.kind === 'enum' ? (
        <Select value={String(value ?? '')} onValueChange={onChange}>
          <SelectTrigger id={id} aria-describedby={describedBy} className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {knob.options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}

      {knob.description ? (
        <p id={describedBy} className="text-[11px] text-muted-foreground">
          {knob.description}
        </p>
      ) : null}
    </div>
  )
}
