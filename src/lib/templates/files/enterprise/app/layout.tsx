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
 * LIGHT BY DEFAULT, AND THAT IS THE DECISION HERE. Every other template
 * follows the operating system; this one starts light unless the visitor
 * has explicitly chosen otherwise. Enterprise traffic arrives on managed
 * corporate machines and is routinely screenshotted into decks and printed
 * into board packs, and a dark screenshot in a slide deck is a black
 * rectangle. The toggle still works and a stored preference still wins —
 * only the fallback changed.
 *
 * If your audience is not being pasted into PowerPoint, take the
 * `matchMedia` line from any other template and this becomes system-aware
 * again.
 *
 * Set `metadataBase` to your real domain before deploying. Next resolves
 * every relative OG image against it; left as localhost, shared links get
 * a broken preview — and on this page the link is being shared internally,
 * to the person who signs.
 */

export const metadata: Metadata = {
  metadataBase: new URL('https://example.com'),
  title: {
    default: 'Ledgerline — close the month in four days, and prove how',
    template: '%s — Ledgerline',
  },
  description:
    'Reconciliation for regulated finance teams. Ledgerline matches every ledger, flags what does not, and keeps an audit trail your regulator accepts without a follow-up request.',
  keywords: [
    'reconciliation software',
    'financial close software',
    'SOX compliance',
    'audit trail',
    'month-end close',
  ],
  openGraph: {
    type: 'website',
    siteName: 'Ledgerline',
    title: 'Ledgerline — close the month in four days',
    description:
      '31% lower cost per close, 4.2-day median month-end, 412 finance teams. Prices published.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ledgerline — close the month in four days',
    description: '31% lower cost per close. 412 regulated finance teams.',
  },
}

export const viewport = {
  colorScheme: 'light dark',
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
                // Light unless they have said otherwise — see the note above.
                var stored = localStorage.getItem('theme')
                if (stored === 'dark') document.documentElement.classList.add('dark')
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
