'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Question {
  id: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
}

interface Test {
  title: string;
  category: string;
  duration: number;
  isPractice?: boolean;
  questions: Question[];
}

type ViolationType = 'tab_switch' | 'fullscreen_exit' | 'copy_attempt' | 'right_click';

interface ViolationEvent {
  type: ViolationType;
  timestamp: string;
  count: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_VIOLATIONS = 5;
const WARNING_THRESHOLD = 3;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:           #0a0c10;
    --surface:      #0f1117;
    --surface-2:    #161921;
    --border:       #1e2330;
    --border-hover: #2e3550;
    --accent:       #4f8ef7;
    --accent-dim:   rgba(79,142,247,0.12);
    --accent-glow:  rgba(79,142,247,0.25);
    --success:      #22d3a5;
    --warn:         #f59e0b;
    --danger:       #ef4444;
    --danger-dim:   rgba(239,68,68,0.12);
    --text-primary: #e8eaf0;
    --text-secondary: #7a8299;
    --text-muted:   #4a5068;
    --radius:       12px;
    --radius-lg:    18px;
    --font:         'Sora', sans-serif;
    --mono:         'JetBrains Mono', monospace;
    --transition:   all 0.2s cubic-bezier(0.4,0,0.2,1);
  }

  html, body { height: 100%; background: var(--bg); color: var(--text-primary); font-family: var(--font); }

  /* ── Layout ── */
  .exam-shell {
    min-height: 100vh;
    background: var(--bg);
    display: flex;
    flex-direction: column;
    user-select: none;
    -webkit-user-select: none;
  }

  /* ── Top Bar ── */
  .topbar {
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(10,12,16,0.85);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-bottom: 1px solid var(--border);
    padding: 0 32px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .topbar-left { display: flex; align-items: center; gap: 16px; min-width: 0; }
  .topbar-right { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }

  .exam-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px;
    background: var(--accent-dim);
    border: 1px solid var(--accent);
    border-radius: 50px;
    font-size: 11px;
    font-weight: 600;
    color: var(--accent);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .exam-badge .dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    background: var(--accent);
    animation: pulse 1.4s ease-in-out infinite;
  }

  @keyframes pulse {
    0%,100% { opacity: 1; transform: scale(1); }
    50%      { opacity: 0.5; transform: scale(0.75); }
  }

  .exam-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* ── Timer ── */
  .timer-pill {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 18px;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 50px;
    font-family: var(--mono);
    font-size: 15px;
    font-weight: 500;
    color: var(--text-primary);
    transition: var(--transition);
  }

  .timer-pill.warn { border-color: var(--warn); color: var(--warn); background: rgba(245,158,11,0.08); }
  .timer-pill.danger { border-color: var(--danger); color: var(--danger); background: var(--danger-dim); animation: timerPulse 0.8s ease-in-out infinite; }

  @keyframes timerPulse {
    0%,100% { opacity: 1; } 50% { opacity: 0.7; }
  }

  .timer-icon { font-size: 14px; }

  /* ── Violation counter ── */
  .violation-pill {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 6px 14px;
    border-radius: 50px;
    font-size: 12px;
    font-weight: 600;
    border: 1px solid transparent;
    transition: var(--transition);
  }

  .violation-pill.safe   { background: rgba(34,211,165,0.08); border-color: rgba(34,211,165,0.3); color: var(--success); }
  .violation-pill.warn   { background: rgba(245,158,11,0.1);  border-color: rgba(245,158,11,0.4); color: var(--warn); }
  .violation-pill.danger { background: var(--danger-dim); border-color: rgba(239,68,68,0.4); color: var(--danger); }

  /* ── Main Content ── */
  .exam-content {
    flex: 1;
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 0;
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
    padding: 32px 24px;
    gap: 24px;
  }

  /* ── Sidebar ── */
  .sidebar {
    display: flex;
    flex-direction: column;
    gap: 20px;
    height: fit-content;
    position: sticky;
    top: 88px;
  }

  .sidebar-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 20px;
  }

  .sidebar-card h4 {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 14px;
  }

  .progress-bar-track {
    height: 6px;
    background: var(--surface-2);
    border-radius: 99px;
    overflow: hidden;
    margin-bottom: 8px;
  }

  .progress-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--accent), var(--success));
    border-radius: 99px;
    transition: width 0.4s ease;
  }

  .progress-label {
    font-size: 12px;
    color: var(--text-secondary);
    display: flex;
    justify-content: space-between;
  }

  /* ── Question Grid ── */
  .q-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 8px;
    margin-top: 4px;
  }

  .q-dot {
    aspect-ratio: 1;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    border: 1.5px solid var(--border);
    background: var(--surface-2);
    color: var(--text-muted);
    transition: var(--transition);
  }

  .q-dot:hover       { border-color: var(--accent); color: var(--accent); }
  .q-dot.current     { border-color: var(--accent); background: var(--accent-dim); color: var(--accent); }
  .q-dot.answered    { border-color: var(--success); background: rgba(34,211,165,0.12); color: var(--success); }
  .q-dot.current.answered { border-color: var(--accent); background: var(--accent-dim); color: var(--accent); }

  /* ── Security Status ── */
  .security-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 9px 0;
    border-bottom: 1px solid var(--border);
    font-size: 13px;
  }

  .security-row:last-child { border-bottom: none; padding-bottom: 0; }

  .security-label { color: var(--text-secondary); display: flex; align-items: center; gap: 8px; }
  .security-value { font-family: var(--mono); font-size: 12px; font-weight: 600; }
  .security-value.ok     { color: var(--success); }
  .security-value.bad    { color: var(--danger); }
  .security-value.medium { color: var(--warn); }

  /* ── Question Card ── */
  .question-area { display: flex; flex-direction: column; gap: 20px; }

  .question-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 32px;
  }

  .q-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;
  }

  .q-number {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: var(--accent-dim);
    border: 1px solid var(--accent);
    font-size: 13px;
    font-weight: 700;
    color: var(--accent);
    flex-shrink: 0;
    font-family: var(--mono);
  }

  .q-meta { font-size: 12px; color: var(--text-muted); }

  .q-text {
    font-size: 17px;
    font-weight: 500;
    line-height: 1.65;
    color: var(--text-primary);
  }

  .options-list { display: flex; flex-direction: column; gap: 12px; margin-top: 28px; }

  .option-label {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 16px 20px;
    border-radius: var(--radius);
    border: 1.5px solid var(--border);
    background: var(--surface-2);
    cursor: pointer;
    transition: var(--transition);
    position: relative;
    overflow: hidden;
  }

  .option-label:hover {
    border-color: var(--border-hover);
    background: #1a1d28;
  }

  .option-label.selected {
    border-color: var(--accent);
    background: var(--accent-dim);
  }

  .option-label.selected::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(79,142,247,0.06) 0%, transparent 60%);
  }

  .option-label input[type="radio"] { display: none; }

  .option-letter {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    border: 1.5px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    font-family: var(--mono);
    color: var(--text-secondary);
    flex-shrink: 0;
    margin-top: 1px;
    transition: var(--transition);
  }

  .option-label.selected .option-letter {
    border-color: var(--accent);
    background: var(--accent);
    color: #fff;
  }

  .option-text { font-size: 14.5px; line-height: 1.6; color: var(--text-primary); padding-top: 4px; }

  /* ── Nav Buttons ── */
  .nav-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }

  .nav-row-center { display: flex; gap: 12px; }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 11px 22px;
    border-radius: var(--radius);
    font-size: 14px;
    font-weight: 600;
    font-family: var(--font);
    cursor: pointer;
    border: 1.5px solid transparent;
    transition: var(--transition);
    outline: none;
  }

  .btn:disabled { opacity: 0.35; cursor: not-allowed; }

  .btn-ghost {
    background: var(--surface);
    border-color: var(--border);
    color: var(--text-secondary);
  }

  .btn-ghost:not(:disabled):hover {
    border-color: var(--border-hover);
    color: var(--text-primary);
    background: var(--surface-2);
  }

  .btn-primary {
    background: var(--accent);
    color: #fff;
  }

  .btn-primary:not(:disabled):hover {
    background: #3b7de8;
    box-shadow: 0 0 0 4px var(--accent-glow);
  }

  .btn-danger {
    background: var(--danger);
    color: #fff;
  }

  .btn-danger:not(:disabled):hover {
    background: #dc2626;
    box-shadow: 0 0 0 4px rgba(239,68,68,0.25);
  }

  /* ── Overlay ── */
  .overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }

  .overlay-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(5,7,10,0.92);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }

  .overlay-card {
    position: relative;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 40px 44px;
    max-width: 480px;
    width: 100%;
    text-align: center;
    animation: slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1);
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .overlay-icon {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    margin: 0 auto 20px;
  }

  .overlay-icon.warn   { background: rgba(245,158,11,0.12); border: 1px solid rgba(245,158,11,0.3); }
  .overlay-icon.danger { background: var(--danger-dim); border: 1px solid rgba(239,68,68,0.3); }

  .overlay-title {
    font-size: 20px;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 12px;
  }

  .overlay-body {
    font-size: 14px;
    line-height: 1.7;
    color: var(--text-secondary);
    margin-bottom: 28px;
  }

  .overlay-body strong { color: var(--danger); }

  .overlay-actions { display: flex; gap: 12px; justify-content: center; }

  /* ── Toast ── */
  .toast-stack {
    position: fixed;
    top: 80px;
    right: 20px;
    z-index: 10000;
    display: flex;
    flex-direction: column;
    gap: 10px;
    pointer-events: none;
  }

  .toast {
    padding: 12px 18px;
    border-radius: var(--radius);
    font-size: 13px;
    font-weight: 500;
    border: 1px solid;
    max-width: 320px;
    animation: toastIn 0.25s ease;
    pointer-events: auto;
  }

  @keyframes toastIn {
    from { opacity: 0; transform: translateX(20px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  .toast.warn   { background: rgba(245,158,11,0.1); border-color: rgba(245,158,11,0.3); color: var(--warn); }
  .toast.danger { background: var(--danger-dim); border-color: rgba(239,68,68,0.3); color: var(--danger); }
  .toast.info   { background: var(--accent-dim); border-color: rgba(79,142,247,0.3); color: var(--accent); }

  /* ── Loading / Already Attempted ── */
  .center-screen {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg);
    font-family: var(--font);
    color: var(--text-primary);
  }

  .empty-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 60px 50px;
    max-width: 440px;
    width: 100%;
    text-align: center;
  }

  .empty-card .big-icon {
    font-size: 48px;
    margin-bottom: 20px;
  }

  .empty-card h2 {
    font-size: 22px;
    font-weight: 700;
    margin-bottom: 12px;
  }

  .empty-card p {
    font-size: 14px;
    color: var(--text-secondary);
    line-height: 1.7;
  }

  .spinner {
    width: 40px; height: 40px;
    border: 3px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin: 0 auto 20px;
  }

  @keyframes spin { to { transform: rotate(360deg); } }
`;

// ─── Toast Hook ───────────────────────────────────────────────────────────────
interface Toast {
  id: number;
  message: string;
  type: 'warn' | 'danger' | 'info';
}

let toastCounter = 0;

// ─── Component ────────────────────────────────────────────────────────────────
export default function TestPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  // Core state
  const [test, setTest] = useState<Test | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [alreadyAttempted, setAlreadyAttempted] = useState(false);

  // Security state
  const [tabSwitches, setTabSwitches] = useState(0);
  const [fullscreenViolations, setFullscreenViolations] = useState(0);
  const [copyAttempts, setCopyAttempts] = useState(0);
  const [rightClickAttempts, setRightClickAttempts] = useState(0);
  const [violationLog, setViolationLog] = useState<ViolationEvent[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // UI state
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showViolationWarning, setShowViolationWarning] = useState(false);
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(false);
  const [forceTerminated, setForceTerminated] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const submittedRef = useRef(false);
  const totalViolations = tabSwitches + fullscreenViolations + copyAttempts + rightClickAttempts;

  // ── Toast ──────────────────────────────────────────────────────────────────
  const addToast = useCallback((message: string, type: Toast['type'] = 'warn') => {
    const id = toastCounter++;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  // ── Violation Logger ───────────────────────────────────────────────────────
  const logViolation = useCallback((type: ViolationType, count: number) => {
    setViolationLog(prev => [...prev, { type, timestamp: new Date().toISOString(), count }]);
  }, []);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const submitTest = useCallback(async (forced = false) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitted(true);

    const token = localStorage.getItem('access_token');
    try {
      await fetch(`http://localhost:3000/tests/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          answers,
          tabSwitches,
          fullscreenViolations,
          copyAttempts,
          rightClickAttempts,
          violationLog,
          forcedSubmission: forced,
          totalViolations,
        }),
      });
    } catch (e) {
      console.error(e);
    }

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    router.push('/tests/thank-you');
  }, [id, answers, tabSwitches, fullscreenViolations, copyAttempts, rightClickAttempts, violationLog, totalViolations, router]);

  // ── Load test ──────────────────────────────────────────────────────────────
  useEffect(() => {
  if (!id) return;

  const loadTest = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/tests/${id}`,
      );

      const data = await response.json();

      setTest(data);
      setTimeLeft(data.duration * 60);

      // Only assigned tests are restricted
      if (!data.isPractice) {
        const token =
          localStorage.getItem(
            'access_token',
          );

        const attemptResponse =
          await fetch(
            `http://localhost:3000/tests/${id}/attempt-status`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          );

        const attemptData =
          await attemptResponse.json();

        setAlreadyAttempted(
          attemptData.attempted,
        );
      }
    } catch (error) {
      console.error(error);
    }
  };

  loadTest();
}, [id]);
  // ── Check attempt status ───────────────────────────────────────────────────
  

  // ── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft(p => p - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  // ── Auto submit on time ────────────────────────────────────────────────────
  useEffect(() => {
    if (timeLeft === 0 && test && !submittedRef.current) submitTest(true);
  }, [timeLeft, test, submitTest]);

  // ── Force terminate on max violations ─────────────────────────────────────
  useEffect(() => {
    if (totalViolations >= MAX_VIOLATIONS && !submittedRef.current) {
      setForceTerminated(true);
    }
  }, [totalViolations]);

  // ── Enter fullscreen on load ───────────────────────────────────────────────
  useEffect(() => {
    if (!test || submittedRef.current) return;
    document.documentElement.requestFullscreen().catch(() => {
      setShowFullscreenPrompt(true);
    });
  }, [test]);

  // ── Fullscreen change ──────────────────────────────────────────────────────
  useEffect(() => {
    const handler = () => {
      const inFs = !!document.fullscreenElement;
      setIsFullscreen(inFs);
      if (!inFs && !submittedRef.current) {
        setFullscreenViolations(p => {
          const next = p + 1;
          logViolation('fullscreen_exit', next);
          addToast(`⚠️ Fullscreen exited — violation #${next} recorded`, next >= WARNING_THRESHOLD ? 'danger' : 'warn');
          setShowFullscreenPrompt(true);
          if (next >= WARNING_THRESHOLD) setShowViolationWarning(true);
          return next;
        });
      }
    };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, [addToast, logViolation]);

  // ── Tab visibility ─────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = () => {
      if (document.hidden && !submittedRef.current) {
        setTabSwitches(p => {
          const next = p + 1;
          logViolation('tab_switch', next);
          addToast(`⚠️ Tab switch detected — violation #${next} recorded`, next >= WARNING_THRESHOLD ? 'danger' : 'warn');
          if (next >= WARNING_THRESHOLD) setShowViolationWarning(true);
          return next;
        });
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [addToast, logViolation]);

  // ── Copy / paste prevention ────────────────────────────────────────────────
  useEffect(() => {
    const prevent = (e: Event) => {
      e.preventDefault();
      setCopyAttempts(p => {
        const next = p + 1;
        logViolation('copy_attempt', next);
        addToast('🚫 Copy/Paste is disabled during the exam', 'danger');
        return next;
      });
    };
    document.addEventListener('copy', prevent);
    document.addEventListener('paste', prevent);
    document.addEventListener('cut', prevent);
    return () => {
      document.removeEventListener('copy', prevent);
      document.removeEventListener('paste', prevent);
      document.removeEventListener('cut', prevent);
    };
  }, [addToast, logViolation]);

  // ── Right click prevention ─────────────────────────────────────────────────
  useEffect(() => {
    const prevent = (e: MouseEvent) => {
      e.preventDefault();
      setRightClickAttempts(p => {
        const next = p + 1;
        logViolation('right_click', next);
        addToast('🚫 Right-click is disabled during the exam', 'info');
        return next;
      });
    };
    document.addEventListener('contextmenu', prevent);
    return () => document.removeEventListener('contextmenu', prevent);
  }, [addToast, logViolation]);

  // ── Dev tools key combos ───────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const blocked =
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key)) ||
        (e.ctrlKey && e.key === 'u') ||
        (e.ctrlKey && e.key === 'p');
      if (blocked) {
        e.preventDefault();
        addToast('🚫 Developer tools and printing are disabled', 'danger');
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [addToast]);

  // ── Inject styles ──────────────────────────────────────────────────────────
  useEffect(() => {
    const tag = document.createElement('style');
    tag.innerHTML = styles;
    document.head.appendChild(tag);
    return () => { document.head.removeChild(tag); };
  }, []);

  // ── Re-enter fullscreen ────────────────────────────────────────────────────
  const enterFullscreen = () => {
    document.documentElement.requestFullscreen().catch(console.error);
    setShowFullscreenPrompt(false);
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const question = test?.questions?.[currentQuestion];
  const answeredCount = Object.keys(answers).length;
  const timerClass = timeLeft < 60 ? 'danger' : timeLeft < 300 ? 'warn' : '';
  const violationClass = totalViolations === 0 ? 'safe' : totalViolations < WARNING_THRESHOLD ? 'warn' : 'danger';

  // ── Loading ────────────────────────────────────────────────────────────────
  if (!test) {
    return (
      <div className="center-screen">
        <div className="empty-card">
          <div className="spinner" />
          <h2>Loading Assessment</h2>
          <p>Please wait while we prepare your exam.</p>
        </div>
      </div>
    );
  }

  // ── Already attempted ──────────────────────────────────────────────────────
  if (alreadyAttempted) {
    return (
      <div className="center-screen">
        <div className="empty-card">
          <div className="big-icon">🔒</div>
          <h2>Already Submitted</h2>
          <p>Our records show you have already completed this assessment. Each assessment can only be attempted once.</p>
        </div>
      </div>
    );
  }

  // ── Force terminated ───────────────────────────────────────────────────────
  if (forceTerminated) {
    return (
      <div className="center-screen">
        <div className="empty-card" style={{ borderColor: 'rgba(239,68,68,0.4)' }}>
          <div className="big-icon">🚫</div>
          <h2 style={{ color: 'var(--danger)' }}>Assessment Terminated</h2>
          <p>
            Your assessment has been terminated due to <strong style={{ color: 'var(--danger)' }}>{MAX_VIOLATIONS} security violations</strong>.
            Your responses have been recorded and flagged for review.
          </p>
          <button
            className="btn btn-danger"
            style={{ marginTop: 24 }}
            onClick={() => submitTest(true)}
          >
            Submit & Exit
          </button>
        </div>
      </div>
    );
  }

  // ── Main Render ────────────────────────────────────────────────────────────
  return (
    <div className="exam-shell">
      {/* Top Bar */}
      <header className="topbar">
        <div className="topbar-left">
          <div className="exam-badge"><span className="dot" />Live Exam</div>
          <span className="exam-title">{test.title}</span>
        </div>
        <div className="topbar-right">
          <div className={`violation-pill ${violationClass}`}>
            🛡️ {totalViolations} violation{totalViolations !== 1 ? 's' : ''}
          </div>
          <div className={`timer-pill ${timerClass}`}>
            <span className="timer-icon">⏱</span>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="exam-content">
        {/* Sidebar */}
        <aside className="sidebar">
          {/* Progress */}
          <div className="sidebar-card">
            <h4>Progress</h4>
            <div className="progress-bar-track">
              <div
                className="progress-bar-fill"
                style={{ width: `${(answeredCount / test.questions.length) * 100}%` }}
              />
            </div>
            <div className="progress-label">
              <span>{answeredCount} answered</span>
              <span>{test.questions.length - answeredCount} left</span>
            </div>
          </div>

          {/* Question Navigator */}
          <div className="sidebar-card">
            <h4>Questions</h4>
            <div className="q-grid">
              {test.questions.map((q, i) => (
                <button
                  key={q.id}
                  className={`q-dot${i === currentQuestion ? ' current' : ''}${answers[q.id] ? ' answered' : ''}`}
                  onClick={() => setCurrentQuestion(i)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Security Monitor */}
          <div className="sidebar-card">
            <h4>Security Monitor</h4>
            <div className="security-row">
              <span className="security-label">🖥 Fullscreen</span>
              <span className={`security-value ${isFullscreen ? 'ok' : 'bad'}`}>
                {isFullscreen ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="security-row">
              <span className="security-label">🔀 Tab Switches</span>
              <span className={`security-value ${tabSwitches === 0 ? 'ok' : tabSwitches < 3 ? 'medium' : 'bad'}`}>
                {tabSwitches}
              </span>
            </div>
            <div className="security-row">
              <span className="security-label">📋 Copy Attempts</span>
              <span className={`security-value ${copyAttempts === 0 ? 'ok' : 'bad'}`}>{copyAttempts}</span>
            </div>
            <div className="security-row">
              <span className="security-label">🖱 Right Clicks</span>
              <span className={`security-value ${rightClickAttempts === 0 ? 'ok' : 'medium'}`}>{rightClickAttempts}</span>
            </div>
            <div className="security-row">
              <span className="security-label">⛔ Fullscreen Exits</span>
              <span className={`security-value ${fullscreenViolations === 0 ? 'ok' : 'bad'}`}>{fullscreenViolations}</span>
            </div>
          </div>

          {/* Category */}
          <div className="sidebar-card" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            <h4>Exam Info</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Category</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{test.category}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Duration</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{test.duration} min</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Questions</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{test.questions.length}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Question Area */}
        <div className="question-area">
          {question && (
            <div className="question-card">
              <div className="q-header">
                <span className="q-number">{currentQuestion + 1}</span>
                <span className="q-meta">Question {currentQuestion + 1} of {test.questions.length}</span>
              </div>
              <p className="q-text">{question.question}</p>

              <div className="options-list">
                {(['A', 'B', 'C', 'D'] as const).map(letter => (
                  <label
                    key={letter}
                    className={`option-label${answers[question.id] === letter ? ' selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name={question.id}
                      checked={answers[question.id] === letter}
                      onChange={() => setAnswers(prev => ({ ...prev, [question.id]: letter }))}
                    />
                    <span className="option-letter">{letter}</span>
                    <span className="option-text">
                      {letter === 'A' ? question.optionA
                        : letter === 'B' ? question.optionB
                        : letter === 'C' ? question.optionC
                        : question.optionD}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="nav-row">
            <div className="nav-row-center">
              <button
                className="btn btn-ghost"
                disabled={currentQuestion === 0}
                onClick={() => setCurrentQuestion(p => p - 1)}
              >
                ← Previous
              </button>
              <button
                className="btn btn-ghost"
                disabled={currentQuestion === test.questions.length - 1}
                onClick={() => setCurrentQuestion(p => p + 1)}
              >
                Next →
              </button>
            </div>

            <button
              className="btn btn-danger"
              onClick={() => setShowSubmitConfirm(true)}
              disabled={submitted}
            >
              {submitted ? '✓ Submitted' : 'Submit Exam'}
            </button>
          </div>
        </div>
      </main>

      {/* ── Fullscreen Prompt Overlay ── */}
      {showFullscreenPrompt && !submitted && (
        <div className="overlay">
          <div className="overlay-backdrop" />
          <div className="overlay-card">
            <div className="overlay-icon warn">🖥️</div>
            <h2 className="overlay-title">Fullscreen Required</h2>
            <p className="overlay-body">
              This exam must be taken in fullscreen mode. Exiting fullscreen is a security violation and has been recorded.
              You have <strong>{MAX_VIOLATIONS - totalViolations} violation{MAX_VIOLATIONS - totalViolations !== 1 ? 's' : ''} remaining</strong> before your exam is automatically terminated.
            </p>
            <div className="overlay-actions">
              <button className="btn btn-primary" onClick={enterFullscreen}>
                🖥 Re-enter Fullscreen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Violation Warning Overlay ── */}
      {showViolationWarning && !submitted && (
        <div className="overlay">
          <div className="overlay-backdrop" />
          <div className="overlay-card">
            <div className="overlay-icon danger">⚠️</div>
            <h2 className="overlay-title">Security Warning</h2>
            <p className="overlay-body">
              You have accumulated <strong>{totalViolations} security violations</strong>. 
              Your exam will be automatically terminated after <strong>{MAX_VIOLATIONS} violations</strong>.
              All violations are being logged and will be reviewed by the examiner.
            </p>
            <div className="overlay-actions">
              <button className="btn btn-primary" onClick={() => { setShowViolationWarning(false); enterFullscreen(); }}>
                I Understand — Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Submit Confirm Overlay ── */}
      {showSubmitConfirm && (
        <div className="overlay">
          <div className="overlay-backdrop" />
          <div className="overlay-card">
            <div className="overlay-icon warn">📋</div>
            <h2 className="overlay-title">Submit Exam?</h2>
            <p className="overlay-body">
              You have answered <strong style={{ color: 'var(--accent)' }}>{answeredCount} of {test.questions.length}</strong> questions.
              {answeredCount < test.questions.length && (
                <> <br /><br />⚠️ <strong>{test.questions.length - answeredCount} question{test.questions.length - answeredCount !== 1 ? 's' : ''} are unanswered.</strong> You cannot change your answers after submitting.</>
              )}
            </p>
            <div className="overlay-actions">
              <button className="btn btn-ghost" onClick={() => setShowSubmitConfirm(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => { setShowSubmitConfirm(false); submitTest(false); }}>
                Confirm Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast Stack ── */}
      <div className="toast-stack">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>{t.message}</div>
        ))}
      </div>
    </div>
  );
}