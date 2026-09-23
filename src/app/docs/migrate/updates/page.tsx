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
import { UPDATE_LEDGER } from '@/lib/compare'
import { COMMERCIAL_LICENSE } from '@/lib/license'
import {
  MIGRATION_ENV,
  MIGRATION_EXAMPLE_IDS,
  MIGRATION_FILES,
  MIGRATION_ROUTES,
} from '@/lib/migration/cli-reference'
import { findGuide, guidePath } from '@/lib/migration/guides'
import { siteUrl } from '@/lib/site'
import { F, MigrateBreadcrumbs, OtherGuides, WithCode, migrateMetadata } from '../migrate-parts'

const GUIDE = findGuide('updates')
const origin = siteUrl.replace(/\/$/, '')
const BLOCK = MIGRATION_EXAMPLE_IDS.block
const LOCK = MIGRATION_FILES.lockfile.name

export const metadata: Metadata = migrateMetadata({
  title: GUIDE.title,
  description: GUIDE.description,
  canonical: guidePath(GUIDE.slug),
  keywords: [
    'update copied components',
    'hoverlab outdated',
    'hoverlab update',
    'copy paste components updates',
  ],
})

/** The grants that describe the update window and what is kept, quoted from the licence itself. */
const WINDOW_GRANTS = COMMERCIAL_LICENSE.grants.filter(
  (grant) => /update/i.test(grant) || /already shipped/i.test(grant),
)

