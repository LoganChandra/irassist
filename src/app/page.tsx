import Link from 'next/link';
import {
  ArrowRight,
  Scale,
  Sparkles,
  FileText,
  ShieldCheck,
  Clock,
  Search,
  BarChart3,
  Users,
  Briefcase,
  Building2,
  Gavel,
} from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';

const BENEFITS = [
  {
    icon: Briefcase,
    title: 'One workspace for every case',
    body: 'Track disciplinary matters, investigations and PIPs from complaint to decision — nothing slips.',
  },
  {
    icon: Sparkles,
    title: 'AI assistant, grounded in awards',
    body: 'Plain-English guidance on procedure and precedent, anchored to real Industrial Court reasoning.',
  },
  {
    icon: FileText,
    title: 'Procedurally correct letters',
    body: 'Show-cause, warning and inquiry letters drafted from vetted templates in seconds.',
  },
  {
    icon: Search,
    title: 'Searchable case law',
    body: 'Find relevant awards by misconduct, court, industry and date — with concise summaries.',
  },
  {
    icon: Clock,
    title: 'Never miss a deadline',
    body: 'Hearing dates, PIP reviews and statutory timelines surfaced before they bite.',
  },
  {
    icon: ShieldCheck,
    title: 'Defensible by design',
    body: 'Every step documented, so your process stands up if the matter reaches the Court.',
  },
];

const AUDIENCE = [
  { icon: Users, label: 'HR Professionals' },
  { icon: Briefcase, label: 'Managers' },
  { icon: Building2, label: 'Business Leaders' },
  { icon: Gavel, label: 'In-house Counsel' },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">
              Features
            </a>
            <a href="#audience" className="hover:text-foreground">
              Who it&apos;s for
            </a>
            <Link href="/awards" className="hover:text-foreground">
              Case Law
            </Link>
            <Link href="/dashboard" className="hover:text-foreground">
              Product
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">Sign up</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_70%_0%,hsl(var(--primary)/0.10),transparent)]" />
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24">
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <Scale className="h-3.5 w-3.5 text-primary" />
              Built for Malaysian Industrial Relations
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-brand-deep sm:text-5xl">
              Run your IR caseload with confidence.
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted-foreground">
              IR Assist gives HR teams one place to manage disciplinary cases, draft
              procedurally-correct letters, and check real Industrial Court awards — so every
              decision is fair, fast, and defensible.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/dashboard">
                  Get started <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/awards">Explore case law</Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Reference &amp; drafting assistance — not legal representation.
            </p>
          </div>

          {/* Hero preview card */}
          <div className="relative animate-fade-in">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Briefcase className="h-4 w-4 text-primary" /> Open Cases
                </div>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  18 active
                </span>
              </div>
              <div className="space-y-2.5 py-4">
                {[
                  { id: 'IR-2026-001', who: 'Ahmad bin Ali', tag: 'Absenteeism' },
                  { id: 'IR-2026-002', who: 'Ravi Kumar', tag: 'Investigation' },
                  { id: 'IR-2026-003', who: 'Lim Wei Jian', tag: 'PIP' },
                ].map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {c.who
                          .split(' ')
                          .map((w) => w[0])
                          .slice(0, 2)
                          .join('')}
                      </span>
                      <div className="leading-tight">
                        <div className="text-sm font-medium text-foreground">{c.who}</div>
                        <div className="text-xs text-muted-foreground">{c.id}</div>
                      </div>
                    </div>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                      {c.tag}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2.5 text-sm text-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">
                  <span className="font-medium text-foreground">AI Assistant:</span> the proper
                  procedure for absenteeism is…
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="features" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-brand-deep">
            Everything an IR case needs, in one place
          </h2>
          <p className="mt-3 text-muted-foreground">
            From the first complaint to the final decision — guided, documented, defensible.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.title}
                className="rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-semibold text-foreground">{b.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{b.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Audience */}
      <section id="audience" className="border-y border-border bg-brand-deep">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <h2 className="text-2xl font-bold text-white">Who we help</h2>
            <p className="text-sm text-sidebar-muted">
              Trusted by teams navigating workplace challenges with confidence.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {AUDIENCE.map((a) => {
              const Icon = a.icon;
              return (
                <div
                  key={a.label}
                  className="flex flex-col items-center gap-3 rounded-xl border border-sidebar-border bg-white/5 px-4 py-6 text-center"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/20 text-primary-foreground">
                    <Icon className="h-5 w-5 text-white" />
                  </span>
                  <span className="text-sm font-medium text-white">{a.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
        <div className="flex flex-col items-center gap-5 rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
          <BarChart3 className="h-9 w-9 text-primary" />
          <h2 className="max-w-xl text-3xl font-bold tracking-tight text-brand-deep">
            Make confident, legally-sound IR decisions
          </h2>
          <p className="max-w-md text-muted-foreground">
            Start managing your caseload today. No setup — explore the full workspace with sample
            data.
          </p>
          <Button asChild size="lg">
            <Link href="/dashboard">
              Open the workspace <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <Logo />
          <p className="text-xs text-muted-foreground">
            © 2026 IR Assist. Reference &amp; drafting assistance only — not a law firm.
          </p>
          <div className="flex items-center gap-5 text-xs text-muted-foreground">
            <a href="#" className="hover:text-foreground">
              Terms
            </a>
            <a href="#" className="hover:text-foreground">
              Privacy
            </a>
            <a href="#" className="hover:text-foreground">
              Disclaimer
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
