'use client'

/**
 * <ChatAttachmentTray> — files staged against a prompt, before it is sent.
 *
 * The catalog's upload blocks cover uploading as the task: a dropzone, a
 * progress list, a resumable transfer. Attaching to a message is a
 * different problem. The upload is incidental; what matters is what the
 * model will actually receive, and whether the send button should be
 * available yet.
 *
 * THE THREE THINGS THIS SHOWS THAT AN UPLOAD LIST DOES NOT
 *
 *   - Whether each file can be read at all. A 40MB video attached to a text
 *     model is not a slow upload, it is a file that will be ignored, and
 *     saying so before send is the whole job.
 *   - What it costs. Attachments are the largest single driver of context
 *     spend and the one users never see coming; the running token estimate
 *     is beside the send button, not in a settings page.
 *   - Whether the context window can hold it. A tray that lets you attach
 *     past the limit and then fails on send has wasted the upload and the
 *     wait.
 *
 * SEND IS BLOCKED FOR ONE REASON AT A TIME. When it is disabled the button
 * says why in the same line, rather than being greyed with the explanation
 * somewhere above it.
 *
 * UPLOADING IS NOT A BLOCKER FOR REMOVAL. A file can be removed while it is
 * still transferring, which is the state most trays get wrong — the × is
 * hidden until the upload finishes, so the user waits for a file they
 * already decided against.
 *
 * ACCESSIBILITY: the tray is a `<ul>` with each file's status in text, not
 * only in colour; progress uses `role="progressbar"` with a real value; and
 * the token budget lives in an `aria-live="polite"` region so it is
 * announced when attaching changes it.
 */

import * as React from 'react'
import { AlertTriangle, FileText, Image as ImageIcon, Paperclip, Send, X } from 'lucide-react'

export type AttachmentState = 'uploading' | 'ready' | 'unsupported'

export interface Attachment {
  id: string
  name: string
  /** Human-readable, already formatted. */
  size: string
  kind: 'image' | 'document'
  state: AttachmentState
  /** 0–100, only meaningful while uploading. */
  progress?: number
  /** Estimated context cost once read. */
  tokens?: number
  /** Why it cannot be used, when state is `unsupported`. */
  reason?: string
}

export interface ChatAttachmentTrayProps {
  attachments?: Attachment[]
  /** Context window in tokens, for the budget line. */
  contextLimit?: number
  /** Tokens the conversation already occupies. */
  usedTokens?: number
  className?: string
}

const DEFAULT_ATTACHMENTS: Attachment[] = [
  {
    id: '1',
    name: 'q3-renewals.pdf',
    size: '820 KB',
    kind: 'document',
    state: 'ready',
    tokens: 14_200,
  },
  {
    id: '2',
    name: 'dashboard-screenshot.png',
    size: '1.4 MB',
    kind: 'image',
    state: 'uploading',
    progress: 62,
    tokens: 1_600,
  },
  {
    id: '3',
    name: 'walkthrough.mov',
    size: '41 MB',
    kind: 'document',
    state: 'unsupported',
    reason: 'Video is not readable by this model. Attach a screenshot or a transcript.',
  },
]

export function ChatAttachmentTray({
  attachments = DEFAULT_ATTACHMENTS,
  contextLimit = 128_000,
  usedTokens = 21_400,
  className = '',
}: ChatAttachmentTrayProps) {
  const [files, setFiles] = React.useState(attachments)
  const [prompt, setPrompt] = React.useState('Summarise the renewal risks in these.')

  const remove = (id: string) => setFiles((current) => current.filter((file) => file.id !== id))

  const usable = files.filter((file) => file.state !== 'unsupported')
  const attachedTokens = usable.reduce((sum, file) => sum + (file.tokens ?? 0), 0)
  const projected = usedTokens + attachedTokens
  const overBudget = projected > contextLimit
  const stillUploading = files.some((file) => file.state === 'uploading')

  /*
   * One reason at a time, in the order the user can act on. Listing three
   * blockers at once makes none of them the next step.
   */
  const blockedBecause = overBudget
    ? 'Over the context window'
    : stillUploading
      ? 'Waiting for uploads'
      : prompt.trim().length === 0
        ? 'Write a message first'
        : null

  const percent = Math.min(100, Math.round((projected / contextLimit) * 100))

  return (
    <section
      className={`rounded-2xl border border-border bg-card p-4 text-card-foreground ${className}`}
    >
      {files.length > 0 ? (
        <ul className="mb-3 space-y-2">
          {files.map((file) => {
            const Icon = file.kind === 'image' ? ImageIcon : FileText
            const broken = file.state === 'unsupported'

            return (
              <li
                key={file.id}
                className={`flex items-start gap-3 rounded-xl border p-2.5 ${
                  broken ? 'border-destructive/40 bg-destructive/5' : 'border-border bg-muted/30'
                }`}
              >
                <span
                  aria-hidden
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    broken ? 'bg-destructive/10' : 'bg-background'
                  }`}
                >
                  {broken ? (
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  ) : (
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file.name}</p>

                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {file.size}
                    {file.state === 'ready' && file.tokens ? (
                      <> · about {file.tokens.toLocaleString('en-US')} tokens</>
                    ) : null}
                    {file.state === 'uploading' ? <> · uploading {file.progress}%</> : null}
                  </p>

                  {file.state === 'uploading' ? (
                    <div
                      role="progressbar"
                      aria-valuenow={file.progress ?? 0}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Uploading ${file.name}`}
                      className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted"
                    >
                      <div
                        className="h-full rounded-full bg-primary transition-[width] duration-300"
                        style={{ width: `${file.progress ?? 0}%` }}
                      />
                    </div>
                  ) : null}

                  {broken ? (
                    <p className="mt-1 text-xs text-destructive">{file.reason}</p>
                  ) : null}
                </div>

                {/* Removable at every stage, uploading included. */}
                <button
                  type="button"
                  onClick={() => remove(file.id)}
                  aria-label={`Remove ${file.name}`}
                  className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X aria-hidden className="h-4 w-4" />
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}

      <label className="sr-only" htmlFor="chat-prompt">
        Message
      </label>
      <textarea
        id="chat-prompt"
        rows={2}
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        placeholder="Ask anything about the attached files…"
        className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />

      {/* The budget, beside the send button rather than in a settings page. */}
      <div aria-live="polite" className="mt-3">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className={overBudget ? 'font-medium text-destructive' : 'text-muted-foreground'}>
            {projected.toLocaleString('en-US')} / {contextLimit.toLocaleString('en-US')} tokens
            {attachedTokens > 0 ? (
              <> · {attachedTokens.toLocaleString('en-US')} from attachments</>
            ) : null}
          </span>
          <span className="text-muted-foreground">{percent}%</span>
        </div>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-[width] duration-300 ${
              overBudget ? 'bg-destructive' : 'bg-primary'
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Paperclip aria-hidden className="h-4 w-4" />
          Attach
        </button>

        <button
          type="button"
          disabled={Boolean(blockedBecause)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Send aria-hidden className="h-4 w-4" />
          {blockedBecause ?? 'Send'}
        </button>
      </div>
    </section>
  )
}
