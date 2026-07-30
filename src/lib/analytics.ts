'use client'

import posthog from 'posthog-js'

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
  // ---- search ----
  | { name: 'search_performed'; props: { query: string; result_count: number } }
  | { name: 'ai_search_performed'; props: { query: string; result_count: number; ms: number } }
  // ---- bundle / export ----
  | { name: 'bundle_add'; props: { effect_id: string; bundle_size: number } }
  | { name: 'bundle_remove'; props: { effect_id: string; bundle_size: number } }
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
  | { name: 'login_completed'; props: { method: 'email' } }
  // ---- monetization funnel ----
  | { name: 'pricing_viewed'; props: Record<string, never> }
  | { name: 'checkout_started'; props: { plan: string; interval: 'one_time' | 'month' } }
  | {
      name: 'purchase_completed'
      props: { plan: string; interval: 'one_time' | 'month'; amount_cents: number }
    }
  | { name: 'paywall_hit'; props: { feature: string; plan_required: string } }

/** True once PostHog has been initialized with a real project key. */
function enabled(): boolean {
  return typeof window !== 'undefined' && Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY)
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
