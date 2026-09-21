#!/usr/bin/env node

/**
 * Upsert the sticky `hoverlab review` comment on a pull request.
 *
 * Dependency-free: Node built-ins and the global `fetch` (Node >= 18.17).
 *
 * WHAT "STICKY" MEANS HERE
 *
 * One comment per pull request, found again on every push by the marker on
 * its first line, and edited in place. A new comment per push buries the
 * review under its own history and sends a notification each time; an edited
 * comment is one thing to read and one thing to resolve.
 *
 * THE BEHAVIOUR MATRIX
 *
 *   findings | sticky exists | on-clean | result
 *   ---------+---------------+----------+------------------------------------
 *   yes      | no            | -        | create
 *   yes      | yes, differs  | -        | update (PATCH)
 *   yes      | yes, same     | -        | unchanged (no write, no notification)
 *   none     | no            | update   | skipped - a clean PR gets no comment
 *   none     | no            | skip     | skipped
 *   none     | no            | create   | create the "no findings" comment
 *   none     | yes, differs  | update   | update to "no findings"
 *   none     | yes, differs  | skip     | skipped - the old comment is left as is
 *   none     | yes, differs  | create   | update to "no findings"
 *   none     | yes, same     | any      | unchanged
 *
 * `update` is the default and the reason it is the default: a PR that was
 * never flagged should not grow a comment saying nothing, but a PR whose
 * earlier comment listed violations must not keep listing them after they
 * are fixed. A stale "3 violations" on a clean branch is worse than no
 * comment at all.
 *
 * WHOSE COMMENT IS IT
 *
 * A comment is ours to edit only when its first line is the marker AND its
 * author is a bot (`user.type === 'Bot'`: `github-actions[bot]` for the
 * default GITHUB_TOKEN, `<app>[bot]` for a GitHub App token) or the account
 * the token itself authenticates as (a personal access token, discovered via
 * `GET /user`, asked lazily and only when no bot comment matched).
 *
 * The marker alone is not enough. Someone replying with a quote of the bot's
 * comment can begin their message with the marker, and a token with write
 * access is allowed to overwrite it, which would destroy a human's words.
 * Trade-off of the type check: it also adopts a comment from a different bot
 * that begins with this exact marker. Nothing but a deliberate copy of our
 * marker would do that, and the alternative - pinning the login to
 * `github-actions[bot]` - would make an App or PAT token post a duplicate
 * comment on every push, which is the more likely failure.
 *
 * WHAT IS NOT FATAL
 *
 * The comment is a convenience on top of annotations and the step summary,
 * which need no write access. So a forbidden write (a fork PR, whose
 * GITHUB_TOKEN is read-only; or a workflow missing `pull-requests: write`)
 * and a rate limit are reported as warnings and exit 0. Anything else (bad
 * token, 404, 5xx, network) exits 1 so it is seen; the composite action turns
 * that into a warning too, because a failed comment must never replace the
 * review verdict.
 */

