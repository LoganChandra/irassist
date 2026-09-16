'use client';

import Link, { useLinkStatus } from 'next/link';
import { usePathname } from 'next/navigation';
import { Loader2, Sparkles, FileText, Scale } from 'lucide-react';
import { NAV } from './nav';
import { cn } from '@/lib/utils';

/** A nav link that shows its own spinner while its route is pending. */
function NavLink({ label, href, Icon, tone }: {
  label: string;
  href: string;
  Icon: typeof Scale;
  tone?: 'blue' | 'gold';
}) {
  const pathname = usePathname();
  const { pending } = useLinkStatus();
  const active = pathname === href || pathname.startsWith(href + '/');
  const gold = tone === 'gold';

  return (
    <li>
      <Link
        href={href}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium',
          'transition-all duration-200 ease-out',
          active
            ? 'bg-white/[0.08] text-white shadow-[inset_0_1px_0_hsl(0_0%_100%/0.06),0_4px_12px_hsl(222_47%_5%/0.35)]'
            : 'text-sidebar-foreground hover:bg-white/[0.05] hover:text-white active:scale-[0.98]'
        )}
      >
        {/* Active rail bar */}
        <span
          aria-hidden
          className={cn(
            'nav-active-bar absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full',
            gold ? 'bg-gold' : 'bg-primary',
            active ? 'scale-y-100' : 'scale-y-0'
          )}
        />
        <Icon
          className={cn(
            'h-[18px] w-[18px] shrink-0 transition-colors duration-200',
            active
              ? gold
                ? 'text-gold'
                : 'text-primary'
              : 'text-sidebar-muted group-hover:text-sidebar-foreground'
          )}
          aria-hidden
        />
        <span className="flex-1 truncate">{label}</span>
        {/* Per-link loading spinner — only this link's route shows it */}
        {pending && !active && (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-sidebar-muted" aria-hidden />
        )}
      </Link>
    </li>
  );
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav
      className="flex-1 space-y-6 overflow-y-auto px-4 py-5 scrollbar-thin"
      onClick={onNavigate}
    >
      {NAV.map((section) => (
        <div key={section.heading}>
          {section.heading && (
            <p className="px-3 pb-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-muted">
              {section.heading}
            </p>
          )}
          <ul className="space-y-1">
            {section.items.map((item) => (
              <NavLink
                key={item.href}
                label={item.label}
                href={item.href}
                Icon={item.icon}
                tone={item.tone}
              />
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
