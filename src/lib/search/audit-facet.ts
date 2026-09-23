/**
 * Which artifacts passed the static accessibility audit — server only.
 *
 * Reads `generated-a11y-report.json` (~270 KB) directly and reduces it to a
 * set of `level:id` keys. It is imported by `/browse`, a server component;
 * nothing that ships to a browser may import it, which is why it is not part
 * of `./facets`.
 *
 * "Passed" is exactly "the report lists no findings for it". It is evidence
 * of a process, not a conformance claim: the report's `publishable` flag is
 * false and stays false until a lawyer has read the claim wording (see
 * `@/lib/a11y-evidence`), so any copy that surfaces this must say "static
 * audit" and never "WCAG compliant".
 */

import REPORT from '@/lib/generated-a11y-report.json'
import { auditKey } from './facets'

interface Report {
  artifacts: Array<{ id: string; kind: string; findings: unknown[] }>
}

let keys: ReadonlySet<string> | null = null

export function auditedKeys(): ReadonlySet<string> {
  keys ??= new Set(
    (REPORT as Report).artifacts
      .filter((a) => a.findings.length === 0)
      .map((a) => auditKey(a.kind, a.id)),
  )
  return keys
}
