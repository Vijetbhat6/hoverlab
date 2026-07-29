'use client'

/**
 * <PricingTiers> — 3-tier pricing comparison (Free / Pro / Team).
 *
 * Hoverlab is currently 100% free, but showing tiers sets expectations
 * for future Pro features and signals ambition. Pro/Team are marked
 * "Coming soon" — call-to-action is "Get notified" instead of "Buy".
 *
 * Middle (Pro) tier is highlighted as "Most popular" with a gradient
 * border + top glow via .fx-pricing-popular.
 *
 * Free tier CTA → /signup (works today)
 * Pro/Team CTA → email signup form (newsletter)
 */

import * as React from 'react'
import Link from 'next/link'
import { Check, Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Reveal } from '@/components/reveal'

interface Tier {
  name: string
  price: string
  period: string
  tagline: string
  cta: string
  ctaHref: string
  ctaVariant: 'default' | 'outline' | 'ghost'
  popular?: boolean
  badge?: string
  features: string[]
}

const TIERS: Tier[] = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    tagline: 'For individuals exploring, learning, and shipping side projects.',
    cta: 'Get started',
    ctaHref: '/signup',
    ctaVariant: 'outline',
    features: [
      'All 40+ effects, all categories',
      'Live customization sliders',
      'Save favorites (sync across devices)',
      'Bundle up to 10 effects',
      'Export bundles as CSS',
      'PWA — installable, offline-ready',
    ],
  },
  {
    name: 'Pro',
    price: '$8',
    period: '/month',
    tagline: 'For developers shipping client work and commercial products.',
    cta: 'Get notified at launch',
    ctaHref: '#newsletter',
    ctaVariant: 'default',
    popular: true,
    badge: 'Most popular',
    features: [
      'Everything in Free',
      'Unlimited bundle size',
      'Custom brand color presets',
      'Private effect collections',
      'Per-team theming',
      'Priority email support',
      'Commercial license pre-cleared',
    ],
  },
  {
    name: 'Team',
    price: '$24',
    period: '/month',
    tagline: 'For design systems teams standardizing effects across products.',
    cta: 'Get notified at launch',
    ctaHref: '#newsletter',
    ctaVariant: 'outline',
    features: [
      'Everything in Pro',
      'Up to 10 team members',
      'Shared brand color library',
      'Shared bundle exports',
      'Audit log of changes',
      'SSO (Google, GitHub)',
      'Dedicated Slack channel',
    ],
  },
]

export function PricingTiers() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <Reveal className="mx-auto mb-12 max-w-2xl text-center">
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Simple, honest pricing
        </div>
        <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          Free today. Pro when you grow.
        </h2>
        <p className="mt-3 text-muted-foreground">
          Everything is free right now — Pro and Team tiers are coming soon.
          Existing free features will stay free, forever.
        </p>
      </Reveal>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {TIERS.map((tier, i) => (
          <Reveal
            key={tier.name}
            delay={i * 80}
            className={
              'fx-bento-tile relative flex h-full flex-col rounded-2xl border bg-card/80 p-6 backdrop-blur ' +
              (tier.popular
                ? 'fx-pricing-popular border-transparent lg:-mt-4 lg:mb-4'
                : 'border-border/60')
            }
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold tracking-tight">{tier.name}</h3>
              {tier.badge && (
                <Badge className="bg-primary/15 text-primary hover:bg-primary/20">
                  {tier.badge}
                </Badge>
              )}
            </div>
            <div className="mb-2 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold tracking-tight">
                {tier.price}
              </span>
              <span className="text-sm text-muted-foreground">
                {tier.period}
              </span>
            </div>
            <p className="mb-6 text-sm text-muted-foreground">{tier.tagline}</p>

            <Button
              variant={tier.ctaVariant}
              className="mb-6 w-full"
              size="lg"
              asChild
            >
              <Link href={tier.ctaHref}>
                {tier.cta}
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>

            <ul className="mt-auto space-y-2.5">
              {tier.features.map((f, j) => (
                <li key={j} className="flex items-start gap-2.5 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <span className="text-foreground/90">{f}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </div>

      <Reveal delay={240} className="mt-8 text-center">
        <p className="text-xs text-muted-foreground">
          All plans include the MIT-licensed CSS, PWA install, and{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
            prefers-reduced-motion
          </code>{' '}
          support. No credit card required for Free.
        </p>
      </Reveal>
    </section>
  )
}
