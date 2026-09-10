/**
 * A launch post — the shape a product announcement takes when it is written
 * rather than designed.
 *
 * Most "announcement" templates are a landing page with a date on it. This
 * one is a piece of writing with three pieces of evidence under it, and the
 * difference shows up in the hero: <HeroEditorial> is a serif display
 * headline over a sixty-character standfirst with a real byline, which
 * frames what follows as something a person is saying rather than something
 * a company is claiming.
 *
 * The byline is load-bearing. An announcement with no author is a press
 * release, and a press release is read by nobody who was not already going
 * to read it.
 *
 *   stats        what actually moved, with the good direction declared per
 *                figure — so a falling number can be the good news
 *   endpoint     the API, shown rather than described. For a developer
 *                product this is the announcement; the prose above it is
 *                the context
 *   referral     the ask, once, at the end
 *
 * <ApiEndpointCard> keeps the request and response side by side, which is
 * the detail that makes a launch post usable as documentation for the week
 * before the documentation exists — the week in which most of the traffic
 * arrives.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { HeroEditorial } from '@/lib/blocks/sources/hero-editorial'
import { StatsCards } from '@/lib/blocks/sources/stats-cards'
import { ApiEndpointCard } from '@/lib/blocks/sources/api-endpoint-card'
import { ReferralWaitlistForm } from '@/lib/blocks/sources/referral-waitlist-form'
import { FooterMinimal } from '@/lib/blocks/sources/footer-minimal'

export default function LaunchNotePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <NavbarSimple />
      <HeroEditorial />

      <StatsCards />
      <ApiEndpointCard />

      {/* The ask, once. */}
      <ReferralWaitlistForm />

      <FooterMinimal />
    </main>
  )
}
