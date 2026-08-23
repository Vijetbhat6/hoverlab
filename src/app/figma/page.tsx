/**
 * /figma — the design-to-code workflow, written for the person who made the
 * design.
 *
 * The pairing already works: register Figma's Dev Mode MCP server next to
 * Hoverlab's and an agent reads a selected frame from one and builds it out
 * of real, accessible blocks from the other. Until this page existed the
 * only place that was written down was /docs/mcp — a page a designer never
 * opens, filed under a nav item that says "Docs", written in the vocabulary
 * of the developer who would implement it.
 *
 * That matters commercially, not just editorially. Designers pick these
 * libraries far more often than the developers who implement them do, and
 * the design-to-code story is the one thing here no competitor has. It
 * deserves a URL that can be linked in a design newsletter, pasted into a
 * team channel, and found by someone searching "figma to react components".
 *
 * Everything on this page is a claim the MCP server actually keeps — the
 * tool names, what `match_design` does with designer vocabulary, and the
 * honest limit at the bottom: a static mockup shows layout, so it matches
 * blocks and pages. Hover and motion are invisible in a frame.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight,
  Frame,
  MousePointerClick,
  Sparkles,
  Terminal,
  Wand2,
} from 'lucide-react'

import { SiteHeader } from '@/components/site-header'
import { JsonLd } from '@/components/json-ld'
import { CodeBlock } from '@/components/code-block'
import { Button } from '@/components/ui/button'
import { BLOCK_COUNT } from '@/lib/blocks/block-index'
import { PAGE_COUNT } from '@/lib/pages/page-index'
import { TEMPLATE_COUNT } from '@/lib/templates/template-index'
import { TOTAL_COUNT } from '@/lib/catalog-stats'
import { breadcrumbLd } from '@/lib/structured-data'
import { absoluteUrl } from '@/lib/site'

const TITLE = 'Figma to real components — Hoverlab'
const DESCRIPTION =
  'Select a frame in Figma and let your editor agent rebuild it from real, accessible React blocks. Hoverlab pairs with Figma’s Dev Mode MCP server — no plugin, no export, no handoff document.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'figma to react',
    'figma to code',
    'figma mcp server',
    'design to code components',
    'figma tailwind components',
  ],
  alternates: { canonical: '/figma' },
  openGraph: {
    url: absoluteUrl('/figma'),
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    siteName: 'Hoverlab',
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
}

const SETUP = `claude mcp add --transport http figma http://127.0.0.1:3845/mcp
claude mcp add hoverlab -- npx -y hoverlab mcp`

const PROMPT = `Rebuild my selected Figma frame: find the closest Hoverlab
blocks, install them, and match my colours and type.`

const STEPS = [
  {
    icon: Terminal,
    title: 'Connect both servers, once',
    body: "Turn on Figma's Dev Mode MCP server in the desktop app's preferences, then register it and Hoverlab with your editor's agent. Two lines, and nothing to sign in to — Hoverlab's server takes no key and no account.",
  },
  {
    icon: MousePointerClick,
    title: 'Select a frame and describe it',
    body: 'Ask by intent, not by pixel. The agent reads the frame’s structure from Figma — what regions it has, what is in them — rather than screenshotting it.',
  },
  {
    icon: Wand2,
    title: 'Get real components, not a render',
    body: 'It calls match_design once per region, installs the winners into your project, and edits the installed React to your colours, spacing and type. What lands is source you own and can keep editing.',
  },
]

export default function FigmaPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <JsonLd
        data={breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Figma' }])}
      />

      <main>
        {/* ---------------------------------------------------------- *
         *  Hero
         * ---------------------------------------------------------- */}
        <section className="mx-auto max-w-3xl px-4 pt-14 text-center sm:px-6">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Frame aria-hidden className="h-3.5 w-3.5 text-primary" />
            For designers
          </span>
          <h1 className="type-display text-gradient-heading mt-4">
            Your frame, rebuilt from real components.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-body sm:text-lg">
            Select a frame in Figma and ask your editor&apos;s agent to build
            it. It reads the design from Figma, finds the closest match among{' '}
            {BLOCK_COUNT} blocks and {PAGE_COUNT} pages here, installs them,
            and restyles them to your tokens. No plugin to install, no export
            step, no handoff document.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/docs/mcp#figma">
                Set it up
                <ArrowRight aria-hidden className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/blocks">See what it can match</Link>
            </Button>
          </div>
        </section>

        {/* ---------------------------------------------------------- *
         *  How it works
         * ---------------------------------------------------------- */}
        <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
            Three moves, and one of them is setup
          </h2>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                className="relative h-full rounded-2xl border border-border/60 bg-card/60 p-6"
              >
                <div className="absolute right-4 top-4 font-mono text-4xl font-extrabold text-muted-foreground/10">
                  {`0${i + 1}`}
                </div>
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <step.icon aria-hidden className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-lg font-semibold tracking-tight">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------------------------------------------------- *
         *  The two commands, and the sentence to type
         * ---------------------------------------------------------- */}
        <section className="border-y border-border/40 bg-background/60 py-16">
          <div className="mx-auto grid max-w-5xl gap-8 px-4 sm:px-6 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                The whole setup
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Both servers, registered with Claude Code. Any MCP client works
                the same way — the{' '}
                <Link href="/docs/mcp" className="font-medium text-primary hover:underline">
                  MCP docs
                </Link>{' '}
                have the config-file form.
              </p>
              <div className="mt-4">
                <CodeBlock code={SETUP} language="bash" filename="terminal" />
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                And the sentence to type
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Designer vocabulary is fine. <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">match_design</code>{' '}
                translates &ldquo;navbar&rdquo;, &ldquo;plan cards&rdquo; and
                &ldquo;modal&rdquo; into catalog vocabulary and ranks partial
                matches by how much of your description they actually cover.
              </p>
              <div className="mt-4">
                <CodeBlock code={PROMPT} language="text" filename="your editor" />
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------- *
         *  What comes out — and the honest limit
         * ---------------------------------------------------------- */}
        <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-border/60 bg-card/60 p-6">
              <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight">
                <Sparkles aria-hidden className="h-4 w-4 text-primary" />
                What lands in the repo
              </h2>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>
                  Plain React and Tailwind against semantic tokens, so it
                  inherits the project&apos;s theme instead of fighting it.
                </li>
                <li>
                  Keyboard and screen-reader behaviour already handled — the
                  part a generated render leaves out.
                </li>
                <li>
                  The dependency list up front, and every prop defaulted so it
                  renders before it is wired up.
                </li>
                <li>
                  Source your team owns. Nothing phones home, and nothing
                  breaks when we deploy.
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card/60 p-6">
              <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight">
                <Frame aria-hidden className="h-4 w-4 text-primary" />
                Where it stops
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                A static design shows layout, so this matches blocks and pages
                well. Hover states and motion are invisible in a frame — ask
                for those in words and the effect tools take over, across{' '}
                {TOTAL_COUNT.toLocaleString('en-US')} pure-CSS effects.
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                No Figma at all? A pasted screenshot works — agents read
                images, and <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">match_design</code>{' '}
                only needs the structure described to it.
              </p>
            </div>
          </div>

          <div className="mt-10 rounded-2xl border border-border/60 bg-card/60 p-6 text-center">
            <h2 className="text-lg font-bold tracking-tight">
              Or start from a whole project
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
              If the design is a full product rather than a screen, {TEMPLATE_COUNT}{' '}
              deployable templates sit above the blocks — the agent can
              scaffold one and then bend it towards your design.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link href="/templates">
                  Browse templates
                  <ArrowRight aria-hidden className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/tools">Free designer tools</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
