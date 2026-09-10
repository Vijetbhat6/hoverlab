/**
 * Hand-authored metadata for every template.
 *
 * Scaffolding lives in `./files/<id>/` (merged with `./files/_shared/`) and
 * is inlined by `scripts/build-artifact-sources.mjs`. Unlike the tiers
 * below, that is only *part* of a template's file list — the page and block
 * sources are grafted on at runtime in `./templates.ts`, where the other
 * catalogs are real typed imports.
 *
 * `routes` is the spine. It maps a URL to a page id and to the file that
 * page becomes inside the generated project, and everything else about a
 * template is derived from it: `composedOf`, the preview switcher, the
 * assembled tree, the route table in the README.
 *
 * TIERS. This is the one catalog where `tier` is set, and it is the rung
 * where Pro stops being a licence and starts being a boundary. The reason
 * is arithmetic: 835 effects at $79 is nine cents an effect, which is not
 * a pitch anybody makes a decision about. A runnable eight-route project
 * is. Effects, blocks and pages stay free at every level — browse, copy,
 * `/api/v1`, `hoverlab add` — because they are the funnel, and taking them
 * back would cost more traffic than the licence would recover.
 *
 * `marketing-site` stays free deliberately, and is marked rather than left
 * to the default so that nobody later reads its absence as an oversight.
 * It is the lead magnet: the whole thing, running, with nothing withheld,
 * for someone deciding whether the other six are worth $79. A paid catalog
 * with no free example of what is in it converts worse than one with a
 * good one.
 *
 * The gate is real rather than decorative because it is enforced where the
 * source is served, not where the button is drawn — see
 * `lib/billing/api-key.ts`, which exists precisely because a website-only
 * check is walked around by the CLI and the archive URL.
 */

import type { TemplateCategory, TemplateRoute } from './template-types'
import type { ArtifactTier } from '../artifact-types'

/** Metadata as authored — everything except the file tree. */
export interface TemplateRecord {
  id: string
  name: string
  category: TemplateCategory
  description: string
  tags: string[]
  deps: string[]
  routes: TemplateRoute[]
  /** Thumbnail override when `routes[0]` is shared with another template. */
  previewPageId?: string
  /** Palette id from `./palettes`. Required in practice — see the type. */
  palette?: string
  tier?: ArtifactTier
  featured?: boolean
}

