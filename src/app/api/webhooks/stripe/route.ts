import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/billing/stripe';
import { createServiceClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

function mapStatus(s: string): string {
  if (s === 'active') return 'active';
  if (s === 'trialing') return 'trialing';
  if (s === 'past_due' || s === 'unpaid') return 'past_due';
  if (s === 'canceled' || s === 'incomplete_expired') return 'canceled';
  return 'none';
}

async function upsert(orgId: string | null | undefined, fields: Record<string, unknown>) {
  if (!orgId) return;
  const supabase = createServiceClient();
  await supabase
    .from('subscriptions')
    .upsert({ org_id: orgId, updated_at: new Date().toISOString(), ...fields }, { onConflict: 'org_id' });
}

const idOf = (v: string | { id: string } | null | undefined): string | undefined =>
  typeof v === 'string' ? v : (v?.id ?? undefined);

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = request.headers.get('stripe-signature');
  const body = await request.text();
  if (!secret || !sig) return NextResponse.json({ ok: true, skipped: 'not configured' });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, secret);
  } catch {
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object as Stripe.Checkout.Session;
        await upsert(s.metadata?.org_id || s.client_reference_id || undefined, {
          plan_id: s.metadata?.plan,
          status: 'active',
          provider: 'stripe',
          provider_customer_id: idOf(s.customer),
          provider_subscription_id: idOf(s.subscription),
        });
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        /* eslint-disable @typescript-eslint/no-explicit-any */
        const periodEnd =
          (sub as any).current_period_end ?? (sub as any).items?.data?.[0]?.current_period_end;
        /* eslint-enable @typescript-eslint/no-explicit-any */
        await upsert(sub.metadata?.org_id, {
          plan_id: sub.metadata?.plan,
          status: mapStatus(sub.status),
          current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
          provider: 'stripe',
          provider_customer_id: idOf(sub.customer),
          provider_subscription_id: sub.id,
        });
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await upsert(sub.metadata?.org_id, { status: 'canceled' });
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error('[stripe webhook] handler error:', e);
  }

  return NextResponse.json({ received: true });
}
