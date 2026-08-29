import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

/**
 * The operator details are read from the environment at module scope, so a
 * test has to set the variables and then import — and import a *different*
 * specifier each time, because ESM caches by resolved URL and the second
 * import of the same path would hand back the first evaluation.
 *
 * The query string is the cache-buster. It is ignored by the loader and by
 * the module itself; it exists only to make each URL unique.
 */
let evaluation = 0
async function loadLegal(env: Record<string, string | undefined>) {
  const keys = [
    'OPERATOR_LEGAL_NAME',
    'OPERATOR_ADDRESS',
    'OPERATOR_JURISDICTION',
    'OPERATOR_CONTACT_EMAIL',
  ] as const

  const restore = keys.map((k) => [k, process.env[k]] as const)
  for (const k of keys) delete process.env[k]
  for (const [k, v] of Object.entries(env)) {
    if (v !== undefined) process.env[k] = v
  }

  try {
    return (await import(`./legal.ts?evaluation=${evaluation++}`)) as typeof import('./legal')
  } finally {
    for (const [k, v] of restore) {
      if (v === undefined) delete process.env[k]
      else process.env[k] = v
    }
  }
}

describe('OPERATOR', () => {
  test('unset variables leave a detectable placeholder', async () => {
    const { OPERATOR, legalDetailsPending } = await loadLegal({})

    assert.equal(legalDetailsPending(), true)
    assert.match(OPERATOR.legalName, /TO BE SET/)
    assert.match(OPERATOR.address, /TO BE SET/)
    assert.match(OPERATOR.jurisdiction, /TO BE SET/)
    assert.match(OPERATOR.contactEmail, /TO BE SET/)
  })

  test('the trading name is never pending — it does not vary by operator', async () => {
    const { OPERATOR } = await loadLegal({})
    assert.equal(OPERATOR.tradingName, 'Hoverlab')
  })

  test('a full set of values clears the pending flag', async () => {
    const { OPERATOR, legalDetailsPending } = await loadLegal({
      OPERATOR_LEGAL_NAME: 'Hoverlab Technologies Pvt Ltd',
      OPERATOR_ADDRESS: '12 MG Road, Bengaluru 560001',
      OPERATOR_JURISDICTION: 'India',
      OPERATOR_CONTACT_EMAIL: 'hello@hoverlab.dev',
    })

    assert.equal(legalDetailsPending(), false)
    assert.equal(OPERATOR.legalName, 'Hoverlab Technologies Pvt Ltd')
    assert.equal(OPERATOR.jurisdiction, 'India')
  })

  test('one missing value is still pending — a partial set is not a policy', async () => {
    const { legalDetailsPending } = await loadLegal({
      OPERATOR_LEGAL_NAME: 'Hoverlab Technologies Pvt Ltd',
      OPERATOR_ADDRESS: '12 MG Road, Bengaluru 560001',
      OPERATOR_JURISDICTION: 'India',
      // contact email left unset
    })

    assert.equal(legalDetailsPending(), true)
  })

  /**
   * The trap this whole helper exists for. A dashboard field cleared with the
   * space bar leaves " " behind, which passes every presence check and would
   * render a Terms page whose operator name is blank — undetectable by
   * `legalDetailsPending()`, and therefore by check-deploy.
   */
  test('whitespace-only counts as unset, not as a value', async () => {
    const { OPERATOR, legalDetailsPending } = await loadLegal({
      OPERATOR_LEGAL_NAME: '   ',
      OPERATOR_ADDRESS: '12 MG Road, Bengaluru 560001',
      OPERATOR_JURISDICTION: 'India',
      OPERATOR_CONTACT_EMAIL: 'hello@hoverlab.dev',
    })

    assert.equal(legalDetailsPending(), true)
    assert.match(OPERATOR.legalName, /TO BE SET/)
  })

  test('surrounding whitespace is trimmed off a real value', async () => {
    const { OPERATOR } = await loadLegal({
      OPERATOR_CONTACT_EMAIL: '  hello@hoverlab.dev\n',
    })

    assert.equal(OPERATOR.contactEmail, 'hello@hoverlab.dev')
  })
})
