'use client'

import * as React from 'react'

import { CodeBlock } from '@/components/code-block'
import {
  MARKUP_FRAMEWORKS,
  MARKUP_FRAMEWORK_META,
  type MarkupFramework,
  type WrappedMarkup,
} from '@/lib/blocks/markup-frameworks'
import { track } from '@/lib/analytics'

/**
 * The framework picker for a block's rendered markup.
 *
 * Every variant is wrapped on the server and handed over as one small map,
 * rather than fetched per click. The markup is already in the page — this
 * tier's whole SEO argument is that the block's HTML is server-rendered —
 * so the only thing four variants add is the wrapper text, which is a few
 * hundred bytes each. A fetch per tab would be slower and would take the
 * code out of the page for a crawler.
 *
 * Which framework people pick is the point of tracking it: this is the
 * cheapest available answer to "should the block tier be ported properly",
 * a question that has so far been settled by assertion.
 */
export function MarkupFrameworkTabs({
  blockId,
  variants,
}: {
  blockId: string
  variants: Record<MarkupFramework, WrappedMarkup>
}) {
  const [framework, setFramework] = React.useState<MarkupFramework>('html')
  const active = variants[framework]

  return (
    <div>
      <div role="tablist" aria-label="Markup format" className="mb-3 flex flex-wrap gap-1.5">
        {MARKUP_FRAMEWORKS.map((id) => {
          const selected = id === framework
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => {
                setFramework(id)
                if (id !== 'html') track('block_markup_framework', { block_id: blockId, framework: id })
              }}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                selected
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {MARKUP_FRAMEWORK_META[id].label}
            </button>
          )
        })}
      </div>

      <CodeBlock
        code={active.code}
        language={active.language}
        filename={active.filename}
        maxHeightClass="max-h-[560px]"
      />
    </div>
  )
}
