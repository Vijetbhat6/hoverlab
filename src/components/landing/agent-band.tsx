/**
 * <AgentBand> — the one claim on this page a competitor cannot copy.
 *
 * Every other UI catalog is a website you copy out of. This one is a
 * catalog an agent can install from: an MCP server over stdio, a
 * `match_design` tool that pairs with Figma's MCP to rebuild a selected
 * frame out of real blocks, and a CLI that detects the project's framework
 * and writes to the right paths.
 *
 * It exists because the six-card features grid that used to sit here was
 * removed — it answered "why this over the alternatives", which the
 * comparison table below already does, in a different box shape. But one
 * of those six cards carried the agent story, and cutting the grid would
 * have taken the site's most defensible claim out with it. So the claim
 * gets its own band instead of a third of a card, which is closer to the
 * weight it deserves anyway.
 *
 * Three panes, not six: this is one argument, made three ways.
 */

import Link from 'next/link'
import { ArrowRight, Bot, Figma, Terminal } from 'lucide-react'

import { Reveal } from '@/components/reveal'

interface Pane {
  icon: React.ReactNode
  title: string
  description: string
  href: string
  linkLabel: string
  /** Shown in the pane's mono strip. */
  sample: string
}

const PANES: Pane[] = [
  {
    icon: <Terminal className="h-5 w-5" />,
    title: 'Install from the terminal',
    description:
      'One command writes any effect, block, page or template into your project. It detects your framework, picks the paths, and tells you which dependencies you still need.',
    href: '/docs/cli',
    linkLabel: 'CLI reference',
    sample: 'npx hoverlab add pricing-tiers',
  },
  {
    icon: <Bot className="h-5 w-5" />,
    title: 'Your editor’s agent can search it',
    description:
      'An MCP server over stdio exposes the whole catalog as tools, so Claude Code, Cursor or any MCP client can find a component and install it without leaving the conversation.',
    href: '/docs/mcp',
    linkLabel: 'MCP server',
    sample: 'search · get · add · match_design',
  },
  {
    icon: <Figma className="h-5 w-5" />,
    title: 'Point it at a Figma frame',
    description:
      'Paired with Figma’s own MCP, match_design reads a frame region by region and returns the blocks that actually match it — real, accessible source rather than generated markup.',
    href: '/docs/mcp',
    linkLabel: 'How the pairing works',
    sample: 'frame → regions → blocks',
  },
]

export function AgentBand() {
  return (
    <section className="border-y border-border/40 bg-background/60 py-16 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            The component library your AI editor can install from
          </h2>
          <p className="mt-3 text-muted-foreground">
            The catalog is not only a website. It is a CLI, an MCP server and a
            design matcher — so the thing that writes your code can reach the
            same components you can.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {PANES.map((pane, i) => (
            <Reveal key={pane.title} delay={i * 80}>
              <div className="group flex h-full flex-col rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                  {pane.icon}
                </div>

                <h3 className="mb-2 text-lg font-semibold tracking-tight">
                  {pane.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {pane.description}
                </p>

                <code className="mt-5 block overflow-x-auto rounded-lg border border-border/60 bg-muted/50 px-3 py-2 font-mono text-xs text-muted-foreground">
                  {pane.sample}
                </code>

                <Link
                  href={pane.href}
                  className="mt-4 inline-flex items-center gap-1.5 rounded text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {pane.linkLabel}
                  <ArrowRight aria-hidden className="h-3.5 w-3.5" />
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
