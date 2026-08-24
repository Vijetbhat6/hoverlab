'use client'

/**
 * <SettingsDangerZone> — the irreversible actions, gated properly.
 *
 * Destructive confirmation done the way GitHub and Stripe do it: the user
 * types the resource's exact name before the button unlocks. A plain
 * "Are you sure?" dialog is dismissed by reflex; typing `acme-production`
 * cannot be.
 *
 * The comparison is deliberately exact — not trimmed, not case-folded.
 * Loosening it defeats the point, which is to force the user to look at
 * what they are about to destroy.
 *
 * Each action states its consequence and whether it can be undone, because
 * "Delete workspace" and "Transfer ownership" carry very different risk and
 * a shared red border tells the user nothing about which is which.
 */

import * as React from 'react'
import { TriangleAlert } from 'lucide-react'

export interface DangerAction {
  id: string
  title: string
  description: string
  buttonLabel: string
  /** Requires typing `confirmValue` before the button unlocks. */
  requiresTyping?: boolean
  onConfirm?: () => void
}

export interface SettingsDangerZoneProps {
  /** The exact string a user must type — usually the workspace name. */
  confirmValue?: string
  actions?: DangerAction[]
  className?: string
}

const DEFAULT_ACTIONS: DangerAction[] = [
  {
    id: 'transfer',
    title: 'Transfer ownership',
    description:
      'Hand this workspace to another member. You keep admin access, but billing and deletion move to them.',
    buttonLabel: 'Transfer',
  },
  {
    id: 'archive',
    title: 'Archive workspace',
    description:
      'Make everything read-only and stop billing at the end of the period. You can un-archive at any time.',
    buttonLabel: 'Archive',
  },
  {
    id: 'delete',
    title: 'Delete workspace',
    description:
      'Permanently removes all projects, members and history. This cannot be undone and support cannot recover it.',
    buttonLabel: 'Delete workspace',
    requiresTyping: true,
  },
]

export function SettingsDangerZone({
  confirmValue = 'acme-production',
  actions = DEFAULT_ACTIONS,
  className = '',
}: SettingsDangerZoneProps) {
  const [openId, setOpenId] = React.useState<string | null>(null)
  const [typed, setTyped] = React.useState('')
  const uid = React.useId()

  // Exact match. Trimming or case-folding would undo the whole mechanism.
  const confirmed = typed === confirmValue

  function toggle(id: string) {
    setOpenId((current) => (current === id ? null : id))
    setTyped('')
  }

  return (
    <section
      className={`overflow-hidden rounded-2xl border border-destructive/40 bg-card/60 ${className}`}
    >
      <div className="flex items-center gap-2 border-b border-destructive/30 bg-destructive/5 px-6 py-4">
        <TriangleAlert aria-hidden className="h-4 w-4 shrink-0 text-destructive" />
        <div>
          <h2 className="font-semibold tracking-tight text-destructive">Danger zone</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            These actions affect everyone in the workspace.
          </p>
        </div>
      </div>

      <ul className="divide-y divide-border/40">
        {actions.map((action) => {
          const open = openId === action.id

          return (
            <li key={action.id} className="px-6 py-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold">{action.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{action.description}</p>
                </div>

                <button
                  type="button"
                  onClick={() => toggle(action.id)}
                  aria-expanded={open}
                  // Only while the confirmation exists — it is unmounted
                  // when collapsed, and a dangling IDREF is worse than none.
                  aria-controls={open ? `${uid}-${action.id}-confirm` : undefined}
                  className="shrink-0 rounded-xl border border-destructive/50 px-3.5 py-2 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
                >
                  {action.buttonLabel}
                </button>
              </div>

              {open ? (
                <div
                  id={`${uid}-${action.id}-confirm`}
                  className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4"
                >
                  {action.requiresTyping ? (
                    <>
                      <label
                        htmlFor={`confirm-${action.id}`}
                        className="block text-sm font-medium"
                      >
                        Type{' '}
                        <code className="rounded bg-background px-1.5 py-0.5 font-mono text-xs">
                          {confirmValue}
                        </code>{' '}
                        to confirm
                      </label>
                      <input
                        id={`confirm-${action.id}`}
                        autoComplete="off"
                        autoFocus
                        value={typed}
                        onChange={(e) => setTyped(e.target.value)}
                        className="mt-2 w-full max-w-sm rounded-xl border border-border/60 bg-background px-3 py-2 font-mono text-sm outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-destructive"
                      />
                    </>
                  ) : (
                    <p className="text-sm">
                      This will {action.title.toLowerCase()}. Continue?
                    </p>
                  )}

                  <div className="mt-4 flex items-center gap-2">
                    <button
                      type="button"
                      disabled={action.requiresTyping && !confirmed}
                      onClick={() => {
                        action.onConfirm?.()
                        toggle(action.id)
                      }}
                      className="rounded-xl bg-destructive px-3.5 py-2 text-sm font-semibold text-destructive-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
                    >
                      I understand — {action.buttonLabel.toLowerCase()}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggle(action.id)}
                      className="rounded-xl px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
