// scripts/audit-effects.mjs
// Flags generated effects that are likely to render as blank/invisible in the
// EffectCard preview container (min-h-[180px], flex centered, padding 1rem).
//
// Run: node scripts/audit-effects.mjs

import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const data = JSON.parse(readFileSync(join(__dirname, '..', 'src', 'lib', 'generated-effects.json'), 'utf8'))

const issues = []

for (const e of data) {
  const problems = []
  const css = e.css
  const html = e.html
  // Class root name (e.g. fx-btn-solid-rose-sm-0001)
  const clsMatch = html.match(/class="([^"]+)"/)
  const rootCls = clsMatch ? clsMatch[1].split(' ')[0] : null

  // 1. Opacity:0 on root with no animation that ends visible
  // Match only "opacity: 0" or "opacity:0" followed by ;, }, or end-of-line.
  // Avoid matching "opacity: 0.7" or "opacity: 0.25".
  const opacityZeroRe = /opacity:\s*0(?=\s*[;}])/
  if (rootCls) {
    const rootBlockRe = new RegExp(`\\.${rootCls.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*{[^}]*}`)
    const m = css.match(rootBlockRe)
    if (m) {
      const block = m[0]
      const hasOpacity0 = opacityZeroRe.test(block)
      const hasAnim = /animation\s*:/.test(block)
      let animEndsVisible = true
      if (hasAnim && hasOpacity0) {
        const animNameMatch = block.match(/animation\s*:\s*([a-zA-Z0-9_-]+)/)
        if (animNameMatch) {
          const animName = animNameMatch[1]
          const kfRe = new RegExp(`@keyframes\\s+${animName}\\s*{([\\s\\S]*?)}`, 'm')
          const kf = css.match(kfRe)
          if (kf) {
            const endBlock = kf[1].match(/(?:100%|to)\s*{([^}]*)}/)
            if (endBlock && opacityZeroRe.test(endBlock[1])) {
              animEndsVisible = false
            }
          }
        }
      }
      if (hasOpacity0 && !hasAnim) problems.push('opacity:0 static, no animation')
      if (hasOpacity0 && hasAnim && !animEndsVisible) problems.push('animation ends at opacity:0')
    }
  }

  // 2. visibility:hidden on root (but NOT backface-visibility: hidden, which is fine)
  if (rootCls) {
    const rootBlockRe = new RegExp(`\\.${rootCls.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*{[^}]*}`)
    const m = css.match(rootBlockRe)
    if (m) {
      // Strip "backface-visibility" before checking
      const stripped = m[0].replace(/backface-visibility\s*:[^;}]+;?/g, '')
      if (/(?<!backface-)visibility:\s*hidden/.test(stripped) && !/:hover/.test(m[0])) {
        problems.push('visibility:hidden on root (only visible on hover)')
      }
    }
  }

  // 3. display:none on root
  if (rootCls) {
    const rootBlockRe = new RegExp(`\\.${rootCls.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*{[^}]*}`)
    const m = css.match(rootBlockRe)
    if (m && /display:\s*none/.test(m[0])) {
      problems.push('display:none on root')
    }
  }

  // 4. width:0 or height:0 on root — but ONLY flag if no border / no min-size fallback
  // (dividers legitimately use height:0 + border-top to draw a line)
  if (rootCls) {
    const rootBlockRe = new RegExp(`\\.${rootCls.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*{[^}]*}`)
    const m = css.match(rootBlockRe)
    if (m) {
      const block = m[0]
      if (/\bheight:\s*0\b/.test(block) && !/border-(top|bottom)/.test(block) && !/min-height/.test(block)) {
        problems.push('height:0 on root with no border fallback')
      }
      if (/\bwidth:\s*0\b/.test(block) && !/border-(left|right)/.test(block) && !/min-width/.test(block)) {
        problems.push('width:0 on root with no border fallback')
      }
    }
  }

  // 5. Animations with fill-mode "both" or "forwards" — check end state
  // (Entrance animations should land at opacity:1, not 0)
  // Already covered by check #1.

  // 6. id/for mismatch (Inputs & Hover floating label)
  const idMatch = html.match(/id="([^"]+)"/)
  const forMatch = html.match(/for="([^"]+)"/)
  if (idMatch && forMatch && idMatch[1] !== forMatch[1]) {
    problems.push(`id/for mismatch: id="${idMatch[1]}" for="${forMatch[1]}"`)
  }

  // 7. Position absolute on root with no positioned parent
  // (The preview container is position:static by default)
  if (rootCls) {
    const rootBlockRe = new RegExp(`\\.${rootCls.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*{[^}]*}`)
    const m = css.match(rootBlockRe)
    if (m && /position:\s*absolute/.test(m[0])) {
      problems.push('position:absolute on root (no positioned parent in preview)')
    }
  }

  if (problems.length > 0) {
    issues.push({ id: e.id, name: e.name, category: e.category, problems })
  }
}

// Group by category for readable output
const byCat = {}
for (const i of issues) {
  if (!byCat[i.category]) byCat[i.category] = []
  byCat[i.category].push(i)
}

console.log(`\n=== AUDIT REPORT ===`)
console.log(`Total effects scanned: ${data.length}`)
console.log(`Effects with potential issues: ${issues.length}`)
console.log(`\n--- Breakdown by category ---`)
for (const [cat, list] of Object.entries(byCat).sort((a, b) => b[1].length - a[1].length)) {
  console.log(`\n${cat}: ${list.length} flagged`)
  // Sample first 3
  for (const item of list.slice(0, 3)) {
    console.log(`  - ${item.name} [${item.id}]`)
    for (const p of item.problems) console.log(`      · ${p}`)
  }
  if (list.length > 3) console.log(`  ... and ${list.length - 3} more`)
}
