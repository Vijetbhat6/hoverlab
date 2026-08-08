/**
 * The customer's account area — order history.
 *
 * Reuses the settings shell from the product tier rather than inventing a
 * second sidebar layout for shoppers. An account area and a settings area
 * are the same shape: a nav of sections beside one panel. Building a
 * parallel component for it is how a codebase ends up with two navigations
 * that drift.
 *
 * The nav sections are overridden to shopper language — Orders, Addresses,
 * Payment — while the layout, the responsive behaviour and the current-page
 * marking come free.
 */

import * as React from 'react'
import { SettingsNavLayout } from '@/lib/blocks/sources/settings-nav-layout'
import { OrderHistoryList } from '@/lib/blocks/sources/order-history-list'
import { Package, MapPin, CreditCard, User } from 'lucide-react'

const ACCOUNT_SECTIONS = [
  { label: 'Orders', icon: <Package className="h-4 w-4" />, group: 'Shopping' },
  { label: 'Addresses', icon: <MapPin className="h-4 w-4" />, group: 'Shopping' },
  { label: 'Payment methods', icon: <CreditCard className="h-4 w-4" />, group: 'Shopping' },
  { label: 'Profile', icon: <User className="h-4 w-4" />, group: 'Account' },
]

export default function AccountOrdersPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SettingsNavLayout
        heading="Your account"
        sections={ACCOUNT_SECTIONS}
        initialSection="Orders"
      >
        <div className="rounded-2xl border border-border/60 bg-card/60 p-6">
          <OrderHistoryList />
        </div>
      </SettingsNavLayout>
    </main>
  )
}
