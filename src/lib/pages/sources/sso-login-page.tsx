/**
 * The enterprise sign-in route: a domain, then their identity provider.
 *
 * Two audiences land here and they want opposite things. An employee at a
 * customer wants to type a domain and be redirected in under three
 * seconds. The IT person evaluating whether to buy wants to know which
 * standards are supported and whether deprovisioning works.
 *
 * Serving both on one screen is the layout problem, and the obvious wrong
 * answer is a marketing section above the form — which taxes the daily
 * user, who is the far more frequent visitor, for the benefit of a reader
 * who arrives once.
 *
 * So the domain form is first and alone, and the capability detail sits
 * below the fold where the evaluator will scroll and the employee never
 * has to.
 */

import * as React from 'react'
import { AuthSsoDomain } from '@/lib/blocks/sources/auth-sso-domain'
import { SsoEnterpriseSplit } from '@/lib/blocks/sources/sso-enterprise-split'

export default function SsoLoginPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <AuthSsoDomain />
      <SsoEnterpriseSplit />
    </main>
  )
}
