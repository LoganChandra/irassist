import { NextRequest, NextResponse } from 'next/server';

/**
 * Polar webhook receiver.
 * PENDING-LIVE-TEST: confirm the signature scheme + event names against a
 * Polar sandbox on first run with real keys. Until POLAR_WEBHOOK_SECRET is set
 * this endpoint no-ops with 200 so the route is harmless in demo mode.
 *
 * On a real subscription event this is where we upsert the org's plan/status
 * into the database, which getCurrentSubscription() then reads.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.POLAR_WEBHOOK_SECRET;
  if (!secret) {
    // Demo mode: acknowledge without processing.
    return NextResponse.json({ ok: true, demo: true });
  }

  const payload = await request.text();

  // TODO(live): verify the webhook signature using POLAR_WEBHOOK_SECRET
  // (Polar uses Standard Webhooks signatures) before trusting the payload.

  let event: { type?: string; data?: unknown };
  try {
    event = JSON.parse(payload);
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid json' }, { status: 400 });
  }

  switch (event.type) {
    case 'subscription.created':
    case 'subscription.updated':
    case 'subscription.active':
      // TODO(live): upsert { orgId, planId, status:'active', currentPeriodEnd }.
      break;
    case 'subscription.canceled':
    case 'subscription.revoked':
      // TODO(live): mark the org's subscription canceled.
      break;
    default:
      break;
  }

  return NextResponse.json({ ok: true });
}
