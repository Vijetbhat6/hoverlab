// Delete a user by email — used to clean up test data.
// Usage: bun scripts/delete-user.ts <email>
import { db } from '../src/lib/db'

async function main() {
  const email = (process.argv[2] ?? '').toLowerCase().trim()
  if (!email) {
    console.error('Usage: bun scripts/delete-user.ts <email>')
    process.exit(1)
  }

  const deleted = await db.user.deleteMany({ where: { email } })
  console.log(`\nDeleted ${deleted.count} user(s) with email "${email}"\n`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
