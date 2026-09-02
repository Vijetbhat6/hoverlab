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
 * WHY THIS ONE CARRIES STRUCTURED DATA AND THE OTHERS DO NOT. A local
 * business is found through a map result, not a web page. `LocalBusiness`
 * JSON-LD with the address, the opening hours and the phone number is what
 * populates that result, and it is worth more than every other line of SEO
 * on the site put together. It sits in the layout so the news pages carry
 * it too.
 *
 * REPLACE EVERY FIELD IN IT. Wrong opening hours in structured data are
 * worse than none — people turn up to a closed door and leave the review
 * about it. `geo` and `openingHoursSpecification` in particular have to be
 * real, and they have to match what is on the contact section of the page.
 *
 * Set `metadataBase` to your real domain before deploying. Next resolves
 * every relative OG image against it; left as localhost, shared links get
 * a broken preview.
 */

export const metadata: Metadata = {
  metadataBase: new URL('https://example.com'),
  title: {
    default: 'Kirkwood Dental — a dentist in Stockbridge you can get into this week',
    template: '%s — Kirkwood Dental',
  },
  description:
    'NHS and private dentistry in Stockbridge, Edinburgh. Taking new NHS patients, same-day emergency appointments, and every price published on the site.',
  keywords: [
    'dentist Edinburgh',
    'NHS dentist Stockbridge',
    'emergency dentist Edinburgh',
    'nervous patients dentist',
  ],
  openGraph: {
    type: 'website',
    siteName: 'Kirkwood Dental',
    locale: 'en_GB',
    title: 'Kirkwood Dental — Stockbridge, Edinburgh',
    description:
      'Taking new NHS patients. Same-day emergency appointments. Every price on the site.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kirkwood Dental — Stockbridge, Edinburgh',
    description: 'Taking new NHS patients. Every price on the site.',
  },
}

const LOCAL_BUSINESS_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Dentist',
  name: 'Kirkwood Dental',
  description:
    'NHS and private dental practice in Stockbridge, Edinburgh. Taking new NHS patients.',
  url: 'https://example.com',
  telephone: '+44-131-496-0000',
  email: 'hello@kirkwood.example',
  priceRange: '££',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '14 Raeburn Place',
    addressLocality: 'Edinburgh',
    postalCode: 'EH4 1HN',
    addressCountry: 'GB',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 55.9576,
    longitude: -3.2107,
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '08:00',
      closes: '18:00',
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: 'Saturday',
      opens: '09:00',
      closes: '13:00',
    },
  ],
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    reviewCount: '612',
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(LOCAL_BUSINESS_JSON_LD),
          }}
        />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
