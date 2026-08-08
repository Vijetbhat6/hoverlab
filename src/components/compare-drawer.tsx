'use client'

/**
 * Compare drawer — slide-out panel that renders up to 4 effects
 * side-by-side so the user can pick the best one for their use case.
 *
 * No competitor (CSSFX / uiverse / animista) has this. The closest any of
 * them get is "favorites", which is just a saved list — not a live
 * side-by-side rendering. Compare is for the active decision moment:
 * "I have 3 hover effects in mind, which one looks best on my page?"
 *
 * Each tile renders a live preview (CSS scoped to a unique wrapper class
 * so multiple effects can coexist without class collisions), the effect
 * name + category, a one-click "Copy HTML+CSS" button, a remove (X)
 * button, and a link to the detail page.
 *
 * The drawer is wider than the bundle drawer (max-w-3xl vs max-w-md)
 * because we need horizontal real estate for the side-by-side grid.
 */

import * as React from 'react'
import Link from 'next/link'
import { Scale, X, Copy, ExternalLink, Sparkles, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCompare, type CompareRef } from '@/hooks/use-compare'
import { levelOf, LEVEL_LABEL } from '@/lib/artifact-types'
import type { ResolvedArtifact } from '@/lib/bundle-export'
import type { Effect } from '@/lib/effect-types'
import { useEffectDetails } from '@/hooks/use-effect-details'
import { useArtifactFiles } from '@/hooks/use-artifact-files'
import { cn } from '@/lib/utils'

interface CompareDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CompareDrawer({ open, onOpenChange }: CompareDrawerProps) {
  const { entries, remove, clear, count, isFull, max } = useCompare()

  // Split by rung. Effects resolve to markup + CSS and render as live
  // previews; blocks, pages and templates resolve to a file tree and are
  // compared on their numbers instead — see `ArtifactCompareTile`.
  const effectRefs = React.useMemo(
    () => entries.filter((e) => levelOf(e) === 'effect'),
    [entries],
  )
  const artifactRefs = React.useMemo(
    () => entries.filter((e) => levelOf(e) !== 'effect'),
    [entries],
  )

  // Resolve IDs → full Effect objects (markup + CSS), which the client
  // doesn't ship for generated effects — see `@/lib/effect-index`.
  // Hand-crafted effects resolve synchronously; the rest are fetched
  // once and cached. IDs missing from the catalog are dropped, so a
  // stale localStorage entry can't break the drawer.
  const effectIds = React.useMemo(() => effectRefs.map((e) => e.id), [effectRefs])
  const { effects: resolved, loading: effectsLoading } = useEffectDetails(effectIds)

  const artifactIds = React.useMemo(() => artifactRefs.map((e) => e.id), [artifactRefs])
  const { artifacts, loading: artifactsLoading } = useArtifactFiles(artifactIds)

  const loading = effectsLoading || artifactsLoading

