/**
 * Block id → the rendered preview for that block.
 *
 * The entries here are the very same modules whose text ships as the
 * block's source. A preview built from a re-expressed copy of the markup
 * drifts from what the user pastes, and the drift is only ever caught by
 * eye; pointing both at one file makes that class of bug unrepresentable.
 *
 * The map holds *elements*, not component types. Looking a component type
 * out of a map and instantiating it as `<Component />` inside a render is
 * the pattern `react-hooks/static-components` exists to catch — it cannot
 * tell a stable module-level map from one rebuilt every render, and a
 * component whose identity changes remounts and drops its state. Storing
 * `<StatsBand />` instead moves the instantiation to module load, where the
 * element object is created once and is genuinely stable. Elements are
 * immutable, so the same one can be rendered in the grid and on the detail
 * page without them interfering.
 *
 * Deliberately NOT a client module. Some sources are server components and
 * some carry their own `'use client'`; keeping the registry neutral lets
 * each source decide, and lets the block pages stay server-rendered. Adding
 * `'use client'` here would drag every block into the client graph and
 * force the ones that do not need it to hydrate for nothing.
 *
 * Static imports rather than `React.lazy` or a dynamic `import()`: the map
 * has to be exhaustive at build time for `/blocks` to render a grid of live
 * previews in one pass, and 13 sections is not enough weight to justify a
 * suspense boundary per card.
 */

import type * as React from 'react'

import { HeroSplit } from './sources/hero-split'
import { HeroCentered } from './sources/hero-centered'
import { HeroScreenshot } from './sources/hero-screenshot'
import { HeroWaitlist } from './sources/hero-waitlist'

import { NavbarSimple } from './sources/navbar-simple'
import { NavbarMegaMenu } from './sources/navbar-mega-menu'
import { NavMobileDrawer } from './sources/nav-mobile-drawer'

import { FooterMega } from './sources/footer-mega'
import { FooterMinimal } from './sources/footer-minimal'
import { FooterNewsletter } from './sources/footer-newsletter'

import { ContactFormSplit } from './sources/contact-form-split'
import { MultiStepForm } from './sources/multi-step-form'

import { ConfirmDialog } from './sources/confirm-dialog'
import { SlideOverPanel } from './sources/slide-over-panel'

import { OnboardingChecklist } from './sources/onboarding-checklist'
import { SetupWizard } from './sources/setup-wizard'

import { ToastStack } from './sources/toast-stack'
import { NotificationInbox } from './sources/notification-inbox'

import { StatsBand } from './sources/stats-band'
import { LogoCloud } from './sources/logo-cloud'
import { BentoFeatures } from './sources/bento-features'
import { PersonaCards } from './sources/persona-cards'
import { CodeShowcase } from './sources/code-showcase'
import { PricingTiers } from './sources/pricing-tiers'
import { ComparisonTable } from './sources/comparison-table'
import { TestimonialGrid } from './sources/testimonial-grid'
import { FaqAccordion } from './sources/faq-accordion'
import { ChangelogTimeline } from './sources/changelog-timeline'
import { RoadmapColumns } from './sources/roadmap-columns'
import { NewsletterSignup } from './sources/newsletter-signup'
import { CommunityBand } from './sources/community-band'

import { AuthLoginCard } from './sources/auth-login-card'
import { AuthSignupSplit } from './sources/auth-signup-split'
import { AuthOtpVerify } from './sources/auth-otp-verify'
import { AuthForgotPassword } from './sources/auth-forgot-password'
import { AuthResetPassword } from './sources/auth-reset-password'
import { AuthTwoFactor } from './sources/auth-two-factor'

import { DashboardShell } from './sources/dashboard-shell'
import { DashboardStatCards } from './sources/dashboard-stat-cards'
import { DashboardActivityFeed } from './sources/dashboard-activity-feed'
import { DashboardPageHeader } from './sources/dashboard-page-header'

import { DataTableSortable } from './sources/data-table-sortable'
import { DataTableToolbar } from './sources/data-table-toolbar'
import { DataTablePagination } from './sources/data-table-pagination'
import { DataTableExpandable } from './sources/data-table-expandable'

import { SettingsNavLayout } from './sources/settings-nav-layout'
import { SettingsProfileForm } from './sources/settings-profile-form'
import { SettingsTeamMembers } from './sources/settings-team-members'
import { SettingsApiKeys } from './sources/settings-api-keys'
import { SettingsDangerZone } from './sources/settings-danger-zone'

import { EmptyState } from './sources/empty-state-cta'
import { ErrorStateRetry } from './sources/error-state-retry'
import { NotFound404 } from './sources/not-found-404'
import { SkeletonList } from './sources/skeleton-list'

import { MetricSparklineCards } from './sources/metric-sparkline-cards'
import { BarChartPanel } from './sources/bar-chart-panel'
import { UsageMeterPanel } from './sources/usage-meter-panel'

import { BillingPlanSummary } from './sources/billing-plan-summary'
import { InvoiceHistoryTable } from './sources/invoice-history-table'

import { CommandPalette } from './sources/command-palette'
import { FileDropzone } from './sources/file-dropzone'

import { ProductGrid } from './sources/product-grid'
import { ProductFilterSidebar } from './sources/product-filter-sidebar'
import { CollectionToolbar } from './sources/collection-toolbar'
import { ProductRail } from './sources/product-rail'

