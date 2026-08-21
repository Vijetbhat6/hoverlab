'use client'

/**
 * The licence certificate — the document a customer forwards to whoever
 * asks "are we allowed to ship this?".
 *
 * This is the whole answer to the question the business rests on. The code
 * is public and copyable by design; what a paying customer gets that a
 * copier does not is a named, dated grant of permission with an id on it.
 * Until this existed, Pro sold that grant and gave the buyer nothing to
 * show for it — which is a strange way to sell the one thing here that
 * cannot be pirated.
 *
 * Printable rather than a generated PDF. A PDF means a renderer in the
 * bundle or a server route, a font to embed and a layout to maintain, to
 * produce something the browser's own "Save as PDF" already produces from
 * this markup. `print:` utilities drop the chrome and force the ink-on-white
 * treatment so the printed copy does not arrive as a dark-mode screenshot.
 */

import * as React from 'react'
import Link from 'next/link'
import { BadgeCheck, Loader2, Printer } from 'lucide-react'

import { useCheckout } from '@/hooks/use-checkout'
import { PLANS, renewalFor, formatPrice, type PlanId } from '@/lib/billing/plans'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { termsFor, type HeldLicense } from '@/lib/license'
import { cn } from '@/lib/utils'

/** Long form, unambiguous across date conventions — "12 March 2026". */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Whether to offer a renewal on this certificate, and which one.
 *
 * A plain function, not a hook. It reads three fields and does one date
 * comparison, so memoising it would cost more than it saves — and as a
 * `useMemo` it sat below the component's early returns for the loading and
 * signed-out states, which is a hooks-order bug waiting for the first
 * customer whose licence took a moment to load.
 *
 * Offered only inside the last 60 days of the window, or after it has
 * passed. Offering it on day one would be asking someone who has just paid
 * to pay again, and a prompt that is permanently on screen is one people
 * stop seeing long before it is relevant.
 *
 * Returns null for Team — a live subscription already includes updates, so
 * there is nothing to renew — and null when the renewal product has not
 * been provisioned, so an unconfigured deployment shows no button rather
 * than a button that dead-ends at a 503.
 */
function renewalOffer(
  license: HeldLicense,
): { plan: PlanId; overdue: boolean } | null {
  if (license.kind !== 'commercial' || license.recurring) return null
  if (!license.updatesUntil) return null

  const plan = renewalFor(license.plan)
  if (!plan || !PLANS[plan].polarProductId) return null

  const endsAt = new Date(license.updatesUntil).getTime()
  if (Number.isNaN(endsAt)) return null

  const DAYS_60 = 60 * 24 * 60 * 60 * 1000
  if (endsAt - Date.now() > DAYS_60) return null

  return { plan, overdue: endsAt < Date.now() }
}

