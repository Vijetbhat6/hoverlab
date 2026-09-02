'use client'

/**
 * <CodeShowcase> — a feature section with a fake editor window beside it.
 *
 * Tabs switch the visible file. The window chrome is decorative and marked
 * `aria-hidden`; the code itself sits in a real <pre> so it can be selected
 * and copied, which is the entire point of showing code on a landing page.
 *
 * Line numbers are generated from the source rather than typed into it, so
 * copying picks up the code without the gutter coming along.
 */

import * as React from 'react'
import { Copy, Check } from 'lucide-react'

export interface CodeFile {
  name: string
  code: string
}

export interface CodeShowcaseProps {
  files?: CodeFile[]
  heading?: string
  subheading?: string
  bullets?: string[]
  className?: string
}

const DEFAULT_FILES: CodeFile[] = [
  {
    name: 'page.tsx',
    code: `import { PricingTiers } from '@/components/pricing-tiers'
import { FaqAccordion } from '@/components/faq-accordion'

export default function Page() {
  return (
    <main>
      <PricingTiers />
      <FaqAccordion />
    </main>
  )
}`,
  },
  {
    name: 'theme.css',
    code: `:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 4%;
  --primary: 243 75% 59%;
  --muted: 240 5% 96%;
  --border: 240 6% 90%;
}

.dark {
  --background: 240 10% 4%;
  --foreground: 0 0% 98%;
  --primary: 234 89% 74%;
}`,
  },
]

export function CodeShowcase({
  files = DEFAULT_FILES,
  heading = 'Paste it. Ship it.',
  subheading = 'No install step, no configuration file, no build plugin.',
  bullets = [
    'Copy the section straight into your project',
    'Restyle it with your own tokens, not our overrides',
    'Delete what you do not need — it is your code now',
  ],
  className = '',
}: CodeShowcaseProps) {
  const [active, setActive] = React.useState(0)
  const [copied, setCopied] = React.useState(false)

  const file = files[active] ?? files[0]

  async function copy() {
    await navigator.clipboard.writeText(file.code)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <section className={`mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 ${className}`}>
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            {heading}
          </h2>
          {subheading ? <p className="mt-3 text-muted-foreground">{subheading}</p> : null}

          <ul className="mt-6 space-y-3">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-sm">
                <Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <span className="text-muted-foreground">{b}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border/60 bg-zinc-950 shadow-xl">
          {/* Window chrome */}
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
            <div aria-hidden className="flex gap-1.5">
              <span className="h-3 w-3 rounded-full bg-red-500/80" />
              <span className="h-3 w-3 rounded-full bg-amber-500/80" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
            </div>

            <div role="tablist" className="ms-3 flex gap-1">
              {files.map((f, i) => (
                <button
                  key={f.name}
                  role="tab"
                  type="button"
                  aria-selected={i === active}
                  onClick={() => setActive(i)}
                  className={`rounded-md px-2.5 py-1 font-mono text-xs transition-colors ${
                    i === active
                      ? 'bg-white/10 text-white'
                      : 'text-white/50 hover:text-white/80'
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={copy}
              aria-label={`Copy ${file.name}`}
              className="ms-auto inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            >
              {copied ? (
                <Check aria-hidden className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Copy aria-hidden className="h-3.5 w-3.5" />
              )}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <pre className="overflow-x-auto p-4 text-xs leading-relaxed">
            <code className="font-mono text-zinc-300">
              {file.code.split('\n').map((line, i) => (
                <span key={i} className="grid grid-cols-[2rem_1fr]">
                  <span aria-hidden className="select-none text-end text-white/20">
                    {i + 1}
                  </span>
                  <span className="ps-4">{line || ' '}</span>
                </span>
              ))}
            </code>
          </pre>
        </div>
      </div>
    </section>
  )
}
