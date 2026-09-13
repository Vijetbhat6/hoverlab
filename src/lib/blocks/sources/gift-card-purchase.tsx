'use client'

/**
 * <GiftCardPurchase> — buying a card for someone else.
 *
 * The only checkout flow where the buyer is not the recipient, which breaks
 * three assumptions the rest of the cart is built on: the delivery address is
 * an email address, the delivery date is chosen rather than estimated, and the
 * confirmation has to go to two different people saying two different things.
 *
 * WHAT THAT MEANS IN THE FORM
 *
 *  - **A live preview.** The buyer is designing something a person they care
 *    about will see. A preview that updates as they type is not decoration; it
 *    is the only way to check the message reads right and the name is spelled
 *    correctly, and it converts better than any amount of reassurance copy.
 *  - **A send date, with a timezone stated.** "Deliver on 25 December" means
 *    nothing without saying whose midnight. Most gift-card flows omit it and
 *    then send Christmas presents on Christmas Eve.
 *  - **A typo guard on the recipient address.** The single most expensive
 *    error in this flow: money leaves, the card goes to nobody, and recovery
 *    is a support case. Confirming the address is worth one extra field.
 *
 * AMOUNTS ARE PRESETS PLUS A FREE FIELD, NOT A DROPDOWN. Four common values as
 * buttons and a custom input under them, with the min and max stated before
 * the error rather than after it.
 *
 * NOTHING HERE IS A PHYSICAL PRODUCT, so there is no shipping step, no address
 * form and no delivery estimate. Reusing the standard checkout and disabling
 * three sections is the common shortcut and it makes the flow look broken.
 *
 * ACCESSIBILITY: the preview is `aria-hidden` and duplicated as a visually
 * hidden summary, because a live-updating card is noise to a screen reader
 * while a summary read on demand is useful; the amount presets are a radio
 * group; the confirm-email mismatch is announced through the field's own
 * `aria-describedby`, not through a form-level banner.
 */

import * as React from 'react'
import { Gift, Mail, Sparkles } from 'lucide-react'

export interface GiftDesign {
  id: string
  label: string
  /** Tailwind classes for the preview face. Tokens only, no hard-coded hex. */
  face: string
}

export interface GiftCardPurchaseProps {
  amounts?: number[]
  min?: number
  max?: number
  designs?: GiftDesign[]
  currency?: string
  className?: string
}

const DEFAULT_DESIGNS: GiftDesign[] = [
  { id: 'plain', label: 'Plain', face: 'bg-card text-card-foreground border border-border' },
  { id: 'brand', label: 'Brand', face: 'bg-primary text-primary-foreground' },
  { id: 'dark', label: 'Midnight', face: 'bg-foreground text-background' },
  { id: 'warm', label: 'Warm', face: 'bg-amber-500/15 text-foreground border border-amber-500/40' },
]

const INPUT_CLASS =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring'

