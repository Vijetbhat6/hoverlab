/**
 * The watch screen — the page a streaming subscription is actually for.
 *
 *   player     the stage, the controls, and what is next
 *   chapters   the episode broken into parts you can jump to
 *   notes      the transcript and the links, which is why people return
 *   more       the rest of the series
 *
 * THIS IS THE ONLY PAGE IN THE CATALOG WHOSE JOB IS TO GET OUT OF THE WAY.
 * Everything else in the pages tier is trying to convert, explain or
 * collect; this one has a single piece of content that is already playing,
 * and every block below it is there for the reader who has paused.
 *
 * <NavbarAuthenticated> IS THE ONE THAT LOOKS RIGHT AND IS WRONG. It is
 * the catalog's signed-in navbar, so it is the obvious reach — but what it
 * actually carries is a workspace switcher with plans and environments,
 * which is a B2B SaaS concept a streaming viewer does not have. The honest
 * choice is the plain navbar with the viewer's profile as the trailing
 * action, and the lesson is that "signed-in" is not one shape.
 *
 * <ProductInfoAccordion> CARRIES THE TRANSCRIPT AND THE LINKS, collapsed.
 * The transcript is the most-used thing on a page like this after the
 * player itself — it is how people find the four minutes they wanted to
 * re-watch — but it is also two thousand words, and expanding it by default
 * would bury the episode rail under a wall of text. Collapsed and clearly
 * labelled is the right default; searchable is what makes it valuable, and
 * find-in-page does that for free once it is open.
 *
 * THE CHAPTERS ARE `specs` ON THE ACCORDION, not a timeline block.
 * <ActivityTimeline> looks like the match — timestamps, titles, details —
 * until you read its types: its `detail` is a `{removed, added}` diff and
 * its events carry a `kind` from an audit-log vocabulary. Bending a chapter
 * list into that shape would have produced a page whose data lied about
 * what it was. A definition list of timecode to title is what a chapter
 * list is, and the accordion already renders one.
 *
 * NO COMMENTS SECTION. Not an oversight: a comment thread under a video is
 * a moderation commitment rather than a component, and a template that
 * ships the markup without the commitment teaches the wrong lesson.
 *
 * Anchors are prefixed `wp-`.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { VideoPlayerShell } from '@/lib/blocks/sources/video-player-shell'
import { ProductInfoAccordion } from '@/lib/blocks/sources/product-info-accordion'
import { ProductRail } from '@/lib/blocks/sources/product-rail'
import { FooterMinimal } from '@/lib/blocks/sources/footer-minimal'

const UP_NEXT = [
  {
    title: 'Where the time actually goes',
    duration: '12:04',
    meta: 'Episode 3 · watching now',
    current: true,
  },
  { title: 'Reading a flame graph without guessing', duration: '18:41', meta: 'Episode 4', href: '#' },
  { title: 'The three allocations that mattered', duration: '09:57', meta: 'Episode 5', href: '#' },
  { title: 'Making the fix stick in CI', duration: '15:22', meta: 'Episode 6', href: '#' },
  { title: 'What we would do differently', duration: '07:15', meta: 'Episode 7', href: '#' },
]

/* Timecode → title. A chapter list is a definition list, not a feed. */
const CHAPTERS = [
  { label: '00:00', value: 'The page that feels slow' },
  { label: '02:10', value: 'Measuring before guessing' },
  { label: '05:32', value: 'The flame graph, read out loud' },
  { label: '09:18', value: 'The quadratic query plan' },
  { label: '11:26', value: 'Two lines, and what they cost to find' },
]

