import Link from 'next/link';
import { Scale, ShieldCheck, FileText, Sparkles } from 'lucide-react';
import { Logo } from '@/components/brand/logo';

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-10 text-white lg:flex">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_40%_at_30%_10%,hsl(var(--primary)/0.25),transparent)]" />
        <Link href="/" className="relative">
          <Logo variant="dark" withTagline />
        </Link>
        <div className="relative max-w-sm">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
            <Scale className="h-6 w-6 text-white" />
          </span>
          <h2 className="mt-6 text-3xl font-bold leading-tight">
            Industrial Relations, made simple.
          </h2>
          <p className="mt-3 text-sidebar-foreground">
            Your digital assistant for employee relations, disciplinary management, and employment
            compliance.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-sidebar-foreground">
            <li className="flex items-center gap-3">
              <Sparkles className="h-4 w-4 text-primary" /> AI guidance grounded in real awards
            </li>
            <li className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-primary" /> Procedurally-correct letter drafting
            </li>
            <li className="flex items-center gap-3">
              <ShieldCheck className="h-4 w-4 text-primary" /> A defensible record of every step
            </li>
          </ul>
        </div>
        <p className="relative text-xs text-sidebar-muted">
          © 2026 IR Assist · Reference &amp; drafting assistance only.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
