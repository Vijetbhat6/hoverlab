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
import { MIGRATE_INDEX, MIGRATION_GUIDES, guidePath } from '@/lib/migration/guides'
import { MIGRATION_FILES } from '@/lib/migration/cli-reference'
import { F, MigrateBreadcrumbs, migrateMetadata } from './migrate-parts'

export const metadata: Metadata = migrateMetadata({
  title: 'Migrate',
  description: MIGRATE_INDEX.description,
  canonical: MIGRATE_INDEX.path,
  keywords: [
    'add tailwind blocks to existing project',
    'migrate an existing project to hoverlab',
    'move design tokens to tailwind',
    'update copied components',
  ],
})

export default function MigrateIndexPage() {
  return (
    <>
      <MigrateBreadcrumbs />

      <DocsTitle
        eyebrow="Migrate"
        title="Move an existing project onto Hoverlab"
        intro={
          <>
            The rest of these docs start from an empty directory. These three
            start from yours: it already builds, it already has a stylesheet and
            opinions, and the aim is to add to it without breaking what works.
            None of it needs an account.
          </>
        }
      />

      <DocsSection id="guides" title="Pick the one that matches your afternoon">
        <DocsTable
          head={['Guide', 'Read it when']}
          rows={MIGRATION_GUIDES.map((guide) => [
            <Link
              key={guide.slug}
              href={guidePath(guide.slug)}
              className="font-medium text-primary hover:underline"
            >
              {guide.title}
            </Link>,
            guide.situation,
          ])}
        />
        <p>
          They are independent. Most people read the first, need the second only
          if the blocks do not look like their product yet, and come back to the
          third months later — which is why it is short.
        </p>
      </DocsSection>

      <DocsSection id="ground-rules" title="What none of them do">
        <ul className="list-disc space-y-2 ps-5">
          <li>
            <strong className="text-foreground">Overwrite your files.</strong>{' '}
            <C>npx hoverlab add</C> stops if a file already exists, and does
            nothing to it unless you pass <F>--force</F>. <F>--dry-run</F> prints
            the file list first.
          </li>
          <li>
            <strong className="text-foreground">Edit your Tailwind config or your stylesheet.</strong>{' '}
            <C>add</C> writes component files. Wiring tokens into your CSS is a
            step you take, and the tokens guide says exactly which one.
          </li>
          <li>
            <strong className="text-foreground">Send your project anywhere.</strong>{' '}
            The update commands compare fingerprints on your machine — see{' '}
            <Link href={guidePath('updates')} className="text-primary underline underline-offset-2">
              keeping it up to date
            </Link>{' '}
            for the one exception, stated plainly.
          </li>
          <li>
            <strong className="text-foreground">Ask you to sign up.</strong> The
            catalog, the CLI and the token tools are free to use without an
            account.
          </li>
        </ul>
      </DocsSection>

      <DocsSection id="first" title="Before you run anything">
        <p>
          Commit, or stash, so your working tree is clean. Then{' '}
          <C>git status</C> after an install lists exactly what Hoverlab wrote,
          and <C>git checkout .</C> is a complete undo. That is the whole safety
          net, and it is better than any flag.
        </p>
        <Snippet label="terminal">{`git status            # clean?
npx hoverlab help     # every command, in one screen`}</Snippet>
        <Callout>
          Run the CLI from your project root, where <C>package.json</C> is. The
          lockfile it writes, <C>{MIGRATION_FILES.lockfile.name}</C>, goes in the
          directory you ran the command from, and a lockfile in a subfolder is a
          second, separate record.
        </Callout>
      </DocsSection>
    </>
  )
}
