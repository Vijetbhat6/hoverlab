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
import { levelOf, LEVEL_LABEL } from '@/lib/artifact-types'
import { useEffectDetails } from '@/hooks/use-effect-details'
import { useArtifactFiles } from '@/hooks/use-artifact-files'
import { track } from '@/lib/analytics'
import { customizeCss, DEFAULT_CUSTOMIZATION } from '@/lib/customize'
import {
  buildBundleCss,
  buildBundleHtml,
  buildBundleZip,
  downloadTextFile,
  downloadBlob,
} from '@/lib/bundle-export'
import { FRAMEWORKS, type FrameworkId } from '@/lib/export'
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
  /* Which framework the ZIP's per-effect sources are generated in. 'css'
   * keeps the archive byte-identical to what it has always produced. */
  const [zipFramework, setZipFramework] = React.useState<FrameworkId>('css')

  // The client ships metadata only, so a bundle entry's CSS has to be
  // resolved before it can be previewed or exported. Hand-crafted effects
  // are bundled and resolve synchronously; generated ones are fetched
  // once and cached across drawers. `catalog` stands in for the full
  // EFFECTS array the export builders used to receive — they only ever
  // look up the ids present in `entries`, so the resolved subset is
  // equivalent and 1.6 MB lighter.
  // Split by rung before resolving. Only effects go to the effect batch
  // endpoint; asking it for a block id would return nothing and quietly
  // drop the row.
  const effectEntries = React.useMemo(
    () => entries.filter((e) => levelOf(e) === 'effect'),
    [entries],
  )
  const artifactEntries = React.useMemo(
    () => entries.filter((e) => levelOf(e) !== 'effect'),
    [entries],
  )

  const ids = React.useMemo(() => effectEntries.map((e) => e.id), [effectEntries])
  const { effects: catalog, loading: effectsLoading } = useEffectDetails(ids)

  const artifactIds = React.useMemo(
    () => artifactEntries.map((e) => e.id),
    [artifactEntries],
  )
  const { artifacts, loading: artifactsLoading } = useArtifactFiles(artifactIds)

  const loading = effectsLoading || artifactsLoading

  const resolved = React.useMemo(
    () =>
      effectEntries
        .map((entry) => {
          const effect = catalog.find((e) => e.id === entry.id)
          if (!effect) return null
          const customizedCss = customizeCss(effect.css, entry.opts ?? DEFAULT_CUSTOMIZATION)
          return { entry, effect, customizedCss }
        })
        .filter((x): x is NonNullable<typeof x> => x !== null),
    [effectEntries, catalog],
  )

  /**
   * Guard the export actions while CSS is still in flight — exporting
   * mid-fetch would silently emit a partial bundle.
   */
  function exportBlocked(): boolean {
    if (resolved.length === 0 && artifacts.length === 0) {
      toast.error(loading ? 'Still loading — try again in a moment' : 'Bundle is empty')
      return true
    }
    if (loading) {
      toast.error('Still loading', {
        description: 'Hang on a second so the export includes everything.',
      })
      return true
    }
    return false
  }

  /**
   * The HTML and CSS exports are effect-only formats — a single stylesheet
   * cannot carry a React file tree. Blocked outright when the bundle holds
   * nothing else, and otherwise allowed with a note about what was left
   * out, because silently emitting a file missing half the bundle is the
   * worse failure.
   */
  function flatExportBlocked(): boolean {
    if (exportBlocked()) return true
    if (resolved.length === 0) {
      toast.error('Nothing to export in this format', {
        description: 'Blocks, pages and templates are files — use Download ZIP.',
      })
      return true
    }
    return false
  }

  /** Note appended to a flat export's toast when artifacts were skipped. */
  function skippedNote(): string {
    return artifacts.length > 0
      ? ` ${artifacts.length} file-based item${artifacts.length === 1 ? '' : 's'} omitted — use ZIP.`
      : ''
  }

  function handleDownloadHtml() {
    if (flatExportBlocked()) return
    const html = buildBundleHtml(entries, catalog)
    track('bundle_exported', { format: 'html', effect_count: resolved.length })
    downloadTextFile('cssfx-bundle.html', html, 'text/html')
    toast.success('Downloaded cssfx-bundle.html', {
      description: `${resolved.length} effect${resolved.length === 1 ? '' : 's'} — open in any browser.${skippedNote()}`,
    })
  }

  function handleDownloadCss() {
    if (flatExportBlocked()) return
    const css = buildBundleCss(entries, catalog)
    track('bundle_exported', { format: 'css', effect_count: resolved.length })
    downloadTextFile('cssfx-bundle.css', css, 'text/css')
    toast.success('Downloaded cssfx-bundle.css', {
      description: `${resolved.length} effect${resolved.length === 1 ? '' : 's'} concatenated.${skippedNote()}`,
    })
  }

  async function handleDownloadZip() {
    if (exportBlocked()) return
    setZipBusy(true)
    try {
      const blob = await buildBundleZip(entries, catalog, zipFramework, artifacts)
      if (!blob) {
        toast.error('Bundle is empty')
        return
      }
      track('bundle_exported', {
        format: 'zip',
        effect_count: resolved.length,
        framework: zipFramework,
      })
      const stamp = new Date().toISOString().slice(0, 10)
      downloadBlob(`hoverlab-bundle-${stamp}.zip`, blob)
      const label = FRAMEWORKS.find((f) => f.id === zipFramework)?.label ?? zipFramework
      toast.success(`Downloaded hoverlab-bundle-${stamp}.zip`, {
        description: `${resolved.length} effect${resolved.length === 1 ? '' : 's'} as ${label}${artifacts.length ? ` · ${artifacts.length} block/page/template` : ''} · demo index.html + README.`,
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
    if (count === 0) return
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
          {count === 0 ? (
            <div className="mt-12 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Package className="h-5 w-5 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-semibold">Bundle is empty</h3>
              <p className="mx-auto mt-1 max-w-[240px] text-xs text-muted-foreground">
                Click the <span className="font-semibold">+</span> button on any
                effect, block, page or template to add it here. Your bundle
                persists across sessions.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {/* Blocks, pages and templates first — they are the heavier
                  things in a bundle and the ones a visitor is least likely
                  to expect to find here. Rendered from the entry rather than
                  the fetched payload so a row appears immediately, before
                  its files land. */}
              {artifactEntries.map((entry) => (
                <ArtifactRow
                  key={entry.id}
                  entry={entry}
                  fileCount={artifacts.find((a) => a.id === entry.id)?.files.length}
                  onRemove={() => {
                    remove(entry.id)
                    toast.success(`Removed "${entry.name ?? entry.id}" from bundle`)
                  }}
                />
              ))}

              {resolved.map(({ entry, effect, customizedCss }) => (
                <BundleRow
                  key={entry.id}
                  entry={entry}
                  effectName={effect.name}
                  effectCategory={effect.category}
                  effectHtml={effect.html}
                  customizedCss={customizedCss}
                  darkSurface={effect.darkSurface}
                  effectId={effect.id}
                  onRemove={() => {
                    remove(entry.id)
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
            {/* Which framework the archive's per-effect sources use. Sits
                above the ZIP button because it changes what that button
                produces. */}
            <div className="space-y-1.5">
              <label
                htmlFor="bundle-zip-framework"
                className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
              >
                Export as
              </label>
              <select
                id="bundle-zip-framework"
                value={zipFramework}
                onChange={(e) => setZipFramework(e.target.value as FrameworkId)}
                className="h-9 w-full rounded-md border border-border/60 bg-background px-2 text-sm outline-none transition-colors focus-visible:border-primary/50"
              >
                {FRAMEWORKS.map((meta) => (
                  <option key={meta.id} value={meta.id}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </div>
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

/**
 * A block, page or template in the bundle.
 *
 * No preview surface, unlike `BundleRow`. Rendering one would mean pulling
 * the block registry — every block component and its imports — into the
 * drawer's bundle, on every page the drawer is mounted on, to draw a
 * thumbnail nobody opened the drawer to look at. The row names what it is
 * and links to the page that does render it.
 */
function ArtifactRow({
  entry,
  fileCount,
  onRemove,
}: {
  entry: BundleEntry
  /** Absent while the payload is still in flight. */
  fileCount?: number
  onRemove: () => void
}) {
  const level = levelOf(entry)

  return (
    <li className="rounded-lg border border-border/60 bg-card/60 p-2.5">
      <div className="flex items-start gap-2.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-[10px] font-bold uppercase tracking-wide text-primary">
          {LEVEL_LABEL[level].one.slice(0, 4)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h4 className="truncate text-sm font-semibold">{entry.name ?? entry.id}</h4>
            <Badge variant="secondary" className="shrink-0 text-[10px]">
              {LEVEL_LABEL[level].one}
            </Badge>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {entry.category ? `${entry.category} · ` : ''}
            {fileCount === undefined
              ? 'Loading files…'
              : `${fileCount} file${fileCount === 1 ? '' : 's'}`}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
            <Link href={`/${level}/${entry.id}`} title="Open detail page">
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={onRemove}
            title="Remove from bundle"
            aria-label={`Remove ${entry.name ?? entry.id} from bundle`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </li>
  )
}

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
    const opts = entry.opts ?? DEFAULT_CUSTOMIZATION
    const parts: string[] = []
    if (opts.hue !== 0) parts.push(`hue ${opts.hue}°`)
    if (opts.saturation !== 0) parts.push(`sat ${opts.saturation}%`)
    if (opts.scale !== 1) parts.push(`size ${opts.scale}×`)
    if (opts.speed !== 1) parts.push(`speed ${opts.speed}×`)
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
