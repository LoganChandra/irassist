import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/page-header';
import { CasesView } from '@/components/workspace/cases-view';
import { getCases } from '@/lib/data/db';

export const metadata: Metadata = { title: 'Cases' };

export default async function CasesPage() {
  const cases = await getCases();
  return (
    <div className="space-y-6">
      <PageHeader title="Cases" description="Every disciplinary matter, in one place." />
      <CasesView cases={cases} />
    </div>
  );
}
