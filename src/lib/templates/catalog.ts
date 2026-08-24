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
]
