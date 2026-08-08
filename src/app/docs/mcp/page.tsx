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
            [<C key="2">search_effects</C>, 'Search effects specifically'],
            [<C key="3">get_effect</C>, "Read one effect's markup and CSS"],
            [<C key="4">install_effect</C>, 'Write an effect into the project'],
            [<C key="5">install_artifact</C>, 'Write a block or page, plus what it is composed of'],
            [<C key="6">init_template</C>, 'Scaffold a whole template'],
            [<C key="7">list_categories</C>, 'List the categories, per tier'],
          ]}
        />
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
