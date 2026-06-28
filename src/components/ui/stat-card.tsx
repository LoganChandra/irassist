import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: number | string;
  hint?: string;
  icon: LucideIcon;
  iconClassName?: string;
  href?: string;
  delta?: string;
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  iconClassName,
  href,
  delta,
}: StatCardProps) {
  const inner = (
    <Card className="flex items-start gap-4 p-5 transition-shadow hover:shadow-md">
      <span
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary',
          iconClassName
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <div className="text-2xl font-bold tabular-nums text-foreground">{value}</div>
        <div className="text-sm font-medium text-foreground">{label}</div>
        {(hint || delta) && (
          <div className="mt-0.5 text-xs text-muted-foreground">{delta ?? hint}</div>
        )}
      </div>
    </Card>
  );

  return href ? (
    <Link href={href} className="block focus-visible:outline-none">
      {inner}
    </Link>
  ) : (
    inner
  );
}
