'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Package,
  Trash2,
  Download,
  FileCode,
  FolderArchive,
  X,
  ExternalLink,
  Eye,
} from 'lucide-react'
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
import { useBundle, type BundleEntry } from '@/hooks/use-bundle'
import { useEffectDetails } from '@/hooks/use-effect-details'
import { customizeCss } from '@/lib/customize'
import {
  buildBundleCss,
  buildBundleHtml,
  buildBundleZip,
  downloadTextFile,
  downloadBlob,
} from '@/lib/bundle-export'
import { cn } from '@/lib/utils'

interface BundleDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Slide-out drawer showing the user's bundle. Lists each saved effect
 * with its customized CSS, lets the user remove individual items or
 * clear all, and download as a single self-contained HTML file or
 * just the concatenated CSS.
 */
export function BundleDrawer({ open, onOpenChange }: BundleDrawerProps) {
  const { entries, remove, clear, count } = useBundle()
  const [zipBusy, setZipBusy] = React.useState(false)

  // The client ships metadata only, so a bundle entry's CSS has to be
  // resolved before it can be previewed or exported. Hand-crafted effects
  // are bundled and resolve synchronously; generated ones are fetched
  // once and cached across drawers. `catalog` stands in for the full
  // EFFECTS array the export builders used to receive — they only ever
  // look up the ids present in `entries`, so the resolved subset is
  // equivalent and 1.6 MB lighter.
  const ids = React.useMemo(() => entries.map((e) => e.effectId), [entries])
  const { effects: catalog, loading } = useEffectDetails(ids)

  const resolved = React.useMemo(
    () =>
      entries
        .map((entry) => {
          const effect = catalog.find((e) => e.id === entry.effectId)
          if (!effect) return null
          const customizedCss = customizeCss(effect.css, entry.opts)
          return { entry, effect, customizedCss }
        })
        .filter((x): x is NonNullable<typeof x> => x !== null),
    [entries, catalog],
  )

  /**
   * Guard the export actions while CSS is still in flight — exporting
   * mid-fetch would silently emit a partial bundle.
   */
  function exportBlocked(): boolean {
    if (resolved.length === 0) {
      toast.error(loading ? 'Still loading effects — try again in a moment' : 'Bundle is empty')
      return true
    }
    if (loading) {
      toast.error('Still loading effects', {
        description: 'Hang on a second so the export includes everything.',
      })
      return true
    }
    return false
  }

  function handleDownloadHtml() {
    if (exportBlocked()) return
    const html = buildBundleHtml(entries, catalog)
    downloadTextFile('cssfx-bundle.html', html, 'text/html')
    toast.success('Downloaded cssfx-bundle.html', {
      description: `${resolved.length} effect${resolved.length === 1 ? '' : 's'} — open in any browser.`,
    })
  }

  function handleDownloadCss() {
    if (exportBlocked()) return
    const css = buildBundleCss(entries, catalog)
    downloadTextFile('cssfx-bundle.css', css, 'text/css')
    toast.success('Downloaded cssfx-bundle.css', {
      description: `${resolved.length} effect${resolved.length === 1 ? '' : 's'} concatenated.`,
    })
  }

  async function handleDownloadZip() {
    if (exportBlocked()) return
    setZipBusy(true)
    try {
      const blob = await buildBundleZip(entries, catalog)
      if (!blob) {
        toast.error('Bundle is empty')
        return
      }
      const stamp = new Date().toISOString().slice(0, 10)
      downloadBlob(`hoverlab-bundle-${stamp}.zip`, blob)
      toast.success(`Downloaded hoverlab-bundle-${stamp}.zip`, {
        description: `${resolved.length} effect${resolved.length === 1 ? '' : 's'} · per-effect HTML + CSS + demo index.html + README.`,
      })
    } catch (err) {
      console.error('ZIP build failed:', err)
      toast.error('Failed to build ZIP', {
        description: 'Please try again — if it persists, use "Download HTML" instead.',
      })
    } finally {
      setZipBusy(false)
    }
  }

  function handleClear() {
    if (resolved.length === 0) return
    clear()
    toast.success('Bundle cleared')
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        {/* Header */}
        <SheetHeader className="flex flex-row items-start justify-between gap-3 border-b border-border/60 p-4">
          <div className="min-w-0">
            <SheetTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4 text-primary" />
              Your bundle
              <Badge variant="secondary" className="font-mono text-[10px]">
                {count}
              </Badge>
            </SheetTitle>
            <SheetDescription className="mt-1 text-xs">
              Save effects here, then download as a single self-contained file.
            </SheetDescription>
          </div>
        </SheetHeader>

        {/* Bundle contents */}
        <div className="fx-no-scrollbar flex-1 overflow-y-auto p-4">
          {resolved.length === 0 ? (
            <div className="mt-12 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Package className="h-5 w-5 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-semibold">Bundle is empty</h3>
              <p className="mx-auto mt-1 max-w-[240px] text-xs text-muted-foreground">
                Click the <span className="font-semibold">+</span> button on any
                effect to add it here. Your bundle persists across sessions.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {resolved.map(({ entry, effect, customizedCss }) => (
                <BundleRow
                  key={entry.effectId}
                  entry={entry}
                  effectName={effect.name}
                  effectCategory={effect.category}
                  effectHtml={effect.html}
                  customizedCss={customizedCss}
                  darkSurface={effect.darkSurface}
                  effectId={effect.id}
                  onRemove={() => {
                    remove(entry.effectId)
                    toast.success(`Removed "${effect.name}" from bundle`)
                  }}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Footer actions */}
        {resolved.length > 0 ? (
          <div className="space-y-2 border-t border-border/60 p-4">
            {/* Primary: ZIP download (most useful — structured archive) */}
            <Button
              size="sm"
              className="h-9 w-full gap-1.5"
              onClick={handleDownloadZip}
              disabled={zipBusy}
            >
              <FolderArchive className="h-4 w-4" />
              {zipBusy ? 'Building ZIP…' : 'Download ZIP'}
            </Button>
            {/* Secondary: single-file exports */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-9 flex-1 gap-1.5"
                onClick={handleDownloadHtml}
              >
                <Download className="h-4 w-4" /> HTML
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-9 flex-1 gap-1.5"
                onClick={handleDownloadCss}
              >
                <FileCode className="h-4 w-4" /> CSS only
              </Button>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-full gap-1.5 text-muted-foreground hover:text-rose-500"
              onClick={handleClear}
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear bundle
            </Button>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

/* ============================================================
 *  BundleRow — single bundle item with mini preview + remove
 * ========================================================== */

interface BundleRowProps {
  entry: BundleEntry
  effectId: string
  effectName: string
  effectCategory: string
  effectHtml: string
  customizedCss: string
  darkSurface?: boolean
  onRemove: () => void
}

let bundlePreviewSeq = 0

function BundleRow({
  entry,
  effectId,
  effectName,
  effectCategory,
  effectHtml,
  customizedCss,
  darkSurface,
  onRemove,
}: BundleRowProps) {
  const [wrapId] = React.useState(() => `fx-bundle-${++bundlePreviewSeq}`)
  // Scope the CSS so multiple previews don't class-collide.
  const scopedCss = React.useMemo(() => {
    return customizedCss.replace(
      /(^|\})\s*([^{}]+)\{/g,
      (_m, brace, selectors) => {
        const scoped = selectors
          .split(',')
          .map((s: string) => `.${wrapId} ${s.trim()}`)
          .join(', ')
        return `${brace} ${scoped} {`
      },
    )
  }, [customizedCss, wrapId])

  const optsSummary = React.useMemo(() => {
    const parts: string[] = []
    if (entry.opts.hue !== 0) parts.push(`hue ${entry.opts.hue}°`)
    if (entry.opts.saturation !== 0) parts.push(`sat ${entry.opts.saturation}%`)
    if (entry.opts.scale !== 1) parts.push(`size ${entry.opts.scale}×`)
    if (entry.opts.speed !== 1) parts.push(`speed ${entry.opts.speed}×`)
    return parts.join(' · ')
  }, [entry.opts])

  return (
    <li className="rounded-lg border border-border/60 bg-card/60 p-2.5">
      <div className="flex items-start gap-2.5">
        {/* Mini preview */}
        <div
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border/40',
            darkSurface ? 'bg-slate-950' : 'bg-muted/40',
          )}
        >
          <style dangerouslySetInnerHTML={{ __html: scopedCss }} />
          <div
            className={wrapId}
            style={{ transform: 'scale(0.4)', transformOrigin: 'center' }}
            dangerouslySetInnerHTML={{ __html: effectHtml }}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1.5">
            <Link
              href={`/effect/${effectId}`}
              className="truncate text-sm font-semibold hover:text-primary"
              title={effectName}
            >
              {effectName}
            </Link>
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remove ${effectName} from bundle`}
              title="Remove from bundle"
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-500"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="text-[9px] font-mono uppercase">
              {effectCategory}
            </Badge>
            {optsSummary ? (
              <span className="font-mono text-[10px] text-primary">{optsSummary}</span>
            ) : (
              <span className="text-[10px] text-muted-foreground">original</span>
            )}
          </div>
        </div>
      </div>
    </li>
  )
}
