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
 * WHY THE JSON-LD IS HERE AND NOT ON THE PAGE. A studio's site is found by
 * name — somebody was given a recommendation and typed it — so the one
 * piece of structured data worth shipping is the organisation itself:
 * name, address, contact. Putting it in the layout means the journal and
 * the careers page carry it too, which is where a search engine actually
 * resolves "who are these people" from.
 *
 * It is a `<script type="application/ld+json">`, so it renders as data
 * rather than executing. `dangerouslySetInnerHTML` is the documented way to
 * emit it in Next; the content is a literal in this file, not user input.
 *
 * Replace every field in it before deploying, along with `metadataBase` —
 * structured data that describes a fictional studio is worse than none.
 */

export const metadata: Metadata = {
  metadataBase: new URL('https://example.com'),
  title: {
    default: 'Fieldwork — a design studio for the unglamorous surfaces',
    template: '%s — Fieldwork',
  },
  description:
    'Onboarding, settings, empty states, the error a customer hits at 2am. We design the parts nobody screenshots. London and Lisbon.',
  keywords: [
    'design studio',
    'product design agency',
    'ux consultancy',
    'onboarding design',
    'London design studio',
  ],
  openGraph: {
    type: 'website',
    siteName: 'Fieldwork',
    locale: 'en_GB',
    title: 'Fieldwork — a design studio for the unglamorous surfaces',
    description:
      'Fourteen years, sixty-odd products. Teardowns, product design engagements and embedded designers.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fieldwork — a design studio',
    description: 'We design the parts nobody screenshots.',
  },
}

const ORGANISATION_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  name: 'Fieldwork',
  description: 'A design studio working on onboarding, settings and the surfaces products are kept or abandoned on.',
  url: 'https://example.com',
  email: 'studio@fieldwork.example',
  areaServed: ['GB', 'PT', 'EU'],
  address: [
    {
      '@type': 'PostalAddress',
      streetAddress: '1 Example Street',
      addressLocality: 'London',
      postalCode: 'E1 1AA',
      addressCountry: 'GB',
    },
    {
      '@type': 'PostalAddress',
      streetAddress: 'Rua Exemplo 1',
      addressLocality: 'Lisbon',
      postalCode: '1100-001',
      addressCountry: 'PT',
    },
  ],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(ORGANISATION_JSON_LD),
          }}
        />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
