import type { Metadata } from 'next';
import type { LucideIcon } from 'lucide-react';
import {
  Briefcase,
  CheckCircle2,
  FolderOpen,
  FileSearch,
  TrendingUp,
  CalendarDays,
  ChevronDown,
  Download,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, DonutChart, LineChart } from '@/components/charts/charts';
import { getCases } from '@/lib/data/db';
import { casesByCategory, casesByDepartment, statusCounts } from '@/lib/data/compute';
import type { IRCase } from '@/lib/types';

export const metadata: Metadata = { title: 'Reports' };

type Kpi = { label: string; value: number | string; icon: LucideIcon; iconClassName?: string };

function monthlyIntake(cases: IRCase[]) {
  const now = new Date();
  const labels: string[] = [];
  const values: number[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(d.toLocaleDateString('en-GB', { month: 'short' }));
    values.push(
      cases.filter((c) => {
        const cd = new Date(c.dateOpened);
        return cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear();
      }).length
    );
  }
  return { labels, values };
}

export default async function ReportsPage() {
  const cases = await getCases();
  const counts = statusCounts(cases);
  const statusData = Object.entries(counts).map(([label, value]) => ({ label, value }));
  const { labels, values } = monthlyIntake(cases);

  const kpis: Kpi[] = [
    { label: 'Total Cases', value: cases.length, icon: Briefcase },
    {
      label: 'Open Cases',
      value: counts.Open,
      icon: FolderOpen,
    },
    {
      label: 'Investigations',
      value: counts.Investigation,
      icon: FileSearch,
      iconClassName: 'bg-warning/10 text-warning',
    },
    {
      label: 'PIP Cases',
      value: counts.PIP,
      icon: TrendingUp,
      iconClassName: 'bg-warning/10 text-warning',
    },
    {
      label: 'Closed Cases',
      value: counts.Closed,
      icon: CheckCircle2,
      iconClassName: 'bg-success/10 text-success',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Caseload analytics and disciplinary trends across your organisation."
      >
        <Button variant="outline" size="sm">
          <CalendarDays className="h-4 w-4" /> This Month
          <ChevronDown className="h-4 w-4 opacity-60" />
        </Button>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4" /> Export
        </Button>
      </PageHeader>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((k) => (
          <StatCard
            key={k.label}
            label={k.label}
            value={k.value}
            icon={k.icon}
            iconClassName={k.iconClassName}
          />
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cases by Month</CardTitle>
            <CardDescription>New cases opened over the last six months.</CardDescription>
          </CardHeader>
          <CardContent>
            <LineChart values={values} labels={labels} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cases by Category</CardTitle>
            <CardDescription>Breakdown across disciplinary issue types.</CardDescription>
          </CardHeader>
          <CardContent>
            {cases.length ? (
              <DonutChart data={casesByCategory(cases)} />
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">No cases yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cases by Department</CardTitle>
            <CardDescription>Where matters are being raised.</CardDescription>
          </CardHeader>
          <CardContent>
            {cases.length ? (
              <BarChart data={casesByDepartment(cases)} />
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">No cases yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Case Status</CardTitle>
            <CardDescription>Current state of the active caseload.</CardDescription>
          </CardHeader>
          <CardContent>
            {cases.length ? (
              <DonutChart data={statusData} />
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">No cases yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
