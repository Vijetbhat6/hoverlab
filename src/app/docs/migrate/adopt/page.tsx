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
import { COMMERCIAL_LICENSE, FREE_LICENSE } from '@/lib/license'
import {
  LOCKFILE_FIELDS,
  MIGRATION_ENV,
  MIGRATION_EXAMPLE_IDS,
  MIGRATION_FILES,
  MIGRATION_ROUTES,
} from '@/lib/migration/cli-reference'
import { findGuide, guidePath } from '@/lib/migration/guides'
import { siteUrl } from '@/lib/site'
import { F, MigrateBreadcrumbs, OtherGuides, migrateMetadata } from '../migrate-parts'

const GUIDE = findGuide('adopt')
const origin = siteUrl.replace(/\/$/, '')
const BLOCK = MIGRATION_EXAMPLE_IDS.block
const PAGE = MIGRATION_EXAMPLE_IDS.page
const EFFECT = MIGRATION_EXAMPLE_IDS.effect
const LOCK = MIGRATION_FILES.lockfile.name

export const metadata: Metadata = migrateMetadata({
  title: GUIDE.title,
  description: GUIDE.description,
  canonical: guidePath(GUIDE.slug),
  keywords: [
    'add tailwind blocks to existing project',
    'npx shadcn add registry',
    'tailwind v3 v4 components',
    'hoverlab add',
  ],
})

/*
 * The lockfile, drawn from the field names the CLI writes.
 *
 * The values are made up; the keys are asserted against `lockfile.mjs` in the
 * test, so this cannot drift into showing a field the CLI does not record.
 */
const LOCK_EXAMPLE = `{
  "${LOCKFILE_FIELDS[0]}": 1,
  "${LOCKFILE_FIELDS[1]}": {
    "${BLOCK}": {
      "${LOCKFILE_FIELDS[2]}": "block",
      "${LOCKFILE_FIELDS[3]}": "3fa9c01b7d2e",
      "${LOCKFILE_FIELDS[5]}": "2026-09-21",
      "${LOCKFILE_FIELDS[6]}": ["components/${BLOCK}.tsx"],
      "${LOCKFILE_FIELDS[7]}": {
        "components/${BLOCK}.tsx": "sha256:…"
      }
    }
  }
}`

