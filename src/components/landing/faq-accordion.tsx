'use client'

/**
 * <FaqAccordion> — landing page FAQ section.
 *
 * 8 common questions a visitor might have before signing up: pricing,
 * commercial use, framework compatibility, browser support, customization,
 * data ownership, offline support, and contribution.
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
        Yes. Every effect, every customization slider, every export is free
        with no time limit and no credit card. You can sign up, save your
        favorites, build a bundle, and export the CSS without ever paying.
        If we ever add a paid tier, the existing free features will stay
        free — that&apos;s a promise, not a marketing line.
      </>
    ),
  },
  {
    q: 'Can I use these effects in commercial projects?',
    a: (
      <>
        Absolutely. Every effect is pure CSS released under the MIT license.
        You can ship it in client projects, paid products, internal tools,
        or anything else — no attribution required (though it&apos;s
        appreciated). The only thing you can&apos;t do is sue us, and
        that&apos;s standard open-source boilerplate.
      </>
    ),
  },
  {
    q: 'Do I need React, Vue, or any framework?',
    a: (
      <>
        No. Every effect is plain HTML + plain CSS. The code we copy to your
        clipboard drops into a static <code>.html</code> file just as easily
        as it drops into a React component, a Vue template, an Astro page,
        or an email signature (well, almost — email clients are still rough).
        There is no build step and no JavaScript to bundle.
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
          <p className="mx-auto mt-3 max-w-xl text-pretty text-muted-foreground">
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
