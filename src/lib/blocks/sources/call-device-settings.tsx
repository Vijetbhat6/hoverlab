'use client'

/**
 * <CallDeviceSettings> — the green room, and why it is not optional.
 *
 * The first ninety seconds of most calls are spent on "can you hear me". A
 * device panel that lets someone find out before joining removes that, and the
 * difference between one that works and one that does not is entirely in
 * whether it lets you *test*, rather than only *choose*.
 *
 * SO EVERY PICKER HAS A TEST BESIDE IT
 *
 *   microphone   a live input meter, so you can see your own voice register
 *   speaker      a test tone, because a correctly selected dead output is the
 *                commonest fault and a dropdown cannot reveal it
 *   camera       a preview, with the mirror toggle people always want
 *
 * A settings panel with three selects and a Join button is a panel that
 * confirms nothing.
 *
 * PERMISSION IS A STATE, NOT AN ERROR
 *
 * Blocked camera access is not a failure to handle in a catch — it is a state
 * the panel has to render, with the browser-specific instruction to fix it,
 * because "check your browser settings" helps nobody. It is shown here as a
 * first-class variant rather than as an afterthought toast.
 *
 * THE METER IS SIMULATED IN THIS DEMO. Real input levels need
 * `getUserMedia` and an `AnalyserNode`, which a catalog preview should not
 * request; the animation is driven by a timer and is `motion-safe:` so a
 * reduced-motion reader is not given a permanently moving bar. Swap the timer
 * for the analyser and nothing else changes.
 *
 * ACCESSIBILITY: the meter is a `role="meter"` with real values rather than a
 * decorative bar; each device select is labelled and its test button names the
 * device it tests; the blocked-permission panel is `role="alert"`; the join
 * button states what will happen — "Join with microphone off" — instead of
 * relying on two toggles the user has to re-read.
 */

import * as React from 'react'
import { Camera, CameraOff, Mic, ShieldAlert, Volume2 } from 'lucide-react'

export interface DeviceOption {
  id: string
  label: string
}

export interface CallDeviceSettingsProps {
  microphones?: DeviceOption[]
  speakers?: DeviceOption[]
  cameras?: DeviceOption[]
  /** Renders the blocked-permission state instead of the preview. */
  cameraBlocked?: boolean
  className?: string
}

const DEFAULT_MICS: DeviceOption[] = [
  { id: 'm1', label: 'Headset microphone (Jabra Evolve)' },
  { id: 'm2', label: 'Built-in microphone' },
  { id: 'm3', label: 'Webcam microphone (Logitech C920)' },
]

const DEFAULT_SPEAKERS: DeviceOption[] = [
  { id: 's1', label: 'Headset (Jabra Evolve)' },
  { id: 's2', label: 'Built-in speakers' },
  { id: 's3', label: 'Display audio (Dell U2723)' },
]

const DEFAULT_CAMERAS: DeviceOption[] = [
  { id: 'c1', label: 'Logitech C920' },
  { id: 'c2', label: 'Built-in camera' },
]

const SELECT_CLASS =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring'

