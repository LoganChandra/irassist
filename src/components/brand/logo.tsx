import { Scale } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  /** 'dark' for use on the navy sidebar, 'light' for light surfaces. */
  variant?: 'light' | 'dark';
  withWordmark?: boolean;
  withTagline?: boolean;
  className?: string;
}

export function Logo({
  variant = 'light',
  withWordmark = true,
  withTagline = false,
  className,
}: LogoProps) {
  const onDark = variant === 'dark';
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-lg shadow-sm',
          onDark ? 'bg-primary text-primary-foreground' : 'bg-primary text-primary-foreground'
        )}
      >
        <Scale className="h-5 w-5" strokeWidth={2.25} />
      </span>
      {withWordmark && (
        <span className="flex flex-col leading-tight">
          <span
            className={cn(
              'text-[15px] font-bold tracking-tight',
              onDark ? 'text-white' : 'text-brand-deep'
            )}
          >
            IR Assist
          </span>
          {withTagline && (
            <span
              className={cn(
                'text-[10px] font-medium uppercase tracking-wider',
                onDark ? 'text-sidebar-muted' : 'text-muted-foreground'
              )}
            >
              Industrial Relations Assistant
            </span>
          )}
        </span>
      )}
    </div>
  );
}
