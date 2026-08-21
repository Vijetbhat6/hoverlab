'use client'

/**
 * EffectSpecCard — what's in the box, and what it works with.
 *
 * The remaining half of the product-page anatomy borrowed from UI8. A
 * marketplace listing answers two questions above the fold that a catalog
 * page usually leaves implicit: what exactly do I get for this, and will
 * it work with what I already use. Both were answerable here only by
 * scrolling to the export tabs and reading them.
 *
 * Every line is derived rather than authored. `FRAMEWORKS` is the same
 * table the export panel renders from, so the count cannot drift from the
 * formats actually offered; the CLI and DNA commands take the effect's own
 * id; the line count comes off the CSS. Nothing here is per-effect
 * marketing copy that 835 pages would have to keep true.
 *
 * A note on the compatibility row, since a badge that is identical on
 * every page looks like decoration: it is. Per-page it carries no
 * information, because a pure-CSS effect works everywhere by construction
 * — which is exactly the claim. The row is for the first-time reader
 * deciding whether this catalog is for their stack at all, and that reader
 * is on some effect page, not on a marketing page. It stops being
 * justified the moment any of these becomes conditional; at that point it
 * needs real per-effect data, not a longer list.
 *
 * Deliberately absent: a "last updated" line, which UI8 carries and this
 * cannot — no artifact in the catalog has a date on it. See the note in
 * lib/effect-index.ts. Also absent: a license summary, because the repo
 * has no LICENSE for catalog content to summarise.
 */

import * as React from 'react'
import Link from 'next/link'
import { Check, Terminal } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { FRAMEWORKS } from '@/lib/export'
import type { Effect } from '@/lib/effects'

/**
 * What the page hands over, in the order someone evaluates it: the thing
 * itself, the shapes it comes in, then the two ways to take it without
 * using the page at all.
 */
function includedItems(cssLines: number): React.ReactNode[] {
  return [
    <>
      Copy-ready HTML and CSS —{' '}
      <strong className="font-semibold text-foreground">
        {cssLines} {cssLines === 1 ? 'line' : 'lines'}
      </strong>
      , no build step
    </>,
    <>
      <strong className="font-semibold text-foreground">{FRAMEWORKS.length} export formats</strong>{' '}
      — {FRAMEWORKS.map((f) => f.label).join(', ')}
    </>,
    <>Live customization for hue, saturation, scale and speed</>,
    <>
      Editable in the{' '}
      <Link href="/playground" className="underline underline-offset-2 hover:text-foreground">
        playground
      </Link>
    </>,
  ]
}

/**
 * The two ways to take this without the page.
 *
 * Both commands are real and both accept an effect id: `add` writes the
 * files, `dna` prints the design system as an agent-readable brief —
 * /api/v1/dna/{id} resolves any catalog id, effects included.
 */
function commands(effect: Effect): Array<{ command: string; hint: string }> {
  return [
    { command: `npx hoverlab add ${effect.id}`, hint: 'writes it into your project' },
    { command: `npx hoverlab dna ${effect.id}`, hint: 'hands it to your agent' },
  ]
}

/** Grouped so the row reads as two claims rather than eight logos. */
const WORKS_WITH: Array<{ group: string; items: string[] }> = [
  { group: 'Frameworks', items: ['Plain HTML', 'React', 'Vue', 'Svelte', 'Tailwind', 'styled-components'] },
  // get_effect and match_design are both live MCP tools; match_design is
  // what the Figma pairing runs through. See app/docs/mcp.
  { group: 'Agents', items: ['CLI', 'MCP', 'Figma'] },
]

export function EffectSpecCard({ effect }: { effect: Effect }) {
  const cssLines = React.useMemo(() => effect.css.trim().split('\n').length, [effect.css])

  return (
    <div className="rounded-lg border border-border/60 bg-card/60 p-4">
      <h2 className="mb-3 text-sm font-semibold tracking-tight">What&apos;s included</h2>

      <ul className="space-y-1.5">
        {includedItems(cssLines).map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <Check aria-hidden className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <ul className="mt-3 space-y-1.5">
        {commands(effect).map(({ command, hint }) => (
          <li key={command}>
            <div className="flex items-center gap-1.5 overflow-x-auto rounded-md border border-border/60 bg-muted/40 px-2 py-1.5">
              <Terminal aria-hidden className="h-3 w-3 shrink-0 text-muted-foreground" />
              <code className="whitespace-nowrap font-mono text-[11px] text-foreground">{command}</code>
            </div>
            <span className="mt-0.5 block text-[10px] text-muted-foreground">{hint}</span>
          </li>
        ))}
      </ul>

      <h3 className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Works with
      </h3>
      <div className="space-y-2">
        {WORKS_WITH.map(({ group, items }) => (
          <div key={group} className="flex flex-wrap items-center gap-1">
            <span className="mr-0.5 text-[10px] uppercase tracking-wider text-muted-foreground/70">
              {group}
            </span>
            {items.map((item) => (
              <Badge key={item} variant="outline" className="px-1.5 text-[10px] font-medium">
                {item}
              </Badge>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
