'use client'

/**
 * <SidebarTwoPane> — a narrow rail of top-level sections beside a secondary
 * panel that lists whatever lives inside the chosen one.
 *
 * The pattern for products with more destinations than one flat list can
 * hold: the rail answers "which area", the panel answers "which page".
 *
 *  - The rail buttons are labelled in text under the icon, not by tooltip.
 *    A rail whose only names appear on hover is a guessing game for anyone
 *    who cannot hover.
 *  - The chosen section is `aria-current="true"` (a set, not a page) and the
 *    panel heading is what the panel's list is labelled by, so choosing a
 *    section changes what a screen reader announces as well as what is drawn.
 *  - The panel is a live region only in the sense that matters: focus stays on
 *    the rail button you pressed, so switching sections never yanks you into
 *    the list.
 *  - Ids are rooted in `useId()`.
 */

import * as React from 'react'
import { FolderKanban, Users, BookOpen, Settings, Plus } from 'lucide-react'

export interface TwoPaneSection {
  id: string
  label: string
  icon: React.ReactNode
  heading: string
  links: string[]
}

export interface SidebarTwoPaneProps {
  sections?: TwoPaneSection[]
  defaultSectionId?: string
  children?: React.ReactNode
  className?: string
}

const icon = 'h-5 w-5'

const DEFAULT_SECTIONS: TwoPaneSection[] = [
  {
    id: 'projects',
    label: 'Projects',
    icon: <FolderKanban aria-hidden className={icon} />,
    heading: 'Projects',
    links: ['Website relaunch', 'Mobile app', 'Design system', 'Q4 planning', 'Archived'],
  },
  {
    id: 'team',
    label: 'Team',
    icon: <Users aria-hidden className={icon} />,
    heading: 'Team',
    links: ['Members', 'Roles & access', 'Invitations', 'Time off'],
  },
  {
    id: 'docs',
    label: 'Docs',
    icon: <BookOpen aria-hidden className={icon} />,
    heading: 'Docs',
    links: ['Getting started', 'Guides', 'API reference', 'Changelog'],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings aria-hidden className={icon} />,
    heading: 'Settings',
    links: ['General', 'Billing', 'Security', 'Integrations'],
  },
]

export function SidebarTwoPane({
  sections = DEFAULT_SECTIONS,
  defaultSectionId = 'projects',
  children,
  className = '',
}: SidebarTwoPaneProps) {
  const uid = React.useId()
  const [sectionId, setSectionId] = React.useState(defaultSectionId)
  const [linkByRail, setLinkByRail] = React.useState<Record<string, string>>({})

  const section = sections.find((s) => s.id === sectionId) ?? sections[0]
  const activeLink = linkByRail[section.id] ?? section.links[0]
  const headingId = `${uid}-heading`

  return (
    <div
      className={`flex h-[32rem] overflow-hidden rounded-2xl border border-border/60 bg-background ${className}`}
    >
      <nav
        aria-label="Sections"
        className="flex w-[4.5rem] shrink-0 flex-col items-center gap-1 border-e border-border/60 bg-card/60 py-3"
      >
        <span
          aria-hidden
          className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground"
        >
          N
        </span>
        {sections.map((s) => {
          const on = s.id === section.id
          return (
            <button
              key={s.id}
              type="button"
              aria-current={on ? 'true' : undefined}
              aria-controls={`${uid}-panel`}
              onClick={() => setSectionId(s.id)}
              className={`flex w-14 flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                on
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {s.icon}
              <span className="w-full truncate text-center">{s.label}</span>
            </button>
          )
        })}
      </nav>

      <aside
        id={`${uid}-panel`}
        aria-labelledby={headingId}
        className="hidden w-56 shrink-0 flex-col border-e border-border/60 bg-card/30 md:flex"
      >
        <div className="flex h-14 items-center justify-between px-4">
          <h2 id={headingId} className="text-sm font-semibold tracking-tight">
            {section.heading}
          </h2>
          <button
            type="button"
            aria-label={`New in ${section.heading}`}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Plus aria-hidden className="h-4 w-4" />
          </button>
        </div>
        <ul className="space-y-0.5 overflow-y-auto px-2 pb-3">
          {section.links.map((link) => {
            const on = link === activeLink
            return (
              <li key={link}>
                <a
                  href="#"
                  aria-current={on ? 'page' : undefined}
                  onClick={(e) => {
                    e.preventDefault()
                    setLinkByRail((prev) => ({ ...prev, [section.id]: link }))
                  }}
                  className={`block truncate rounded-lg px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    on
                      ? 'bg-muted font-medium text-foreground'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  }`}
                >
                  {link}
                </a>
              </li>
            )
          })}
        </ul>
      </aside>

      <main className="hidden min-w-0 flex-1 p-6 sm:block">
        {children ?? (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border/60 text-sm text-muted-foreground">
            {section.heading} / {activeLink}
          </div>
        )}
      </main>
    </div>
  )
}
