'use client'

/**
 * <SettingsNavLayout> — the sidebar-and-panel shell for a settings area.
 *
 * The nav is a vertical list on desktop and a horizontal scroller on
 * mobile, not a <select>. A native select is smaller, but it hides the
 * available sections behind a tap and loses the current-page indicator —
 * and settings is precisely where users are hunting for a section whose
 * name they half-remember.
 *
 * Sections are grouped with a heading each, because a flat run of a dozen
 * links is a wall. The grouping is data, so consumers can re-cut it.
 */

import * as React from 'react'
import { User, Bell, CreditCard, Users, KeyRound, Shield, Palette } from 'lucide-react'

export interface SettingsSection {
  label: string
  icon: React.ReactNode
  group: string
}

export interface SettingsNavLayoutProps {
  sections?: SettingsSection[]
  initialSection?: string
  heading?: string
  children?: React.ReactNode
  className?: string
}

const DEFAULT_SECTIONS: SettingsSection[] = [
  { label: 'Profile', icon: <User className="h-4 w-4" />, group: 'Account' },
  { label: 'Appearance', icon: <Palette className="h-4 w-4" />, group: 'Account' },
  { label: 'Notifications', icon: <Bell className="h-4 w-4" />, group: 'Account' },
  { label: 'Members', icon: <Users className="h-4 w-4" />, group: 'Workspace' },
  { label: 'Billing', icon: <CreditCard className="h-4 w-4" />, group: 'Workspace' },
  { label: 'API keys', icon: <KeyRound className="h-4 w-4" />, group: 'Developer' },
  { label: 'Security', icon: <Shield className="h-4 w-4" />, group: 'Developer' },
]

export function SettingsNavLayout({
  sections = DEFAULT_SECTIONS,
  initialSection = 'Profile',
  heading = 'Settings',
  children,
  className = '',
}: SettingsNavLayoutProps) {
  const [active, setActive] = React.useState(initialSection)

  // Preserve the authored order of both groups and their items.
  const groups = React.useMemo(() => {
    const map = new Map<string, SettingsSection[]>()
    for (const section of sections) {
      const list = map.get(section.group)
      if (list) list.push(section)
      else map.set(section.group, [section])
    }
    return [...map.entries()]
  }, [sections])

  return (
    <div className={`mx-auto w-full max-w-5xl p-6 ${className}`}>
      <h1 className="text-2xl font-bold tracking-tight">{heading}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage your account, your workspace and how you sign in.
      </p>

      <div className="mt-8 flex flex-col gap-8 lg:flex-row">
        <nav aria-label="Settings sections" className="lg:w-52 lg:shrink-0">
          {/* Horizontal scroller below lg, stacked groups above it. */}
          <div className="flex gap-1 overflow-x-auto pb-2 lg:block lg:space-y-5 lg:overflow-visible lg:pb-0">
            {groups.map(([group, items]) => (
              <div key={group} className="contents lg:block">
                <h2 className="hidden px-3 pb-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground lg:block">
                  {group}
                </h2>

                {items.map((section) => {
                  const isActive = section.label === active
                  return (
                    <button
                      key={section.label}
                      type="button"
                      onClick={() => setActive(section.label)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors lg:w-full ${
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      {section.icon}
                      {section.label}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </nav>

        <div className="min-w-0 flex-1">
          {children ?? (
            <div className="rounded-2xl border border-border/60 bg-card/60 p-6">
              <h2 className="font-semibold tracking-tight">{active}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                The panel for “{active}” goes here. Pass it as{' '}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">children</code>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
