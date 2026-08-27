'use client'

/**
 * <ArticleHeader> — the opening screen of a single article.
 *
 * The byline sits between the standfirst and the prose, not in a sidebar:
 * on the one screen where a reader decides whether to commit, "who wrote
 * this and how long will it take" is part of the pitch, not metadata.
 *
 * The share row includes copy-link first because that is what people
 * actually do with articles worth keeping — the X and LinkedIn buttons are
 * mostly there so the copy button has company. The copy handler feature-
 * detects `navigator.clipboard` and simply hides itself where the API is
 * unavailable, rather than rendering a button that silently fails.
 *
 * THE DETECTION HAPPENS IN AN EFFECT, NOT DURING RENDER
 *
 * `typeof navigator !== 'undefined'` read during render is false on the
 * server and true in the browser, so the server sent the X link where the
 * client wanted a copy button and React threw the whole subtree away with
 * "Hydration failed". It was invisible on the page — the regenerated tree
 * looks right — and only showed up as a console error, which is how it
 * survived in a shipped block.
 *
 * Reading it in `useEffect` means the first client render matches the
 * server exactly (no button), and the button appears on the pass after
 * hydration. That is the correct shape for every browser-capability check
 * in a server-rendered component, and it is worth copying: the same
 * one-line detection is a hydration bug anywhere it is read during render.
 */

import * as React from 'react'
import { Link2, Check, Twitter, Linkedin } from 'lucide-react'

export interface ArticleHeaderProps {
  category?: string
  title?: string
  standfirst?: string
  author?: string
  role?: string
  /** ISO date — `2026-07-21`. */
  date?: string
  readMinutes?: number
  className?: string
}

export function ArticleHeader({
  category = 'Engineering',
  title = 'The day we deleted 40,000 lines of feature flags',
  standfirst = 'Flags are borrowed complexity — this is what it cost to pay ours back, and the two rules that keep the debt from growing again.',
  author = 'Priya Raman',
  role = 'Staff Engineer',
  date = '2026-07-21',
  readMinutes = 12,
  className = '',
}: ArticleHeaderProps) {
  const [copied, setCopied] = React.useState(false)
  // Starts false so the server's HTML and the first client render agree.
  const [canCopy, setCanCopy] = React.useState(false)

  React.useEffect(() => {
    setCanCopy(Boolean(navigator.clipboard))
  }, [])

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard permission denied — leave the button in its idle state.
    }
  }

  return (
    <header className={`mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 ${className}`}>
      <a
        href="#"
        className="text-sm font-semibold uppercase tracking-wide text-primary transition-colors hover:text-primary/80"
      >
        {category}
      </a>

      <h1 className="mt-4 text-balance text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>

      <p className="mt-5 text-pretty text-lg leading-relaxed text-muted-foreground">{standfirst}</p>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-y border-border/60 py-4">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary"
          >
            {author
              .split(' ')
              .slice(0, 2)
              .map((w) => w[0] ?? '')
              .join('')
              .toUpperCase()}
          </span>
          <div className="text-sm">
            <p className="font-semibold">{author}</p>
            <p className="text-muted-foreground">
              {role} ·{' '}
              <time dateTime={date}>
                {new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  timeZone: 'UTC',
                })}
              </time>{' '}
              · {readMinutes} min read
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canCopy ? (
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
            >
              {copied ? (
                <Check aria-hidden className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Link2 aria-hidden className="h-3.5 w-3.5" />
              )}
              {copied ? 'Copied' : 'Copy link'}
            </button>
          ) : null}
          <a
            href="#"
            aria-label="Share on X"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Twitter aria-hidden className="h-3.5 w-3.5" />
          </a>
          <a
            href="#"
            aria-label="Share on LinkedIn"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Linkedin aria-hidden className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      <div className="mt-10 space-y-8">
        <p className="text-pretty leading-relaxed text-foreground/90">
          The pull request was titled &ldquo;remove stale flags, part 1 of
          8&rdquo; and it deleted more code than the previous quarter had
          added. Our flag service listed 312 active flags; production
          telemetry showed 41 of them had evaluated to the same value for
          every user since at least January. The rest were split roughly
          evenly between experiments nobody remembered starting and kill
          switches for services we had already decommissioned.
        </p>

        <blockquote className="border-l-4 border-primary/60 pl-6">
          <p className="text-pretty text-xl font-semibold leading-relaxed tracking-tight text-foreground">
            &ldquo;A feature flag is a loan. The interest is every engineer
            who has to reason about both branches forever.&rdquo;
          </p>
        </blockquote>
      </div>
    </header>
  )
}
