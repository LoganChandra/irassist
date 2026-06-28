import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/page-header';
import { CasesView } from '@/components/workspace/cases-view';
import { getCases } from '@/lib/data';

export const metadata: Metadata = { title: 'Cases' };

export default function CasesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Cases" description="Every disciplinary matter, in one place." />
      <CasesView cases={getCases()} />
    </div>
  );
}
