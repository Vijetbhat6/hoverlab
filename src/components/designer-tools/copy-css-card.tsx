'use client'

/**
 * Reusable "Copy CSS" card. Renders a code block + a copy button.
 * Used by every Designer Tool to surface the generated CSS in a
 * consistent way.
 */

import * as React from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface CopyCssCardProps {
  /** The CSS to display and copy. */
  code: string
  /** Optional title above the code block. */
  title?: string
  /** Language label for the code block header chip. */
  language?: string
  className?: string
}

export function CopyCssCard({
  code,
  title = 'CSS',
  language = 'css',
  className,
}: CopyCssCardProps) {
  const [copied, setCopied] = React.useState(false)

  const onCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignore */
    }
  }, [code])

  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border border-border bg-card shadow-sm',
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-border/60 bg-muted/40 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {language}
          </span>
          <span className="text-sm font-medium">{title}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 px-2 text-xs"
          onClick={onCopy}
          aria-label="Copy CSS to clipboard"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copy
            </>
          )}
        </Button>
      </div>
      <pre className="overflow-x-auto p-4 text-xs leading-relaxed">
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  )
}
