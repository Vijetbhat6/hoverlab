/**
 * What is shipped, what is being built, and what is not being built.
 *
 * ── WHY A PUBLIC ROADMAP IS A DIFFERENT DOCUMENT FROM A CHANGELOG ───────
 *
 * `/changelog` answers "is this still alive" and it answers it well, because
 * every date on it is derived from git and none of it can be inflated. What
 * it cannot answer is the question a buyer actually holds at the pricing
 * page: this is a one-time licence from a small team, so what happens next,
 * and what are you explicitly not going to do? A changelog is evidence about
 * the past. A roadmap is a commitment about the future, and the two rot in
 * opposite directions — the changelog cannot lie and this file can.
 *
 * ── THE THREE RULES THAT KEEP IT HONEST ─────────────────────────────────
 *
 * 1. A SHIPPED ROW MUST CARRY THE URL THAT PROVES IT. `href` is required on
 *    `status: 'shipped'` and the page renders it as a link. This is the rule
 *    that stops a roadmap from becoming a marketing document: every claim
 *    that something is done is one click from being checked, and a row that
 *    cannot produce a URL is not shipped, whatever the branch says.
 *
 *    `roadmap.test.ts` asserts it, because the failure is invisible — a
 *    shipped row with no link renders as plain text that looks finished.
 *
 * 2. NOTHING CARRIES A DATE. Not a quarter, not a month, not "soon". A
 *    one-person-shaped project that publishes dates publishes misses, and
 *    the first missed date costs more trust than the whole roadmap buys.
 *    The ordering below is the commitment: `building` is being worked on now,
 *    `next` is what gets picked up after, `considering` may never happen and
 *    says so in the status name.
 *
 * 3. THE 'NOT DOING' ROWS ARE NOT DECORATION. They are the most useful part
 *    of the page for the reader who is deciding, and the only part that
 *    costs anything to write. A roadmap with no refusals on it is a wish
 *    list. Each one carries the reason, because "no" without a reason reads
 *    as "not yet" and generates the same email every month.
 *
 * ── WHAT GOES IN 'BUILDING' ─────────────────────────────────────────────
 *
 * Work genuinely in progress, not work that has been thought about. The test
 * is whether there is something in the repository today that would be
 * embarrassing to delete. Everything else is `next` at best.
 */

export type RoadmapStatus =
  /** Done and reachable. Requires `href`. */
  | 'shipped'
  /** In the repository now, not finished. */
  | 'building'
  /** Committed to, not started. */
  | 'next'
  /** Might happen. Listed so nobody has to ask. */
  | 'considering'
  /** Decided against. Carries the reason. */
  | 'not-doing'

export interface RoadmapItem {
  id: string
  title: string
  /**
   * What it is and — for anything not shipped — what it is blocked on.
   *
   * The blocker is the interesting half. "CLI on npm" tells a reader
   * nothing; "the package is built and versioned, the name is unclaimed on
   * the registry, and publishing it is one `npm publish` and a decision
   * about who owns the token" tells them whether this is a week or a year.
   */
  detail: string
  status: RoadmapStatus
  /**
   * Proof, for a shipped row. Required there and optional elsewhere, where
   * it points at the nearest thing that exists today.
   */
  href: string | null
}

/**
 * Ordered by status and then by how much a buyer would care, not by how
 * interesting it is to build.
 *
 * The shipped block is deliberately long. It is the answer to "a one-time
 * licence from a small team sounds like it will stop" — the fact that the
 * list of finished things is the longest block on the page is itself the
 * argument, and it is the only argument on this page made of links rather
 * than of intentions.
 */
