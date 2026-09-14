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
 * A personal site wants to be found by a search for your own name, so
 * there is no robots override and the `title.template` turns every route
 * into a good result: "Projects — Aisling Moreau", not four tabs all
 * called the same thing.
 *
 * Set `metadataBase` to your real domain before deploying. Next resolves
 * every relative OG image against it; left as localhost, shared links get
 * a broken preview.
 */

export const metadata: Metadata = {
  metadataBase: new URL('https://example.com'),
  title: {
    default: 'Aisling Moreau — principal engineer',
    template: '%s — Aisling Moreau — principal engineer',
  },
  description:
    'Platform and performance engineering. Selected work, writing, and a CV that prints.',
  openGraph: {
    type: 'website',
    siteName: 'Aisling Moreau — principal engineer',
    title: 'Aisling Moreau — principal engineer',
    description:
      'Platform and performance engineering. Selected work, writing, and a CV that prints.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aisling Moreau — principal engineer',
    description:
      'Platform and performance engineering. Selected work, writing, and a CV that prints.',
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