export const TEMPLATE_CATALOG: TemplateRecord[] = [
  {
    id: 'saas-starter',
    tier: 'pro',
    name: 'SaaS Starter',
    category: 'Full Product',
    palette: 'iris',
    description:
      'The whole thing: marketing site, sign-in, dashboard, customer list, settings and billing. Eight routes, one runtime dependency.',
    tags: ['saas', 'starter', 'full stack', 'dashboard', 'nextjs'],
    deps: ['lucide-react'],
    featured: true,
    routes: [
      { path: '/', pageId: 'saas-landing-page', file: 'app/page.tsx', label: 'Landing' },
      { path: '/pricing', pageId: 'pricing-page', file: 'app/pricing/page.tsx', label: 'Pricing' },
      { path: '/login', pageId: 'login-page', file: 'app/login/page.tsx', label: 'Sign in' },
      {
        path: '/dashboard',
        pageId: 'dashboard-overview',
        file: 'app/dashboard/page.tsx',
        label: 'Dashboard',
      },
      {
        path: '/customers',
        pageId: 'customers-table-page',
        file: 'app/customers/page.tsx',
        label: 'Customers',
      },
      {
        path: '/settings',
        pageId: 'settings-account-page',
        file: 'app/settings/page.tsx',
        label: 'Settings',
      },
      { path: '/billing', pageId: 'billing-page', file: 'app/billing/page.tsx', label: 'Billing' },
      // Next's not-found is a special file at the app root, not a route —
      // which is why `file` is stored rather than derived from `path`.
      { path: '404', pageId: 'error-404-page', file: 'app/not-found.tsx', label: '404' },
    ],
  },
  {
    id: 'admin-panel',
    tier: 'pro',
    name: 'Admin Panel',
    category: 'Internal Tools',
    palette: 'steel',
    description:
      'The internal-tool half on its own — dashboard, list view, settings, billing and sign-in. Ships noindex, because an admin panel has no business in a search result.',
    tags: ['admin', 'internal', 'dashboard', 'crud', 'back office'],
    deps: ['lucide-react'],
    featured: true,
    routes: [
      { path: '/', pageId: 'dashboard-overview', file: 'app/page.tsx', label: 'Dashboard' },
      {
        path: '/customers',
        pageId: 'customers-table-page',
        file: 'app/customers/page.tsx',
        label: 'Customers',
      },
      {
        path: '/settings',
        pageId: 'settings-account-page',
        file: 'app/settings/page.tsx',
        label: 'Settings',
      },
      { path: '/billing', pageId: 'billing-page', file: 'app/billing/page.tsx', label: 'Billing' },
      { path: '/login', pageId: 'login-page', file: 'app/login/page.tsx', label: 'Sign in' },
      { path: '404', pageId: 'error-404-page', file: 'app/not-found.tsx', label: '404' },
    ],
  },
  {
    id: 'marketing-site',
    tier: 'free',
    name: 'Marketing Site',
    category: 'Marketing',
    palette: 'vermilion',
    description:
      'Landing page, pricing page, 404. The smallest thing you can put in front of a product and have it look deliberate.',
    tags: ['marketing', 'landing page', 'pricing', 'website', 'launch'],
    deps: ['lucide-react'],
    featured: true,
    // Shares its landing screen with SaaS Starter, so the pricing page is
    // what tells the two apart in a grid. See `previewPageId` in
    // template-types.ts.
    previewPageId: 'pricing-page',
    routes: [
      { path: '/', pageId: 'saas-landing-page', file: 'app/page.tsx', label: 'Landing' },
      { path: '/pricing', pageId: 'pricing-page', file: 'app/pricing/page.tsx', label: 'Pricing' },
      { path: '404', pageId: 'error-404-page', file: 'app/not-found.tsx', label: '404' },
    ],
  },
  {
    id: 'ai-assistant',
    tier: 'pro',
    name: 'AI Assistant',
    category: 'Full Product',
    palette: 'orchid',
    description:
      'An agent product’s working surface: transcript, reasoning, tool calls and the approval card, with sign-in and settings around it. Wiring a model in is your half.',
    tags: ['ai', 'assistant', 'agent', 'chat', 'copilot'],
    deps: ['lucide-react'],
    featured: true,
    routes: [
      { path: '/', pageId: 'ai-assistant-page', file: 'app/page.tsx', label: 'Assistant' },
      {
        path: '/settings',
        pageId: 'settings-account-page',
        file: 'app/settings/page.tsx',
        label: 'Settings',
      },
      { path: '/login', pageId: 'login-page', file: 'app/login/page.tsx', label: 'Sign in' },
      { path: '404', pageId: 'error-404-page', file: 'app/not-found.tsx', label: '404' },
    ],
  },
  {
    id: 'content-site',
    tier: 'pro',
    name: 'Content Site',
    category: 'Marketing',
    palette: 'ink',
    description:
      'A publication that happens to belong to a company: blog index, article, careers and a 404. The site for when the writing is the product — or the marketing.',
    tags: ['blog', 'content', 'publication', 'careers', 'editorial'],
    deps: ['lucide-react'],
    routes: [
      { path: '/', pageId: 'blog-index-page', file: 'app/page.tsx', label: 'Blog' },
      {
        // A real dynamic segment — in your project the page reads `params`,
        // fetches the post, and passes it down as props.
        path: '/blog/[slug]',
        pageId: 'article-page',
        file: 'app/blog/[slug]/page.tsx',
        label: 'Article',
      },
      { path: '/careers', pageId: 'careers-page', file: 'app/careers/page.tsx', label: 'Careers' },
      { path: '404', pageId: 'error-404-page', file: 'app/not-found.tsx', label: '404' },
    ],
  },
  {
    id: 'docs-site',
    tier: 'pro',
    name: 'Docs Site',
    category: 'Marketing',
    palette: 'azure',
    description:
      'The three-column docs frame — sidebar, article, on-this-page rail — plus a changelog and a 404. The part of the product a search for an error message should find.',
    tags: ['docs', 'documentation', 'developer', 'changelog', 'reference'],
    deps: ['lucide-react'],
    routes: [
      { path: '/', pageId: 'docs-page', file: 'app/page.tsx', label: 'Docs' },
      {
        path: '/changelog',
        pageId: 'changelog-page',
        file: 'app/changelog/page.tsx',
        label: 'Changelog',
      },
      { path: '404', pageId: 'error-404-page', file: 'app/not-found.tsx', label: '404' },
    ],
  },
  {
    id: 'storefront',
    tier: 'pro',
    name: 'Storefront',
    category: 'Commerce',
    palette: 'cocoa',
    description:
      'The whole purchase funnel: collection, product detail, bag, checkout, confirmation and an account area. Seven routes, no commerce SDK.',
    tags: ['ecommerce', 'shop', 'storefront', 'checkout', 'retail'],
    deps: ['lucide-react'],
    featured: true,
    routes: [
      { path: '/', pageId: 'collection-page', file: 'app/page.tsx', label: 'Collection' },
      {
        // A real dynamic segment — the page reads `params` in your project
        // and passes the fetched product down as props.
        path: '/products/[slug]',
        pageId: 'product-detail-page',
        file: 'app/products/[slug]/page.tsx',
        label: 'Product',
      },
      { path: '/cart', pageId: 'cart-page', file: 'app/cart/page.tsx', label: 'Bag' },
      { path: '/checkout', pageId: 'checkout-page', file: 'app/checkout/page.tsx', label: 'Checkout' },
      {
        path: '/orders/confirmed',
        pageId: 'order-confirmation-page',
        file: 'app/orders/confirmed/page.tsx',
        label: 'Confirmed',
      },
      {
        path: '/account/orders',
        pageId: 'account-orders-page',
        file: 'app/account/orders/page.tsx',
        label: 'Account',
      },
      { path: '404', pageId: 'error-404-page', file: 'app/not-found.tsx', label: '404' },
    ],
  },

  /* ------------------------------------------------------------------ *
   *  Landing Pages
   * ------------------------------------------------------------------ *
   *
   * The templates in this category are the only ones that set `palette`,
   * and that is the point of the category rather than an implementation
   * detail of it. Everything outside it is an app shell whose whole value
   * is looking like one coherent product; these are launches that must not
   * look like each other, so each carries its own colour and corner radius
   * from `./palettes.ts`.
   *
   * The count is deliberately not written down here. It was "the four
   * templates in this category" through two waves that made it nine, which
   * is how a comment becomes a thing nobody trusts. `TEMPLATE_COUNT` and
   * `templatesInCategory()` are always right; a number in prose is right
   * until the next wave.
   *
   * TIER. `startup-waitlist` is free, on the same argument that keeps
   * `marketing-site` free one category up: this section is where the most
   * casual visitor lands, and a shop window with nothing openable in it
   * converts worse than one with a single good example. Every other landing
   * template is pro.
   *
   * ROUTES. Each is small on purpose — the landing page plus the one or two
   * screens that specific launch actually needs. A waitlist site with a
   * billing page would be padding, and padding is what makes a template
   * feel generated.
   */
  {
    id: 'startup-waitlist',
    tier: 'free',
    name: 'Startup Waitlist',
    category: 'Landing Pages',
    palette: 'ultraviolet',
    description:
      'A pre-launch site in violet: one email field, a blog to keep the list warm, and no pricing to be held to. The smallest honest thing to put in front of a product that does not exist yet.',
    tags: ['landing page', 'waitlist', 'pre-launch', 'startup', 'early access'],
    deps: ['lucide-react'],
    featured: true,
    routes: [
      { path: '/', pageId: 'waitlist-landing-page', file: 'app/page.tsx', label: 'Waitlist' },
      { path: '/blog', pageId: 'blog-index-page', file: 'app/blog/page.tsx', label: 'Journal' },
      {
        path: '/blog/[slug]',
        pageId: 'article-page',
        file: 'app/blog/[slug]/page.tsx',
        label: 'Post',
      },
      { path: '404', pageId: 'error-404-page', file: 'app/not-found.tsx', label: '404' },
    ],
  },
  {
    id: 'developer-tool',
    tier: 'pro',
    name: 'Developer Tool',
    category: 'Landing Pages',
    palette: 'graphite',
    description:
      'Near-black buttons, square corners and a terminal-green accent. Install command above the fold, real code before any prose, docs and changelog behind it.',
    tags: ['landing page', 'developer tool', 'api', 'cli', 'devtools'],
    deps: ['lucide-react'],
    featured: true,
    routes: [
      {
        path: '/',
        pageId: 'developer-tool-landing-page',
        file: 'app/page.tsx',
        label: 'Landing',
      },
      { path: '/docs', pageId: 'docs-page', file: 'app/docs/page.tsx', label: 'Docs' },
      {
        path: '/changelog',
        pageId: 'changelog-page',
        file: 'app/changelog/page.tsx',
        label: 'Changelog',
      },
      { path: '/pricing', pageId: 'pricing-page', file: 'app/pricing/page.tsx', label: 'Pricing' },
      { path: '404', pageId: 'error-404-page', file: 'app/not-found.tsx', label: '404' },
    ],
  },
  {
    id: 'mobile-app',
    tier: 'pro',
    name: 'Mobile App',
    category: 'Landing Pages',
    palette: 'signal',
    description:
      'Emerald and 16px corners, built around one conversion: the store install. Badges and the App Store rating above the fold, a single price, and an account area for the subscription.',
    tags: ['landing page', 'mobile app', 'ios', 'android', 'consumer'],
    deps: ['lucide-react'],
    featured: true,
    routes: [
      { path: '/', pageId: 'mobile-app-landing-page', file: 'app/page.tsx', label: 'Landing' },
      { path: '/pricing', pageId: 'pricing-page', file: 'app/pricing/page.tsx', label: 'Pricing' },
      { path: '/login', pageId: 'login-page', file: 'app/login/page.tsx', label: 'Sign in' },
      {
        path: '/account',
        pageId: 'settings-account-page',
        file: 'app/account/page.tsx',
        label: 'Account',
      },
      { path: '404', pageId: 'error-404-page', file: 'app/not-found.tsx', label: '404' },
    ],
  },
  {
    id: 'agency-studio',
    tier: 'pro',
    name: 'Agency Studio',
    category: 'Landing Pages',
    palette: 'sandstone',
    description:
      'Terracotta on warm paper, with no blue in it anywhere. Full-bleed hero, client list, the actual team, a journal and a careers page — and no pricing, on purpose.',
    tags: ['landing page', 'agency', 'studio', 'portfolio', 'services'],
    deps: ['lucide-react'],
    routes: [
      { path: '/', pageId: 'agency-landing-page', file: 'app/page.tsx', label: 'Studio' },
      { path: '/blog', pageId: 'blog-index-page', file: 'app/blog/page.tsx', label: 'Journal' },
      {
        path: '/blog/[slug]',
        pageId: 'article-page',
        file: 'app/blog/[slug]/page.tsx',
        label: 'Post',
      },
      { path: '/careers', pageId: 'careers-page', file: 'app/careers/page.tsx', label: 'Careers' },
      { path: '404', pageId: 'error-404-page', file: 'app/not-found.tsx', label: '404' },
    ],
  },

  /* -- Second wave ---------------------------------------------------- *
   *
   * Five more, all pro. The free slot in this category is already spoken
   * for by `startup-waitlist`, and the argument for keeping one free was
   * that a section with nothing openable in it converts badly — an argument
   * that is satisfied by one example and not improved by six.
   */
  {
    id: 'local-service',
    tier: 'pro',
    name: 'Local Service',
    category: 'Landing Pages',
    palette: 'harbour',
    description:
      'Deep teal, for a business people let into their house. A booking widget above the fold, every price published, and a compliance footer with the registrations a regulated trade has to show.',
    tags: ['landing page', 'local business', 'booking', 'service', 'appointments'],
    deps: ['lucide-react'],
    featured: true,
    routes: [
      { path: '/', pageId: 'local-service-landing-page', file: 'app/page.tsx', label: 'Home' },
      { path: '/blog', pageId: 'blog-index-page', file: 'app/blog/page.tsx', label: 'News' },
      {
        path: '/blog/[slug]',
        pageId: 'article-page',
        file: 'app/blog/[slug]/page.tsx',
        label: 'Post',
      },
      { path: '404', pageId: 'error-404-page', file: 'app/not-found.tsx', label: '404' },
    ],
  },
  {
    id: 'marketplace',
    tier: 'pro',
    name: 'Marketplace',
    category: 'Landing Pages',
    palette: 'moss',
    description:
      'Dark olive on warm off-white, built for two audiences at once: search and real listings for buyers, the seller economics below the fold, and a browse route behind it.',
    tags: ['landing page', 'marketplace', 'two-sided', 'search', 'commerce'],
    deps: ['lucide-react'],
    featured: true,
    routes: [
      { path: '/', pageId: 'marketplace-landing-page', file: 'app/page.tsx', label: 'Home' },
      {
        path: '/browse',
        pageId: 'collection-page',
        file: 'app/browse/page.tsx',
        label: 'Browse',
      },
      {
        path: '/products/[slug]',
        pageId: 'product-detail-page',
        file: 'app/products/[slug]/page.tsx',
        label: 'Listing',
      },
      { path: '/login', pageId: 'login-page', file: 'app/login/page.tsx', label: 'Sign in' },
      { path: '404', pageId: 'error-404-page', file: 'app/not-found.tsx', label: '404' },
    ],
  },
  {
    id: 'enterprise',
    tier: 'pro',
    name: 'Enterprise',
    category: 'Landing Pages',
    palette: 'claret',
    description:
      'Burgundy and square corners — the register of things bought in a boardroom. Numbers in the hero, a comparison table that concedes rows, and published prices instead of a sales wall.',
    tags: ['landing page', 'enterprise', 'b2b', 'sales-led', 'procurement'],
    deps: ['lucide-react'],
    featured: true,
    routes: [
      { path: '/', pageId: 'enterprise-landing-page', file: 'app/page.tsx', label: 'Home' },
      { path: '/pricing', pageId: 'pricing-page', file: 'app/pricing/page.tsx', label: 'Pricing' },
      { path: '/login', pageId: 'login-page', file: 'app/login/page.tsx', label: 'Sign in' },
      {
        path: '/settings',
        pageId: 'settings-account-page',
        file: 'app/settings/page.tsx',
        label: 'Settings',
      },
      { path: '404', pageId: 'error-404-page', file: 'app/not-found.tsx', label: '404' },
    ],
  },
  {
    id: 'integration-platform',
    tier: 'pro',
    name: 'Integration Platform',
    category: 'Landing Pages',
    palette: 'cobalt',
    description:
      'High-chroma blue. The connector names in the hero, a catalogue with honest live/beta/planned status, four SDK languages and a dated roadmap for everyone who is not on the list.',
    tags: ['landing page', 'integrations', 'api platform', 'connectors', 'developer'],
    deps: ['lucide-react'],
    routes: [
      {
        path: '/',
        pageId: 'integration-platform-landing-page',
        file: 'app/page.tsx',
        label: 'Home',
      },
      { path: '/docs', pageId: 'docs-page', file: 'app/docs/page.tsx', label: 'Docs' },
      {
        path: '/changelog',
        pageId: 'changelog-page',
        file: 'app/changelog/page.tsx',
        label: 'Changelog',
      },
      { path: '404', pageId: 'error-404-page', file: 'app/not-found.tsx', label: '404' },
    ],
  },
  {
    id: 'creator-course',
    tier: 'pro',
    name: 'Creator Course',
    category: 'Landing Pages',
    palette: 'plum',
    description:
      'Magenta-plum with the softest corners in the set, for one person selling one thing. A student testimonial as the hero, a long instructor section, one price and the refund policy on the page.',
    tags: ['landing page', 'course', 'creator', 'cohort', 'education'],
    deps: ['lucide-react'],
    routes: [
      { path: '/', pageId: 'creator-course-landing-page', file: 'app/page.tsx', label: 'Course' },
      { path: '/blog', pageId: 'blog-index-page', file: 'app/blog/page.tsx', label: 'Journal' },
      {
        path: '/blog/[slug]',
        pageId: 'article-page',
        file: 'app/blog/[slug]/page.tsx',
        label: 'Post',
      },
      { path: '/login', pageId: 'login-page', file: 'app/login/page.tsx', label: 'Sign in' },
      { path: '404', pageId: 'error-404-page', file: 'app/not-found.tsx', label: '404' },
    ],
  },

  /* -- Third wave: composition, not new screens ----------------------- *
   *
   * Five more, and only one of them needed a page written for it.
   *
   * The catalog had reached forty-three pages of which *fourteen* were
   * composed by no template at all — a complete auth suite, both halves of
   * a billing area, an agent's run trace and approval queue, a board, a
   * search screen, and three system pages. Every one of them had been
   * designed, reviewed and shipped, and none of them was reachable by
   * anybody who came looking for a project rather than a screen.
   *
   * So this wave is deliberately assembly. A template's value was never
   * that its pages are new; it is that somebody decided which seven screens
   * a thing needs and where they sit in a route table. Writing five more
   * landing pages would have grown the catalog and left those fourteen
   * exactly as unreachable as they were.
   *
   * After it, every page in the catalog belongs to at least one template.
   * If that stops being true, it is worth asking whether the next wave is
   * five more pages or one more route table.
   */
  {
    id: 'help-centre',
    tier: 'pro',
    name: 'Help Centre',
    category: 'Marketing',
    palette: 'rose',
    description:
      'The support surface, as four routes that agree with each other: searchable answers, the docs, what changed, and a status page carrying the same incident the help page announces.',
    tags: ['help center', 'support', 'knowledge base', 'faq', 'status'],
    deps: ['lucide-react'],
    featured: true,
    routes: [
      { path: '/', pageId: 'help-centre-page', file: 'app/page.tsx', label: 'Help' },
      { path: '/docs', pageId: 'docs-page', file: 'app/docs/page.tsx', label: 'Docs' },
      {
        path: '/changelog',
        pageId: 'changelog-page',
        file: 'app/changelog/page.tsx',
        label: 'Changelog',
      },
      // The status route is the same maintenance window the help page
      // announces in its bar and names in its footer. Three surfaces, one
      // event — see the header of `pages/sources/help-centre-page.tsx`.
      { path: '/status', pageId: 'maintenance-page', file: 'app/status/page.tsx', label: 'Status' },
      { path: '404', pageId: 'error-404-page', file: 'app/not-found.tsx', label: '404' },
    ],
  },
  {
    id: 'agent-console',
    tier: 'pro',
    name: 'Agent Console',
    category: 'Full Product',
    palette: 'slate',
    description:
      'The operator’s half of an agent product: the approval queue it opens on, a run trace with tool calls, retries and cost, and the chat surface behind them.',
    tags: ['ai', 'agent', 'operations', 'approvals', 'observability'],
    deps: ['lucide-react'],
    featured: true,
    routes: [
      // The queue is home, not the run detail. An operator opens this
      // product to find what is waiting on them; a run trace is where they
      // go *from* that, which is why it sits under a dynamic segment.
      { path: '/', pageId: 'approvals-page', file: 'app/page.tsx', label: 'Approvals' },
      {
        path: '/runs/[id]',
        pageId: 'agent-run-page',
        file: 'app/runs/[id]/page.tsx',
        label: 'Run detail',
      },
      { path: '/chat', pageId: 'ai-assistant-page', file: 'app/chat/page.tsx', label: 'Chat' },
      {
        path: '/settings',
        pageId: 'settings-account-page',
        file: 'app/settings/page.tsx',
        label: 'Settings',
      },
      { path: '/login', pageId: 'login-page', file: 'app/login/page.tsx', label: 'Sign in' },
      { path: '404', pageId: 'error-404-page', file: 'app/not-found.tsx', label: '404' },
    ],
  },
  {
    id: 'project-tracker',
    tier: 'pro',
    name: 'Project Tracker',
    category: 'Internal Tools',
    palette: 'fern',
    description:
      'A board, a search that works across it, settings and a sign-in — plus the two screens every internal tool needs and nobody builds: a real 500 boundary and a 404.',
    tags: ['project', 'kanban', 'board', 'internal', 'tracker'],
    deps: ['lucide-react'],
    routes: [
      { path: '/', pageId: 'project-board-page', file: 'app/page.tsx', label: 'Board' },
      { path: '/search', pageId: 'search-page', file: 'app/search/page.tsx', label: 'Search' },
      {
        path: '/settings',
        pageId: 'settings-account-page',
        file: 'app/settings/page.tsx',
        label: 'Settings',
      },
      { path: '/login', pageId: 'login-page', file: 'app/login/page.tsx', label: 'Sign in' },
      /*
       * The 500 ships twice on purpose, and the two copies are not
       * redundant.
       *
       * `app/error.tsx` is what Next actually renders when a segment
       * throws, and it must be a client component taking `{ error, reset }`
       * — a shape no page in a catalog of pages can have. That file is
       * authored in `files/project-tracker/` and wires `reset` to the retry
       * button.
       *
       * This route is the same screen as an ordinary page, so it can be
       * opened, designed and previewed without breaking the app to see it.
       * Delete it once the design is settled; keep `app/error.tsx`.
       */
      {
        path: '/server-error',
        pageId: 'error-500-page',
        file: 'app/server-error/page.tsx',
        label: 'Server error',
      },
      { path: '404', pageId: 'error-404-page', file: 'app/not-found.tsx', label: '404' },
    ],
  },

  /* -- Account & Access ----------------------------------------------- *
   *
   * TIER. `auth-flow` is the free one, on the same argument that keeps
   * `marketing-site` and `startup-waitlist` free in their categories: a
   * section of the shop window with nothing openable in it converts worse
   * than one with a single good example, and this is a new section. It is
   * also the better of the two to give away — six auth screens are what
   * somebody searches for at eleven at night a fortnight before launch,
   * and a person who finds them free is in the catalog rather than in a
   * competitor's.
   *
   * The rule this follows, rather than the count it produces: exactly one
   * free template in each category a stranger is likely to land in first —
   * Marketing, Landing Pages, and now this one — and never a second in the
   * same category, because an openable example is satisfied by one and not
   * improved by six. Full Product, Internal Tools and Commerce carry none:
   * nobody arrives at an admin panel by accident.
   */
  {
    id: 'auth-flow',
    tier: 'free',
    name: 'Auth Flow',
    category: 'Account & Access',
    palette: 'midnight',
    description:
      'Every screen between a stranger and a working account: sign in, sign up, reset, the second factor, SSO by email domain, and the first-run setup on the other side.',
    tags: ['auth', 'sign in', 'sign up', 'two factor', 'sso'],
    deps: ['lucide-react'],
    featured: true,
    // The card shows the sign-*up* screen although `/` is sign-in. A login
    // card is a small box centred in a lot of nothing — accurate, and it
    // makes the tile look empty next to its neighbours in the grid. The
    // split screen is the same template photographed from a better angle.
    previewPageId: 'signup-page',
    routes: [
      { path: '/', pageId: 'login-page', file: 'app/page.tsx', label: 'Sign in' },
      { path: '/signup', pageId: 'signup-page', file: 'app/signup/page.tsx', label: 'Sign up' },
      {
        path: '/forgot',
        pageId: 'forgot-password-page',
        file: 'app/forgot/page.tsx',
        label: 'Reset',
      },
      {
        path: '/two-factor',
        pageId: 'two-factor-page',
        file: 'app/two-factor/page.tsx',
        label: 'Two-factor',
      },
      { path: '/sso', pageId: 'sso-login-page', file: 'app/sso/page.tsx', label: 'SSO' },
      // The last screen of an auth flow is not the sign-in that worked, it
      // is the empty workspace behind it. Shipping the flow without it is
      // where most auth starters stop and most products lose the account.
      {
        path: '/welcome',
        pageId: 'onboarding-page',
        file: 'app/welcome/page.tsx',
        label: 'Welcome',
      },
      { path: '404', pageId: 'error-404-page', file: 'app/not-found.tsx', label: '404' },
    ],
  },
  {
    id: 'customer-portal',
    tier: 'pro',
    name: 'Customer Portal',
    category: 'Account & Access',
    palette: 'amethyst',
    description:
      'What a paying customer needs and never gets: this period’s usage with the overage rate on it, every invoice as a PDF, the plan, the card — and a 403 that names who can grant what was refused.',
    tags: ['billing', 'invoices', 'usage', 'account', 'self-serve'],
    deps: ['lucide-react'],
    featured: true,
    routes: [
      { path: '/', pageId: 'settings-account-page', file: 'app/page.tsx', label: 'Account' },
      { path: '/usage', pageId: 'usage-page', file: 'app/usage/page.tsx', label: 'Usage' },
      {
        path: '/invoices',
        pageId: 'invoices-page',
        file: 'app/invoices/page.tsx',
        label: 'Invoices',
      },
      { path: '/billing', pageId: 'billing-page', file: 'app/billing/page.tsx', label: 'Plan' },
      // A portal is the one product where a 403 is routine rather than
      // exceptional — three of five people who reach it are looking at
      // another team's invoice — so it is a designed route here, not a
      // thrown error.
      {
        path: '/no-access',
        pageId: 'permission-denied-page',
        file: 'app/no-access/page.tsx',
        label: 'No access',
      },
      { path: '/login', pageId: 'login-page', file: 'app/login/page.tsx', label: 'Sign in' },
      { path: '404', pageId: 'error-404-page', file: 'app/not-found.tsx', label: '404' },
    ],
  },
]
