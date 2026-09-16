import { cn } from '@/lib/utils';

/**
 * IR Assist mark — a scales-of-justice glyph set on the brand blue, drawn
 * as SVG so it stays crisp at every size and never depends on icon loading.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      aria-hidden="true"
      className={cn('h-9 w-9', className)}
    >
      <rect width="36" height="36" rx="9" className="fill-[hsl(var(--primary))]" />
      {/* Pillar */}
      <path
        d="M18 8v17"
        stroke="white"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      {/* Beam */}
      <path
        d="M9.5 13h17"
        stroke="white"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      {/* Left pan */}
      <path
        d="M9.5 13l-3.2 6.4a3.6 3.6 0 006.4 0L9.5 13z"
        fill="white"
        fillOpacity="0.92"
      />
      {/* Right pan */}
      <path
        d="M26.5 13l-3.2 6.4a3.6 3.6 0 006.4 0L26.5 13z"
        fill="white"
        fillOpacity="0.92"
      />
      {/* Base */}
      <path
        d="M13.5 27.5h9"
        stroke="white"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

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
      <LogoMark className="shadow-sm" />
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