export const ROADMAP: RoadmapItem[] = [
  // ── Shipped ───────────────────────────────────────────────────────────
  {
    id: 'five-tiers',
    title: 'Five tiers, one ladder',
    detail:
      'A single CSS hover state, a React control, a page section, a whole route, a scaffoldable project. Every rung installs the same way and composes with the one below it.',
    status: 'shipped',
    href: '/browse',
  },
  {
    id: 'registry',
    title: 'shadcn registry',
    detail:
      'The whole catalog under the @hoverlab namespace, installable with the shadcn CLI. Supports dynamic search on the registry index itself.',
    status: 'shipped',
    href: '/docs/registry',
  },
  {
    id: 'mcp',
    title: 'MCP server for editor agents',
    detail:
      'Search and install as agent tools, plus packaged skill files that teach an agent this catalog’s conventions. Free, with no key.',
    status: 'shipped',
    href: '/mcp',
  },
  {
    id: 'api',
    title: 'Public HTTP API',
    detail:
      'Unauthenticated, CORS-open, no key. Search and resolve any artifact on any rung, and read the design tokens behind it.',
    status: 'shipped',
    href: '/docs/api',
  },
  {
    id: 'themes',
    title: 'Live theming across every preview',
    detail:
      'Accent, neutrals, typeface and corner radius, applied to the whole catalog at once and exported as nine lines of CSS or a shadcn theme.',
    status: 'shipped',
    href: '/themes',
  },
  {
    id: 'builder',
    title: 'Page builder',
    detail:
      'Compose a page from blocks and export it. Entirely URL-driven, so a composition is a link you can send someone.',
    status: 'shipped',
    href: '/builder',
  },
  {
    id: 'frameworks',
    title: 'Framework export beyond React',
    detail:
      'Emit artifacts as plain HTML, Vue, Svelte and Astro rather than assuming everyone is on React.',
    status: 'shipped',
    href: '/frameworks',
  },
  {
    id: 'assets',
    title: 'Free generated assets',
    detail:
      'Animated icons, seeded avatars, invented company logos and isometric illustrations. No account, no attribution, outside the licence entirely.',
    status: 'shipped',
    href: '/assets',
  },
  {
    id: 'a11y-evidence',
    title: 'Per-artifact accessibility evidence',
    detail:
      'Machine-checked WCAG 2.2 results for every artifact, published including what fails. Regenerated on every build, so it cannot drift from the catalog.',
    status: 'shipped',
    href: '/accessibility',
  },
  {
    id: 'rtl',
    title: 'Right-to-left support, enforced at build',
    detail:
      'Logical properties throughout, an icon ledger that fails the build when a directional icon is not mirrored, and an RTL preview on every artifact.',
    status: 'shipped',
    href: '/docs',
  },
  {
    id: 'support-targets',
    title: 'Published response targets',
    detail:
      'What you get when something breaks, by plan, stated as business-day targets from a small team rather than dressed up as an SLA.',
    status: 'shipped',
    href: '/support',
  },
  {
    id: 'regional-pricing',
    title: 'Purchasing-power pricing',
    detail:
      'Four bands plus a rupee price for India that is charged in rupees rather than converted. The discount is decided server-side from the request, so it cannot be claimed by anyone it is not for.',
    status: 'shipped',
    href: '/pricing',
  },

  // ── Building ──────────────────────────────────────────────────────────
  {
    id: 'cli-npm',
    title: 'The CLI on npm',
    detail:
      'The package is written, versioned and documented, and the name is still unclaimed on the public registry — so every `npx hoverlab` line in the docs currently describes something you cannot yet install. This is the single most consequential unfinished thing on the list, and it is blocked on publishing rather than on building.',
    status: 'building',
    href: '/docs/cli',
  },
  {
    id: 'editor-extension',
    title: 'The editor extension, published',
    detail:
      'A VS Code, Cursor and Windsurf sidebar over all five tiers exists in the repository and contributes the MCP server so agent mode needs no config file. It cannot be packaged for the marketplace until the CLI above is on npm, because every write it performs is delegated to that binary.',
    status: 'building',
    href: '/docs/editor',
  },
  {
    id: 'figma-components',
    title: 'A real Figma design system',
    detail:
      'Today we publish frames — flat, pixel-accurate, and not a component library. Preline and Flowbite both give theirs away, and `/compare` records it as the row we lose outright. Turning frames into components with variants and tokens is the work, and it is genuine design work rather than a generator.',
    status: 'building',
    href: '/figma',
  },

  // ── Next ──────────────────────────────────────────────────────────────
  {
    id: 'showcase',
    title: 'A showcase with something in it',
    detail:
      'The page is built and deliberately empty. It fills up one verified entry at a time, and it will not be seeded with our own deployments wearing customers’ names.',
    status: 'next',
    href: '/showcase',
  },
  {
    id: 'digest',
    title: 'The new-work email, actually sending',
    detail:
      'Addresses are collected, the sequences are written and reviewed in the repository, and the digest is composed from the same git-derived ledger the changelog and the feed use. What is missing is a sending key, which is a dashboard decision rather than a build.',
    status: 'next',
    href: '/changelog',
  },
  {
    id: 'community-room',
    title: 'Somewhere for buyers to talk to each other',
    detail:
      'Aceternity sells a private room as a feature of its licence, and `/compare` concedes the point: published response targets are not a substitute for people who already solved your problem. Opening one is easy; keeping one alive is not, which is why it is here and not above.',
    status: 'next',
    href: '/support',
  },

  // ── Considering ───────────────────────────────────────────────────────
  {
    id: 'cms-ports',
    title: 'CMS ports of the page tier',
    detail:
      'Shadcnblocks sells these at $379 each, which says the demand is real. Whether it is real for a catalog whose pages are already plain React files that a developer can paste anywhere is the open question.',
    status: 'considering',
    href: '/pages',
  },
  {
    id: 'design-reviewer',
    title: 'A design reviewer for pull requests',
    detail:
      '21st.dev ships one. We already run our own design rules against our own code in the CLI, so pointing them at somebody else’s diff is a smaller step for us than for most — but a reviewer that is wrong is worse than no reviewer, and that bar is high.',
    status: 'considering',
    href: '/docs/cli',
  },

  // ── Not doing ─────────────────────────────────────────────────────────
  {
    id: 'marketplace',
    title: 'A marketplace to sell your own components through',
    detail:
      'Asked for often, and the answer is no. A marketplace is a moderation, payouts and tax problem that happens to have components in it, and doing it badly would damage the catalog that pays for everything. `/for-authors` says the same thing in the first email rather than after three.',
    status: 'not-doing',
    href: '/for-authors',
  },
  {
    id: 'content-editing',
    title: 'Editing section copy inside the builder',
    detail:
      'React Bits’ builder does this and ours will not. The moment a builder owns your content it owns your project, and the whole proposition here is that what you install is plain source you keep. Export it and edit it in your editor, where your version control is.',
    status: 'not-doing',
    href: '/builder',
  },
  {
    id: 'subscription',
    title: 'Turning the licence into a subscription',
    detail:
      'Recurring revenue would buy a bigger roadmap — 21st.dev’s entry in `/compare` says exactly that, and it is true. It would also mean the thing you bought stops working when you stop paying, which is the opposite of what a one-time licence on MIT source is for.',
    status: 'not-doing',
    href: '/licence',
  },
]

