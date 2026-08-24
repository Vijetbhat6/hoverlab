/**
 * <IntegrationGrid> — the "works with your stack" directory.
 *
 * <HeroIntegrations> puts a wall of logos above the fold to make one
 * argument: your tools are on the list. This is the page that argument
 * sends people to, and it has a different job — not "are you here" but
 * "what does it actually do with the thing I use", which a bare logo tile
 * cannot answer.
 *
 * So every cell carries a sentence, and that sentence is the block. A
 * directory of logos with no description is a logo cloud that has been made
 * to scroll for longer.
 *
 * Two things the naive version gets wrong.
 *
 * Status is not a colour. An integration that is in beta or on the roadmap
 * is the single most important thing on the card for someone evaluating,
 * and shipping that as a tinted border means it is invisible to a
 * screen-reader user and to anyone who prints the page. It renders as a
 * text pill.
 *
 * The whole cell is not a link. Wrapping a card in an <a> gives a screen
 * reader one enormous link whose name is every word in the card, and it
 * makes text selection impossible. The name is the link; the card is a
 * container. `focus-within` moves the visible ring out to the cell so the
 * hit target still reads as the whole card.
 *
 * Wordmarks stand in for logos by default — remote SVGs are a layout shift
 * and a licence question, and `logo` takes a node when the real mark is
 * ready.
 */

import * as React from 'react'

export type IntegrationStatus = 'live' | 'beta' | 'planned'

export interface Integration {
  name: string
  description: string
  href?: string
  status?: IntegrationStatus
  category?: string
  /** Replaces the wordmark initial. */
  logo?: React.ReactNode
}

export interface IntegrationGridProps {
  integrations?: Integration[]
  heading?: string
  subheading?: string
  className?: string
}

const DEFAULT_INTEGRATIONS: Integration[] = [
  {
    name: 'Figma',
    description:
      'Match a frame against the catalog and get back the components that already look like it.',
    category: 'Design',
    status: 'live',
  },
  {
    name: 'VS Code',
    description:
      'Install a component from the editor over MCP, without opening a browser.',
    category: 'Editor',
    status: 'live',
  },
  {
    name: 'Next.js',
    description:
      'App Router by default — every block is a server component unless it needs not to be.',
    category: 'Framework',
    status: 'live',
  },
  {
    name: 'Tailwind CSS',
    description:
      'Utility classes and CSS variables, so a copied block inherits your theme rather than fighting it.',
    category: 'Styling',
    status: 'live',
  },
  {
    name: 'shadcn/ui',
    description:
      'A registry the CLI can install from, including a base preset carrying tokens and fonts.',
    category: 'Registry',
    status: 'live',
  },
  {
    name: 'Storybook',
    description:
      'Generated stories per artifact, so a copied block lands with its states already documented.',
    category: 'Tooling',
    status: 'beta',
  },
  {
    name: 'Vue',
    description:
      'The effects already work anywhere. Blocks and pages as single-file components are in progress.',
    category: 'Framework',
    status: 'planned',
  },
  {
    name: 'Sanity',
    description:
      'Content-driven pages with the copy lifted out into a schema you can edit.',
    category: 'CMS',
    status: 'planned',
  },
]

const STATUS_STYLE: Record<IntegrationStatus, { label: string; klass: string }> = {
  live: {
    label: 'Available',
    klass:
      'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  },
  beta: {
    label: 'Beta',
    klass: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  },
  planned: {
    label: 'Planned',
    klass: 'border-border/60 bg-muted/60 text-muted-foreground',
  },
}

export function IntegrationGrid({
  integrations = DEFAULT_INTEGRATIONS,
  heading = 'Works with what you already use',
  subheading = 'What each one actually does, rather than a wall of logos.',
  className = '',
}: IntegrationGridProps) {
  return (
    <section
      className={`mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24 ${className}`}
    >
      {heading ? (
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            {heading}
          </h2>
          {subheading ? (
            <p className="mt-3 text-muted-foreground">{subheading}</p>
          ) : null}
        </div>
      ) : null}

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {integrations.map((item) => {
          const status = STATUS_STYLE[item.status ?? 'live']
          return (
            <li
              key={item.name}
              className="flex flex-col rounded-2xl border border-border/60 bg-card/60 p-5 transition-colors hover:border-border focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    aria-hidden
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background text-sm font-bold text-muted-foreground"
                  >
                    {item.logo ?? item.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold leading-tight">
                      {item.href ? (
                        <a
                          href={item.href}
                          // The ring lives on the cell via focus-within, so
                          // the link itself does not draw a second one.
                          className="outline-none hover:underline"
                        >
                          {item.name}
                        </a>
                      ) : (
                        item.name
                      )}
                    </h3>
                    {item.category ? (
                      <p className="text-xs text-muted-foreground">
                        {item.category}
                      </p>
                    ) : null}
                  </div>
                </div>

                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${status.klass}`}
                >
                  {status.label}
                </span>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
