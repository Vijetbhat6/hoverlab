'use client'

/**
 * <VideoPlayer> — custom controls over a real `<video>`.
 *
 * The default controls are fine and every brand replaces them, so the
 * question is only whether the replacement keeps what the native ones gave
 * you for free. Usually it does not. What is kept here:
 *
 *   keyboard   Space and K toggle, arrows seek five seconds, J and L seek
 *              ten, M mutes, F is fullscreen, 0–9 jump to a tenth. These
 *              are YouTube's bindings, which is what people already know.
 *   scrubbing  the progress bar is a real `<input type="range">`, so it
 *              works with a keyboard, a screen reader and a touch drag
 *              without a line of pointer-capture code. Styling one is
 *              fiddlier than building a div; being able to seek without a
 *              mouse is worth it.
 *   buffered   the loaded range is painted behind the played range. Its
 *              absence is why a custom player feels broken on a slow
 *              connection — nothing tells you it is loading rather than
 *              stuck.
 *   time       `tabular-nums`, so the countdown does not jitter the layout
 *              every second.
 *
 * The transport icons are NOT mirrored in right-to-left documents. A
 * timeline runs the same way everywhere, and every RTL platform ships play
 * pointing the same direction — a mirrored play button reads as rewind.
 */

import * as React from 'react'
import { Maximize, Pause, Play, Volume2, VolumeX } from 'lucide-react'

export interface VideoPlayerProps {
  src?: string
  poster?: string
  /** Describes the video for anyone who cannot see it. */
  label: string
  className?: string
}

function timecode(seconds: number): string {
  if (!Number.isFinite(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export function VideoPlayer({ src, poster, label, className = '' }: VideoPlayerProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const rootRef = React.useRef<HTMLDivElement>(null)

  const [playing, setPlaying] = React.useState(false)
  const [muted, setMuted] = React.useState(false)
  const [time, setTime] = React.useState(0)
  const [duration, setDuration] = React.useState(0)
  const [buffered, setBuffered] = React.useState(0)

  const seek = (to: number) => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = Math.max(0, Math.min(duration || 0, to))
  }

  const toggle = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) void video.play()
    else video.pause()
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    // Not when the range input has focus: it has its own arrow handling,
    // and doubling it makes the scrubber jump ten seconds a press.
    if ((e.target as HTMLElement).tagName === 'INPUT') return

    const keys: Record<string, () => void> = {
      ' ': toggle,
      k: toggle,
      ArrowRight: () => seek(time + 5),
      ArrowLeft: () => seek(time - 5),
      l: () => seek(time + 10),
      j: () => seek(time - 10),
      m: () => setMuted((v) => !v),
      f: () => void rootRef.current?.requestFullscreen?.(),
    }
    const handler = keys[e.key] ?? keys[e.key.toLowerCase()]
    if (handler) {
      e.preventDefault()
      handler()
      return
    }
    if (/^[0-9]$/.test(e.key) && duration) {
      e.preventDefault()
      seek((Number(e.key) / 10) * duration)
    }
  }

  React.useEffect(() => {
    const video = videoRef.current
    if (video) video.muted = muted
  }, [muted])

  const progress = duration > 0 ? (time / duration) * 100 : 0
  const loaded = duration > 0 ? (buffered / duration) * 100 : 0

  return (
    <div
      ref={rootRef}
      // The player is one keyboard target; the controls inside it are their
      // own stops. `tabIndex={0}` is what makes the shortcuts reachable
      // without first tabbing to a button.
      tabIndex={0}
      role="region"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={`group relative overflow-hidden rounded-xl bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        playsInline
        onClick={toggle}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        onProgress={(e) => {
          const ranges = e.currentTarget.buffered
          // The last range that has started, which is what is ahead of the
          // playhead — not range 0, which is wrong after any seek.
          setBuffered(ranges.length > 0 ? ranges.end(ranges.length - 1) : 0)
        }}
        className="aspect-video w-full bg-black"
      />

      {/* A large, centred play affordance while paused — the target people
          actually aim at, rather than the 32px button in the bar. */}
      {!playing ? (
        <button
          type="button"
          onClick={toggle}
          aria-label="Play"
          className="absolute inset-0 flex items-center justify-center focus-visible:outline-none"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition-transform hover:scale-105 motion-reduce:transform-none">
            <Play className="h-7 w-7 translate-x-0.5" fill="currentColor" aria-hidden />
          </span>
        </button>
      ) : null}

      {/* -- the control bar -- */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
        <div className="relative flex h-4 items-center">
          {/* The buffered range, behind the scrubber. Its absence is why a
              custom player feels broken on a slow connection. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/20"
          >
            <span
              className="absolute inset-y-0 start-0 rounded-full bg-white/30"
              style={{ width: `${loaded}%` }}
            />
            <span
              className="absolute inset-y-0 start-0 rounded-full bg-white"
              style={{ width: `${progress}%` }}
            />
          </span>

          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={time}
            onChange={(e) => seek(Number(e.target.value))}
            aria-label="Seek"
            aria-valuetext={`${timecode(time)} of ${timecode(duration)}`}
            // Transparent, over the painted track: a real range input keeps
            // keyboard, screen-reader and touch behaviour that a div cannot.
            className="relative z-10 h-4 w-full cursor-pointer appearance-none bg-transparent accent-white [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 text-white">
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? 'Pause' : 'Play'}
            className="rounded p-1 transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            {playing ? (
              <Pause className="h-4 w-4" fill="currentColor" aria-hidden />
            ) : (
              <Play className="h-4 w-4" fill="currentColor" aria-hidden />
            )}
          </button>

          <button
            type="button"
            onClick={() => setMuted((v) => !v)}
            aria-label={muted ? 'Unmute' : 'Mute'}
            aria-pressed={muted}
            className="rounded p-1 transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            {muted ? <VolumeX className="h-4 w-4" aria-hidden /> : <Volume2 className="h-4 w-4" aria-hidden />}
          </button>

          <span className="text-xs tabular-nums opacity-90">
            {timecode(time)} / {timecode(duration)}
          </span>

          <button
            type="button"
            onClick={() => void rootRef.current?.requestFullscreen?.()}
            aria-label="Full screen"
            className="ms-auto rounded p-1 transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Maximize className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  )
}
