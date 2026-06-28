import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutUrl } from '@/lib/billing/payments';
import type { BillingPeriod, PlanId } from '@/lib/billing/plans';

/**
 * GET /api/checkout?plan=professional&period=monthly
 * Creates a hosted checkout session and redirects to it. If billing isn't
 * configured yet (demo mode), bounces back to /pricing with a notice.
 */
export async function GET(request: NextRequest) {
  const plan = (request.nextUrl.searchParams.get('plan') || '') as PlanId;
  const period = (request.nextUrl.searchParams.get('period') || 'monthly') as BillingPeriod;
  const origin = request.nextUrl.origin;

  if (plan !== 'professional' && plan !== 'team') {
    return NextResponse.redirect(new URL('/pricing', origin));
  }

  const result = await createCheckoutUrl({
    planId: plan,
    period,
    successUrl: `${origin}/dashboard?welcome=1`,
  });

  if (result.ok) {
    return NextResponse.redirect(result.url);
  }

  // Not configured / error → return to pricing with a reason the page can show.
  const back = new URL('/pricing', origin);
  back.searchParams.set('billing', result.reason);
  return NextResponse.redirect(back);
}
