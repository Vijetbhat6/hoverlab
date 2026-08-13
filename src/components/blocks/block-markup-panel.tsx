import * as React from 'react'
import { Globe, TriangleAlert } from 'lucide-react'

import { CodeBlock } from '@/components/code-block'
import { blockMarkup, markupNotes } from '@/lib/blocks/block-markup'
import type { Block } from '@/lib/blocks/block-types'

/**
 * "Use this outside React" — the block's rendered markup.
 *
 * A server component, and it has to be: rendering the block to a string
 * pulls the whole registry, which is the entire block catalog. Keeping this
 * on the server means a visitor who never scrolls this far downloads none
 * of it, and a visitor who does gets the HTML already in the page.
 *
 * Deliberately not a framework picker like the effect page has. Wrapping
 * this markup in `<template>` would produce a file that says "Vue" and
 * contains no Vue — the value here is the markup and the Tailwind classes,
 * and pretending otherwise is what `block-markup.ts` exists to avoid.
 */
export function BlockMarkupPanel({ block }: { block: Block }) {
  const html = blockMarkup(block.id)
  if (!html) return null

  const isInteractive = block.files.some((f) => f.source.includes("'use client'"))
  const notes = markupNotes(isInteractive)

  return (
    <section className="mt-12">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Not using React?
      </h2>
      <p className="mb-4 max-w-2xl text-sm text-muted-foreground">
        The same block rendered to plain HTML. Tailwind classes are
        framework-agnostic, so the design drops into Vue, Svelte, Astro, Rails
        or a static page unchanged.
      </p>

      {isInteractive ? (
        <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-sm text-amber-700 dark:text-amber-300">
          <TriangleAlert aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            This block is interactive. The markup below is its initial state
            with the event handlers stripped — you will need to re-wire the
            behaviour in your framework.
          </p>
        </div>
      ) : null}

      <CodeBlock
        code={html}
        language="html"
        filename={`${block.id}.html`}
        maxHeightClass="max-h-[560px]"
      />

      <ul className="mt-4 space-y-1.5">
        {notes.map((note) => (
          <li key={note} className="flex items-start gap-2 text-xs text-muted-foreground">
            <Globe aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {note}
          </li>
        ))}
      </ul>
    </section>
  )
}
