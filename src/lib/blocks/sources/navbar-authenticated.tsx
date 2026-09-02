'use client'

/**
 * <NavbarAuthenticated> — the bar for people who are already inside.
 *
 * Navigation held four marketing bars: simple, mega menu, mobile drawer,
 * announcement strip. All of them are built for a visitor deciding whether
 * to sign up. The bar above a signed-in application answers a completely
 * different question, and it is not "where can I go" — it is "where am I,
 * and as whom".
 *
 * THE ONE THING THIS GETS RIGHT THAT MOST DO NOT
 *
 * The context you are acting in is on the bar, permanently, in words. The
 * expensive mistake in every multi-workspace product is doing the correct
 * thing in the wrong place: deleting the right customer from the wrong
 * org, running the right migration against production because the tab had
 * been open since yesterday. A workspace name in a dropdown you have to
 * open is not an answer; the name and the environment sit in the bar and
 * the environment carries a colour *and* its own word.
 *
 * IMPERSONATION IS NOT A QUIET MODE
 *
 * When a support agent is viewing as a customer, the bar grows a strip
 * that cannot be dismissed, names the customer, and offers exactly one
 * exit. Products that mark this state with a subtle tint ship the incident
 * where somebody sends an email from an account that was not theirs. The
 * strip is `role="status"` so it is announced, not just seen.
 *
 * THE BELL COUNTS IN WORDS
 *
 * `aria-label="Notifications, 3 unread"` rather than a red dot next to an
 * icon, and the badge caps at 9+ so the layout cannot be broken by a bad
 * week. A count that only exists as a coloured circle is invisible to a
 * screen reader and ambiguous to everyone else — unread, or unresolved?
 *
 * ACCESSIBILITY: one `<nav>` with a real label, menus toggled by buttons
 * carrying `aria-expanded` and `aria-haspopup="menu"`, and Escape closing
 * whichever is open. The search field is a labelled input, not a div with
 * a placeholder — the most common way an app bar loses its only text
 * field to assistive technology.
 */

import * as React from 'react'
import {
  Bell,
  ChevronsUpDown,
  CircleUser,
  LogOut,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  UserRoundX,
} from 'lucide-react'

export interface Workspace {
  name: string
  plan: string
  /** Non-production environments say so, in a word as well as a colour. */
  environment?: 'production' | 'staging' | 'sandbox'
}

export interface NavbarAuthenticatedProps {
  product?: string
  workspaces?: Workspace[]
  unread?: number
  /** Set when a support agent is acting as somebody else. */
  actingAs?: string | null
  className?: string
}

const DEFAULT_WORKSPACES: Workspace[] = [
  { name: 'Northwind Trading', plan: 'Scale', environment: 'production' },
  { name: 'Northwind Trading', plan: 'Scale', environment: 'staging' },
  { name: 'Halden Group', plan: 'Team', environment: 'production' },
]

const ENV_STYLE: Record<NonNullable<Workspace['environment']>, string> = {
  production: 'border-border bg-muted text-muted-foreground',
  staging: 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  sandbox: 'border-primary/40 bg-primary/10 text-primary',
}

