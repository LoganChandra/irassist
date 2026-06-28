import Link from 'next/link';
import type { Metadata } from 'next';
import {
  Briefcase,
  Clock,
  TrendingUp,
  FileSearch,
  Plus,
  FileText,
  Sparkles,
  ArrowRight,
  CalendarClock,
} from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getProfile, getCases, upcomingHearings } from '@/lib/data/db';
import { dashboardStats, recentCases } from '@/lib/data/compute';
import { formatDate, initials } from '@/lib/utils';

export const metadata: Metadata = { title: 'Dashboard' };

const STAT_ICONS = [Briefcase, Clock, TrendingUp, FileSearch];
const STAT_HREFS = ['/cases', '/cases', '/pip', '/investigation'];

const QUICK_ACTIONS = [
  { label: 'New Case', href: '/cases', icon: Plus },
  { label: 'Show Cause Letter', href: '/templates', icon: FileText },
  { label: 'Create PIP', href: '/pip', icon: TrendingUp },
  { label: 'AI Assistant', href: '/assistant', icon: Sparkles },
];

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default async function DashboardPage() {
  const [profile, cases, hearings] = await Promise.all([
    getProfile(),
    getCases(),
    upcomingHearings(),
  ]);
  const stats = dashboardStats(cases);
  const recent = recentCases(cases, 5);
  const nextHearings = hearings.slice(0, 4);

  return (
    <div className="space-y-7">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {greeting()}, {profile?.name ?? 'there'} 👋
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s what&apos;s happening with your cases today.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <StatCard
            key={s.label}
            label={s.label}
            value={s.value}
            hint={s.hint}
            icon={STAT_ICONS[i]}
            href={STAT_HREFS[i]}
          />
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {QUICK_ACTIONS.map((a) => {
          const Icon = a.icon;
          return (
            <Link
              key={a.label}
              href={a.href}
              className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold text-foreground">{a.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Recent cases + hearings */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Recent Cases</CardTitle>
            <Link
              href="/cases"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-1">
            {recent.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                  <Briefcase className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">No cases yet</p>
                  <p className="text-sm text-muted-foreground">
                    Open your first disciplinary case to get started.
                  </p>
                </div>
                <Link
                  href="/cases"
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4" /> New Case
                </Link>
              </div>
            ) : (
              recent.map((c) => (
                <Link
                  key={c.id}
                  href={`/cases/${c.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-secondary/60"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback>{initials(c.employeeName)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-foreground">
                        {c.employeeName}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {c.id} · {c.issueType}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="hidden text-xs text-muted-foreground sm:block">
                      {formatDate(c.dateOpened)}
                    </span>
                    <StatusBadge status={c.status} />
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Upcoming Hearings</CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            {nextHearings.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No hearings scheduled.
              </p>
            ) : (
              nextHearings.map((h) => (
                <Link
                  key={h.caseId + h.date}
                  href={`/cases/${h.caseId}`}
                  className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-secondary/60"
                >
                  <div className="flex h-11 w-11 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <span className="text-xs font-semibold uppercase">
                      {new Date(h.date).toLocaleDateString('en-GB', { month: 'short' })}
                    </span>
                    <span className="text-base font-bold leading-none">
                      {new Date(h.date).getDate()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-foreground">
                      {h.employeeName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {h.caseId} · {h.time}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
