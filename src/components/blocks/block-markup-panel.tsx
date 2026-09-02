import * as React from 'react'
import Link from 'next/link'
import { Globe, TriangleAlert } from 'lucide-react'

import { CodeBlock } from '@/components/code-block'
import { blockMarkup, markupNotes } from '@/lib/blocks/block-markup'
import {
  MARKUP_FRAMEWORKS,
  wrapMarkup,
  type MarkupFramework,
  type WrappedMarkup,
} from '@/lib/blocks/markup-frameworks'
import { MarkupFrameworkTabs } from '@/components/blocks/markup-framework-tabs'
import type { Block } from '@/lib/blocks/block-types'

/**
 * "Use this outside React" — the block's rendered markup.
 *
 * A server component, and it has to be: rendering the block to a string
 * pulls the whole registry, which is the entire block catalog. Keeping this
 * on the server means a visitor who never scrolls this far downloads none
 * of it, and a visitor who does gets the HTML already in the page.
 *
 * IT NOW IS A FRAMEWORK PICKER, and the note that said it deliberately was
 * not is worth keeping in view rather than deleting. It read: "wrapping this
 * markup in `<template>` would produce a file that says Vue and contains no
 * Vue". That was half right. A `<template>`-only single-file component is
 * not a file pretending to be Vue — it is a presentational Vue component,
 * which is a real and common thing; the same goes for a markup-only
 * `.svelte`, and for `.astro` it is the ordinary shape.
 *
 * The dishonesty was never in the file format. It is in the claim, so the
 * claim is what is controlled: every variant carries the caveat as a comment
 * inside the file, where it survives being pasted into a repo. See
 * `markup-frameworks.ts`.
 */
export function BlockMarkupPanel({ block }: { block: Block }) {
  const html = blockMarkup(block.id)
  if (!html) return null

  const isInteractive = block.files.some((f) => f.source.includes("'use client'"))
  const notes = markupNotes(isInteractive)

  /*
   * All four wrapped here rather than on click. The markup is already in
   * the page — server-rendered HTML is this tier's SEO argument — so the
   * variants only add their wrapper text, and building them on the server
   * keeps the code in the document for a crawler.
   */
  const variants = Object.fromEntries(
    MARKUP_FRAMEWORKS.map((framework) => [
      framework,
      wrapMarkup(html, {
        framework,
        id: block.id,
        name: block.name,
        isInteractive,
      }),
    ]),
  ) as Record<MarkupFramework, WrappedMarkup>

  return (
    <section className="mt-12">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Not using React?
      </h2>
      <p className="mb-4 max-w-2xl text-sm text-muted-foreground">
        The same block rendered once to markup, wrapped as a file your
        framework compiles. Tailwind classes are framework-agnostic, so the
        design transfers intact — the behaviour does not.
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

      <MarkupFrameworkTabs blockId={block.id} variants={variants} />

      <ul className="mt-4 space-y-1.5">
        {notes.map((note) => (
          <li key={note} className="flex items-start gap-2 text-xs text-muted-foreground">
            <Globe aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {note}
          </li>
        ))}
      </ul>

      {/*
        A way out of the panel.

        This tab strip was, for months, the ONLY place on the site that said
        Hoverlab does anything but React — three clicks deep, on one block's
        page, invisible to anyone deciding whether to try it at all. The
        band on the landing page and /frameworks fix the discovery; this
        line stops the panel being a dead end for the reader who did find
        it and now wants to know whether the effects work the same way.
        They do not, and /frameworks is where that is spelled out.
      */}
      <p className="mt-4 text-xs text-muted-foreground">
        <Link href="/frameworks" className="font-medium text-primary hover:underline">
          What each framework gets across the whole catalog
        </Link>{' '}
        — effects convert properly; this rung is markup.
      </p>
    </section>
  )
}
