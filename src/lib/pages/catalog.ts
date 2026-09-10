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
      'A complete marketing page in the order that actually converts — hook, proof, substance, price, objections, exit. Twelve blocks, navbar and footer included.',
    tags: ['landing page', 'saas', 'marketing', 'homepage', 'conversion'],
    previewComponent: 'saas-landing-page',
    deps: ['lucide-react'],
    composedOf: [
      'navbar-simple',
      'hero-centered',
      'logo-cloud',
      'bento-features',
      'persona-cards',
      'code-showcase',
      'testimonial-grid',
      'pricing-tiers',
      'comparison-table',
      'faq-accordion',
      'community-band',
      'footer-mega',
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
  /* ------------------------------------------------------------------ *
   *  Landing pages
   * ------------------------------------------------------------------ *
   *
   * Four more of the same category as `saas-landing-page`, and the reason
   * they are separate pages rather than props on that one is that the
   * running order IS the page. A waitlist page is not the SaaS page with
   * pricing deleted — it opens on a single input, proves momentum instead
   * of adoption, and closes on the same ask it opened with. Parameterising
   * that would mean a `variant` prop with four branches in every section,
   * which is how a catalog of readable files turns into a framework.
   *
   * Each pairs with a template in `lib/templates/catalog.ts` that carries a
   * matching palette, so the colour and the structure change together.
   */
  {
    id: 'waitlist-landing-page',
    name: 'Waitlist Landing Page',
    category: 'Marketing Pages',
    description:
      'A pre-launch page for a product you cannot buy yet: one email field, scarcity instead of adoption, and no pricing section to be held to later.',
    tags: ['landing page', 'waitlist', 'pre-launch', 'startup', 'early access'],
    previewComponent: 'waitlist-landing-page',
    deps: ['lucide-react'],
    composedOf: [
      'navbar-simple',
      'hero-waitlist',
      'logo-strip',
      'stats-band',
      'feature-icon-grid',
      'testimonial-spotlight',
      'faq-two-column',
      'cta-split-panel',
      'footer-minimal',
    ],
    featured: true,
  },
  {
    id: 'developer-tool-landing-page',
    name: 'Developer Tool Landing Page',
    category: 'Marketing Pages',
    description:
      'Install command first, real code before any prose, and a usage calculator instead of tiers — the order a developer actually scans in.',
    tags: ['landing page', 'developer tool', 'api', 'cli', 'devtools'],
    previewComponent: 'developer-tool-landing-page',
    deps: ['lucide-react'],
    composedOf: [
      'navbar-simple',
      'hero-terminal',
      'logo-grid',
      'code-showcase',
      'feature-rows',
      'integration-grid',
      'pricing-usage-calculator',
      'faq-grid',
      'footer-status-locale',
    ],
    featured: true,
  },
  {
    id: 'mobile-app-landing-page',
    name: 'Mobile App Landing Page',
    category: 'Marketing Pages',
    description:
      'Store badges above the fold, the App Store rating as the first proof, and a single price — a page with one job, which is the install.',
    tags: ['landing page', 'mobile app', 'ios', 'android', 'consumer'],
    previewComponent: 'mobile-app-landing-page',
    deps: ['lucide-react'],
    composedOf: [
      'navbar-simple',
      'hero-app-download',
      'testimonial-ratings',
      'feature-tabs',
      'stats-band',
      'pricing-single',
      'faq-accordion',
      'cta-inline-card',
      'footer-newsletter',
    ],
  },
  {
    id: 'agency-landing-page',
    name: 'Agency Landing Page',
    category: 'Marketing Pages',
    description:
      'A studio site: full-bleed hero, client list, engagements described as engagements, and the actual team — with no pricing, on purpose.',
    tags: ['landing page', 'agency', 'studio', 'portfolio', 'services'],
    previewComponent: 'agency-landing-page',
    deps: ['lucide-react'],
    composedOf: [
      'navbar-simple',
      'hero-media-overlay',
      'logo-cloud',
      'stats-narrative',
      'feature-rows',
      'team-grid',
      'testimonial-spotlight',
      'cta-split-panel',
      'footer-minimal',
    ],
  },
  {
    id: 'local-service-landing-page',
    name: 'Local Service Landing Page',
    category: 'Marketing Pages',
    description:
      'A booking widget above the fold, every price published including the awkward ones, and a footer carrying the registrations a regulated trade must show.',
    tags: ['landing page', 'local business', 'booking', 'service', 'appointments'],
    previewComponent: 'local-service-landing-page',
    deps: ['lucide-react'],
    composedOf: [
      'navbar-simple',
      'hero-booking',
      'stats-band',
      'persona-cards',
      'testimonial-grid',
      'comparison-table',
      'faq-categorized',
      'contact-form-split',
      'footer-compliance',
    ],
    featured: true,
  },
  {
    id: 'marketplace-landing-page',
    name: 'Marketplace Landing Page',
    category: 'Marketing Pages',
    description:
      'Two audiences, one page: a search field and real listings for buyers up top, the seller economics below, and a searchable FAQ because they ask different things.',
    tags: ['landing page', 'marketplace', 'two-sided', 'search', 'sellers'],
    previewComponent: 'marketplace-landing-page',
    deps: ['lucide-react'],
    composedOf: [
      'navbar-simple',
      'hero-search',
      'logo-segments',
      'product-rail',
      'stats-comparison',
      'testimonial-carousel',
      'faq-search',
      'cta-split-panel',
      'footer-mega',
    ],
    featured: true,
  },
  {
    id: 'enterprise-landing-page',
    name: 'Enterprise Landing Page',
    category: 'Marketing Pages',
    description:
      'Built for a champion assembling an internal case: numbers in the hero, a comparison that concedes two rows, video references, and published prices instead of a sales wall.',
    tags: ['landing page', 'enterprise', 'b2b', 'sales-led', 'procurement'],
    previewComponent: 'enterprise-landing-page',
    deps: ['lucide-react'],
    composedOf: [
      'navbar-mega-menu',
      'hero-metrics',
      'logo-cloud',
      'bento-features',
      'comparison-table',
      'testimonial-video',
      'stats-timeline',
      'pricing-tiers',
      'cta-split-panel',
      'footer-compliance',
    ],
  },
  {
    id: 'integration-platform-landing-page',
    name: 'Integration Platform Landing Page',
    category: 'Marketing Pages',
    description:
      'The connector names in the hero, a catalogue with honest live/beta/planned status, four SDK languages, credit pricing, and a dated roadmap for everyone who is not on the list.',
    tags: ['landing page', 'integrations', 'api platform', 'connectors', 'developer'],
    previewComponent: 'integration-platform-landing-page',
    deps: ['lucide-react'],
    composedOf: [
      'navbar-simple',
      'hero-integrations',
      'integration-grid',
      'code-tabs-panel',
      'feature-rows',
      'pricing-credits',
      'roadmap-columns',
      'faq-grid',
      'footer-mega',
    ],
  },
  {
    id: 'creator-course-landing-page',
    name: 'Creator Course Landing Page',
    category: 'Marketing Pages',
    description:
      'One person selling one course: a student testimonial as the hero because a course cannot demo, a long instructor section, one price and a refund policy on the page.',
    tags: ['landing page', 'course', 'creator', 'cohort', 'education'],
    previewComponent: 'creator-course-landing-page',
    deps: ['lucide-react'],
    composedOf: [
      'navbar-simple',
      'hero-testimonial',
      'logo-strip',
      'feature-icon-grid',
      'feature-tabs',
      'team-grid',
      'pricing-single',
      'faq-accordion',
      'cta-inline-card',
      'footer-minimal',
    ],
  },
  {
    id: 'blog-index-page',
    name: 'Blog Index',
    category: 'Marketing Pages',
    description:
      'The post grid, a subscribe ask that comes after the proof, and a minimal footer — no hero, because the featured post already is one.',
    tags: ['blog', 'content', 'posts', 'index', 'marketing'],
    previewComponent: 'blog-index-page',
    deps: ['lucide-react'],
    composedOf: [
      'navbar-simple',
      'blog-post-grid',
      'newsletter-signup',
      'footer-minimal',
    ],
    featured: true,
  },
  {
    id: 'article-page',
    name: 'Article Page',
    category: 'Marketing Pages',
    description:
      'A single post: header, byline and opening prose in one reading column, with the subscribe form after the article — at the only moment it converts.',
    tags: ['article', 'blog post', 'reading', 'editorial', 'content'],
    previewComponent: 'article-page',
    deps: ['lucide-react'],
    composedOf: [
      'navbar-simple',
      'article-header',
      'newsletter-signup',
      'footer-minimal',
    ],
  },
  {
    id: 'careers-page',
    name: 'Careers Page',
    category: 'Marketing Pages',
    description:
      'Team first, openings second, then the questions candidates only ask after an offer — answered while they can still change who applies.',
    tags: ['careers', 'jobs', 'hiring', 'team', 'about'],
    previewComponent: 'careers-page',
    deps: ['lucide-react'],
    composedOf: [
      'navbar-simple',
      'team-grid',
      'job-listing-board',
      'faq-accordion',
      'cta-split-panel',
      'footer-minimal',
    ],
  },
  {
    id: 'docs-page',
    name: 'Documentation Page',
    category: 'Marketing Pages',
    description:
      'The site navbar over the three-column docs frame. In your project this is one catch-all route — the slug picks the article, the frame never changes.',
    tags: ['docs', 'documentation', 'developer', 'guides', 'reference'],
    previewComponent: 'docs-page',
    deps: ['lucide-react'],
    composedOf: ['navbar-simple', 'docs-layout'],
    featured: true,
  },
  {
    id: 'help-centre-page',
    name: 'Help Centre',
    category: 'Marketing Pages',
    description:
      'Search first, the six answers that absorb the most contact volume under it, and the ticket form in plain sight rather than behind a modal — a support page measured in tickets not filed.',
    // Both spellings, deliberately. The prose here is British and the page
    // is filed as one; the phrase somebody types into a search box is not.
    tags: ['help center', 'help centre', 'support', 'faq', 'knowledge base'],
    previewComponent: 'help-centre-page',
    deps: ['lucide-react'],
    composedOf: [
      'announcement-bar',
      'navbar-simple',
      'hero-search',
      'faq-grid',
      'feedback-widget',
      'support-ticket-form',
      'footer-status-locale',
    ],
    featured: true,
  },
  {
    id: 'changelog-page',
    name: 'Changelog Page',
    category: 'Marketing Pages',
    description:
      'The release timeline with the site chrome kept on, and the one subscribe form on the site that is not a detour — "tell me when this page changes" is exactly what it promises.',
    tags: ['changelog', 'releases', 'updates', 'whats new', 'developer'],
    previewComponent: 'changelog-page',
    deps: ['lucide-react'],
    composedOf: [
      'navbar-simple',
      'changelog-timeline',
      'newsletter-signup',
      'footer-minimal',
    ],
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
    id: 'ai-assistant-page',
    name: 'AI Assistant Screen',
    category: 'App Screens',
    description:
      'An agent working inside a real app: a transcript down the middle — reasoning, answer, then the one card that can act — with what it may read and what it noticed demoted to a rail.',
    tags: ['assistant', 'agent', 'chat', 'copilot', 'ai'],
    previewComponent: 'ai-assistant-page',
    deps: ['lucide-react'],
    composedOf: [
      'dashboard-shell',
      'agent-thinking-trace',
      'chat-streaming-answer',
      'approval-request-card',
      'chat-prompt-bar',
      'ai-insight-cards',
      'knowledge-source-picker',
    ],
    featured: true,
  },
  {
    id: 'project-board-page',
    name: 'Project Board',
    category: 'App Screens',
    description:
      'A kanban board inside the app shell, with tabs that admit the board is one view among several and a header whose primary action is creating work.',
    tags: ['kanban', 'board', 'project', 'tasks', 'app'],
    previewComponent: 'project-board-page',
    deps: ['lucide-react'],
    composedOf: ['dashboard-shell', 'dashboard-page-header', 'kanban-board'],
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

  /* -- Auth screens ------------------------------------------------- *
   * One login page covered four flows worth of category. These are the
   * screens a real product ships beside it, and each pairs its primary
   * action with the recovery route that stops it becoming a lockout.
   */
  {
    id: 'signup-page',
    name: 'Signup Page',
    category: 'Auth Screens',
    description:
      'The signup form with the proof under it rather than above it — the person who arrived here has already decided, and scrolling past testimonials is friction applied to the wrong reader.',
    tags: ['signup', 'register', 'auth', 'conversion', 'account'],
    previewComponent: 'signup-page',
    deps: ['lucide-react'],
    composedOf: ['auth-signup-split', 'logo-cloud', 'testimonial-ratings'],
  },
  {
    id: 'forgot-password-page',
    name: 'Forgot Password',
    category: 'Auth Screens',
    description:
      'Password reset, plus the magic link beside it — the moment after a password has failed is when somebody is most willing to stop using one.',
    tags: ['password', 'reset', 'recovery', 'auth', 'magic link'],
    previewComponent: 'forgot-password-page',
    deps: ['lucide-react'],
    composedOf: ['auth-forgot-password', 'auth-magic-link-form'],
  },
  {
    id: 'two-factor-page',
    name: 'Two-Factor Challenge',
    category: 'Auth Screens',
    description:
      'The second factor with its fallback on the same screen, because a 2FA prompt with no recovery route is a lockout screen wearing a security screen.',
    tags: ['2fa', 'mfa', 'otp', 'auth', 'security'],
    previewComponent: 'two-factor-page',
    deps: ['lucide-react'],
    composedOf: ['auth-two-factor', 'auth-otp-verify'],
  },
  {
    id: 'sso-login-page',
    name: 'SSO Sign In',
    category: 'Auth Screens',
    description:
      'A domain field for the employee who signs in daily, and the capability detail below the fold for the IT reviewer who reads it once.',
    tags: ['sso', 'saml', 'enterprise', 'auth', 'login'],
    previewComponent: 'sso-login-page',
    deps: ['lucide-react'],
    composedOf: ['auth-sso-domain', 'sso-enterprise-split'],
  },

  /* -- System pages ------------------------------------------------- *
   * The pages nobody designs and everybody sees. A 500 is our problem
   * and a 404 is the visitors, which is why they are shaped differently.
   */
  {
    id: 'error-500-page',
    name: 'Server Error',
    category: 'System Pages',
    description:
      'Retry first, because a 500 is our failure and offering navigation implies the rest of the site works — which is exactly what is in doubt.',
    tags: ['500', 'error', 'outage', 'retry', 'system'],
    previewComponent: 'error-500-page',
    deps: ['lucide-react'],
    composedOf: ['error-state-retry', 'offline-state-banner'],
  },
  {
    id: 'maintenance-page',
    name: 'Scheduled Maintenance',
    category: 'System Pages',
    description:
      'Planned downtime with an actual end time on it — "back soon" is not a time, and a maintenance page without one looks like an outage nobody has noticed.',
    tags: ['maintenance', 'downtime', 'scheduled', 'status', 'system'],
    previewComponent: 'maintenance-page',
    deps: ['lucide-react'],
    composedOf: ['maintenance-window-state', 'footer-status-locale'],
  },
  {
    id: 'permission-denied-page',
    name: 'Permission Denied',
    category: 'System Pages',
    description:
      'A 403 that names who can grant what was refused, because the next question is always "then who can" and a support link is the wrong answer to it.',
    tags: ['403', 'permission', 'access', 'roles', 'system'],
    previewComponent: 'permission-denied-page',
    deps: ['lucide-react'],
    composedOf: ['permission-denied-state', 'settings-team-members'],
  },

  /* -- Account and billing ------------------------------------------ */
  {
    id: 'usage-page',
    name: 'Usage & Limits',
    category: 'Account & Billing',
    description:
      'Consumption in the order the questions arrive: the overage warning first because it is time-critical, then the meters, then what actually happens at each limit.',
    tags: ['usage', 'limits', 'quota', 'billing', 'overage'],
    previewComponent: 'usage-page',
    deps: ['lucide-react'],
    composedOf: [
      'usage-overage-notice',
      'usage-meter-panel',
      'billing-credit-balance',
      'plan-limits-list',
    ],
  },
  {
    id: 'invoices-page',
    name: 'Invoices',
    category: 'Account & Billing',
    description:
      'Billing history laid out for finance rather than for the user — a retrieval screen, so the table leads and the payment method comes last.',
    tags: ['invoices', 'billing', 'receipts', 'finance', 'account'],
    previewComponent: 'invoices-page',
    deps: ['lucide-react'],
    composedOf: ['invoice-history-table', 'billing-invoice-detail', 'payment-method-card'],
  },

  /* -- App screens -------------------------------------------------- */
  {
    id: 'onboarding-page',
    name: 'Onboarding',
    category: 'App Screens',
    description:
      'A wizard for the session someone finishes and a checklist for the one they do not, with the only genuinely blocking step in front of both.',
    tags: ['onboarding', 'setup', 'wizard', 'checklist', 'activation'],
    previewComponent: 'onboarding-page',
    deps: ['lucide-react'],
    composedOf: ['workspace-setup-form', 'setup-wizard', 'onboarding-checklist'],
  },
  {
    id: 'search-page',
    name: 'Search Results',
    category: 'App Screens',
    description:
      'Built around the state a search page is in most of the time — empty — so recent queries lead and the facets sit in a sidebar that survives growing to twelve.',
    tags: ['search', 'results', 'filters', 'facets', 'empty state'],
    previewComponent: 'search-page',
    deps: ['lucide-react'],
    composedOf: [
      'recent-search-list',
      'applied-filters-bar',
      'search-facet-panel',
      'search-results-panel',
    ],
  },
  {
    id: 'agent-run-page',
    name: 'Agent Run Detail',
    category: 'App Screens',
    description:
      'One run opened up in the order you would debug it — intent, actions, the retries that are invisible in both, then cost.',
    tags: ['agent', 'trace', 'debugging', 'observability', 'ai'],
    previewComponent: 'agent-run-page',
    deps: ['lucide-react'],
    composedOf: [
      'agent-thinking-trace',
      'agent-tool-calls',
      'agent-retry-log',
      'agent-cost-breakdown',
    ],
  },
  {
    id: 'approvals-page',
    name: 'Approvals Inbox',
    category: 'App Screens',
    description:
      'The queue, the same queue sorted by how long things have waited, and the policy that decided both — with the policy last so it is not scrolled past forever.',
    tags: ['approvals', 'human in the loop', 'queue', 'escalation', 'agent'],
    previewComponent: 'approvals-page',
    deps: ['lucide-react'],
    composedOf: ['approval-queue', 'escalation-queue-list', 'approval-policy-list'],
  },
  /* ------------------------------------------------------------------ *
   *  The composition wave, 2026-09-10
   *
   *  Twenty-three pages that exist because 119 of the 250 blocks were
   *  composed by nothing. Every one of those blocks had been designed,
   *  reviewed and shipped, and none of them was reachable by a visitor who
   *  arrived looking for a screen rather than a component — which is most
   *  visitors, since "I need an import flow" is a more common thought than
   *  "I need a CSV column mapper".
   *
   *  They are grouped by the block set they close rather than by category,
   *  so the gap they were built against stays visible in the file.
   * ------------------------------------------------------------------ */

  {
    id: 'assistant-chat-page',
    name: 'Assistant Chat',
    category: 'App Screens',
    description:
      'The blank thread answered with real starter prompts, the model picker with the three numbers the choice turns on, and the four surfaces a session grows into — attachments, branches, canvas, threads.',
    tags: ['chat', 'assistant', 'ai', 'llm', 'conversation'],
    previewComponent: 'assistant-chat-page',
    deps: ['lucide-react'],
    composedOf: [
      'chat-empty-state',
      'chat-model-picker',
      'chat-attachment-tray',
      'chat-message-branches',
      'chat-artifact-canvas',
      'chat-thread-panel',
    ],
    featured: true,
  },
  {
    id: 'agent-inspector-page',
    name: 'Agent Run Inspector',
    category: 'App Screens',
    description:
      'The three states an agent screen usually omits: the wait before the first token, the trace after something broke with retries costed in the open, and the diff it wants a person to accept.',
    tags: ['agent', 'observability', 'trace', 'diff review', 'ai'],
    previewComponent: 'agent-inspector-page',
    deps: ['lucide-react'],
    composedOf: [
      'agent-task-list',
      'agent-working-indicator',
      'agent-run-failure',
      'agent-diff-review',
      'confidence-recommendation',
    ],
  },
  {
    id: 'retrieval-console-page',
    name: 'Retrieval Console',
    category: 'App Screens',
    description:
      'Why the answer said what it said: what is connected, how stale it is, what the query was allowed to see, what fitted in the window and what fell out — plus the failed-search state a debugging tool is most needed in.',
    tags: ['rag', 'retrieval', 'context', 'citations', 'ai'],
    previewComponent: 'retrieval-console-page',
    deps: ['lucide-react'],
    composedOf: [
      'retrieval-index-status',
      'retrieval-freshness-list',
      'context-scope-list',
      'context-chunk-cards',
      'context-window-budget',
      'source-citation-list',
      'retrieval-empty-state',
    ],
  },
  {
    id: 'ai-editor-page',
    name: 'AI Editor',
    category: 'App Screens',
    description:
      'Five ways to reach a model without the cursor leaving the sentence — slash menu, inline completion, selection toolbar, action menu, property inspector — and the two surfaces that say where the answer came from.',
    tags: ['editor', 'ai', 'inline ai', 'slash menu', 'copilot'],
    previewComponent: 'ai-editor-page',
    deps: ['lucide-react'],
    composedOf: [
      'ai-slash-menu',
      'ai-inline-suggestion',
      'selection-ai-toolbar',
      'ai-action-menu',
      'ai-inspector-panel',
      'grounding-split',
      'human-oversight-split',
    ],
    featured: true,
  },
  {
    id: 'records-table-page',
    name: 'Records Table',
    category: 'App Screens',
    description:
      'A table after real people have used it — columns reordered from the keyboard, a selection bar that asks page-or-all, subtotals that survive collapsing, cells edited in place, and the empty state its own filters produced.',
    tags: ['data table', 'crud', 'admin', 'bulk actions', 'filters'],
    previewComponent: 'records-table-page',
    deps: ['lucide-react'],
    composedOf: [
      'data-table-column-manager',
      'data-table-bulk-actions',
      'data-table-grouped-rows',
      'data-table-inline-edit',
      'data-table-expandable',
      'empty-filtered-results',
      'filter-drawer-facets',
      'drawer-record-detail',
    ],
    featured: true,
  },
  {
    id: 'analytics-page',
    name: 'Analytics',
    category: 'App Screens',
    description:
      'The saved view and the comparison window first, because every figure below depends on both — then six charts, none of which load a charting library.',
    tags: ['analytics', 'charts', 'dashboard', 'metrics', 'reporting'],
    previewComponent: 'analytics-page',
    deps: ['lucide-react'],
    composedOf: [
      'dashboard-saved-views',
      'dashboard-comparison-period',
      'kpi-summary-band',
      'metric-sparkline-cards',
      'line-chart-panel',
      'donut-breakdown',
      'funnel-conversion-panel',
      'activity-heatmap',
    ],
  },
  {
    id: 'alerting-page',
    name: 'Alerting',
    category: 'App Screens',
    description:
      'Thresholds with how often each has actually fired, what that produced, where it went — and the digest settings that exist because of the answer.',
    tags: ['alerts', 'monitoring', 'thresholds', 'digest', 'on call'],
    previewComponent: 'alerting-page',
    deps: ['lucide-react'],
    composedOf: [
      'dashboard-alert-rules',
      'metric-alert-list',
      'notification-channel-list',
      'notification-digest-list',
      'digest-schedule-form',
    ],
  },
  {
    id: 'notification-settings-page',
    name: 'Notification Settings',
    category: 'Account & Billing',
    description:
      'Notifications from the receiving end: the inbox you arrived from, per-event and per-channel control, and the push prompt asked after the decision rather than on arrival.',
    tags: ['notifications', 'preferences', 'push', 'inbox', 'settings'],
    previewComponent: 'notification-settings-page',
    deps: ['lucide-react'],
    composedOf: [
      'notification-inbox',
      'notification-preferences',
      'settings-notification-matrix',
      'push-permission-prompt',
      'toast-stack',
    ],
  },
  {
    id: 'team-access-page',
    name: 'Team & Access',
    category: 'Account & Billing',
    description:
      'The admin screen a security questionnaire is really asking about — seats with the bill shown first, invitations, scopes split from bundles, sharing stated as its consequence, live sessions, and the audit trail underneath.',
    tags: ['team', 'permissions', 'rbac', 'audit log', 'sessions'],
    previewComponent: 'team-access-page',
    deps: ['lucide-react'],
    composedOf: [
      'billing-seat-manager',
      'team-invite-step',
      'permission-scope-dialog',
      'share-access-dialog',
      'settings-sessions',
      'settings-audit-log',
    ],
    featured: true,
  },
  {
    id: 'import-data-page',
    name: 'Import Data',
    category: 'App Screens',
    description:
      'The flow between an empty product and a useful one, in the order it goes wrong: sample data offered with equal weight, a file, a URL, the column mapping everything stalls on, and an upload that survives the connection dropping.',
    tags: ['import', 'csv', 'upload', 'onboarding', 'data'],
    previewComponent: 'import-data-page',
    deps: ['lucide-react'],
    composedOf: [
      'onboarding-import-data',
      'file-dropzone',
      'import-from-url-form',
      'csv-import-mapper',
      'upload-requirements-form',
      'upload-progress-list',
      'upload-resumable',
    ],
  },
  {
    id: 'account-setup-page',
    name: 'Account Setup',
    category: 'App Screens',
    description:
      'A profile form where the role options state what they actually change, the avatar crop works from the keyboard, and a navigation guard names the fields it is about to throw away.',
    tags: ['profile', 'onboarding', 'multi step form', 'avatar', 'settings'],
    previewComponent: 'account-setup-page',
    deps: ['lucide-react'],
    composedOf: [
      'onboarding-role-picker',
      'avatar-crop-upload',
      'multi-step-form',
      'modal-unsaved-changes',
    ],
  },
  {
    id: 'reset-password-page',
    name: 'Reset Password',
    category: 'Auth Screens',
    description:
      'The end of the forgot-password flow, shipped with the state it reaches more than any other screen: a focused error summary linking to each field, beside a strength meter that is a real <meter>.',
    tags: ['password', 'reset', 'auth', 'form errors', 'security'],
    previewComponent: 'reset-password-page',
    deps: ['lucide-react'],
    composedOf: ['auth-reset-password', 'form-error-summary'],
  },
  {
    id: 'app-shell-page',
    name: 'App Shell',
    category: 'App Screens',
    description:
      'The furniture that is on every screen and belongs to none — navbar, mobile drawer, command palette, shortcut sheet, header search, scope switcher, and the two shapes a detail view takes without losing the list.',
    tags: ['navigation', 'command palette', 'shortcuts', 'drawer', 'shell'],
    previewComponent: 'app-shell-page',
    deps: ['lucide-react'],
    composedOf: [
      'navbar-authenticated',
      'nav-mobile-drawer',
      'command-palette',
      'keyboard-shortcuts-sheet',
      'search-autocomplete',
      'search-scope-switcher',
      'bottom-sheet-mobile',
      'slide-over-panel',
    ],
    featured: true,
  },
  {
    id: 'security-landing-page',
    name: 'Security & Trust',
    category: 'Marketing Pages',
    description:
      'The page a security questionnaire arrives from, written to be forwarded rather than to persuade: certifications early, benchmarks with a denominator, objections in a reviewer’s own words, and a route to a human.',
    tags: ['security', 'trust', 'compliance', 'soc 2', 'enterprise'],
    previewComponent: 'security-landing-page',
    deps: ['lucide-react'],
    composedOf: [
      'navbar-simple',
      'hero-split',
      'security-posture-band',
      'stats-benchmark-band',
      'security-faq-list',
      'contact-sales-form',
      'cta-sticky-bar',
      'footer-minimal',
    ],
  },
  {
    id: 'migration-landing-page',
    name: 'Switching & Migration',
    category: 'Marketing Pages',
    description:
      'The landing page for a reader whose current tool already works: the migration mechanism second rather than buried, integrations stated at depth, and deliberately no pricing section.',
    tags: ['migration', 'switching', 'competitor', 'integrations', 'landing page'],
    previewComponent: 'migration-landing-page',
    deps: ['lucide-react'],
    composedOf: [
      'navbar-simple',
      'hero-screenshot',
      'data-migration-split',
      'integration-depth-split',
      'customer-outcome-band',
      'faq-objection-list',
      'demo-request-form',
      'footer-minimal',
    ],
  },
  {
    id: 'launch-note-page',
    name: 'Launch Note',
    category: 'Marketing Pages',
    description:
      'A product announcement shaped as writing rather than a landing page — serif headline, real byline, three pieces of evidence, and an endpoint card that doubles as documentation for the week before the docs exist.',
    tags: ['announcement', 'launch', 'changelog', 'editorial', 'api'],
    previewComponent: 'launch-note-page',
    deps: ['lucide-react'],
    composedOf: [
      'navbar-simple',
      'hero-editorial',
      'stats-cards',
      'api-endpoint-card',
      'referral-waitlist-form',
      'footer-minimal',
    ],
  },
  {
    id: 'single-offer-page',
    name: 'Single Offer',
    category: 'Marketing Pages',
    description:
      'One thing, one price, named above the fold — for a course, a consultation or a one-time licence, where there is nothing to compare against and hiding the number answers the only question last.',
    tags: ['pricing', 'course', 'one time', 'booking', 'landing page'],
    previewComponent: 'single-offer-page',
    deps: ['lucide-react'],
    composedOf: [
      'navbar-simple',
      'hero-price-anchor',
      'pricing-value-split',
      'review-distribution-band',
      'booking-scheduler',
      'footer-minimal',
      'cookie-consent',
    ],
  },
  {
    id: 'plan-change-page',
    name: 'Change Plan',
    category: 'Account & Billing',
    description:
      'Both directions, because only one of them is usually built: a radiogroup with the prorated charge announced as it changes, and a cancellation with the end date, what breaks, and one honest alternative offered once.',
    tags: ['billing', 'upgrade', 'downgrade', 'cancellation', 'subscription'],
    previewComponent: 'plan-change-page',
    deps: ['lucide-react'],
    composedOf: ['pricing-plan-picker', 'subscription-cancel-flow', 'confirm-dialog'],
  },
  {
    id: 'product-compare-page',
    name: 'Product Comparison',
    category: 'Commerce Pages',
    description:
      'The page between a listing and a product detail, with the two questions a comparison table alone cannot answer: will it fit, and can I actually have it.',
    tags: ['comparison', 'ecommerce', 'specs', 'sizing', 'stock'],
    previewComponent: 'product-compare-page',
    deps: ['lucide-react'],
    composedOf: [
      'collection-story-split',
      'product-compare-table',
      'product-spec-split',
      'product-size-guide',
      'stock-availability-list',
      'back-in-stock-form',
    ],
  },
  {
    id: 'express-checkout-page',
    name: 'Express Checkout',
    category: 'Commerce Pages',
    description:
      'Checkout for the buyer who will not fill in a form: wallet buttons above the fields, and the address a wallet returns shown and changeable before the charge rather than after it.',
    tags: ['checkout', 'apple pay', 'express', 'cart', 'ecommerce'],
    previewComponent: 'express-checkout-page',
    deps: ['lucide-react'],
    composedOf: ['cart-drawer', 'checkout-express-payment', 'gift-options-form'],
  },
  {
    id: 'order-tracking-page',
    name: 'Order Tracking',
    category: 'Commerce Pages',
    description:
      'For the customer with an order number and no account — a lookup, an arrival range rather than a promised date, and the review form where the "how did we do" email actually lands.',
    tags: ['order tracking', 'guest', 'shipping', 'reviews', 'ecommerce'],
    previewComponent: 'order-tracking-page',
    deps: ['lucide-react'],
    composedOf: ['order-lookup-form', 'order-tracking-timeline', 'review-submit-form'],
  },
  {
    id: 'workspace-activity-page',
    name: 'Workspace Activity',
    category: 'App Screens',
    description:
      'Backwards from now and forwards from it on one screen — a day-grouped timeline, a month grid where a busy Tuesday never changes the row height, and the state both are in on day one.',
    tags: ['activity', 'timeline', 'calendar', 'events', 'empty state'],
    previewComponent: 'workspace-activity-page',
    deps: ['lucide-react'],
    composedOf: ['activity-timeline', 'calendar-month', 'empty-state-cta'],
  },
  {
    id: 'first-run-page',
    name: 'First Run',
    category: 'App Screens',
    description:
      'What the product looks like while onboarding happens: a tour step anchored to the control it explains, the skeletons of the slowest load it will ever do, and the checklist that outlives both.',
    tags: ['onboarding', 'product tour', 'coachmark', 'skeleton', 'first run'],
    previewComponent: 'first-run-page',
    deps: ['lucide-react'],
    composedOf: ['product-tour-coachmark', 'skeleton-list', 'onboarding-checklist'],
  },
]
