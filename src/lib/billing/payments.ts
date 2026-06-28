// ── Payments (processor-agnostic interface, Polar MoR adapter) ────────────
//
// IRAssist bills through a Merchant-of-Record (Polar) by default — per the
// no-entity / MoR rail, so no registered company is needed and global tax +
// compliance is the MoR's job. The whole app talks to the small interface
// below; swapping to Stripe means writing one more adapter, nothing else.
//
// Inert until configured: with no POLAR_ACCESS_TOKEN the app runs in demo mode
// (pricing shows, "upgrade" explains setup) and never calls out.
//
// ⚠ The one outbound Polar call (createCheckoutUrl) is isolated below and
//   flagged PENDING-LIVE-TEST — confirm it against a Polar sandbox the first
//   time real keys are present.

import type { BillingPeriod, PlanId } from './plans';

const PROVIDER = (process.env.PAYMENTS_PROVIDER || 'polar') as 'polar' | 'stripe';

function polarApiBase(): string {
  return process.env.POLAR_SERVER === 'production'
    ? 'https://api.polar.sh'
    : 'https://sandbox-api.polar.sh';
}

/** Map a plan + period to the processor's price/product id (set via env). */
function priceIdFor(planId: PlanId, period: BillingPeriod): string | undefined {
  const key = `POLAR_PRICE_${planId.toUpperCase()}_${period.toUpperCase()}`;
  return process.env[key];
}

/** True when a real billing backend is wired (otherwise the app is in demo mode). */
export function isBillingConfigured(): boolean {
  if (PROVIDER === 'polar') {
    return Boolean(process.env.POLAR_ACCESS_TOKEN);
  }
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function billingProviderName(): string {
  return PROVIDER === 'polar' ? 'Polar (Merchant of Record)' : 'Stripe';
}

export type CheckoutResult =
  | { ok: true; url: string }
  | { ok: false; reason: 'not_configured' | 'no_price' | 'error'; message: string };

/**
 * Create a hosted checkout session for a plan and return its URL.
 * PENDING-LIVE-TEST: the Polar request shape is per their documented
 * /v1/checkouts API — verify against a sandbox on first run with real keys.
 */
export async function createCheckoutUrl(opts: {
  planId: PlanId;
  period: BillingPeriod;
  successUrl: string;
  customerEmail?: string;
}): Promise<CheckoutResult> {
  if (!isBillingConfigured()) {
    return {
      ok: false,
      reason: 'not_configured',
      message: 'Billing is not configured yet. Add billing keys to enable checkout.',
    };
  }

  const priceId = priceIdFor(opts.planId, opts.period);
  if (!priceId) {
    return {
      ok: false,
      reason: 'no_price',
      message: `No price id configured for ${opts.planId}/${opts.period}.`,
    };
  }

  if (PROVIDER !== 'polar') {
    return { ok: false, reason: 'error', message: 'Stripe adapter not wired yet.' };
  }

  try {
    const res = await fetch(`${polarApiBase()}/v1/checkouts/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_price_id: priceId,
        success_url: opts.successUrl,
        ...(opts.customerEmail ? { customer_email: opts.customerEmail } : {}),
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      return { ok: false, reason: 'error', message: `Checkout failed (${res.status}): ${detail.slice(0, 200)}` };
    }

    const data = (await res.json()) as { url?: string };
    if (!data.url) {
      return { ok: false, reason: 'error', message: 'Checkout response had no url.' };
    }
    return { ok: true, url: data.url };
  } catch (e) {
    return { ok: false, reason: 'error', message: e instanceof Error ? e.message : 'Unknown error' };
  }
}

/** Customer portal (manage / cancel). Returns null until billing is live. */
export function customerPortalUrl(): string | null {
  return process.env.POLAR_CUSTOMER_PORTAL_URL || null;
}
