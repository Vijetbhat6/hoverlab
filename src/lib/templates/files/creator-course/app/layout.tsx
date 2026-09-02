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
 * WHY `summary_large_image` MATTERS MORE HERE THAN ANYWHERE ELSE. A course
 * from an individual is sold almost entirely by being shared — a post, a
 * newsletter, a message in a group chat. The card *is* the top of the
 * funnel, and a broken preview does not degrade this page's acquisition, it
 * removes it. The `creator` field puts the author's handle on the card,
 * which is doing real work when the author is the product.
 *
 * The `Course` JSON-LD below is what puts the price, the provider and the
 * dates into a search result. Keep `offers.availabilityEnds` in step with
 * the early-bird date on the page — structured data that says a discount is
 * live after it has ended is the kind of mismatch that gets a rich result
 * withdrawn, and it is a promise to a customer either way.
 *
 * Set `metadataBase` to your real domain before deploying. Next resolves
 * every relative OG image against it; left as localhost, the shared link
 * that is your whole distribution gets a broken preview.
 */

export const metadata: Metadata = {
  metadataBase: new URL('https://example.com'),
  title: {
    default: 'Deep Practice — learn to read a codebase you did not write',
    template: '%s — Deep Practice',
  },
  description:
    'A nine-week cohort course on getting oriented in fifty thousand lines of someone else’s decisions. Four real codebases, live Thursday sessions, one payment, refundable to week three.',
  openGraph: {
    type: 'website',
    siteName: 'Deep Practice',
    locale: 'en_GB',
    title: 'Deep Practice — learn to read a codebase you did not write',
    description:
      'Nine weeks, four real codebases, live sessions. £480 until 20 February. Refundable to the end of week three.',
  },
  twitter: {
    card: 'summary_large_image',
    // The author is the product — put the handle on the card.
    creator: '@marcusokafor',
    title: 'Deep Practice — read a codebase you did not write',
    description: 'Nine weeks. Four real codebases. Next cohort 9 March.',
  },
}

const COURSE_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Course',
  name: 'Deep Practice — reading unfamiliar codebases',
  description:
    'A nine-week cohort course on orienting quickly in a large codebase you did not write: finding the load-bearing core, reconstructing undocumented decisions, and making a first safe change.',
  url: 'https://example.com',
  provider: {
    '@type': 'Person',
    name: 'Marcus Okafor',
    url: 'https://example.com/#instructor',
  },
  hasCourseInstance: {
    '@type': 'CourseInstance',
    courseMode: 'online',
    courseWorkload: 'PT6H',
    startDate: '2027-03-09',
    endDate: '2027-05-11',
    instructor: { '@type': 'Person', name: 'Marcus Okafor' },
  },
  offers: {
    '@type': 'Offer',
    price: '480',
    priceCurrency: 'GBP',
    category: 'Paid',
    availability: 'https://schema.org/LimitedAvailability',
    // Keep this in step with the early-bird date on the page.
    availabilityEnds: '2027-02-20',
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
            __html: JSON.stringify(COURSE_JSON_LD),
          }}
        />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
