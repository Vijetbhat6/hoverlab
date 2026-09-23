'use client'

/**
 * /account/billing — what you bought, and a way to manage it.
 *
 * Two things on one page, kept honest about where each comes from:
 *
 *   The list     read from our own `purchases` records, which the payment
 *                webhook writes. It is exactly as complete as the webhook has
 *                been, and the page says so rather than presenting it as the
 *                payment provider's ledger.
 *
 *   The button   opens Polar's customer portal for invoices, the card on
 *                file and cancelling a subscription. It is drawn ONLY when
 *                billing is configured and the account has bought something,
 *                and if Polar then refuses (the token behind it may lack the
 *                scope, which cannot be verified from here) the button is
 *                REPLACED by a sentence and a way to reach a person. A button
 *                that does nothing when pressed is the failure this page is
 *                built to make impossible.
 *
 * Nothing on this page grants or changes anything.
 */

import * as React from 'react'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Loader2, Receipt } from 'lucide-react'

import { useAuth } from '@/components/auth-provider'
import { SiteHeader } from '@/components/site-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface OrderRow {
  id: string
  date: string | null
  plan: string
  label: string
  interval: string
  amountCents: number
  currency: string
  status: 'paid' | 'refunded'
  refundedAt: string | null
}

interface Subscription {
  kind: 'team' | 'plus'
  name: string
  status: string
  periodEnd: string | null
}

interface OrdersResponse {
  orders: OrderRow[]
  subscriptions: Subscription[]
  portal: { available: boolean; reason: 'not_configured' | 'no_purchase' | null }
  supportEmail: string | null
}

function money(cents: number, currency: string): string {
  const amount = cents / 100
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount)
  } catch {
    // An unknown currency code throws; show the number and the code rather
    // than nothing.
    return `${amount.toFixed(2)} ${currency.toUpperCase()}`
  }
}

