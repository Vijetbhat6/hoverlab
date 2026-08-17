/**
 * The font-pairing list for the Typography Playground.
 *
 * This used to be two lists: /tools/fonts had six curated pairs with the
 * reasoning written down, and /tools/typography had eight of its own with
 * none. Two tools maintaining two overlapping pairing lists is how they
 * drift; this file is the union, and /tools/fonts now redirects to the
 * playground.
 *
 * Every pair is two Google Fonts (or one at two weights), each carrying the
 * weights the emitted next/font code should load and a sentence on why the
 * pairing works — the part a dropdown of family names cannot teach.
 */

export interface FontPairing {
  id: string
  /** Display label, e.g. "Fraunces + Inter". */
  name: string
  heading: { family: string; weights: string; stack: string }
  body: { family: string; weights: string; stack: string }
  mood: string
  why: string
}

export const FONT_PAIRINGS: FontPairing[] = [
  {
    id: 'inter-inter',
    name: 'Inter + Inter',
    heading: { family: 'Inter', weights: '700;800', stack: "'Inter', sans-serif" },
    body: { family: 'Inter', weights: '400;500', stack: "'Inter', sans-serif" },
    mood: 'Neutral · product',
    why: 'One family at two weights. The safest choice there is, and the reason most SaaS looks the way it does — contrast comes from weight and size rather than from two competing voices.',
  },
  {
    id: 'fraunces-inter',
    name: 'Fraunces + Inter',
    heading: { family: 'Fraunces', weights: '700;900', stack: "'Fraunces', serif" },
    body: { family: 'Inter', weights: '400;500', stack: "'Inter', sans-serif" },
    mood: 'Editorial · warm',
    why: 'A high-contrast serif over a neutral sans. The serif does all the talking, so the body can stay completely plain — which is what keeps long copy readable.',
  },
  {
    id: 'space-grotesk-ibm',
    name: 'Space Grotesk + IBM Plex Sans',
    heading: {
      family: 'Space Grotesk',
      weights: '600;700',
      stack: "'Space Grotesk', sans-serif",
    },
    body: {
      family: 'IBM Plex Sans',
      weights: '400;500',
      stack: "'IBM Plex Sans', sans-serif",
    },
    mood: 'Technical · modern',
    why: 'Space Grotesk has enough character to be a brand at display size and is unreadable as body text — which is exactly the division of labour you want.',
  },
  {
    id: 'playfair-source',
    name: 'Playfair + Source Sans',
    heading: {
      family: 'Playfair Display',
      weights: '700;900',
      stack: "'Playfair Display', serif",
    },
    body: {
      family: 'Source Sans 3',
      weights: '400;600',
      stack: "'Source Sans 3', sans-serif",
    },
    mood: 'Luxury · commerce',
    why: 'The thin/thick contrast in Playfair reads as expensive, and collapses at small sizes. Keep it above 32px and let the sans carry everything else.',
  },
  {
    id: 'dm-serif-dm-sans',
    name: 'DM Serif + DM Sans',
    heading: {
      family: 'DM Serif Display',
      weights: '400',
      stack: "'DM Serif Display', serif",
    },
    body: { family: 'DM Sans', weights: '400;500', stack: "'DM Sans', sans-serif" },
    mood: 'Friendly · editorial',
    why: 'Designed as a set, so the proportions already agree. The least risky way to use a serif heading if you are not confident pairing by eye.',
  },
  {
    id: 'jetbrains-inter',
    name: 'JetBrains Mono + Inter',
    heading: {
      family: 'JetBrains Mono',
      weights: '700',
      stack: "'JetBrains Mono', monospace",
    },
    body: { family: 'Inter', weights: '400;500', stack: "'Inter', sans-serif" },
    mood: 'Developer tool',
    why: 'A monospace heading signals "this is for engineers" faster than any copy does. Use it sparingly — a whole page of mono is a terminal, not a website.',
  },
  {
    id: 'merriweather-inter',
    name: 'Merriweather + Inter',
    heading: {
      family: 'Merriweather',
      weights: '700;900',
      stack: "'Merriweather', Georgia, serif",
    },
    body: { family: 'Inter', weights: '400;500', stack: "'Inter', system-ui, sans-serif" },
    mood: 'Longform · trustworthy',
    why: 'Merriweather was drawn for screens and holds its shape at any size, so it reads established rather than fashionable. Inter underneath stays invisible — the pairing for content you want believed.',
  },
  {
    id: 'lora-worksans',
    name: 'Lora + Work Sans',
    heading: { family: 'Lora', weights: '600;700', stack: "'Lora', Georgia, serif" },
    body: {
      family: 'Work Sans',
      weights: '400;500',
      stack: "'Work Sans', system-ui, sans-serif",
    },
    mood: 'Calm · editorial',
    why: 'Lora has calligraphic roots without the cost of a display serif — it stays warm at heading sizes without demanding attention. Work Sans is plain enough to never argue with it.',
  },
  {
    id: 'poppins-roboto',
    name: 'Poppins + Roboto',
    heading: {
      family: 'Poppins',
      weights: '600;700',
      stack: "'Poppins', system-ui, sans-serif",
    },
    body: { family: 'Roboto', weights: '400;500', stack: "'Roboto', system-ui, sans-serif" },
    mood: 'Geometric · friendly',
    why: 'Poppins is built on near-perfect circles, which reads playful and approachable at display size and exhausting in paragraphs. Roboto takes the paragraphs.',
  },
  {
    id: 'bitter-opensans',
    name: 'Bitter + Open Sans',
    heading: { family: 'Bitter', weights: '700;800', stack: "'Bitter', Georgia, serif" },
    body: {
      family: 'Open Sans',
      weights: '400;600',
      stack: "'Open Sans', system-ui, sans-serif",
    },
    mood: 'Sturdy · content',
    why: 'A slab serif carries weight on screen without the fragility of a high-contrast face, so headings feel grounded at any density. Open Sans is the least opinionated body there is.',
  },
  {
    id: 'cormorant-mulish',
    name: 'Cormorant + Mulish',
    heading: {
      family: 'Cormorant Garamond',
      weights: '600;700',
      stack: "'Cormorant Garamond', Georgia, serif",
    },
    body: {
      family: 'Mulish',
      weights: '400;600',
      stack: "'Mulish', system-ui, sans-serif",
    },
    mood: 'Elegant · fashion',
    why: 'Cormorant is a delicate display Garamond that rewards size and dies below it — a fashion-label voice as long as you keep it large. Mulish keeps the rest of the page in this century.',
  },
]

/** `next/font/google` import name — Space Grotesk → Space_Grotesk. */
const importName = (family: string) => family.replace(/ /g, '_')
const varName = (family: string) =>
  family.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

/**
 * The `next/font/google` version of a pairing rather than a `<link>`: it
 * self-hosts at build time, which removes the third-party request and the
 * layout shift that comes with it.
 */
export function buildNextFont(p: FontPairing): string {
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
