/**
 * One agent run, opened up — what it thought, what it called, what it
 * retried, and what it cost.
 *
 * The four panels here are usually four products' worth of surface, and
 * most agent UIs ship the first one alone: a reasoning trace, which shows
 * the thinking and hides everything that makes the thinking trustworthy.
 *
 * The order is the order somebody debugs in. The trace says what it was
 * trying to do; the tool calls say what it actually did; the retry log
 * says what went wrong on the way, which is invisible in the first two;
 * and the cost breakdown says what that sequence was worth. Reading them
 * in that order turns a run from a wall of text into an account.
 *
 * The obvious wrong answer is putting cost first because it is the
 * smallest number on the page. Cost is the last question, not the first —
 * nobody asks what a run cost until they know whether it worked.
 *
 * A note for anyone copying this: the retry log is the panel to keep if
 * you only keep one besides the trace. A retried step that is invisible
 * reads as a slow agent, and slowness with no explanation is the most
 * common reason these products get abandoned.
 */

import * as React from 'react'
import { AgentThinkingTrace } from '@/lib/blocks/sources/agent-thinking-trace'
import { AgentToolCalls } from '@/lib/blocks/sources/agent-tool-calls'
import { AgentRetryLog } from '@/lib/blocks/sources/agent-retry-log'
import { AgentCostBreakdown } from '@/lib/blocks/sources/agent-cost-breakdown'

export default function AgentRunPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto w-full max-w-3xl px-6 pb-2 pt-12">
        <h1 className="text-2xl font-bold tracking-tight">Run detail</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything the run did, in the order you would debug it — intent,
          actions, failures, then cost.
        </p>
      </section>

      <AgentThinkingTrace />
      <AgentToolCalls />
      <AgentRetryLog />
      <AgentCostBreakdown />
    </main>
  )
}
