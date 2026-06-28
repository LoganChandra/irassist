'use client';

import { useMemo, useState } from 'react';
import {
  Search,
  SearchX,
  Files,
  FileWarning,
  AlertTriangle,
  PauseCircle,
  FileX,
  Gavel,
  TrendingUp,
  ScrollText,
  ClipboardList,
  FileText,
  Eye,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Disclaimer } from '@/components/ui/disclaimer';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { Template, TemplateCategory } from '@/lib/types';

const ALL = 'all' as const;

// Canonical display order for the eight template categories.
const CATEGORY_ORDER: TemplateCategory[] = [
  'Show Cause Letters',
  'Warning Letters',
  'Suspension Letters',
  'Termination Letters',
  'Domestic Inquiry',
  'PIP Templates',
  'Policies',
  'Forms',
];

const CATEGORY_ICON: Record<TemplateCategory, LucideIcon> = {
  'Show Cause Letters': FileWarning,
  'Warning Letters': AlertTriangle,
  'Suspension Letters': PauseCircle,
  'Termination Letters': FileX,
  'Domestic Inquiry': Gavel,
  'PIP Templates': TrendingUp,
  Policies: ScrollText,
  Forms: ClipboardList,
};

interface CategoryCount {
  category: string;
  count: number;
}

export function TemplatesView({
  templates,
  categories,
}: {
  templates: Template[];
  categories: CategoryCount[];
}) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<TemplateCategory | typeof ALL>(ALL);
  const [preview, setPreview] = useState<Template | null>(null);

  // Stable, total counts per category (independent of the search query).
  const countFor = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of categories) map.set(c.category, c.count);
    return map;
  }, [categories]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return templates.filter((t) => {
      const matchesQuery =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q);
      const matchesCategory = active === ALL || t.category === active;
      return matchesQuery && matchesCategory;
    });
  }, [templates, query, active]);

  // Group the visible templates by category, preserving canonical order.
  const groups = useMemo(
    () =>
      CATEGORY_ORDER.map((category) => ({
        category,
        items: filtered.filter((t) => t.category === category),
      })).filter((group) => group.items.length > 0),
    [filtered]
  );

  const railItems: { key: TemplateCategory | typeof ALL; label: string; count: number; icon: LucideIcon }[] =
    [
      { key: ALL, label: 'All Templates', count: templates.length, icon: Files },
      ...CATEGORY_ORDER.map((category) => ({
        key: category,
        label: category,
        count: countFor.get(category) ?? 0,
        icon: CATEGORY_ICON[category],
      })),
    ];

  const PreviewIcon = preview ? CATEGORY_ICON[preview.category] : FileText;

  function resetFilters() {
    setQuery('');
    setActive(ALL);
  }

  return (
    <div className="space-y-6">
      {/* Toolbar: search + result count */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search templates…"
            aria-label="Search templates"
            className="h-9 w-full rounded-md border border-input bg-card pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{filtered.length}</span> of{' '}
          {templates.length} templates
        </p>
      </div>

      <div className="lg:flex lg:items-start lg:gap-6">
        {/* Category rail (lg and up) */}
        <aside className="hidden lg:block lg:w-56 lg:shrink-0">
          <div className="sticky top-20 space-y-1">
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Categories
            </p>
            {railItems.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setActive(item.key)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-[18px] w-[18px] shrink-0',
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    )}
                  />
                  <span className="flex-1 truncate text-left">{item.label}</span>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
                      isActive
                        ? 'bg-primary/15 text-primary'
                        : 'bg-secondary text-muted-foreground'
                    )}
                  >
                    {item.count}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="min-w-0 flex-1 space-y-8">
          {/* Category chips (below lg) */}
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-thin lg:hidden">
            {railItems.map((item) => {
              const isActive = active === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setActive(item.key)}
                  className={cn(
                    'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                    isActive
                      ? 'border-primary/30 bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )}
                >
                  {item.label}
                  <span
                    className={cn(
                      'rounded-full px-1.5 text-[11px] font-semibold tabular-nums',
                      isActive ? 'bg-primary/15' : 'bg-secondary'
                    )}
                  >
                    {item.count}
                  </span>
                </button>
              );
            })}
          </div>

          {groups.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No templates found"
              description="Nothing matches your search in this category. Try a different keyword or clear the filters."
            >
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Clear filters
              </Button>
            </EmptyState>
          ) : (
            groups.map((group) => {
              const Icon = CATEGORY_ICON[group.category];
              return (
                <section key={group.category} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <h2 className="text-sm font-semibold text-foreground">{group.category}</h2>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
                      {group.items.length}
                    </span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {group.items.map((template) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        onPreview={() => setPreview(template)}
                      />
                    ))}
                  </div>
                </section>
              );
            })
          )}
        </div>
      </div>

      {/* Preview dialog */}
      <Dialog
        open={preview !== null}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
      >
        <DialogContent className="max-w-xl">
          {preview && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <PreviewIcon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <DialogTitle>{preview.name}</DialogTitle>
                    <DialogDescription className="mt-1">{preview.category}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <p className="text-sm leading-relaxed text-muted-foreground">
                {preview.description}
              </p>

              {/* Faux letter preview — clearly a placeholder layout */}
              <div className="rounded-lg border border-border bg-secondary/30 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    [ Company letterhead ]
                  </span>
                  <span className="text-[11px] text-muted-foreground">[ Date ]</span>
                </div>
                <div className="space-y-2.5">
                  <div className="h-2.5 w-2/5 rounded bg-muted-foreground/25" />
                  <div className="h-2.5 w-11/12 rounded bg-muted-foreground/15" />
                  <div className="h-2.5 w-full rounded bg-muted-foreground/15" />
                  <div className="h-2.5 w-10/12 rounded bg-muted-foreground/15" />
                  <div className="h-2.5 w-1/2 rounded bg-muted-foreground/15" />
                  <div className="mt-5 h-2.5 w-1/4 rounded bg-muted-foreground/25" />
                </div>
              </div>

              <Disclaimer>
                <span className="font-medium text-foreground">Sample layout only.</span> Use the
                template to populate it with your case details, then review every clause against
                current Malaysian employment law before sending.
              </Disclaimer>

              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Close</Button>
                </DialogClose>
                <Button>
                  <FileText className="h-4 w-4" /> Use Template
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TemplateCard({
  template,
  onPreview,
}: {
  template: Template;
  onPreview: () => void;
}) {
  const Icon = CATEGORY_ICON[template.category];
  return (
    <Card className="group flex h-full flex-col p-5 transition-all hover:border-primary/40 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          <Icon className="h-5 w-5" />
        </span>
        <Badge variant="secondary">{template.category}</Badge>
      </div>
      <h3 className="mt-4 text-sm font-semibold text-foreground">{template.name}</h3>
      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
        {template.description}
      </p>
      <div className="mt-auto flex flex-wrap gap-2 pt-4">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 basis-28"
          onClick={onPreview}
        >
          <Eye className="h-4 w-4" /> Preview
        </Button>
        <Button size="sm" className="flex-1 basis-28">
          Use Template
        </Button>
      </div>
    </Card>
  );
}
