import { NextResponse } from 'next/server'
import { complete, isAiConfigured } from '@/lib/ai/claude'
import { getSession } from '@/lib/session'
import { getEntitlements, FREE_ENTITLEMENTS } from '@/lib/billing/entitlements'
import {
  spendCredits,
  refundCredits,
  costOf,
  FREE_DAILY_ACTIONS,
} from '@/lib/billing/credits'
import { coerceBrandColor } from '@/lib/brand-presets'
import { resolveTokens } from '@/lib/export/design-system'
import { withJsonErrors } from '@/lib/route-errors'

/**
 * Generate a variation of an effect, or apply a described change to one.
 *
 * POST { html, css, prompt?, mode? } → { html, css, note }
 *
 * This is what credits buy. Everything else on this site is static data
 * that costs nothing to serve, which is why everything else is free; this
 * one spends tokens per call, so it is the one thing metered.
 *
 * Three modes, and the difference is what the user is asking for:
 *   'edit'      apply `prompt` to the given markup and CSS.
 *   'variation' produce a different take on the same component, no prompt.
 *   'brand'     rewrite the component's colours to a supplied brand.
 *
 * 'brand' is the one worth explaining. The catalog is styled through design
 * tokens, so a block already follows a brand for free — but an *effect* is
 * hand-written CSS with literal colours in it, which is exactly the rung
 * tokens cannot reach. Recolouring one by hand means finding every hex,
 * every rgba shadow and every gradient stop and moving them together
 * without flattening the design. That is a real task, it is the natural
 * companion to the design-system export, and it is what credits are for.
 *
 * Order of operations is deliberate: charge, then generate, then refund on
 * failure. Generating first and charging after leaves an endpoint that is
 * free to anyone willing to make it fail, and charging without a refund
 * path takes money for nothing when the model times out.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Cap on what we will send. A prompt this size already costs real money. */
const MAX_CSS = 8000
const MAX_HTML = 4000
const MAX_PROMPT = 500

interface Body {
  html?: unknown
  css?: unknown
  prompt?: unknown
  mode?: unknown
  /** `'brand'` mode only — a BrandColor, or a preset id. */
  brand?: unknown
}

const SYSTEM_PROMPT = `You are a CSS specialist working inside a component catalog.

You will be given the HTML and CSS of one small, self-contained UI component, and either a requested change or an instruction to produce a variation.

Return ONLY a JSON object of this exact shape, with no markdown fence and no commentary:
  {"html": "...", "css": "...", "note": "one short sentence describing what changed"}

Rules:
  - Keep the component self-contained: no imports, no external assets, no JavaScript.
  - Keep the same class names as the input unless the change requires otherwise, so the result drops into the same markup.
  - Plain CSS only — no preprocessor syntax, no Tailwind utilities in the CSS.
  - Preserve any @media (prefers-reduced-motion: reduce) block, and add one if you introduce animation that does not have it.
  - Do not rely on a colour scheme: the component is shown on both light and dark backgrounds, so use colours that hold on both, or use currentColor.
  - The result must be materially different from the input. A change of one hex value is not a variation.
  - "note" is for a human reading a list of variations. Say what changed, not that you are happy to help.`

/** Pull the JSON object out of whatever the model actually returned. */
function parseVariant(raw: string): { html: string; css: string; note: string } | null {
  // Models fence JSON despite being asked not to, and occasionally prefix a
  // sentence. Take the outermost braces rather than trusting the whole
  // string to parse.
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end <= start) return null

  try {
    const parsed = JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>
    const css = typeof parsed.css === 'string' ? parsed.css.trim() : ''
    if (!css) return null
    return {
      html: typeof parsed.html === 'string' ? parsed.html.trim() : '',
      css,
      note: typeof parsed.note === 'string' ? parsed.note.trim() : 'Generated a variation.',
    }
  } catch {
    return null
  }
}

