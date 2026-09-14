/**
 * A developer's portfolio home — the one an engineer writes for themselves.
 *
 *   terminal   who this is, as a command and its output
 *   proof      where the code has run
 *   work       the projects, with the constraint named
 *   code       something you can actually read
 *   numbers    the practice, in four figures
 *   elsewhere  the accounts that are the real portfolio
 *   hire       the enquiry
 *
 * THE HERO IS A TERMINAL AND THAT IS THE WHOLE POSITIONING. A designer's
 * portfolio opens on an image because the work is visual; an engineer's
 * work is not, and a developer portfolio that opens on a big gradient and
 * the word "Crafting delightful experiences" is indistinguishable from
 * every agency site and tells a hiring manager nothing. `hero-terminal`
 * says the thing the audience already reads fluently: a prompt, a command,
 * and output that is specific enough to be checkable.
 *
 * <CodeShowcase> IS THE SECOND HALF OF THE SAME ARGUMENT. A portfolio that
 * only links to repositories asks the reader to leave and go and judge for
 * themselves; almost nobody does. Putting thirty legible lines on the page
 * is the difference between claiming you write clean code and letting
 * someone decide in ten seconds. The sample is deliberately small and
 * boring — a rate limiter — because a clever sample is read as showing off
 * and a large one is not read at all.
 *
 * <BlogPostGrid> carries the projects rather than a bespoke card grid, for
 * the same reason <PortfolioIndexPage> uses it: a project entry and a post
 * entry have the same fields, and the excerpts are where the work is done.
 * Each one names the constraint — the deadline, the legacy system, the
 * team size — because that is what a reader maps onto their own problem.
 *
 * Anchors are prefixed `dp-`. `#work` and `#projects` are taken elsewhere
 * in the catalog and every preview on /pages shares one DOM, so a bare id
 * here is a duplicate-id failure the moment both pages are on screen.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { HeroTerminal } from '@/lib/blocks/sources/hero-terminal'
import { LogoStrip } from '@/lib/blocks/sources/logo-strip'
import { BlogPostGrid } from '@/lib/blocks/sources/blog-post-grid'
import { CodeShowcase } from '@/lib/blocks/sources/code-showcase'
import { StatsBand } from '@/lib/blocks/sources/stats-band'
import { CommunityBand } from '@/lib/blocks/sources/community-band'
import { CtaSplitPanel } from '@/lib/blocks/sources/cta-split-panel'
import { FooterMinimal } from '@/lib/blocks/sources/footer-minimal'

const OUTPUT = [
  'Aisling Moreau — principal engineer, Lisbon (UTC+1)',
  '',
  'platform      Go · Postgres · Terraform · OpenTelemetry',
  'interface     TypeScript · React · Next.js · WCAG 2.2 AA',
  'currently     Northwind, making checkout 4× faster by deleting things',
  'open to       principal / staff roles, remote or Lisbon',
  '',
  '→ scroll for six projects, or read the code at moreau.dev/src',
]

const FEATURED = {
  slug: 'checkout-latency',
  category: 'Performance',
  title: 'Cutting p95 checkout from 2.4s to 610ms by removing the cache',
  excerpt:
    'The cache was hiding a query plan that went quadratic above 400 line items. Invalidation cost more than the reads saved, so the fix was a delete and one index. Six weeks, no downtime, no rewrite.',
  author: 'Northwind',
  date: 'January 2026',
  readMinutes: 8,
}

const PROJECTS = [
  {
    slug: 'search-migration',
    category: 'Platform',
    title: 'Off a managed search product and onto Postgres, against a contract clock',
    excerpt:
      'The renewal was $310k and the notice period was ninety days. Full-text search in the database we already ran, shipped behind a shadow-read comparison nobody could argue with.',
    author: 'Northwind',
    date: 'September 2025',
    readMinutes: 11,
  },
  {
    slug: 'oncall-rewrite',
    category: 'Reliability',
    title: 'Eleven pages a week down to two, mostly by deleting alerts',
    excerpt:
      'Two thirds of our alerts had never once been acted on. The work was an audit and an argument, not a tool — the tooling never was the problem.',
    author: 'Northwind',
    date: 'May 2025',
    readMinutes: 6,
  },
  {
    slug: 'a11y-procurement',
    category: 'Interface',
    title: 'Passing an accessibility audit first time because it was a contract term',
    excerpt:
      'Sixty clinics, a public-sector buyer and WCAG 2.1 AA written into procurement. What made it pass was testing with a keyboard in CI, not a remediation sprint at the end.',
    author: 'Contoso Health',
    date: 'November 2022',
    readMinutes: 9,
  },
  {
    slug: 'contract-tests',
    category: 'Platform',
    title: 'Ending the release that broke a downstream team every quarter',
    excerpt:
      'Three consumers, one scheduling service, and no shared definition of the payload. Contract tests in both directions, and the class of incident stopped.',
    author: 'Contoso Health',
    date: 'March 2021',
    readMinutes: 5,
  },
  {
    slug: 'billing-integration',
    category: 'Platform',
    title: 'A billing integration that ran unchanged for six years',
    excerpt:
      'Written as the second engineer at a company that survived. Boring on purpose: idempotency keys, a ledger, and no clever reconciliation.',
    author: 'Umbra Labs',
    date: 'August 2017',
    readMinutes: 7,
  },
]

const SAMPLE = [
  {
    name: 'ratelimit.go',
    code: `// Limiter is a fixed-window counter kept deliberately dull.
//
// A sliding log is more accurate and costs a sorted set per key; at our
// traffic the extra accuracy changed nobody's experience and the memory
// bill was real. Windows are aligned to the clock so two processes agree
// without coordinating.
type Limiter struct {
	redis  *redis.Client
	limit  int
	window time.Duration
}

func (l *Limiter) Allow(ctx context.Context, key string) (bool, error) {
	// Bucket in the key, not in a value: expiry then cleans up for us and
	// there is no sweeper to get wrong.
	bucket := time.Now().Truncate(l.window).Unix()
	k := fmt.Sprintf("rl:%s:%d", key, bucket)

	n, err := l.redis.Incr(ctx, k).Result()
	if err != nil {
		// Fail open. A limiter that takes the site down when Redis blips
		// has caused more outages than the abuse it was added to stop.
		return true, err
	}
	if n == 1 {
		l.redis.Expire(ctx, k, l.window)
	}
	return int(n) <= l.limit, nil
}`,
  },
  {
    name: 'ratelimit_test.go',
    code: `func TestAllow_FailsOpenWhenRedisIsDown(t *testing.T) {
	l := &Limiter{redis: brokenClient(t), limit: 1, window: time.Minute}

	ok, err := l.Allow(context.Background(), "user:1")

	// The error is returned so it can be logged and alerted on — and the
	// request is still allowed. Both halves matter; an earlier version
	// swallowed the error and we were blind for a week.
	if !ok {
		t.Fatal("limiter closed on a Redis failure")
	}
	if err == nil {
		t.Fatal("limiter swallowed the Redis failure")
	}
}`,
  },
]

const PRACTICE = [
  { value: '10', label: 'Years shipping', caption: 'Three companies' },
  { value: '4×', label: 'Checkout speedup', caption: 'By deletion' },
  { value: '$310k', label: 'Annual spend removed', caption: 'Search migration' },
  { value: '2', label: 'Pages per week', caption: 'Down from 11' },
]

const ELSEWHERE = [
  {
    label: 'GitHub',
    description:
      'Everything above that can be public is here, including the rate limiter on this page.',
    href: '#',
    meta: '1.2k contributions this year',
  },
  {
    label: 'Writing',
    description:
      'Long-form notes on performance work, usually with the profiler output left in.',
    href: '#dp-writing',
    meta: '24 posts since 2019',
  },
  {
    label: 'Talks',
    description: 'SRECon EMEA and Write the Docs. Slides and transcripts, no video paywall.',
    href: '#',
    meta: '6 talks',
  },
]

export default function DeveloperPortfolioPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple
        brand="moreau.dev"
        links={[
          { label: 'Work', href: '#dp-work' },
          { label: 'Code', href: '#dp-code' },
          { label: 'Writing', href: '#dp-writing' },
          { label: 'CV', href: '#dp-hire' },
        ]}
        activeLabel="Work"
        ctaLabel="Hire me"
        ctaHref="#dp-hire"
      />

      <main>
        <HeroTerminal
          eyebrow="Principal engineer · open to work"
          heading="I make slow systems fast, usually by removing something"
          subheading="Ten years on platform and performance. I am at my best on a team that has outgrown its first architecture and still has to ship every week."
          command="whoami --long"
          output={OUTPUT}
          primaryLabel="See the work"
          primaryHref="#dp-work"
          secondaryLabel="Read the CV"
          secondaryHref="#dp-hire"
        />

        <LogoStrip
          claim="Code I wrote is in production at"
          logos={['Northwind', 'Contoso Health', 'Umbra Labs', 'Vandelay', 'Aperture']}
        />

        <div id="dp-work">
          <BlogPostGrid
            heading="Selected work"
            featured={FEATURED}
            posts={PROJECTS}
            categories={['All', 'Performance', 'Platform', 'Reliability', 'Interface']}
          />
        </div>

        <div id="dp-code">
          <CodeShowcase
            heading="What the code actually looks like"
            subheading="A fixed-window rate limiter and the one test that matters. Thirty lines is enough to tell whether you want to read the other thirty thousand."
            bullets={[
              'Comments explain the decision, not the syntax',
              'Fails open, and the test says so out loud',
              'No dependency added that a standard library could cover',
            ]}
            files={SAMPLE}
          />
        </div>

        <StatsBand stats={PRACTICE} />

        <div id="dp-writing">
          <CommunityBand
            heading="Elsewhere"
            subheading="The accounts are the real portfolio — this page is just the index."
            links={ELSEWHERE}
          />
        </div>

        <div id="dp-hire">
          <CtaSplitPanel
            heading="Looking for a principal or staff role"
            supporting="Remote, or Lisbon. Tell me the system and what has stopped working about it. If I am not the right person I will say so in the first reply."
            primaryLabel="Email me"
            secondaryLabel="Download the CV"
            reassurance={[
              { text: 'I reply to every message within two working days' },
              { text: 'No take-home tests — happy to pair on your real code' },
              { text: 'Available from March' },
            ]}
          />
        </div>
      </main>

      <FooterMinimal
        brand="moreau.dev"
        links={[
          { label: 'Work', href: '#dp-work' },
          { label: 'Writing', href: '#dp-writing' },
          { label: 'CV', href: '#dp-hire' },
        ]}
        socials={[
          { label: 'GitHub', href: '#', icon: 'github' },
          { label: 'Twitter', href: '#', icon: 'twitter' },
        ]}
      />
    </div>
  )
}
