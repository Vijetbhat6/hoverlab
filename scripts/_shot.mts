import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
const [dir, file, x0, x1, y0, y1, out] = process.argv.slice(2)
const b = await chromium.launch()
const svg = readFileSync(join(dir, file), 'utf8')
const page = await b.newPage({ viewport: { width: 1800, height: 900 } })
await page.setContent(`<body style="margin:0">${svg}</body>`)
await page.screenshot({ path: join(dir, out), clip: { x: +x0, y: +y0, width: +x1 - +x0, height: +y1 - +y0 }, fullPage: true })
await b.close()
