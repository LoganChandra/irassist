import type { BillingPeriod, PlanId } from './plans';
import { isBillingConfigured } from './payments';

export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'none';

export interface Subscription {
  planId: PlanId;
  status: SubscriptionStatus;
  period: BillingPeriod;
  /** ISO date the current period ends / renews. */
  currentPeriodEnd: string | null;
  /** True when running on seeded data rather than a real billing backend. */
  demo: boolean;
}

/**
 * Current org subscription. In demo mode (no billing backend configured) this
 * returns a seeded Professional subscription so the UI is complete. Swap the
 * body for a DB/processor lookup once billing is live.
 */
export function getCurrentSubscription(): Subscription {
  if (!isBillingConfigured()) {
    return {
      planId: 'professional',
      status: 'active',
      period: 'monthly',
      currentPeriodEnd: '2026-07-28',
      demo: true,
    };
  }
  // TODO(live): look up the real subscription for the signed-in org from the
  // database (populated by the payments webhook). Falls back to free.
  return {
    planId: 'free',
    status: 'none',
    period: 'monthly',
    currentPeriodEnd: null,
    demo: false,
  };
}
