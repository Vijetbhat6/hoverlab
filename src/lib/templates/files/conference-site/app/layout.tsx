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
 * The year belongs in the title. A conference site is re-used annually and
 * the single most common failure is last year\’s page outranking this
 * year\’s, with no way for a reader to tell which one they are on.
 *
 * Set `metadataBase` to your real domain before deploying. Next resolves
 * every relative OG image against it; left as localhost, shared links get
 * a broken preview.
 */

export const metadata: Metadata = {
  metadataBase: new URL('https://example.com'),
  title: {
    default: 'Frontier 2026 — Berlin, 14–15 May',
    template: '%s — Frontier 2026 — Berlin, 14–15 May',
  },
  description:
    'Two days on the parts of building software nobody demos.',
  openGraph: {
    type: 'website',
    siteName: 'Frontier 2026 — Berlin, 14–15 May',
    title: 'Frontier 2026 — Berlin, 14–15 May',
    description:
      'Two days on the parts of building software nobody demos.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Frontier 2026 — Berlin, 14–15 May',
    description:
      'Two days on the parts of building software nobody demos.',
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
