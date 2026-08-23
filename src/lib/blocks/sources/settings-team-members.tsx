'use client'

/**
 * <SettingsTeamMembers> — the member list, with roles and invites.
 *
 * Two rules encoded here that every team-management screen needs and most
 * get wrong:
 *
 *  - The last owner cannot be demoted or removed. Allowing it orphans the
 *    workspace, and it is an easy mistake to make at 5pm on a Friday, so
 *    the control is disabled with a `title` explaining why rather than
 *    failing after the click.
 *  - Pending invites are listed alongside members but visually distinct.
 *    Hiding them in a separate tab is how the same person gets invited
 *    three times.
 */

import * as React from 'react'
import { MoreHorizontal, Mail, UserPlus } from 'lucide-react'

export type Role = 'Owner' | 'Admin' | 'Member'

export interface Member {
  id: string
  name: string
  email: string
  role: Role
  /** Invited but not yet accepted. */
  pending?: boolean
}

export interface SettingsTeamMembersProps {
  members?: Member[]
  seatLimit?: number
  onInvite?: (email: string, role: Role) => void
  className?: string
}

const ROLES: Role[] = ['Owner', 'Admin', 'Member']

const DEFAULT_MEMBERS: Member[] = [
  { id: '1', name: 'Ada Lovelace', email: 'ada@acme.com', role: 'Owner' },
  { id: '2', name: 'Marco Silva', email: 'marco@acme.com', role: 'Admin' },
  { id: '3', name: 'Priya Raman', email: 'priya@acme.com', role: 'Member' },
  { id: '4', name: 'Alex Chen', email: 'alex@contractor.dev', role: 'Member', pending: true },
]

export function SettingsTeamMembers({
  members: initialMembers = DEFAULT_MEMBERS,
  seatLimit = 10,
  onInvite,
  className = '',
}: SettingsTeamMembersProps) {
  // Per-instance ids. A literal id in a reusable component is a
  // collision waiting for the second copy on the page — and a <label>
  // then resolves to whichever input rendered first.
  const uid = React.useId()
  const [members, setMembers] = React.useState(initialMembers)
  const [inviteEmail, setInviteEmail] = React.useState('')
  const [inviteRole, setInviteRole] = React.useState<Role>('Member')

  const ownerCount = members.filter((m) => m.role === 'Owner' && !m.pending).length

  function changeRole(id: string, role: Role) {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role } : m)))
  }

  function handleInvite(event: React.FormEvent) {
    event.preventDefault()
    if (!inviteEmail) return
    onInvite?.(inviteEmail, inviteRole)
    setInviteEmail('')
  }

  return (
    <div className={`overflow-hidden rounded-2xl border border-border/60 bg-card/60 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-6 py-4">
        <div>
          <h2 className="font-semibold tracking-tight">Members</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {members.length} of {seatLimit} seats used
          </p>
        </div>

        <form onSubmit={handleInvite} className="flex items-center gap-2">
          <label htmlFor={`${uid}-invite-email`} className="sr-only">
            Email to invite
          </label>
          <input
            id={`${uid}-invite-email`}
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="colleague@acme.com"
            className="w-48 rounded-xl border border-border/60 bg-background px-3 py-2 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary"
          />

          <label htmlFor={`${uid}-invite-role`} className="sr-only">
            Role for the invitee
          </label>
          <select
            id={`${uid}-invite-role`}
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as Role)}
            className="rounded-xl border border-border/60 bg-background px-2 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {ROLES.filter((r) => r !== 'Owner').map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <UserPlus aria-hidden className="h-4 w-4" />
            Invite
          </button>
        </form>
      </div>

      <ul className="divide-y divide-border/40">
        {members.map((member) => {
          // The workspace must keep at least one owner who has accepted.
          const isLastOwner = member.role === 'Owner' && ownerCount <= 1 && !member.pending
          const lockReason = isLastOwner
            ? 'A workspace needs at least one owner'
            : undefined

          return (
            <li key={member.id} className="flex items-center gap-3 px-6 py-3.5">
              <span
                aria-hidden
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  member.pending ? 'bg-muted/60 text-muted-foreground' : 'bg-muted text-foreground/70'
                }`}
              >
                {member.pending ? (
                  <Mail className="h-4 w-4" />
                ) : (
                  member.name
                    .split(' ')
                    .slice(0, 2)
                    .map((w) => w[0] ?? '')
                    .join('')
                    .toUpperCase()
                )}
              </span>

              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <span className="truncate">{member.pending ? member.email : member.name}</span>
                  {member.pending ? (
                    <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                      Invite pending
                    </span>
                  ) : null}
                </p>
                {!member.pending ? (
                  <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                ) : null}
              </div>

              <label htmlFor={`role-${member.id}`} className="sr-only">
                Role for {member.name}
              </label>
              <select
                id={`role-${member.id}`}
                value={member.role}
                disabled={isLastOwner}
                title={lockReason}
                onChange={(e) => changeRole(member.id, e.target.value as Role)}
                className="rounded-lg border border-border/60 bg-background px-2 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>

              <button
                type="button"
                disabled={isLastOwner}
                title={lockReason}
                aria-label={`Actions for ${member.name}`}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
              >
                <MoreHorizontal aria-hidden className="h-4 w-4" />
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
