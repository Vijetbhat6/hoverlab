/**
 * What happened, and what is about to.
 *
 * Two views of the same axis pointed in opposite directions, which is why
 * they belong on one screen rather than two: a timeline reads backwards
 * from now, a calendar reads forwards from it. Products routinely build
 * both and put them in different parts of the navigation, so nobody ever
 * sees that Tuesday was busy *because* of what shipped on Monday.
 *
 *   timeline    events grouped by day on a vertical rail, one entry
 *               expanded, so the page shows what a detail looks like
 *               rather than promising there is one
 *   calendar    a month where chips truncate and overflow becomes "+n
 *               more" — so a busy Tuesday never changes the row height and
 *               the grid stays a grid
 *   empty       and the state a new workspace is in for its first week
 *
 * <EmptyState> closing the page is deliberate. Both surfaces above it are
 * useless on day one, and a product that only illustrates its populated
 * state is a product whose first screen nobody designed. The block's two
 * variants are the reason it earns the space: "nothing created yet" and
 * "your filters excluded everything" need different words, and offering
 * "create your first item" to someone who has two hundred of them, hidden
 * behind a filter, is the more common mistake.
 */

import * as React from 'react'
import { ActivityTimeline } from '@/lib/blocks/sources/activity-timeline'
import { CalendarMonth } from '@/lib/blocks/sources/calendar-month'
import { EmptyState } from '@/lib/blocks/sources/empty-state-cta'

export default function WorkspaceActivityPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto w-full max-w-5xl px-6 pb-2 pt-12">
        <h1 className="text-2xl font-bold tracking-tight">Activity</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Backwards from now, forwards from now, and what both look like in
          a workspace that is one day old.
        </p>
      </section>

      <ActivityTimeline />
      <CalendarMonth />

      {/* Day one, which neither of the above illustrates. */}
      <EmptyState />
    </main>
  )
}
