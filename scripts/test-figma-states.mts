/**
 * Proves the state-forcing mechanism can fire, and can stay quiet.
 *
 * A coverage crawl that reports "styled" for everything, or "not styled" for
 * everything, looks identical to one that works. So each state gets a control
 * that MUST read styled and a near-twin that MUST read not-styled, in a page
 * this script controls (`page.setContent`, no server), measured through the
 * same `src/lib/states/force.ts` the crawler uses.
 *
 * The cases the task names explicitly:
 *   - :hover{background} + :focus-visible{outline}  -> styled for hover AND focus
 *   - no such rules                                 -> not-styled for both
 *                                                     (and a focus defect)
 *   - a box-shadow RING only                        -> styled (not missed)
 *
 *     npx tsx scripts/test-figma-states.mts
 */

import assert from 'node:assert/strict'

import { chromium, type Browser } from 'playwright'

import { measureState, prepare, type StateResult } from '../src/lib/states/force.ts'
import { focusDefects, type StateId } from '../src/lib/states/states.ts'

const browser: Browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 900, height: 600 }, colorScheme: 'light' })
await context.addInitScript('globalThis.__name = globalThis.__name || function (f) { return f }')

const BASE_CSS = `
body{margin:0;font:16px/1.4 sans-serif;background:#fff;color:#111}
#p{width:320px;padding:12px}
button,input{font:inherit}
`

async function run(html: string, css: string, state: StateId): Promise<StateResult> {
  const page = await context.newPage()
  await page.setContent(
    `<!doctype html><html><head><meta charset="utf-8"><style>${BASE_CSS}${css}</style></head><body><main id="p">${html}</main></body></html>`,
  )
  await page.waitForTimeout(60)
  const cdp = await context.newCDPSession(page)
  const p = await prepare(page, cdp, '#p')
  const result = await measureState(p, state)
  await page.close()
  return result
}

let passed = 0
let failed = 0
async function check(name: string, fn: () => Promise<void>) {
  try {
    await fn()
    passed++
    console.log(`  ok   ${name}`)
  } catch (e) {
    failed++
    console.log(`  FAIL ${name}\n       ${(e as Error).message.split('\n').join('\n       ')}`)
  }
}

const verdict = (r: StateResult) => (!r.applicable ? 'n/a' : r.styled ? 'styled' : 'not-styled')

// ── interactive pseudo states ─────────────────────────────────────────────
const STYLED_BTN = `<button class="a">Save</button>`
const STYLED_CSS = `.a:hover{background:#0a0}.a:focus-visible{outline:3px solid #06f}.a:active{transform:scale(.9)}`
const BARE_BTN = `<button class="b">Save</button>`
// The UA draws a focus ring on a bare button, but only for real keyboard focus.
// Author CSS that removes it (the Tailwind reset does) leaves the button bare.
const BARE_CSS = `.b{outline:none}`

await check('hover: :hover{background} reads styled', async () => {
  assert.equal(verdict(await run(STYLED_BTN, STYLED_CSS, 'hover')), 'styled')
})
await check('focus: :focus-visible{outline} reads styled', async () => {
  assert.equal(verdict(await run(STYLED_BTN, STYLED_CSS, 'focus')), 'styled')
})
await check('active: :active{transform} reads styled', async () => {
  assert.equal(verdict(await run(STYLED_BTN, STYLED_CSS, 'active')), 'styled')
})
await check('hover: a bare button reads not-styled', async () => {
  assert.equal(verdict(await run(BARE_BTN, BARE_CSS, 'hover')), 'not-styled')
})
await check('focus: a bare button reads not-styled and is a focus defect', async () => {
  const r = await run(BARE_BTN, BARE_CSS, 'focus')
  assert.equal(verdict(r), 'not-styled')
  const defects = focusDefects({
    demo: r.controls.map((c) => ({ label: c.label, focusStyled: c.styled })),
  })
  assert.equal(defects.length, 1)
  assert.equal(defects[0].control, 'button "Save"')
})
await check('active: a bare button reads not-styled', async () => {
  assert.equal(verdict(await run(BARE_BTN, BARE_CSS, 'active')), 'not-styled')
})

await check('focus: a box-shadow ring alone is styled (not missed)', async () => {
  const html = `<button class="r">Ring</button>`
  const css = `.r{outline:none}.r:focus-visible{box-shadow:0 0 0 3px #06f}`
  assert.equal(verdict(await run(html, css, 'focus')), 'styled')
})

await check('focus: a ring painted by the wrapper (:focus-within) is styled', async () => {
  const html = `<div class="w"><input class="i" placeholder="Name"></div>`
  const css = `.i{outline:none;border:0}.w:focus-within{box-shadow:0 0 0 3px #06f}`
  assert.equal(verdict(await run(html, css, 'focus')), 'styled')
})

await check('focus: the same wrapper WITHOUT the ring is a defect', async () => {
  const html = `<div class="w"><input class="i" placeholder="Name"></div>`
  const css = `.i{outline:none;border:0}`
  assert.equal(verdict(await run(html, css, 'focus')), 'not-styled')
})

