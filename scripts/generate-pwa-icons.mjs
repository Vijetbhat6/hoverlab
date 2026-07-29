/**
 * Generate the PWA PNG icons (192, 512, and apple-touch-icon 180) from the
 * SVG source. Run with: node scripts/generate-pwa-icons.mjs
 *
 * These are needed because:
 *  - The web manifest requires PNG icons for installability on Android/Chrome.
 *  - Apple touch icon must be PNG (iOS Safari ignores SVG for the home screen).
 */
import sharp from 'sharp'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pubDir = join(__dirname, '..', 'public')
const svgPath = join(pubDir, 'icon.svg')
const svg = readFileSync(svgPath)

const targets = [
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 32,  name: 'favicon-32.png' },
]

for (const t of targets) {
  await sharp(svg, { density: 384 })
    .resize(t.size, t.size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(join(pubDir, t.name))
  console.log(`  ✓ wrote ${t.name} (${t.size}x${t.size})`)
}

console.log('Done.')
