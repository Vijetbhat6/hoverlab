/**
 * <KanbanBoard> — a four-column project board.
 *
 * This is the layout contract, not the interaction. Dragging is behavior
 * you wire to your own state and whichever dnd library you already use —
 * shipping one here would mean shipping a store too, and ripping a store
 * out is harder than adding one. What the markup does settle: column
 * width, horizontal overflow on small screens, and everything a card must
 * carry — priority, tags, owner, date or PR — without growing past a
 * glance, because a card you have to read line by line defeats the board.
 *
 * "Blocked" is a tint plus an icon and a reason, never colour alone.
 */

import * as React from 'react'
import { Plus, GitPullRequest, OctagonAlert, CalendarDays } from 'lucide-react'

export type KanbanPriority = 'high' | 'medium' | 'low'

export interface KanbanTask {
  id: string
  title: string
  priority: KanbanPriority
  tags: string[]
  assignee: { name: string; initials: string }
  /** ISO date — rendered as a short due date. */
  due?: string
  /** Pull request number — rendered as a PR link instead of a date. */
  pr?: number
  /** Short reason the task is stuck, e.g. "Waiting on DNS". */
  blocked?: string
}

export interface KanbanColumn {
  id: string
  label: string
  tasks: KanbanTask[]
}

export interface KanbanBoardProps {
  columns?: KanbanColumn[]
  className?: string
}

const PRIORITY: Record<KanbanPriority, { label: string; dot: string }> = {
  high: { label: 'High', dot: 'bg-rose-500' },
  medium: { label: 'Medium', dot: 'bg-amber-500' },
  low: { label: 'Low', dot: 'bg-sky-500' },
}

const ALEX = { name: 'Alex Chen', initials: 'AC' }
const DANA = { name: 'Dana Whitfield', initials: 'DW' }
const ROSA = { name: 'Rosa Martínez', initials: 'RM' }
const PRIYA = { name: 'Priya Raman', initials: 'PR' }
const SAM = { name: 'Sam Okafor', initials: 'SO' }
const JONAS = { name: 'Jonas Weber', initials: 'JW' }

const DEFAULT_COLUMNS: KanbanColumn[] = [
  {
    id: 'backlog',
    label: 'Backlog',
    tasks: [
      { id: 'HL-341', title: 'Rate-limit the export endpoint', priority: 'high', tags: ['api', 'infra'], assignee: ALEX, due: '2026-08-19' },
      { id: 'HL-338', title: 'Empty-state illustrations for search', priority: 'medium', tags: ['design'], assignee: DANA, due: '2026-08-21' },
      { id: 'HL-329', title: 'Migrate billing webhooks to v2', priority: 'low', tags: ['billing'], assignee: ROSA, due: '2026-08-25' },
    ],
  },
  {
    id: 'in-progress',
    label: 'In progress',
    tasks: [
      { id: 'HL-322', title: 'Checkout: support SEPA direct debit', priority: 'high', tags: ['payments'], assignee: PRIYA, pr: 482 },
      { id: 'HL-318', title: 'Rotate staging TLS certificates', priority: 'medium', tags: ['infra'], assignee: SAM, due: '2026-08-14', blocked: 'Waiting on DNS delegation' },
      { id: 'HL-325', title: 'New onboarding checklist', priority: 'medium', tags: ['growth'], assignee: JONAS, due: '2026-08-15' },
    ],
  },
  {
    id: 'in-review',
    label: 'In review',
    tasks: [
      { id: 'HL-314', title: 'Fix duplicate invoice emails', priority: 'high', tags: ['billing'], assignee: ROSA, pr: 479 },
      { id: 'HL-311', title: 'Dashboard loading skeletons', priority: 'low', tags: ['design'], assignee: DANA, pr: 476 },
    ],
  },
  {
    id: 'done',
    label: 'Done',
    tasks: [
      { id: 'HL-306', title: 'Upgrade CI runners to Node 22', priority: 'medium', tags: ['infra'], assignee: ALEX, due: '2026-08-11' },
      { id: 'HL-302', title: 'Search relevance tuning', priority: 'high', tags: ['search'], assignee: PRIYA, due: '2026-08-12' },
    ],
  },
]

const DATE_FORMAT = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
})

export function KanbanBoard({ columns = DEFAULT_COLUMNS, className = '' }: KanbanBoardProps) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <div className="flex min-w-max items-start gap-4 p-1">
        {columns.map((column) => (
          <section key={column.id} aria-label={column.label} className="w-72 shrink-0">
            <div className="mb-3 flex items-center gap-2 px-1">
              <h2 className="text-sm font-semibold tracking-tight">{column.label}</h2>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {column.tasks.length}
              </span>
              <button
                type="button"
                aria-label={`Add task to ${column.label}`}
                className="ml-auto inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Plus aria-hidden className="h-4 w-4" />
              </button>
            </div>

            <ul className="space-y-2.5">
              {column.tasks.map((task) => {
                const priority = PRIORITY[task.priority]
                return (
                  <li
                    key={task.id}
                    className={`rounded-xl border p-3 transition-colors ${
                      task.blocked
                        ? 'border-destructive/40 bg-destructive/5'
                        : 'border-border/60 bg-card hover:border-border'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span aria-hidden className={`h-2 w-2 rounded-full ${priority.dot}`} />
                      <span>{priority.label}</span>
                      <span className="ml-auto font-mono text-[0.65rem]">{task.id}</span>
                    </div>

                    <p className="mt-1.5 text-sm font-medium leading-snug">{task.title}</p>

                    {task.blocked ? (
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-destructive">
                        <OctagonAlert aria-hidden className="h-3.5 w-3.5" />
                        Blocked — {task.blocked}
                      </p>
                    ) : null}

                    <div className="mt-2 flex flex-wrap gap-1">
                      {task.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md bg-secondary px-1.5 py-0.5 text-[0.65rem] font-medium text-secondary-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="mt-2.5 flex items-center justify-between">
                      <span
                        title={task.assignee.name}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[0.6rem] font-semibold text-muted-foreground"
                      >
                        {task.assignee.initials}
                        <span className="sr-only">{task.assignee.name}</span>
                      </span>

                      {task.pr ? (
                        <a
                          href={`https://github.com/acme/hoverlab/pull/${task.pr}`}
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <GitPullRequest aria-hidden className="h-3.5 w-3.5" />
                          #{task.pr}
                        </a>
                      ) : task.due ? (
                        <time
                          dateTime={task.due}
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground"
                        >
                          <CalendarDays aria-hidden className="h-3.5 w-3.5" />
                          {DATE_FORMAT.format(new Date(task.due))}
                        </time>
                      ) : null}
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
