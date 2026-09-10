/**
 * The chrome around an application: everything that is on every screen and
 * belongs to none of them.
 *
 * This page is a deliberate exception to how the rest of the catalog is
 * organised. The other pages are places; this one is the furniture. It
 * exists because navigation and overlay components are the ones most often
 * built twice — once well in the design system and once badly in a hurry —
 * and seeing the eight of them together makes the duplication obvious.
 *
 * Grouped by how a person reaches them:
 *
 *   pointer      navbar, mobile drawer
 *   keyboard     command palette, and the "?" sheet that teaches it
 *   search       the field in the header, and one query counted across
 *                every scope it could have matched
 *   surfaces     bottom sheet, slide-over — the two shapes a detail view
 *                takes when it must not lose the list behind it
 *
 * The distinction between <CommandPalette> and <SearchAutocomplete> is the
 * reason both are here. They look identical and behave oppositely: the
 * palette is a switcher where Enter runs the highlighted command, and the
 * header field is a search where Enter searches for what you *typed* unless
 * you arrowed down first. Shipping one with the other's Enter behaviour is
 * a bug that survives review because the screenshot is the same.
 *
 * <KeyboardShortcutsSheet> is placed right after the palette rather than at
 * the end, because a keyboard interface nobody can discover is a keyboard
 * interface nobody uses, and the sheet is the discovery mechanism.
 */

import * as React from 'react'
import { NavbarAuthenticated } from '@/lib/blocks/sources/navbar-authenticated'
import { NavMobileDrawer } from '@/lib/blocks/sources/nav-mobile-drawer'
import { CommandPalette } from '@/lib/blocks/sources/command-palette'
import { KeyboardShortcutsSheet } from '@/lib/blocks/sources/keyboard-shortcuts-sheet'
import { SearchAutocomplete } from '@/lib/blocks/sources/search-autocomplete'
import { SearchScopeSwitcher } from '@/lib/blocks/sources/search-scope-switcher'
import { BottomSheetMobile } from '@/lib/blocks/sources/bottom-sheet-mobile'
import { SlideOverPanel } from '@/lib/blocks/sources/slide-over-panel'

export default function AppShellPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <NavbarAuthenticated />

      <section className="mx-auto w-full max-w-5xl px-6 pb-2 pt-10">
        <h1 className="text-2xl font-bold tracking-tight">App shell</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The furniture: navigation, the two keyboard surfaces, search, and
          the two ways to open a detail view without losing the list.
        </p>
      </section>

      <NavMobileDrawer />

      <CommandPalette />
      <KeyboardShortcutsSheet />

      <SearchAutocomplete />
      <SearchScopeSwitcher />

      <BottomSheetMobile />
      <SlideOverPanel />
    </main>
  )
}
