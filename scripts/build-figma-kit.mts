/**
 * The Figma kit — every block in the catalog, as frames a designer can open.
 *
 * ── THE GAP THIS CLOSES, AND THE HALF IT DOES NOT ───────────────────────
 *
 * `/compare` has conceded design files since it was written, and the market
 * moved further while we were not looking: Preline and Flowbite now give a
 * Figma design system away for nothing. A designer comparing shopping carts
 * sees a column we cannot tick.
 *
 * We already had the hard half built. `figma-frame.ts` traces a rendered
 * block out of the DOM and writes SVG that Figma parses into real layers —
 * boxes, radii, type, and colours rasterized out of `oklch()` so they do not
 * paste as black. What was missing was scale: it produced one frame, on
 * click, for the block you happened to be looking at. A designer evaluating
 * a catalog does not want one section on demand; they want the library.
 *
 * So this script performs that same click, over every block, and stitches
 * the results into one file per category.
 *
 * BE PRECISE ABOUT WHAT ARRIVES. Named, editable frames — not components
 * with variants, not auto-layout, not a design system in the sense Untitled
 * UI sells one. Anything that renders is a rectangle or a text layer, and
 * hover states and motion do not exist in a static frame. That limit is
 * stated on `/figma`, in the manifest, and inside each file, and `/compare`
 * goes on conceding the design-system row — a flat frame kit is genuinely
 * useful and is genuinely not the thing Preline ships.
 *
 * ── WHY IT DRIVES THE REAL UI INSTEAD OF IMPORTING THE MODULE ───────────
 *
 * The obvious build imports `frameToSvg` and calls it. It cannot: the
 * function reads `getBoundingClientRect` and `getComputedStyle`, so a block's
 * geometry does not exist until a browser has laid it out, and the colour
 * normalizer needs a canvas to rasterize a token through.
 *
 * Given a browser is required anyway, this drives the button a user drives.
 * The output is therefore byte-identical to what "Copy frame for Figma"
 * puts on the clipboard, and there is no second code path to drift from the
 * one that ships.
 *
 * ── WHY IT IS RUN BY HAND ───────────────────────────────────────────────
 *
 * Not in `prebuild`. It needs a running dev server and a real browser for
 * several minutes, and a deploy that cannot happen because Chromium failed
 * to start would be a bad trade for an asset that changes when blocks do.
 * `check-figma-kit.mts` is the guard instead: it fails the build when the
 * catalog has blocks the kit does not, which is the failure that actually
 * matters — a kit quietly missing the twelve blocks added last month.
 *
 *   npm run dev
 *   npm run build:figma            # BASE=http://localhost:3007 to override
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'

import { BLOCK_INDEX } from '../src/lib/blocks/block-index.ts'
import { blockCategorySlug, type BlockCategory } from '../src/lib/blocks/block-types.ts'

const BASE = process.env.BASE ?? 'http://localhost:3007'
/** Trace only the first N blocks. For checking the harness, not for shipping. */
const LIMIT = process.env.LIMIT ? Number(process.env.LIMIT) : Infinity
const OUT_DIR = join(process.cwd(), 'public', 'figma')

/** Gap between stacked frames, and the room left for each frame's label. */
const GAP = 96
const LABEL_HEIGHT = 52
/** Page margin, so the outermost frame is not flush against the artboard. */
const MARGIN = 64

interface Traced {
  id: string
  name: string
  category: BlockCategory
  width: number
  height: number
  /** The inner layers, with the wrapping <svg> removed. */
  body: string
}

/** Strip the outer <svg …> … </svg> and return what was inside it. */
function innerOf(svg: string): string {
  const open = svg.indexOf('>')
  const close = svg.lastIndexOf('</svg>')
  if (open === -1 || close === -1) return ''
  return svg.slice(open + 1, close).trim()
}

