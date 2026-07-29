// Quick smoke test for the extended customize module.
// Run with: node scripts/smoke-customize.mjs
//
// Verifies:
//   - saturation slider actually shifts color saturation
//   - presets array is populated
//   - hash serialization round-trips correctly
//   - hue+saturation combo doesn't crash on rgb()/rgba() inputs

import { customizeCss, DEFAULT_CUSTOMIZATION, PRESETS, parseHash, optsToHash, hashToOpts, matchingPreset } from '../src/lib/customize.ts'

const sampleCss = `
.btn {
  color: #f43f5e;
  background: rgba(99, 102, 241, 0.3);
  border: 2px solid #6b7280;
  width: 120px;
  animation: spin 1.4s ease infinite;
}
`

let pass = 0
let fail = 0
function check(name, cond) {
  if (cond) { pass++; console.log(`  ✓ ${name}`) }
  else { fail++; console.log(`  ✗ ${name}`) }
}

console.log('1. Saturation boost (+50%) shifts color')
const boosted = customizeCss(sampleCss, { ...DEFAULT_CUSTOMIZATION, saturation: 50 })
check('  rose (#f43f5e) is changed', !boosted.includes('#f43f5e'))
check('  gray (#6b7280) gets revived', !boosted.includes('#6b7280'))

console.log('2. Saturation -100% = grayscale')
const gray = customizeCss(sampleCss, { ...DEFAULT_CUSTOMIZATION, saturation: -100 })
check('  rose becomes gray-ish', !gray.includes('#f43f5e'))

console.log('3. Presets array')
check('  has at least 6 presets', PRESETS.length >= 6)
check('  each preset has id/name/swatch/opts', PRESETS.every(p => p.id && p.name && p.swatch && p.opts))

console.log('4. Hash round-trip')
const opts = { hue: 15, saturation: 25, scale: 1.10, speed: 1.25 }
const hash = optsToHash(opts)
const restored = hashToOpts(parseHash(hash))
check('  hue preserved', restored.hue === 15)
check('  saturation preserved', restored.saturation === 25)
check('  scale preserved', restored.scale === 1.10)
check('  speed preserved', restored.speed === 1.25)

console.log('5. Hash omits defaults')
const emptyHash = optsToHash(DEFAULT_CUSTOMIZATION)
check('  empty string for defaults', emptyHash === '')

console.log('6. matchingPreset')
const sunsetMatch = matchingPreset(PRESETS.find(p => p.id === 'sunset').opts)
check('  sunset matches itself', sunsetMatch?.id === 'sunset')
const noMatch = matchingPreset({ hue: 7, saturation: 7, scale: 1, speed: 1 })
check('  no match for custom values', noMatch === null)

console.log('7. Hue + saturation combo on rgba()')
const combo = customizeCss(sampleCss, { hue: 30, saturation: -20, scale: 1, speed: 1 })
check('  rgba() is rewritten', !combo.includes('rgba(99, 102, 241, 0.3)'))
check('  alpha is preserved', /rgba\([^,]+,[^,]+,[^,]+,\s*0\.3\)/.test(combo))

console.log('8. hsl()/hsla() color functions are hue-shifted')
const hslCss = `
.bg {
  background: hsla(215, 98%, 61%, 0.7);
  color: hsl(120, 50%, 40%);
}
`
const hslOut = customizeCss(hslCss, { hue: 30, saturation: 0, scale: 1, speed: 1 })
check('  hsla() hue is shifted', !hslOut.includes('hsla(215,'))
check('  hsla() alpha is preserved', /hsla\([^,]+,[^,]+,[^,]+,\s*0\.7\)/.test(hslOut))
check('  hsl() hue is shifted', !hslOut.includes('hsl(120,'))
// Grayscale hsl should NOT be hue-shifted
const grayHslCss = 'color: hsl(0, 2%, 50%);'
const grayHslOut = customizeCss(grayHslCss, { hue: 90, saturation: 0, scale: 1, speed: 1 })
check('  grayscale hsl hue NOT shifted', grayHslOut.includes('hsl(0,'))
// Saturation shift on hsla
const satHsl = customizeCss(hslCss, { hue: 0, saturation: -50, scale: 1, speed: 1 })
check('  hsla saturation is shifted', satHsl.includes('hsla(215, 48%,'))

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail > 0 ? 1 : 0)
