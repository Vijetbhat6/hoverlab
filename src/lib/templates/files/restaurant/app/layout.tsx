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
 * The city is in the title on purpose. Almost every search that reaches a
 * restaurant site is local, and the name alone competes with every other
 * business of the same name in the country.
 *
 * Set `metadataBase` to your real domain before deploying. Next resolves
 * every relative OG image against it; left as localhost, shared links get
 * a broken preview.
 */

export const metadata: Metadata = {
  metadataBase: new URL('https://example.com'),
  title: {
    default: 'Quay & Larder — Cotham Hill, Bristol',
    template: '%s — Quay & Larder — Cotham Hill, Bristol',
  },
  description:
    'Thirty-eight covers, one menu, changed when the produce changes.',
  openGraph: {
    type: 'website',
    siteName: 'Quay & Larder — Cotham Hill, Bristol',
    title: 'Quay & Larder — Cotham Hill, Bristol',
    description:
      'Thirty-eight covers, one menu, changed when the produce changes.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Quay & Larder — Cotham Hill, Bristol',
    description:
      'Thirty-eight covers, one menu, changed when the produce changes.',
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
