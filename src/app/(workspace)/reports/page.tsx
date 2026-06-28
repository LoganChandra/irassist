import type { Metadata } from 'next';
import type { LucideIcon } from 'lucide-react';
import {
  Briefcase,
  CheckCircle2,
  FolderOpen,
  FileSearch,
  TrendingUp,
  Timer,
  CalendarDays,
  ChevronDown,
  Download,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Disclaimer } from '@/components/ui/disclaimer';
import { BarChart, DonutChart, LineChart } from '@/components/charts/charts';
import {
  CASES,
  casesByCategory,
  casesByDepartment,
  statusCounts,
} from '@/lib/data';

export const metadata: Metadata = { title: 'Reports' };

// Plausible six-month intake trend. Loosely tracks the seeded caseload, which
// is concentrated in Apr–May, with the current month still in progress.
const MONTHLY_CASES = [4, 5, 6, 7, 5, 3];
const MONTHLY_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

type Kpi = {
  label: string;
  value: number | string;
  icon: LucideIcon;
  iconClassName?: string;
  delta: string;
};

export default function ReportsPage() {
  const counts = statusCounts();
  const statusData = Object.entries(counts).map(([label, value]) => ({ label, value }));

  const kpis: Kpi[] = [
    {
      label: 'Total Cases',
      value: CASES.length,
      icon: Briefcase,
      delta: '+12% from last month',
    },
    {
      label: 'Closed Cases',
      value: counts.Closed,
      icon: CheckCircle2,
      iconClassName: 'bg-success/10 text-success',
      delta: '+1 from last month',
    },
    {
      label: 'Open Cases',
      value: counts.Open,
      icon: FolderOpen,
      delta: '+2 from last month',
    },
    {
      label: 'Investigations',
      value: counts.Investigation,
      icon: FileSearch,
      iconClassName: 'bg-warning/10 text-warning',
      delta: '-1 from last month',
    },
    {
      label: 'PIP Cases',
      value: counts.PIP,
      icon: TrendingUp,
      iconClassName: 'bg-warning/10 text-warning',
      delta: 'Unchanged from last month',
    },
    {
      label: 'Avg. Case Duration',
      value: '18.5 days',
      icon: Timer,
      delta: '-2.3 days vs last month',
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => (
          <StatCard
            key={k.label}
            label={k.label}
            value={k.value}
            icon={k.icon}
            iconClassName={k.iconClassName}
            delta={k.delta}
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
            <LineChart values={MONTHLY_CASES} labels={MONTHLY_LABELS} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cases by Category</CardTitle>
            <CardDescription>Breakdown across disciplinary issue types.</CardDescription>
          </CardHeader>
          <CardContent>
            <DonutChart data={casesByCategory()} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cases by Department</CardTitle>
            <CardDescription>Where matters are being raised.</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart data={casesByDepartment()} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Case Status</CardTitle>
            <CardDescription>Current state of the active caseload.</CardDescription>
          </CardHeader>
          <CardContent>
            <DonutChart data={statusData} />
          </CardContent>
        </Card>
      </div>

      <Disclaimer>
        <span className="font-medium text-foreground">Demo analytics.</span> Figures are computed
        from sample caseload data for illustration only — not a record of real disciplinary
        matters.
      </Disclaimer>
    </div>
  );
}
