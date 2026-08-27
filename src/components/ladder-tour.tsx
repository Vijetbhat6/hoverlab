'use client'

/**
 * The four-rung ladder, explained once, on the first visit.
 *
 * The ladder is the thing this catalog has that a wall of CSS snippets does
 * not — and it was only ever stated on the landing page, in a band you had
 * to scroll to. Anyone arriving on /block/pricing-tiers from a search result
 * saw a component library with an oddly specific name. Worse, there was no
 * sentence anyone could repeat: "it's got effects and blocks and pages and
 * templates" is a list, not a model.
 *
 * So: four steps, one sentence each, in the shape people actually retell —
 * atoms, sections, screens, projects. Small enough to read in fifteen
 * seconds and specific enough to hand to a colleague.
 *
 * Shown once. The flag is written when the tour is dismissed *or* finished,
 * so closing it counts — nobody should meet this twice by accident. It can
 * be reopened from Preferences → "Replay the intro", which is also what
 * makes it safe to dismiss.
 *
 * Deliberately not a coach-mark tour pinned to real elements: those need
 * every target to exist on the current page, and this mounts on nine
 * different surfaces plus 4,300 detail pages. A self-contained dialog says
 * the same thing and cannot point at something that isn't there.
 */

import * as React from 'react'
import Link from 'next/link'
import { ArrowRight, Blocks, Boxes, Layers, Layout, Sparkles } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CONSENT_REQUIRED, readConsent } from '@/lib/consent'
import { TOTAL_COUNT } from '@/lib/catalog-stats'
import { BLOCK_COUNT } from '@/lib/blocks/block-index'
import { PAGE_COUNT } from '@/lib/pages/page-index'
import { TEMPLATE_COUNT } from '@/lib/templates/template-index'

const STORAGE_KEY = 'hoverlab:ladder-tour-seen'
/** Pages viewed this session. Session-scoped so it resets on a new visit. */
const VIEW_COUNT_KEY = 'hoverlab:pageviews'
const OPEN_EVENT = 'hoverlab:open-ladder-tour'

/** Reopen the tour from anywhere. No-op during SSR. */
export function openLadderTour(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(OPEN_EVENT))
}

interface Rung {
  /** The noun, as someone would say it out loud. */
  headline: string
  label: string
  href: string
  count: number
  blurb: string
  /** What you'd reach for it for — the test that tells the rungs apart. */
  example: string
  icon: React.ReactNode
  accent: string
}

const RUNGS: Rung[] = [
  {
    headline: 'Effects are atoms',
    label: 'Effects',
    href: '/library',
    count: TOTAL_COUNT,
    blurb:
      'One behaviour on one element — a hover state, a loader, a gradient that moves. Pure CSS, no JavaScript, no dependencies.',
    example: '“Make this button glow when I hover it.”',
    icon: <Sparkles aria-hidden className="h-5 w-5" />,
    accent: 'from-amber-500 to-orange-500',
  },
  {
    headline: 'Blocks are sections',
    label: 'Blocks',
    href: '/blocks',
    count: BLOCK_COUNT,
    blurb:
      'A finished piece of a page — a pricing table, an FAQ, a navbar. Laid out, responsive and accessible, in markup and Tailwind classes.',
    example: '“I need a pricing section by Thursday.”',
    icon: <Blocks aria-hidden className="h-5 w-5" />,
    accent: 'from-emerald-500 to-teal-500',
  },
  {
    headline: 'Pages are screens',
    label: 'Pages',
    href: '/pages',
    count: PAGE_COUNT,
    blurb:
      'A whole screen assembled from blocks, in an order that works — hero, proof, pricing, objections, call to action.',
    example: '“Give me a SaaS landing page, not the pieces of one.”',
    icon: <Layout aria-hidden className="h-5 w-5" />,
    accent: 'from-sky-500 to-indigo-500',
  },
  {
    headline: 'Templates are projects',
    label: 'Templates',
    href: '/templates',
    count: TEMPLATE_COUNT,
    blurb:
      'Routing, root layout, theme tokens and every screen, arranged so that npm run dev gives you something that already runs.',
    example: '“Start me a project, not a folder of components.”',
    icon: <Boxes aria-hidden className="h-5 w-5" />,
    accent: 'from-violet-500 to-fuchsia-500',
  },
]

