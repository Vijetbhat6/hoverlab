import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, it } from 'node:test'

import {
  MARKER,
  MAX_COMMENT_LENGTH,
  createClient,
  hasMarker,
  main,
  normalise,
  truncateBody,
  upsertComment,
} from '../post-comment.mjs'

/* ------------------------------------------------------------------ *
 *  A stub GitHub: an in-memory comment list behind a fake `fetch`.
 * ------------------------------------------------------------------ */

const BOT = { login: 'github-actions[bot]', type: 'Bot' }
const HUMAN = { login: 'octocat', type: 'User' }

function json(status, body, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  })
}

/**
 * @param {object} options
 * @param {object[]} [options.comments]  Existing comments, oldest first.
 * @param {(req: object) => Response|undefined} [options.override]  Answer a request yourself.
 * @param {string} [options.me]  Login `GET /user` reports; omitted means 403, like an installation token.
 */
function stubGitHub({ comments = [], override, me } = {}) {
  const calls = []
  let nextId = 1000

  const fetchImpl = async (url, init = {}) => {
    const u = new URL(url)
    const req = {
      method: init.method ?? 'GET',
      path: u.pathname,
      query: Object.fromEntries(u.searchParams),
      body: init.body ? JSON.parse(init.body) : undefined,
      headers: init.headers,
    }
    calls.push(req)

    const custom = override?.(req)
    if (custom) return custom

    if (req.method === 'GET' && req.path === '/user') {
      return me
        ? json(200, { login: me })
        : json(403, { message: 'Resource not accessible by integration' })
    }

    const list = req.path.match(/^\/repos\/o\/r\/issues\/7\/comments$/)
    if (list && req.method === 'GET') {
      const perPage = Number(req.query.per_page ?? 30)
      const page = Number(req.query.page ?? 1)
      return json(200, comments.slice((page - 1) * perPage, page * perPage))
    }
    if (list && req.method === 'POST') {
      const created = { id: nextId++, body: req.body.body, user: BOT, html_url: 'https://example/c/new' }
      comments.push(created)
      return json(201, created)
    }

    const edit = req.path.match(/^\/repos\/o\/r\/issues\/comments\/(\d+)$/)
    if (edit && req.method === 'PATCH') {
      const found = comments.find((c) => c.id === Number(edit[1]))
      if (!found) return json(404, { message: 'Not Found' })
      found.body = req.body.body
      return json(200, { ...found, html_url: `https://example/c/${found.id}` })
    }

    return json(404, { message: `stub has no route for ${req.method} ${req.path}` })
  }

  return {
    fetchImpl,
    calls,
    comments,
    writes: () => calls.filter((c) => c.method === 'POST' || c.method === 'PATCH'),
  }
}

const clientFor = (stub) =>
  createClient({ token: 't0ken', apiUrl: 'https://api.github.test', fetchImpl: stub.fetchImpl })

const bodyWith = (text) => `${MARKER}\n${text}\n`
const upsert = (stub, options) =>
  upsertComment({ client: clientFor(stub), repo: 'o/r', pr: 7, clean: false, ...options })

/* ------------------------------------------------------------------ *
 *  upsertComment
 * ------------------------------------------------------------------ */

