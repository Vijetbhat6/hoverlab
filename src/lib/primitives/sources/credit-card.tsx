'use client'

/**
 * <CreditCardInput> — the four fields, and the rules they actually need.
 *
 * Payment fields are the most-abandoned form on the internet and almost all
 * of the abandonment is friction this component removes:
 *
 *   grouping     digits are grouped as the card is typed — 4-4-4-4, but
 *                4-6-5 for Amex and 4-6-4 for Diners, because those cards
 *                are printed that way and a user checking their typing
 *                against the plastic needs the same shape
 *   detection    the brand is detected from the first digits, which sets
 *                the length, the CVC length (4 on Amex) and the mark shown
 *   luhn         the checksum catches a transposed digit before the network
 *                does, and a declined card is a lost sale
 *   expiry       `MM/YY` with the slash inserted, and a month above 12
 *                rejected as it is typed rather than on submit
 *   autofill     `autoComplete="cc-number"` and friends are what make the
 *                browser and the phone offer a saved card. Getting these
 *                tokens wrong is the single biggest cause of a payment form
 *                that "doesn't autofill"
 *
 * It never stores or transmits anything. In a real integration the fields
 * are the processor's iframes; this is the layout, the formatting and the
 * validation you still have to build around them.
 */

import * as React from 'react'

export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'discover' | 'diners' | 'unknown'

interface BrandSpec {
  /** How the number is grouped as it is typed. */
  groups: number[]
  cvcLength: number
  test: RegExp
  label: string
}

const BRANDS: Record<Exclude<CardBrand, 'unknown'>, BrandSpec> = {
  visa: { groups: [4, 4, 4, 4], cvcLength: 3, test: /^4/, label: 'Visa' },
  mastercard: { groups: [4, 4, 4, 4], cvcLength: 3, test: /^(5[1-5]|2[2-7])/, label: 'Mastercard' },
  amex: { groups: [4, 6, 5], cvcLength: 4, test: /^3[47]/, label: 'American Express' },
  discover: { groups: [4, 4, 4, 4], cvcLength: 3, test: /^6(?:011|5)/, label: 'Discover' },
  diners: { groups: [4, 6, 4], cvcLength: 3, test: /^3(?:0[0-5]|[68])/, label: 'Diners Club' },
}

const UNKNOWN: BrandSpec = { groups: [4, 4, 4, 4], cvcLength: 3, test: /.^/, label: 'Card' }

export function detectBrand(digits: string): CardBrand {
  for (const [brand, spec] of Object.entries(BRANDS)) {
    if (spec.test.test(digits)) return brand as CardBrand
  }
  return 'unknown'
}

function specFor(brand: CardBrand): BrandSpec {
  return brand === 'unknown' ? UNKNOWN : BRANDS[brand]
}

/** Group digits by the brand's own printed layout. */
export function formatCardNumber(digits: string, brand: CardBrand): string {
  const { groups } = specFor(brand)
  const out: string[] = []
  let i = 0
  for (const size of groups) {
    if (i >= digits.length) break
    out.push(digits.slice(i, i + size))
    i += size
  }
  // Anything past the brand's expected length still shows, rather than
  // being silently swallowed — a user who typed 17 digits needs to see 17.
  if (i < digits.length) out.push(digits.slice(i))
  return out.join(' ')
}

/**
 * The Luhn checksum.
 *
 * Catches a single transposed or mistyped digit, which is the overwhelming
 * majority of real typos. It says nothing about whether the card exists or
 * has funds — only the processor knows that — so it is used to show an
 * inline error, never to claim the card is good.
 */
export function luhnValid(digits: string): boolean {
  if (digits.length < 12) return false
  let sum = 0
  let double = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48
    if (double) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
    double = !double
  }
  return sum % 10 === 0
}

export interface CreditCardValue {
  number: string
  expiry: string
  cvc: string
  name: string
}

export interface CreditCardInputProps {
  value: CreditCardValue
  onChange: (value: CreditCardValue) => void
  /** Show the drawn card above the fields. */
  showPreview?: boolean
  className?: string
}

