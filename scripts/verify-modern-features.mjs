/**
 * End-to-end verification for the 4 new modern features:
 *   1. Cmd+K Command Palette
 *   2. Reduced-motion accessibility toggle
 *   3. PWA support (manifest + service worker file existence + headers)
 *   4. Copy-as-React on CodeBlock
 */
import { chromium } from 'playwright'

const EMAIL = `modern-feats-${Date.now()}@hoverlab.test`
const PASSWORD = 'test-password-12345'
const BASE = 'http://127.0.0.1:3000'

async function main() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  })
  const page = await context.newPage()

  // Mock clipboard so we can read what was written.
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.addInitScript(() => {
    let clip = ''
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async (t) => { clip = t; return undefined },
        readText: async () => clip,
      },
      configurable: true,
    })
  })

  // Sign up.
  console.log('1. Signing up as', EMAIL)
  await page.goto(`${BASE}/signup`, { waitUntil: 'networkidle' })
  await page.fill('#auth-name', 'Modern Tester')
  await page.fill('#auth-email', EMAIL)
  await page.fill('#auth-password', PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/library', { timeout: 10000 })
  console.log('   ✓ signed up')

  /* ============================================================
   * FEATURE 1: Command Palette (Cmd+K)
   * ========================================================== */
  console.log('\n2. Testing Cmd+K command palette')

  // Press Cmd+K (or Ctrl+K on Linux)
  await page.keyboard.press('Control+k')
  await page.waitForTimeout(300)
  const paletteOpen = await page.locator('[role="dialog"]').count()
  console.log('   dialog count after Ctrl+K:', paletteOpen)
  if (paletteOpen === 0) throw new Error('Command palette did not open with Ctrl+K')

  // Type a search query — should match a known effect.
  await page.fill('[aria-label="Command palette search"]', 'gradient button')
  await page.waitForTimeout(300)

  // Should see effects matching "gradient button"
  const results = page.locator('[data-cp-index]')
  const resultCount = await results.count()
  console.log('   results for "gradient button":', resultCount)
  if (resultCount === 0) throw new Error('No results shown for "gradient button"')

  // Verify the top result contains "gradient" or "button" text.
  const topResultText = await results.first().textContent()
  if (!topResultText || !(/gradient|button/i.test(topResultText))) {
    throw new Error(`Top result doesn't match: "${topResultText?.slice(0, 80)}"`)
  }
  console.log('   ✓ top result:', topResultText.split('\n')[0].trim())

  // Press Escape to close.
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)
  const stillOpen = await page.locator('[role="dialog"]').count()
  if (stillOpen > 0) throw new Error('Palette did not close on Escape')
  console.log('   ✓ palette closed with Escape')

  // Reopen with the header button (the "Quick find" pill).
  const quickFindBtn = page.getByRole('button', { name: /Quick find|Open command palette/i }).first()
  await quickFindBtn.click()
  await page.waitForTimeout(300)
  const reopened = await page.locator('[role="dialog"]').count()
  if (reopened === 0) throw new Error('Palette did not open via Quick find button')
  console.log('   ✓ palette opens via Quick find button')

  // Type "Buttons" to filter by category, then click the explicit category item.
  await page.fill('[aria-label="Command palette search"]', 'Buttons')
  await page.waitForTimeout(200)
  // Each palette row has data-cp-index. Find the one with label "Buttons"
  // and hint "Filter the library to Buttons".
  const allRows = page.locator('[data-cp-index]')
  const rowCount = await allRows.count()
  console.log(`   total results for "Buttons": ${rowCount}`)

  // Print first 5 rows for debugging.
  for (let i = 0; i < Math.min(5, rowCount); i++) {
    const txt = (await allRows.nth(i).textContent())?.replace(/\s+/g, ' ').slice(0, 100)
    console.log(`   row ${i}: ${txt}`)
  }

  let clickedCategory = false
  for (let i = 0; i < rowCount; i++) {
    const row = allRows.nth(i)
    const labelText = await row.locator('.font-medium').first().textContent()
    const hintText = await row.locator('.text-\\[11px\\]').first().textContent()
    if (labelText?.trim() === 'Buttons' && hintText?.includes('Filter the library to Buttons')) {
      await row.click()
      clickedCategory = true
      console.log(`   clicked category item at index ${i}`)
      break
    }
  }
  if (!clickedCategory) throw new Error('Could not find the Buttons category item in palette')
  await page.waitForTimeout(800)
  const urlAfterEnter = page.url()
  console.log('   navigated to:', urlAfterEnter)
  if (!urlAfterEnter.includes('filter=Buttons')) {
    throw new Error('Cmd+K clicking Buttons category did not navigate to /library?filter=Buttons')
  }
  console.log('   ✓ category filter applied via palette')

  // Reset filter
  await page.goto(`${BASE}/library`, { waitUntil: 'networkidle' })

  /* ============================================================
   * FEATURE 2: Reduced-motion toggle
   * ========================================================== */
  console.log('\n3. Testing reduced-motion toggle')

  // Find the toggle button — its aria-label starts with "Motion:".
  const motionBtn = page.getByRole('button', { name: /^Motion:/i }).first()
  const initialLabel = await motionBtn.getAttribute('aria-label')
  console.log('   initial state:', initialLabel)
  if (!initialLabel?.includes('auto')) throw new Error('Initial state should be "auto"')

  // Click to cycle to "on".
  await motionBtn.click()
  await page.waitForTimeout(200)
  const onLabel = await motionBtn.getAttribute('aria-label')
  console.log('   after 1st click:', onLabel)
  if (!onLabel?.includes('reduced')) throw new Error('After 1st click, motion should be reduced')

  // Verify the global <style> tag was injected.
  const styleInjected = await page.evaluate(() => {
    const el = document.getElementById('hoverlab-reduced-motion-style')
    return el ? el.textContent?.includes('animation-duration') : false
  })
  console.log('   <style> injected:', styleInjected)
  if (!styleInjected) throw new Error('Reduced-motion CSS was not injected')

  // Verify <html data-reduced-motion="on">.
  const htmlAttr = await page.evaluate(() => document.documentElement.dataset.reducedMotion)
  console.log('   html data-reduced-motion:', htmlAttr)
  if (htmlAttr !== 'on') throw new Error('html data-reduced-motion attribute not set')

  // Click again → "off" (forced on).
  await motionBtn.click()
  await page.waitForTimeout(200)
  const offLabel = await motionBtn.getAttribute('aria-label')
  console.log('   after 2nd click:', offLabel)
  if (!offLabel?.includes('forced on')) throw new Error('After 2nd click, motion should be forced on')

  // Verify style tag was removed.
  const styleRemoved = await page.evaluate(() => {
    return document.getElementById('hoverlab-reduced-motion-style') === null
  })
  console.log('   <style> removed (motion forced on):', styleRemoved)
  if (!styleRemoved) throw new Error('Reduced-motion CSS was not removed when motion forced on')

  // Click again → back to "auto".
  await motionBtn.click()
  await page.waitForTimeout(200)
  const autoLabel = await motionBtn.getAttribute('aria-label')
  console.log('   after 3rd click:', autoLabel)
  if (!autoLabel?.includes('auto')) throw new Error('After 3rd click, motion should be back to auto')

  // Verify persistence via localStorage.
  const stored = await page.evaluate(() => window.localStorage.getItem('hoverlab:reduced-motion'))
  console.log('   localStorage value:', stored)
  if (stored !== 'auto') throw new Error('Preference not persisted to localStorage')

  console.log('   ✓ reduced-motion toggle works (auto → on → off → auto, persisted)')

  /* ============================================================
   * FEATURE 3: PWA support
   * ========================================================== */
  console.log('\n4. Testing PWA support')

  // Verify the manifest is served with the correct content-type.
  const manifestResp = await page.goto(`${BASE}/manifest.webmanifest`)
  const manifestCt = manifestResp?.headers()['content-type']
  console.log('   manifest content-type:', manifestCt)
  if (!manifestCt?.includes('application/manifest+json') && !manifestCt?.includes('application/json')) {
    throw new Error(`Manifest not served with correct content-type: ${manifestCt}`)
  }
  const manifestJson = await manifestResp?.json()
  if (manifestJson.name !== 'Hoverlab — A Living CSS Effects Library') {
    throw new Error('Manifest has wrong name')
  }
  if (!Array.isArray(manifestJson.icons) || manifestJson.icons.length < 3) {
    throw new Error('Manifest missing icons')
  }
  if (manifestJson.display !== 'standalone') throw new Error('Manifest display not standalone')
  if (manifestJson.start_url !== '/library') throw new Error('Manifest start_url wrong')
  console.log('   ✓ manifest valid:', manifestJson.name.slice(0, 40), '...')
  console.log('   ✓ manifest has', manifestJson.icons.length, 'icons,', manifestJson.shortcuts?.length, 'shortcuts')

  // Verify icons are served.
  for (const iconPath of ['/icon.svg', '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png']) {
    const r = await page.goto(`${BASE}${iconPath}`)
    const status = r?.status()
    if (status !== 200) throw new Error(`Icon ${iconPath} not served (status ${status})`)
  }
  console.log('   ✓ all icons served (200)')

  // Verify the layout includes <link rel="manifest">.
  await page.goto(`${BASE}/library`, { waitUntil: 'networkidle' })
  const manifestLink = await page.evaluate(() => {
    const link = document.querySelector('link[rel="manifest"]')
    return link?.getAttribute('href')
  })
  console.log('   <link rel="manifest"> href:', manifestLink)
  if (manifestLink !== '/manifest.webmanifest') throw new Error('Manifest link not in <head>')

  // Verify theme-color meta.
  const themeColor = await page.evaluate(() => {
    const meta = document.querySelector('meta[name="theme-color"]')
    return meta?.getAttribute('content')
  })
  console.log('   meta theme-color:', themeColor)
  if (!themeColor) throw new Error('theme-color meta missing')

  // Verify apple-touch-icon link.
  const appleIcon = await page.evaluate(() => {
    const link = document.querySelector('link[rel="apple-touch-icon"]')
    return link?.getAttribute('href')
  })
  console.log('   apple-touch-icon:', appleIcon)
  if (appleIcon !== '/apple-touch-icon.png') throw new Error('apple-touch-icon missing')

  // Verify the service worker file exists at /sw.js with the right type.
  const swResp = await page.goto(`${BASE}/sw.js`)
  const swStatus = swResp?.status()
  const swCt = swResp?.headers()['content-type']
  console.log('   /sw.js status:', swStatus, 'content-type:', swCt)
  if (swStatus !== 200) throw new Error('Service worker file not served')
  if (!swCt?.includes('javascript')) throw new Error(`Service worker wrong content-type: ${swCt}`)

  console.log('   ✓ PWA manifest + icons + SW file all served')

  /* ============================================================
   * FEATURE 4: Copy-as-React on CodeBlock
   * ========================================================== */
  console.log('\n5. Testing Copy-as-React button on CodeBlock')

  // Go to an effect detail page.
  await page.goto(`${BASE}/effect/btn-gradient`, { waitUntil: 'networkidle' })

  // Find the CSS code block (filename "styles.css") and its "React" button.
  // The button has aria-label "Copy as React component".
  const reactBtn = page.getByRole('button', { name: 'Copy as React component' }).first()
  const reactBtnVisible = await reactBtn.isVisible().catch(() => false)
  console.log('   React button visible:', reactBtnVisible)
  if (!reactBtnVisible) throw new Error('Copy-as-React button not visible on btn-gradient CSS block')

  await reactBtn.click()
  await page.waitForTimeout(500)

  // Read what was written to the clipboard.
  const clipboardContent = await page.evaluate(() => navigator.clipboard.readText())
  console.log('   clipboard content length:', clipboardContent.length, 'chars')

  // Verify the output looks like a React component.
  if (!clipboardContent.includes('export function')) {
    throw new Error('React component output missing "export function"')
  }
  if (!clipboardContent.includes('BtnGradient')) {
    throw new Error('React component name should be BtnGradient (from btn-gradient)')
  }
  if (!clipboardContent.includes('<style>')) {
    throw new Error('React component should include a <style> tag for the CSS')
  }
  if (!clipboardContent.includes('className=')) {
    throw new Error('React component should convert class= to className=')
  }
  console.log('   ✓ React component copied — snippet:')
  console.log('   ---')
  console.log(clipboardContent.split('\n').slice(0, 8).join('\n     '))
  console.log('   ...')

  // Also verify the React button appears on the customized CSS block.
  // (Just count — there should be at least 2 React buttons on the detail page:
  //  one for the main CSS block, one for the customized CSS block, plus the
  //  HTML block. Actually the HTML block also gets a React button.)
  const reactBtnCount = await page.getByRole('button', { name: 'Copy as React component' }).count()
  console.log('   total React buttons on detail page:', reactBtnCount)
  if (reactBtnCount < 2) throw new Error(`Expected at least 2 React buttons, found ${reactBtnCount}`)

  console.log('\n✓ All 4 modern feature verifications passed')
  await browser.close()
}

main().catch((e) => {
  console.error('FAILED:', e.message)
  process.exit(1)
})
