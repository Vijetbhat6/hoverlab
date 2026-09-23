/**
 * The migration guides, as data.
 *
 * One list read by five things that must never disagree about what exists:
 * the guide pages themselves (title and description), the index page (the
 * cards), the docs sidebar, the sitemap and /llms.txt. Adding a fourth guide
 * is one entry here plus its `page.tsx`; a test fails if either half is
 * missing, so a guide cannot be linked and 404, or exist and be unlinked.
 *
 * WHAT THESE GUIDES ARE, AND ARE NOT. They cover moving an EXISTING project
 * onto Hoverlab and keeping it current — the job the rest of the docs skip,
 * because they are written for somebody with an empty directory. They say
 * nothing about other catalogs beyond what `lib/compare.ts` already states
 * with dates, and they print no command, flag or file name that the CLI does
 * not have: `cli-reference.ts` is the list of what they print, and its test
 * reads the CLI's source to prove each one exists.
 */

export interface MigrationGuide {
  /** Path segment under /docs/migrate. */
  slug: 'adopt' | 'tokens' | 'updates'
  /** The page's H1 and its <title> stem. */
  title: string
  /** The sidebar-sized version. */
  short: string
  /** Meta description and the sentence /llms.txt carries. */
  description: string
  /** Who this is for — the index page's "you have…" column. */
  situation: string
}

export const MIGRATION_GUIDES: readonly MigrationGuide[] = [
  {
    slug: 'adopt',
    title: 'Adopt Hoverlab in an existing project',
    short: 'Tailwind v3 or v4, where files land, the lockfile',
    description:
      'Add Hoverlab blocks, pages and effects to a project that already exists: Tailwind v3 versus v4, where the files land, what hoverlab.lock.json records, and npx hoverlab add versus npx shadcn add.',
    situation: 'You have a running app and want to add sections to it without scaffolding a new one.',
  },
  {
    slug: 'tokens',
    title: 'Move your tokens to Hoverlab’s',
    short: 'tailwind.config or CSS variables to tokens.css',
    description:
      'Move a tailwind.config theme or a set of CSS variables onto the token names Hoverlab blocks use, and which of the export files is a Tailwind v4 @theme block and which is not.',
    situation: 'You already have a palette, in a Tailwind config or as CSS variables, and the blocks should wear it.',
  },
  {
    slug: 'updates',
    title: 'Keep it up to date',
    short: 'outdated, diff, update and the twelve-month window',
    description:
      'How to find out what changed in the catalog after you copied it: npx hoverlab outdated, diff and update, the revision ledger behind them, and what the twelve-month update window covers.',
    situation: 'You installed things a while ago and want to know what has been fixed since.',
  },
] as const

export const MIGRATE_INDEX = {
  path: '/docs/migrate',
  title: 'Migrate — Hoverlab Docs',
  short: 'Move an existing project onto Hoverlab',
  description:
    'Three guides for a project that already exists: adopting Hoverlab, moving your design tokens onto it, and keeping what you installed up to date.',
} as const

/** Site-relative path of one guide. */
export function guidePath(slug: MigrationGuide['slug']): string {
  return `/docs/migrate/${slug}`
}

export function findGuide(slug: MigrationGuide['slug']): MigrationGuide {
  const guide = MIGRATION_GUIDES.find((g) => g.slug === slug)
  if (!guide) throw new Error(`No migration guide "${slug}"`)
  return guide
}
