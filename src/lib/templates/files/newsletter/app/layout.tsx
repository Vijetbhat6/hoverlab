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
 * Issue pages are the ones that get shared, so the template turns each
 * issue title into a result that stands alone. The description here is the
 * pitch, because the home page is the page people link to.
 *
 * Set `metadataBase` to your real domain before deploying. Next resolves
 * every relative OG image against it; left as localhost, shared links get
 * a broken preview.
 */

export const metadata: Metadata = {
  metadataBase: new URL('https://example.com'),
  title: {
    default: 'The Long Way Round — one long email about software',
    template: '%s — The Long Way Round — one long email about software',
  },
  description:
    'One long email about software, every Friday. Free, about 2,000 words.',
  openGraph: {
    type: 'website',
    siteName: 'The Long Way Round — one long email about software',
    title: 'The Long Way Round — one long email about software',
    description:
      'One long email about software, every Friday. Free, about 2,000 words.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Long Way Round — one long email about software',
    description:
      'One long email about software, every Friday. Free, about 2,000 words.',
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
