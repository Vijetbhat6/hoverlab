/**
 * Where the CLI keeps a licence key.
 *
 * The catalog is public and stays public: `hoverlab add btn-gradient`,
 * every block, every page and the free template all work with no key and
 * no account, which is the whole distribution story. A key exists for one
 * thing — the Pro templates — and the CLI should never mention it until
 * someone asks for one.
 *
 * Two sources, in this order:
 *
 *   HOVERLAB_KEY          an environment variable. Wins, always, because
 *                         that is what CI sets and a machine's stored
 *                         credential must not quietly override what the
 *                         pipeline was configured with.
 *   ~/.hoverlab/config.json  written by `hoverlab login`.
 *
 * The file is written 0600 where the platform honours it. That is not
 * meaningful security on a shared machine and is not presented as such —
 * it is the same bargain `~/.npmrc` makes, and a key is revocable from
 * /account precisely because a file on a laptop is not a vault.
 */

import { promises as fs } from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'

const CONFIG_DIR = path.join(homedir(), '.hoverlab')
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json')

/** Recognisable prefix, matching what the site issues. */
const KEY_PREFIX = 'hl_live_'

export { CONFIG_FILE }

/** True when a string looks like a Hoverlab key. Shape only — never validity. */
export function looksLikeKey(value) {
  return typeof value === 'string' && value.startsWith(KEY_PREFIX) && value.length > 24
}

async function readConfig() {
  try {
    const raw = await fs.readFile(CONFIG_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    // Missing, unreadable or corrupt all mean the same thing to a caller:
    // there is no stored key. A malformed config must not stop `add` from
    // fetching a free effect.
    return {}
  }
}

/** The key to send, or null. Environment first — see the note above. */
export async function resolveKey() {
  const fromEnv = process.env.HOVERLAB_KEY?.trim()
  if (fromEnv) return fromEnv

  const config = await readConfig()
  const stored = typeof config.key === 'string' ? config.key.trim() : ''
  return stored || null
}

/** Where the key in play came from, for `hoverlab whoami`. */
export async function keySource() {
  if (process.env.HOVERLAB_KEY?.trim()) return 'HOVERLAB_KEY'
  const config = await readConfig()
  return typeof config.key === 'string' && config.key.trim() ? CONFIG_FILE : null
}

/** Store a key for this machine. Returns the path it was written to. */
export async function saveKey(key) {
  await fs.mkdir(CONFIG_DIR, { recursive: true, mode: 0o700 })
  const config = await readConfig()
  await fs.writeFile(
    CONFIG_FILE,
    `${JSON.stringify({ ...config, key }, null, 2)}\n`,
    { mode: 0o600 },
  )
  return CONFIG_FILE
}

/** Forget the stored key. Leaves any other config keys alone. */
export async function clearKey() {
  const config = await readConfig()
  if (!('key' in config)) return false
  delete config.key
  await fs.writeFile(CONFIG_FILE, `${JSON.stringify(config, null, 2)}\n`, {
    mode: 0o600,
  })
  return true
}

/**
 * Show a key without showing it — `hl_live_9f3a…`.
 *
 * Enough to tell two keys apart when someone is debugging which one their
 * shell is exporting, and far too little to use.
 */
export function maskKey(key) {
  return `${key.slice(0, KEY_PREFIX.length + 4)}…`
}
