import type { Metadata } from 'next'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

/**
 * Root layout.
 *
 * `suppressHydrationWarning` on <html> is required, not cosmetic: the theme
 * script below writes a class onto that element before React hydrates, so
 * the server markup and the first client render disagree by design. Without
 * the attribute, React logs a hydration mismatch on every single page load.
 */

export const metadata: Metadata = {
  title: {
    default: 'Acme — Ship the interface you sketched',
    template: '%s — Acme',
  },
  description:
    'Every section of a real product, ready to paste. No component library to adopt, no runtime to ship.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/*
          Applies the stored theme before first paint.

          This has to be a blocking inline script in <head>. Anything that
          runs after hydration — an effect, a provider's mount — happens at
          least one frame too late, and the user sees a white flash before
          the dark theme lands. That flash is the single most-reported bug
          in every hand-rolled dark mode.
        */}
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
