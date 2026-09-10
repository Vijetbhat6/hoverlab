/**
 * What the other paid component catalogs cost, ship, and put behind a wall.
 *
 * WHY THIS IS A DATA FILE AND NOT COPY IN A PAGE
 *
 * Every figure here is a claim about somebody else's business, published
 * under our name. Three properties keep that safe, and all three need the
 * data separated from the layout that renders it:
 *
 *   Sourced.   Every competitor carries the URL the numbers were read off.
 *              A claim with no source is a rumour with a table around it.
 *   Dated.     Every competitor carries its OWN `checkedOn`, and the page
 *              stamps both the newest and the oldest. List prices move, and
 *              a comparison with no date is asserting it is true today
 *              forever, which it will stop being within a quarter.
 *   Symmetric. Every competitor has a `beatsUs`, and it is required by the
 *              type rather than optional. A comparison page where the
 *              author wins every row is an advertisement, and readers of
 *              this particular kind of page know that better than most —
 *              they are here precisely because they do not trust the
 *              pricing page.
 *
 * WHY THE DATE IS PER-ROW AND NOT ONE CONSTANT.
 *
 * It used to be a single `CHECKED_ON`, and that constant quietly forced a
 * lie every time it was touched. A sweep almost never lands all nine rows:
 * vendors put pricing behind a login (Tailwind Plus), move a page (Flowbite),
 * or simply fail to answer. With one date there are two options and both are
 * wrong — move it, and seven verified rows drag two unverified ones along
 * under a stamp that says they were read today; leave it, and seven fresh
 * rows are published under a date that makes them look months stale. The
 * second is what happened, and it is why this file went eighteen days out of
 * date in the competitors' favour while every number in it was fixable.
 *
 * A per-row date removes the choice. You re-read what answers, you stamp
 * what you re-read, and the rows you could not reach keep the older date
 * where a reader can see it and go check the one you could not.
 * OUR OWN NUMBERS ARE NOT IN THIS FILE.
 *
 * They are computed by the page from the catalog itself — TOTAL_COUNT,
 * BLOCK_COUNT, PAGE_COUNT, TEMPLATE_COUNT, DESIGNER_TOOLS, PLANS.pro. A
 * hand-written "149 blocks" here would be wrong by the next block wave, and
 * of all the numbers on the page ours are the ones we have no excuse for
 * getting wrong.
 *
 * That includes ratios, which is the loophole this rule leaked through
 * twice. Two `beatsUs` entries said "eleven times our block count" and
 * "five times our block count and three times our templates" — our number
 * smuggled in as a multiplier, and both were wrong by the next wave
 * exactly as the paragraph above predicts. A competitor's absolute figure
 * goes stale only when the competitor changes, which is the correct
 * failure mode for a field describing them.
 *
 * WHAT IS DELIBERATELY ABSENT
 *
 * Revenue, customer counts and quality judgements. Almost no revenue in
 * this category is public, and a page that guesses at a competitor's
 * takings has invented the most interesting number on it. Sneering is
 * absent for the same reason plus one more: several of these are one to
 * five people, and Setproduct being Roman Kamushken and four employees is a
 * fact about the field, not a weakness to lean on.
 *
 * Uiverse is absent too, and it is our nearest neighbour. Its Pro pricing
 * is reported at $4.99 and $19.99 a month and the site returns 403 to every
 * fetch, so the number could not be re-verified. Listing a competitor's
 * price from memory on a page whose entire argument is that we checked
 * would be the one mistake that discredits all the rest of it.
 */

/**
 * The day the most recent sweep ran.
 *
 * This is a claim about US — when we last went looking — not about any
 * particular row. What each row is worth is on the row.
 */
export const LAST_SWEEP = '2026-09-10'

/** How that date reads in prose. Fixed locale — this is rendered at build. */
export const LAST_SWEEP_LABEL = '10 September 2026'

/** Month names, spelled out so a build machine's locale cannot move them. */
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

