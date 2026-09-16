'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Bookmark, SlidersHorizontal, SearchX, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import type { AwardsQuery, AwardsResult } from '@/lib/data/awards-search';
import {
  MISCONDUCT_TYPES,
  TERMINATION_INDEX,
} from '@/lib/data/termination-index';
import { cn, formatDate } from '@/lib/utils';

/** Termination Index facets offered in the filters rail — the fixed index, verbatim. */
const TOPICS: readonly string[] = TERMINATION_INDEX;

interface Props {
  result: AwardsResult;
  query: AwardsQuery;
  facets: { courts: string[]; years: string[] };
}

export function AwardsSearch({ result, query, facets }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(query.q ?? '');
  const [showFilters, setShowFilters] = useState(false);

  // Keep the input in sync when navigation changes the URL (back/forward).
  useEffect(() => setQ(query.q ?? ''), [query.q]);

  function navigate(next: Partial<AwardsQuery>) {
    const merged: AwardsQuery = { ...query, ...next, page: next.page ?? 1 };
    const sp = new URLSearchParams();
    if (merged.q?.trim()) sp.set('q', merged.q.trim());
    if (merged.topics?.length) sp.set('topics', merged.topics.join('|'));
    if (merged.misconduct?.length) sp.set('misconduct', merged.misconduct.join('|'));
    if (merged.court && merged.court !== 'all') sp.set('court', merged.court);
    if (merged.year && merged.year !== 'all') sp.set('year', merged.year);
    if (merged.sort === 'relevance') sp.set('sort', 'relevance');
    if ((merged.page ?? 1) > 1) sp.set('page', String(merged.page));
    startTransition(() => router.push(`/awards?${sp.toString()}`, { scroll: false }));
  }

  const hasActiveFilters =
    (query.topics?.length ?? 0) > 0 ||
    (query.misconduct?.length ?? 0) > 0 ||
    (query.court && query.court !== 'all') ||
    (query.year && query.year !== 'all');

  function toggleTopic(t: string) {
    const cur = query.topics ?? [];
    navigate({ topics: cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t] });
  }
  function toggleMisconduct(m: string) {
    const cur = query.misconduct ?? [];
    navigate({ misconduct: cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m] });
  }
  function clearFilters() {
    navigate({ topics: [], misconduct: [], court: 'all', year: 'all' });
  }

  const slug = (s: string) => 'topic-' + s.toLowerCase().replace(/[^a-z]+/g, '-');

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <Card>
        <CardContent className="space-y-4 p-4 sm:p-5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ q });
            }}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search 8,900+ Industrial Court awards — parties, holdings, keywords…"
                aria-label="Search awards"
                className="h-12 pl-11 text-[15px]"
              />
            </div>
            <Button type="submit" size="lg" className="h-12 px-7" disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Search
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-12 px-4 lg:hidden"
              onClick={() => setShowFilters((s) => !s)}
              aria-expanded={showFilters}
            >
              <SlidersHorizontal className="h-4 w-4" /> Filters
              {hasActiveFilters ? ' ·' : ''}
            </Button>
          </form>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              {result.mode === 'db'
                ? `Live corpus · ${result.total.toLocaleString()} awards`
                : 'Sample corpus (database offline)'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Filters (left) + results (right) */}
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Filters rail */}
        <Card className={cn('h-fit lg:sticky lg:top-6', !showFilters && 'hidden lg:block')}>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
              Filters
            </CardTitle>
            <button
              type="button"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className="text-xs font-medium text-primary transition-colors hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
            >
              Clear all
            </button>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Termination Index
              </p>
              <div className="space-y-2.5">
                {TOPICS.map((t) => (
                  <div key={t} className="flex items-center gap-2.5">
                    <Checkbox
                      id={slug(t)}
                      checked={query.topics?.includes(t)}
                      onCheckedChange={() => toggleTopic(t)}
                    />
                    <Label htmlFor={slug(t)} className="cursor-pointer font-normal text-foreground">
                      {t}
                    </Label>
                  </div>
                ))}
              </div>

              {/* Misconduct sub-types — nested under the Misconduct arm */}
              {query.topics?.includes('Misconduct') && (
                <div className="ml-1 mt-1 space-y-2.5 border-l-2 border-border pl-3">
                  {MISCONDUCT_TYPES.map((m) => (
                    <div key={m} className="flex items-center gap-2.5">
                      <Checkbox
                        id={slug('m-' + m)}
                        checked={query.misconduct?.includes(m)}
                        onCheckedChange={() => toggleMisconduct(m)}
                      />
                      <Label
                        htmlFor={slug('m-' + m)}
                        className="cursor-pointer text-[13px] font-normal text-muted-foreground"
                      >
                        {m}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Court
              </Label>
              <Select value={query.court ?? 'all'} onValueChange={(v) => navigate({ court: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Courts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courts</SelectItem>
                  {facets.courts.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Year
              </Label>
              <Select value={query.year ?? 'all'} onValueChange={(v) => navigate({ year: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {facets.years.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="min-w-0 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              <span className="font-semibold text-foreground">{result.total.toLocaleString()}</span>{' '}
              {result.total === 1 ? 'award' : 'awards'}
              {pending && <Loader2 className="ml-2 inline h-3.5 w-3.5 animate-spin" />}
            </p>
            <div className="flex items-center gap-2">
              <span className="hidden text-xs text-muted-foreground sm:inline">Sort by</span>
              <Select
                value={query.sort ?? 'date'}
                onValueChange={(v) => navigate({ sort: v as 'date' | 'relevance' })}
              >
                <SelectTrigger className="h-9 w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Newest first</SelectItem>
                  <SelectItem value="relevance">Relevance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {result.awards.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No awards match your search"
              description="Try different keywords, or clear the filters to browse the full corpus."
            >
              {(hasActiveFilters || query.q?.trim()) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setQ('');
                    navigate({ q: '', topics: [], misconduct: [], court: 'all', year: 'all' });
                  }}
                >
                  Reset search
                </Button>
              )}
            </EmptyState>
          ) : (
            <>
              <div className={cn('space-y-4', pending && 'opacity-60')}>
                {result.awards.map((a) => (
                  <Card key={a.id} className="transition-all hover:border-primary/30 hover:shadow-md">
                    <CardContent className="flex gap-4 p-5">
                      <div className="min-w-0 flex-1 space-y-2.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {a.terminationIndex.map((t) => (
                            <Badge key={t} variant="secondary">
                              {t}
                            </Badge>
                          ))}
                          {(a.misconductTypes ?? []).map((m) => (
                            <Badge key={m} variant="outline" className="text-muted-foreground">
                              {m}
                            </Badge>
                          ))}
                        </div>

                        <Link
                          href={`/awards/${encodeURIComponent(a.id)}`}
                          className="block text-[15px] font-semibold leading-snug text-foreground transition-colors hover:text-primary hover:underline"
                        >
                          {a.title}
                        </Link>

                        {(a.summary || a.backgroundOfCase) && (
                          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                            {a.summary || a.backgroundOfCase}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-0.5 text-xs text-muted-foreground">
                          <span>
                            Award Date:{' '}
                            <span className="font-medium text-foreground">
                              {formatDate(a.awardDate)}
                            </span>
                          </span>
                          <span aria-hidden className="text-border">·</span>
                          <span>
                            Court: <span className="font-medium text-foreground">{a.court}</span>
                          </span>
                          <span aria-hidden className="text-border">·</span>
                          <span className="font-mono">{a.caseNo}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end justify-between gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-primary"
                          aria-label="Bookmark this award"
                        >
                          <Bookmark className="h-4 w-4" />
                        </Button>
                        <a
                          href={a.judgmentUrl || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            'hidden whitespace-nowrap text-xs font-medium sm:inline-block',
                            a.judgmentUrl ? 'text-primary hover:underline' : 'text-muted-foreground/50'
                          )}
                        >
                          Source PDF ↗
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {result.totalPages > 1 && (
                <div className="flex items-center justify-between border-t pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={result.page <= 1 || pending}
                    onClick={() => navigate({ page: result.page - 1 })}
                  >
                    ← Previous
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Page <span className="font-semibold text-foreground">{result.page}</span> of{' '}
                    {result.totalPages}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={result.page >= result.totalPages || pending}
                    onClick={() => navigate({ page: result.page + 1 })}
                  >
                    Next →
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
