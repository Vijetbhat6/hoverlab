/**
 * The assistant, as a whole screen rather than a message list.
 *
 * Every chat UI looks the same in a screenshot and diverges completely the
 * moment someone uses it, because the interesting parts are the ones a
 * screenshot cannot show: what the blank thread offers, where the files
 * you attached went, what happened to the answer you regenerated.
 *
 * So the running order here is the order a real session goes through, not
 * the order the components look best in.
 *
 * The empty state is first and it is not decorative. A blank thread is the
 * highest-abandonment moment in the product — a cursor blinking in a box
 * that could accept anything is a worse prompt than no box at all — and
 * <ChatEmptyState> answers it with grouped starter prompts rather than a
 * slogan.
 *
 * The model picker sits directly under it because choosing a model is a
 * decision made before the first message and almost never after, and it
 * carries the three numbers the choice actually turns on. Burying it in a
 * settings menu is how people end up paying frontier prices for
 * autocomplete.
 *
 * Attachments, branches and the canvas are the running conversation, in
 * increasing order of how far they are from "a list of messages":
 *
 *   attachments  what you staged, and what it costs you in context
 *   branches     the answers regenerate would otherwise have thrown away
 *   canvas       the two-pane layout, once an answer becomes an artifact
 *
 * The thread panel is last, deliberately, and it is the one people expect
 * first. It is the navigation *between* conversations, and navigation
 * between things is only interesting once there is more than one — putting
 * it at the top of this page would frame the product as a filing cabinet.
 */

import * as React from 'react'
import { ChatEmptyState } from '@/lib/blocks/sources/chat-empty-state'
import { ChatModelPicker } from '@/lib/blocks/sources/chat-model-picker'
import { ChatAttachmentTray } from '@/lib/blocks/sources/chat-attachment-tray'
import { ChatMessageBranches } from '@/lib/blocks/sources/chat-message-branches'
import { ChatArtifactCanvas } from '@/lib/blocks/sources/chat-artifact-canvas'
import { ChatThreadPanel } from '@/lib/blocks/sources/chat-thread-panel'

export default function AssistantChatPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto w-full max-w-5xl px-6 pb-2 pt-12">
        <h1 className="text-2xl font-bold tracking-tight">Assistant</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A blank thread, the model behind it, and the four surfaces a real
          session grows into.
        </p>
      </section>

      <ChatEmptyState />
      <ChatModelPicker />

      <ChatAttachmentTray />
      <ChatMessageBranches />
      <ChatArtifactCanvas />

      {/* Navigation between conversations — last, see the note above. */}
      <ChatThreadPanel />
    </main>
  )
}
