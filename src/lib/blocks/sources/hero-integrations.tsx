/**
 * <HeroIntegrations> — a hero for a product that sits between other products.
 *
 * The pitch for anything whose value is connective: an iPaaS, a sync
 * engine, a warehouse. The visual argument is that the tools the visitor
 * already pays for are on the list, so the list *is* the hero image.
 *
 * The tiles are a real `<ul>`. This is a list of names, and a screen
 * reader should be able to say "list, twelve items" and let someone skim
 * it — that is exactly the question being asked here ("is my stack in
 * there?"), and a grid of divs answers it badly.
 *
 * Each tile is initials in a themed square rather than a brand logo. It
 * keeps the block asset-free and, more usefully, keeps you out of the
 * trademark question that shipping a wall of other companies' marks in a
 * template raises. Swap in `<img>` tags for the brands you have rights to.
 */

import * as React from 'react'
import { ArrowRight, Plug } from 'lucide-react'

export interface HeroIntegrationsProps {
  eyebrow?: string
  heading?: string
  subheading?: string
  primaryLabel?: string
  primaryHref?: string
  secondaryLabel?: string
  secondaryHref?: string
  /** Names rendered as tiles. Around twelve reads as "lots" without wrapping oddly. */
  integrations?: string[]
  /** Trailing tile copy, e.g. "+ 80 more". Omit to hide it. */
  moreLabel?: string
  className?: string
}

const DEFAULT_INTEGRATIONS = [
  'Postgres',
  'Snowflake',
  'Stripe',
  'Salesforce',
  'HubSpot',
  'Segment',
  'BigQuery',
  'Shopify',
  'Zendesk',
  'Notion',
  'Slack',
  'Linear',
]

export function HeroIntegrations({
  eyebrow = '120+ connectors',
  heading = 'Your stack, finally speaking the same language.',
  subheading =
    'Sync every system you already run into one warehouse — incrementally, on a schedule you set, without writing the pipeline yourself.',
  primaryLabel = 'Connect a source',
  primaryHref = '#',
  secondaryLabel = 'Browse connectors',
  secondaryHref = '#',
  integrations = DEFAULT_INTEGRATIONS,
  moreLabel = '+108 more',
  className = '',
}: HeroIntegrationsProps) {
  return (
    <section className={`relative overflow-hidden ${className}`}>
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 h-96 w-[40rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
      </div>

      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-24">
        {/* -- Copy ------------------------------------------------------ */}
        <div className="max-w-xl">
          {eyebrow ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <Plug aria-hidden className="h-3.5 w-3.5 text-primary" />
              {eyebrow}
            </span>
          ) : null}

          <h1 className="mt-5 text-balance text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            {heading}
          </h1>

          <p className="mt-5 text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            {subheading}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={primaryHref}
              className="inline-flex h-12 items-center justify-center gap-1.5 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {primaryLabel}
              <ArrowRight aria-hidden className="h-4 w-4" />
            </a>
            <a
              href={secondaryHref}
              className="inline-flex h-12 items-center justify-center rounded-xl border border-border/60 bg-card/60 px-6 text-sm font-semibold backdrop-blur transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {secondaryLabel}
            </a>
          </div>
        </div>

        {/* -- Connector wall -------------------------------------------- */}
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:gap-4">
          {integrations.map((name) => (
            <li
              key={name}
              className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border border-border/60 bg-card/60 p-2 text-center backdrop-blur transition-colors hover:border-primary/40 hover:bg-card"
            >
              <span
                aria-hidden
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-xs font-bold text-primary"
              >
                {name.slice(0, 2).toUpperCase()}
              </span>
              <span className="text-[11px] font-medium leading-tight text-muted-foreground">
                {name}
              </span>
            </li>
          ))}

          {moreLabel ? (
            <li className="flex aspect-square items-center justify-center rounded-2xl border border-dashed border-border/60 p-2 text-center text-[11px] font-medium text-muted-foreground">
              {moreLabel}
            </li>
          ) : null}
        </ul>
      </div>
    </section>
  )
}
