import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/page-header';
import { CasesView } from '@/components/workspace/cases-view';
import { getCases } from '@/lib/data/db';

export const metadata: Metadata = { title: 'Investigation' };

export default async function InvestigationPage() {
  const cases = (await getCases()).filter((c) => c.status === 'Investigation');
  return (
    <div className="space-y-6">
      <PageHeader
        title="Investigation"
        description="Open investigations and domestic inquiries gathering evidence."
      />
      <CasesView cases={cases} />
    </div>
  );
}
