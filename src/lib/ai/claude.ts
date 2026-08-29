import Anthropic from '@anthropic-ai/sdk'

/**
 * The one place this app talks to a model.
 *
 * ────────────────────────────────────────────────────────────────────────
 *  Replaces `z-ai-web-dev-sdk`, which could not run here.
 * ────────────────────────────────────────────────────────────────────────
 *
 * The three AI routes — variant, compose and search — each used to call
 * `ZAI.create()` directly. That SDK reads its credentials from a
 * `.z-ai-config` file in the working directory, the home directory or
 * /etc. There is no environment-variable path, the file is gitignored, and
 * a serverless deploy has no filesystem to put one on. So every call threw
 * `Configuration file not found or invalid` in production.
 *
 * What made that expensive rather than merely broken: all three routes
 * catch, refund the credit and return "temporarily unavailable". Nothing
 * errored, nothing alerted, and Pro+ went on charging $9/month for a
 * feature whose every request failed politely. A loud failure would have
 * been found in a day.
 *
 * The lesson worth keeping: a graceful degradation path needs a
 * configuration check in front of it, or it hides the outage it was built
 * to survive. Hence `isAiConfigured()` — the routes now refuse *before*
 * spending anything, and say which of the two it is.
 */

/**
 * The model these routes run on.
 *
 * One constant because all three want the same trade: strong instruction
 * following on a tightly constrained output format. They differ in effort,
 * not in model — see `AiEffort` below.
 */
export const AI_MODEL = 'claude-opus-5'

/**
 * How hard the model works on a request.
 *
 * Maps to `output_config.effort`. Chosen per route rather than globally
 * because the three jobs are genuinely different sizes: ranking twenty ids
 * out of eighty is not the same work as writing a responsive section that
 * holds in both themes, and paying the same for both would be a waste at
 * one end and a false economy at the other.
 */
export type AiEffort = 'low' | 'medium' | 'high'

export interface CompleteOptions {
  /** The brief: role, rules, output contract. */
  system: string
  /** The request itself. */
  user: string
  /**
   * Ceiling on the response, thinking included.
   *
   * Not a spend target — it is the point at which output is cut off
   * mid-sentence, which for a JSON contract means an unparseable answer
   * and a refunded credit. Err high.
   */
  maxTokens: number
  effort: AiEffort
}

/**
 * Thrown when no API key is configured.
 *
 * A distinct type so a route can tell "we are not set up" apart from "the
 * model call failed", and answer differently. The first is our
 * misconfiguration and should never charge; the second is an outage and
 * should refund.
 */
export class AiNotConfiguredError extends Error {
  constructor() {
    super(
      'ANTHROPIC_API_KEY is not set, so the AI routes cannot call a model.',
    )
    this.name = 'AiNotConfiguredError'
  }
}

/**
 * Whether a model can be reached at all.
 *
 * Call this before metering. Deliberately a function rather than a
 * module-scope constant so a test — and a running server after an
 * environment change — sees the current value.
 */
export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim())
}

/**
 * Lazily constructed, then reused.
 *
 * Built on first use rather than at import so that a deployment without a
 * key can still import this module — every route does, and a constructor
 * that threw at import time would take out the whole route rather than the
 * one request that needed a model.
 */
let client: Anthropic | null = null

function getClient(): Anthropic {
  if (!isAiConfigured()) throw new AiNotConfiguredError()
  client ??= new Anthropic()
  return client
}

/**
 * Send one request, get the text back.
 *
 * Returns only the text blocks. The response also carries a `thinking`
 * block — adaptive thinking is on by default on this model — and
 * concatenating that into the result would put prose in front of a JSON
 * contract that three separate parsers are trying to read.
 *
 * Thinking is left ON deliberately, despite every caller wanting nothing
 * but JSON. Turning it off on this model has a documented failure mode
 * where reasoning leaks into the visible text as `<thinking>` tags — which
 * is precisely the thing that breaks a JSON parser. Lower effort is the
 * cheaper lever and does not carry that risk.
 */
export async function complete({
  system,
  user,
  maxTokens,
  effort,
}: CompleteOptions): Promise<string> {
  const response = await getClient().messages.create({
    model: AI_MODEL,
    max_tokens: maxTokens,
    system,
    output_config: { effort },
    messages: [{ role: 'user', content: user }],
  })

  // A safety refusal arrives as a 200 with no usable content. Surfacing it
  // as an ordinary failure is right: the caller refunds and says try again,
  // which is true, rather than handing a parser an empty string and
  // reporting "the model returned something unusable".
  if (response.stop_reason === 'refusal') {
    throw new Error(
      `Model declined the request (${response.stop_details?.category ?? 'unspecified'}).`,
    )
  }

  return response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('')
}
