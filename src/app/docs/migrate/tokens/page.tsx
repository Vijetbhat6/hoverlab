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
import tokens from '@/lib/generated-dna.json'
import { BRAND_IDS } from '@/lib/dna'
import {
  EXPORT_FILES,
  MIGRATION_FILES,
  MIGRATION_ROUTES,
  TOKEN_MAPPING,
} from '@/lib/migration/cli-reference'
import { findGuide, guidePath } from '@/lib/migration/guides'
import { F, MigrateBreadcrumbs, OtherGuides, migrateMetadata } from '../migrate-parts'

const GUIDE = findGuide('tokens')
const COLOR_KEYS = tokens.colorKeys as string[]

export const metadata: Metadata = migrateMetadata({
  title: GUIDE.title,
  description: GUIDE.description,
  canonical: guidePath(GUIDE.slug),
  keywords: [
    'tailwind config to css variables',
    'tailwind v4 @theme',
    'design tokens dtcg figma',
    'shadcn theme tokens',
  ],
})

/*
 * The alias block. Typed, because the right-hand names are the reader's and
 * illustrative; the left-hand ones are not, and `migration.test.ts` reads this
 * file and checks each against the export's real token list.
 */
const ALIAS_EXAMPLE = `:root {
  /* Left: the names Hoverlab blocks read. Right: yours. */
  --background: var(--surface-0);
  --foreground: var(--text-1);
  --card: var(--surface-1);
  --card-foreground: var(--text-1);
  --primary: var(--brand-600);
  --primary-foreground: var(--on-brand);
  --muted: var(--surface-2);
  --muted-foreground: var(--text-2);
  --border: var(--line);
  --input: var(--line);
  --ring: var(--brand-600);
  /* …and the rest of the list above, until none is missing. */
}`

const V4_MAPPING = `@theme inline {
${COLOR_KEYS.slice(0, 3)
  .map((key) => `  --color-${key}: var(--${key});`)
  .join('\n')}
  /* one line per token, through ${COLOR_KEYS[COLOR_KEYS.length - 1]} */
}`

