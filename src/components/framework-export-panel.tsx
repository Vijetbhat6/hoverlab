'use client'

import * as React from 'react'
import { Terminal, Check, Copy } from 'lucide-react'
import { toast } from 'sonner'

import { CodeBlock } from '@/components/code-block'
import { FRAMEWORKS, exportEffect, isFrameworkId, type FrameworkId } from '@/lib/export'
import { cn } from '@/lib/utils'

/**
 * The code tab's framework switcher.
 *
 * Every effect in the catalog is plain CSS, which is the whole reason this
 * is possible: a React-coupled library can only ever hand you React, but
 * markup plus a stylesheet can be handed to anyone. Rather than make that
 * a hidden capability of the API, it's the primary interaction on the
 * detail page — pick your stack, get code that runs in it.
 *
 * The generated source is derived from the *customized* CSS, so whatever
 * the preview is showing is what you copy.
 */

const STORAGE_KEY = 'hoverlab:framework'

/** Restore the last-used target so a Vue developer isn't re-picking it. */
function readStoredFramework(): FrameworkId | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw && isFrameworkId(raw) ? raw : null
  } catch {
    // Private browsing / disabled storage — a forgotten preference is fine.
    return null
  }
}

interface FrameworkExportPanelProps {
  effect: {
    id: string
    name: string
    description: string
    category: string
  }
  html: string
  /** The customized CSS — what the live preview is rendering. */
  css: string
  isCustomized?: boolean
  surface?: 'detail' | 'playground'
}

export function FrameworkExportPanel({
  effect,
  html,
  css,
  isCustomized = false,
  surface = 'detail',
}: FrameworkExportPanelProps) {
  const [framework, setFramework] = React.useState<FrameworkId>('css')
  const [copiedInstall, setCopiedInstall] = React.useState(false)

  // Read from localStorage after mount rather than in the initializer, so
  // the server and first client render agree and React doesn't rehydrate
  // into a mismatch.
  React.useEffect(() => {
    const stored = readStoredFramework()
    if (stored) setFramework(stored)
  }, [])

  const selectFramework = React.useCallback((next: FrameworkId) => {
    setFramework(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* preference is a nicety, never a failure */
    }
  }, [])

  const generated = React.useMemo(
    () =>
      exportEffect(
        {
          id: effect.id,
          name: effect.name,
          description: effect.description,
          category: effect.category,
          html,
          css,
        },
        framework,
      ),
    [effect.id, effect.name, effect.description, effect.category, html, css, framework],
  )

  const installCommand = `npx hoverlab add ${effect.id}${
    framework === 'css' ? '' : ` --framework ${framework}`
  }`

  async function copyInstallCommand() {
    try {
      await navigator.clipboard.writeText(installCommand)
      setCopiedInstall(true)
      toast.success('Copied the install command')
      setTimeout(() => setCopiedInstall(false), 1800)
    } catch {
      toast.error('Copy failed — please copy manually')
    }
  }

  return (
    <div className="space-y-3">
      {/* Target picker */}
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Export format">
        {FRAMEWORKS.map((meta) => {
          const active = meta.id === framework
          return (
            <button
              key={meta.id}
              type="button"
              onClick={() => selectFramework(meta.id)}
              title={meta.description}
              aria-pressed={active}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                active
                  ? 'border-primary/50 bg-primary/10 text-primary'
                  : 'border-border/60 text-muted-foreground hover:border-primary/30 hover:text-foreground',
              )}
            >
              {meta.label}
            </button>
          )
        })}
      </div>

      {/* One block per generated file. */}
      {generated.files.map((file) => (
        <CodeBlock
          key={file.path}
          code={file.code.trimEnd()}
          filename={file.path}
          language={file.language}
          effect={{ id: effect.id, name: effect.name, category: effect.category }}
          isCustomized={isCustomized}
          copyFormat={
            framework === 'css' || framework === 'html'
              ? file.language === 'html'
                ? 'html'
                : 'css'
              : framework
          }
          surface={surface}
          hideReactButton
          {...(generated.files.length > 1
            ? {
                extraCopy: {
                  label: 'Copy all',
                  text: generated.clipboard,
                  successMessage: `Copied all ${generated.files.length} files`,
                },
              }
            : {})}
        />
      ))}

      {/* Caveats. Lossy targets always have at least one — surfacing them
          here is cheaper than a user discovering it at build time. */}
      {generated.notes.length > 0 ? (
        <ul className="space-y-1 rounded-lg border border-border/50 bg-muted/30 p-3 text-[11.5px] leading-relaxed text-muted-foreground">
          {generated.notes.map((note) => (
            <li key={note} className="flex gap-2">
              <span aria-hidden className="select-none text-primary/60">
                •
              </span>
              <span>{note}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {/* The same effect, installable without leaving the editor. */}
      <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/20 px-3 py-2">
        <Terminal className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <code className="flex-1 overflow-x-auto whitespace-nowrap font-mono text-[11.5px] text-muted-foreground">
          {installCommand}
        </code>
        <button
          type="button"
          onClick={copyInstallCommand}
          aria-label="Copy install command"
          className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {copiedInstall ? (
            <>
              <Check className="h-3 w-3 text-emerald-500" /> Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" /> Copy
            </>
          )}
        </button>
      </div>
    </div>
  )
}
