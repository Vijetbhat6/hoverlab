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
import PricingPage from './sources/pricing-page'
import DashboardOverview from './sources/dashboard-overview'
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

export const PAGE_PREVIEWS: Record<string, React.ReactNode> = {
  'saas-landing-page': <SaasLandingPage />,
  'pricing-page': <PricingPage />,
  'dashboard-overview': <DashboardOverview />,
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
}

/** The rendered preview for a page, or undefined if the key is unknown. */
export function getPagePreview(key: string): React.ReactNode | undefined {
  return PAGE_PREVIEWS[key]
}
