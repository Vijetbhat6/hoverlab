/**
 * Kits — a curated cross-rung selection, sold as one thing.
 *
 * The catalog has four rungs and, until this module, nothing that crossed
 * them. A visitor wanting to build a storefront had to find the storefront
 * template, then guess which of 210 blocks belonged with it, then find the
 * commerce pages, then pick effects. Every one of those is a separate
 * browse, and the thing they actually want — "the commerce set" — did not
 * exist as an object anywhere in the product.
 *
 * ── Why this is not /paths ──
 *
 * A path is a *tutorial*: ordered steps, each with the reason it is at that
 * position, aimed at someone who has never built one before. A kit is an
 * *inventory*: everything for a job, unordered within a rung, aimed at
 * someone who knows exactly what they are building and wants it in one
 * move. Paths teach; kits ship. They overlap on the blocks they name and
 * that is fine — the same block is a step in one and a part in the other.
 *
 * ── Why this is a SKU and not another free hub ──
 *
 * The free bundle holds ten entries (LIMITS.bundleSize in
 * billing/entitlements.ts) and every kit here is larger than that. That is
 * not a trick: it is the honest shape of the thing. A kit is precisely the
 * case where the ten-entry cap starts to bite, so the kit page is where Pro
 * has something real to say, and it says it by showing the whole list and
 * letting anyone browse and copy every item individually — the gate has
 * always been at download, never at browse.
 *
 * ── Keeping it honest ──
 *
 * DATA-ONLY, and every id here must resolve against a real catalog entry —
 * `scripts/check-kits.mts` fails the build otherwise, the same guarantee
 * `check-paths.mts` gives the guided paths. A kit that lists a renamed
 * block is a product page with a dead item on it, which is worse than not
 * shipping the kit.
 *
 * Nothing here restates a count. Counts are derived in `./resolve` from the
 * arrays below, so "24 pieces" cannot drift from what the page renders.
 */

/** What a kit contains, grouped by rung. */
export interface KitContents {
  /** Whole-app starters. Usually zero or one; two where the job splits. */
  templates?: string[]
  /** Full screens. */
  pages?: string[]
  /** Sections. Every kit has these — they are the substance. */
  blocks: string[]
  /** Polish. Optional, and deliberately a short list rather than a dump. */
  effects?: string[]
}

export interface Kit {
  /** URL segment. */
  slug: string
  name: string
  /** One line, shown on the hub card. */
  tagline: string
  /** The full pitch, shown on the detail page. */
  description: string
  /**
   * Who this is for, in one line.
   *
   * Present because the kits are close enough to each other that a reader
   * comparing two of them needs a sentence that distinguishes them, and
   * "which one am I" is a faster question than reading both descriptions.
   */
  audience: string
  contents: KitContents
}

