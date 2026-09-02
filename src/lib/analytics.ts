'use client'

import posthog from 'posthog-js'
import type { ArtifactLevel } from '@/lib/artifact-types'

/**
 * Product analytics — a thin, typed wrapper over PostHog.
 *
 * There was previously no analytics of any kind, which meant every
 * monetization and roadmap decision was a guess: nobody could see which
 * effects get copied, where people drop out, or what converts. The event
 * set below is deliberately small and answers specific questions:
 *
 *   Which effects are worth curating?      effect_copied, effect_viewed
 *   Is customization actually used?        effect_customized
 *   Does bundling drive signups?           bundle_* , signup_completed
 *   Where does checkout leak?              pricing_viewed → checkout_started
 *                                          → purchase_completed
 *   Is AI search worth its API cost?       ai_search_performed
 *
 * Every call is a no-op when NEXT_PUBLIC_POSTHOG_KEY is unset, so local
 * dev and self-hosted forks stay silent without extra configuration.
 *
 * CONSENT. This module also owns `posthog.init`, and calls it from
 * `startAnalytics()` — never at import time. No PostHog storage is written
 * and no PostHog request is made until the visitor has agreed to analytics;
 * `analytics-provider` is what watches the decision and calls in.
 * Initialising on import was the old shape, and it set a cookie and a
 * localStorage id on first paint, before anyone had been asked. See
 * src/lib/consent.ts.
 */

