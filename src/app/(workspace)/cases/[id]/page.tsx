import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  ArrowLeft,
  Pencil,
  FileText,
  Check,
  Clock,
  CalendarPlus,
  FileType,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { getCaseById, getCases } from '@/lib/data/db';
import { relatedCases } from '@/lib/data/compute';
import { formatDate, initials } from '@/lib/utils';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const c = await getCaseById(id);
  return { title: c ? `${c.id} · ${c.employeeName}` : 'Case' };
}

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const c = await getCaseById(id);
  if (!c) notFound();
  const related = relatedCases(await getCases(), c);

  return (
    <div className="space-y-6">
      <Link
        href="/cases"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Cases
      </Link>

      {/* Header */}
      <Card>
        <CardContent className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="text-base">{initials(c.employeeName)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                {c.employeeName}
              </h1>
              <p className="text-sm text-muted-foreground">
                {c.department} Department · {c.role}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
                <span>
                  Employee ID <span className="font-medium text-foreground">{c.employeeId}</span>
                </span>
                <span>
                  Case ID <span className="font-medium text-foreground">{c.id}</span>
                </span>
                <span>
                  Opened{' '}
                  <span className="font-medium text-foreground">{formatDate(c.dateOpened)}</span>
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={c.status} className="mr-1" />
            <Button variant="outline" size="sm">
              <Pencil className="h-4 w-4" /> Edit Case
            </Button>
            <Button size="sm" asChild>
              <Link href="/templates">
                <FileText className="h-4 w-4" /> Generate Letter
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Issue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Badge variant="secondary">{c.issueType}</Badge>
                <p className="mt-3 text-sm font-medium text-foreground">{c.issue}</p>
              </div>
              <Separator />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Details
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {c.details}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Case Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="relative space-y-5 border-l border-border pl-6">
                {c.timeline.map((t) => (
                  <li key={t.label} className="relative">
                    <span
                      className={`absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-card ${
                        t.state === 'done'
                          ? 'bg-success text-success-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {t.state === 'done' ? (
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      ) : (
                        <Clock className="h-3.5 w-3.5" />
                      )}
                    </span>
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-sm font-medium ${
                          t.state === 'done' ? 'text-foreground' : 'text-muted-foreground'
                        }`}
                      >
                        {t.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t.date ? formatDate(t.date) : 'Pending'}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Documents</CardTitle>
              <span className="text-xs text-muted-foreground">{c.documents.length} files</span>
            </CardHeader>
            <CardContent className="space-y-2">
              {c.documents.map((d) => (
                <div
                  key={d.name}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 transition-colors hover:bg-secondary/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <FileType className="h-4 w-4" />
                    </span>
                    <div className="leading-tight">
                      <div className="text-sm font-medium text-foreground">{d.name}</div>
                      <div className="text-xs text-muted-foreground">{formatDate(d.date)}</div>
                    </div>
                  </div>
                  <Badge variant="muted" className="uppercase">
                    {d.type}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {c.nextAction ? (
            <Card className="border-primary/30 bg-primary/[0.03]">
              <CardHeader>
                <CardTitle className="text-base">Next Action</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm font-medium text-foreground">{c.nextAction}</p>
                {c.nextActionDate && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarPlus className="h-4 w-4 text-primary" />
                    Target date{' '}
                    <span className="font-medium text-foreground">
                      {formatDate(c.nextActionDate)}
                    </span>
                  </div>
                )}
                <Button className="w-full">Schedule Hearing</Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Case Closed</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  This case has been resolved. No further action is required.
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Related Cases</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {related.length === 0 && (
                <p className="text-sm text-muted-foreground">No related cases.</p>
              )}
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/cases/${r.id}`}
                  className="flex items-center justify-between rounded-lg px-2 py-2 text-sm transition-colors hover:bg-secondary/60"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-foreground">{r.employeeName}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.id} · {formatDate(r.dateOpened)}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