export function GiftCardPurchase({
  amounts = [25, 50, 100, 250],
  min = 10,
  max = 500,
  designs = DEFAULT_DESIGNS,
  currency = '£',
  className = '',
}: GiftCardPurchaseProps) {
  const uid = React.useId()
  const [amount, setAmount] = React.useState(50)
  const [custom, setCustom] = React.useState('')
  const [designId, setDesignId] = React.useState(designs[1]?.id ?? '')
  const [to, setTo] = React.useState('imani@example.com')
  const [confirmTo, setConfirmTo] = React.useState('imani@example.com')
  const [name, setName] = React.useState('Imani')
  const [from, setFrom] = React.useState('Marte')
  const [message, setMessage] = React.useState(
    'For the desk you keep talking about. Happy birthday.',
  )
  const [sendOn, setSendOn] = React.useState('2026-09-24')

  const design = designs.find((d) => d.id === designId) ?? designs[0]
  const customValue = Number.parseInt(custom, 10)
  const usingCustom = custom.trim().length > 0
  const value = usingCustom && !Number.isNaN(customValue) ? customValue : amount
  const customInvalid = usingCustom && (Number.isNaN(customValue) || customValue < min || customValue > max)
  const mismatch = confirmTo.length > 0 && confirmTo !== to

  return (
    <section className={`bg-background px-4 py-10 sm:px-6 ${className}`}>
      <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <form onSubmit={(e) => e.preventDefault()}>
          <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <Gift aria-hidden className="h-5 w-5 text-primary" />
            Send a gift card
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Delivered by email on a date you choose. Nothing is posted, so there
            is no shipping to pay and nothing to arrive late.
          </p>

          <fieldset className="mt-6 border-0 p-0">
            <legend className="text-sm font-semibold">Amount</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {amounts.map((preset) => {
                const id = `${uid}-a-${preset}`
                const on = !usingCustom && amount === preset
                return (
                  <div key={preset}>
                    <input
                      type="radio"
                      id={id}
                      name={`${uid}-amount`}
                      checked={on}
                      onChange={() => {
                        setAmount(preset)
                        setCustom('')
                      }}
                      className="peer sr-only"
                    />
                    <label
                      htmlFor={id}
                      className={`block cursor-pointer rounded-lg border px-4 py-2 text-sm font-semibold transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring ${
                        on ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted'
                      }`}
                    >
                      {currency}
                      {preset}
                    </label>
                  </div>
                )
              })}
            </div>
            <div className="mt-2">
              <label htmlFor={`${uid}-custom`} className="block text-xs font-medium">
                Or another amount
              </label>
              <input
                id={`${uid}-custom`}
                inputMode="numeric"
                value={custom}
                onChange={(e) => setCustom(e.target.value.replace(/\D/g, ''))}
                aria-invalid={customInvalid || undefined}
                aria-describedby={`${uid}-custom-range`}
                placeholder={`${min}–${max}`}
                className={`mt-1 w-32 ${INPUT_CLASS} ${customInvalid ? 'border-destructive' : ''}`}
              />
              {/* Stated before the error, not after it. */}
              <p id={`${uid}-custom-range`} className="mt-1 text-xs text-muted-foreground">
                Between {currency}
                {min} and {currency}
                {max}.
              </p>
            </div>
          </fieldset>

          <fieldset className="mt-6 border-0 p-0">
            <legend className="text-sm font-semibold">Design</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {designs.map((option) => {
                const id = `${uid}-d-${option.id}`
                const on = designId === option.id
                return (
                  <div key={option.id}>
                    <input
                      type="radio"
                      id={id}
                      name={`${uid}-design`}
                      checked={on}
                      onChange={() => setDesignId(option.id)}
                      className="peer sr-only"
                    />
                    <label
                      htmlFor={id}
                      className={`block cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring ${
                        on ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted'
                      }`}
                    >
                      {option.label}
                    </label>
                  </div>
                )
              })}
            </div>
          </fieldset>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={`${uid}-to`} className="block text-sm font-medium">
                Their email
              </label>
              <input
                id={`${uid}-to`}
                type="email"
                required
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className={`mt-1.5 ${INPUT_CLASS}`}
              />
            </div>
            <div>
              <label htmlFor={`${uid}-to2`} className="block text-sm font-medium">
                Their email again
              </label>
              <input
                id={`${uid}-to2`}
                type="email"
                required
                value={confirmTo}
                onChange={(e) => setConfirmTo(e.target.value)}
                aria-invalid={mismatch || undefined}
                aria-describedby={`${uid}-to2-note`}
                className={`mt-1.5 ${INPUT_CLASS} ${mismatch ? 'border-destructive' : ''}`}
              />
              {/* On the field, not in a form-level banner. */}
              <p
                id={`${uid}-to2-note`}
                className={`mt-1 text-xs ${mismatch ? 'text-destructive' : 'text-muted-foreground'}`}
              >
                {mismatch
                  ? 'These do not match. A card sent to the wrong address cannot be recalled.'
                  : 'Asked twice because a mistyped address means the money is gone.'}
              </p>
            </div>
            <div>
              <label htmlFor={`${uid}-name`} className="block text-sm font-medium">
                Their name
              </label>
              <input
                id={`${uid}-name`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`mt-1.5 ${INPUT_CLASS}`}
              />
            </div>
            <div>
              <label htmlFor={`${uid}-from`} className="block text-sm font-medium">
                From
              </label>
              <input
                id={`${uid}-from`}
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className={`mt-1.5 ${INPUT_CLASS}`}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor={`${uid}-message`} className="block text-sm font-medium">
                Message
                <span className="ms-2 text-xs font-normal text-muted-foreground">
                  {message.length}/200
                </span>
              </label>
              <textarea
                id={`${uid}-message`}
                rows={3}
                maxLength={200}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className={`mt-1.5 ${INPUT_CLASS}`}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor={`${uid}-when`} className="block text-sm font-medium">
                Send on
              </label>
              <input
                id={`${uid}-when`}
                type="date"
                min="2026-09-14"
                value={sendOn}
                onChange={(e) => setSendOn(e.target.value)}
                aria-describedby={`${uid}-when-note`}
                className={`mt-1.5 w-48 ${INPUT_CLASS}`}
              />
              {/* Whose midnight — the omission that sends presents a day early. */}
              <p id={`${uid}-when-note`} className="mt-1 text-xs text-muted-foreground">
                Sent at 09:00 in the recipient&rsquo;s timezone, not yours.
              </p>
            </div>
          </div>
        </form>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <h3 className="text-sm font-semibold">Preview</h3>

          {/* Decorative: the same content is in the summary below. */}
          <div
            aria-hidden
            className={`mt-2 rounded-2xl p-5 ${design?.face ?? ''}`}
          >
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide opacity-80">
              <Sparkles className="h-3.5 w-3.5" />
              Gift card
            </p>
            <p className="mt-3 text-3xl font-bold tracking-tight">
              {currency}
              {Number.isNaN(value) ? 0 : value}
            </p>
            <p className="mt-3 text-sm">
              For {name || 'them'}
              {message ? ` — ${message}` : ''}
            </p>
            <p className="mt-3 text-xs opacity-80">From {from || 'you'}</p>
          </div>

          <p className="sr-only">
            Preview: a {currency}
            {Number.isNaN(value) ? 0 : value} gift card for {name || 'the recipient'},
            from {from || 'you'}, reading: {message}. Sent to {to} on {sendOn}.
          </p>

          <div className="mt-4 rounded-xl border border-border bg-card p-4">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Card value</dt>
                <dd className="font-medium">
                  {currency}
                  {Number.isNaN(value) ? 0 : value}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Delivery</dt>
                <dd>Free · by email</dd>
              </div>
              <div className="flex justify-between gap-3 border-t border-border pt-2 font-semibold">
                <dt>To pay</dt>
                <dd>
                  {currency}
                  {Number.isNaN(value) ? 0 : value}
                </dd>
              </div>
            </dl>
            <button
              type="button"
              disabled={mismatch || customInvalid}
              className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            >
              <Mail aria-hidden className="h-4 w-4" />
              Buy and schedule
            </button>
            <p className="mt-2 text-xs text-muted-foreground">
              You get a receipt straight away. {name || 'They'} get the card on{' '}
              {sendOn} — two different emails, saying two different things.
            </p>
          </div>
        </aside>
      </div>
    </section>
  )
}
