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
 * Docs are the one part of a product that *wants* to be crawled — half of
 * all docs traffic is a search result for an error message — so unlike the
 * app templates there is no robots override here, and the `title.template`
 * is what turns every article title into a good result: "Rate limits —
 * Acme Docs", not four tabs all named "Docs".
 *
 * Set `metadataBase` to your real domain before deploying. Next resolves
 * every relative OG image against it; left as localhost, shared links get
 * a broken preview.
 */

export const metadata: Metadata = {
  metadataBase: new URL('https://example.com'),
  title: {
    default: 'Acme Docs',
    template: '%s — Acme Docs',
  },
  description:
    'Guides, references and release notes for the Acme API and dashboard.',
  openGraph: {
    type: 'website',
    siteName: 'Acme Docs',
    title: 'Acme Docs',
    description:
      'Guides, references and release notes for the Acme API and dashboard.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Acme Docs',
    description:
      'Guides, references and release notes for the Acme API and dashboard.',
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
