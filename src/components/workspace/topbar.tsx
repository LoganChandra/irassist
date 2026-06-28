'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, ChevronDown, LogOut, Menu, Search, Settings, User } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { SidebarNav } from './sidebar-nav';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { createClient } from '@/lib/supabase/client';
import { isDemoMode } from '@/lib/env';
import { initials } from '@/lib/utils';

export interface TopbarUser {
  name: string;
  fullName: string;
  role: string;
  email: string;
}

export function Topbar({ user }: { user: TopbarUser }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();

  async function signOut() {
    if (!isDemoMode()) {
      try {
        await createClient().auth.signOut();
      } catch {
        // ignore — still send them to login
      }
    }
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur md:px-6">
      {/* Mobile menu */}
      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogTrigger asChild>
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </DialogTrigger>
        <DialogContent className="left-0 top-0 m-0 h-full max-w-[17rem] translate-x-0 translate-y-0 rounded-none border-y-0 border-l-0 bg-sidebar p-0">
          <DialogTitle className="sr-only">Navigation</DialogTitle>
          <div className="flex h-16 items-center border-b border-sidebar-border px-5">
            <Logo variant="dark" withTagline />
          </div>
          <SidebarNav onNavigate={() => setMobileOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Search */}
      <div className="relative hidden flex-1 sm:block sm:max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search cases, employees, awards…"
          className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        />
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <button
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive ring-2 ring-card" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-secondary">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{initials(user.fullName || user.name)}</AvatarFallback>
              </Avatar>
              <span className="hidden text-left leading-tight sm:block">
                <span className="block text-sm font-medium text-foreground">{user.name}</span>
                <span className="block text-xs text-muted-foreground">{user.role}</span>
              </span>
              <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="font-medium">{user.fullName || user.name}</div>
              <div className="text-xs font-normal text-muted-foreground">{user.email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <User /> Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={signOut}>
              <LogOut /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
