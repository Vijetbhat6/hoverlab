import Link from 'next/link'
import type { Metadata } from 'next'

import {
  C,
  Callout,
  DocsSection,
  DocsTable,
  DocsTitle,
  Snippet,
} from '@/components/docs/docs-parts'
import { BLOCK_COUNT } from '@/lib/blocks/block-index'
import { PAGE_COUNT } from '@/lib/pages/page-index'
import { TEMPLATE_COUNT } from '@/lib/templates/template-index'
import { TOTAL_COUNT } from '@/lib/catalog-stats'
import { absoluteUrl } from '@/lib/site'

const TITLE = 'Docs — Hoverlab'
const DESCRIPTION =
  'How to install anything from the Hoverlab catalog — copy and paste, the CLI, the public API, or an editor agent over MCP.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/docs' },
  openGraph: {
    url: absoluteUrl('/docs'),
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    siteName: 'Hoverlab',
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
}

export default function DocsOverviewPage() {
  return (
    <>
      <DocsTitle
        eyebrow="Overview"
        title="Install anything from the catalog"
        intro={
          <>
            Hoverlab is {TOTAL_COUNT.toLocaleString('en-US')} CSS effects,{' '}
            {BLOCK_COUNT} blocks, {PAGE_COUNT} pages and {TEMPLATE_COUNT} templates. Nothing
            here is a dependency: everything you take is source that lands in your
            repo and stops being ours.
          </>
        }
      />

      <DocsSection id="the-ladder" title="The four tiers">
        <p>
          Every artifact sits on one of four rungs, and the rung tells you what
          you get. The id is unique across all of them, so any tool that takes
          an id — the CLI, the API — resolves it without you saying which tier
          it came from.
        </p>

        <DocsTable
          head={['Tier', 'What it is', 'What you get']}
          rows={[
            [
              <Link key="e" href="/library" className="font-medium text-primary hover:underline">Effect</Link>,
              'One element — a button hover, a loader, a gradient',
              <>HTML + CSS, exportable as React, Vue, Svelte and more</>,
            ],
            [
              <Link key="b" href="/blocks" className="font-medium text-primary hover:underline">Block</Link>,
              'One section — pricing table, FAQ, navbar, footer',
              <>A React + Tailwind file, or its <Link href="/docs/api#block-html" className="text-primary hover:underline">rendered HTML</Link></>,
            ],
            [
              <Link key="p" href="/pages" className="font-medium text-primary hover:underline">Page</Link>,
              'A whole screen, assembled from blocks',
              'The page file plus every block it imports',
            ],
            [
              <Link key="t" href="/templates" className="font-medium text-primary hover:underline">Template</Link>,
              'A multi-page project',
              'A runnable directory — routes, pages, blocks, config',
            ],
          ]}
        />
      </DocsSection>

      <DocsSection id="copy-paste" title="Copy and paste">
        <p>
          The shortest path, and the one that needs nothing installed. Every
          detail page has the full source with a copy button, and every preview
          on the site is the real component — not a screenshot of one — so what
          you see is what lands in your editor.
        </p>
        <p>
          Blocks and pages are React with Tailwind utility classes. They import
          nothing from Hoverlab; the only dependency any of them declares is{' '}
          <C>lucide-react</C>, and the detail page tells you when even that is
          not needed.
        </p>
      </DocsSection>

      <DocsSection id="cli" title="The CLI">
        <p>
          For more than one file at a time, or for a whole template. No install
          step — <C>npx</C> fetches it on demand.
        </p>

        <Snippet label="terminal">{`# one block
npx hoverlab add pricing-tiers

# a page, plus every block it is built from
npx hoverlab add checkout-page

# a whole project
npx hoverlab init storefront ./shop`}</Snippet>

        <p>
          Files land where your project expects them — <C>components/</C> for
          blocks, <C>app/</C> for pages, under <C>src/</C> if you use it. Full
          reference in <Link href="/docs/cli" className="font-medium text-primary hover:underline">the CLI docs</Link>.
        </p>
      </DocsSection>

      <DocsSection id="agents" title="Editor agents and Figma">
        <p>
          The CLI doubles as an MCP server, so the agent in your editor can
          search the catalog and write the files itself. Registered next to
          Figma&apos;s MCP server, it closes the loop from design to code: the
          agent reads your selected frame from Figma, finds the closest blocks
          here, installs them and restyles them to your tokens — a screenshot
          or a written spec works the same way.
        </p>
        <p>
          Setup and prompts in{' '}
          <Link href="/docs/mcp" className="font-medium text-primary hover:underline">
            the MCP docs
          </Link>
          .
        </p>
      </DocsSection>

      <DocsSection id="tailwind" title="What blocks assume">
        <p>
          Blocks and pages are styled with Tailwind utilities against semantic
          design tokens — <C>bg-card</C>, <C>text-muted-foreground</C>,{' '}
          <C>border-border</C>. They are the shadcn/ui token names, so if your
          project already uses that convention a block drops in unchanged.
        </p>

        <Callout>
          If you do not have those tokens, take a template instead of a block:
          every template ships a <C>globals.css</C> that defines them. Or copy
          the token block out of one and keep the rest of your setup.
        </Callout>
      </DocsSection>

      <DocsSection id="licence" title="Licence">
        {/*
          This section used to read: "Everything in the catalog is yours to
          ship, including in client work and paid products, with no
          attribution required." That is the exact right Pro is sold on, given
          away on a docs page — so there was nothing left to buy, and the
          pricing page (which has always said Free is for personal and
          non-commercial work) contradicted it. The two now agree, and the
          document that governs is linked rather than paraphrased.
        */}
        <p>
          Copy anything you like, from anywhere, with or without an account.
          Free covers unlimited personal and non-commercial projects, with no
          attribution required.{' '}
          <Link href="/pricing" className="font-medium text-primary hover:underline">
            Pro
          </Link>{' '}
          adds commercial use — client work, products you sell, work for an
          employer — once, for life.
        </p>
        <p className="mt-3">
          The full terms, including the cases people actually ask about, are on
          the{' '}
          <Link href="/licence" className="font-medium text-primary hover:underline">
            licence page
          </Link>
          . Whichever tier you are on: copied code does not phone home, and
          nothing breaks when we deploy.
        </p>
      </DocsSection>
    </>
  )
}
