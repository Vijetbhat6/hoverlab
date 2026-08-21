'use client'

/**
 * EffectCard — one tile in the /library grid.
 *
 * This card used to be the detail page, 24 times over. Measured at
 * 1440×900 it was 392 × 876 px and carried a category badge, four icon
 * actions, a title, a description, a live preview, a Code/Customize tab
 * bar, a markup.html pane and a styles.css pane: eleven buttons and four
 * code panes per tile. One row filled the viewport, the 24-card grid ran
 * to 7,412 px, and pagination was the only thing making the page
 * survivable. A grid whose every tile is a full workbench is not a grid;
 * it is a list of documents.
 *
 * So the card is now a card:
 *
 *   live preview, fixed height
 *   ── name ─────────────── tier ──
 *   ── category ────────── copy ──
 *
 * Exactly two metadata lines, in fixed positions, so the eye can track a
 * column rather than re-reading each tile's layout. Everything that left
 * — the code panes, the customization sliders, compare, insights — is on
 * `/effect/[slug]`, which already shipped all of it. The grid was
 * duplicating the detail page instead of leading to it.
 *
 * What deliberately stayed:
 *
 *  - The live preview. This is the whole differentiator; a marketplace
 *    shows a JPEG its authors uploaded, and cannot show the running
 *    thing. The preview keeps `PEEK_CLASS`, so hovering anywhere on the
 *    card plays the effect's hover state.
 *  - Copy. It sits where a marketplace card puts the price, because it is
 *    the same thing: what you came to the grid to get. Removing it would
 *    have traded a scroll problem for an extra click on the core loop.
 *  - Save / bundle / compare / open, as an overlay revealed on hover —
 *    the wishlist-button pattern. They are always visible where hover
 *    does not exist, since "reveal on hover" is a synonym for "gone" on
 *    a touch screen.
 */

import * as React from 'react'
import Link from 'next/link'
import { Check, Copy, ExternalLink, Heart, Package, Scale } from 'lucide-react'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { IconAction } from '@/components/icon-action'
import { hoverPeekCss, PEEK_CLASS } from '@/lib/hover-peek-css'
import { useFavorites } from '@/hooks/use-favorites'
import { useBundle } from '@/hooks/use-bundle'
import { useCompare } from '@/hooks/use-compare'
import { useCopyHistory } from '@/hooks/use-copy-history'
import { reportUsage } from '@/lib/report-usage'
import { DEFAULT_CUSTOMIZATION } from '@/lib/customize'
import { cn } from '@/lib/utils'
import type { Effect } from '@/lib/effects'

interface EffectCardProps {
  effect: Effect
}

/**
 * Build a single snippet that contains both the HTML markup and the CSS
 * rules, with clear section comments so the user can paste it into a
 * scratch file and immediately understand the structure.
 */
function buildCombinedSnippet(effect: Effect): string {
  return [
    '<!-- HTML -->',
    effect.html.trim(),
    '',
    '/* CSS */',
    effect.css.trim(),
  ].join('\n')
}

