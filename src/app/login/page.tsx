import { Suspense } from 'react'
import { AuthForm } from '@/components/auth-form'

export const metadata = {
  title: 'Sign in — Hoverlab',
  // Set here rather than inherited: the root layout's canonical is the
  // home page, and a sign-in screen claiming to be the home page is worse
  // than one claiming nothing. Disallowed in robots.txt either way.
  alternates: { canonical: '/login' },
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