export function LadderTour() {
  const [open, setOpen] = React.useState(false)
  const [step, setStep] = React.useState(0)

  /**
   * First-visit check runs in an effect, not during render: localStorage is
   * not readable on the server, and reading it during the first client
   * render would make the markup disagree with what was sent.
   *
   * It opens on the SECOND page of a session, not the first.
   *
   * This dialog was written while the catalog was behind a login, so the
   * only people who reached it had already signed up and the "first visit"
   * was never someone's first second on the site. The gate is gone: every
   * one of the ~1,000 artifact pages is now a search landing page, and
   * opening a focus-trapping modal over the thing a visitor just clicked
   * from Google is an interstitial — bad for the person, and something
   * Google downranks on mobile in its own right.
   *
   * Waiting one navigation keeps the intent (explain the ladder early,
   * once) and drops the cost: someone who bounces never meets it, and
   * someone who is actually exploring still gets the model on page two,
   * long before it matters. `sessionStorage` scopes the count to the
   * visit, so a returning visitor who never dismissed it is not made to
   * wait a page again.
   *
   * It also waits for the cookie decision. This dialog traps focus; the
   * consent banner deliberately does not, and putting a trap on top of an
   * unanswered consent question makes answering it the harder of the two
   * things on screen. The check re-runs on the next navigation, so a
   * visitor who answers on page two still meets the tour on page three.
   */
  React.useEffect(() => {
    let seen = true
    let views = 0
    try {
      seen = window.localStorage.getItem(STORAGE_KEY) === '1'
      views = Number(window.sessionStorage.getItem(VIEW_COUNT_KEY) ?? '0') + 1
      window.sessionStorage.setItem(VIEW_COUNT_KEY, String(views))
    } catch {
      // Private mode or blocked storage. Treat as seen — a tour that
      // cannot remember being dismissed would show on every page load,
      // which is far worse than never showing.
      return
    }
    const consentPending = CONSENT_REQUIRED && readConsent() === null
    if (!seen && views >= 2 && !consentPending) setOpen(true)
  }, [])

  React.useEffect(() => {
    function onOpen() {
      setStep(0)
      setOpen(true)
    }
    window.addEventListener(OPEN_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_EVENT, onOpen)
  }, [])

  /** Dismissing counts as seeing it. See the note at the top of the file. */
  const markSeen = React.useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      /* ignore */
    }
  }, [])

  const onOpenChange = React.useCallback(
    (next: boolean) => {
      setOpen(next)
      if (!next) markSeen()
    },
    [markSeen],
  )

  const rung = RUNGS[step]
  const isLast = step === RUNGS.length - 1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden p-0">
        <DialogHeader className="space-y-1 border-b border-border/60 p-5 pb-4 text-left">
          <DialogTitle className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Layers aria-hidden className="h-4 w-4" />
            How this catalog is organised
          </DialogTitle>
          <DialogDescription className="text-xs">
            Four rungs, smallest to largest. Each one is built from the one
            below it.
          </DialogDescription>
        </DialogHeader>

        {/* The whole ladder, always visible — the current rung is the point,
            but seeing all four at once is what makes it a model rather than
            four unrelated facts delivered in sequence. */}
        <div className="flex items-stretch gap-1 border-b border-border/60 bg-muted/20 p-3">
          {RUNGS.map((r, i) => (
            <button
              key={r.href}
              type="button"
              onClick={() => setStep(i)}
              aria-current={i === step ? 'step' : undefined}
              className={cn(
                'flex-1 rounded-lg border px-2 py-2 text-center text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                i === step
                  ? 'border-primary/40 bg-primary/10 text-foreground'
                  : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          <div
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg',
              rung.accent,
            )}
          >
            {rung.icon}
          </div>

          <h2 className="mt-4 text-xl font-bold tracking-tight">{rung.headline}</h2>
          <p className="mt-2 text-sm text-body">{rung.blurb}</p>

          <p className="mt-4 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm italic text-muted-foreground">
            {rung.example}
          </p>

          <Link
            href={rung.href}
            onClick={() => onOpenChange(false)}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-all hover:gap-2.5"
          >
            Open {rung.count.toLocaleString('en-US')} {rung.label.toLowerCase()}
            <ArrowRight aria-hidden className="h-4 w-4" />
          </Link>
        </div>

        <DialogFooter className="flex-row items-center justify-between gap-3 border-t border-border/60 bg-muted/20 p-4 sm:justify-between">
          <span className="text-xs text-muted-foreground">
            Step {step + 1} of {RUNGS.length}
          </span>

          <div className="flex items-center gap-2">
            {step > 0 ? (
              <Button variant="ghost" size="sm" onClick={() => setStep((s) => s - 1)}>
                Back
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                Skip
              </Button>
            )}
            {isLast ? (
              <Button size="sm" onClick={() => onOpenChange(false)}>
                Got it
              </Button>
            ) : (
              <Button size="sm" className="gap-1.5" onClick={() => setStep((s) => s + 1)}>
                Next
                <ArrowRight aria-hidden className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
