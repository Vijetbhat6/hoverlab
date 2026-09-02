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
 * A marketplace lives on long-tail search. Almost none of its traffic
 * arrives at this page — it arrives at a listing, from a query nobody
 * predicted. Two consequences are set here:
 *
 *   `title.template`   every listing and category page inherits it, so a
 *                      thousand pages are titled consistently without a
 *                      thousand decisions.
 *   `robots`           `max-image-preview: large` and `max-snippet: -1`.
 *                      Product results are chosen on the thumbnail, and the
 *                      default preview size is a postage stamp.
 *
 * `SearchAction` JSON-LD offers the search box directly in a Google result
 * for the brand. It only renders if your `/browse` route actually accepts a
 * `q` parameter — wire that up or delete the block, because pointing it at
 * a route that ignores the query is worse than not having it.
 *
 * Set `metadataBase` to your real domain before deploying. Next resolves
 * every relative OG image against it; left as localhost, shared links get
 * a broken preview.
 */

export const metadata: Metadata = {
  metadataBase: new URL('https://example.com'),
  title: {
    default: 'Thicket — a marketplace for people who make things',
    template: '%s — Thicket',
  },
  description:
    'Nine thousand independent makers across the UK, Ireland and the EU. Every listing names the person who made it and the town they made it in. No dropshippers, no resold factory stock.',
  openGraph: {
    type: 'website',
    siteName: 'Thicket',
    locale: 'en_GB',
    title: 'Thicket — a marketplace for people who make things',
    description:
      'Nine thousand independent makers. Every listing names the maker and where they made it.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Thicket — made by someone, somewhere near you',
    description: 'Nine thousand independent makers. No dropshippers.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      // Listing results are chosen on the thumbnail, and the default preview
      // is a postage stamp.
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

const SEARCH_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Thicket',
  url: 'https://example.com',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://example.com/browse?q={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en-GB" suppressHydrationWarning>
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(SEARCH_JSON_LD),
          }}
        />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
