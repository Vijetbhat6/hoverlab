/**
 * The audit rules, on fixtures.
 *
 * `a11y-evidence.test.ts` next door tests the reader — that the numbers on
 * /accessibility are counted from the report rather than typed. This tests
 * the thing that produces the report, which until now had no test at all
 * because importing the script ran the whole audit and wrote two files.
 *
 * The cases are chosen for one reason: every one of them is a mistake this
 * audit actually made, or would have made, on the real catalog. A rule that
 * is nearly right produces confident, specific, wrong findings — and a
 * document whose entire value is being true cannot afford one. So the
 * negative cases (what must NOT be reported) outnumber the positive ones,
 * deliberately.
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { RULES } from '../../scripts/audit-a11y.mts'

function rule(id: string) {
  const found = RULES.find((r) => r.id === id)
  assert.ok(found, `no rule with id "${id}"`)
  return found
}

/** Findings a rule produces for a source, as plain strings. */
function run(id: string, source: string): string[] {
  return rule(id).check(source)
}

describe('control-has-name (4.1.2)', () => {
  it('reports a button whose only content is an icon', () => {
    const found = run(
      'control-has-name',
      '<button type="button" onClick={close}><X className="h-4 w-4" /></button>',
    )
    assert.equal(found.length, 1)
  })

  it('accepts an interpolated value as the name — the hero-search regression', () => {
    // <button>{s}</button>, where `s` is the suggestion text. An earlier
    // draft treated short expressions as empty and reported two working
    // components in the catalog as unnamed.
    assert.deepEqual(run('control-has-name', '<button type="button">{s}</button>'), [])
    assert.deepEqual(run('control-has-name', '<button type="button">{h}</button>'), [])
  })

  it('accepts sr-only text beside an icon', () => {
    const source =
      '<button type="button"><X aria-hidden className="h-3 w-3" />' +
      '<span className="sr-only">Remove from recent searches</span></button>'
    assert.deepEqual(run('control-has-name', source), [])
  })

  it('accepts an aria-label on the control itself', () => {
    assert.deepEqual(
      run('control-has-name', '<button aria-label="Close"><X /></button>'),
      [],
    )
  })

  it('does not mistake an icon class name for content', () => {
    // The nested tag is stripped before the text check. Without that,
    // "h-4 w-4 text-muted-foreground" reads as a perfectly good name.
    assert.equal(run('control-has-name', '<button><X className="h-4 w-4" /></button>').length, 1)
  })

  it('leaves an aria-hidden control alone', () => {
    // Out of the accessibility tree entirely, so it has no name to lack.
    assert.deepEqual(run('control-has-name', '<button aria-hidden><X /></button>'), [])
  })
})

describe('label-points-at-nothing (1.3.1)', () => {
  it('reports htmlFor with no matching id', () => {
    const found = run(
      'label-points-at-nothing',
      '<label htmlFor="email">Email</label><input type="email" />',
    )
    assert.equal(found.length, 1)
    assert.match(found[0]!, /email/)
  })

  it('accepts htmlFor with a matching id', () => {
    assert.deepEqual(
      run(
        'label-points-at-nothing',
        '<label htmlFor="email">Email</label><input id="email" type="email" />',
      ),
      [],
    )
  })

  it('ignores generated ids, which are paired by expression not by string', () => {
    assert.deepEqual(
      run(
        'label-points-at-nothing',
        '<label htmlFor={emailId}>Email</label><input id={emailId} />',
      ),
      [],
    )
  })
})

describe('paste-blocked-on-credential (3.3.8, new in WCAG 2.2)', () => {
  it('reports a password field that cancels paste', () => {
    const found = run(
      'paste-blocked-on-credential',
      '<input type="password" onPaste={(e) => e.preventDefault()} />',
    )
    assert.equal(found.length, 1)
  })

  it('reports a password field that turns off autocomplete', () => {
    const found = run(
      'paste-blocked-on-credential',
      '<input type="password" autoComplete="off" />',
    )
    assert.equal(found.length, 1)
  })

  it('accepts an ordinary password field', () => {
    assert.deepEqual(
      run('paste-blocked-on-credential', '<input type="password" autoComplete="current-password" />'),
      [],
    )
  })

  it('leaves a non-credential field alone', () => {
    // A search box that intercepts paste is doing something else, and 3.3.8
    // is about authentication.
    assert.deepEqual(
      run('paste-blocked-on-credential', '<input type="search" onPaste={handlePaste} />'),
      [],
    )
  })
})

describe('aria-hidden-focusable (4.1.2)', () => {
  it('reports aria-hidden on a button', () => {
    assert.equal(run('aria-hidden-focusable', '<button aria-hidden>Go</button>').length, 1)
  })

  it('accepts aria-hidden alongside tabIndex={-1}', () => {
    assert.deepEqual(
      run('aria-hidden-focusable', '<button aria-hidden tabIndex={-1}>Go</button>'),
      [],
    )
  })

  it('accepts aria-hidden on a disabled control', () => {
    assert.deepEqual(run('aria-hidden-focusable', '<button aria-hidden disabled>Go</button>'), [])
  })
})

describe('target-size (2.5.8, new in WCAG 2.2)', () => {
  it('reports a 20px square target', () => {
    const found = run('target-size', '<button className="h-5 w-5 rounded-full" />')
    assert.equal(found.length, 1)
    assert.match(found[0]!, /20px/)
  })

  it('accepts exactly 24px', () => {
    assert.deepEqual(run('target-size', '<button className="h-6 w-6" />'), [])
  })

  it('says nothing about a padded button, whose size it cannot compute', () => {
    // Out of scope rather than guessed at: `px-3 py-1.5` plus line-height
    // is a rendered measurement.
    assert.deepEqual(run('target-size', '<button className="px-3 py-1.5 h-5 w-5" />'), [])
  })
})

describe('heading-order (1.3.1)', () => {
  it('reports a skipped level', () => {
    assert.equal(run('heading-order', '<h2>a</h2><h4>b</h4>').length, 1)
  })

  it('accepts a descent back to a shallower level', () => {
    // h2 → h3 → h2 is a sibling section, not a skip.
    assert.deepEqual(run('heading-order', '<h2>a</h2><h3>b</h3><h2>c</h2>'), [])
  })

  it('accepts a fragment that starts at h3', () => {
    // A block does not know what precedes it on the consuming page.
    assert.deepEqual(run('heading-order', '<h3>a</h3><h4>b</h4>'), [])
  })
})

describe('the rule table itself', () => {
  it('gives every rule a criterion, a level and a severity', () => {
    for (const r of RULES) {
      assert.match(r.sc, /^\d\.\d\.\d+$/, `${r.id} has no success criterion`)
      assert.ok(r.level === 'A' || r.level === 'AA', `${r.id} has level ${r.level}`)
      assert.ok(
        r.severity === 'violation' || r.severity === 'advisory',
        `${r.id} has severity ${r.severity}`,
      )
    }
  })

  it('has no duplicate rule ids, which would collide in the report', () => {
    const ids = RULES.map((r) => r.id)
    assert.equal(new Set(ids).size, ids.length)
  })

  it('reports nothing at all on an empty source', () => {
    // Every rule must be silent on nothing. A rule that fires on '' would
    // put a finding on every artifact whose file it could not read.
    for (const r of RULES) {
      assert.deepEqual(r.check(''), [], `${r.id} fired on an empty source`)
    }
  })
})
