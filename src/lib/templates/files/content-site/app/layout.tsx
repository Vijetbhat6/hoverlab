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
 * Like the marketing template, this one carries real SEO metadata — for a
 * content site it matters twice over, because articles live or die on how
 * they look when shared. The `title.template` here is what turns a post
 * title into "Post title — Acme Journal" on every article without each
 * page repeating the suffix.
 *
 * Set `metadataBase` to your real domain before deploying. Next resolves
 * every relative OG image against it; left as localhost, shared links get
 * a broken preview.
 */

export const metadata: Metadata = {
  metadataBase: new URL('https://example.com'),
  title: {
    default: 'Acme Journal — Notes from the team',
    template: '%s — Acme Journal',
  },
  description:
    'Essays, teardowns and release notes from the people building Acme.',
  openGraph: {
    type: 'website',
    siteName: 'Acme Journal',
    title: 'Acme Journal — Notes from the team',
    description:
      'Essays, teardowns and release notes from the people building Acme.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Acme Journal — Notes from the team',
    description:
      'Essays, teardowns and release notes from the people building Acme.',
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
