'use client'

/**
 * Copy-history dropdown button for the header.
 *
 * Shows a clipboard icon with a count badge. Clicking opens a small panel
 * listing the last 5 effects the user copied code from — each with a
 * relative timestamp ("5m ago") and a link back to the effect detail page.
 *
 * Pure localStorage via the `useCopyHistory` hook — no cloud sync, no auth
 * required. Useful as ephemeral "what did I just grab?" working memory.
 */

import * as React from 'react'
import Link from 'next/link'
import { ClipboardList, Trash2, ArrowRight } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useCopyHistory, formatRelativeTime } from '@/hooks/use-copy-history'
import { cn } from '@/lib/utils'
import { refHref, refLevel } from '@/lib/artifact-history'
import { LEVEL_LABEL } from '@/lib/artifact-types'

export function CopyHistoryDropdown() {
  const { entries, clear, count } = useCopyHistory()
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/* Matches the Compare and Bundle tray buttons beside it: the word
          from `xl` up, a real tooltip below that. A clipboard glyph on its
          own is not distinguishable from "paste" or "copy" — and this
          button does neither, it lists what you already copied. */}
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={
                count > 0
                  ? `Copy history, ${count} item${count === 1 ? '' : 's'}`
                  : 'Copy history, empty'
              }
              className="relative flex h-9 items-center gap-1.5 rounded-lg px-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ClipboardList aria-hidden className="h-4 w-4" />
              <span className="hidden text-sm font-medium xl:inline">History</span>
              {count > 0 ? (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {count}
                </span>
              ) : null}
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          Copy history — the last 5 things you copied
        </TooltipContent>
      </Tooltip>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 p-0"
      >
        <div className="flex items-center justify-between border-b border-border/60 px-3 py-2.5">
          <div className="flex items-center gap-1.5">
            <ClipboardList className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-semibold">Recently copied</span>
            <span className="text-xs text-muted-foreground">· last 5</span>
          </div>
          {count > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => clear()}
              aria-label="Clear copy history"
            >
              <Trash2 className="h-3 w-3" /> Clear
            </Button>
          ) : null}
        </div>

        {entries.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-muted">
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No copies yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Anything you copy code from will appear here for quick access.
            </p>
          </div>
        ) : (
          <ul className="max-h-[320px] overflow-y-auto py-1">
            {entries.map((entry, idx) => (
              <li key={`${entry.id}-${idx}`}>
                <Link
                  href={refHref(entry)}
                  onClick={() => setOpen(false)}
                  className="group flex items-center gap-3 px-3 py-2 transition-colors hover:bg-muted/60"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">
                        {entry.name}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="truncate">
                        {refLevel(entry) === 'effect'
                          ? entry.category
                          : `${LEVEL_LABEL[refLevel(entry)].one} · ${entry.category}`}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="shrink-0">{formatRelativeTime(entry.copiedAt)}</span>
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  )
}
