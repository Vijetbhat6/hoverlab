import type { Metadata } from 'next'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

/**
 * Root layout.
 *
 * `suppressHydrationWarning` on <html> is required, not cosmetic: the theme
 * script below writes a class onto that element before React hydrates, so
 * the server markup and the first client render disagree by design.
 *
 * `robots: { index: false }` — an internal tool has no business in a search
 * result, and a board carries customer names in its card titles.
 *
 * Note what sits beside this file: `error.tsx`. Next only renders an error
 * boundary that lives next to the layout it should replace, and only if it
 * is a client component. Moving it, or dropping the `'use client'` at its
 * top, silently restores the default grey error screen — silently, because
 * nothing fails until something throws in production.
 */

export const metadata: Metadata = {
  title: {
    default: 'Board — Tracker',
    template: '%s — Tracker',
  },
  description: 'Internal project tracking.',
  robots: { index: false, follow: false },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var stored = localStorage.getItem('theme')
                var dark = stored
                  ? stored === 'dark'
                  : window.matchMedia('(prefers-color-scheme: dark)').matches
                if (dark) document.documentElement.classList.add('dark')
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
