/**
 * Take screenshots of the 4 new features for the worklog / record.
 */
import { chromium } from 'playwright'

const BASE = 'http://127.0.0.1:3000'

async function main() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  })
  const page = await context.newPage()

  // Sign in
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await page.fill('#auth-email', 'modern-feats-1782714891561@hoverlab.test')
  await page.fill('#auth-password', 'test-password-12345')
  await page.click('button[type="submit"]')
  await page.waitForURL('**/library', { timeout: 10000 })

  // Screenshot 1: Command palette with "gradient button" query
  await page.keyboard.press('Control+k')
  await page.waitForTimeout(300)
  await page.fill('[aria-label="Command palette search"]', 'neon glow')
  await page.waitForTimeout(400)
  await page.screenshot({ path: '/home/z/my-project/download/cmd-k-palette.png', fullPage: false })
  console.log('✓ saved cmd-k-palette.png')
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)

  // Screenshot 2: Effect detail page showing the new "React" copy button
  await page.goto(`${BASE}/effect/btn-gradient`, { waitUntil: 'networkidle' })
  // Find the React button on the CSS code block.
  const reactBtn = page.getByRole('button', { name: 'Copy as React component' }).first()
  await reactBtn.scrollIntoViewIfNeeded()
  await page.waitForTimeout(200)
  await page.screenshot({ path: '/home/z/my-project/download/copy-as-react.png', fullPage: false })
  console.log('✓ saved copy-as-react.png')

  await browser.close()
}

main().catch((e) => {
  console.error('FAILED:', e.message)
  process.exit(1)
})
