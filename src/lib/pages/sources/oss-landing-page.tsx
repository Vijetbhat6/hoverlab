/**
 * An open-source project's home page — install first, sell never.
 *
 *   install    the command, in four package managers
 *   terminal   what it does, shown rather than claimed
 *   code       the API, in twenty lines
 *   why        the three things it does differently
 *   adoption   the numbers that stand in for trust here
 *   funding    who pays for it, said plainly
 *   community  where to go next
 *
 * AN OSS PROJECT PAGE IS NOT A MARKETING PAGE AND THE DIFFERENCE IS THE
 * FIRST SCREEN. The visitor is a developer who has arrived from a search or
 * a link, has already decided the category is interesting, and wants two
 * things in this order: the install command, and enough code to judge the
 * API. Everything a SaaS landing page opens with — the value proposition,
 * the social proof, the CTA to book a demo — costs that reader a scroll and
 * buys nothing.
 *
 * SO <CodeTabsPanel> IS THE FIRST BLOCK ON THE PAGE, above the hero. The
 * npm/pnpm/yarn/bun tabs matter because every reader uses exactly one and
 * showing four lines of install command wastes three of them; the block
 * already makes that argument in its own header.
 *
 * FUNDING IS ON THE PAGE, NOT IN A SPONSORS FILE. "Who pays for this and
 * what happens if they stop" is the question that decides whether a team
 * takes a dependency, and a project that will not answer it is one a
 * cautious reader passes over. <StatsNarrative> carries it as a sentence
 * with figures rather than a wall of sponsor logos, which say who gave
 * money but not how much or for how long.
 *
 * NO PRICING BLOCK AND NO "ENTERPRISE" SECTION. Both exist on the sponsor
 * page, and putting either here changes what the project reads as. The one
 * commercial fact on this page is the funding paragraph, which is framed as
 * disclosure rather than as a pitch.
 *
 * Anchors are prefixed `os-`.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { CodeTabsPanel } from '@/lib/blocks/sources/code-tabs-panel'
import { HeroTerminal } from '@/lib/blocks/sources/hero-terminal'
import { CodeShowcase } from '@/lib/blocks/sources/code-showcase'
import { BentoFeatures } from '@/lib/blocks/sources/bento-features'
import { StatsBand } from '@/lib/blocks/sources/stats-band'
import { StatsNarrative } from '@/lib/blocks/sources/stats-narrative'
import { CommunityBand } from '@/lib/blocks/sources/community-band'
import { FooterMega } from '@/lib/blocks/sources/footer-mega'

const INSTALL = [
  { label: 'npm', code: 'npm install ratchet', language: 'bash' },
  { label: 'pnpm', code: 'pnpm add ratchet', language: 'bash' },
  { label: 'yarn', code: 'yarn add ratchet', language: 'bash' },
  { label: 'bun', code: 'bun add ratchet', language: 'bash' },
]

const RUN_OUTPUT = [
  'ratchet 2.4.0 — schema migrations that refuse to go backwards',
  '',
  '  ✓  0001_initial.sql           applied    2.4s',
  '  ✓  0002_add_ledger.sql        applied    0.8s',
  '  ✓  0003_split_settlement.sql  applied   14.1s',
  '  ⚠  0004_drop_legacy.sql       BLOCKED',
  '',
  '     0004 drops column `orders.legacy_ref`, which 2 queries still read.',
  '     Found in: reports/monthly.sql:41, api/orders.go:212',
  '',
  '     Run with --force to override, or delete the readers first.',
  '',
  '3 applied, 1 blocked, 0 failed — database unchanged for 0004.',
]

const API = [
  {
    name: 'migrate.ts',
    code: `import { Ratchet } from 'ratchet'

// A migration is a file, not a class. The up is required; the down is
// optional and, if you leave it out, the migration is declared
// irreversible and the tool will say so rather than guess.
export const ratchet = new Ratchet({
  dir: './migrations',
  url: process.env.DATABASE_URL,

  // The whole point of the library. Before applying anything that drops
  // or narrows a column, parse the queries in these paths and refuse if
  // one of them still reads it.
  guard: {
    scan: ['api/**/*.go', 'reports/**/*.sql'],
    onConflict: 'block',
  },
})

await ratchet.up()`,
  },
  {
    name: '0004_drop_legacy.sql',
    code: `-- Migrations are plain SQL. No DSL to learn, and your database's own
-- documentation is the reference.
--
-- ratchet:irreversible
--   Says out loud that there is no down. Without this, a migration with
--   no down block is a warning at plan time rather than a surprise at
--   rollback time on a Friday.

