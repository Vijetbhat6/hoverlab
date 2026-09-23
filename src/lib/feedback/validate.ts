import { ARTIFACT_LEVELS, type ArtifactLevel } from '@/lib/artifact-types'

/**
 * What a piece of feedback may contain, decided in one place.
 *
 * Shared by the route that accepts it and the tests that pin it, and free of
 * any catalog or database import: the "does this artifact exist" check is
 * passed in, so this module can be exercised without loading four catalogs.
 *
 * ── WHY EVERYTHING IS AN ALLOW-LIST ────────────────────────────────────
 *
 * `/api/feedback` is public, takes no account, and writes a Firestore
 * document per call. Anything an anonymous caller can put in a field ends up
 * in a collection the owner reads. So nothing is passed through on trust:
 * `level` and `kind` must be members of fixed lists, `id` must name a real
 * artifact, and the two free-text fields are length-capped and stripped of
 * control characters. An unknown key in the body is simply never read.
 *
 * ── THE HONEYPOT ───────────────────────────────────────────────────────
 *
 * `website` is a field no human sees. A bot that fills it is answered
 * exactly as a real submission would be — `ok` — and nothing is stored.
 * Rejecting it visibly would only teach the bot to leave the field alone.
 */

/** A thumb, with no text attached. */
export const VOTE_KINDS = ['thumbs-up', 'thumbs-down'] as const

/** A problem report. The message is required. */
export const PROBLEM_KINDS = ['broken-preview', 'wrong-code', 'accessibility', 'other'] as const

export const FEEDBACK_KINDS = [...VOTE_KINDS, ...PROBLEM_KINDS] as const

export type VoteKind = (typeof VOTE_KINDS)[number]
export type ProblemKind = (typeof PROBLEM_KINDS)[number]
export type FeedbackKind = (typeof FEEDBACK_KINDS)[number]

/** Human labels, for the report dialog and for the reader script. */
export const PROBLEM_LABEL: Record<ProblemKind, string> = {
  'broken-preview': 'The preview is broken',
  'wrong-code': 'The code is wrong',
  accessibility: 'Accessibility problem',
  other: 'Something else',
}

export const FEEDBACK_LIMITS = {
  /** Characters in a problem report. */
  message: 1000,
  /** Shortest report worth storing. */
  messageMin: 3,
  /** Same ceiling as an email address anywhere else in the app. */
  email: 254,
  /** Longest artifact id accepted before the catalog is even consulted. */
  id: 200,
} as const

/**
 * Characters of request body read before giving up. A valid submission is a few
 * hundred bytes; this leaves room for a full 1000-character message in
 * multi-byte text and refuses anything larger without parsing it.
 */
export const MAX_BODY_CHARS = 8 * 1024

export interface FeedbackInput {
  level: ArtifactLevel
  id: string
  kind: FeedbackKind
  /** Empty string for a thumb. */
  message: string
  /** Absent unless the person chose to leave one. */
  email?: string
}

export type FeedbackVerdict =
  | { ok: true; value: FeedbackInput }
  | { ok: false; status: 400 | 404; error: string }
  /** The honeypot was filled: answer as success, store nothing. */
  | { ok: false; honeypot: true }

/**
 * Strip control characters and normalise whitespace ends.
 *
 * Newlines and tabs survive — a bug report legitimately has line breaks —
 * but every other C0/C1 control is removed, so a message cannot smuggle
 * terminal escape sequences into the reader script's output.
 */
export function cleanText(value: string): string {
  let out = ''
  for (const ch of value) {
    const code = ch.codePointAt(0) ?? 0
    // Tab (9), line feed (10) and carriage return (13) are kept; every other
    // C0 control and the whole C1 range (0x7f-0x9f) is dropped. Written as
    // code points rather than a regex of escapes so the source itself
    // contains no control characters.
    const keep = code === 9 || code === 10 || code === 13
    const control = (code < 32 && !keep) || (code >= 127 && code <= 159)
    if (!control) out += ch
  }
  return out.trim()
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Validate an untrusted body.
 *
 * `exists` answers whether `(level, id)` is a real artifact. It is a
 * parameter, not an import, so the rule "the id must exist" is enforced here
 * and the catalog lookup stays in the server-only module that owns catalogs.
 */
export function validateFeedback(
  raw: unknown,
  exists: (level: ArtifactLevel, id: string) => boolean,
): FeedbackVerdict {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, status: 400, error: 'Send a JSON object.' }
  }
  const body = raw as Record<string, unknown>

  // Checked first so a bot that filled it learns nothing from any other rule.
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return { ok: false, honeypot: true }
  }

  const level = ARTIFACT_LEVELS.find((l) => l === body.level)
  if (!level) return { ok: false, status: 400, error: 'Unknown artifact type.' }

  const kind = FEEDBACK_KINDS.find((k) => k === body.kind)
  if (!kind) return { ok: false, status: 400, error: 'Unknown feedback kind.' }

  const id = typeof body.id === 'string' ? body.id.trim() : ''
  if (!id || id.length > FEEDBACK_LIMITS.id) {
    return { ok: false, status: 400, error: 'Missing or invalid artifact id.' }
  }
  if (!exists(level, id)) {
    return { ok: false, status: 404, error: 'That artifact does not exist.' }
  }

  const isVote = (VOTE_KINDS as readonly string[]).includes(kind)

  let message = ''
  if (typeof body.message === 'string') {
    if (body.message.length > FEEDBACK_LIMITS.message) {
      return {
        ok: false,
        status: 400,
        error: `Keep it under ${FEEDBACK_LIMITS.message} characters.`,
      }
    }
    message = cleanText(body.message)
  }

  if (isVote) {
    // A thumb carries no text. Drop it rather than store free text attached
    // to a kind that never asked for any.
    message = ''
  } else if (message.length < FEEDBACK_LIMITS.messageMin) {
    return { ok: false, status: 400, error: 'Tell us what went wrong in a few words.' }
  }

  let email: string | undefined
  if (typeof body.email === 'string' && body.email.trim() !== '') {
    const candidate = body.email.trim()
    if (candidate.length > FEEDBACK_LIMITS.email || !EMAIL_RE.test(candidate)) {
      return { ok: false, status: 400, error: 'That email address does not look right.' }
    }
    // Only kept for a report. A thumb has nobody to reply to.
    if (!isVote) email = candidate.toLowerCase()
  }

  return { ok: true, value: { level, id, kind, message, ...(email ? { email } : {}) } }
}
