import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/page-header';
import { CasesView } from '@/components/workspace/cases-view';
import { getCases } from '@/lib/data/db';

export const metadata: Metadata = { title: 'PIP' };

export default async function PipPage() {
  const cases = (await getCases()).filter((c) => c.status === 'PIP');
  return (
    <div className="space-y-6">
      <PageHeader
        title="Performance Improvement Plans"
        description="Employees on a structured PIP with review checkpoints."
      />
      <CasesView cases={cases} />
    </div>
  );
}
