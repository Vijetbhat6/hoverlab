'use client'

/**
 * <VideoCallLayout> — the call screen, with the bits that get skipped.
 *
 * A grid of rectangles is the easy 20% of a call UI. The rest is state, and it
 * is the state that decides whether a call is usable:
 *
 *  - **Who is speaking.** An active-speaker ring, not just a name label. In a
 *    grid of six, working out who is talking from lip movement over a lagged
 *    stream is genuinely hard, and the ring is the fix.
 *  - **Who is muted, and who is muted *and* talking.** The second one is the
 *    most common event on any call and deserves its own affordance — a "your
 *    microphone is off" nudge, which this shows when you speak while muted.
 *  - **Connection quality per tile.** A frozen participant is either frozen or
 *    gone, and the difference matters. Two bars beside the name says which.
 *  - **A self-view that can be hidden.** Constantly seeing yourself is
 *    measurably tiring, and "hide self-view" is the single most appreciated
 *    control any conferencing product has shipped.
 *
 * THE GRID IS `auto-fit`, NOT A BREAKPOINT TABLE
 *
 * `repeat(auto-fit, minmax(…))` with a fixed aspect ratio per tile gives the
 * right number of columns at every width without a media query per count, and
 * it degrades to one column on a phone by itself. Hand-written per-count grid
 * classes are how a call layout ends up with a special case for five people.
 *
 * THE CONTROL BAR IS ANCHORED AND FINGER-SIZED. 44px minimum targets, the
 * destructive Leave separated from the toggles by a gap rather than by colour
 * alone, because "I meant to mute" is the worst possible misclick.
 *
 * ACCESSIBILITY: each toggle's state is in its accessible name ("Microphone,
 * off") rather than only in a slashed glyph; the speaking indicator is mirrored
 * in a visually hidden live region, throttled to changes rather than to frames;
 * tiles are list items with real names, not decorative boxes.
 */

import * as React from 'react'
import {
  Hand,
  Mic,
  MicOff,
  Monitor,
  PhoneOff,
  Signal,
  SignalLow,
  Users,
  Video,
  VideoOff,
} from 'lucide-react'

export interface Participant {
  id: string
  name: string
  initials: string
  muted?: boolean
  cameraOff?: boolean
  speaking?: boolean
  handRaised?: boolean
  quality: 'good' | 'poor'
  self?: boolean
}

export interface VideoCallLayoutProps {
  title?: string
  elapsed?: string
  participants?: Participant[]
  className?: string
}

const DEFAULT_PARTICIPANTS: Participant[] = [
  { id: 'p1', name: 'Priya Raman', initials: 'PR', speaking: true, quality: 'good' },
  { id: 'p2', name: 'Sam Okafor', initials: 'SO', muted: true, quality: 'good' },
  { id: 'p3', name: 'Jordan Lee', initials: 'JL', cameraOff: true, quality: 'poor' },
  { id: 'p4', name: 'Marte Haugen', initials: 'MH', handRaised: true, muted: true, quality: 'good' },
  { id: 'p5', name: 'You', initials: 'YU', self: true, quality: 'good' },
]

