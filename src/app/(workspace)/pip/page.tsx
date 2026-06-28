import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/page-header';
import { CasesView } from '@/components/workspace/cases-view';
import { getCasesByStatus } from '@/lib/data';

export const metadata: Metadata = { title: 'PIP' };

export default function PipPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Performance Improvement Plans"
        description="Employees on a structured PIP with review checkpoints."
      />
      <CasesView cases={getCasesByStatus('PIP')} />
    </div>
  );
}
