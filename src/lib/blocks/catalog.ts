/**
 * Hand-authored metadata for every block.
 *
 * Source text is NOT here — it lives in `./sources/*.tsx` and is inlined at
 * build time by `scripts/build-block-sources.mjs`. That split is the same
 * one the effect catalog makes, and for the same reason: the grid needs
 * names and tags to filter on, and shipping several hundred kilobytes of
 * TSX to render a card would undo the work that got `/` down to size.
 *
 * A block's `id` must equal its source filename without the extension. The
 * build script pairs the two by that convention and fails loudly if a block
 * has no source or a source has no block, which is the only thing keeping
 * this file honest as the catalog grows.
 */

import type { BlockCategory } from './block-types'
import type { ArtifactTier } from '../artifact-types'

/** Metadata as authored — everything about a block except its source. */
export interface BlockRecord {
  id: string
  name: string
  category: BlockCategory
  description: string
  tags: string[]
  /** Registry key in `./registry`. Equal to `id` for every block so far. */
  previewComponent: string
  deps: string[]
  tier?: ArtifactTier
  featured?: boolean
  /** Preview needs the full canvas width — true for nearly every section. */
  fullBleed?: boolean
  darkSurface?: boolean
}

export const BLOCK_CATALOG: BlockRecord[] = [
  {
    id: 'stats-band',
    name: 'Hairline Stats Band',
    category: 'Stats',
    description:
      'A four-up metrics strip with 1px hairline dividers, built from a single gap-px grid so the rules stay crisp on any display.',
    tags: ['stats', 'metrics', 'numbers', 'kpi', 'social proof'],
    previewComponent: 'stats-band',
    deps: [],
    featured: true,
    fullBleed: true,
  },
  {
    id: 'logo-cloud',
    name: 'Seamless Logo Marquee',
    category: 'Logo Clouds',
    description:
      'An infinite horizontal logo scroll with masked edges, a pause-on-hover affordance and a reduced-motion fallback that wraps instead of moving.',
    tags: ['logos', 'marquee', 'social proof', 'customers', 'scroll'],
    previewComponent: 'logo-cloud',
    deps: [],
    featured: true,
    fullBleed: true,
  },
  {
    id: 'bento-features',
    name: 'Bento Feature Grid',
    category: 'Feature Sections',
    description:
      'Six tiles on an asymmetric 4x3 grid with per-tile spans, a hover glow and a mobile collapse that follows source order.',
    tags: ['bento', 'features', 'grid', 'asymmetric', 'cards'],
    previewComponent: 'bento-features',
    deps: ['lucide-react'],
    featured: true,
    fullBleed: true,
  },
  {
    id: 'persona-cards',
    name: 'Audience Persona Cards',
    category: 'Feature Sections',
    description:
      'A "who this is for" grid: four cards naming an audience, the outcome they want and the bullets that get them there.',
    tags: ['personas', 'audience', 'use cases', 'features', 'cards'],
    previewComponent: 'persona-cards',
    deps: ['lucide-react'],
    fullBleed: true,
  },
  {
    id: 'code-showcase',
    name: 'Editor Window Showcase',
    category: 'Feature Sections',
    description:
      'A feature section paired with a tabbed fake editor — real selectable code, generated line numbers and a copy button.',
    tags: ['code', 'editor', 'terminal', 'developer', 'tabs'],
    previewComponent: 'code-showcase',
    deps: ['lucide-react'],
    featured: true,
    fullBleed: true,
  },
  {
    id: 'pricing-tiers',
    name: 'Three-Plan Pricing Toggle',
    category: 'Pricing',
    description:
      'Three plans with a monthly/yearly switch, yearly prices derived from the monthly figure so the two can never disagree.',
    tags: ['pricing', 'plans', 'billing', 'toggle', 'subscription'],
    previewComponent: 'pricing-tiers',
    deps: ['lucide-react'],
    featured: true,
    fullBleed: true,
  },
  {
    id: 'comparison-table',
    name: 'Plan Comparison Matrix',
    category: 'Pricing',
    description:
      'A real table with scoped headers, a sticky first column and screen-reader text behind every check and dash.',
    tags: ['comparison', 'pricing', 'table', 'matrix', 'features'],
    previewComponent: 'comparison-table',
    deps: ['lucide-react'],
    fullBleed: true,
  },
  {
    id: 'testimonial-grid',
    name: 'Masonry Testimonial Wall',
    category: 'Testimonials',
    description:
      'Quotes packed by height using CSS multi-column, with star ratings, initial avatars and no ragged bottom edge.',
    tags: ['testimonials', 'quotes', 'reviews', 'masonry', 'social proof'],
    previewComponent: 'testimonial-grid',
    deps: ['lucide-react'],
    featured: true,
    fullBleed: true,
  },
  {
    id: 'faq-accordion',
    name: 'No-JS FAQ Accordion',
    category: 'FAQ',
    description:
      'Exclusive accordion behaviour from named <details> elements — no state, no hooks, no JavaScript, full keyboard support for free.',
    tags: ['faq', 'accordion', 'details', 'no-js', 'questions'],
    previewComponent: 'faq-accordion',
    deps: ['lucide-react'],
    featured: true,
    fullBleed: true,
  },
  {
    id: 'changelog-timeline',
    name: 'Release Timeline',
    category: 'Content & Blog',
    description:
      'A dated changelog on a vertical rail with added/changed/fixed tags and machine-readable <time> values.',
    tags: ['changelog', 'timeline', 'releases', 'updates', 'history'],
    previewComponent: 'changelog-timeline',
    deps: [],
    fullBleed: true,
  },
  {
    id: 'roadmap-columns',
    name: 'Public Roadmap Columns',
    category: 'Content & Blog',
    description:
      'Shipped / in progress / planned in three columns, with status carried by icon as well as colour.',
    tags: ['roadmap', 'kanban', 'columns', 'status', 'planning'],
    previewComponent: 'roadmap-columns',
    deps: ['lucide-react'],
    fullBleed: true,
  },
  {
    id: 'newsletter-signup',
    name: 'Newsletter Capture Band',
    category: 'CTA Sections',
    description:
      'Email capture with a four-state submission machine and an aria-live status line, so the outcome is announced and not just shown.',
    tags: ['newsletter', 'email', 'signup', 'cta', 'form'],
    previewComponent: 'newsletter-signup',
    deps: ['lucide-react'],
    fullBleed: true,
  },
  {
    id: 'community-band',
    name: 'Community Link Band',
    category: 'CTA Sections',
    description:
      'A closing CTA of three link cards pointing at GitHub, chat and social — somewhere to go for the visitor who is not ready to convert.',
    tags: ['community', 'cta', 'links', 'social', 'footer'],
    previewComponent: 'community-band',
    deps: ['lucide-react'],
    fullBleed: true,
  },

  /* ================================================================ *
   *  Product — the blocks an app is built from
   * ================================================================ */

  /* ---------------------------- Authentication -------------------- */
  {
    id: 'auth-login-card',
    name: 'Email & Social Login Card',
    category: 'Authentication',
    description:
      'Centred sign-in card with social providers, a password reveal toggle and the autoComplete values password managers actually need.',
    tags: ['login', 'sign in', 'auth', 'password', 'oauth'],
    previewComponent: 'auth-login-card',
    deps: ['lucide-react'],
    featured: true,
  },
  {
    id: 'auth-signup-split',
    name: 'Split Signup With Proof',
    category: 'Authentication',
    description:
      'Registration form beside a testimonial panel, with live password rules and a proof column that drops rather than stacks on mobile.',
    tags: ['signup', 'register', 'auth', 'split screen', 'password rules'],
    previewComponent: 'auth-signup-split',
    deps: ['lucide-react'],
    featured: true,
  },
  {
    id: 'auth-otp-verify',
    name: 'One-Time Code Input',
    category: 'Authentication',
    description:
      'Six-box OTP entry that handles paste, backspace, arrow keys and iOS SMS autofill — the parts hand-rolled versions always miss.',
    tags: ['otp', 'verification', 'code', '2fa', 'magic link'],
    previewComponent: 'auth-otp-verify',
    deps: ['lucide-react'],
    featured: true,
  },
  {
    id: 'auth-forgot-password',
    name: 'Password Reset Request',
    category: 'Authentication',
    description:
      'Reset-link request with a sent state worded to avoid leaking whether an account exists.',
    tags: ['forgot password', 'reset', 'auth', 'email'],
    previewComponent: 'auth-forgot-password',
    deps: ['lucide-react'],
  },
  {
    id: 'auth-reset-password',
    name: 'New Password With Strength Meter',
    category: 'Authentication',
    description:
      'Set-a-new-password form with a four-step strength meter, confirm matching and errors announced rather than only coloured.',
    tags: ['reset password', 'strength meter', 'auth', 'validation'],
    previewComponent: 'auth-reset-password',
    deps: ['lucide-react'],
  },
  {
    id: 'auth-two-factor',
    name: 'Two-Factor Challenge',
    category: 'Authentication',
    description:
      'Authenticator-code prompt with a backup-code escape hatch and an opt-in trusted-device checkbox that is off by default.',
    tags: ['2fa', 'mfa', 'security', 'backup codes', 'auth'],
    previewComponent: 'auth-two-factor',
    deps: ['lucide-react'],
  },

  /* ---------------------------- Dashboards ------------------------ */
  {
    id: 'dashboard-shell',
    name: 'Sidebar Dashboard Shell',
    category: 'Dashboards',
    description:
      'Sidebar, top bar and scrollable content slot, with a mobile drawer that closes on Escape and marks the active route.',
    tags: ['dashboard', 'sidebar', 'layout', 'shell', 'admin'],
    previewComponent: 'dashboard-shell',
    deps: ['lucide-react'],
    featured: true,
    fullBleed: true,
  },
  {
    id: 'dashboard-stat-cards',
    name: 'KPI Cards With Deltas',
    category: 'Dashboards',
    description:
      'Metric row where each card knows whether a rise is good news, so churn going up is red while revenue going up is green.',
    tags: ['kpi', 'stats', 'metrics', 'dashboard', 'trend'],
    previewComponent: 'dashboard-stat-cards',
    deps: ['lucide-react'],
    featured: true,
  },
  {
    id: 'dashboard-activity-feed',
    name: 'Activity Feed Panel',
    category: 'Dashboards',
    description:
      'Recent-events list with typed icons and relative timestamps that keep the absolute value in a <time> element.',
    tags: ['activity', 'feed', 'timeline', 'events', 'dashboard'],
    previewComponent: 'dashboard-activity-feed',
    deps: ['lucide-react'],
  },
  {
    id: 'dashboard-page-header',
    name: 'Page Header With Tabs',
    category: 'Dashboards',
    description:
      'Breadcrumb, title, action buttons and a counted tab row that sits flush with the bottom rule.',
    tags: ['header', 'breadcrumb', 'tabs', 'toolbar', 'dashboard'],
    previewComponent: 'dashboard-page-header',
    deps: ['lucide-react'],
  },

  /* ---------------------------- Data Tables ----------------------- */
  {
    id: 'data-table-sortable',
    name: 'Sortable Selectable Table',
    category: 'Data Tables',
    description:
      'Type-aware sorting with aria-sort, a header checkbox that goes properly indeterminate, and selection that survives a re-sort.',
    tags: ['table', 'sort', 'selection', 'data grid', 'bulk actions'],
    previewComponent: 'data-table-sortable',
    deps: ['lucide-react'],
    featured: true,
    fullBleed: true,
  },
  {
    id: 'data-table-toolbar',
    name: 'Table Search & Filter Bar',
    category: 'Data Tables',
    description:
      'Search, filter count and view switch, with active filters shown as removable chips so a filtered table never looks unfiltered.',
    tags: ['toolbar', 'search', 'filters', 'chips', 'table'],
    previewComponent: 'data-table-toolbar',
    deps: ['lucide-react'],
    featured: true,
  },
  {
    id: 'data-table-pagination',
    name: 'Pagination With Page Window',
    category: 'Data Tables',
    description:
      'Page size, range summary and a fixed-width number window that stays the same size from page 1 to page 200.',
    tags: ['pagination', 'paging', 'table', 'page size'],
    previewComponent: 'data-table-pagination',
    deps: ['lucide-react'],
  },
  {
    id: 'data-table-expandable',
    name: 'Expandable Detail Rows',
    category: 'Data Tables',
    description:
      'Rows that open into a full-width detail panel via colSpan, with aria-expanded and aria-controls wired to the detail row.',
    tags: ['table', 'expandable', 'accordion', 'detail', 'rows'],
    previewComponent: 'data-table-expandable',
    deps: ['lucide-react'],
    fullBleed: true,
  },

  /* ---------------------------- Settings -------------------------- */
  {
    id: 'settings-nav-layout',
    name: 'Grouped Settings Layout',
    category: 'Settings',
    description:
      'Sidebar-and-panel settings shell that becomes a horizontal scroller on mobile instead of collapsing into a select.',
    tags: ['settings', 'layout', 'sidebar', 'navigation', 'preferences'],
    previewComponent: 'settings-nav-layout',
    deps: ['lucide-react'],
    fullBleed: true,
  },
  {
    id: 'settings-profile-form',
    name: 'Profile Form With Save Bar',
    category: 'Settings',
    description:
      'Avatar, fields and a character counter, with a sticky save bar that only appears once something has genuinely changed.',
    tags: ['profile', 'form', 'settings', 'dirty state', 'save bar'],
    previewComponent: 'settings-profile-form',
    deps: ['lucide-react'],
    featured: true,
  },
  {
    id: 'settings-team-members',
    name: 'Team Members & Invites',
    category: 'Settings',
    description:
      'Member list with role selects, pending invites shown inline, and the last owner locked so a workspace cannot be orphaned.',
    tags: ['team', 'members', 'roles', 'invites', 'permissions'],
    previewComponent: 'settings-team-members',
    deps: ['lucide-react'],
    featured: true,
  },
  {
    id: 'settings-api-keys',
    name: 'API Key Management',
    category: 'Settings',
    description:
      'Masked keys, a create flow that reveals the secret exactly once, and a revoke that confirms before it fires.',
    tags: ['api keys', 'secrets', 'developer', 'security', 'tokens'],
    previewComponent: 'settings-api-keys',
    deps: ['lucide-react'],
    featured: true,
  },
  {
    id: 'settings-danger-zone',
    name: 'Danger Zone',
    category: 'Settings',
    description:
      'Destructive actions gated by typing the resource name exactly — the pattern GitHub and Stripe use, and for good reason.',
    tags: ['danger zone', 'delete', 'destructive', 'confirmation', 'settings'],
    previewComponent: 'settings-danger-zone',
    deps: ['lucide-react'],
  },

  /* ---------------------- Empty & Error States -------------------- */
  {
    id: 'empty-state-cta',
    name: 'Empty State With Illustration',
    category: 'Empty & Error States',
    description:
      'Two variants — nothing created yet, versus filters excluded everything — because offering "create your first" to a bad filter is the classic bug.',
    tags: ['empty state', 'zero state', 'illustration', 'onboarding', 'svg'],
    previewComponent: 'empty-state-cta',
    deps: ['lucide-react'],
    featured: true,
  },
  {
    id: 'error-state-retry',
    name: 'Error State With Retry',
    category: 'Empty & Error States',
    description:
      'Failed-to-load panel with a visible retry, a copyable error reference and the stack tucked behind a disclosure.',
    tags: ['error', 'retry', 'failed', 'exception', 'fallback'],
    previewComponent: 'error-state-retry',
    deps: ['lucide-react'],
  },
  {
    id: 'not-found-404',
    name: '404 With Search & Suggestions',
    category: 'Empty & Error States',
    description:
      'A 404 that helps: a real GET search form that works without JavaScript, likely destinations, and home as the fallback rather than the headline.',
    tags: ['404', 'not found', 'error page', 'search'],
    previewComponent: 'not-found-404',
    deps: ['lucide-react'],
    fullBleed: true,
  },
  {
    id: 'skeleton-list',
    name: 'Shimmer Skeleton List',
    category: 'Empty & Error States',
    description:
      'Loading placeholders with varied row widths and a sweep that is motion-safe only, falling back to a flat tint under reduced motion.',
    tags: ['skeleton', 'loading', 'shimmer', 'placeholder', 'reduced motion'],
    previewComponent: 'skeleton-list',
    deps: [],
  },

  /* ---------------------- Charts & Metrics ------------------------ */
  {
    id: 'metric-sparkline-cards',
    name: 'Sparkline Metric Cards',
    category: 'Charts & Metrics',
    description:
      'KPI cards with a hand-built SVG trend line — no charting dependency for a path this file computes in twelve lines.',
    tags: ['sparkline', 'chart', 'metrics', 'svg', 'trend'],
    previewComponent: 'metric-sparkline-cards',
    deps: [],
    featured: true,
  },
  {
    id: 'bar-chart-panel',
    name: 'CSS Bar Chart Panel',
    category: 'Charts & Metrics',
    description:
      'Categorical bars in plain CSS with gridlines, hover values and a screen-reader table carrying the real numbers.',
    tags: ['bar chart', 'chart', 'css', 'analytics', 'accessible'],
    previewComponent: 'bar-chart-panel',
    deps: [],
    featured: true,
  },
  {
    id: 'usage-meter-panel',
    name: 'Quota & Usage Meters',
    category: 'Charts & Metrics',
    description:
      'Consumption against plan limits, with warning thresholds, honest overage display and unmetered quotas that do not fake a bar.',
    tags: ['usage', 'quota', 'meter', 'limits', 'progress'],
    previewComponent: 'usage-meter-panel',
    deps: ['lucide-react'],
  },

  /* ---------------------- Billing & Usage ------------------------- */
  {
    id: 'billing-plan-summary',
    name: 'Plan & Next Charge Summary',
    category: 'Billing & Usage',
    description:
      'Current plan, next charge with an actual figure and date, payment method, and a prominent pending-cancellation state.',
    tags: ['billing', 'plan', 'subscription', 'payment method', 'invoice'],
    previewComponent: 'billing-plan-summary',
    deps: ['lucide-react'],
    featured: true,
  },
  {
    id: 'invoice-history-table',
    name: 'Invoice History',
    category: 'Billing & Usage',
    description:
      'Past invoices with tabular figures, worded statuses rather than bare coloured dots, and per-invoice download labels.',
    tags: ['invoices', 'billing', 'receipts', 'history', 'table'],
    previewComponent: 'invoice-history-table',
    deps: ['lucide-react'],
    fullBleed: true,
  },

  /* ---------------------- Command & Search ------------------------ */
  {
    id: 'command-palette',
    name: 'Command Palette',
    category: 'Command & Search',
    description:
      'The ⌘K switcher done properly: focus stays in the input while aria-activedescendant moves, arrows wrap, and the highlight resets on every query change.',
    tags: ['command palette', 'cmdk', 'search', 'shortcuts', 'combobox'],
    previewComponent: 'command-palette',
    deps: ['lucide-react'],
    featured: true,
  },

  /* ---------------------- File Upload ----------------------------- */
  {
    id: 'file-dropzone',
    name: 'Drag & Drop Upload',
    category: 'File Upload',
    description:
      'Dropzone with per-file progress and a drag counter that fixes the flicker every naive dragleave handler produces.',
    tags: ['upload', 'dropzone', 'drag and drop', 'files', 'progress'],
    previewComponent: 'file-dropzone',
    deps: ['lucide-react'],
    featured: true,
  },
]
