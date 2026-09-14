/**
 * Turning a `/builder` composition into a runnable StackBlitz project.
 *
 * ── WHY THE BUILDER NEEDED THIS ─────────────────────────────────────────
 *
 * `/builder` already handed the reader a page source and the command that
 * installs its sections, which is everything they need and nothing they can
 * check. A composed page is precisely the artifact whose correctness is not
 * visible in its source: five files that each compile do not prove the five
 * of them stack, that the theme reaches all of them, or that the second
 * navbar someone dragged in is the mistake it looks like. Every other tier
 * of the catalog has had a running sandbox since the button shipped; the one
 * tier a visitor builds themselves did not.
 *
 * ── WHY IT IS A SEPARATE MODULE FROM `artifact-sandbox` ─────────────────
 *
 * That one enumerates levels on purpose — it exists partly to keep the Pro
 * templates out of a full file dump, and its `SandboxLevel` union is that
 * decision written down. A composition is not a level: it has no id, no
 * catalog entry and no licence question, because every block in it is
 * already public and already on the page it was chosen from. Widening the
 * union to admit it would have put a thing with no entitlement story
 * through the function whose job is entitlement-shaped.
 *
 * What it does share is the block collector, imported rather than
 * reimplemented. Two blocks in the catalog import another block without
 * declaring it, and a second walk would have had to rediscover that.
 */

import { blockFiles } from '@/lib/export/artifact-sandbox'
import {
  exportedComponent,
  stackblitzReactForm,
  type ReactSandboxInput,
  type SandboxFile,
} from '@/lib/export/stackblitz'
import type { SandboxForm } from '@/lib/sandbox'
import { composePageSource, MAX_SECTIONS } from '@/lib/builder/compose'
import { themeOverrideCss } from '@/lib/builder/theme'
import type { ThemeState } from '@/lib/shadcn-theme'

/**
 * Where the composed page lands in the project.
 *
 * At the root of `src/` rather than under `app/` or `pages/`, because the
 * sandbox is a Vite project and neither of those directories means anything
 * in one. The name is fixed rather than taken from the reader's page name:
 * the name is typed in the export panel on the client, long after this
 * payload is fetched, and a sandbox whose filename lagged a keystroke
 * behind the source would be worse than one that never claimed to have it.
 */
const ENTRY_PATH = 'composed-page.tsx'

export interface CompositionSandbox {
  form: SandboxForm
  /** Path the editor opens on, for the button's title attribute. */
  openFile: string
}

export interface CompositionSandboxOptions {
  /** Origin, for crediting the catalog in the README. */
  siteUrl?: string
  /** The builder URL that rebuilds this layout. */
  shareUrl?: string
  /** The theme the composition was built under, if any. */
  theme?: ThemeState | null
  /**
   * The command that installs that theme, recorded in the page's header.
   *
   * Redundant inside the sandbox, which already has the theme in its
   * `styles.css` — and included anyway, because the entry file is the thing
   * people copy OUT of the sandbox into their own repo. Without the line,
   * someone who takes `composed-page.tsx` and leaves the project behind
   * loses the palette with nothing in the file to say where it went.
   */
  themeCommand?: string | null
}

/**
 * The StackBlitz payload for one composition, or null if it cannot be built.
 *
 * Null rather than a throw, matching `buildArtifactSandbox`: the caller's
 * right response is to not offer the button, and every null here is a real
 * condition — nothing chosen, or no block that resolved to a source.
 */
export function buildCompositionSandbox(
  ids: string[],
  options: CompositionSandboxOptions = {},
): CompositionSandbox | null {
  /*
   * Capped here as well as in the parser, and not only for tidiness. This
   * route assembles one file per block plus a project scaffold from a query
   * string a stranger controls; the parser's cap is the reason that is a
   * bounded amount of work, and a second collector that did not honour it
   * would be a way around the bound.
   */
  const chosen = ids.slice(0, MAX_SECTIONS)
  if (chosen.length === 0) return null

  const source = composePageSource(chosen, {
    shareUrl: options.shareUrl,
    themeCommand: options.themeCommand ?? undefined,
  })
  const component = exportedComponent(source)
  if (!component) return null

  const files: SandboxFile[] = [{ path: ENTRY_PATH, source }]

  /*
   * One `seen` set across the whole composition. A composed page routinely
   * holds the same block twice — that is a layout the builder supports on
   * purpose — and without a shared set the project would carry duplicate
   * file entries with the last write winning silently.
   */
  const seen = new Set<string>()
  for (const id of chosen) files.push(...blockFiles(id, seen))

  // Only the entry resolved: every id was unknown to the source map, so the
  // project would open on a page of imports that do not exist.
  if (files.length === 1) return null

  const input: ReactSandboxInput = {
    id: 'composed-page',
    name: 'Composed page',
    description: `A page composed from ${chosen.length} Hoverlab block${
      chosen.length === 1 ? '' : 's'
    }.`,
    files,
    componentName: component.name,
    entryIsDefault: component.isDefault,
    entryPath: ENTRY_PATH,
    sourceUrl: options.shareUrl ?? options.siteUrl,
    extraStyles: options.theme ? themeOverrideCss(options.theme) : undefined,
  }

  return { form: stackblitzReactForm(input), openFile: `src/${ENTRY_PATH}` }
}