ALTER TABLE orders DROP COLUMN legacy_ref;`,
  },
]

const DIFFERENCES = [
  {
    title: 'It reads your code before it drops a column',
    body: 'The guard parses the queries in the paths you name and blocks a destructive migration while anything still reads the column. Most outages caused by a migration are this exact shape.',
    span: 'sm:col-span-2',
  },
  {
    title: 'Plain SQL, no DSL',
    body: 'Your database’s own documentation is the reference. Nothing to learn and nothing that stops working when Postgres adds a feature.',
  },
  {
    title: 'Irreversible is a thing you declare',
    body: 'A migration with no down is fine — lying about it is not. Say so in a comment and the plan output says so too.',
  },
  {
    title: 'No lock held while it thinks',
    body: 'Planning happens before the transaction opens, so a slow guard scan never holds a lock on a production table.',
  },
  {
    title: 'One binary, no runtime',
    body: '6MB, static, no Node or Python needed in the image that runs it. The library and the CLI are the same code.',
    span: 'sm:col-span-2',
  },
]

const ADOPTION = [
  { value: '18.4k', label: 'GitHub stars', caption: 'And 312 open issues, honestly' },
  { value: '2.1M', label: 'Downloads a month', caption: 'npm, last 30 days' },
  { value: '184', label: 'Contributors', caption: '41 with commit access' },
  { value: 'MIT', label: 'Licence', caption: 'Since 2021, and it will not change' },
]

const WHERE = [
  {
    label: 'GitHub',
    description: 'The code, the issues and the RFC process. Every design decision was argued in public and the threads are still there.',
    href: '#',
    meta: '18.4k stars · 312 open issues',
  },
  {
    label: 'Discord',
    description: 'About 4,000 people. Two maintainers are in it daily; nobody is paid to be, so answers are faster on weekdays.',
    href: '#',
    meta: '4,100 members',
  },
  {
    label: 'Documentation',
    description: 'Guides, a full CLI reference and thirteen recipes for migrations that are genuinely hard to get right.',
    href: '#os-docs',
    meta: 'Versioned back to 1.0',
  },
  {
    label: 'Changelog',
    description: 'Every release since 1.0, with the breaking changes called out and a codemod where one was possible.',
    href: '#',
    meta: 'Latest: 2.4.0',
  },
]

export default function OssLandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple
        brand="ratchet"
        links={[
          { label: 'Docs', href: '#os-docs' },
          { label: 'Changelog', href: '#' },
          { label: 'Roadmap', href: '#' },
          { label: 'GitHub', href: '#' },
        ]}
        activeLabel="Docs"
        ctaLabel="Sponsor"
      />

      <main>
        {/* Install command first, above the hero. See the header. */}
        <div id="os-install" className="mx-auto w-full max-w-3xl px-4 pt-12 sm:px-6 lg:px-8">
          <CodeTabsPanel title="Install" tabs={INSTALL} />
        </div>

        <HeroTerminal
          eyebrow="MIT · v2.4.0 · 2.1M downloads a month"
          heading="Schema migrations that refuse to break production"
          subheading="A migration runner that reads your application code before it drops a column, and blocks itself when something still needs it. Plain SQL, one static binary, no DSL."
          command="ratchet up"
          output={RUN_OUTPUT}
          primaryLabel="Read the docs"
          primaryHref="#os-docs"
          secondaryLabel="Star on GitHub"
        />

        <div id="os-api">
          <CodeShowcase
            heading="The whole API is one object and two files"
            subheading="A config, and migrations that are plain SQL. If you already know how to write an ALTER TABLE you know how to use this."
            bullets={[
              'Migrations are SQL files — nothing to learn, nothing to unlearn',
              'The guard is the only unusual concept, and it is four lines',
              'Irreversible migrations are declared, not inferred',
            ]}
            files={API}
          />
        </div>

        <BentoFeatures
          heading="Why this rather than the one you already have"
          subheading="Five differences. The first one is the reason the project exists; the others are consequences of keeping it small."
          tiles={DIFFERENCES}
        />

        <StatsBand stats={ADOPTION} />

        <StatsNarrative
          eyebrow="Funding, since you are about to depend on it"
          heading="Two maintainers are paid part-time; the rest is volunteered"
          body="Northwind funds one day a week and Contoso funds two, both on rolling twelve-month agreements, and neither gets any say over the roadmap — that is written into both. If both stopped tomorrow the project would keep going more slowly rather than stopping, because no single contributor holds more than 19% of commits. This paragraph is here because it is the question a team should ask before taking a dependency, and most projects do not answer it."
          stats={[
            { value: '£61k', label: 'Funded in 2025', source: 'Two corporate sponsors, 340 individuals' },
            { value: '3 days', label: 'Paid maintainer time a week', source: 'Across two people' },
            { value: '19%', label: 'Largest share of commits', source: 'No single point of failure' },
            { value: '0', label: 'Sponsor influence on the roadmap', source: 'Written into both agreements' },
          ]}
          ctaLabel="Sponsor the project"
        />

        <div id="os-docs">
          <CommunityBand
            heading="Where to go next"
            subheading="The documentation is the place to start. The Discord is faster on weekdays, and every design decision is argued in a public RFC."
            links={WHERE}
          />
        </div>
      </main>

      <FooterMega
        brand="ratchet"
        tagline="Schema migrations that refuse to break production. MIT licensed since 2021."
        statusLabel="All systems operational"
        regionNote="Maintained from Lisbon, Berlin and Dunedin"
        columns={[
          {
            heading: 'Docs',
            links: [
              { label: 'Getting started', href: '#os-install' },
              { label: 'The guard', href: '#os-api' },
              { label: 'CLI reference', href: '#' },
              { label: 'Recipes', href: '#' },
            ],
          },
          {
            heading: 'Project',
            links: [
              { label: 'GitHub', href: '#' },
              { label: 'Changelog', href: '#' },
              { label: 'Roadmap', href: '#' },
              { label: 'RFCs', href: '#' },
            ],
          },
          {
            heading: 'Community',
            links: [
              { label: 'Discord', href: '#' },
              { label: 'Contributing', href: '#' },
              { label: 'Code of conduct', href: '#' },
              { label: 'Security policy', href: '#' },
            ],
          },
          {
            heading: 'Support it',
            links: [
              { label: 'Sponsor', href: '#', badge: 'GitHub' },
              { label: 'Corporate funding', href: '#' },
              { label: 'Who funds this', href: '#' },
            ],
          },
        ]}
        legalLinks={[
          { label: 'MIT licence', href: '#' },
          { label: 'Trademark policy', href: '#' },
        ]}
      />
    </div>
  )
}
