import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/page-header';
import { Disclaimer } from '@/components/ui/disclaimer';
import { getAwards } from '@/lib/data';
import { AwardsSearch } from './awards-search';

export const metadata: Metadata = { title: 'Search Awards' };

export default function AwardsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Search Awards"
        description="Search a sample corpus of Malaysian Industrial Court awards for precedent and guidance."
      />
      <Disclaimer />
      <AwardsSearch awards={getAwards()} />
    </div>
  );
}
