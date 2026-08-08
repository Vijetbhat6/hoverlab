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

const TITLE = 'API — Hoverlab Docs'
const DESCRIPTION =
  'The public /api/v1 surface — search and fetch every effect, block, page and template. No key, no account, CORS open.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/docs/api' },
  openGraph: {
    url: absoluteUrl('/docs/api'),
    title: TITLE,
    description: DESCRIPTION,
    type: 'article',
    siteName: 'Hoverlab',
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
}

/** Shown in samples. Matches whatever origin this deploy actually serves. */
const ORIGIN = siteUrl.replace(/\/+$/, '')

export default function ApiDocsPage() {
  return (
    <>
      <DocsTitle
        eyebrow="API"
        title="The public API"
        intro={
          <>
            Everything the website knows, over HTTP. No key, no account, no rate
            limit worth documenting — the catalog is already fully indexed by
            search engines, so gating it would only break the tools that use it.
          </>
        }
      />

      <DocsSection id="basics" title="Basics">
        <DocsTable
          head={['', '']}
          rows={[
            [<strong key="b" className="text-foreground">Base</strong>, <C key="v">{`${ORIGIN}/api/v1`}</C>],
            [<strong key="a" className="text-foreground">Auth</strong>, 'None. Do not send credentials.'],
            [<strong key="c" className="text-foreground">CORS</strong>, <>Open (<C>*</C>) — callable from a browser</>],
            [<strong key="m" className="text-foreground">Methods</strong>, <><C>GET</C> and <C>OPTIONS</C></>],
          ]}
        />
      </DocsSection>

      <DocsSection id="endpoints" title="Endpoints">
        <p>
          Each tier has the same pair — a list endpoint that searches, and a
          detail endpoint that returns source.
        </p>

        <DocsTable
          head={['Endpoint', 'Returns']}
          rows={[
            [<C key="1">GET /api/v1/effects</C>, 'Search effects — metadata only'],
            [<C key="2">GET /api/v1/effects/{'{id}'}</C>, 'One effect, with HTML + CSS'],
            [<C key="3">GET /api/v1/blocks</C>, 'Search blocks'],
            [<C key="4">GET /api/v1/blocks/{'{id}'}</C>, 'One block, with its source files'],
            [<C key="5">GET /api/v1/pages</C>, 'Search pages'],
            [<C key="6">GET /api/v1/pages/{'{id}'}</C>, 'One page, with its files'],
            [<C key="7">GET /api/v1/templates</C>, 'Search templates'],
            [<C key="8">GET /api/v1/templates/{'{id}'}</C>, 'One template, with every file'],
            [
              <C key="9">GET /api/v1/artifacts/{'{id}'}</C>,
              'Resolves an id against all four tiers — use this when you do not know the tier',
            ],
          ]}
        />
      </DocsSection>

      <DocsSection id="search" title="Searching">
        <DocsTable
          head={['Param', 'Meaning']}
          rows={[
            [<C key="q">q</C>, 'Free-text query over name, category, description and tags'],
            [<C key="c">category</C>, 'Restrict to one category'],
            [<C key="f">featured=true</C>, 'Only curated, hand-written entries'],
            [<C key="l">limit</C>, 'Page size'],
            [<C key="o">offset</C>, 'Page offset'],
          ]}
        />

        <Snippet label="terminal">{`curl "${ORIGIN}/api/v1/blocks?q=pricing&limit=5"
curl "${ORIGIN}/api/v1/effects?category=Buttons&featured=true"`}</Snippet>
      </DocsSection>

      <DocsSection id="detail" title="Fetching source">
        <p>
          Detail responses carry the files at the paths they should be written
          to, so a client can write them out without knowing anything about the
          tier it asked for.
        </p>

        <Snippet label="terminal">{`curl "${ORIGIN}/api/v1/artifacts/pricing-tiers"`}</Snippet>

        <Snippet label="response (trimmed)">{`{
  "version": "v1",
  "level": "block",
  "artifact": { "id": "pricing-tiers", "name": "…", "fileCount": 1, … },
  "files": [
    { "path": "components/pricing-tiers.tsx", "lang": "tsx", "source": "…" }
  ],
  "deps": ["lucide-react"],
  "notes": ["…"],
  "included": []
}`}</Snippet>

        <p>
          Add <C>deep=true</C> to a page or template to pull in everything it is
          composed of — the ids that came along appear in <C>included</C>.
        </p>

        <Snippet label="terminal">{`curl "${ORIGIN}/api/v1/pages/checkout-page?deep=true"`}</Snippet>
      </DocsSection>

      <DocsSection id="frameworks" title="Effects in other frameworks">
        <p>
          An effect is markup plus a stylesheet, so it can be handed to any
          framework without losing anything. Pass <C>framework</C> to the effect
          detail endpoint.
        </p>

        <Snippet label="terminal">{`curl "${ORIGIN}/api/v1/effects/btn-gradient?framework=vue"`}</Snippet>

        <p>
          Valid values: <C>html</C>, <C>css</C>, <C>react</C>, <C>vue</C>,{' '}
          <C>svelte</C>, <C>styled-components</C>, <C>tailwind</C>. The
          customization knobs work here too — <C>hue</C>, <C>sat</C>,{' '}
          <C>scale</C>, <C>speed</C>.
        </p>
      </DocsSection>

      <DocsSection id="block-html" title="Blocks outside React">
        <p>
          There is no <C>framework</C> param for blocks, and that is deliberate.
          A block is hundreds of lines of React with hooks and event handlers;
          a machine translation of it would be a worse block claiming to be the
          same one.
        </p>
        <p>
          What you can have is the block rendered to HTML. Tailwind classes are
          framework-agnostic, so the design transfers intact even though the
          component does not.
        </p>

        <Snippet label="terminal">{`curl "${ORIGIN}/api/v1/blocks/pricing-tiers?format=html"`}</Snippet>

        <Callout>
          The response is one frame: the component in its initial state with the
          handlers gone. For an interactive block — a navbar with a mobile menu,
          a form with pending state — you get the closed, idle markup and re-wire
          the behaviour yourself. The <C>notes</C> array says so on every
          response.
        </Callout>
      </DocsSection>

      <DocsSection id="caching" title="Caching">
        <p>
          An effect id always resolves to the same CSS, so those responses are
          cacheable indefinitely. Block, page and template source is
          hand-written and gets fixed, so it carries a shorter edge cache — an
          accessibility fix should reach the next install, not a year later.
        </p>
      </DocsSection>
    </>
  )
}
