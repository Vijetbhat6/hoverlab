/**
 * The wall of love, and the reason it is a wall of citations.
 *
 * ── THE RULE THIS FILE EXISTS TO ENFORCE ────────────────────────────────
 *
 * `scripts/check-claims.mts` fails the build on any `<blockquote>` in site
 * chrome without a `data-endorsement-source` attribute. That rule was
 * written after six invented testimonials — attributed to named people in
 * named cities, on a page read by developers who can search a name — were
 * found on the landing page. The rule is deliberately an evidence
 * requirement rather than a ban, so that quoting a real person stays legal.
 *
 * This is the first surface built on the permissive half of that rule, and
 * it would be the easiest place on the site to break it. A page whose entire
 * purpose is to be full of praise, shipped by someone with a launch date, is
 * exactly the pressure that produced the six fake ones. So the type makes
 * the citation mandatory rather than trusting the page to remember: an
 * `Endorsement` without a public `source` URL does not compile, and the
 * component renders `data-endorsement-source` from that field rather than
 * from a hand-typed attribute a copy-paste could drop.
 *
 * ── WHY IT SHIPS EMPTY ──────────────────────────────────────────────────
 *
 * Because there is nothing true to put in it yet. An empty wall of love is
 * an embarrassing page; a full one made of invented quotes is a liability
 * and, under the Unfair Commercial Practices Directive as amended, an
 * offence. The page handles the first case gracefully and this file makes
 * the second one hard.
 *
 * ── WHAT COUNTS AS A SOURCE ─────────────────────────────────────────────
 *
 * A URL a stranger can open that shows the words being said by the person
 * they are attributed to. A public post, a published review, a recorded
 * talk, an issue comment. NOT: a private email, a DM, a support ticket, a
 * survey response, "they said it on a call". Those can be genuine and still
 * cannot be checked, and a quote the reader cannot check is worth exactly
 * what an invented one is worth — which is the entire lesson of the six.
 *
 * A private message can become publishable, and the route is the same one
 * any honest publisher uses: ask the person to post it, or ask for written
 * permission and cite that permission plainly in `sourceLabel` so the reader
 * knows what kind of evidence they are being handed. What must not happen is
 * a private quote wearing a public citation.
 *
 * ── WHAT IS DELIBERATELY ABSENT ─────────────────────────────────────────
 *
 * A count. No "join the N developers who love it", no "4.9 out of 5 from N
 * reviews". `check-claims.mts` would fail the first on sight, and the second
 * is the same claim wearing a decimal point. The wall says what it holds by
 * holding it.
 */

export interface Endorsement {
  /**
   * The words, verbatim.
   *
   * Trimmed at the ends only. Not tidied, not de-typo'd, not shortened to
   * fit the card — an edited quote under a citation is a misquote with a
   * footnote. If it is too long for the design, the design gives.
   */
  quote: string
  /** Who said it, as they are known publicly. */
  author: string
  /** Their own description of what they do, or null if they gave none. */
  role: string | null
  /**
   * Public URL showing them saying it. Required — see the header.
   *
   * This is what becomes `data-endorsement-source` in the rendered markup,
   * which is what the build gate looks for.
   */
  source: string
  /** Where that is, in prose: 'on X', 'in the GitHub discussion', 'on Reddit'. */
  sourceLabel: string
  /** ISO day we read it at `source`, so a deleted post can be spotted. */
  checkedOn: string
}

/**
 * Empty. See the header.
 *
 * The bar for the first entry: a URL that a stranger can open today and see
 * those words under that name.
 */
export const ENDORSEMENTS: Endorsement[] = []
