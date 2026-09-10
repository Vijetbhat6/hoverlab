/**
 * Alerting, as the loop it actually is: a rule fires, something happens to
 * a person, and someone eventually decides it was firing too often.
 *
 * Most alert settings screens are a list of thresholds and a list of email
 * addresses, on separate tabs, with nothing joining them. The join is the
 * whole subject. A threshold nobody has tuned and a channel nobody reads
 * produce the same outcome — an incident nobody saw — and you cannot tell
 * which one you have unless the two are on the same screen.
 *
 *   rules        thresholds, with how often each has fired. That number is
 *                the one most rule lists omit and the only one that says
 *                whether the rule is any good
 *   fired        what those rules produced
 *   channels     where it went
 *   digest       what got batched instead of sent immediately
 *   schedule     and when the batch goes out
 *
 * The digest pair is at the end because batching is the answer to the
 * problem the first three sections describe, and an answer read before the
 * problem is just another setting. Someone arriving here because they are
 * being paged too much should scroll through the evidence for that on the
 * way to the control that fixes it.
 */

import * as React from 'react'
import { DashboardAlertRules } from '@/lib/blocks/sources/dashboard-alert-rules'
import { MetricAlertList } from '@/lib/blocks/sources/metric-alert-list'
import { NotificationChannelList } from '@/lib/blocks/sources/notification-channel-list'
import { NotificationDigestList } from '@/lib/blocks/sources/notification-digest-list'
import { DigestScheduleForm } from '@/lib/blocks/sources/digest-schedule-form'

export default function AlertingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto w-full max-w-5xl px-6 pb-2 pt-12">
        <h1 className="text-2xl font-bold tracking-tight">Alerting</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The rules, how often they have fired, where that went — and the
          batching that exists because of the answer.
        </p>
      </section>

      <DashboardAlertRules />
      <MetricAlertList />
      <NotificationChannelList />

      {/* The fix for everything above it, so it comes after. */}
      <NotificationDigestList />
      <DigestScheduleForm />
    </main>
  )
}
