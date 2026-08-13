/**
 * Guided paths — an ordered route through the catalog for one goal.
 *
 * The catalog answers "what is there". It does not answer "I have never
 * built a landing page, what do I need and in what order", and that is the
 * question a beginner actually arrives with. A path is the opinionated
 * answer: a short ordered list of real blocks, each with the reason it is
 * at that position.
 *
 * The ordering is the content. Anyone can list six blocks; the value is
 * knowing that social proof goes after the hook and before the price, and
 * that the FAQ exists to answer the objection the price just created.
 *
 * DATA-ONLY, and every `blockId` must exist in the block catalog —
 * `scripts/check-paths.mts` fails the build otherwise, because a guided
 * path with a dead step is worse than no path at all.
 */

export interface PathStep {
  /** A real id from the block catalog. */
  blockId: string
  /** Why this step, here. The part that is not just a list. */
  why: string
  /** Named alternatives from the same category, if the choice is real. */
  alternatives?: string[]
}

export interface GuidedPath {
  slug: string
  title: string
  /** One line, shown on the card. */
  tagline: string
  /** The full pitch, shown on the detail page. */
  description: string
  /** Rough time to work through it. Honest, not marketing. */
  duration: string
  level: 'Beginner' | 'Intermediate'
  steps: PathStep[]
  /** What to do once the steps are done. */
  next: string
}

