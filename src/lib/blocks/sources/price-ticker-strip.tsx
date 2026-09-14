/**
 * <PriceTickerStrip> — the moving price rail every exchange puts under its nav.
 *
 * It is the one piece of furniture that says "this is a market" before a
 * word of copy is read, and it is the thing a fintech landing page built
 * from generic marketing blocks always lacks.
 *
 * THREE THINGS IT DOES THAT A NAIVE TICKER GETS WRONG.
 *
 * 1. *Direction is never colour alone.* Red and green are the convention
 *    and they are also 1.4.1 — roughly one man in twelve cannot separate
 *    them, and a strip where the only difference between "up 4%" and "down
 *    4%" is hue is unreadable to him. Every row carries an arrow glyph and
 *    a signed number, so the colour is the third cue rather than the only
 *    one.
 *
 * 2. *The duplicate half is `aria-hidden`.* A seamless marquee needs the
 *    list twice; announcing it twice would read every price twice. Same
 *    call as <LogoCloud>, and the reason it is worth restating is that the
 *    obvious fix — a CSS-only duplicate via `content` — cannot be styled
 *    per row.
 *
 * 3. *It stops.* `motion-safe:` gates the animation, so a reader with
 *    `prefers-reduced-motion` gets the same prices as a static wrapped row
 *    rather than nothing; hovering pauses it, because a price you are
 *    trying to read should not slide out from under the pointer. Vestibular
 *    triggers aside, an unpausable ticker is simply hostile.
 *
 * PRICES ARE PRE-FORMATTED STRINGS. Not a `number` plus `Intl.NumberFormat`
 * at render: the server's locale is not the browser's, and a ticker that
 * renders "63,204.10" on the server and "63 204,10" in the client is a
 * hydration mismatch that throws the whole subtree away. Format upstream,
 * where you know the user's locale, and pass strings.
 *
 * There is no live data here and the block does not pretend otherwise —
 * `asOf` names when these numbers were true. Wire it to a socket and
 * replace the array; nothing about the layout changes.
 */

import * as React from 'react'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

export interface TickerQuote {
  /** Ticker symbol — "BTC", "EUR/USD", "AAPL". */
  symbol: string
  /** The full name, shown under the symbol on the expanded variant. */
  name?: string
  /** Pre-formatted, currency symbol included. See the header. */
  price: string
  /** Signed and suffixed by you — "+4.12%", "−0.30%". */
  change: string
  direction: 'up' | 'down' | 'flat'
}

export interface PriceTickerStripProps {
  quotes?: TickerQuote[]
  /** Seconds for one full pass. Longer is calmer; 60 is about right for 8. */
  duration?: number
  /** When these numbers were true. A market strip with no timestamp lies. */
  asOf?: string
  /** Hairlines above and below, for sitting the strip under a navbar. */
  divided?: boolean
  className?: string
}

const DEFAULT_QUOTES: TickerQuote[] = [
  { symbol: 'BTC', name: 'Bitcoin', price: '$63,204.10', change: '+2.41%', direction: 'up' },
  { symbol: 'ETH', name: 'Ethereum', price: '$3,118.62', change: '+1.08%', direction: 'up' },
  { symbol: 'SOL', name: 'Solana', price: '$147.93', change: '−3.22%', direction: 'down' },
  { symbol: 'USDC', name: 'USD Coin', price: '$1.0001', change: '0.00%', direction: 'flat' },
  { symbol: 'XRP', name: 'XRP', price: '$0.5284', change: '−0.94%', direction: 'down' },
  { symbol: 'ADA', name: 'Cardano', price: '$0.4471', change: '+5.67%', direction: 'up' },
  { symbol: 'AVAX', name: 'Avalanche', price: '$27.84', change: '+0.72%', direction: 'up' },
  { symbol: 'DOT', name: 'Polkadot', price: '$6.19', change: '−1.55%', direction: 'down' },
]

/*
  Utility classes rather than a style object, because these tokens are
  complete oklch() colours — `hsl(var(--primary))` would be dropped by the
  parser and fall back to inherited, which typechecks and renders invisible.
  `flat` deliberately gets the muted colour: nothing moved, so nothing
  should catch the eye.
*/
const DIRECTION_CLASS: Record<TickerQuote['direction'], string> = {
  up: 'text-emerald-600 dark:text-emerald-400',
  down: 'text-rose-600 dark:text-rose-400',
  flat: 'text-muted-foreground',
}

function DirectionGlyph({ direction }: { direction: TickerQuote['direction'] }) {
  if (direction === 'up') return <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
  if (direction === 'down') return <ArrowDownRight aria-hidden className="h-3.5 w-3.5" />
  /* An en dash, not an arrow: "flat" has no direction to point in. */
  return (
    <span aria-hidden className="text-xs leading-none">
      –
    </span>
  )
}

function Quote({ quote, hidden }: { quote: TickerQuote; hidden: boolean }) {
  return (
    <div
      aria-hidden={hidden || undefined}
      /* The duplicate half exists only to make the loop seamless. Under
         `prefers-reduced-motion` the rail stops scrolling and wraps, and a
         wrapped rail that lists every price twice is a bug rather than a
         seam — so the copy is dropped entirely there. <LogoCloud> tolerates
         the repeat because a repeated wordmark reads as a pattern; a
         repeated price reads as two different quotes. */
      className={`flex shrink-0 items-center gap-2.5 whitespace-nowrap ${
        hidden ? 'motion-reduce:hidden' : ''
      }`}
    >
      <span className="text-sm font-bold tracking-tight text-foreground">{quote.symbol}</span>
      <span className="text-sm tabular-nums text-muted-foreground">{quote.price}</span>
      <span
        className={`inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums ${
          DIRECTION_CLASS[quote.direction]
        }`}
      >
        <DirectionGlyph direction={quote.direction} />
        {quote.change}
        {/* The word the colour and the arrow are both standing in for. It
            is never rendered, which is the point — it exists so the row
            reads correctly out loud without adding a fourth visible cue. */}
        <span className="sr-only">
          {quote.direction === 'up' ? ' up' : quote.direction === 'down' ? ' down' : ' unchanged'}
        </span>
      </span>
    </div>
  )
}

export function PriceTickerStrip({
  quotes = DEFAULT_QUOTES,
  duration = 60,
  asOf = 'Indicative prices, delayed 15 minutes',
  divided = true,
  className = '',
}: PriceTickerStripProps) {
  return (
    <section
      aria-label="Market prices"
      className={`w-full bg-card/60 ${divided ? 'border-y border-border/60' : ''} ${className}`}
    >
      <div
        className="group relative overflow-hidden py-2.5"
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 6%, black 94%, transparent)',
          WebkitMaskImage:
            'linear-gradient(to right, transparent, black 6%, black 94%, transparent)',
        }}
      >
        <div
          className="flex w-max items-center gap-8 motion-safe:animate-[price-ticker_var(--ticker-duration)_linear_infinite] motion-reduce:w-full motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-x-8 motion-reduce:gap-y-2 group-hover:[animation-play-state:paused]"
          style={{ ['--ticker-duration' as string]: `${duration}s` }}
        >
          {[...quotes, ...quotes].map((quote, i) => (
            <Quote key={`${quote.symbol}-${i}`} quote={quote} hidden={i >= quotes.length} />
          ))}
        </div>
      </div>

      {asOf ? (
        <p className="px-4 pb-2 text-center text-[11px] text-muted-foreground/70 sm:px-6">
          {asOf}
        </p>
      ) : null}

      <style>{`
        @keyframes price-ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  )
}
