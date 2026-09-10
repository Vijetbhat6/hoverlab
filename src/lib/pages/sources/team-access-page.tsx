/**
 * Who is in, what they can reach, and what they did — the admin screen a
 * security questionnaire is actually asking about.
 *
 * The unifying idea is that every section here is one half of a pair, and
 * products routinely ship one half. Seats without invitations. Sharing
 * without scopes. Sessions without an audit trail. Each of those pairs is
 * fine on its own and useless as a control, because the question an
 * administrator has is never "who has a seat" — it is "who can reach the
 * customer table, and when did they last do it".
 *
 * So the order runs from the commercial fact to the forensic one:
 *
 *   seats        changing headcount with the bill shown first, including
 *                the part-period charge, because a surprise invoice is how
 *                a team stops adding people who need access
 *   invite       addresses pasted, typos caught, roles assigned
 *   scopes       read and write separated rather than bundled, writes off
 *                by default, an expiry that is required
 *   sharing      where a design mistake is a data leak — general access
 *                stated as its consequence, not as a setting name
 *   sessions     the screen people go looking for after losing a laptop
 *   audit        named actors, before and after values, and a retention
 *                period stated rather than implied
 *
 * <SettingsAuditLog> is last because it is the only read-only surface here.
 * Everything above it changes something; it records that the change
 * happened. Putting it first would turn an admin screen into a report.
 */

import * as React from 'react'
import { BillingSeatManager } from '@/lib/blocks/sources/billing-seat-manager'
import { TeamInviteStep } from '@/lib/blocks/sources/team-invite-step'
import { PermissionScopeDialog } from '@/lib/blocks/sources/permission-scope-dialog'
import { ShareAccessDialog } from '@/lib/blocks/sources/share-access-dialog'
import { SettingsSessions } from '@/lib/blocks/sources/settings-sessions'
import { SettingsAuditLog } from '@/lib/blocks/sources/settings-audit-log'

export default function TeamAccessPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto w-full max-w-5xl px-6 pb-2 pt-12">
        <h1 className="text-2xl font-bold tracking-tight">Team &amp; access</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Seats, invitations, scopes, sharing, live sessions — and the trail
          that says what each of them was used for.
        </p>
      </section>

      <BillingSeatManager />
      <TeamInviteStep />
      <PermissionScopeDialog />
      <ShareAccessDialog />
      <SettingsSessions />

      {/* The only read-only surface here, so it closes rather than opens. */}
      <SettingsAuditLog />
    </main>
  )
}
