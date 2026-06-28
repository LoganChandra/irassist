'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Download, Plus, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { Briefcase } from 'lucide-react';
import type { CaseStatus, IRCase } from '@/lib/types';
import { formatDate, initials } from '@/lib/utils';

const PAGE_SIZE = 8;

export function CasesView({ cases }: { cases: IRCase[] }) {
  const [query, setQuery] = useState('');
  const [dept, setDept] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [page, setPage] = useState(0);

  const departments = useMemo(
    () => Array.from(new Set(cases.map((c) => c.department))).sort(),
    [cases]
  );

  const filtered = useMemo(() => {
    return cases.filter((c) => {
      const q = query.trim().toLowerCase();
      const matchesQ =
        !q ||
        c.employeeName.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.issue.toLowerCase().includes(q);
      const matchesDept = dept === 'all' || c.department === dept;
      const matchesStatus = status === 'all' || c.status === (status as CaseStatus);
      return matchesQ && matchesDept && matchesStatus;
    });
  }, [cases, query, dept, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const rows = filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  function resetPage<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setPage(0);
    };
  }

  return (
    <Card className="overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => resetPage(setQuery)(e.target.value)}
            placeholder="Search by employee name or Case ID"
            className="h-9 w-full rounded-md border border-input bg-card pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={dept} onValueChange={resetPage(setDept)}>
            <SelectTrigger className="h-9 w-[160px]">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={resetPage(setStatus)}>
            <SelectTrigger className="h-9 w-[140px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="Investigation">Investigation</SelectItem>
              <SelectItem value="PIP">PIP</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4" /> New Case
          </Button>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No cases match your filters"
          description="Try clearing the search or changing the department and status filters."
          className="m-4 border-0"
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Case ID</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead className="hidden md:table-cell">Department</TableHead>
              <TableHead className="hidden lg:table-cell">Issue</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Date Opened</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((c) => (
              <TableRow key={c.id} className="cursor-pointer">
                <TableCell className="font-medium text-primary">
                  <Link href={`/cases/${c.id}`}>{c.id}</Link>
                </TableCell>
                <TableCell>
                  <Link href={`/cases/${c.id}`} className="flex items-center gap-2.5">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{initials(c.employeeName)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-foreground">{c.employeeName}</span>
                  </Link>
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
                  {c.department}
                </TableCell>
                <TableCell className="hidden max-w-[220px] truncate text-muted-foreground lg:table-cell">
                  {c.issueType}
                </TableCell>
                <TableCell>
                  <StatusBadge status={c.status} />
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">
                  {formatDate(c.dateOpened)}
                </TableCell>
                <TableCell>
                  <button
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary"
                    aria-label="Actions"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted-foreground">
        <span>
          Showing {rows.length === 0 ? 0 : current * PAGE_SIZE + 1}–
          {current * PAGE_SIZE + rows.length} of {filtered.length} records
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={current === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-2 text-xs">
            {current + 1} / {pageCount}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={current >= pageCount - 1}
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
