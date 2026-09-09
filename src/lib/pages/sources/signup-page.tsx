/**
 * The signup screen, with the two things that reduce abandonment on it.
 *
 * A signup page is usually the form alone, which treats the decision as
 * already made. It is not: this is the last screen before someone commits,
 * and the objection at that moment is "is this real". So the form sits
 * first and the proof sits under it — the logos of people already using it
 * and the ratings — rather than on the marketing page the visitor has
 * already left.
 *
 * Order matters and the obvious wrong one is proof first. Somebody who
 * arrived here has decided to sign up; making them scroll past a
 * testimonial wall to reach the form is friction applied to the person who
 * needed the least of it. The form is above the fold and the reassurance
 * is there for the person who hesitates.
 */

import * as React from 'react'
import { AuthSignupSplit } from '@/lib/blocks/sources/auth-signup-split'
import { LogoCloud } from '@/lib/blocks/sources/logo-cloud'
import { TestimonialRatings } from '@/lib/blocks/sources/testimonial-ratings'

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <AuthSignupSplit />

      {/* Below the fold on purpose — see the note above. */}
      <LogoCloud />
      <TestimonialRatings />
    </main>
  )
}
