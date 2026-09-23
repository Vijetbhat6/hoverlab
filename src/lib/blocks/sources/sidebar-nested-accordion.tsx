'use client'

/**
 * <SidebarNestedAccordion> — a sidebar whose groups fold open to reveal child
 * pages, with the group holding the current page open on first paint.
 *
 *  - Each group header is a real `<button>` with `aria-expanded` and an
 *    `aria-controls` that always resolves. The child list stays mounted and is
 *    hidden with the `hidden` attribute, so the IDREF never points at nothing.
 *  - Opening the group that owns the current page by default is the whole
 *    point: a nested nav that starts fully shut hides where you are.
 *  - The chevron is a single downward icon rotated with a class. A left/right
 *    pair would need an RTL flip; a rotation that means "closed" reads the
 *    same in either direction.
 *  - Child links draw their indent as a rail on the logical start edge
 *    (`border-s`, `ms-`), so the tree hangs from the correct side in RTL.
 */

import * as React from 'react'
import { ChevronDown, Package, Users, ReceiptText, Cog } from 'lucide-react'

export interface AccordionChild {
  id: string
  label: string
}

export interface AccordionGroup {
  id: string
  label: string
  icon: React.ReactNode
  children: AccordionChild[]
}

export interface SidebarNestedAccordionProps {
  groups?: AccordionGroup[]
  defaultActiveId?: string
  /** Let several groups stay open at once. Off means opening one closes the rest. */
  multiple?: boolean
  children?: React.ReactNode
  className?: string
}

const icon = 'h-4 w-4 shrink-0'

const DEFAULT_GROUPS: AccordionGroup[] = [
  {
    id: 'catalog',
    label: 'Catalog',
    icon: <Package aria-hidden className={icon} />,
    children: [
      { id: 'products', label: 'Products' },
      { id: 'collections', label: 'Collections' },
      { id: 'inventory', label: 'Inventory' },
    ],
  },
  {
    id: 'customers',
    label: 'Customers',
    icon: <Users aria-hidden className={icon} />,
    children: [
      { id: 'all-customers', label: 'All customers' },
      { id: 'segments', label: 'Segments' },
      { id: 'reviews', label: 'Reviews' },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: <ReceiptText aria-hidden className={icon} />,
    children: [
      { id: 'payouts', label: 'Payouts' },
      { id: 'invoices', label: 'Invoices' },
      { id: 'tax', label: 'Tax settings' },
    ],
  },
  {
    id: 'system',
    label: 'System',
    icon: <Cog aria-hidden className={icon} />,
    children: [
      { id: 'webhooks', label: 'Webhooks' },
      { id: 'api-keys', label: 'API keys' },
    ],
  },
]

export function SidebarNestedAccordion({
  groups = DEFAULT_GROUPS,
  defaultActiveId = 'segments',
  multiple = false,
  children,
  className = '',
}: SidebarNestedAccordionProps) {
  const uid = React.useId()
  const [activeId, setActiveId] = React.useState(defaultActiveId)
  const [open, setOpen] = React.useState<Set<string>>(
    () => new Set(groups.filter((g) => g.children.some((c) => c.id === defaultActiveId)).map((g) => g.id)),
  )

  const toggle = (id: string) => {
    setOpen((prev) => {
      const next = new Set(multiple ? prev : [])
      if (prev.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div
      className={`flex h-[32rem] overflow-hidden rounded-2xl border border-border/60 bg-background ${className}`}
    >
      <aside
        aria-label="Application"
        className="flex w-[256px] shrink-0 flex-col border-e border-border/60 bg-card/40"
      >
        <div className="flex h-14 items-center gap-2 px-4">
          <span
            aria-hidden
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground"
          >
            S
          </span>
          <span className="text-sm font-semibold tracking-tight">Storefront</span>
        </div>

        <nav aria-label="Main" className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {groups.map((group) => {
            const expanded = open.has(group.id)
            const owns = group.children.some((c) => c.id === activeId)
            return (
              <div key={group.id}>
                <button
                  type="button"
                  aria-expanded={expanded}
                  aria-controls={`${uid}-${group.id}`}
                  onClick={() => toggle(group.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    owns ? 'text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {group.icon}
                  <span className="flex-1 truncate text-start">{group.label}</span>
                  <ChevronDown
                    aria-hidden
                    className={`h-4 w-4 shrink-0 transition-transform motion-reduce:transition-none ${
                      expanded ? '' : '-rotate-90 rtl:rotate-90'
                    }`}
                  />
                </button>
                <ul
                  id={`${uid}-${group.id}`}
                  hidden={!expanded}
                  className="ms-6 mt-0.5 space-y-0.5 border-s border-border/60 ps-2"
                >
                  {group.children.map((child) => {
                    const active = child.id === activeId
                    return (
                      <li key={child.id}>
                        <a
                          href="#"
                          aria-current={active ? 'page' : undefined}
                          onClick={(e) => {
                            e.preventDefault()
                            setActiveId(child.id)
                          }}
                          className={`block truncate rounded-lg px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                            active
                              ? 'bg-primary/10 font-medium text-primary'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          }`}
                        >
                          {child.label}
                        </a>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </nav>
      </aside>

      <main className="hidden min-w-0 flex-1 p-6 sm:block">
        {children ?? (
          <div className="flex min-h-full min-w-0 items-center justify-center break-words rounded-xl border border-dashed border-border/60 p-4 text-center text-sm text-muted-foreground">
            Your page content goes here
          </div>
        )}
      </main>
    </div>
  )
}
