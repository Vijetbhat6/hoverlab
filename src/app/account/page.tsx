'use client'

/**
 * /account — lightweight account management page.
 *  - Shows the user's email + name (if logged in).
 *  - "Sign out" button.
 *  - If not logged in, prompts to sign in / sign up.
 */

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, LogOut, Wand2, Heart, Package } from 'lucide-react'
import { toast } from 'sonner'

import { useAuth } from '@/components/auth-provider'
import { useFavorites } from '@/hooks/use-favorites'
import { useBundle } from '@/hooks/use-bundle'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AccountPage() {
  const { user, loading, logout } = useAuth()
  const { count: favCount } = useFavorites()
  const { count: bundleCount } = useBundle()
  const router = useRouter()
  const [signingOut, setSigningOut] = React.useState(false)

  async function onLogout() {
    setSigningOut(true)
    try {
      await logout()
      toast.success('Signed out.')
      router.replace('/library')
    } finally {
      setSigningOut(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-32 left-1/4 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -top-20 right-1/4 h-72 w-72 rounded-full bg-rose-500/20 blur-3xl" />
        </div>
        <Card className="w-full max-w-md border-border/60 bg-background/80 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>You&apos;re not signed in</CardTitle>
            <CardDescription>
              Sign in to keep your favorites and bundle safe across devices and sessions.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/signup">Create an account</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/library">Browse without an account</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const initial = (user.name ?? user.email).charAt(0).toUpperCase()

  return (
    <div className="relative min-h-screen bg-background">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/4 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -top-20 right-1/4 h-72 w-72 rounded-full bg-rose-500/20 blur-3xl" />
      </div>

      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/library" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-600 text-white shadow-lg shadow-primary/30">
              <Wand2 className="h-5 w-5" />
            </div>
            <span className="text-base font-bold tracking-tight">Hoverlab</span>
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link href="/library">Back to library</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-16 pt-12 sm:px-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-emerald-600 text-2xl font-bold text-white shadow-lg shadow-primary/30">
            {initial}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {user.name ?? 'Account'}
            </h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Card className="border-border/60">
            <CardHeader>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Heart className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wide">Favorites</span>
              </div>
              <CardTitle className="text-3xl">{favCount}</CardTitle>
              <CardDescription>
                Saved across all your devices.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-border/60">
            <CardHeader>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Package className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wide">Bundle</span>
              </div>
              <CardTitle className="text-3xl">{bundleCount}</CardTitle>
              <CardDescription>
                Effects in your export bundle.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Card className="mt-6 border-border/60">
          <CardHeader>
            <CardTitle className="text-lg">Session</CardTitle>
            <CardDescription>
              You&apos;re signed in. Your favorites and bundle are automatically
              synced to your account whenever they change.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={onLogout}
              disabled={signingOut}
            >
              {signingOut ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="mr-2 h-4 w-4" />
              )}
              Sign out
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
