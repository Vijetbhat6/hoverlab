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
 * A regulated financial product is judged on its metadata as well as its
 * page: the description is the snippet a prospective customer reads in a
 * search result, and claiming anything there you cannot claim on the page
 * is a financial-promotions problem in several jurisdictions.
 *
 * Set `metadataBase` to your real domain before deploying. Next resolves
 * every relative OG image against it; left as localhost, shared links get
 * a broken preview.
 */

export const metadata: Metadata = {
  metadataBase: new URL('https://example.com'),
  title: {
    default: 'Meridian — spot trading, published fees',
    template: '%s — Meridian — spot trading, published fees',
  },
  description:
    'A regulated exchange with the fee schedule on the same page as the marketing.',
  openGraph: {
    type: 'website',
    siteName: 'Meridian — spot trading, published fees',
    title: 'Meridian — spot trading, published fees',
    description:
      'A regulated exchange with the fee schedule on the same page as the marketing.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Meridian — spot trading, published fees',
    description:
      'A regulated exchange with the fee schedule on the same page as the marketing.',
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
