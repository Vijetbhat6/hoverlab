import Link from 'next/link'
import { Check, FileCode, Package, ShieldCheck, Terminal } from 'lucide-react'

import type { ArtifactFile, ArtifactLevel } from '@/lib/artifact-types'
import { PLANS, formatPrice } from '@/lib/billing/plans'
import { UsageBadge } from '@/components/usage-badge'

/**
 * The facts a buyer checks before taking something — stated on the page
 * rather than left to be inferred from the source below it.
 *
 * This exists because the detail pages read like documentation: preview,
 * code, related. Documentation is what a free library looks like, and the
 * three things a person actually wants before pasting a section into their
 * product were all missing — what files land in my repo, does it fit my
 * stack, and am I allowed to ship it.
 *
 * A server component with no state, so it costs nothing on a statically
 * rendered page. The one live number, usage, is a client island inside it.
 */

/** Which stacks an artifact drops into, by rung. */
function compatibilityFor(level: ArtifactLevel): string[] {
  // Effects are generated CSS, so they can be emitted for anything. Blocks
  // and above are hand-written React and ship as written — a machine
  // translation of three hundred lines of hooks would be a worse component
  // claiming to be the same one.
  return level === 'effect'
    ? ['React', 'Vue', 'Svelte', 'Tailwind', 'styled-components', 'Plain CSS']
    : ['React', 'Next.js', 'Tailwind CSS', 'TypeScript']
}

function installCommand(id: string, level: ArtifactLevel): string {
  return level === 'template' ? `npx hoverlab init ${id} ./my-app` : `npx hoverlab add ${id}`
}

export function ArtifactFacts({
  id,
  level,
  files,
  deps,
  includes,
}: {
  id: string
  level: ArtifactLevel
  /** Files that land in the project. Omitted for effects, which emit one. */
  files?: ArtifactFile[]
  deps: string[]
  /** Ids this artifact brings with it — a page's blocks, a template's pages. */
  includes?: string[]
}) {
  const compatibility = compatibilityFor(level)
  const command = installCommand(id, level)
  const pro = PLANS.pro

  return (
    <section
      aria-label="What you get"
      className="mt-8 grid gap-4 rounded-xl border border-border/60 bg-card/50 p-5 sm:grid-cols-2"
    >
      {/* ---- What's included -------------------------------------- */}
      <div>
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
          <FileCode aria-hidden className="h-4 w-4 text-primary" />
          What&apos;s included
        </h2>
        <ul className="space-y-1 text-sm text-muted-foreground">
          {files && files.length > 0 ? (
            files.slice(0, 6).map((file) => (
              <li key={file.path} className="flex items-start gap-1.5">
                <Check aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <code className="font-mono text-xs">{file.path}</code>
              </li>
            ))
          ) : (
            <li className="flex items-start gap-1.5">
              <Check aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
              The markup and the stylesheet, in whichever framework you pick
            </li>
          )}
          {files && files.length > 6 ? (
            <li className="pl-5 text-xs">and {files.length - 6} more files</li>
          ) : null}
          {includes && includes.length > 0 ? (
            <li className="flex items-start gap-1.5">
              <Check aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
              {/* Named rather than counted: the whole reason installing a page
                  works is that it brings these, and a bare number does not
                  tell you whether you already have them. */}
              {includes.length} {level === 'template' ? 'pages' : 'blocks'} it is built
              from, installed with it
            </li>
          ) : null}
          <li className="flex items-start gap-1.5">
            <Check aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
            {deps.length === 0
              ? 'No runtime dependencies'
              : `Needs ${deps.join(', ')}`}
          </li>
        </ul>
      </div>

      {/* ---- Compatibility ---------------------------------------- */}
      <div>
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
          <Package aria-hidden className="h-4 w-4 text-primary" />
          Works with
        </h2>
        <ul className="flex flex-wrap gap-1.5">
          {compatibility.map((item) => (
            <li
              key={item}
              className="rounded-full border border-border/60 px-2.5 py-0.5 text-xs text-muted-foreground"
            >
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Terminal aria-hidden className="h-3.5 w-3.5" />
          <code className="font-mono">{command}</code>
        </p>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Or over MCP, from your editor&apos;s agent —{' '}
          <Link href="/docs/mcp" className="text-primary hover:underline">
            no account needed
          </Link>
          .
        </p>
      </div>

      {/* ---- License + usage -------------------------------------- */}
      <div className="sm:col-span-2 border-t border-border/60 pt-4">
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
          <ShieldCheck aria-hidden className="h-4 w-4 text-primary" />
          License
        </h2>
        <p className="text-sm text-muted-foreground">
          Free to read, copy and install, for personal and non-commercial
          projects. Shipping it in client work or a paid product needs{' '}
          <Link href="/#pricing" className="font-medium text-primary hover:underline">
            Pro ({formatPrice(pro.priceCents)} once)
          </Link>
          . The source lands in your repo and stops being ours — no attribution,
          nothing to upgrade.{' '}
          <UsageBadge id={id} />
        </p>
      </div>
    </section>
  )
}
