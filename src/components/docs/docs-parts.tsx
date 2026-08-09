import * as React from 'react'
import { Info } from 'lucide-react'

/**
 * The handful of shapes every docs page repeats.
 *
 * Kept as components rather than a markdown pipeline: there are four pages,
 * they need live catalog counts and real links into the app, and an MDX
 * toolchain to render four files is more moving parts than the thing it
 * renders. If the docs grow past a dozen pages this is the wrong call and
 * should be revisited.
 */

export function DocsTitle({
  eyebrow,
  title,
  intro,
}: {
  eyebrow: string
  title: string
  intro: React.ReactNode
}) {
  return (
    <header className="mb-10">
      <p className="text-xs font-bold uppercase tracking-wider text-primary">{eyebrow}</p>
      <h1 className="mt-2 text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
        {title}
      </h1>
      <div className="mt-4 text-pretty text-body">{intro}</div>
    </header>
  )
}

/** A section with a linkable heading. */
export function DocsSection({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="mt-12 scroll-mt-24" id={id}>
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
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  )
}

/**
 * A terminal / code sample.
 *
 * Deliberately not the interactive `<CodeBlock>` the detail pages use —
 * that ships a copy button and its client boundary, and a docs page with a
 * dozen samples would hydrate a dozen islands to render text.
 */
export function Snippet({ children, label }: { children: string; label?: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-[#0b1020]">
      {label ? (
        <div className="border-b border-white/10 px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-slate-400">
          {label}
        </div>
      ) : null}
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed text-slate-100">
        <code>{children}</code>
      </pre>
    </div>
  )
}

/** Inline code. */
export function C({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">
      {children}
    </code>
  )
}

export function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
      <Info aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <div className="text-muted-foreground">{children}</div>
    </div>
  )
}

/** A reference table — options, endpoints, fields. */
export function DocsTable({
  head,
  rows,
}: {
  head: string[]
  rows: React.ReactNode[][]
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/60">
      <table className="w-full min-w-[32rem] text-left text-sm">
        <thead className="border-b border-border/60 bg-muted/40">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-4 py-2.5 font-semibold text-foreground">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {rows.map((row, i) => (
            <tr key={i} className="align-top">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2.5 text-muted-foreground">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