export const POST = withJsonErrors('api/ai/variant', async (request: Request) => {
  const session = await getSession()
  if (!session) {
    return NextResponse.json(
      {
        error: 'Sign in to generate variations.',
        // Said here rather than only on the pricing page: the person
        // reading this is one click from the thing they wanted.
        hint: `Signing in is free and includes ${FREE_DAILY_ACTIONS} generations a day.`,
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

  const css = typeof body.css === 'string' ? body.css.trim().slice(0, MAX_CSS) : ''
  const html = typeof body.html === 'string' ? body.html.trim().slice(0, MAX_HTML) : ''
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim().slice(0, MAX_PROMPT) : ''
  const mode =
    body.mode === 'edit' ? 'edit' : body.mode === 'brand' ? 'brand' : 'variation'

  /*
   * The brand, resolved server-side into the actual token values rather
   * than passed to the model as four floats. A model told "hue 265,
   * chroma 0.2" invents its own interpretation of OKLCH; a model given
   * `--primary: 265 65% 55%` and the hex beside it has nothing to guess.
   */
  const brand = mode === 'brand' ? coerceBrandColor(body.brand) : null
  if (mode === 'brand' && !brand) {
    return NextResponse.json(
      { error: 'Give me a brand colour to work from.' },
      { status: 400 },
    )
  }

  if (!css) {
    return NextResponse.json({ error: 'Give me some CSS to work from.' }, { status: 400 })
  }
  if (mode === 'edit' && !prompt) {
    return NextResponse.json(
      { error: 'Describe the change you want.' },
      { status: 400 },
    )
  }

  /*
   * Refuse before charging, not after. The catch below refunds, so a
   * missing key was survivable — but it made every request a spend and a
   * refund against a model that was never going to answer, and reported it
   * as a temporary outage. This says the true thing instead.
   */
  if (!isAiConfigured()) {
    return NextResponse.json(
      { error: 'Generation is not configured on this deployment.' },
      { status: 503 },
    )
  }

  const ent = session ? await getEntitlements(session.uid) : FREE_ENTITLEMENTS
  /*
   * The cost is resolved from the mode, so a new mode cannot be added
   * without deciding what it charges. `brand` costs the same as a variant
   * — it is the same size of call — and both stay eligible for the free
   * daily action, which a cost above 1 would not be.
   */
  const cost = costOf(mode === 'brand' ? 'brand' : 'variant')
  const spend = await spendCredits(session.uid, ent, cost)

  if (!spend.ok) {
    return NextResponse.json(
      {
        error:
          spend.reason === 'out_of_free'
            ? `That's your ${FREE_DAILY_ACTIONS} free generations for today.`
            : 'You are out of credits.',
        reason: spend.reason,
        // The two refusals need different offers — one is a wait, the
        // other is a purchase — and the client should not have to guess
        // which from the wording.
        offer: spend.reason === 'out_of_free' ? 'plus' : 'topup',
      },
      { status: 402 },
    )
  }

  /**
   * The brand, as the palette the model should actually use.
   *
   * Both themes are sent, because the catalog is demoed on light and dark
   * grounds and a recolour that only holds on one of them is a recolour
   * that has to be done again. Hex rather than the OKLCH the brand really
   * is: a model handed "chroma 0.2" invents its own reading of the space,
   * where a hex is unambiguous.
   */
  function brandBriefing(): string {
    if (!brand) return ''
    const table = (theme: 'light' | 'dark') =>
      resolveTokens(brand, theme)
        .filter((t) => ['primary', 'accent', 'ring'].includes(t.name))
        .map((t) => `  --${t.name}: ${t.hex}`)
        .join('\n')
    return (
      `The brand palette to move this component onto:\n\n` +
      `light:\n${table('light')}\n\ndark:\n${table('dark')}\n\n` +
      `Replace the component's own accent colours with these. Keep its ` +
      `structure, its timing and its relative contrast exactly as they are - ` +
      `this is a recolour, not a redesign. Neutral greys, whites and blacks ` +
      `stay as they are; only the colours carrying identity move.\n\n`
    )
  }

  const userPrompt =
    mode === 'edit'
      ? `Apply this change: ${prompt}\n\nHTML:\n${html || '(none supplied)'}\n\nCSS:\n${css}`
      : mode === 'brand'
        ? `${brandBriefing()}HTML:\n${html || '(none supplied)'}\n\nCSS:\n${css}`
        : `Produce a distinctly different variation of this component.${
            prompt ? ` Lean towards: ${prompt}` : ''
          }\n\nHTML:\n${html || '(none supplied)'}\n\nCSS:\n${css}`

  try {
    // Middle effort. A recolour or an edit is a constrained rewrite of
    // something that already works — the structure is given, and the job is
    // to respect it. That is meaningfully harder than ranking and
    // meaningfully easier than composing from a sentence.
    const raw = await complete({
      system: SYSTEM_PROMPT,
      user: userPrompt,
      maxTokens: 16000,
      effort: 'medium',
    })

    const variant = parseVariant(raw)
    if (!variant) {
      // Unusable output is our failure, not the user's spend.
      await refundCredits(session.uid, spend.source, cost)
      return NextResponse.json(
        { error: 'The model returned something unusable. Try again.' },
        { status: 502 },
      )
    }

    return NextResponse.json({
      html: variant.html || html,
      css: variant.css,
      note: variant.note,
      spent: { source: spend.source, remaining: spend.remaining },
    })
  } catch (err) {
    await refundCredits(session.uid, spend.source, cost)
    console.error('[/api/ai/variant] LLM call failed:', err)
    return NextResponse.json(
      { error: 'Generation is temporarily unavailable. Your credit was not spent.' },
      { status: 503 },
    )
  }
})