describe('upsertComment', () => {
  it('creates a comment when none exists', async () => {
    const stub = stubGitHub()
    const result = await upsert(stub, { body: bodyWith('2 violations') })

    assert.equal(result.action, 'created')
    assert.equal(stub.comments.length, 1)
    assert.equal(stub.comments[0].body, bodyWith('2 violations'))
    assert.deepEqual(stub.writes().map((w) => w.method), ['POST'])
  })

  it('updates the marker comment in place when the body changed', async () => {
    const stub = stubGitHub({
      comments: [
        { id: 1, body: 'LGTM', user: HUMAN },
        { id: 2, body: bodyWith('3 violations'), user: BOT },
      ],
    })
    const result = await upsert(stub, { body: bodyWith('1 violation') })

    assert.equal(result.action, 'updated')
    assert.equal(stub.comments.length, 2, 'no second comment is created')
    assert.equal(stub.comments[1].body, bodyWith('1 violation'))
    assert.equal(stub.comments[0].body, 'LGTM', 'the human comment is untouched')
    const [write] = stub.writes()
    assert.equal(write.method, 'PATCH')
    assert.equal(write.path, '/repos/o/r/issues/comments/2')
  })

  it('writes nothing when the body is unchanged', async () => {
    const body = bodyWith('1 violation')
    const stub = stubGitHub({ comments: [{ id: 2, body, user: BOT }] })
    const result = await upsert(stub, { body })

    assert.equal(result.action, 'unchanged')
    assert.equal(stub.writes().length, 0)
  })

  it('treats line-ending and trailing-whitespace differences as unchanged', async () => {
    const stub = stubGitHub({
      comments: [{ id: 2, body: `${MARKER}\r\n1 violation\r\n\r\n`, user: BOT }],
    })
    const result = await upsert(stub, { body: `${MARKER}\n1 violation` })

    assert.equal(result.action, 'unchanged')
    assert.equal(stub.writes().length, 0)
  })

  it("ignores a human's comment that merely starts with the marker, and posts its own", async () => {
    const stub = stubGitHub({
      comments: [{ id: 5, body: `${MARKER}\n> quoting the bot\nI disagree with this one`, user: HUMAN }],
    })
    const result = await upsert(stub, { body: bodyWith('1 violation') })

    assert.equal(result.action, 'created')
    assert.equal(stub.comments.length, 2)
    assert.match(stub.comments[0].body, /I disagree/, 'the human comment is not overwritten')
    assert.ok(!stub.writes().some((w) => w.method === 'PATCH'))
  })

  it('does not adopt a marker in the middle of a comment', async () => {
    const stub = stubGitHub({
      comments: [{ id: 5, body: `see below\n${MARKER}\nquoted`, user: BOT }],
    })
    const result = await upsert(stub, { body: bodyWith('x') })
    assert.equal(result.action, 'created')
  })

  it('adopts a marker comment made by the token owner (a personal access token)', async () => {
    const stub = stubGitHub({
      comments: [{ id: 5, body: bodyWith('old'), user: HUMAN }],
      me: 'octocat',
    })
    const result = await upsert(stub, { body: bodyWith('new') })

    assert.equal(result.action, 'updated')
    assert.equal(stub.comments.length, 1)
  })

  it('only asks who the token is when a non-bot marker comment exists', async () => {
    const stub = stubGitHub({ comments: [{ id: 2, body: bodyWith('old'), user: BOT }] })
    await upsert(stub, { body: bodyWith('new') })
    assert.ok(!stub.calls.some((c) => c.path === '/user'))
  })

  it('finds the marker comment past the first page of 100', async () => {
    const comments = Array.from({ length: 130 }, (_, i) => ({
      id: i + 1,
      body: `chatter ${i}`,
      user: HUMAN,
    }))
    comments[119] = { id: 120, body: bodyWith('old'), user: BOT } // page 2
    const stub = stubGitHub({ comments })

    const result = await upsert(stub, { body: bodyWith('new') })

    assert.equal(result.action, 'updated')
    assert.equal(stub.comments.length, 130)
    assert.equal(stub.comments[119].body, bodyWith('new'))
    const pages = stub.calls.filter((c) => c.method === 'GET').map((c) => c.query.page)
    assert.deepEqual(pages, ['1', '2'])
  })

  it('walks every page before deciding there is no comment, then creates one', async () => {
    const comments = Array.from({ length: 205 }, (_, i) => ({ id: i + 1, body: `c${i}`, user: HUMAN }))
    const stub = stubGitHub({ comments })

    const result = await upsert(stub, { body: bodyWith('first') })

    assert.equal(result.action, 'created')
    const pages = stub.calls.filter((c) => c.method === 'GET').map((c) => c.query.page)
    assert.deepEqual(pages, ['1', '2', '3'])
  })

  describe('when the review is clean', () => {
    const clean = bodyWith('No findings.')

    it('creates nothing when there is no existing comment', async () => {
      const stub = stubGitHub()
      const result = await upsert(stub, { body: clean, clean: true })

      assert.equal(result.action, 'skipped')
      assert.equal(stub.writes().length, 0)
      assert.equal(stub.comments.length, 0)
    })

    it('updates an existing findings comment to "no findings"', async () => {
      const stub = stubGitHub({ comments: [{ id: 2, body: bodyWith('3 violations'), user: BOT }] })
      const result = await upsert(stub, { body: clean, clean: true })

      assert.equal(result.action, 'updated')
      assert.equal(stub.comments[0].body, clean)
    })

    it('leaves an already-clean comment alone', async () => {
      const stub = stubGitHub({ comments: [{ id: 2, body: clean, user: BOT }] })
      const result = await upsert(stub, { body: clean, clean: true })

      assert.equal(result.action, 'unchanged')
      assert.equal(stub.writes().length, 0)
    })

    it('on-clean=skip touches nothing and does not even read the comments', async () => {
      const stub = stubGitHub({ comments: [{ id: 2, body: bodyWith('3 violations'), user: BOT }] })
      const result = await upsert(stub, { body: clean, clean: true, onClean: 'skip' })

      assert.equal(result.action, 'skipped')
      assert.equal(stub.calls.length, 0)
      assert.equal(stub.comments[0].body, bodyWith('3 violations'))
    })

    it('on-clean=create posts the "no findings" comment when none exists', async () => {
      const stub = stubGitHub()
      const result = await upsert(stub, { body: clean, clean: true, onClean: 'create' })

      assert.equal(result.action, 'created')
      assert.equal(stub.comments.length, 1)
    })
  })
})

