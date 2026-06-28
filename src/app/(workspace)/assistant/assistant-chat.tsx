'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Sparkles, Send, FileText, HelpCircle, MessageSquarePlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Disclaimer } from '@/components/ui/disclaimer';
import { CURRENT_USER } from '@/lib/data';
import { initials } from '@/lib/utils';

// ── Answer model ───────────────────────────────────────────────────────────
// An assistant reply may carry an intro paragraph, an optional numbered
// procedure, an optional primary call-to-action, and an honest closing note.
interface AssistantAnswer {
  content: string;
  steps?: string[];
  cta?: { label: string; href: string };
  note?: string;
}

interface ChatMessage extends AssistantAnswer {
  id: string;
  role: 'user' | 'assistant';
}

// ── Suggested questions (clickable) ────────────────────────────────────────
const ABSENTEEISM_Q = 'What is the proper procedure for absenteeism?';
const INQUIRY_Q = 'How to conduct a domestic inquiry?';
const MISCONDUCT_Q = 'What are the types of misconduct?';
const SHOW_CAUSE_Q = 'How to draft a show-cause letter?';
const CONSTRUCTIVE_Q = 'What is constructive dismissal?';

const SUGGESTED_QUESTIONS = [
  ABSENTEEISM_Q,
  INQUIRY_Q,
  MISCONDUCT_Q,
  SHOW_CAUSE_Q,
  CONSTRUCTIVE_Q,
];

// ── Canned, grounded answers keyed by question ─────────────────────────────
const CANNED_ANSWERS: Record<string, AssistantAnswer> = {
  [ABSENTEEISM_Q]: {
    content:
      'Unauthorised absence is normally treated as misconduct, but the Industrial Court expects a fair process before any penalty. A defensible sequence is:',
    steps: [
      'Issue a Show Cause Letter',
      'Conduct an investigation and gather evidence',
      'Provide opportunity for the employee to explain',
      'Conduct a hearing if necessary',
      'Make a decision based on findings',
      'Communicate the decision in writing',
    ],
    cta: { label: 'Generate Show Cause Letter', href: '/templates' },
    note: 'Keep dated records at every step — the Court weighs procedural fairness as heavily as the misconduct itself. General reference, not legal advice.',
  },
  [INQUIRY_Q]: {
    content:
      'A domestic inquiry (DI) is an internal hearing that tests allegations of misconduct before any penalty is decided. A typical structure:',
    steps: [
      'Issue a notice of inquiry stating the specific charges, date, time and venue',
      'Appoint an impartial panel — not the complainant or the witnesses',
      'Let the employee attend, be accompanied, and answer each charge',
      'Present evidence and witnesses, and allow the employee to cross-examine',
      'Have the panel make findings of fact on the balance of probabilities',
      'Recommend a penalty proportionate to the misconduct, and minute everything',
    ],
    note: 'The core test is natural justice: the employee must know the case against them and get a fair chance to reply. Verify specifics with a qualified IR practitioner.',
  },
  [MISCONDUCT_Q]: {
    content:
      'Malaysian practice does not fix a closed list, but the Industrial Court has commonly dealt with: dishonesty and breach of trust (theft, fraud, falsifying claims); insubordination and refusing lawful instructions; absenteeism and habitual lateness; negligence or poor performance that rises to misconduct; harassment, threats or violence at the workplace; conflict of interest; and breach of company policy. Whether conduct is treated as minor or major (gross) misconduct drives the penalty — major misconduct can justify dismissal, while minor misconduct usually attracts warnings first.',
    note: 'Severity is judged on the facts and your own handbook. Treat this as a starting point and confirm the categorisation for your case.',
  },
  [SHOW_CAUSE_Q]: {
    content:
      'A show-cause letter asks the employee to explain, in writing, why disciplinary action should not be taken. A solid one usually includes:',
    steps: [
      'The employee’s name, position and the date',
      'A clear, specific account of the alleged misconduct — what, when and where',
      'The rule, policy or contract term said to be breached',
      'A request to reply in writing by a reasonable deadline (commonly 24–48 hours)',
      'A note that a non-reply may lead to a decision on the available facts',
      'The signature of the issuing authority, with a copy kept on file',
    ],
    cta: { label: 'Generate Show Cause Letter', href: '/templates' },
    note: 'Keep the tone neutral and avoid pre-judging guilt — the letter is an invitation to explain, not a verdict.',
  },
  [CONSTRUCTIVE_Q]: {
    content:
      'Constructive dismissal is when an employee resigns because the employer has breached a fundamental term of the contract, and the law treats that resignation as a dismissal. Malaysian courts apply the “contract test”: there must be a significant breach going to the root of the contract (for example a unilateral pay cut, demotion, or being forced out); the employee must resign in response to that breach; and they must not delay so long that they are taken to have accepted it. If made out, the employee can pursue an unfair-dismissal claim — and the burden is on the employee to prove the breach.',
    note: 'These claims turn heavily on the specific facts and timing. Get advice before acting on either side.',
  },
};

