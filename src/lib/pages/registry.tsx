/**
 * Page id → the rendered preview for that page.
 *
 * Elements rather than component types, for the same reason as the block
 * registry: looking a component out of a map and instantiating it inside a
 * render is the pattern `react-hooks/static-components` catches, and it
 * cannot tell a module-level map from one rebuilt every render. Creating
 * the element at module load makes its identity provably stable.
 *
 * Default imports, because each source is written as a real Next.js page —
 * `export default function` is the shape the file has to have when it lands
 * in someone's `app/` directory, and the preview should not need a
 * different one.
 */

import type * as React from 'react'

import SaasLandingPage from './sources/saas-landing-page'
import WaitlistLandingPage from './sources/waitlist-landing-page'
import DeveloperToolLandingPage from './sources/developer-tool-landing-page'
import MobileAppLandingPage from './sources/mobile-app-landing-page'
import AgencyLandingPage from './sources/agency-landing-page'
import LocalServiceLandingPage from './sources/local-service-landing-page'
import MarketplaceLandingPage from './sources/marketplace-landing-page'
import EnterpriseLandingPage from './sources/enterprise-landing-page'
import IntegrationPlatformLandingPage from './sources/integration-platform-landing-page'
import CreatorCourseLandingPage from './sources/creator-course-landing-page'
import PricingPage from './sources/pricing-page'
import BlogIndexPage from './sources/blog-index-page'
import ArticlePage from './sources/article-page'
import CareersPage from './sources/careers-page'
import DocsPage from './sources/docs-page'
import HelpCentrePage from './sources/help-centre-page'
import ChangelogPage from './sources/changelog-page'
import ProjectBoardPage from './sources/project-board-page'
import DashboardOverview from './sources/dashboard-overview'
import AiAssistantPage from './sources/ai-assistant-page'
import CustomersTablePage from './sources/customers-table-page'
import SettingsAccountPage from './sources/settings-account-page'
import BillingPage from './sources/billing-page'
import LoginPage from './sources/login-page'
import Error404Page from './sources/error-404-page'

import CollectionPage from './sources/collection-page'
import ProductDetailPage from './sources/product-detail-page'
import CartPage from './sources/cart-page'
import CheckoutPage from './sources/checkout-page'
import OrderConfirmationPage from './sources/order-confirmation-page'
import AccountOrdersPage from './sources/account-orders-page'
import SignupPage from './sources/signup-page'
import ForgotPasswordPage from './sources/forgot-password-page'
import TwoFactorPage from './sources/two-factor-page'
import SsoLoginPage from './sources/sso-login-page'
import Error500Page from './sources/error-500-page'
import MaintenancePage from './sources/maintenance-page'
import PermissionDeniedPage from './sources/permission-denied-page'
import UsagePage from './sources/usage-page'
import InvoicesPage from './sources/invoices-page'
import OnboardingPage from './sources/onboarding-page'
import SearchPage from './sources/search-page'
import AgentRunPage from './sources/agent-run-page'
import ApprovalsPage from './sources/approvals-page'
import AssistantChatPage from './sources/assistant-chat-page'
import AgentInspectorPage from './sources/agent-inspector-page'
import RetrievalConsolePage from './sources/retrieval-console-page'
import AiEditorPage from './sources/ai-editor-page'
import RecordsTablePage from './sources/records-table-page'
import AnalyticsPage from './sources/analytics-page'
import AlertingPage from './sources/alerting-page'
import NotificationSettingsPage from './sources/notification-settings-page'
import TeamAccessPage from './sources/team-access-page'
import ImportDataPage from './sources/import-data-page'
import AccountSetupPage from './sources/account-setup-page'
import ResetPasswordPage from './sources/reset-password-page'
import AppShellPage from './sources/app-shell-page'
import SecurityLandingPage from './sources/security-landing-page'
import MigrationLandingPage from './sources/migration-landing-page'
import LaunchNotePage from './sources/launch-note-page'
import SingleOfferPage from './sources/single-offer-page'
import PlanChangePage from './sources/plan-change-page'
import ProductComparePage from './sources/product-compare-page'
import ExpressCheckoutPage from './sources/express-checkout-page'
import OrderTrackingPage from './sources/order-tracking-page'
import WorkspaceActivityPage from './sources/workspace-activity-page'
import FirstRunPage from './sources/first-run-page'