export function VideoCallLayout({
  title = 'Rotterdam delivery review',
  elapsed = '18:42',
  participants = DEFAULT_PARTICIPANTS,
  className = '',
}: VideoCallLayoutProps) {
  const [micOn, setMicOn] = React.useState(false)
  const [cameraOn, setCameraOn] = React.useState(true)
  const [sharing, setSharing] = React.useState(false)
  const [hideSelf, setHideSelf] = React.useState(false)
  const [speakingWhileMuted, setSpeakingWhileMuted] = React.useState(true)

  const speaker = participants.find((p) => p.speaking)
  const visible = participants.filter((p) => !(p.self && hideSelf))

  return (
    <section className={`bg-background px-4 py-10 sm:px-6 ${className}`}>
      <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-border bg-foreground/[0.04] dark:bg-foreground/[0.06]">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-3">
          <div>
            <h2 className="text-sm font-semibold">{title}</h2>
            <p className="text-xs text-muted-foreground">
              {elapsed} · {participants.length} people
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Users aria-hidden className="h-3.5 w-3.5" />
            People
          </button>
        </header>

        {/* auto-fit, not a breakpoint table — see the docblock. */}
        <ul
          className="grid gap-2 p-3"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(11rem, 1fr))' }}
        >
          {visible.map((person) => (
            <li
              key={person.id}
              className={`relative overflow-hidden rounded-xl bg-foreground/10 ring-2 transition-colors ${
                person.speaking ? 'ring-primary' : 'ring-transparent'
              }`}
              style={{ aspectRatio: '4 / 3' }}
            >
              <div className="grid h-full place-items-center">
                {person.cameraOff ? (
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-card text-sm font-bold text-muted-foreground">
                    {person.initials}
                  </span>
                ) : (
                  <span
                    aria-hidden
                    className="grid h-12 w-12 place-items-center rounded-full bg-primary/20 text-sm font-bold text-primary"
                  >
                    {person.initials}
                  </span>
                )}
              </div>

              {person.handRaised ? (
                <span className="absolute top-2 end-2 grid h-6 w-6 place-items-center rounded-full bg-amber-500 text-white">
                  <Hand aria-hidden className="h-3.5 w-3.5" />
                  <span className="sr-only">{person.name} has a hand raised</span>
                </span>
              ) : null}

              <div className="absolute inset-x-2 bottom-2 flex items-center gap-1.5 rounded-lg bg-background/80 px-2 py-1 backdrop-blur">
                {person.muted ? (
                  <MicOff aria-hidden className="h-3 w-3 shrink-0 text-destructive" />
                ) : (
                  <Mic aria-hidden className="h-3 w-3 shrink-0 text-muted-foreground" />
                )}
                <span className="min-w-0 flex-1 break-words text-[11px] font-medium">
                  {person.name}
                  {person.self ? ' (you)' : ''}
                </span>
                {/* Frozen or gone — the difference matters. */}
                {person.quality === 'poor' ? (
                  <span className="ms-auto inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
                    <SignalLow aria-hidden className="h-3 w-3" />
                    Weak
                  </span>
                ) : (
                  <Signal aria-hidden className="ms-auto h-3 w-3 text-muted-foreground" />
                )}
                <span className="sr-only">
                  {person.muted ? 'Muted. ' : ''}
                  {person.cameraOff ? 'Camera off. ' : ''}
                  {person.quality === 'poor' ? 'Weak connection.' : ''}
                </span>
              </div>
            </li>
          ))}
        </ul>

        {/* Changes only, not frames. */}
        <p aria-live="polite" className="sr-only">
          {speaker ? `${speaker.name} is speaking` : 'Nobody is speaking'}
        </p>

        {/* The most common event on any call. */}
        {!micOn && speakingWhileMuted ? (
          <div
            role="status"
            className="mx-3 mb-2 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2"
          >
            <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
              Your microphone is off — we can see you talking.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setMicOn(true)
                  setSpeakingWhileMuted(false)
                }}
                className="rounded-lg bg-amber-600 px-2.5 py-1 text-xs font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Unmute
              </button>
              <button
                type="button"
                onClick={() => setSpeakingWhileMuted(false)}
                className="rounded-lg px-2 py-1 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-500/10 dark:text-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Dismiss
              </button>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-center gap-2 border-t border-border p-3">
          {(
            [
              {
                on: micOn,
                set: () => setMicOn((v) => !v),
                onIcon: Mic,
                offIcon: MicOff,
                label: 'Microphone',
              },
              {
                on: cameraOn,
                set: () => setCameraOn((v) => !v),
                onIcon: Video,
                offIcon: VideoOff,
                label: 'Camera',
              },
              {
                on: sharing,
                set: () => setSharing((v) => !v),
                onIcon: Monitor,
                offIcon: Monitor,
                label: 'Screen share',
              },
            ] as const
          ).map((control) => {
            const Icon = control.on ? control.onIcon : control.offIcon
            return (
              <button
                key={control.label}
                type="button"
                onClick={control.set}
                aria-pressed={control.on}
                // 44px minimum — this bar is used with a thumb.
                className={`inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  control.on
                    ? 'bg-card text-foreground hover:bg-muted'
                    : 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                }`}
              >
                <Icon aria-hidden className="h-4 w-4" />
                {/* State in the name, not only in a slashed glyph. */}
                <span className="sr-only">
                  {control.label}, {control.on ? 'on' : 'off'}
                </span>
              </button>
            )
          })}

          <button
            type="button"
            onClick={() => setHideSelf((v) => !v)}
            aria-pressed={hideSelf}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-card px-3 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {hideSelf ? 'Show self-view' : 'Hide self-view'}
          </button>

          {/* Separated by a gap, not only by colour. */}
          <span aria-hidden className="w-6" />

          <button
            type="button"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-destructive px-4 text-sm font-semibold text-destructive-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <PhoneOff aria-hidden className="h-4 w-4" />
            Leave
          </button>
        </div>
      </div>
    </section>
  )
}
