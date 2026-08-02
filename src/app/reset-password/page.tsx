import { Suspense } from 'react'
import { ResetPasswordForm } from '@/components/reset-password-form'

export const metadata = {
  title: 'Reset password — Hoverlab',
  robots: { index: false, follow: false },
}

/**
 * /reset-password. Same Suspense wrapper as /login — the form reads the
 * token via useSearchParams(), which requires one under static rendering.
 */
export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-sm text-muted-foreground">Loading…</div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}
