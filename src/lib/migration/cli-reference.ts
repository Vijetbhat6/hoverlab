/**
 * Every command, flag, file and endpoint the migration guides print.
 *
 * WHY THIS IS A LIST AND NOT JUST PROSE. A migration guide is copied into a
 * terminal by somebody whose project is already in a working state. A flag
 * that does not exist is not a docs typo there: it is an error at the moment
 * they are least willing to debug, on a command that sits between them and a
 * working tree. `hoverlab update --apply`, `outdated --fix` and `add --yes`
 * are all things a plausible-sounding guide could print and this CLI does
 * not have — `outdated` in particular has NO fix flag, on purpose, and the
 * docs say so.
 *
 * So what the guides mention is declared here, in a small typed shape, and
 * `migration.test.ts` reads `packages/cli/bin/hoverlab.mjs` and
 * `packages/cli/src/commands.mjs` as text and fails if any of it is not real.
 * The same test scans the guide pages for `npx hoverlab …` lines and for
 * `<F>` flag mentions, so a command typed straight into the JSX without
 * being listed here is caught too — this list cannot be bypassed by being
 * forgotten.
 *
 * It describes the CLI as it is; it never changes it. If a command is
 * renamed the test goes red and the guides get fixed in the same commit.
 */

export interface CliCommandRef {
  /** The word after `hoverlab`. Must be a `case` in the CLI's dispatch. */
  command: string
  /**
   * Long flags the guides use with THIS command, without the dashes. Each
   * must be read by that command's implementation, or be a value flag the
   * parser knows about.
   */
  flags: readonly string[]
}

export const MIGRATION_CLI: readonly CliCommandRef[] = [
  { command: 'add', flags: ['dry-run', 'force', 'dir'] },
  { command: 'init', flags: [] },
  { command: 'show', flags: [] },
  { command: 'outdated', flags: ['json'] },
  { command: 'diff', flags: [] },
  { command: 'update', flags: ['dry-run', 'force'] },
  { command: 'dna', flags: ['brand', 'out'] },
  { command: 'review', flags: [] },
]

/** Files the CLI reads or writes, and which source file names them. */
export const MIGRATION_FILES = {
  /** Written by `add`, read by `outdated`, `diff` and `update`. */
  lockfile: { name: 'hoverlab.lock.json', definedIn: 'lockfile.mjs' },
  /** Written by the design-system export, read by `add` for effects. */
  config: { name: 'hoverlab.config.json', definedIn: 'config.mjs' },
} as const

/** Keys of a lockfile entry the guide shows. Each must appear in `lockfile.mjs`. */
export const LOCKFILE_FIELDS = [
  'lockfileVersion',
  'artifacts',
  'level',
  'revision',
  'framework',
  'installedAt',
  'files',
  'hashes',
] as const

/** Environment variables the guides mention, and where the CLI reads them. */
export const MIGRATION_ENV = [
  { name: 'HOVERLAB_NO_TELEMETRY', definedIn: 'api.mjs' },
  { name: 'HOVERLAB_KEY', definedIn: 'auth.mjs' },
] as const

/**
 * The files the design-system export produces, by name, as the guides refer
 * to them. Checked against `buildDesignSystem()` itself, so a rename in the
 * exporter turns the test red instead of leaving a guide naming a file that
 * no longer comes out.
 */
export const EXPORT_FILES = {
  css: 'tokens.css',
  tailwindV4: 'tailwind-theme.css',
  tailwindV3: 'tailwind-theme.v3.ts',
  dtcgLight: 'tokens.light.json',
  dtcgDark: 'tokens.dark.json',
  styleDictionary: 'style-dictionary.config.mjs',
  figmaVariables: 'figma-variables.json',
  figmaPush: 'push-figma-variables.mjs',
  config: 'hoverlab.config.json',
} as const

/** Paths of site routes the guides tell a reader to call or open. */
export const MIGRATION_ROUTES = {
  revisions: '/api/v1/revisions',
  registry: '/registry.json',
  themeTool: '/tools/shadcn',
  designSystem: '/design-system',
} as const

/**
 * Suggested mappings from the names other projects use onto Hoverlab's.
 *
 * SUGGESTIONS, not facts about anyone's project: the left column is a guess
 * at common naming, and the guide says so. What IS checked is the right
 * column — every entry must be one of the semantic tokens the export really
 * emits (`generated-dna.json`'s `colorKeys`), so the guide cannot tell a
 * reader to alias a name that blocks do not read.
 */
export const TOKEN_MAPPING: ReadonlyArray<{
  yours: string
  hoverlab: string
  note: string
}> = [
  { yours: 'page background', hoverlab: 'background', note: 'The colour behind everything.' },
  { yours: 'body text', hoverlab: 'foreground', note: 'Default text on the page background.' },
  { yours: 'surface, panel, card', hoverlab: 'card', note: 'Raised areas. Pair with card-foreground for the text on them.' },
  { yours: 'brand, accent, action', hoverlab: 'primary', note: 'Buttons and links. Pair with primary-foreground for text on top.' },
  { yours: 'text on the brand colour', hoverlab: 'primary-foreground', note: 'The label inside a primary button.' },
  { yours: 'subdued fill, chip, code well', hoverlab: 'muted', note: 'Quiet backgrounds. muted-foreground is the secondary-text colour.' },
  { yours: 'secondary text', hoverlab: 'muted-foreground', note: 'Captions, helper text, placeholder text.' },
  { yours: 'divider, hairline', hoverlab: 'border', note: 'Rules and card outlines.' },
  { yours: 'form-field outline', hoverlab: 'input', note: 'Usually the same value as border.' },
  { yours: 'danger, error', hoverlab: 'destructive', note: 'Delete buttons and error text.' },
  { yours: 'focus outline', hoverlab: 'ring', note: 'The focus ring. Usually the brand colour.' },
]

/**
 * The example ids the guides install. Real ones, on three different rungs,
 * so a copied command does something rather than answering "unknown id".
 * Checked against the catalog indexes in the test.
 */
export const MIGRATION_EXAMPLE_IDS = {
  block: 'pricing-tiers',
  page: 'checkout-page',
  effect: 'btn-gradient',
} as const
