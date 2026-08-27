'use client'

/**
 * <FooterCompliance> — the footer a lawyer asks for and a template never has.
 *
 * Footers already had the mega map, the minimal line, the newsletter
 * capture and the signed-in status bar. Every one of them treats the
 * footer as navigation. For anyone selling into the EU or the UK it is
 * also a legal surface, and the gap is normally found the week a payment
 * processor reviews the account or a regulator writes in.
 *
 * WHAT IS ACTUALLY REQUIRED, AND WHY IT IS HERE
 *
 * Trading name is not enough — the registered legal entity, its company
 * number and its registered address are the identification an EU or UK
 * seller has to publish (the Impressum requirement in Germany is the
 * strictest version of a rule that exists nearly everywhere). VAT number
 * where the seller is registered. A complaints route, and in the EU a link
 * to the ODR platform. An accessibility statement, which the European
 * Accessibility Act has made a live obligation for consumer services since
 * June 2025 — and which nobody can write for you, so it is a real page,
 * not a footer word.
 *
 * COOKIE SETTINGS ARE A LINK, NOT A ONE-TIME BANNER
 *
 * Consent has to be as easy to withdraw as it was to give. A banner that
 * appears once and is never reachable again fails that, and the footer is
 * the conventional place to put the way back. So this is a button that
 * reopens the preferences, sitting in the legal row rather than hidden in
 * a policy page.
 *
 * THE REGION CONTROL CHANGES THE TEXT, NOT JUST THE PRICES
 *
 * Statutory rights differ, so the entity, the tax line and the consumer
 * links differ with them. A footer that swaps a currency and keeps one
 * country's legal copy is worse than one that never localised at all: it
 * is now making a specific claim to the wrong audience.
 *
 * PAYMENT MARKS ARE INFORMATION, NOT DECORATION
 *
 * Drawn as text, so they render without an asset, survive dark mode and
 * are readable to a screen reader. Card-brand logos also carry usage rules
 * — being unable to ship the SVG is a common reason this row silently
 * never gets built.
 *
 * ACCESSIBILITY: `<address>` for the registered address, a labelled
 * `<nav>` for the legal links so it is distinguishable from the product
 * nav above it, and no link whose text is "here" or "learn more".
 */

import * as React from 'react'
import { Building2, Cookie, Scale } from 'lucide-react'

export interface ComplianceRegion {
  id: string
  label: string
  entity: string
  registration: string
  address: string[]
  taxLine: string
  /** Region-specific obligations, added to the shared legal links. */
  extraLinks: { label: string; href: string }[]
}

export interface FooterComplianceProps {
  brand?: string
  regions?: ComplianceRegion[]
  paymentMethods?: string[]
  className?: string
}

const DEFAULT_REGIONS: ComplianceRegion[] = [
  {
    id: 'uk',
    label: 'United Kingdom',
    entity: 'Northwind Trading Ltd',
    registration: 'Registered in England and Wales, company no. 09482013',
    address: ['4th Floor, 12 Ridgemount Street', 'London WC1E 7AE', 'United Kingdom'],
    taxLine: 'VAT registration GB 284 9271 05. Prices include VAT where applicable.',
    extraLinks: [
      { label: 'Cancellation and returns', href: '#returns' },
      { label: 'Modern slavery statement', href: '#modern-slavery' },
    ],
  },
  {
    id: 'eu',
    label: 'European Union',
    entity: 'Northwind Trading B.V.',
    registration: 'Registered with the Dutch KvK, no. 74920185',
    address: ['Keizersgracht 62', '1015 CS Amsterdam', 'Netherlands'],
    taxLine: 'VAT registration NL 8601 42 917 B01. Prices include VAT at your local rate.',
    extraLinks: [
      { label: 'Right of withdrawal', href: '#withdrawal' },
      { label: 'Online dispute resolution', href: '#odr' },
      { label: 'Imprint', href: '#imprint' },
    ],
  },
  {
    id: 'us',
    label: 'United States',
    entity: 'Northwind Trading Inc.',
    registration: 'Incorporated in Delaware, file no. 7194482',
    address: ['201 Mission Street, Suite 1200', 'San Francisco, CA 94105', 'United States'],
    taxLine: 'Sales tax is calculated at checkout where we are registered to collect it.',
    extraLinks: [
      { label: 'Do not sell or share my information', href: '#ccpa' },
      { label: 'State privacy rights', href: '#state-privacy' },
    ],
  },
]

