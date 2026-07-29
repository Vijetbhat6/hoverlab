'use client'

/**
 * Shared layout shell for all Designer Tools pages. Mirrors the visual
 * structure of the library / playground / effect-detail headers so the
 * tools feel native to the rest of the app.
 */

import * as React from 'react'
import Link from 'next/link'
import { ArrowLeft, Wand2, Keyboard, Package, Scale } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { ReducedMotionToggle } from '@/components/reduced-motion-toggle'
import { BrandColorPicker } from '@/components/brand-color-picker'
import { CopyHistoryDropdown } from '@/components/copy-history-dropdown'
import { UserMenu } from '@/components/user-menu'
import { ShortcutsHelpButton, useShortcutsHelp } from '@/components/shortcuts-help'
import { CommandPalette } from '@/components/command-palette'
import { BundleDrawer } from '@/components/bundle-drawer'
import { CompareDrawer } from '@/components/compare-drawer'
import { useBundle } from '@/hooks/use-bundle'
import { useCompare } from '@/hooks/use-compare'
import { toast } from 'sonner'

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
  const { open: openShortcuts } = useShortcutsHelp()
  const [bundleOpen, setBundleOpen] = React.useState(false)
  const [compareOpen, setCompareOpen] = React.useState(false)
  const { count: bundleCount } = useBundle()
  const { count: compareCount } = useCompare()

  React.useEffect(() => {
    const onBundle = () => setBundleOpen(true)
    const onCompare = () => setCompareOpen(true)
    window.addEventListener('hoverlab:open-bundle', onBundle)
    window.addEventListener('hoverlab:open-compare', onCompare)
    return () => {
      window.removeEventListener('hoverlab:open-bundle', onBundle)
      window.removeEventListener('hoverlab:open-compare', onCompare)
    }
  }, [])

  return (
    <div className="relative flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-600 text-white shadow-lg shadow-primary/30">
              {icon ?? <Wand2 className="h-5 w-5" />}
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-base font-bold tracking-tight">{name}</span>
              <span className="text-[11px] text-muted-foreground">{tagline}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="hidden gap-1.5 sm:inline-flex"
              asChild
            >
              <Link href="/tools">
                <ArrowLeft className="h-4 w-4" /> All tools
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={openShortcuts}
              aria-label="Keyboard shortcuts"
              title="Keyboard shortcuts (?)"
            >
              <Keyboard className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9"
              onClick={() => setBundleOpen(true)}
              aria-label={`Open bundle (${bundleCount} item${bundleCount === 1 ? '' : 's'})`}
              title="Open bundle (b)"
            >
              <Package className="h-4 w-4" />
              {bundleCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {bundleCount}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9"
              onClick={() => setCompareOpen(true)}
              aria-label={`Open compare (${compareCount} item${compareCount === 1 ? '' : 's'})`}
              title="Open compare (v)"
            >
              <Scale className="h-4 w-4" />
              {compareCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {compareCount}
                </span>
              )}
            </Button>
            <CopyHistoryDropdown />
            <UserMenu />
            <ThemeToggle />
            <ReducedMotionToggle />
            <BrandColorPicker />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        {children}
      </main>

      <BundleDrawer open={bundleOpen} onOpenChange={setBundleOpen} />
      <CompareDrawer open={compareOpen} onOpenChange={setCompareOpen} />
      <CommandPalette />
      <ShortcutsHelpButton />
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
