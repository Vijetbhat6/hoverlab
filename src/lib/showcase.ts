/**
 * Things other people built with this catalog, and the logos of people who
 * use it.
 *
 * ── WHY BOTH LISTS ARE EMPTY, AND WHY THAT IS THE FEATURE ───────────────
 *
 * A showcase and a used-by row are the two most-faked surfaces on a
 * developer-tools site, and this repo has already been burned by the
 * category: `scripts/check-claims.mts` exists because the landing page once
 * carried six testimonials from people who did not exist and a "Join 1,200+
 * developers" that nothing counted. `components/landing/community-band.tsx`
 * exists in its current shape because the same page carried "4.2k stars"
 * that came from a keyboard.
 *
 * So these ship empty. Both pages render an honest empty state, the band on
 * the landing page renders nothing at all, and the first entry in either
 * list is added the day there is a real one — not the day before. A showcase
 * seeded with our own demo deployments dressed up as customers would be the
 * same lie as the testimonials, with an extra step.
 *
 * That is not a placeholder waiting to be quietly filled. The types below
 * make the honest version the easy one and the dishonest version something
 * you have to defeat the compiler to write.
 *
 * ── WHAT THE TYPES REQUIRE, AND WHY EACH FIELD IS NOT OPTIONAL ──────────
 *
 *   href        A live, public URL. The entire evidentiary value of a
 *               showcase is that the reader can click it. An entry nobody
 *               can verify is a sentence with a logo next to it.
 *
 *   permission  How we came to be allowed to publish this. Required, and a
 *               free-text sentence rather than a boolean, because "they
 *               tweeted about us" and "they signed a logo-use agreement" are
 *               both true answers with very different consequences, and a
 *               `true` records neither. Publishing a company's name and mark
 *               as a customer reference without permission is a trademark
 *               problem in most jurisdictions and a relationship problem in
 *               all of them.
 *
 *   addedOn     When we put it up. A showcase with no dates cannot be
 *               audited for rot, and these rot faster than anything else on
 *               the site: sites get redesigned off the catalog, companies
 *               get acquired, and a "built with Hoverlab" claim about a page
 *               that no longer uses any of it is a false statement we made.
 *               Same discipline as the per-row `checkedOn` in `compare.ts`.
 *
 *   uses        Which rungs they actually took. Specific, because "uses
 *               Hoverlab" is not a claim anybody can check and "uses the
 *               template and eleven blocks" is.
 *
 * ── WHAT IS DELIBERATELY ABSENT ─────────────────────────────────────────
 *
 * Metrics about the site being showcased — traffic, revenue, conversion
 * lift. We would be repeating a number we did not measure, about a business
 * we do not run, in support of our own product. Every other field here is
 * something a reader can verify by clicking; that one would not be.
 */

/** Which rung of the ladder an entry actually took from the catalog. */
export type UsedRung = 'effects' | 'primitives' | 'blocks' | 'pages' | 'templates' | 'tools'

export interface ShowcaseSite {
  /** The product or site's own name, spelled the way they spell it. */
  name: string
  /** Live, public URL. Not a screenshot, not a case study — the thing itself. */
  href: string
  /** One sentence on what it is, in plain language. */
  blurb: string
  /** Which rungs they took. At least one, or there is nothing to show. */
  uses: UsedRung[]
  /**
   * How we are allowed to publish this. See the header — a sentence, not a
   * boolean, and it is read by a human before anything goes live.
   */
  permission: string
  /** ISO day this went up, for auditing rot. */
  addedOn: string
  /**
   * Path under /public to a screenshot, or null for a text-only card.
   *
   * Optional because a showcase that cannot go live until somebody has taken
   * and optimised a screenshot is a showcase that does not go live. The card
   * reads perfectly well as a name, a sentence and a link.
   */
  shot: string | null
}

export interface UsedByLogo {
  name: string
  /** The company's own site. A logo that is not a link is not evidence. */
  href: string
  /**
   * Path under /public to their mark, or null to render their name as a
   * wordmark instead.
   *
   * Null is the expected case rather than the fallback. Hotlinking a
   * company's logo from their CDN breaks the day they redeploy and is a
   * request they did not agree to serve; committing one means holding a copy
   * of somebody else's trademark in this repo, which needs the permission
   * below to say so explicitly.
   */
  logo: string | null
  /** See `ShowcaseSite.permission`. Same rule, higher stakes — this is a mark. */
  permission: string
  addedOn: string
}

/**
 * Sites built with the catalog.
 *
 * Empty. See the header. To add one: get it in writing, put the sentence in
 * `permission`, and check the URL resolves to the thing you say it is.
 */
export const SHOWCASE: ShowcaseSite[] = []

/**
 * Companies whose logo we have permission to show.
 *
 * Empty, and emptier than `SHOWCASE` on purpose: a showcase entry is a claim
 * that somebody built something, which a link proves. A logo row is a claim
 * that a named company endorses us by association, which a link does not
 * prove and which the company has to have agreed to.
 */
export const USED_BY: UsedByLogo[] = []

/** Where a would-be entry goes. One address, used by both empty states. */
export const SUBMISSION_PATH = '/support'

/** Human label for a rung, for the chips on a showcase card. */
export const RUNG_LABEL: Record<UsedRung, string> = {
  effects: 'Effects',
  primitives: 'Primitives',
  blocks: 'Blocks',
  pages: 'Pages',
  templates: 'Templates',
  tools: 'Tools',
}
