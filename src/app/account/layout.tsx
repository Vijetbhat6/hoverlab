import type { Metadata } from 'next'

/**
 * Metadata for /account, which cannot carry its own.
 *
 * The page is a client component, so this layout is the only place it can
 * say anything about itself — and until it did, it said something wrong.
 * Metadata is inherited, the root layout carries the home page's canonical
 * because "/" is a client component too, so a signed-in user's account
 * screen was telling crawlers it was the home page.
 *
 * `noindex` rather than a canonical of its own, for the same reason
 * /collections is noindex: it is gated in proxy.ts, there is nothing here
 * for a crawler and nothing here for a signed-out visitor. A canonical
 * alongside a noindex would be two contradictory statements about one
 * document; `robots` alone is the honest one.
 */
export const metadata: Metadata = {
  title: 'Account — Hoverlab',
  description: 'Your Hoverlab plan, licence and API key.',
  robots: { index: false, follow: false },
}

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
