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
 * A pre-launch site is shared far more than it is searched — the traffic
 * arrives from a link in a group chat, a newsletter or a post, not from
 * Google. So the Open Graph card below is the load-bearing metadata here,
 * and the description is written to be read in a preview rather than in a
 * results page.
 *
 * Set `metadataBase` to your real domain before deploying. Next resolves
 * every relative OG image against it; left as localhost, the shared link
 * that is your whole distribution strategy gets a broken preview.
 */

export const metadata: Metadata = {
  metadataBase: new URL('https://example.com'),
  title: {
    default: 'Orbit — your calendar, minus the negotiation',
    template: '%s — Orbit',
  },
  description:
    'Orbit reads the meeting out of the thread and books it, in the gap everyone can actually make. Join the waitlist — free for the first cohort.',
  openGraph: {
    type: 'website',
    siteName: 'Orbit',
    title: 'Orbit — your calendar, minus the negotiation',
    description:
      'No polls, no back-and-forth, no third message asking about Tuesday. 4,820 people are already on the list.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Orbit — your calendar, minus the negotiation',
    description:
      'No polls, no back-and-forth, no third message asking about Tuesday.',
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
