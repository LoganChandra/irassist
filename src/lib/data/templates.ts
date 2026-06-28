import type { Template } from '@/lib/types';

export const TEMPLATES: Template[] = [
  {
    id: 'tpl-sc-absence',
    name: 'Show Cause — Absenteeism',
    category: 'Show Cause Letters',
    description: 'Show cause letter for unexplained or repeated absence from work.',
  },
  {
    id: 'tpl-sc-misconduct',
    name: 'Show Cause — Misconduct',
    category: 'Show Cause Letters',
    description: 'Show cause letter for an allegation of misconduct.',
  },
  {
    id: 'tpl-sc-performance',
    name: 'Show Cause — Poor Performance',
    category: 'Show Cause Letters',
    description: 'Show cause letter addressing sustained underperformance.',
  },
  {
    id: 'tpl-warn-first',
    name: 'First Warning Letter',
    category: 'Warning Letters',
    description: 'General first written warning for a substantiated issue.',
  },
  {
    id: 'tpl-warn-final',
    name: 'Final Warning Letter',
    category: 'Warning Letters',
    description: 'Final written warning before further disciplinary action.',
  },
  {
    id: 'tpl-warn-policy',
    name: 'Policy Violation Warning',
    category: 'Warning Letters',
    description: 'Warning letter for breach of a specific company policy.',
  },
  {
    id: 'tpl-susp-interim',
    name: 'Interim Suspension Letter',
    category: 'Suspension Letters',
    description: 'Suspension on full pay pending the outcome of an investigation.',
  },
  {
    id: 'tpl-term-misconduct',
    name: 'Termination — Misconduct',
    category: 'Termination Letters',
    description: 'Termination letter following a domestic inquiry finding of misconduct.',
  },
  {
    id: 'tpl-di-notice',
    name: 'Notice of Domestic Inquiry',
    category: 'Domestic Inquiry',
    description: 'Notice convening a domestic inquiry with charge particulars.',
  },
  {
    id: 'tpl-di-charge',
    name: 'Charge Sheet',
    category: 'Domestic Inquiry',
    description: 'Formal charge sheet setting out the alleged misconduct.',
  },
  {
    id: 'tpl-pip-plan',
    name: 'Performance Improvement Plan',
    category: 'PIP Templates',
    description: '60-day PIP with measurable goals and review checkpoints.',
  },
  {
    id: 'tpl-pip-review',
    name: 'PIP Review Record',
    category: 'PIP Templates',
    description: 'Weekly PIP review record to document progress.',
  },
  {
    id: 'tpl-policy-attendance',
    name: 'Attendance Policy',
    category: 'Policies',
    description: 'Model attendance and punctuality policy.',
  },
  {
    id: 'tpl-form-incident',
    name: 'Incident Report Form',
    category: 'Forms',
    description: 'Standard incident report form for first-line managers.',
  },
];