/** `2026-09-10` -> `10 September 2026`. Parsed by hand for the same reason. */
export function dateLabel(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${Number(d)} ${MONTHS[Number(m) - 1]} ${y}`
}

/** What a catalog withholds until you pay. The row that actually differs. */
export type Gate =
  /** The catalog itself. You cannot see it without an account or a payment. */
  | 'catalog'
  /** You can look; the source is what you are buying. */
  | 'source'
  /** Everything is readable and copyable; the licence to ship is the sale. */
  | 'licence'
  /** Agent or API access is metered or paid. */
  | 'agent'

export interface Competitor {
  name: string
  /** Vendor page the figures were read from. */
  href: string
  /**
   * ISO day this row was last read off `href`. Required. See the docblock
   * at the top of the file for why this is not one constant for the table.
   */
  checkedOn: string
  /**
   * Cheapest price that buys the paid product, for one individual, in USD.
   *
   * Deliberately NOT "what it costs to start", because six of these now
   * give something away and sorting a table by zero would put six vendors
   * in a tie at the top and tell the reader nothing. What they give away
   * is `freeTier`, which is a sentence because the interesting part of a
   * free tier has never been its price.
   *
   * `null` where there is no paid individual licence at all.
   */
  entryUsd: number | null
  /** How the entry price is charged. */
  entryTerm: 'one-time' | 'per year' | 'per month' | 'free'
  /**
   * What the vendor gives away, in their words, or `null` for none.
   *
   * THE ROW THIS TABLE WAS MISSING, and the one the market moved on while
   * we were not looking. When this file was first written a free tier meant
   * a handful of teaser components, so "entry price" carried the whole
   * argument and this field would have been nine near-empty cells.
   *
   * It does not mean that any more. Preline now gives away 640 components,
   * 189 blocks, five templates and its entire Figma design system for
   * nothing, which is a better free offer than most of this table's paid
   * one. That is the single most consequential fact in this sweep, and
   * under the old shape it had nowhere to go — it would have been a price
   * that did not change ($249) beside a `ships` string that describes the
   * paid tier, and a reader would have learned none of it.
   *
   * It is also the row where our own answer is strongest, which is exactly
   * why it needs to be sourced and symmetric rather than asserted.
   */
  freeTier: string | null
  /** Where the ladder ends, in the vendor's own words. */
  ladder: string
  /** Volume, phrased the way the vendor phrases it. */
  ships: string
  /** Design files, which is the row we lose outright. */
  figma: boolean
  /** Agent access — the row the first edition of our own study got wrong. */
  agent: string
  gate: Gate
  /**
   * The honest one. Required, not optional.
   *
   * If a competitor genuinely beat us at nothing they would not be on this
   * page, because a reader would not be comparing us to them.
   */
  beatsUs: string
}

/**
 * Ordered by entry price, cheapest first, with the one subscription last.
 *
 * Cheapest-first because the reader's question is "why does this cost less
 * than everything else" and the answer is easier to believe next to the
 * closest comparable than next to the most expensive one. React Bits opens
 * the table for that reason: it is the closest business-model twin we have
 * — one-time, lifetime, unlimited projects, no seat fees, agent-friendly by
 * design — and it opens at $129.
 *
 * That $129 was $99 at the last sweep, and every one-time vendor here has
 * either raised prices this year or held. Not one cut. Worth knowing before
 * reading our own number as the cheap one by accident rather than on purpose.
 *
 * 21st.dev sits at the end despite the smallest number on its card. $6 a
 * month is not comparable to a one-time licence and putting it first would
 * make the table lie by sorting.
 */
export const COMPETITORS: Competitor[] = [
  {
    name: 'React Bits',
    href: 'https://pro.reactbits.dev',
    checkedOn: '2026-09-10',
    entryUsd: 129,
    entryTerm: 'one-time',
    ladder: '$129 / $249 / $349, lifetime, unlimited projects, no seat fees',
    ships:
      '150 animated components, 280 page blocks in 22 categories, 300 app UI blocks in 38 categories, 15 templates — 765 assets in total',
    freeTier: '165+ components in the open-source library, MIT + Commons Clause',
    figma: false,
    agent: 'Ships a SKILL.md, plus a 20-item Agent Kit of skills, prompts and recipes at Pro',
    gate: 'source',
    beatsUs:
      'Our closest business-model twin, and in one sweep it went from 238 blocks to 580 across 60 categories, added an Agent Kit, and shipped a Landing Builder that composes its blocks into a page. It also has the audience we do not — 1.1M visits, 57% direct, meaning people type the name. That last one is the durable advantage; almost nobody types ours.',
  },
  {
    name: 'Flowbite',
    href: 'https://flowbite.com',
    /*
     * NOT re-read on the 10 September sweep: flowbite.com/pro and
     * flowbite.com/pricing both failed to return a readable page. Left at
     * its last confirmed date rather than carried along by the rows that
     * did answer — which is the entire reason this field is per-row.
     */
    checkedOn: '2026-08-23',
    entryUsd: 149,
    entryTerm: 'one-time',
    ladder: 'Free open-source core, Pro from $149',
    ships: '330+ blocks, 185 ported to React in beta',
    freeTier: 'The open-source core, plus a free edition of the Figma design system',
    figma: true,
    agent: 'No dedicated server; the open core is installable anywhere',
    gate: 'source',
    beatsUs:
      'Ships the Figma design system alongside the code, so a designer and a developer are working from one thing. We ship a token file and no design files at all.',
  },
  {
    name: 'Shadcnblocks',
    href: 'https://shadcnblocks.com',
    checkedOn: '2026-09-10',
    entryUsd: 149,
    entryTerm: 'one-time',
    ladder:
      '$149 Pro / $299 Premium adds the Figma kit / $399 Elite adds the page builder, plus CMS ports at $379 each',
    ships:
      '2,104+ components, 1,858+ blocks, 20 templates, 49+ pre-built pages, a 484-block Figma kit, a page builder and a VSCode extension',
    freeTier: 'Basic-tier blocks, browsable and copyable behind a login',
    figma: true,
    agent: 'Searchable through the official shadcn MCP server',
    gate: 'source',
    beatsUs:
      '1,858 blocks and 2,104 components, plus a Figma kit, a page builder and a VSCode extension. On volume this is still the deepest catalog a solo developer can buy, and it grew by 180 blocks in the eighteen days between our last two sweeps.',
  },
  {
    name: 'Magic UI Pro',
    href: 'https://pro.magicui.design',
    checkedOn: '2026-09-10',
    entryUsd: 199,
    entryTerm: 'one-time',
    ladder: '$199 lifetime, one-time, perpetual licence',
    ships: '50+ sections, 9+ templates',
    freeTier: '150+ free and open-source animated components and effects',
    figma: false,
    agent: 'Free MIT MCP server — no API key, no account',
    gate: 'source',
    beatsUs:
      'Proves this market pays for curation over volume: $199 for fifty sections. And its MCP server is free, MIT and on the same rail as ours — free agent access is table stakes here, not an edge.',
  },
  {
    name: 'Aceternity UI',
    href: 'https://ui.aceternity.com',
    checkedOn: '2026-09-10',
    entryUsd: 199,
    entryTerm: 'one-time',
    ladder: '$169/yr, $199 lifetime, $1,590 for 10 seats — all currently discounted',
    ships: '200+ premium blocks, 12+ templates',
    freeTier: 'Free copy-paste components for React and Next.js; no count published',
    figma: false,
    agent: 'Sells "AI-ready prompts" for v0 and Lovable',
    gate: 'source',
    beatsUs:
      'Sells community as a feature — a private Discord where other buyers answer each other. We publish response targets at /support and beat the 48 hours, but a room full of people who already solved your problem is not something a target replaces.',
  },
  {
    name: 'Preline',
    href: 'https://preline.co/pricing.html',
    checkedOn: '2026-09-10',
    entryUsd: 249,
    entryTerm: 'one-time',
    ladder: 'Free tier, $249 solo, $459 for 15 developers, custom for enterprise',
    ships:
      '780+ blocks, 21 premium templates across 207 pages, 100 animated icons, 37 AI-built demos',
    freeTier:
      'All 640+ components, 189 blocks, 5 premium templates and the full Figma design system — no account required',
    figma: true,
    agent: 'MCP free until 1 January 2027, then a subscription',
    gate: 'source',
    beatsUs:
      'The free tier is the story. 640 components, 189 blocks, five templates and the entire Figma design system, for nothing and without an account — a better free offer than several of the paid tiers in this table, and the closest thing here to what we do. Their paid tier still holds the volume gap at 780 blocks and 207 pages.',
  },
  {
    name: 'Tailwind Plus',
    href: 'https://tailwindcss.com/plus',
    /*
     * NOT re-read on the 10 September sweep: the page serves a login form to
     * anything that is not a signed-in browser, so there was nothing to read
     * off it. Third-party trackers still report $299/$979, but a page whose
     * argument is that we read the vendor's own page does not get to launder
     * somebody else's summary into a fresh date.
     */
    checkedOn: '2026-08-23',
    entryUsd: 299,
    entryTerm: 'one-time',
    ladder: '$299 personal, $979 for a team of 25',
    ships: '500+ blocks in React, Vue and HTML, 13 templates, Catalyst UI kit',
    freeTier: 'None for Plus; Tailwind CSS itself is separate and free',
    figma: false,
    agent: 'None',
    gate: 'source',
    beatsUs:
      'Made by the people who make Tailwind, and prices for India openly at ₹8,500 — the only major vendor in this table that does purchasing-power pricing at all.',
  },
  {
    name: 'Untitled UI',
    href: 'https://www.untitledui.com/pricing',
    checkedOn: '2026-09-10',
    entryUsd: 349,
    entryTerm: 'one-time',
    ladder:
      'React $349 solo / $999 studio / $2,499 business / $8,999 enterprise — private repo, Storybook, SSO/SCIM',
    ships: '5k+ React components and sections, plus a separate Figma ladder from $129',
    freeTier:
      '100+ open-source React components, and 2k+ components free in Figma',
    figma: true,
    agent: 'None',
    gate: 'source',
    beatsUs:
      'The deepest seat ladder in the field. Real money in this category is at $999 to $8,999 a licence, and our ladder stops at $12 a seat a month.',
  },
  {
    name: '21st.dev',
    href: 'https://21st.dev/pricing',
    checkedOn: '2026-09-10',
    entryUsd: 6,
    entryTerm: 'per month',
    ladder:
      '$6/mo Builder, $15/mo Builder+AI, $7.50 per seat for teams — all billed yearly',
    ships: '12,000+ crafted React components, templates and shadcn themes, MCP and CLI',
    freeTier: 'No free plan; 5 Design Bug Bot reviews in the first 7 days',
    figma: false,
    agent: 'MCP access is a paid feature — one of only two vendors charging',
    gate: 'agent',
    beatsUs:
      'Twelve thousand components and a subscription funding the whole thing. Recurring revenue buys a roadmap that one-time licences do not.',
  },
]

/**
 * The oldest row on the table, derived rather than written down.
 *
 * This is the number that keeps the page honest: it is the strongest thing
 * we can say about EVERY figure at once — "nothing here is older than
 * this". Derived from the rows so that it cannot be optimistic, and so that
 * re-reading a stale vendor moves it without anybody remembering to.
 */
export const OLDEST_CHECK = COMPETITORS.reduce(
  (oldest, c) => (c.checkedOn < oldest ? c.checkedOn : oldest),
  LAST_SWEEP,
)

export const OLDEST_CHECK_LABEL = dateLabel(OLDEST_CHECK)

/** Rows the most recent sweep actually reached. Rendered as a count. */
export const FRESH_COUNT = COMPETITORS.filter((c) => c.checkedOn === LAST_SWEEP).length

/**
 * What we put behind the wall, phrased for the same table.
 *
 * Kept next to the competitors rather than inlined in the page because the
 * claim only means anything in their company: "we gate the licence" is
 * marketing on its own and an actual distinction in a column beside eight
 * vendors who gate the source.
 */
export const OUR_GATE: Gate = 'licence'

export const GATE_LABELS: Record<Gate, string> = {
  catalog: 'The catalog — you cannot browse it without paying',
  source: 'The source — you can look, you buy the code',
  licence: 'The licence — everything is readable and copyable, you buy the right to ship',
  agent: 'Agent access — the components are cheap, the MCP server is the subscription',
}

/**
 * Things a reader would find out anyway, said first.
 *
 * This is the section that makes the rest of the page believable, so it is
 * exported as data and rendered at full size rather than being a footnote
 * somebody has to go looking for. Each entry is a place a competitor is
 * simply better, with the number that proves it.
 *
 * Sourced from the same sweep as the table above. When one of these stops
 * being true — the block gap is closing — it comes off this list in the
 * same commit that makes it false, not a quarter later.
 */
/**
 * The one row this table cannot hold, because no vendor publishes a figure
 * for it: whether you can find out what changed after you copied something.
 *
 * WHY IT IS SEPARATE AND NOT A COLUMN. Every other field on `Competitor`
 * is a number or a sentence read off a vendor's own page on `CHECKED_ON`.
 * There is nothing to read for this one — an absence is not published
 * anywhere, and a column asserting eight vendors cannot do something we
 * never tested them for would be exactly the unsourced claim the docblock
 * at the top of this file exists to forbid. So this is a statement about
 * what WE do, with the comparison left where a reader can make it.
 *
 * WHY IT IS WORTH SAYING AT ALL. Copying a component is the easy half; the
 * hard half is a year later, when the accessibility bug in it has been
 * fixed upstream and your copy has not. Everyone in this market sells the
 * copy. This is the only catalog here that also ships the answer to "has
 * this moved since I took it", and until now that was true and unsaid —
 * built, tested, shipped in the CLI, and mentioned on no page a buyer
 * reads.
 */
export const UPDATE_LEDGER = {
  claim: 'You can find out what changed after you copied it',
  /** The mechanism, in the order a buyer would meet it. */
  how: [
    {
      step: 'Every artifact carries a revision',
      detail:
        'A content fingerprint per effect, block, page and template, derived from the source rather than from a version somebody remembers to bump.',
    },
    {
      step: 'It is a public endpoint, with no key',
      detail:
        '/api/v1/revisions returns the whole ledger. Your lockfile never has to tell us which forty things you installed.',
    },
    {
      step: 'The CLI reads your copy against it',
      detail:
        '`npx hoverlab outdated` lists what has moved since you installed it, with the date it changed; `hoverlab diff <id>` shows the lines.',
    },
    {
      step: 'Applying it is your call, always',
      detail:
        'Nothing reaches into your repo and nothing phones home. The file is yours — this only tells you it is not the newest one.',
    },
  ],
  /** The honest limit of the claim, said in the same breath as the claim. */
  caveat:
    'We have not audited every vendor above for this, so the table has no column for it. What we can say is what we do.',
} as const

export const WHERE_THEY_WIN: { claim: string; detail: string }[] = [
  {
    claim: 'Block depth',
    detail:
      'Preline ships 780 blocks and Shadcnblocks 1,858. We are a fraction of both, and blocks are what buyers actually compare.',
  },
  {
    claim: 'Design files',
    detail:
      'Untitled UI, Flowbite, Shadcnblocks and Preline all ship Figma — and Preline and Flowbite now give theirs away free. We ship every section as importable Figma frames, plus Dev Mode pairing, which is a better workflow once you are working. What we do not ship is a component library: no variants, no auto-layout, nothing to swap an instance of. Untitled UI sells 10k components with variants and we have frames, so this row still goes to them.',
  },
  {
    claim: 'Composition',
    detail:
      'We now have a builder, so this is no longer the whole gap it was — but theirs do more. React Bits’ Landing Builder and Shadcnblocks’ page builder let you edit inside the composition; ours chooses sections and orders them, and everything past that happens in your editor on the source it hands you. That is a deliberate limit, not a roadmap item, and it is still less than they offer.',
  },
  {
    claim: 'Free tiers',
    detail:
      'Preline gives away 640 components, 189 blocks, five templates and its whole Figma system without an account. Our free offer is still broader — everything readable, plus the API and MCP — but "free" stopped being ours alone.',
  },
  {
    claim: 'Team pricing',
    detail:
      'Untitled UI reaches $8,999 with a private repo, Storybook and SSO. Our ladder stops well short of that, and so does what it buys you.',
  },
  {
    claim: 'Support',
    detail:
      'Aceternity sells a private Discord — a room full of other customers, which is a thing a response target cannot be. We publish business-hours targets and answer email, and there is nowhere for buyers to talk to each other.',
  },
  {
    claim: 'An audience',
    detail:
      'React Bits and Uiverse run on 56–57% direct traffic — people who type the name. Almost nobody types ours.',
  },
]
