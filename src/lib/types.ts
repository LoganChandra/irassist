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

export interface Award {
  id: string;
  title: string; // "G4S Security Services (M) Sdn Bhd v R. Suresh"
  topics: IssueType[] | string[];
  awardDate: string; // ISO
  court: string; // "Kuala Lumpur"
  caseNo: string; // "I.C. No. 588/2022"
  industry: string;
  employmentLevel: string;
  representation: string;
  outcome: string;
  summary: string;
  facts: string;
  issues: string;
  decision: string;
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
