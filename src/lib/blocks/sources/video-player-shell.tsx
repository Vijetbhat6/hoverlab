/**
 * <VideoPlayerShell> — the watch screen: stage, control bar, and what is next.
 *
 * It ships NO PLAYBACK. That is deliberate and it is the first thing to
 * understand about the block. Every streaming product wires its player
 * differently — HLS or DASH, a DRM licence round-trip, a heartbeat to the
 * analytics pipeline, an ad break that has to pause the timeline — and a
 * block that picked one of those would be wrong for everyone else and
 * would drag a 200KB dependency into a catalog whose whole claim is one
 * runtime dependency. What is genuinely reusable is the *furniture*: the
 * locked-ratio stage, the control bar with all of its states drawn, the
 * metadata row, and the up-next rail. Drop a `<video>` into the stage and
 * point your player's state at these props.
 *
 * THE ASPECT RATIO IS LOCKED ON THE CONTAINER, NOT THE MEDIA. `aspect-video`
 * sits on the stage, so the box exists at its final size before any media
 * arrives. A player that sizes itself to the video once metadata loads
 * shifts every word below it — and the thing below it is the title, so the
 * reader loses their place on the one line they were reading.
 *
 * THE SCRUBBER IS A PROGRESSBAR, NOT A SLIDER. A `role="slider"` that does
 * not move is a lie told to a screen reader: it promises arrow keys that
 * do nothing. As a shell this reports position and stops there. When you
 * wire real seeking, promote it to a slider *and* implement the keys —
 * both, or neither.
 *
 * TIMES ARE STRINGS. `12:04`, not seconds run through a formatter at
 * render. Same reason as everywhere else in this catalog: the server's
 * locale is not the browser's, and the mismatch throws the subtree away.
 *
 * THE BUFFERED BAR IS THE DETAIL EVERY MOCKUP LEAVES OUT, and it is the
 * one that makes a drawn player read as a real one — three layers, not
 * two: track, buffered, played.
 */

import * as React from 'react'
import {
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  Captions,
  Settings,
  Maximize,
  Eye,
} from 'lucide-react'

function instanceId(...parts: (string | undefined)[]): string {
  const text = parts.filter(Boolean).join('|')
  let hash = 0
  for (let i = 0; i < text.length; i++) hash = (Math.imul(hash, 31) + text.charCodeAt(i)) | 0
  return (hash >>> 0).toString(36).slice(0, 6)
}

export interface UpNextItem {
  title: string
  /** "12:04". A string — see the header. */
  duration: string
  meta?: string
  /** Marks the row the viewer is on. */
  current?: boolean
  href?: string
}

export interface VideoPlayerShellProps {
  title?: string
  /** The series, channel or course this belongs to. */
  seriesLabel?: string
  /** Under the title — view count, date, chapter. Written by you. */
  metaLine?: string
  description?: string
  /** Elapsed and total, both pre-formatted. */
  elapsed?: string
  duration?: string
  /** Played and buffered as percentages, 0–100. */
  playedPercent?: number
  bufferedPercent?: number
  /** Shown on the stage before playback starts. */
  badge?: string
  upNextHeading?: string
  upNext?: UpNextItem[]
  className?: string
}

const DEFAULT_UP_NEXT: UpNextItem[] = [
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

/** One control-bar button. Icon-only, so the label is required. */
function ControlButton({
  label,
  children,
  large = false,
}: {
  label: string
  children: React.ReactNode
  large?: boolean
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`inline-flex shrink-0 items-center justify-center rounded-md text-white/90 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
        large ? 'h-9 w-9' : 'h-8 w-8'
      }`}
    >
      {children}
    </button>
  )
}

