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
 * A directory\’s listing pages are its entire search surface. Each should
 * set its own title from the entry name; this template appends the
 * directory so a result is attributable at a glance.
 *
 * Set `metadataBase` to your real domain before deploying. Next resolves
 * every relative OG image against it; left as localhost, shared links get
 * a broken preview.
 */

export const metadata: Metadata = {
  metadataBase: new URL('https://example.com'),
  title: {
    default: 'Stackfinder — 1,028 developer tools, independently indexed',
    template: '%s — Stackfinder — 1,028 developer tools, independently indexed',
  },
  description:
    'Nobody can pay to rank, and the whole index is downloadable.',
  openGraph: {
    type: 'website',
    siteName: 'Stackfinder — 1,028 developer tools, independently indexed',
    title: 'Stackfinder — 1,028 developer tools, independently indexed',
    description:
      'Nobody can pay to rank, and the whole index is downloadable.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Stackfinder — 1,028 developer tools, independently indexed',
    description:
      'Nobody can pay to rank, and the whole index is downloadable.',
  },
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