export default function AdoptGuidePage() {
  return (
    <>
      <MigrateBreadcrumbs guide={GUIDE} />

      <DocsTitle
        eyebrow="Migrate · 1 of 3"
        title={GUIDE.title}
        intro={
          <>
            Add blocks, pages and effects to an app that already runs. What to
            check first, what changes between Tailwind v3 and v4, exactly where
            the files land, and the two ways to install: our CLI, or the shadcn
            CLI you may already use.
          </>
        }
      />

      <DocsSection id="check" title="Check three things first">
        <DocsTable
          head={['Question', 'Why it matters', 'How to tell']}
          rows={[
            [
              'Is it React?',
              <>
                Blocks, pages and primitives are React with Tailwind classes and
                ship as written — there is no Vue or Svelte port of a block.
                Effects are plain CSS and work anywhere.
              </>,
              <>
                <C>react</C> or <C>next</C> in <C>package.json</C>. In a
                non-React project <C>add</C> still writes the files and says so.
              </>,
            ],
            [
              'Tailwind v3 or v4?',
              'The blocks use utility classes; how a token name like bg-card becomes one differs between the two.',
              <>
                Next section.
              </>,
            ],
            [
              <>Does <C>@/</C> resolve?</>,
              <>
                A page imports its blocks as <C>@/components/{'{id}'}</C>. If
                your alias points somewhere else, the imports fail at build time
                — not at install.
              </>,
              <>
                <C>paths</C> in <C>tsconfig.json</C>. With a <C>src/</C> folder
                it should be <C>{'"@/*": ["./src/*"]'}</C>; without one,{' '}
                <C>{'"@/*": ["./*"]'}</C>.
              </>,
            ],
          ]}
        />
      </DocsSection>

      <DocsSection id="tailwind" title="Tailwind v3 or v4">
        <DocsTable
          head={['', 'Tailwind v3', 'Tailwind v4']}
          rows={[
            [
              'How to tell',
              <>
                <C>tailwindcss</C> 3.x, a <C>tailwind.config.*</C> file, and{' '}
                <C>@tailwind base;</C> in your CSS.
              </>,
              <>
                <C>tailwindcss</C> 4.x, <C>@import &quot;tailwindcss&quot;;</C> in your
                CSS, and usually no config file.
              </>,
            ],
            [
              <>Where <C>bg-card</C> comes from</>,
              <>
                <C>theme.extend.colors</C> in <C>tailwind.config</C>.
              </>,
              <>
                A <C>@theme</C> block in your CSS.
              </>,
            ],
            [
              'Finding the files you add',
              <>
                <C>content</C> must list the folders they land in, or the
                classes are never generated.
              </>,
              'Automatic. There is no content list to keep.',
            ],
            [
              'What Hoverlab ships for it',
              <>
                Every scaffolded template is v3 — a <C>tailwind.config.ts</C>{' '}
                plus <C>@tailwind</C> directives — and the token export has a
                v3 file.
              </>,
              <>
                This site runs v4, so every block preview you see here is a v4
                render. The token export has a v4 file, and the registry
                presets are v4-style.
              </>,
            ],
          ]}
        />
        <p>
          <strong className="text-foreground">The CLI does not read your Tailwind version.</strong>{' '}
          It looks for <C>tailwindcss</C> in your dependencies only to decide
          what format to write an effect in, and it never edits your config or
          your stylesheet. So an installed block compiles under either major,
          <em> provided your project defines the token names it uses</em>.
          Without them <C>bg-card</C> generates no CSS and the block renders
          unstyled. That step is the{' '}
          <Link
            href={guidePath('tokens')}
            className="text-primary underline underline-offset-2"
          >
            tokens guide
          </Link>
          .
        </p>
        <Callout>
          Blocks were written with the v3 spelling of four utilities whose
          defaults v4 moved by a step: <C>shadow-sm</C>, <C>rounded-sm</C>,{' '}
          <C>ring</C> and <C>outline-none</C>. Under v4 they still work and look
          fractionally different. Nothing in the block, page or primitive
          sources uses a utility v4 removed or one that only v4 has — that is
          checked by a test against the source, so it stays true. It is not the
          same as having tried every block in every v4 project.
        </Callout>
      </DocsSection>

      <DocsSection id="cli" title="Install with the CLI">
        <Snippet label="terminal">{`# what would be written — writes nothing
npx hoverlab add ${BLOCK} --dry-run

# for real
npx hoverlab add ${BLOCK}

# a page, plus every block it imports
npx hoverlab add ${PAGE}

# an effect, into a folder you choose
npx hoverlab add ${EFFECT} --dir src/styles/effects`}</Snippet>

        <DocsTable
          head={['You add', 'Lands at', 'Note']}
          rows={[
            [
              'A block or primitive',
              <>
                <C>components/{'{id}'}.tsx</C>
              </>,
              <>
                Under <C>src/</C> if your project has <C>src/app</C>,{' '}
                <C>src/components</C> or <C>src/pages</C>; at the project root
                otherwise. Not a preference — pages import blocks by this path.
              </>,
            ],
            [
              'A page',
              <>
                <C>app/{'{id}'}.tsx</C>
              </>,
              <>
                A file under <C>app/</C>, <em>not</em> a route yet. Move it to{' '}
                <C>app/your-route/page.tsx</C> — it has a default export — and
                its blocks come with it into <C>components/</C>.
              </>,
            ],
            [
              'An effect',
              <>
                A <C>hoverlab/</C> folder inside your components or styles
                directory
              </>,
              <>
                Output follows your project: React, Vue, Svelte, plain CSS or
                Tailwind utilities.
              </>,
            ],
          ]}
        />
        <p>
          <F>--dir</F> overrides the destination. For a block or page it is the
          root the <C>components/…</C> and <C>app/…</C> paths hang from; for an
          effect it is the folder the CSS lands in.
        </p>
        <p>
          If a block needs a package you do not have, <C>add</C> prints the{' '}
          <C>npm i</C> line for it and does not run it. Nothing is installed
          behind your back.
        </p>
      </DocsSection>

      <DocsSection id="lockfile" title={`What ${LOCK} records`}>
        <p>
          Every real <C>add</C> writes a record of what it installed, in the
          directory you ran it from, so <C>outdated</C>, <C>diff</C> and{' '}
          <C>update</C> have something to compare against later. It is meant to
          be committed.
        </p>
        <Snippet label={LOCK}>{LOCK_EXAMPLE}</Snippet>
        <ul className="list-disc space-y-2 ps-5">
          <li>
            <C>revision</C> is a fingerprint of the file bodies — not their
            paths, not the catalog metadata — so moving a file does not make
            it look stale.
          </li>
          <li>
            <C>hashes</C> are SHA-256 of each file exactly as it was written.
            They are how <C>update</C> proves you have not edited a file.
          </li>
          <li>
            Paths are relative and forward-slashed, and there is no absolute
            path, user name or timestamp beyond the install date, so a lockfile
            committed on Windows reads correctly in CI.
          </li>
          <li>
            <C>framework</C> is recorded for effects only — the catalog
            generates an effect per framework, and comparing your React copy
            against the CSS version would report the whole file as changed.
          </li>
        </ul>
        <Callout>
          Only <C>add</C> writes it. <C>hoverlab init</C> scaffolds a template
          without recording it, and so does <C>npx shadcn add</C>. Those files
          are yours from the first minute, but <C>outdated</C> cannot see them.
          The updates guide covers how to bring one under tracking.
        </Callout>
      </DocsSection>

      <DocsSection id="shadcn" title="Or with npx shadcn add">
        <p>
          If your project already uses shadcn/ui, you do not need our CLI. The
          catalog is a public registry, so point <C>components.json</C> at it
          once:
        </p>
        <Snippet label="components.json">{`{
  "registries": {
    "@hoverlab": "${origin}/r/{name}.json"
  }
}`}</Snippet>
        <Snippet label="terminal">{`npx shadcn add @hoverlab/${BLOCK}
npx shadcn add @hoverlab/${PAGE}`}</Snippet>
        <p>
          The index is <C>{MIGRATION_ROUTES.registry}</C>. Setup and search are
          in{' '}
          <Link href="/docs/registry" className="text-primary underline underline-offset-2">
            the registry docs
          </Link>
          ; what follows is what changes when the project is not new.
        </p>

        <DocsTable
          head={['', 'npx hoverlab add', 'npx shadcn add @hoverlab/…']}
          rows={[
            [
              'A page lands at',
              <>
                <C>app/{'{id}'}.tsx</C>, a file to move
              </>,
              <>
                <C>app/{'{id}'}/page.tsx</C>, already a route
              </>,
            ],
            [
              'Your tokens',
              'Untouched. You wire them, per the tokens guide.',
              <>
                <C>@hoverlab/hoverlab</C> writes them — and replaces any of
                yours with the same names.
              </>,
            ],
            [
              'Update tracking',
              <>
                Recorded in <C>{LOCK}</C>
              </>,
              'Not recorded.',
            ],
            [
              'Needs',
              'Node. No config.',
              <>
                A <C>components.json</C> in your project.
              </>,
            ],
          ]}
        />

        <Callout>
          <strong className="text-foreground">Read this before installing the base item.</strong>{' '}
          <C>npx shadcn add @hoverlab/hoverlab</C> writes finished colours —{' '}
          <C>oklch(…)</C> values — into <C>:root</C> and <C>.dark</C>, replacing
          any variable of the same name. If your Tailwind v3 config wraps those
          variables as <C>hsl(var(--primary))</C>, an <C>oklch</C> value inside
          it is not a colour and the utility stops working. Either skip the base
          item and keep your tokens, or move to <C>var(--primary)</C> first. We
          have not tested the shadcn CLI against a v3 project, so treat that
          path as unverified. The tokens guide explains the two formats.
        </Callout>
      </DocsSection>

      <DocsSection id="after" title="After the install">
        <Snippet label="terminal">{`git status                 # exactly what was written
npm run build              # does it compile?
npx hoverlab review        # accessibility, RTL, reduced-motion — on what you changed`}</Snippet>
        <p>
          <C>review</C> reads your uncommitted changes — the files you just
          added included — and runs entirely on your machine.
        </p>
        <p>
          <C>add</C> also reports the ids it installed, so the catalog can rank
          what is being used. Nothing else about your project is in that
          request, and setting <C>{MIGRATION_ENV[0].name}=1</C> turns it off.
        </p>
      </DocsSection>

      <DocsSection id="licence" title="Which licence you are on">
        <p>
          <strong className="text-foreground">{FREE_LICENSE.name}.</strong>{' '}
          {FREE_LICENSE.summary}
        </p>
        <p>
          <strong className="text-foreground">{COMMERCIAL_LICENSE.name}.</strong>{' '}
          {COMMERCIAL_LICENSE.summary}
        </p>
        <p>
          Adopting a block into a client project or a product you sell is the
          second case. The terms are on{' '}
          <Link href="/licence" className="text-primary underline underline-offset-2">
            the licence page
          </Link>{' '}
          and the price is on{' '}
          <Link href="/pricing" className="text-primary underline underline-offset-2">
            pricing
          </Link>
          .
        </p>
      </DocsSection>

      <OtherGuides current={GUIDE.slug} />
    </>
  )
}
