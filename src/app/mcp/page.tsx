/**
 * /mcp — the MCP server as a page somebody can be sent to.
 *
 * WHY IT MOVED OUT OF /docs.
 *
 * This was `/docs/mcp`: two code fences, a ten-row table and a section on
 * the Figma pairing, filed under a nav item that says "Docs". Documentation
 * is written for people who have already chosen, and it is found by people
 * who are already here. Everything about the old page assumed both — it
 * opened with configuration, because configuration is what you need once
 * you have decided.
 *
 * That is the wrong audience for this particular claim. Agent access is the
 * part of this product a reader is deciding *about*, not a detail they look
 * up afterwards, and "the component library your editor can install from"
 * is a sentence that has to land before anyone opens a config file. It also
 * has to survive being pasted into a channel by somebody who is arguing for
 * it, which a docs subsection cannot do — the first screen of it is a shell
 * command.
 *
 * Same move, same reasoning, as `/figma`: a capability that already worked,
 * described only in a place its audience never opens, given a URL instead.
 * The difference is that `/figma` left the docs page in place and this one
 * replaces it, because there was no second audience here — a 308 in
 * `next.config.ts` sends `/docs/mcp` and its `#figma` anchor to this page,
 * and every internal link that pointed at the old URL now points here.
 *
 * ── THE ARGUMENT, AND THE PART OF IT THAT IS DELIBERATELY NOT MADE ──────
 *
 * The claim worth making is a difference in kind, not a score: three of
 * these ten tools put files in the reader's repo, and every competing
 * server in this category hands back code, or a command to run, and stops.
 * `install_artifact` resolving a page's blocks so the result compiles is
 * the concrete version of that, and it is the thing a read-only server
 * cannot do at any tool count.
 *
 * What is NOT claimed is a tool count for anybody else. The obvious
 * framing — "our nine against their three" — is a number about someone
 * else's product, it would be stale the next time they ship, and nothing
 * in this repo reads their server to keep it honest. `/compare` already
 * carries per-vendor agent-access rows with the date each was last read;
 * the comparison band below quotes those and links to them rather than
 * inventing a headline figure that sounds better. A page whose whole
 * argument is "we write the files and they do not" can afford to be exact
 * about the one part a reader can check.
 *
 * Every number on this page is computed: `MCP_TOOL_COUNT` and
 * `MCP_WRITE_COUNT` come from `lib/mcp-tools`, which `mcp-tools.test.ts`
 * pins to the published server in `packages/cli`, and the catalog totals
 * come from the catalog. There is no hand-typed count here on purpose.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight,
  Bot,
  Check,
  Figma,
  FileCode2,
  Plug,
  Terminal,
  X,
} from 'lucide-react'

import { AgentTranscript } from '@/components/mcp/agent-transcript'
import { CodeBlock } from '@/components/code-block'
import { JsonLd } from '@/components/json-ld'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { Button } from '@/components/ui/button'
import { BLOCK_COUNT } from '@/lib/blocks/block-index'
import { TOTAL_COUNT } from '@/lib/catalog-stats'
import { PAGE_COUNT } from '@/lib/pages/page-index'
import { TEMPLATE_COUNT } from '@/lib/templates/template-index'
import {
  MCP_ADD_COMMAND,
  MCP_CLIENT_CONFIG,
  MCP_FIGMA_ADD_COMMAND,
  MCP_TOOLS,
  MCP_TOOL_COUNT,
  MCP_WRITE_COUNT,
} from '@/lib/mcp-tools'
import { absoluteUrl } from '@/lib/site'
import { breadcrumbLd } from '@/lib/structured-data'

const TITLE = 'MCP server — the component library your agent installs from'
const DESCRIPTION =
  'Register Hoverlab as an MCP server and your editor’s agent gets the whole catalog as tools. Ten of them, three of which write files into your project. No key, no account, one command.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'mcp server components',
    'claude code mcp ui library',
    'cursor mcp components',
    'model context protocol ui',
    'agent installs react components',
    'shadcn mcp alternative',
  ],
  alternates: { canonical: '/mcp' },
  openGraph: {
    url: absoluteUrl('/mcp'),
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    siteName: 'Hoverlab',
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
}

/* ------------------------------------------------------------------ *
 *  Setup
 * ------------------------------------------------------------------ */

