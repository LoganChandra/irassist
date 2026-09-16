import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Disclaimer } from '@/components/ui/disclaimer';
import { searchAwards, awardsFacets } from '@/lib/data/awards-search';
import { AwardsSearch } from './awards-search';

export const metadata: Metadata = { title: 'Search Awards' };

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? '') : (v ?? '');
}

export default async function AwardsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const query = {
    q: first(sp.q),
    topics: first(sp.topics) ? first(sp.topics).split('|').filter(Boolean) : [],
    misconduct: first(sp.misconduct) ? first(sp.misconduct).split('|').filter(Boolean) : [],
    court: first(sp.court) || 'all',
    industry: first(sp.industry) || 'all',
    year: first(sp.year) || 'all',
    sort: (first(sp.sort) === 'relevance' ? 'relevance' : 'date') as 'date' | 'relevance',
    page: Math.max(1, Number(first(sp.page)) || 1),
    pageSize: 20,
  };

  const [result, facets] = await Promise.all([searchAwards(query), awardsFacets()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Search Awards"
        description="The full Malaysian Industrial Court dismissal corpus — every published award, classified against the Termination Index and compiled into the seven research headings."
      />
      <Disclaimer />
      <Suspense fallback={<div className="h-96 animate-pulse rounded-xl border bg-card" />}>
        <AwardsSearch result={result} query={query} facets={facets} />
      </Suspense>
    </div>
  );
}
