import { createHmac, timingSafeEqual } from 'crypto';

/**
 * A practice "paper" is the exact set of questions served to a candidate for one
 * attempt. It's signed with the server secret and sent back on submit, so the
 * server can grade exactly those questions without storing anything — and a
 * candidate can't swap in questions they happen to know.
 */
export interface PracticePaper {
  /** test id */
  t: string;
  /** user id */
  u: string;
  /** question ids, in the order shown */
  q: string[];
  /** where the questions come from: the shared bank, or questions attached to the test */
  s: 'bank' | 'test';
  /** issued at (ms) */
  i: number;
}

/** A paper is valid for a day — practice is untimed on the server side. */
export const PAPER_TTL_MS = 24 * 60 * 60 * 1000;

const secret = () => {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET is not configured');
  return s;
};

const b64 = (buf: Buffer) => buf.toString('base64url');

export function signPaper(paper: PracticePaper): string {
  const body = b64(Buffer.from(JSON.stringify(paper)));
  const sig = b64(createHmac('sha256', secret()).update(body).digest());
  return `${body}.${sig}`;
}

/** Returns the paper if the signature is valid, otherwise null. */
export function verifyPaper(token: string | undefined | null): PracticePaper | null {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  const expected = createHmac('sha256', secret()).update(body).digest();
  const given = Buffer.from(sig ?? '', 'base64url');
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const paper = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as PracticePaper;
    if (!paper?.t || !paper?.u || !Array.isArray(paper.q) || !paper.i) return null;
    return paper;
  } catch {
    return null;
  }
}

export function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export type OptionLetter = 'A' | 'B' | 'C' | 'D';

/**
 * Is the chosen option correct? correctAnswer is normally the option's text,
 * but some questions store the letter ("B") — accept either.
 */
export function isCorrectChoice(
  q: { optionA: string; optionB: string; optionC: string; optionD: string; correctAnswer: string },
  choice: string | undefined,
): boolean {
  if (!choice) return false;
  const letter = String(choice).trim().toUpperCase() as OptionLetter;
  const text = { A: q.optionA, B: q.optionB, C: q.optionC, D: q.optionD }[letter];
  if (text === undefined) return false;
  const correct = (q.correctAnswer ?? '').trim();
  if (/^[ABCD]$/i.test(correct)) return correct.toUpperCase() === letter;
  return text.trim() === correct;
}

/** The correct option's letter, for showing the answer in a review. */
export function correctLetter(
  q: { optionA: string; optionB: string; optionC: string; optionD: string; correctAnswer: string },
): OptionLetter | null {
  const correct = (q.correctAnswer ?? '').trim();
  if (/^[ABCD]$/i.test(correct)) return correct.toUpperCase() as OptionLetter;
  const opts: [OptionLetter, string][] = [['A', q.optionA], ['B', q.optionB], ['C', q.optionC], ['D', q.optionD]];
  return opts.find(([, t]) => (t ?? '').trim() === correct)?.[0] ?? null;
}
