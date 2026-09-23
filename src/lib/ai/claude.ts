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

/**
 * An image to send alongside the request.
 *
 * `data` is base64 with no data-URL prefix. The type is the three the vision
 * API takes and a canvas can produce; whether the bytes really are that type
 * is the caller's job to have checked (`validateImage` in `./search-image`) —
 * this file forwards what it is given.
 */
export interface AiImage {
  mediaType: 'image/png' | 'image/jpeg' | 'image/webp'
  data: string
}

export interface CompleteOptions {
  /** The brief: role, rules, output contract. */
  system: string
  /** The request itself. */
  user: string
  /**
   * Images to put in front of `user`, in order. Absent or empty is the
   * plain-text request every existing caller makes, sent exactly as before.
   */
  images?: readonly AiImage[]
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
 * How long one model call may take before this gives up, in milliseconds.
 *
 * The routes charge first and refund in a `catch`. That only works if the
 * call ENDS with an error: the SDK's own ceiling is ten minutes, and a
 * serverless host kills the function long before that — with nothing left
 * running to refund anyone. So the deadline is ours and set below the host's
 * limit, which turns "the platform killed us and the credits vanished" into
 * "the call timed out and the credits came back".
 *
 * Set `AI_TIMEOUT_MS` to the host's function limit minus a few seconds
 * (Netlify's is a plan setting this file cannot read). Retries are off for the
 * same reason: a retry is a second full deadline, so two would double the
 * time this is meant to bound.
 */
const DEFAULT_TIMEOUT_MS = 45_000

function timeoutMs(): number {
  const parsed = Number(process.env.AI_TIMEOUT_MS)
  return Number.isFinite(parsed) && parsed >= 1_000 ? parsed : DEFAULT_TIMEOUT_MS
}

/**
 * The user turn's content: the bare string when there are no images, so a
 * text request is byte-for-byte what it was before images existed; otherwise
 * the image blocks first and the text after them, which is the order the
 * vision docs recommend (look, then read the question about it).
 *
 * Exported for the request-shape test, since `complete` itself cannot be
 * called without a key.
 */
export function buildContent(
  user: string,
  images: readonly AiImage[] | undefined,
): string | Anthropic.ContentBlockParam[] {
  if (!images || images.length === 0) return user
  return [
    ...images.map(
      (img): Anthropic.ImageBlockParam => ({
        type: 'image',
        source: { type: 'base64', media_type: img.mediaType, data: img.data },
      }),
    ),
    { type: 'text', text: user },
  ]
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
  images,
  maxTokens,
  effort,
}: CompleteOptions): Promise<string> {
  const response = await getClient().messages.create(
    {
      model: AI_MODEL,
      max_tokens: maxTokens,
      system,
      output_config: { effort },
      messages: [{ role: 'user', content: buildContent(user, images) }],
    },
    { timeout: timeoutMs(), maxRetries: 0 },
  )

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
