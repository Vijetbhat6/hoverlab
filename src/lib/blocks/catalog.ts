/**
 * Hand-authored metadata for every block.
 *
 * Source text is NOT here — it lives in `./sources/*.tsx` and is inlined at
 * build time by `scripts/build-artifact-sources.mjs`. That split is the same
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
  darkSurface?: boolean
  /** Tailwind height class for the card thumbnail. See `Block.thumbHeight`. */
  thumbHeight?: string
}

export const BLOCK_CATALOG: BlockRecord[] = [
  /* ================================================================ *
   *  Marketing — the blocks a site is built from
   * ================================================================ */

  /* ---------------------------- Heroes ----------------------------- */
  {
    id: 'hero-split',
    name: 'Split Hero with Product Panel',
    category: 'Heroes',
    description:
      'Copy on the left, a drawn product panel on the right — the default hero for anything with an interface to show, with no image asset to host and no layout shift while it loads.',
    tags: ['hero', 'split', 'landing', 'above the fold', 'saas'],
    previewComponent: 'hero-split',
    deps: ['lucide-react'],
    featured: true,
  },
  {
    id: 'hero-centered',
    name: 'Centered Announcement Hero',
    category: 'Heroes',
    description:
      'A linked announcement pill over a large centered headline, dual CTAs and a wordmark strip — the hero for a product with nothing to screenshot yet.',
    tags: ['hero', 'centered', 'announcement', 'landing', 'gradient'],
    previewComponent: 'hero-centered',
    deps: ['lucide-react'],
    featured: true,
  },
  {
    id: 'hero-screenshot',
    name: 'Hero with Browser Frame',
    category: 'Heroes',
    description:
      'Centered copy above a screenshot in window chrome, masked at the bottom so a tall image never dictates the height of the fold. Wraps your own img or video.',
    tags: ['hero', 'screenshot', 'browser', 'mockup', 'landing'],
    previewComponent: 'hero-screenshot',
    deps: ['lucide-react'],
  },
  {
    id: 'hero-waitlist',
    name: 'Waitlist Hero with Email Capture',
    category: 'Heroes',
    description:
      'A pre-launch hero whose only ask is an email address, with pending and success states and a signup count that argues for finishing rather than starting.',
    tags: ['hero', 'waitlist', 'email', 'launch', 'form'],
    previewComponent: 'hero-waitlist',
    deps: ['lucide-react'],
  },
  {
    id: 'hero-search',
    name: 'Search-First Hero',
    category: 'Heroes',
    description:
      'A hero whose primary action is a real search form with prefilling suggestion chips — for marketplaces and directories, where sending the visitor below the fold to find the search box is the whole failure.',
    tags: ['hero', 'search', 'marketplace', 'directory', 'form'],
    previewComponent: 'hero-search',
    deps: ['lucide-react'],
  },
  {
    id: 'hero-terminal',
    name: 'Developer Hero with Install Command',
    category: 'Heroes',
    description:
      'A drawn terminal whose install line is real, selectable text with a working copy button and a feature-detected clipboard call — the hero for anything adopted by typing rather than signing up.',
    tags: ['hero', 'developer', 'terminal', 'cli', 'copy'],
    previewComponent: 'hero-terminal',
    deps: ['lucide-react'],
    featured: true,
  },
  {
    id: 'hero-app-download',
    name: 'App Download Hero with Phone',
    category: 'Heroes',
    description:
      'A drawn phone beside two store links built as real anchors rather than badge images, so they inherit the theme, need no hosted asset and carry an accessible name that is not a filename.',
    tags: ['hero', 'mobile', 'app store', 'download', 'mockup'],
    previewComponent: 'hero-app-download',
    deps: ['lucide-react'],
  },
  {
    id: 'hero-testimonial',
    name: 'Hero Anchored by a Customer Quote',
    category: 'Heroes',
    description:
      'Pitch on the left, a marked-up figure and blockquote on the right, so the claim and the evidence for it share the fold instead of sitting a scroll apart.',
    tags: ['hero', 'testimonial', 'social proof', 'quote', 'saas'],
    previewComponent: 'hero-testimonial',
    deps: ['lucide-react'],
  },
  {
    id: 'hero-metrics',
    name: 'Hero with Proof Metrics',
    category: 'Heroes',
    description:
      'A centered hero closing on a definition list of scale numbers, with a masked grid wash behind it — for infrastructure and payments, where "how many" is the second question a buyer asks.',
    tags: ['hero', 'stats', 'metrics', 'infrastructure', 'centered'],
    previewComponent: 'hero-metrics',
    deps: ['lucide-react'],
  },
  {
    id: 'hero-editorial',
    name: 'Editorial Masthead Hero',
    category: 'Heroes',
    description:
      'A serif display headline over a 60-character standfirst and a real byline, with one text link and no competing CTAs — the hero for publications and essays, where the writing is the product.',
    tags: ['hero', 'editorial', 'blog', 'serif', 'minimal'],
    previewComponent: 'hero-editorial',
    deps: ['lucide-react'],
  },
  {
    id: 'hero-media-overlay',
    name: 'Full-Bleed Media Hero',
    category: 'Heroes',
    description:
      'Copy over your own image or video, with a graded scrim and deliberately fixed light-on-dark text — because the background is a photograph in both themes, so flipping the copy would break it.',
    tags: ['hero', 'image', 'video', 'overlay', 'ecommerce'],
    previewComponent: 'hero-media-overlay',
    deps: ['lucide-react'],
    darkSurface: true,
  },
  {
    id: 'hero-integrations',
    name: 'Integration Wall Hero',
    category: 'Heroes',
    description:
      'A hero whose visual is the connector list itself, marked up as a real list so a visitor can skim it for their own stack — asset-free initials tiles, no third-party marks to license.',
    tags: ['hero', 'integrations', 'connectors', 'logos', 'data'],
    previewComponent: 'hero-integrations',
    deps: ['lucide-react'],
  },
  {
    id: 'hero-booking',
    name: 'Appointment Booking Hero',
    category: 'Heroes',
    description:
      'A day strip built as a radio group rather than buttons, so arrow keys move between dates and sold-out days disable properly — the fold for anything sold by the appointment.',
    tags: ['hero', 'booking', 'appointment', 'calendar', 'local business'],
    previewComponent: 'hero-booking',
    deps: ['lucide-react'],
  },
  {
    id: 'hero-price-anchor',
    name: 'Hero with Inline Price',
    category: 'Heroes',
    description:
      'Names the price above the fold for single-plan and one-time products, with the former price in a real strikethrough element so it is never announced as the current one.',
    tags: ['hero', 'pricing', 'one-time', 'indie', 'conversion'],
    previewComponent: 'hero-price-anchor',
    deps: ['lucide-react'],
  },

  /* ---------------------------- Navigation ------------------------- */
  {
    id: 'navbar-simple',
    name: 'Responsive Navbar',
    category: 'Navigation',
    description:
      'Brand, links and CTAs with a mobile panel that unmounts when closed — so its links are never tabbable while invisible — plus escape-to-close and focus return.',
    tags: ['navbar', 'nav', 'header', 'menu', 'responsive'],
    previewComponent: 'navbar-simple',
    deps: ['lucide-react'],
    featured: true,
    thumbHeight: 'h-24',
  },
  {
    id: 'announcement-bar',
    name: 'Dismissible Announcement Bar',
    category: 'Navigation',
    description:
      'The strip above the navbar, with the three things it usually gets wrong fixed: a named region, a live role only when it earns one, and a dismissal that persists.',
    tags: ['announcement', 'banner', 'promo', 'dismissible', 'chrome'],
    previewComponent: 'announcement-bar',
    deps: ['lucide-react'],
  },
  {
    id: 'navbar-mega-menu',
    name: 'Navbar with Mega Menu',
    category: 'Navigation',
    description:
      'Top-level items that open a described-link panel, opening on hover and focus, closing on escape, outside click and focus leaving the group — and collapsing to an accordion on mobile.',
    tags: ['navbar', 'mega menu', 'dropdown', 'nav', 'header'],
    previewComponent: 'navbar-mega-menu',
    deps: ['lucide-react'],
    thumbHeight: 'h-24',
  },
  {
    id: 'nav-mobile-drawer',
    name: 'Mobile Nav Drawer',
    category: 'Navigation',
    description:
      'A slide-in site menu that behaves like a dialog: focus trap, focus restoration, body scroll lock and a transition that drops under prefers-reduced-motion.',
    tags: ['drawer', 'mobile menu', 'nav', 'dialog', 'focus trap'],
    previewComponent: 'nav-mobile-drawer',
    deps: ['lucide-react'],
    thumbHeight: 'h-24',
  },

  /* ---------------------------- Footers ---------------------------- */
  {
    id: 'footer-mega',
    name: 'Mega Footer with Link Columns',
    category: 'Footers',
    description:
      'Brand column, four labelled nav columns, socials and a legal bar — the one place every page links to every section. Ships no client JavaScript.',
    tags: ['footer', 'links', 'sitemap', 'columns', 'seo'],
    previewComponent: 'footer-mega',
    deps: ['lucide-react'],
    featured: true,
  },
  {
    id: 'footer-minimal',
    name: 'Minimal Footer Bar',
    category: 'Footers',
    description:
      'One row — brand, a handful of links, socials, copyright — for a site where a five-column footer would be whitespace pretending to be structure.',
    tags: ['footer', 'minimal', 'bar', 'simple', 'links'],
    previewComponent: 'footer-minimal',
    deps: ['lucide-react'],
    thumbHeight: 'h-20',
  },
  {
    id: 'footer-newsletter',
    name: 'Footer with Newsletter Band',
    category: 'Footers',
    description:
      'A raised email-capture band overlapping a three-column link footer, with the confirmation replacing the field in place rather than navigating away.',
    tags: ['footer', 'newsletter', 'email', 'cta', 'subscribe'],
    previewComponent: 'footer-newsletter',
    deps: ['lucide-react'],
  },

  /* ---------------------------- Contact & Forms -------------------- */
  {
    id: 'contact-form-split',
    name: 'Split Contact Form',
    category: 'Contact & Forms',
    description:
      'A contact form beside the channels that bypass it — a real address, a support link and a response-time promise, which is what makes a form people cannot see into feel worth filling.',
    tags: ['contact', 'form', 'email', 'support', 'enquiry'],
    previewComponent: 'contact-form-split',
    deps: ['lucide-react'],
    featured: true,
  },
  {
    id: 'multi-step-form',
    name: 'Multi-Step Form with Validation',
    category: 'Contact & Forms',
    description:
      'A three-step form where each step validates only its own fields, errors are wired to inputs with aria-describedby, and advancing moves focus to the new heading.',
    tags: ['form', 'wizard', 'steps', 'validation', 'multi-step'],
    previewComponent: 'multi-step-form',
    deps: ['lucide-react'],
  },

  {
    id: 'booking-scheduler',
    name: 'Meeting Scheduler',
    category: 'Contact & Forms',
    description:
      'Day strip, slot grid and a time zone the visitor can change — because a slot list with no zone on it is how this pattern wastes an hour of everyone involved.',
    tags: ['booking', 'calendar', 'scheduler', 'time zone', 'meeting'],
    previewComponent: 'booking-scheduler',
    deps: ['lucide-react'],
    featured: true,
  },
  {
    id: 'feedback-widget',
    name: 'Inline Feedback Widget',
    category: 'Contact & Forms',
    description:
      'One click to rate, everything after it optional — the shape that collects a complaint from someone mid-task who would never open a contact page.',
    tags: ['feedback', 'rating', 'widget', 'nps', 'support'],
    previewComponent: 'feedback-widget',
    deps: ['lucide-react'],
  },

  /* ---------------------------- Modals & Drawers ------------------- */
  {
    id: 'confirm-dialog',
    name: 'Destructive Confirm Dialog',
    category: 'Modals & Drawers',
    description:
      'A type-to-confirm dialog built on native <dialog>, so the focus trap, top layer and escape handling come from the browser. Focus lands on Cancel, and the button says the verb.',
    tags: ['dialog', 'modal', 'confirm', 'delete', 'destructive'],
    previewComponent: 'confirm-dialog',
    deps: ['lucide-react'],
    featured: true,
    thumbHeight: 'h-24',
  },
  {
    id: 'cookie-consent',
    name: 'Cookie Consent Banner',
    category: 'Modals & Drawers',
    description:
      'Per-category consent where refusing is exactly as easy as accepting, nothing non-essential is pre-ticked, and the page behind it stays readable — the shape the law expects, wired to your own script gating.',
    tags: ['cookies', 'consent', 'gdpr', 'privacy', 'banner'],
    previewComponent: 'cookie-consent',
    deps: ['lucide-react'],
  },
  {
    id: 'slide-over-panel',
    name: 'Slide-Over Edit Panel',
    category: 'Modals & Drawers',
    description:
      'A side sheet for editing a record without losing the list behind it — native <dialog> for the trapping, a data attribute for the slide, and a sticky footer so Save never scrolls away.',
    tags: ['drawer', 'sheet', 'slide-over', 'panel', 'dialog'],
    previewComponent: 'slide-over-panel',
    deps: ['lucide-react'],
    thumbHeight: 'h-24',
  },
  {
    id: 'filter-drawer-facets',
    name: 'Faceted Filter Drawer',
    category: 'Modals & Drawers',
    description:
      'Facets with per-option counts, zero-result options disabled rather than hidden so the list never jumps, and a pending selection applied on a button that says how many choices changed.',
    tags: ['filters', 'facets', 'drawer', 'search', 'refine'],
    previewComponent: 'filter-drawer-facets',
    deps: ['lucide-react'],
    featured: true,
  },

  /* ---------------------------- Onboarding ------------------------- */
  {
    id: 'onboarding-checklist',
    name: 'Setup Checklist with Progress',
    category: 'Onboarding',
    description:
      'The get-started card that ships with its first item already ticked, a native <progress> element rather than a div bar, and a dismiss control that appears only once there is nothing left to abandon.',
    tags: ['onboarding', 'checklist', 'progress', 'activation', 'getting started'],
    previewComponent: 'onboarding-checklist',
    deps: ['lucide-react'],
    featured: true,
  },
  {
    id: 'setup-wizard',
    name: 'Guided Setup Wizard',
    category: 'Onboarding',
    description:
      'A choice-driven wizard with a persistent side rail, real radio groups in a fieldset so arrow keys work, and visited steps navigable while steps ahead stay out of the tab order.',
    tags: ['onboarding', 'wizard', 'setup', 'steps', 'radio'],
    previewComponent: 'setup-wizard',
    deps: ['lucide-react'],
  },

  {
    id: 'team-invite-step',
    name: 'Team Invite Step',
    category: 'Onboarding',
    description:
      'The onboarding step where a product becomes multiplayer: pasted addresses split into chips, typos marked rather than dropped, and an honest way to skip.',
    tags: ['onboarding', 'invite', 'team', 'chips', 'email'],
    previewComponent: 'team-invite-step',
    deps: ['lucide-react'],
    featured: true,
  },

  /* ---------------------------- Notifications ---------------------- */
  {
    id: 'toast-stack',
    name: 'Toast Notification Stack',
    category: 'Notifications',
    description:
      'A corner stack whose live region is mounted before any message exists, errors announce assertively, and the auto-dismiss timer pauses on hover and on focus.',
    tags: ['toast', 'notification', 'snackbar', 'alert', 'live region'],
    previewComponent: 'toast-stack',
    deps: ['lucide-react'],
    featured: true,
    thumbHeight: 'h-28',
  },
  {
    id: 'notification-inbox',
    name: 'Notification Inbox Panel',
    category: 'Notifications',
    description:
      'The bell panel: filterable list with read state, the unread count in the accessible name rather than only in a badge, and machine-readable timestamps beside the human ones.',
    tags: ['notifications', 'inbox', 'bell', 'activity', 'unread'],
    previewComponent: 'notification-inbox',
    deps: ['lucide-react'],
  },
  {
    id: 'notification-preferences',
    name: 'Notification Preferences Matrix',
    category: 'Notifications',
    description:
      'Per-event, per-channel switches as a real table, with required notifications locked and explained, and column headers that toggle a whole channel and report a mixed state honestly.',
    tags: ['notifications', 'preferences', 'settings', 'email', 'push'],
    previewComponent: 'notification-preferences',
    deps: ['lucide-react'],
    featured: true,
  },

  /* ---------------------------- Sections --------------------------- */
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
  },
  {
    id: 'stats-cards',
    name: 'Stat Cards with Deltas',
    category: 'Stats',
    description:
      'Metrics carrying the direction they moved, with the good direction declared per stat so a falling churn rate reads as a win — arrow and text, never colour alone.',
    tags: ['stats', 'metrics', 'kpi', 'trend', 'dashboard'],
    previewComponent: 'stats-cards',
    deps: ['lucide-react'],
  },
  {
    id: 'stats-narrative',
    name: 'Stats Beside the Argument',
    category: 'Stats',
    description:
      'Four figures in a hairline card next to the paragraph making the claim, each carrying an optional source line — for numbers that mean nothing without knowing lower than what, over how long, across how many.',
    tags: ['stats', 'metrics', 'proof', 'results', 'narrative'],
    previewComponent: 'stats-narrative',
    deps: ['lucide-react'],
  },
  {
    id: 'stats-comparison',
    name: 'Before-and-After Metric Table',
    category: 'Stats',
    description:
      'The buyer’s current situation in one column and yours in the next, as a real table with scoped headers — the comparison they are actually making, which a delta against your own past cannot express.',
    tags: ['stats', 'comparison', 'before after', 'table', 'results'],
    previewComponent: 'stats-comparison',
    deps: ['lucide-react'],
  },
  {
    id: 'stats-timeline',
    name: 'Milestone Timeline',
    category: 'Stats',
    description:
      'The same measurement taken year after year down a vertical rail, each with the event that explains it — the shape for trajectory, which no snapshot of four numbers can claim.',
    tags: ['stats', 'timeline', 'milestones', 'growth', 'about'],
    previewComponent: 'stats-timeline',
    deps: [],
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
  },
  {
    id: 'logo-grid',
    name: 'Bordered Logo Grid',
    category: 'Logo Clouds',
    description:
      'Hairline-separated cells that hold still and show the whole set at once — the logo wall for a footer, a customers page, or anywhere the count is the claim.',
    tags: ['logos', 'grid', 'social proof', 'customers', 'static'],
    previewComponent: 'logo-grid',
    deps: [],
  },
  {
    id: 'logo-strip',
    name: 'Under-Hero Logo Strip',
    category: 'Logo Clouds',
    description:
      'One unbordered line of wordmarks beside a claim you can actually be wrong about, sized to sit under a hero without pushing the CTA down or moving while the headline is being read.',
    tags: ['logos', 'social proof', 'hero', 'strip', 'customers'],
    previewComponent: 'logo-strip',
    deps: ['lucide-react'],
    thumbHeight: 'h-24',
  },
  {
    id: 'logo-segments',
    name: 'Logos Grouped by Industry',
    category: 'Logo Clouds',
    description:
      'Customer logos under segment headings as a description list, with an “and 40 more” count for the ones under NDA — answers whether you have done this for someone like the reader, which a flat wall cannot.',
    tags: ['logos', 'industry', 'segments', 'enterprise', 'customers'],
    previewComponent: 'logo-segments',
    deps: [],
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
  },
  {
    id: 'feature-rows',
    name: 'Alternating Feature Rows',
    category: 'Feature Sections',
    description:
      'A full row per feature with the media side flipping each time, so the eye re-enters the page instead of skimming a stack of identical blocks.',
    tags: ['features', 'alternating', 'zig zag', 'rows', 'marketing'],
    previewComponent: 'feature-rows',
    deps: ['lucide-react'],
  },
  {
    id: 'feature-icon-grid',
    name: 'Icon Feature Grid',
    category: 'Feature Sections',
    description:
      'Uniform cells, no spans, no state — the grid for nine things that matter equally, where a bento would be a wall and tabs would be a filing cabinet.',
    tags: ['features', 'grid', 'icons', 'marketing', 'benefits'],
    previewComponent: 'feature-icon-grid',
    deps: ['lucide-react'],
  },
  {
    id: 'integration-grid',
    name: 'Integration Directory Grid',
    category: 'Feature Sections',
    description:
      'What each integration actually does, not a wall of logos — with availability as a text pill rather than a tinted border, and the name as the link so the card is not one enormous one.',
    tags: ['integrations', 'directory', 'grid', 'ecosystem', 'compatibility'],
    previewComponent: 'integration-grid',
    deps: [],
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
  },
  {
    id: 'feature-tabs',
    name: 'Tabbed Feature Showcase',
    category: 'Feature Sections',
    description:
      'Features as a real tablist — arrow keys, roving focus and a drawn product panel per tab — for the section where four features would otherwise fight for one scroll.',
    tags: ['features', 'tabs', 'showcase', 'interactive', 'product'],
    previewComponent: 'feature-tabs',
    deps: ['lucide-react'],
    featured: true,
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
  },
  {
    id: 'pricing-single',
    name: 'Single-Plan Price Card',
    category: 'Pricing',
    description:
      'One price given a whole card, with the objection a one-time price raises answered under the button rather than in a FAQ further down.',
    tags: ['pricing', 'one time', 'single plan', 'lifetime', 'checkout'],
    previewComponent: 'pricing-single',
    deps: ['lucide-react'],
  },
  {
    id: 'pricing-usage-calculator',
    name: 'Tiered Usage Calculator',
    category: 'Pricing',
    description:
      'A slider that turns a rate card into the number a buyer actually cares about, with a per-tier breakdown so the total can be checked rather than taken on trust.',
    tags: ['pricing', 'usage', 'calculator', 'slider', 'metered'],
    previewComponent: 'pricing-usage-calculator',
    deps: [],
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
  },
  {
    id: 'pricing-credits',
    name: 'Prepaid Credit Packs',
    category: 'Pricing',
    description:
      'One-time packs with the per-credit price worked out for the reader and the saving stated rather than implied — the pricing shape for a product that sells quantity, not a subscription.',
    tags: ['pricing', 'credits', 'one-time', 'packs', 'prepaid'],
    previewComponent: 'pricing-credits',
    deps: ['lucide-react'],
  },
  {
    id: 'pricing-plan-picker',
    name: 'In-App Plan Picker',
    category: 'Pricing',
    description:
      'A native radiogroup of plans with the current one disabled and the prorated charge announced as it changes — the upgrade dialog, not the marketing table.',
    tags: ['pricing', 'upgrade', 'radio', 'billing', 'form'],
    previewComponent: 'pricing-plan-picker',
    deps: ['lucide-react'],
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
  },
  {
    id: 'testimonial-spotlight',
    name: 'Single-Quote Spotlight',
    category: 'Testimonials',
    description:
      'One customer, quoted at length and backed by a stat row — the section for when a single believable story argues better than a wall of five-star fragments.',
    tags: ['testimonial', 'quote', 'case study', 'stats', 'social proof'],
    previewComponent: 'testimonial-spotlight',
    deps: ['lucide-react'],
  },
  {
    id: 'testimonial-ratings',
    name: 'Aggregate Rating Breakdown',
    category: 'Testimonials',
    description:
      'A mean score over a stated sample with all five rating bands left visible, including the one-star row — proof that survives the objection every hand-picked quote wall invites.',
    tags: ['reviews', 'ratings', 'stars', 'social proof', 'aggregate'],
    previewComponent: 'testimonial-ratings',
    deps: ['lucide-react'],
  },
  {
    id: 'testimonial-carousel',
    name: 'Scroll-Snap Quote Rail',
    category: 'Testimonials',
    description:
      'Twenty quotes in the height of six, scrolled by CSS snap points with arrows that disable at the ends — no auto-advance, and every quote stays in the DOM for search and Cmd-F.',
    tags: ['testimonials', 'carousel', 'scroll snap', 'quotes', 'rail'],
    previewComponent: 'testimonial-carousel',
    deps: ['lucide-react'],
  },
  {
    id: 'testimonial-video',
    name: 'Video Testimonial Cards',
    category: 'Testimonials',
    description:
      'Poster tiles linking out to recordings, each with a pull-quote that has to land for the majority who never press play, and a drawn placeholder until you supply a still.',
    tags: ['testimonials', 'video', 'social proof', 'customers', 'quotes'],
    previewComponent: 'testimonial-video',
    deps: ['lucide-react'],
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
  },
  {
    id: 'faq-two-column',
    name: 'Two-Column FAQ with Help Rail',
    category: 'FAQ',
    description:
      'Questions on the right against a sticky rail that keeps a route to a human in view — for the visitor whose objection is not on the list.',
    tags: ['faq', 'two column', 'sticky', 'support', 'questions'],
    previewComponent: 'faq-two-column',
    deps: ['lucide-react'],
  },
  {
    id: 'faq-grid',
    name: 'Open FAQ Grid',
    category: 'FAQ',
    description:
      'Every answer rendered and visible in a two-column description list — the FAQ shape for a marketing page, where collapsed text is text a search engine will not quote.',
    tags: ['faq', 'grid', 'seo', 'description list', 'questions'],
    previewComponent: 'faq-grid',
    deps: [],
  },
  {
    id: 'faq-categorized',
    name: 'FAQ Grouped by Topic',
    category: 'FAQ',
    description:
      'Anchor-linked topic pills over per-topic details groups with the first answer open — for the FAQ that outgrew a single list, working with JavaScript disabled.',
    tags: ['faq', 'topics', 'categories', 'anchors', 'no-js'],
    previewComponent: 'faq-categorized',
    deps: ['lucide-react'],
  },
  {
    id: 'faq-search',
    name: 'Filterable FAQ with Fallback',
    category: 'FAQ',
    description:
      'A search that narrows the list across answers and keywords, announces the count, and turns an empty result into the contact route it should always have been.',
    tags: ['faq', 'search', 'filter', 'help centre', 'support'],
    previewComponent: 'faq-search',
    deps: ['lucide-react'],
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
  },
  {
    id: 'blog-post-grid',
    name: 'Blog Index Grid',
    category: 'Content & Blog',
    description:
      'A featured post at full width above a card grid, with drawn covers built from tokens — a blog index with no image pipeline and no broken-thumbnail state.',
    tags: ['blog', 'posts', 'grid', 'featured', 'content'],
    previewComponent: 'blog-post-grid',
    deps: ['lucide-react'],
    featured: true,
  },
  {
    id: 'article-header',
    name: 'Article Header & Byline',
    category: 'Content & Blog',
    description:
      'Kicker, headline, standfirst, byline and share row, with the opening prose and a pull quote included — the type scale of a post, decided once instead of per-article.',
    tags: ['article', 'blog post', 'byline', 'typography', 'editorial'],
    previewComponent: 'article-header',
    deps: ['lucide-react'],
  },
  {
    id: 'team-grid',
    name: 'Team Grid',
    category: 'Content & Blog',
    description:
      'An about-page team section on initials avatars rather than photos, so shipping it never waits on headshots and there is no broken-image state to design.',
    tags: ['team', 'about', 'people', 'avatars', 'company'],
    previewComponent: 'team-grid',
    deps: ['lucide-react'],
  },
  {
    id: 'job-listing-board',
    name: 'Careers Openings Board',
    category: 'Content & Blog',
    description:
      'Openings grouped by department with location, type and salary on every row — candidates self-select by craft first, and a flat list makes them scan for it.',
    tags: ['careers', 'jobs', 'hiring', 'openings', 'company'],
    previewComponent: 'job-listing-board',
    deps: ['lucide-react'],
  },
  {
    id: 'docs-layout',
    name: 'Three-Column Docs Frame',
    category: 'Content & Blog',
    description:
      'Sidebar, article and on-this-page rail — each column answers a different question, and they collapse on mobile in the order that keeps the article alive.',
    tags: ['docs', 'documentation', 'sidebar', 'toc', 'layout'],
    previewComponent: 'docs-layout',
    deps: ['lucide-react'],
    featured: true,
  },
  {
    id: 'api-endpoint-card',
    name: 'API Endpoint Reference',
    category: 'Content & Blog',
    description:
      'Method badge, path, parameter table and a request/response pair kept side by side — an example request whose response is a scroll away gets pasted blind.',
    tags: ['api', 'reference', 'endpoint', 'rest', 'developer'],
    previewComponent: 'api-endpoint-card',
    deps: ['lucide-react'],
  },
  {
    id: 'code-tabs-panel',
    name: 'Package Manager Code Tabs',
    category: 'Content & Blog',
    description:
      'One install command behind npm/pnpm/yarn/bun tabs with a working copy button — every reader uses exactly one package manager, so showing all four wastes three lines.',
    tags: ['code', 'tabs', 'install', 'copy', 'developer'],
    previewComponent: 'code-tabs-panel',
    deps: ['lucide-react'],
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
  },
  {
    id: 'cta-split-panel',
    name: 'Closing CTA Panel',
    category: 'CTA Sections',
    description:
      'A rounded gradient panel that restates the offer for the reader who scrolled past everything — heading left, both CTAs right, reassurance points underneath.',
    tags: ['cta', 'conversion', 'closing', 'gradient', 'panel'],
    previewComponent: 'cta-split-panel',
    deps: ['lucide-react'],
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

  {
    id: 'kanban-board',
    name: 'Kanban Board Columns',
    category: 'Dashboards',
    description:
      'Four columns of prioritised, tagged, assigned task cards with a blocked state — the board as a layout contract, leaving drag behaviour to your own state and library.',
    tags: ['kanban', 'board', 'tasks', 'project', 'columns'],
    previewComponent: 'kanban-board',
    deps: ['lucide-react'],
    featured: true,
  },
  {
    id: 'activity-timeline',
    name: 'Audit Log Timeline',
    category: 'Dashboards',
    description:
      'Events grouped by day on a vertical rail, icons varying by type and one entry expanded into a detail card — what keeps forty events scannable instead of forty gray dots.',
    tags: ['audit log', 'timeline', 'events', 'history', 'activity'],
    previewComponent: 'activity-timeline',
    deps: ['lucide-react'],
  },
  {
    id: 'calendar-month',
    name: 'Month Calendar Grid',
    category: 'Dashboards',
    description:
      'A month view where event chips truncate and overflow becomes "+n more", so a busy Tuesday never changes the height of the row it sits in.',
    tags: ['calendar', 'month', 'events', 'schedule', 'grid'],
    previewComponent: 'calendar-month',
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
  },
  {
    id: 'data-table-column-manager',
    name: 'Column Show, Hide & Reorder',
    category: 'Data Tables',
    description:
      'Reordering that works from the keyboard rather than by drag alone, pinned columns that cannot be hidden or moved, and a guard so the last visible column cannot be unchecked into a blank table.',
    tags: ['table', 'columns', 'customise', 'reorder', 'visibility'],
    previewComponent: 'data-table-column-manager',
    deps: ['lucide-react'],
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

  {
    id: 'line-chart-panel',
    name: 'Dual-Series Line Chart',
    category: 'Charts & Metrics',
    description:
      'A year-over-year trend in inline SVG with a printed axis, no charting dependency and the same data repeated as a screen-reader table.',
    tags: ['line chart', 'chart', 'svg', 'trend', 'analytics'],
    previewComponent: 'line-chart-panel',
    deps: [],
    featured: true,
  },
  {
    id: 'donut-breakdown',
    name: 'Donut Breakdown',
    category: 'Charts & Metrics',
    description:
      'Where a total went, drawn as one conic-gradient ring with the total in the hole and every number repeated in the legend.',
    tags: ['donut', 'pie chart', 'breakdown', 'conic gradient', 'spend'],
    previewComponent: 'donut-breakdown',
    deps: [],
  },
  {
    id: 'activity-heatmap',
    name: 'Daily Activity Heatmap',
    category: 'Charts & Metrics',
    description:
      'A year of daily activity as one square per day, bucketed against a quantile so a single outlier cannot flatten the scale.',
    tags: ['heatmap', 'calendar', 'activity', 'contributions', 'grid'],
    previewComponent: 'activity-heatmap',
    deps: [],
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
  },
  {
    id: 'payment-method-card',
    name: 'Payment Methods On File',
    category: 'Billing & Usage',
    description:
      'Cards on file with the two failures that cost the subscription: expiry called out before it fails, and the default stated on the row rather than implied by ordering.',
    tags: ['payment', 'card', 'billing', 'stripe', 'checkout'],
    previewComponent: 'payment-method-card',
    deps: ['lucide-react'],
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

  {
    id: 'search-results-panel',
    name: 'Grouped Search Results',
    category: 'Command & Search',
    description:
      'Results grouped by section with visible breadcrumb paths and <mark>-highlighted matches — users recognise where a result lives faster than they read its snippet.',
    tags: ['search', 'results', 'docs', 'filter', 'highlight'],
    previewComponent: 'search-results-panel',
    deps: ['lucide-react'],
  },
  {
    id: 'keyboard-shortcuts-sheet',
    name: 'Keyboard Shortcuts Sheet',
    category: 'Command & Search',
    description:
      'The "?" overlay, with chords written once in one notation and rendered per platform — mod becomes Command on Apple and Ctrl everywhere else, decided after mount so the markup never mismatches.',
    tags: ['shortcuts', 'keyboard', 'hotkeys', 'help', 'accessibility'],
    previewComponent: 'keyboard-shortcuts-sheet',
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
  {
    id: 'upload-progress-list',
    name: 'Upload Progress List',
    category: 'File Upload',
    description:
      'The list that follows the dropzone: complete, uploading, queued and failed rows with cancel and retry — because hiding the failure is the classic upload bug.',
    tags: ['upload', 'progress', 'files', 'retry', 'queue'],
    previewComponent: 'upload-progress-list',
    deps: ['lucide-react'],
  },

  /* ================================================================ *
   *  AI Interfaces — the surfaces an agent product is assembled from
   * ================================================================ *
   * These are not "product blocks with a sparkle icon". Three constraints
   * run through the whole group and are the reason it is separate:
   *
   *  - Live regions are the hard part, not the layout. A thread, a task
   *    list and a streaming answer all mutate while the user is reading
   *    them, and the naive `aria-live="assertive"` wrapper turns each one
   *    into a screen reader talking over its own user. Every block here
   *    states which region announces what, and why.
   *  - Consent is a first-class state. Anything that acts on the world —
   *    approvals, diffs, permission grants — defaults to the least
   *    powerful option, states the effect in words before the verb, and
   *    survives the decision on screen so it can be audited.
   *  - Confidence is never decoration. Scores are `<meter>`, bands are
   *    written out, and what the model rejected is shown rather than
   *    hidden, because automation bias is the failure mode these screens
   *    actually have.
   *
   * Motion: everything that streams, spins or shimmers is either gated
   * behind `motion-safe:` (decorative) or slowed under `motion-reduce:`
   * (status). A frozen spinner reads as a hung request, which removes the
   * feedback rather than the discomfort.
   */

  {
    id: 'csv-import-mapper',
    name: 'CSV Column Mapper',
    category: 'File Upload',
    description:
      'The screen between "file uploaded" and "data imported": source columns mapped to schema fields, with a sample value under each and required fields blocking the button.',
    tags: ['csv', 'import', 'mapping', 'spreadsheet', 'data'],
    previewComponent: 'csv-import-mapper',
    deps: ['lucide-react'],
    featured: true,
  },
  {
    id: 'avatar-crop-upload',
    name: 'Avatar Crop & Upload',
    category: 'File Upload',
    description:
      'Framing a profile photo with keyboard-operable zoom and position, showing what gets trimmed rather than hiding it behind the mask.',
    tags: ['avatar', 'crop', 'upload', 'profile', 'image'],
    previewComponent: 'avatar-crop-upload',
    deps: ['lucide-react'],
  },

  /* ---------------------------- Agent Chat ------------------------- */
  {
    id: 'chat-thread-panel',
    name: 'Assistant Thread with Composer',
    category: 'Agent Chat',
    description:
      'A scrolling conversation with per-turn actions, announced as a polite log restricted to additions — so a streaming reply is not re-read on every token — and auto-scroll that only pins when the user is already at the bottom.',
    tags: ['chat', 'thread', 'assistant', 'conversation', 'aria-live'],
    previewComponent: 'chat-thread-panel',
    deps: ['lucide-react'],
    featured: true,
  },
  {
    id: 'chat-prompt-bar',
    name: 'Composer with @ Sources and / Commands',
    category: 'Agent Chat',
    description:
      'The trigger menus done properly: @ and / open only at a token boundary, the query is derived from the caret so the menu closes itself, and focus never leaves the textarea — the combobox pattern, not a floating div.',
    tags: ['composer', 'prompt', 'mentions', 'slash commands', 'combobox'],
    previewComponent: 'chat-prompt-bar',
    deps: ['lucide-react'],
    featured: true,
    // A composer is a bar, not a section — measured at 103px in the card.
    thumbHeight: 'h-28',
  },
  {
    id: 'chat-streaming-answer',
    name: 'Streaming Answer with Citations',
    category: 'Agent Chat',
    description:
      'Token-by-token text with linked citations, follow-up chips and a caret that stops the moment the stream does. The status is announced once; the prose is deliberately outside every live region.',
    tags: ['streaming', 'citations', 'answer', 'typewriter', 'reduced motion'],
    previewComponent: 'chat-streaming-answer',
    deps: ['lucide-react'],
    featured: true,
  },
  {
    id: 'chat-empty-state',
    name: 'Assistant Starter Screen',
    category: 'Agent Chat',
    description:
      'The blank thread, answered: grouped starter prompts as real lists of buttons, each group labelled, so the highest-leverage screen in an AI product is not a centred logo.',
    tags: ['empty state', 'starters', 'suggestions', 'onboarding', 'chat'],
    previewComponent: 'chat-empty-state',
    deps: ['lucide-react'],
  },

  /* -------------------------- Agent Reasoning ---------------------- */
  {
    id: 'agent-thinking-trace',
    name: 'Collapsible Thinking Trace',
    category: 'Agent Reasoning',
    description:
      'The "thought for 5s" panel: a native details/summary outside, individually expandable steps inside — buttons rather than nested disclosures, which are announced as a disclosure within a disclosure.',
    tags: ['reasoning', 'thinking', 'trace', 'steps', 'disclosure'],
    previewComponent: 'agent-thinking-trace',
    deps: ['lucide-react'],
    featured: true,
    thumbHeight: 'h-48',
  },
  {
    id: 'agent-tool-calls',
    name: 'Tool Call Chips',
    category: 'Agent Reasoning',
    description:
      'Dense tool invocations that open into their arguments and result, with status carried by icon and word rather than colour, and errors marked as alerts only once the user opens them.',
    tags: ['tools', 'function calling', 'chips', 'logs', 'status'],
    previewComponent: 'agent-tool-calls',
    deps: ['lucide-react'],
    thumbHeight: 'h-32',
  },
  {
    id: 'agent-task-list',
    name: 'Live Agent Task List',
    category: 'Agent Reasoning',
    description:
      'Run status as rows — done, running, failed, queued — with native progress elements, per-task retry buttons that name their task, and progress announced from one small status region instead of every row.',
    tags: ['tasks', 'run status', 'progress', 'queue', 'agent'],
    previewComponent: 'agent-task-list',
    deps: ['lucide-react'],
  },
  {
    id: 'agent-working-indicator',
    name: 'Working Indicator with Elapsed Time',
    category: 'Agent Reasoning',
    description:
      'The gap before the first token: a shimmer grid, a phase label that advances as the wait lengthens, and a running counter — which is the only honest answer to "is it stuck". The timer is hidden from the live region on purpose.',
    tags: ['loading', 'shimmer', 'elapsed', 'pending', 'reduced motion'],
    previewComponent: 'agent-working-indicator',
    deps: ['lucide-react'],
    // The shortest block in the catalog — 66px in the card at the default
    // crop, which reads as a broken preview rather than a small component.
    thumbHeight: 'h-20',
  },

  /* ------------------------ Human in the Loop ---------------------- */
  {
    id: 'approval-request-card',
    name: 'Approval Request with Blast Radius',
    category: 'Human in the Loop',
    description:
      'The agent stops and asks: the effect stated before the verb, choices as radios in a fieldset so picking is separate from committing, no pre-focused Approve, and the decision left on screen afterwards.',
    tags: ['approval', 'human in the loop', 'consent', 'guardrail', 'agent'],
    previewComponent: 'approval-request-card',
    deps: ['lucide-react'],
    featured: true,
  },
  {
    id: 'agent-diff-review',
    name: 'Proposed Edits Diff Table',
    category: 'Human in the Loop',
    description:
      'Machine-proposed row edits accepted one at a time, with before and after in real del/ins elements, a tri-state select-all that actually sets indeterminate, and a running count of what will be written.',
    tags: ['diff', 'review', 'bulk edit', 'accept reject', 'table'],
    previewComponent: 'agent-diff-review',
    deps: ['lucide-react'],
    featured: true,
  },
  {
    id: 'confidence-recommendation',
    name: 'Recommendation with Confidence Meter',
    category: 'Human in the Loop',
    description:
      'A suggestion scored with a native meter rather than a styled bar, banded in words as well as numbers, and showing what the model rejected — the fastest way a human catches a bad recommendation.',
    tags: ['recommendation', 'confidence', 'meter', 'suggestion', 'trust'],
    previewComponent: 'confidence-recommendation',
    deps: ['lucide-react'],
  },
  {
    id: 'permission-scope-dialog',
    name: 'Agent Permission Scopes',
    category: 'Human in the Loop',
    description:
      'Read and write scopes separated rather than bundled, writes off by default, a required expiry, and switches that are real checkboxes with role="switch" — so the grant is toggleable by keyboard and announced as on or off.',
    tags: ['permissions', 'scopes', 'consent', 'switch', 'security'],
    previewComponent: 'permission-scope-dialog',
    deps: ['lucide-react'],
  },

  /* ----------------------- Retrieval & Context --------------------- */
  {
    id: 'context-chunk-cards',
    name: 'Retrieved Context Chunks',
    category: 'Retrieval & Context',
    description:
      'The RAG debugging surface: ranked passages with similarity as a meter, matched spans in real mark elements, and filter chips wired as a radiogroup so arrows move between them.',
    tags: ['rag', 'retrieval', 'chunks', 'embeddings', 'similarity'],
    previewComponent: 'context-chunk-cards',
    deps: ['lucide-react'],
    featured: true,
  },
  {
    id: 'source-citation-list',
    name: 'Answer Source Citations',
    category: 'Retrieval & Context',
    description:
      'The published footnotes under an answer — ordered list, real cite and time elements, the claim each source supports, and a staleness warning written in words rather than shown as an amber dot.',
    tags: ['citations', 'sources', 'footnotes', 'provenance', 'trust'],
    previewComponent: 'source-citation-list',
    deps: ['lucide-react'],
  },
  {
    id: 'knowledge-source-picker',
    name: 'Knowledge Source Picker',
    category: 'Retrieval & Context',
    description:
      'Choosing what the assistant may read, with indexing state told honestly — a half-indexed source says so rather than showing a green tick — and the footer stating the effect of the selection, not its cardinality.',
    tags: ['knowledge base', 'sources', 'indexing', 'connectors', 'rag'],
    previewComponent: 'knowledge-source-picker',
    deps: ['lucide-react'],
  },
  {
    id: 'retrieval-empty-state',
    name: 'Nothing Found, Answered Honestly',
    category: 'Retrieval & Context',
    description:
      'The refusal screen: says plainly that nothing was found, shows where it looked and the near-misses below threshold, and offers the two real ways out instead of inventing an answer.',
    tags: ['empty state', 'no results', 'rag', 'refusal', 'honesty'],
    previewComponent: 'retrieval-empty-state',
    deps: ['lucide-react'],
  },

  /* ------------------------ Inline AI Actions ---------------------- */
  {
    id: 'selection-ai-toolbar',
    name: 'Selection Action Toolbar',
    category: 'Inline AI Actions',
    description:
      'Highlight a passage and hand it to the model. Positioned from the range rect relative to its container, raised by selectionchange so Shift-Arrow works, and every button prevents the mousedown that would collapse the selection.',
    tags: ['selection', 'toolbar', 'rewrite', 'inline ai', 'editor'],
    previewComponent: 'selection-ai-toolbar',
    deps: ['lucide-react'],
    featured: true,
    thumbHeight: 'h-40',
  },
  {
    id: 'ai-inline-suggestion',
    name: 'Ghost Text Completion',
    category: 'Inline AI Actions',
    description:
      'Copilot-style completion in a plain textarea: a transparent-caret field over a metric-matched mirror, Tab to accept, Escape that actually sticks, and the suggestion announced rather than left as invisible grey text.',
    tags: ['autocomplete', 'ghost text', 'completion', 'inline ai', 'textarea'],
    previewComponent: 'ai-inline-suggestion',
    deps: ['lucide-react'],
    thumbHeight: 'h-36',
  },
  {
    id: 'ai-inspector-panel',
    name: 'Agent-Adjusted Inspector',
    category: 'Inline AI Actions',
    description:
      'The model edits real properties and every change is attributed and reversible — per-property provenance in words, per-property revert, and sliders whose aria-valuetext carries the unit.',
    tags: ['inspector', 'properties', 'fine-tune', 'provenance', 'undo'],
    previewComponent: 'ai-inspector-panel',
    deps: ['lucide-react'],
  },
  {
    id: 'ai-insight-cards',
    name: 'Unprompted Insight Cards',
    category: 'Inline AI Actions',
    description:
      'Findings the agent surfaced on its own, paged one at a time, each stating its magnitude rather than its direction, dismissible, and carrying a sparkline that is also a sentence for anyone who cannot see it.',
    tags: ['insights', 'sparkline', 'anomaly', 'proactive', 'svg'],
    previewComponent: 'ai-insight-cards',
    deps: ['lucide-react'],
    thumbHeight: 'h-48',
  },

  /* ================================================================ *
   *  Commerce
   * ================================================================ *
   * Money is integer minor units in every block here, formatted through
   * `Intl.NumberFormat` at the edge. Floats are how `19.99 * 3` becomes
   * 59.97000000000001 in a cart total, and it is always found in
   * production rather than in review.
   *
   * Product images are Tailwind gradient placeholders, never remote URLs:
   * a block that fetches from a CDN breaks offline, in a sandbox, and in
   * the preview on this site. Swap for `next/image` when wiring up.
   */

  /* ---------------------------- Product Listings ------------------ */
  {
    id: 'product-grid',
    name: 'Product Card Grid',
    category: 'Product Listings',
    description:
      'Responsive product cards with sale badges, ratings and a wishlist button layered above the card link so it stays clickable.',
    tags: ['products', 'grid', 'shop', 'catalogue', 'cards'],
    previewComponent: 'product-grid',
    deps: ['lucide-react'],
    featured: true,
  },
  {
    id: 'product-filter-sidebar',
    name: 'Faceted Filter Sidebar',
    category: 'Product Listings',
    description:
      'Category, size, colour and price facets as proper fieldsets, with colour swatches that carry their name as well as their hue.',
    tags: ['filters', 'facets', 'sidebar', 'refine', 'shop'],
    previewComponent: 'product-filter-sidebar',
    deps: ['lucide-react'],
    featured: true,
  },
  {
    id: 'collection-toolbar',
    name: 'Collection Sort Toolbar',
    category: 'Product Listings',
    description:
      'Result count, sort and density switch — with the count in an aria-live region, since it is the only feedback a filter change gives some users.',
    tags: ['toolbar', 'sort', 'collection', 'shop', 'results'],
    previewComponent: 'collection-toolbar',
    deps: ['lucide-react'],
  },
  {
    id: 'product-rail',
    name: 'Scroll-Snap Product Rail',
    category: 'Product Listings',
    description:
      'A "you might also like" row on native scroll-snap — touch swiping, momentum and keyboard support for free, with no carousel library.',
    tags: ['carousel', 'rail', 'related', 'scroll snap', 'products'],
    previewComponent: 'product-rail',
    deps: [],
    featured: true,
  },

  /* ---------------------------- Product Detail -------------------- */
  {
    id: 'product-gallery',
    name: 'Product Image Gallery',
    category: 'Product Detail',
    description:
      'Main image with a thumbnail strip built as a real tablist, so arrow keys work and the ratio is fixed to stop the buy box shifting.',
    tags: ['gallery', 'images', 'product', 'thumbnails', 'tabs'],
    previewComponent: 'product-gallery',
    deps: ['lucide-react'],
    featured: true,
  },
  {
    id: 'product-buy-box',
    name: 'Variant & Add-to-Cart Box',
    category: 'Product Detail',
    description:
      'Price, variant radiogroup, quantity stepper and add-to-bag — with sold-out sizes disabled and visible rather than hidden.',
    tags: ['buy box', 'variants', 'add to cart', 'quantity', 'product'],
    previewComponent: 'product-buy-box',
    deps: ['lucide-react'],
    featured: true,
  },
  {
    id: 'product-info-accordion',
    name: 'Product Details Accordion',
    category: 'Product Detail',
    description:
      'Description, materials, delivery and returns in named <details> elements — no JavaScript, and the copy stays indexable while collapsed.',
    tags: ['accordion', 'product details', 'specs', 'shipping', 'no-js'],
    previewComponent: 'product-info-accordion',
    deps: ['lucide-react'],
  },
  {
    id: 'product-review-summary',
    name: 'Rating Distribution Summary',
    category: 'Product Detail',
    description:
      'Average rating with a clickable histogram — because a 4.3 of forties and fives is a different product from a 4.3 of ones and fives.',
    tags: ['reviews', 'rating', 'histogram', 'stars', 'product'],
    previewComponent: 'product-review-summary',
    deps: ['lucide-react'],
    featured: true,
  },

  /* ---------------------------- Cart & Checkout ------------------- */
  {
    id: 'cart-drawer',
    name: 'Slide-Over Cart Drawer',
    category: 'Cart & Checkout',
    description:
      'A basket panel with the dialog mechanics usually missing: focus trap, focus return, Escape to close and a background scroll lock.',
    tags: ['cart', 'drawer', 'slide over', 'dialog', 'focus trap'],
    previewComponent: 'cart-drawer',
    deps: ['lucide-react'],
    featured: true,
  },
  {
    id: 'cart-line-items',
    name: 'Editable Cart Lines',
    category: 'Cart & Checkout',
    description:
      'Quantity steppers and remove-with-undo, with every total derived rather than stored so the basket can never disagree with itself.',
    tags: ['cart', 'basket', 'quantity', 'undo', 'line items'],
    previewComponent: 'cart-line-items',
    deps: ['lucide-react'],
    featured: true,
  },
  {
    id: 'checkout-form',
    name: 'Checkout Address & Payment',
    category: 'Cart & Checkout',
    description:
      'The full autocomplete token set that lets a browser fill eight fields in one tap, plus address labels that follow the selected country.',
    tags: ['checkout', 'payment', 'address', 'autocomplete', 'form'],
    previewComponent: 'checkout-form',
    deps: ['lucide-react'],
    featured: true,
  },
  {
    id: 'order-summary-panel',
    name: 'Order Summary With Promo',
    category: 'Cart & Checkout',
    description:
      'Subtotal, discount, delivery and tax all derived from the lines, with the free-delivery nudge driven by the same threshold as the charge.',
    tags: ['order summary', 'totals', 'promo code', 'checkout', 'tax'],
    previewComponent: 'order-summary-panel',
    deps: ['lucide-react'],
    featured: true,
  },

  /* ---------------------------- Orders & Reviews ------------------ */
  {
    id: 'order-confirmation',
    name: 'Order Confirmation',
    category: 'Orders & Reviews',
    description:
      'The thank-you screen built to prevent two support emails: a selectable order number and a delivery date range rather than "soon".',
    tags: ['order confirmation', 'thank you', 'receipt', 'checkout', 'success'],
    previewComponent: 'order-confirmation',
    deps: ['lucide-react'],
    featured: true,
  },
  {
    id: 'order-history-list',
    name: 'Order History',
    category: 'Orders & Reviews',
    description:
      'Past orders with stacked item thumbnails and worded statuses — people recognise what they bought long before the order number.',
    tags: ['orders', 'history', 'account', 'tracking', 'status'],
    previewComponent: 'order-history-list',
    deps: ['lucide-react'],
  },
  {
    id: 'review-list',
    name: 'Customer Reviews',
    category: 'Orders & Reviews',
    description:
      'Sortable reviews with verified-purchase badges, optimistic helpful votes and a real expand control instead of a fade that hides text.',
    tags: ['reviews', 'ratings', 'verified', 'social proof', 'ugc'],
    previewComponent: 'review-list',
    deps: ['lucide-react'],
    featured: true,
  },
]
