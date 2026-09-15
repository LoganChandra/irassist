import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  ArrowLeft,
  Bookmark,
  FileText,
  Scale,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Disclaimer } from '@/components/ui/disclaimer';
import { AWARDS, getAwardById } from '@/lib/data';
import { formatDate } from '@/lib/utils';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const award = getAwardById(id);
  return { title: award ? award.title : 'Award' };
}

/** Pick a tasteful badge tint for a court outcome (presentational only). */
function outcomeVariant(outcome: string): 'success' | 'warning' | 'secondary' {
  const o = outcome.toLowerCase();
  if (o.includes('reinstat')) return 'success';
  if (o.includes('reduc') || o.includes('warning') || o.includes('set aside')) return 'warning';
  return 'secondary';
}

/** A plain prose tab (Facts / Issues / Decision). */
function ProseTab({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-foreground/90">{text}</p>
    </div>
  );
}

/** A label / value row for the sidebar "Award details" card. */
function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{children}</span>
    </div>
  );
}

export default async function AwardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const award = getAwardById(id);
  if (!award) notFound();

  // Normalise index/misconduct to plain strings.
  const index = award.terminationIndex;
  const misconduct = award.misconductTypes ?? [];
  const topicSet = new Set(index);
  const related = AWARDS.filter(
    (a) => a.id !== award.id && a.terminationIndex.some((t) => topicSet.has(t))
  ).slice(0, 3);

  /** The seven compilation headings, in fixed order (per the template). */
  const SEVEN_HEADINGS: { n: number; label: string; text: string }[] = [
    { n: 1, label: 'Type of Dismissal', text: award.typeOfDismissal },
    { n: 2, label: 'Industrial Court Case No', text: award.caseNo },
    { n: 3, label: 'Background of the Case', text: award.backgroundOfCase },
    { n: 4, label: 'Claimant Case', text: award.claimantCase },
    { n: 5, label: 'Company Case', text: award.companyCase },
    { n: 6, label: 'Court Findings', text: award.courtFindings },
    { n: 7, label: 'Legal Summary', text: award.legalSummary },
  ];

  return (
    <div className="space-y-6">
      <Link
        href="/awards"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Awards
      </Link>

      {/* Header */}
      <Card>
        <CardContent className="flex flex-col gap-5 p-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-4">
            <span className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:flex">
              <Scale className="h-7 w-7" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap gap-1.5">
                {index.map((t) => (
                  <Badge key={t} variant="secondary">
                    {t}
                  </Badge>
                ))}
                {misconduct.map((m) => (
                  <Badge key={m} variant="outline" className="text-muted-foreground">
                    {m}
                  </Badge>
                ))}
              </div>
              <h1 className="mt-3 text-xl font-bold tracking-tight text-foreground lg:text-2xl">
                {award.title}
              </h1>
              <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                <span>
                  Award Date{' '}
                  <span className="font-medium text-foreground">
                    {formatDate(award.awardDate)}
                  </span>
                </span>
                <span className="text-border">·</span>
                <span>
                  Court <span className="font-medium text-foreground">{award.court}</span>
                </span>
                <span className="text-border">·</span>
                <span>
                  Case <span className="font-medium text-foreground">{award.caseNo}</span>
                </span>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" size="sm">
              <Bookmark className="h-4 w-4" /> Save
            </Button>
          </div>
        </CardContent>
      </Card>

      <Disclaimer />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column — the seven compilation headings, in order */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardContent className="divide-y divide-border p-0">
              {SEVEN_HEADINGS.map((h) => (
                <section
                  key={h.n}
                  className="grid gap-1 px-6 py-5 sm:grid-cols-[240px_1fr] sm:gap-6"
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                      {String(h.n).padStart(2, '0')}
                    </p>
                    <h3 className="mt-1 text-sm font-semibold text-foreground">{h.label}</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/90">
                    {h.text || <span className="italic text-muted-foreground">Not recorded</span>}
                  </p>
                </section>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Award details</CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border text-sm">
              <DetailRow label="Industry">{award.industry}</DetailRow>
              <DetailRow label="Employment Level">{award.employmentLevel}</DetailRow>
              <DetailRow label="Representation">{award.representation}</DetailRow>
              <DetailRow label="Outcome">
                <Badge variant={outcomeVariant(award.outcome)}>{award.outcome}</Badge>
              </DetailRow>
              <DetailRow label="Judgment">
                <Button variant="outline" size="sm" asChild>
                  <a href={award.judgmentUrl} target="_blank" rel="noopener noreferrer">
                    <FileText className="h-4 w-4" /> Open PDF
                  </a>
                </Button>
              </DetailRow>
            </CardContent>
          </Card>

          <Card className="border-primary/30 bg-primary/[0.03]">
            <CardHeader>
              <CardTitle className="text-base">Need tailored advice?</CardTitle>
              <CardDescription>
                Talk to our IR consultants for guidance on how this applies to your situation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <MessageSquare className="h-4 w-4" /> Talk to a consultant
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Related awards */}
      {related.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-foreground">Related awards</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <Link
                key={r.id}
                href={`/awards/${r.id}`}
                className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <Card className="h-full transition-all hover:border-primary/40 hover:shadow-md">
                  <CardContent className="p-5">
                    <div className="flex flex-wrap gap-1.5">
                      {r.terminationIndex.slice(0, 2).map((t) => (
                        <Badge key={t} variant="outline">
                          {t}
                        </Badge>
                      ))}
                    </div>
                    <h3 className="mt-3 line-clamp-2 text-sm font-semibold text-foreground group-hover:text-primary">
                      {r.title}
                    </h3>
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Scale className="h-3.5 w-3.5 shrink-0" />
                      {r.court} · {formatDate(r.awardDate)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