/** Discriminated event map — keeps property names consistent across call sites. */
export type AnalyticsEvent =
  // ---- catalog engagement ----
  | { name: 'effect_viewed'; props: { effect_id: string; category: string; featured: boolean } }
  | {
      name: 'effect_copied'
      props: {
        effect_id: string
        category: string
        /** Which copy affordance produced this — card, detail page, compare drawer. */
        surface: 'card' | 'detail' | 'compare' | 'palette' | 'playground'
        /**
         * What actually landed on the clipboard. The framework values
         * answer the question the export work was done to answer: which
         * targets are worth maintaining, and which nobody asked for.
         */
        format:
          | 'css'
          | 'html'
          | 'both'
          | 'react'
          | 'vue'
          | 'svelte'
          | 'styled-components'
          | 'tailwind'
        /** True when the user had altered hue/saturation/scale/speed first. */
        customized: boolean
      }
    }
  | {
      name: 'effect_customized'
      props: { effect_id: string; hue: number; saturation: number; scale: number; speed: number }
    }
  /**
   * The user took the artifact somewhere editable. Which destination wins
   * decides whether the other integrations are worth keeping.
   *
   * `artifact_id` + `level` rather than `effect_id`, for the reason given
   * on `bundle_add` below: blocks and pages got a sandbox of their own, and
   * "does anyone run a block before pasting it" is a different question
   * from the same one about a hover state. Keeping them on one event name
   * is what makes the two comparable.
   */
  | {
      name: 'sandbox_open'
      props: {
        artifact_id: string
        level: ArtifactLevel
        target: 'codepen' | 'jsfiddle' | 'download' | 'stackblitz'
      }
    }
  /*
   * Which non-React format a reader takes a block's markup in.
   *
   * The cheapest available answer to a question this project has so far
   * settled by assertion: whether the block tier is worth porting properly.
   * Only fired for the non-default tabs — HTML is what the panel opens on,
   * so counting it would drown the signal in page views.
   */
  | {
      name: 'block_markup_framework'
      props: { block_id: string; framework: 'vue' | 'svelte' | 'astro' }
    }
  /** Embed snippet copied — tracks the catalog's reach into other sites. */
  | { name: 'embed_copied'; props: { effect_id: string } }
  // ---- search ----
  | { name: 'search_performed'; props: { query: string; result_count: number } }
  | { name: 'ai_search_performed'; props: { query: string; result_count: number; ms: number } }
  // ---- bundle / export ----
  // `artifact_id` rather than `effect_id`: a bundle holds any rung of the
  // ladder now, and `level` is what makes the funnel answerable — "do people
  // who bundle a template ever come back" is a different question from the
  // same about a hover state.
  | {
      name: 'bundle_add'
      props: { artifact_id: string; level: ArtifactLevel; bundle_size: number }
    }
  | { name: 'bundle_remove'; props: { artifact_id: string; bundle_size: number } }
  | {
      name: 'bundle_exported'
      props: {
        format: 'html' | 'css' | 'zip'
        effect_count: number
        /** Which framework the ZIP's per-effect sources were generated in. */
        framework?: string
      }
    }
  // ---- accounts ----
  | { name: 'signup_completed'; props: { method: 'email' } }
  /**
   * `method` is the whole point of the event now that there are two doors.
   * Passkey adoption is not observable any other way — the sign-in page
   * cannot tell how many of its visitors have one — and the ratio is what
   * decides whether the password form ever stops being the default.
   */
  | { name: 'login_completed'; props: { method: 'email' | 'passkey' } }
  // ---- monetization funnel ----
  | { name: 'pricing_viewed'; props: Record<string, never> }
  /**
   * Currency display toggled on the pricing section. Paired with `region`,
   * this answers whether the rupee view is actually wanted — and by whom.
   * If visitors outside India routinely switch to INR, the regional default
   * is wrong; if Indian visitors switch away to USD, the toggle is noise.
   */
  | {
      name: 'pricing_currency_toggled'
      props: { currency: 'USD' | 'INR'; region: string }
    }
  | { name: 'checkout_started'; props: { plan: string; interval: 'one_time' | 'month' } }
  | {
      name: 'purchase_completed'
      props: { plan: string; interval: 'one_time' | 'month'; amount_cents: number }
    }
  | { name: 'paywall_hit'; props: { feature: string; plan_required: string } }
  /*
   * The design system export. Worth its own event rather than folding into
   * a generic "export": it is the only Pro feature whose output is derived
   * per-customer, so how often it is actually used is the clearest signal
   * available on whether Pro is worth what it costs.
   */
  | { name: 'design_system_generated'; props: { name: string } }
  /*
   * The clipboard route into Figma. Separate from the export above because
   * it answers a different question: that one measures whether Pro is
   * worth its price, this one measures whether the free designer path is
   * used at all — and designers pick these libraries more often than the
   * developers who implement them do. If this never fires, /figma is a
   * page for an audience that is not arriving.
   */
  | { name: 'figma_sheet_copied'; props: { tokens: number; tool?: string } }
  /*
   * The other half of the Figma path: a whole artifact traced into layers,
   * rather than the palette.
   *
   * Separate from `figma_sheet_copied` because they answer different
   * questions. That one asks whether designers arrive at all; this one asks
   * whether they get far enough in to be looking at a specific block — and
   * `layers` is the only signal available on whether the walk produced
   * something worth pasting or ten rectangles and a background.
   */
  | {
      name: 'figma_frame_copied'
      props: { artifact_id: string; level: 'block' | 'page'; layers: number }
    }
  /*
   * List signups, by where the form was. The point of the list is that it
   * is the one distribution channel that cannot be re-ranked, so which
   * surface actually feeds it is worth knowing.
   */
  | { name: 'newsletter_subscribed'; props: { source: string } }
  /*
   * The designer tools, and whether they are a funnel or a cul-de-sac.
   *
   * The tools are plausibly the largest traffic surface on this site and
   * they led nowhere until /tools grew the save bar and the catalog exits.
   * These three answer the question that decides whether that work was
   * worth doing: does anyone who came for a spacing scale ever take a step
   * toward the catalog, and which step.
   *
   * `tool` is the route ('/tools/tokens'), so the answer is per-tool. It is
   * very unlikely to be uniform — a contrast checker and a token generator
   * attract different visitors with different intent — and a single blended
   * conversion rate would hide that.
   */
  | { name: 'tool_preset_saved'; props: { tool: string } }
  | { name: 'tool_preview_in_brand'; props: { tool: string } }
  | { name: 'tool_copy_install'; props: { tool: string } }
  | { name: 'tool_open_dna'; props: { tool: string } }

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com'

