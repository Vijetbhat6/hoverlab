/**
 * A full sign-in screen.
 *
 * Almost nothing beyond the card, and that is the point: an auth page has
 * exactly one job, and every additional element on it is a way to fail at
 * that job. No nav, no marketing, no footer links competing with the form.
 *
 * What is here beyond the card is the small print that stops support
 * tickets — a way back to the marketing site, and the legal links that have
 * to be reachable from somewhere.
 *
 * The gradient wash is `-z-10` behind everything and `pointer-events-none`,
 * so it can never intercept a click meant for the form.
 */

import * as React from 'react'
import { AuthLoginCard } from '@/lib/blocks/sources/auth-login-card'

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 text-foreground">
      {/* Decoration only — never in front of the form. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/3 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute bottom-0 right-1/3 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <a
        href="/"
        className="mb-2 flex items-center gap-2 text-sm font-semibold tracking-tight"
      >
        <span
          aria-hidden
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground"
        >
          A
        </span>
        Acme Inc
      </a>

      <AuthLoginCard />

      <p className="mt-6 text-center text-xs text-muted-foreground">
        <a href="/terms" className="hover:text-foreground">
          Terms
        </a>
        <span aria-hidden className="mx-2">
          ·
        </span>
        <a href="/privacy" className="hover:text-foreground">
          Privacy
        </a>
        <span aria-hidden className="mx-2">
          ·
        </span>
        <a href="/support" className="hover:text-foreground">
          Support
        </a>
      </p>
    </main>
  )
}