export default function TokensGuidePage() {
  return (
    <>
      <MigrateBreadcrumbs guide={GUIDE} />

      <DocsTitle
        eyebrow="Migrate · 2 of 3"
        title={GUIDE.title}
        intro={
          <>
            Blocks style themselves through a fixed set of semantic colour names.
            Getting them to look like your product is a matter of making those
            names resolve to your values — and there are two colour formats in
            play, which is where this goes wrong. This page is precise about
            which export file is a Tailwind v4 <C>@theme</C> block and which is
            not.
          </>
        }
      />

      <DocsSection id="what-blocks-read" title="What blocks read">
        <p>
          A block never writes a colour. It writes <C>bg-card</C>,{' '}
          <C>text-muted-foreground</C>, <C>border-border</C>. For those to mean
          anything your project needs two things: a CSS variable for each name,
          and a way for Tailwind to turn the name into a utility. The names are:
        </p>
        <p className="font-mono text-xs leading-relaxed text-foreground">
          {COLOR_KEYS.map((key) => `--${key}`).join('  ')}
        </p>
        <p>
          Plus <C>--radius</C>, which the corner utilities derive from, and dark
          mode as a <C>.dark</C> class on an ancestor — the token files switch
          values on it.
        </p>
      </DocsSection>

      <DocsSection id="two-formats" title="Two colour formats — do not mix them">
        <DocsTable
          head={['', 'HSL channels', 'Finished colours']}
          rows={[
            [
              'Looks like',
              <>
                <C>--primary: 243 75% 59%;</C>
              </>,
              <>
                <C>--primary: oklch(0.52 0.19 250);</C>
              </>,
            ],
            [
              'Used as',
              <>
                <C>hsl(var(--primary))</C> in the Tailwind mapping
              </>,
              <>
                <C>var(--primary)</C> in the Tailwind mapping
              </>,
            ],
            [
              'Emitted by',
              <>
                The scaffolded templates&rsquo; <C>globals.css</C>, and the
                token export&rsquo;s <C>{EXPORT_FILES.css}</C>
              </>,
              <>
                The registry&rsquo;s <C>@hoverlab/hoverlab</C> and preset items,
                and the free{' '}
                <Link href={MIGRATION_ROUTES.themeTool} className="text-primary underline underline-offset-2">
                  theme generator
                </Link>
              </>,
            ],
          ]}
        />
        <p>
          The mapping and the variables have to agree. <C>hsl(var(--primary))</C>{' '}
          around an <C>oklch(…)</C> value is not a colour, so the declaration
          silently does not apply — no error, the button is just the wrong
          colour or none. The reverse fails the same way. When a block looks
          unstyled or oddly transparent after a token change, this is the first
          thing to check.
        </p>
      </DocsSection>

      <DocsSection id="map" title="Map your names onto ours">
        <p>
          These pairings are suggestions — your names will differ. The right-hand
          column is what blocks actually read.
        </p>
        <DocsTable
          head={['If yours is…', 'Hoverlab reads', 'Used for']}
          rows={TOKEN_MAPPING.map((row) => [
            row.yours,
            <C key={row.hoverlab}>{row.hoverlab}</C>,
            row.note,
          ])}
        />
        <p>
          The least invasive route keeps your variables where they are and adds
          Hoverlab&rsquo;s names beside them, defined in terms of yours. No
          value is copied, so there is still one place to change a colour.
        </p>
        <Snippet label="globals.css">{ALIAS_EXAMPLE}</Snippet>
        <p>
          Aliasing keeps whatever format your variables are in, so the Tailwind
          mapping below has to match it: channels take <C>hsl(var(--x))</C>,
          finished colours take <C>var(--x)</C>.
        </p>
      </DocsSection>

      <DocsSection id="which-file" title="Which export file is what">
        <p>
          The design-system export produces these. The palette on{' '}
          <Link href={MIGRATION_ROUTES.designSystem} className="text-primary underline underline-offset-2">
            /design-system
          </Link>{' '}
          is live for anyone; downloading the files is a Pro feature.
        </p>
        <DocsTable
          head={['File', 'What it is', 'A Tailwind v4 @theme block?']}
          rows={[
            [
              <C key="css">{EXPORT_FILES.css}</C>,
              <>
                Plain CSS variables on <C>:root</C> and <C>.dark</C>, as HSL
                channels.
              </>,
              <>
                <strong className="text-foreground">Not for colours.</strong> It
                carries an <C>@theme</C> block only for the shape: if you moved
                the spacing or type-scale sliders it adds <C>--spacing</C> and
                the <C>--text-*</C> ramp there, which v4 reads and v3 ignores.
              </>,
            ],
            [
              <C key="v4">{EXPORT_FILES.tailwindV4}</C>,
              <>
                Maps each token to a utility, as <C>{'--color-{name}: hsl(var(--{name}))'}</C>,
                plus a radius scale and a class-based dark variant.
              </>,
              <>
                <strong className="text-foreground">Yes</strong> — an{' '}
                <C>@theme inline</C> block. Tailwind v4 only.
              </>,
            ],
            [
              <C key="v3">{EXPORT_FILES.tailwindV3}</C>,
              <>
                A <C>theme.extend</C> object for <C>tailwind.config</C>.
              </>,
              <>
                <strong className="text-foreground">No.</strong> A JavaScript
                config. Tailwind v3 only.
              </>,
            ],
            [
              <span key="j">
                <C>{EXPORT_FILES.dtcgLight}</C> / <C>{EXPORT_FILES.dtcgDark}</C>
              </span>,
              'W3C design tokens: colour, radius, spacing and type, one file per mode.',
              'No. For design tools and token pipelines.',
            ],
            [
              <C key="sd">{EXPORT_FILES.styleDictionary}</C>,
              'Builds the two design-token files into CSS and JS with Style Dictionary.',
              'No. For teams feeding other platforms.',
            ],
            [
              <span key="fv">
                <C>{EXPORT_FILES.figmaVariables}</C> / <C>{EXPORT_FILES.figmaPush}</C>
              </span>,
              'One Figma collection with Light and Dark modes, and the script that sends it.',
              'No. Figma Enterprise plan only.',
            ],
            [
              <C key="cfg">{EXPORT_FILES.config}</C>,
              'The brand as four numbers, for the CLI.',
              'No.',
            ],
          ]}
        />
        <p>
          You need <C>{EXPORT_FILES.css}</C> plus <em>one</em> of the two Tailwind
          files. The pair does nothing apart: the first declares{' '}
          <C>--primary</C>, the second is what makes <C>bg-primary</C> a class.
        </p>
      </DocsSection>

      <DocsSection id="v4" title="Wiring it into Tailwind v4">
        <Snippet label="app/globals.css">{`@import "tailwindcss";
@import "./${EXPORT_FILES.css}";
@import "./${EXPORT_FILES.tailwindV4}";`}</Snippet>
        <p>
          All three are <C>@import</C> rules, and CSS ignores an import that
          comes after any other rule — so they go at the very top. If your
          project already declares a <C>dark</C> variant, delete the{' '}
          <C>@custom-variant dark</C> line from <C>{EXPORT_FILES.tailwindV4}</C>.
        </p>
        <p>
          If your variables are finished colours instead — from the free
          generator, or your own — the mapping is the one without{' '}
          <C>hsl()</C>. The generator writes it for you; by hand it is one line
          per token:
        </p>
        <Snippet label="globals.css">{V4_MAPPING}</Snippet>
      </DocsSection>

      <DocsSection id="v3" title="Wiring it into Tailwind v3">
        <p>
          Merge the exported <C>extend</C> keys into your config rather than
          replacing it, and keep <C>darkMode</C> on <C>class</C> so the{' '}
          <C>.dark</C> block applies.
        </p>
        <Snippet label="tailwind.config.ts">{`import type { Config } from 'tailwindcss'
import brand from './tailwind-theme.v3'

const config: Config = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: { ...brand.extend.colors /* , your own */ },
      borderRadius: { ...brand.extend.borderRadius },
    },
  },
}

export default config`}</Snippet>
        <p>
          And put the <C>:root</C> / <C>.dark</C> blocks from{' '}
          <C>{EXPORT_FILES.css}</C> in your stylesheet. If it has an{' '}
          <C>@theme</C> block at the bottom, delete it: v3 has no such rule.
        </p>
      </DocsSection>

      <DocsSection id="figma" title="For your designers">
        <p>
          <C>{EXPORT_FILES.dtcgLight}</C> and <C>{EXPORT_FILES.dtcgDark}</C> are
          W3C design-token documents with hex values, one per mode, because DTCG
          has no settled syntax for modes and tools disagree about it. Import
          each into a variables plugin that reads DTCG, the dark file as a
          second mode on the same collection. The export&rsquo;s own README names
          the importers it was written against.
        </p>
        <p>
          On a Figma Enterprise plan, <C>{EXPORT_FILES.figmaVariables}</C> skips
          the two-import step: it is the body of Figma&rsquo;s Variables API, with
          Light and Dark already modes of one collection, and{' '}
          <C>{EXPORT_FILES.figmaPush}</C> sends it. Figma only allows that call on
          Enterprise, so the DTCG files stay the route for every other plan.
        </p>
      </DocsSection>

      <DocsSection id="cli" title="What the CLI does with a brand">
        <p>
          Put <C>{MIGRATION_FILES.config.name}</C> in your project root and{' '}
          <C>npx hoverlab add</C> tints <em>effects</em> to match it. Blocks and
          pages ignore the file entirely: they follow your tokens, which is the
          whole point of this page. The effect tinting is a hue rotation and a
          saturation shift, an approximation that moves every colour in the
          effect, including deliberately neutral ones. An explicit hue or
          saturation flag on the command overrides it.
        </p>
        <p>
          A separate job, for AI tools rather than your build:{' '}
          <C>npx hoverlab dna --brand indigo --out DESIGN.md</C> writes the
          design system as one document to paste into an agent. <F>--brand</F>{' '}
          takes a preset id ({BRAND_IDS.join(', ')}), not an arbitrary colour, and
          the command changes nothing in your project. <F>--out</F> writes a file
          instead of printing.
        </p>
      </DocsSection>

      <DocsSection id="check" title="If it does not look right">
        <DocsTable
          head={['You see', 'Usually']}
          rows={[
            [
              'Blocks render with no colour at all',
              <>
                The utilities do not exist: the Tailwind mapping is missing or
                not imported. <C>bg-card</C> is not a class until it is.
              </>,
            ],
            [
              'Some colours right, some black or transparent',
              'Mixed formats: a channels variable behind var(), or a finished colour inside hsl().',
            ],
            [
              'Dark mode never switches',
              <>
                Nothing puts <C>.dark</C> on an ancestor, or v3 has{' '}
                <C>darkMode</C> unset, or v4 has no <C>dark</C> variant.
              </>,
            ],
            [
              'Spacing or type looks off after a v4 import',
              <>
                The <C>@theme</C> shape block in <C>{EXPORT_FILES.css}</C>{' '}
                changed <C>--spacing</C> or the type ramp for your whole
                project, not just the blocks. Delete the block to undo it.
              </>,
            ],
          ]}
        />
        <Callout>
          The free route needs no export at all: the{' '}
          <Link href={MIGRATION_ROUTES.themeTool} className="text-primary underline underline-offset-2">
            theme generator
          </Link>{' '}
          emits finished colours and the v4 mapping together, and a whole
          preset installs with <C>npx shadcn add @hoverlab/preset-console</C>.
        </Callout>
      </DocsSection>

      <OtherGuides current={GUIDE.slug} />
    </>
  )
}