const NOTES = [
  {
    id: 'wp-chapters-section',
    title: 'Chapters',
    defaultOpen: true,
    body: [
      'Five chapters across twelve minutes. Selecting one seeks the player; the timecodes are also in the description of every download.',
    ],
    specs: CHAPTERS,
  },
  {
    id: 'wp-transcript',
    title: 'Transcript',
    body: [
      'Human-written, timestamped, and searchable with find-in-page once it is open. Six languages are available from the subtitles menu in the player.',
      '00:00 — This page takes about two and a half seconds to become interactive, and the complaint that started this was not a number at all. It was a support message saying the checkout "hangs for a second". That is a better bug report than any score, because it tells you when it happens rather than how much.',
      '00:41 — The first thing I am not going to do is open the profiler on my laptop. My laptop has a fast disk, a warm cache and eleven rows in the table. Everything I would learn here would be about my laptop.',
      '02:10 — So this is a production trace, sampled, from a request that actually took 2.4 seconds. Nothing synthetic. The whole rest of this episode is reading it.',
    ],
    specs: [
      { label: 'Languages', value: 'English, German, French, Spanish, Portuguese, Japanese' },
      { label: 'Written by', value: 'A person, not auto-generated' },
      { label: 'Runtime', value: '12 minutes 4 seconds' },
      { label: 'Published', value: '4 March 2026' },
    ],
  },
  {
    id: 'wp-links',
    title: 'Everything mentioned in this episode',
    body: [
      'The profiler is open source and the flame graph viewer is the one bundled with it — no paid tooling is used anywhere in this series.',
      'The example service, the failing query and the trace shown at 02:10 are all in a public repository, so you can open the same trace and follow along rather than watch someone else do it.',
    ],
  },
  {
    id: 'wp-errata',
    title: 'Corrections',
    body: [
      'At 06:12 the narration says the plan "goes quadratic above 400 rows". It is 400 line items per order, not rows in the table — the distinction matters and the on-screen text is right where the voiceover is not.',
      'Corrections are listed here rather than silently re-cut, and the episode is never replaced after publication.',
    ],
  },
]

const SERIES = [
  { id: 'wp-s1', name: 'Migrations Without Downtime · 5 episodes', price: 0, swatch: 'from-lime-500/30 to-emerald-500/30' },
  { id: 'wp-s2', name: 'The Incident · 4 episodes', price: 0, swatch: 'from-rose-500/30 to-orange-500/30' },
  { id: 'wp-s3', name: 'Postgres at Scale · 12 episodes', price: 0, swatch: 'from-violet-500/30 to-fuchsia-500/30' },
  { id: 'wp-s4', name: 'On Call · 6 episodes', price: 0, swatch: 'from-cyan-500/30 to-blue-500/30' },
  { id: 'wp-s5', name: 'Type Systems in Anger · 10 episodes', price: 0, swatch: 'from-slate-500/30 to-zinc-500/30' },
]

export default function WatchPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple
        brand="Longform"
        links={[
          { label: 'Browse', href: '#' },
          { label: 'My list', href: '#' },
          { label: 'Downloads', href: '#' },
        ]}
        activeLabel="Browse"
        ctaLabel="Your profile"
      />

      <main>
        <div id="wp-player">
          <VideoPlayerShell
            title="Where the time actually goes"
            seriesLabel="Profiling, end to end · Episode 3 of 7"
            metaLine="48,219 views · published 4 March · 12 minutes"
            description="We take a page that feels slow and find out what is actually slow about it, with a profiler open the whole time and no guessing. The fix at the end is two lines; finding it is the other eleven minutes."
            elapsed="4:18"
            duration="12:04"
            playedPercent={36}
            bufferedPercent={61}
            badge="Episode 3"
            upNextHeading="Next in this series"
            upNext={UP_NEXT}
          />
        </div>

        <div id="wp-chapters">
          <ProductInfoAccordion sections={NOTES} />
        </div>

        <ProductRail
          heading="More from Longform"
          subheading="Five other series. Everything is released complete — there is no weekly drip and nothing expires."
          products={SERIES}
          currency="GBP"
          locale="en-GB"
          viewAllHref="#"
        />
      </main>

      <FooterMinimal
        brand="Longform"
        links={[
          { label: 'Browse', href: '#' },
          { label: 'Transcripts', href: '#wp-transcript' },
          { label: 'Accessibility', href: '#' },
          { label: 'Account', href: '#' },
        ]}
      />
    </div>
  )
}
