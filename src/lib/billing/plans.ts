// ── IRAssist subscription plans + entitlements (processor-agnostic) ───────
// Prices in Malaysian Ringgit (RM). The payment processor (Polar MoR by
// default) maps each plan id to a product/price id via env — see
// src/lib/billing/payments.ts. Nothing here depends on the processor.

export type PlanId = 'free' | 'professional' | 'team';
export type BillingPeriod = 'monthly' | 'yearly';

export interface Entitlements {
  /** Max concurrently-open cases. null = unlimited. */
  maxCases: number | null;
  /** Seats included. */
  seats: number;
  aiAssistant: boolean;
  documentGeneration: boolean;
  awardsSearch: boolean;
  reports: boolean;
  tools: boolean;
  prioritySupport: boolean;
  auditLog: boolean;
}

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  /** Monthly price in RM (yearly billed at ~10 months). 0 = free. */
  priceMonthly: number;
  priceYearly: number;
  /** Marketing feature bullets shown on the pricing page. */
  features: string[];
  cta: string;
  highlighted?: boolean;
  entitlements: Entitlements;
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Explore the workspace and case law.',
    priceMonthly: 0,
    priceYearly: 0,
    cta: 'Get started',
    features: [
      'Up to 3 active cases',
      'Search Industrial Court awards',
      'Preview the template library',
      'Notice & benefit calculators',
      'Community support',
    ],
    entitlements: {
      maxCases: 3,
      seats: 1,
      aiAssistant: false,
      documentGeneration: false,
      awardsSearch: true,
      reports: false,
      tools: true,
      prioritySupport: false,
      auditLog: false,
    },
  },
  {
    id: 'professional',
    name: 'Professional',
    tagline: 'For HR leads running a live caseload.',
    priceMonthly: 149,
    priceYearly: 1490,
    cta: 'Upgrade to Professional',
    highlighted: true,
    features: [
      'Unlimited cases & PIPs',
      'AI Assistant grounded in awards',
      'Full template library + document generation',
      'Reports & analytics',
      'All tools & calculators',
      'Email support',
    ],
    entitlements: {
      maxCases: null,
      seats: 1,
      aiAssistant: true,
      documentGeneration: true,
      awardsSearch: true,
      reports: true,
      tools: true,
      prioritySupport: false,
      auditLog: false,
    },
  },
  {
    id: 'team',
    name: 'Team',
    tagline: 'For HR teams that need seats and oversight.',
    priceMonthly: 399,
    priceYearly: 3990,
    cta: 'Upgrade to Team',
    features: [
      'Everything in Professional',
      '5 seats included',
      'Admin roles & permissions',
      'Audit log of every action',
      'Priority support',
    ],
    entitlements: {
      maxCases: null,
      seats: 5,
      aiAssistant: true,
      documentGeneration: true,
      awardsSearch: true,
      reports: true,
      tools: true,
      prioritySupport: true,
      auditLog: true,
    },
  },
];

export function getPlan(id: PlanId): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}

export function entitlementsFor(id: PlanId): Entitlements {
  return getPlan(id).entitlements;
}

/** Boolean-feature gate: can(planId, 'aiAssistant'). */
export function can(
  id: PlanId,
  feature: {
    [K in keyof Entitlements]: Entitlements[K] extends boolean ? K : never;
  }[keyof Entitlements]
): boolean {
  return entitlementsFor(id)[feature];
}

/** Format a RM price for display. */
export function formatPrice(rm: number): string {
  return rm === 0 ? 'Free' : `RM${rm.toLocaleString('en-MY')}`;
}