export function NavbarAuthenticated({
  product = 'Northwind',
  workspaces = DEFAULT_WORKSPACES,
  unread = 3,
  actingAs = 'priya@meridianfoods.com',
  className = '',
}: NavbarAuthenticatedProps) {
  const [current, setCurrent] = React.useState(0)
  const [open, setOpen] = React.useState<'workspace' | 'account' | null>(null)
  const workspace = workspaces[current]
  const env = workspace.environment ?? 'production'

  const menuProps = (which: 'workspace' | 'account') => ({
    'aria-expanded': open === which,
    'aria-haspopup': 'menu' as const,
    onClick: () => setOpen((o) => (o === which ? null : which)),
  })

  return (
    <div
      className={`w-full ${className}`}
      onKeyDown={(event) => {
        if (event.key === 'Escape') setOpen(null)
      }}
    >
      {/*
        Not dismissible, and it owns the top of the page. A tint would be
        cheaper and is how the wrong-account email gets sent.
      */}
      {actingAs ? (
        <div
          role="status"
          className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm text-amber-700 dark:text-amber-400 sm:px-6"
        >
          <UserRoundX aria-hidden className="h-4 w-4 shrink-0" />
          <p className="min-w-0 flex-1">
            You are viewing {product} as <strong className="font-semibold">{actingAs}</strong>.
            Anything you do here is recorded against your own name.
          </p>
          <button
            type="button"
            className="rounded-md font-semibold underline underline-offset-4 transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Stop viewing as
          </button>
        </div>
      ) : null}

      <nav
        aria-label="Application"
        className="flex items-center gap-2 border-b border-border bg-card px-4 py-2.5 sm:gap-3 sm:px-6"
      >
        <a
          href="#home"
          className="flex shrink-0 items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <span
            aria-hidden
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground"
          >
            {product.charAt(0)}
          </span>
          <span className="sr-only">{product} home</span>
        </a>

        {/* ---- Where am I, in words, without opening anything ---------- */}
        <div className="relative min-w-0">
          <button
            type="button"
            {...menuProps('workspace')}
            className="flex h-9 min-w-0 items-center gap-2 rounded-lg border border-border bg-background px-2.5 text-sm text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <span className="truncate font-medium">{workspace.name}</span>
            <span
              className={`hidden shrink-0 rounded-md border px-1.5 py-0.5 text-[11px] font-medium sm:inline ${ENV_STYLE[env]}`}
            >
              {env}
            </span>
            <ChevronsUpDown aria-hidden className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="sr-only">Change workspace. Currently {workspace.name}, {env}.</span>
          </button>

          {open === 'workspace' ? (
            <div
              role="menu"
              aria-label="Workspaces"
              className="absolute left-0 top-full z-20 mt-1 w-72 rounded-xl border border-border bg-popover p-1 shadow-lg"
            >
              {workspaces.map((w, i) => (
                <button
                  key={`${w.name}-${w.environment}`}
                  type="button"
                  role="menuitemradio"
                  aria-checked={i === current}
                  onClick={() => {
                    setCurrent(i)
                    setOpen(null)
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-start text-sm text-foreground transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{w.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {w.plan}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${
                      ENV_STYLE[w.environment ?? 'production']
                    }`}
                  >
                    {w.environment ?? 'production'}
                  </span>
                </button>
              ))}
              <div className="my-1 h-px bg-border" />
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-start text-sm text-foreground transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Plus aria-hidden className="h-3.5 w-3.5" />
                New workspace
              </button>
            </div>
          ) : null}
        </div>

        {/* ---- A labelled field, not a div with a placeholder ---------- */}
        <div className="ms-auto hidden min-w-0 max-w-xs flex-1 sm:block">
          <label htmlFor="app-search" className="sr-only">
            Search {product}
          </label>
          <div className="relative">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <input
              id="app-search"
              type="search"
              placeholder="Search"
              className="h-9 w-full rounded-lg border border-field bg-background ps-8 pe-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            />
          </div>
        </div>

        <button
          type="button"
          /* The count is in the label, not only in the circle. */
          aria-label={`Notifications, ${unread} unread`}
          className="relative ms-auto inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:ms-0"
        >
          <Bell aria-hidden className="h-4 w-4" />
          {unread > 0 ? (
            <span
              aria-hidden
              className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground"
            >
              {unread > 9 ? '9+' : unread}
            </span>
          ) : null}
        </button>

        <div className="relative shrink-0">
          <button
            type="button"
            {...menuProps('account')}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg ps-1 pe-1.5 transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <span
              aria-hidden
              className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground"
            >
              SK
            </span>
            <ChevronsUpDown aria-hidden className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="sr-only">Account menu, signed in as Sam Keller</span>
          </button>

          {open === 'account' ? (
            <div
              role="menu"
              aria-label="Account"
              className="absolute right-0 top-full z-20 mt-1 w-60 rounded-xl border border-border bg-popover p-1 shadow-lg"
            >
              <div className="px-2.5 py-2">
                <p className="truncate text-sm font-medium text-foreground">Sam Keller</p>
                <p className="truncate text-xs text-muted-foreground">sam@northwind.com</p>
              </div>
              <div className="my-1 h-px bg-border" />
              {[
                { label: 'Account settings', icon: CircleUser },
                { label: 'Workspace settings', icon: Settings },
                { label: 'Security and sessions', icon: ShieldCheck },
              ].map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-start text-sm text-foreground transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Icon aria-hidden className="h-3.5 w-3.5 text-muted-foreground" />
                  {label}
                </button>
              ))}
              <div className="my-1 h-px bg-border" />
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-start text-sm text-foreground transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <LogOut aria-hidden className="h-3.5 w-3.5 text-muted-foreground" />
                Sign out
              </button>
            </div>
          ) : null}
        </div>
      </nav>
    </div>
  )
}
