// Drive /studio in a real browser, in both themes.
//
// "It returns 200" is not evidence for this page. Everything on it is a
// live derivation: the canvas paints inline custom properties that React's
// types do not know are custom properties, the Agent tab builds a document
// from state on every keystroke, and the whole editor hangs off a hook
// whose restore path runs in an effect. Every one of those fails silently
// in the DOM and loudly in the console, so console and page errors are
// collected alongside the pixels.
//
// What it actually asserts, rather than just photographing:
//
//   - the seed handoff works — arriving from the token generator's own
//     query string lands on that hue rather than on a blank canvas
//   - the canvas paints two different themes, measured off computed
//     styles, not eyeballed
//   - switching tabs produces the token block and the DNA document, and
//     the document contains the identity that was typed into the panel
//   - the AGENTS.md variant is shorter than the prompt, which is the one
//     claim the tab makes about it
//
// Usage: BASE=http://localhost:3007 npx tsx scripts/shot-studio.mts [outDir]

import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const BASE = process.env.BASE ?? 'http://localhost:3007'
const OUT = process.argv[2] ?? 'tool-results/studio'

mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch()
const problems: string[] = []
const notes: string[] = []

for (const theme of ['light', 'dark'] as const) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1800 },
    colorScheme: theme,
  })

  // The first-visit ladder tour opens a dialog over whichever page loads
  // first and aria-hides the page wrapper behind it, which breaks both the
  // screenshot and every getByRole query.
  await context.addInitScript(() => {
    try {
      window.localStorage.setItem('hoverlab:ladder-tour-seen', '1')
    } catch {
      /* private mode — the tour will open and the shot will show it */
    }
  })

  const page = await context.newPage()
  page.on('pageerror', (e) => problems.push(`[${theme}] pageerror: ${e}`))
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(`[${theme}] console: ${m.text()}`)
  })

  // The Next dev badge intercepts clicks in the bottom corner. Hidden with
  // a stylesheet rather than clicked through with `force: true`, which
  // would pass while testing nothing.
  await page.addStyleTag({ content: 'nextjs-portal{display:none!important}' })

  /* ---- The handoff from the token generator ---------------------- */
  await page.goto(`${BASE}/studio?hue=290&chroma=0.2&radius=1.5`, {
    waitUntil: 'domcontentloaded',
  })
  // `networkidle` never settles under `next dev` — the HMR socket keeps a
  // connection open — so every wait here is for the element being asserted.
  await page.waitForSelector('h1:text("Hoverlab Studio")')
  await page.waitForSelector('text=/^accent #/')
  await page.addStyleTag({ content: 'nextjs-portal{display:none!important}' })

  /*
    Wait for the seed to LAND, not for the element to exist.

    The canvas is server-rendered from the defaults — the seed is read in an
    effect after hydration, because `useToolState` has to let its
    localStorage restore run first or the stored state would overwrite the
    link. So the readout is present and says `hue 160` for a beat before it
    says `hue 290`, and asserting on first paint tests the defaults.

    The cleared query string is the signal the effect has finished: it is
    the last thing the seed effect does.
  */
  await page.waitForFunction(() => !window.location.search.includes('hue='), null, {
    timeout: 15_000,
  })
  const readout = (await page.locator('text=/^accent #/').first().textContent()) ?? ''
  if (!readout.includes('hue 290')) {
    problems.push(`[${theme}] seed ignored — readout says "${readout.trim()}"`)
  } else {
    notes.push(`[${theme}] seed applied: ${readout.trim()}`)
  }

  /* ---- The canvas paints two different themes -------------------- */
  const panes = page.locator('h3:text("Deployments")')
  if ((await panes.count()) !== 2) {
    problems.push(`[${theme}] expected 2 canvas panes, found ${await panes.count()}`)
  }
  const grounds = await panes.evaluateAll((nodes) =>
    nodes.map((n) => getComputedStyle(n.parentElement!.parentElement!).backgroundColor),
  )
  if (grounds[0] === grounds[1]) {
    problems.push(`[${theme}] both canvas panes painted ${grounds[0]} — tokens not scoped`)
  } else {
    notes.push(`[${theme}] canvas grounds: ${grounds.join(' vs ')}`)
  }

  /* ---- Identity ------------------------------------------------- */
  // The panel starts OPEN on a blank canvas — a first visit has to see
  // that these fields exist at all — so it is not clicked, it is checked.
  const disclosure = page.getByRole('button', { name: 'Identity' })
  if ((await disclosure.getAttribute('aria-expanded')) !== 'true') {
    problems.push(`[${theme}] Identity panel started closed on a blank canvas`)
    await disclosure.click()
  }
  await page.getByLabel('Product').fill('A deployment dashboard')
  await page.getByLabel('Voice & tone').fill('Direct and calm. Short sentences.')
  await page.getByRole('button', { name: '+ No exclamation marks' }).click()
  await page.screenshot({ path: join(OUT, `studio-style-${theme}.png`), fullPage: true })

  /* ---- Variables ------------------------------------------------ */
  await page.getByRole('tab', { name: 'Variables' }).click()
  await page.waitForSelector('text=/--muted-foreground/')
  const varsText = (await page.locator('main').textContent()) ?? ''
  for (const needle of ['--brand-hue', '@theme inline', '--radius: 1.5rem']) {
    if (!varsText.includes(needle)) problems.push(`[${theme}] Variables tab missing ${needle}`)
  }
  await page.screenshot({ path: join(OUT, `studio-variables-${theme}.png`), fullPage: true })

  /* ---- Agent ---------------------------------------------------- */
  await page.getByRole('tab', { name: 'Agent' }).click()
  await page.waitForSelector('pre code')
  const prompt = (await page.locator('pre code').first().textContent()) ?? ''
  for (const needle of [
    '# A deployment dashboard — Design DNA',
    'Direct and calm',
    '**Never**: No exclamation marks',
    '--radius: 1.5rem',
    'npx hoverlab add',
  ]) {
    if (!prompt.includes(needle)) problems.push(`[${theme}] DNA document missing "${needle}"`)
  }
  notes.push(`[${theme}] DNA document: ${prompt.split('\n').length} lines`)
  await page.screenshot({ path: join(OUT, `studio-agent-${theme}.png`), fullPage: true })

  await page.getByRole('radio', { name: /Commit as AGENTS.md/ }).click()
  await page.waitForTimeout(150)
  const rules = (await page.locator('pre code').first().textContent()) ?? ''
  if (rules.length >= prompt.length) {
    problems.push(`[${theme}] AGENTS.md (${rules.length}) is not shorter than the prompt (${prompt.length})`)
  }
  if (rules.includes('@theme inline')) {
    problems.push(`[${theme}] AGENTS.md still carries the finished token block`)
  }
  if (!rules.startsWith('---')) problems.push(`[${theme}] AGENTS.md has no frontmatter`)
  notes.push(`[${theme}] AGENTS.md: ${rules.split('\n').length} lines vs ${prompt.split('\n').length}`)
  await page.screenshot({ path: join(OUT, `studio-agents-${theme}.png`), fullPage: true })

  /* ---- The accent lightness sliders actually do something -------- */
  /*
    The regression that mattered most, and the only one a unit test cannot
    fully close: the sliders were inert because the value never reached the
    scheme the canvas paints from. So this drags the real control and reads
    the real computed colour off the real button.
  */
  await page.getByRole('tab', { name: 'Style' }).click()
  await page.getByText('Accent lightness', { exact: false }).click()
  const button = page.locator('span:text("Deploy")').first()
  const primaryAt = async () => {
    await page.waitForTimeout(120)
    return button.evaluate((n) => getComputedStyle(n).backgroundColor)
  }
  const slider = page.getByRole('slider', { name: 'Accent lightness in the light theme' })
  await slider.focus()
  const before = await primaryAt()
  for (let i = 0; i < 12; i += 1) await slider.press('ArrowLeft')
  const after = await primaryAt()
  if (before === after) {
    problems.push(`[${theme}] accent lightness is inert — button stayed ${before}`)
  } else {
    notes.push(`[${theme}] lightness moved the button: ${before} -> ${after}`)
  }

  /* ---- The handoff bands on the folded tools --------------------- */
  for (const tool of ['/tools/tokens', '/tools/palette']) {
    await page.goto(`${BASE}${tool}`, { waitUntil: 'domcontentloaded' })
    const link = page.getByRole('link', { name: 'Open in the Studio' })
    await link.first().waitFor({ state: 'attached', timeout: 30_000 }).catch(() => {})
    if ((await link.count()) === 0) {
      problems.push(`[${theme}] no studio handoff on ${tool}`)
      continue
    }
    const href = await link.first().getAttribute('href')
    if (!href?.startsWith('/studio?')) {
      problems.push(`[${theme}] ${tool} handoff carries no state: ${href}`)
    } else {
      notes.push(`[${theme}] ${tool} → ${href}`)
    }
  }

  await context.close()
}

await browser.close()

for (const note of notes) console.log(`  ${note}`)
if (problems.length) {
  console.error(`\n${problems.length} problem(s):`)
  for (const problem of problems) console.error(`  ${problem}`)
  process.exit(1)
}
console.log(`\nOK — shots in ${OUT}`)
