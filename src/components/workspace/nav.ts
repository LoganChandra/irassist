import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Briefcase,
  Gavel,
  FileSearch,
  TrendingUp,
  Sparkles,
  FileText,
  Scale,
  Calculator,
  BarChart3,
  Settings,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavSection {
  heading?: string;
  items: NavItem[];
}

export const NAV: NavSection[] = [
  {
    heading: 'Caseload',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Cases', href: '/cases', icon: Briefcase },
      { label: 'Disciplinary', href: '/disciplinary', icon: Gavel },
      { label: 'Investigation', href: '/investigation', icon: FileSearch },
      { label: 'PIP', href: '/pip', icon: TrendingUp },
    ],
  },
  {
    heading: 'Knowledge',
    items: [
      { label: 'AI Assistant', href: '/assistant', icon: Sparkles },
      { label: 'Templates', href: '/templates', icon: FileText },
      { label: 'Search Awards', href: '/awards', icon: Scale },
      { label: 'Tools', href: '/tools', icon: Calculator },
    ],
  },
  {
    heading: 'Insights',
    items: [
      { label: 'Reports', href: '/reports', icon: BarChart3 },
      { label: 'Settings', href: '/settings', icon: Settings },
    ],
  },
];
