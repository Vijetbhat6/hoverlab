'use client'

/**
 * My Remixes rail — horizontal scroll strip showing the user's saved
 * remixes (customized variants of effects). Renders above the effect
 * grid on /library when the user has at least one remix.
 *
 * Each mini card shows: live preview (CSS scoped to a unique wrapper
 * class), effect name, opts summary, "Copy" button, "Open source"
 * link (deep-links to the effect detail page with the same opts in
 * the URL hash so the customize panel opens with the saved state),
 * and a "Delete" (X) button.
 *
 * Hidden when:
 *  - The user has no remixes (don't add an empty rail).
 *  - The user is actively searching or filtering (don't compete with
 *    active sessions — same pattern as the recently-viewed rail).
 */

import * as React from 'react'
import Link from 'next/link'
import { Sparkles, X, Copy, Trash2, Wand2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRemixes, type RemixEntry } from '@/hooks/use-remixes'
import { optsToHash } from '@/lib/customize'
import { cn } from '@/lib/utils'

interface MyRemixesRailProps {
  /** Hide when the user is searching or filtering — pass true then. */
  hidden?: boolean
}

export function MyRemixesRail({ hidden = false }: MyRemixesRailProps) {
  const { entries, remove, clear, count } = useRemixes()

  if (hidden || entries.length === 0) return null

  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Wand2 className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold tracking-tight">
            Your remixes
          </h2>
          <Badge variant="secondary" className="font-mono text-[10px]">
            {count}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Customized effects you saved
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-rose-500"
          onClick={() => {
            clear()
            toast.success('Remixes cleared')
          }}
        >
          <Trash2 className="h-3 w-3" /> Clear
        </Button>
      </div>

      <div className="fx-no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
        {entries.map((entry) => (
          <RemixCard key={entry.id} entry={entry} onRemove={() => {
            remove(entry.id)
            toast.success(`Removed "${entry.effectName}" remix`)
          }} />
        ))}
      </div>
    </section>
  )
}

/* ============================================================
 *  RemixCard — single remix with mini live preview
 * ========================================================== */

interface RemixCardProps {
  entry: RemixEntry
  onRemove: () => void
}

let remixSeq = 0

function RemixCard({ entry, onRemove }: RemixCardProps) {
  const [wrapId] = React.useState(() => `fx-remix-${++remixSeq}`)

  // Scope the CSS so multiple previews don't class-collide.
  const scopedCss = React.useMemo(() => {
    return entry.customizedCss.replace(
      /(^|\})\s*([^{}]+)\{/g,
      (_m, brace: string, selectors: string) => {
        const scoped = selectors
          .split(',')
          .map((s: string) => `.${wrapId} ${s.trim()}`)
          .join(', ')
        return `${brace} ${scoped} {`
      },
    )
  }, [entry.customizedCss, wrapId])

  const optsSummary = React.useMemo(() => {
    const parts: string[] = []
    if (entry.opts.hue !== 0) parts.push(`hue ${entry.opts.hue}°`)
    if (entry.opts.saturation !== 0) parts.push(`sat ${entry.opts.saturation}%`)
    if (entry.opts.scale !== 1) parts.push(`size ${entry.opts.scale}×`)
    if (entry.opts.speed !== 1) parts.push(`speed ${entry.opts.speed}×`)
    return parts.join(' · ') || 'default'
  }, [entry.opts])

  function handleCopy() {
    const snippet = [
      '<!-- HTML -->',
      entry.html.trim(),
      '',
      '/* CSS */',
      entry.customizedCss.trim(),
    ].join('\n')
    void navigator.clipboard
      .writeText(snippet)
      .then(() => {
        toast.success(`Copied "${entry.effectName}" remix`, {
          description: 'HTML + CSS ready to paste.',
        })
        // Record in copy-history via the same custom event the
        // useCopyHistory hook listens for.
        window.dispatchEvent(new CustomEvent('hoverlab:copy-history-changed'))
      })
      .catch(() => {
        toast.error('Clipboard blocked', {
          description: 'Your browser denied clipboard access.',
        })
      })
  }

  // Build a deep-link to the source effect with the same opts in the
  // URL hash so the detail page opens with the customize panel preset
  // to the saved state.
  const hash = optsToHash(entry.opts)
  const detailHref = hash
    ? `/effect/${entry.effectId}#${hash}`
    : `/effect/${entry.effectId}`

  return (
    <div className="group relative flex w-56 shrink-0 flex-col overflow-hidden rounded-xl border border-border/60 bg-card/80 backdrop-blur transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
      {/* Live preview */}
      <div
        className={cn(
          'flex h-28 items-center justify-center overflow-hidden',
          entry.darkSurface ? 'bg-slate-950' : 'bg-muted/30',
        )}
      >
        <style dangerouslySetInnerHTML={{ __html: scopedCss }} />
        <div
          className={cn(wrapId, 'pointer-events-none')}
          style={{ transform: 'scale(0.55)', transformOrigin: 'center' }}
          dangerouslySetInnerHTML={{ __html: entry.html }}
        />
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <div className="flex items-start justify-between gap-1.5">
          <Link
            href={detailHref}
            className="min-w-0 flex-1 truncate text-sm font-semibold hover:text-primary"
            title={`${entry.effectName} — open with these customizations`}
          >
            {entry.effectName}
          </Link>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Delete ${entry.effectName} remix`}
            title="Delete remix"
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-500"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <Badge variant="outline" className="text-[9px] font-mono uppercase tracking-wider">
            {entry.effectCategory}
          </Badge>
          <span className="inline-flex items-center gap-0.5 text-[10px] text-primary">
            <Sparkles className="h-2.5 w-2.5" />
            <span className="font-mono">{optsSummary}</span>
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="mt-1 h-7 gap-1.5 text-xs"
          onClick={handleCopy}
        >
          <Copy className="h-3 w-3" /> Copy
        </Button>
      </div>
    </div>
  )
}