function day(iso: string | null): string {
  if (!iso) return 'Date unknown'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'Date unknown'
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function Contact({ email }: { email: string | null }) {
  return email ? (
    <a href={`mailto:${email}`} className="font-medium underline underline-offset-2">
      {email}
    </a>
  ) : (
    <Link href="/support" className="font-medium underline underline-offset-2">
      the support page
    </Link>
  )
}

export default function BillingPage() {
  const { user, loading } = useAuth()
  const [data, setData] = React.useState<OrdersResponse | null>(null)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [opening, setOpening] = React.useState(false)
  // Set when Polar refused. Replaces the button; never sits beside a live one.
  const [portalMessage, setPortalMessage] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!user) return
    let cancelled = false
    fetch('/api/account/orders', { credentials: 'same-origin', cache: 'no-store' })
      .then(async (res) => {
        const body = (await res.json().catch(() => ({}))) as Partial<OrdersResponse> & {
          error?: string
        }
        if (cancelled) return
        if (!res.ok) {
          setLoadError(body.error ?? `Could not load your orders (HTTP ${res.status}).`)
          return
        }
        setData(body as OrdersResponse)
      })
      .catch(() => {
        if (!cancelled) setLoadError('Could not reach the server. Check your connection.')
      })
    return () => {
      cancelled = true
    }
  }, [user])

  async function openPortal() {
    setOpening(true)
    try {
      const res = await fetch('/api/billing/portal', {
        method: 'POST',
        credentials: 'same-origin',
      })
      const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string }
      if (res.ok && body.url) {
        window.location.assign(body.url)
        return
      }
      setPortalMessage(
        body.error ?? "Billing portal isn't available yet — email support.",
      )
    } catch {
      setPortalMessage("The billing portal couldn't be reached. Email support and we'll help.")
    } finally {
      setOpening(false)
    }
  }

  if (loading) {
    return (
      <>
        <SiteHeader />
        <div className="flex min-h-[60vh] items-center justify-center bg-background">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="sr-only">Loading your billing…</span>
        </div>
      </>
    )
  }

  if (!user) {
    return (
      <>
        <SiteHeader />
        <div className="flex min-h-[60vh] items-center justify-center bg-background px-4">
          <Card className="w-full max-w-md border-border/60">
            <CardHeader>
              <CardTitle>You&apos;re not signed in</CardTitle>
              <CardDescription>Sign in to see your orders and manage billing.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/login">Sign in</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  const orders = data?.orders ?? []
  const support = data?.supportEmail ?? null

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-3xl px-4 pb-16 pt-12 sm:px-6">
        <Link
          href="/account"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
          Account
        </Link>
        <h1 className="type-page mt-4">Billing and receipts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          What you have bought on this account. Invoices, the card on file and cancelling a
          subscription are in the billing portal.
        </p>

        {!data && !loadError ? (
          <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Loading your orders…
          </div>
        ) : null}

        {loadError ? (
          <p role="alert" className="mt-8 text-sm text-destructive">
            {loadError}
          </p>
        ) : null}

        {data ? (
          <>
            {data.subscriptions.length > 0 ? (
              <Card className="mt-8 border-border/60">
                <CardHeader>
                  <CardTitle className="text-lg">Active subscriptions</CardTitle>
                  <CardDescription>These renew until you cancel them in the portal.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-2 text-sm">
                  {data.subscriptions.map((sub) => (
                    <div key={`${sub.kind}-${sub.name}`} className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{sub.name}</span>
                      <Badge variant="secondary">{sub.status.replace('_', ' ')}</Badge>
                      {sub.periodEnd ? (
                        <span className="text-muted-foreground">
                          current period ends {day(sub.periodEnd)}
                        </span>
                      ) : null}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : null}

            <Card className="mt-6 border-border/60">
              <CardHeader>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Receipt className="h-4 w-4" aria-hidden />
                  <span className="text-xs uppercase tracking-wide">Orders</span>
                </div>
                <CardTitle className="text-lg">
                  {orders.length === 0 ? 'No purchases yet' : `${orders.length} ${orders.length === 1 ? 'order' : 'orders'}`}
                </CardTitle>
                <CardDescription>
                  {orders.length === 0
                    ? 'Nothing has been bought on this account.'
                    : 'From our own records of payments we were notified about. If one is missing, it may not have reached us yet.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <Button asChild variant="outline">
                    <Link href="/pricing">See plans</Link>
                  </Button>
                ) : (
                  <ul className="divide-y divide-border/60">
                    {orders.map((order) => (
                      <li
                        key={order.id}
                        className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3 text-sm first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0">
                          <p className="font-medium">{order.label}</p>
                          <p className="text-muted-foreground">
                            {day(order.date)}
                            {order.interval === 'month' ? ' · monthly' : ''}
                            <span className="ms-2 font-mono text-xs">{order.id.slice(0, 8)}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {order.status === 'refunded' ? (
                            <Badge variant="outline">
                              Refunded {order.refundedAt ? day(order.refundedAt) : ''}
                            </Badge>
                          ) : null}
                          <span
                            className={
                              order.status === 'refunded'
                                ? 'tabular-nums text-muted-foreground line-through'
                                : 'tabular-nums font-medium'
                            }
                          >
                            {money(order.amountCents, order.currency)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/*
              The one place a button can be a lie, so it has three states and
              only the first has a button in it: offered, refused, and not
              offered at all.
            */}
            {data.portal.available ? (
              <div className="mt-6">
                {portalMessage ? (
                  <div
                    role="alert"
                    className="rounded-lg border border-border/60 bg-card p-4 text-sm"
                  >
                    <p>{portalMessage}</p>
                    <p className="mt-1 text-muted-foreground">
                      Email <Contact email={support} />.
                    </p>
                  </div>
                ) : (
                  <Button onClick={openPortal} disabled={opening}>
                    {opening ? (
                      <Loader2 className="me-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ExternalLink className="me-2 h-4 w-4" />
                    )}
                    View invoices / manage billing
                  </Button>
                )}
              </div>
            ) : data.portal.reason === 'no_purchase' ? null : (
              <p className="mt-6 text-sm text-muted-foreground">
                Billing isn&apos;t set up on this deployment, so there is no portal to open.
              </p>
            )}
          </>
        ) : null}
      </main>
    </div>
  )
}
