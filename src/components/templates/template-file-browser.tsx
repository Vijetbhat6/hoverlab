'use client'

/**
 * Read any of a template's project files without downloading it.
 *
 * Deliberately given only the *project* files — layout, config, tokens,
 * README and the route files. The block files are excluded: there are
 * twenty-seven of them in the largest template, they would triple this
 * component's payload, and every one already has its own detail page with
 * a live preview attached. A file list is a worse way to read a block than
 * the page built for it.
 *
 * Selection is by index rather than by path so a template with two files of
 * the same basename in different folders still selects the right one.
 */

import * as React from 'react'
import { FileCode, FileJson, FileText, Palette } from 'lucide-react'
import { CodeBlock } from '@/components/code-block'
import type { ArtifactFile } from '@/lib/artifact-types'

/** Icon by extension — a file list of identical glyphs is just a list. */
function iconFor(path: string) {
  if (path.endsWith('.css')) return <Palette aria-hidden className="h-3.5 w-3.5" />
  if (path.endsWith('.json')) return <FileJson aria-hidden className="h-3.5 w-3.5" />
  if (path.endsWith('.md')) return <FileText aria-hidden className="h-3.5 w-3.5" />
  return <FileCode aria-hidden className="h-3.5 w-3.5" />
}

export function TemplateFileBrowser({
  files,
  initialPath,
}: {
  files: ArtifactFile[]
  /** Which file to open first. Falls back to the first in the list. */
  initialPath?: string
}) {
  const initialIndex = Math.max(
    0,
    files.findIndex((f) => f.path === initialPath),
  )
  const [active, setActive] = React.useState(initialIndex)

  if (files.length === 0) return null

  const file = files[active] ?? files[0]

  return (
    <div className="grid gap-4 lg:grid-cols-[15rem_1fr]">
      <nav aria-label="Project files" className="lg:max-h-[32rem] lg:overflow-y-auto">
        <ul className="space-y-0.5">
          {files.map((f, i) => (
            <li key={f.path}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-current={i === active ? 'true' : undefined}
                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left font-mono text-xs transition-colors ${
                  i === active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {iconFor(f.path)}
                <span className="truncate">{f.path}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="min-w-0">
        <CodeBlock code={file.source} language={file.lang} filename={file.path} />
      </div>
    </div>
  )
}
