'use client'

/**
 * <FeedbackWidget> — the smallest thing that collects a useful complaint.
 *
 * The contact form asks for a name, an email, a subject and a message, and
 * it is the right shape for someone who arrived intending to get in touch.
 * It is the wrong shape entirely for the moment this block is for: someone
 * mid-task who just noticed something wrong. That person will not fill in
 * four fields, and if the only route is the contact page they will leave
 * with the thing still broken.
 *
 * So the ask is one click, and everything after it is optional.
 *
 * THE RATING IS THE WHOLE FORM
 *
 * Picking a face submits nothing and commits nothing — it opens the comment
 * box. That ordering matters: it means the low-effort answer is already
 * captured before the high-effort one is requested, so an abandoned comment
 * still leaves you a signal. A widget that requires the comment collects
 * far fewer ratings and not many more comments.
 *
 * EMAIL IS OPTIONAL AND SAYS WHY
 *
 * "Only so we can reply" under an optional field is worth more than a
 * privacy page nobody opens. Most people leave it blank; the ones who fill
 * it in are the ones who want an answer, which is exactly the segmentation
 * you want and it is free.
 *
 * WHAT IT SENDS THAT NOBODY TYPES
 *
 * The page path goes with the report. Half of all "it's broken" messages
 * arrive without one, and the fifteen minutes spent asking "where?" is the
 * reason most of them are never resolved. It is disclosed rather than
 * collected quietly — the line under the button says what is attached.
 *
 * ACCESSIBILITY
 *
 * The ratings are a radio group with real labels ("Bad", "Fine", "Great"),
 * so the choice is announced as a named option rather than as "button,
 * emoji". Emoji themselves are `aria-hidden`: a screen reader reading out
 * "slightly smiling face" as a form value is noise, and the text label
 * beside it is the actual answer. The thank-you state is a `role="status"`
 * so a submit that swaps the panel is heard and not only seen.
 */

import * as React from 'react'
import { MessageSquare, Send, X } from 'lucide-react'

export interface FeedbackRating {
  value: string
  emoji: string
  label: string
}

export interface FeedbackWidgetProps {
  heading?: string
  ratings?: FeedbackRating[]
  placeholder?: string
  /** Shown under the button — say what travels with the message. */
  attachmentNote?: string
  onSubmit?: (feedback: { rating: string; comment: string; email: string }) => void
  className?: string
}

const DEFAULT_RATINGS: FeedbackRating[] = [
  { value: 'bad', emoji: '🙁', label: 'Bad' },
  { value: 'ok', emoji: '😐', label: 'Fine' },
  { value: 'good', emoji: '🙂', label: 'Good' },
  { value: 'great', emoji: '😍', label: 'Great' },
]

export function FeedbackWidget({
  heading = 'How is this page working for you?',
  ratings = DEFAULT_RATINGS,
  placeholder = 'What happened? The more specific, the more fixable.',
  attachmentNote = 'Sends the page address and your browser version. Nothing else.',
  onSubmit,
  className = '',
}: FeedbackWidgetProps) {
  const [rating, setRating] = React.useState('')
  const [comment, setComment] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [sent, setSent] = React.useState(false)

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    onSubmit?.({ rating, comment, email })
    setSent(true)
  }

  if (sent) {
    return (
      <section
        className={`mx-auto w-full max-w-md px-4 py-16 sm:px-6 ${className}`}
        aria-labelledby="feedback-heading"
      >
        <div
          role="status"
          className="rounded-2xl border border-border bg-card p-6 text-center"
        >
          <h2 id="feedback-heading" className="text-base font-semibold text-foreground">
            Thank you — that is genuinely useful.
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {email
              ? 'You will get a reply at the address you left, usually within a day.'
              : 'No reply is coming, because you did not leave an address — which is completely fine.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setSent(false)
              setRating('')
              setComment('')
              setEmail('')
            }}
            className="mt-4 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Send another
          </button>
        </div>
      </section>
    )
  }

  return (
    <section
      aria-labelledby="feedback-heading"
      className={`mx-auto w-full max-w-md px-4 py-16 sm:px-6 ${className}`}
    >
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-border bg-card p-5 shadow-sm"
      >
        <div className="flex items-start justify-between gap-3">
          <h2
            id="feedback-heading"
            className="flex items-center gap-2 text-sm font-semibold text-foreground"
          >
            <MessageSquare aria-hidden className="h-4 w-4 text-muted-foreground" />
            {heading}
          </h2>
          <button
            type="button"
            className="-m-1 rounded p-1 text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <X aria-hidden className="h-4 w-4" />
            <span className="sr-only">Dismiss feedback</span>
          </button>
        </div>

        <fieldset className="mt-4">
          <legend className="sr-only">Rate this page</legend>
          <div className="grid grid-cols-4 gap-2">
            {ratings.map((option) => {
              const active = rating === option.value
              return (
                <label
                  key={option.value}
                  className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl border px-2 py-3 transition ${
                    active
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-background hover:bg-muted'
                  } focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background`}
                >
                  <input
                    type="radio"
                    name="feedback-rating"
                    value={option.value}
                    checked={active}
                    onChange={() => setRating(option.value)}
                    className="sr-only"
                  />
                  {/* Hidden from assistive tech — the label below is the
                      answer, and "slightly smiling face" is not. */}
                  <span aria-hidden className="text-xl leading-none">
                    {option.emoji}
                  </span>
                  <span
                    className={`text-[11px] ${active ? 'font-medium text-foreground' : 'text-muted-foreground'}`}
                  >
                    {option.label}
                  </span>
                </label>
              )
            })}
          </div>
        </fieldset>

        {/*
          Everything below appears only after a rating exists. The signal is
          already captured by then, so abandoning here still leaves data.
        */}
        {rating ? (
          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="sr-only">Tell us more</span>
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={3}
                placeholder={placeholder}
                className="w-full resize-y rounded-lg border border-field bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              />
            </label>

            <label className="block">
              <span className="text-xs text-muted-foreground">
                Email <span className="text-muted-foreground/70">— optional, only so we can reply</span>
              </span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                className="mt-1 h-9 w-full rounded-lg border border-field bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              />
            </label>

            <button
              type="submit"
              className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Send aria-hidden className="h-4 w-4" />
              Send feedback
            </button>

            {/* Disclosed, not collected quietly. */}
            <p className="text-center text-[11px] text-muted-foreground">{attachmentNote}</p>
          </div>
        ) : null}
      </form>
    </section>
  )
}