const DEFAULT_ANSWER: AssistantAnswer = {
  content:
    'That’s a fair question. IR Assist draws its guidance from patterns in Malaysian Industrial Court awards and common HR practice, so I can give you a plain-English starting point and help you draft the paperwork — but I can’t give a definitive answer for your specific facts. Treat this as reference and drafting help, not legal advice, and verify anything important with a qualified Malaysian IR practitioner before you act.',
};

function findAnswer(text: string): AssistantAnswer {
  const norm = text.trim().toLowerCase();
  const hit = Object.entries(CANNED_ANSWERS).find(([q]) => q.toLowerCase() === norm);
  return hit ? hit[1] : DEFAULT_ANSWER;
}

// Seed the thread with one worked example exchange.
const SEED_MESSAGES: ChatMessage[] = [
  { id: 'seed-user', role: 'user', content: ABSENTEEISM_Q },
  { id: 'seed-assistant', role: 'assistant', ...CANNED_ANSWERS[ABSENTEEISM_Q] },
];

export function AssistantChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(SEED_MESSAGES);
  const [input, setInput] = useState('');
  const turnRef = useRef(0);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  function ask(question: string) {
    const q = question.trim();
    if (!q) return;
    const answer = findAnswer(q);
    turnRef.current += 1;
    const n = turnRef.current;
    setMessages((prev) => [
      ...prev,
      { id: `u-${n}`, role: 'user', content: q },
      { id: `a-${n}`, role: 'assistant', ...answer },
    ]);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    ask(input);
    setInput('');
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Suggested questions */}
      <div className="lg:col-span-1 lg:sticky lg:top-24 lg:self-start">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <HelpCircle className="h-4 w-4 text-primary" />
              Suggested Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => ask(q)}
                className="group flex w-full items-start gap-2.5 rounded-lg border border-border px-3 py-2.5 text-left text-sm transition-colors hover:border-primary/40 hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <MessageSquarePlus className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="font-medium text-foreground">{q}</span>
              </button>
            ))}
            <p className="px-1 pt-1.5 text-xs leading-relaxed text-muted-foreground">
              Pick a question or type your own below. Answers reflect patterns in Industrial
              Court awards — not legal advice.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chat thread */}
      <Card className="flex h-[640px] flex-col lg:col-span-2 lg:h-[720px]">
        <CardHeader className="flex-row items-center gap-3 space-y-0 border-b border-border">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <CardTitle className="text-base">IR Assistant</CardTitle>
            <p className="truncate text-xs text-muted-foreground">
              Plain-English guidance · grounded in Industrial Court awards
            </p>
          </div>
          <Badge variant="muted" className="ml-auto hidden sm:inline-flex">
            Reference only
          </Badge>
        </CardHeader>

        {/* Messages */}
        <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto bg-muted/30 p-4">
          <Disclaimer />
          {messages.map((m) => (
            <MessageRow key={m.id} message={m} />
          ))}
          <div ref={endRef} />
        </div>

        {/* Composer */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 border-t border-border bg-card p-3"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question…"
            aria-label="Ask a question"
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!input.trim()} aria-label="Send message">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </Card>
    </div>
  );
}

// ── A single message bubble ────────────────────────────────────────────────
function MessageRow({ message }: { message: ChatMessage }) {
  if (message.role === 'user') {
    return (
      <div className="flex items-start justify-end gap-2.5">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm leading-relaxed text-primary-foreground shadow-sm">
          {message.content}
        </div>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary text-primary-foreground">
            {initials(CURRENT_USER.name)}
          </AvatarFallback>
        </Avatar>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-start gap-2.5">
      <Avatar className="h-8 w-8">
        <AvatarFallback className="bg-primary/10 text-primary">
          <Sparkles className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="max-w-[85%] space-y-3 rounded-2xl rounded-bl-sm border border-border bg-card px-4 py-3 text-sm leading-relaxed text-foreground shadow-sm">
        <p>{message.content}</p>
        {message.steps && (
          <ol className="list-decimal space-y-1.5 pl-5 marker:font-semibold marker:text-primary">
            {message.steps.map((s) => (
              <li key={s} className="pl-1">
                {s}
              </li>
            ))}
          </ol>
        )}
        {message.cta && (
          <Button asChild size="sm">
            <Link href={message.cta.href}>
              <FileText className="h-4 w-4" />
              {message.cta.label}
            </Link>
          </Button>
        )}
        {message.note && (
          <p className="border-t border-border pt-2.5 text-xs text-muted-foreground">
            {message.note}
          </p>
        )}
      </div>
    </div>
  );
}
