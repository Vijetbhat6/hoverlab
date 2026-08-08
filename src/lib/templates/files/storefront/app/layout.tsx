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
 * Unlike the app templates, this one carries real SEO metadata —
 * `metadataBase`, Open Graph and Twitter cards. A marketing site's whole
 * job is to be found and to look right when it is shared, and both of
 * those are set here once rather than per page.
 *
 * Set `metadataBase` to your real domain before deploying. Next resolves
 * every relative OG image against it; left as localhost, shared links get
 * a broken preview.
 */

export const metadata: Metadata = {
  metadataBase: new URL('https://example.com'),
  title: {
    default: 'Acme — Knitwear made to keep its shape',
    template: '%s — Acme',
  },
  description:
    'Fully fashioned merino and lambswool, knitted in Scotland.',
  openGraph: {
    type: 'website',
    siteName: 'Acme',
    title: 'Acme — Knitwear made to keep its shape',
    description: 'Fully fashioned merino and lambswool, knitted in Scotland.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Acme — Knitwear made to keep its shape',
    description: 'Fully fashioned merino and lambswool, knitted in Scotland.',
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
