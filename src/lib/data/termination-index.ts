// ── Termination Index — the canonical classification for the awards data
// bank. Mirrors the MP.gov.my full-awards research template verbatim:
//
//   Termination Index
//     MISCONDUCT  (Theft, Fraud, dishonesty / Insubordination / Fighting or
//                  workplace violence / Sexual Harassment / Absenteeism or
//                  habitual lateness)
//     POOR PERFORMANCE
//     BREACH OF CONTRACT/FIDUCIARY DUTY
//     REDUNDANCY/RETRENCHMENT
//     INSUBORDINATION
//     NEGLIGENCE
//     POOR HEALTH/INCAPACITY
//     CONSTRUCTIVE DISMISSAL
//
// Every award in the data bank carries at least one `terminationIndex` entry
// from this list, and Misconduct awards additionally carry the specific
// misconduct type(s). The labels are the source of truth — the UI, search
// facets and filters all render from these constants, never from hand-typed
// strings.

export const TERMINATION_INDEX = [
  'Misconduct',
  'Poor Performance',
  'Breach of Contract/Fiduciary Duty',
  'Redundancy/Retrenchment',
  'Insubordination',
  'Negligence',
  'Poor Health/Incapacity',
  'Constructive Dismissal',
] as const;

export type TerminationIndex = (typeof TERMINATION_INDEX)[number];

export const MISCONDUCT_TYPES = [
  'Theft, Fraud, Dishonesty',
  'Insubordination',
  'Fighting or Workplace Violence',
  'Sexual Harassment',
  'Absenteeism or Habitual Lateness',
] as const;

export type MisconductType = (typeof MISCONDUCT_TYPES)[number];

/** True when the award sits under the Misconduct arm of the index. */
export function isMisconduct(index: TerminationIndex[]): boolean {
  return index.includes('Misconduct');
}