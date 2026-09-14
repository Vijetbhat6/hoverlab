/**
 * Labs — the experiments shelf, and the brief people build against.
 *
 * ── WHAT IT IS ──────────────────────────────────────────────────────────
 *
 * Aceternity runs a shelf of experiments and it is the cheapest distribution
 * any catalog in this category has: somebody recreates a famous effect, the
 * recreation gets published with their name and a link back to them, and the
 * post they write about it points here. The catalog gets an effect it did
 * not have to design, the builder gets a credit on a site that ranks, and
 * neither side had to negotiate anything.
 *
 * This file holds two things: the brief (what we are asking for, and what we
 * will and will not publish) and the shelf itself.
 *
 * ── THE ONE LEGAL RULE, WHICH IS ALSO THE EDITORIAL ONE ─────────────────
 *
 * "Recreate a famous effect" is a sentence with a copyright problem inside
 * it if nobody looks at it, so every entry carries `original` — what it is a
 * recreation OF, named and linked — and `technique`, the part that is
 * actually ours.
 *
 * The line we hold: a visual technique is not protected, a specific
 * implementation is, and a brand's identity is protected harder than either.
 * So a recreation is publishable when it was built from scratch against the
 * *observed behaviour* of the original, and is not publishable when it
 * carries the original's code, assets, wordmark or colours. That is not
 * pedantry — it is the difference between "here is how Stripe's gradient
 * works" and shipping Stripe's gradient with Stripe's name on it, and the
 * second one ends with a letter.
 *
 * `credit` being required does the other half. An entry we cannot attribute
 * is an entry we do not publish, because the whole exchange this shelf runs
 * on is the credit.
 *
 * ── WHY IT SHIPS EMPTY ──────────────────────────────────────────────────
 *
 * Same reason as `showcase.ts`: the shelf is other people's work, and there
 * is none yet. Seeding it with our own effects relabelled as community
 * experiments would be inventing contributors, which is the same offence as
 * inventing testimonials with a different noun. The page renders the brief,
 * which is the useful half on day one anyway — nobody submits to a shelf
 * that has not told them what it wants.
 */

export interface LabEntry {
  id: string
  /** What the experiment is called. */
  name: string
  /** One sentence on what it does. */
  blurb: string
  /**
   * What it is a recreation of, named plainly, with a link to the original.
   *
   * Required. An experiment described only as "a gooey cursor effect" hides
   * whether anything was copied; naming the source is what makes the
   * reimplementation claim checkable, and it is also the courtesy.
   */
  original: { name: string; href: string }
  /** The technique, in a sentence — the part that is the contribution. */
  technique: string
  /**
   * Who built it and where to find them. Required — the credit is the
   * entire payment.
   */
  credit: { name: string; href: string }
  /** Catalog id once it is in the library, or null while it lives only here. */
  effectId: string | null
  /** ISO day it went up. */
  addedOn: string
}

/**
 * Empty. See the header.
 *
 * Entries are added by hand after a human has read the submission against
 * the rules below. This is deliberately not a form that writes to a
 * database: a shelf whose whole value is that somebody looked at each entry
 * cannot have an unattended write path into it.
 */
export const LAB_ENTRIES: LabEntry[] = []

/**
 * The brief, rendered on /labs.
 *
 * Written as data rather than as copy in the page for the same reason
 * `compare.ts` is: these are the terms of an exchange with people outside
 * this project, and terms that live in JSX get edited casually.
 */
export const LAB_RULES: { title: string; detail: string }[] = [
  {
    title: 'Build it from behaviour, not from source',
    detail:
      'Watch the original, work out what it is doing, write it yourself. Do not lift code, assets, fonts or colours from it. A recreation is a study of a technique; a copy with the serial numbers filed off is just a copy.',
  },
  {
    title: 'Name what you recreated',
    detail:
      'Every entry says what it is a version of and links to it. That is the courtesy, and it is also what lets a reader judge whether it is a reimplementation or a lift.',
  },
  {
    title: 'No brand identity',
    detail:
      'The technique is fair game. The wordmark, the logo, the exact brand palette and the product name are not. If the demo is recognisable as a specific company rather than as a specific effect, it needs to be less recognisable.',
  },
  {
    title: 'Plain CSS or a small amount of JS',
    detail:
      'It has to survive being pasted into somebody else’s project. No build step, no framework requirement, no dependency the reader has to adopt to see it work.',
  },
  {
    title: 'It respects reduced motion',
    detail:
      'Everything in this catalog does, and an experiment is not exempt. If the effect has nothing to show under `prefers-reduced-motion: reduce`, it needs a still state that is not broken.',
  },
  {
    title: 'You get the credit and you keep the work',
    detail:
      'Your name and your link sit on the entry permanently. You keep the copyright. If it graduates into the catalog proper it ships under the same MIT terms as everything else, and the credit goes with it.',
  },
]

/** Where a submission goes. Same door as everything else. */
export const LABS_SUBMISSION_PATH = '/support'
