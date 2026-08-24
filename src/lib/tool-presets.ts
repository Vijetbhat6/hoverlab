/**
 * Saved designer-tool state — the reason to have an account.
 *
 * The twenty-one tools under /tools are, on the traffic numbers, the
 * largest acquisition surface this site has, and until this file existed
 * they led nowhere: every one of them wrote its state to `localStorage`
 * under a `hoverlab:tool:*` key and that was the end of the relationship.
 * Someone who spent twenty minutes tuning a token scale lost it by opening
 * their laptop instead of their desktop, and we never learned their name.
 *
 * What is being sold here is nothing. This is deliberate, and it is the
 * whole design:
 *
 *   anonymous    every tool works, every output copies, `localStorage`
 *                keeps the last state on this browser. Nothing is withheld
 *                and nothing nags — the tools are the funnel, and a funnel
 *                with a gate in it is a wall.
 *
 *   free account named presets, kept server-side and available on every
 *                machine. This is a FREE tier feature on purpose. Coolors
 *                charges for the equivalent; we are not trying to make $36
 *                a year from a palette, we are trying to turn an anonymous
 *                search visitor into a known one before asking them for
 *                anything. The ask comes later, from the catalog.
 *
 * State is opaque to the server. A preset is `{ tool, name, state }` where
 * `state` is whatever that tool's own reducer keeps, validated for shape
 * and size but never for meaning. The alternative — a schema per tool,
 * server-side — would mean a route change every time a tool grew a slider,
 * and the server has no opinion worth having about what a spacing scale is.
 *
 * The cost of opacity is that garbage round-trips faithfully. That is
 * acceptable because the only reader is the tool that wrote it, and every
 * tool already merges restored state over its own defaults — a stale key
 * from an older version of the tool is ignored the same way a stale
 * `localStorage` blob already was.
 */

/** Bounds one request rather than rationing the feature. */
export const TOOL_PRESET_LIMITS = {
  /** Saved presets per account, across all tools. */
  perAccount: 200,
  /** Saved presets per tool, per account. */
  perTool: 40,
  /** Characters in a preset name. */
  nameLength: 60,
  /**
   * Serialized bytes of one preset's `state`.
   *
   * Generous next to what any current tool keeps — the token generator's
   * state is four numbers — because the cap exists to stop a document from
   * being used as free storage, not to make tools economise. A tool that
   * genuinely needs more than this is keeping a document, not a preset.
   */
  stateBytes: 8 * 1024,
  /**
   * How deep `state` may nest.
   *
   * Firestore rejects deeply nested maps anyway, but it does so at write
   * time with an error the user sees as a failed save. Rejecting here makes
   * it a 400 with a sentence instead.
   */
  stateDepth: 6,
} as const

/** One saved tool state a customer named and kept. */
export interface ToolPreset {
  /** Stable client-generated id, and the Firestore document key. */
  id: string
  /** The tool's route, e.g. `/tools/tokens`. Namespaces the preset list. */
  tool: string
  name: string
  /** Whatever the tool keeps. Opaque here — see the note above. */
  state: Record<string, unknown>
  /** ISO 8601. */
  createdAt: string
  /** ISO 8601. Bumped on every overwrite, and what the list sorts by. */
  updatedAt: string
}

/**
 * A tool id we will store presets for.
 *
 * Checked against a pattern rather than against `DESIGNER_TOOLS` on
 * purpose. Importing the registry here would pull `lucide-react` into the
 * route handler's bundle to validate a string, and the failure it would
 * catch — a preset saved against a tool that was later renamed — is one
 * this system already survives: the preset simply never appears, because
 * nothing asks for that tool's list.
 */
const TOOL_PATTERN = /^\/tools\/[a-z0-9-]{1,40}$/

export function isToolId(value: unknown): value is string {
  return typeof value === 'string' && TOOL_PATTERN.test(value)
}

/**
 * True when `value` is a plain JSON tree within the depth limit.
 *
 * Rejects rather than strips. A preset whose state was partly dropped would
 * restore a tool into a state the user never chose, which is worse than
 * refusing the save and saying so.
 */
