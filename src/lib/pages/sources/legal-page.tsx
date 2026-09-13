/**
 * The legal page — terms, privacy, DPA, cookies, one frame.
 *
 *   docs        the document, in the three-column docs frame
 *   compliance  the entities, registrations and addresses
 *
 * The docs frame rather than a bare `<article>`, and that is the whole design
 * decision. Terms of service are the longest document on most sites and the
 * only one people arrive at looking for a *specific clause* — the sub-processor
 * list, the notice period, the governing law. A wall of text with no
 * navigation makes that a Ctrl-F expedition; the docs layout gives a sidebar
 * and anchored headings, which is what turns a legal page into something
 * someone can actually be pointed at.
 *
 * In a real project this is one catch-all route: `/legal/[slug]` with terms,
 * privacy, dpa, subprocessors and cookies as the slugs. The frame does not
 * change between them, which is the argument for one page rather than five.
 *
 * `FooterCompliance` is here rather than the usual footer because this is the
 * page where the registered entity, company number and registered address
 * are legally expected to be findable. It defaults to three regions of a
 * fictional multinational — replace them, and delete the ones you do not
 * have, because listing an entity you do not operate is its own problem.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { DocsLayout } from '@/lib/blocks/sources/docs-layout'
import { FooterCompliance } from '@/lib/blocks/sources/footer-compliance'

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple brand="Acme" activeLabel="Legal" ctaLabel="Contact" ctaHref="#terms" />

      <main>
        <div id="terms">
          <DocsLayout
            anchorPrefix="legal-"
            title="Terms of Service"
            standfirst="Last updated 6 January 2026. Changes that reduce your rights are announced 30 days before they take effect, by email, to the billing contact on the account."
          />
        </div>
      </main>

      <FooterCompliance brand="Acme" />
    </div>
  )
}
