import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/page-header';
import { CasesView } from '@/components/workspace/cases-view';
import { getCasesByStatus } from '@/lib/data';

export const metadata: Metadata = { title: 'Investigation' };

export default function InvestigationPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Investigation"
        description="Open investigations and domestic inquiries gathering evidence."
      />
      <CasesView cases={getCasesByStatus('Investigation')} />
    </div>
  );
}
