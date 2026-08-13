/**
 * The assistant screen — a real agent working inside a real app.
 *
 * The composition is the lesson, and it is a different lesson from the
 * dashboard's. A dashboard is panels beside panels; an assistant screen is a
 * *transcript* down the middle, with everything else demoted to a rail. Get
 * that hierarchy backwards — chat in a sidebar, panels in the centre — and
 * the thing a user came to do is the smallest element on screen.
 *
 * The order down the transcript is the argument:
 *
 *   question → reasoning → answer → the action it wants to take
 *
 * Reasoning sits between the question and the answer, collapsed. Below the
 * answer it reads as a footnote nobody opens; above it, closed, the answer
 * is still the first thing read but the working is one click away at the
 * moment doubt appears rather than after the user has already acted. That is
 * why the question is rendered here and `<ChatStreamingAnswer>` is given an
 * empty one — the block draws its own bubble when used alone, and inside a
 * thread that would print the same sentence twice.
 *
 * The approval card is last and is the only element that can change
 * anything. That is deliberate: on this screen the agent can read whatever
 * the rail permits and say whatever it likes, but the single point where it
 * touches the world is a card the user has to answer.
 *
 * The rail carries what the transcript cannot: what the agent is allowed to
 * read, and what it noticed that nobody asked about. Both are context for
 * judging the transcript, which is why they are beside it rather than in it.
 *
 * The composer flows at the end of the transcript rather than being pinned.
 * In a real full-height app it should be `sticky bottom-0`; here the shell
 * is a fixed 32rem demo box, and a sticky composer inside a 512px scrollport
 * covers the very turns this screen exists to show. Worth knowing before
 * copying it into a layout that *is* full height.
 */

import * as React from 'react'
import { Bot, MessagesSquare, Sparkles, Wrench } from 'lucide-react'

import { DashboardShell } from '@/lib/blocks/sources/dashboard-shell'
import { AgentThinkingTrace } from '@/lib/blocks/sources/agent-thinking-trace'
import { ChatStreamingAnswer } from '@/lib/blocks/sources/chat-streaming-answer'
import { ApprovalRequestCard } from '@/lib/blocks/sources/approval-request-card'
import { ChatPromptBar } from '@/lib/blocks/sources/chat-prompt-bar'
import { KnowledgeSourcePicker } from '@/lib/blocks/sources/knowledge-source-picker'
import { AiInsightCards } from '@/lib/blocks/sources/ai-insight-cards'

const NAV = [
  { label: 'Assistant', icon: <Bot className="h-4 w-4" /> },
  { label: 'Threads', icon: <MessagesSquare className="h-4 w-4" />, badge: '3' },
  { label: 'Automations', icon: <Wrench className="h-4 w-4" /> },
]

export default function AiAssistantPage() {
  return (
    <DashboardShell brand="Acme Copilot" nav={NAV} activeLabel="Assistant">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        {/* -- The transcript ------------------------------------------- */}
        <div className="min-w-0">
          <header className="mb-5 flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles aria-hidden className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold tracking-tight">
                Q3 churn review
              </h1>
              <p className="truncate text-xs text-muted-foreground">
                Started 14 minutes ago · 4 tools used · reading 3 sources
              </p>
            </div>
          </header>

          {/* The turn being answered. Rendered here so the reasoning can
              sit between it and the reply. */}
          <p className="mb-4 text-right text-sm">
            <span className="inline-block rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-left text-primary-foreground">
              Why did churn spike in Q3?
            </span>
          </p>

          {/* Closed by default: available at the moment of doubt, not in the
              way of the answer. */}
          <AgentThinkingTrace defaultOpen={false} className="!max-w-none !p-0" />

          <div className="mt-3">
            <ChatStreamingAnswer question="" className="!max-w-none !p-0" />
          </div>

          {/* The one element on this screen that can change anything. */}
          <div className="mt-6">
            <ApprovalRequestCard className="!max-w-none" />
          </div>

          <div className="mt-6 border-t border-border/60 pt-4">
            <ChatPromptBar className="!max-w-none !p-0" />
          </div>
        </div>

        {/* -- The rail --------------------------------------------------- */}
        <aside className="min-w-0 space-y-6" aria-label="Assistant context">
          <AiInsightCards className="!max-w-none !p-0" />
          <KnowledgeSourcePicker className="!max-w-none !p-0" />
        </aside>
      </div>
    </DashboardShell>
  )
}
