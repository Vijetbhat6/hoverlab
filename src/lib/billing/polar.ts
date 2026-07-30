import 'server-only'
import { Polar } from '@polar-sh/sdk'

/**
 * Server-side Polar client.
 *
 * Polar is a merchant of record: it collects and remits EU VAT and global
 * sales tax on our behalf, which is why it was chosen over raw Stripe for
 * a product sold to developers worldwide. We never register for tax in
 * each jurisdiction; Polar is the seller of record.
 *
 * Required environment variables:
 *   POLAR_ACCESS_TOKEN        organization access token
 *   POLAR_WEBHOOK_SECRET      signing secret for /api/billing/webhook
 *   POLAR_PRODUCT_ID_PRO      product id for the one-time Pro license
 *   POLAR_PRODUCT_ID_TEAM     product id for the per-seat Team plan
 *   POLAR_SERVER              'sandbox' (default) or 'production'
 *
 * `POLAR_SERVER` defaults to sandbox so a misconfigured deploy cannot
 * accidentally take real money.
 */

const accessToken = process.env.POLAR_ACCESS_TOKEN

/** 'sandbox' unless explicitly set to production — fail safe, not fail open. */
export const polarServer: 'sandbox' | 'production' =
  process.env.POLAR_SERVER === 'production' ? 'production' : 'sandbox'

/**
 * True when billing is configured. Every billing route checks this and
 * returns a clear 503 rather than throwing an opaque SDK error, so the
 * app runs normally with billing simply switched off.
 */
export function billingEnabled(): boolean {
  return Boolean(accessToken && process.env.POLAR_WEBHOOK_SECRET)
}

let client: Polar | null = null

/** Lazily construct the client so importing this module never throws. */
export function getPolar(): Polar {
  if (!accessToken) {
    throw new Error(
      'POLAR_ACCESS_TOKEN is not set — call billingEnabled() before getPolar().',
    )
  }
  if (!client) {
    client = new Polar({ accessToken, server: polarServer })
  }
  return client
}
