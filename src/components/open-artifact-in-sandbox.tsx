'use client'

import * as React from 'react'
import { Loader2, Play } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { track } from '@/lib/analytics'
import type { SandboxLevel } from '@/lib/export/artifact-sandbox'

/**
 * Either an artifact to derive the payload endpoint from, or the endpoint.
 *
 * A union rather than three optional props, so neither half can be
 * half-supplied. `endpoint` exists for `/builder`, whose composition is not
 * an artifact and has no id — but which needs every word of the
 * popup-blocker dance below, and would have got a second, subtly different
 * copy of it if this component had stayed artifact-shaped.
 */
type SandboxTarget =
  | { level: SandboxLevel; id: string; endpoint?: never }
  | { level?: never; id?: never; endpoint: string }

type OpenArtifactInSandboxProps = SandboxTarget & {
  name: string
  /** Overrides the button's label. Defaults to "Open in StackBlitz". */
  label?: string
}

interface SandboxPayload {
  action: string
  fields: Record<string, string>
  openFile: string
}

/**
 * "Open in StackBlitz" for a block or a page.
 *
 * The effect tier has had CodePen since it shipped; the React tiers had
 * nothing, which meant the only way to find out whether a block worked was
 * to paste it into your own repo. This opens the artifact as a running Vite
 * project with the catalog's real token layer behind it.
 *
 * ── THE POPUP-BLOCKER PROBLEM, which shapes the whole component ─────────
 *
 * StackBlitz needs a POSTed form, the payload is 15 KB, and we fetch it on
 * click rather than shipping it in the page. So by the time the form can be
 * submitted the click is over, and a browser will treat the resulting
 * `target="_blank"` as a popup and block it.
 *
 * The fix is to open the tab synchronously *inside* the click handler —
 * `window.open()` on a blank tab, which is allowed because the gesture is
 * still live — and then submit the form into that named tab once the fetch
 * lands. `OpenInSandbox` next door has no such dance because its payload is
 * already in the page and it submits during the click.
 *
 * If the tab is blocked anyway (some blockers refuse even a same-gesture
 * open) the button says so rather than silently doing nothing.
 */
export function OpenArtifactInSandbox({
  level,
  id,
  name,
  endpoint,
  label,
}: OpenArtifactInSandboxProps) {
  const [pending, setPending] = React.useState(false)
  const formRef = React.useRef<HTMLFormElement>(null)
  const [payload, setPayload] = React.useState<SandboxPayload | null>(null)

  /*
   * Submitting has to happen after React has rendered the fetched fields
   * into the form, which is the one thing a promise chain cannot wait for.
   * An effect keyed on the payload is the honest way to express "when the
   * DOM catches up, submit"; doing it inline after setState submits an
   * empty form.
   */
  React.useEffect(() => {
    if (!payload || !formRef.current) return
    formRef.current.submit()
    setPayload(null)
  }, [payload])

  async function open() {
    if (pending) return
    setPending(true)

    // Opened inside the gesture, before any await. Named so the form can
    // target it once the fields arrive.
    const tab = window.open('about:blank', 'hoverlab-stackblitz')

    try {
      const response = await fetch(endpoint ?? `/api/sandbox/${level}/${id}`)
      if (!response.ok) throw new Error(`sandbox ${response.status}`)

      const data = (await response.json()) as SandboxPayload

      if (!tab || tab.closed) {
        toast.error('Your browser blocked the new tab', {
          description: 'Allow pop-ups for this site and try again.',
        })
        return
      }

      /*
       * A composition has no artifact id, so it reports as one named
       * `composition` rather than as an empty string. Analytics that
       * counted it under `''` would put every builder export in the same
       * bucket as a genuine bug elsewhere.
       */
      track('sandbox_open', {
        artifact_id: id ?? 'composition',
        level: level ?? 'composition',
        target: 'stackblitz',
      })
      setPayload(data)
    } catch {
      tab?.close()
      toast.error('Could not build the sandbox', {
        description: 'The project could not be assembled. Copy the source instead.',
      })
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      {payload ? (
        <form
          ref={formRef}
          action={payload.action}
          method="POST"
          target="hoverlab-stackblitz"
          className="hidden"
        >
          {Object.entries(payload.fields).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} readOnly />
          ))}
        </form>
      ) : null}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={open}
        disabled={pending}
        title={`Run ${name} in StackBlitz — Vite, React and the Hoverlab tokens, no setup`}
      >
        {pending ? (
          <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Play aria-hidden className="h-3.5 w-3.5" />
        )}
        {pending ? 'Building…' : (label ?? 'Open in StackBlitz')}
      </Button>
    </>
  )
}
