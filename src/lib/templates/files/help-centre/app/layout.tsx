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
 * THIS IS THE ONE PART OF A PRODUCT THAT MUST BE INDEXED. Note the absence
 * of the `robots: { index: false }` line that the app templates carry. A
 * help centre is found by people typing an error message into a search
 * engine, not by browsing your navigation — so the title template appends
 * the product name rather than prefixing it, because the words that match
 * the query need to be the ones that survive truncation in a result list.
 *
 * `metadataBase` matters here for a duller reason than usual: support links
 * are pasted into tickets, chat threads and email replies, and every one of
 * those unfurls a card built from a URL resolved against this value.
 */

export const metadata: Metadata = {
  metadataBase: new URL('https://example.com'),
  title: {
    default: 'Help — Acme',
    template: '%s — Acme Help',
  },
  description:
    'Answers to the questions our support inbox receives most, a status page, the documentation, and a form that reaches a person when none of that helps.',
  openGraph: {
    type: 'website',
    siteName: 'Acme Help',
    locale: 'en_GB',
    title: 'Acme Help',
    description: 'Search the answers, check the status, or write to a person.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en-GB" suppressHydrationWarning>
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
