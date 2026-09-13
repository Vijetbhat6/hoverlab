/**
 * Coming soon, take 02 — the referral queue.
 *
 *   hero        what it is, and that the queue is ordered
 *   proof       how many are ahead of you, stated plainly
 *   form        join, then move up by inviting people
 *   what        four capabilities, so the invite has something to say
 *
 * Take 01 is the shortest page in the catalogue and refuses a countdown on
 * the grounds that a clock at zero is worse than no clock. It is the right
 * page when the launch date is real and near, and when the list exists only
 * to be emailed once.
 *
 * This take is for the list that is doing work before launch. A referral
 * queue turns a waitlist from a mailing list into a distribution channel:
 * position is visible, and it moves when you invite someone. That is a
 * genuinely different product decision, not a styling one, and it is the
 * reason the page needs a stats band and four capability tiles that take 01
 * can do without — nobody forwards an invitation to a product they cannot
 * describe in one sentence.
 *
 * The honesty cost is specific and worth stating, because this mechanic is
 * usually deployed dishonestly: a referral queue where position does not
 * really change is a dark pattern with a progress bar. If you ship this
 * layout, the number has to be real and the people at the top have to
 * actually get in first. The copy below commits to both, including the part
 * where roughly a third of the queue will not be admitted before general
 * availability.
 *
 * No navbar, like take 01 — there is nowhere else to go. The difference is
 * that this page expects to be shared, so it carries enough to survive
 * arriving cold from someone else's message.
 */

import * as React from 'react'
import { Gauge, Layers, ShieldCheck, Workflow } from 'lucide-react'
import { HeroCentered } from '@/lib/blocks/sources/hero-centered'
import { StatsBand } from '@/lib/blocks/sources/stats-band'
import { ReferralWaitlistForm } from '@/lib/blocks/sources/referral-waitlist-form'
import { FeatureIconGrid } from '@/lib/blocks/sources/feature-icon-grid'
import { FooterMinimal } from '@/lib/blocks/sources/footer-minimal'

const QUEUE = [
  { value: '2,847', label: 'In the queue', caption: 'As of this morning' },
  { value: '40', label: 'Admitted each week', caption: 'Capped by support capacity, not demand' },
  { value: '3', label: 'Places you move per invite', caption: 'Capped at 30 places total' },
  { value: '~Q3', label: 'General availability', caption: 'When the queue stops mattering' },
]

export default function ComingSoonPage02() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main>
        <HeroCentered
          announcement="2,847 in the queue · 40 admitted weekly"
          announcementHref="#coming-soon-page-02-join"
          heading="Reconciliation that a finance team can actually maintain"
          subheading="Not open yet. The queue is ordered, it moves when you invite someone, and the position we show you is the real one — including the part where roughly a third of today's queue will not get in before general availability."
          primaryLabel="Join the queue"
          primaryHref="#coming-soon-page-02-join"
          secondaryLabel="See what it does"
          secondaryHref="#coming-soon-page-02-what"
        />

        <StatsBand stats={QUEUE} />

        {/*
          The mechanic only works if the number is real. A referral queue
          whose position does not move is a dark pattern with a progress
          bar — so the cap, the weekly rate and the admission ceiling are all
          on the page rather than in the confirmation email.
        */}
        <div id="coming-soon-page-02-join">
          <ReferralWaitlistForm
            heading="Join, and move up by bringing people"
            intro="Three places per person who joins with your link, capped at thirty. Forty people are admitted every Tuesday, limited by how many we can support properly rather than by how many we could charge."
            submitLabel="Join the queue"
          />
        </div>

        <div id="coming-soon-page-02-what">
          <FeatureIconGrid
            heading="What you would be waiting for"
            subheading="Four sentences, so that an invitation forwarded to a colleague arrives with something to read. This is the whole product today, not a subset of a longer page."
            columns={2}
            features={[
              {
                icon: Workflow,
                title: 'Match rules your own team can write',
                body: 'A rule editor rather than a support ticket. The people who know why a supplier invoices under three different trading names are the people who should be encoding that, and they do not write SQL.',
              },
              {
                icon: Layers,
                title: 'Up to twelve entities, three currencies',
                body: 'Consolidated without a workbook. Inter-company elimination is the one part that is still manual, and it will still be manual at launch.',
              },
              {
                icon: Gauge,
                title: 'Around 90% auto-matched by week twelve',
                body: 'Week six is usually in the sixties, which is below the spreadsheet you are replacing. That dip is normal, it is the hardest part, and we will warn you about it rather than let you discover it.',
              },
              {
                icon: ShieldCheck,
                title: 'Exports that work on a cancelled account',
                body: 'Ninety days, self-serve, including the match history. Built early and on purpose, because we have been on the other end of a vendor who did not.',
              },
            ]}
          />
        </div>
      </main>

      <FooterMinimal brand="Acme" />
    </div>
  )
}
