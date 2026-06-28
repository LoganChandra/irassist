import Link from 'next/link';
import type { Metadata } from 'next';
import { Info } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { PricingTable } from './pricing-table';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Simple plans for HR & IR teams — from a free workspace to unlimited cases.',
};

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string }>;
}) {
  const { billing } = await searchParams;
  const notConfigured = billing === 'not_configured';

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/">
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/dashboard">Open workspace</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-brand-deep">
            Plans that scale with your caseload
          </h1>
          <p className="mt-3 text-muted-foreground">
            Start free. Upgrade when your team is running real cases. No setup, cancel anytime.
          </p>
        </div>

        {notConfigured && (
          <div className="mx-auto mt-8 flex max-w-xl items-start gap-2.5 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Checkout isn&apos;t live yet.</span>{' '}
              Billing is still being set up — explore the full workspace free in the meantime.
            </p>
          </div>
        )}

        <div className="mt-12">
          <PricingTable />
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Prices in Malaysian Ringgit (RM). Billed securely through our payments partner.
          Reference &amp; drafting assistance — not legal representation.
        </p>
      </main>
    </div>
  );
}
