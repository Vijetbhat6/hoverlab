/**
 * What the agent is doing, what it did, and what it wants you to accept.
 *
 * `agent-run-page` next door is the happy path: a trace, in order, ending
 * in an answer. This is the screen for the other three states, and they are
 * the states that decide whether anyone trusts the thing.
 *
 * The order is by how much of the user's attention each one is entitled to.
 *
 *   task list        the run, as rows. Ambient. Glanced at.
 *   working          the gap before the first token, which is where people
 *                    decide the product is broken
 *   failure          the trace after something broke, with the retries and
 *                    what each one cost counted in the open
 *   diff review      the machine's proposed edits, accepted one at a time
 *   confidence       how sure it was, as a native meter and in words
 *
 * <AgentWorkingIndicator> is second rather than buried because an empty
 * pane during a thirty-second tool call is indistinguishable from a hang,
 * and "indistinguishable from a hang" is a support ticket. It is the
 * cheapest component on this page and the one that changes the most.
 *
 * The diff review is deliberately after the failure trace. Reviewing
 * proposed changes is the moment a person is asked to take responsibility
 * for the machine's work, and they should reach it having already seen what
 * this system looks like when it is wrong.
 *
 * Confidence is last for the same reason a footnote is last: it qualifies
 * everything above it, and a score at the top of a screen gets read as a
 * grade rather than a caveat.
 */

import * as React from 'react'
import { AgentTaskList } from '@/lib/blocks/sources/agent-task-list'
import { AgentWorkingIndicator } from '@/lib/blocks/sources/agent-working-indicator'
import { AgentRunFailure } from '@/lib/blocks/sources/agent-run-failure'
import { AgentDiffReview } from '@/lib/blocks/sources/agent-diff-review'
import { ConfidenceRecommendation } from '@/lib/blocks/sources/confidence-recommendation'

export default function AgentInspectorPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto w-full max-w-5xl px-6 pb-2 pt-12">
        <h1 className="text-2xl font-bold tracking-tight">Run inspector</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          What is running, what it looks like while you wait, what it looks
          like when it breaks, and what it is asking you to approve.
        </p>
      </section>

      <AgentTaskList />
      <AgentWorkingIndicator />
      <AgentRunFailure />
      <AgentDiffReview />

      {/* A caveat, so it reads as one. */}
      <ConfidenceRecommendation />
    </main>
  )
}
