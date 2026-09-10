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
 * `robots: { index: false }` for the same reason the admin template sets
 * it, and one more that is specific to this product: run traces contain
 * prompts, and prompts contain whatever a customer pasted into them. A run
 * detail page in a search index is a disclosure of somebody else's data,
 * not of yours.
 *
 * TITLES ARE WRITTEN FOR A TAB STRIP. An operator working a queue has eight
 * of these open at once, so the distinguishing word goes first — "Run
 * 4f2a — Console", never "Console — Run 4f2a". Set it per page with the
 * `%s` slot below.
 */

export const metadata: Metadata = {
  title: {
    default: 'Approvals — Console',
    template: '%s — Console',
  },
  description: 'Agent operations: approvals, run traces and cost.',
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
