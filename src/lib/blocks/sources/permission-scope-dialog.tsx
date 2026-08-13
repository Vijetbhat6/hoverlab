/**
 * <PermissionScopeDialog> — granting an agent the tools it asked for, one
 * scope at a time, with a duration.
 *
 * The OAuth consent screen is the closest existing pattern and it is the
 * wrong one to copy wholesale: it grants forever, it bundles read with
 * write, and it renders scopes as machine strings. An agent needs the same
 * consent moment done better.
 *
 *  - Read and write scopes are visually and structurally separated. Bundling
 *    "see your invoices" with "issue refunds" behind one switch is how a
 *    user grants something they would have refused.
 *  - Write scopes default OFF. Every default here is the least powerful
 *    grant that still lets the agent do something, because a default is what
 *    most users will accept unchanged.
 *  - The grant has an expiry, chosen with radios. A permission with no end
 *    is the one nobody remembers to revoke.
 *  - Each switch is a real `<input type="checkbox" role="switch">` inside a
 *    `<label>`, so the whole row is a hit target, the state is announced as
 *    on/off, and space toggles it. Switch-shaped divs with click handlers
 *    are the usual version and are invisible to a keyboard.
 *  - The confirm button's label counts what is being granted, so the last
 *    thing read before committing is the size of the grant.
 */

'use client'

import * as React from 'react'
import { Clock, Eye, KeyRound, PencilLine, ShieldCheck } from 'lucide-react'

export interface PermissionScope {
  id: string
  label: string
  detail: string
  /** Write scopes are grouped apart and default to off. */
  write?: boolean
  /** Cannot be turned off — the agent does nothing without it. */
  required?: boolean
}

export interface PermissionScopeDialogProps {
  agentName?: string
  purpose?: string
  scopes?: PermissionScope[]
  durations?: string[]
  className?: string
}

const DEFAULT_SCOPES: PermissionScope[] = [
  {
    id: 'read-accounts',
    label: 'Read accounts and contacts',
    detail: 'Names, plan, seat count, renewal date',
    required: true,
  },
  {
    id: 'read-usage',
    label: 'Read product usage events',
    detail: 'Last 90 days, aggregated per account',
  },
  {
    id: 'read-tickets',
    label: 'Read support tickets',
    detail: 'Subject and status only — message bodies stay private',
  },
  {
    id: 'write-notes',
    label: 'Write notes on accounts',
    detail: 'Appends to the activity log; nothing is overwritten',
    write: true,
  },
  {
    id: 'write-email',
    label: 'Send email on your behalf',
    detail: 'From retention@acme.com, to customers, without a second prompt',
    write: true,
  },
]

const DEFAULT_DURATIONS = ['This session', '7 days', '30 days']

