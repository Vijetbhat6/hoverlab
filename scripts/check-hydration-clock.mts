/**
 * Catch components whose server render depends on the reader's clock.
 *
 *     npx tsx scripts/check-hydration-clock.mts
 *
 * ── WHAT THIS IS FOR ─────────────────────────────────────────────────────
 *
 * `new Date()` in the body of a client component is a hydration bug. The
 * server renders in one timezone and the browser hydrates in another, and
 * for the hours between their two midnights they are not merely different
 * clocks — they are on different DAYS. React answers markup that disagrees
 * by discarding the server's copy of the subtree and rebuilding it, and it
 * logs error #418 while doing so.
 *
 * This shipped. `<Calendar>` computed `today` during render, so the server
 * marked one cell `aria-current="date"` and the browser marked another;
 * around a month boundary it was not one cell but the whole grid. It
 * reached production on five primitives and the three catalog pages that
 * preview them, and nothing caught it, for a reason worth writing down:
 *
 *   every other check we own renders in ONE process, in ONE timezone,
 *   where the two halves of the comparison cannot possibly disagree.
 *
 * `build-block-markup` server-renders all 291 blocks and would have been
 * perfectly happy. `test-blocks` hydrates each one in a real browser — but
 * the browser is on the same machine as the dev server, so it is the same
 * timezone again. The defect is invisible to every one of them by
 * construction, not by oversight.
 *
 * ── HOW IT WORKS ─────────────────────────────────────────────────────────
 *
 * Render the catalog twice in two child processes, one at `TZ=UTC` and one
 * at `TZ=Pacific/Kiritimati` (+14, the furthest apart two zones get), with
 * the clock pinned to an instant that falls on different dates in each.
 * Anything whose markup differs read the clock while rendering.
 *
 * The clock is pinned rather than live because otherwise the check only
 * works during the hours the two zones disagree — it would pass all
 * morning and fail after lunch, which is worse than not having it.
 *
 * ── THE CONTROL ──────────────────────────────────────────────────────────
 *
 * A component that deliberately reads the clock is rendered alongside the
 * catalog, and the run FAILS if it comes out identical. Without it this
 * check has a silent failure mode that looks exactly like success: get the
 * pinning wrong, or pick two zones that happen to agree, and every artifact
 * matches and the check reports a confident green having tested nothing.
 * That is not hypothetical — the first version of this was written against
 * the live clock and passed on a calendar that was still broken.
 */

import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'

/**
 * New Year's Eve, deliberately.
 *
 * UTC is on 2026-12-31 at this instant and UTC+14 is already on
 * 2027-01-01, so the two zones disagree about the day, the month AND the
 * year in a single run. A mid-September instant catches a calendar cell but
 * lets `© {new Date().getFullYear()}` through, which is the most common
 * form of this bug in the whole catalog.
 */
const FIXED = Date.parse('2026-12-31T23:30:00Z')

const ZONES = ['UTC', 'Pacific/Kiritimati']
const SELF = fileURLToPath(import.meta.url)

/**
 * Artifacts whose markup may move with the clock, and why that is safe.
 *
 * Reading the clock during render is not automatically a defect — it is a
 * defect when the render happens TWICE, once on each side of a hydration
 * boundary. A server component renders once, on the server, and ships the
 * result; there is no second render to disagree with it. So the question
 * this ledger answers is not "does it read the clock" but "can anything
 * read it a second time".
 *
 * Every entry names the reason, because the reason is the part that lets
 * the next person judge whether it still holds. A `'use client'` added to
 * one of the first two footers turns its entry from true into false without
 * changing a line near the clock.
 */
const RULED: Record<string, string> = {
  'block/footer-mega':
    'a server component. `year` defaults to the clock, but the module never reaches the browser, so the value is rendered once and shipped as text.',
  'block/footer-minimal':
    'a server component, same as footer-mega — one render, on the server, nothing to disagree with it.',
  'block/footer-compliance':
    "a client component, so the copyright year IS read twice. The <p> carries `suppressHydrationWarning`, which is React's sanctioned answer for a timestamp: the server's year is kept and no subtree is discarded. Worst case is a few hours of last year's copyright on New Year's Eve.",
  'block/footer-newsletter':
    'a client component whose `year` prop defaults to the clock; same `suppressHydrationWarning` treatment, and a caller that passes `year` never depends on it.',
}

/* ══ CHILD: render everything under whatever TZ we were started with ═══ */

