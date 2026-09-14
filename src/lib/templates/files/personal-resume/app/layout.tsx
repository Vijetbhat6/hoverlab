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
 * The title template matters more here than on most sites: a recruiter
 * with six tabs open should be able to tell which one is yours from the
 * tab alone, and "R\ésum\é" on its own does not do that.
 *
 * Set `metadataBase` to your real domain before deploying. Next resolves
 * every relative OG image against it; left as localhost, shared links get
 * a broken preview.
 */

export const metadata: Metadata = {
  metadataBase: new URL('https://example.com'),
  title: {
    default: 'Aisling Moreau',
    template: '%s — Aisling Moreau',
  },
  description:
    'Principal engineer. The CV, the work, and how to get in touch.',
  openGraph: {
    type: 'website',
    siteName: 'Aisling Moreau',
    title: 'Aisling Moreau',
    description:
      'Principal engineer. The CV, the work, and how to get in touch.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aisling Moreau',
    description:
      'Principal engineer. The CV, the work, and how to get in touch.',
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