export function VideoPlayerShell({
  title = 'Where the time actually goes',
  seriesLabel = 'Profiling, end to end',
  metaLine = '48,219 views · Episode 3 of 7 · Published 4 March',
  description = 'We take a page that feels slow and find out what is actually slow about it — with a profiler open the whole time, and no guessing. The fix at the end is two lines; finding it is the other eleven minutes.',
  elapsed = '4:18',
  duration = '12:04',
  playedPercent = 36,
  bufferedPercent = 61,
  badge = 'Episode 3',
  upNextHeading = 'Up next in this series',
  upNext = DEFAULT_UP_NEXT,
  className = '',
}: VideoPlayerShellProps) {
  const headingId = `video-player-heading-${instanceId(title, seriesLabel)}`

  /* Clamped, because a percentage out of range draws a bar wider than its
     track and pushes the control row sideways at some breakpoints. */
  const played = Math.min(100, Math.max(0, playedPercent))
  const buffered = Math.min(100, Math.max(played, bufferedPercent))

  return (
    <section
      aria-labelledby={headingId}
      className={`mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 ${className}`}
    >
      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="min-w-0 flex-1">
          {/* ── The stage ────────────────────────────────────────────
              Always dark, in both themes. A player is a cinema: the
              surround stays black so nothing competes with the picture,
              and a light-mode player with a white control bar is a thing
              no streaming product ships. */}
          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-neutral-950 ring-1 ring-inset ring-white/10">
            {/* The poster. A drawn gradient rather than a remote image —
                no request, no licence, no shift while it loads. */}
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-br from-primary/30 via-neutral-900 to-neutral-950"
            />

            {badge ? (
              <span className="absolute start-4 top-4 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/90 backdrop-blur">
                {badge}
              </span>
            ) : null}

            {/* The centre play affordance. A real button, because it is
                the one control a viewer reaches for before any other. */}
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                type="button"
                aria-label={`Play — ${title}`}
                className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-inset ring-white/30 backdrop-blur transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                {/* `ps-1` because a triangle is optically off-centre in a
                    circle when it is geometrically centred. */}
                <Play aria-hidden className="h-7 w-7 ps-1" />
              </button>
            </div>

            {/* ── Control bar ───────────────────────────────────────── */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-10">
              {/* Three layers: track, buffered, played. */}
              <div
                role="progressbar"
                aria-label="Playback position"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={played}
                aria-valuetext={`${elapsed} of ${duration}`}
                className="relative h-1 w-full overflow-hidden rounded-full bg-white/25 border border-transparent"
              >
                <span
                  aria-hidden
                  className="absolute inset-y-0 start-0 rounded-full bg-white/40 border border-transparent"
                  style={{ width: `${buffered}%` }}
                />
                <span
                  aria-hidden
                  className="absolute inset-y-0 start-0 rounded-full bg-primary border border-transparent"
                  style={{ width: `${played}%` }}
                />
              </div>

              <div className="mt-2 flex items-center gap-1">
                <ControlButton label="Play" large>
                  <Play aria-hidden className="h-4.5 w-4.5" />
                </ControlButton>
                <ControlButton label="Back ten seconds">
                  <SkipBack aria-hidden className="h-4 w-4" />
                </ControlButton>
                <ControlButton label="Forward ten seconds">
                  <SkipForward aria-hidden className="h-4 w-4" />
                </ControlButton>
                <ControlButton label="Mute">
                  <Volume2 aria-hidden className="h-4 w-4" />
                </ControlButton>

                <p className="ms-2 text-xs tabular-nums text-white/80">
                  {elapsed}
                  <span className="text-white/60"> / {duration}</span>
                </p>

                <span className="flex-1" />

                <ControlButton label="Subtitles">
                  <Captions aria-hidden className="h-4 w-4" />
                </ControlButton>
                <ControlButton label="Quality and speed">
                  <Settings aria-hidden className="h-4 w-4" />
                </ControlButton>
                <ControlButton label="Full screen">
                  <Maximize aria-hidden className="h-4 w-4" />
                </ControlButton>
              </div>
            </div>
          </div>

          {/* ── Below the stage ──────────────────────────────────────── */}
          <div className="mt-5">
            {seriesLabel ? (
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                {seriesLabel}
              </p>
            ) : null}

            <h2 id={headingId} className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">
              {title}
            </h2>

            {metaLine ? (
              <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Eye aria-hidden className="h-3.5 w-3.5" />
                {metaLine}
              </p>
            ) : null}

            {description ? (
              <p className="mt-4 max-w-prose text-pretty text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
        </div>

        {/* ── Up next ────────────────────────────────────────────────── */}
        {upNext.length ? (
          <aside className="w-full shrink-0 lg:w-80">
            <h3 data-stress-ignore className="text-sm font-semibold tracking-tight">{upNextHeading}</h3>

            <ol className="mt-3 space-y-1.5">
              {upNext.map((item, i) => {
                const inner = (
                  <>
                    {/* The thumbnail slot, at the same ratio as the stage. */}
                    <span
                      aria-hidden
                      className="relative grid h-12 w-20 shrink-0 place-items-center rounded-md bg-gradient-to-br from-muted to-muted/40 text-[10px] font-semibold tabular-nums text-muted-foreground ring-1 ring-inset ring-border/60"
                    >
                      {item.duration}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block break-words text-sm font-medium text-card-foreground">
                        {item.title}
                      </span>
                      {item.meta ? (
                        <span className="mt-0.5 block break-words text-xs text-muted-foreground">
                          {item.meta}
                        </span>
                      ) : null}
                      {/* The duration is drawn on the decorative thumbnail
                          above, so it is announced here instead. */}
                      <span className="sr-only">Duration {item.duration}</span>
                    </span>
                  </>
                )

                return (
                  <li key={`${item.title}-${i}`}>
                    {item.current ? (
                      <p
                        aria-current="true"
                        className="flex items-center gap-3 rounded-lg border border-primary/40 bg-primary/5 p-2"
                      >
                        {inner}
                      </p>
                    ) : (
                      <a
                        href={item.href ?? '#'}
                        className="flex items-center gap-3 rounded-lg border border-transparent p-2 transition-colors hover:border-border/60 hover:bg-muted/50"
                      >
                        {inner}
                      </a>
                    )}
                  </li>
                )
              })}
            </ol>
          </aside>
        ) : null}
      </div>
    </section>
  )
}
