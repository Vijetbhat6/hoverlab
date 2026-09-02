/**
 * A developer-tool landing page, assembled from blocks.
 *
 * The audience is the reason this is not the SaaS running order. A
 * developer evaluating a tool does not read down the page — they scan for
 * the install command, then for the code, and they decide there. Everything
 * else on this page exists to be skipped by the people who have already
 * made up their mind:
 *
 *   navbar          docs first, because that is what they came for
 *   hero            the install command, copyable, above everything else
 *   logo grid       who runs it in production
 *   code            the actual API, in two files, before any prose
 *   features        what the tool does, once they have seen that it is real
 *   integrations    "does it work with my stack" — the second question, always
 *   pricing         a usage calculator, not tiers: this is metered, so show it
 *   faq             licensing, lock-in, self-hosting — the objections that
 *                   are specific to infrastructure rather than to software
 *   footer          status and version, which is the footer devs actually use
 *
 * WHY THE CODE COMES BEFORE THE FEATURES. Every other page in this catalog
 * argues before it demonstrates, because most buyers need the frame first.
 * This audience is the exception: a feature list read before any code is
 * marketing, and the same list read after it is documentation. Moving one
 * section up changes which one it is.
 *
 * WHY A CALCULATOR AND NOT TIERS. Three-column pricing answers "which plan
 * am I" — the wrong question for a metered product, where the real one is
 * "what will this cost me at my volume". A calculator answers it without a
 * sales call, which is the entire reason this audience prefers it.
 *
 * Every section takes props, so this file is a running order rather than a
 * wall of copy — swap the content without touching the layout.
 */

import * as React from 'react'

import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { HeroTerminal } from '@/lib/blocks/sources/hero-terminal'
import { LogoGrid } from '@/lib/blocks/sources/logo-grid'
import { CodeShowcase } from '@/lib/blocks/sources/code-showcase'
import { FeatureRows } from '@/lib/blocks/sources/feature-rows'
import { IntegrationGrid } from '@/lib/blocks/sources/integration-grid'
import { PricingUsageCalculator } from '@/lib/blocks/sources/pricing-usage-calculator'
import { FaqGrid } from '@/lib/blocks/sources/faq-grid'
import { FooterStatusLocale } from '@/lib/blocks/sources/footer-status-locale'

