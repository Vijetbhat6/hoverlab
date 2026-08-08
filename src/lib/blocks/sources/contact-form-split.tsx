'use client'

/**
 * <ContactFormSplit> — a contact form beside the ways to not use it.
 *
 * The channel list is not decoration. A contact form is a black box: you
 * type, you press send, and you have no idea whether anyone will read it.
 * Putting a real email address, a support link and a response-time promise
 * next to the form is what makes the form credible, and it lets the people
 * who would rather not use it leave without bouncing.
 *
 * Form details that matter more than the layout:
 *
 *  - Every input has a real `<label>`, not a placeholder standing in for
 *    one. Placeholder-as-label vanishes the moment someone types, which is
 *    exactly when they need to check what the field was.
 *  - `autoComplete` tokens are set (`name`, `email`, `organization`), so
 *    the browser can fill three of the five fields.
 *  - The submit button keeps its accessible name while pending — the
 *    spinner is `aria-hidden`, so the word beside it is what a screen
 *    reader announces.
 *  - The result is a live region, and it replaces the form rather than
 *    appearing above it, so nobody submits twice.
 *
 * `onSubmit` receives the form values. With no handler the preview
 * resolves locally after a beat, so the pending and success states are
 * demonstrable without a backend.
 */

import * as React from 'react'
import { Check, Loader2, Mail, MapPin, MessageSquare } from 'lucide-react'

export interface ContactValues {
  name: string
  email: string
  company: string
  subject: string
  message: string
}

export interface ContactChannel {
  icon: 'mail' | 'chat' | 'map'
  label: string
  value: string
  href?: string
}

export interface ContactFormSplitProps {
  heading?: string
  subheading?: string
  channels?: ContactChannel[]
  responseNote?: string
  submitLabel?: string
  successMessage?: string
  onSubmit?: (values: ContactValues) => void | Promise<void>
  className?: string
}

const ICONS = { mail: Mail, chat: MessageSquare, map: MapPin } as const

const DEFAULT_CHANNELS: ContactChannel[] = [
  { icon: 'mail', label: 'Email', value: 'hello@acme.com', href: 'mailto:hello@acme.com' },
  { icon: 'chat', label: 'Support', value: 'Open a ticket', href: '#' },
  { icon: 'map', label: 'Office', value: '4 Bridge Street, Bristol' },
]

const EMPTY: ContactValues = { name: '', email: '', company: '', subject: '', message: '' }

type Status = 'idle' | 'pending' | 'done'

export function ContactFormSplit({
  heading = 'Tell us what you need.',
  subheading =
    'Sales questions, support, partnerships — one form, and it reaches a person rather than a queue.',
  channels = DEFAULT_CHANNELS,
  responseNote = 'We reply to everything within one business day.',
  submitLabel = 'Send message',
  successMessage = 'Thanks — your message is in. We will reply by email.',
  onSubmit,
  className = '',
}: ContactFormSplitProps) {
  const [values, setValues] = React.useState<ContactValues>(EMPTY)
  const [status, setStatus] = React.useState<Status>('idle')

  function set<K extends keyof ContactValues>(key: K, value: ContactValues[K]) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status !== 'idle') return
    setStatus('pending')
    try {
      await (onSubmit?.(values) ?? new Promise((r) => setTimeout(r, 800)))
      setStatus('done')
    } catch {
      setStatus('idle')
    }
  }

  return (
    <section className={`mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 ${className}`}>
      <div className="grid gap-12 lg:grid-cols-5 lg:gap-16">
        {/* -- Copy + channels ----------------------------------------- */}
        <div className="lg:col-span-2">
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            {heading}
          </h2>
          <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">{subheading}</p>

          <ul className="mt-8 space-y-4">
            {channels.map((channel) => {
              const Icon = ICONS[channel.icon]
              return (
                <li key={channel.label} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-card/60 text-muted-foreground">
                    <Icon aria-hidden className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {channel.label}
                    </span>
                    {channel.href ? (
                      <a
                        href={channel.href}
                        className="text-sm font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {channel.value}
                      </a>
                    ) : (
                      <span className="text-sm font-semibold">{channel.value}</span>
                    )}
                  </span>
                </li>
              )
            })}
          </ul>

          {responseNote ? (
            <p className="mt-8 rounded-xl border border-border/60 bg-card/40 p-4 text-sm text-muted-foreground">
              {responseNote}
            </p>
          ) : null}
        </div>

        {/* -- Form ----------------------------------------------------- */}
        <div className="lg:col-span-3" aria-live="polite">
          {status === 'done' ? (
            <div className="flex h-full min-h-64 flex-col items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-10 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <Check aria-hidden className="h-6 w-6" />
              </span>
              <p className="mt-4 font-semibold">{successMessage}</p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-border/60 bg-card/40 p-6 sm:p-8"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  id="contact-name"
                  label="Name"
                  autoComplete="name"
                  required
                  value={values.name}
                  onChange={(v) => set('name', v)}
                />
                <Field
                  id="contact-email"
                  label="Work email"
                  type="email"
                  autoComplete="email"
                  required
                  value={values.email}
                  onChange={(v) => set('email', v)}
                />
                <Field
                  id="contact-company"
                  label="Company"
                  autoComplete="organization"
                  value={values.company}
                  onChange={(v) => set('company', v)}
                />
                <Field
                  id="contact-subject"
                  label="Subject"
                  required
                  value={values.subject}
                  onChange={(v) => set('subject', v)}
                />
              </div>

              <div className="mt-4">
                <label htmlFor="contact-message" className="block text-sm font-medium">
                  Message
                </label>
                <textarea
                  id="contact-message"
                  required
                  rows={5}
                  value={values.message}
                  onChange={(e) => set('message', e.target.value)}
                  className="mt-1.5 w-full resize-y rounded-xl border border-border/60 bg-background/60 px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
                  placeholder="What are you trying to do?"
                />
              </div>

              <button
                type="submit"
                disabled={status === 'pending'}
                className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-70 sm:w-auto"
              >
                {status === 'pending' ? (
                  <>
                    <Loader2
                      aria-hidden
                      className="h-4 w-4 animate-spin motion-reduce:[animation-duration:1.6s]"
                    />
                    Sending
                  </>
                ) : (
                  submitLabel
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}

/** A labelled text input. Extracted only because it repeats four times. */
function Field({
  id,
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  autoComplete,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  required?: boolean
  autoComplete?: string
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
        {required ? null : (
          <span className="ml-1 text-xs font-normal text-muted-foreground">(optional)</span>
        )}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 h-11 w-full rounded-xl border border-border/60 bg-background/60 px-3 text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
      />
    </div>
  )
}
