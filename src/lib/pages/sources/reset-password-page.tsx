/**
 * Setting a new password, which is the end of the flow `forgot-password-page`
 * starts and the screen that flow is usually missing.
 *
 * Two blocks, and the second one is the point. A reset form on its own is a
 * card with two fields; what makes this a page worth copying is that it
 * ships the error state next to it.
 *
 * Password forms fail more often than any other kind — the two fields
 * disagree, the policy is not met, the link has expired — and they fail
 * for people who are already having a bad day, since nobody resets a
 * password recreationally. <FormErrorSummary> gives those failures a
 * focused summary at the top that links to each field, which is the
 * difference between "something is wrong somewhere below" and a route to
 * the thing that is wrong.
 *
 * The strength meter in <AuthResetPassword> is a native `<meter>` and the
 * errors are announced rather than only coloured, for the same reason: this
 * screen is where a red border and no text strands people.
 */

import * as React from 'react'
import { AuthResetPassword } from '@/lib/blocks/sources/auth-reset-password'
import { FormErrorSummary } from '@/lib/blocks/sources/form-error-summary'

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <AuthResetPassword />

      {/* The state this screen reaches more often than any other. */}
      <FormErrorSummary />
    </main>
  )
}