  function handleCopy(effect: Effect) {
    const snippet = [
      '<!-- HTML -->',
      effect.html.trim(),
      '',
      '/* CSS */',
      effect.css.trim(),
    ].join('\n')
    void navigator.clipboard
      .writeText(snippet)
      .then(() => {
        toast.success(`Copied "${effect.name}"`, {
          description: 'HTML + CSS ready to paste.',
        })
        // Record in copy-history via the same custom event the
        // useCopyHistory hook listens for.
        window.dispatchEvent(
          new CustomEvent('hoverlab:copy-history-changed'),
        )
      })
      .catch(() => {
        toast.error('Clipboard blocked', {
          description: 'Your browser denied clipboard access.',
        })
      })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-3xl"
      >
        {/* Header */}
        <SheetHeader className="flex flex-row items-start justify-between gap-3 border-b border-border/60 p-4">
          <div className="min-w-0">
            <SheetTitle className="flex items-center gap-2 text-base">
              <Scale className="h-4 w-4 text-primary" />
              Compare
              <Badge variant="secondary" className="font-mono text-[10px]">
                {count}/{max}
              </Badge>
            </SheetTitle>
            <SheetDescription className="mt-1 text-xs">
              Effects side by side as live previews; blocks and above by what
              they cost you. Pick the one that fits.
            </SheetDescription>
          </div>
        </SheetHeader>

        {/* Grid of effect tiles */}
        <div className="fx-no-scrollbar flex-1 overflow-y-auto p-4">
          {resolved.length === 0 && artifacts.length === 0 && loading && entries.length > 0 ? (
            // Queued items whose payload is still in flight. Without this the
            // drawer would flash the "nothing queued" empty state.
            <LoadingState count={entries.length} />
          ) : resolved.length === 0 && artifacts.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {isFull ? (
                <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                  <Sparkles className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    Compare is full ({max}/{max}). Remove one to add another.
                  </span>
                </div>
              ) : null}
              <div
                className={cn(
                  'grid gap-3',
                  entries.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2',
                )}
              >
                {artifactRefs.map((ref) => (
                  <ArtifactCompareTile
                    key={ref.id}
                    refEntry={ref}
                    resolved={artifacts.find((a) => a.id === ref.id)}
                    onRemove={() => {
                      remove(ref.id)
                      toast.success(`Removed "${ref.name ?? ref.id}" from compare`)
                    }}
                  />
                ))}
                {resolved.map((effect) => (
                  <CompareTile
                    key={effect.id}
                    effect={effect}
                    onCopy={() => handleCopy(effect)}
                    onRemove={() => {
                      remove(effect.id)
                      toast.success(`Removed "${effect.name}" from compare`)
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer actions */}
        {count > 0 ? (
          <div className="space-y-2 border-t border-border/60 p-4">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-full gap-1.5 text-muted-foreground hover:text-rose-500"
              onClick={() => {
                clear()
                toast.success('Compare cleared')
              }}
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear compare
            </Button>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

/* ============================================================
 *  ArtifactCompareTile — a block, page or template
 * ========================================================== */

/**
 * A non-effect entry in the compare grid.
 *
 * Deliberately numbers rather than a live preview. Rendering one would
 * mean importing the block registry — every block component and everything
 * it imports — into the drawer, which is mounted on the library, the
 * playground and every designer tool.
 *
 * It is also the more useful comparison. Two pricing sections both look
 * like pricing sections; what actually decides between them is how much
 * code they are and what they drag in, and those are exactly the numbers a
 * side-by-side is good at.
 */
function ArtifactCompareTile({
  refEntry,
  resolved,
  onRemove,
}: {
  refEntry: CompareRef
  /** Absent while the payload is in flight. */
  resolved?: ResolvedArtifact
  onRemove: () => void
}) {
  const level = levelOf(refEntry)
  const name = resolved?.name ?? refEntry.name ?? refEntry.id

  const lines = resolved
    ? resolved.files.reduce((n, f) => n + f.source.split('\n').length, 0)
    : undefined

  return (
    <div className="flex flex-col rounded-xl border border-border/60 bg-card/60 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-sm font-semibold">{name}</h3>
            <Badge variant="secondary" className="shrink-0 text-[10px]">
              {LEVEL_LABEL[level].one}
            </Badge>
          </div>
          {refEntry.category ? (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {refEntry.category}
            </p>
          ) : null}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-rose-500"
          onClick={onRemove}
          aria-label={`Remove ${name} from compare`}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg border border-border/60 p-2">
          <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Files</dt>
          <dd className="mt-0.5 text-sm font-bold">{resolved?.files.length ?? '—'}</dd>
        </div>
        <div className="rounded-lg border border-border/60 p-2">
          <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Lines</dt>
          <dd className="mt-0.5 text-sm font-bold">{lines ?? '—'}</dd>
        </div>
        <div className="rounded-lg border border-border/60 p-2">
          <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Deps</dt>
          <dd className="mt-0.5 text-sm font-bold">{resolved?.deps.length ?? '—'}</dd>
        </div>
      </dl>

      {resolved && resolved.deps.length > 0 ? (
        <p className="mt-2 truncate text-[11px] text-muted-foreground">
          {resolved.deps.join(', ')}
        </p>
      ) : null}

      <div className="mt-3 flex-1" />

      <Button variant="outline" size="sm" className="h-8 w-full gap-1.5 text-xs" asChild>
        <Link href={`/${level}/${refEntry.id}`}>
          <ExternalLink className="h-3.5 w-3.5" />
          Open {LEVEL_LABEL[level].one.toLowerCase()}
        </Link>
      </Button>
    </div>
  )
}

/* ============================================================
 *  LoadingState — skeleton tiles while queued effects resolve
 * ========================================================== */

/**
 * Shown when effects are queued but their markup + CSS haven't arrived
 * yet. Only generated effects can land here — hand-crafted ones are
 * bundled and resolve on the first render.
 */
function LoadingState({ count }: { count: number }) {
  return (
    <div
      className={cn(
        'grid gap-3',
        count > 1 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1',
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border border-border/60 bg-card/60 p-3"
        >
          <div className="mb-3 h-4 w-1/2 rounded bg-muted" />
          <div className="h-32 rounded-lg bg-muted/60" />
        </div>
      ))}
    </div>
  )
}

/* ============================================================
 *  EmptyState — friendly prompt when nothing is queued
 * ========================================================== */

function EmptyState() {
  return (
    <div className="mt-12 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Scale className="h-5 w-5 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-semibold">Nothing to compare yet</h3>
      <p className="mx-auto mt-1 max-w-[280px] text-xs text-muted-foreground">
        Click the <Scale className="inline h-3 w-3 align-[-2px]" />{' '}
        <span className="font-semibold">Compare</span> button on any effect
        to queue it here. Add 2–4 effects to see them side-by-side and pick
        the winner.
      </p>
    </div>
  )
}

/* ============================================================
 *  CompareTile — single effect card with live preview
 * ========================================================== */

interface CompareTileProps {
  effect: Effect
  onCopy: () => void
  onRemove: () => void
}

let compareTileSeq = 0

function CompareTile({ effect, onCopy, onRemove }: CompareTileProps) {
  const [wrapId] = React.useState(() => `fx-cmp-${++compareTileSeq}`)

  // Scope the CSS so multiple previews don't class-collide.
  // Same approach as bundle-drawer: prefix every selector with the
  // wrapper class. Handles comma-separated selectors and nested rules.
  const scopedCss = React.useMemo(() => {
    return effect.css.replace(
      /(^|\})\s*([^{}]+)\{/g,
      (_m, brace: string, selectors: string) => {
        const scoped = selectors
          .split(',')
          .map((s: string) => `.${wrapId} ${s.trim()}`)
          .join(', ')
        return `${brace} ${scoped} {`
      },
    )
  }, [effect.css, wrapId])

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card/80 backdrop-blur">
      {/* Header: name + remove */}
      <div className="flex items-center justify-between gap-2 border-b border-border/40 px-3 py-2">
        <div className="min-w-0">
          <Link
            href={`/effect/${effect.id}`}
            className="truncate block text-sm font-semibold hover:text-primary"
            title={effect.name}
          >
            {effect.name}
          </Link>
          <Badge
            variant="outline"
            className="mt-0.5 text-[9px] font-mono uppercase tracking-wider"
          >
            {effect.category}
          </Badge>
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${effect.name} from compare`}
          title="Remove from compare"
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-500"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Live preview */}
      <div
        className={cn(
          'flex min-h-[180px] items-center justify-center overflow-hidden p-4',
          effect.darkSurface ? 'bg-slate-950' : 'bg-muted/30',
        )}
      >
        <style dangerouslySetInnerHTML={{ __html: scopedCss }} />
        <div
          className={wrapId}
          dangerouslySetInnerHTML={{ __html: effect.html }}
        />
      </div>

      {/* Footer: copy + open detail */}
      <div className="flex items-center gap-1.5 border-t border-border/40 px-3 py-2">
        <Button
          size="sm"
          variant="outline"
          className="h-8 flex-1 gap-1.5"
          onClick={onCopy}
        >
          <Copy className="h-3.5 w-3.5" /> Copy code
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 shrink-0 gap-1.5"
          asChild
        >
          <Link href={`/effect/${effect.id}`} title="Open detail page">
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="sr-only">Open detail page</span>
          </Link>
        </Button>
      </div>
    </div>
  )
}
