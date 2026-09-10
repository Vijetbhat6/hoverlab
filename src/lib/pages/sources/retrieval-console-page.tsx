/**
 * Why the answer said what it said — the RAG side of an assistant, as an
 * operable screen.
 *
 * The question this page exists to answer is not "is retrieval working".
 * It is "is retrieval working *now*, on the documents I think it has, and
 * did the thing it just told me actually come from one of them". Those are
 * three different questions and most consoles answer only the first.
 *
 * So the order is: what is connected, how stale it is, what it was allowed
 * to look at, what it found, what fitted, and what it cited.
 *
 *   index status     a green tick means the connector works, which is not
 *                    the same as the answers being current
 *   freshness        so the previous sentence has somewhere to be answered
 *   scope            what the query was permitted to see. A retrieval bug
 *                    and a permissions boundary look identical from the
 *                    outside, and only this list tells them apart
 *   chunks           the passages themselves, ranked
 *   budget           what fitted in the window and what fell out of it —
 *                    the most common cause of "it ignored the document I
 *                    gave it", and invisible without this
 *   citations        the published footnotes, which is the only part of
 *                    this page an end user ever sees
 *
 * The empty state is last and it is not an afterthought. A retrieval
 * console that cannot show you a failed search is a console you can only
 * use when you do not need it: <RetrievalEmptyState> says plainly that
 * nothing was found, where it looked, and what the near-misses were, which
 * is the difference between debugging and guessing.
 */

import * as React from 'react'
import { RetrievalIndexStatus } from '@/lib/blocks/sources/retrieval-index-status'
import { RetrievalFreshnessList } from '@/lib/blocks/sources/retrieval-freshness-list'
import { ContextScopeList } from '@/lib/blocks/sources/context-scope-list'
import { ContextChunkCards } from '@/lib/blocks/sources/context-chunk-cards'
import { ContextWindowBudget } from '@/lib/blocks/sources/context-window-budget'
import { SourceCitationList } from '@/lib/blocks/sources/source-citation-list'
import { RetrievalEmptyState } from '@/lib/blocks/sources/retrieval-empty-state'

export default function RetrievalConsolePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto w-full max-w-5xl px-6 pb-2 pt-12">
        <h1 className="text-2xl font-bold tracking-tight">Retrieval</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          What is connected, how current it is, what the query could see, and
          what actually made it into the answer.
        </p>
      </section>

      <RetrievalIndexStatus />
      <RetrievalFreshnessList />
      <ContextScopeList />

      <ContextChunkCards />
      <ContextWindowBudget />
      <SourceCitationList />

      {/* The state a debugging tool is most needed in. */}
      <RetrievalEmptyState />
    </main>
  )
}
