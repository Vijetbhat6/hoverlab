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
  /** Palette id from `./palettes`. Omit for the shared indigo. */
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
   * The four templates in this category are the only ones that set
   * `palette`, and that is the point of the category rather than an
   * implementation detail of it. The seven above are app shells whose whole
   * value is looking like one coherent product; these four are launches
   * that must not look like each other, so each carries its own colour and
   * corner radius from `./palettes.ts`.
   *
   * TIER. `startup-waitlist` is free, on the same argument that keeps
   * `marketing-site` free one category up: this section is where the most
   * casual visitor lands, and a shop window with nothing openable in it
   * converts worse than one with a single good example. The other three are
   * pro. That makes two free templates out of eleven, which is the same
   * ratio the catalog had at seven.
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
]