/* ------------------------------------------------------------------ *
 *  truncation
 * ------------------------------------------------------------------ */

describe('truncateBody', () => {
  it('leaves a body under the limit exactly as it is', () => {
    const body = bodyWith('short')
    assert.deepEqual(truncateBody(body), { body, truncated: false })
  })

  it('cuts an oversized body under the limit, keeps the marker and says so', () => {
    const line = 'x'.repeat(99) + '\n'
    const body = MARKER + '\n' + line.repeat(1000)
    assert.ok(body.length > MAX_COMMENT_LENGTH)

    const result = truncateBody(body)

    assert.equal(result.truncated, true)
    assert.ok(result.body.length <= MAX_COMMENT_LENGTH, `got ${result.body.length}`)
    assert.ok(hasMarker(result.body))
    assert.match(result.body, /Output truncated/)
    assert.ok(result.body.startsWith(MARKER + '\n'))
  })

  it('closes a code fence and a details block the cut left open', () => {
    const body =
      `${MARKER}\n<details>\n<summary>all findings</summary>\n\n\`\`\`tsx\n` +
      'const a = 1\n'.repeat(8000)
    const result = truncateBody(body)

    assert.ok(result.body.length <= MAX_COMMENT_LENGTH)
    const fences = result.body.match(/^```/gm) ?? []
    assert.equal(fences.length % 2, 0, 'fences are balanced')
    assert.match(result.body, /<\/details>/)
  })

  it('does not split a surrogate pair', () => {
    const body = MARKER + '\n' + '\u{1F600}'.repeat(40000) // no newlines to snap to
    const result = truncateBody(body)

    assert.ok(result.body.length <= MAX_COMMENT_LENGTH)
    assert.ok(!/[\ud800-\udbff](?![\udc00-\udfff])/.test(result.body), 'no lone high surrogate')
    assert.ok(!/(?<![\ud800-\udbff])[\udc00-\udfff]/.test(result.body), 'no lone low surrogate')
  })

  it('is what gets posted: an oversized body is truncated on create', async () => {
    const stub = stubGitHub()
    const body = MARKER + '\n' + ('finding\n'.repeat(20000))
    const result = await upsert(stub, { body })

    assert.equal(result.action, 'created')
    assert.equal(result.truncated, true)
    assert.ok(stub.comments[0].body.length <= MAX_COMMENT_LENGTH)
  })

  it('a truncated body is stable, so the next identical run writes nothing', async () => {
    const stub = stubGitHub()
    const body = MARKER + '\n' + ('finding\n'.repeat(20000))
    await upsert(stub, { body })
    const second = await upsert(stub, { body })

    assert.equal(second.action, 'unchanged')
    assert.equal(stub.writes().length, 1)
  })
})

/* ------------------------------------------------------------------ *
 *  errors and the entry point
 * ------------------------------------------------------------------ */

function run(argv, { stub, env = {}, body = bodyWith('1 violation'), extraArgs = [] } = {}) {
  const dir = mkdtempSync(path.join(tmpdir(), 'hl-review-'))
  const bodyFile = path.join(dir, 'body.md')
  writeFileSync(bodyFile, body)
  const eventPath = path.join(dir, 'event.json')
  writeFileSync(eventPath, JSON.stringify({ pull_request: { number: 7 } }))
  const outputPath = path.join(dir, 'output')
  writeFileSync(outputPath, '')

  const out = []
  const err = []
  const fullEnv = {
    GITHUB_ACTIONS: 'true',
    GITHUB_TOKEN: 't0ken',
    GITHUB_REPOSITORY: 'o/r',
    GITHUB_API_URL: 'https://api.github.test',
    GITHUB_EVENT_PATH: eventPath,
    GITHUB_OUTPUT: outputPath,
    ...env,
  }

  return main(['--body-file', bodyFile, ...extraArgs, ...argv], {
    env: fullEnv,
    fetchImpl: stub.fetchImpl,
    stdout: (s) => out.push(s),
    stderr: (s) => err.push(s),
  }).then((code) => ({
    code,
    out: out.join(''),
    err: err.join(''),
    outputs: readFileSync(outputPath, 'utf8'),
  }))
}

describe('main', () => {
  it('a fork PR (read-only token, 403 on write) is a warning, not a failure', async () => {
    const stub = stubGitHub({
      override: (req) =>
        req.method === 'POST'
          ? json(403, { message: 'Resource not accessible by integration' })
          : undefined,
    })
    const result = await run([], { stub })

    assert.equal(result.code, 0)
    assert.match(result.out, /::warning::/)
    assert.match(result.out, /fork/)
    assert.match(result.outputs, /comment-action=forbidden/)
  })

  it('a 403 on PATCH is equally non-fatal', async () => {
    const stub = stubGitHub({
      comments: [{ id: 2, body: bodyWith('old'), user: BOT }],
      override: (req) => (req.method === 'PATCH' ? json(403, { message: 'Forbidden' }) : undefined),
    })
    const result = await run([], { stub })
    assert.equal(result.code, 0)
    assert.match(result.outputs, /comment-action=forbidden/)
  })

  it('a rate limit is reported with its reset time and is non-fatal', async () => {
    const reset = String(Math.floor(Date.UTC(2026, 8, 21, 12, 0, 0) / 1000))
    const stub = stubGitHub({
      override: () =>
        json(403, { message: 'API rate limit exceeded' }, {
          'x-ratelimit-remaining': '0',
          'x-ratelimit-reset': reset,
        }),
    })
    const result = await run([], { stub })

    assert.equal(result.code, 0)
    assert.match(result.out, /rate limit/i)
    assert.match(result.out, /2026-09-21T12:00:00/)
    assert.match(result.outputs, /comment-action=rate-limited/)
  })

  it('a 429 with retry-after says when to retry', async () => {
    const stub = stubGitHub({ override: () => json(429, { message: 'slow down' }, { 'retry-after': '42' }) })
    const result = await run([], { stub })
    assert.equal(result.code, 0)
    assert.match(result.out, /retry in 42s/)
  })

  it('a server error exits 1 with a readable message and no token in it', async () => {
    const stub = stubGitHub({ override: () => json(502, { message: 'Bad Gateway' }) })
    const result = await run([], { stub })

    assert.equal(result.code, 1)
    assert.match(result.out, /::error::GET \/repos\/o\/r\/issues\/7\/comments.*502.*Bad Gateway/)
    assert.ok(!result.out.includes('t0ken'))
    assert.match(result.outputs, /comment-action=error/)
  })

  it('a rejected token says which input to check', async () => {
    const stub = stubGitHub({ override: () => json(401, { message: 'Bad credentials' }) })
    const result = await run([], { stub })
    assert.equal(result.code, 1)
    assert.match(result.out, /github-token/)
  })

  it('a network failure exits 1 and names the host', async () => {
    const stub = stubGitHub({
      override: () => {
        throw new TypeError('fetch failed')
      },
    })
    const result = await run([], { stub })
    assert.equal(result.code, 1)
    assert.match(result.out, /could not reach https:\/\/api\.github\.test/)
  })

  it('honours GITHUB_API_URL and sends the token as a bearer credential', async () => {
    const stub = stubGitHub()
    await run([], { stub })

    assert.ok(stub.calls.length > 0)
    assert.equal(stub.calls[0].headers.authorization, 'Bearer t0ken')
    assert.equal(stub.calls[0].headers['x-github-api-version'], '2022-11-28')
  })

  it('on a clean run with no comment, posts nothing and reports skipped', async () => {
    const stub = stubGitHub()
    const result = await run(['--clean', 'true'], { stub, body: bodyWith('No findings.') })

    assert.equal(result.code, 0)
    assert.equal(stub.writes().length, 0)
    assert.match(result.outputs, /comment-action=skipped/)
  })

  it('is a no-op outside a pull request', async () => {
    const stub = stubGitHub()
    const dir = mkdtempSync(path.join(tmpdir(), 'hl-review-'))
    const eventPath = path.join(dir, 'push.json')
    writeFileSync(eventPath, JSON.stringify({ ref: 'refs/heads/main' }))

    const result = await run([], { stub, env: { GITHUB_EVENT_PATH: eventPath } })

    assert.equal(result.code, 0)
    assert.equal(stub.calls.length, 0)
    assert.match(result.out, /::notice::Not a pull request/)
  })

  it('takes the PR number from --pr, for a workflow_run poster', async () => {
    const stub = stubGitHub()
    const result = await run(['--pr', '7'], { stub, env: { GITHUB_EVENT_PATH: '' } })
    assert.equal(result.code, 0)
    assert.equal(stub.comments.length, 1)
  })

  it('refuses a body that is not a hoverlab review', async () => {
    const stub = stubGitHub()
    const result = await run([], { stub, body: 'Nothing to review.\n' })

    assert.equal(result.code, 2)
    assert.equal(stub.calls.length, 0)
    assert.match(result.out, /Refusing to post/)
  })

  it('rejects a missing token and an unknown mode before touching the network', async () => {
    const stub = stubGitHub()
    assert.equal((await run([], { stub, env: { GITHUB_TOKEN: '' } })).code, 2)
    assert.equal((await run(['--on-clean', 'sometimes'], { stub })).code, 2)
    assert.equal(stub.calls.length, 0)
  })

  it('escapes newlines in workflow commands so a message cannot inject another', async () => {
    const stub = stubGitHub({ override: () => json(500, { message: 'oops\n::error::injected' }) })
    const result = await run([], { stub })
    const lines = result.out.split('\n').filter(Boolean)
    assert.equal(lines.filter((l) => l.startsWith('::error::')).length, 1)
  })
})

describe('helpers', () => {
  it('hasMarker requires the marker to be the whole first line', () => {
    assert.equal(hasMarker(`${MARKER}\nbody`), true)
    assert.equal(hasMarker(`${MARKER}\r\nbody`), true)
    assert.equal(hasMarker(MARKER), true)
    assert.equal(hasMarker(`${MARKER} and more\nbody`), false)
    assert.equal(hasMarker(`> ${MARKER}\nbody`), false)
    assert.equal(hasMarker(`text\n${MARKER}`), false)
    assert.equal(hasMarker(undefined), false)
  })

  it('normalise folds CRLF and trailing whitespace', () => {
    assert.equal(normalise('a\r\nb\r\n\r\n'), 'a\nb')
  })
})
