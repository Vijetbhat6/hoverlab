// Quick diagnostic / cleanup script for the User table.
// Run with: bun scripts/list-users.ts
import { db } from '../src/lib/db'

async function main() {
  const users = await db.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      _count: { select: { favorites: true, bundleEntries: true } },
    },
    orderBy: { createdAt: 'asc' },
  })
  console.log(`\n=== ${users.length} user(s) in database ===\n`)
  for (const u of users) {
    console.log(
      `  ${u.email.padEnd(30)}  id=${u.id}  name="${u.name ?? ''}"  favs=${u._count.favorites}  bundle=${u._count.bundleEntries}  created=${u.createdAt.toISOString()}`,
    )
  }
  console.log('')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
