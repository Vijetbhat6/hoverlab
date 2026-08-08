'use client'

/**
 * <CheckoutForm> — contact, delivery address, and payment.
 *
 * The autocomplete tokens are the whole point of copying this rather than
 * typing it. `given-name`, `family-name`, `address-line1`, `postal-code`,
 * `cc-number`, `cc-exp` — these are what let a browser fill an eight-field
 * checkout in one tap, and getting them wrong or omitting them is the
 * single largest avoidable source of checkout abandonment on mobile.
 *
 * `autocomplete="cc-number"` also needs `inputmode="numeric"`: without it
 * a phone shows the alphabetic keyboard for a card number.
 *
 * Address fields are ordered and labelled for the selected country rather
 * than assuming a US shape. "State / ZIP" on a form someone is filling in
 * from Yorkshire is a small thing that reads as "we did not think about
 * you".
 */

import * as React from 'react'
import { Lock, CreditCard } from 'lucide-react'

export interface Country {
  code: string
  name: string
  /** What the postal field is called here. */
  postalLabel: string
  /** What the sub-national field is called, if there is one. */
  regionLabel?: string
}

export interface CheckoutFormProps {
  countries?: Country[]
  onSubmit?: (values: Record<string, string>) => void
  className?: string
}

const DEFAULT_COUNTRIES: Country[] = [
  { code: 'GB', name: 'United Kingdom', postalLabel: 'Postcode', regionLabel: 'County' },
  { code: 'US', name: 'United States', postalLabel: 'ZIP code', regionLabel: 'State' },
  { code: 'IE', name: 'Ireland', postalLabel: 'Eircode', regionLabel: 'County' },
  { code: 'DE', name: 'Germany', postalLabel: 'Postleitzahl' },
  { code: 'IN', name: 'India', postalLabel: 'PIN code', regionLabel: 'State' },
]

export function CheckoutForm({
  countries = DEFAULT_COUNTRIES,
  onSubmit,
  className = '',
}: CheckoutFormProps) {
  const [country, setCountry] = React.useState(countries[0])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    onSubmit?.(Object.fromEntries(data) as Record<string, string>)
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-8 ${className}`}>
      {/* Contact */}
      <fieldset>
        <legend className="mb-4 text-lg font-bold tracking-tight">Contact</legend>

        <Field
          id="email"
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          hint="Order confirmation and delivery updates go here."
          required
        />
      </fieldset>

      {/* Delivery */}
      <fieldset>
        <legend className="mb-4 text-lg font-bold tracking-tight">Delivery address</legend>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="given-name" name="givenName" label="First name" autoComplete="given-name" required />
          <Field id="family-name" name="familyName" label="Last name" autoComplete="family-name" required />
        </div>

        <div className="mt-4">
          <label htmlFor="country" className="mb-1.5 block text-sm font-medium">
            Country
          </label>
          <select
            id="country"
            name="country"
            autoComplete="country"
            value={country.code}
            onChange={(e) =>
              setCountry(countries.find((c) => c.code === e.target.value) ?? countries[0])
            }
            className="w-full rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 space-y-4">
          <Field id="address-line1" name="addressLine1" label="Address" autoComplete="address-line1" required />
          <Field
            id="address-line2"
            name="addressLine2"
            label="Apartment, suite, etc."
            autoComplete="address-line2"
            optional
          />
        </div>

        {/* Labels follow the selected country, not a US default. */}
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field id="city" name="city" label="City" autoComplete="address-level2" required />
          {country.regionLabel ? (
            <Field
              id="region"
              name="region"
              label={country.regionLabel}
              autoComplete="address-level1"
            />
          ) : null}
          <Field
            id="postal-code"
            name="postalCode"
            label={country.postalLabel}
            autoComplete="postal-code"
            required
          />
        </div>

        <div className="mt-4">
          <Field id="tel" name="tel" label="Phone" type="tel" autoComplete="tel" optional hint="For delivery questions only." />
        </div>
      </fieldset>

      {/* Payment */}
      <fieldset>
        <legend className="mb-1 text-lg font-bold tracking-tight">Payment</legend>
        <p className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock aria-hidden className="h-3.5 w-3.5" />
          Encrypted in transit. We never see your full card number.
        </p>

        <div className="relative">
          <Field
            id="cc-number"
            name="ccNumber"
            label="Card number"
            autoComplete="cc-number"
            // Numeric keypad on mobile — omitting this is why card entry
            // feels broken on a phone.
            inputMode="numeric"
            placeholder="4242 4242 4242 4242"
            required
          />
          <CreditCard
            aria-hidden
            className="pointer-events-none absolute right-3.5 top-9 h-4 w-4 text-muted-foreground"
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field
            id="cc-exp"
            name="ccExp"
            label="Expiry"
            autoComplete="cc-exp"
            inputMode="numeric"
            placeholder="MM/YY"
            required
          />
          <Field
            id="cc-csc"
            name="ccCsc"
            label="Security code"
            autoComplete="cc-csc"
            inputMode="numeric"
            placeholder="123"
            required
          />
        </div>

        <Field
          id="cc-name"
          name="ccName"
          label="Name on card"
          autoComplete="cc-name"
          className="mt-4"
          required
        />
      </fieldset>

      <button
        type="submit"
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <Lock aria-hidden className="h-4 w-4" />
        Pay now
      </button>
    </form>
  )
}

/** A labelled input. Every field on a checkout needs one — no placeholders-as-labels. */
function Field({
  id,
  name,
  label,
  hint,
  optional,
  className = '',
  ...input
}: {
  id: string
  name: string
  label: string
  hint?: string
  optional?: boolean
  className?: string
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
        {optional ? (
          <span className="ml-1.5 font-normal text-muted-foreground">(optional)</span>
        ) : null}
      </label>

      <input
        id={id}
        name={name}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className="w-full rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary"
        {...input}
      />

      {hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
