/**
 * AI inside a document, rather than beside one.
 *
 * The chat window is the easy shape and the wrong one for editing. Every
 * surface on this page shares a single constraint that a chat panel does
 * not have: the user is in the middle of writing something, and the model
 * has to arrive without taking the cursor, the selection or the scroll
 * position away from them.
 *
 * That constraint is why the order runs from least to most interruptive.
 *
 *   slash menu       invoked by typing, so focus never leaves the editor
 *   inline           a completion in the text itself, dismissed by typing
 *   selection        a toolbar that only exists while a selection does
 *   action menu      an explicit, deliberate list of transformations
 *   inspector        the model edits real properties, each one attributed
 *                    and reversible
 *
 * <GroundingSplit> and <HumanOversightSplit> close the page and they are a
 * different kind of thing: not editing surfaces but the two answers to
 * "where did that come from" and "who is accountable for it". They belong
 * on this page rather than on the retrieval console because the person who
 * needs them is the one about to publish the paragraph, not the one
 * debugging the index.
 *
 * The inspector is the most interruptive and sits last among the editing
 * surfaces for a reason worth stating: per-property provenance is what
 * makes a bulk AI edit reversible, and reversibility is the thing that lets
 * someone accept a suggestion without reading all of it first.
 */

import * as React from 'react'
import { AiSlashMenu } from '@/lib/blocks/sources/ai-slash-menu'
import { AiInlineSuggestion } from '@/lib/blocks/sources/ai-inline-suggestion'
import { SelectionAiToolbar } from '@/lib/blocks/sources/selection-ai-toolbar'
import { AiActionMenu } from '@/lib/blocks/sources/ai-action-menu'
import { AiInspectorPanel } from '@/lib/blocks/sources/ai-inspector-panel'
import { GroundingSplit } from '@/lib/blocks/sources/grounding-split'
import { HumanOversightSplit } from '@/lib/blocks/sources/human-oversight-split'

export default function AiEditorPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto w-full max-w-5xl px-6 pb-2 pt-12">
        <h1 className="text-2xl font-bold tracking-tight">Editor</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Five ways to reach the model without leaving the sentence you were
          writing — and the two surfaces that say where its answer came from.
        </p>
      </section>

      <AiSlashMenu />
      <AiInlineSuggestion />
      <SelectionAiToolbar />
      <AiActionMenu />
      <AiInspectorPanel />

      {/* Provenance and accountability, for the person about to publish. */}
      <GroundingSplit />
      <HumanOversightSplit />
    </main>
  )
}
