'use client'

/**
 * Shared layout shell for all Designer Tools pages.
 *
 * It used to mirror the library / playground / effect-detail headers — a
 * brand badge, a tool name, a tagline, "All tools", and six icons. Mirroring
 * was the problem: five surfaces each kept their own copy of a design that
 * drifted, and none of them showed the ladder, so a visitor who landed on
 * /tools/contrast from a search had no way to discover that the site also
 * has 4,000 effects and a block catalog.
 *
 * Now it mounts <SiteHeader /> like everything else, and the tool's name
 * and tagline become a real page heading in the content — where a heading
 * belongs, and where a screen reader will actually announce it as one.
 */

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { SiteHeader } from '@/components/site-header'
import { BrandColorPicker } from '@/components/brand-color-picker'
import { SiteFooter } from '@/components/site-footer'
import { toast } from 'sonner'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export interface ToolLayoutProps {
  /** Display name of this tool, e.g. "Palette Generator". */
  name: string
  /** Short tagline shown under the name. */
  tagline: string
  /** Icon element for the logo badge. */
  icon: React.ReactNode
  children: React.ReactNode
}

export function ToolLayout({ name, tagline, icon, children }: ToolLayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Brand colour is the one control that only makes sense here: it
          recolours the tool's own output. Everything else a visitor needs
          is in the shared tray. */}
      <SiteHeader actions={<BrandColorPicker />} />

      <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="-ml-2 mb-4 gap-1.5 text-muted-foreground"
          >
            <Link href="/tools">
              <ArrowLeft className="h-4 w-4" /> All designer tools
            </Link>
          </Button>
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-600 text-white shadow-lg shadow-primary/30">
              {icon}
            </div>
            <div className="min-w-0">
              <h1 className="type-page">{name}</h1>
              <p className="text-body mt-1.5 max-w-2xl text-pretty text-sm sm:text-base">
                {tagline}
              </p>
            </div>
          </div>
        </div>

        {children}
      </main>
      <SiteFooter />
    </div>
  )
}

/** Copy text to clipboard with a toast. */
export async function copyWithToast(text: string, label = 'Copied to clipboard') {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(label)
  } catch {
    toast.error('Copy failed — please copy manually')
  }
}
