import type { Award } from '@/lib/types';

/**
 * ILLUSTRATIVE SAMPLE AWARDS — for demonstration of the research module only.
 * These are synthetic examples, NOT verified Industrial Court citations. The
 * UI surfaces a "sample data" disclaimer. Replace with a real, sourced corpus
 * (and citation verification) before any production use.
 */
export const AWARDS: Award[] = [
  {
    id: 'AWD-588-2022',
    title: 'G4S Security Services (M) Sdn Bhd v R. Suresh',
    topics: ['Misconduct', 'Dishonesty'],
    awardDate: '2023-01-12',
    court: 'Kuala Lumpur',
    caseNo: 'I.C. No. 588/2022',
    industry: 'Security Services',
    employmentLevel: 'Non-Executive',
    representation: 'In-person',
    outcome: 'Dismissal upheld',
    summary:
      'The employee was dismissed for alleged misconduct involving dishonesty in relation to the handling of cash collections. The Industrial Court held that the dismissal was fair as the employer had conducted a fair domestic inquiry and the penalty was not excessive in the circumstances.',
    facts:
      'The claimant, a cash-in-transit officer, was found to have under-declared collected cash on two occasions. The company held a domestic inquiry at which the claimant was given an opportunity to be heard.',
    issues:
      'Whether the misconduct was proven on the balance of probabilities and whether dismissal was a proportionate penalty.',
    decision:
      'The Court found the misconduct proven and held that dishonesty going to the root of the trust relationship justified dismissal. The claim was dismissed.',
    keyTakeaways: [
      'Dishonesty and breach of trust is serious misconduct.',
      'A fair domestic inquiry is essential before imposing dismissal.',
      'The penalty of dismissal is within the range of reasonableness.',
    ],
    principles: [
      'Misconduct must be proven on the balance of probabilities.',
      'Proportionality of penalty is assessed against the gravity of the misconduct.',
      'Trust and confidence is central to the employment relationship.',
    ],
    judgmentUrl: '#',
  },
  {
    id: 'AWD-1042-2021',
    title: 'Telekom Malaysia Berhad v Muhammad Faiz bin Azmi',
    topics: ['Misconduct', 'Dishonesty'],
    awardDate: '2021-09-07',
    court: 'Kuala Lumpur',
    caseNo: 'I.C. No. 1042/2021',
    industry: 'Telecommunications',
    employmentLevel: 'Executive',
    representation: 'Counsel',
    outcome: 'Dismissal upheld',
    summary:
      'Employee found guilty of dishonesty in making fraudulent claims. The Court held the dismissal was fair and just.',
    facts:
      'The claimant submitted reimbursement claims supported by fabricated receipts over several months.',
    issues: 'Whether the fraudulent claims were proven and whether dismissal was justified.',
    decision: 'Claim dismissed; dishonesty justified loss of trust and dismissal.',
    keyTakeaways: [
      'Fabrication of claims is dishonesty going to trust.',
      'Quantum of loss is not decisive — the breach of trust is.',
    ],
    principles: [
      'Fraud need not be large to justify dismissal where trust is broken.',
      'The burden remains on the employer to prove the misconduct.',
    ],
    judgmentUrl: '#',
  },
  {
    id: 'AWD-733-2021',
    title: 'Petronas Carigali Sdn Bhd v Mohd Rizal bin Hashim',
    topics: ['Misconduct'],
    awardDate: '2021-03-22',
    court: 'Kuala Lumpur',
    caseNo: 'I.C. No. 733/2021',
    industry: 'Oil & Gas',
    employmentLevel: 'Executive',
    representation: 'Counsel',
    outcome: 'Dismissal upheld',
    summary:
      'Misappropriation of company property and dishonesty constitutes serious misconduct warranting dismissal.',
    facts:
      'The claimant removed company equipment for personal use and gave false explanations when questioned.',
    issues: 'Whether misappropriation was proven and the appropriate penalty.',
    decision: 'Dismissal upheld as a proportionate response to proven misconduct.',
    keyTakeaways: [
      'Misappropriation of company property is serious misconduct.',
      'False explanations aggravate the misconduct.',
    ],
    principles: [
      'Serious misconduct can justify summary dismissal.',
      'Credibility findings are within the Court’s province.',
    ],
    judgmentUrl: '#',
  },
  {
    id: 'AWD-209-2022',
    title: 'Perusahaan Otomobil Kedua Sdn Bhd v Ahmad bin Hassan',
    topics: ['Misconduct', 'Insubordination'],
    awardDate: '2022-08-18',
    court: 'Shah Alam',
    caseNo: 'I.C. No. 209/2022',
    industry: 'Manufacturing',
    employmentLevel: 'Non-Executive',
    representation: 'Union',
    outcome: 'Reinstatement ordered',
    summary:
      'Fair domestic inquiry procedure and employee rights considered. The Court found the inquiry procedurally defective and ordered reinstatement.',
    facts:
      'The claimant was dismissed for insubordination but was not given adequate particulars of the charge before the inquiry.',
    issues: 'Whether the domestic inquiry observed natural justice.',
    decision: 'Dismissal set aside for breach of natural justice; reinstatement with backwages.',
    keyTakeaways: [
      'Particulars of the charge must be given before the inquiry.',
      'Procedural defects can render a dismissal unfair even where misconduct exists.',
    ],
    principles: [
      'Natural justice requires notice and an opportunity to be heard.',
      'Procedural fairness is independent of the substantive merits.',
    ],
    judgmentUrl: '#',
  },
  {
    id: 'AWD-455-2022',
    title: 'Tenaga Nasional Berhad v Kamaruzaman bin Mat Isa',
    topics: ['Performance Issue'],
    awardDate: '2022-05-05',
    court: 'Kuala Lumpur',
    caseNo: 'I.C. No. 455/2022',
    industry: 'Utilities',
    employmentLevel: 'Executive',
    representation: 'Counsel',
    outcome: 'Dismissal upheld',
    summary:
      'Proportionality of penalty and factors considered in a poor-performance dismissal after a documented PIP.',
    facts:
      'The claimant failed to meet performance standards over two review cycles despite a structured PIP and coaching.',
    issues: 'Whether the performance management process was fair and the dismissal proportionate.',
    decision: 'Dismissal upheld; the employer had given a genuine opportunity to improve.',
    keyTakeaways: [
      'A documented PIP with genuine support strengthens a performance dismissal.',
      'The employee must be warned that failure to improve may lead to dismissal.',
    ],
    principles: [
      'Poor performance can be a just cause where fairly managed.',
      'Warnings and a real opportunity to improve are essential.',
    ],
    judgmentUrl: '#',
  },
  {
    id: 'AWD-877-2020',
    title: 'Syarikat Prasarana Negara Berhad v Nordin bin Ahmad',
    topics: ['Attendance', 'Absenteeism'],
    awardDate: '2020-11-14',
    court: 'Kuala Lumpur',
    caseNo: 'I.C. No. 877/2020',
    industry: 'Transportation',
    employmentLevel: 'Non-Executive',
    representation: 'Union',
    outcome: 'Dismissal reduced to warning',
    summary:
      'Habitual absenteeism case where the Court found dismissal excessive given mitigating personal circumstances.',
    facts:
      'The claimant had a record of absences but produced evidence of family medical hardship not weighed by the employer.',
    issues: 'Whether dismissal was proportionate given the mitigating circumstances.',
    decision: 'Penalty reduced; the Court substituted a final warning for dismissal.',
    keyTakeaways: [
      'Mitigating circumstances must be weighed before dismissal.',
      'Progressive discipline is expected for attendance issues.',
    ],
    principles: [
      'Proportionality requires weighing mitigation.',
      'The Court may substitute a lesser penalty.',
    ],
    judgmentUrl: '#',
  },
  {
    id: 'AWD-312-2023',
    title: 'DHL Express (Malaysia) Sdn Bhd v Mohd Hafiz bin Yusof',
    topics: ['Misconduct'],
    awardDate: '2023-07-30',
    court: 'Kuala Lumpur',
    caseNo: 'I.C. No. 312/2023',
    industry: 'Logistics',
    employmentLevel: 'Non-Executive',
    representation: 'In-person',
    outcome: 'Dismissal upheld',
    summary:
      'Theft of consignment items proven; the Court upheld dismissal as proportionate to the gravity of the misconduct.',
    facts: 'CCTV and inventory records established that the claimant removed parcels for resale.',
    issues: 'Whether theft was proven and the penalty proportionate.',
    decision: 'Dismissal upheld.',
    keyTakeaways: [
      'Documentary and CCTV evidence can establish misconduct.',
      'Theft is serious misconduct justifying dismissal.',
    ],
    principles: [
      'The standard of proof is the balance of probabilities.',
      'Objective evidence strengthens the employer’s case.',
    ],
    judgmentUrl: '#',
  },
  {
    id: 'AWD-198-2022',
    title: 'UEM Builders Bhd v Ahmad Termizi bin Abdullah',
    topics: ['Insubordination', 'Misconduct'],
    awardDate: '2022-02-10',
    court: 'Shah Alam',
    caseNo: 'I.C. No. 198/2022',
    industry: 'Construction',
    employmentLevel: 'Executive',
    representation: 'Counsel',
    outcome: 'Dismissal upheld',
    summary:
      'Persistent insubordination and refusal to carry out lawful instructions justified dismissal after warnings.',
    facts:
      'The claimant repeatedly refused site-safety directives and had two prior written warnings.',
    issues: 'Whether the insubordination justified dismissal given prior warnings.',
    decision: 'Dismissal upheld; the employer had followed progressive discipline.',
    keyTakeaways: [
      'Prior warnings support a later dismissal for repeat conduct.',
      'Refusal of lawful, reasonable instructions is misconduct.',
    ],
    principles: [
      'Progressive discipline strengthens a dismissal.',
      'Lawful and reasonable instructions must be obeyed.',
    ],
    judgmentUrl: '#',
  },
];
