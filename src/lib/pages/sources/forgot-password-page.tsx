/**
 * Password recovery, with the option that avoids the password entirely.
 *
 * Someone reaching this page has already failed to sign in once. The
 * conventional answer is a reset form and nothing else, which sends them
 * to their inbox to click a link, choose a new password, and store it —
 * three steps to get back to where they were.
 *
 * The magic-link form is beside it because it solves the same problem in
 * one step, and this is the exact moment somebody is most willing to stop
 * using passwords. Offering it on the main sign-in screen competes with
 * the primary action; offering it here, after the password has already
 * failed, competes with nothing.
 *
 * Reset stays first. It is what the reader came for, and a page that
 * answers a different question than the one asked — however sensibly — is
 * a page people bounce from.
 */

import * as React from 'react'
import { AuthForgotPassword } from '@/lib/blocks/sources/auth-forgot-password'
import { AuthMagicLinkForm } from '@/lib/blocks/sources/auth-magic-link-form'

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <AuthForgotPassword />

      {/*
        The separator carries a word rather than being a bare rule. "Or"
        is what tells a reader the second form is an alternative and not a
        second required step, which a plain line leaves ambiguous.
      */}
      <div className="mx-auto flex w-full max-w-md items-center gap-4 px-6">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Or skip the password
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <AuthMagicLinkForm />
    </main>
  )
}
