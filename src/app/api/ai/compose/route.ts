import { NextResponse } from 'next/server'
import { complete, isAiConfigured } from '@/lib/ai/claude'
import { getSession } from '@/lib/session'
import { getEntitlements, FREE_ENTITLEMENTS } from '@/lib/billing/entitlements'
import {
  spendCredits,
  refundCredits,
  costOf,
  ACTION_COSTS,
} from '@/lib/billing/credits'
import { PLANS } from '@/lib/billing/plans'
import { coerceBrandColor, DEFAULT_BRAND_COLOR, type BrandColor } from '@/lib/brand-presets'
import { resolveTokens } from '@/lib/export/design-system'
import { withJsonErrors } from '@/lib/route-errors'

/**
 * Compose a section from a brief.
 *
 * POST { brief, brand?, tone? } → { html, css, name, note }
 *
 * The third thing credits buy, and the one that makes them worth having a
 * subscription for. A variant edits something that already exists; this
 * starts from a sentence.
 *
 * What makes it worth doing here rather than in a general-purpose chat
 * window is the constraint set. The model is given this catalog's actual
 * design tokens and told to build inside them, so the output drops into a
 * Hoverlab project and looks like the rest of it — where the same brief in
 * a blank chat produces a section with its own greys, its own radii and a
 * palette that collapses in dark mode. Tokens plus a brief is a component;
 * a brief alone is a guess.
 *
 * COSTS 3, not 1. It is several times the output tokens of a variant, and
 * a meter that charges the same for both stops meaning anything. A cost
 * above 1 is also deliberately outside the free daily action — see
 * `spendCredits`, which only lets cost-1 actions draw on it. Five free
 * composes a day is a different product from five free recolours, and it
 * is not the one being given away.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_BRIEF = 600

interface Body {
  brief?: unknown
  brand?: unknown
  tone?: unknown
}

/** The tokens a composed section is allowed to reach for. */
const TOKEN_NAMES = [
  'background',
  'foreground',
  'card',
  'card-foreground',
  'muted',
  'muted-foreground',
  'primary',
  'primary-foreground',
  'accent',
  'accent-foreground',
  'border',
] as const

const SYSTEM_PROMPT = `You are a front-end engineer building one section of a marketing or product page.

You will be given a brief and a set of design tokens. Return ONLY a JSON object of this exact shape, with no markdown fence and no commentary:
  {"name": "Short Title Case name", "html": "...", "css": "...", "note": "one sentence on what you built"}

Rules:
  - One self-contained section. No imports, no external assets, no JavaScript, no images that are not inline SVG.
  - Plain HTML and plain CSS only. No frameworks, no utility classes, no preprocessor syntax.
  - Scope every selector under one root class named after the section, so it cannot leak into a page it is dropped into.
  - Use the supplied token colours and NOTHING else for colour. No literal greys, no invented hexes. This is the whole point: the section has to sit inside an existing design system rather than beside it.
  - It must hold on both light and dark backgrounds, because the tokens flip and the markup does not.
  - Responsive down to 360px with no horizontal scrolling. Use flex or grid, not fixed widths.
  - Real copy, not lorem ipsum. Write what the brief implies a real product would say.
  - Semantic markup: a section element, one heading of the right level, buttons that are buttons and links that are links.
  - Any animation must be wrapped in, or paired with, @media (prefers-reduced-motion: reduce).
  - "note" is for a human scanning a list. Say what you built, not that you are happy to help.`

/** Pull the JSON object out of whatever the model actually returned. */
function parseSection(
  raw: string,
): { name: string; html: string; css: string; note: string } | null {
  // Same defensive extraction as /api/ai/variant: models fence JSON despite
  // being asked not to, and occasionally prefix a sentence.
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end <= start) return null

  try {
    const parsed = JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>
    const html = typeof parsed.html === 'string' ? parsed.html.trim() : ''
    if (!html) return null
    return {
      name: typeof parsed.name === 'string' ? parsed.name.trim() : 'Section',
      html,
      css: typeof parsed.css === 'string' ? parsed.css.trim() : '',
      note: typeof parsed.note === 'string' ? parsed.note.trim() : 'Composed a section.',
    }
  } catch {
    return null
  }
}

/**
 * The palette, as CSS the model can read.
 *
 * Sent as a token table with hex values rather than as variable names
 * alone: a model told to use `var(--primary)` will use it, but has no idea
 * whether it is placing dark text on a dark ground. The hex is what lets
 * it reason about contrast; the variable name is what it must emit.
 */
