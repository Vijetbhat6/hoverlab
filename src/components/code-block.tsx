'use client'

import * as React from 'react'
import { Check, Copy, Atom } from 'lucide-react'
import { toast } from 'sonner'
import { track, type AnalyticsEvent } from '@/lib/analytics'
import { useCopyHistory } from '@/hooks/use-copy-history'
import { convertToReactComponent } from '@/lib/html-to-react'

/** The `format` property of the `effect_copied` event. */
type AnalyticsCopyFormat = Extract<
  AnalyticsEvent,
  { name: 'effect_copied' }
>['props']['format']

interface CodeBlockProps {
  code: string
  /** Optional language label, defaults to 'css'. */
  language?: string
  /** Display filename / label, defaults to 'styles.css'. */
  filename?: string
  /**
   * Optional effect context. When provided, successful copies are recorded
   * in the user's copy history (shown in the header dropdown) so they can
   * quickly jump back to effects they've grabbed code from.
   *
   * Also enables the "Copy as React" button — if `effect` is provided AND
   * the CodeBlock has a paired HTML snippet (via `pairedHtml`), the user
   * can grab a ready-to-paste React component that combines the HTML + CSS.
   */
  effect?: {
    id: string
    name: string
    category: string
  }
  /**
   * Optional HTML paired with this CSS code block. When provided alongside
   * `effect`, enables a "Copy as React" button that produces a React
   * function component containing both the HTML (as JSX) and the CSS.
   */
  pairedHtml?: string
  /**
   * Where this block is rendered. Recorded on copy so analytics can tell
   * which surface actually drives copies (grid card vs detail page vs
   * playground), rather than lumping them together.
   */
  surface?: 'card' | 'detail' | 'compare' | 'palette' | 'playground'
  /** True when the user has altered the effect before copying. */
  isCustomized?: boolean
  /**
   * Override the `format` recorded on copy. The framework export panel
   * uses this so a copied Vue SFC is reported as `vue` rather than being
   * inferred from the syntax-highlighting language.
   */
  copyFormat?: AnalyticsCopyFormat
  /**
   * Hide the "Copy as React" shortcut. Redundant inside the framework
   * panel, which already offers React as a first-class target.
   */
  hideReactButton?: boolean
  /**
   * Optional extra copy action rendered as a secondary button.
   * Use this to provide a "Copy both" action that copies more than
   * just the visible `code` (e.g. HTML + CSS combined).
   */
  extraCopy?: {
    label: string
    text: string
    /**
     * Toast message shown after a successful copy. Defaults to
     * "Copied to clipboard" so the message stays correct even if
     * the caller picks a non-standard label.
     */
    successMessage?: string
  }
}

export function CodeBlock({
  code,
  language = 'css',
  filename = 'styles.css',
  effect,
  pairedHtml,
  surface = 'detail',
  isCustomized = false,
  copyFormat,
  hideReactButton = false,
  extraCopy,
}: CodeBlockProps) {
  const [copiedKey, setCopiedKey] = React.useState<null | 'single' | 'extra' | 'react'>(null)
  const { record } = useCopyHistory()

  async function copyText(text: string, key: 'single' | 'extra' | 'react', successMsg: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(key)
      toast.success(successMsg)
      // Record in copy history if we have effect context.
      if (effect) {
        record({ id: effect.id, name: effect.name, category: effect.category })
        // Copies are the single strongest signal of which effects are
        // actually worth curating — this is the funnel's core event.
        track('effect_copied', {
          effect_id: effect.id,
          category: effect.category,
          surface,
          format:
            key === 'react'
              ? 'react'
              : key === 'extra'
                ? 'both'
                : (copyFormat ?? (language === 'html' ? 'html' : 'css')),
          customized: Boolean(isCustomized),
        })
      }
      setTimeout(() => setCopiedKey((curr) => (curr === key ? null : curr)), 1800)
    } catch {
      toast.error('Copy failed — please copy manually')
    }
  }

  function handleCopyAsReact() {
    if (!effect) return
    // Use the paired HTML if available, otherwise the visible code is HTML
    // (e.g. when this block itself is the markup block — pair with empty).
    const html = pairedHtml ?? (language === 'html' ? code : '')
    const css = language === 'css' ? code : (pairedHtml ? code : '')
    if (!html) {
      toast.error('No HTML markup to convert')
      return
    }
    try {
      const component = convertToReactComponent({
        effectId: effect.id,
        html,
        css,
      })
      void copyText(component, 'react', `Copied ${effect.name} as a React component`)
    } catch (e) {
      toast.error('Could not generate React component', {
        description: e instanceof Error ? e.message : undefined,
      })
    }
  }

  const showReactButton =
    !hideReactButton &&
    Boolean(effect) &&
    (language === 'css' ? Boolean(pairedHtml) : language === 'html')

  return (
    <div className="group relative overflow-hidden rounded-lg border border-border/70 bg-[#0b1020] text-slate-100">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-3 py-1.5">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-2 font-mono text-[11px] uppercase tracking-wider text-slate-400">
            {filename}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {extraCopy ? (
            <button
              onClick={() =>
                copyText(
                  extraCopy.text,
                  'extra',
                  extraCopy.successMessage ?? 'Copied to clipboard',
                )
              }
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
              aria-label={extraCopy.label}
            >
              {copiedKey === 'extra' ? (
                <>
                  <Check className="h-3 w-3 text-emerald-400" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" /> {extraCopy.label}
                </>
              )}
            </button>
          ) : null}
          {showReactButton ? (
            <button
              onClick={handleCopyAsReact}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Copy as React component"
              title="Copy this effect as a ready-to-paste React function component"
            >
              {copiedKey === 'react' ? (
                <>
                  <Check className="h-3 w-3 text-emerald-400" /> Copied
                </>
              ) : (
                <>
                  <Atom className="h-3 w-3" /> React
                </>
              )}
            </button>
          ) : null}
          <button
            onClick={() => copyText(code, 'single', 'Copied to clipboard')}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Copy code"
          >
            {copiedKey === 'single' ? (
              <>
                <Check className="h-3 w-3 text-emerald-400" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" /> Copy
              </>
            )}
          </button>
        </div>
      </div>
      <pre className="fx-no-scrollbar max-h-[280px] overflow-auto p-4 text-[12.5px] leading-relaxed">
        <code className={`language-${language} font-mono`}>{code}</code>
      </pre>
    </div>
  )
}
