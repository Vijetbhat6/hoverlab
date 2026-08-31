'use client'

import * as React from 'react'
import Link from 'next/link'
import { Terminal, Check, Copy, HelpCircle, Lock } from 'lucide-react'
import { toast } from 'sonner'

import { CodeBlock } from '@/components/code-block'
import { useEntitlements } from '@/hooks/use-entitlements'
import {
  FRAMEWORKS,
  exportEffect,
  frameworkForPlan,
  frameworkMeta,
  isFrameworkId,
  isProFramework,
  pascalCase,
  type FrameworkId,
} from '@/lib/export'
import { track } from '@/lib/analytics'
import { cn } from '@/lib/utils'

/**
 * The code tab's framework switcher.
 *
 * Every effect in the catalog is plain CSS, which is the whole reason this
 * is possible: a React-coupled library can only ever hand you React, but
 * markup plus a stylesheet can be handed to anyone. Rather than make that
 * a hidden capability of the API, it's the primary interaction on the
 * detail page — pick your stack, get code that runs in it.
 *
 * The generated source is derived from the *customized* CSS, so whatever
 * the preview is showing is what you copy.
 *
 * HTML, CSS and React are free. Vue, Svelte, styled-components and Tailwind
 * are the Pro targets — see FREE_FRAMEWORK_IDS in lib/export for where that
 * line is drawn and why. A locked target still renders its tab: hiding it
 * would hide the reason to upgrade, and a visitor who cannot see that Svelte
 * exists cannot want it.
 */

const STORAGE_KEY = 'hoverlab:framework'

/**
 * The class the markup actually hangs on — the first class on the first
 * element, which for every effect in the catalog is the root.
 *
 * Read off the HTML with a regex rather than parsed, because this is a
 * label in a hint and a miss costs a slightly vaguer sentence, not a bug.
 */
function rootClassName(html: string): string | null {
  const match = html.match(/class="([^"]+)"/)
  const first = match?.[1].trim().split(/\s+/)[0]
  return first || null
}

/**
 * "What do I do with this?" — the step between copying and it working.
 *
 * A code block is a complete answer only if you already know that CSS goes
 * in a stylesheet and that the class in the selector has to end up on your
 * element. Someone learning does not know either, and until now this page
 * handed them the CSS and stopped — the highest-frequency moment where a
 * first-time visitor gets a correct answer and still cannot use it.
 *
 * Two lines, per target, in the imperative. Where the file goes, then what
 * to write. Named files and a real class name rather than placeholders,
 * because "add the appropriate class" is the same non-answer restated.
 */
function usageSteps(
  framework: FrameworkId,
  effectId: string,
  html: string,
  hasExtraCss: boolean,
): React.ReactNode[] {
  const component = pascalCase(effectId)
  const cls = rootClassName(html) ?? effectId

  switch (framework) {
    case 'css':
      return [
        <>
          Put <Code>{effectId}.css</Code> anywhere your page already loads CSS
          from — in Next.js that is <Code>app/globals.css</Code>, or any
          stylesheet with a <Code>&lt;link&gt;</Code> in your HTML.
        </>,
        <>
          Then put the class on the element you want it on:{' '}
          <Code>&lt;button class=&quot;{cls}&quot;&gt;</Code>. The CSS does
          nothing until a class name in it matches something on the page.
        </>,
      ]

    case 'html':
      return [
        <>
          Save it as <Code>{effectId}.html</Code>. The styles are already
          inside the file — there is nothing else to download.
        </>,
        <>
          Open that file in your browser and it runs. This is the version to
          take if you just want to see it working.
        </>,
      ]

    case 'react':
    case 'styled-components':
      return [
        <>
          Save it as <Code>{component}.tsx</Code> next to your other
          components{framework === 'styled-components' ? (
            <>
              , and run <Code>npm install styled-components</Code> if you have
              not already
            </>
          ) : (
            <> (the same file works as .jsx if you are not using TypeScript)</>
          )}
          .
        </>,
        <>
          Then use it like any component:{' '}
          <Code>import {component} from &apos;./{component}&apos;</Code> at the
          top, <Code>&lt;{component} /&gt;</Code> where you want it.
        </>,
      ]

    case 'vue':
      return [
        <>
          Save it as <Code>{component}.vue</Code> in your components folder.
          The styles are scoped to the file, so they cannot leak into the rest
          of your app.
        </>,
        <>
          Then{' '}
          <Code>
            import {component} from &apos;./{component}.vue&apos;
          </Code>{' '}
          and drop <Code>&lt;{component} /&gt;</Code> into a template.
        </>,
      ]

    case 'svelte':
      return [
        <>
          Save it as <Code>{component}.svelte</Code> in your components
          folder. Svelte scopes the styles to this component for you.
        </>,
        <>
          Then{' '}
          <Code>
            import {component} from &apos;./{component}.svelte&apos;
          </Code>{' '}
          and use <Code>&lt;{component} /&gt;</Code>.
        </>,
      ]

    case 'tailwind':
      return [
        <>
          Paste the markup straight into a component or an HTML file. There is
          no stylesheet to add — every class here is a Tailwind utility, so
          this works as long as Tailwind is already set up in the project.
        </>,
        hasExtraCss ? (
          <>
            The second block is the handful of rules Tailwind has no utility
            for. Those still need to go in a real stylesheet, like{' '}
            <Code>app/globals.css</Code>.
          </>
        ) : (
          <>
            Change how it looks by editing the class names in place —{' '}
            <Code>bg-blue-500</Code> to <Code>bg-emerald-500</Code> and so on.
          </>
        ),
      ]
  }
}