export function CallDeviceSettings({
  microphones = DEFAULT_MICS,
  speakers = DEFAULT_SPEAKERS,
  cameras = DEFAULT_CAMERAS,
  cameraBlocked = false,
  className = '',
}: CallDeviceSettingsProps) {
  const uid = React.useId()
  const [micId, setMicId] = React.useState(microphones[0]?.id ?? '')
  const [speakerId, setSpeakerId] = React.useState(speakers[0]?.id ?? '')
  const [cameraId, setCameraId] = React.useState(cameras[0]?.id ?? '')
  const [micOn, setMicOn] = React.useState(true)
  const [cameraOn, setCameraOn] = React.useState(!cameraBlocked)
  const [mirrored, setMirrored] = React.useState(true)
  const [level, setLevel] = React.useState(0)
  const [tone, setTone] = React.useState(false)

  // Simulated. Swap the timer for an AnalyserNode and nothing else changes.
  React.useEffect(() => {
    if (!micOn) {
      setLevel(0)
      return
    }
    let step = 0
    const tick = window.setInterval(() => {
      step += 1
      setLevel(30 + Math.round(35 * Math.abs(Math.sin(step / 3))))
    }, 180)
    return () => window.clearInterval(tick)
  }, [micOn])

  function playTone() {
    setTone(true)
    window.setTimeout(() => setTone(false), 1400)
  }

  const micLabel = microphones.find((m) => m.id === micId)?.label ?? 'microphone'
  const speakerLabel = speakers.find((s) => s.id === speakerId)?.label ?? 'speaker'

  return (
    <section className={`bg-background px-4 py-10 sm:px-6 ${className}`}>
      <div className="mx-auto max-w-3xl">
        <h2 className="text-xl font-bold tracking-tight">Check your setup</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ninety seconds of every call goes on &ldquo;can you hear me&rdquo;.
          This is where that gets settled instead.
        </p>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {/* ---- Camera preview, or the permission state ---------------- */}
          <div>
            {cameraBlocked ? (
              <div
                role="alert"
                className="flex h-48 flex-col items-center justify-center gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-center"
              >
                <ShieldAlert aria-hidden className="h-6 w-6 text-destructive" />
                <p className="text-sm font-semibold text-destructive">
                  Camera access is blocked
                </p>
                {/* The instruction, not "check your browser settings". */}
                <p className="text-xs text-muted-foreground">
                  Click the padlock beside the address bar, set Camera to Allow,
                  then reload this page. You can join without video in the
                  meantime.
                </p>
              </div>
            ) : (
              <div
                className="grid h-48 place-items-center overflow-hidden rounded-xl bg-foreground/10"
                style={{ aspectRatio: '4 / 3' }}
              >
                {cameraOn ? (
                  <span
                    aria-hidden
                    // The mirror toggle people always want. scale-x is
                    // symmetric under mirroring, so it needs no rtl: twin.
                    className={`grid h-16 w-16 place-items-center rounded-full bg-primary/20 text-lg font-bold text-primary ${
                      mirrored ? 'scale-x-[-1]' : ''
                    }`}
                  >
                    YU
                  </span>
                ) : (
                  <span className="flex flex-col items-center gap-2 text-muted-foreground">
                    <CameraOff aria-hidden className="h-6 w-6" />
                    <span className="text-xs">Camera off</span>
                  </span>
                )}
              </div>
            )}

            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCameraOn((v) => !v)}
                disabled={cameraBlocked}
                aria-pressed={cameraOn}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Camera aria-hidden className="h-3.5 w-3.5" />
                Camera, {cameraOn ? 'on' : 'off'}
              </button>
              <button
                type="button"
                onClick={() => setMirrored((v) => !v)}
                aria-pressed={mirrored}
                disabled={!cameraOn}
                className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Mirror my view
              </button>
            </div>
          </div>

          {/* ---- Devices, each with its own test ------------------------ */}
          <div className="space-y-4">
            <div>
              <label htmlFor={`${uid}-mic`} className="block text-sm font-medium">
                Microphone
              </label>
              <select
                id={`${uid}-mic`}
                value={micId}
                onChange={(e) => setMicId(e.target.value)}
                className={`mt-1.5 ${SELECT_CLASS}`}
              >
                {microphones.map((device) => (
                  <option key={device.id} value={device.id}>
                    {device.label}
                  </option>
                ))}
              </select>

              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMicOn((v) => !v)}
                  aria-pressed={micOn}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Mic aria-hidden className="h-3.5 w-3.5" />
                  {micOn ? 'On' : 'Off'}
                </button>
                {/* A real meter, not a decorative bar. */}
                <div
                  role="meter"
                  aria-label={`Input level from ${micLabel}`}
                  aria-valuenow={level}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-muted"
                >
                  <div
                    style={{ width: `${level}%` }}
                    className="h-full rounded-full bg-emerald-500 motion-safe:transition-[width] motion-safe:duration-150"
                  />
                </div>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {micOn
                  ? 'Say something — the bar should move. If it does not, pick another input.'
                  : 'Muted, so nothing registers.'}
              </p>
            </div>

            <div>
              <label htmlFor={`${uid}-speaker`} className="block text-sm font-medium">
                Speaker
              </label>
              <select
                id={`${uid}-speaker`}
                value={speakerId}
                onChange={(e) => setSpeakerId(e.target.value)}
                className={`mt-1.5 ${SELECT_CLASS}`}
              >
                {speakers.map((device) => (
                  <option key={device.id} value={device.id}>
                    {device.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={playTone}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Volume2 aria-hidden className="h-3.5 w-3.5" />
                Play a test tone
                {/* Names the device it tests. */}
                <span className="sr-only"> through {speakerLabel}</span>
              </button>
              <p aria-live="polite" className="mt-1 text-xs text-muted-foreground">
                {tone
                  ? `Playing through ${speakerLabel}. Heard nothing? A correctly selected dead output is the commonest fault.`
                  : 'A dropdown cannot tell you whether the output actually works.'}
              </p>
            </div>

            <div>
              <label htmlFor={`${uid}-camera`} className="block text-sm font-medium">
                Camera
              </label>
              <select
                id={`${uid}-camera`}
                value={cameraId}
                onChange={(e) => setCameraId(e.target.value)}
                disabled={cameraBlocked}
                className={`mt-1.5 ${SELECT_CLASS} disabled:opacity-50`}
              >
                {cameras.map((device) => (
                  <option key={device.id} value={device.id}>
                    {device.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">
            These choices are remembered for the next call on this device.
          </p>
          {/* States what will happen, rather than leaving two toggles to re-read. */}
          <button
            type="button"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Join with microphone {micOn ? 'on' : 'off'} and camera{' '}
            {cameraOn ? 'on' : 'off'}
          </button>
        </div>
      </div>
    </section>
  )
}
