import { NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { getSession } from '@/lib/session'
import { getEntitlements, FREE_ENTITLEMENTS } from '@/lib/billing/entitlements'
import { spendCredits, refundCredits, FREE_DAILY_ACTIONS } from '@/lib/billing/credits'
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
 * Two modes, and the difference is whether the user has a direction in
 * mind:
 *   'edit'      apply `prompt` to the given markup and CSS.
 *   'variation' produce a different take on the same component, no prompt.
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
  const mode = body.mode === 'edit' ? 'edit' : 'variation'

  if (!css) {
    return NextResponse.json({ error: 'Give me some CSS to work from.' }, { status: 400 })
  }
  if (mode === 'edit' && !prompt) {
    return NextResponse.json(
      { error: 'Describe the change you want.' },
      { status: 400 },
    )
  }

  const ent = session ? await getEntitlements(session.uid) : FREE_ENTITLEMENTS
  const spend = await spendCredits(session.uid, ent)

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

  const userPrompt =
    mode === 'edit'
      ? `Apply this change: ${prompt}\n\nHTML:\n${html || '(none supplied)'}\n\nCSS:\n${css}`
      : `Produce a distinctly different variation of this component.${
          prompt ? ` Lean towards: ${prompt}` : ''
        }\n\nHTML:\n${html || '(none supplied)'}\n\nCSS:\n${css}`

  try {
    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      thinking: { type: 'disabled' },
    })

    const variant = parseVariant(completion.choices[0]?.message?.content ?? '')
    if (!variant) {
      // Unusable output is our failure, not the user's spend.
      await refundCredits(session.uid, spend.source)
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
    await refundCredits(session.uid, spend.source)
    console.error('[/api/ai/variant] LLM call failed:', err)
    return NextResponse.json(
      { error: 'Generation is temporarily unavailable. Your credit was not spent.' },
      { status: 503 },
    )
  }
})
