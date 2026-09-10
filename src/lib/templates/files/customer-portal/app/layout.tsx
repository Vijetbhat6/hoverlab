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
 * `robots: { index: false }`, and here it is closer to a real requirement
 * than a preference: an invoice URL is a document with a company name, an
 * address and an amount on it. Indexed once, it is cached by parties you
 * cannot ask to forget it.
 *
 * TITLES CARRY THE MONEY WORD FIRST — "Invoices", "Usage", "Plan". This is
 * the surface people reach with a specific administrative task and a
 * browser full of tabs, and the first two words are the whole navigation
 * they get.
 *
 * CURRENCY IS PINNED, NOT INHERITED. The billing blocks format amounts with
 * an explicit `toLocaleString('en-US', { currency: 'USD' })` rather than the
 * visitor's locale, and that is deliberate twice over: a figure that renders
 * differently depending on who is looking is a support ticket, and a
 * locale-dependent number formatted during a server render is a hydration
 * mismatch. Selling in another currency means changing it in
 * `components/billing-invoice-detail.tsx` and `components/usage-meter-panel.tsx`
 * — pass a locale, never drop the argument.
 */

export const metadata: Metadata = {
  title: {
    default: 'Account — Acme',
    template: '%s — Acme',
  },
  description: 'Your plan, usage, invoices and payment details.',
  robots: { index: false, follow: false },
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
