// ── Payments — processor-agnostic interface (Stripe + Polar adapters) ─────
//
// PAYMENTS_PROVIDER selects the adapter ('stripe' or 'polar'). The whole app
// talks to the small surface below; swapping providers is one env var + the
// matching keys. Inert until configured (demo mode otherwise).

import type { BillingPeriod, PlanId } from './plans';

const PROVIDER = (process.env.PAYMENTS_PROVIDER || 'polar') as 'stripe' | 'polar';

export function isBillingConfigured(): boolean {
  return PROVIDER === 'stripe'
    ? Boolean(process.env.STRIPE_SECRET_KEY)
    : Boolean(process.env.POLAR_ACCESS_TOKEN);
}

export function billingProviderName(): string {
  return PROVIDER === 'stripe' ? 'Stripe' : 'Polar (Merchant of Record)';
}

/** Plan + period → the processor's price id (set via env). */
function priceIdFor(planId: PlanId, period: BillingPeriod): string | undefined {
  const prefix = PROVIDER === 'stripe' ? 'STRIPE_PRICE' : 'POLAR_PRICE';
  return process.env[`${prefix}_${planId.toUpperCase()}_${period.toUpperCase()}`];
}

export type CheckoutResult =
  | { ok: true; url: string }
  | { ok: false; reason: 'not_configured' | 'no_price' | 'error'; message: string };

export async function createCheckoutUrl(opts: {
  planId: PlanId;
  period: BillingPeriod;
  successUrl: string;
  cancelUrl?: string;
  customerEmail?: string;
  orgId?: string;
}): Promise<CheckoutResult> {
  if (!isBillingConfigured()) {
    return { ok: false, reason: 'not_configured', message: 'Billing is not configured yet.' };
  }
  const priceId = priceIdFor(opts.planId, opts.period);
  if (!priceId) {
    return { ok: false, reason: 'no_price', message: `No price id for ${opts.planId}/${opts.period}.` };
  }

  if (PROVIDER === 'stripe') {
    try {
      const { getStripe } = await import('./stripe');
      const stripe = getStripe();
      const metadata = { org_id: opts.orgId ?? '', plan: opts.planId };
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: opts.successUrl,
        cancel_url: opts.cancelUrl ?? opts.successUrl,
        customer_email: opts.customerEmail,
        client_reference_id: opts.orgId,
        metadata,
        subscription_data: { metadata },
        allow_promotion_codes: true,
      });
      return session.url
        ? { ok: true, url: session.url }
        : { ok: false, reason: 'error', message: 'Stripe returned no checkout url.' };
    } catch (e) {
      return { ok: false, reason: 'error', message: e instanceof Error ? e.message : 'Stripe error' };
    }
  }

  // Polar (Merchant of Record) adapter.
  try {
    const base =
      process.env.POLAR_SERVER === 'production' ? 'https://api.polar.sh' : 'https://sandbox-api.polar.sh';
    const res = await fetch(`${base}/v1/checkouts/`, {
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
      return { ok: false, reason: 'error', message: `Polar checkout failed (${res.status}).` };
    }
    const data = (await res.json()) as { url?: string };
    return data.url
      ? { ok: true, url: data.url }
      : { ok: false, reason: 'error', message: 'Polar returned no url.' };
  } catch (e) {
    return { ok: false, reason: 'error', message: e instanceof Error ? e.message : 'Polar error' };
  }
}

/** Customer portal (manage / cancel). Null until configured. */
export function customerPortalUrl(): string | null {
  return process.env.STRIPE_CUSTOMER_PORTAL_URL || process.env.POLAR_CUSTOMER_PORTAL_URL || null;
}
