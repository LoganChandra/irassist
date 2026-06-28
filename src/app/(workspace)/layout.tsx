import { Logo } from '@/components/brand/logo';
import { SidebarNav } from '@/components/workspace/sidebar-nav';
import { Topbar } from '@/components/workspace/topbar';
import { isDemoMode } from '@/lib/env';

export default function WorkspaceLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-sidebar md:flex">
        <div className="flex h-16 items-center border-b border-sidebar-border px-5">
          <Logo variant="dark" withTagline />
        </div>
        <SidebarNav />
        {isDemoMode() && (
          <div className="border-t border-sidebar-border px-4 py-3">
            <p className="text-[11px] leading-snug text-sidebar-muted">
              <span className="font-semibold text-sidebar-foreground">Demo mode</span> · seeded
              data, no sign-in required.
            </p>
          </div>
        )}
      </aside>

      {/* Main column */}
      <div className="flex min-h-screen flex-1 flex-col md:pl-64">
        <Topbar />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto w-full max-w-7xl animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
