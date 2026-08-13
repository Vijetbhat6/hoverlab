/**
 * <AgentTaskList> — the run queue: what the agent is doing now, what it has
 * finished, and what failed.
 *
 * The block exists because a long-running agent is otherwise invisible. A
 * user who kicked off a job and sees nothing will start it again, and the
 * second run is usually the one that does damage.
 *
 * Live-region handling, which is the hard part:
 *
 *  - The list is `aria-live="polite"` but `aria-relevant="additions"`, so a
 *    task changing from Running to Done does not re-read every row. Only a
 *    genuinely new task is announced.
 *  - The *summary* line above the list is a `role="status"` and is where
 *    "3 of 5 complete" lives. Progress belongs in one small region that
 *    changes rarely, not scattered across rows that change constantly.
 *  - A failed row exposes its retry as a real button with the task name in
 *    its accessible name — five buttons all called "Retry" is a menu nobody
 *    can use.
 *  - `<progress>` is the native element, so the value is exposed without
 *    `role="progressbar"` and its ARIA triplet. Its bar is restyled but its
 *    semantics are untouched.
 */

'use client'

import * as React from 'react'
import { AlertCircle, Check, Loader2, Pause, Play, RotateCw, Square } from 'lucide-react'

export type TaskState = 'done' | 'running' | 'failed' | 'queued'

export interface AgentTask {
  id: string
  title: string
  detail?: string
  state: TaskState
  /** 0–100, only meaningful while running. */
  progress?: number
  duration?: string
}

export interface AgentTaskListProps {
  heading?: string
  tasks?: AgentTask[]
  className?: string
}

const DEFAULT_TASKS: AgentTask[] = [
  {
    id: '1',
    title: 'Pull cancellations for Q3',
    detail: '2,481 rows from warehouse.subscriptions',
    state: 'done',
    duration: '2.7s',
  },
  {
    id: '2',
    title: 'Join to account seat counts',
    detail: 'Matched 2,463 of 2,481 — 18 accounts deleted',
    state: 'done',
    duration: '1.4s',
  },
  {
    id: '3',
    title: 'Fetch exit-survey responses',
    detail: 'CRM returned 429 — rate limited after 40 of 300',
    state: 'failed',
    duration: '12.0s',
  },
  {
    id: '4',
    title: 'Score accounts by churn risk',
    detail: 'Running the model over the joined cohort',
    state: 'running',
    progress: 62,
  },
  {
    id: '5',
    title: 'Draft the summary',
    state: 'queued',
  },
]

const STATE_LABEL = {
  done: 'Complete',
  running: 'Running',
  failed: 'Failed',
  queued: 'Queued',
} as const

export function AgentTaskList({
  heading = 'Quarterly churn review',
  tasks = DEFAULT_TASKS,
  className = '',
}: AgentTaskListProps) {
  const [paused, setPaused] = React.useState(false)

  const done = tasks.filter((t) => t.state === 'done').length
  const failed = tasks.filter((t) => t.state === 'failed').length
  const active = tasks.some((t) => t.state === 'running')

  return (
    <div className={`mx-auto w-full max-w-2xl p-6 ${className}`}>
      <div
        aria-busy={active && !paused}
        className="overflow-hidden rounded-2xl border border-border/60 bg-card"
      >
        {/* -- Header ---------------------------------------------------- */}
        <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold">{heading}</h3>

            {/* The one place progress is announced. */}
            <p role="status" className="mt-0.5 text-xs text-muted-foreground">
              {done} of {tasks.length} complete
              {failed > 0 ? ` · ${failed} failed` : ''}
              {paused ? ' · paused' : ''}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setPaused((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {paused ? (
              <Play aria-hidden className="h-3.5 w-3.5" />
            ) : (
              <Pause aria-hidden className="h-3.5 w-3.5" />
            )}
            {paused ? 'Resume' : 'Pause'}
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Square aria-hidden className="h-3 w-3" />
            Stop
          </button>
        </div>

        {/* -- Rows ------------------------------------------------------ */}
        <ul
          aria-live="polite"
          aria-relevant="additions"
          aria-label="Tasks"
          className="divide-y divide-border/40"
        >
          {tasks.map((task) => (
            <li key={task.id} className="flex items-start gap-3 px-4 py-3">
              <StateIcon state={task.state} paused={paused} />

              <div className="min-w-0 flex-1">
                <p
                  className={`truncate text-sm ${
                    task.state === 'queued' ? 'text-muted-foreground' : 'font-medium'
                  }`}
                >
                  <span className="sr-only">{STATE_LABEL[task.state]}: </span>
                  {task.title}
                </p>

                {task.detail ? (
                  <p
                    className={`mt-0.5 truncate text-xs ${
                      task.state === 'failed' ? 'text-rose-500' : 'text-muted-foreground'
                    }`}
                  >
                    {task.detail}
                  </p>
                ) : null}

                {task.state === 'running' && typeof task.progress === 'number' ? (
                  <progress
                    value={task.progress}
                    max={100}
                    aria-label={`${task.title} progress`}
                    className="mt-2 h-1 w-full appearance-none overflow-hidden rounded-full [&::-moz-progress-bar]:bg-primary [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-primary"
                  >
                    {task.progress}%
                  </progress>
                ) : null}
              </div>

              {task.state === 'failed' ? (
                <button
                  type="button"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border/60 px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <RotateCw aria-hidden className="h-3 w-3" />
                  Retry
                  {/* Distinguishes this Retry from every other Retry. */}
                  <span className="sr-only"> {task.title}</span>
                </button>
              ) : task.duration ? (
                <span className="shrink-0 pt-0.5 font-mono text-[11px] text-muted-foreground">
                  {task.duration}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function StateIcon({ state, paused }: { state: TaskState; paused: boolean }) {
  const base = 'mt-0.5 h-4 w-4 shrink-0'

  if (state === 'done') return <Check aria-hidden className={`${base} text-emerald-500`} />
  if (state === 'failed') return <AlertCircle aria-hidden className={`${base} text-rose-500`} />
  if (state === 'queued') {
    return (
      <span
        aria-hidden
        className={`${base} rounded-full border-2 border-dashed border-muted-foreground/40`}
      />
    )
  }

  return (
    <Loader2
      aria-hidden
      // Slowed, not stopped, under reduced motion — and genuinely stopped
      // when the run is paused, where a still icon is the correct signal.
      className={`${base} text-primary motion-reduce:[animation-duration:2.4s] ${
        paused ? '' : 'animate-spin'
      }`}
    />
  )
}