export default function DeveloperToolLandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple
        brand="Relay"
        links={[
          { label: 'Docs', href: '/docs' },
          { label: 'Pricing', href: '#usage' },
          { label: 'Changelog', href: '/changelog' },
        ]}
        activeLabel="Docs"
        signInLabel="Sign in"
        signInHref="/login"
        ctaLabel="Get an API key"
        ctaHref="#usage"
      />

      <main>
        <HeroTerminal
          eyebrow="v4.2 — no agent, no sidecar"
          heading="Webhooks that arrive, or tell you why not"
          subheading="Relay takes delivery, retries, signature verification and the dead-letter queue off your critical path. One endpoint in, one verified payload out."
          command="npm i @relay/sdk"
          primaryLabel="Read the docs"
          primaryHref="/docs"
          secondaryLabel="See pricing"
          secondaryHref="#usage"
          output={[
            'added 1 package in 0.8s',
            '',
            '✓ endpoint created  ep_9fK2…',
            '✓ signing secret written to .env.local',
            'listening — forwarding to http://localhost:3000/api/hooks',
          ]}
        />

        <LogoGrid
          caption="Delivering for"
          logos={['Northwind', 'Contoso', 'Initech', 'Globex', 'Lumon', 'Vandelay']}
          footnote="4.1 billion events delivered last month, at 99.99% first-attempt success."
        />

        {/* Before any prose about what the tool does. See the header note. */}
        <CodeShowcase
          heading="The whole integration"
          subheading="Two files. There is no third one where the complexity was hiding."
          bullets={[
            'Signature verification is one call, and it throws rather than returning false',
            'Retries, backoff and the dead-letter queue are server-side — nothing to schedule',
            'Typed payloads generated from your own event schema',
          ]}
          files={[
            {
              name: 'app/api/hooks/route.ts',
              code: `import { verify } from '@relay/sdk'

export async function POST(req: Request) {
  // Throws on a bad signature or a replayed timestamp, so there is
  // no boolean to forget to check.
  const event = await verify(req, process.env.RELAY_SECRET!)

  switch (event.type) {
    case 'invoice.paid':
      await fulfil(event.data.invoiceId)
      break
    case 'invoice.failed':
      await notify(event.data.customerId)
      break
  }

  // 200 means "stored". Relay retries anything else for 72 hours.
  return new Response(null, { status: 200 })
}`,
            },
            {
              name: 'relay.config.ts',
              code: `import { defineConfig } from '@relay/sdk'

export default defineConfig({
  endpoint: '/api/hooks',

  // Exponential, capped, then parked in the dead-letter queue.
  // Relay owns the timer; your process can restart mid-retry.
  retries: { attempts: 12, backoff: 'exponential', maxDelay: '6h' },

  // Events older than this are rejected rather than replayed.
  tolerance: '5m',
})`,
            },
          ]}
        />

        <FeatureRows
          heading="What you stop maintaining"
          subheading="Each of these is a thing teams build in-house, ship, and then own forever."
          rows={[
            {
              eyebrow: 'Delivery',
              title: 'The retry loop you were going to write on Friday',
              body: 'Twelve attempts over 72 hours with exponential backoff, resumed across your deploys rather than lost with the process that scheduled them. Anything that never lands goes to a dead-letter queue you can replay from a dashboard or a single API call.',
              bullets: [
                'Retries survive your restarts',
                'Replay one event or ten thousand',
                'Per-endpoint circuit breaking',
              ],
            },
            {
              eyebrow: 'Verification',
              title: 'Signatures, timestamps and replay windows, once',
              body: 'Constant-time comparison, a configurable tolerance window, and rejection of anything reused. The failure mode of hand-rolled verification is not an outage — it is silently accepting forged events for a year, which is why this is the section to read twice.',
              bullets: ['Constant-time compare', 'Replay rejection by default'],
            },
            {
              eyebrow: 'Visibility',
              title: 'Every attempt, with the response body attached',
              body: 'The request, the response, the status code and the latency, for every attempt of every event, kept for 30 days. When a customer says the webhook never arrived, this is the difference between an answer and an afternoon.',
              bullets: ['Full request and response bodies', '30-day retention', 'Filter by endpoint, type or status'],
            },
          ]}
        />

        <IntegrationGrid
          heading="Works with what you already run"
          subheading="Direct integrations, not a webhook you have to adapt at both ends."
          integrations={[
            { name: 'Stripe', description: 'Verified passthrough of every Stripe event type.', status: 'live', category: 'Payments' },
            { name: 'GitHub', description: 'Repository, org and app events, with installation scoping.', status: 'live', category: 'Source' },
            { name: 'Shopify', description: 'Order, fulfilment and inventory topics.', status: 'live', category: 'Commerce' },
            { name: 'Slack', description: 'Post failures into a channel with the payload attached.', status: 'live', category: 'Alerting' },
            { name: 'AWS EventBridge', description: 'Forward into a bus with the original signature preserved.', status: 'beta', category: 'Infrastructure' },
            { name: 'Kafka', description: 'Produce to a topic with at-least-once semantics.', status: 'planned', category: 'Infrastructure' },
          ]}
        />

        <div id="usage">
          <PricingUsageCalculator
            heading="What it costs at your volume"
            subheading="Move the slider. There is no plan to pick, and the number below is the number on the invoice."
            unitLabel="events"
            scale={[100_000, 500_000, 2_000_000, 10_000_000, 50_000_000]}
            // No `baseCents`: the block hides the platform-fee row entirely
            // at zero, which is the honest rendering for usage-only pricing.
            tiers={[
              { upTo: 1_000_000, pricePerUnitCents: 0.008 },
              { upTo: 10_000_000, pricePerUnitCents: 0.005 },
              { upTo: Infinity, pricePerUnitCents: 0.003 },
            ]}
            ctaLabel="Get an API key"
            ctaHref="/login"
          />
        </div>

        <FaqGrid
          heading="The awkward questions"
          subheading="Infrastructure buyers ask about exits before they ask about features. Fair enough."
          items={[
            {
              question: 'What happens if Relay goes down?',
              answer:
                'Your senders keep retrying into us and we keep the backlog; nothing is dropped for the length of your retry window. If we are down longer than that, the failover endpoint documented in the SDK forwards raw to your origin unverified, and you fall back to your own handling.',
            },
            {
              question: 'Can I self-host it?',
              answer:
                'Yes, on the enterprise plan, as a container with a Postgres and a Redis. It is the same image we run. The dashboard and the replay API come with it; the only thing that does not is our on-call.',
            },
            {
              question: 'How do I get my data out?',
              answer:
                'A single export endpoint returns every event, attempt and response body as newline-delimited JSON, and it is available on every plan including the free one. No ticket, no notice period, no export fee.',
            },
            {
              question: 'Is the SDK required?',
              answer:
                'No. It is 40 lines around a documented HTTP contract and an HMAC. The verification algorithm is written out in the docs so you can implement it in a language we do not ship for — several customers have.',
            },
            {
              question: 'What counts as an event?',
              answer:
                'One inbound payload, regardless of how many times we retry it or how many endpoints you fan it out to. Retries are our problem, so charging you for them would be charging you for our failures.',
            },
            {
              question: 'Do you have an SLA?',
              answer:
                '99.99% on ingest, credited automatically against the next invoice rather than on request. The status page below is the same one our own alerting reads, and its history is not editable after the fact.',
            },
          ]}
        />
      </main>

      <FooterStatusLocale
        productName="Relay"
        status="operational"
        statusHref="/status"
        version="v4.2.1"
        links={[
          { label: 'Docs', href: '/docs' },
          { label: 'Changelog', href: '/changelog' },
          { label: 'SLA', href: '#' },
          { label: 'Security', href: '#' },
          { label: 'Privacy', href: '#' },
        ]}
      />
    </div>
  )
}