function attr(svg: string, name: string): number {
  const m = svg.match(new RegExp(`${name}="([0-9.]+)"`))
  return m ? Number(m[1]) : 0
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Indent a traced frame's layers so the stitched file stays readable. */
function indent(body: string): string {
  return body
    .split('\n')
    .map((line) => `    ${line}`)
    .join('\n')
}

/**
 * One category's frames, stacked vertically with a label over each.
 *
 * Vertical rather than a grid because a Figma artboard scrolls in one
 * direction comfortably and because the order then matches `/blocks`, which
 * is the page the designer was just looking at.
 */
function stitch(category: BlockCategory, frames: Traced[]): string {
  const width = Math.max(...frames.map((f) => f.width)) + MARGIN * 2
  let y = MARGIN

  const parts: string[] = []

  for (const f of frames) {
    parts.push(
      `  <text id="${escapeXml(f.name)} label" x="${MARGIN}" y="${y + 20}" ` +
        `font-family="Inter, system-ui, sans-serif" font-size="18" font-weight="600" ` +
        `fill="#0a0a0a">${escapeXml(f.name)}</text>`,
    )
    // The id on its own line rather than trailing the name: guessing a text
    // width from character count puts it on top of long names.
    parts.push(
      `  <text id="${escapeXml(f.id)} id" x="${MARGIN}" y="${y + 34}" ` +
        `font-family="ui-monospace, monospace" font-size="12" ` +
        `fill="#737373">${escapeXml(f.id)}</text>`,
    )

    const top = y + LABEL_HEIGHT
    parts.push(
      `  <g id="${escapeXml(f.name)}" transform="translate(${MARGIN}, ${top})">\n` +
        indent(f.body) +
        `\n  </g>`,
    )

    y = top + f.height + GAP
  }

  const height = y - GAP + MARGIN

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(width)}" ` +
      `height="${Math.round(height)}" viewBox="0 0 ${Math.round(width)} ${Math.round(height)}" ` +
      `id="Hoverlab — ${escapeXml(category)}">`,
    `  <!--`,
    `    Hoverlab — ${category}. ${frames.length} sections, traced from the`,
    `    rendered catalog. Drag this file onto a Figma canvas.`,
    ``,
    `    These are frames, not components: named, editable layers with real`,
    `    geometry, colour and type. There are no variants, no auto-layout,`,
    `    and no hover or motion — none of those exist in a static frame.`,
    ``,
    `    Every section here is free to copy as code at https://hoverlab.dev/blocks`,
    `  -->`,
    `  <rect id="Background" x="0" y="0" width="${Math.round(width)}" height="${Math.round(height)}" fill="#ffffff" />`,
    ...parts,
    '</svg>',
    '',
  ].join('\n')
}

/* ------------------------------------------------------------------ *
 *  Trace
 * ------------------------------------------------------------------ */

const browser = await chromium.launch()
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 1200 },
  permissions: ['clipboard-read', 'clipboard-write'],
  colorScheme: 'light',
})

/*
 * A shipped kit must be deterministic, and the tracer deliberately reflects
 * whatever the reader is looking at — paste in dark mode and the frame is
 * dark. So the theme is pinned rather than left to the machine running this,
 * and the tour is dismissed because it aria-hides the page wrapper the
 * preview lives in.
 */
await ctx.addInitScript(() => {
  try {
    window.localStorage.setItem('theme', 'light')
    window.localStorage.setItem('hoverlab:ladder-tour-seen', '1')
  } catch {
    /* private mode — the defaults are close enough to keep going */
  }
})

const page = await ctx.newPage()
const traced: Traced[] = []
const failed: string[] = []

/**
 * Trace one block, or throw.
 *
 * NOT `waitUntil: 'networkidle'`, which is what the first version used and
 * why a 250-block run produced 250 timeouts and no frames. A dev server
 * holds an HMR channel open, so the network is never idle and every
 * navigation burns its full timeout before failing. The real signal is the
 * thing being traced: the preview element, and the button that traces it.
 */
