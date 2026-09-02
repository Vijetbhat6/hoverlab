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
 * THE KEYWORDS ARE THE CONNECTOR NAMES, AND THAT IS THE POINT. Nobody
 * searches for "integration platform". They search for "salesforce netsuite
 * sync api", and the whole acquisition strategy for this kind of product is
 * being the answer to a query containing somebody else's product name.
 *
 * Which is also why the catalogue section on the page is server-rendered
 * plain markup rather than a filtered client-side grid: every connector name
 * has to be in the HTML that arrives, not assembled after hydration. If you
 * replace that section with something interactive, keep the full list in the
 * initial render and filter on top of it.
 *
 * Set `metadataBase` to your real domain before deploying. Next resolves
 * every relative OG image against it; left as localhost, shared links get
 * a broken preview.
 */

export const metadata: Metadata = {
  metadataBase: new URL('https://example.com'),
  title: {
    default: 'Junction — one API for every system your customers already run',
    template: '%s · Junction',
  },
  description:
    '38 CRM, ledger and HR connectors behind a single normalised schema. Write the integration once; we keep it working when their vendor changes the field names.',
  keywords: [
    'salesforce api integration',
    'netsuite integration',
    'xero api',
    'workday connector',
    'unified api',
    'crm integration platform',
  ],
  openGraph: {
    type: 'website',
    siteName: 'Junction',
    title: 'Junction — one API for 38 systems',
    description:
      'Salesforce, NetSuite, Xero, Workday and 34 more, behind one normalised schema. Credit pricing, no per-connector fee.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Junction — one API for 38 systems',
    description: 'One schema across CRM, ledger and HR. Four SDKs.',
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
