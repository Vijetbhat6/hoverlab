'use client'

/**
 * <ReviewSubmitForm> — writing the review, not reading it.
 *
 * <ReviewList> and <ProductReviewSummary> both display reviews that somehow
 * already exist. This is the form that produces them, and it is the one
 * that decides whether they are any good — a review form is a content
 * pipeline, and almost every design decision in it trades volume against
 * usefulness.
 *
 * THE RATING IS A RADIO GROUP, NOT FIVE BUTTONS
 *
 * The star row is `role="radiogroup"` with five real inputs. That is what
 * gives arrow-key selection, one tab stop rather than five, and an
 * announced value — "3 stars, selected, 3 of 5". A row of `<button>`s with
 * a star glyph is the common implementation and it is unusable without a
 * mouse, which on a form this short means the whole block is.
 *
 * Hover preview is a pointer affordance layered on top, never the source of
 * truth: the fill follows `hovered ?? value`, so the keyboard and the mouse
 * agree and neither one is a special case.
 *
 * WHAT THE PROMPTS ARE FOR
 *
 * "Write a review" produces "great, thanks". The prompt line under the box
 * changes with the rating — a one-star review is asked what went wrong, a
 * five-star one is asked what it is good for — because the useful content
 * in each is different and nobody writes it unprompted. This is the single
 * highest-leverage element on the form and it costs one conditional.
 *
 * WHAT IS DELIBERATELY NOT REQUIRED
 *
 * The title. Most people write one sentence, and forcing a headline out of
 * them produces "Good product" on a third of all reviews. If it is blank
 * the list can render the first line of the body, which is a better title
 * than the one they would have typed.
 *
 * WHAT IS DISCLOSED BEFORE THEY START
 *
 * That the review is public, under their display name, and that it is
 * attached to a verified purchase. People edit what they write when they
 * learn that afterwards — which means the version they submitted was
 * written under a false impression.
 *
 * The character counter appears only as it approaches the limit. A counter
 * from character zero is a target, and it makes people write to it.
 */

import * as React from 'react'
import { ImagePlus, Star, X } from 'lucide-react'

export interface ReviewSubmitFormProps {
  productName?: string
  displayName?: string
  verifiedPurchase?: boolean
  maxLength?: number
  onSubmit?: (review: { rating: number; title: string; body: string }) => void
  className?: string
}

/*
  The prompt is the block. See the note above: what makes a one-star review
  useful is not what makes a five-star one useful, and neither gets written
  unless the form asks for it specifically.
*/
const PROMPTS: Record<number, string> = {
  1: 'What went wrong? The specific failure is more useful to the next reader than how it felt.',
  2: 'What did not work as expected — and was there anything that did?',
  3: 'What would have made this a four? Middling reviews are the ones people trust most.',
  4: 'What is it good at, and what stopped it being a five?',
  5: 'What is it good for? Say who you would recommend it to and why.',
}

export function ReviewSubmitForm({
  productName = 'Aeropress Go',
  displayName = 'Priya Raman',
  verifiedPurchase = true,
  maxLength = 1500,
  onSubmit,
  className = '',
}: ReviewSubmitFormProps) {
  const [rating, setRating] = React.useState(0)
  const [hovered, setHovered] = React.useState<number | null>(null)
  const [title, setTitle] = React.useState('')
  const [body, setBody] = React.useState('')

  /* Hover previews; the chosen value is what counts. */
  const shown = hovered ?? rating
  const remaining = maxLength - body.length
  const nearLimit = remaining <= 200

  return (
    <section
      aria-labelledby="review-form-heading"
      className={`mx-auto w-full max-w-xl px-4 py-16 sm:px-6 lg:px-8 ${className}`}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit?.({ rating, title, body })
        }}
        className="rounded-2xl border border-border bg-card p-6 sm:p-8"
      >
        <h2 id="review-form-heading" className="text-lg font-semibold text-foreground">
          Review your {productName}
        </h2>

        {/* Said before they write, not after. */}
        <p className="mt-1.5 text-sm text-muted-foreground">
          This will be public, shown as{' '}
          <span className="font-medium text-foreground">{displayName}</span>
          {verifiedPurchase ? ', marked as a verified purchase' : ''}. You can edit
          or delete it later.
        </p>

        <fieldset className="mt-6">
          <legend className="text-sm font-medium text-foreground">
            How many stars?
          </legend>

          {/* A real radio group: arrow keys, one tab stop, announced value. */}
          <div
            role="radiogroup"
            aria-label="Rating out of 5"
            className="mt-2 flex items-center gap-1"
            onMouseLeave={() => setHovered(null)}
          >
            {[1, 2, 3, 4, 5].map((value) => (
              <label
                key={value}
                onMouseEnter={() => setHovered(value)}
                className="cursor-pointer rounded p-1 focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background"
              >
                <input
                  type="radio"
                  name="review-rating"
                  value={value}
                  checked={rating === value}
                  onChange={() => setRating(value)}
                  className="sr-only"
                />
                <Star
                  aria-hidden
                  className={`h-7 w-7 transition ${
                    value <= shown
                      ? 'fill-amber-400 text-amber-400'
                      : 'fill-transparent text-muted-foreground/50'
                  }`}
                />
                <span className="sr-only">
                  {value} star{value === 1 ? '' : 's'}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {rating > 0 ? (
          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-foreground">
                Headline{' '}
                <span className="font-normal text-muted-foreground">— optional</span>
              </span>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={80}
                placeholder="Leave it blank and we will use your first line"
                className="mt-1.5 h-9 w-full rounded-lg border border-field bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-foreground">Your review</span>
              {/* The prompt changes with the rating. */}
              <span
                role="status"
                className="mt-0.5 block text-sm text-muted-foreground"
              >
                {PROMPTS[rating]}
              </span>
              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value.slice(0, maxLength))}
                rows={5}
                className="mt-2 w-full resize-y rounded-lg border border-field bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              />
              {/* Only near the limit. A counter from zero is a target. */}
              {nearLimit ? (
                <span className="mt-1 block text-end text-xs text-muted-foreground">
                  {remaining} characters left
                </span>
              ) : null}
            </label>

            <button
              type="button"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-dashed border-border px-3 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <ImagePlus aria-hidden className="h-4 w-4" />
              Add photos
            </button>

            <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
              <button
                type="submit"
                disabled={body.trim().length === 0}
                className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50"
              >
                Post review
              </button>
              <button
                type="button"
                onClick={() => {
                  setRating(0)
                  setTitle('')
                  setBody('')
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <X aria-hidden className="h-4 w-4" />
                Start over
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-5 text-sm text-muted-foreground">
            Pick a rating and the rest of the form appears.
          </p>
        )}
      </form>
    </section>
  )
}
