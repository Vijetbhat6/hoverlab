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
 * TWO THINGS ARE DIFFERENT HERE, AND BOTH ARE ABOUT THE AUDIENCE.
 *
 * `colorScheme: 'dark'` is set, and the theme script defaults to dark
 * rather than following the OS. Developers overwhelmingly run dark, this
 * palette was designed dark-first, and a docs site that opens white for
 * somebody who has set dark everywhere else reads as unfinished. The
 * toggle still works and the stored preference still wins — the change is
 * only to what an unset preference falls back to.
 *
 * The title template is `%s · Relay` with a middle dot rather than an
 * em dash, because these titles land in browser tabs beside a dozen other
 * docs pages and the dot survives truncation better.
 *
 * Set `metadataBase` to your real domain before deploying. Next resolves
 * every relative OG image against it; left as localhost, shared links get
 * a broken preview.
 */

export const metadata: Metadata = {
  metadataBase: new URL('https://example.com'),
  title: {
    default: 'Relay — webhooks that arrive, or tell you why not',
    template: '%s · Relay',
  },
  description:
    'Delivery, retries, signature verification and the dead-letter queue, off your critical path. One endpoint in, one verified payload out.',
  openGraph: {
    type: 'website',
    siteName: 'Relay',
    title: 'Relay — webhooks that arrive, or tell you why not',
    description:
      'Twelve retries over 72 hours, constant-time signature verification, and every attempt logged with its response body.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Relay — webhooks that arrive, or tell you why not',
    description: 'npm i @relay/sdk — two files, no agent, no sidecar.',
  },
}

export const viewport = {
  colorScheme: 'dark light',
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
                // Dark unless they have said otherwise — see the note above.
                var dark = stored ? stored === 'dark' : true
                if (dark) document.documentElement.classList.add('dark')
              } catch (e) {
                document.documentElement.classList.add('dark')
              }
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
