'use client'

/**
 * <SidebarResizable> — a sidebar with a drag handle that a keyboard can also
 * move.
 *
 * Most resizable sidebars are pointer-only, which makes the width a thing a
 * keyboard user is stuck with. This one implements the window-splitter
 * pattern:
 *
 *  - The handle is `role="separator"` with `aria-orientation="vertical"`, a
 *    name, `aria-valuenow/min/max`, and `tabIndex={0}`. Left/Right move it 16px
 *    (48px with Shift), Home and End jump to the limits, and double-click
 *    resets — the same gestures a desktop split view offers.
 *  - The arrow keys mean "move the edge that way", not "grow", so in an RTL
 *    document, where the sidebar is on the right, they are swapped. Direction
 *    is read from the computed style, so it also follows a `dir` set on an
 *    ancestor.
 *  - Pointer drag uses pointer capture, so a fast flick that leaves the handle
 *    keeps tracking, and it works for touch and pen as well as mouse. The
 *    width is measured from the container edge rather than accumulated from
 *    deltas, so it cannot drift.
 *  - The handle's hit area is wider than the line you see. A 1px target is a
 *    pixel-hunting exercise.
 */

import * as React from 'react'
import { Inbox, Star, Send, FileText, Archive, Trash2 } from 'lucide-react'

export interface ResizableItem {
  id: string
  label: string
  icon: React.ReactNode
  count?: number
}

export interface SidebarResizableProps {
  items?: ResizableItem[]
  min?: number
  max?: number
  defaultWidth?: number
  children?: React.ReactNode
  className?: string
}

const icon = 'h-4 w-4 shrink-0'

const DEFAULT_ITEMS: ResizableItem[] = [
  { id: 'inbox', label: 'Inbox and everything that still needs a reply', icon: <Inbox aria-hidden className={icon} />, count: 14 },
  { id: 'starred', label: 'Starred conversations', icon: <Star aria-hidden className={icon} /> },
  { id: 'sent', label: 'Sent', icon: <Send aria-hidden className={`${icon} rtl:-scale-x-100`} /> },
  { id: 'drafts', label: 'Drafts', icon: <FileText aria-hidden className={icon} />, count: 3 },
  { id: 'archive', label: 'Archive', icon: <Archive aria-hidden className={icon} /> },
  { id: 'trash', label: 'Trash', icon: <Trash2 aria-hidden className={icon} /> },
]

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

export function SidebarResizable({
  items = DEFAULT_ITEMS,
  min = 200,
  max = 360,
  defaultWidth = 264,
  children,
  className = '',
}: SidebarResizableProps) {
  const [width, setWidth] = React.useState(() => clamp(defaultWidth, min, max))
  const [dragging, setDragging] = React.useState(false)
  const [activeId, setActiveId] = React.useState(items[0]?.id)
  const frameRef = React.useRef<HTMLDivElement>(null)

  const isRtl = () =>
    frameRef.current ? getComputedStyle(frameRef.current).direction === 'rtl' : false

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(true)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || !frameRef.current) return
    const rect = frameRef.current.getBoundingClientRect()
    const from = isRtl() ? rect.right - e.clientX : e.clientX - rect.left
    setWidth(clamp(Math.round(from), min, max))
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 48 : 16
    // ArrowRight moves the edge to the right, which grows an LTR sidebar and
    // shrinks an RTL one.
    const dir = isRtl() ? -1 : 1
    if (e.key === 'ArrowRight') setWidth((w) => clamp(w + step * dir, min, max))
    else if (e.key === 'ArrowLeft') setWidth((w) => clamp(w - step * dir, min, max))
    else if (e.key === 'Home') setWidth(min)
    else if (e.key === 'End') setWidth(max)
    else return
    e.preventDefault()
  }

  return (
    <div
      ref={frameRef}
      className={`flex h-[32rem] overflow-hidden rounded-2xl border border-border/60 bg-background ${
        dragging ? 'select-none' : ''
      } ${className}`}
    >
      <aside
        aria-label="Mailboxes"
        style={{ width }}
        className="relative flex shrink-0 flex-col bg-card/40"
      >
        <div className="flex h-14 items-center px-4 text-sm font-semibold tracking-tight">Mail</div>
        <nav aria-label="Main" className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
          {items.map((item) => {
            const active = item.id === activeId
            return (
              <a
                key={item.id}
                href="#"
                aria-current={active ? 'page' : undefined}
                onClick={(e) => {
                  e.preventDefault()
                  setActiveId(item.id)
                }}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {item.icon}
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {item.count ? (
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs tabular-nums text-muted-foreground">
                    {item.count}
                  </span>
                ) : null}
              </a>
            )
          })}
        </nav>

        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize sidebar"
          aria-valuenow={width}
          aria-valuemin={min}
          aria-valuemax={max}
          tabIndex={0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={() => setDragging(false)}
          onPointerCancel={() => setDragging(false)}
          onKeyDown={onKeyDown}
          onDoubleClick={() => setWidth(clamp(defaultWidth, min, max))}
          className="group absolute inset-y-0 -end-1.5 z-10 flex w-3 cursor-col-resize touch-none justify-center focus-visible:outline-none"
        >
          <span
            aria-hidden
            className={`h-full w-px transition-colors group-hover:w-0.5 group-hover:bg-primary group-focus-visible:w-0.5 group-focus-visible:bg-primary ${
              dragging ? 'w-0.5 bg-primary' : 'bg-border/60'
            }`}
          />
        </div>
      </aside>

      <main className="hidden min-w-0 flex-1 border-s border-transparent p-6 sm:block">
        {children ?? (
          <div className="flex h-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border/60 text-sm text-muted-foreground">
            <span>Drag the edge, or focus it and use the arrow keys</span>
            <span className="tabular-nums">Sidebar width {width}px</span>
          </div>
        )}
      </main>
    </div>
  )
}