/* Shared obligations — the ones that do not change with the region. */
const CORE_LINKS = [
  { label: 'Terms of service', href: '#terms' },
  { label: 'Privacy policy', href: '#privacy' },
  { label: 'Accessibility statement', href: '#accessibility' },
  { label: 'Security', href: '#security' },
  { label: 'Complaints', href: '#complaints' },
]

const DEFAULT_PAYMENTS = ['Visa', 'Mastercard', 'Amex', 'PayPal', 'Apple Pay', 'SEPA']

export function FooterCompliance({
  brand = 'Northwind',
  regions = DEFAULT_REGIONS,
  paymentMethods = DEFAULT_PAYMENTS,
  className = '',
}: FooterComplianceProps) {
  const [regionId, setRegionId] = React.useState(regions[0].id)
  const region = regions.find((r) => r.id === regionId) ?? regions[0]
  const [cookiesReopened, setCookiesReopened] = React.useState(false)

  return (
    <footer className={`w-full border-t border-border bg-card ${className}`}>
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* ---- Who you are actually contracting with ---------------- */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground"
              >
                {brand.charAt(0)}
              </span>
              <span className="text-sm font-semibold text-foreground">{brand}</span>
            </div>

            <p className="mt-4 flex items-start gap-2 text-sm font-medium text-foreground">
              <Building2 aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              {region.entity}
            </p>
            <p className="mt-1 pl-6 text-xs text-muted-foreground">{region.registration}</p>
            {/* A real <address>, not a stack of divs. */}
            <address className="mt-2 pl-6 text-xs not-italic leading-relaxed text-muted-foreground">
              {region.address.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>
            <p className="mt-3 pl-6 text-xs text-muted-foreground">{region.taxLine}</p>
          </div>

          {/* ---- Legal links, kept apart from the product nav --------- */}
          <nav aria-label="Legal and policies">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Legal
            </h2>
            <ul className="mt-3 space-y-2">
              {[...CORE_LINKS, ...region.extraLinks].map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="rounded text-sm text-foreground underline-offset-4 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Region
            </h2>
            <label htmlFor="compliance-region" className="sr-only">
              Choose the region whose terms apply to you
            </label>
            <select
              id="compliance-region"
              value={regionId}
              onChange={(event) => setRegionId(event.target.value)}
              className="mt-3 h-9 w-full rounded-lg border border-field bg-background px-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
            {/*
              Says out loud that this changed the terms, not the currency.
            */}
            <p role="status" className="mt-2 text-xs text-muted-foreground">
              Showing the entity, tax registration and consumer rights that
              apply in {region.label}.
            </p>

            <h2 className="mt-6 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              We accept
            </h2>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {paymentMethods.map((method) => (
                <li
                  key={method}
                  className="rounded-md border border-border bg-background px-2 py-1 text-[11px] font-medium text-muted-foreground"
                >
                  {method}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-6">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {region.entity}. All rights reserved.
          </p>

          {/*
            The way back into consent. Withdrawing has to be as easy as
            giving, and a banner that never returns does not clear that bar.
          */}
          <button
            type="button"
            onClick={() => setCookiesReopened(true)}
            className="inline-flex items-center gap-1.5 rounded text-xs text-foreground underline-offset-4 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Cookie aria-hidden className="h-3.5 w-3.5" />
            Cookie settings
          </button>

          <a
            href="#dsa"
            className="inline-flex items-center gap-1.5 rounded text-xs text-foreground underline-offset-4 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Scale aria-hidden className="h-3.5 w-3.5" />
            Report illegal content
          </a>

          {cookiesReopened ? (
            <p role="status" className="w-full text-xs text-muted-foreground">
              Cookie preferences reopened — this link is how consent gets
              withdrawn later, so it stays on every page.
            </p>
          ) : null}
        </div>
      </div>
    </footer>
  )
}
