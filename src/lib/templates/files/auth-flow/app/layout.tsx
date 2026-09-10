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
 * WHY AUTH SCREENS ARE `noindex`. Not for secrecy — a sign-in page is not a
 * secret. Because they outrank the pages that matter. A sign-in screen is
 * linked from every page of a product, so it accumulates more internal
 * links than anything else on the domain and turns up above your homepage
 * for your own brand name. The reset and two-factor screens are worse: they
 * rank for "reset password <product>" and take the traffic that should
 * reach the help centre, then answer it with a form and no explanation.
 *
 * NONE OF THIS IS AUTHENTICATION. Every screen here is a form. There is no
 * session, no token, no rate limit and no lockout, and the second-factor
 * screen will accept any six digits. Wire it to a real provider before it
 * is in front of anybody — this template exists to save you the fortnight
 * of layout work, not the afternoon of security work.
 */

export const metadata: Metadata = {
  title: {
    default: 'Sign in — Acme',
    template: '%s — Acme',
  },
  description: 'Sign in to Acme.',
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
