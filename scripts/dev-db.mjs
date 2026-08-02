/**
 * Local development Postgres.
 *
 * Runs a real PostgreSQL server from binaries bundled by `embedded-postgres` —
 * no Docker, no system-wide install, no admin rights. Because it is genuinely
 * Postgres, `prisma/schema.prisma` keeps its `postgresql` provider and local
 * dev matches production exactly.
 *
 * Usage:
 *   npm run db:dev      # leave this running in its own terminal
 *   npm run dev         # in another terminal
 *
 * Data lives in ./.pgdata and persists across restarts. Delete that directory
 * to start from a clean database.
 */

import EmbeddedPostgres from 'embedded-postgres'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const DATA_DIR = join(process.cwd(), '.pgdata')
const PORT = Number(process.env.DEV_DB_PORT ?? 5433)
const DB_NAME = 'hoverlab'

const pg = new EmbeddedPostgres({
  databaseDir: DATA_DIR,
  user: 'postgres',
  password: 'postgres',
  port: PORT,
  persistent: true,
  // Quiet by default: Postgres logs every checkpoint at startup, which buries
  // the one line the developer actually needs (the connection string).
  onLog: () => {},
  onError: (e) => console.error('[db]', e),
})

// initialise() populates the data directory. It must run exactly once — calling
// it on an existing cluster errors out, so the directory check is the guard.
if (!existsSync(DATA_DIR)) {
  console.log('[db] first run — initialising cluster in .pgdata …')
  await pg.initialise()
}

await pg.start()

// Idempotent: after the first run the database already exists, and Postgres
// answers with 'database "hoverlab" already exists', which is not an error
// condition for us.
try {
  await pg.createDatabase(DB_NAME)
  console.log(`[db] created database "${DB_NAME}"`)
} catch (err) {
  if (!String(err?.message ?? err).includes('already exists')) throw err
}

console.log(`[db] postgres ready on port ${PORT}`)
console.log(
  `[db] DATABASE_URL="postgresql://postgres:postgres@localhost:${PORT}/${DB_NAME}"`,
)
console.log('[db] press Ctrl+C to stop')

const shutdown = async () => {
  console.log('\n[db] stopping …')
  try {
    await pg.stop()
  } catch {
    // Already gone; nothing to clean up.
  }
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

// Hold the event loop open so the cluster keeps running.
await new Promise(() => {})
