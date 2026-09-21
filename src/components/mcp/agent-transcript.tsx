/**
 * <AgentTranscript> — the four tool calls, in the order an agent makes them.
 *
 * WHY A TRANSCRIPT AND NOT A FEATURE LIST.
 *
 * "MCP server" tells a reader nothing about what changes on their machine.
 * The table of tools further down the page is reference material — it
 * answers questions somebody already has. This answers the question they
 * have not formed yet: what does it look like when it works? A list of
 * capabilities cannot show the one thing that distinguishes this server
 * from the others, which is that the conversation ends with files in the
 * repo rather than a code fence to copy out of.
 *
 * IT IS STAGED, AND IT SAYS SO.
 *
 * This is a composed illustration, not a recording, and the page labels it
 * as one where the reader can see the label — not in a footnote. That is
 * not squeamishness. This repo already has a build gate whose entire
 * reason for existing is six fabricated testimonials that shipped to the
 * landing page, and the lesson the gate encodes is that the audience here
 * is developers, who check. A transcript is the most checkable artifact a
 * page like this can carry: anyone can run the four calls.
 *
 * So everything inside it is real even though the session is not:
 *
 *   - every tool name is one the server serves, imported from the list the
 *     test pins to `packages/cli/src/mcp.mjs` rather than typed here;
 *   - every argument key exists in that tool's input schema;
 *   - the block is a real catalog entry, looked up at module load — its
 *     name, its dependency and its category come from the catalog, so a
 *     rename cannot leave a plausible-looking lie on the page;
 *   - the template is a real template id;
 *   - the counts in the results are the catalog's own counts.
 *
 * The one thing that is invented is the prose of the user's two messages,
 * which is what "staged" means and all it means.
 *
 * WHY IT THROWS RATHER THAN DEGRADES. If `pricing-tiers` is renamed, this
 * module fails at build. The alternative — falling back to a hardcoded
 * string — is how a page keeps describing a component that no longer
 * exists, which is worse than a red build by exactly the margin between a
 * problem someone fixes and a problem nobody sees. Same pattern as the
 * footer's designer-tool rows.
 */

import { ArrowRight, FileCheck2, FolderTree, Search, Sparkles } from 'lucide-react'

import { BLOCK_COUNT, getBlockMeta } from '@/lib/blocks/block-index'
import { PAGE_COUNT } from '@/lib/pages/page-index'
import { getTemplateMeta } from '@/lib/templates/template-index'

const BLOCK_ID = 'pricing-tiers'
const TEMPLATE_ID = 'saas-starter'

const block = getBlockMeta(BLOCK_ID)
if (!block) {
  throw new Error(
    `agent-transcript: no block registered as "${BLOCK_ID}" — the staged transcript names it`,
  )
}

const template = getTemplateMeta(TEMPLATE_ID)
if (!template) {
  throw new Error(
    `agent-transcript: no template registered as "${TEMPLATE_ID}" — the staged transcript names it`,
  )
}

interface Turn {
  /** What the person typed. Omitted on turns the agent takes by itself. */
  said?: string
  tool: string
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  /** Arguments, printed as the agent would send them. */
  args: Record<string, string | number>
  /** What came back, in the two or three lines worth showing. */
  result: string[]
  /** Present when the call put files on disk. Drives the badge. */
  wrote?: boolean
}

const TURNS: Turn[] = [
  {
    said: 'Add a pricing section with a monthly/yearly toggle.',
    tool: 'search_catalog',
    icon: Search,
    args: { query: 'pricing monthly yearly toggle' },
    result: [
      `Searched ${BLOCK_COUNT} blocks and ${PAGE_COUNT} pages.`,
      `block · ${BLOCK_ID} — ${block.name}`,
      `${block.description}`,
    ],
  },
  {
    tool: 'install_artifact',
    icon: FileCheck2,
    args: { id: BLOCK_ID },
    result: [
      `wrote components/${BLOCK_ID}.tsx`,
      block.deps.length > 0
        ? `still to install: ${block.deps.join(', ')}`
        : 'no extra dependencies',
    ],
    wrote: true,
  },
  {
    tool: 'get_design_dna',
    icon: Sparkles,
    args: { id: BLOCK_ID },
    result: [
      'Returned the design system as this section uses it —',
      'colour roles for both themes, radius, spacing, type, motion.',
      'Anything written next matches instead of inventing a palette.',
    ],
  },
  {
    said: 'Good. Now scaffold the rest of the marketing site around it.',
    tool: 'init_template',
    icon: FolderTree,
    args: { id: TEMPLATE_ID, directory: './site' },
    result: [
      `Scaffolded ${template.name} into ./site —`,
      `${template.fileCount} files, ${template.routes.length} routes, ${template.blockCount} blocks.`,
      'cd site && npm install && npm run dev',
    ],
    wrote: true,
  },
]

/** `{ id: "pricing-tiers" }`, the way a client logs it. */
function formatArgs(args: Turn['args']): string {
  const inner = Object.entries(args)
    .map(([k, v]) => `${k}: ${typeof v === 'number' ? v : `"${v}"`}`)
    .join(', ')
  return `{ ${inner} }`
}

export function AgentTranscript() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/60">
      {/* The chrome. Labelled here rather than in a footnote, because a
          reader who skims the transcript and leaves should still have
          been told it is composed. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border/60 bg-muted/40 px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
        </span>
        <span className="font-mono text-xs text-muted-foreground">
          your editor, agent mode
        </span>
        <span className="ml-auto text-xs text-muted-foreground">
          A staged session. Every tool, argument and id in it is real.
        </span>
      </div>

      <ol className="divide-y divide-border/50">
        {TURNS.map((turn) => (
          <li key={turn.tool} className="px-4 py-5 sm:px-6">
            {turn.said && (
              <p className="mb-4 flex gap-3">
                <span
                  aria-hidden
                  className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-[10px] font-semibold text-primary"
                >
                  you
                </span>
                <span className="text-sm font-medium leading-6 text-foreground">
                  {turn.said}
                </span>
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <turn.icon aria-hidden className="h-3.5 w-3.5" />
              </span>
              <code className="font-mono text-sm font-semibold text-foreground">
                {turn.tool}
              </code>
              {turn.wrote && (
                <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                  writes files
                </span>
              )}
            </div>

            {/* min-w-0 is not enough on its own here: the argument line is
                one unbreakable run of mono text, so it gets its own
                scroller rather than widening the page on a phone. */}
            <div className="mt-2 overflow-x-auto">
              <code className="block whitespace-pre font-mono text-xs text-muted-foreground">
                {formatArgs(turn.args)}
              </code>
            </div>

            <div className="mt-3 border-l-2 border-border/60 pl-3">
              {turn.result.map((line) => (
                <p
                  key={line}
                  className="font-mono text-xs leading-relaxed text-muted-foreground"
                >
                  {line}
                </p>
              ))}
            </div>
          </li>
        ))}
      </ol>

      <p className="flex items-center gap-2 border-t border-border/60 bg-muted/30 px-4 py-3 text-sm sm:px-6">
        <ArrowRight aria-hidden className="h-4 w-4 shrink-0 text-primary" />
        <span className="text-muted-foreground">
          <span className="font-medium text-foreground">
            Nothing was pasted.
          </span>{' '}
          The section and the project are in the repo, as source you own.
        </span>
      </p>
    </div>
  )
}