/** Inline code, sized to sit inside a sentence rather than beside one. */
function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-foreground">
      {children}
    </code>
  )
}

/** Restore the last-used target so a Vue developer isn't re-picking it. */
function readStoredFramework(): FrameworkId | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw && isFrameworkId(raw) ? raw : null
  } catch {
    // Private browsing / disabled storage — a forgotten preference is fine.
    return null
  }
}

interface FrameworkExportPanelProps {
  effect: {
    id: string
    name: string
    description: string
    category: string
  }
  html: string
  /** The customized CSS — what the live preview is rendering. */
  css: string
  isCustomized?: boolean
  surface?: 'detail' | 'playground'
}

export function FrameworkExportPanel({
  effect,
  html,
  css,
  isCustomized = false,
  surface = 'detail',
}: FrameworkExportPanelProps) {
  const [picked, setPicked] = React.useState<FrameworkId>('css')
  const [copiedInstall, setCopiedInstall] = React.useState(false)
  const { entitlements } = useEntitlements()
  const canUsePro = entitlements?.canUseProFeatures ?? false

  // Read from localStorage after mount rather than in the initializer, so
  // the server and first client render agree and React doesn't rehydrate
  // into a mismatch.
  React.useEffect(() => {
    const stored = readStoredFramework()
    if (stored) setPicked(stored)
  }, [])

  /*
   * What actually gets generated.
   *
   * Clamped rather than trusted, because the stored preference outlives the
   * entitlement: someone who used Vue on a Pro account, then let a Studio
   * seat lapse, has 'vue' in localStorage and would otherwise keep getting
   * Pro output forever. Entitlements also arrive a beat after mount, so this
   * settles on the free target first and widens once they land — never the
   * other way round.
   */
  const framework = frameworkForPlan(picked, canUsePro)

  const selectFramework = React.useCallback(
    (next: FrameworkId) => {
      if (isProFramework(next) && !canUsePro) {
        // `paywall_hit` already exists and is the event the funnel is built
        // on — a second name for the same moment would split the report.
        track('paywall_hit', { feature: `export:${next}`, plan_required: 'pro' })
        toast.info(`${frameworkMeta(next).label} export is part of Pro`, {
          description: 'HTML, CSS and React stay free forever.',
          action: { label: 'See Pro', onClick: () => { window.location.href = '/pricing' } },
        })
        return
      }
      setPicked(next)
      try {
        window.localStorage.setItem(STORAGE_KEY, next)
      } catch {
        /* preference is a nicety, never a failure */
      }
    },
    [canUsePro, effect.id],
  )

  const generated = React.useMemo(
    () =>
      exportEffect(
        {
          id: effect.id,
          name: effect.name,
          description: effect.description,
          category: effect.category,
          html,
          css,
        },
        framework,
      ),
    [effect.id, effect.name, effect.description, effect.category, html, css, framework],
  )

  const installCommand = `npx hoverlab add ${effect.id}${
    framework === 'css' ? '' : ` --framework ${framework}`
  }`

  async function copyInstallCommand() {
    try {
      await navigator.clipboard.writeText(installCommand)
      setCopiedInstall(true)
      toast.success('Copied the install command')
      setTimeout(() => setCopiedInstall(false), 1800)
    } catch {
      toast.error('Copy failed — please copy manually')
    }
  }

  return (
    <div className="space-y-3">
      {/* Target picker */}
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Export format">
        {FRAMEWORKS.map((meta) => {
          const active = meta.id === framework
          const locked = isProFramework(meta.id) && !canUsePro
          return (
            <button
              key={meta.id}
              type="button"
              onClick={() => selectFramework(meta.id)}
              title={locked ? `${meta.description} — included with Pro` : meta.description}
              aria-pressed={active}
              /* Not `disabled`: a disabled control is unreachable by keyboard
                 and announces nothing, so the one thing a locked tab has to
                 do — explain itself — would only work for mouse hover. */
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                active
                  ? 'border-primary/50 bg-primary/10 text-primary'
                  : locked
                    ? 'border-dashed border-border/60 text-muted-foreground/70 hover:border-primary/40 hover:text-foreground'
                    : 'border-border/60 text-muted-foreground hover:border-primary/30 hover:text-foreground',
              )}
            >
              {locked ? <Lock aria-hidden className="h-3 w-3" /> : null}
              {meta.label}
              {locked ? <span className="sr-only"> — included with Pro</span> : null}
            </button>
          )
        })}
      </div>

      {/* Why the dashed tabs are dashed. One line, under the picker rather
          than inside a tooltip, so it is readable without a pointer. */}
      {!canUsePro ? (
        <p className="text-[11px] text-muted-foreground">
          Vue, Svelte, styled-components and Tailwind exports are part of{' '}
          <Link href="/pricing" className="font-medium text-primary hover:underline">
            Pro
          </Link>
          . HTML, CSS and React are free forever.
        </p>
      ) : null}

      {/* One block per generated file. */}
      {generated.files.map((file) => (
        <CodeBlock
          key={file.path}
          code={file.code.trimEnd()}
          filename={file.path}
          language={file.language}
          effect={{ id: effect.id, name: effect.name, category: effect.category }}
          isCustomized={isCustomized}
          copyFormat={
            framework === 'css' || framework === 'html'
              ? file.language === 'html'
                ? 'html'
                : 'css'
              : framework
          }
          surface={surface}
          hideReactButton
          {...(generated.files.length > 1
            ? {
                extraCopy: {
                  label: 'Copy all',
                  text: generated.clipboard,
                  successMessage: `Copied all ${generated.files.length} files`,
                },
              }
            : {})}
        />
      ))}

      {/* Where the code you just copied is supposed to go. Directly under
          the block rather than in the docs, because the gap it closes only
          exists in the ten seconds after copying. */}
      <section
        aria-label="How to use this code"
        className="rounded-lg border border-primary/20 bg-primary/[0.04] p-3"
      >
        <h3 className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <HelpCircle aria-hidden className="h-3.5 w-3.5 text-primary" />
          What do I do with this?
        </h3>
        <ol className="mt-2 space-y-1.5">
          {usageSteps(framework, effect.id, html, generated.files.length > 1).map(
            (step, i) => (
              <li
                key={i}
                className="flex gap-2 text-[11.5px] leading-relaxed text-muted-foreground"
              >
                <span
                  aria-hidden
                  className="mt-px inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary"
                >
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ),
          )}
        </ol>
      </section>

      {/* Caveats. Lossy targets always have at least one — surfacing them
          here is cheaper than a user discovering it at build time. */}
      {generated.notes.length > 0 ? (
        <ul className="space-y-1 rounded-lg border border-border/50 bg-muted/30 p-3 text-[11.5px] leading-relaxed text-muted-foreground">
          {generated.notes.map((note) => (
            <li key={note} className="flex gap-2">
              <span aria-hidden className="select-none text-primary/60">
                •
              </span>
              <span>{note}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {/* The same effect, installable without leaving the editor. */}
      <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/20 px-3 py-2">
        <Terminal className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <code className="flex-1 overflow-x-auto whitespace-nowrap font-mono text-[11.5px] text-muted-foreground">
          {installCommand}
        </code>
        <button
          type="button"
          onClick={copyInstallCommand}
          aria-label="Copy install command"
          className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {copiedInstall ? (
            <>
              <Check className="h-3 w-3 text-emerald-500" /> Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" /> Copy
            </>
          )}
        </button>
      </div>
    </div>
  )
}
