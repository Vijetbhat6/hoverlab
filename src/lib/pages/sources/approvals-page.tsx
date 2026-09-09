/**
 * The human half of an automated system: what is waiting, what is overdue,
 * and what the rules were in the first place.
 *
 * An approvals inbox on its own is a list of interruptions. What makes it
 * a tool is the policy underneath it — someone approving their fourth
 * request of the morning needs to know which of these the system would
 * have done unattended, because that is the difference between reviewing
 * and rubber-stamping.
 *
 * The order is queue, escalations, policy. The obvious wrong answer is
 * policy first: it is the explanatory content, and explanatory content at
 * the top of a working screen is read once and scrolled past forever.
 *
 * Escalations sit between them because they are the same queue sorted by a
 * different question — not "what is here" but "what has been here too
 * long". Those are different tasks and a single list serves neither well;
 * the second is the one that turns into a complaint if nobody looks.
 */

import * as React from 'react'
import { ApprovalQueue } from '@/lib/blocks/sources/approval-queue'
import { EscalationQueueList } from '@/lib/blocks/sources/escalation-queue-list'
import { ApprovalPolicyList } from '@/lib/blocks/sources/approval-policy-list'

export default function ApprovalsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto w-full max-w-5xl px-6 pb-2 pt-12">
        <h1 className="text-2xl font-bold tracking-tight">Approvals</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          What needs a person, what has been waiting too long, and the rules
          that decided both.
        </p>
      </section>

      <ApprovalQueue />
      <EscalationQueueList />

      {/* Last, deliberately — see the note above. */}
      <ApprovalPolicyList />
    </main>
  )
}
