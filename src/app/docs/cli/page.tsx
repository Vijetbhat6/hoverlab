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
            [
              <C key="o">outdated</C>,
              'List installed artifacts the catalog has changed since. Reads only.',
            ],
            [
              <C key="d">diff &lt;id…&gt;</C>,
              'Show what changed between your copy and the current one',
            ],
            [<C key="m">mcp</C>, 'Run the MCP server over stdio, for editor agents'],
            [
              <C key="au">audit-url &lt;url&gt;</C>,
              'Audit a deployed page in a real browser: contrast, design drift, right-to-left breakage',
            ],
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

      <DocsSection id="updates" title="Keeping up to date">
        <p>
          Hoverlab installs source you own, which is the point — and the reason
          a fix to a block could never reach you once it was in your repo.{' '}
          <C>add</C> now records what it wrote in a{' '}
          <C>hoverlab.lock.json</C> beside your <C>package.json</C>, and{' '}
          <C>outdated</C> compares that against the catalog.
        </p>

        <Snippet label="terminal">{`# what has moved on since you installed it
npx hoverlab outdated

# what actually changed in one of them
npx hoverlab diff pricing-tiers

# machine-readable, for CI
npx hoverlab outdated --json`}</Snippet>

        <p>
          <strong className="text-foreground">Neither command writes.</strong>{' '}
          There is deliberately no <C>--fix</C>. The file is yours and you have
          probably edited it; a command that overwrote local changes on the
          strength of a hash comparison would be the most destructive thing
          this CLI could do. <C>diff</C> shows you what changed and the merge
          is your call.
        </p>

        <Callout>
          Nothing about your project is sent. <C>outdated</C> fetches every
          fingerprint and compares locally, so the request does not reveal
          which artifacts you have installed.
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

      <DocsSection id="audit-url" title="Auditing a deployed page">
        <p>
          <C>review</C> reads your source. <C>audit-url</C> loads the running
          site in a real browser and reports what only exists once a page is
          rendered: the contrast ratio of text against the background actually
          underneath it, spacing and colour that drift from the
          site&apos;s own scale, and what breaks when the page is laid out
          right-to-left. Each finding names the closest tool, primitive or
          command in the catalog.
        </p>

        <Snippet label="terminal">{`npx hoverlab audit-url https://staging.example.com

# also load it with dir=rtl and report what breaks
npx hoverlab audit-url http://localhost:3000 --dir rtl

# a phone-sized viewport, dark scheme, and more pages on the same origin
npx hoverlab audit-url https://example.com --viewport mobile --dark --pages /pricing,/docs

# machine-readable, or a pull-request comment body
npx hoverlab audit-url https://example.com --json
npx hoverlab audit-url https://example.com --format markdown`}</Snippet>

        <p>
          <strong className="text-foreground">Tokens are inferred, not assumed.</strong>{' '}
          Nothing here compares your site to Hoverlab&apos;s design. It reads
          the computed values your page painted, works out the scale they
          follow (a 4px spacing grid, a handful of radii and type sizes) and
          reports the values that break it: a <C>13px</C> padding on a 4px
          grid, a <C>7px</C> radius among <C>8px</C> ones, a near-duplicate
          grey. Only rare values close to a dominant one are reported, and
          every finding carries its counts so you can overrule it.
        </p>

        <DocsTable
          head={['Flag', 'Effect']}
          rows={[
            [<C key="vp">--viewport &lt;v&gt;</C>, 'WIDTHxHEIGHT, or mobile | tablet | desktop. Default 1280x800'],
            [<C key="dir">--dir rtl</C>, 'Load the page a second time with dir=rtl injected before any script, and compare'],
            [<C key="dark">--dark</C>, 'Emulate prefers-color-scheme: dark'],
            [<C key="pg">--pages &lt;a,b&gt;</C>, 'Extra paths on the same origin, at most ten. Other origins are refused'],
            [<C key="fmt">--format &lt;f&gt;</C>, 'terminal (default) | markdown | json. --json is the same as --format json'],
            [<C key="strict">--strict</C>, 'Advisories fail the run as well'],
            [<C key="axe">--no-axe</C>, 'Skip axe-core even when it is installed'],
          ]}
        />

        <p>
          <strong className="text-foreground">It needs Playwright.</strong>{' '}
          The CLI itself has no dependencies, so the browser driver is not
          installed with it. Add it to the project you run the command from:
        </p>
        <Snippet label="terminal">{`npm i -D playwright && npx playwright install chromium`}</Snippet>
        <p>
          Without it the command prints that line and exits with code 2. If
          Playwright&apos;s Chromium is missing but Chrome or Edge is
          installed, that is used instead. axe-core is optional: when it can
          be found its contrast results are merged in, and the built-in
          measurement works without it.
        </p>

        <Callout>
          <strong className="text-foreground">Exit codes.</strong>{' '}
          <C>0</C> nothing that fails the run, <C>1</C> at least one violation
          (contrast, or right-to-left content cut off or overflowing),{' '}
          <C>2</C> the audit could not run. Advisories never fail a run unless
          you pass <C>--strict</C>. Nothing is uploaded: the page is loaded by
          a browser on your machine.
        </Callout>

        <p>
          It reports what it measured and says what it did not: text over
          images and gradients, hover and focus states, pages behind a login,
          and real Arabic or Hebrew copy are outside what one rendering can
          show.
        </p>
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
                {/* Underlined at rest, not just on hover: inside a sentence
                    this is the WCAG 1.4.1 case, where colour alone cannot be
                    the only thing marking a link. The standalone links in
                    these tables are not in a text block and do not need it. */}
                <Link
                  href="/docs/api#block-html"
                  className="text-primary underline underline-offset-2"
                >
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
          <Link href="/mcp" className="font-medium text-primary hover:underline">
            the MCP docs
          </Link>
          .
        </p>
      </DocsSection>
    </>
  )
}
