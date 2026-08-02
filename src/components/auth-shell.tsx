/**
 * The framing every auth page shares: centered card on the tinted blur
 * background, brand lockup above it, fine print below.
 *
 * Extracted from auth-form.tsx when /forgot-password and /reset-password
 * arrived and would otherwise have been the second and third copies of this
 * markup — three places to keep in sync every time the login page changes.
 * Children render inside the card, under the heading.
 */

import * as React from 'react'
import Link from 'next/link'
import { Wand2 } from 'lucide-react'

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function AuthShell({
  title,
  description,
  note,
  children,
}: {
  title: React.ReactNode
  description: React.ReactNode
  /** Fine print under the card. */
  note?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/4 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -top-20 right-1/4 h-72 w-72 rounded-full bg-rose-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      <div className="w-full max-w-md">
        {/* Brand */}
        <Link
          href="/library"
          className="mb-6 flex items-center justify-center gap-2.5 text-foreground"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-600 text-white shadow-lg shadow-primary/30">
            <Wand2 className="h-5 w-5" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-base font-bold tracking-tight">Hoverlab</span>
            <span className="text-[11px] text-muted-foreground">
              A living CSS effects library
            </span>
          </div>
        </Link>

        <Card className="border-border/60 bg-background/80 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-2xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>

          {children}
        </Card>

        {note ? (
          <p className="mt-6 text-center text-xs text-muted-foreground">
            {note}
          </p>
        ) : null}
      </div>
    </div>
  )
}
