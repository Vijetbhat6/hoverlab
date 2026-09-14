import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, Terminal } from 'lucide-react'

import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { JsonLd } from '@/components/json-ld'
import { CodeBlock } from '@/components/code-block'
import {
  FRAMEWORK_STORIES,
  SAMPLE_BLOCK_ID,
  SAMPLE_EFFECT_ID,
  getFrameworkStory,
  type FrameworkStory,
} from '@/lib/frameworks'
import { exportEffect } from '@/lib/export'
import { getBundledEffect } from '@/lib/bundled-effects'
import { blockMarkup } from '@/lib/blocks/block-markup'
import { getBlock } from '@/lib/blocks/blocks'
import { wrapMarkup } from '@/lib/blocks/markup-frameworks'
import { TOTAL_COUNT } from '@/lib/catalog-stats'
import { BLOCK_COUNT } from '@/lib/blocks/block-index'
import { PAGE_COUNT } from '@/lib/pages/page-index'
import { breadcrumbLd } from '@/lib/structured-data'
import { absoluteUrl } from '@/lib/site'

/**
 * /frameworks/[slug] — one framework, addressed in its own toolchain.
 *
 * ── WHY THIS EXISTS WHEN /frameworks ALREADY DOES ───────────────────────
 *
 * The hub is a support matrix, and a support matrix is a thing you read
 * *after* you have decided we might be for you. It cannot do the job this
 * does, for two reasons.
 *
 * The first is competitive. React Bits did not add a Vue column — it
 * shipped Vue Bits and Svelte Bits as separate sites, with their own stars
 * and their own URLs. Shadcnblocks ships Vue Blocks and an Astro variant.
 * Preline publishes a setup guide per framework, Laravel and Rails
 * included. Every one of those is the same underlying claim we have been
 * making in a table cell, packaged as something a Vue developer recognises
 * as being aimed at them. Our version of that lead is stronger than
 * theirs — the catalog is CSS, so the conversion is real rather than a
 * rewritten library — and it has never been packaged at all.
 *
 * The second is that "vue tailwind components", "svelte ui components" and
 * "astro components" are three different searches. One page with a matrix
 * on it ranks for none of them well; seven pages with the framework in the
 * heading, the toolchain in the body and the output in a code block each
 * answer one.
 *
 * ── WHY THE CODE ON IT IS GENERATED, NOT WRITTEN ────────────────────────
 *
 * Both samples are produced at build time by the same functions the CLI and
 * `/api/v1` call: `exportEffect` for the effect, `wrapMarkup` over
 * `blockMarkup` for the block. Nothing on this page is a hand-written
 * snippet of what the output is supposed to look like.
 *
 * That is deliberate and it is the whole defence. A marketing page claiming
 * "effects convert to a real Vue SFC" can drift from the converter silently
 * for months. A page that *prints the converter's output* cannot: if the
 * Vue builder breaks, this page breaks, and it breaks in the build rather
 * than in a customer's editor. The per-framework caveats are the
 * generators' own `notes` for the same reason.
 *
 * ── WHY EACH PAGE SPLITS THE TWO RUNGS ──────────────────────────────────
 *
 * Because they are honestly different, and this is the page where the
 * difference gets discovered. An effect converts — that is a translation,
 * and it is tested. A block gives you its rendered markup wrapped as a file
 * the framework compiles, which is a real presentational component and not
 * a port of the React state. `lib/blocks/markup-frameworks.ts` argues that
 * out; the sample block here is an interactive one *on purpose*, so the
 * reader sees the caveat at its strongest rather than at its most
 * flattering. See `SAMPLE_BLOCK_ID`.
 */

export const dynamicParams = false

export function generateStaticParams() {
  return FRAMEWORK_STORIES.map((framework) => ({ slug: framework.id }))
}

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const story = getFrameworkStory(slug)
  if (!story) return { title: 'Framework not found — Hoverlab' }

  const title = `${story.headline} — Hoverlab`

  return {
    title,
    description: story.summary,
    keywords: [...story.keywords],
    alternates: { canonical: `/frameworks/${story.id}` },
    openGraph: {
      url: absoluteUrl(`/frameworks/${story.id}`),
      title,
      description: story.summary,
      type: 'article',
      siteName: 'Hoverlab',
    },
    twitter: { card: 'summary_large_image', title, description: story.summary },
  }
}

/**
 * The effect sample, converted.
 *
 * Throws rather than degrading when the sample id goes missing. A silent
 * fallback here would ship seven pages that quietly stopped demonstrating
 * anything, which is worse than a red build — and the id is a constant in
 * `lib/frameworks.ts`, so the only way this fires is a rename.
 */
