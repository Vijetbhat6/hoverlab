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