export const KITS: Kit[] = [
  {
    slug: 'saas-launch',
    name: 'SaaS launch kit',
    tagline: 'Marketing site, auth, dashboard and billing — the whole first release.',
    description:
      'Everything a subscription product needs on day one: the page that sells it, the flow that signs people up, the screen they land on, and the billing surface that takes their money. The template at the top of the list is the assembled version; the pieces below it are what it is assembled from, so you can take the whole thing or replace the half you want to write yourself.',
    audience: 'You are launching a subscription product and need all four surfaces at once.',
    contents: {
      templates: ['saas-starter'],
      pages: [
        'saas-landing-page',
        'pricing-page',
        'login-page',
        'dashboard-overview',
        'billing-page',
        'settings-account-page',
      ],
      blocks: [
        'navbar-simple',
        'hero-split',
        'logo-cloud',
        'bento-features',
        'pricing-tiers',
        'faq-accordion',
        'footer-mega',
        'auth-login-card',
        'auth-signup-split',
        'dashboard-shell',
        'dashboard-stat-cards',
        'billing-plan-summary',
        'settings-profile-form',
        'toast-stack',
      ],
      effects: ['btn-gradient', 'card-lift', 'loader-spinner', 'text-gradient', 'input-float'],
    },
  },
  {
    slug: 'ai-product',
    name: 'AI product kit',
    tagline: 'Thread, reasoning trace, approvals, citations — and the meter that bills them.',
    description:
      'The surfaces an agent product is actually made of, which are not "a dashboard with a chatbot bolted on". A thread, a streaming answer, a visible reasoning trace, an approval card a human has to sign, retrieved context with its citations, and the credit balance that pays for all of it. Each is its own layout problem with its own live-region and focus rules, and each is solved here rather than approximated.',
    audience: 'You are building on top of a model and need the human-facing half.',
    contents: {
      templates: ['ai-assistant'],
      pages: ['ai-assistant-page'],
      blocks: [
        'chat-thread-panel',
        'chat-prompt-bar',
        'chat-streaming-answer',
        'chat-empty-state',
        'chat-model-picker',
        'agent-thinking-trace',
        'agent-tool-calls',
        'agent-working-indicator',
        'approval-request-card',
        'agent-diff-review',
        'source-citation-list',
        'context-chunk-cards',
        'context-window-budget',
        'selection-ai-toolbar',
        'ai-inline-suggestion',
        'pricing-credits',
        'billing-credit-balance',
      ],
      effects: ['loader-dots', 'text-typewriter', 'loader-pulse-ring', 'card-glass'],
    },
  },
  {
    slug: 'storefront',
    name: 'Storefront kit',
    tagline: 'Browse, filter, buy, pay, and the receipt afterwards.',
    description:
      'A complete commerce path, in the order a shopper walks it: a collection with filters, a product page with a gallery and a buy box, a cart, a checkout, and the confirmation and tracking that come after the money moves. The post-purchase half is the half most component libraries skip, and it is the half that generates the support email when it is missing.',
    audience: 'You are selling physical or digital goods and need the whole funnel.',
    contents: {
      templates: ['storefront'],
      pages: [
        'collection-page',
        'product-detail-page',
        'cart-page',
        'checkout-page',
        'order-confirmation-page',
        'account-orders-page',
      ],
      blocks: [
        'product-grid',
        'product-filter-sidebar',
        'collection-toolbar',
        'product-gallery',
        'product-buy-box',
        'product-info-accordion',
        'product-review-summary',
        'cart-drawer',
        'cart-line-items',
        'checkout-form',
        'order-summary-panel',
        'checkout-express-payment',
        'order-confirmation',
        'order-tracking-timeline',
        'review-list',
      ],
      effects: ['hover-zoom', 'badge-status-dot', 'btn-shine', 'loader-skeleton'],
    },
  },
  {
    slug: 'internal-tools',
    name: 'Internal tools kit',
    tagline: 'Tables that sort, filter, bulk-edit and page — plus the shell around them.',
    description:
      'The admin surface, which is mostly one hard problem — a data table that stays usable at ten thousand rows — surrounded by the shell, the command palette and the settings screens that make it a tool rather than a page. Sorting, pagination, column management, bulk actions and inline edit are separate blocks here because they are separately hard, and most teams need three of the five.',
    audience: 'You are building the back office, and the table is the product.',
    contents: {
      templates: ['admin-panel'],
      pages: ['dashboard-overview', 'customers-table-page', 'project-board-page'],
      blocks: [
        'dashboard-shell',
        'dashboard-page-header',
        'dashboard-stat-cards',
        'data-table-sortable',
        'data-table-toolbar',
        'data-table-pagination',
        'data-table-bulk-actions',
        'data-table-column-manager',
        'kanban-board',
        'command-palette',
        'settings-team-members',
        'settings-api-keys',
        'settings-audit-log',
        'confirm-dialog',
        'empty-filtered-results',
      ],
      effects: ['loader-bar', 'tooltip-hover', 'check-custom', 'loader-skeleton'],
    },
  },
  {
    slug: 'waitlist',
    name: 'Waitlist kit',
    tagline: 'One page, one form, one evening.',
    description:
      'The smallest kit here on purpose. A pre-launch page is one hero, one email capture, enough proof to be credible and enough answers to remove the objection — and the most common way it goes wrong is being built as a full marketing site three weeks before there is anything to market. This is the short version, and the effects are the part that makes a seven-block page not look like a seven-block page.',
    audience: 'You have nothing to ship yet and need to start collecting addresses tonight.',
    contents: {
      templates: ['startup-waitlist'],
      pages: ['waitlist-landing-page'],
      blocks: [
        'announcement-bar',
        'hero-waitlist',
        'logo-cloud',
        'feature-icon-grid',
        'faq-accordion',
        'newsletter-signup',
        'footer-minimal',
      ],
      effects: ['bg-aurora', 'btn-gradient', 'text-shimmer', 'badge-pulse', 'loader-dots'],
    },
  },
  {
    slug: 'content-and-docs',
    name: 'Content and docs kit',
    tagline: 'A blog, a documentation site, a changelog and a careers page.',
    description:
      'The publishing surfaces, which every company ends up needing and nobody plans for. Two templates because the job genuinely splits — a docs site and a content site want different navigation and different reading widths — and the blocks below cover the pieces they share: an article header, a code tab panel, an endpoint card, a changelog that reads as a timeline rather than a list of versions.',
    audience: 'The product ships and now it needs somewhere to be written about.',
    contents: {
      templates: ['content-site', 'docs-site'],
      pages: ['blog-index-page', 'article-page', 'docs-page', 'changelog-page', 'careers-page'],
      blocks: [
        'docs-layout',
        'code-tabs-panel',
        'api-endpoint-card',
        'blog-post-grid',
        'article-header',
        'changelog-timeline',
        'faq-search',
        'team-grid',
        'job-listing-board',
        'footer-status-locale',
      ],
      effects: ['text-gradient', 'link-underline', 'divider-gradient', 'loader-bar'],
    },
  },
]

/** One kit by slug, or undefined. */
export function getKit(slug: string): Kit | undefined {
  return KITS.find((k) => k.slug === slug)
}
