// Shared types and helpers for the candidate coding-test pages (Basic + Pro).
import { getToken } from '@/lib/auth';
import { API_BASE_URL } from '@/lib/api';

export interface TestCase { id: string; input: string; expectedOutput: string; isHidden: boolean }

export interface Question {
  id: string;
  title: string;
  difficulty: string;
  category?: string;
  description: string;
  inputFormat?: string;
  outputFormat?: string;
  constraints?: string;
  starterCodes?: Record<string, string> | null;
  testCases: TestCase[];
  hiddenTestCount?: number;
}

export interface AttemptSubmission {
  questionId: string;
  status: string;
  score: number;
  passedCases: number;
  totalCases: number;
  language: string;
}

export interface Attempt {
  id: string;
  status: string;
  startedAt: string;
  serverNow?: string;
  endsAt?: string;
  remainingSeconds?: number;
  codingTest: {
    title: string;
    description?: string;
    duration: number;
    securityLevel: 'BASIC' | 'PRO' | string;
    questions: { question: Question }[];
  };
  submissions?: AttemptSubmission[];
}

export interface CaseResult {
  testCaseNo: number;
  passed: boolean;
  isHidden?: boolean;
  input?: string;
  expected?: string;
  received?: string;
}

export interface ExecResult {
  kind: 'run' | 'submit';
  success: boolean;
  status: string;
  error?: string | null;
  passedCases: number;
  totalCases: number;
  score?: number;
  results?: CaseResult[];
}

export type QStatus = 'NOT_STARTED' | 'EDITED' | 'PASSED' | 'PARTIAL' | 'FAILED';

/** The five languages the server can run. */
export const LANGUAGES = [
  { id: 'python', label: 'Python', monaco: 'python' },
  { id: 'javascript', label: 'JavaScript', monaco: 'javascript' },
  { id: 'java', label: 'Java', monaco: 'java' },
  { id: 'cpp', label: 'C++', monaco: 'cpp' },
  { id: 'c', label: 'C', monaco: 'c' },
] as const;
export type LangId = (typeof LANGUAGES)[number]['id'];

const LANG_ALIASES: Record<string, LangId> = {
  python: 'python', python3: 'python', py: 'python',
  javascript: 'javascript', js: 'javascript', node: 'javascript',
  java: 'java',
  cpp: 'cpp', 'c++': 'cpp', cplusplus: 'cpp',
  c: 'c',
};

export function starterFor(q: Question, lang: LangId): string {
  const codes = q.starterCodes ?? {};
  for (const [key, code] of Object.entries(codes)) {
    if (LANG_ALIASES[key.toLowerCase().trim()] === lang && typeof code === 'string') return code;
  }
  return '';
}

/** First language this question has starter code for, else Python. */
export function defaultLanguage(q?: Question): LangId {
  if (!q) return 'python';
  for (const l of LANGUAGES) if (starterFor(q, l.id)) return l.id;
  return 'python';
}

export const MAX_WARNINGS = 5;

export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(sec).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

const storeKey = (attemptId: string, qid: string, lang: string) => `ct:${attemptId}:${qid}:${lang}`;
export const codeStore = {
  get(attemptId: string, qid: string, lang: string): string | null {
    try { return localStorage.getItem(storeKey(attemptId, qid, lang)); } catch { return null; }
  },
  set(attemptId: string, qid: string, lang: string, code: string) {
    try { localStorage.setItem(storeKey(attemptId, qid, lang), code); } catch { /* storage full / private mode */ }
  },
  getLang(attemptId: string, qid: string): LangId | null {
    try { return (localStorage.getItem(`ct:${attemptId}:${qid}:lang`) as LangId | null) ?? null; } catch { return null; }
  },
  setLang(attemptId: string, qid: string, lang: LangId) {
    try { localStorage.setItem(`ct:${attemptId}:${qid}:lang`, lang); } catch { /* ignore */ }
  },
};

/** Error with the server's message (Nest returns { message }) and HTTP status. */
export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

/** fetch() against the API with auth, JSON, a timeout, and readable errors. */
export async function api<T = unknown>(path: string, init: RequestInit & { timeoutMs?: number } = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), init.timeoutMs ?? 60_000);
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken() ?? ''}`,
        ...(init.headers ?? {}),
      },
    });
    const text = await res.text();
    const data = text ? (() => { try { return JSON.parse(text); } catch { return null; } })() : null;
    if (!res.ok) {
      const msg = data?.message;
      throw new ApiError(Array.isArray(msg) ? msg.join(', ') : msg || `Request failed (${res.status})`, res.status);
    }
    return data as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if ((err as Error)?.name === 'AbortError') throw new ApiError('The server took too long to respond. Please try again.', 0);
    throw new ApiError('Could not reach the server. Check your internet connection.', 0);
  } finally {
    clearTimeout(timer);
  }
}

export const STATUS_LABEL: Record<QStatus, string> = {
  NOT_STARTED: 'Not started',
  EDITED: 'Not submitted',
  PASSED: 'Passed',
  PARTIAL: 'Partly passed',
  FAILED: 'Failed',
};

export function statusFromSubmission(status: string, passed: number): QStatus {
  if (status === 'PASSED') return 'PASSED';
  if (status === 'PARTIAL' || passed > 0) return 'PARTIAL';
  return 'FAILED';
}
