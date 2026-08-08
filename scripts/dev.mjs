// Runs `next dev` and mirrors its output to both the console and dev.log.
// Replaces `... | tee dev.log`, which is not available on Windows shells.
import { spawn } from 'node:child_process'
import { createWriteStream } from 'node:fs'
import { createRequire } from 'node:module'

const port = process.env.PORT ?? '3002'
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
