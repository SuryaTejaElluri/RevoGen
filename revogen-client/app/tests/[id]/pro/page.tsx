'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision';
import { API_BASE_URL } from '@/lib/api';

// ─── Types ─────────────────────────────────────────────────────────────────
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

type EventSeverity = 'low' | 'medium' | 'high';

interface ProctorEvent {
  type: string;
  severity: EventSeverity;
  timestamp: string;
  details?: string;
}

interface ToastItem {
  id: number;
  message: string;
  type: 'warn' | 'danger' | 'info';
}

// ─── Constants ──────────────────────────────────────────────────────────────
const MAX_VIOLATIONS = 5;
const WARNING_THRESHOLD = 3;
let toastCounter = 0;

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
  --bg: #f8fafc;
  --bg-secondary: #eef2ff;

  --surface: rgba(255,255,255,0.9);
  --surface-solid: #ffffff;
  --surface-hover: #f8fafc;
  --surface-2: #f1f5f9;

  --border: #e5e7eb;
  --border-strong: #d1d5db;
  --border-hover: #9ca3af;

  --accent: #2563eb;
  --accent-hover: #1d4ed8;
  --accent-soft: rgba(37,99,235,0.08);
  --accent-dim: rgba(37,99,235,0.07);
  --accent-glow: rgba(37,99,235,0.25);

  --success: #10b981;
  --success-dim: rgba(16,185,129,0.08);

  --warn: #f59e0b;
  --warn-dim: rgba(245,158,11,0.08);

  --warning: #f59e0b;

  --danger: #ef4444;
  --danger-dim: rgba(239,68,68,0.08);

  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-muted: #94a3b8;

  --shadow-sm: 0 1px 2px rgba(0,0,0,.04);
  --shadow-md: 0 8px 24px rgba(15,23,42,.08);
  --shadow-lg: 0 20px 50px rgba(15,23,42,.12);

  --radius: 14px;
  --radius-lg: 20px;

  --font: 'DM Sans', sans-serif;
  --mono: 'DM Mono', monospace;

  --transition: all .25s cubic-bezier(.4,0,.2,1);
}

  html, body {
    height: 100%;
    background: var(--bg);
    color: var(--text-primary);
    font-family: var(--font);
  }

  .exam-shell {
    min-height: 100vh;
    background:
      radial-gradient(circle at top left, rgba(37,99,235,.06), transparent 40%),
      radial-gradient(circle at top right, rgba(99,102,241,.05), transparent 35%),
      var(--bg);
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
    height: 72px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 32px;
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    background: rgba(255,255,255,.82);
    border-bottom: 1px solid rgba(255,255,255,.4);
    box-shadow: 0 8px 30px rgba(15,23,42,.05);
  }

  .topbar-left  { display: flex; align-items: center; gap: 16px; min-width: 0; }
  .topbar-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }

  .brand-logo {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
    font-size: 15px;
    color: var(--accent);
    letter-spacing: -0.3px;
    flex-shrink: 0;
  }

  .brand-logo svg { flex-shrink: 0; }

  .topbar-divider {
    width: 1px;
    height: 24px;
    background: var(--border);
    flex-shrink: 0;
  }

  .exam-title-text {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .live-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    background: rgba(220,38,38,0.07);
    border: 1px solid rgba(220,38,38,0.2);
    border-radius: 50px;
    font-size: 11px;
    font-weight: 700;
    color: var(--danger);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .live-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--danger);
    animation: blink 1.2s ease-in-out infinite;
  }

  @keyframes blink {
    0%,100% { opacity: 1; }
    50%      { opacity: 0.3; }
  }

  /* ── Timer ── */
  .timer-box {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 16px;
    background: var(--surface-2);
    border: 1.5px solid var(--border);
    border-radius: 8px;
    font-family: var(--mono);
    font-size: 16px;
    font-weight: 500;
    color: var(--text-primary);
    transition: var(--transition);
    letter-spacing: 1px;
  }

  .timer-box.warn   { border-color: var(--warn); color: var(--warn); background: var(--warn-dim); }
  .timer-box.danger { border-color: var(--danger); color: var(--danger); background: var(--danger-dim); animation: timerPulse 0.9s ease-in-out infinite; }

  @keyframes timerPulse {
    0%,100% { opacity: 1; } 50% { opacity: 0.65; }
  }

  /* ── Proctoring Indicator ── */
  .proctor-indicator {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    border: 1.5px solid;
  }

  .proctor-indicator.active {
    background: var(--success-dim);
    border-color: rgba(5,150,105,0.25);
    color: var(--success);
  }

  .proctor-indicator.inactive {
    background: var(--danger-dim);
    border-color: rgba(220,38,38,0.25);
    color: var(--danger);
  }

  /* ── Main Content ── */
  .exam-content {
    flex: 1;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 320px;
    gap: 24px;
    max-width: 1500px;
    width: 100%;
    margin: auto;
    padding: 28px;
  }

  /* ── Sidebar ── */
  .sidebar {
    display: flex;
    flex-direction: column;
    gap: 16px;
    align-self: start;
    position: sticky;
    top: 88px;
  }

  .sidebar-card {
    background: rgba(255,255,255,.88);
    backdrop-filter: blur(14px);
    border: 1px solid rgba(255,255,255,.5);
    border-radius: 20px;
    padding: 20px;
    box-shadow: var(--shadow-md);
    transition: var(--transition);
  }

  .sidebar-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }

  .sidebar-card h4 {
    font-size: 10.5px;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 14px;
  }

  .progress-bar-track {
    height: 7px;
    background: var(--surface-2);
    border-radius: 99px;
    overflow: hidden;
    margin-bottom: 8px;
    border: 1px solid var(--border);
  }

  .progress-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--accent), #06b6d4);
    border-radius: 99px;
    transition: width 0.4s ease;
  }

  .progress-stats {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: var(--text-secondary);
  }

  .progress-stats strong { color: var(--text-primary); }

  /* ── Question Navigator Grid ── */
  .q-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 7px;
  }

  .q-dot {
    aspect-ratio: 1;
    border-radius: 7px;
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
    font-family: var(--mono);
  }

  .q-dot:hover            { border-color: var(--accent); color: var(--accent); background: var(--accent-dim); }
  .q-dot.current          { border-color: var(--accent); background: var(--accent); color: #fff; }
  .q-dot.answered         { border-color: var(--success); background: var(--success-dim); color: var(--success); }
  .q-dot.current.answered { border-color: var(--accent); background: var(--accent); color: #fff; }

  /* ── Security Monitor ── */
  .security-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid var(--border);
    font-size: 13px;
  }

  .security-row:last-child { border-bottom: none; padding-bottom: 0; }

  .security-label { color: var(--text-secondary); display: flex; align-items: center; gap: 7px; }
  .security-value { font-family: var(--mono); font-size: 12px; font-weight: 600; }
  .security-value.ok     { color: var(--success); }
  .security-value.bad    { color: var(--danger); }
  .security-value.medium { color: var(--warn); }

  /* ── Exam Info ── */
  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
    padding: 6px 0;
    border-bottom: 1px solid var(--border);
  }

  .info-row:last-child { border-bottom: none; }
  .info-row-label { color: var(--text-secondary); }
  .info-row-value { font-weight: 600; color: var(--text-primary); }

  /* ── Question Card ── */
  .question-area { display: flex; flex-direction: column; gap: 16px; }

  .question-card {
    background: rgba(255,255,255,.92);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255,255,255,.4);
    border-radius: 24px;
    padding: 42px;
    box-shadow: var(--shadow-lg);
    transition: var(--transition);
  }

  .q-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--border);
  }

  .q-header-left { display: flex; align-items: center; gap: 12px; }

  .q-number {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: 8px;
    background: var(--accent-dim);
    border: 1.5px solid rgba(37,99,235,0.2);
    font-size: 13px;
    font-weight: 700;
    color: var(--accent);
    font-family: var(--mono);
  }

  .q-label {
    font-size: 13px;
    color: var(--text-muted);
    font-weight: 500;
  }

  .q-marks {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary);
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 4px 10px;
  }

  .q-text {
    font-size: 16px;
    font-weight: 500;
    line-height: 1.7;
    color: var(--text-primary);
    margin-top: 20px;
    margin-bottom: 24px;
  }

  .options-list { display: flex; flex-direction: column; gap: 10px; }

  .option-label {
    display: flex;
    gap: 16px;
    padding: 18px 20px;
    border-radius: 16px;
    border: 1px solid var(--border);
    background: white;
    cursor: pointer;
    transition: all .25s ease;
    align-items: flex-start;
  }

  .option-label:hover {
    transform: translateY(-2px);
    border-color: rgba(37,99,235,0.4);
    background: var(--accent-dim);
    box-shadow: 0 8px 24px rgba(37,99,235,.08);
  }

  .option-label.selected {
    border-color: var(--accent);
    background: var(--accent-dim);
    box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
  }

  .option-label input[type="radio"] { display: none; }

  .option-letter {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 1.5px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    font-family: var(--mono);
    color: var(--text-secondary);
    flex-shrink: 0;
    margin-top: 1px;
    transition: var(--transition);
    background: var(--surface);
  }

  .option-label.selected .option-letter {
    border-color: var(--accent);
    background: var(--accent);
    color: #fff;
  }

  .option-text {
    font-size: 14.5px;
    line-height: 1.6;
    color: var(--text-primary);
    padding-top: 3px;
  }

  /* ── Navigation ── */
  .nav-row {
    background: rgba(255,255,255,.9);
    border-radius: 20px;
    padding: 18px 24px;
    border: 1px solid rgba(255,255,255,.5);
    backdrop-filter: blur(16px);
    box-shadow: var(--shadow-md);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .nav-row-center { display: flex; gap: 10px; }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 9px 20px;
    border-radius: var(--radius);
    font-size: 13.5px;
    font-weight: 600;
    font-family: var(--font);
    cursor: pointer;
    border: 1.5px solid transparent;
    transition: var(--transition);
    outline: none;
    letter-spacing: -0.1px;
  }

  .btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .btn-ghost {
    background: var(--surface-2);
    border-color: var(--border);
    color: var(--text-secondary);
  }

  .btn-ghost:not(:disabled):hover {
    border-color: var(--border-hover);
    color: var(--text-primary);
  }

  .btn-primary {
    background: var(--accent);
    color: #fff;
    border-color: var(--accent);
  }

  .btn-primary:not(:disabled):hover {
    background: #1d4ed8;
    box-shadow: 0 0 0 3px var(--accent-glow);
  }

  .btn-danger {
    background: var(--danger);
    color: #fff;
    border-color: var(--danger);
  }

  .btn-danger:not(:disabled):hover {
    background: #b91c1c;
    box-shadow: 0 0 0 3px rgba(220,38,38,0.2);
  }

  .btn-outline-danger {
    background: transparent;
    border-color: var(--danger);
    color: var(--danger);
  }

  .btn-outline-danger:not(:disabled):hover {
    background: var(--danger-dim);
  }

  /* ── Camera Preview ── */
  .camera-preview {
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 180px;
    height: 135px;
    border-radius: 12px;
    border: 2px solid var(--border);
    background: #111;
    z-index: 9000;
    overflow: hidden;
    box-shadow: var(--shadow-lg);
  }

  .camera-preview video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform: scaleX(-1);
  }

  .camera-status-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 5px 8px;
    background: linear-gradient(transparent, rgba(0,0,0,0.75));
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 10px;
    font-weight: 600;
    color: #fff;
  }

  .cam-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .cam-dot.on  { background: #22c55e; animation: blink 1.5s infinite; }
  .cam-dot.off { background: #ef4444; }

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
    background: rgba(17,24,39,0.6);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
  }

  .overlay-card {
    position: relative;
    background: var(--surface-solid);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 40px 44px;
    max-width: 460px;
    width: 100%;
    text-align: center;
    box-shadow: var(--shadow-lg);
    animation: slideUp 0.28s cubic-bezier(0.34,1.56,0.64,1);
  }

  .overlay-card.overlay-warning { border-top: 5px solid #f59e0b; }
  .overlay-card.overlay-danger  { border-top: 5px solid #ef4444; }
  .overlay-card.overlay-info    { border-top: 5px solid #2563eb; }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(16px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .overlay-icon {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    margin: 0 auto 18px;
  }

  .overlay-icon.warn    { background: var(--warn-dim);    border: 1px solid rgba(217,119,6,0.25); }
  .overlay-icon.warning { background: var(--warn-dim);    border: 1px solid rgba(217,119,6,0.25); }
  .overlay-icon.danger  { background: var(--danger-dim);  border: 1px solid rgba(220,38,38,0.25); }
  .overlay-icon.info    { background: var(--accent-dim);  border: 1px solid rgba(37,99,235,0.2); }

  .overlay-title {
    font-size: 19px;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 10px;
    letter-spacing: -0.3px;
  }

  .overlay-body {
    font-size: 14px;
    line-height: 1.7;
    color: var(--text-secondary);
    margin-bottom: 26px;
  }

  .overlay-actions { display: flex; gap: 10px; justify-content: center; }

  .overlay-countdown {
    text-align: center;
    font-size: 12px;
    color: var(--text-muted);
    margin-bottom: 20px;
  }

  /* ── Toast Stack ── */
  .toast-stack {
    position: fixed;
    top: 76px;
    right: 20px;
    z-index: 10000;
    display: flex;
    flex-direction: column;
    gap: 8px;
    pointer-events: none;
  }

  .toast {
    padding: 11px 16px;
    border-radius: 9px;
    font-size: 13px;
    font-weight: 500;
    border: 1px solid;
    max-width: 310px;
    animation: toastIn 0.22s ease;
    pointer-events: auto;
    box-shadow: var(--shadow-md);
    background: var(--surface-solid);
  }

  @keyframes toastIn {
    from { opacity: 0; transform: translateX(16px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  .toast.warn   { border-color: rgba(217,119,6,0.3);  color: var(--warn); }
  .toast.danger { border-color: rgba(220,38,38,0.3);  color: var(--danger); }
  .toast.info   { border-color: rgba(37,99,235,0.25); color: var(--accent); }

  /* ── Loading / Empty States ── */
  .center-screen {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg);
    font-family: var(--font);
  }

  .empty-card {
    background: var(--surface-solid);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 56px 48px;
    max-width: 420px;
    width: 100%;
    text-align: center;
    box-shadow: var(--shadow-lg);
  }

  .empty-card .big-icon { font-size: 44px; margin-bottom: 18px; }

  .empty-card h2 {
    font-size: 21px;
    font-weight: 700;
    margin-bottom: 10px;
    color: var(--text-primary);
    letter-spacing: -0.3px;
  }

  .empty-card p {
    font-size: 14px;
    color: var(--text-secondary);
    line-height: 1.7;
  }

  .spinner {
    width: 38px; height: 38px;
    border: 3px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.75s linear infinite;
    margin: 0 auto 20px;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── Answered indicator in nav ── */
  .answered-chip {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--text-secondary);
  }

  .answered-chip span {
    font-weight: 700;
    color: var(--text-primary);
  }

  @media (max-width: 1024px) {
    .exam-content { grid-template-columns: 1fr; }
    .sidebar { position: static; }
    .camera-preview { width: 140px; height: 100px; }
  }

  @media (max-width: 768px) {
    .topbar { padding: 0 16px; }
    .question-card { padding: 24px; }
    .nav-row { flex-direction: column; align-items: stretch; }
    .nav-row-center { width: 100%; }
    .btn { justify-content: center; }
  }
`;

// ─── Main Component ──────────────────────────────────────────────────────────
export default function TestPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  // ── Refs ────────────────────────────────────────────────────────────────
  const submittedRef           = useRef(false);
  const videoRef               = useRef<HTMLVideoElement>(null);
  const detectorRef            = useRef<FaceDetector | null>(null);
  const audioContextRef        = useRef<AudioContext | null>(null);
  const analyserRef            = useRef<AnalyserNode | null>(null);
  const micStreamRef           = useRef<MediaStream | null>(null);
  const faceIntervalRef        = useRef<ReturnType<typeof setInterval> | null>(null);
  const noiseIntervalRef       = useRef<ReturnType<typeof setInterval> | null>(null);

  // Duration-based face detection refs
  const faceMissingTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const multipleFaceTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFaceMissingRef       = useRef(false);
  const isMultipleFaceRef      = useRef(false);

  // Noise detection refs
  const noiseStartTimeRef      = useRef<number | null>(null);
  const noiseRecordedRef       = useRef(false);

  // Popup dedup ref
  const popupActiveRef         = useRef(false);

  // ── Core state ──────────────────────────────────────────────────────────
  const [test, setTest]                         = useState<Test | null>(null);
  const [answers, setAnswers]                   = useState<Record<string, string>>({});
  const [currentQuestion, setCurrentQuestion]   = useState(0);
  const [timeLeft, setTimeLeft]                 = useState(0);
  const [submitted, setSubmitted]               = useState(false);
  const [alreadyAttempted, setAlreadyAttempted] = useState(false);

  // ── Security counters & Initial Checks ──────────────────────────────────
  const [examStarted, setExamStarted]                     = useState(false);
  const [retryPerms, setRetryPerms]                       = useState(0);
  const [initialCameraChecked, setInitialCameraChecked]   = useState(false);
  const [initialMicChecked, setInitialMicChecked]         = useState(false);

  const [tabSwitches, setTabSwitches]                     = useState(0);
  const [fullscreenViolations, setFullscreenViolations]   = useState(0);
  const [copyAttempts, setCopyAttempts]                   = useState(0);
  const [rightClickAttempts, setRightClickAttempts]       = useState(0);
  const [faceMissingEvents, setFaceMissingEvents]         = useState(0);
  const [multipleFaceEvents, setMultipleFaceEvents]       = useState(0);
  const [noiseWarnings, setNoiseWarnings]                 = useState(0);
  const [idleEvents, setIdleEvents]                       = useState(0);
  const [resizeEvents, setResizeEvents]                   = useState(0);
  const [cameraDisconnectEvents, setCameraDisconnectEvents] = useState(0);
  const [microphoneDisconnectEvents, setMicrophoneDisconnectEvents] = useState(0);

  const [violationLog, setViolationLog]                   = useState<ViolationEvent[]>([]);
  const [proctorEvents, setProctorEvents]                 = useState<ProctorEvent[]>([]);

  // ── Proctoring state ────────────────────────────────────────────────────
  const [cameraEnabled, setCameraEnabled]       = useState(false);
  const [microphoneEnabled, setMicrophoneEnabled] = useState(false);
  const [faceDetected, setFaceDetected]         = useState(false);
  const [isFullscreen, setIsFullscreen]         = useState(false);
  const [noiseLevel, setNoiseLevel]             = useState(0);
  const isSubmittingRef = useRef(false);

  // ── Violation popup state ───────────────────────────────────────────────
  const [violationTitle, setViolationTitle]     = useState('');
  const [violationMessage, setViolationMessage] = useState('');
  const [violationSeverity, setViolationSeverity] = useState<'warning' | 'danger'>('warning');
  const [showViolationPopup, setShowViolationPopup] = useState(false);

  // ── UI state ────────────────────────────────────────────────────────────
  const [showSubmitConfirm, setShowSubmitConfirm]       = useState(false);
  const [showViolationWarning, setShowViolationWarning] = useState(false);
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(false);
  const [forceTerminated, setForceTerminated]           = useState(false);
  const [toasts, setToasts]                             = useState<ToastItem[]>([]);

  // ── Derived values ──────────────────────────────────────────────────────
  // Only critical violations count toward forced termination
  const criticalViolationCount = tabSwitches + fullscreenViolations + copyAttempts;

  const riskScore = Math.min(
    100,
    (tabSwitches * 10) +
    (fullscreenViolations * 10) +
    (copyAttempts * 20) +
    (rightClickAttempts * 5) +
    (faceMissingEvents * 15) +
    (multipleFaceEvents * 20) +
    (noiseWarnings * 3) +
    (cameraDisconnectEvents * 25) +
    (microphoneDisconnectEvents * 25)
  );
  const riskLevel =
  riskScore < 30
    ? 'LOW'
    : riskScore < 60
      ? 'MEDIUM'
      : 'HIGH';

  // ── Toast ────────────────────────────────────────────────────────────────
  const addToast = useCallback((message: string, type: ToastItem['type'] = 'warn') => {
    const tid = toastCounter++;
    setToasts(prev => [...prev, { id: tid, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== tid)), 4500);
  }, []);

  // ── Proctor Event Recorder ───────────────────────────────────────────────
  const recordProctorEvent = useCallback((
    type: string,
    severity: EventSeverity,
    details?: string
  ) => {
    const event: ProctorEvent = {
      type,
      severity,
      timestamp: new Date().toISOString(),
      details,
    };
    setProctorEvents(prev => [...prev, event]);
  }, []);

  // ── Violation Popup ──────────────────────────────────────────────────────
  const showViolationPopupFn = useCallback((
    title: string,
    message: string,
    severity: 'warning' | 'danger'
  ) => {
    if (popupActiveRef.current) return; // prevent duplicates
    popupActiveRef.current = true;
    setViolationTitle(title);
    setViolationMessage(message);
    setViolationSeverity(severity);
    setShowViolationPopup(true);
    setTimeout(() => {
      setShowViolationPopup(false);
      popupActiveRef.current = false;
    }, 8000);
  }, []);

  // ── Violation Logger ─────────────────────────────────────────────────────
  const logViolation = useCallback((type: ViolationType, count: number) => {
    setViolationLog(prev => [...prev, { type, timestamp: new Date().toISOString(), count }]);
  }, []);

  // ── Submit ───────────────────────────────────────────────────────────────
  const submitTest = useCallback(async (forced = false) => {
    if (submittedRef.current) return;
    isSubmittingRef.current = true;
    submittedRef.current = true;
    setSubmitted(true);

    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
    }

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
    }

    const token = localStorage.getItem('access_token');

    // Capture current state snapshot for submission
    // These are read via closure at call time
    try {
      await fetch(`${API_BASE_URL}/tests/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          answers,
          riskScore,
          summary: {
            tabSwitches,
            fullscreenViolations,
            copyAttempts,
            rightClickAttempts,
            faceMissingEvents,
            multipleFaceEvents,
            noiseWarnings,
            idleEvents,
            resizeEvents,
            riskLevel,
            cameraEnabled,
            microphoneEnabled,
            cameraDisconnectEvents,
            microphoneDisconnectEvents,
          },
          eventLog: proctorEvents,
          violationLog,
          forcedSubmission: forced,
        }),
      });
    } catch (e) {
      console.error('Submit error:', e);
    }

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    router.push('/tests/thank-you');
  }, [
    id, answers, riskScore,
    tabSwitches, fullscreenViolations, copyAttempts, rightClickAttempts,
    faceMissingEvents, multipleFaceEvents, noiseWarnings, idleEvents, resizeEvents,
    proctorEvents, violationLog, router,
    cameraEnabled, microphoneEnabled, cameraDisconnectEvents, microphoneDisconnectEvents
  ]);

  // ── Inject styles ────────────────────────────────────────────────────────
  useEffect(() => {
    const tag = document.createElement('style');
    tag.innerHTML = styles;
    document.head.appendChild(tag);
    return () => { document.head.removeChild(tag); };
  }, []);

  // ── Load test ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const res  = await fetch(`${API_BASE_URL}/tests/${id}`);
        const data = await res.json();
        setTest(data);
        setTimeLeft(data.duration * 60);

        if (!data.isPractice) {
          const token = localStorage.getItem('access_token');
          const ar    = await fetch(`${API_BASE_URL}/tests/${id}/attempt-status`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const ad = await ar.json();
          setAlreadyAttempted(ad.attempted);
        }
      } catch (err) {
        console.error('Load test error:', err);
      }
    };
    load();
  }, [id]);

  // ── Camera ───────────────────────────────────────────────────────────────
  useEffect(() => {
    let stream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(() => {});
          };
        }
        setCameraEnabled(true);
        setInitialCameraChecked(true);

        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.onended = () => {
            if (submittedRef.current) return;
            setCameraEnabled(false);
            setCameraDisconnectEvents(prev => prev + 1);
            recordProctorEvent('camera_disconnected', 'high', 'Camera disconnected during assessment');
            showViolationPopupFn('Camera Disconnected', 'Camera monitoring has stopped. Please reconnect your camera immediately.', 'danger');
            addToast('🚫 Camera disconnected', 'danger');
          };
        }
      } catch {
        console.warn('Camera access denied');
        setCameraEnabled(false);
        setInitialCameraChecked(true);
        showViolationPopupFn('Camera Required', 'Camera access is mandatory for this assessment.', 'danger');
      }
    };
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [addToast, recordProctorEvent, showViolationPopupFn, retryPerms]);

  // ── Microphone ───────────────────────────────────────────────────────────
  useEffect(() => {
    let stream: MediaStream | null = null;
    const startMic = async () => {
      try {
        stream         = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;
        const ctx      = new AudioContext();
        const src      = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        src.connect(analyser);
        audioContextRef.current = ctx;
        analyserRef.current     = analyser;
        setMicrophoneEnabled(true);
        setInitialMicChecked(true);

        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.onended = () => {
            if (submittedRef.current) return;
            setMicrophoneEnabled(false);
            setMicrophoneDisconnectEvents(prev => prev + 1);
            recordProctorEvent('microphone_disconnected', 'high', 'Microphone disconnected during assessment');
            showViolationPopupFn('Microphone Disconnected', 'Audio monitoring has stopped. Please reconnect your microphone immediately.', 'danger');
            addToast('🚫 Microphone disconnected', 'danger');
          };
        }
      } catch {
        console.warn('Mic access denied');
        setMicrophoneEnabled(false);
        setInitialMicChecked(true);
        showViolationPopupFn('Microphone Required', 'Microphone access is mandatory for this assessment.', 'danger');
      }
    };
    startMic();
    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      audioContextRef.current?.close().catch(() => {});
    };
  }, [addToast, recordProctorEvent, showViolationPopupFn, retryPerms]);

  // ── Permission Gate Status Evaluator ─────────────────────────────────────
  useEffect(() => {
    if (initialCameraChecked && initialMicChecked && cameraEnabled && microphoneEnabled && !examStarted) {
      setExamStarted(true);
    }
  }, [initialCameraChecked, initialMicChecked, cameraEnabled, microphoneEnabled, examStarted]);

  // ── Multiple Disconnect Handler ──────────────────────────────────────────
  useEffect(() => {
    if (
      examStarted &&
      !cameraEnabled &&
      !microphoneEnabled &&
      !submittedRef.current &&
      !isSubmittingRef.current
    ) {
      recordProctorEvent('both_disconnected', 'high', 'Both camera and microphone disconnected');
      showViolationPopupFn('Proctoring Lost', 'Both camera and microphone disconnected. Automatically submitting.', 'danger');
      submitTest(true);
    }
  }, [examStarted, cameraEnabled, microphoneEnabled, recordProctorEvent, showViolationPopupFn, submitTest]);

  // ── Face Detector Init ───────────────────────────────────────────────────
  useEffect(() => {
    const loadDetector = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
        );
        detectorRef.current = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite',
          },
          runningMode: 'VIDEO',
        });
      } catch (e) {
        console.warn('Face detector init failed:', e);
      }
    };
    loadDetector();
    return () => {
      if (detectorRef.current) {
        detectorRef.current.close();
      }
    };
  }, []);

  // ── Face Detection Loop (duration-based) ─────────────────────────────────
  useEffect(() => {
    const detectFaces = () => {
      if (!detectorRef.current || !videoRef.current) return;
      const video = videoRef.current;
      if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) return;

      try {
        const result = detectorRef.current.detectForVideo(video, Date.now());
        const faces  = result.detections.length;

        // ── Face present / missing ──────────────────────────────────────────
        if (faces === 0) {
          setFaceDetected(false);

          if (!isFaceMissingRef.current) {
            // Start 30-second timer
            isFaceMissingRef.current = true;
            faceMissingTimerRef.current = setTimeout(() => {
              if (submittedRef.current) return;
              setFaceMissingEvents(prev => prev + 1);
              recordProctorEvent('face_missing', 'high', 'Face absent for 30+ continuous seconds');
              addToast('⚠️ Face not detected. Please return to camera.', 'danger');
              showViolationPopupFn(
                'Face Not Detected',
                'Your face has not been visible for an extended period. Please return to the assessment area.',
                'warning'
              );
            }, 30000);
          }

          // Reset multiple-face timer since no face
          if (isMultipleFaceRef.current) {
            isMultipleFaceRef.current = false;
            if (multipleFaceTimerRef.current) {
              clearTimeout(multipleFaceTimerRef.current);
              multipleFaceTimerRef.current = null;
            }
          }
        } else {
          setFaceDetected(true);

          // Face returned — reset missing timer
          if (isFaceMissingRef.current) {
            isFaceMissingRef.current = false;
            if (faceMissingTimerRef.current) {
              clearTimeout(faceMissingTimerRef.current);
              faceMissingTimerRef.current = null;
            }
          }

          // ── Multiple faces ────────────────────────────────────────────────
          if (faces > 1) {
            if (!isMultipleFaceRef.current) {
              // Start 15-second timer
              isMultipleFaceRef.current = true;
              multipleFaceTimerRef.current = setTimeout(() => {
                if (submittedRef.current) return;
                setMultipleFaceEvents(prev => prev + 1);
                recordProctorEvent('multiple_faces', 'high', 'Multiple faces detected for 15+ continuous seconds');
                addToast('🚫 Multiple faces detected.', 'danger');
                showViolationPopupFn(
                  'Multiple Faces Detected',
                  'Only the candidate should remain visible during the assessment.',
                  'danger'
                );
              }, 15000);
            }
          } else {
            // Back to single face — reset multiple-face timer
            if (isMultipleFaceRef.current) {
              isMultipleFaceRef.current = false;
              if (multipleFaceTimerRef.current) {
                clearTimeout(multipleFaceTimerRef.current);
                multipleFaceTimerRef.current = null;
              }
            }
          }
        }
      } catch {
        // Ignore detection errors
      }
    };

    faceIntervalRef.current = setInterval(detectFaces, 2000);
    return () => {
      if (faceIntervalRef.current) clearInterval(faceIntervalRef.current);
      if (faceMissingTimerRef.current) clearTimeout(faceMissingTimerRef.current);
      if (multipleFaceTimerRef.current) clearTimeout(multipleFaceTimerRef.current);
    };
  }, [addToast, recordProctorEvent, showViolationPopupFn]);

  // ── Noise Detection Loop ─────────────────────────────────────────────────
  useEffect(() => {
    // Adjusted from 60 to 25. An average amplitude of 60 across all FFT bins requires extreme broadband noise. 25 ensures reliable detection of loud speech or background disruption.
    const NOISE_THRESHOLD     = 25;
    const NOISE_DURATION_MS   = 5000; // Trigger after 5 continuous seconds

    const detectNoise = () => {
      if (!analyserRef.current) return;
      const data = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      setNoiseLevel(Math.round(avg));

      if (avg > NOISE_THRESHOLD) {
        if (noiseStartTimeRef.current === null) {
          noiseStartTimeRef.current = Date.now();
          noiseRecordedRef.current  = false;
        } else if (
          !noiseRecordedRef.current &&
          Date.now() - noiseStartTimeRef.current >= NOISE_DURATION_MS
        ) {
          noiseRecordedRef.current = true;
          setNoiseWarnings(prev => prev + 1);
          recordProctorEvent('noise_detected', 'low', 'High background noise for 5+ continuous seconds');
          addToast('🔊 High background noise detected', 'warn');
          
          showViolationPopupFn(
            'High Background Noise',
            'Continuous background noise has been detected. Please ensure a quiet environment during the assessment.',
            'warning'
          );

          // Allow re-detection after quiet period
          setTimeout(() => {
            noiseStartTimeRef.current = null;
            noiseRecordedRef.current  = false;
          }, 15000);
        }
      } else {
        // Noise dropped below threshold — reset
        noiseStartTimeRef.current = null;
        noiseRecordedRef.current  = false;
      }
    };

    noiseIntervalRef.current = setInterval(detectNoise, 1000);
    return () => {
      if (noiseIntervalRef.current) clearInterval(noiseIntervalRef.current);
    };
  }, [addToast, recordProctorEvent, showViolationPopupFn]);

  // ── Idle Detection ────────────────────────────────────────────────────────
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setIdleEvents(prev => prev + 1), 300_000);
    };
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('click', resetTimer);
    resetTimer();
    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('click', resetTimer);
    };
  }, []);

  // ── Window Resize Detection ───────────────────────────────────────────────
  useEffect(() => {
    const handle = () => setResizeEvents(prev => prev + 1);
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  // ── Timer Countdown ────────────────────────────────────────────────────────
  useEffect(() => {
    if (timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft(p => p - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  // ── Auto submit on time end ───────────────────────────────────────────────
  useEffect(() => {
    if (timeLeft === 0 && test && !submittedRef.current) {
      submitTest(true);
    }
  }, [timeLeft, test, submitTest]);

  // ── Force terminate on max critical violations ─────────────────────────────
  useEffect(() => {
    if (criticalViolationCount >= MAX_VIOLATIONS && !submittedRef.current) {
      setForceTerminated(true);
    }
  }, [criticalViolationCount]);

  // ── Enter fullscreen when test loads AND permissions are granted ──────────
  useEffect(() => {
    if (!test || submittedRef.current || !examStarted) return;
    document.documentElement.requestFullscreen().catch(() => {
      setShowFullscreenPrompt(true);
    });
  }, [test, examStarted]);

  // ── Fullscreen change listener ────────────────────────────────────────────
  useEffect(() => {
    const handler = () => {
      const inFs = !!document.fullscreenElement;
      setIsFullscreen(inFs);
      if (
  !inFs &&
  !submittedRef.current &&
  !isSubmittingRef.current &&
  examStarted
) {
        setFullscreenViolations(p => {
          const next = p + 1;
          logViolation('fullscreen_exit', next);
          recordProctorEvent('fullscreen_exit', 'medium', `Fullscreen exited (count: ${next})`);
          addToast('⚠️ Fullscreen exited — violation recorded', next >= WARNING_THRESHOLD ? 'danger' : 'warn');
          showViolationPopupFn('Fullscreen Required', 'This assessment must remain in fullscreen mode.', 'danger');
          setShowFullscreenPrompt(true);
          if (next >= WARNING_THRESHOLD) setShowViolationWarning(true);
          return next;
        });
      }
    };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, [addToast, logViolation, recordProctorEvent, showViolationPopupFn, examStarted]);

  // ── Tab visibility ─────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = () => {
      if (document.hidden && !submittedRef.current && examStarted) {
        setTabSwitches(p => {
          const next = p + 1;
          logViolation('tab_switch', next);
          recordProctorEvent('tab_switch', 'medium', `Tab switch detected (count: ${next})`);
          addToast('⚠️ Tab/window switch detected — violation recorded', next >= WARNING_THRESHOLD ? 'danger' : 'warn');
          showViolationPopupFn('Focus Lost', 'You moved away from the assessment window. Please remain focused on the test.', 'warning');
          if (next >= WARNING_THRESHOLD) setShowViolationWarning(true);
          return next;
        });
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [addToast, logViolation, recordProctorEvent, showViolationPopupFn, examStarted]);

  // ── Copy / paste / cut prevention ─────────────────────────────────────────
  useEffect(() => {
    const prevent = (e: Event) => {
      if (!examStarted) return;
      e.preventDefault();
      setCopyAttempts(p => {
        const next = p + 1;
        logViolation('copy_attempt', next);
        recordProctorEvent('copy_attempt', 'high', `Copy/paste attempt (count: ${next})`);
        addToast('🚫 Copy/Paste is not allowed during this exam', 'danger');
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
  }, [addToast, logViolation, recordProctorEvent, examStarted]);

  // ── Right click prevention ─────────────────────────────────────────────────
  useEffect(() => {
    const prevent = (e: MouseEvent) => {
      if (!examStarted) return;
      e.preventDefault();
      setRightClickAttempts(p => {
        const next = p + 1;
        logViolation('right_click', next);
        recordProctorEvent('right_click', 'low', `Right-click attempt (count: ${next})`);
        addToast('🚫 Right-click is disabled during this exam', 'info');
        return next;
      });
    };
    document.addEventListener('contextmenu', prevent);
    return () => document.removeEventListener('contextmenu', prevent);
  }, [addToast, logViolation, recordProctorEvent, examStarted]);

  // ── Dev tools / print key combos ──────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!examStarted) return;
      const blocked =
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key)) ||
        (e.ctrlKey && e.key === 'u') ||
        (e.ctrlKey && e.key === 'p') ||
        (e.metaKey && e.key === 'p');
      if (blocked) {
        e.preventDefault();
        addToast('🚫 This action is not permitted during the exam', 'danger');
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [addToast, examStarted]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const enterFullscreen = () => {
    document.documentElement.requestFullscreen().catch(console.error);
    setShowFullscreenPrompt(false);
  };

  const minutes      = Math.floor(timeLeft / 60);
  const seconds      = timeLeft % 60;
  const question     = test?.questions?.[currentQuestion];
  const answeredCount = Object.keys(answers).length;
  const timerClass   = timeLeft < 60 ? 'danger' : timeLeft < 300 ? 'warn' : '';
  const proctorActive = cameraEnabled && microphoneEnabled;

  // ── Loading State ──────────────────────────────────────────────────────────
  if (!test) {
    return (
      <div className="center-screen">
        <div className="empty-card">
          <div className="spinner" />
          <h2>Preparing Your Assessment</h2>
          <p>Please wait while we load your exam. Do not close this window.</p>
        </div>
      </div>
    );
  }

  // ── Already Attempted ──────────────────────────────────────────────────────
  if (alreadyAttempted) {
    return (
      <div className="center-screen">
        <div className="empty-card">
          <div className="big-icon">🔒</div>
          <h2>Assessment Already Completed</h2>
          <p>Our records indicate you have already submitted this assessment. Each assessment can only be attempted once. Please contact your administrator if you believe this is an error.</p>
        </div>
      </div>
    );
  }

  // ── Force Terminated ──────────────────────────────────────────────────────
  if (forceTerminated) {
    return (
      <div className="center-screen">
        <div className="empty-card" style={{ borderColor: 'rgba(220,38,38,0.3)' }}>
          <div className="big-icon">🚫</div>
          <h2 style={{ color: 'var(--danger)' }}>Assessment Terminated</h2>
          <p>
            Your session has been terminated due to {MAX_VIOLATIONS} security violations.
            Your responses have been automatically recorded and flagged for review.
          </p>
          <button
            className="btn btn-danger"
            style={{ marginTop: 24, width: '100%', justifyContent: 'center' }}
            onClick={() => submitTest(true)}
          >
            Submit &amp; Exit
          </button>
        </div>
      </div>
    );
  }

  // ── Pre-Exam Permission Gate ───────────────────────────────────────────────
  if (!examStarted) {
    if (initialCameraChecked && initialMicChecked) {
      return (
        <div className="center-screen">
          <div className="empty-card" style={{ borderColor: 'rgba(220,38,38,0.3)' }}>
            <div className="big-icon">🔒</div>
            <h2 style={{ color: 'var(--danger)' }}>Permissions Required</h2>
            <p>
              {!cameraEnabled && <span>📷 Camera Access Required<br/></span>}
              {!microphoneEnabled && <span>🎤 Microphone Access Required<br/></span>}
              <br/>
              Please grant required permissions to continue.
            </p>
            <button
              className="btn btn-primary"
              style={{ marginTop: 24, width: '100%', justifyContent: 'center' }}
              onClick={() => {
                setInitialCameraChecked(false);
                setInitialMicChecked(false);
                setRetryPerms(p => p + 1);
              }}
            >
              Retry Permissions
            </button>
          </div>

          {/* Render to allow the popups to show during the gate stage */}
          {showViolationPopup && (
            <div className="overlay">
              <div className="overlay-backdrop" />
              <div className={`overlay-card ${violationSeverity === 'danger' ? 'overlay-danger' : 'overlay-warning'}`}>
                <div className={`overlay-icon ${violationSeverity === 'danger' ? 'danger' : 'warning'}`}>
                  {violationSeverity === 'danger' ? '🚫' : '⚠️'}
                </div>
                <h2 className="overlay-title">{violationTitle}</h2>
                <p className="overlay-body">{violationMessage}</p>
                <div className="overlay-countdown">This warning will close automatically.</div>
                <button className="btn btn-primary" onClick={() => setShowViolationPopup(false)}>
                  Continue
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="center-screen">
        <div className="empty-card">
          <div className="spinner" />
          <h2>Checking Permissions</h2>
          <p>Please allow camera and microphone access when prompted.</p>
        </div>
      </div>
    );
  }

  // ── Main Render ────────────────────────────────────────────────────────────
  return (
    <div className="exam-shell">

      {/* ── Top Bar ── */}
      <header className="topbar">
        <div className="topbar-left">
          <div className="brand-logo">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect width="22" height="22" rx="6" fill="var(--accent)" />
              <path d="M6 16L11 6L16 16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 13h6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            AssessmentPro
          </div>
          <div className="topbar-divider" />
          <div className="live-badge">
            <span className="live-dot" />
            Live Exam
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span className="exam-title-text">{test.title}</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em' }}>
              {test.category}
            </span>
          </div>
        </div>

        <div className="topbar-right">
          <div className={`proctor-indicator ${proctorActive ? 'active' : 'inactive'}`}>
            {proctorActive ? '🔴' : '⚠️'} Proctored
          </div>
          <div className={`timer-box ${timerClass}`}>
            ⏱ {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="exam-content">

        <div className="question-area">
          {question && (
            <div className="question-card">
              <div className="q-header">
                <div className="q-header-left">
                  <span className="q-number">{currentQuestion + 1}</span>
                  <span className="q-label">
                    Question {currentQuestion + 1} of {test.questions.length}
                  </span>
                </div>
                <span className="q-marks">1 Mark</span>
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

          {/* Navigation Row */}
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

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div className="answered-chip">
                <span>{answeredCount}</span>/{test.questions.length} answered
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
        </div>

        {/* ── Sidebar ── */}
        <aside className="sidebar">

          {/* Progress */}
          <div className="sidebar-card">
            <h4>Your Progress</h4>
            <div className="progress-bar-track">
              <div
                className="progress-bar-fill"
                style={{ width: `${(answeredCount / test.questions.length) * 100}%` }}
              />
            </div>
            <div className="progress-stats">
              <span><strong>{answeredCount}</strong> answered</span>
              <span><strong>{test.questions.length - answeredCount}</strong> remaining</span>
            </div>
          </div>

          {/* Question Navigator */}
          <div className="sidebar-card">
            <h4>Question Navigator</h4>
            <div className="q-grid">
              {test.questions.map((q, i) => (
                <button
                  key={q.id}
                  className={`q-dot${i === currentQuestion ? ' current' : ''}${answers[q.id] ? ' answered' : ''}`}
                  onClick={() => setCurrentQuestion(i)}
                  title={`Question ${i + 1}${answers[q.id] ? ' — Answered' : ''}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Security Monitor — candidate-friendly view only */}
          <div className="sidebar-card">
            <h4>AI Proctoring Active</h4>
            <div className="security-row">
              <span className="security-label">📷 Camera Monitoring</span>
              <span className={`security-value ${cameraEnabled ? 'ok' : 'bad'}`}>{cameraEnabled ? 'Active' : 'Offline'}</span>
            </div>
            <div className="security-row">
              <span className="security-label">🎤 Audio Monitoring</span>
              <span className={`security-value ${microphoneEnabled ? 'ok' : 'bad'}`}>{microphoneEnabled ? 'Active' : 'Offline'}</span>
            </div>
            <div className="security-row">
              <span className="security-label">🖥️ Session Tracking</span>
              <span className="security-value ok">Active</span>
            </div>
          </div>

        </aside>

      </main>

      {/* ── Camera Preview ── */}
      <div className="camera-preview">
        <video ref={videoRef} autoPlay muted playsInline />
        <div className="camera-status-bar">
          <span className={`cam-dot ${cameraEnabled ? 'on' : 'off'}`} />
          {faceDetected ? 'Face detected' : cameraEnabled ? 'No face detected' : 'Camera off'}
        </div>
      </div>

      {/* ── Fullscreen Prompt ── */}
      {showFullscreenPrompt && !submitted && (
        <div className="overlay">
          <div className="overlay-backdrop" />
          <div className={`overlay-card ${fullscreenViolations >= WARNING_THRESHOLD ? 'overlay-danger' : 'overlay-warning'}`}>
            <div className="overlay-icon warn">🖥️</div>
            <h2 className="overlay-title">Fullscreen Required</h2>
            <p className="overlay-body">
              This exam must be conducted in fullscreen mode. Exiting fullscreen is recorded as a security violation.
            </p>
            <div className="overlay-actions">
              <button className="btn btn-primary" onClick={enterFullscreen}>
                🖥 Re-enter Fullscreen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Violation Warning ── */}
      {showViolationWarning && !submitted && (
        <div className="overlay">
          <div className="overlay-backdrop" />
          <div className="overlay-card overlay-danger">
            <div className="overlay-icon danger">⚠️</div>
            <h2 className="overlay-title">Security Warning</h2>
            <p className="overlay-body">
              Multiple security violations have been recorded during this session.
              Continued violations may result in automatic termination of your exam.
              All activity is being reviewed by the examiner.
            </p>
            <div className="overlay-actions">
              <button
                className="btn btn-primary"
                onClick={() => { setShowViolationWarning(false); enterFullscreen(); }}
              >
                I Understand — Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Submit Confirmation ── */}
      {showSubmitConfirm && (
        <div className="overlay">
          <div className="overlay-backdrop" />
          <div className="overlay-card overlay-info">
            <div className="overlay-icon info">📋</div>
            <h2 className="overlay-title">Submit Assessment?</h2>
            <p className="overlay-body">
              You have answered{' '}
              <strong style={{ color: 'var(--accent)' }}>{answeredCount} of {test.questions.length}</strong> questions.
              {answeredCount < test.questions.length && (
                <>
                  <br /><br />
                  <strong style={{ color: 'var(--warn)' }}>
                    ⚠️ {test.questions.length - answeredCount} question{test.questions.length - answeredCount !== 1 ? 's are' : ' is'} unanswered.
                  </strong>
                  <br />
                  Unanswered questions will not receive any marks. You cannot change your answers after submitting.
                </>
              )}
            </p>
            <div className="overlay-actions">
              <button className="btn btn-ghost" onClick={() => setShowSubmitConfirm(false)}>
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => { setShowSubmitConfirm(false); submitTest(false); }}
              >
                Confirm &amp; Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Violation Popup ── */}
      {showViolationPopup && (
        <div className="overlay">
          <div className="overlay-backdrop" />
          <div className={`overlay-card ${violationSeverity === 'danger' ? 'overlay-danger' : 'overlay-warning'}`}>
            <div className={`overlay-icon ${violationSeverity === 'danger' ? 'danger' : 'warning'}`}>
              {violationSeverity === 'danger' ? '🚫' : '⚠️'}
            </div>
            <h2 className="overlay-title">{violationTitle}</h2>
            <p className="overlay-body">{violationMessage}</p>
            <div className="overlay-countdown">This warning will close automatically.</div>
            <button className="btn btn-primary" onClick={() => setShowViolationPopup(false)}>
              Continue
            </button>
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