export function LicenseCertificate({ className }: { className?: string }) {
  const { user, loading: authLoading } = useAuth()
  const { startCheckout, pendingPlan } = useCheckout()
  const [license, setLicense] = React.useState<HeldLicense | null>(null)
  const [failed, setFailed] = React.useState(false)

  React.useEffect(() => {
    if (authLoading) return

    let cancelled = false
    setFailed(false)
    fetch('/api/billing/license', { cache: 'no-store', credentials: 'same-origin' })
      .then(async (res) => {
        if (!res.ok) throw new Error(`license: HTTP ${res.status}`)
        return (await res.json()) as HeldLicense
      })
      .then((value) => {
        if (!cancelled) setLicense(value)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
    // Re-read on sign-in and sign-out: the certificate is per account.
  }, [authLoading, user?.id])

  if (authLoading || (!license && !failed)) {
    return (
      <Card className={cn('border-border/60', className)}>
        <CardHeader>
          <CardTitle className="text-lg">Licence</CardTitle>
          <CardDescription className="flex items-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Reading your licence…
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (failed || !license) {
    return (
      <Card className={cn('border-border/60', className)}>
        <CardHeader>
          <CardTitle className="text-lg">Licence</CardTitle>
          <CardDescription>
            We could not read your licence just now. The terms themselves are
            unaffected and always available on the{' '}
            <Link href="/license" className="font-medium text-primary hover:underline">
              licence page
            </Link>
            .
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const terms = termsFor(license.kind)
  const commercial = license.kind === 'commercial'

  const renewal = renewalOffer(license)

  return (
    <Card
      // Everything else on the page is hidden when printing — see the
      // `@media print` block in globals.css. Without it the customer's proof
      // of licence is a screenshot of the account page, upgrade tiers and all.
      data-print-root={commercial ? '' : undefined}
      className={cn(
        'border-border/60',
        // The printed sheet is the certificate; the app around it is not.
        'print:border-black print:bg-white print:text-black print:shadow-none',
        className,
      )}
    >
      <CardHeader className="gap-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <BadgeCheck
                aria-hidden
                className={cn('h-5 w-5', commercial ? 'text-primary' : 'text-muted-foreground')}
              />
              <CardTitle className="text-lg">{terms.name}</CardTitle>
            </div>
            <CardDescription className="mt-1 max-w-prose">{terms.summary}</CardDescription>
          </div>

          {commercial ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="shrink-0 gap-1.5 print:hidden"
            >
              <Printer className="h-3.5 w-3.5" />
              Print
            </Button>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {commercial ? (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg border border-border/60 bg-muted/20 p-4 text-sm sm:grid-cols-4 print:border-black/30 print:bg-transparent">
            <Field label="Licensed to" value={license.holder} />
            <Field label="Account" value={license.holderEmail} />
            <Field label="Plan" value={license.planName} />
            <Field
              label="Seats"
              value={license.seats ? String(license.seats) : 'Per seat'}
            />
            <Field
              label="Licence id"
              value={license.licenseId ?? '—'}
              mono
              className="col-span-2"
            />
            <Field
              label="Issued"
              value={license.issuedAt ? formatDate(license.issuedAt) : '—'}
            />
            {/*
              The update window, beside the issue date rather than buried in
              the terms list. It is the one field on this certificate that
              has a deadline attached, so it is the one a customer needs to
              be able to find without reading.
            */}
            <Field
              label="Updates until"
              value={
                license.recurring
                  ? 'While subscribed'
                  : license.updatesUntil
                    ? formatDate(license.updatesUntil)
                    : '—'
              }
            />
          </dl>
        ) : (
          <p className="rounded-lg border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
            You hold the free licence — everyone does, account or not. For work
            you are paid for, the commercial licence comes with Pro, Studio and
            Team.{' '}
            <Link href="/#pricing" className="font-medium text-primary hover:underline">
              See what each includes
            </Link>
            .
          </p>
        )}

        <TermList heading="What this licence grants" items={terms.grants} tone="grant" />
        <TermList heading="What it does not cover" items={terms.restrictions} tone="limit" />

        {/*
          Said plainly, because "updates until" next to a date is exactly
          the phrasing that makes people think something switches off. The
          distinction — perpetual licence, bounded update entitlement — is
          the whole design, and a certificate that leaves it implied
          generates support mail.
        */}
        {commercial && !license.recurring && license.updatesUntil ? (
          <p className="text-xs text-muted-foreground">
            Nothing expires. Your licence to ship what you have is permanent,
            and every artifact published before{' '}
            {formatDate(license.updatesUntil)} stays yours whether or not you
            renew. What a renewal buys is what gets added after that date.
          </p>
        ) : null}

        {/*
          The renewal, offered only when it is nearly or actually due.

          A renewal has no card on the pricing page and never will: nobody
          shops for one, and putting it beside the licences would make the
          buying decision harder to advertise a top-up. The one context
          where the word means anything is here, on the certificate of the
          specific person whose window is running out — so that is the only
          place it appears.
        */}
        {renewal ? (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 print:hidden">
            <p className="text-sm font-medium">
              {renewal.overdue
                ? 'Your update window has ended.'
                : 'Your update window ends soon.'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {renewal.overdue
                ? 'Everything published before it stays yours. A renewal picks the catalog back up from today.'
                : 'Renew any time before it ends and the new twelve months are added to what is left — renewing early costs you nothing.'}
            </p>
            <Button
              size="sm"
              className="mt-3"
              disabled={pendingPlan === renewal.plan}
              onClick={() => startCheckout(renewal.plan)}
            >
              {pendingPlan === renewal.plan
                ? 'Starting…'
                : `Renew for ${formatPrice(PLANS[renewal.plan].priceCents)}`}
            </Button>
          </div>
        ) : null}

        {license.recurring ? (
          <p className="text-xs text-muted-foreground">
            This licence comes with a subscription. If it lapses, the grant
            covering anything you have already shipped stays in force
            permanently — what ends is the right to use the catalog for new
            work.
          </p>
        ) : null}

        <p className="text-xs text-muted-foreground">
          {commercial
            ? 'This certificate records a purchase. There is no activation step and nothing in the product checks the licence id — it exists so you have something to quote.'
            : 'Nothing here requires an account, a key, or attribution.'}{' '}
          Full terms on the{' '}
          <Link href="/license" className="font-medium text-primary hover:underline">
            licence page
          </Link>
          .
        </p>
      </CardContent>
    </Card>
  )
}

function Field({
  label,
  value,
  mono = false,
  className,
}: {
  label: string
  value: string
  mono?: boolean
  className?: string
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className={cn('truncate font-medium', mono && 'font-mono text-xs')}>{value}</dd>
    </div>
  )
}

export function TermList({
  heading,
  items,
  tone,
}: {
  heading: string
  items: string[]
  tone: 'grant' | 'limit'
}) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {heading}
      </h3>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-relaxed">
            <span
              aria-hidden
              className={cn(
                'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full',
                tone === 'grant' ? 'bg-primary' : 'bg-muted-foreground/50',
              )}
            />
            <span className={tone === 'limit' ? 'text-muted-foreground' : undefined}>
              {item}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
