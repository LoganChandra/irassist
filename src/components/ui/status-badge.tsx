import { Badge, type BadgeProps } from '@/components/ui/badge';
import type { CaseStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

const STATUS_VARIANT: Record<CaseStatus, BadgeProps['variant']> = {
  Open: 'default',
  Investigation: 'warning',
  PIP: 'warning',
  Closed: 'muted',
};

const STATUS_DOT: Record<CaseStatus, string> = {
  Open: 'bg-primary',
  Investigation: 'bg-warning',
  PIP: 'bg-warning',
  Closed: 'bg-muted-foreground',
};

export function StatusBadge({ status, className }: { status: CaseStatus; className?: string }) {
  return (
    <Badge variant={STATUS_VARIANT[status]} className={cn('capitalize', className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOT[status])} />
      {status}
    </Badge>
  );
}
