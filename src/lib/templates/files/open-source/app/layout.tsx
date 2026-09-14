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
 * Docs are the one part of a project that wants to be crawled — half of all
 * docs traffic is a search for an error message — so there is no robots
 * override and the template turns every page into a good result.
 *
 * Set `metadataBase` to your real domain before deploying. Next resolves
 * every relative OG image against it; left as localhost, shared links get
 * a broken preview.
 */

export const metadata: Metadata = {
  metadataBase: new URL('https://example.com'),
  title: {
    default: 'ratchet — schema migrations that refuse to break production',
    template: '%s — ratchet — schema migrations that refuse to break production',
  },
  description:
    'A migration runner that reads your application code before it drops a column.',
  openGraph: {
    type: 'website',
    siteName: 'ratchet — schema migrations that refuse to break production',
    title: 'ratchet — schema migrations that refuse to break production',
    description:
      'A migration runner that reads your application code before it drops a column.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ratchet — schema migrations that refuse to break production',
    description:
      'A migration runner that reads your application code before it drops a column.',
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