async function render(): Promise<Record<string, string>> {
  const RealDate = Date
  class FakeDate extends RealDate {
    constructor(...args: ConstructorParameters<typeof Date>) {
      // @ts-expect-error — forwarding a variadic Date constructor
      if (args.length === 0) super(FIXED)
      else super(...args)
    }
    static now(): number {
      return FIXED
    }
  }
  // @ts-expect-error — deliberate global stub, before anything imports React
  globalThis.Date = FakeDate

  const { renderToStaticMarkup } = await import('react-dom/server')
  const React = await import('react')
  const { BLOCK_CATALOG } = await import('../src/lib/blocks/catalog.ts')
  const { getBlockPreview } = await import('../src/lib/blocks/registry.tsx')
  const { PRIMITIVE_CATALOG } = await import('../src/lib/primitives/catalog.ts')
  const { getPrimitivePreview } = await import('../src/lib/primitives/registry.tsx')

  const digest: Record<string, string> = {}
  const hash = (s: string) => createHash('sha1').update(s).digest('hex').slice(0, 16)

  /* The control. If this does not differ between the two zones, the
     comparison below is not measuring anything. */
  function Control() {
    const d = React.useMemo(() => new Date(), [])
    return React.createElement('i', null, `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`)
  }
  digest['::control'] = hash(renderToStaticMarkup(React.createElement(Control)))

  const render1 = (id: string, node: React.ReactNode) => {
    try {
      digest[id] = hash(renderToStaticMarkup(node as React.ReactElement))
    } catch {
      // A block that throws on render is a real bug, but it is not THIS
      // check's bug — build-block-markup already fails the build for it.
      digest[id] = 'render-failed'
    }
  }

  for (const block of BLOCK_CATALOG) {
    const preview = getBlockPreview(block.previewComponent)
    if (preview) render1(`block/${block.id}`, preview)
  }
  for (const p of PRIMITIVE_CATALOG) {
    const preview = getPrimitivePreview(p.previewComponent ?? p.id)
    if (preview) render1(`primitive/${p.id}`, preview)
  }

  return digest
}

/* ══ PARENT: run the child once per zone and compare ═══════════════════ */

if (process.argv.includes('--render')) {
  process.stdout.write(JSON.stringify(await render()))
} else {
  const digests = ZONES.map((tz) => {
    const run = spawnSync(
      process.execPath,
      ['--import=tsx', SELF, '--render'],
      { env: { ...process.env, TZ: tz }, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
    )
    if (run.status !== 0) {
      console.error(`check-hydration-clock: render under TZ=${tz} failed\n`)
      console.error(run.stderr?.slice(0, 4000))
      process.exit(1)
    }
    return JSON.parse(run.stdout) as Record<string, string>
  })

  const [utc, far] = digests as [Record<string, string>, Record<string, string>]

  if (utc['::control'] === far['::control']) {
    console.error(
      'check-hydration-clock: the control rendered the SAME in both zones.\n' +
        '  The check is not measuring anything — fix the pinned instant or the\n' +
        '  zone pair before trusting a green run.',
    )
    process.exit(1)
  }

  const ids = Object.keys(utc).filter((id) => id !== '::control')
  const moved = ids.filter((id) => utc[id] !== far[id])
  const unruled = moved.filter((id) => !RULED[id])

  console.log(
    `check-hydration-clock: ${ids.length} artifacts rendered at ${ZONES.join(' and ')}, ` +
      'control confirmed sensitive.',
  )
  console.log(
    `check-hydration-clock: ${ids.length - moved.length} are clock-independent, ` +
      `${moved.length} ruled safe.`,
  )

  // A ruling whose artifact has stopped moving is a ruling waiting to
  // excuse the wrong thing — the same guard check-rtl keeps over PHYSICAL.
  const stale = Object.keys(RULED).filter((id) => !moved.includes(id))
  for (const id of stale) {
    console.error(
      `\ncheck-hydration-clock: RULED lists ${id}, but its markup no longer ` +
        'moves with the clock — delete the entry.',
    )
    process.exitCode = 1
  }

  if (unruled.length > 0) {
    console.error(
      `\ncheck-hydration-clock: ${unruled.length} artifact(s) render differently ` +
        'in a different timezone.\n',
    )
    for (const id of unruled) console.error(`  ${id}`)
    console.error(
      '\nEach of these reads the clock during render, so the server and the\n' +
        "reader's browser can disagree and React will discard the subtree.\n" +
        'Read it in an effect instead — <RelativeTime>, <Calendar> and\n' +
        '<PaymentMethodCard> all show the shape. If the second render cannot\n' +
        'happen (a server component) or the difference is harmless and\n' +
        'suppressed, add it to RULED with the reason.',
    )
    process.exitCode = 1
  }
}
