'use client'

/**
 * <SidebarWorkspaceSwitcher> — a sidebar whose header opens a menu of
 * workspaces, the way Slack, Linear and Vercel do.
 *
 *  - It is a menu, so it follows the menu keyboard model rather than a pile of
 *    buttons: Down/Up move between choices, Home/End jump, Escape closes AND
 *    returns focus to the trigger (a menu that drops focus on the page body
 *    strands a keyboard user at the top of the document), and Tab leaves it.
 *  - The choices are `menuitemradio` with `aria-checked`, because picking a
 *    workspace is a one-of-many choice and "Acme, checked" is what says which.
 *  - A pointer press outside closes it. Focus moves into the menu only when it
 *    was opened by the user — a menu that is open on first paint (this demo's
 *    default, since a closed switcher is a screenshot of a button) must not
 *    steal focus on load.
 *  - The trigger's `aria-controls` points at a list that is always mounted,
 *    hidden by attribute when shut, so the reference never dangles.
 */

import * as React from 'react'
import { Check, ChevronsUpDown, Plus, LayoutDashboard, FolderKanban, Users } from 'lucide-react'

export interface Workspace {
  id: string
  name: string
  plan: string
}

export interface SidebarWorkspaceSwitcherProps {
  workspaces?: Workspace[]
  defaultWorkspaceId?: string
  defaultOpen?: boolean
  onWorkspaceChange?: (id: string) => void
  children?: React.ReactNode
  className?: string
}

const DEFAULT_WORKSPACES: Workspace[] = [
  { id: 'acme', name: 'Acme Inc', plan: 'Team' },
  { id: 'personal', name: 'Personal', plan: 'Free' },
  { id: 'studio', name: 'Northwind Studio', plan: 'Pro' },
]

const NAV = [
  { label: 'Overview', icon: <LayoutDashboard aria-hidden className="h-4 w-4" /> },
  { label: 'Projects', icon: <FolderKanban aria-hidden className="h-4 w-4" /> },
  { label: 'People', icon: <Users aria-hidden className="h-4 w-4" /> },
]

export function SidebarWorkspaceSwitcher({
  workspaces = DEFAULT_WORKSPACES,
  defaultWorkspaceId = 'acme',
  defaultOpen = true,
  onWorkspaceChange,
  children,
  className = '',
}: SidebarWorkspaceSwitcherProps) {
  const uid = React.useId()
  const [open, setOpen] = React.useState(defaultOpen)
  const [workspaceId, setWorkspaceId] = React.useState(defaultWorkspaceId)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const menuRef = React.useRef<HTMLDivElement>(null)
  const rootRef = React.useRef<HTMLElement>(null)
  const openedByUser = React.useRef(false)

  const current = workspaces.find((w) => w.id === workspaceId) ?? workspaces[0]

  const items = () =>
    Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]') ?? [])

  const openMenu = (focus: 'checked' | 'first' | 'last' = 'checked') => {
    openedByUser.current = true
    setOpen(true)
    // Focus after the menu is unhidden; a hidden element cannot take focus.
    requestAnimationFrame(() => {
      const list = items()
      const target =
        focus === 'first'
          ? list[0]
          : focus === 'last'
            ? list[list.length - 1]
            : (list.find((el) => el.getAttribute('aria-checked') === 'true') ?? list[0])
      target?.focus()
    })
  }

  const closeMenu = (returnFocus: boolean) => {
    setOpen(false)
    if (returnFocus) triggerRef.current?.focus()
  }

  React.useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const onMenuKeyDown = (e: React.KeyboardEvent) => {
    const list = items()
    const i = list.indexOf(document.activeElement as HTMLElement)
    if (e.key === 'ArrowDown') list[(i + 1) % list.length]?.focus()
    else if (e.key === 'ArrowUp') list[(i - 1 + list.length) % list.length]?.focus()
    else if (e.key === 'Home') list[0]?.focus()
    else if (e.key === 'End') list[list.length - 1]?.focus()
    else if (e.key === 'Escape') closeMenu(true)
    else if (e.key === 'Tab') setOpen(false)
    else return
    if (e.key !== 'Tab') e.preventDefault()
  }

  const choose = (id: string) => {
    setWorkspaceId(id)
    onWorkspaceChange?.(id)
    closeMenu(true)
  }

  return (
    <div
      className={`flex h-[32rem] overflow-hidden rounded-2xl border border-border/60 bg-background ${className}`}
    >
      <aside
        ref={rootRef}
        aria-label="Application"
        className="relative flex w-64 shrink-0 flex-col border-e border-border/60 bg-card/40"
      >
        <div className="p-3">
          <button
            ref={triggerRef}
            type="button"
            aria-haspopup="menu"
            aria-expanded={open}
            aria-controls={`${uid}-menu`}
            onClick={() => (open ? closeMenu(false) : openMenu())}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                openMenu('first')
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                openMenu('last')
              }
            }}
            className="flex w-full items-center gap-3 rounded-xl border border-border/60 bg-background px-3 py-2 text-start transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span
              aria-hidden
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground"
            >
              {current.name.slice(0, 1)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{current.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{current.plan} plan</span>
            </span>
            <ChevronsUpDown aria-hidden className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        </div>

        <div
          ref={menuRef}
          id={`${uid}-menu`}
          role="menu"
          aria-label="Workspaces"
          hidden={!open}
          onKeyDown={onMenuKeyDown}
          className="absolute inset-x-3 top-[4.5rem] z-20 rounded-xl border border-border/60 bg-card p-1.5 shadow-xl"
        >
          <p aria-hidden className="truncate px-2.5 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Workspaces
          </p>
          {workspaces.map((w) => {
            const checked = w.id === workspaceId
            return (
              <button
                key={w.id}
                type="button"
                role="menuitemradio"
                aria-checked={checked}
                tabIndex={-1}
                onClick={() => choose(w.id)}
                className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-start text-sm transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
              >
                <span
                  aria-hidden
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-bold"
                >
                  {w.name.slice(0, 1)}
                </span>
                <span className="flex-1 truncate">{w.name}</span>
                {checked ? <Check aria-hidden className="h-4 w-4 text-primary" /> : null}
              </button>
            )
          })}
          <div role="separator" className="my-1 h-px bg-border/60" />
          <button
            type="button"
            role="menuitem"
            tabIndex={-1}
            onClick={() => closeMenu(true)}
            className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-start text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:outline-none"
          >
            <Plus aria-hidden className="h-4 w-4" />
            Create workspace
          </button>
        </div>

        <nav aria-label="Main" className="flex-1 space-y-0.5 px-3 pb-3">
          {NAV.map((item, i) => (
            <a
              key={item.label}
              href="#"
              aria-current={i === 0 ? 'page' : undefined}
              onClick={(e) => e.preventDefault()}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                i === 0
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {item.icon}
              {item.label}
            </a>
          ))}
        </nav>
      </aside>

      <main className="hidden min-w-0 flex-1 p-6 sm:block">
        {children ?? (
          <div className="flex min-h-full items-center justify-center rounded-xl border border-dashed border-border/60 p-4 text-center text-sm text-muted-foreground">
            <span className="min-w-0 truncate">{current.name} workspace</span>
          </div>
        )}
      </main>
    </div>
  )
}
