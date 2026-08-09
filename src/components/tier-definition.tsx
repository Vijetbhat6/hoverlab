/**
 * TierDefinition — one sentence saying what the rung actually is.
 *
 * "Effect", "block", "page", "template" are this site's vocabulary, not the
 * visitor's. Someone arriving on /blocks from a search for "react pricing
 * section" has never read the ladder metaphor and has no way to know whether
 * a block is a component, a file, a template or a paid thing — and the hero
 * copy underneath doesn't tell them, because hero copy is written for people
 * who already know what they are looking at.
 *
 * So: one plain line, above the marketing, in concrete nouns. No jargon, no
 * comparison to the neighbouring tiers (a definition that requires knowing
 * the other three definitions is not a definition), and short enough that
 * someone who already knows can skip it without effort.
 *
 * Deliberately not a dismissible banner. It costs a returning visitor one
 * line of vertical space, which is cheaper than the state to remember it.
 */

import { Info } from 'lucide-react'

/** The canonical one-liner per rung. Edited here, nowhere else. */
export const TIER_DEFINITIONS = {
  effect:
    'An effect is one small piece of CSS that changes how a single element looks or moves — a glowing button, a shimmer, a hover lift.',
  block:
    'A block is one finished section of a page — a pricing table, a hero, a footer.',
  page: 'A page is a full screen of blocks in the right order — the whole pricing page, not just the table.',
  template:
    'A template is a project you can run — every page, wired together, with routing and a theme already set up.',
} as const

export type TierName = keyof typeof TIER_DEFINITIONS

export function TierDefinition({
  tier,
  className,
}: {
  tier: TierName
  className?: string
}) {
  return (
    <p
      className={
        'mx-auto flex max-w-2xl items-start gap-2.5 rounded-xl border border-border/50 bg-muted/20 px-4 py-2.5 text-left text-sm leading-relaxed text-muted-foreground' +
        (className ? ` ${className}` : '')
      }
    >
      <Info aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-primary/70" />
      <span>{TIER_DEFINITIONS[tier]}</span>
    </p>
  )
}
