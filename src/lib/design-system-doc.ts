import tokens from './generated-dna.json'

/**
 * The design system, as prose an agent can read — and nothing else.
 *
 * This was inside `lib/dna.ts` and had to come out for one reason: the
 * clipboard prompt on an effect page is built in the browser, and
 * `lib/dna.ts` reaches into the block, page, template and effect indices to
 * resolve a subject. Importing it from a client component pulls the whole
 * catalog into the bundle — the same 1.6 MB trap the loader studio's
 * docblock describes.
 *
 * So the half that needs no catalog lives here. `generated-dna.json` is
 * 1.7 KB and is itself parsed out of the `globals.css` every scaffolded
 * project ships with, so the token block below cannot describe a palette
 * the templates do not use.
 *
 * The rule lists matter more than they look. They are the difference
 * between an agent that emits `bg-white` and one that emits `bg-card`, and
 * the failure mode of duplicating them is not a crash — it is two documents
 * that agree today and quietly disagree in six months, one of them teaching
 * the wrong system. One copy, two readers.
 */

/** The CSS custom-property block, both themes, ready to paste. */
export function tokenCss(): string {
  return [
    ':root {',
    tokenTable('light'),
    `  --radius: ${tokens.radius};`,
    '}',
    '',
    '.dark {',
    tokenTable('dark'),
    '}',
  ].join('\n')
}

function tokenTable(theme: 'light' | 'dark'): string {
  const values = theme === 'light' ? tokens.light : tokens.dark
  return (tokens.colorKeys as string[])
    .filter((key) => values[key as keyof typeof values])
    .map((key) => `  --${key}: ${values[key as keyof typeof values]};`)
    .join('\n')
}

/**
 * Why the tokens are bare channels and not `hsl(...)` calls.
 *
 * An agent that "tidies" these into complete colour values breaks every
 * alpha suffix in the catalog at once, and the breakage is silent: the
 * class still compiles, it just stops being translucent. Worth a sentence.
 */
export const TOKEN_FORMAT_NOTE =
  'Bare HSL channels, not `hsl(...)` calls — that is what lets Tailwind ' +
  'compose an alpha suffix, so `bg-primary/10` expands to ' +
  '`hsl(var(--primary) / 0.1)`. Keep the format.'

/** Everything that is not colour: radius, spacing, type, borders. */
export const SHAPE_AND_TYPE: string[] = [
  `**Radius**: \`--radius: ${tokens.radius}\`. Tailwind maps \`rounded-lg\` to it, with \`md\` and \`sm\` derived 2px and 4px tighter. Do not hand-pick radii per component.`,
  "**Spacing**: Tailwind's default scale, untouched. Sections run `py-16 sm:py-24`; card padding is `p-6`.",
  '**Type**: one display face and one text face, set on `body` and inherited. Headings carry `text-wrap: balance`; body text stays near 65 characters.',
  '**Borders**: `border-border` everywhere, never a literal grey. The global base layer already applies it to `*`.',
]

/** How things move, including the part that keeps it accessible. */
export const MOTION: string[] = [
  'Entrances are short — under ~400ms — and staggered rather than simultaneous.',
  'Hover and focus transitions are `transition-colors`, ~150ms.',
  "Animation is written with Tailwind's `motion-safe:` prefix, and a global `prefers-reduced-motion` block neutralises anything that forgets. Keep both.",
]

/** The numbered list an agent should follow when it writes new UI. */
export const GENERATED_UI_RULES: string[] = [
  'Style with the semantic classes — `bg-card`, `text-muted-foreground`, `border-border`, `bg-primary` — never a literal hex or a Tailwind palette colour. That is what makes both themes work at once.',
  'Every surface pairs with its own foreground token: `bg-card` with `text-card-foreground`, `bg-primary` with `text-primary-foreground`.',
  'One accent. `--primary` is the only chromatic colour in the system; `--destructive` is for destructive actions and nothing else.',
  'Check both themes before calling anything finished.',
  'Give every interactive element a visible focus state, using `--ring`.',
]

/** The token format id and radius, for callers that want the raw values. */
export const TOKEN_FACTS = { format: tokens.format, radius: tokens.radius }