await check('hover: a role=button div is found and forced', async () => {
  const html = `<div role="button" tabindex="0" class="d">Do</div>`
  const css = `.d:hover{color:#c00}`
  assert.equal(verdict(await run(html, css, 'hover')), 'styled')
})

await check('hover: a tabindex=-1 container is not a control', async () => {
  const html = `<div tabindex="-1" class="d">Panel</div>`
  const css = `.d:hover{color:#c00}`
  assert.equal(verdict(await run(html, css, 'hover')), 'n/a')
})

await check('hover/focus/active: nothing interactive reads n/a', async () => {
  for (const s of ['hover', 'focus', 'active', 'disabled', 'loading', 'error'] as StateId[]) {
    assert.equal(verdict(await run(`<p>Just text</p>`, `p:hover{color:red}`, s)), 'n/a', s)
  }
})

// ── attribute states ──────────────────────────────────────────────────────
await check('disabled: button:disabled{opacity} styled, bare button not-styled', async () => {
  // Author colours beat the UA's greyed-out disabled colours, so a bare button is bare.
  const bare = `.a{color:#111;background:#eee;border:0}`
  assert.equal(verdict(await run(`<button class="a">Go</button>`, `${bare}.a:disabled{opacity:.4}`, 'disabled')), 'styled')
  assert.equal(verdict(await run(`<button class="a">Go</button>`, bare, 'disabled')), 'not-styled')
})
await check('disabled: aria-disabled on a role control is honoured', async () => {
  const html = `<div role="switch" tabindex="0" class="s" aria-checked="false"></div>`
  const css = `.s{width:20px;height:10px;background:#0a0}.s[aria-disabled=true]{background:#999}`
  assert.equal(verdict(await run(html, css, 'disabled')), 'styled')
})
await check('error: [aria-invalid] border reads styled, bare input not-styled, a button is n/a', async () => {
  assert.equal(verdict(await run(`<input class="i">`, `.i[aria-invalid=true]{border-color:#c00}`, 'error')), 'styled')
  assert.equal(verdict(await run(`<input class="i">`, ``, 'error')), 'not-styled')
  assert.equal(verdict(await run(`<button>Go</button>`, `button[aria-invalid]{color:red}`, 'error')), 'n/a')
})
await check('loading: [aria-busy] reads styled; without a rule it is not-styled, never faked', async () => {
  assert.equal(verdict(await run(`<button class="a">Go</button>`, `.a[aria-busy=true]{opacity:.6}`, 'loading')), 'styled')
  assert.equal(verdict(await run(`<button class="a">Go</button>`, ``, 'loading')), 'not-styled')
})

// ── content states ────────────────────────────────────────────────────────
await check('empty: clears a controlled-style input through the native setter', async () => {
  const page = await context.newPage()
  await page.setContent(
    `<!doctype html><meta charset="utf-8"><main id="p"><input id="x" value="hello"><span id="echo"></span></main>
     <script>
       const x = document.getElementById('x'); const e = document.getElementById('echo');
       x.addEventListener('input', () => { e.setAttribute('data-len', String(x.value.length)) });
     </script>`,
  )
  const cdp = await context.newCDPSession(page)
  const p = await prepare(page, cdp, '#p')
  const r = await measureState(p, 'empty')
  assert.equal(r.applicable, true)
  assert.equal(await page.inputValue('#x'), '')
  assert.equal(await page.getAttribute('#echo', 'data-len'), '0', 'input event reached the page')
  await page.close()
})
await check('empty: an input holds its box open (styled); bare text collapses (not-styled)', async () => {
  assert.equal(verdict(await run(`<input value="hello">`, `input{height:36px;width:200px}`, 'empty')), 'styled')
  assert.equal(verdict(await run(`<h3>Quarterly revenue report</h3>`, ``, 'empty')), 'not-styled')
})
await check('empty: no text and no input reads n/a', async () => {
  assert.equal(verdict(await run(`<div style="width:40px;height:40px;background:#06f"></div>`, ``, 'empty')), 'n/a')
})
await check('long-text: ellipsis clipping is handled, an unclipped overflow is not', async () => {
  const clipped = `<div class="c">Ada</div>`
  const clippedCss = `.c{width:100px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}`
  assert.equal(verdict(await run(clipped, clippedCss, 'long-text')), 'styled')
  const leaky = `<div class="c"><span>Ada</span></div>`
  const leakyCss = `.c{width:100px;white-space:nowrap}`
  assert.equal(verdict(await run(leaky, leakyCss, 'long-text')), 'not-styled')
})
await check('long-text: wrapping text is handled', async () => {
  assert.equal(verdict(await run(`<p>Ada</p>`, `p{overflow-wrap:anywhere}`, 'long-text')), 'styled')
})
await check('long-text: no text reads n/a', async () => {
  assert.equal(verdict(await run(`<div style="width:40px;height:40px"></div>`, ``, 'long-text')), 'n/a')
})

await browser.close()
console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