import { appendFileSync, existsSync, readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

export const MARKER = '<!-- hoverlab-review -->'

/** GitHub rejects issue-comment bodies longer than this many characters. */
export const MAX_COMMENT_LENGTH = 65536

const PER_PAGE = 100
/** A PR with more than this many comments is not one we will search to the end. */
const MAX_PAGES = 100

export const TRUNCATION_NOTE =
  "\n\n> **Output truncated** - this comment reached GitHub's 65,536-character limit. " +
  'The full report is in the workflow run\'s step summary and in the annotations on the "Files changed" tab.\n'

/* ------------------------------------------------------------------ *
 *  Pure helpers
 * ------------------------------------------------------------------ */

/** Line endings and trailing whitespace are not a change worth a notification. */
export function normalise(body) {
  return String(body ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/\s+$/, '')
}

/** The first line of a body, without its line ending. */
function firstLine(body) {
  return String(body ?? '').split(/\r?\n/, 1)[0].trim()
}

/** Whether a body opens with the sticky marker on its own first line. */
export function hasMarker(body, marker = MARKER) {
  return firstLine(body) === marker
}

/**
 * Fit a body under GitHub's limit, keeping the marker line and closing
 * anything the cut left open.
 *
 * `String.length` counts UTF-16 units, which is never fewer than the
 * characters GitHub counts, so measuring with it errs on the safe side. The
 * cut lands on a line boundary when one is near, never inside a surrogate
 * pair, and a fenced block or `<details>` the cut opened is closed again so
 * the tail of the comment does not render as code.
 */
export function truncateBody(body, max = MAX_COMMENT_LENGTH) {
  if (body.length <= max) return { body, truncated: false }

  const closersFor = (head) => {
    let closers = ''
    const fences = head.match(/^\s*(`{3,}|~{3,})/gm) ?? []
    if (fences.length % 2 === 1) closers += '\n```'
    const opened = (head.match(/<details[\s>]/gi) ?? []).length
    const closed = (head.match(/<\/details>/gi) ?? []).length
    for (let i = closed; i < opened; i++) closers += '\n</details>'
    return closers
  }

  const build = (limit) => {
    let cut = Math.max(0, limit)
    const code = body.charCodeAt(cut - 1)
    if (code >= 0xd800 && code <= 0xdbff) cut -= 1 // do not split a surrogate pair
    const lineEnd = body.lastIndexOf('\n', cut)
    if (lineEnd > cut * 0.8) cut = lineEnd // prefer a clean line boundary
    const head = body.slice(0, cut).replace(/\s+$/, '')
    return head + closersFor(head) + TRUNCATION_NOTE
  }

  // Closers add length the cut did not budget for, so shrink until it fits.
  let limit = max - TRUNCATION_NOTE.length
  let out = build(limit)
  while (out.length > max && limit > 0) {
    limit -= Math.max(16, out.length - max)
    out = build(limit)
  }
  return { body: out, truncated: true }
}

/* ------------------------------------------------------------------ *
 *  GitHub REST client
 * ------------------------------------------------------------------ */

export class GitHubError extends Error {
  constructor(message, { status, rateLimited = false, forbidden = false, resetAt } = {}) {
    super(message)
    this.name = 'GitHubError'
    this.status = status
    this.rateLimited = rateLimited
    this.forbidden = forbidden
    this.resetAt = resetAt
  }
}

function describeReset(headers) {
  const retryAfter = headers.get('retry-after')
  if (retryAfter && /^\d+$/.test(retryAfter)) return `retry in ${retryAfter}s`
  const reset = headers.get('x-ratelimit-reset')
  if (reset && /^\d+$/.test(reset)) return `resets at ${new Date(Number(reset) * 1000).toISOString()}`
  return 'try again later'
}

/**
 * A small `fetch` wrapper that turns a failure into a `GitHubError` whose
 * message a person can act on, and classifies the two failures the caller
 * treats as non-fatal.
 */
export function createClient({ token, apiUrl = 'https://api.github.com', fetchImpl = globalThis.fetch, timeoutMs = 30000 }) {
  const base = apiUrl.replace(/\/+$/, '')

  async function request(method, path, body) {
    let res
    try {
      res = await fetchImpl(`${base}${path}`, {
        method,
        headers: {
          accept: 'application/vnd.github+json',
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
          'user-agent': 'hoverlab-review-action',
          'x-github-api-version': '2022-11-28',
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      })
    } catch (error) {
      throw new GitHubError(`${method} ${path} could not reach ${base}: ${error?.message ?? error}`)
    }

    const text = await res.text()
    let data = null
    if (text) {
      try {
        data = JSON.parse(text)
      } catch {
        data = null
      }
    }

    if (res.status >= 200 && res.status < 300) return { data, headers: res.headers }

    const detail = data?.message ? `: ${data.message}` : ''
    const remaining = res.headers.get('x-ratelimit-remaining')
    const rateLimited =
      res.status === 429 ||
      (res.status === 403 && (remaining === '0' || /rate limit/i.test(data?.message ?? '')))

    if (rateLimited) {
      throw new GitHubError(
        `GitHub API rate limit reached (${method} ${path}, ${describeReset(res.headers)})`,
        { status: res.status, rateLimited: true },
      )
    }

    if (res.status === 403) {
      throw new GitHubError(`${method} ${path} was refused (403${detail})`, {
        status: 403,
        forbidden: true,
      })
    }

    const hint =
      res.status === 401
        ? ' - the token was rejected; check the github-token input'
        : res.status === 404
          ? ' - the pull request or repository was not found, or the token cannot see it'
          : ''
    throw new GitHubError(`${method} ${path} failed (${res.status}${detail})${hint}`, {
      status: res.status,
    })
  }

  return { request }
}

/**
 * The sticky comment on a PR, or null. Pages through the comments 100 at a
 * time (oldest first) and returns the first bot-authored marker comment; a
 * marker comment by a user account is considered only after every page has
 * been read and no bot one was found.
 */
export async function findStickyComment({ client, repo, pr, marker = MARKER }) {
  const humanCandidates = []

  for (let page = 1; page <= MAX_PAGES; page++) {
    const { data } = await client.request(
      'GET',
      `/repos/${repo}/issues/${pr}/comments?per_page=${PER_PAGE}&page=${page}`,
    )
    const comments = Array.isArray(data) ? data : []

    for (const comment of comments) {
      if (!hasMarker(comment.body, marker)) continue
      if (comment.user?.type === 'Bot') return comment
      humanCandidates.push(comment)
    }

    if (comments.length < PER_PAGE) break
  }

  if (humanCandidates.length === 0) return null

  /*
    A marker comment by a User account. It is ours only if that account is
    the one the token authenticates as, which happens with a personal access
    token. An installation token cannot call /user (403); that failure just
    means "not a PAT", so the candidates are someone else's.
  */
  let owner = null
  try {
    const { data } = await client.request('GET', '/user')
    owner = data?.login ?? null
  } catch {
    owner = null
  }

  return humanCandidates.find((c) => owner && c.user?.login === owner) ?? null
}

/**
 * Create, update or leave alone. See the matrix at the top of the file.
 *
 * @param {{ client: object, repo: string, pr: number|string, body: string,
 *   clean: boolean, onClean?: 'update'|'skip'|'create', marker?: string }} options
 * @returns {Promise<{ action: 'created'|'updated'|'unchanged'|'skipped', comment?: object, truncated: boolean }>}
 */
export async function upsertComment({ client, repo, pr, body, clean, onClean = 'update', marker = MARKER }) {
  if (clean && onClean === 'skip') return { action: 'skipped', truncated: false }

  const fitted = truncateBody(body)
  const existing = await findStickyComment({ client, repo, pr, marker })

  if (!existing) {
    if (clean && onClean !== 'create') return { action: 'skipped', truncated: false }
    const { data } = await client.request('POST', `/repos/${repo}/issues/${pr}/comments`, {
      body: fitted.body,
    })
    return { action: 'created', comment: data, truncated: fitted.truncated }
  }

  if (normalise(existing.body) === normalise(fitted.body)) {
    return { action: 'unchanged', comment: existing, truncated: fitted.truncated }
  }

  const { data } = await client.request('PATCH', `/repos/${repo}/issues/comments/${existing.id}`, {
    body: fitted.body,
  })
  return { action: 'updated', comment: data, truncated: fitted.truncated }
}

/* ------------------------------------------------------------------ *
 *  Workflow-command output
 * ------------------------------------------------------------------ */

function escapeCommand(text) {
  return String(text).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A')
}

function makeLog(env, stdout, stderr) {
  const onActions = env.GITHUB_ACTIONS === 'true'
  return {
    info: (message) => stdout(`${message}\n`),
    notice: (message) => (onActions ? stdout(`::notice::${escapeCommand(message)}\n`) : stdout(`notice: ${message}\n`)),
    warning: (message) => (onActions ? stdout(`::warning::${escapeCommand(message)}\n`) : stderr(`warning: ${message}\n`)),
    error: (message) => (onActions ? stdout(`::error::${escapeCommand(message)}\n`) : stderr(`error: ${message}\n`)),
  }
}

function setOutput(env, name, value) {
  if (!env.GITHUB_OUTPUT) return
  const text = String(value).replace(/[\r\n]+/g, ' ')
  appendFileSync(env.GITHUB_OUTPUT, `${name}=${text}\n`)
}

/* ------------------------------------------------------------------ *
 *  Entry point
 * ------------------------------------------------------------------ */

const USAGE = `Usage: node post-comment.mjs --body-file <file> [options]

  --body-file <file>   The comment body. Its first line must be ${MARKER}
  --clean <bool>       true when the review found nothing at all (default false)
  --on-clean <mode>    update (default) | skip | create - see the header
  --pr <number>        Pull request number (default: from GITHUB_EVENT_PATH)
  --repo <owner/name>  Repository (default: GITHUB_REPOSITORY)

Environment: GITHUB_TOKEN (required), GITHUB_API_URL (Enterprise Server).
Exit: 0 written/skipped/forbidden/rate-limited, 1 API error, 2 usage error.`

export function parseArgs(argv) {
  const opts = {}
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    const equals = arg.indexOf('=')
    const name = equals === -1 ? arg : arg.slice(0, equals)
    const take = () => (equals === -1 ? argv[++i] : arg.slice(equals + 1))

    switch (name) {
      case '--body-file': opts.bodyFile = take(); break
      case '--clean': opts.clean = take(); break
      case '--on-clean': opts.onClean = take(); break
      case '--pr': opts.pr = take(); break
      case '--repo': opts.repo = take(); break
      case '-h':
      case '--help': opts.help = true; break
      default: throw new Error(`Unknown argument: ${arg}`)
    }
  }
  return opts
}

/** The pull request number from the workflow's event payload, if there is one. */
export function prNumberFromEvent(env, readFile = (p) => readFileSync(p, 'utf8')) {
  if (!env.GITHUB_EVENT_PATH) return null
  try {
    const event = JSON.parse(readFile(env.GITHUB_EVENT_PATH))
    return event.pull_request?.number ?? event.number ?? null
  } catch {
    return null
  }
}

/**
 * Run the whole thing. Returns the process exit code rather than exiting, so
 * a test can call it directly.
 *
 * @param {string[]} argv
 * @param {{ env?: object, fetchImpl?: Function, stdout?: Function, stderr?: Function }} [io]
 */
export async function main(argv, io = {}) {
  const env = io.env ?? process.env
  const stdout = io.stdout ?? ((s) => process.stdout.write(s))
  const stderr = io.stderr ?? ((s) => process.stderr.write(s))
  const log = makeLog(env, stdout, stderr)

  let opts
  try {
    opts = parseArgs(argv)
  } catch (error) {
    stderr(`${error.message}\n${USAGE}\n`)
    return 2
  }
  if (opts.help) {
    stdout(`${USAGE}\n`)
    return 0
  }

  const usage = (message) => {
    log.error(message)
    return 2
  }

  if (!opts.bodyFile) return usage('--body-file is required.')
  if (!existsSync(opts.bodyFile)) return usage(`Body file not found: ${opts.bodyFile}`)

  const body = readFileSync(opts.bodyFile, 'utf8').replace(/^﻿/, '')
  if (!hasMarker(body)) {
    return usage(
      `Refusing to post: the first line of ${opts.bodyFile} is not ${MARKER}, so it does not look like ` +
        'a hoverlab review body (was the CLI upgraded to one that supports --format markdown?).',
    )
  }

  const onClean = opts.onClean ?? 'update'
  if (!['update', 'skip', 'create'].includes(onClean)) {
    return usage(`--on-clean must be update, skip or create, got "${onClean}".`)
  }
  if (opts.clean !== undefined && !['true', 'false'].includes(opts.clean)) {
    return usage(`--clean must be true or false, got "${opts.clean}".`)
  }
  const clean = opts.clean === 'true'

  const token = env.GITHUB_TOKEN
  if (!token) return usage('GITHUB_TOKEN is not set; pass the github-token input.')

  const repo = opts.repo ?? env.GITHUB_REPOSITORY
  if (!repo || !/^[\w.-]+\/[\w.-]+$/.test(repo)) {
    return usage(`Repository must be owner/name, got "${repo ?? ''}".`)
  }

  const pr = opts.pr ?? prNumberFromEvent(env)
  if (!pr || !/^\d+$/.test(String(pr))) {
    log.notice('Not a pull request event, so there is nothing to comment on. Annotations and the step summary still apply.')
    setOutput(env, 'comment-action', 'skipped')
    return 0
  }

  const client = createClient({
    token,
    apiUrl: env.GITHUB_API_URL || 'https://api.github.com',
    fetchImpl: io.fetchImpl ?? globalThis.fetch,
  })

  try {
    const result = await upsertComment({ client, repo, pr, body, clean, onClean })

    const url = result.comment?.html_url ?? ''
    const messages = {
      created: `Posted the hoverlab review comment on #${pr}.`,
      updated: `Updated the hoverlab review comment on #${pr}.`,
      unchanged: `The hoverlab review comment on #${pr} is already up to date; nothing written.`,
      skipped:
        onClean === 'skip'
          ? `No findings and comment-on-clean is false: left #${pr} untouched.`
          : `No findings and no earlier review comment to update: nothing posted on #${pr}.`,
    }
    log.info(messages[result.action])
    if (result.truncated) log.warning('The review was longer than GitHub allows in one comment and was truncated; the step summary has all of it.')

    setOutput(env, 'comment-action', result.action)
    setOutput(env, 'comment-url', url)
    return 0
  } catch (error) {
    if (!(error instanceof GitHubError)) {
      log.error(`Unexpected error while commenting: ${error?.stack ?? error}`)
      return 1
    }

    if (error.rateLimited) {
      log.warning(`${error.message}. No comment was written; the annotations and step summary carry the review.`)
      setOutput(env, 'comment-action', 'rate-limited')
      return 0
    }

    if (error.forbidden) {
      log.warning(
        `${error.message}. This is expected on a pull request from a fork, where GITHUB_TOKEN is read-only. ` +
          'On a same-repository pull request, add `permissions: pull-requests: write` to the job. ' +
          'No comment was written; the annotations and step summary carry the review.',
      )
      setOutput(env, 'comment-action', 'forbidden')
      return 0
    }

    log.error(error.message)
    setOutput(env, 'comment-action', 'error')
    return 1
  }
}

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href

if (invokedDirectly) {
  main(process.argv.slice(2)).then((code) => {
    process.exitCode = code
  })
}
