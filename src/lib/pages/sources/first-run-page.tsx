/**
 * The first ninety seconds, which is the only part of onboarding most
 * people see.
 *
 * `onboarding-page` is the guided version — a checklist, a role, an import.
 * This is what the product looks like *while* that is happening, and it is
 * three states nobody designs because none of them are the product.
 *
 *   coachmark    a tour step anchored to the control it explains, with the
 *                spotlight cut by a single spread shadow. Anchored, not
 *                floating: a tour that describes a button without pointing
 *                at it is a slideshow, and people close slideshows
 *   skeleton     the placeholders, with a sweep that is motion-safe only.
 *                First run is the slowest the product will ever be — every
 *                cache is cold — so this is the state most likely to be
 *                someone's first impression of the interface
 *   checklist    the progress they came here to make
 *
 * The checklist is shared with `onboarding-page` on purpose, and it is the
 * only block on this page that also appears elsewhere. That is the join
 * between the two screens: the tour and the skeletons are transient, the
 * checklist persists, and seeing it in both places is how a reader works
 * out that first-run is a state of the app rather than a separate flow.
 */

import * as React from 'react'
import { ProductTourCoachmark } from '@/lib/blocks/sources/product-tour-coachmark'
import { SkeletonList } from '@/lib/blocks/sources/skeleton-list'
import { OnboardingChecklist } from '@/lib/blocks/sources/onboarding-checklist'

export default function FirstRunPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto w-full max-w-5xl px-6 pb-2 pt-12">
        <h1 className="text-2xl font-bold tracking-tight">First run</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The tour, the loading state everything is in while it runs, and the
          one thing that survives both.
        </p>
      </section>

      <ProductTourCoachmark />
      <SkeletonList />

      {/* Shared with onboarding-page — see the note above. */}
      <OnboardingChecklist />
    </main>
  )
}