export const PAGE_PREVIEWS: Record<string, React.ReactNode> = {
  'saas-landing-page': <SaasLandingPage />,
  'waitlist-landing-page': <WaitlistLandingPage />,
  'developer-tool-landing-page': <DeveloperToolLandingPage />,
  'mobile-app-landing-page': <MobileAppLandingPage />,
  'agency-landing-page': <AgencyLandingPage />,
  'local-service-landing-page': <LocalServiceLandingPage />,
  'marketplace-landing-page': <MarketplaceLandingPage />,
  'enterprise-landing-page': <EnterpriseLandingPage />,
  'integration-platform-landing-page': <IntegrationPlatformLandingPage />,
  'creator-course-landing-page': <CreatorCourseLandingPage />,
  'pricing-page': <PricingPage />,
  'blog-index-page': <BlogIndexPage />,
  'article-page': <ArticlePage />,
  'careers-page': <CareersPage />,
  'docs-page': <DocsPage />,
  'help-centre-page': <HelpCentrePage />,
  'changelog-page': <ChangelogPage />,
  'project-board-page': <ProjectBoardPage />,
  'dashboard-overview': <DashboardOverview />,
  'ai-assistant-page': <AiAssistantPage />,
  'customers-table-page': <CustomersTablePage />,
  'settings-account-page': <SettingsAccountPage />,
  'billing-page': <BillingPage />,
  'login-page': <LoginPage />,
  'error-404-page': <Error404Page />,

  'collection-page': <CollectionPage />,
  'product-detail-page': <ProductDetailPage />,
  'cart-page': <CartPage />,
  'checkout-page': <CheckoutPage />,
  'order-confirmation-page': <OrderConfirmationPage />,
  'account-orders-page': <AccountOrdersPage />,
  'signup-page': <SignupPage />,
  'forgot-password-page': <ForgotPasswordPage />,
  'two-factor-page': <TwoFactorPage />,
  'sso-login-page': <SsoLoginPage />,
  'error-500-page': <Error500Page />,
  'maintenance-page': <MaintenancePage />,
  'permission-denied-page': <PermissionDeniedPage />,
  'usage-page': <UsagePage />,
  'invoices-page': <InvoicesPage />,
  'onboarding-page': <OnboardingPage />,
  'search-page': <SearchPage />,
  'agent-run-page': <AgentRunPage />,
  'approvals-page': <ApprovalsPage />,

  /* The composition wave, 2026-09-10 — see the note in catalog.ts. */
  'assistant-chat-page': <AssistantChatPage />,
  'agent-inspector-page': <AgentInspectorPage />,
  'retrieval-console-page': <RetrievalConsolePage />,
  'ai-editor-page': <AiEditorPage />,
  'records-table-page': <RecordsTablePage />,
  'analytics-page': <AnalyticsPage />,
  'alerting-page': <AlertingPage />,
  'notification-settings-page': <NotificationSettingsPage />,
  'team-access-page': <TeamAccessPage />,
  'import-data-page': <ImportDataPage />,
  'account-setup-page': <AccountSetupPage />,
  'reset-password-page': <ResetPasswordPage />,
  'app-shell-page': <AppShellPage />,
  'security-landing-page': <SecurityLandingPage />,
  'migration-landing-page': <MigrationLandingPage />,
  'launch-note-page': <LaunchNotePage />,
  'single-offer-page': <SingleOfferPage />,
  'plan-change-page': <PlanChangePage />,
  'product-compare-page': <ProductComparePage />,
  'express-checkout-page': <ExpressCheckoutPage />,
  'order-tracking-page': <OrderTrackingPage />,
  'workspace-activity-page': <WorkspaceActivityPage />,
  'first-run-page': <FirstRunPage />,
}

/** The rendered preview for a page, or undefined if the key is unknown. */
export function getPagePreview(key: string): React.ReactNode | undefined {
  return PAGE_PREVIEWS[key]
}
