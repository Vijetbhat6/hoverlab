// Diagnose a specific user's account state.
// Usage: bun scripts/diagnose-user.ts <email>
import { db } from '../src/lib/db'

async function main() {
  const email = (process.argv[2] ?? '').toLowerCase().trim()
  if (!email) {
    console.error('Usage: bun scripts/diagnose-user.ts <email>')
    process.exit(1)
  }

  const user = await db.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      passwordHash: true,
      createdAt: true,
    },
  })

  if (!user) {
    console.log(`\n❌ No user found with email "${email}"\n`)
    process.exit(0)
  }

  console.log(`\n✅ User found:`)
  console.log(`   id:         ${user.id}`)
  console.log(`   email:      ${user.email}`)
  console.log(`   name:       ${JSON.stringify(user.name)}`)
  console.log(`   created:    ${user.createdAt.toISOString()}`)
  console.log(`   pwHashLen:  ${user.passwordHash.length}`)
  console.log(`   pwHashPrefix: ${user.passwordHash.slice(0, 7)}... (should start with $2a$ or $2b$)`)
  console.log(`   hasValidHash: ${user.passwordHash.startsWith('$2a$') || user.passwordHash.startsWith('$2b$')}`)
  console.log('')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
