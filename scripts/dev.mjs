// Runs `next dev` and mirrors its output to both the console and dev.log.
// Replaces `... | tee dev.log`, which is not available on Windows shells.
//
// Next allows only one dev server per directory, and two processes can never
// share a TCP port — so when a server is already up for this repo (typically
// another editor session), this script ATTACHES to it: it prints the URL and
// follows that server's log instead of failing with EADDRINUSE or Next's
// "Another next dev server is already running". One server serves every
// session, because they all compile the same files on disk.
//
// Ctrl-C while attached detaches only; the owning process keeps running.
import { spawn } from 'node:child_process'
import { createWriteStream, createReadStream, readFileSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const port = process.env.PORT ?? '3007'
const lockPath = fileURLToPath(new URL('../.next/dev/lock', import.meta.url))
const devLogPath = fileURLToPath(
  new URL('../.next/dev/logs/next-development.log', import.meta.url),
)

/**
 * The dev server Next has recorded for this directory, or null.
 *
 * `.next/dev/lock` holds {pid, port, appUrl, startedAt}. It survives a crash,
 * so the pid is probed with signal 0 before the lock is trusted: ESRCH means
 * the process is gone and the lock is stale. EPERM means it exists but is
 * owned by someone else — still running, so still a live lock.
 */
const runningServer = () => {
  let lock
  try {
    lock = JSON.parse(readFileSync(lockPath, 'utf8'))
  } catch {
    return null
  }
  if (!lock?.pid) return null
  try {
    process.kill(lock.pid, 0)
  } catch (error) {
    if (error.code !== 'EPERM') return null
  }
  return lock
}

/**
 * Follow a log file the way `tail -f` would, starting from `offset`.
 * Polled rather than fs.watch'd: watch misses appends on Windows network and
 * virtualised filesystems, and this file is written continuously.
 */
const follow = (path, offset) => {
  let position = offset
  let reading = false
  const pump = () => {
    if (reading) return
    let size
    try {
      size = statSync(path).size
    } catch {
      return
    }
    if (size < position) position = 0 // truncated: server restarted
    if (size === position) return
    reading = true
    const stream = createReadStream(path, { start: position, end: size - 1 })
    stream.pipe(process.stdout, { end: false })
    stream.on('end', () => {
      position = size
      reading = false
    })
    stream.on('error', () => {
      reading = false
    })
  }
  pump()
  return setInterval(pump, 300)
}

const existing = runningServer()

if (existing) {
  const url = existing.appUrl ?? `http://localhost:${existing.port}`
  process.stdout.write(
    `\n  Attached to the dev server already running for this directory.\n\n` +
      `  - Local:  ${url}\n` +
      `  - PID:    ${existing.pid}\n` +
      (String(existing.port) === port
        ? ''
        : `  - Note:   requested port ${port} is not in use; this server owns ${existing.port}\n`) +
      `\n  Your edits hot-reload here — it compiles the same files on disk.\n` +
      `  Ctrl-C detaches without stopping the server.\n\n`,
  )

  // Start from the end of the log: replaying a day of compiles helps nobody.
  let start = 0
  try {
    start = statSync(devLogPath).size
  } catch {
    /* no log yet; follow() picks it up when it appears */
  }
  const timer = follow(devLogPath, start)

  const detach = () => {
    clearInterval(timer)
    process.stdout.write('\n  Detached. The dev server is still running.\n')
    process.exit(0)
  }
  process.on('SIGINT', detach)
  process.on('SIGTERM', detach)
} else {
  const log = createWriteStream(new URL('../dev.log', import.meta.url), { flags: 'w' })
  const nextBin = createRequire(import.meta.url).resolve('next/dist/bin/next')

  const child = spawn(process.execPath, [nextBin, 'dev', '-p', port], {
    stdio: ['inherit', 'pipe', 'pipe'],
  })

  for (const stream of [child.stdout, child.stderr]) {
    stream.pipe(process.stdout)
    stream.pipe(log)
  }

  const forward = (signal) => child.kill(signal)
  process.on('SIGINT', forward)
  process.on('SIGTERM', forward)

  child.on('exit', (code, signal) => {
    log.end()
    if (signal) process.kill(process.pid, signal)
    else process.exit(code ?? 0)
  })
}
