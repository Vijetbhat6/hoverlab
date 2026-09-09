/**
 * The first session, in the order that survives someone leaving halfway.
 *
 * Onboarding is usually a wizard, and a wizard's flaw is that it is all or
 * nothing: close it at step three and you come back to step one, or to
 * nothing at all. The checklist is the fix, and it is why both are here —
 * the wizard drives the session, the checklist survives it.
 *
 * The layout problem is which comes first. The obvious wrong answer is the
 * checklist, because it looks like the summary and summaries go on top:
 * that opens the product with a list of chores. The workspace form leads
 * instead, because it is the only step whose answer is genuinely needed
 * before anything else can happen — the URL is in every link that follows.
 *
 * Then the wizard for the person with ten minutes, then the checklist for
 * the person who does not. Nothing here blocks the product; a person who
 * scrolls past all three has a working workspace.
 */

import * as React from 'react'
import { WorkspaceSetupForm } from '@/lib/blocks/sources/workspace-setup-form'
import { SetupWizard } from '@/lib/blocks/sources/setup-wizard'
import { OnboardingChecklist } from '@/lib/blocks/sources/onboarding-checklist'

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <WorkspaceSetupForm />

      <section className="mx-auto w-full max-w-3xl px-6 pt-6 text-center">
        <h2 className="text-lg font-bold tracking-tight">
          Ten minutes now, or whenever
        </h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          The guided setup below does it in one sitting. The checklist under
          it is the same steps, kept for the sitting you do not finish.
        </p>
      </section>

      <SetupWizard />
      <OnboardingChecklist />
    </main>
  )
}
