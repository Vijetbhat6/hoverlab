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
 * Watch pages should carry the episode and the series in their own title.
 * The catalogue is the search surface, and an episode titled only with the
 * service name is invisible.
 *
 * Set `metadataBase` to your real domain before deploying. Next resolves
 * every relative OG image against it; left as localhost, shared links get
 * a broken preview.
 */

export const metadata: Metadata = {
  metadataBase: new URL('https://example.com'),
  title: {
    default: 'Longform — long-form technical film-making',
    template: '%s — Longform — long-form technical film-making',
  },
  description:
    '240 hours, one plan, no ads and no ad tier.',
  openGraph: {
    type: 'website',
    siteName: 'Longform — long-form technical film-making',
    title: 'Longform — long-form technical film-making',
    description:
      '240 hours, one plan, no ads and no ad tier.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Longform — long-form technical film-making',
    description:
      '240 hours, one plan, no ads and no ad tier.',
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
