/**
 * A 403, with the one thing a 403 almost never includes: a way forward.
 *
 * Permission screens tell you that you cannot do something and stop. That
 * is accurate and useless — the reader's next question is always "then who
 * can", and answering it is the difference between a dead end and a
 * two-minute detour.
 *
 * So the denial is first and the team list is under it, naming the people
 * who can grant what was refused. The obvious wrong answer is a support
 * link: this is almost never a support problem, it is an admin sitting two
 * desks away, and routing it through a ticket queue is how a thirty-second
 * fix becomes a day.
 *
 * Worth saying plainly since this page is copied into real products: the
 * roster below has to be filtered to people who can actually grant the
 * specific permission. A list of everyone in the workspace is the same
 * dead end with more names on it.
 */

import * as React from 'react'
import { PermissionDeniedState } from '@/lib/blocks/sources/permission-denied-state'
import { SettingsTeamMembers } from '@/lib/blocks/sources/settings-team-members'

export default function PermissionDeniedPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <PermissionDeniedState />

      <section className="mx-auto w-full max-w-3xl px-6 pt-4">
        <h2 className="text-lg font-bold tracking-tight">Who can grant this</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ask one of them rather than opening a ticket — this is a role
          change, and they can make it without us.
        </p>
      </section>

      <SettingsTeamMembers />
    </main>
  )
}
