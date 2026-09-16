import { Loader2 } from 'lucide-react';

/**
 * Full-area loading state for route transitions — spinner + label,
 * centered. Used by route-level loading.tsx files.
 */
export function PageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div
      className="flex min-h-[50vh] animate-fade-in flex-col items-center justify-center gap-3"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
