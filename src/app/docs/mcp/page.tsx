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

const TITLE = 'MCP — Hoverlab Docs'
const DESCRIPTION =
  'Register Hoverlab as an MCP server so your editor agent can search the catalog and install blocks, pages and templates directly.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/docs/mcp' },
  openGraph: {
    url: absoluteUrl('/docs/mcp'),
    title: TITLE,
    description: DESCRIPTION,
    type: 'article',
    siteName: 'Hoverlab',
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
}

export default function McpDocsPage() {
  return (
    <>
      <DocsTitle
        eyebrow="MCP"
        title="Editor agents"
        intro={
          <>
            The CLI doubles as an MCP server, so an agent in your editor can
            search the catalog and write files itself instead of you pasting
            them.
          </>
        }
      />

      <DocsSection id="claude-code" title="Claude Code">
        <Snippet label="terminal">{`claude mcp add hoverlab -- npx -y hoverlab mcp`}</Snippet>
      </DocsSection>

      <DocsSection id="config" title="Any other MCP client">
        <p>Add the server to your client&apos;s config file:</p>

        <Snippet label="json">{`{
  "mcpServers": {
    "hoverlab": {
      "command": "npx",
      "args": ["-y", "hoverlab", "mcp"]
    }
  }
}`}</Snippet>

        <Callout>
          The server talks over stdio and calls the same public API the website
          does. There is no key to configure and nothing to sign in to.
        </Callout>
      </DocsSection>

      <DocsSection id="tools" title="What the agent gets">
        <DocsTable
          head={['Tool', 'What it does']}
          rows={[
            [<C key="1">search_catalog</C>, 'Search all four tiers at once'],
            [<C key="1b">match_design</C>, 'Rank blocks and pages against a described design region'],
            [<C key="2">search_effects</C>, 'Search effects specifically'],
            [<C key="3">get_effect</C>, "Read one effect's markup and CSS"],
            [<C key="4">install_effect</C>, 'Write an effect into the project'],
            [<C key="5">install_artifact</C>, 'Write a block or page, plus what it is composed of'],
            [<C key="6">init_template</C>, 'Scaffold a whole template'],
            [<C key="7">list_categories</C>, 'List the categories, per tier'],
            [
              <C key="8">get_design_dna</C>,
              'Hand the agent the design system — tokens, shape, motion, rules — before it writes UI of its own',
            ],
          ]}
        />
      </DocsSection>

      <DocsSection id="figma" title="From a Figma design">
        <p>
          Register Figma&apos;s own MCP server next to Hoverlab&apos;s and the agent can
          read a design from one and build it from the other. In the Figma
          desktop app, enable the Dev Mode MCP server under Preferences, then:
        </p>

        <p>
          {/* The same workflow, written for the person who made the design
              rather than the person implementing it — this section is filed
              under "Docs", which is not where a designer looks. */}
          <Link href="/figma" className="font-medium text-primary hover:underline">
            /figma
          </Link>{' '}
          is this page for designers: what it matches, what it cannot see in a
          static frame, and the sentence to type.
        </p>

        <Snippet label="terminal">{`claude mcp add --transport http figma http://127.0.0.1:3845/mcp
claude mcp add hoverlab -- npx -y hoverlab mcp`}</Snippet>

        <p>
          Select a frame in Figma and ask for it by intent, not by pixel:
        </p>
        <ul className="ml-4 list-disc space-y-1.5">
          <li>
            &ldquo;Rebuild my selected Figma frame: find the closest Hoverlab
            blocks, install them, and match my colours and type.&rdquo;
          </li>
          <li>
            &ldquo;This mockup has a nav, a pricing section and a FAQ — install
            the nearest match for each and restyle them.&rdquo;
          </li>
        </ul>
        <p>
          Under the hood the agent reads the frame&apos;s structure from Figma,
          calls <C>match_design</C> once per region — which tolerates designer
          vocabulary and partial matches where plain search does not — installs
          the winners, and edits the installed React to the design&apos;s tokens.
        </p>

        <p>
          Going the other way — code to Figma — is the design system export.
          It emits your palette as W3C design tokens, one file per mode, which
          is what Figma&apos;s variable import reads. Do that first and{' '}
          <C>match_design</C> is matching against a file already in your
          colours, so &ldquo;match my colours&rdquo; above becomes a check
          rather than a translation. See{' '}
          <a href="/design-system" className="font-medium text-primary hover:underline">
            /design-system
          </a>
          .
        </p>

        <Callout>
          No Figma? A pasted screenshot works too: agents read images, and{' '}
          <C>match_design</C> only needs the structure described to it. And the
          honest limit runs the other way — a static design shows layout, so it
          matches blocks and pages. Hover and motion are invisible in a mockup;
          ask for those in words and the effect tools take over.
        </Callout>
      </DocsSection>

      <DocsSection id="asking" title="Asking for things">
        <p>
          The catalog is searched by meaning, not just by name, so plain
          descriptions work better than guessing ids:
        </p>
        <ul className="ml-4 list-disc space-y-1.5">
          <li>&ldquo;Add a pricing section with a monthly/yearly toggle&rdquo;</li>
          <li>&ldquo;Find me a checkout page and install it&rdquo;</li>
          <li>&ldquo;Scaffold the storefront template into ./shop&rdquo;</li>
        </ul>
        <p>
          Everything it installs is the same source you would get from{' '}
          <Link href="/docs/cli" className="font-medium text-primary hover:underline">
            the CLI
          </Link>{' '}
          — files in your repo, no runtime dependency on us.
        </p>
      </DocsSection>
    </>
  )
}
