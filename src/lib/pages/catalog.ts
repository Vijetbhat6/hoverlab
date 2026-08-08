/**
 * Hand-authored metadata for every page.
 *
 * Same split as the block catalog: source text lives in `./sources/*.tsx`
 * and is inlined at build time by `scripts/build-artifact-sources.mjs`, and
 * a page's `id` must equal its source filename.
 *
 * `composedOf` lists the block ids each page renders. It is not decoration:
 * the page detail route resolves those ids against the block index to build
 * the drill-down rail, and `scripts/build-artifact-sources.mjs` will not
 * catch a wrong id here — the page would simply show a short rail. Keep it
 * in step with what the source actually imports.
 */

import type { PageCategory } from './page-types'
import type { ArtifactTier } from '../artifact-types'

/** Metadata as authored — everything about a page except its source. */
export interface PageRecord {
  id: string
  name: string
  category: PageCategory
  description: string
  tags: string[]
  previewComponent: string
  deps: string[]
  /** Block ids the source imports, in render order. */
  composedOf: string[]
  tier?: ArtifactTier
  featured?: boolean
  darkSurface?: boolean
}

export const PAGE_CATALOG: PageRecord[] = [
  {
    id: 'saas-landing-page',
    name: 'SaaS Landing Page',
    category: 'Marketing Pages',
    description:
      'A complete marketing page in the order that actually converts — hook, proof, substance, price, objections, exit. Nine blocks plus a hero.',
    tags: ['landing page', 'saas', 'marketing', 'homepage', 'conversion'],
    previewComponent: 'saas-landing-page',
    deps: ['lucide-react'],
    composedOf: [
      'logo-cloud',
      'bento-features',
      'persona-cards',
      'code-showcase',
      'testimonial-grid',
      'pricing-tiers',
      'comparison-table',
      'faq-accordion',
      'community-band',
    ],
    featured: true,
  },
  {
    id: 'pricing-page',
    name: 'Pricing Page',
    category: 'Marketing Pages',
    description:
      'Plans, a feature matrix and a pricing-specific FAQ written to remove the last purchase objection rather than answer general questions.',
    tags: ['pricing', 'plans', 'billing', 'comparison', 'faq'],
    previewComponent: 'pricing-page',
    deps: ['lucide-react'],
    composedOf: ['pricing-tiers', 'comparison-table', 'faq-accordion'],
    featured: true,
  },
  {
    id: 'dashboard-overview',
    name: 'Dashboard Overview',
    category: 'App Screens',
    description:
      'The screen an app opens on: shell, header, KPI row, chart and activity feed — numbers first, shape second, changes last.',
    tags: ['dashboard', 'overview', 'admin', 'analytics', 'home'],
    previewComponent: 'dashboard-overview',
    deps: ['lucide-react'],
    composedOf: [
      'dashboard-shell',
      'dashboard-page-header',
      'dashboard-stat-cards',
      'bar-chart-panel',
      'dashboard-activity-feed',
    ],
    featured: true,
  },
  {
    id: 'customers-table-page',
    name: 'Customer List Screen',
    category: 'App Screens',
    description:
      'The canonical CRUD list — header, toolbar, sortable table and pagination framed as one panel instead of three stacked cards.',
    tags: ['list', 'table', 'crud', 'customers', 'admin'],
    previewComponent: 'customers-table-page',
    deps: ['lucide-react'],
    composedOf: [
      'dashboard-shell',
      'dashboard-page-header',
      'data-table-toolbar',
      'data-table-sortable',
      'data-table-pagination',
    ],
    featured: true,
  },
  {
    id: 'settings-account-page',
    name: 'Account Settings',
    category: 'Account & Billing',
    description:
      'Profile, team, API keys and danger zone in one screen — with the destructive panel last, well away from the everyday controls.',
    tags: ['settings', 'account', 'profile', 'team', 'api keys'],
    previewComponent: 'settings-account-page',
    deps: ['lucide-react'],
    composedOf: [
      'settings-nav-layout',
      'settings-profile-form',
      'settings-team-members',
      'settings-api-keys',
      'settings-danger-zone',
    ],
  },
  {
    id: 'billing-page',
    name: 'Billing & Usage Screen',
    category: 'Account & Billing',
    description:
      'Plan, quota meters and invoice history, with the upgrade prompt placed beside a bar that is nearly full rather than on the plan card.',
    tags: ['billing', 'usage', 'invoices', 'subscription', 'quota'],
    previewComponent: 'billing-page',
    deps: ['lucide-react'],
    composedOf: [
      'dashboard-shell',
      'dashboard-page-header',
      'billing-plan-summary',
      'usage-meter-panel',
      'invoice-history-table',
    ],
    featured: true,
  },
  {
    id: 'login-page',
    name: 'Sign-In Screen',
    category: 'Auth Screens',
    description:
      'A full auth page that deliberately contains almost nothing but the form — no nav, no marketing, nothing competing with the one job.',
    tags: ['login', 'sign in', 'auth', 'authentication'],
    previewComponent: 'login-page',
    deps: ['lucide-react'],
    composedOf: ['auth-login-card'],
  },
  {
    id: 'error-404-page',
    name: '404 Page',
    category: 'System Pages',
    description:
      'Drops straight into app/not-found.tsx, and keeps the site header and footer — on a 404 the navigation is the most useful thing on screen.',
    tags: ['404', 'not found', 'error', 'system'],
    previewComponent: 'error-404-page',
    deps: ['lucide-react'],
    composedOf: ['not-found-404'],
  },

  /* ---------------------------- Commerce -------------------------- */
  {
    id: 'collection-page',
    name: 'Product Collection',
    category: 'Commerce Pages',
    description:
      'Sticky filter sidebar, sort toolbar and product grid — with the facets dropped rather than stacked on mobile, so a shopping page does not open as a form.',
    tags: ['collection', 'category', 'shop', 'products', 'filters'],
    previewComponent: 'collection-page',
    deps: ['lucide-react'],
    composedOf: [
      'product-filter-sidebar',
      'collection-toolbar',
      'product-grid',
      'product-rail',
    ],
    featured: true,
  },
  {
    id: 'product-detail-page',
    name: 'Product Detail',
    category: 'Commerce Pages',
    description:
      'Gallery, sticky buy box, details accordion and reviews — ordered by what a shopper needs before they can decide.',
    tags: ['product', 'pdp', 'detail', 'reviews', 'shop'],
    previewComponent: 'product-detail-page',
    deps: ['lucide-react'],
    composedOf: [
      'product-gallery',
      'product-buy-box',
      'product-info-accordion',
      'product-review-summary',
      'review-list',
      'product-rail',
    ],
    featured: true,
  },
  {
    id: 'cart-page',
    name: 'Shopping Bag',
    category: 'Commerce Pages',
    description:
      'Editable lines beside a sticky summary, so the total and the checkout button survive a scroll through four quantity changes.',
    tags: ['cart', 'bag', 'basket', 'checkout', 'shop'],
    previewComponent: 'cart-page',
    deps: ['lucide-react'],
    composedOf: ['cart-line-items', 'order-summary-panel', 'product-rail'],
  },
  {
    id: 'checkout-page',
    name: 'Checkout',
    category: 'Commerce Pages',
    description:
      'Address and payment with the site navigation stripped and the order summary moved above the form on mobile — both aimed squarely at completion rate.',
    tags: ['checkout', 'payment', 'conversion', 'shop', 'form'],
    previewComponent: 'checkout-page',
    deps: ['lucide-react'],
    composedOf: ['checkout-form', 'order-summary-panel'],
    featured: true,
  },
  {
    id: 'order-confirmation-page',
    name: 'Order Confirmed',
    category: 'Commerce Pages',
    description:
      'The post-purchase screen, with navigation restored and a rail that shows what to buy next rather than what was just bought.',
    tags: ['confirmation', 'thank you', 'receipt', 'post purchase', 'shop'],
    previewComponent: 'order-confirmation-page',
    deps: ['lucide-react'],
    composedOf: ['order-confirmation', 'product-rail'],
  },
  {
    id: 'account-orders-page',
    name: 'Account Orders',
    category: 'Commerce Pages',
    description:
      'Order history in the settings shell rather than a second sidebar layout — an account area and a settings area are the same shape.',
    tags: ['account', 'orders', 'history', 'customer', 'shop'],
    previewComponent: 'account-orders-page',
    deps: ['lucide-react'],
    composedOf: ['settings-nav-layout', 'order-history-list'],
  },
]
