import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Honest, visible disclaimer. IR Assist gives reference & drafting assistance —
 * not legal advice — and the seeded awards are illustrative samples.
 */
export function Disclaimer({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-start gap-2.5 rounded-lg border border-warning/30 bg-warning/10 px-3.5 py-2.5 text-xs text-foreground',
        className
      )}
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
      <p className="leading-relaxed text-muted-foreground">
        {children ?? (
          <>
            <span className="font-medium text-foreground">Reference &amp; drafting assistance,
            not legal advice.</span>{' '}
            Sample awards shown are illustrative examples for demonstration, not verified
            citations. Verify any guidance with a qualified Malaysian IR practitioner.
          </>
        )}
      </p>
    </div>
  );
}