async function trace(block: (typeof BLOCK_INDEX)[number]): Promise<Traced> {
  await page.goto(`${BASE}/block/${block.id}`, {
    waitUntil: 'domcontentloaded',
    timeout: 45_000,
  })

  const button = page.getByRole('button', { name: /figma/i }).first()
  await button.waitFor({ state: 'visible', timeout: 45_000 })

  // The walker measures laid-out geometry, so it has to run after layout has
  // settled rather than merely after the button exists.
  await page.waitForTimeout(500)
  await button.click()

  /*
   * Poll the clipboard rather than sleeping a fixed interval. The click
   * dynamically imports the walker and then walks a few hundred nodes, and
   * how long that takes varies with the block — a fixed wait is either too
   * short for the big ones or wasted on all 250.
   */
  let svg = ''
  for (let attempt = 0; attempt < 40; attempt++) {
    svg = await page.evaluate(() => navigator.clipboard.readText())
    if (svg.startsWith('<svg')) break
    await page.waitForTimeout(100)
  }

  if (!svg.startsWith('<svg')) throw new Error('clipboard held no SVG after 4s')

  // The clipboard persists across navigations, so a block whose click failed
  // would otherwise be recorded as a duplicate of the previous one.
  await page.evaluate(() => navigator.clipboard.writeText(''))

  return {
    id: block.id,
    name: block.name,
    category: block.category,
    width: attr(svg, 'width'),
    height: attr(svg, 'height'),
    body: innerOf(svg),
  }
}

const targets = BLOCK_INDEX.slice(0, LIMIT)

for (const [i, block] of targets.entries()) {
  try {
    traced.push(await trace(block))
  } catch (first) {
    // One retry. Over a few hundred navigations a dev server will drop one
    // for reasons that have nothing to do with the block being traced.
    try {
      traced.push(await trace(block))
    } catch (second) {
      failed.push(
        `${block.id}: ${(second as Error).message.split('\n')[0]} ` +
          `(first attempt: ${(first as Error).message.split('\n')[0]})`,
      )
    }
  }

  if ((i + 1) % 25 === 0) {
    console.log(`build-figma-kit: ${i + 1}/${targets.length} traced`)
  }
}

await browser.close()

/*
 * Report before deciding. An earlier version threw on an empty result with a
 * guess about the dev server, having collected 250 real reasons and printed
 * none of them — which is the least useful thing a build script can do with
 * a diagnosis it is already holding.
 */
if (failed.length) {
  console.log(`build-figma-kit: ${failed.length} did not trace:`)
  for (const f of failed.slice(0, 20)) console.log(`  ${f}`)
  if (failed.length > 20) console.log(`  … and ${failed.length - 20} more`)
}

if (traced.length === 0) {
  throw new Error(
    `build-figma-kit: traced nothing out of ${BLOCK_INDEX.length}. ` +
      `The reasons are above. Is the dev server up at ${BASE}?`,
  )
}

/* ------------------------------------------------------------------ *
 *  Emit
 * ------------------------------------------------------------------ */

mkdirSync(OUT_DIR, { recursive: true })

const byCategory = new Map<BlockCategory, Traced[]>()
for (const f of traced) {
  const list = byCategory.get(f.category) ?? []
  list.push(f)
  byCategory.set(f.category, list)
}

const files: {
  category: string
  slug: string
  file: string
  sections: number
  bytes: number
  ids: string[]
}[] = []

for (const [category, frames] of byCategory) {
  const slug = blockCategorySlug(category)
  const svg = stitch(category, frames)
  const file = `blocks-${slug}.svg`
  writeFileSync(join(OUT_DIR, file), svg)
  files.push({
    category,
    slug,
    file,
    sections: frames.length,
    bytes: svg.length,
    ids: frames.map((f) => f.id),
  })
}

files.sort((a, b) => a.category.localeCompare(b.category))

writeFileSync(
  join(OUT_DIR, 'manifest.json'),
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString().slice(0, 10),
      sections: traced.length,
      note:
        'Frames, not components. Named editable layers with real geometry, colour and type; no variants, no auto-layout, no hover or motion.',
      files,
    },
    null,
    2,
  )}\n`,
)

const totalBytes = files.reduce((n, f) => n + f.bytes, 0)
console.log(
  `build-figma-kit: ${traced.length} sections in ${files.length} files, ` +
    `${(totalBytes / 1024 / 1024).toFixed(2)} MB total`,
)

