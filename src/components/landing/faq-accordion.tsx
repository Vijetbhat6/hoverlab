'use client'

/**
 * <FaqAccordion> — landing page FAQ section.
 *
 * 11 common questions a visitor might have before signing up: pricing, what
 * the four tiers are, commercial use, framework compatibility, the CLI,
 * browser support, customization, data ownership, offline support, and
 * contribution.
 *
 * Built on the existing Radix-based <Accordion> from src/components/ui.
 * Wrapped in <Reveal> for a subtle fade-in-up on scroll. The first item
 * is open by default so visitors see at least one answer immediately.
 */

import * as React from 'react'
import Link from 'next/link'
import { HelpCircle, ArrowRight } from 'lucide-react'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Reveal } from '@/components/reveal'

interface FaqItem {
  q: string
  a: React.ReactNode
}

const FAQ_ITEMS: FaqItem[] = [
  {
    q: 'Is Hoverlab really free?',
    a: (
      <>
        Yes, for personal and non-commercial projects. The whole catalog —
        every effect, every block, every page, every template — is free to
        browse, customize and copy, with no time limit and no credit card.
        The CLI and the public API are open to everyone too — including
        every export format, which is why no plan charges for them. What a
        paid plan adds is the right to use any of it commercially, and an
        unlimited synced bundle.
      </>
    ),
  },
  {
    q: "What's the difference between an effect, a block, a page and a template?",
    a: (
      <>
        Scale. An <strong>effect</strong> is one element styled right — a
        glowing button, a shimmering skeleton — and it&apos;s pure CSS. A{' '}
        <strong>block</strong> is a whole section, like a pricing table or a
        navbar. A <strong>page</strong> is a finished screen composed of
        blocks. A <strong>template</strong> is a multi-page project you can
        deploy. Each tier is built from the one below it, so you can open a
        template and drill all the way down to the individual button inside
        it — or skip straight to the rung you actually need.
      </>
    ),
  },
  {
    q: 'Can I use these in commercial projects?',
    a: (
      <>
        That&apos;s what Pro is for. The free tier covers personal and
        non-commercial work — learning, side projects, portfolios. A one-time
        Pro license covers client projects, paid products, and internal tools
        at a company, for anything in the catalog at any tier, with no
        attribution required and nothing recurring to pay. Buy it once and it
        stays yours, including future updates.
      </>
    ),
  },
  {
    q: 'Do I need React, Vue, or any framework?',
    a: (
      <>
        For effects, no — every one is plain HTML + plain CSS, with no build
        step and no JavaScript to bundle. It drops into a static{' '}
        <code>.html</code> file as easily as into a React component, a Vue
        template or an Astro page.
        <br />
        <br />
        Blocks, pages and templates are different, and we&apos;d rather say so
        here than let you find out after copying: they ship as React + Tailwind
        components in TypeScript, and most import{' '}
        <code>lucide-react</code> for icons. Every one lists its dependencies
        on its detail page before you take it.
      </>
    ),
  },
  {
    q: 'Is there a CLI?',
    a: (
      <>
        Yes — <code>npx hoverlab add &lt;id&gt;</code> writes any effect,
        block, page or template straight into your project. It detects your
        setup (framework, TypeScript, Tailwind, where your components live)
        and picks sensible paths, and it takes a plain id, so you don&apos;t
        have to know which tier the thing you want sits on. There&apos;s also
        an MCP server, so an editor agent can search the catalog and pull
        source directly.
        <br />
        <br />
        Both are free and need no account or token — the API behind them is
        public and unauthenticated on purpose.
      </>
    ),
  },
  {
    q: 'What browsers are supported?',
    a: (
      <>
        Every effect targets the last two versions of Chrome, Firefox,
        Safari, and Edge — which covers roughly 97% of users today. We avoid
        bleeding-edge CSS like <code>@property</code> and CSS nesting unless
        a graceful fallback exists. Anything using a newer feature is marked
        in its description. Internet Explorer is not supported and never
        will be.
      </>
    ),
  },
  {
    q: 'Can I customize the colors and timing?',
    a: (
      <>
        Yes — every effect detail page exposes hue, saturation, scale, and
        speed sliders. You can also pick from six preset palettes (Sunset,
        Ocean, Forest, Monochrome, Neon, Pastel) or set a custom brand color
        from the account page. Your customizations are saved per-effect and
        travel with your bundle when you export it.
      </>
    ),
  },
  {
    q: 'Do you store my customized CSS in the cloud?',
    a: (
      <>
        No. Your favorites and bundle entries (just the effect IDs and
        their customization values) are synced to your account so they
        show up on every device you sign in on. The full CSS itself is
        generated in your browser at export time — we never store the
        rendered output, and we never sell or share your data.
      </>
    ),
  },
  {
    q: 'Does it work offline?',
    a: (
      <>
        Yes. Hoverlab is a Progressive Web App — install it from your
        browser&apos;s address bar (Chrome, Edge, Safari on iOS) and it
        runs as a standalone app with offline access to the library and
        your saved effects. A service worker caches the shell, the effect
        data, and your customization state for offline browsing.
      </>
    ),
  },
  {
    q: 'Can I contribute my own effects?',
    a: (
      <>
        We&apos;d love that. The source is on GitHub — open an issue with
        the effect you&apos;d like to add (or a pull request with the
        implementation), and we&apos;ll review it within a week. We care
        about quality over quantity, so we look for: pure CSS (no JS),
        accessible (respects <code>prefers-reduced-motion</code>), and
        degrades gracefully on older browsers.
      </>
    ),
  },
]

export function FaqAccordion() {
  return (
    <section className="border-y border-border/40 bg-background/60 py-16 backdrop-blur sm:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs text-muted-foreground">
            <HelpCircle className="h-3.5 w-3.5 text-primary" />
            Frequently asked
          </div>
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Questions, answered
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-pretty text-body">
            Everything you might want to know before signing up. Still
            curious?{' '}
            <Link
              href="/signup"
              className="text-primary underline-offset-4 hover:underline"
            >
              Try it free
            </Link>{' '}
            — no credit card needed.
          </p>
        </Reveal>

        <Reveal delay={80}>
          <Accordion
            type="single"
            defaultValue="faq-0"
            collapsible
            className="overflow-hidden rounded-2xl border border-border/60 bg-card/80 px-4 backdrop-blur sm:px-6"
          >
            {FAQ_ITEMS.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left text-base font-medium hover:no-underline">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>

        <Reveal
          delay={160}
          className="mt-8 flex flex-col items-center justify-center gap-3 text-center sm:flex-row sm:text-left"
        >
          <p className="text-sm text-muted-foreground">Still have questions?</p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/signup">
              Create your free account
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </Reveal>
      </div>
    </section>
  )
}
