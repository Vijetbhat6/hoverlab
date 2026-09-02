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
 *   Dated.     `CHECKED_ON` is stamped on the page. List prices move, and a
 *              comparison with no date is asserting it is true today
 *              forever, which it will stop being within a quarter.
 *   Symmetric. Every competitor has a `beatsUs`, and it is required by the
 *              type rather than optional. A comparison page where the
 *              author wins every row is an advertisement, and readers of
 *              this particular kind of page know that better than most —
 *              they are here precisely because they do not trust the
 *              pricing page.
 *
 * OUR OWN NUMBERS ARE NOT IN THIS FILE.
 *
 * They are computed by the page from the catalog itself — TOTAL_COUNT,
 * BLOCK_COUNT, PAGE_COUNT, TEMPLATE_COUNT, DESIGNER_TOOLS, PLANS.pro. A
 * hand-written "149 blocks" here would be wrong by the next block wave, and
 * of all the numbers on the page ours are the ones we have no excuse for
 * getting wrong.
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

/** The day every figure below was read off a vendor's own page. */
export const CHECKED_ON = '2026-08-23'

/** How that date reads in prose. Fixed locale — this is rendered at build. */
export const CHECKED_ON_LABEL = '23 August 2026'

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
   * Entry price for one individual, in USD, as the vendor lists it.
   *
   * `null` where the entry point is free rather than cheap — the difference
   * between "costs least" and "costs nothing" is the whole argument on a
   * page like this and a 0 would flatten it.
   */
  entryUsd: number | null
  /** How the entry price is charged. */
  entryTerm: 'one-time' | 'per year' | 'per month' | 'free'
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
 * design — and it opens at $99.
 *
 * 21st.dev sits at the end despite the smallest number on its card. $6 a
 * month is not comparable to a one-time licence and putting it first would
 * make the table lie by sorting.
 */
export const COMPETITORS: Competitor[] = [
  {
    name: 'React Bits',
    href: 'https://pro.reactbits.dev',
    entryUsd: 99,
    entryTerm: 'one-time',
    ladder: '$99 / $199 / $299, lifetime, unlimited projects, no seat fees',
    ships: '101+ animated components, 238 UI blocks at Pro, templates at Ultimate',
    figma: false,
    agent: 'Ships a SKILL.md; calls itself agent-friendly by design',
    gate: 'source',
    beatsUs:
      'The closest thing to us in this table, and it has an audience we do not — 1.1M visits and 57% of them direct, meaning people type the name.',
  },
  {
    name: 'Flowbite',
    href: 'https://flowbite.com',
    entryUsd: 149,
    entryTerm: 'one-time',
    ladder: 'Free open-source core, Pro from $149',
    ships: '330+ blocks, 185 ported to React in beta',
    figma: true,
    agent: 'No dedicated server; the open core is installable anywhere',
    gate: 'source',
    beatsUs:
      'Ships the Figma design system alongside the code, so a designer and a developer are working from one thing. We ship a token file and no design files at all.',
  },
  {
    name: 'Shadcnblocks',
    href: 'https://shadcnblocks.com',
    entryUsd: 149,
    entryTerm: 'one-time',
    ladder: '$149 / $299 / $399, plus CMS ports at $379 each',
    ships: '2,093 components, 1,678 blocks, 19 templates, Figma kit, page builder',
    figma: true,
    agent: 'Searchable through the official shadcn MCP server',
    gate: 'source',
    beatsUs:
      'Eleven times our block count, a Figma kit, a page builder and a VSCode extension. On volume this is the deepest catalog a solo developer can buy.',
  },
  {
    name: 'Magic UI Pro',
    href: 'https://pro.magicui.design',
    entryUsd: 199,
    entryTerm: 'one-time',
    ladder: '$199 lifetime',
    ships: '50+ sections, 9 templates',
    figma: false,
    agent: 'Free MIT MCP server — no API key, no account',
    gate: 'source',
    beatsUs:
      'Proves this market pays for curation over volume: $199 for fifty sections. And its MCP server is free, MIT and on the same rail as ours — free agent access is table stakes here, not an edge.',
  },
  {
    name: 'Aceternity UI',
    href: 'https://ui.aceternity.com',
    entryUsd: 199,
    entryTerm: 'one-time',
    ladder: 'Free tier, $169/yr, $199 lifetime, $1,590 for 10 seats',
    ships: '200+ blocks, 12+ templates',
    figma: false,
    agent: 'Sells "AI-ready prompts" for v0 and Lovable',
    gate: 'source',
    beatsUs:
      'Sells community as a feature — a private Discord where other buyers answer each other. We publish response targets at /support and beat the 48 hours, but a room full of people who already solved your problem is not something a target replaces.',
  },
  {
    name: 'Preline',
    href: 'https://preline.co',
    entryUsd: 249,
    entryTerm: 'one-time',
    ladder: '$249 solo, $459 for 15 developers',
    ships: '640+ components, 780+ blocks, 21 templates, 207 pages',
    figma: true,
    agent: 'MCP free until 1 January 2027, then a subscription',
    gate: 'source',
    beatsUs:
      'Five times our block count and three times our templates. This is the gap that costs us sales, and it is the one we are actively closing.',
  },
  {
    name: 'Tailwind Plus',
    href: 'https://tailwindcss.com/plus',
    entryUsd: 299,
    entryTerm: 'one-time',
    ladder: '$299 personal, $979 for a team of 25',
    ships: '500+ blocks in React, Vue and HTML, 13 templates, Catalyst UI kit',
    figma: false,
    agent: 'None',
    gate: 'source',
    beatsUs:
      'Made by the people who make Tailwind, and prices for India openly at ₹8,500 — the only major vendor in this table that does purchasing-power pricing at all.',
  },
  {
    name: 'Untitled UI',
    href: 'https://untitledui.com',
    entryUsd: 349,
    entryTerm: 'one-time',
    ladder: '$349 solo to $8,999 enterprise — private repo, Storybook, SSO/SCIM',
    ships: '5,000+ components, plus a separate Figma ladder from $129',
    figma: true,
    agent: 'None',
    gate: 'source',
    beatsUs:
      'The deepest seat ladder in the field. Real money in this category is at $999 to $8,999 a licence, and our ladder stops at $12 a seat a month.',
  },
  {
    name: '21st.dev',
    href: 'https://21st.dev',
    entryUsd: 6,
    entryTerm: 'per month',
    ladder: '$6/mo Builder, $15/mo Builder+AI, $7.50 per seat for teams',
    ships: '12,000+ components, MCP and CLI',
    figma: false,
    agent: 'MCP access is a paid feature — one of only two vendors charging',
    gate: 'agent',
    beatsUs:
      'Twelve thousand components and a subscription funding the whole thing. Recurring revenue buys a roadmap that one-time licences do not.',
  },
]

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
      'Preline ships 780 blocks and Shadcnblocks 1,678. We are a fraction of both, and blocks are what buyers actually compare.',
  },
  {
    claim: 'Design files',
    detail:
      'Untitled UI, Flowbite, Shadcnblocks and Preline all ship Figma. We ship a token file a designer can import, and no drawn components.',
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
