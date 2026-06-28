import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutUrl } from '@/lib/billing/payments';
import { createClient } from '@/lib/supabase/server';
import { hasValidSupabaseConfig } from '@/lib/env';
import type { BillingPeriod, PlanId } from '@/lib/billing/plans';

/**
 * GET /api/checkout?plan=professional&period=monthly
 * Resolves the signed-in user's org, creates a checkout session, redirects to it.
 * Not signed in → login (then back here). Not configured → /pricing with a notice.
 */
export async function GET(request: NextRequest) {
  const plan = (request.nextUrl.searchParams.get('plan') || '') as PlanId;
  const period = (request.nextUrl.searchParams.get('period') || 'monthly') as BillingPeriod;
  const origin = request.nextUrl.origin;
  const self = `/api/checkout?plan=${plan}&period=${period}`;

  if (plan !== 'professional' && plan !== 'team') {
    return NextResponse.redirect(new URL('/pricing', origin));
  }

  let orgId: string | undefined;
  let email: string | undefined;

  if (hasValidSupabaseConfig()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      const url = new URL('/login', origin);
      url.searchParams.set('next', self);
      return NextResponse.redirect(url);
    }
    email = user.email ?? undefined;
    const { data: profile } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', user.id)
      .maybeSingle();
    orgId = (profile?.org_id as string | undefined) ?? undefined;
  }

  const result = await createCheckoutUrl({
    planId: plan,
    period,
    successUrl: `${origin}/settings?upgraded=1`,
    cancelUrl: `${origin}/pricing`,
    customerEmail: email,
    orgId,
  });

  if (result.ok) {
    return NextResponse.redirect(result.url);
  }
  const back = new URL('/pricing', origin);
  back.searchParams.set('billing', result.reason);
  return NextResponse.redirect(back);
}