const CLIENTS = [
  {
    icon: Terminal,
    name: 'Claude Code',
    body: 'One command in the project you want it in.',
    code: MCP_ADD_COMMAND,
    language: 'bash',
    filename: 'terminal',
  },
  {
    icon: Plug,
    name: 'Cursor, Windsurf, anything else',
    body: 'The same server, as a config-file entry. It talks stdio, so every MCP client speaks it.',
    code: MCP_CLIENT_CONFIG,
    language: 'json',
    filename: 'mcp.json',
  },
]

/* ------------------------------------------------------------------ *
 *  FAQ
 *
 *  Rendered as text and mirrored into FAQPage structured data from the
 *  same array — two renderings of one source, so an answer cannot be
 *  edited on the page and left stale in the markup a search engine reads.
 * ------------------------------------------------------------------ */

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: 'Do I need an account or an API key?',
    a: 'No. The server talks to the same public, unauthenticated API the website does. There is nothing to sign in to and nothing to configure beyond the one line above.',
  },
  {
    q: 'Is it free?',
    a: 'The server is free and so is everything it can read. The Pro licence covers what you do with the source commercially, not whether an agent may fetch it — the gates are listed on the pricing page, and agent access is not one of them.',
  },
  {
    q: 'What does it actually write into my project?',
    a: `Plain React and Tailwind source, at paths it picks from your project's layout, plus a list of any npm packages you still need. It is the same output as the CLI. Nothing is imported from us at runtime, so nothing in your app breaks when we deploy.`,
  },
  {
    q: 'Will it overwrite my files?',
    a: 'Not unless it is told to. Every writing tool refuses an existing file and every scaffold refuses a non-empty directory, until force is passed — which is a decision the agent has to make out loud rather than a default.',
  },
  {
    q: 'Does it work with something other than Next.js?',
    a: 'Effects convert to CSS, Tailwind, React, Vue, Svelte and more on the way out. Blocks and pages are React and ship as written; templates are Next.js projects. The frameworks page prints the real generated output for each target.',
  },
  {
    q: 'How is this different from the shadcn registry?',
    a: 'They are two rails to the same catalog and both are supported — the registry exposes it to the shadcn CLI under the @hoverlab namespace, the MCP server exposes it to an agent as tools it can call mid-conversation, including matching a design and scaffolding a whole project.',
  },
  {
    q: 'Can the agent see a Figma design?',
    a: `Yes, paired with Figma's own Dev Mode MCP server. It reads a selected frame's structure from Figma, calls match_design once per region, installs what matches and restyles it to your tokens. A pasted screenshot works too.`,
  },
  {
    q: 'What if the agent picks the wrong component?',
    a: 'What lands is source in your repo, so it is edited or deleted like anything else — there is no lock-in to undo. Every artifact is also browsable on the site, so you can name the id yourself instead of leaving the choice to a search.',
  },
]

