'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { PLANS, type BillingPeriod } from '@/lib/billing/plans';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function PricingTable() {
  const [period, setPeriod] = useState<BillingPeriod>('monthly');

  return (
    <div>
      {/* Period toggle */}
      <div className="mb-10 flex items-center justify-center gap-3">
        <span
          className={cn(
            'text-sm font-medium',
            period === 'monthly' ? 'text-foreground' : 'text-muted-foreground'
          )}
        >
          Monthly
        </span>
        <button
          onClick={() => setPeriod((p) => (p === 'monthly' ? 'yearly' : 'monthly'))}
          className="relative h-6 w-11 rounded-full bg-primary/20 transition-colors"
          aria-label="Toggle billing period"
        >
          <span
            className={cn(
              'absolute top-0.5 h-5 w-5 rounded-full bg-primary shadow-sm transition-transform',
              period === 'yearly' ? 'translate-x-[22px]' : 'translate-x-0.5'
            )}
          />
        </button>
        <span
          className={cn(
            'text-sm font-medium',
            period === 'yearly' ? 'text-foreground' : 'text-muted-foreground'
          )}
        >
          Yearly <span className="text-success">· 2 months free</span>
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {PLANS.map((plan) => {
          const price = period === 'monthly' ? plan.priceMonthly : plan.priceYearly;
          const href =
            plan.id === 'free'
              ? '/signup'
              : `/api/checkout?plan=${plan.id}&period=${period}`;
          return (
            <div
              key={plan.id}
              className={cn(
                'flex flex-col rounded-2xl border bg-card p-6 shadow-sm',
                plan.highlighted
                  ? 'border-primary ring-1 ring-primary/30 shadow-md'
                  : 'border-border'
              )}
            >
              {plan.highlighted && (
                <span className="mb-3 inline-flex w-fit items-center rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>

              <div className="mt-5 flex items-baseline gap-1">
                {price === 0 ? (
                  <span className="text-4xl font-bold tracking-tight text-foreground">Free</span>
                ) : (
                  <>
                    <span className="text-4xl font-bold tracking-tight text-foreground">
                      RM{price.toLocaleString('en-MY')}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      /{period === 'monthly' ? 'mo' : 'yr'}
                    </span>
                  </>
                )}
              </div>

              <Button
                asChild
                className="mt-6"
                variant={plan.highlighted ? 'default' : 'outline'}
                size="lg"
              >
                <Link href={href}>{plan.cta}</Link>
              </Button>

              <ul className="mt-6 space-y-3 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" strokeWidth={3} />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