export const PATHS: GuidedPath[] = [
  {
    slug: 'landing-page',
    title: 'Build a landing page',
    tagline: 'Seven blocks, in the order that converts.',
    description:
      'The standard marketing page, assembled from the catalog. Work down the list and you have a complete, responsive landing page — the same running order the SaaS Landing Page template uses.',
    duration: '~30 minutes',
    level: 'Beginner',
    steps: [
      {
        blockId: 'navbar-simple',
        why: 'A way around the site before there is a reason to stay. Put it first so the page has a frame to sit in.',
        alternatives: ['navbar-mega-menu', 'nav-mobile-drawer'],
      },
      {
        blockId: 'hero-centered',
        why: 'The one sentence most visitors will read. Centered works when there is no product screenshot yet; use the split hero if you have an interface to show.',
        alternatives: ['hero-split', 'hero-screenshot', 'hero-waitlist'],
      },
      {
        blockId: 'logo-cloud',
        why: 'Proof immediately after the claim. Someone else already decided this was fine, which is what buys attention for the next section.',
      },
      {
        blockId: 'bento-features',
        why: 'Now that they are still reading, what it actually does. The asymmetric grid lets one feature be visibly the main one.',
        alternatives: ['persona-cards', 'code-showcase'],
      },
      {
        blockId: 'testimonial-grid',
        why: 'Proof from people rather than from you — and it goes before the price, because it is what makes the number look reasonable.',
      },
      {
        blockId: 'pricing-tiers',
        why: 'The number, before they have to hunt for it. A page that hides pricing reads as expensive.',
        alternatives: ['comparison-table'],
      },
      {
        blockId: 'faq-accordion',
        why: 'The objections the price just created, answered in the visitor’s own words. This is the highest-leverage section on the page and the one most sites skip.',
      },
      {
        blockId: 'footer-mega',
        why: 'Every other page on the site. It is also the only place every page links to every section, which is what lets a crawler reach the rest of you.',
        alternatives: ['footer-minimal', 'footer-newsletter'],
      },
    ],
    next: 'Swap the copy, then take the SaaS Landing Page template if you would rather start from the assembled version.',
  },

  {
    slug: 'waitlist',
    title: 'Launch a waitlist page',
    tagline: 'One screen, one field, live in an evening.',
    description:
      'The smallest thing worth shipping. A page that explains the idea and collects an email — no accounts, no database decisions, nothing you have to maintain until somebody actually signs up. Start here if the landing page path looks like more than you need today.',
    duration: '~15 minutes',
    level: 'Beginner',
    steps: [
      {
        blockId: 'navbar-simple',
        why: 'A logo and one link. At this stage the nav is there to make the page look like a real product, not to get anyone anywhere.',
      },
      {
        blockId: 'hero-waitlist',
        why: 'The pitch and the email field in the same view. Every other hero sends people somewhere else; this one is the whole conversion, so it is the only section that has to be right.',
        alternatives: ['hero-centered'],
      },
      {
        blockId: 'bento-features',
        why: 'Three or four things it will do. Enough to make signing up feel like a decision rather than a shrug — and no more, because you have not built it yet.',
        alternatives: ['persona-cards'],
      },
      {
        blockId: 'faq-accordion',
        why: 'When does it launch, what will it cost, what happens to my email. Three answers here prevent the three emails you would otherwise get.',
      },
      {
        blockId: 'newsletter-signup',
        why: 'The same ask again, at the bottom, for the people who read the whole page before deciding. Repeating the field costs you nothing and catches the most convinced readers.',
      },
      {
        blockId: 'footer-minimal',
        why: 'A closing line and a way to contact you. The mega footer is for sites with pages; you have one.',
      },
    ],
    next: 'Point the form at a form service or a single API route. When the list is worth a real site, walk the landing page path — this page becomes its hero.',
  },

  {
    slug: 'auth-flow',
    title: 'Ship a complete auth flow',
    tagline: 'Every screen a real sign-in needs, including the ones people forget.',
    description:
      'Sign-in is five screens, not one, and the missing four are where products feel unfinished. These are the states a real account system has to handle.',
    duration: '~20 minutes',
    level: 'Beginner',
    steps: [
      {
        blockId: 'auth-login-card',
        why: 'The screen everyone builds. Email and social side by side, with the password field wired for autofill.',
        alternatives: ['auth-signup-split'],
      },
      {
        blockId: 'auth-signup-split',
        why: 'Sign-up earns more room than sign-in: it is the one asking for something, so it gets a panel to argue in.',
      },
      {
        blockId: 'auth-forgot-password',
        why: 'The first screen people forget. Without it, a lost password is a lost account.',
      },
      {
        blockId: 'auth-reset-password',
        why: 'The other half of the same flow — the screen the emailed link lands on.',
      },
      {
        blockId: 'auth-otp-verify',
        why: 'One-time codes, with the paste-a-six-digit-code behaviour that is fiddly to get right and obvious when it is wrong.',
      },
      {
        blockId: 'auth-two-factor',
        why: 'Optional, but the reason a security-conscious customer trusts you. Add it once the rest works.',
      },
    ],
    next: 'Wire the forms to your provider. The blocks own their pending and error states; you supply the submit handler.',
  },

  {
    slug: 'onboarding',
    title: 'Onboard a new user',
    tagline: 'The first ten minutes, from sign-up to first real action.',
    description:
      'Most products lose people between "account created" and "did something useful". This is the stretch in between: the questions you have to ask, the checklist that shows progress, and what the app looks like when it is still empty.',
    duration: '~25 minutes',
    level: 'Beginner',
    steps: [
      {
        blockId: 'auth-signup-split',
        why: 'Where onboarding actually starts. Ask for the minimum here — every extra field is someone deciding not to bother.',
        alternatives: ['auth-login-card'],
      },
      {
        blockId: 'setup-wizard',
        why: 'The questions you genuinely need answered, one screen at a time. Split into steps because a single long form reads as work, and because a step someone abandons still leaves you the earlier answers.',
        alternatives: ['multi-step-form'],
      },
      {
        blockId: 'onboarding-checklist',
        why: 'What is left, visible and crossable. This is the piece that converts a signup into a habit — people finish lists that show how close they are to done.',
      },
      {
        blockId: 'empty-state-cta',
        why: 'What the app looks like before they have made anything. Treat this as a screen worth designing, not a gap: it is the most-seen view a new account has, and a blank panel reads as broken.',
      },
      {
        blockId: 'toast-stack',
        why: 'Confirmation that each action worked. Silence after a click is how people end up doing the same thing twice.',
      },
      {
        blockId: 'notification-inbox',
        why: 'Where the nudges live once the checklist is gone. Optional on day one, and the reason day seven still has a reason to come back.',
      },
    ],
    next: 'Store the checklist state per account so it survives a refresh, then hide the whole flow once every item is done.',
  },

  {
    slug: 'states',
    title: 'Handle the states nobody designs',
    tagline: 'Loading, empty, error, missing — the four screens that decide whether it feels finished.',
    description:
      'Every tutorial builds the version where the data arrives. Real apps spend a surprising amount of time in the other four states, and skipping them is the single clearest difference between a side project and a product. Short path, disproportionate payoff.',
    duration: '~15 minutes',
    level: 'Beginner',
    steps: [
      {
        blockId: 'skeleton-list',
        why: 'What the screen shows while the data is in flight. Shaped like the content it is replacing, so nothing jumps when the real rows land.',
      },
      {
        blockId: 'empty-state-cta',
        why: 'Zero results, on purpose. The important part is the button — an empty state that only apologises leaves people stuck.',
      },
      {
        blockId: 'error-state-retry',
        why: 'The request failed. Say so in a sentence and give them the retry button, rather than leaving the skeleton spinning forever.',
      },
      {
        blockId: 'not-found-404',
        why: 'A URL that no longer resolves — a deleted record, an old link in someone’s email. Every app gets these; most send you to a default page with no way back.',
      },
      {
        blockId: 'toast-stack',
        why: 'The small confirmations and failures that do not deserve a whole screen. Stacked, so three fast actions do not fight over the same corner.',
      },
      {
        blockId: 'confirm-dialog',
        why: 'The state before a destructive one. Cheaper to add now than the support conversation about the thing somebody deleted.',
      },
    ],
    next: 'Wire each one to a real request. If you only take two from this list, take the empty state and the error state.',
  },

  {
    slug: 'settings',
    title: 'Build a settings area',
    tagline: 'Five screens, in the order people go looking for them.',
    description:
      'Settings is where a product accumulates screens without anyone deciding to build them. These five cover almost every real account area, and the layout comes first so the rest just drop in.',
    duration: '~20 minutes',
    level: 'Beginner',
    steps: [
      {
        blockId: 'settings-nav-layout',
        why: 'The sidebar and content split that every following step sits inside. Build it first and each new settings screen is a panel rather than a page.',
      },
      {
        blockId: 'settings-profile-form',
        why: 'Name, avatar, email. The screen people came for, so it is the one the nav lands on by default.',
      },
      {
        blockId: 'settings-team-members',
        why: 'Invites, roles and removal. The moment a product goes from one user to an account, this is the screen that has to exist.',
      },
      {
        blockId: 'settings-api-keys',
        why: 'Create, copy once, revoke. Note that the key is shown a single time — that is the behaviour, not an oversight.',
      },
      {
        blockId: 'settings-danger-zone',
        why: 'Delete the account, leave the team, close the workspace. Last, visually separated, and behind a confirm — which is exactly why it is a section of its own rather than a red button next to Save.',
        alternatives: ['confirm-dialog'],
      },
    ],
    next: 'Add billing as a sixth panel in the same layout — the billing path picks up from here.',
  },

  {
    slug: 'product-updates',
    title: 'Publish what you shipped',
    tagline: 'A changelog, a roadmap, and a way to hear about both.',
    description:
      'The pages that make a small product look alive. A changelog is the cheapest credibility on a marketing site — it is evidence, not a claim — and it costs one block plus the discipline to write two lines per release.',
    duration: '~15 minutes',
    level: 'Beginner',
    steps: [
      {
        blockId: 'changelog-timeline',
        why: 'Dated entries, newest first. Start it the day you launch: a changelog with three months of history is worth far more than one begun when you finally have something big to announce.',
      },
      {
        blockId: 'roadmap-columns',
        why: 'Shipped, in progress, considering. Answers "is this abandoned" and "will you build my thing" without you replying to either email.',
      },
      {
        blockId: 'community-band',
        why: 'Where to argue with the roadmap. A public plan without somewhere to respond to it is just a longer press release.',
      },
      {
        blockId: 'newsletter-signup',
        why: 'The people who liked an entry enough to want the next one. Put it at the bottom of the changelog, where interest is already proven.',
      },
      {
        blockId: 'footer-mega',
        why: 'Links these pages from everywhere else. A changelog nothing points at gets read by you and no one else.',
        alternatives: ['footer-minimal'],
      },
    ],
    next: 'Keep the entries in markdown or a CMS and map them onto the timeline — the block takes a list, so the source is your choice.',
  },

  {
    slug: 'dashboard',
    title: 'Build an internal dashboard',
    tagline: 'The shell, the numbers, and the table underneath.',
    description:
      'The layout every internal tool needs and nobody enjoys rebuilding. Start with the shell, fill it with the four things a dashboard is actually made of.',
    duration: '~25 minutes',
    level: 'Intermediate',
    steps: [
      {
        blockId: 'dashboard-shell',
        why: 'Sidebar, top bar and a content slot. Everything else drops into it, so it comes first — and it is the piece with the drawer and focus behaviour you do not want to write twice.',
      },
      {
        blockId: 'dashboard-page-header',
        why: 'Title, breadcrumb and the page’s primary action. Consistent headers are what make a multi-screen tool feel like one product.',
      },
      {
        blockId: 'dashboard-stat-cards',
        why: 'The four numbers someone opens the dashboard to check, above everything that needs scrolling.',
        alternatives: ['metric-sparkline-cards'],
      },
      {
        blockId: 'bar-chart-panel',
        why: 'The trend behind the numbers. One chart, not six — a dashboard that shows everything shows nothing.',
        alternatives: ['usage-meter-panel'],
      },
      {
        blockId: 'data-table-sortable',
        why: 'The rows the numbers summarize. Sorting is in the markup, so it works before you wire any data.',
        alternatives: ['data-table-expandable'],
      },
      {
        blockId: 'data-table-pagination',
        why: 'The moment the table has more than a screenful. Pair it with the toolbar for filtering.',
        alternatives: ['data-table-toolbar'],
      },
      {
        blockId: 'skeleton-list',
        why: 'What the table looks like before the data arrives. Skipping this is why so many internal tools flash empty on every load.',
        alternatives: ['empty-state-cta', 'error-state-retry'],
      },
    ],
    next: 'Take the Admin Panel template if you want the routing and layout already wired together.',
  },

  {
    slug: 'billing',
    title: 'Add billing and usage',
    tagline: 'From the price on the marketing page to the invoice in the account.',
    description:
      'Charging money is four screens, and only the first one usually gets built. This is the rest — what plan am I on, how much have I used, where are my receipts, and how do I leave.',
    duration: '~25 minutes',
    level: 'Intermediate',
    steps: [
      {
        blockId: 'pricing-tiers',
        why: 'The public page, because it sets every number the account screens have to agree with. Decide the plans here once rather than in four places.',
        alternatives: ['comparison-table'],
      },
      {
        blockId: 'billing-plan-summary',
        why: 'Current plan, renewal date, the upgrade button. The first thing anyone opens billing to check, so it goes at the top with no scrolling.',
      },
      {
        blockId: 'usage-meter-panel',
        why: 'How much of the plan is spent. This is what makes an upgrade feel like the customer’s idea instead of yours — and what stops the overage invoice being a surprise.',
        alternatives: ['metric-sparkline-cards'],
      },
      {
        blockId: 'invoice-history-table',
        why: 'Dated rows with a download on each. Someone’s finance team will ask for a PDF from four months ago, and this is the difference between a link and a support ticket.',
        alternatives: ['data-table-pagination'],
      },
      {
        blockId: 'settings-danger-zone',
        why: 'Cancelling, in the open. Hiding it does not keep anyone; it just means they cancel through their bank and dispute the last charge on the way out.',
      },
    ],
    next: 'Wire the plan and usage numbers to your payment provider’s API. The blocks take plain values, so the shape of that data is yours to decide.',
  },

  {
    slug: 'storefront',
    title: 'Build a storefront',
    tagline: 'Browse, choose, buy — the whole commerce path.',
    description:
      'From a collection page to a confirmed order. These are the screens in the order a customer meets them, which is also the order they are worth building in.',
    duration: '~40 minutes',
    level: 'Intermediate',
    steps: [
      {
        blockId: 'product-grid',
        why: 'The collection page. Everything else is downstream of someone finding a product they like.',
      },
      {
        blockId: 'product-filter-sidebar',
        why: 'The moment there are more than a dozen products. Filters are what turn a grid into a store.',
        alternatives: ['collection-toolbar'],
      },
      {
        blockId: 'product-gallery',
        why: 'The product page starts here — for physical goods the images are the pitch.',
      },
      {
        blockId: 'product-buy-box',
        why: 'Price, variants and the add-to-cart button. The single highest-stakes component in the whole flow.',
      },
      {
        blockId: 'cart-drawer',
        why: 'Confirmation without navigation. Sending someone to a full cart page after every add is how carts get abandoned.',
        alternatives: ['cart-line-items'],
      },
      {
        blockId: 'checkout-form',
        why: 'Address and payment, with the field ordering and autofill hints that decide whether this converts on a phone.',
      },
      {
        blockId: 'order-summary-panel',
        why: 'What they are about to pay, beside the form rather than a scroll away.',
      },
      {
        blockId: 'order-confirmation',
        why: 'The receipt screen. It closes the loop, and it is the natural place to ask for the next thing.',
      },
    ],
    next: 'The Storefront template ships these already routed, with the cart state wired between them.',
  },

  {
    slug: 'ai-assistant',
    title: 'Build an AI assistant',
    tagline: 'From the blank thread to an action the user actually approved.',
    description:
      'The screens an agent product is made of, in the order a user meets them. The first half is the conversation; the second half is everything that stops a confident-sounding model from doing damage — which is the half most AI products skip and then retrofit after the first incident.',
    duration: '~45 minutes',
    level: 'Intermediate',
    steps: [
      {
        blockId: 'chat-empty-state',
        why: 'The first screen, and the one that decides whether anyone types anything. A user who does not know what the thing can be asked will ask nothing, so this is where you spend your specificity.',
      },
      {
        blockId: 'chat-prompt-bar',
        why: 'The composer, before the thread. Everything downstream is shaped by what a user can express here — @ for sources and / for commands are the difference between a search box and an interface.',
      },
      {
        blockId: 'chat-thread-panel',
        why: 'The conversation itself. Take the live-region and scroll handling from this one verbatim: polite-with-additions and only-pin-when-at-the-bottom are both invisible until they are wrong.',
      },
      {
        blockId: 'chat-streaming-answer',
        why: 'The reply. Citations belong in the answer rather than under it, and the streaming here is deliberately outside every live region — the usual mistake is a paragraph re-read on every token.',
      },
      {
        blockId: 'agent-working-indicator',
        why: 'The gap before that first token. Fifteen silent seconds is indistinguishable from a dropped request, and an elapsed counter is the only honest answer to "is it stuck".',
        alternatives: ['agent-thinking-trace'],
      },
      {
        blockId: 'agent-thinking-trace',
        why: 'Show the working. This is what converts a plausible answer into a checkable one, and it costs nothing to collapse by default.',
        alternatives: ['agent-tool-calls'],
      },
      {
        blockId: 'source-citation-list',
        why: 'Where the claims came from. Add it the moment the assistant states a number — an uncited figure is the fastest way to lose a user permanently.',
        alternatives: ['context-chunk-cards'],
      },
      {
        blockId: 'retrieval-empty-state',
        why: 'Before you ship: what it says when it found nothing. A model with no honest refusal path will fill the gap with something plausible, and this screen is the alternative.',
      },
      {
        blockId: 'approval-request-card',
        why: 'The first time the agent can change something, it has to ask. State the effect before the verb, default to the smallest blast radius, and never pre-focus Approve.',
        alternatives: ['permission-scope-dialog'],
      },
      {
        blockId: 'agent-diff-review',
        why: 'For bulk edits, one approval is not consent. Make the row the unit of review and show a running count of what will actually be written.',
      },
    ],
    next: 'The AI Assistant Screen page ships these already composed — transcript down the middle, permissions and insights in the rail. After that: `agent-task-list` if runs outlive the request, and `selection-ai-toolbar` if you have a document surface, since inline actions convert far better than sending people to a chat panel.',
  },
]

/** Look up one path by slug. */
export function getPath(slug: string): GuidedPath | undefined {
  return PATHS.find((p) => p.slug === slug)
}

/** Every block id any path references, deduped — used by the build check. */
export function referencedBlockIds(): string[] {
  const ids = new Set<string>()
  for (const path of PATHS) {
    for (const step of path.steps) {
      ids.add(step.blockId)
      for (const alt of step.alternatives ?? []) ids.add(alt)
    }
  }
  return [...ids]
}
