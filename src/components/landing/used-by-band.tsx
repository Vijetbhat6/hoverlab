/**
 * <UsedByBand> — the logo row, when there is one.
 *
 * WHY IT RENDERS NOTHING TODAY
 *
 * `lib/showcase.ts` ships `USED_BY` empty, and this returns null rather than
 * rendering a heading over a gap or a row of greyed-out placeholder marks.
 * That is the same decision `community-band.tsx` made about social links and
 * `/support` made about channels: never render a door that opens onto
 * nothing.
 *
 * It matters more here than in either of those. A used-by row is the single
 * most-faked element on a developer-tools landing page, and the fake is
 * unusually cheap — six recognisable logos at 40% opacity, no claim made in
 * words, nothing a screenshot could disprove. This site has already shipped
 * invented social proof once (see `scripts/check-claims.mts`), and the
 * version of that mistake this component would make is the one nobody
 * notices until a named company does.
 *
 * WHY IT EXISTS AT ALL WHILE IT RENDERS NOTHING
 *
 * So that the first real logo is one array entry rather than a design
 * decision taken under deadline, and so that the permission field is
 * something you have to fill in rather than something you have to think of.
 *
 * `check-claims.mts` requires every module under components/landing to be
 * imported from outside it — an unrendered marketing component is copy
 * nobody reviews. This one is imported by the landing page and simply
 * returns null, which satisfies the rule honestly: it is reachable, it is
 * reviewed, and it has nothing to say yet.
 *
 * WHY NAMES RATHER THAN IMAGES BY DEFAULT
 *
 * `UsedByLogo.logo` is nullable and null is the expected case. Hotlinking a
 * company's mark from their CDN breaks when they redeploy and is a request
 * they never agreed to serve; committing a copy means holding somebody
 * else's trademark in this repository. A wordmark set in our own type is
 * neither, reads fine, and is a smaller thing to have to ask permission for.
 */

import { Reveal } from '@/components/reveal'
import { USED_BY } from '@/lib/showcase'

export function UsedByBand() {
  if (USED_BY.length === 0) return null

  return (
    <Reveal>
      <section aria-labelledby="used-by-heading" className="py-10">
        <h2
          id="used-by-heading"
          className="text-center text-xs font-medium uppercase tracking-wide text-muted-foreground"
        >
          Shipping with it
        </h2>

        <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-5">
          {USED_BY.map((company) => (
            <li key={company.href}>
              <a
                href={company.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center opacity-70 transition-opacity hover:opacity-100"
              >
                {company.logo ? (
                  // Plain <img>: a handful of third-party marks at unknown
                  // intrinsic sizes, where next/image would demand per-entry
                  // dimensions from whoever adds one and optimise nothing
                  // worth the friction.
                  <img
                    src={company.logo}
                    alt={company.name}
                    loading="lazy"
                    className="h-6 w-auto max-w-full"
                  />
                ) : (
                  <span className="text-base font-semibold tracking-tight">
                    {company.name}
                  </span>
                )}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </Reveal>
  )
}