function effectSample(story: FrameworkStory) {
  if (!story.exportTarget) return null

  const effect = getBundledEffect(SAMPLE_EFFECT_ID)
  if (!effect) {
    throw new Error(
      `/frameworks/${story.id}: no bundled effect "${SAMPLE_EFFECT_ID}" — update SAMPLE_EFFECT_ID in lib/frameworks.ts.`,
    )
  }

  const exported = exportEffect(
    {
      id: effect.id,
      name: effect.name,
      description: effect.description,
      category: effect.category,
      html: effect.html,
      css: effect.css,
    },
    story.exportTarget,
  )

  return { effect, exported }
}

/** The block sample, wrapped as a file this framework compiles. */
function blockSample(story: FrameworkStory) {
  if (!story.markupTarget) return null

  const block = getBlock(SAMPLE_BLOCK_ID)
  const markup = blockMarkup(SAMPLE_BLOCK_ID)
  if (!block || !markup) {
    throw new Error(
      `/frameworks/${story.id}: no rendered markup for block "${SAMPLE_BLOCK_ID}" — update SAMPLE_BLOCK_ID in lib/frameworks.ts, or run build:artifacts.`,
    )
  }

  // Derived exactly as the block detail panel and the API derive it, rather
  // than stored: a block becomes interactive the moment somebody adds a
  // handler to it, and a hand-kept flag would not notice.
  const isInteractive = block.files.some((f) => f.source.includes("'use client'"))

  return {
    block,
    isInteractive,
    wrapped: wrapMarkup(markup, {
      framework: story.markupTarget,
      id: block.id,
      name: block.name,
      isInteractive,
    }),
  }
}

