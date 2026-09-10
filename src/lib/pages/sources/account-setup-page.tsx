/**
 * The profile someone fills in once, and the two components that decide
 * whether they finish it.
 *
 * `onboarding-page` is the checklist. This is the form behind one of its
 * items, and it exists as its own page because the interesting parts of a
 * long form are not the fields.
 *
 *   role picker    every option states what it actually changes. "What
 *                  best describes you" with four nouns and no consequences
 *                  is a question people answer at random, which makes the
 *                  answer worse than not asking
 *   avatar         framing a photo with keyboard-operable zoom and
 *                  position — the one step in every profile form that is
 *                  usually mouse-only
 *   multi-step     each step validating only its own fields, so an error
 *                  on step three does not re-raise step one
 *   unsaved        the interception that keeps the work
 *
 * <ModalUnsavedChanges> is the reason this is a page rather than three
 * blocks. A long form and a navigation guard are a pair: without the
 * guard the form is a trap, and without a form the guard has nothing to
 * protect. It offers three answers rather than two and lists the changed
 * fields by name, which is what turns "are you sure?" from a speed bump
 * into information.
 */

import * as React from 'react'
import { OnboardingRolePicker } from '@/lib/blocks/sources/onboarding-role-picker'
import { AvatarCropUpload } from '@/lib/blocks/sources/avatar-crop-upload'
import { MultiStepForm } from '@/lib/blocks/sources/multi-step-form'
import { ModalUnsavedChanges } from '@/lib/blocks/sources/modal-unsaved-changes'

export default function AccountSetupPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto w-full max-w-5xl px-6 pb-2 pt-12">
        <h1 className="text-2xl font-bold tracking-tight">Set up your account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Four steps, and the guard that stops a mis-click throwing them away.
        </p>
      </section>

      <OnboardingRolePicker />
      <AvatarCropUpload />
      <MultiStepForm />

      {/* The other half of a long form. */}
      <ModalUnsavedChanges />
    </main>
  )
}
