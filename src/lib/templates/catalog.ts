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

import type {
  TemplateCategory,
  TemplateRoute,
  TemplateSetPiece,
} from './template-types'
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
  /** The one screen this template is sold on. Required in practice. */
  setPiece?: TemplateSetPiece
  tier?: ArtifactTier
  featured?: boolean
}

export const TEMPLATE_CATALOG: TemplateRecord[] = [
  {
    id: 'saas-starter',
    setPiece: {
      name: 'The signed-in half',
      note: 'Almost every SaaS template stops at the pricing page; this one carries the dashboard, the customer table and the billing screen behind it, so the CTA leads somewhere real.',
      pageId: 'dashboard-overview',
    },
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
    setPiece: {
      name: 'A customer table that survives 10,000 rows',
      note: 'Sortable columns, bulk actions, inline edit and pagination, all in one screen — the part of an internal tool that is genuinely hard and that mockups always draw with six rows.',
      pageId: 'customers-table-page',
    },
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
    setPiece: {
      name: 'A pricing page that answers the objection',
      note: 'Tiers, a comparison table and the FAQ that handles "why is it more than the other one", which is where a pricing page is actually won or lost.',
      pageId: 'pricing-page',
    },
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
    setPiece: {
      name: 'The streaming answer, with its citations',
      note: 'A chat surface that shows where the answer came from while it is still being written — the one screen an assistant product is judged on.',
      pageId: 'ai-assistant-page',
    },
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
    setPiece: {
      name: 'The article at a real measure',
      note: 'Typography set for two thousand words rather than for a hero, with the header, the byline and the reading time doing the work a blog template usually leaves to a plugin.',
      pageId: 'article-page',
    },
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
    setPiece: {
      name: 'The three-column docs frame',
      note: 'Sidebar, article and an on-this-page rail that stays in step with the scroll. The frame never changes per page, which is the whole point of a docs frame and the reason it is worth having once.',
      pageId: 'docs-page',
    },
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
    setPiece: {
      name: 'Checkout, all five screens of it',
      note: 'Cart, express payment, form, confirmation and the order in the account — the sequence where commerce templates usually ship two screens and a gap.',
      pageId: 'checkout-page',
    },
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
    setPiece: {
      name: 'The waitlist hero with the count on it',
      note: 'One field, one button, and a number beside it that makes the page an argument rather than a form. The four-state submission machine is already wired.',
      pageId: 'waitlist-landing-page',
    },
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
    setPiece: {
      name: 'The terminal hero, typing the install',
      note: 'A prompt and its output instead of a product screenshot — the one hero shape a developer audience reads as evidence rather than as marketing.',
      pageId: 'developer-tool-landing-page',
    },
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
    setPiece: {
      name: 'The store-badge download hero',
      note: 'Device frame, both store badges and the rating strip, sized so the phone does not push the buttons below the fold on a phone.',
      pageId: 'mobile-app-landing-page',
    },
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
    setPiece: {
      name: 'Case studies that name the constraint',
      note: 'Project excerpts written as outcome-and-deadline rather than as adjectives, which is the difference between a portfolio a client can map onto their own problem and one they cannot.',
      pageId: 'agency-landing-page',
    },
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
    setPiece: {
      name: 'Hours, address and phone above the fold',
      note: 'The three facts most visitors to a local business arrive for, treated as a section rather than left to the footer. The cheapest high-value decision on the whole page.',
      pageId: 'local-service-landing-page',
    },
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
    setPiece: {
      name: 'Both sides of the market on one page',
      note: 'Supply and demand addressed in sequence without either one reading as an afterthought — the structural problem every marketplace landing page has and most solve with two separate sites.',
      pageId: 'marketplace-landing-page',
    },
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
    setPiece: {
      name: 'The security posture band',
      note: 'SOC 2, data residency, SSO and the DPA as figures near the top, because in enterprise sales the blocker is procurement rather than the feature list.',
      pageId: 'enterprise-landing-page',
    },
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
    setPiece: {
      name: 'The integration grid, sorted by depth',
      note: 'Not a logo wall: each integration says what it actually syncs and in which direction, which is the question anyone evaluating an integration platform is really asking.',
      pageId: 'integration-platform-landing-page',
    },
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
    setPiece: {
      name: 'The curriculum, module by module',
      note: 'Every lesson listed with its runtime before the price is mentioned. A course page that hides the syllabus is asking for a decision nobody can make.',
      pageId: 'creator-course-landing-page',
    },
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
    setPiece: {
      name: 'Search that answers before the ticket',
      note: 'A help surface built so the article is found rather than the contact form — with the ticket route still there, one scroll down, for when it is not.',
      pageId: 'help-centre-page',
    },
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
    setPiece: {
      name: 'The approval queue, with its run trace',
      note: 'A human-in-the-loop screen where every pending action links to the reasoning that produced it. The screen agent products need and almost nobody ships.',
      pageId: 'approvals-page',
    },
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
    setPiece: {
      name: 'A board that does not lose a card',
      note: 'Columns with counts, a card that carries its own state, and the empty and error screens that a board template usually omits entirely.',
      pageId: 'project-board-page',
    },
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
    setPiece: {
      name: 'Six auth screens, second factor included',
      note: 'Sign-in, sign-up, recovery, reset, SSO and the OTP step — the set every product needs, nobody plans for, and everybody builds a fortnight before launch.',
      pageId: 'signup-page',
    },
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
    setPiece: {
      name: 'The usage meter before the invoice',
      note: 'What was consumed, then what it cost, in that order — which is the order a customer disputing a bill reads it in, and the reverse of how billing screens are usually built.',
      pageId: 'usage-page',
    },
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

  /* ================================================================ *
   *  Templates 22-32 -- the genres everyone else covers
   *
   *  The first twenty-one are SaaS- and app-shaped, because that is
   *  what this catalog was built out of. Every competing library
   *  carries a second group we had nothing in: portfolio, resume,
   *  crypto and fintech, conference, restaurant, property, job board,
   *  newsletter, open source, directory, streaming.
   *
   *  They are NOT the existing templates with the nouns swapped, and
   *  the `setPiece` on each is the test of that: every one names a
   *  screen that only its genre has, and six of them needed a block
   *  written before the template could be honest -- the menu as a bill
   *  of fare, the agenda across tracks, the price rail, the map beside
   *  the results, the CV that prints, the watch screen. A template
   *  whose set piece is 'a hero and a pricing table' is a palette
   *  change, not a template.
   * ================================================================ */
  {
    id: 'developer-portfolio',
    tier: 'pro',
    name: 'Developer Portfolio',
    category: 'Marketing',
    palette: 'phosphor',
    setPiece: {
      name: 'The terminal that introduces you',
      note: 'A prompt and its output instead of a gradient and an adjective — and below it a real rate limiter with its test, because a portfolio that only links to repositories asks a hiring manager to go and judge for themselves, and almost none of them do.',
      pageId: 'developer-portfolio-page',
    },
    description:
      'An engineer’s site rather than a designer’s: a terminal hero, thirty legible lines of real code on the home page, the projects, the writing and a CV that prints.',
    tags: ['portfolio', 'developer', 'personal', 'engineer', 'hire me'],
    deps: ['lucide-react'],
    featured: true,
    routes: [
      { path: '/', pageId: 'developer-portfolio-page', file: 'app/page.tsx', label: 'Home' },
      { path: '/projects', pageId: 'portfolio-index-page-02', file: 'app/projects/page.tsx', label: 'Projects' },
      { path: '/writing', pageId: 'blog-index-page', file: 'app/writing/page.tsx', label: 'Writing' },
      { path: '/writing/[slug]', pageId: 'article-page', file: 'app/writing/[slug]/page.tsx', label: 'Post' },
      { path: '/cv', pageId: 'resume-page', file: 'app/cv/page.tsx', label: 'CV' },
      { path: '/about', pageId: 'about-page-02', file: 'app/about/page.tsx', label: 'About' },
      { path: '/contact', pageId: 'contact-page-02', file: 'app/contact/page.tsx', label: 'Contact' },
      { path: '404', pageId: 'error-404-page', file: 'app/not-found.tsx', label: '404' },
    ],
  },
  {
    id: 'personal-resume',
    tier: 'free',
    name: 'Personal Résumé',
    category: 'Marketing',
    palette: 'linen',
    setPiece: {
      name: 'A CV that prints properly',
      note: 'Most personal sites hide the résumé behind a PDF link, which means the document that decides whether you get a reply is the one artefact nobody updates. Here it is the home page, and the print layer turns it back into the PDF on demand.',
      pageId: 'resume-page',
    },
    description:
      'A minimal personal site whose home page is the CV itself — printable, indexable, and therefore the copy that actually gets maintained. Five routes, warm paper, square corners.',
    tags: ['resume', 'cv', 'personal', 'minimal', 'portfolio'],
    deps: ['lucide-react'],
    routes: [
      { path: '/', pageId: 'resume-page', file: 'app/page.tsx', label: 'Résumé' },
      { path: '/work', pageId: 'portfolio-index-page', file: 'app/work/page.tsx', label: 'Work' },
      { path: '/writing', pageId: 'blog-index-page', file: 'app/writing/page.tsx', label: 'Writing' },
      { path: '/about', pageId: 'about-page', file: 'app/about/page.tsx', label: 'About' },
      { path: '/contact', pageId: 'contact-page', file: 'app/contact/page.tsx', label: 'Contact' },
      { path: '404', pageId: 'error-404-page', file: 'app/not-found.tsx', label: '404' },
    ],
  },
  {
    id: 'crypto-exchange',
    tier: 'pro',
    name: 'Crypto Exchange',
    category: 'Marketing',
    palette: 'vault',
    setPiece: {
      name: 'The live price rail',
      note: 'The one piece of furniture that says "this is a market" before a word of copy is read — and it carries direction as an arrow and a sign as well as a colour, which the real ones mostly do not.',
      pageId: 'crypto-landing-page',
    },
    description:
      'A regulated exchange, front to back: a moving price rail, a public markets screen, the custody facts, the fee schedule and the risk warning as a section rather than as small print.',
    tags: ['crypto', 'fintech', 'exchange', 'trading', 'finance'],
    deps: ['lucide-react'],
    featured: true,
    routes: [
      { path: '/', pageId: 'crypto-landing-page', file: 'app/page.tsx', label: 'Home' },
      { path: '/markets', pageId: 'markets-page', file: 'app/markets/page.tsx', label: 'Markets' },
      { path: '/security', pageId: 'security-landing-page', file: 'app/security/page.tsx', label: 'Security' },
      { path: '/status', pageId: 'status-page', file: 'app/status/page.tsx', label: 'Status' },
      { path: '/legal', pageId: 'legal-page', file: 'app/legal/page.tsx', label: 'Legal' },
      { path: '/login', pageId: 'login-page', file: 'app/login/page.tsx', label: 'Sign in' },
      { path: '/signup', pageId: 'signup-page', file: 'app/signup/page.tsx', label: 'Sign up' },
      { path: '404', pageId: 'error-404-page', file: 'app/not-found.tsx', label: '404' },
    ],
  },
  {
    id: 'conference-site',
    tier: 'pro',
    name: 'Conference Site',
    category: 'Marketing',
    palette: 'marquee',
    setPiece: {
      name: 'The agenda across three tracks',
      note: 'At 14:00 a delegate is choosing between three rooms, and that comparison runs along a row. A month calendar has nowhere to put the track and collapses the choice into "+2 more", which is the exact decision they came to make.',
      pageId: 'schedule-page',
    },
    description:
      'An event site built around a date: the ticket price step-up above the hero, a two-day programme across three tracks, speakers, venue and a code of conduct.',
    tags: ['conference', 'event', 'tickets', 'agenda', 'speakers'],
    deps: ['lucide-react'],
    featured: true,
    routes: [
      { path: '/', pageId: 'event-landing-page', file: 'app/page.tsx', label: 'Home' },
      { path: '/programme', pageId: 'schedule-page', file: 'app/programme/page.tsx', label: 'Programme' },
      { path: '/speakers', pageId: 'team-page-02', file: 'app/speakers/page.tsx', label: 'Speakers' },
      { path: '/venue', pageId: 'contact-page', file: 'app/venue/page.tsx', label: 'Venue' },
      { path: '/faq', pageId: 'faq-page-02', file: 'app/faq/page.tsx', label: 'FAQ' },
      { path: '/conduct', pageId: 'legal-page-02', file: 'app/conduct/page.tsx', label: 'Conduct' },
      { path: '404', pageId: 'error-404-page', file: 'app/not-found.tsx', label: '404' },
    ],
  },
  {
    id: 'restaurant',
    tier: 'pro',
    name: 'Restaurant',
    category: 'Marketing',
    palette: 'laurel',
    setPiece: {
      name: 'The menu, typeset as a bill of fare',
      note: 'Dotted leaders to the price, dietary marks as abbreviations with a key, and prices as strings so "market price" and "9 / 16" still fit. Rendered as a product grid it stops being a menu and starts being a storefront.',
      pageId: 'menu-page',
    },
    description:
      'A dining room’s whole site: hours and phone above the fold, the menu typeset as a bill of fare, a real reservation flow, the room and the way to find it.',
    tags: ['restaurant', 'hospitality', 'menu', 'booking', 'local'],
    deps: ['lucide-react'],
    featured: true,
    routes: [
      { path: '/', pageId: 'restaurant-landing-page', file: 'app/page.tsx', label: 'Home' },
      { path: '/menu', pageId: 'menu-page', file: 'app/menu/page.tsx', label: 'Menu' },
      { path: '/book', pageId: 'reservation-page', file: 'app/book/page.tsx', label: 'Book' },
      { path: '/about', pageId: 'about-page-02', file: 'app/about/page.tsx', label: 'About' },
      { path: '/gallery', pageId: 'gallery-page', file: 'app/gallery/page.tsx', label: 'Gallery' },
      { path: '/contact', pageId: 'contact-page-02', file: 'app/contact/page.tsx', label: 'Find us' },
      { path: '404', pageId: 'error-404-page', file: 'app/not-found.tsx', label: '404' },
    ],
  },
  {
    id: 'estate-agency',
    tier: 'pro',
    name: 'Estate Agency',
    category: 'Marketing',
    palette: 'heath',
    setPiece: {
      name: 'Map and results, scrolling apart',
      note: 'The defining screen of the genre and the one a catalog of marketing sections cannot fake — two panes that scroll independently, with the map explicitly decorative and out of the tab order so nobody tabs every property twice.',
      pageId: 'property-search-page',
    },
    description:
      'Property search with results already in it, a listing page that puts tenure and EPC above the prose, the agents, and a valuation route for the other half of the business.',
    tags: ['real estate', 'property', 'listings', 'search', 'agency'],
    deps: ['lucide-react'],
    routes: [
      { path: '/', pageId: 'property-search-page', file: 'app/page.tsx', label: 'Search' },
      { path: '/property/[slug]', pageId: 'property-detail-page', file: 'app/property/[slug]/page.tsx', label: 'Property' },
      { path: '/agents', pageId: 'team-page', file: 'app/agents/page.tsx', label: 'Agents' },
      { path: '/valuation', pageId: 'contact-page-02', file: 'app/valuation/page.tsx', label: 'Valuation' },
      { path: '/about', pageId: 'about-page', file: 'app/about/page.tsx', label: 'About' },
      { path: '404', pageId: 'error-404-page', file: 'app/not-found.tsx', label: '404' },
    ],
  },
  {
    id: 'job-board',
    tier: 'pro',
    name: 'Job Board',
    category: 'Marketing',
    palette: 'foundry',
    setPiece: {
      name: 'Salary on every row, grouped by craft',
      note: 'A flat list of forty roles makes every candidate read forty; grouped by craft a designer reads three. And a board whose listings say "competitive" is the same board as every other one — the rule is the product.',
      pageId: 'job-board-page',
    },
    description:
      'A two-sided board where candidates get the whole site and employers get one section and a price. Listings grouped by craft, each with a real salary range and the interview process published.',
    tags: ['job board', 'hiring', 'careers', 'marketplace', 'jobs'],
    deps: ['lucide-react'],
    routes: [
      { path: '/', pageId: 'job-board-page', file: 'app/page.tsx', label: 'Board' },
      { path: '/jobs/[slug]', pageId: 'job-detail-page', file: 'app/jobs/[slug]/page.tsx', label: 'Listing' },
      { path: '/post', pageId: 'single-offer-page', file: 'app/post/page.tsx', label: 'Post a job' },
      { path: '/search', pageId: 'search-page', file: 'app/search/page.tsx', label: 'Search' },
      { path: '/faq', pageId: 'faq-page', file: 'app/faq/page.tsx', label: 'FAQ' },
      { path: '404', pageId: 'error-404-page', file: 'app/not-found.tsx', label: '404' },
    ],
  },
  {
    id: 'newsletter',
    tier: 'free',
    name: 'Newsletter',
    category: 'Landing Pages',
    palette: 'tideline',
    setPiece: {
      name: 'The archive, above the testimonials',
      note: 'Nobody subscribes to a description of a newsletter; they subscribe after reading one issue and wanting the next. So the back issues sit high on the page with headlines specific enough to be worth clicking on their own.',
      pageId: 'newsletter-landing-page',
    },
    description:
      'One decision, made from the archive: a hero with the field in it, the back issues as the actual argument, and the three worries about handing over an address answered as content.',
    tags: ['newsletter', 'email', 'subscribe', 'writing', 'archive'],
    deps: ['lucide-react'],
    routes: [
      { path: '/', pageId: 'newsletter-landing-page', file: 'app/page.tsx', label: 'Home' },
      { path: '/archive', pageId: 'blog-index-page', file: 'app/archive/page.tsx', label: 'Archive' },
      { path: '/archive/[slug]', pageId: 'article-page', file: 'app/archive/[slug]/page.tsx', label: 'Issue' },
      { path: '/about', pageId: 'about-page', file: 'app/about/page.tsx', label: 'About' },
      { path: '/sponsor', pageId: 'single-offer-page', file: 'app/sponsor/page.tsx', label: 'Sponsor' },
      { path: '404', pageId: 'error-404-page', file: 'app/not-found.tsx', label: '404' },
    ],
  },
  {
    id: 'open-source',
    tier: 'free',
    name: 'Open Source Project',
    category: 'Marketing',
    palette: 'carbon',
    setPiece: {
      name: 'The install command, before anything else',
      note: 'The reader has already decided the category is interesting and wants two things in order: the command, and enough code to judge the API. Everything a SaaS page opens with costs them a scroll and buys nothing.',
      pageId: 'oss-landing-page',
    },
    description:
      'A project site for a library: install command above the hero, the API in twenty lines, docs, changelog, roadmap, community, and who funds it said plainly.',
    tags: ['open source', 'oss', 'library', 'developer tool', 'docs'],
    deps: ['lucide-react'],
    routes: [
      { path: '/', pageId: 'oss-landing-page', file: 'app/page.tsx', label: 'Home' },
      { path: '/docs', pageId: 'docs-page', file: 'app/docs/page.tsx', label: 'Docs' },
      { path: '/changelog', pageId: 'changelog-page', file: 'app/changelog/page.tsx', label: 'Changelog' },
      { path: '/roadmap', pageId: 'roadmap-page', file: 'app/roadmap/page.tsx', label: 'Roadmap' },
      { path: '/community', pageId: 'community-page', file: 'app/community/page.tsx', label: 'Community' },
      { path: '/sponsor', pageId: 'pricing-page', file: 'app/sponsor/page.tsx', label: 'Sponsor' },
      { path: '404', pageId: 'error-404-page', file: 'app/not-found.tsx', label: '404' },
    ],
  },
  {
    id: 'directory',
    tier: 'pro',
    name: 'Directory',
    category: 'Marketing',
    palette: 'mulberry',
    setPiece: {
      name: 'Facets that are not categories',
      note: 'Pricing model, hosting and compliance — the filters a buyer actually uses. Category is the one every directory leads with and nobody filters by, because the reader already knows the category; it is why they are here.',
      pageId: 'directory-index-page',
    },
    description:
      'A faceted index with a listing page that compares each entry against its alternatives, a paid submission route, and a published removal rate.',
    tags: ['directory', 'listings', 'index', 'facets', 'marketplace'],
    deps: ['lucide-react'],
    routes: [
      { path: '/', pageId: 'directory-index-page', file: 'app/page.tsx', label: 'Index' },
      { path: '/listing/[slug]', pageId: 'directory-listing-page', file: 'app/listing/[slug]/page.tsx', label: 'Listing' },
      { path: '/search', pageId: 'search-page', file: 'app/search/page.tsx', label: 'Search' },
      { path: '/submit', pageId: 'single-offer-page', file: 'app/submit/page.tsx', label: 'Submit' },
      { path: '/about', pageId: 'about-page-02', file: 'app/about/page.tsx', label: 'About' },
      { path: '404', pageId: 'error-404-page', file: 'app/not-found.tsx', label: '404' },
    ],
  },
  {
    id: 'streaming',
    tier: 'pro',
    name: 'Streaming Service',
    category: 'Marketing',
    palette: 'nocturne',
    setPiece: {
      name: 'The watch screen, on the marketing page',
      note: 'Everyone else shows a device montage. Putting the actual player — ratio-locked stage, control bar down to the buffered layer, up-next rail — on the page that sells the subscription answers "what is this like to use" without a trial.',
      pageId: 'watch-page',
    },
    description:
      'A subscription video service: catalogue rails, a real watch screen with chapters and a transcript, one plan at one price, and the account behind it.',
    tags: ['streaming', 'video', 'subscription', 'media', 'catalogue'],
    deps: ['lucide-react'],
    featured: true,
    routes: [
      { path: '/', pageId: 'streaming-landing-page', file: 'app/page.tsx', label: 'Home' },
      { path: '/watch/[slug]', pageId: 'watch-page', file: 'app/watch/[slug]/page.tsx', label: 'Watch' },
      { path: '/plans', pageId: 'pricing-page', file: 'app/plans/page.tsx', label: 'Plans' },
      { path: '/login', pageId: 'login-page', file: 'app/login/page.tsx', label: 'Sign in' },
      { path: '/account', pageId: 'settings-account-page', file: 'app/account/page.tsx', label: 'Account' },
      { path: '404', pageId: 'error-404-page', file: 'app/not-found.tsx', label: '404' },
    ],
  },
]
