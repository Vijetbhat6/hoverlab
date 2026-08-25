'use client'

/**
 * Everything this account has saved from the designer tools, in one place.
 *
 * The tools are the largest acquisition surface on the site and saving is
 * the only reason any of their visitors has to make an account. Until this
 * card existed that reason expired the moment they navigated away: a preset
 * saved on /tools/tokens was visible on /tools/tokens and nowhere else, so
 * "I keep my scales here" was true and completely unevidenced. Someone who
 * had saved six things across four tools saw, on their own account page, a
 * favourites count and a bundle count.
 *
 * So this is a returning-visitor surface first and an admin surface second.
 * It is deliberately a LIST AND A DOOR, not an editor — every row links to
 * the tool that wrote it, because applying a preset means restoring a
 * reducer's state and only that tool knows what its own state means. The
 * one thing offered here that a tool page cannot offer is the cross-tool
 * view: what have I got, where did it come from, and am I near the cap.
 *
 * Deleting is here because this is where someone at the per-account cap
 * actually is. A tool page can only ever show them a fortieth of the
 * problem.
 *
 * The unfiltered GET this reads has been available since the route was
 * written — `handleGet` filters in the handler rather than in the query
 * specifically so the whole-collection read stays available for this page
 * without a second code path.
 */

import * as React from 'react'
import Link from 'next/link'
import { Bookmark, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DESIGNER_TOOLS } from '@/lib/designer-tools'
import { TOOL_PRESET_LIMITS, sortToolPresets, type ToolPreset } from '@/lib/tool-presets'
import { cn } from '@/lib/utils'

/**
 * Show the cap only when someone is close enough for it to be information.
 *
 * A "6 of 200" on an account with six presets is a limit nobody asked
 * about, and reads as a meter on a feature that is supposed to feel free.
 */
const CAP_VISIBLE_FROM = 0.75

/** Tool route to display name, from the registry the hub already renders. */
const TOOL_NAMES: ReadonlyMap<string, string> = new Map(
  DESIGNER_TOOLS.map((t) => [t.href, t.name]),
)

/**
 * What to call a preset's tool.
 *
 * Falls back to the route rather than dropping the row. A preset saved
 * against a tool that was later renamed or merged — /tools/fonts became a
 * redirect into /tools/typography, and presets written before that are
 * still in Firestore — is the user's data, and hiding it because our
 * registry moved on would look exactly like losing it. The route is a worse
 * label than a name and an infinitely better one than nothing.
 */
function toolLabel(tool: string): string {
  return TOOL_NAMES.get(tool) ?? tool
}

