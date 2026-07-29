import { Suspense } from 'react'
import { AuthForm } from '@/components/auth-form'

export const metadata = {
  title: 'Sign in — Hoverlab',
}

/**
 * /login page. Wraps the AuthForm in a Suspense boundary because
 * AuthForm uses useSearchParams() (which requires Suspense in
 * Next.js static rendering).
 */
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-sm text-muted-foreground">Loading…</div>
        </div>
      }
    >
      <AuthForm mode="login" />
    </Suspense>
  )
}