export function CreditCardInput({
  value,
  onChange,
  showPreview = true,
  className = '',
}: CreditCardInputProps) {
  const digits = value.number.replace(/\D/g, '')
  const brand = detectBrand(digits)
  const spec = specFor(brand)
  const maxDigits = spec.groups.reduce((a, b) => a + b, 0)

  const [touched, setTouched] = React.useState<Record<string, boolean>>({})
  const numberError =
    touched.number && digits.length >= 12 && !luhnValid(digits)
      ? 'Check the card number — one of the digits is wrong.'
      : null

  const set = (patch: Partial<CreditCardValue>) => onChange({ ...value, ...patch })

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {showPreview ? <CardFace digits={digits} brand={brand} value={value} /> : null}

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-foreground">Card number</span>
        <div
          className={[
            'flex h-10 items-center rounded-lg border bg-background px-3',
            'focus-within:ring-2 focus-within:ring-ring',
            numberError ? 'border-destructive' : 'border-border',
          ].join(' ')}
        >
          <input
            inputMode="numeric"
            // These tokens are what make the browser and the phone offer a
            // saved card. Misspelling one is the usual cause of a payment
            // form that "doesn't autofill".
            autoComplete="cc-number"
            placeholder="4242 4242 4242 4242"
            value={formatCardNumber(digits, brand)}
            aria-invalid={numberError ? true : undefined}
            aria-describedby={numberError ? 'cc-number-error' : undefined}
            onBlur={() => setTouched((t) => ({ ...t, number: true }))}
            onChange={(e) =>
              set({ number: e.target.value.replace(/\D/g, '').slice(0, maxDigits) })
            }
            className="w-full bg-transparent font-mono text-sm tabular-nums text-foreground outline-none placeholder:text-muted-foreground"
          />
          <BrandMark brand={brand} />
        </div>
        {numberError ? (
          <span id="cc-number-error" role="alert" className="text-xs font-medium text-destructive">
            {numberError}
          </span>
        ) : null}
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Expiry</span>
          <input
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="MM/YY"
            value={value.expiry}
            onChange={(e) => set({ expiry: formatExpiry(e.target.value) })}
            className="h-10 rounded-lg border border-border bg-background px-3 font-mono text-sm tabular-nums text-foreground outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">
            CVC
            {/* Amex prints four digits on the front rather than three on
                the back, so the hint is per-brand and not decoration. */}
            <span className="ms-1 font-normal text-muted-foreground">
              ({spec.cvcLength} digits)
            </span>
          </span>
          <input
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder={'•'.repeat(spec.cvcLength)}
            value={value.cvc}
            onChange={(e) => set({ cvc: e.target.value.replace(/\D/g, '').slice(0, spec.cvcLength) })}
            className="h-10 rounded-lg border border-border bg-background px-3 font-mono text-sm tabular-nums text-foreground outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-foreground">Name on card</span>
        <input
          autoComplete="cc-name"
          placeholder="A. Lovelace"
          value={value.name}
          onChange={(e) => set({ name: e.target.value })}
          className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
        />
      </label>
    </div>
  )
}

/** `1225` → `12/25`, rejecting a month above 12 as it is typed. */
export function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4)
  if (digits.length === 0) return ''
  // A leading digit above 1 can only be a single-digit month, so "9"
  // becomes "09/" — which is what the user meant and saves a keystroke.
  if (digits.length === 1) return Number(digits) > 1 ? `0${digits}/` : digits
  const month = Math.min(12, Math.max(1, Number(digits.slice(0, 2))))
  const mm = String(month).padStart(2, '0')
  return digits.length <= 2 ? `${mm}/` : `${mm}/${digits.slice(2)}`
}

/** The drawn card. Decorative — every value on it is also in a labelled field. */
function CardFace({
  digits,
  brand,
  value,
}: {
  digits: string
  brand: CardBrand
  value: CreditCardValue
}) {
  const groups = formatCardNumber(digits.padEnd(16, '•'), brand)
  return (
    <div
      aria-hidden
      className="relative flex aspect-[1.586/1] w-full max-w-xs flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-black p-5 text-white shadow-lg"
    >
      <div className="flex items-start justify-between">
        <span className="h-7 w-10 rounded bg-gradient-to-br from-amber-200 to-amber-400" />
        <span className="text-xs font-semibold uppercase tracking-wide opacity-80">
          {specFor(brand).label}
        </span>
      </div>
      <p className="font-mono text-base tabular-nums tracking-[0.12em]">{groups}</p>
      <div className="flex items-end justify-between text-[10px] uppercase tracking-wide opacity-80">
        <span className="truncate">{value.name || 'Your name'}</span>
        <span className="font-mono tabular-nums">{value.expiry || 'MM/YY'}</span>
      </div>
    </div>
  )
}

/**
 * The brand mark, as a wordmark rather than a logo.
 *
 * Card network logos are trademarks with usage rules, and shipping copies
 * of them in a component catalog is not something the buyer would be
 * licensed to do. A typeset name is accurate, legal, and themes correctly.
 */
function BrandMark({ brand }: { brand: CardBrand }) {
  if (brand === 'unknown') return null
  return (
    <span className="ms-2 shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
      {brand === 'amex' ? 'Amex' : specFor(brand).label}
    </span>
  )
}