export function PermissionScopeDialog({
  agentName = 'Retention agent',
  purpose = 'It needs to see who is at risk, and — if you let it — act on that.',
  scopes = DEFAULT_SCOPES,
  durations = DEFAULT_DURATIONS,
  className = '',
}: PermissionScopeDialogProps) {
  // Reads on, writes off. The default is the grant most people will accept
  // without reading, so it has to be the safe one.
  const [granted, setGranted] = React.useState<string[]>(
    scopes.filter((s) => !s.write).map((s) => s.id),
  )
  const [duration, setDuration] = React.useState(durations[0] ?? '')

  const reads = scopes.filter((s) => !s.write)
  const writes = scopes.filter((s) => s.write)
  const writeCount = writes.filter((s) => granted.includes(s.id)).length
  const headingId = React.useId()

  function toggle(scope: PermissionScope) {
    if (scope.required) return
    setGranted((list) =>
      list.includes(scope.id) ? list.filter((x) => x !== scope.id) : [...list, scope.id],
    )
  }

  return (
    <div className={`flex justify-center p-6 ${className}`}>
      <section
        aria-labelledby={headingId}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl"
      >
        {/* -- Header ----------------------------------------------------- */}
        <div className="border-b border-border/60 px-5 py-4 text-center">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <KeyRound aria-hidden className="h-5 w-5" />
          </span>
          <h3 id={headingId} className="mt-3 text-base font-semibold">
            Give {agentName} access
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{purpose}</p>
        </div>

        {/* Tall enough to show the write scopes without scrolling. A cap
            that hides them defeats the block: "writes are off by default"
            is only reassuring if you can see the writes. */}
        <div className="max-h-[32rem] space-y-5 overflow-y-auto px-5 py-4">
          <ScopeGroup
            icon={<Eye aria-hidden className="h-3.5 w-3.5" />}
            title="Can see"
            scopes={reads}
            granted={granted}
            onToggle={toggle}
          />

          {writes.length > 0 ? (
            <ScopeGroup
              icon={<PencilLine aria-hidden className="h-3.5 w-3.5" />}
              title="Can change"
              note="Off by default. These act without asking again."
              scopes={writes}
              granted={granted}
              onToggle={toggle}
              emphasised
            />
          ) : null}

          {/* -- Duration -------------------------------------------------- */}
          <fieldset>
            <legend className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <Clock aria-hidden className="h-3.5 w-3.5" />
              Expires after
            </legend>

            <div className="flex gap-2">
              {durations.map((option) => (
                <label
                  key={option}
                  className={`flex flex-1 cursor-pointer items-center justify-center rounded-xl border px-2 py-2 text-xs font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring ${
                    option === duration
                      ? 'border-primary bg-primary/5 text-foreground'
                      : 'border-border/60 text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  <input
                    type="radio"
                    name={`${headingId}-duration`}
                    value={option}
                    checked={option === duration}
                    onChange={() => setDuration(option)}
                    className="sr-only"
                  />
                  {option}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        {/* -- Commit ------------------------------------------------------ */}
        <div className="space-y-2 border-t border-border/60 bg-muted/30 px-5 py-4">
          <button
            type="button"
            className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {/* Counting the grant in the label puts the size of the decision
                in the last thing read before it is made. */}
            Grant {granted.length} {granted.length === 1 ? 'permission' : 'permissions'}
            {writeCount > 0 ? ` — ${writeCount} that can change data` : ''}
          </button>

          <button
            type="button"
            className="w-full rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Not now
          </button>

          <p className="flex items-center justify-center gap-1.5 pt-1 text-xs text-muted-foreground">
            <ShieldCheck aria-hidden className="h-3.5 w-3.5" />
            Revocable at any time from Settings → Agents
          </p>
        </div>
      </section>
    </div>
  )
}

function ScopeGroup({
  icon,
  title,
  note,
  scopes,
  granted,
  onToggle,
  emphasised = false,
}: {
  icon: React.ReactNode
  title: string
  note?: string
  scopes: PermissionScope[]
  granted: string[]
  onToggle: (scope: PermissionScope) => void
  emphasised?: boolean
}) {
  return (
    <div>
      <h4
        className={`mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${
          emphasised ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'
        }`}
      >
        {icon}
        {title}
      </h4>

      {note ? <p className="mb-2 text-xs text-muted-foreground">{note}</p> : null}

      <ul className="space-y-1">
        {scopes.map((scope) => {
          const on = granted.includes(scope.id)

          return (
            <li key={scope.id}>
              <label
                className={`flex items-start gap-3 rounded-xl px-2.5 py-2 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring ${
                  scope.required ? '' : 'cursor-pointer hover:bg-muted/50'
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
                    {scope.label}
                    {scope.required ? (
                      <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                        Required
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                    {scope.detail}
                  </span>
                </span>

                {/*
                  A checkbox with role="switch" — announced "on"/"off" rather
                  than "checked", toggled with space, and reachable by tab.
                  The visual switch is drawn from its state with peer-*, so
                  there is no second source of truth.
                */}
                <span className="relative mt-0.5 shrink-0">
                  <input
                    type="checkbox"
                    role="switch"
                    checked={on}
                    disabled={scope.required}
                    onChange={() => onToggle(scope)}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden
                    className="block h-5 w-9 rounded-full bg-muted-foreground/30 transition-colors peer-checked:bg-primary peer-disabled:opacity-50"
                  />
                  <span
                    aria-hidden
                    className="absolute left-0.5 top-0.5 block h-4 w-4 rounded-full bg-background transition-transform peer-checked:translate-x-4"
                  />
                </span>
              </label>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
