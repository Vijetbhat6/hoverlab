/**
 * <RoadmapColumns> — a three-column public roadmap.
 *
 * Shipped / In progress / Planned, each column a list of cards. Status is
 * carried by an icon plus a colour, never colour alone, so the columns stay
 * distinguishable in greyscale and for the ~8% of men with a colour vision
 * deficiency.
 */

import * as React from 'react'
import { CircleCheck, CircleDot, Circle } from 'lucide-react'

export type RoadmapStatus = 'shipped' | 'in-progress' | 'planned'

export interface RoadmapItem {
  title: string
  description?: string
  status: RoadmapStatus
  /** e.g. "Q3 2026". Shown as a small tag. */
  eta?: string
}

export interface RoadmapColumnsProps {
  items?: RoadmapItem[]
  heading?: string
  subheading?: string
  className?: string
}

const COLUMNS: { status: RoadmapStatus; label: string; icon: React.ReactNode; accent: string }[] = [
  {
    status: 'shipped',
    label: 'Shipped',
    icon: <CircleCheck className="h-4 w-4" />,
    accent: 'text-emerald-500',
  },
  {
    status: 'in-progress',
    label: 'In progress',
    icon: <CircleDot className="h-4 w-4" />,
    accent: 'text-sky-500',
  },
  {
    status: 'planned',
    label: 'Planned',
    icon: <Circle className="h-4 w-4" />,
    accent: 'text-muted-foreground',
  },
]

const DEFAULT_ITEMS: RoadmapItem[] = [
  { title: 'Marketing sections', status: 'shipped', description: 'Heroes, pricing, FAQ, footers.' },
  { title: 'Dark mode tokens', status: 'shipped', description: 'Every block reads semantic colours.' },
  { title: 'Dashboard blocks', status: 'in-progress', description: 'Shells, tables, settings.', eta: 'Q3 2026' },
  { title: 'CLI install', status: 'in-progress', description: 'Add a block straight to your repo.', eta: 'Q3 2026' },
  { title: 'Full page layouts', status: 'planned', description: 'Composed screens, not sections.', eta: 'Q4 2026' },
  { title: 'Starter templates', status: 'planned', description: 'Multi-page projects, ready to deploy.', eta: 'Q4 2026' },
  { title: 'Vue and Svelte ports', status: 'planned', eta: '2027' },
]

export function RoadmapColumns({
  items = DEFAULT_ITEMS,
  heading = 'Roadmap',
  subheading = 'What is done, what is being built, and what is next.',
  className = '',
}: RoadmapColumnsProps) {
  return (
    <section className={`mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 ${className}`}>
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          {heading}
        </h2>
        {subheading ? <p className="mt-3 text-muted-foreground">{subheading}</p> : null}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const columnItems = items.filter((i) => i.status === col.status)
          return (
            <div key={col.status}>
              <div className="mb-4 flex items-center gap-2">
                <span className={col.accent}>{col.icon}</span>
                <h3 className="font-semibold tracking-tight">{col.label}</h3>
                <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {columnItems.length}
                </span>
              </div>

              <ul className="space-y-3">
                {columnItems.map((item) => (
                  <li
                    key={item.title}
                    className="rounded-xl border border-border/60 bg-card/80 p-4 backdrop-blur transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium leading-snug">{item.title}</span>
                      {item.eta ? (
                        <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[0.65rem] font-semibold text-muted-foreground">
                          {item.eta}
                        </span>
                      ) : null}
                    </div>
                    {item.description ? (
                      <p className="mt-1.5 text-sm text-muted-foreground">{item.description}</p>
                    ) : null}
                  </li>
                ))}

                {columnItems.length === 0 ? (
                  <li className="rounded-xl border border-dashed border-border/60 p-4 text-center text-sm text-muted-foreground">
                    Nothing here yet
                  </li>
                ) : null}
              </ul>
            </div>
          )
        })}
      </div>
    </section>
  )
}
