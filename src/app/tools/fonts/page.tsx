'use client'

/**
 * Font pairings.
 *
 * Curated pairs rather than a browsable list of every Google Font. A list of
 * 1,500 families is the problem, not the solution — the reason type choice
 * is hard is that it is a *relationship*, and no amount of scrolling one
 * family at a time surfaces which two work together.
 *
 * Every pair here is two Google Fonts, previewed at real sizes on real
 * copy — a heading over a paragraph, which is the only arrangement that
 * tells you whether the pairing works. Specimen sheets of the alphabet do
 * not.
 *
 * The fonts load from Google on this page only, and the emitted code is the
 * `next/font/google` version rather than a `<link>`: it self-hosts at build
 * time, which removes the third-party request and the layout shift that
 * comes with it.
 */

import * as React from 'react'
import { Type } from 'lucide-react'

import { CopyCssCard } from '@/components/designer-tools/copy-css-card'
import { ToolLayout } from '@/components/designer-tools/tool-layout'
import { cn } from '@/lib/utils'

interface Pairing {
  id: string
  heading: { family: string; weights: string; stack: string }
  body: { family: string; weights: string; stack: string }
  mood: string
  why: string
}

const PAIRINGS: Pairing[] = [
  {
    id: 'inter-inter',
    heading: { family: 'Inter', weights: '700;800', stack: "'Inter', sans-serif" },
    body: { family: 'Inter', weights: '400;500', stack: "'Inter', sans-serif" },
    mood: 'Neutral · product',
    why: 'One family at two weights. The safest choice there is, and the reason most SaaS looks the way it does — contrast comes from weight and size rather than from two competing voices.',
  },
  {
    id: 'fraunces-inter',
    heading: { family: 'Fraunces', weights: '700;900', stack: "'Fraunces', serif" },
    body: { family: 'Inter', weights: '400;500', stack: "'Inter', sans-serif" },
    mood: 'Editorial · warm',
    why: 'A high-contrast serif over a neutral sans. The serif does all the talking, so the body can stay completely plain — which is what keeps long copy readable.',
  },
  {
    id: 'space-grotesk-ibm',
    heading: {
      family: 'Space Grotesk',
      weights: '600;700',
      stack: "'Space Grotesk', sans-serif",
    },
    body: { family: 'IBM Plex Sans', weights: '400;500', stack: "'IBM Plex Sans', sans-serif" },
    mood: 'Technical · modern',
    why: 'Space Grotesk has enough character to be a brand at display size and is unreadable as body text — which is exactly the division of labour you want.',
  },
  {
    id: 'playfair-source',
    heading: { family: 'Playfair Display', weights: '700;900', stack: "'Playfair Display', serif" },
    body: { family: 'Source Sans 3', weights: '400;600', stack: "'Source Sans 3', sans-serif" },
    mood: 'Luxury · commerce',
    why: 'The thin/thick contrast in Playfair reads as expensive, and collapses at small sizes. Keep it above 32px and let the sans carry everything else.',
  },
  {
    id: 'dm-serif-dm-sans',
    heading: { family: 'DM Serif Display', weights: '400', stack: "'DM Serif Display', serif" },
    body: { family: 'DM Sans', weights: '400;500', stack: "'DM Sans', sans-serif" },
    mood: 'Friendly · editorial',
    why: 'Designed as a set, so the proportions already agree. The least risky way to use a serif heading if you are not confident pairing by eye.',
  },
  {
    id: 'jetbrains-inter',
    heading: {
      family: 'JetBrains Mono',
      weights: '700',
      stack: "'JetBrains Mono', monospace",
    },
    body: { family: 'Inter', weights: '400;500', stack: "'Inter', sans-serif" },
    mood: 'Developer tool',
    why: 'A monospace heading signals "this is for engineers" faster than any copy does. Use it sparingly — a whole page of mono is a terminal, not a website.',
  },
]

/** One Google Fonts URL for every family on the page — one request, not six. */
const PREVIEW_HREF = (() => {
  const families = new Set<string>()
  for (const p of PAIRINGS) {
    families.add(`family=${p.heading.family.replace(/ /g, '+')}:wght@${p.heading.weights}`)
    families.add(`family=${p.body.family.replace(/ /g, '+')}:wght@${p.body.weights}`)
  }
  return `https://fonts.googleapis.com/css2?${[...families].join('&')}&display=swap`
})()

