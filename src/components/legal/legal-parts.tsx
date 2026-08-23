import * as React from 'react'
import Link from 'next/link'

import { OPERATOR, formatLegalDate, EFFECTIVE_DATE } from '@/lib/legal'

/**
 * The shapes the four policy pages repeat — Terms, Privacy, Refunds and the
 * Licence.
 *
 * Components rather than markdown, for the same reason the docs are: there
 * are four pages, two of them need live values (the operator's details, the
 * plan prices) and an MDX toolchain to render four files is more moving
 * parts than the thing it renders.
 *
 * Everything here is plain server-rendered HTML with no client bundle. A
 * policy page must be readable when JavaScript fails, because the person
 * reading it is often doing so from an email client's browser after
 * something has already gone wrong.
 */

export function LegalTitle({
  title,
  summary,
}: {
  title: string
  summary: React.ReactNode
}) {
  return (
    <header className="mb-10 border-b border-border/60 pb-8">
      <p className="text-xs font-bold uppercase tracking-wider text-primary">
        Hoverlab
      </p>
      <h1 className="mt-2 text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
        {title}
      </h1>
      {/*
        A plain-language summary above the document, not instead of it. The
        operative text is below and governs; this is here because a reader
        who bounces off paragraph one learns nothing at all, and a policy
        nobody reads protects nobody.
      */}
      <div className="mt-4 text-pretty text-body">{summary}</div>
      <p className="mt-6 text-sm text-muted-foreground">
        In effect from {formatLegalDate(EFFECTIVE_DATE)}. Questions about
        anything on this page go to{' '}
        <ContactEmail />.
      </p>
    </header>
  )
}

export function LegalSection({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="mt-10 scroll-mt-24" id={id}>
      <h2 className="text-xl font-bold tracking-tight">
        <a href={`#${id}`} className="group">
          {title}
          <span
            aria-hidden
            className="ml-2 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
          >
            #
          </span>
        </a>
      </h2>
      <div className="mt-3 space-y-3 text-body">{children}</div>
    </section>
  )
}

/** A bulleted list with the same rhythm as the paragraphs around it. */
export function LegalList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="ml-5 list-disc space-y-2 text-body marker:text-muted-foreground">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  )
}

/**
 * The operator's contact address, as a mailto when it is set.
 *
 * While the placeholder is in place this renders as plain text rather than
 * as a link — a `mailto:` to "TO BE SET" opens an empty compose window and
 * looks like the site is broken rather than unfinished.
 */
export function ContactEmail() {
  const email = OPERATOR.contactEmail
  if (email.includes('TO BE SET')) {
    return <span className="font-medium">{email}</span>
  }
  return (
    <a href={`mailto:${email}`} className="font-medium text-primary hover:underline">
      {email}
    </a>
  )
}

/** The legal person, named the way the documents should name it. */
export function OperatorName() {
  return (
    <>
      {OPERATOR.legalName}
      {OPERATOR.tradingName && !OPERATOR.legalName.includes(OPERATOR.tradingName)
        ? ` (trading as ${OPERATOR.tradingName})`
        : ''}
    </>
  )
}

/** Cross-links between the four documents, rendered at the foot of each. */
export function LegalFooterNav({ current }: { current: string }) {
  const pages = [
    { href: '/terms', label: 'Terms of Service' },
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/refunds', label: 'Refund Policy' },
    { href: '/licence', label: 'Licence' },
  ].filter((p) => p.href !== current)

  return (
    <nav
      aria-label="Other policies"
      className="mt-16 border-t border-border/60 pt-6"
    >
      <p className="text-sm text-muted-foreground">
        Also here:{' '}
        {pages.map((p, i) => (
          <React.Fragment key={p.href}>
            {i > 0 ? ' · ' : ''}
            <Link href={p.href} className="font-medium text-primary hover:underline">
              {p.label}
            </Link>
          </React.Fragment>
        ))}
      </p>
    </nav>
  )
}
