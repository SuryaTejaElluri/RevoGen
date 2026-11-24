'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  api, ApiError, Attempt, codeStore, defaultLanguage, ExecResult, LangId, MAX_WARNINGS,
  QStatus, Question, starterFor, statusFromSubmission,
} from './lib';

export type Phase = 'loading' | 'error' | 'submitted' | 'gate' | 'running' | 'finishing' | 'done';
export type FinishReason = 'manual' | 'time' | 'warnings';

interface Options {
  attemptId: string;
  mode: 'BASIC' | 'PRO';
  /** Record a security event (Pro adds screenshots). Defaults to POST /security-event. */
  logEvent?: (eventType: string, details?: Record<string, unknown>) => void;
  /** Extra body for the final-submit call (Pro sends proctoring stats). */
  finalSubmitBody?: () => Record<string, unknown>;
  /** Called once the attempt is submitted (stop camera, etc.). */
  onFinished?: () => void;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function useCodingTest({ attemptId, mode, logEvent, finalSubmitBody, onFinished }: Options) {
  const [phase, setPhase] = useState<Phase>('loading');
  const [loadError, setLoadError] = useState('');
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [langs, setLangs] = useState<Record<string, LangId>>({});
  const [code, setCode] = useState<Record<string, string>>({}); // key: `${qid}:${lang}`
  const [statuses, setStatuses] = useState<Record<string, QStatus>>({});
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, ExecResult | null>>({});
  const [busy, setBusy] = useState<'run' | 'submit' | null>(null);
  const [actionError, setActionError] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [warnings, setWarnings] = useState(0);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);
  const [autoSubmitIn, setAutoSubmitIn] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [finishStep, setFinishStep] = useState('');
  const [finishError, setFinishError] = useState('');

