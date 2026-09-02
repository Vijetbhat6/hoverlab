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
import { TOTAL_COUNT } from '@/lib/catalog-stats'
import { PATHS } from '@/lib/paths/catalog'
import { DESIGN_PRESETS } from '@/lib/registry/presets'

/** Guided paths, published as packs. Derived, never typed out. */
const PATH_COUNT = PATHS.length

/**
 * Everything `/registry.json` publishes, counted the way
 * `registryItemNames()` counts it: the base, then the packs, then the three
 * catalogs.
 *
 * Derived rather than imported from the registry module, which is
 * `server-only` and carries every artifact's source with it — a docs page
 * has no business pulling 1.6 MB of catalog in to print one number. Adding
 * a fifth kind of item means adding it here too, and the arithmetic is
 * stated so that is obvious.
 */
const REGISTRY_ITEM_COUNT =
  1 + DESIGN_PRESETS.length + PATH_COUNT + BLOCK_COUNT + PAGE_COUNT + TOTAL_COUNT

/*
 * The path the prose uses as its example, and its real size.
 *
 * Both derived, because a hand-typed "all eight blocks" is precisely the
 * class of claim `scripts/check-claimed-counts.mts` exists to catch — and
 * this file is outside the directory that script scans.
 */
const EXAMPLE_PATH = PATHS.find((p) => p.slug === 'landing-page') ?? PATHS[0]!

const TITLE = 'shadcn registry — Hoverlab Docs'
const DESCRIPTION =
  'Install Hoverlab effects, blocks and pages with npx shadcn add. A public registry.json, no account, no API key.'

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

      <DocsSection id="presets" title="Or install a whole design system">
        <p>
          <C>@hoverlab/hoverlab</C> gives you this site&rsquo;s own look. If you
          want a different one, there are {DESIGN_PRESETS.length} named presets
          — each a complete token set covering colour, corner radius, spacing
          density and the type ramp, in one install.
        </p>
        <Snippet label="terminal">{`npx shadcn add @hoverlab/preset-console`}</Snippet>
        <DocsTable
          head={['Preset', 'What it reads as', 'Suits']}
          rows={DESIGN_PRESETS.map((preset) => [
            <C key={preset.name}>{preset.name}</C>,
            preset.note,
            preset.suits,
          ])}
        />
        <p>
          These are <C>registry:base</C> items — the same document a shadcn
          preset code resolves to, published at a URL you can install by name.
          They are not preset <em>codes</em>: those are minted by{' '}
          <C>ui.shadcn.com/create</C> and only shadcn can issue one, so{' '}
          <C>shadcn apply --preset</C> will not take these. The payload and the
          effect on your project are the same.
        </p>
        <Callout>
          Install one <em>before</em> your blocks, and only one. Each preset
          replaces the same variables, so a second install overwrites the first
          rather than merging with it. To adjust one instead of adopting it
          whole, open{' '}
          <Link href="/tools/shadcn">the theme generator</Link> — it emits the
          same kind of item from your own values.
        </Callout>
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
              <C key="e">registry:item</C>,
              TOTAL_COUNT.toLocaleString('en-US'),
              <>your stylesheet, as rules — an effect has no file</>,
            ],
            [
              <C key="pk">path-{'{slug}'}</C>,
              String(PATH_COUNT),
              <>
                every block in a guided path — no file of its own
              </>,
            ],
            [
              <C key="pr">preset-{'{name}'}</C>,
              String(DESIGN_PRESETS.length),
              <>
                a whole design system — <C>@theme</C>, <C>:root</C> and{' '}
                <C>.dark</C>
              </>,
            ],
            [
              <C key="s">registry:base</C>,
              '1',
              <>your stylesheet&rsquo;s <C>:root</C> and <C>.dark</C></>,
            ],
          ]}
        />
        <p>
          The <C>path-</C> items are the {PATH_COUNT} guided paths, published as
          packs. Each one is nothing but a list of registry dependencies, so{' '}
          <C>npx shadcn add @hoverlab/path-{EXAMPLE_PATH.slug}</C> writes all{' '}
          {EXAMPLE_PATH.steps.length} blocks of that path in one pass — and a
          block fixed here is fixed in every pack that references it, because a
          pack holds no copies.{' '}
          <Link href="/paths" className="text-primary underline-offset-4 hover:underline">
            The paths themselves
          </Link>{' '}
          carry the part a registry item cannot: why each block sits where it does.
        </p>
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

      <DocsSection id="search" title="Search runs on our side">
        <p>
          <C>shadcn search</C> normally downloads a registry&rsquo;s whole
          index and filters it in the CLI. At{' '}
          {REGISTRY_ITEM_COUNT.toLocaleString()} items
          that is a few hundred kilobytes to show six rows, so this registry
          implements shadcn&rsquo;s dynamic search instead: the same{' '}
          <C>/registry.json</C> URL takes <C>q</C>, <C>type</C>, <C>limit</C>{' '}
          and <C>offset</C>, matches on our side, and returns the page plus a{' '}
          <C>pagination</C> object.
        </p>
        <Snippet label="terminal">{`npx shadcn search @hoverlab -q "pricing"`}</Snippet>
        <p>
          Nothing to configure — the CLI appends those parameters on its own
          and uses the results as they come back. You can call it directly
          too:
        </p>
        <Snippet label="terminal">{`curl '${origin}/registry.json?q=hero&type=registry:block&limit=5'`}</Snippet>
        <Callout>
          A request with none of those four parameters still returns the
          complete index, unchanged and unpaged. Indexers and the shadcn MCP
          server enumerate the catalog that way, and a page size quietly
          applied to them would make{' '}
          {REGISTRY_ITEM_COUNT.toLocaleString()} items
          look like fifty.
        </Callout>
      </DocsSection>

      <DocsSection id="effects" title="Installing an effect">
        <p>
          An effect is a class and the rules behind it, not a file, so it
          installs into your stylesheet rather than into <C>components/</C>.
          The command is the same as everything else:
        </p>
        <Snippet label="terminal">{`npx shadcn add @hoverlab/btn-gradient`}</Snippet>
        <p>
          That writes the rules — including any <C>@keyframes</C> and{' '}
          <C>@property</C> the effect needs — straight into the stylesheet
          your project already has, and prints the markup to paste. There is
          nothing to import and no dependency to install: effects are CSS, so
          they work in React, Vue, Svelte or a plain HTML file.
        </p>
        <Callout>
          The rules land where the CLI puts CSS, unwrapped by any cascade
          layer, exactly as the catalog serves them. If your project uses
          layers and you want the effect inside one, move the block after
          install — the classes are self-contained and nothing else
          references them.
        </Callout>
      </DocsSection>

      <DocsSection id="limits" title="What is not in it">
        <p>
          Templates are not registry items. A template is a whole project
          rather than a thing you add to one, and <C>npx hoverlab init</C>{' '}
          already scaffolds it — including the config, the routes and the
          dependencies a <C>shadcn add</C> has nowhere to put.
        </p>
      </DocsSection>
    </>
  )
}
