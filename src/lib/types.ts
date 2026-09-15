// ── Domain model for the IR Assist caseload workspace ────────────────────

export type CaseStatus = 'Open' | 'Investigation' | 'PIP' | 'Closed';

export type IssueType =
  | 'Absenteeism'
  | 'Misconduct'
  | 'Performance Issue'
  | 'Insubordination'
  | 'Harassment'
  | 'Policy Violation'
  | 'Attendance'
  | 'Dishonesty';

export type TimelineState = 'done' | 'pending';

export interface TimelineEvent {
  label: string;
  date: string | null; // ISO date, or null when not yet scheduled
  state: TimelineState;
}

export interface CaseDocument {
  name: string;
  date: string; // ISO
  type: 'pdf' | 'docx' | 'form';
}

export interface IRCase {
  id: string; // e.g. "IR-2026-001"
  employeeName: string;
  employeeId: string; // e.g. "EMP00123"
  department: string;
  role: string;
  issue: string; // human description
  issueType: IssueType;
  status: CaseStatus;
  dateOpened: string; // ISO
  details: string;
  nextAction: string | null;
  nextActionDate: string | null; // ISO
  timeline: TimelineEvent[];
  documents: CaseDocument[];
}

export interface Hearing {
  caseId: string;
  employeeName: string;
  date: string; // ISO
  time: string; // "14:30"
}

// ── Industrial Court awards (research module) ────────────────────────────
// Every award is classified against the Termination Index (see
// src/lib/data/termination-index.ts) and its detail view renders the seven
// compilation headings in fixed order:
//   1. TYPE OF DISMISSAL
//   2. INDUSTRIAL COURT CASE NO
//   3. BACKGROUND OF THE CASE
//   4. CLAIMANT CASE
//   5. COMPANY CASE
//   6. COURT FINDINGS
//   7. LEGAL SUMMARY

import type { MisconductType, TerminationIndex } from '@/lib/data/termination-index';

export interface Award {
  id: string;
  title: string; // "G4S Security Services (M) Sdn Bhd v R. Suresh"
  terminationIndex: TerminationIndex[]; // ≥1 entry from the fixed index
  misconductTypes?: MisconductType[]; // required for Misconduct awards
  awardDate: string; // ISO
  court: string; // "Kuala Lumpur"
  caseNo: string; // "I.C. No. 588/2022"  (heading 2)
  industry: string;
  employmentLevel: string;
  representation: string;
  outcome: string;
  // ── the seven compilation headings ────────────────────────────────────
  typeOfDismissal: string;      // 1. TYPE OF DISMISSAL
  backgroundOfCase: string;     // 3. BACKGROUND OF THE CASE
  claimantCase: string;         // 4. CLAIMANT CASE
  companyCase: string;          // 5. COMPANY CASE
  courtFindings: string;        // 6. COURT FINDINGS
  legalSummary: string;         // 7. LEGAL SUMMARY
  // derived/auxiliary prose kept for search + related-award cards
  summary: string;
  keyTakeaways: string[];
  principles: string[];
  judgmentUrl: string;
}

// ── Templates ────────────────────────────────────────────────────────────

export type TemplateCategory =
  | 'Show Cause Letters'
  | 'Warning Letters'
  | 'Suspension Letters'
  | 'Termination Letters'
  | 'Domestic Inquiry'
  | 'PIP Templates'
  | 'Policies'
  | 'Forms';

export interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
}

// ── Dashboard summary ────────────────────────────────────────────────────

export interface DashboardStat {
  label: string;
  value: number;
  hint: string;
}