/** `next/font/google` import name — Space Grotesk → Space_Grotesk. */
const importName = (family: string) => family.replace(/ /g, '_')
const varName = (family: string) =>
  family.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

function buildNextFont(p: Pairing): string {
  const sameFamily = p.heading.family === p.body.family
  const weights = (w: string) => w.split(';').map((x) => `'${x}'`).join(', ')

  if (sameFamily) {
    return `// app/layout.tsx
import { ${importName(p.heading.family)} } from 'next/font/google'

const ${varName(p.heading.family)} = ${importName(p.heading.family)}({
  subsets: ['latin'],
  weight: [${weights(`${p.body.weights};${p.heading.weights}`)}],
  variable: '--font-${varName(p.heading.family)}',
})

// <html className={${varName(p.heading.family)}.variable}>`
  }

  return `// app/layout.tsx
import { ${importName(p.heading.family)}, ${importName(p.body.family)} } from 'next/font/google'

const heading = ${importName(p.heading.family)}({
  subsets: ['latin'],
  weight: [${weights(p.heading.weights)}],
  variable: '--font-heading',
})

const body = ${importName(p.body.family)}({
  subsets: ['latin'],
  weight: [${weights(p.body.weights)}],
  variable: '--font-body',
})

// <html className={\`\${heading.variable} \${body.variable}\`}>`
}

function buildCss(p: Pairing): string {
  return `:root {
  --font-heading: ${p.heading.stack};
  --font-body: ${p.body.stack};
}

body {
  font-family: var(--font-body);
}

h1, h2, h3, h4 {
  font-family: var(--font-heading);
  /* Tight tracking is what makes a large heading look set rather than typed. */
  letter-spacing: -0.02em;
}`
}

export default function FontsToolPage() {
  const [selected, setSelected] = React.useState<Pairing>(PAIRINGS[0]!)

  return (
    <ToolLayout
      name="Font Pairings"
      tagline="Six pairs that work, previewed on real copy at real sizes"
      icon={<Type className="h-5 w-5" />}
    >
      {/* Preview-only. The emitted code self-hosts through next/font. */}
      <link rel="stylesheet" href={PREVIEW_HREF} />

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <ul className="space-y-1.5 rounded-2xl border border-border/60 bg-card/60 p-4">
          {PAIRINGS.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => setSelected(p)}
                aria-current={selected.id === p.id ? 'true' : undefined}
                className={cn(
                  'w-full rounded-lg px-3 py-2.5 text-left transition-colors',
                  selected.id === p.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                )}
              >
                <span
                  className="block text-sm font-semibold"
                  style={{ fontFamily: p.heading.stack }}
                >
                  {p.heading.family}
                </span>
                <span className="block text-xs" style={{ fontFamily: p.body.stack }}>
                  with {p.body.family} · {p.mood}
                </span>
              </button>
            </li>
          ))}
        </ul>

        <div className="space-y-6">
          {/* Heading over paragraph at real sizes — the only arrangement
              that shows whether a pairing works. */}
          <div className="rounded-2xl border border-border/60 bg-card/60 p-8">
            <p
              className="text-xs uppercase tracking-widest text-muted-foreground"
              style={{ fontFamily: selected.body.stack }}
            >
              {selected.mood}
            </p>
            <h2
              className="mt-3 text-balance text-4xl font-bold leading-tight tracking-tight sm:text-5xl"
              style={{ fontFamily: selected.heading.stack }}
            >
              Ship the interface you sketched
            </h2>
            <p
              className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground"
              style={{ fontFamily: selected.body.stack }}
            >
              Every section of a real product, ready to paste. No component
              library to adopt, no design system to negotiate, no runtime to
              ship. The point of a pairing preview is this paragraph — a
              specimen sheet of the alphabet tells you nothing about how a
              typeface behaves across four lines of actual sentences.
            </p>
            <p
              className="mt-4 text-sm text-muted-foreground"
              style={{ fontFamily: selected.body.stack }}
            >
              0123456789 · fi fl ffi · “quotes” — em dash
            </p>
          </div>

          <div className="rounded-xl border border-border/60 bg-card/60 p-4 text-sm text-muted-foreground">
            {selected.why}
          </div>

          <CopyCssCard code={buildNextFont(selected)} title="next/font" language="tsx" />
          <CopyCssCard code={buildCss(selected)} title="CSS" language="css" />
        </div>
      </div>
    </ToolLayout>
  )
}
