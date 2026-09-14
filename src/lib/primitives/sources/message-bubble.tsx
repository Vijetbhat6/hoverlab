'use client'

/**
 * <MessageBubble> — one turn in a conversation.
 *
 * The catalog already ships `<ChatThreadPanel>`, which is a whole thread
 * with a composer pinned under it. This is the piece that thread is made
 * of, for the far more common case: you have your own list, your own
 * scroll behaviour and your own streaming hook, and what you actually want
 * is for one turn to be drawn and announced correctly.
 *
 * Three decisions carry it.
 *
 * **Alignment and colour are not an accessible name.** Every chat UI tells
 * you who is speaking by putting the user on the right in a coloured
 * bubble and the assistant on the left in a grey one. Read aloud, both are
 * an unattributed paragraph, and a thread of them is one long monologue by
 * nobody. So the speaker is always in the text — visibly where there is a
 * header, `sr-only` where the design has none.
 *
 * **It is an `<article>`.** Screen readers expose articles as a navigable
 * unit, which is what turns a log into something you can move through turn
 * by turn rather than line by line. `aria-labelledby` points at the
 * speaker, so moving between them announces who said what.
 *
 * **The timestamp is formatted twice, on purpose.** `toLocaleTimeString`
 * reads the server's locale and timezone during SSR and the browser's
 * during hydration, which is a mismatch React resolves by throwing the
 * subtree away — silently, and only for users whose timezone differs from
 * the build machine's. The fix is to render an explicit UTC string first
 * and swap in the local one from an effect: one extra paint, always right.
 */

import * as React from 'react'

export type MessageRole = 'user' | 'assistant' | 'system'

export interface MessageBubbleProps {
  role: MessageRole
  /** Overrides the default name for the role. */
  name?: string
  /** Rendered beside the bubble. Any node — an image, initials, an icon. */
  avatar?: React.ReactNode
  /** ISO string or Date. Rendered as a real `<time>`. */
  timestamp?: string | Date
  /**
   * Copy, retry, feedback. Revealed on hover *and* focus-within, because a
   * row that appears only on hover does not exist for a keyboard or a
   * touchscreen — pass `alwaysShowActions` where that matters more than
   * the quiet default.
   */
  actions?: React.ReactNode
  alwaysShowActions?: boolean
  /** Draws the bubble as unsent, and announces it. */
  pending?: boolean
  className?: string
  children: React.ReactNode
}

const DEFAULT_NAME: Record<MessageRole, string> = {
  user: 'You',
  assistant: 'Assistant',
  system: 'System',
}

const BUBBLE: Record<MessageRole, string> = {
  user: 'bg-primary text-primary-foreground',
  assistant: 'bg-muted text-foreground',
  system: 'border border-border bg-card text-muted-foreground',
}

function isoOf(value: string | Date): string {
  return typeof value === 'string' ? value : value.toISOString()
}

export function MessageBubble({
  role,
  name,
  avatar,
  timestamp,
  actions,
  alwaysShowActions = false,
  pending = false,
  className = '',
  children,
}: MessageBubbleProps) {
  const uid = React.useId()
  const speaker = name ?? DEFAULT_NAME[role]
  const iso = timestamp ? isoOf(timestamp) : undefined

  // Server and first client render agree on UTC; the effect replaces it
  // with the reader's own clock once there is a reader. See the header.
  const [clock, setClock] = React.useState(() =>
    iso
      ? new Date(iso).toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'UTC',
        })
      : '',
  )

  React.useEffect(() => {
    if (!iso) return
    setClock(
      new Date(iso).toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      }),
    )
  }, [iso])

  const mine = role === 'user'

  return (
    <article
      aria-labelledby={`${uid}-speaker`}
      className={[
        'group flex w-full gap-3',
        mine ? 'flex-row-reverse' : 'flex-row',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {avatar ? (
        <span
          aria-hidden="true"
          className="mt-0.5 grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-muted text-xs font-medium text-muted-foreground"
        >
          {avatar}
        </span>
      ) : null}

      <div className={['flex min-w-0 max-w-[85%] flex-col gap-1', mine ? 'items-end' : 'items-start'].join(' ')}>
        <p className="flex items-baseline gap-2 text-xs text-muted-foreground">
          <span id={`${uid}-speaker`} className="font-medium text-foreground">
            {speaker}
          </span>
          {iso ? (
            <time dateTime={iso} className="tabular-nums">
              {clock}
            </time>
          ) : null}
        </p>

        <div
          className={[
            'rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
            mine ? 'rounded-se-sm' : 'rounded-ss-sm',
            BUBBLE[role],
            pending ? 'opacity-60' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {children}
        </div>

        {pending ? <span className="sr-only">Sending</span> : null}

        {actions ? (
          <div
            className={[
              'flex items-center gap-1 transition-opacity',
              alwaysShowActions
                ? 'opacity-100'
                : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100',
            ].join(' ')}
          >
            {actions}
          </div>
        ) : null}
      </div>
    </article>
  )
}
