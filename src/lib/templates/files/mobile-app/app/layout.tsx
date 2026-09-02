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
 * WHAT IS EXTRA HERE, AND WHY. Almost all of this page's traffic is a phone
 * that will leave for a store listing, so two things are set that the other
 * templates do not need:
 *
 *   `appleWebApp.capable`   stops iOS Safari showing the browser chrome when
 *                           somebody adds the page to their home screen —
 *                           which people genuinely do with an app's site.
 *   `formatDetection`       off. iOS turns anything that looks like a phone
 *                           number into a call link, and version strings and
 *                           rating counts look exactly like phone numbers.
 *
 * REPLACE THE PLACEHOLDER STORE LINKS. `#` in `app/page.tsx` is the only
 * conversion on the page. Ship it unset and the entire site does nothing.
 *
 * Set `metadataBase` to your real domain before deploying. Next resolves
 * every relative OG image against it; left as localhost, shared links get
 * a broken preview.
 */

export const metadata: Metadata = {
  metadataBase: new URL('https://example.com'),
  title: {
    default: 'Tempo — the habit tracker that shuts up',
    template: '%s — Tempo',
  },
  description:
    'Tempo notices when you are on holiday, when you are ill, and when a streak is about to make you lie to an app. It adjusts instead of nagging.',
  applicationName: 'Tempo',
  appleWebApp: {
    capable: true,
    title: 'Tempo',
    statusBarStyle: 'default',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'Tempo',
    title: 'Tempo — the habit tracker that shuts up',
    description:
      '4.8 stars from 21,400 ratings. Free for three habits, $3.99/mo for the rest. No ads, ever.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tempo — the habit tracker that shuts up',
    description: 'Adaptive streaks that survive holidays and sick days.',
  },
}

export const viewport = {
  // The store badges and the pricing card are the two things that must not
  // be zoomed past on a narrow screen.
  width: 'device-width',
  initialScale: 1,
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