function formatSaved(iso: string): string {
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

interface Group {
  tool: string
  label: string
  presets: ToolPreset[]
}

/**
 * Group by tool, tools ordered by how recently each was touched.
 *
 * Not alphabetical, and not registry order. The list answers "where was I",
 * so the tool someone used this morning belongs at the top; a fixed order
 * would bury it under whatever happens to start with A.
 */
function groupByTool(presets: ToolPreset[]): Group[] {
  const byTool = new Map<string, ToolPreset[]>()
  for (const preset of presets) {
    const list = byTool.get(preset.tool)
    if (list) list.push(preset)
    else byTool.set(preset.tool, [preset])
  }

  return [...byTool.entries()]
    .map(([tool, list]) => ({
      tool,
      label: toolLabel(tool),
      presets: sortToolPresets(list),
    }))
    .sort((a, b) =>
      (b.presets[0]?.updatedAt ?? '').localeCompare(a.presets[0]?.updatedAt ?? ''),
    )
}

export function SavedToolPresets({ className }: { className?: string }) {
  const { user } = useAuth()
  const userId = user?.id ?? null

  const [presets, setPresets] = React.useState<ToolPreset[] | null>(null)
  const [deleting, setDeleting] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!userId) {
      setPresets(null)
      return
    }

    let cancelled = false
    void (async () => {
      try {
        const res = await fetch('/api/sync/tool-presets', { cache: 'no-store' })
        if (!res.ok) throw new Error(String(res.status))
        const data = (await res.json()) as { presets?: ToolPreset[] }
        if (!cancelled) setPresets(data.presets ?? [])
      } catch {
        // An empty list, not an error state. This card is one of eight on
        // the page and none of the others can fail visibly either; a red
        // box here for a background fetch nobody triggered teaches the
        // reader that their account is broken when their session is simply
        // stale. The empty copy points at /tools either way.
        if (!cancelled) setPresets([])
      }
    })()

    return () => {
      cancelled = true
    }
  }, [userId])

  async function handleDelete(preset: ToolPreset) {
    setDeleting(preset.id)
    try {
      const res = await fetch(`/api/sync/tool-presets?id=${encodeURIComponent(preset.id)}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error(String(res.status))
      setPresets((current) => (current ?? []).filter((p) => p.id !== preset.id))
      toast.success(`Deleted "${preset.name}".`)
    } catch {
      // A delete IS something they just did, so this one speaks up.
      toast.error('Could not delete that. Try again.')
    } finally {
      setDeleting(null)
    }
  }

  if (!userId) return null

  const loading = presets === null
  const total = presets?.length ?? 0
  const groups = presets ? groupByTool(presets) : []
  const nearCap = total >= TOOL_PRESET_LIMITS.perAccount * CAP_VISIBLE_FROM

  return (
    <Card className={cn('mt-6 border-border/60', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bookmark className="h-4 w-4 text-muted-foreground" />
          Saved from the tools
        </CardTitle>
        <CardDescription>
          {loading
            ? 'Loading…'
            : total === 0
              ? 'Nothing saved yet. Every tool under /tools can keep a named preset on your account — a token set, a spacing scale, a type pairing — and they show up here.'
              : nearCap
                ? `${total} of ${TOOL_PRESET_LIMITS.perAccount} presets across ${groups.length} ${groups.length === 1 ? 'tool' : 'tools'}. Delete a few to keep saving.`
                : `${total} ${total === 1 ? 'preset' : 'presets'} across ${groups.length} ${groups.length === 1 ? 'tool' : 'tools'}. Open a tool to apply one.`}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Fetching your presets…</span>
          </div>
        ) : total === 0 ? (
          <Button asChild variant="outline" size="sm">
            <Link href="/tools">Browse the tools</Link>
          </Button>
        ) : (
          <div className="flex flex-col gap-5">
            {groups.map((group) => (
              <div key={group.tool} className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-3">
                  <Link
                    href={group.tool}
                    className="text-sm font-medium underline-offset-4 hover:underline"
                  >
                    {group.label}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {group.presets.length}
                    {group.presets.length >= TOOL_PRESET_LIMITS.perTool
                      ? ` of ${TOOL_PRESET_LIMITS.perTool} — this tool is full`
                      : ''}
                  </span>
                </div>

                <ul className="flex flex-col divide-y divide-border/60 rounded-lg border border-border/60">
                  {group.presets.map((preset) => (
                    <li
                      key={preset.id}
                      className="flex items-center justify-between gap-3 px-3 py-2"
                    >
                      <div className="min-w-0">
                        {/* The name is the link. Someone scanning this list is
                            looking for a thing they named, not for a tool —
                            the tool heading above already offers that door
                            for anyone who thinks the other way round. */}
                        <Link
                          href={group.tool}
                          className="block truncate text-sm underline-offset-4 hover:underline"
                        >
                          {preset.name}
                        </Link>
                        <span className="text-xs text-muted-foreground">
                          Saved {formatSaved(preset.updatedAt)}
                        </span>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => void handleDelete(preset)}
                        disabled={deleting === preset.id}
                        aria-label={`Delete ${preset.name}`}
                      >
                        {deleting === preset.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
