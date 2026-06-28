import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/page-header';
import { CasesView } from '@/components/workspace/cases-view';
import { getCases } from '@/lib/data/db';

export const metadata: Metadata = { title: 'Disciplinary' };

export default async function DisciplinaryPage() {
  // The disciplinary track: conduct matters being actioned or resolved
  // (everything outside the Investigation and PIP workflows).
  const cases = (await getCases()).filter((c) => c.status === 'Open' || c.status === 'Closed');
  return (
    <div className="space-y-6">
      <PageHeader
        title="Disciplinary"
        description="Conduct matters moving through show-cause, hearing and decision."
      />
      <CasesView cases={cases} />
    </div>
  );
}
