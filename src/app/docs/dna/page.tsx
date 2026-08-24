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
import { BRAND_IDS } from '@/lib/dna'
import { absoluteUrl, siteUrl } from '@/lib/site'

const TITLE = 'Design DNA — Hoverlab'
const DESCRIPTION =
  "The Hoverlab design system as a document an AI tool can read: colour tokens for both themes, radius, spacing, motion and the rules that keep generated UI consistent."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/docs/dna' },
  openGraph: {
    url: absoluteUrl('/docs/dna'),
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    siteName: 'Hoverlab',
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
}

const ORIGIN = siteUrl.replace(/\/$/, '')

export default function DocsDnaPage() {
  return (
    <>
      <DocsTitle
        eyebrow="Design DNA"
        title="Give your AI tool a design system"
        intro={
          <>
            Ask an agent for a pricing page and it invents a design system on
            the spot — a different grey every section, arbitrary radii, a
            palette that falls apart in dark mode. Design DNA is that system
            written down: the tokens, the shape, the motion, and the handful of
            rules that keep generated UI consistent with everything else in the
            catalog.
          </>
        }
      />

      <DocsSection id="use" title="Use it">
        <p>
          Press <strong>Copy Design DNA</strong> on any block, page or template
          and paste the result into your AI tool before you ask it for UI. From
          a terminal, or in a script:
        </p>
        <Snippet label="terminal">{`npx hoverlab dna                       # the whole system
npx hoverlab dna saas-starter          # as that template uses it
npx hoverlab dna pricing-tiers --brand indigo
npx hoverlab dna --out design-dna.md`}</Snippet>
        <p>
          Agents connected over{' '}
          <Link href="/docs/mcp" className="font-medium text-primary hover:underline">
            MCP
          </Link>{' '}
          get the same document from the <C>get_design_dna</C> tool, and the{' '}
          <Link href="/docs/skills" className="font-medium text-primary hover:underline">
            hoverlab skill
          </Link>{' '}
          tells them to reach for it before writing a component by hand.
        </p>
      </DocsSection>

      <DocsSection id="contents" title="What's in it">
        <DocsTable
          head={['Section', 'What it carries']}
          rows={[
            [
              'Colour tokens',
              'Every semantic token in both themes, as the bare HSL channels Tailwind needs for alpha suffixes',
            ],
            ['Brand accent', 'An OKLCH override for --primary and --ring, when a brand preset is applied'],
            ['Shape and type', 'Radius scale, section and card spacing, type rules'],
            ['Motion', 'Duration budget, transition defaults, the reduced-motion contract'],
            ['Rules', 'Semantic classes over literals, surface/foreground pairing, one accent, both themes'],
            ['Composition', 'For a page or template — the blocks and pages it is built from'],
            ['Install', 'The command that fetches the actual source'],
          ]}
        />
        <Callout>
          That last row is the point. A document describing a design leaves an
          agent to rebuild it by hand; this one ends with{' '}
          <C>npx hoverlab add</C>, so the tokens and the components arrive
          together.
        </Callout>
      </DocsSection>

      <DocsSection id="api" title="From the API">
        <p>
          Any catalog id works, at any rung, plus the literal <C>catalog</C> for
          the system on its own. <C>?format=raw</C> returns the markdown itself
          — that is the URL to hand an agent.
        </p>
        <Snippet label="terminal">{`curl "${ORIGIN}/api/v1/dna/catalog?format=raw"
curl "${ORIGIN}/api/v1/dna/checkout-page?format=raw"
curl "${ORIGIN}/api/v1/dna/pricing-tiers?brand=indigo"`}</Snippet>
        <p>
          Without <C>format=raw</C> you get JSON: the same markdown plus the
          token values as data, the resolved brand, and what the artifact is
          composed of.
        </p>
      </DocsSection>

      <DocsSection id="brands" title="Brand presets">
        <p>
          Pass <C>brand</C> to swap the accent for one of the catalog&apos;s
          presets. Each carries a lightness for light mode and another for dark,
          because a single accent lightness that reads on white disappears on
          the dark ground.
        </p>
        <p className="flex flex-wrap gap-1.5">
          {BRAND_IDS.map((id) => (
            <C key={id}>{id}</C>
          ))}
        </p>
      </DocsSection>
    </>
  )
}
