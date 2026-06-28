'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { CalendarClock, Info, Scale, Umbrella, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Disclaimer } from '@/components/ui/disclaimer';

// ── Shared helpers ───────────────────────────────────────────────────────

/** Parse a free-text numeric input, clamping blanks / negatives to 0. */
function parseNum(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

/**
 * Pick a value by length-of-service band, matching the Employment Act 1955
 * tiers: under 2 years · 2–5 years · over 5 years.
 */
function byTier<T>(years: number, under2: T, twoToFive: T, over5: T): T {
  if (years < 2) return under2;
  if (years <= 5) return twoToFive;
  return over5;
}

/** Format a Ringgit amount, e.g. 2884.6 → "RM 2,884.60". */
function formatRM(amount: number): string {
  return `RM ${amount.toLocaleString('en-MY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ── Presentational building blocks ───────────────────────────────────────

function ToolCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-start gap-3 space-y-0">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div className="space-y-1">
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">{children}</CardContent>
    </Card>
  );
}

function NumberField({
  id,
  label,
  value,
  onChange,
  prefix,
  placeholder,
  step = 1,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  prefix?: string;
  placeholder?: string;
  step?: number;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        {prefix ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
            {prefix}
          </span>
        ) : null}
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          min={0}
          step={step}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={prefix ? 'pl-11' : undefined}
        />
      </div>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function ResultBox({
  caption,
  value,
  footnote,
}: {
  caption: string;
  value: string;
  footnote?: string;
}) {
  return (
    <div className="mt-auto rounded-lg border border-primary/20 bg-primary/[0.04] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {caption}
      </p>
      <p className="mt-1 text-3xl font-bold tabular-nums text-foreground">{value}</p>
      {footnote ? (
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{footnote}</p>
      ) : null}
    </div>
  );
}

// ── Calculators ──────────────────────────────────────────────────────────

function NoticePeriodCalculator() {
  const [years, setYears] = useState('3');
  const y = parseNum(years);
  const weeks = byTier(y, 4, 6, 8);

  return (
    <ToolCard
      icon={CalendarClock}
      title="Notice Period"
      description="Minimum termination notice, by completed years of service."
    >
      <NumberField
        id="np-years"
        label="Years of service"
        value={years}
        onChange={setYears}
        step={0.5}
        placeholder="e.g. 3"
        hint="Completed years of continuous service."
      />
      <ResultBox
        caption="Indicative notice"
        value={`${weeks} weeks`}
        footnote="Subject to contract & Employment Act 1955 — the longer of the contractual or statutory notice applies."
      />
    </ToolCard>
  );
}

function TerminationBenefitCalculator() {
  const [years, setYears] = useState('5');
  const [wage, setWage] = useState('2500');
  const y = parseNum(years);
  const w = parseNum(wage);
  const daysPerYear = byTier(y, 10, 15, 20);
  const benefit = daysPerYear * y * (w / 26);

  return (
    <ToolCard
      icon={Wallet}
      title="Termination / Retrenchment Benefit"
      description="Lay-off benefit under the Employment (Termination & Lay-Off Benefits) Regulations 1980."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField
          id="tb-years"
          label="Years of service"
          value={years}
          onChange={setYears}
          step={0.5}
          placeholder="e.g. 5"
        />
        <NumberField
          id="tb-wage"
          label="Monthly wage"
          value={wage}
          onChange={setWage}
          prefix="RM"
          step={100}
          placeholder="2,500"
        />
      </div>
      <ResultBox
        caption="Indicative benefit"
        value={formatRM(benefit)}
        footnote={`${daysPerYear} days/year × ${y} years × (monthly wage ÷ 26).`}
      />
    </ToolCard>
  );
}

function AnnualLeaveCalculator() {
  const [years, setYears] = useState('3');
  const y = parseNum(years);
  const days = byTier(y, 8, 12, 16);

  return (
    <ToolCard
      icon={Umbrella}
      title="Annual Leave Entitlement"
      description="Statutory paid annual leave, per s.60E of the Employment Act 1955."
    >
      <NumberField
        id="al-years"
        label="Years of service"
        value={years}
        onChange={setYears}
        step={0.5}
        placeholder="e.g. 3"
        hint="Your policy or contract may grant more."
      />
      <ResultBox
        caption="Indicative entitlement"
        value={`${days} days`}
        footnote="Minimum paid days per completed year of continuous service."
      />
    </ToolCard>
  );
}

function BackwagesCalculator() {
  const [wage, setWage] = useState('2500');
  const [months, setMonths] = useState('18');
  const w = parseNum(wage);
  const m = parseNum(months);
  const cappedMonths = Math.min(m, 24);
  const total = w * cappedMonths;
  const isCapped = m > 24;

  return (
    <ToolCard
      icon={Scale}
      title="Backwages Estimate (capped)"
      description="Compensation in lieu of reinstatement — Industrial Court convention caps backwages at 24 months."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField
          id="bw-wage"
          label="Last-drawn monthly wage"
          value={wage}
          onChange={setWage}
          prefix="RM"
          step={100}
          placeholder="2,500"
        />
        <NumberField
          id="bw-months"
          label="Months since dismissal"
          value={months}
          onChange={setMonths}
          step={1}
          placeholder="e.g. 18"
          hint="Counted to the award date; capped at 24."
        />
      </div>
      <ResultBox
        caption="Indicative backwages"
        value={formatRM(total)}
        footnote={
          isCapped
            ? `Capped at 24 months — you entered ${m}.`
            : `Monthly wage × ${cappedMonths} month${cappedMonths === 1 ? '' : 's'}.`
        }
      />
    </ToolCard>
  );
}

// ── Reference notes ──────────────────────────────────────────────────────

const REFERENCES: { term: string; detail: string }[] = [
  {
    term: 'Notice period',
    detail:
      'Employment Act 1955 s.12(2): 4 weeks (under 2 years), 6 weeks (2–5 years), 8 weeks (over 5 years) — or the contractual notice, whichever is longer.',
  },
  {
    term: 'Termination / lay-off benefit',
    detail:
      'Termination & Lay-Off Benefits Regulations 1980: 10 / 15 / 20 days of wages per completed year, at an ordinary daily rate of monthly wage ÷ 26.',
  },
  {
    term: 'Annual leave',
    detail:
      'Employment Act 1955 s.60E: 8 / 12 / 16 days per year by length of service. Contracts commonly grant more.',
  },
  {
    term: 'Backwages',
    detail:
      'Industrial Court practice caps backwages at 24 months of last-drawn wages for a confirmed employee, before deductions for post-dismissal earnings or contributory conduct.',
  },
];

// ── Screen ───────────────────────────────────────────────────────────────

export function Calculators() {
  return (
    <>
      <Disclaimer>
        <span className="font-medium text-foreground">
          Indicative estimates only — not legal advice.
        </span>{' '}
        These tools apply simplified Employment Act 1955 conventions and ignore contractual
        terms, the 2022 amendments&apos; wage thresholds and case-specific findings. Confirm
        every figure against the employee&apos;s contract and a qualified Malaysian IR
        practitioner.
      </Disclaimer>

      <div className="grid gap-5 md:grid-cols-2">
        <NoticePeriodCalculator />
        <TerminationBenefitCalculator />
        <AnnualLeaveCalculator />
        <BackwagesCalculator />
      </div>

      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <Info className="h-4 w-4 shrink-0 text-muted-foreground" />
          <CardTitle className="text-base">How these figures are derived</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {REFERENCES.map((r) => (
              <div key={r.term} className="space-y-1">
                <dt className="text-sm font-semibold text-foreground">{r.term}</dt>
                <dd className="text-xs leading-relaxed text-muted-foreground">{r.detail}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </>
  );
}
