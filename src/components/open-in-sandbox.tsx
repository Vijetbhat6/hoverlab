'use client'

import * as React from 'react'
import { Codepen, FileCode2, Download } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { codepenForm, jsfiddleForm, standaloneHtml, type SandboxForm } from '@/lib/sandbox'
import { track } from '@/lib/analytics'

interface OpenInSandboxProps {
  effectId: string
  name: string
  description: string
  html: string
  /** The CSS currently on screen — customized, not the original. */
  css: string
  darkSurface?: boolean
}

/**
 * "Open in CodePen / JSFiddle / Download" actions.
 *
 * Both sandboxes take their payload as a POSTed form field rather than a
 * query string, so each button renders a real hidden <form> with
 * target="_blank" and submits it on click. That also means no popup
 * blocker trouble: the submit happens inside the click handler.
 *
 * The CSS passed in is whatever the detail page is currently rendering, so
 * a pen opened after customizing carries the customized values.
 */
export function OpenInSandbox({
  effectId,
  name,
  description,
  html,
  css,
  darkSurface,
}: OpenInSandboxProps) {
  const codepenRef = React.useRef<HTMLFormElement>(null)
  const jsfiddleRef = React.useRef<HTMLFormElement>(null)

  const sourceUrl =
    typeof window === 'undefined' ? undefined : `${window.location.origin}/effect/${effectId}`

  const input = { name, description, html, css, darkSurface, sourceUrl }
  const pen = codepenForm(input)
  const fiddle = jsfiddleForm(input)

  function submit(ref: React.RefObject<HTMLFormElement | null>, target: string) {
    track('sandbox_open', { effect_id: effectId, target })
    ref.current?.submit()
  }

  function download() {
    const doc = standaloneHtml(input)
    const blob = new Blob([doc], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${effectId}.html`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    track('sandbox_open', { effect_id: effectId, target: 'download' })
    toast.success('Downloaded standalone HTML', {
      description: 'Open it in a browser — everything is inline, no build step.',
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <HiddenForm formRef={codepenRef} form={pen} />
      <HiddenForm formRef={jsfiddleRef} form={fiddle} />

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => submit(codepenRef, 'codepen')}
      >
        <Codepen className="h-3.5 w-3.5" />
        CodePen
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => submit(jsfiddleRef, 'jsfiddle')}
      >
        <FileCode2 className="h-3.5 w-3.5" />
        JSFiddle
      </Button>
      <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={download}>
        <Download className="h-3.5 w-3.5" />
        .html
      </Button>
    </div>
  )
}

function HiddenForm({
  formRef,
  form,
}: {
  formRef: React.RefObject<HTMLFormElement | null>
  form: SandboxForm
}) {
  return (
    <form ref={formRef} action={form.action} method="POST" target="_blank" className="hidden">
      {Object.entries(form.fields).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} readOnly />
      ))}
    </form>
  )
}