export function EffectCard({ effect }: EffectCardProps) {
  const surfaceDark = effect.darkSurface
  const previewRef = React.useRef<HTMLDivElement>(null)
  const { has, toggle } = useFavorites()
  const isFav = has(effect.id)
  const { has: hasBundle, toggle: toggleBundle } = useBundle()
  const inBundle = hasBundle(effect.id)
  const { has: hasCompare, toggle: toggleCompare, isFull: compareFull } = useCompare()
  const inCompare = hasCompare(effect.id)
  const { record } = useCopyHistory()
  const [copied, setCopied] = React.useState(false)
  const copiedTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  /*
   * The rules that play the effect's hover state when the pointer is
   * anywhere on the card, derived from the catalog CSS. The card no
   * longer customizes, so this is computed once per effect rather than
   * on every slider drag — customization moved to the detail page, and
   * with it the reason this had to react to anything.
   */
  const peekCss = React.useMemo(() => hoverPeekCss(effect.css), [effect.css])

  // For the spotlight card: track cursor and set CSS vars.
  React.useEffect(() => {
    const root = previewRef.current
    if (!root) return
    const target = root.querySelector<HTMLElement>('[data-spotlight]')
    if (!target) return

    const handler = (e: MouseEvent) => {
      const rect = target.getBoundingClientRect()
      target.style.setProperty('--fx-x', `${e.clientX - rect.left}px`)
      target.style.setProperty('--fx-y', `${e.clientY - rect.top}px`)
    }
    target.addEventListener('mousemove', handler)
    return () => target.removeEventListener('mousemove', handler)
  }, [effect.id])

  React.useEffect(
    () => () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current)
    },
    [],
  )

  const snippet = React.useMemo(() => buildCombinedSnippet(effect), [effect])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(snippet)
      setCopied(true)
      if (copiedTimer.current) clearTimeout(copiedTimer.current)
      copiedTimer.current = setTimeout(() => setCopied(false), 1600)
      record({ id: effect.id, name: effect.name, category: effect.category })
      // Feeds the server-side counter that ranks /api/v1/trending. This is
      // the grid's only copy affordance and likely the most-used one in the
      // app, so leaving it unreported would rank the catalog by every copy
      // path except the busiest.
      reportUsage(effect.id, 'copy')
      toast.success(`Copied "${effect.name}"`, {
        description: 'HTML and CSS are both on your clipboard.',
      })
    } catch {
      toast.error('Could not reach the clipboard', {
        description: 'Open the effect page and copy from the code pane there.',
      })
    }
  }

  return (
    <Card
      className={cn(
        PEEK_CLASS,
        'group relative flex flex-col overflow-hidden border-border/60 bg-card/80 backdrop-blur transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5',
        isFav && 'border-rose-400/60 ring-1 ring-rose-400/30',
      )}
    >
      {/*
        The effect's CSS plus its peek rules. Mounted and unmounted with
        the card, so only the 24 visible cards have their CSS in the DOM
        at any time.
      */}
      <style dangerouslySetInnerHTML={{ __html: `${effect.css}\n${peekCss}` }} />

      {/* ---- the live preview, at a fixed height ---- */}
      <div className="relative">
        <div
          ref={previewRef}
          className={cn(
            'flex h-40 items-center justify-center overflow-hidden p-4',
            surfaceDark ? 'bg-slate-950' : effect.previewClass ?? 'bg-muted/30',
          )}
          dangerouslySetInnerHTML={{ __html: effect.html }}
        />

        {/*
          Wishlist-style overlay. `hover:none` keeps it permanently
          visible on touch, where there is no hover to reveal it with.
        */}
        <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 transition-opacity duration-200 focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100">
          <IconAction
            href={`/effect/${effect.id}`}
            label="Open the full page for this effect"
            icon={<ExternalLink aria-hidden className="h-3.5 w-3.5" />}
          />
          <IconAction
            label={inCompare ? 'Remove from compare' : 'Add to compare'}
            icon={<Scale aria-hidden className="h-3.5 w-3.5" />}
            pressed={inCompare}
            disabled={compareFull && !inCompare}
            onClick={() => {
              const result = toggleCompare({
                id: effect.id,
                name: effect.name,
                category: effect.category,
              })
              if (result === 'added') {
                toast.success(`Added "${effect.name}" to compare`)
              } else if (result === 'full') {
                toast.error('Compare is full', {
                  description: 'Remove an effect from compare to add another.',
                })
              }
            }}
          />
          <IconAction
            label={inBundle ? 'Remove from bundle' : 'Add to bundle'}
            icon={
              inBundle ? (
                <Check aria-hidden className="h-3.5 w-3.5" />
              ) : (
                <Package aria-hidden className="h-3.5 w-3.5" />
              )
            }
            pressed={inBundle}
            onClick={() =>
              toggleBundle(
                { id: effect.id, name: effect.name, category: effect.category },
                DEFAULT_CUSTOMIZATION,
              )
            }
          />
          <IconAction
            label={isFav ? 'Remove from favorites' : 'Save to favorites'}
            tone="rose"
            icon={
              <Heart
                aria-hidden
                className={cn('h-3.5 w-3.5 transition-all', isFav && 'scale-110 fill-current')}
              />
            }
            pressed={isFav}
            onClick={() => toggle(effect.id)}
          />
        </div>
      </div>

      {/* ---- line one: name · tier ---- */}
      <div className="flex flex-col gap-1 border-t border-border/60 px-3 py-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="min-w-0 truncate text-sm font-semibold tracking-tight">
            <Link
              href={`/effect/${effect.id}`}
              className="rounded-sm transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              {effect.name}
            </Link>
          </h3>
          {/*
            Where a marketplace prints the price. Every effect is free, so
            the slot carries the only distinction the catalog draws
            between them — and it stays occupied either way, because a
            column of prices you can scan down only works if the number
            is always in the same place.
          */}
          {effect.featured ? (
            <Badge className="shrink-0 bg-amber-500/15 px-1.5 text-[10px] font-semibold text-amber-600 hover:bg-amber-500/15 dark:text-amber-400">
              Featured
            </Badge>
          ) : (
            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Free
            </span>
          )}
        </div>

        {/* ---- line two: category · copy ---- */}
        <div className="flex items-center justify-between gap-2">
          <Link
            href={`/library?filter=${encodeURIComponent(effect.category)}`}
            className="min-w-0 truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            {effect.category}
          </Link>
          <button
            type="button"
            onClick={handleCopy}
            className={cn(
              'inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border px-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              copied
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {copied ? (
              <Check aria-hidden className="h-3.5 w-3.5" />
            ) : (
              <Copy aria-hidden className="h-3.5 w-3.5" />
            )}
            {copied ? 'Copied' : 'Copy'}
            <span className="sr-only">the HTML and CSS for {effect.name}</span>
          </button>
        </div>
      </div>
    </Card>
  )
}
