import { Sparkles, FileText, Scale } from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: typeof Scale;
  /** Optional accent hue for the active indicator + icon. */
  tone?: 'blue' | 'gold';
}

export interface NavSection {
  heading?: string;
  items: NavItem[];
}

export const NAV: NavSection[] = [
  {
    heading: 'Knowledge',
    items: [
      { label: 'Awards Data Bank', href: '/awards', icon: Scale, tone: 'gold' },
      { label: 'AI Assistant', href: '/assistant', icon: Sparkles, tone: 'blue' },
      { label: 'Templates', href: '/templates', icon: FileText, tone: 'blue' },
    ],
  },
];