/** Rows in one status, in declaration order. */
export function roadmapBy(status: RoadmapStatus): RoadmapItem[] {
  return ROADMAP.filter((item) => item.status === status)
}

/**
 * Display metadata per status.
 *
 * `blurb` is the sentence under the heading on the page, and it is where the
 * honesty about dates lives: a reader who skims only the headings should
 * still not come away believing anything here is scheduled.
 */
export const STATUS_META: Record<
  RoadmapStatus,
  { label: string; blurb: string }
> = {
  shipped: {
    label: 'Shipped',
    blurb: 'Done and reachable. Every row links to the thing itself.',
  },
  building: {
    label: 'Building',
    blurb:
      'In the repository now, unfinished. No dates — a small team that publishes dates publishes misses.',
  },
  next: {
    label: 'Next',
    blurb: 'Committed to, not started. These get picked up as the row above empties.',
  },
  considering: {
    label: 'Considering',
    blurb: 'Might happen, might not. Listed so nobody has to write in and ask.',
  },
  'not-doing': {
    label: 'Not doing',
    blurb:
      'Decided against, with the reason. The most useful part of this page if you are deciding whether to buy.',
  },
}

/** Order the page renders the sections in. */
export const STATUS_ORDER: RoadmapStatus[] = [
  'building',
  'next',
  'considering',
  'shipped',
  'not-doing',
]