function tokenBriefing(brand: BrandColor): string {
  const table = (theme: 'light' | 'dark') =>
    resolveTokens(brand, theme)
      .filter((t) => (TOKEN_NAMES as readonly string[]).includes(t.name))
      .map((t) => `  var(--${t.name})  ${t.hex}`)
      .join('\n')

  return (
    `Design tokens. Emit them as var(--name); the hex is shown only so you ` +
    `can reason about contrast.\n\nlight:\n${table('light')}\n\n` +
    `dark:\n${table('dark')}\n`
  )
}

export const POST = withJsonErrors('api/ai/compose', async (request: Request) => {
  const session = await getSession()
  if (!session) {
    return NextResponse.json(
      {
        error: 'Sign in to compose a section.',
        /*
         * Deliberately does NOT offer the free daily generations. They only
         * cover cost-1 actions — `spendCredits` takes the free path only
         * when cost === ACTION_COST — so composing can never draw on them,
         * and saying "includes 5 a day" here would promise a free compose
         * that the very next request refuses.
         */
        hint: `Composing costs ${ACTION_COSTS.compose} credits, which the free daily generations do not cover. A Pro licence includes ${PLANS.pro.includedCredits} credits that never expire, and top-up packs never expire either.`,
      },
      { status: 401 },
    )
  }

  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const brief = typeof body.brief === 'string' ? body.brief.trim().slice(0, MAX_BRIEF) : ''
  if (!brief) {
    return NextResponse.json(
      { error: 'Describe the section you want.' },
      { status: 400 },
    )
  }

  const tone = typeof body.tone === 'string' ? body.tone.trim().slice(0, 60) : ''
  // Defaults to Hoverlab's own brand rather than refusing: someone who has
  // not picked a brand still wants a section, and the catalog's tokens are
  // a reasonable thing to build inside.
  const brand = coerceBrandColor(body.brand) ?? DEFAULT_BRAND_COLOR

  /*
   * Refuse before charging. Three credits is the largest single spend in
   * the app, and spending then refunding it against a model that cannot be
   * reached is the worst version of this failure.
   */
  if (!isAiConfigured()) {
    return NextResponse.json(
      { error: 'Composing is not configured on this deployment.' },
      { status: 503 },
    )
  }

  const ent = await getEntitlements(session.uid).catch(() => FREE_ENTITLEMENTS)
  const cost = costOf('compose')
  const spend = await spendCredits(session.uid, ent, cost)

  if (!spend.ok) {
    return NextResponse.json(
      {
        error:
          spend.reason === 'out_of_free'
            ? `Composing costs ${cost} credits, and the free daily generations only cover the cheaper actions.`
            : `You need ${cost} credits to compose a section.`,
        reason: spend.reason,
        cost,
        // Both refusals here point at a purchase, unlike /variant: a
        // cost-3 action is never covered by the free daily allowance, so
        // "come back tomorrow" would be false.
        offer: spend.reason === 'out_of_free' ? 'plus' : 'topup',
      },
      { status: 402 },
    )
  }

  const userPrompt =
    `${tokenBriefing(brand)}\n` +
    `${tone ? `Tone: ${tone}\n\n` : ''}` +
    `Brief: ${brief}`

  try {
    // The most effort of the three, and the only route that earns it. A
    // compose starts from a sentence and has to satisfy every rule in the
    // system prompt at once — tokens only, both themes, responsive to
    // 360px, semantic markup, reduced-motion. It also costs three credits,
    // so the budget is there to spend.
    const raw = await complete({
      system: SYSTEM_PROMPT,
      user: userPrompt,
      maxTokens: 16000,
      effort: 'high',
    })

    const section = parseSection(raw)
    if (!section) {
      // Unusable output is our failure, not the user's spend.
      await refundCredits(session.uid, spend.source, cost)
      return NextResponse.json(
        { error: 'The model returned something unusable. Try again.' },
        { status: 502 },
      )
    }

    return NextResponse.json({
      ...section,
      spent: { source: spend.source, cost, remaining: spend.remaining },
    })
  } catch (err) {
    await refundCredits(session.uid, spend.source, cost)
    console.error('[/api/ai/compose] LLM call failed:', err)
    return NextResponse.json(
      { error: 'Composing is temporarily unavailable. Your credits were not spent.' },
      { status: 503 },
    )
  }
})
