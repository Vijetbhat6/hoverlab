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
 * Job listings live or die in search, so every listing page should set its
 * own title — role, company, location — and let this template append the
 * board name. A board where every tab says the board name is unusable.
 *
 * Set `metadataBase` to your real domain before deploying. Next resolves
 * every relative OG image against it; left as localhost, shared links get
 * a broken preview.
 */

export const metadata: Metadata = {
  metadataBase: new URL('https://example.com'),
  title: {
    default: 'Plainspoken — jobs with the salary on them',
    template: '%s — Plainspoken — jobs with the salary on them',
  },
  description:
    'Every job here has a salary on it. No agencies, no “competitive”.',
  openGraph: {
    type: 'website',
    siteName: 'Plainspoken — jobs with the salary on them',
    title: 'Plainspoken — jobs with the salary on them',
    description:
      'Every job here has a salary on it. No agencies, no “competitive”.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Plainspoken — jobs with the salary on them',
    description:
      'Every job here has a salary on it. No agencies, no “competitive”.',
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
