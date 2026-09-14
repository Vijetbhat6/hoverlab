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
 * Property listings are the most-linked pages here, so the title template
 * is what turns a shared listing into a readable result. Put the street
 * and the town in each page\’s own title.
 *
 * Set `metadataBase` to your real domain before deploying. Next resolves
 * every relative OG image against it; left as localhost, shared links get
 * a broken preview.
 */

export const metadata: Metadata = {
  metadataBase: new URL('https://example.com'),
  title: {
    default: 'Halyard & Co — estate agents, Bristol',
    template: '%s — Halyard & Co — estate agents, Bristol',
  },
  description:
    'Houses and flats across Bristol, with the numbers we actually achieve published.',
  openGraph: {
    type: 'website',
    siteName: 'Halyard & Co — estate agents, Bristol',
    title: 'Halyard & Co — estate agents, Bristol',
    description:
      'Houses and flats across Bristol, with the numbers we actually achieve published.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Halyard & Co — estate agents, Bristol',
    description:
      'Houses and flats across Bristol, with the numbers we actually achieve published.',
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
