// scripts/simulate-pages.mjs
// Simulates the page.tsx pagination logic to find which effects land on
// later pages — this helps us identify any "blank page" issues without
// needing a headless browser.

import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const data = JSON.parse(readFileSync(join(__dirname, '..', 'src', 'lib', 'generated-effects.json'), 'utf8'))

// Re-create the EFFECTS array: 64 hand-crafted featured + 1616 generated
// We don't have the hand-crafted here, but we know they take pages 1-3 (64 effects).
// Let's see what's on pages 3 (last hand-crafted), 4, 5, mid, and last.

const PAGE_SIZE = 24

// Build a fake EFFECTS array — we don't have hand-crafted, so prepend 64 dummy entries
const handcraftedCount = 64
const fakeHandcrafted = Array.from({ length: handcraftedCount }, (_, i) => ({
  id: `handcrafted-${i}`,
  name: `Handcrafted ${i}`,
  category: 'Buttons',
  html: '<div>handcrafted</div>',
  css: '',
}))
const EFFECTS = [...fakeHandcrafted, ...data]

console.log(`Total effects: ${EFFECTS.length}`)
const totalPages = Math.ceil(EFFECTS.length / PAGE_SIZE)
console.log(`Total pages: ${totalPages}\n`)

// Check pages of interest
const pagesToCheck = [1, 2, 3, 4, 5, 10, 20, 35, 50, 70, totalPages]
for (const p of pagesToCheck) {
  const start = (p - 1) * PAGE_SIZE
  const end = Math.min(start + PAGE_SIZE, EFFECTS.length)
  const slice = EFFECTS.slice(start, end)
  console.log(`=== Page ${p} (items ${start+1}-${end}) ===`)
  for (const e of slice.slice(0, 3)) {
    console.log(`  - [${e.category}] ${e.name}`)
    console.log(`      html: ${(e.html || '').slice(0, 100)}`)
    console.log(`      css length: ${(e.css || '').length}`)
  }
  if (slice.length > 3) console.log(`  ... +${slice.length - 3} more`)
  console.log()
}
