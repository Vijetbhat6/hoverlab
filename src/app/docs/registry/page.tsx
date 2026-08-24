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
import { absoluteUrl, siteUrl } from '@/lib/site'
import { BLOCK_COUNT } from '@/lib/blocks/block-index'
import { PAGE_COUNT } from '@/lib/pages/page-index'

const TITLE = 'shadcn registry — Hoverlab Docs'
const DESCRIPTION =
  'Install Hoverlab blocks and pages with npx shadcn add. A public registry.json, no account, no API key.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'shadcn registry',
    'npx shadcn add',
    'tailwind blocks registry',
    'shadcn mcp registry',
  ],
  alternates: { canonical: '/docs/registry' },
  openGraph: {
    url: absoluteUrl('/docs/registry'),
    title: TITLE,
    description: DESCRIPTION,
    type: 'article',
    siteName: 'Hoverlab',
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
}

const origin = siteUrl.replace(/\/$/, '')

export default function RegistryDocsPage() {
  return (
    <>
      <DocsTitle
        eyebrow="Registry"
        title="npx shadcn add"
        intro={
          <>
            Every block and page is published as a shadcn registry item, so the
            tool you already use can install them. Nothing to sign up for and no
            key to configure — the registry is public, like the rest of the
            catalog.
          </>
        }
      />

      <DocsSection id="configure" title="Point your project at it">
        <p>
          Add the registry to <C>components.json</C>. The <C>{'{name}'}</C>{' '}
          placeholder is filled in by the CLI — leave it exactly as written.
        </p>
        <Snippet label="components.json">{`{
  "registries": {
    "@hoverlab": "${origin}/r/{name}.json"
  }
}`}</Snippet>
        <p>
          Then install the design system once, so the tokens every block
          references actually exist:
        </p>
        <Snippet label="terminal">{`npx shadcn add @hoverlab/hoverlab`}</Snippet>
        <p>
          That writes the light and dark CSS variables, the radius scale and the
          icon library into your stylesheet. Skip it and blocks will install
          fine but render against whatever <C>--primary</C> your project already
          had.
        </p>
      </DocsSection>

      <DocsSection id="install" title="Install a block or a page">
        <p>
          Items are addressed by the same id the catalog uses, so anything you
          can open on this site you can install by name.
        </p>
        <Snippet label="terminal">{`npx shadcn add @hoverlab/hero-split
npx shadcn add @hoverlab/saas-landing-page`}</Snippet>
        <p>
          A page brings its blocks with it. <C>saas-landing-page</C> declares
          twelve of them as registry dependencies, so one command writes the
          route and every section it renders.
        </p>
        <DocsTable
          head={['Item type', 'Count', 'Where it lands']}
          rows={[
            [
              <C key="b">registry:block</C>,
              String(BLOCK_COUNT),
              <>
                <C>components/{'{id}'}.tsx</C>
              </>,
            ],
            [
              <C key="p">registry:page</C>,
              String(PAGE_COUNT),
              <>
                <C>app/{'{id}'}/page.tsx</C>
              </>,
            ],
            [
              <C key="s">registry:base</C>,
              '1',
              <>your stylesheet&rsquo;s <C>:root</C> and <C>.dark</C></>,
            ],
          ]}
        />
        <Callout>
          Blocks land directly in <C>components/</C>, not a nested folder,
          because pages import them as <C>@/components/{'{id}'}</C>. If you
          already have a file by that name the CLI will ask before overwriting.
        </Callout>
      </DocsSection>

      <DocsSection id="agents" title="From an agent">
        <p>
          Once the registry is in <C>components.json</C>, the shadcn MCP server
          that ships with CLI v4 can search and install from it without you
          typing a command — ask for a pricing section from the{' '}
          <C>@hoverlab</C> registry and it resolves the item, its dependencies
          and its install command on its own.
        </p>
        <p>
          This sits alongside{' '}
          <Link href="/docs/mcp">Hoverlab&rsquo;s own MCP server</Link>, which
          goes further: it searches all four tiers, scaffolds whole templates,
          and matches a Figma frame against the catalog. Use the shadcn registry
          when you want the standard tool; use ours when you want the rest of
          the ladder.
        </p>
      </DocsSection>

      <DocsSection id="urls" title="The endpoints">
        <DocsTable
          head={['URL', 'What it returns']}
          rows={[
            [
              <C key="i">/registry.json</C>,
              'Every item — names, types, descriptions, dependencies. No file contents.',
            ],
            [
              <C key="i2">/r/{'{name}'}.json</C>,
              'One item, with its source inlined. This is what the CLI fetches.',
            ],
          ]}
        />
        <p>
          Both are CORS-open and cacheable, and neither needs a token. If you
          would rather not use shadcn at all, the same catalog is available
          through <Link href="/docs/api">the public API</Link> and{' '}
          <Link href="/docs/cli">npx hoverlab</Link>.
        </p>
      </DocsSection>

      <DocsSection id="limits" title="What is not in it yet">
        <p>
          Effects are not published as registry items. They are raw CSS, and the
          registry format wants a structured object rather than a stylesheet, so
          shipping all of them means a conversion that has to be proven correct
          across the whole catalog rather than assumed. Until that lands,
          install effects with{' '}
          <Link href="/docs/cli">
            <C>npx hoverlab add</C>
          </Link>{' '}
          or copy them from the site.
        </p>
        <p>
          Templates are not registry items either, for a simpler reason: a
          template is a whole project, and <C>npx hoverlab init</C> already
          scaffolds one.
        </p>
      </DocsSection>
    </>
  )
}
