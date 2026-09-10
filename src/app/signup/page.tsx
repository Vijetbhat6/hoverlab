import { Suspense } from 'react'
import { AuthForm } from '@/components/auth-form'

export const metadata = {
  title: 'Create account — Hoverlab',
  // See the note on /login.
  alternates: { canonical: '/signup' },
}

/**
 * /signup page. Same Suspense wrapper as /login.
 */
export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-sm text-muted-foreground">Loading…</div>
        </div>
      }
    >
      <AuthForm mode="signup" />
    </Suspense>
  )
}
