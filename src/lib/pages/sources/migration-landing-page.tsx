/**
 * The switching page: for a reader who already has a tool that works.
 *
 * This is the hardest landing page to write, because every argument a
 * normal marketing page makes is unavailable. "Save time" is irrelevant to
 * someone whose current tool already saves them time. The only question
 * that matters is the cost of moving, and every section here is an answer
 * to it.
 *
 *   hero screenshot  what it looks like, immediately. A switcher knows what
 *                    the category is; showing rather than claiming skips
 *                    the paragraph they would not have read
 *   migration        the actual mechanism, second — not buried under
 *                    features. This is the objection, so it goes where the
 *                    objection is
 *   integrations     stated at depth rather than as a wall of logos,
 *                    because "we integrate with X" and "we integrate with
 *                    X the way you use X" are different claims and the
 *                    reader has been burned by the first
 *   outcomes         someone who already made this move
 *   objections       the rest of them, named
 *   demo             a call, which is what a migration of any size ends in
 *
 * Deliberately no pricing section. A reader weighing a migration is
 * costing out a week of someone's time; a monthly figure beside that is
 * noise, and putting it here invites them to compare the wrong number.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { HeroScreenshot } from '@/lib/blocks/sources/hero-screenshot'
import { DataMigrationSplit } from '@/lib/blocks/sources/data-migration-split'
import { IntegrationDepthSplit } from '@/lib/blocks/sources/integration-depth-split'
import { CustomerOutcomeBand } from '@/lib/blocks/sources/customer-outcome-band'
import { FaqObjectionList } from '@/lib/blocks/sources/faq-objection-list'
import { DemoRequestForm } from '@/lib/blocks/sources/demo-request-form'
import { FooterMinimal } from '@/lib/blocks/sources/footer-minimal'

export default function MigrationLandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <NavbarSimple />
      <HeroScreenshot />

      {/* The objection, where the objection is. */}
      <DataMigrationSplit />
      <IntegrationDepthSplit />

      <CustomerOutcomeBand />
      <FaqObjectionList />
      <DemoRequestForm />

      <FooterMinimal />
    </main>
  )
}
