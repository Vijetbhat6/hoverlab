'use client'

/**
 * /account — lightweight account management page.
 *  - Shows the user's email + name (if logged in).
 *  - Plan and upgrade options, and the landing spot for Polar's
 *    post-checkout redirect (see <UpgradePanel>).
 *  - "Sign out" button, which returns to the landing page.
 *  - If not logged in, prompts to sign in / sign up.
 */

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, LogOut, Heart, Package, FolderOpen, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

import { useAuth } from '@/components/auth-provider'
import { SiteHeader } from '@/components/site-header'
import { useFavorites } from '@/hooks/use-favorites'
import { useBundle } from '@/hooks/use-bundle'
import { UpgradePanel } from '@/components/billing/upgrade-panel'
import { LicenseCertificate } from '@/components/license/license-certificate'
import { LicenseKeyCard } from '@/components/billing/license-key-card'
import { WorkspaceCard } from '@/components/billing/workspace-card'
import { CreditsCard } from '@/components/billing/credits-card'
import { SavedToolPresets } from '@/components/account/saved-tool-presets'
import { PasskeysCard } from '@/components/account/passkeys-card'
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
      // Back to the landing page. Staying here would just render the
      // "you're not signed in" card, and /account is the one prefix
      // proxy.ts still gates, so the redirect would fire anyway.
      router.replace('/')
      router.refresh()
    } finally {
      setSigningOut(false)
    }
  }

  /*
   * Both early returns carry the header too.
   *
   * They used to return bare — so /account rendered with no navigation at
   * all while auth was resolving, and, more to the point, the signed-out
   * state was a permanently headerless page: a card with three links and no
   * way to reach the catalog those links are about. "One header everywhere"
   * has to include the states a page spends most of its time in for a
   * signed-out visitor, not just the happy path.
   */
  if (loading) {
    return (
      <>
        <SiteHeader />
        <div className="flex min-h-[60vh] items-center justify-center bg-background">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="sr-only">Loading your account…</span>
        </div>
      </>
    )
  }

  if (!user) {
    return (
      <>
        <SiteHeader />
        {/* No `overflow-hidden` on this wrapper — it would make it the scroll
            container for the sticky header above. The blobs are clipped by
            their own wrapper, which already has it. */}
        <div className="relative flex min-h-[70vh] items-center justify-center bg-background px-4">
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
                <Link href="/browse">Browse without an account</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  const initial = (user.name ?? user.email).charAt(0).toUpperCase()

  return (
    <div className="relative min-h-screen bg-background">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/4 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -top-20 right-1/4 h-72 w-72 rounded-full bg-rose-500/20 blur-3xl" />
      </div>

      <SiteHeader />

      <main id="main-content" className="mx-auto max-w-5xl px-4 pb-16 pt-12 sm:px-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-emerald-600 text-2xl font-bold text-white shadow-lg shadow-primary/30">
            {initial}
          </div>
          <div>
            <h1 className="type-page">
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

        {/*
          Collections had no route from here.

          Favourites and the bundle are both surfaced above as counts, and
          collections — the third and the only *named* one of the three —
          was reachable only from the "Save to…" popover on an artifact
          page. Someone who made one had to remember it existed and type the
          URL. No count on this card, deliberately: favourites and the
          bundle are already loaded in this component, and fetching the
          collections list to render one number would make the account page
          wait on a request for a link.
        */}
        <Link
          href="/collections"
          className="group mt-4 flex items-center gap-3 rounded-xl border border-border/60 bg-card/60 p-4 transition-colors hover:border-border hover:bg-card"
        >
          <FolderOpen aria-hidden className="h-5 w-5 shrink-0 text-primary" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">Collections</span>
            <span className="block text-sm text-muted-foreground">
              Your named lists of effects, blocks, pages and templates.
            </span>
          </span>
          <ArrowRight
            aria-hidden
            className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
          />
        </Link>

        {/*
          UpgradePanel reads the `?checkout=success` return params with
          useSearchParams(), which Next requires a Suspense boundary for
          during static rendering.
        */}
        <React.Suspense
          fallback={
            <Card className="mt-6 border-border/60">
              <CardHeader>
                <CardTitle className="text-lg">Plan</CardTitle>
                <CardDescription>Loading…</CardDescription>
              </CardHeader>
            </Card>
          }
        >
          <UpgradePanel />
        </React.Suspense>

        {/*
          The certificate, directly under the tiers.

          A customer who has just bought Pro lands here from Polar's redirect,
          and the first useful thing to show them is the thing they bought —
          not a credit balance. It is also what they come back for months
          later, when a client's legal team asks.
        */}
        <LicenseCertificate className="mt-6" />

        {/* Directly under the certificate, because they are the same fact in
            two forms: the certificate is the licence a person reads, the key
            is the licence a machine reads. Renders nothing for a free
            account — see the component. */}
        <LicenseKeyCard className="mt-6" />

        {/* Under the licence, because Pro+ is an add-on to whichever tier you
            hold rather than a rung of its own. */}
        <CreditsCard />

        {/*
          Then seats, because the common case is someone who bought a
          workspace looking for the code to hand out — and the uncommon case
          is someone redeeming one, who was sent here to do it.
        */}
        <WorkspaceCard />

        {/*
          Then the tools, below everything to do with the licence.

          Placement is the argument: this card is the only thing on the page
          a FREE account has any reason to come back for. Putting it above
          the plan would make the account page look like a tools dashboard
          for the customers who actually pay; putting it below the plan and
          the seats means the person scrolling past all of it is the person
          it is for.
        */}
        <SavedToolPresets />

        {/*
          Immediately above Session, because they are two halves of the same
          question — how you get in, and how you get out — and someone who
          has come here to sign out on a shared machine is exactly the person
          who should see that a passkey is registered on it.
        */}
        <div className="mt-6">
          <PasskeysCard />
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