import { ProductGallery } from './sources/product-gallery'
import { ProductBuyBox } from './sources/product-buy-box'
import { ProductInfoAccordion } from './sources/product-info-accordion'
import { ProductReviewSummary } from './sources/product-review-summary'

import { CartDrawer } from './sources/cart-drawer'
import { CartLineItems } from './sources/cart-line-items'
import { CheckoutForm } from './sources/checkout-form'
import { OrderSummaryPanel } from './sources/order-summary-panel'

import { OrderConfirmation } from './sources/order-confirmation'
import { OrderHistoryList } from './sources/order-history-list'
import { ReviewList } from './sources/review-list'

/**
 * Every block renders with no required props — each source defaults its own
 * content. That is what lets an entry below be a bare `<Block />`, and it is
 * a constraint on new blocks too: a section that cannot render itself has
 * no demo.
 */
export const BLOCK_PREVIEWS: Record<string, React.ReactNode> = {
  'hero-split': <HeroSplit />,
  'hero-centered': <HeroCentered />,
  'hero-screenshot': <HeroScreenshot />,
  'hero-waitlist': <HeroWaitlist />,

  'navbar-simple': <NavbarSimple />,
  'navbar-mega-menu': <NavbarMegaMenu />,
  'nav-mobile-drawer': <NavMobileDrawer />,

  'footer-mega': <FooterMega />,
  'footer-minimal': <FooterMinimal />,
  'footer-newsletter': <FooterNewsletter />,

  'contact-form-split': <ContactFormSplit />,
  'multi-step-form': <MultiStepForm />,

  'confirm-dialog': <ConfirmDialog />,
  'slide-over-panel': <SlideOverPanel />,

  'onboarding-checklist': <OnboardingChecklist />,
  'setup-wizard': <SetupWizard />,

  'toast-stack': <ToastStack />,
  'notification-inbox': <NotificationInbox />,

  'stats-band': <StatsBand />,
  'logo-cloud': <LogoCloud />,
  'bento-features': <BentoFeatures />,
  'persona-cards': <PersonaCards />,
  'code-showcase': <CodeShowcase />,
  'pricing-tiers': <PricingTiers />,
  'comparison-table': <ComparisonTable />,
  'testimonial-grid': <TestimonialGrid />,
  'faq-accordion': <FaqAccordion />,
  'changelog-timeline': <ChangelogTimeline />,
  'roadmap-columns': <RoadmapColumns />,
  'newsletter-signup': <NewsletterSignup />,
  'community-band': <CommunityBand />,

  'auth-login-card': <AuthLoginCard />,
  'auth-signup-split': <AuthSignupSplit />,
  'auth-otp-verify': <AuthOtpVerify />,
  'auth-forgot-password': <AuthForgotPassword />,
  'auth-reset-password': <AuthResetPassword />,
  'auth-two-factor': <AuthTwoFactor />,

  'dashboard-shell': <DashboardShell />,
  'dashboard-stat-cards': <DashboardStatCards />,
  'dashboard-activity-feed': <DashboardActivityFeed />,
  'dashboard-page-header': <DashboardPageHeader />,

  'data-table-sortable': <DataTableSortable />,
  'data-table-toolbar': <DataTableToolbar />,
  'data-table-pagination': <DataTablePagination />,
  'data-table-expandable': <DataTableExpandable />,

  'settings-nav-layout': <SettingsNavLayout />,
  'settings-profile-form': <SettingsProfileForm />,
  'settings-team-members': <SettingsTeamMembers />,
  'settings-api-keys': <SettingsApiKeys />,
  'settings-danger-zone': <SettingsDangerZone />,

  'empty-state-cta': <EmptyState />,
  'error-state-retry': <ErrorStateRetry />,
  'not-found-404': <NotFound404 />,
  'skeleton-list': <SkeletonList />,

  'metric-sparkline-cards': <MetricSparklineCards />,
  'bar-chart-panel': <BarChartPanel />,
  'usage-meter-panel': <UsageMeterPanel />,

  'billing-plan-summary': <BillingPlanSummary />,
  'invoice-history-table': <InvoiceHistoryTable />,

  'command-palette': <CommandPalette />,
  'file-dropzone': <FileDropzone />,

  'product-grid': <ProductGrid />,
  'product-filter-sidebar': <ProductFilterSidebar />,
  'collection-toolbar': <CollectionToolbar />,
  'product-rail': <ProductRail />,

  'product-gallery': <ProductGallery />,
  'product-buy-box': <ProductBuyBox />,
  'product-info-accordion': <ProductInfoAccordion />,
  'product-review-summary': <ProductReviewSummary />,

  'cart-drawer': <CartDrawer />,
  'cart-line-items': <CartLineItems />,
  'checkout-form': <CheckoutForm />,
  'order-summary-panel': <OrderSummaryPanel />,

  'order-confirmation': <OrderConfirmation />,
  'order-history-list': <OrderHistoryList />,
  'review-list': <ReviewList />,
}

/** The rendered preview for a block, or undefined if the key is unknown. */
export function getBlockPreview(key: string): React.ReactNode | undefined {
  return BLOCK_PREVIEWS[key]
}