export default function McpPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <JsonLd
        data={breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'MCP' }])}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: FAQ.map((item) => ({
            '@type': 'Question',
            name: item.q,
            acceptedAnswer: { '@type': 'Answer', text: item.a },
          })),
        }}
      />

      <main>
        {/* ---------------------------------------------------------- *
         *  Hero
         * ---------------------------------------------------------- */}
        <section className="mx-auto max-w-3xl px-4 pt-14 text-center sm:px-6">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Bot aria-hidden className="h-3.5 w-3.5 text-primary" />
            Model Context Protocol
          </span>
          <h1 className="type-display text-gradient-heading mt-4">
            Your agent doesn&rsquo;t paste components. It installs them.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-body sm:text-lg">
            One command puts the whole catalog in your editor as{' '}
            {MCP_TOOL_COUNT} tools — {MCP_WRITE_COUNT} of which write files
            into your project. Ask for a pricing section and it arrives at a
            path in your repo, with its dependencies named, not in a code
            fence you have to copy out of.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="#setup">
                Set it up in a minute
                <ArrowRight aria-hidden className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="#tools">See the {MCP_TOOL_COUNT} tools</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            No API key. No account. Works with Claude Code, Cursor, Windsurf
            and any other MCP client.
          </p>
        </section>

        {/* ---------------------------------------------------------- *
         *  The transcript — what it looks like when it works
         * ---------------------------------------------------------- */}
        <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <AgentTranscript />
        </section>

        {/* ---------------------------------------------------------- *
         *  Read-only vs writes
         *
         *  The competitor half of this band is quoted from /compare and
         *  linked to it, because those rows carry the date each vendor's
         *  own page was last read. See the header docblock for why there
         *  is no tool count on that side.
         * ---------------------------------------------------------- */}
        <section className="border-y border-border/40 bg-background/60 py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
              Most catalog servers can only read
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
              Agent access is table stakes in this category now — several
              vendors ship an MCP server and one of them charges for it. The
              difference is not how many tools each has. It is whether the
              conversation ends with a file.
            </p>

            <div className="mt-10 grid gap-5 md:grid-cols-2 [&>*]:min-w-0">
              <div className="rounded-2xl border border-border/60 bg-card/40 p-6">
                <h3 className="flex items-center gap-2 text-lg font-bold tracking-tight">
                  <X aria-hidden className="h-4 w-4 text-muted-foreground" />
                  Read-only agent access
                </h3>
                <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                  <li>
                    Search the catalog, view an item, get back the code — or a
                    command for <em>you</em> to run.
                  </li>
                  <li>
                    The agent is a search box with a better interface. The
                    paste, the path and the imports are still yours.
                  </li>
                  <li>
                    A page of composed sections has to be assembled by hand,
                    one id at a time, guessing what it depends on.
                  </li>
                  <li>
                    Nothing to call when the ask is &ldquo;scaffold the whole
                    thing&rdquo;.
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border border-primary/30 bg-primary/[0.04] p-6">
                <h3 className="flex items-center gap-2 text-lg font-bold tracking-tight">
                  <Check aria-hidden className="h-4 w-4 text-primary" />
                  This one writes
                </h3>
                <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                  <li>
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                      install_artifact
                    </code>{' '}
                    and{' '}
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                      install_effect
                    </code>{' '}
                    detect the framework, pick the paths and report what
                    landed.
                  </li>
                  <li>
                    A page brings the blocks it is composed of, so what lands
                    compiles instead of leaving broken imports.
                  </li>
                  <li>
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                      init_template
                    </code>{' '}
                    scaffolds a whole runnable project — routing, layout,
                    tokens, every page and block.
                  </li>
                  <li>
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                      match_design
                    </code>{' '}
                    takes a Figma frame or a screenshot and ranks the catalog
                    against it, region by region.
                  </li>
                </ul>
              </div>
            </div>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              We keep a dated, per-vendor record of what each competitor&rsquo;s
              agent access actually offers —{' '}
              <Link
                href="/compare"
                className="font-medium text-primary hover:underline"
              >
                including the rows where they beat us
              </Link>
              .
            </p>
          </div>
        </section>

        {/* ---------------------------------------------------------- *
         *  Setup
         * ---------------------------------------------------------- */}
        <section id="setup" className="mx-auto max-w-5xl scroll-mt-24 px-4 py-20 sm:px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
            One minute, and nothing to sign up for
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
            There is no key to paste and no account to make. Register the
            server, restart the client, and the tools are there.
          </p>

          {/* min-w-0 on the tracks: both columns hold code blocks whose
              lines cannot wrap, and a grid item's automatic minimum is its
              content — without it the column outgrows a phone viewport and
              scrolls the page sideways. */}
          <div className="mt-10 grid gap-8 lg:grid-cols-2 [&>*]:min-w-0">
            {CLIENTS.map((client) => (
              <div key={client.name}>
                <h3 className="flex items-center gap-2 text-xl font-bold tracking-tight">
                  <client.icon aria-hidden className="h-4 w-4 text-primary" />
                  {client.name}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {client.body}
                </p>
                <div className="mt-4">
                  <CodeBlock
                    code={client.code}
                    language={client.language}
                    filename={client.filename}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-border/60 bg-card/60 p-6 text-center">
            <h3 className="text-lg font-bold tracking-tight">
              Or skip the config file entirely
            </h3>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">
              The VS Code extension contributes this same server to the
              editor, so agent mode finds it with nothing registered by hand —
              and adds a sidebar over all five tiers for the times you would
              rather browse than ask.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Button asChild variant="outline">
                <Link href="/docs/editor">Get the extension</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/docs/cli">Use the CLI instead</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------- *
         *  The tools
         * ---------------------------------------------------------- */}
        <section
          id="tools"
          className="border-y border-border/40 bg-background/60 scroll-mt-24 py-20"
        >
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
              {MCP_TOOL_COUNT} tools. {MCP_WRITE_COUNT} of them write files.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
              Reaching every tier: {TOTAL_COUNT.toLocaleString('en-US')}{' '}
              effects, {BLOCK_COUNT} blocks, {PAGE_COUNT} pages and{' '}
              {TEMPLATE_COUNT} templates, plus the design system behind them.
            </p>

            <ul className="mt-10 grid gap-3 md:grid-cols-2">
              {MCP_TOOLS.map((tool) => (
                <li
                  key={tool.name}
                  className="rounded-xl border border-border/60 bg-card/60 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="font-mono text-sm font-semibold">
                      {tool.name}
                    </code>
                    {tool.kind === 'write' ? (
                      <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                        writes files
                      </span>
                    ) : (
                      <span className="rounded-full border border-border/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        reads
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm font-medium text-foreground">
                    {tool.summary}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {tool.detail}
                  </p>
                </li>
              ))}
            </ul>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              This list is generated from the server the npm package
              publishes, and a test fails the build if the two ever disagree.
            </p>
          </div>
        </section>

        {/* ---------------------------------------------------------- *
         *  Figma
         *
         *  A pointer, not the pairing itself. /figma is the same workflow
         *  written for the person who made the design; duplicating it here
         *  would create two pages competing for one query, which is the
         *  mistake /licence and /license already made once.
         * ---------------------------------------------------------- */}
        <section id="figma" className="mx-auto max-w-5xl scroll-mt-24 px-4 py-20 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-2 [&>*]:min-w-0">
            <div>
              <h2 className="flex items-center gap-2 text-3xl font-bold tracking-tight sm:text-4xl">
                <Figma aria-hidden className="h-6 w-6 text-primary" />
                Pair it with Figma
              </h2>
              <p className="mt-4 text-muted-foreground">
                Register Figma&rsquo;s own Dev Mode server next to this one and
                the agent reads a design from one and builds it from the other.
                Select a frame, describe it in the words a designer would use,
                and <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">match_design</code>{' '}
                translates them into catalog vocabulary and ranks partial
                matches by how much of the description they actually cover.
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                The honest limit: a static frame shows layout, so this matches
                blocks and pages. Hover and motion are invisible in a mockup —
                ask for those in words and the effect tools take over.
              </p>
              <div className="mt-6">
                <Button asChild variant="outline">
                  <Link href="/figma">
                    The designer&rsquo;s version of this page
                    <ArrowRight aria-hidden className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <div>
              <CodeBlock
                code={`${MCP_FIGMA_ADD_COMMAND}\n${MCP_ADD_COMMAND}`}
                language="bash"
                filename="terminal"
              />
              <p className="mt-4 text-sm text-muted-foreground">
                Going the other way — code to Figma — is the{' '}
                <Link
                  href="/design-system"
                  className="font-medium text-primary hover:underline"
                >
                  design system export
                </Link>
                : your palette as W3C design tokens, one file per mode, which
                is what Figma&rsquo;s variable import reads.
              </p>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------- *
         *  FAQ
         * ---------------------------------------------------------- */}
        <section className="border-t border-border/40 bg-background/60 py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
              Questions people actually ask
            </h2>

            {/* Native <details>, not a JS accordion: this is a server
                component and the answers are the page's substance — they
                have to be in the HTML a crawler reads and findable by the
                browser's own find-in-page, neither of which survives
                content that only exists after hydration. */}
            <div className="mt-10 space-y-3">
              {FAQ.map((item) => (
                <details
                  key={item.q}
                  className="group rounded-xl border border-border/60 bg-card/60 px-5 py-4 [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                    {item.q}
                    <ArrowRight
                      aria-hidden
                      className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90"
                    />
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------- *
         *  Close
         * ---------------------------------------------------------- */}
        <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <FileCode2 aria-hidden className="mx-auto h-8 w-8 text-primary" />
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Give your agent the catalog
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            One line, and the next thing you ask for arrives as a file.
          </p>
          <div className="mx-auto mt-6 max-w-xl text-left">
            <CodeBlock code={MCP_ADD_COMMAND} language="bash" filename="terminal" />
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/browse">Browse what it can reach</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/docs">Read the docs</Link>
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
