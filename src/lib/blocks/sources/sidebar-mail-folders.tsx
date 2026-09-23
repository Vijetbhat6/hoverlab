'use client'

/**
 * <SidebarMailFolders> — a mail-style sidebar: Compose, system folders with
 * unread counts, coloured labels and a storage meter.
 *
 *  - An unread count is content, not decoration. The visible "12" gets an
 *    `sr-only` " unread" beside it so a screen reader hears "Inbox, 12
 *    unread" and not "Inbox, 12". Each link is `relative` because `sr-only`
 *    is absolutely positioned.
 *  - Label colours are never the only signal: every label has its name beside
 *    its dot, and the dot is `aria-hidden`. A colour-only key fails anyone who
 *    cannot tell rose from amber.
 *  - Counts collapse to "99+" past two digits so a busy inbox cannot push the
 *    label out of the row; the real number stays in the accessible name.
 *  - The storage bar is a labelled `role="progressbar"`, and turns to the
 *    destructive colour above 90% with text saying so — a red bar alone is
 *    another colour-only cue.
 */

import * as React from 'react'
import { PenSquare, Inbox, Star, Send, FileText, ShieldAlert, Trash2 } from 'lucide-react'

export interface MailFolder {
  id: string
  label: string
  icon: React.ReactNode
  unread?: number
}

export interface MailLabel {
  id: string
  label: string
  dot: string
}

export interface SidebarMailFoldersProps {
  folders?: MailFolder[]
  labels?: MailLabel[]
  defaultFolderId?: string
  /** Storage used, 0-100. */
  storage?: number
  onCompose?: () => void
  children?: React.ReactNode
  className?: string
}

const icon = 'h-4 w-4 shrink-0'

const DEFAULT_FOLDERS: MailFolder[] = [
  { id: 'inbox', label: 'Inbox', icon: <Inbox aria-hidden className={icon} />, unread: 12 },
  { id: 'starred', label: 'Starred', icon: <Star aria-hidden className={icon} /> },
  { id: 'sent', label: 'Sent', icon: <Send aria-hidden className={`${icon} rtl:-scale-x-100`} /> },
  { id: 'drafts', label: 'Drafts', icon: <FileText aria-hidden className={icon} />, unread: 2 },
  { id: 'spam', label: 'Spam', icon: <ShieldAlert aria-hidden className={icon} />, unread: 134 },
  { id: 'trash', label: 'Trash', icon: <Trash2 aria-hidden className={icon} /> },
]

const DEFAULT_LABELS: MailLabel[] = [
  { id: 'work', label: 'Work', dot: 'bg-sky-500' },
  { id: 'receipts', label: 'Receipts', dot: 'bg-amber-500' },
  { id: 'family', label: 'Family', dot: 'bg-emerald-500' },
]

const shortCount = (n: number) => (n > 99 ? '99+' : String(n))

export function SidebarMailFolders({
  folders = DEFAULT_FOLDERS,
  labels = DEFAULT_LABELS,
  defaultFolderId = 'inbox',
  storage = 64,
  onCompose,
  children,
  className = '',
}: SidebarMailFoldersProps) {
  const uid = React.useId()
  const [activeId, setActiveId] = React.useState(defaultFolderId)
  const nearlyFull = storage > 90

  const row = (active: boolean) =>
    `relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
      active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    }`

  return (
    <div
      className={`flex h-[32rem] overflow-hidden rounded-2xl border border-border/60 bg-background ${className}`}
    >
      <aside
        aria-label="Mailboxes"
        className="flex w-[240px] shrink-0 flex-col border-e border-border/60 bg-card/40"
      >
        <div className="p-3">
          <button
            type="button"
            onClick={onCompose}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          >
            <PenSquare aria-hidden className="h-4 w-4" />
            Compose
          </button>
        </div>

        <nav aria-label="Folders" className="flex-1 space-y-4 overflow-y-auto px-2 pb-3">
          <ul className="space-y-0.5">
            {folders.map((f) => {
              const active = f.id === activeId
              return (
                <li key={f.id}>
                  <a
                    href="#"
                    aria-current={active ? 'page' : undefined}
                    onClick={(e) => {
                      e.preventDefault()
                      setActiveId(f.id)
                    }}
                    className={row(active)}
                  >
                    {f.icon}
                    <span className="flex-1 truncate">{f.label}</span>
                    {f.unread ? (
                      <span
                        className={`text-xs tabular-nums ${active ? 'font-semibold' : 'text-muted-foreground'}`}
                      >
                        {shortCount(f.unread)}
                        <span className="sr-only"> unread{f.unread > 99 ? `, ${f.unread} in total` : ''}</span>
                      </span>
                    ) : null}
                  </a>
                </li>
              )
            })}
          </ul>

          <div>
            <h2
              id={`${uid}-labels`}
              className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Labels
            </h2>
            <ul aria-labelledby={`${uid}-labels`} className="space-y-0.5">
              {labels.map((l) => {
                const active = l.id === activeId
                return (
                  <li key={l.id}>
                    <a
                      href="#"
                      aria-current={active ? 'page' : undefined}
                      onClick={(e) => {
                        e.preventDefault()
                        setActiveId(l.id)
                      }}
                      className={row(active)}
                    >
                      <span aria-hidden className="flex h-4 w-4 shrink-0 items-center justify-center">
                        <span className={`h-2.5 w-2.5 rounded-full border border-transparent ${l.dot}`} />
                      </span>
                      <span className="flex-1 truncate">{l.label}</span>
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>
        </nav>

        <div className="border-t border-border/60 p-4">
          <p id={`${uid}-storage`} className="text-xs text-muted-foreground">
            {nearlyFull ? 'Storage almost full: ' : ''}
            {storage}% of 15 GB used
          </p>
          <div
            role="progressbar"
            aria-labelledby={`${uid}-storage`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={storage}
            className="mt-2 h-1.5 overflow-hidden rounded-full border border-transparent bg-border"
          >
            <div
              className={`h-full rounded-full border border-transparent ${nearlyFull ? 'bg-destructive' : 'bg-primary'}`}
              style={{ width: `${storage}%` }}
            />
          </div>
        </div>
      </aside>

      <main className="hidden min-w-0 flex-1 p-6 sm:block">
        {children ?? (
          <div className="flex h-full min-w-0 items-center justify-center break-words rounded-xl border border-dashed border-border/60 text-sm text-muted-foreground">
            Your page content goes here
          </div>
        )}
      </main>
    </div>
  )
}