export default async function FrameworkPage({ params }: PageProps) {
  const { slug } = await params
  const story = getFrameworkStory(slug)
  if (!story) notFound()

  const effects = effectSample(story)
  const blocks = blockSample(story)

  /*
   * The install line, with no flag.
   *
   * This is the claim `detectedFrom` exists to back: `hoverlab add` reads
   * your package.json and picks the target, so the command on a Vue page is
   * the same command as on a Svelte page and still does the right thing.
   * The explicit flag is shown underneath for anyone whose project is a
   * monorepo where detection has nothing to go on.
   */
  const installCommand = `npx hoverlab add ${SAMPLE_EFFECT_ID}`
  const explicitCommand = story.exportTarget
    ? `npx hoverlab add ${SAMPLE_EFFECT_ID} --framework ${story.exportTarget}`
    : null
  const markupCommand = story.markupTarget
    ? `curl "${absoluteUrl(`/api/v1/blocks/${SAMPLE_BLOCK_ID}`)}?format=html&framework=${story.markupTarget}"`
    : null

  return (
    <div className="flex min-h-dvh flex-col">
      <JsonLd
        data={breadcrumbLd([
          { name: 'Frameworks', path: '/frameworks' },
          { name: story.label, path: `/frameworks/${story.id}` },
        ])}
      />
      <SiteHeader />

      <main id="main" className="flex-1">
        <section className="mx-auto w-full max-w-3xl px-4 pb-10 pt-12 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
            <Link
              href="/frameworks"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              All frameworks
            </Link>
          </nav>

          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
            {story.headline}
          </h1>
          <p className="mt-5 text-body text-muted-foreground">{story.summary}</p>

          {/*
            The toolchain, as a list of names rather than prose.

            It is scanned, not read. Somebody who has Nuxt open is looking
            for the word "Nuxt", and they will find it here in under a
            second or leave.
          */}
          <ul className="mt-6 flex flex-wrap gap-2" aria-label="Works with">
            {story.ecosystem.map((tool) => (
              <li
                key={tool}
                className="rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground"
              >
                {tool}
              </li>
            ))}
          </ul>
        </section>

        {effects ? (
          <section
            className="mx-auto w-full max-w-3xl px-4 pb-14 sm:px-6 lg:px-8"
            aria-labelledby="effect-heading"
          >
            <h2 id="effect-heading" className="text-2xl font-bold tracking-tight">
              An effect, in {story.label}
            </h2>
            <p className="mt-3 text-body text-muted-foreground">
              This is the{' '}
              <Link
                href={`/effect/${effects.effect.id}`}
                className="font-medium text-primary hover:underline"
              >
                {effects.effect.name}
              </Link>{' '}
              effect, run through the converter when this page was built —
              not a sample of what the output is meant to look like. All{' '}
              {TOTAL_COUNT.toLocaleString('en-US')} effects convert the same
              way, because every one of them is markup plus a stylesheet.
            </p>

            <div className="mt-6">
              {effects.exported.files.map((file) => (
                <div key={file.path} className="mt-4 first:mt-0">
                  <CodeBlock
                    code={file.code}
                    language={file.language}
                    filename={file.path}
                    effect={{
                      id: effects.effect.id,
                      name: effects.effect.name,
                      category: effects.effect.category,
                    }}
                    copyFormat={story.exportTarget ?? undefined}
                    surface="detail"
                    hideReactButton
                    maxHeightClass="max-h-[420px]"
                  />
                </div>
              ))}
            </div>

            {/*
              The generator's own notes, not a re-description of them.

              `buildVue` knows that Vue rewrites @keyframes inside a scoped
              block and `buildSvelte` knows the compiler prunes selectors it
              cannot match. Those are the things that would otherwise be
              discovered as bugs, and they are worth more to a reader than
              any sentence written here would be.
            */}
            {effects.exported.notes.length > 0 ? (
              <div className="mt-6 rounded-lg border border-border/60 bg-muted/40 p-4">
                <h3 className="text-sm font-semibold">
                  What to know before you paste it
                </h3>
                <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                  {effects.exported.notes.map((note) => (
                    <li key={note} className="flex gap-2">
                      <span aria-hidden className="select-none">
                        &middot;
                      </span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        ) : (
          <section
            className="mx-auto w-full max-w-3xl px-4 pb-14 sm:px-6 lg:px-8"
            aria-labelledby="no-effect-heading"
          >
            <h2 id="no-effect-heading" className="text-2xl font-bold tracking-tight">
              Effects: not in {story.label}
            </h2>
            <p className="mt-3 text-body text-muted-foreground">
              There is no {story.label} converter for the effect tier, so
              this page does not offer one. Take the{' '}
              <Link
                href="/frameworks/html"
                className="font-medium text-primary hover:underline"
              >
                HTML and CSS
              </Link>{' '}
              target instead and keep its <code>&lt;style&gt;</code> block —
              {story.label} scopes component styles for you, so the result is
              the same component you would have written.
            </p>
          </section>
        )}

        {blocks ? (
          <section
            className="mx-auto w-full max-w-3xl px-4 pb-14 sm:px-6 lg:px-8"
            aria-labelledby="block-heading"
          >
            <h2 id="block-heading" className="text-2xl font-bold tracking-tight">
              A block, as a {story.label} file
            </h2>
            <p className="mt-3 text-body text-muted-foreground">
              This is where the honest answer is different, so here it is
              with the words that make it different.{' '}
              {(BLOCK_COUNT + PAGE_COUNT).toLocaleString('en-US')} blocks and
              pages are React components with state and handlers. What you
              get in {story.label} is the block{' '}
              <strong className="font-semibold text-foreground">
                rendered to markup
              </strong>{' '}
              and wrapped as a file your framework compiles — a real
              presentational component, carrying the layout, the Tailwind
              classes and the accessible structure, and not a port of the
              React logic.
            </p>
            <p className="mt-3 text-body text-muted-foreground">
              The sample below is{' '}
              <Link
                href={`/block/${blocks.block.id}`}
                className="font-medium text-primary hover:underline"
              >
                {blocks.block.name}
              </Link>
              , and it is{' '}
              {blocks.isInteractive ? 'an interactive one, chosen' : 'chosen'}{' '}
              so you can see exactly what is missing rather than a case where
              nothing is. The caveat is printed at the top of the file
              itself, because the file is what gets read six months later.
            </p>

            <div className="mt-6">
              <CodeBlock
                code={blocks.wrapped.code}
                language={blocks.wrapped.language}
                filename={blocks.wrapped.filename}
                surface="detail"
                hideReactButton
                maxHeightClass="max-h-[420px]"
              />
            </div>
          </section>
        ) : (
          <section
            className="mx-auto w-full max-w-3xl px-4 pb-14 sm:px-6 lg:px-8"
            aria-labelledby="block-alt-heading"
          >
            <h2 id="block-alt-heading" className="text-2xl font-bold tracking-tight">
              Blocks and pages
            </h2>
            <p className="mt-3 text-body text-muted-foreground">
              {story.blocks === 'full'
                ? `All ${(BLOCK_COUNT + PAGE_COUNT).toLocaleString('en-US')} blocks and pages are React and Tailwind, and they ship as written — there is nothing to convert for ${story.label}, because that is already what they are.`
                : `The block tier has no ${story.label} target. Blocks are React components carrying hundreds of Tailwind utility classes, and rewriting those as CSS-in-JS would produce a worse block wearing the same name. The effect tier above is where ${story.label} is served.`}
            </p>
          </section>
        )}

        <section
          className="mx-auto w-full max-w-3xl px-4 pb-14 sm:px-6 lg:px-8"
          aria-labelledby="install-heading"
        >
          <h2 id="install-heading" className="text-2xl font-bold tracking-tight">
            Getting it into your project
          </h2>

          <div className="mt-6">
            <CodeBlock
              code={installCommand}
              language="bash"
              filename="terminal"
              surface="detail"
              hideReactButton
            />
          </div>

          {story.detectedFrom ? (
            <p className="mt-4 flex gap-2 text-sm text-muted-foreground">
              <Terminal className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>
                No flag. The CLI reads your package.json and emits{' '}
                {story.label} because{' '}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  {story.detectedFrom}
                </code>
                . It also picks the folder — an existing components directory
                rather than a new top-level one.
              </span>
            </p>
          ) : null}

          {explicitCommand ? (
            <p className="mt-4 text-sm text-muted-foreground">
              In a monorepo where detection has nothing to go on, say it
              outright:{' '}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                {explicitCommand}
              </code>
            </p>
          ) : null}

          {/*
            The API line, and why it is on this page rather than in the
            docs.

            Because the CLI's framework flag covers the EFFECT tier only —
            it writes blocks as React source. Somebody on this page who
            wants the markup wrapper needs a different call, and finding
            that out from us beats finding it out from a .tsx file landing
            in a Nuxt app.
          */}
          {markupCommand ? (
            <div className="mt-8">
              <h3 className="text-sm font-semibold">
                For the block markup, the API
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                The CLI&rsquo;s framework flag covers effects; it writes
                blocks as their React source. The markup wrapper comes from
                the public API instead — no key, no account:
              </p>
              <div className="mt-3">
                <CodeBlock
                  code={markupCommand}
                  language="bash"
                  filename="terminal"
                  surface="detail"
                  hideReactButton
                />
              </div>
            </div>
          ) : null}

          <ol className="mt-8 space-y-4">
            {story.setup.map((step, i) => (
              <li key={step} className="flex gap-3 text-body">
                <span
                  aria-hidden
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold"
                >
                  {i + 1}
                </span>
                <span className="text-muted-foreground">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <section
          className="mx-auto w-full max-w-3xl px-4 pb-16 sm:px-6 lg:px-8"
          aria-labelledby="licence-heading"
        >
          <h2 id="licence-heading" className="text-2xl font-bold tracking-tight">
            Where the licence comes into it
          </h2>
          <div className="mt-5 space-y-4 text-body text-muted-foreground">
            {story.proOnWebsite ? (
              <p>
                {story.label} output is Pro in{' '}
                <em>the website&rsquo;s export panel</em>, and it is worth
                being exact about what that is. The conversion runs in your
                browser, and{' '}
                <Link href="/docs/api" className="font-medium text-primary hover:underline">
                  the public API
                </Link>{' '}
                and{' '}
                <Link href="/docs/cli" className="font-medium text-primary hover:underline">
                  the CLI
                </Link>{' '}
                hand every format to any caller with no key and no account,
                on purpose. What Pro sells is{' '}
                <Link href="/licence" className="font-medium text-primary hover:underline">
                  the licence to ship it
                </Link>
                , not access to it.
              </p>
            ) : (
              <p>
                {story.label} output is not gated anywhere — not in the
                export panel, not in{' '}
                <Link href="/docs/api" className="font-medium text-primary hover:underline">
                  the API
                </Link>
                , not in{' '}
                <Link href="/docs/cli" className="font-medium text-primary hover:underline">
                  the CLI
                </Link>
                . What Pro sells is{' '}
                <Link href="/licence" className="font-medium text-primary hover:underline">
                  the licence to ship it
                </Link>
                , which is a separate question from reaching it.
              </p>
            )}
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/browse"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Browse the catalog
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/frameworks"
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold transition hover:bg-muted"
            >
              Compare every framework
            </Link>
          </div>
        </section>

        {/*
          The other six, linked from each one.

          Not a nav afterthought: the commonest real question after "is
          there a Vue version" is "what about the Astro side of this
          project", and a reader who has to go back up to the hub to ask it
          usually does not.
        */}
        <section
          className="mx-auto w-full max-w-3xl px-4 pb-20 sm:px-6 lg:px-8"
          aria-labelledby="others-heading"
        >
          <h2 id="others-heading" className="text-lg font-semibold">
            Also targeted
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {FRAMEWORK_STORIES.filter((f) => f.id !== story.id).map((other) => (
              <li key={other.id}>
                <Link
                  href={`/frameworks/${other.id}`}
                  className="block rounded-lg border border-border/60 p-4 transition hover:border-border hover:bg-muted/40"
                >
                  <span className="font-medium">{other.label}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {other.ecosystem.slice(0, 3).join(' · ')}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
