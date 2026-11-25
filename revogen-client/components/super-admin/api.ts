// Super admin console: API client, shared types and small helpers.
import { API_BASE_URL } from '@/lib/api';
import { getToken } from '@/lib/auth';

export class SaError extends Error {
  constructor(public status: number, public messages: string[]) {
    super(messages.join(' '));
  }
}

/** Call /super-admin/*: adds the token, parses JSON, and turns errors into readable messages. */
export async function sa<T>(path: string, opts: { method?: string; body?: unknown; signal?: AbortSignal } = {}): Promise<T> {
  const token = getToken();
  if (!token) throw new SaError(401, ['Your session has ended. Please sign in again.']);
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/super-admin${path}`, {
      method: opts.method ?? 'GET',
      headers: { Authorization: `Bearer ${token}`, ...(opts.body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal,
    });
  } catch (e) {
    if ((e as Error)?.name === 'AbortError') throw e;
    throw new SaError(0, ['Could not reach the server. Check your connection and try again.']);
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const m = data?.message;
    const messages = Array.isArray(m) ? m.map(String) : [typeof m === 'string' && m ? m : `Request failed (${res.status}).`];
    throw new SaError(res.status, res.status === 401 ? ['Your session has ended. Please sign in again.'] : messages);
  }
  return data as T;
}

export const errorMessages = (e: unknown): string[] =>
  e instanceof SaError ? e.messages : [e instanceof Error ? e.message : 'Something went wrong.'];

export const qs = (params: Record<string, string | number | undefined | null>) => {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') p.set(k, String(v));
  });
  const s = p.toString();
  return s ? `?${s}` : '';
};

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Paged<T> { total: number; page: number; pageSize: number; pages: number; items: T[] }

export type Role = 'USER' | 'ADMIN' | 'SUPER_ADMIN' | 'SUSPENDED';
export const ROLE_META: Record<string, { label: string; tone: string; hint: string }> = {
  USER: { label: 'Candidate', tone: 'sky', hint: 'Takes tests, practises, checks resumes.' },
  ADMIN: { label: 'Recruiter', tone: 'indigo', hint: 'Creates tests, invites candidates, uses credits.' },
  SUPER_ADMIN: { label: 'Super admin', tone: 'dark', hint: 'Full control of users and question banks.' },
  SUSPENDED: { label: 'Suspended', tone: 'rose', hint: 'Cannot sign in.' },
};
export const ASSIGNABLE: Role[] = ['USER', 'ADMIN', 'SUPER_ADMIN'];

export interface UserRow {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: Role;
  roleLabel: string;
  isVerified: boolean;
  provider: string;
  createdAt: string;
  credits: number | null;
  counts: { attempts: number; codingAttempts: number; tests: number; codingTests: number; resumes: number };
}
export interface UsersPage extends Paged<UserRow> { roleCounts: Record<string, number> }

export interface UserDetail extends UserRow {
  updatedAt: string;
  profile: Record<string, unknown> | null;
  attempts: { id: string; score: number; totalQuestions: number; percentage: number; createdAt: string; test: { title: string; isPractice: boolean } }[];
  codingAttempts: { id: string; status: string; percentage: number; riskLevel: string | null; createdAt: string; codingTest: { title: string } }[];
  tests: { id: string; title: string; isPractice: boolean; createdAt: string; _count: { attempts: number; invitations: number } }[];
  codingTests: { id: string; title: string; createdAt: string; _count: { attempts: number; invitations: number } }[];
  transactions: { id: string; type: string; credits: number; balanceAfter: number; description: string; createdAt: string }[];
}

export interface Mcq {
  id: string;
  category: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  createdAt: string;
}

export interface CodingRow {
  id: string;
  title: string;
  slug: string;
  category: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  outputValidator: string;
  languages: string[];
  testCases: number;
  hiddenTestCases: number;
  usedInTests: number;
  submissions: number;
  createdAt: string;
  updatedAt: string;
}

export interface TestCase { id?: string; input: string; expectedOutput: string; explanation?: string | null; isHidden: boolean }
export interface CodingQuestion {
  id: string;
  title: string;
  slug: string;
  category: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  description: string;
  inputFormat: string | null;
  outputFormat: string | null;
  constraints: string | null;
  starterCodes: Record<string, string> | null;
  outputValidator: string;
  floatPrecision: number;
  testCases: TestCase[];
  usedIn: { id: string; title: string }[];
  submissions: number;
  updatedAt: string;
}

export interface Overview {
  users: { total: number; candidates: number; recruiters: number; superAdmins: number; suspended: number; unverified: number; new7: number; new30: number };
  signups: { date: string; count: number }[];
  recentUsers: { id: string; name: string; email: string; role: Role; roleLabel: string; isVerified: boolean; createdAt: string }[];
  content: {
    mcqQuestions: number;
    mcqCategories: { category: string; count: number }[];
    codingQuestions: number;
    codingByDifficulty: Record<string, number>;
    mcqTests: number;
    practiceTests: number;
    codingTests: number;
  };
  activity: { mcqAttempts: number; codingAttempts: number; attempts7: number };
  credits: { wallets: number; outstanding: number };
  coverage: { id: string; title: string; ready: boolean; subjects: { module: string; needed: number; available: number; ok: boolean }[] }[];
}

// ─── Formatting ──────────────────────────────────────────────────────────────

export const fmtDate = (d: string | Date) =>
  new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

export function timeAgo(d: string | Date) {
  const s = Math.round((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const days = Math.round(h / 24);
  if (days < 30) return `${days} d ago`;
  return fmtDate(d);
}

export const initials = (name: string, email: string) =>
  (name?.trim() || email).split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';

export const VALIDATOR_META: Record<string, { label: string; hint: string }> = {
  EXACT: { label: 'Exact', hint: 'Same output line for line. Line endings and trailing spaces are ignored.' },
  IGNORE_ORDER: { label: 'Any order', hint: 'Same lines in any order (or, for one line, the same values in any order).' },
  SET_COMPARE: { label: 'Set', hint: 'Like any order, but repeated values are ignored.' },
  FLOAT_COMPARE: { label: 'Decimals', hint: 'Numbers may differ by up to 10^-precision; words must match exactly.' },
  CUSTOM: { label: 'Lenient', hint: 'Ignores all spacing and letter case.' },
};

export const LANGUAGE_META: { id: string; label: string; monaco: string }[] = [
  { id: 'python', label: 'Python', monaco: 'python' },
  { id: 'javascript', label: 'JavaScript', monaco: 'javascript' },
  { id: 'java', label: 'Java', monaco: 'java' },
  { id: 'cpp', label: 'C++', monaco: 'cpp' },
  { id: 'c', label: 'C', monaco: 'c' },
];
