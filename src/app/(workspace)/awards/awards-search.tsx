'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Bookmark, SlidersHorizontal, SearchX } from 'lucide-react';
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
import type { Award } from '@/lib/types';
import { cn, formatDate } from '@/lib/utils';

/** Topic facets offered in the filters rail. */
const TOPICS = [
  'Misconduct',
  'Dishonesty',
  'Performance Issue',
  'Insubordination',
  'Attendance',
  'Absenteeism',
  'Harassment',
  'Policy Violation',
] as const;

/** Quick popular-search chips that seed the query. */
const POPULAR = ['Misconduct', 'Dismissal', 'Attendance', 'Domestic Inquiry', 'Retrenchment'];

type SortKey = 'relevance' | 'date';

const slug = (s: string) => 'topic-' + s.toLowerCase().replace(/\s+/g, '-');

export function AwardsSearch({ awards }: { awards: Award[] }) {
  const [query, setQuery] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [industry, setIndustry] = useState('all');
  const [court, setCourt] = useState('all');
  const [sort, setSort] = useState<SortKey>('relevance');
  const [bookmarked, setBookmarked] = useState<string[]>([]);

  const industries = useMemo(
    () => Array.from(new Set(awards.map((a) => a.industry))).sort(),
    [awards]
  );
  const courts = useMemo(
    () => Array.from(new Set(awards.map((a) => a.court))).sort(),
    [awards]
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = awards.filter((a) => {
      const matchesQuery =
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.topics.some((t) => t.toLowerCase().includes(q));
      const matchesTopics =
        selectedTopics.length === 0 || a.topics.some((t) => selectedTopics.includes(t));
      const matchesIndustry = industry === 'all' || a.industry === industry;
      const matchesCourt = court === 'all' || a.court === court;
      return matchesQuery && matchesTopics && matchesIndustry && matchesCourt;
    });

    const byDate = (a: Award, b: Award) => +new Date(b.awardDate) - +new Date(a.awardDate);

    if (sort === 'date') return [...filtered].sort(byDate);
    if (!q) return filtered;

    const score = (a: Award) => {
      let s = 0;
      if (a.title.toLowerCase().includes(q)) s += 10;
      if (a.topics.some((t) => t.toLowerCase().includes(q))) s += 6;
      if (a.summary.toLowerCase().includes(q)) s += 3;
      return s;
    };
    return [...filtered].sort((a, b) => score(b) - score(a) || byDate(a, b));
  }, [awards, query, selectedTopics, industry, court, sort]);

  const hasActiveFilters =
    selectedTopics.length > 0 || industry !== 'all' || court !== 'all';

  function toggleTopic(t: string) {
    setSelectedTopics((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  function toggleBookmark(id: string) {
    setBookmarked((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function clearFilters() {
    setSelectedTopics([]);
    setIndustry('all');
    setCourt('all');
  }

  return (
    <div className="space-y-6">
      {/* Search bar + popular chips */}
      <Card>
        <CardContent className="space-y-4 p-4 sm:p-5">
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search Industrial Court awards, topics, or keywords…"
                aria-label="Search awards"
                className="h-12 pl-11 text-[15px]"
              />
            </div>
            <Button type="submit" size="lg" className="h-12 px-7 sm:w-auto">
              <Search className="h-4 w-4" /> Search
            </Button>
          </form>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Popular:</span>
            {POPULAR.map((chip) => {
              const active = query.trim().toLowerCase() === chip.toLowerCase();
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setQuery(chip)}
                  aria-pressed={active}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    active
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary'
                  )}
                >
                  {chip}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filters (left) + results (right) */}
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Filters rail */}
        <Card className="h-fit lg:sticky lg:top-6">
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
            {/* Topic checkboxes */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Topic
              </p>
              <div className="space-y-2.5">
                {TOPICS.map((t) => (
                  <div key={t} className="flex items-center gap-2.5">
                    <Checkbox
                      id={slug(t)}
                      checked={selectedTopics.includes(t)}
                      onCheckedChange={() => toggleTopic(t)}
                    />
                    <Label htmlFor={slug(t)} className="cursor-pointer font-normal text-foreground">
                      {t}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Industry */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Industry
              </Label>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger>
                  <SelectValue placeholder="All Industries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Industries</SelectItem>
                  {industries.map((i) => (
                    <SelectItem key={i} value={i}>
                      {i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Court */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Court
              </Label>
              <Select value={court} onValueChange={setCourt}>
                <SelectTrigger>
                  <SelectValue placeholder="All Courts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courts</SelectItem>
                  {courts.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
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
              About <span className="font-semibold text-foreground">{results.length}</span>{' '}
              {results.length === 1 ? 'result' : 'results'} found
            </p>
            <div className="flex items-center gap-2">
              <span className="hidden text-xs text-muted-foreground sm:inline">Sort by</span>
              <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                <SelectTrigger className="h-9 w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="date">Newest first</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {results.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No awards match your search"
              description="Try a different keyword, or clear your filters to see more sample awards."
            >
              {(hasActiveFilters || query.trim()) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    clearFilters();
                    setQuery('');
                  }}
                >
                  Reset search
                </Button>
              )}
            </EmptyState>
          ) : (
            <div className="space-y-4">
              {results.map((a) => {
                const isBookmarked = bookmarked.includes(a.id);
                return (
                  <Card
                    key={a.id}
                    className="transition-all hover:border-primary/30 hover:shadow-md"
                  >
                    <CardContent className="flex gap-4 p-5">
                      <div className="min-w-0 flex-1 space-y-2.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {a.topics.map((t) => (
                            <Badge key={t} variant="secondary">
                              {t}
                            </Badge>
                          ))}
                        </div>

                        <Link
                          href={`/awards/${a.id}`}
                          className="block text-[15px] font-semibold leading-snug text-foreground transition-colors hover:text-primary hover:underline"
                        >
                          {a.title}
                        </Link>

                        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                          {a.summary}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-0.5 text-xs text-muted-foreground">
                          <span>
                            Award Date:{' '}
                            <span className="font-medium text-foreground">
                              {formatDate(a.awardDate)}
                            </span>
                          </span>
                          <span aria-hidden className="text-border">
                            ·
                          </span>
                          <span>
                            Court: <span className="font-medium text-foreground">{a.court}</span>
                          </span>
                          <span aria-hidden className="text-border">
                            ·
                          </span>
                          <span>{a.caseNo}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end justify-between gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-primary"
                          onClick={() => toggleBookmark(a.id)}
                          aria-pressed={isBookmarked}
                          aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark this award'}
                        >
                          <Bookmark
                            className={cn('h-4 w-4', isBookmarked && 'fill-primary text-primary')}
                          />
                        </Button>
                        <Badge
                          variant="outline"
                          className="hidden whitespace-nowrap sm:inline-flex"
                        >
                          {a.outcome}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
