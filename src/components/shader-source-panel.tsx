'use client'

/**
 * The Code tab, for an effect that is not CSS.
 *
 * A CSS effect's deliverable is its markup and its stylesheet — which is
 * why the normal panel offers them through a framework picker, converting
 * one pair of strings into React, Vue, Svelte or plain HTML. Running that
 * machinery on a shader effect would hand somebody a React component
 * wrapping an empty `<canvas>`: syntactically fine, and it draws nothing.
 * The markup and CSS of a shader effect are the *preview and the fallback*,
 * not the product.
 *
 * So this panel shows the three real files instead, design first, and says
 * plainly which two of them the visitor only needs once. That last part is
 * the pitch as much as the code is: every competitor selling shader
 * components ships them on top of three.js or ogl, and adding their second
 * background costs another import of a 150 KB renderer. Adding a second one
 * here costs one file.
 */

import * as React from 'react'
import { FileCode2 } from 'lucide-react'

import { CodeBlock } from '@/components/code-block'
import { cn } from '@/lib/utils'
import type { ArtifactFile } from '@/lib/artifact-types'
import { RENDERER_LABEL, type EffectRenderer } from '@/lib/shaders/shader-types'

interface ShaderSourcePanelProps {
  effect: { id: string; name: string; category: string }
  files: ArtifactFile[]
  renderer: EffectRenderer
}

export function ShaderSourcePanel({ effect, files, renderer }: ShaderSourcePanelProps) {
  const [active, setActive] = React.useState(0)
  const file = files[active] ?? files[0]

  if (!file) return null

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">
          {RENDERER_LABEL[renderer]}, {files.length} files, no dependencies.
        </span>{' '}
        The first one is this design. The other two are the runtime, shared by
        every shader effect in the catalog — copy them once and the next design
        you add is a single file. The HTML and CSS on this page are the preview
        surface and the gradient shown if WebGL is unavailable; they are not a
        substitute for these.
      </div>

      {/*
        A row of buttons rather than a <select>: three is few enough to show
        at once, and the point being made is precisely that there are only
        three. Hiding two of them behind a dropdown would hide the argument.
      */}
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Source files">
        {files.map((f, i) => (
          <button
            key={f.path}
            type="button"
            role="tab"
            aria-selected={i === active}
            onClick={() => setActive(i)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              i === active
                ? 'border-primary/50 bg-primary/10 text-foreground'
                : 'border-border/70 text-muted-foreground hover:border-primary/40 hover:text-foreground',
            )}
          >
            <FileCode2 className="h-3 w-3" />
            {f.path.split('/').pop()}
            {i > 0 ? (
              <span className="text-[10px] font-normal text-muted-foreground">shared</span>
            ) : null}
          </button>
        ))}
      </div>

      <CodeBlock
        code={file.source}
        filename={file.path}
        language={file.lang}
        effect={effect}
      />
    </div>
  )
}
