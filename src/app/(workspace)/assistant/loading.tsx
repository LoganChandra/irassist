import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2.5">
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      {/* Chat transcript */}
      <div className="space-y-4">
        <div className="flex gap-3">
          <Skeleton className="h-9 w-9 rounded-full shrink-0" />
          <div className="flex-1 space-y-2 rounded-xl border bg-card p-4 elev-sm">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <div className="w-2/3 space-y-2 rounded-xl bg-primary/10 border border-primary/20 p-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </div>

      {/* Composer */}
      <div className="rounded-xl border bg-card p-4 space-y-3 elev-sm">
        <Skeleton className="h-11 w-full" />
        <div className="flex justify-end">
          <Skeleton className="h-10 w-28" />
        </div>
      </div>
    </div>
  );
}
