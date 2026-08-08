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
import { absoluteUrl } from '@/lib/site'

const TITLE = 'CLI — Hoverlab Docs'
const DESCRIPTION =
  'npx hoverlab — add blocks and pages, scaffold a template, search every tier from the terminal.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/docs/cli' },
  openGraph: {
    url: absoluteUrl('/docs/cli'),
    title: TITLE,
    description: DESCRIPTION,
    type: 'article',
    siteName: 'Hoverlab',
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
}

export default function CliDocsPage() {
  return (
    <>
      <DocsTitle
        eyebrow="CLI"
        title="npx hoverlab"
        intro={
          <>
            One command surface over all four tiers. Nothing to install — it
            reads the same public API the website does, so it needs no account
            and no token.
          </>
        }
      />

      <DocsSection id="install" title="Install">
        <p>
          There is nothing to install. <C>npx</C> fetches the current version
          each time, which is what you want for a tool you run a handful of
          times per project.
        </p>
        <Snippet label="terminal">{`npx hoverlab help`}</Snippet>
        <p>
          If you reach for it often enough to mind the fetch,{' '}
          <C>npm i -g hoverlab</C> works too.
        </p>
      </DocsSection>

      <DocsSection id="commands" title="Commands">
        <DocsTable
          head={['Command', 'What it does']}
          rows={[
            [<C key="a">add &lt;id…&gt;</C>, 'Write an effect, block or page into your project'],
            [
              <C key="i">init [template] [dir]</C>,
              'Scaffold a template into a new directory. With no template, lists what is available.',
            ],
            [<C key="s">search &lt;words…&gt;</C>, 'Search every tier at once'],
            [<C key="sh">show &lt;id…&gt;</C>, "Print an artifact's code without writing anything"],
            [<C key="c">categories</C>, 'List the categories, per tier'],
            [<C key="m">mcp</C>, 'Run the MCP server over stdio, for editor agents'],
          ]}
        />
      </DocsSection>

      <DocsSection id="add" title="Adding things">
        <Snippet label="terminal">{`# a single block
npx hoverlab add pricing-tiers

# several at once
npx hoverlab add pricing-tiers faq-accordion footer-mega

# a page — writes the page and every block it imports
npx hoverlab add checkout-page

# an effect, tweaked on the way in
npx hoverlab add btn-gradient --hue 40 --speed 1.5`}</Snippet>

        <p>
          <strong className="text-foreground">Where files land.</strong> Effects
          go into a <C>hoverlab/</C> folder inside your components or styles
          directory. Blocks and pages keep their own paths —{' '}
          <C>components/pricing-tiers.tsx</C>, <C>app/checkout/page.tsx</C> —
          rooted at your project, or at <C>src/</C> if you use one. That is not
          a preference: page sources import their blocks by those paths, so
          moving them breaks the imports. <C>--dir</C> overrides it if you know
          what you are doing.
        </p>

        <Callout>
          Nothing is overwritten without <C>--force</C>. Run with{' '}
          <C>--dry-run</C> first to see the exact file list.
        </Callout>
      </DocsSection>

      <DocsSection id="init" title="Scaffolding a template">
        <p>
          A template is a whole project — routes, pages, blocks and config.{' '}
          <C>init</C> writes it into a new directory.
        </p>

        <Snippet label="terminal">{`# see what is available
npx hoverlab init

# scaffold one
npx hoverlab init storefront ./shop

cd shop && npm install && npm run dev`}</Snippet>
      </DocsSection>

      <DocsSection id="search" title="Searching">
        <p>
          Search covers all four tiers at once and ranks them together, which
          matters when a word like &ldquo;pricing&rdquo; names a block, a page
          and thirty effects.
        </p>

        <Snippet label="terminal">{`npx hoverlab search checkout
npx hoverlab search "pulsing teal button" --level effect
npx hoverlab search pricing --level block --featured
npx hoverlab show pricing-tiers --deep`}</Snippet>
      </DocsSection>

      <DocsSection id="options" title="Options">
        <DocsTable
          head={['Option', 'Effect']}
          rows={[
            [<C key="l">-l, --level &lt;tier&gt;</C>, 'effect | block | page | template — restrict search and categories'],
            [
              <C key="f">-f, --framework &lt;t&gt;</C>,
              <>
                Effects only. Blocks and above ship as React — see{' '}
                <Link href="/docs/api#block-html" className="text-primary hover:underline">
                  rendered HTML
                </Link>{' '}
                if you are not using it. Auto-detected from your project when omitted.
              </>,
            ],
            [<C key="d">-d, --dir &lt;path&gt;</C>, 'Destination directory'],
            [<C key="force">--force</C>, 'Overwrite existing files, or scaffold into a non-empty directory'],
            [<C key="dry">--dry-run</C>, 'Print what would be written, write nothing'],
            [<C key="cat">--category &lt;c&gt;</C>, 'Restrict a search to one category'],
            [<C key="feat">--featured</C>, 'Only curated, hand-written entries'],
            [<C key="lim">--limit &lt;n&gt;</C>, 'Maximum results per tier (default 20)'],
            [<C key="deep">--deep</C>, <>With <C>show</C>: include the blocks a page is built from</>],
            [<C key="json">--json</C>, 'Machine-readable output'],
            [
              <C key="tweak">--hue --sat --scale --speed</C>,
              'Effects only — the same customization knobs the detail page has',
            ],
          ]}
        />
      </DocsSection>

      <DocsSection id="mcp" title="Editor agents">
        <p>
          The CLI doubles as an MCP server so your editor&apos;s agent can search
          and install from the catalog directly. See{' '}
          <Link href="/docs/mcp" className="font-medium text-primary hover:underline">
            the MCP docs
          </Link>
          .
        </p>
      </DocsSection>
    </>
  )
}