  const endsAtRef = useRef(0); // client clock ms when time runs out
  const phaseRef = useRef<Phase>('loading');
  const warningsRef = useRef(0);
  const lastWarnAt = useRef(0);
  const finishingRef = useRef(false);
  const stateRef = useRef({ questions, langs, code, dirty });
  useEffect(() => { stateRef.current = { questions, langs, code, dirty }; }, [questions, langs, code, dirty]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  const record = useCallback((eventType: string, details: Record<string, unknown> = {}) => {
    if (logEvent) { logEvent(eventType, details); return; }
    api(`/coding-attempts/${attemptId}/security-event`, {
      method: 'POST',
      body: JSON.stringify({ eventType, details: { ...details, timestamp: new Date().toISOString() } }),
    }).catch(() => { /* never block the candidate on logging */ });
  }, [attemptId, logEvent]);

  // ── Load ────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    api<Attempt>(`/coding-attempts/${attemptId}`)
      .then((data) => {
        if (cancelled) return;
        if (!data?.codingTest) throw new ApiError('This test could not be found.', 404);
        const qs = data.codingTest.questions.map((q) => q.question);
        setAttempt(data);
        setQuestions(qs);

        const remaining = typeof data.remainingSeconds === 'number'
          ? data.remainingSeconds
          : Math.max(0, data.codingTest.duration * 60 - (Date.now() - new Date(data.startedAt).getTime()) / 1000);
        endsAtRef.current = Date.now() + remaining * 1000;
        setTimeLeft(Math.round(remaining));

        // Latest server submission per question → starting status.
        const latest = new Map<string, { status: string; passedCases: number }>();
        (data.submissions ?? []).forEach((s) => { if (!latest.has(s.questionId)) latest.set(s.questionId, s); });

        const l: Record<string, LangId> = {};
        const c: Record<string, string> = {};
        const st: Record<string, QStatus> = {};
        const d: Record<string, boolean> = {};
        qs.forEach((q) => {
          const lang = codeStore.getLang(attemptId, q.id) ?? defaultLanguage(q);
          l[q.id] = lang;
          const saved = codeStore.get(attemptId, q.id, lang);
          c[`${q.id}:${lang}`] = saved ?? starterFor(q, lang);
          const sub = latest.get(q.id);
          st[q.id] = sub ? statusFromSubmission(sub.status, sub.passedCases) : saved && saved !== starterFor(q, lang) ? 'EDITED' : 'NOT_STARTED';
          d[q.id] = !sub && !!saved && saved !== starterFor(q, lang);
        });
        setLangs(l); setCode(c); setStatuses(st); setDirty(d);
        setPhase(data.status === 'COMPLETED' ? 'submitted' : 'gate');
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setLoadError(err.message || 'Failed to load the test.');
        setPhase('error');
      });
    return () => { cancelled = true; };
  }, [attemptId]);

  // ── Finish (manual, time up, or too many warnings) ───────────────────────
  const finish = useCallback(async (reason: FinishReason) => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    setPhase('finishing');
    setFinishError('');
    setWarningMsg(null);

    // 1. Submit the latest code of every question that changed since its last submit.
    const { questions: qs, langs: l, code: c, dirty: d } = stateRef.current;
    const pending = qs.filter((q) => d[q.id]);
    for (const [i, q] of pending.entries()) {
      setFinishStep(`Submitting your latest code (${i + 1} of ${pending.length})…`);
      const lang = l[q.id];
      const src = c[`${q.id}:${lang}`] ?? '';
      if (!src.trim()) continue;
      try {
        const r = await api<{ status: string; scoreStatus?: string; passedCases: number }>('/coding-submissions/submit', {
          method: 'POST',
          body: JSON.stringify({ attemptId, questionId: q.id, language: lang, sourceCode: src }),
          timeoutMs: 90_000,
        });
        setDirty((p) => ({ ...p, [q.id]: false }));
        setStatuses((p) => ({ ...p, [q.id]: statusFromSubmission(r.scoreStatus ?? r.status, r.passedCases) }));
      } catch { /* keep going — the final submit matters most */ }
    }

    // 2. Final submit, with retries for flaky connections.
    setFinishStep('Sending your test to the recruiter…');
    const path = `/coding-attempts/${attemptId}/${mode === 'PRO' ? 'pro' : 'basic'}/final-submit`;
    let lastErr = '';
    for (let tryNo = 1; tryNo <= 4; tryNo++) {
      try {
        await api(path, {
          method: 'POST',
          body: JSON.stringify({ reason, ...(finalSubmitBody?.() ?? {}) }),
          timeoutMs: 30_000,
        });
        setPhase('done');
        onFinished?.();
        if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
        return;
      } catch (err) {
        lastErr = (err as Error).message;
        if (err instanceof ApiError && err.status >= 400 && err.status < 500) break; // not retryable
        setFinishStep(`Connection problem. Retrying (${tryNo} of 3)…`);
        await sleep(1500 * tryNo);
      }
    }
    setFinishError(lastErr || 'Could not submit your test.');
    finishingRef.current = false; // allow "Try again"
  }, [attemptId, mode, finalSubmitBody, onFinished]);

  const finishRef = useRef(finish);
  useEffect(() => { finishRef.current = finish; }, [finish]);

  // ── Timer (server-based) ──────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'running' && phase !== 'gate') return;
    const tick = () => {
      const left = Math.max(0, Math.round((endsAtRef.current - Date.now()) / 1000));
      setTimeLeft(left);
      if (left <= 0 && phaseRef.current === 'running') finishRef.current('time');
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [phase]);

  // ── Warnings ──────────────────────────────────────────────────────────────
  const warn = useCallback((message: string, eventType: string, details: Record<string, unknown> = {}) => {
    if (phaseRef.current !== 'running' || finishingRef.current) return;
    record(eventType, { ...details, warningCount: warningsRef.current + 1 });
    // One action often fires several events (tab switch = hidden + blur): count it once.
    const now = Date.now();
    if (now - lastWarnAt.current < 1500) return;
    lastWarnAt.current = now;

    warningsRef.current += 1;
    setWarnings(warningsRef.current);
    setWarningMsg(message);
    if (warningsRef.current >= MAX_WARNINGS) {
      let n = 5;
      setAutoSubmitIn(n);
      const iv = setInterval(() => {
        n -= 1;
        setAutoSubmitIn(n);
        if (n <= 0) { clearInterval(iv); setAutoSubmitIn(null); finishRef.current('warnings'); }
      }, 1000);
    }
  }, [record]);

  // ── Browser lockdown while running ───────────────────────────────────────
  useEffect(() => {
    if (phase !== 'running') return;
    const onVisibility = () => { if (document.hidden) warn('You switched to another tab or window.', 'TAB_SWITCH'); };
    const onBlur = () => warn('The test window lost focus. Stay on this window.', 'WINDOW_BLUR');
    const onContext = (e: MouseEvent) => { e.preventDefault(); warn('Right-click is disabled during the test.', 'RIGHT_CLICK', { x: e.clientX, y: e.clientY }); };
    const onCopy = (e: ClipboardEvent) => { e.preventDefault(); warn('Copying is not allowed.', 'COPY_ATTEMPT', { text: window.getSelection()?.toString().slice(0, 100) }); };
    const onPaste = (e: ClipboardEvent) => { e.preventDefault(); warn('Pasting is not allowed.', 'PASTE_ATTEMPT'); };
    const onCut = (e: ClipboardEvent) => { e.preventDefault(); warn('Cutting text is not allowed.', 'COPY_ATTEMPT'); };
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (e.key === 'F12' || ((e.ctrlKey || e.metaKey) && e.shiftKey && ['i', 'j', 'c'].includes(k))) {
        e.preventDefault(); e.stopPropagation();
        warn('Developer tools are not allowed.', 'DEVTOOLS_SHORTCUT', { key: e.key });
        return;
      }
      if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x'].includes(k)) {
        e.preventDefault(); e.stopPropagation();
        warn('Copy and paste shortcuts are disabled.', 'KEYBOARD_SHORTCUT_BLOCKED', { key: `Ctrl+${k.toUpperCase()}` });
      }
    };
    const onFullscreen = () => {
      const fs = !!document.fullscreenElement;
      setIsFullscreen(fs);
      if (!fs) warn('You left fullscreen. Return to fullscreen to continue.', 'FULLSCREEN_EXIT');
    };
    const onBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    document.addEventListener('contextmenu', onContext);
    document.addEventListener('copy', onCopy, true);
    document.addEventListener('paste', onPaste, true);
    document.addEventListener('cut', onCut, true);
    window.addEventListener('keydown', onKey, true); // capture: before the editor sees it
    document.addEventListener('fullscreenchange', onFullscreen);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('contextmenu', onContext);
      document.removeEventListener('copy', onCopy, true);
      document.removeEventListener('paste', onPaste, true);
      document.removeEventListener('cut', onCut, true);
      window.removeEventListener('keydown', onKey, true);
      document.removeEventListener('fullscreenchange', onFullscreen);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [phase, warn]);

  // Some browsers/embedded views never settle the fullscreen promise; don't let that freeze the test.
  const enterFullscreen = useCallback(async () => {
    try {
      await Promise.race([
        document.documentElement.requestFullscreen(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('fullscreen timeout')), 3000)),
      ]);
      return true;
    } catch {
      return !!document.fullscreenElement;
    }
  }, []);

  /** Gate → test. Fullscreen must be requested from the click itself. */
  const start = useCallback(async () => {
    const ok = await enterFullscreen();
    setIsFullscreen(ok || !!document.fullscreenElement);
    lastWarnAt.current = Date.now(); // ignore the blur the fullscreen switch may cause
    setPhase('running');
  }, [enterFullscreen]);

  // ── Editing ─────────────────────────────────────────────────────────────
  const current = questions[index];
  const lang = current ? langs[current.id] ?? 'python' : 'python';
  const currentCode = current ? code[`${current.id}:${lang}`] ?? '' : '';

  const updateCode = useCallback((value: string) => {
    if (!current) return;
    setCode((p) => ({ ...p, [`${current.id}:${lang}`]: value }));
    setDirty((p) => ({ ...p, [current.id]: true }));
    setStatuses((p) => (p[current.id] === 'NOT_STARTED' ? { ...p, [current.id]: 'EDITED' } : p));
  }, [current, lang]);

  // Debounced local save.
  useEffect(() => {
    if (!current) return;
    const t = setTimeout(() => codeStore.set(attemptId, current.id, lang, currentCode), 800);
    return () => clearTimeout(t);
  }, [attemptId, current, lang, currentCode]);

  const changeLanguage = useCallback((next: LangId) => {
    if (!current) return;
    codeStore.set(attemptId, current.id, lang, currentCode);
    codeStore.setLang(attemptId, current.id, next);
    setLangs((p) => ({ ...p, [current.id]: next }));
    setCode((p) => {
      const key = `${current.id}:${next}`;
      if (p[key] !== undefined) return p;
      return { ...p, [key]: codeStore.get(attemptId, current.id, next) ?? starterFor(current, next) };
    });
  }, [attemptId, current, lang, currentCode]);

  const resetCode = useCallback(() => {
    if (!current) return;
    const starter = starterFor(current, lang);
    setCode((p) => ({ ...p, [`${current.id}:${lang}`]: starter }));
    codeStore.set(attemptId, current.id, lang, starter);
  }, [attemptId, current, lang]);

  const goTo = useCallback((i: number) => {
    if (current) codeStore.set(attemptId, current.id, lang, currentCode);
    setActionError('');
    setIndex(Math.max(0, Math.min(questions.length - 1, i)));
  }, [attemptId, current, lang, currentCode, questions.length]);

  // ── Run / Submit ─────────────────────────────────────────────────────────
  const execute = useCallback(async (kind: 'run' | 'submit') => {
    if (!current || busy) return;
    if (!currentCode.trim()) { setActionError(`Write some code before you ${kind}.`); return; }
    setBusy(kind);
    setActionError('');
    setResults((p) => ({ ...p, [current.id]: null }));
    try {
      const data = await api<Omit<ExecResult, 'kind'>>(`/coding-submissions/${kind}`, {
        method: 'POST',
        body: JSON.stringify({ attemptId, questionId: current.id, language: lang, sourceCode: currentCode }),
        timeoutMs: 120_000,
      });
      setResults((p) => ({ ...p, [current.id]: { ...data, kind } }));
      if (kind === 'submit') {
        setDirty((p) => ({ ...p, [current.id]: false }));
        const scoreStatus = (data as { scoreStatus?: string }).scoreStatus ?? data.status;
        setStatuses((p) => ({ ...p, [current.id]: statusFromSubmission(scoreStatus, data.passedCases) }));
      }
    } catch (err) {
      const e = err as ApiError;
      setActionError(e.message);
      // Server says the test is over → wrap up.
      if (e.status === 403 && /time is up|already been submitted/i.test(e.message)) finishRef.current('time');
    } finally {
      setBusy(null);
    }
  }, [attemptId, busy, current, currentCode, lang]);

  const summary = useMemo(() => {
    const vals = questions.map((q) => statuses[q.id] ?? 'NOT_STARTED');
    return {
      submitted: vals.filter((s) => s === 'PASSED' || s === 'PARTIAL' || s === 'FAILED').length,
      unsubmitted: questions.filter((q) => dirty[q.id]).map((q, i) => ({ q, n: questions.indexOf(q) + 1 || i + 1 })),
      untouched: vals.filter((s) => s === 'NOT_STARTED').length,
    };
  }, [questions, statuses, dirty]);

  return {
    phase, loadError, attempt, questions, index, current, lang, currentCode, statuses, dirty, results,
    busy, actionError, timeLeft, warnings, warningMsg, autoSubmitIn, isFullscreen, finishStep, finishError, summary,
    start, finish, goTo, updateCode, changeLanguage, resetCode,
    run: () => execute('run'), submit: () => execute('submit'),
    dismissWarning: () => setWarningMsg(null), enterFullscreen, warn, record,
    clearActionError: () => setActionError(''),
  };
}

export type CodingTestState = ReturnType<typeof useCodingTest>;