/** Has `posthog.init` run in this document? Not undoable, hence separate from `capturing`. */
let loaded = false
/** Is PostHog allowed to capture right now? The thing every call below checks. */
let capturing = false

/**
 * Start PostHog. Safe to call repeatedly; only the first call initialises.
 *
 * The init options are half of the consent gate, and each is load-bearing:
 *
 *   `opt_out_capturing_by_default` — belt to the braces of not calling this
 *   function at all. If a later edit ever initialises PostHog early, the
 *   worst case is an instance that is loaded and silent, rather than one
 *   quietly capturing before the question was asked.
 *
 *   `opt_out_capturing_persistence_type: 'localStorage'` — the refusal
 *   record must not be a cookie. Writing a cookie to remember that someone
 *   refused cookies is the own-goal this whole gate exists to avoid.
 *
 *   `opt_out_persistence_by_default` — while opted out the SDK writes no
 *   persistence of its own, so a refusal leaves no id behind.
 *
 *   `respect_dnt` — /privacy tells visitors that Do Not Track opts them
 *   out. Without this line that sentence is false: posthog-js ignores DNT
 *   unless it is asked to honour it.
 */
export function startAnalytics(): void {
  if (typeof window === 'undefined' || !POSTHOG_KEY) return

  if (!loaded) {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      // Pageviews are fired by hand on pathname change: the App Router
      // navigates on the client, and PostHog's automatic pageview only
      // fires on a hard load, so /library → /effect/x would go unrecorded.
      capture_pageview: false,
      capture_pageleave: true,
      // Clicks only, and no input values — the search box can contain anything.
      autocapture: { dom_event_allowlist: ['click'] },
      persistence: 'localStorage+cookie',
      opt_out_capturing_by_default: true,
      opt_out_capturing_persistence_type: 'localStorage',
      opt_out_persistence_by_default: true,
      respect_dnt: true,
    })
    loaded = true
  }

  // No `$opt_in` event: a consent decision is not a product event, and
  // capturing one would put it at the head of every consenting visitor's funnel.
  posthog.opt_in_capturing({ captureEventName: false })

  // Read the answer back rather than assume it. Under Do Not Track this
  // stays false even though consent was given, and `enabled()` should agree.
  capturing = posthog.has_opted_in_capturing()
}

/**
 * Stop capturing, and drop what was stored.
 *
 * An initialised PostHog cannot be unloaded, so this opts out instead —
 * which, with the persistence options above, is what actually clears the
 * cookie and the id. `loaded` deliberately stays true: calling `init` twice
 * on the same instance is the thing that would be wrong.
 */
export function stopAnalytics(): void {
  capturing = false
  if (!loaded) return
  try {
    posthog.opt_out_capturing()
  } catch (err) {
    console.error('[analytics] opt-out failed:', err)
  }
}

/** True only while PostHog is initialised *and* consented — see startAnalytics. */
function enabled(): boolean {
  return typeof window !== 'undefined' && Boolean(POSTHOG_KEY) && capturing
}

/**
 * Record a product event.
 *
 * Typed against `AnalyticsEvent`, so a typo in an event name or a missing
 * property is a compile error rather than a silently-wrong dashboard.
 */
export function track<E extends AnalyticsEvent>(name: E['name'], props: E['props']): void {
  if (!enabled()) return
  try {
    posthog.capture(name, props)
  } catch (err) {
    // Analytics must never break a user action — a failed capture should
    // not stop a copy-to-clipboard or a checkout redirect.
    console.error('[analytics] capture failed:', err)
  }
}

/**
 * Associate subsequent events with a signed-in user, so the funnel can be
 * followed across devices and sessions.
 */
export function identify(userId: string, traits?: Record<string, unknown>): void {
  if (!enabled()) return
  try {
    posthog.identify(userId, traits)
  } catch (err) {
    console.error('[analytics] identify failed:', err)
  }
}

/** Clear identity on logout so the next visitor isn't attributed to the old user. */
export function resetIdentity(): void {
  if (!enabled()) return
  try {
    posthog.reset()
  } catch (err) {
    console.error('[analytics] reset failed:', err)
  }
}
