/**
 * The second factor, and the fallback for when the second factor is gone.
 *
 * Two-factor screens ship as one input and a submit. That covers the happy
 * path and abandons the case that generates every support ticket: the
 * phone is lost, replaced, or in another room. A 2FA prompt with no
 * recovery route is a lockout screen wearing a security screen's clothes.
 *
 * So the authenticator challenge is first and the one-time-code fallback
 * is under it, on the same screen rather than behind a link. A recovery
 * path one click away is a recovery path somebody locked out will not find
 * while they are irritated.
 *
 * The obvious wrong answer is to lead with the fallback because it is
 * easier — that trains everybody onto the weaker factor, which is the
 * opposite of why this screen exists.
 */

import * as React from 'react'
import { AuthTwoFactor } from '@/lib/blocks/sources/auth-two-factor'
import { AuthOtpVerify } from '@/lib/blocks/sources/auth-otp-verify'

export default function TwoFactorPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <AuthTwoFactor />

      <div className="mx-auto flex w-full max-w-md items-center gap-4 px-6">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Lost your device
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <AuthOtpVerify />
    </main>
  )
}