function isPlainJson(value: unknown, depth: number): boolean {
  if (depth > TOOL_PRESET_LIMITS.stateDepth) return false
  if (value === null) return true
  switch (typeof value) {
    case 'string':
    case 'boolean':
      return true
    case 'number':
      // NaN and ±Infinity survive `typeof` and die in JSON.stringify,
      // where they become `null` — a silent value change on a slider.
      return Number.isFinite(value)
    case 'object':
      if (Array.isArray(value)) return value.every((v) => isPlainJson(v, depth + 1))
      if (Object.getPrototypeOf(value) !== Object.prototype) return false
      return Object.values(value as Record<string, unknown>).every((v) =>
        isPlainJson(v, depth + 1),
      )
    default:
      return false
  }
}

/** Byte length of the serialized state, or null when it will not serialize. */
export function stateBytes(state: unknown): number | null {
  try {
    return new TextEncoder().encode(JSON.stringify(state)).length
  } catch {
    // Circular reference, or a BigInt. `isPlainJson` catches both, so this
    // is belt-and-braces rather than a live path.
    return null
  }
}

/**
 * Why a preset was rejected, as a sentence for the user.
 *
 * Returns null when the preset is fine. A string rather than a boolean
 * because "that did not save" with no reason is the thing that makes people
 * stop trusting a save button.
 */
export function rejectionReason(raw: unknown): string | null {
  if (!raw || typeof raw !== 'object') return 'A preset must be an object.'
  const v = raw as Record<string, unknown>

  if (typeof v.id !== 'string' || !v.id.trim()) return 'A preset needs an id.'
  if (!isToolId(v.tool)) return 'Unknown tool.'
  if (typeof v.name !== 'string' || !v.name.trim()) return 'Give the preset a name.'

  if (!v.state || typeof v.state !== 'object' || Array.isArray(v.state)) {
    return 'A preset needs some state to restore.'
  }
  if (!isPlainJson(v.state, 0)) {
    return 'That state has values we cannot store — presets hold plain JSON.'
  }
  const bytes = stateBytes(v.state)
  if (bytes === null) return 'That state cannot be serialized.'
  if (bytes > TOOL_PRESET_LIMITS.stateBytes) {
    return `That state is ${Math.ceil(bytes / 1024)}KB — presets are capped at ${
      TOOL_PRESET_LIMITS.stateBytes / 1024
    }KB.`
  }
  return null
}

/**
 * Normalize an untrusted preset, or reject it.
 *
 * Strict where the field is ours (id, tool) and forgiving where it is the
 * user's (name gets trimmed and truncated rather than refused). Timestamps
 * are not trusted from the client at all — the caller supplies them, so a
 * client cannot backdate a preset to sort itself to the top of the list.
 */
export function sanitizeToolPreset(
  raw: unknown,
  now: string,
): ToolPreset | null {
  if (rejectionReason(raw) !== null) return null
  const v = raw as Record<string, unknown>

  /*
    Rejected, not truncated.

    Slicing an over-long id to 64 characters is how two different ids become
    one document: the client keeps its own id, the server keeps a prefix,
    and the next save with a different suffix overwrites the first preset.
    An id is ours — the client gets it from `crypto.randomUUID` — so
    anything that does not already fit is not one of ours.
  */
  const id = (v.id as string).trim()
  if (id.length > 64) return null
  if (!/^[A-Za-z0-9_-]+$/.test(id) || id.startsWith('__')) return null

  const createdAt = typeof v.createdAt === 'string' ? v.createdAt : now

  return {
    id,
    tool: v.tool as string,
    name: (v.name as string).trim().slice(0, TOOL_PRESET_LIMITS.nameLength),
    state: v.state as Record<string, unknown>,
    createdAt,
    updatedAt: now,
  }
}

/**
 * Most recently touched first.
 *
 * `updatedAt`, not `createdAt`: a preset you keep coming back to should not
 * sink under ones you saved once and forgot, and re-saving is the signal
 * that it is the one you are working in.
 */
export function sortToolPresets(presets: ToolPreset[]): ToolPreset[] {
  return [...presets].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}
