/**
 * Planned downtime, which is the one outage that can be written in advance.
 *
 * The difference between this and the 500 page is knowledge: here we know
 * what is happening and roughly when it ends, and the entire job of the
 * page is to transfer those two facts. A visitor who leaves knowing the
 * end time does not open a ticket.
 *
 * The obvious wrong answer is "we'll be back soon". Soon is not a time,
 * and a maintenance page without one is indistinguishable from an outage
 * nobody has noticed.
 *
 * The status footer is under it because the second question — after "when"
 * — is "is this everything or just the part I use", and a locale and
 * status row answers that without a second page.
 */

import * as React from 'react'
import { MaintenanceWindowState } from '@/lib/blocks/sources/maintenance-window-state'
import { FooterStatusLocale } from '@/lib/blocks/sources/footer-status-locale'

export default function MaintenancePage() {
  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <div className="flex-1">
        <MaintenanceWindowState />
      </div>

      {/* Pushed to the bottom by the flex column above, so a short page
          does not leave the status row floating mid-screen. */}
      <FooterStatusLocale />
    </main>
  )
}