export default function UpdatesGuidePage() {
  return (
    <>
      <MigrateBreadcrumbs guide={GUIDE} />

      <DocsTitle
        eyebrow="Migrate · 3 of 3"
        title={GUIDE.title}
        intro={
          <>
            Copying a component is the easy half. The hard half is a year later,
            when a bug in it has been fixed upstream and your copy has not.
            This is how you find out, how you look at the change, and how you
            take it without losing your own edits.
          </>
        }
      />

      <DocsSection id="loop" title="The loop">
        <Snippet label="terminal">{`# 1. what has moved on since you installed it (reads only)
npx hoverlab outdated

# 2. what actually changed in one of them
npx hoverlab diff ${BLOCK}

# 3. take it — but look first
npx hoverlab update ${BLOCK} --dry-run
npx hoverlab update ${BLOCK}`}</Snippet>
        <p>
          All three read <C>{LOCK}</C>, which <C>npx hoverlab add</C> wrote when
          you installed. No lockfile, nothing to compare, and the commands say
          so rather than guess.
        </p>
      </DocsSection>

      <DocsSection id="outdated" title="outdated: what changed">
        <Snippet label="terminal (revisions are illustrative)">{`! 1 of 3 have changed in the catalog:

  ${BLOCK} (block)
    3fa9c01b7d2e -> 8b17d4e02c9a  ·  updated 2026-08-12

See what changed: hoverlab diff ${BLOCK}
Nothing has been written. Your copies are untouched.`}</Snippet>
        <p>
          <C>outdated</C> never writes and has no fix flag, deliberately. It
          compares one fingerprint per artifact, and a fingerprint difference
          says the catalog&rsquo;s file changed — not that yours did not.
          Overwriting on that evidence would be the most destructive thing this
          CLI could do, so it does not.
        </p>
        <p>
          A tracked id that is no longer in the catalog is listed separately as
          not found; it may have been renamed or retired. For CI, add{' '}
          <F>--json</F>:
        </p>
        <Snippet label="terminal">{`npx hoverlab outdated --json
# { "tracked": 3, "outdated": [ { "id", "level", "from", "to", "updated" } ], "unknown": [] }`}</Snippet>
        <Callout>
          <C>outdated</C> exits 0 whether or not anything is stale, so a CI step
          has to read the JSON to fail on it. For example, with{' '}
          <C>jq</C> (not part of Hoverlab):{' '}
          <C>{"npx hoverlab outdated --json | jq -e '.outdated | length == 0'"}</C>
        </Callout>
      </DocsSection>

      <DocsSection id="diff" title="diff: what the change is">
        <p>
          <C>diff</C> prints the changed lines between your copy and the
          catalog&rsquo;s current one, for each file that artifact installed. It
          ignores line-ending differences, so a file that a Windows checkout
          turned to CRLF is not reported as changed from top to bottom. It
          writes nothing. There is no <C>--json</C> for it; use{' '}
          <C>outdated --json</C> for machines.
        </p>
      </DocsSection>

      <DocsSection id="update" title="update: taking it safely">
        <p>
          <C>update</C> is not the fix flag <C>outdated</C> refuses to have. It
          asks a different question, one the lockfile can answer: is your file
          byte-for-byte what the CLI wrote? If so, replacing it destroys
          nothing. If not, it leaves the file alone.
        </p>
        <DocsTable
          head={['Situation', 'What update does']}
          rows={[
            [
              'File matches its recorded hash',
              'Replaces it with the catalog’s copy and re-records the revision and hashes.',
            ],
            [
              'You edited it — or a formatter or a line-ending conversion did',
              <>
                Refuses that artifact, says <em>has local changes</em>, and
                points at <C>diff</C>. Other artifacts are unaffected.
              </>,
            ],
            [
              'It was installed before hashes were recorded',
              'Refuses: it cannot tell whether you edited it.',
            ],
            [
              'The file is gone from disk',
              'Counts as blocked, like an edited one. Only --force writes it back.',
            ],
            [
              'Any one file of an artifact is blocked',
              'Writes none of that artifact’s files. Half an update compiles, runs and is wrong in a way nobody thinks to look for.',
            ],
            [
              <>
                <F>--force</F>
              </>,
              'Overwrites the blocked files too. For when you know your edits are disposable.',
            ],
            [
              <>
                <F>--dry-run</F>
              </>,
              'Prints the same report and writes nothing.',
            ],
          ]}
        />
        <p>
          With no ids, <C>update</C> takes everything <C>outdated</C> lists.
          Name ids to take only those.
        </p>
        <Snippet label="a blocked update">{`! ${BLOCK} not updated:
    components/${BLOCK}.tsx has local changes
    See what would change: hoverlab diff ${BLOCK}
    Or overwrite anyway: hoverlab update ${BLOCK} --force`}</Snippet>
        <p>
          The merge is yours. A three-way merge on a component you have
          restyled is a judgement call about which of two intentions wins, and
          neither the CLI nor a hash can make it.
        </p>
      </DocsSection>

      <DocsSection id="untracked" title="Things the lockfile does not know about">
        <p>
          Only <C>add</C> records. A template from <C>init</C>, anything from{' '}
          <C>npx shadcn add</C>, and anything copied by hand are invisible to{' '}
          <C>outdated</C>. To see the current source next to yours, without the
          lockfile:
        </p>
        <Snippet label="terminal">{`npx hoverlab show ${BLOCK}`}</Snippet>
        <p>
          <C>show</C> prints the catalog&rsquo;s code and writes nothing; compare it
          in your editor. To bring an <em>unedited</em> copy under tracking,{' '}
          <C>{`npx hoverlab add ${BLOCK} --force`}</C> rewrites it with the
          catalog&rsquo;s current copy and records that revision. On a file you
          have not edited that is an update; on one you have, it is a real
          overwrite, so commit first.
        </p>
      </DocsSection>

      <DocsSection id="ledger" title="The revision ledger">
        <p>
          Behind <C>outdated</C> is one public endpoint, with no key:
        </p>
        <Snippet label="terminal">{`curl '${origin}${MIGRATION_ROUTES.revisions}?level=block&ids=${BLOCK}'`}</Snippet>
        <p>
          It returns <C>version</C>, <C>generatedAt</C>, <C>count</C> and an{' '}
          <C>artifacts</C> map of <C>{'{ level, revision, updated? }'}</C> per
          id. <C>updated</C> is present where the catalog can state the date
          precisely. The CLI asks for the whole ledger, not for your ids, so the
          request does not reveal what you installed. The mechanism, in the
          order you meet it:
        </p>
        <ol className="list-decimal space-y-2 ps-5">
          {UPDATE_LEDGER.how.map((item) => (
            <li key={item.step}>
              <strong className="text-foreground">{item.step}.</strong>{' '}
              <WithCode text={item.detail} />
            </li>
          ))}
        </ol>
        <p>
          The <C>revision</C> is derived from the file bodies alone. Retitling
          a block or adding a tag does not move it, so a stale-copy notice means
          the source changed, not the marketing.
        </p>
        <p>{UPDATE_LEDGER.caveat}</p>
      </DocsSection>

      <DocsSection id="window" title="What the twelve-month window covers">
        <p>
          The window belongs to the commercial licence, and its wording is the
          licence&rsquo;s, quoted rather than paraphrased:
        </p>
        <ul className="list-disc space-y-2 ps-5">
          {WINDOW_GRANTS.map((grant) => (
            <li key={grant}>{grant}</li>
          ))}
        </ul>
        <ul className="list-disc space-y-2 ps-5">
          <li>
            <strong className="text-foreground">When it ends.</strong> The
            licence certificate on{' '}
            <Link href="/account" className="text-primary underline underline-offset-2">
              your account
            </Link>{' '}
            shows the date beside the issue date.
          </li>
          <li>
            <strong className="text-foreground">Renewing.</strong> A renewal buys
            another twelve months, added to whatever is left, so renewing early
            costs you nothing. It appears on the certificate as the window runs
            out.
          </li>
          <li>
            <strong className="text-foreground">The commands are not tied to it.</strong>{' '}
            <C>outdated</C>, <C>diff</C> and <C>update</C> do not ask for a key
            or check a date; they work the same on every machine.
          </li>
        </ul>
        <p>
          Full terms are on{' '}
          <Link href="/licence" className="text-primary underline underline-offset-2">
            the licence page
          </Link>
          , and how the ledger compares with other catalogs, with dates on every
          row, is on{' '}
          <Link href="/compare" className="text-primary underline underline-offset-2">
            the comparison page
          </Link>
          .
        </p>
      </DocsSection>

      <DocsSection id="privacy" title="What leaves your machine">
        <ul className="list-disc space-y-2 ps-5">
          <li>
            <C>outdated</C> fetches the whole ledger and compares locally.
          </li>
          <li>
            <C>diff</C> and <C>update</C> fetch the artifacts you name, so the
            server sees those ids.
          </li>
          <li>
            <C>add</C> reports the ids it installed, for the catalog&rsquo;s
            popularity ranking, and nothing else about your project.{' '}
            <C>{MIGRATION_ENV[0].name}=1</C> switches that off.
          </li>
        </ul>
        <p>
          None of them writes to your repo except <C>add</C> and <C>update</C>,
          and <C>update</C> only where it can prove the file is untouched.
        </p>
      </DocsSection>

      <OtherGuides current={GUIDE.slug} />
    </>
  )
}
