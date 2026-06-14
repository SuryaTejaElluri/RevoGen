"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-[#1e1e1e]">
      <div className="flex items-center gap-3 text-[#858585]">
        <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <span className="text-sm font-mono">Loading editor…</span>
      </div>
    </div>
  ),
});

type Language = "java" | "python" | "javascript" | "c" | "cpp";

interface StarterCode {
  java?: string;
  python?: string;
  javascript?: string;
  c?: string;
  cpp?: string;
}

interface TestCase {
  id?: string;
  input: string;
  expectedOutput?: string;
  output?: string;
  explanation?: string;
  isHidden?: boolean;
  hidden?: boolean;
}

interface CodingQuestion {
  id: string;
  title: string;
  description: string;
  constraints: string;
  inputFormat: string;
  outputFormat: string;
  difficulty: "Easy" | "Medium" | "Hard";
  category: string;
  starterCode: StarterCode;
  testCases?: TestCase[];
  examples?: TestCase[];
}

interface Question {
  id: string;
  codingQuestion: CodingQuestion;
}

interface AssessmentData {
  id: string;
  title: string;
  description: string;
  duration: number;
  questions: Question[];
}

interface TestCaseResult {
  testCaseNo: number;
  passed: boolean;
  input?: string;
  expected?: string;
  received?: string;
}

interface RunCodeSuccess {
  success: true;
  status: "PASSED" | "FAILED";
  passedCases: number;
  totalCases: number;
  results: TestCaseResult[];
}

interface RunCodeError {
  success: false;
  status: "Compilation Error" | "Runtime Error" | string;
  error: string;
}

type RunCodeResponse = RunCodeSuccess | RunCodeError;

interface SubmitSuccess {
  success: true;
  submissionId: string;
  status: "PASSED" | "FAILED";
  passedCases: number;
  totalCases: number;
}

interface SubmitError {
  success: false;
  status: "Compilation Error" | "Runtime Error" | string;
  error: string;
}

type SubmitResponse = SubmitSuccess | SubmitError;

interface QuestionSubmission {
  result: SubmitResponse;
}

interface FinalAssessmentResult {
  success: true;
  attemptId: string;
  totalQuestions: number;
  completedQuestions: number;
  totalScore: number;
  percentage: number;
  securityViolations: number;
  submittedAt: string;
}

// ── Security event types ──────────────────────────────────────────────────────

type SecurityEventType =
  | "TAB_SWITCH"
  | "FULLSCREEN_EXIT"
  | "DEVTOOLS_OPENED"
  | "LARGE_PASTE"
  | "REFRESH_ATTEMPT";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getPublicTestCases(cq: CodingQuestion): TestCase[] {
  const source = cq.testCases ?? cq.examples ?? [];
  return source.filter((tc) => {
    const hidden = tc.isHidden ?? tc.hidden ?? false;
    return !hidden;
  });
}

function getExpectedOutput(tc: TestCase): string {
  return tc.expectedOutput ?? tc.output ?? "";
}

// ── Constants ─────────────────────────────────────────────────────────────────

const LANGUAGE_LABELS: Record<Language, string> = {
  java: "Java",
  python: "Python",
  javascript: "JavaScript",
  c: "C",
  cpp: "C++",
};

const MONACO_LANGUAGE_MAP: Record<Language, string> = {
  java: "java",
  python: "python",
  javascript: "javascript",
  c: "c",
  cpp: "cpp",
};

const DIFFICULTY_STYLES: Record<string, string> = {
  Easy: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
  Medium: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  Hard: "bg-rose-500/15 text-rose-400 border border-rose-500/30",
};

const AUTOSAVE_INTERVAL_MS = 10_000;
// Minimum ms between two fires of the same security event type (dedup window)
const SECURITY_EVENT_DEBOUNCE_MS = 500;

// ── Component ─────────────────────────────────────────────────────────────────

export default function CodingAssessmentPage() {
  function getDefaultStarter(lang: Language): string {
    switch (lang) {
      case "java":       return `class Solution {\n\n}`;
      case "python":     return `def solve():\n    pass`;
      case "javascript": return `function solve() {\n\n}`;
      case "c":          return `#include <stdio.h>\n\nint main() {\n\n    return 0;\n}`;
      case "cpp":        return `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n\n    return 0;\n}`;
      default:           return "";
    }
  }

  const { id } = useParams<{ id: string }>();

  const [attemptId, setAttemptId] = useState<string | null>(null);

  // ── Core state ───────────────────────────────────────────────────────────
  const [assessment, setAssessment]                     = useState<AssessmentData | null>(null);
  const [loading, setLoading]                           = useState(true);
  const [error, setError]                               = useState<string | null>(null);
  const [activeQuestionIndex, setActiveQuestionIndex]   = useState(0);
  const [language, setLanguage]                         = useState<Language>("javascript");
  const [editorCode, setEditorCode]                     = useState<string>("");
  const [timeRemaining, setTimeRemaining]               = useState<number | null>(null);
  const [timerExpired, setTimerExpired]                 = useState(false);
  const [assessmentSubmitted, setAssessmentSubmitted]   = useState(false);
  const [showSubmitDialog, setShowSubmitDialog]         = useState(false);
  const [isRunning, setIsRunning]                       = useState(false);
  const [runResult, setRunResult]                       = useState<RunCodeResponse | null>(null);
  const [activeTestCase, setActiveTestCase]             = useState<number>(0);
  const [codeCache, setCodeCache]                       = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting]                 = useState(false);
  const [submissionMap, setSubmissionMap]               = useState<Record<string, QuestionSubmission>>({});
  const [resultsView, setResultsView]                   = useState<"run" | "submit">("run");

  // ── Final submission state ───────────────────────────────────────────────
  const [finalAssessmentResult, setFinalAssessmentResult] = useState<FinalAssessmentResult | null>(null);
  const [isFinalSubmitting, setIsFinalSubmitting]         = useState(false);
  const [showResultModal, setShowResultModal]             = useState(false);

  // ── Security state ───────────────────────────────────────────────────────
  const [tabSwitchCount, setTabSwitchCount]           = useState(0);
  const [fullscreenExitCount, setFullscreenExitCount] = useState(0);
  const [devToolsOpenCount, setDevToolsOpenCount]     = useState(0);
  const [largePasteCount, setLargePasteCount]         = useState(0);
  const [securityWarnings, setSecurityWarnings]       = useState<Partial<Record<SecurityEventType, string>>>({});
  const [monitoringOpen, setMonitoringOpen]           = useState(false);
  const [fullscreenRequired, setFullscreenRequired]   = useState(false);

  // ── Refs ─────────────────────────────────────────────────────────────────
  const prevCodeLengthRef    = useRef<number>(0);
  const assessmentIdRef      = useRef<string | undefined>(undefined);
  const attemptIdRef         = useRef<string | null>(null);
  // Tracks last-fired timestamp per event type for deduplication
  const lastSecurityEventRef = useRef<Partial<Record<SecurityEventType, number>>>({});
  // Tracks counts in a ref so event handlers always see latest value
  const tabSwitchCountRef       = useRef(0);
  const fullscreenExitCountRef  = useRef(0);
  const devToolsOpenCountRef    = useRef(0);
  const largePasteCountRef      = useRef(0);

  // Keep attemptIdRef in sync
  useEffect(() => { attemptIdRef.current = attemptId; }, [attemptId]);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const getStarterCode = useCallback(
    (question: CodingQuestion, lang: Language): string =>
      question.starterCode?.[lang] ?? getDefaultStarter(lang),
    []
  );

  /**
   * Fire a security event to the backend.
   * Deduplicates: identical eventType fired within SECURITY_EVENT_DEBOUNCE_MS is dropped.
   */
 const fireSecurityEvent = useCallback(
  async (
    eventType: SecurityEventType,
    details?: string
  ) => {
    const now = Date.now();

    const lastFired =
      lastSecurityEventRef.current[eventType] ?? 0;

    if (
      now - lastFired <
      SECURITY_EVENT_DEBOUNCE_MS
    ) {
      return;
    }

    lastSecurityEventRef.current[eventType] = now;

    const codingTestId =
      assessmentIdRef.current;

    const currentAttemptId =
      attemptIdRef.current;

    if (!codingTestId) return;

    const token =
      localStorage.getItem("access_token");

    try {
      await fetch(
        "http://localhost:3000/coding-tests/security-event",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            codingTestId,
            attemptId: currentAttemptId,
            eventType,
            details,
          }),
        }
      );
    } catch {
      // silently ignore network failures
    }
  },
  []
);

  const showWarning = useCallback((type: SecurityEventType, message: string) => {
    setSecurityWarnings((prev) => ({ ...prev, [type]: message }));
    setTimeout(() => {
      setSecurityWarnings((prev) => {
        const next = { ...prev };
        delete next[type];
        return next;
      });
    }, 4000);
  }, []);

  // ── Autosave to localStorage ─────────────────────────────────────────────

  const getAutosaveKey = (questionId: string, lang: Language) =>
    `${questionId}-${lang}`;

  const saveToLocalStorage = useCallback((questionId: string, lang: Language, code: string) => {
    try {
      localStorage.setItem(getAutosaveKey(questionId, lang), code);
    } catch {
      // storage quota exceeded or private mode — ignore
    }
  }, []);

  const loadFromLocalStorage = useCallback(
    (questionId: string, lang: Language): string | null => {
      try {
        return localStorage.getItem(getAutosaveKey(questionId, lang));
      } catch {
        return null;
      }
    },
    []
  );

  // ── Fetch assessment ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    const fetchAssessment = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("access_token");

const res = await fetch(
  `http://localhost:3000/coding-tests/${id}/candidate`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);
        if (!res.ok) throw new Error(`Failed to load assessment (${res.status})`);
        const data: AssessmentData = await res.json();
        setAssessment(data);
        assessmentIdRef.current = data.id;

        const startRes =await fetch(
  "http://localhost:3000/coding-tests/start",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      codingTestId: data.id,
    }),
  }
);
        const startData = await startRes.json();
        setAttemptId(startData.attemptId);

        try {
          await document.documentElement.requestFullscreen();
        } catch {}

        setTimeRemaining((data.duration ?? 60) * 60);

        if (data.questions.length > 0) {
          const firstQ  = data.questions[0].codingQuestion;
          const saved   = loadFromLocalStorage(firstQ.id, "javascript");
          const initial = saved ?? getStarterCode(firstQ, "javascript");
          setEditorCode(initial);
          prevCodeLengthRef.current = initial.length;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    fetchAssessment();
  }, [id]);

  // ── Restore code when question or language changes ───────────────────────
  useEffect(() => {
    if (!assessment) return;
    const q = assessment.questions[activeQuestionIndex];
    if (!q) return;
    const cacheKey = `${q.codingQuestion.id}-${language}`;
    const restored =
      codeCache[cacheKey] ??
      loadFromLocalStorage(q.codingQuestion.id, language) ??
      getStarterCode(q.codingQuestion, language);
    setEditorCode(restored);
    prevCodeLengthRef.current = restored.length;
    setRunResult(null);
    setActiveTestCase(0);
    if (submissionMap[q.codingQuestion.id]) {
      setResultsView("submit");
    } else {
      setResultsView("run");
    }
  }, [activeQuestionIndex, language, assessment]);

  // ── Autosave interval ────────────────────────────────────────────────────
  useEffect(() => {
    if (!assessment) return;
    const q = assessment.questions[activeQuestionIndex];
    if (!q) return;
    const interval = setInterval(() => {
      saveToLocalStorage(q.codingQuestion.id, language, editorCode);
    }, AUTOSAVE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [assessment, activeQuestionIndex, language, editorCode]);

  // ── Timer ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (timeRemaining === null) return;
    if (timeRemaining <= 0) { setTimerExpired(true); return; }
    const tick = setInterval(() => {
      setTimeRemaining((t) => {
        if (t === null || t <= 1) { clearInterval(tick); setTimerExpired(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [timeRemaining]);

  const formatTime = (seconds: number): string => {
    const h  = Math.floor(seconds / 3600);
    const m  = Math.floor((seconds % 3600) / 60);
    const s  = seconds % 60;
    const mm = String(m).padStart(2, "0");
    const ss = String(s).padStart(2, "0");
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
  };

  // ── Feature 1: beforeunload protection ──────────────────────────────────
  useEffect(() => {
    if (assessmentSubmitted) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
      fireSecurityEvent("REFRESH_ATTEMPT", "beforeunload triggered");
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [assessmentSubmitted, fireSecurityEvent]);

  // ── Feature 2: Tab switch detection ─────────────────────────────────────
  useEffect(() => {
    if (assessmentSubmitted) return;
    const handleVisibilityChange = () => {
      if (!document.hidden) return;
      // Increment ref immediately (outside state setter) so fireSecurityEvent
      // sees the correct count and we avoid calling it inside a state updater.
      tabSwitchCountRef.current += 1;
      const next = tabSwitchCountRef.current;
      setTabSwitchCount(next);
      showWarning("TAB_SWITCH", `Warning: Tab switching detected (${next})`);
      fireSecurityEvent("TAB_SWITCH", `count:${next}`);
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [assessmentSubmitted, showWarning, fireSecurityEvent]);

  // ── Feature 3: Fullscreen monitoring ────────────────────────────────────
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (document.fullscreenElement || assessmentSubmitted) return;
      setFullscreenRequired(true);
      fullscreenExitCountRef.current += 1;
      const next = fullscreenExitCountRef.current;
      setFullscreenExitCount(next);
      showWarning("FULLSCREEN_EXIT", `Warning: Fullscreen exited (${next})`);
      fireSecurityEvent("FULLSCREEN_EXIT", `count:${next}`);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [assessmentSubmitted, fireSecurityEvent, showWarning]);

  // ── Feature 4: DevTools key detection ───────────────────────────────────
  useEffect(() => {
    if (assessmentSubmitted) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const isDevToolsKey =
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C"));
      if (!isDevToolsKey) return;
      devToolsOpenCountRef.current += 1;
      const next = devToolsOpenCountRef.current;
      setDevToolsOpenCount(next);
      showWarning("DEVTOOLS_OPENED", `Warning: DevTools shortcut detected (${next})`);
      fireSecurityEvent("DEVTOOLS_OPENED", `count:${next}`);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [assessmentSubmitted, showWarning, fireSecurityEvent]);

  // ── Run Code ─────────────────────────────────────────────────────────────
  const handleRunCode = async () => {
  if (!activeQuestion) return;

  try {
    setIsRunning(true);
    setRunResult(null);
    setActiveTestCase(0);
    setResultsView("run");

    const token = localStorage.getItem("access_token");

    const response = await fetch(
      "http://localhost:3000/coding-submissions/run",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          codingQuestionId: activeQuestion.codingQuestion.id,
          language,
          sourceCode: editorCode,
        }),
      }
    );

    const result: RunCodeResponse = await response.json();

    setRunResult(result);

    if (result.success) {
      if (result.status === "PASSED") {
        setActiveTestCase(0);
      } else {
        const firstFailed = result.results.findIndex(
          (r) => !r.passed
        );

        setActiveTestCase(
          firstFailed >= 0 ? firstFailed : 0
        );
      }
    }
  } catch {
    setRunResult({
      success: false,
      status: "Runtime Error",
      error:
        "Failed to reach the execution server. Please try again.",
    });
  } finally {
    setIsRunning(false);
  }
};
 

  // ── Submit Question ──────────────────────────────────────────────────────
  const handleSubmitQuestion = async () => {
  if (!activeQuestion || !assessment || !attemptId) return;

  const qId = activeQuestion.codingQuestion.id;

  try {
    setIsSubmitting(true);
    setResultsView("submit");

    const token = localStorage.getItem("access_token");

    const response = await fetch(
      "http://localhost:3000/coding-submissions/submit",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          codingTestId: assessment.id,
          codingQuestionId: qId,
          attemptId,
          language,
          sourceCode: editorCode,
        }),
      }
    );

    const result: SubmitResponse = await response.json();

    setSubmissionMap((prev) => ({
      ...prev,
      [qId]: { result },
    }));
  } catch {
    const errorResult: SubmitError = {
      success: false,
      status: "Runtime Error",
      error:
        "Failed to reach the submission server. Please try again.",
    };

    setSubmissionMap((prev) => ({
      ...prev,
      [qId]: { result: errorResult },
    }));
  } finally {
    setIsSubmitting(false);
  }
};

  // ── Final Assessment Submission ──────────────────────────────────────────
  const handleFinalSubmit = async () => {
  if (!assessment || !attemptId) return;

  setIsFinalSubmitting(true);

  try {
    const token = localStorage.getItem("access_token");

    const res = await fetch(
      "http://localhost:3000/coding-tests/final-submit",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          codingTestId: assessment.id,
          attemptId,
        }),
      }
    );

    const data = await res.json();

    if (data.success) {
      setFinalAssessmentResult(
        data as FinalAssessmentResult
      );

      setAssessmentSubmitted(true);
      setShowSubmitDialog(false);
      setShowResultModal(true);
    }
  } catch {
    // silently fail
  } finally {
    setIsFinalSubmitting(false);
  }
};

  // ── Loading / Error screens ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0d0d0d]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 border-[#2a2a2a]" />
            <div className="absolute inset-0 rounded-full border-2 border-t-violet-500 animate-spin" />
          </div>
          <p className="text-[#666] text-sm font-mono tracking-wider">Loading assessment…</p>
        </div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0d0d0d]">
        <div className="flex flex-col items-center gap-4 max-w-sm text-center">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
            <svg className="w-6 h-6 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 110 18A9 9 0 0112 3z" />
            </svg>
          </div>
          <div>
            <p className="text-white font-semibold mb-1">Failed to load assessment</p>
            <p className="text-[#666] text-sm">{error || "Assessment not found"}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#1e1e1e] border border-[#2a2a2a] text-[#ccc] text-sm rounded-lg hover:border-violet-500/50 hover:text-white transition-all"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const activeQuestion             = assessment.questions[activeQuestionIndex];
  const cq                         = activeQuestion?.codingQuestion;
  const publicTestCases            = cq ? getPublicTestCases(cq) : [];
  const currentSubmission          = cq ? submissionMap[cq.id] : undefined;
  const isCurrentQuestionSubmitted = !!currentSubmission;

  const getResultCaseData = (tc: TestCaseResult, idx: number) => {
    const publicTc = publicTestCases[idx];
    return {
      input:    tc.input    ?? publicTc?.input                    ?? "—",
      expected: tc.expected ?? (publicTc ? getExpectedOutput(publicTc) : "—"),
      received: tc.received,
    };
  };

  const activeWarningEntries = Object.entries(securityWarnings) as [SecurityEventType, string][];

  return (
    <div className="h-screen bg-[#0d0d0d] flex flex-col overflow-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-5 py-3 bg-[#111] border-b border-[#1f1f1f] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-violet-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <span className="text-white font-semibold text-sm truncate max-w-xs">{assessment.title}</span>
        </div>

        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-sm font-semibold ${
          timerExpired
            ? "bg-rose-500/10 border-rose-500/40 text-rose-400"
            : timeRemaining !== null && timeRemaining < 300
            ? "bg-amber-500/10 border-amber-500/40 text-amber-400"
            : "bg-[#1a1a1a] border-[#242424] text-[#ccc]"
        }`}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <circle cx="12" cy="12" r="10" strokeWidth={2} />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" />
          </svg>
          {timerExpired ? "Time Expired" : timeRemaining !== null ? formatTime(timeRemaining) : "--:--"}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[#555] text-xs font-mono">
            {assessment.questions.length} question{assessment.questions.length !== 1 ? "s" : ""}
          </span>
          <button
            disabled={
  timerExpired ||
  assessmentSubmitted ||
  isSubmitting ||
  isFinalSubmitting
}
            onClick={() => setShowSubmitDialog(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M16 12l-4-4-4 4M12 8v8" />
            </svg>
            {assessmentSubmitted ? "Submitted" : "Submit Assessment"}
          </button>
        </div>
      </header>

      {/* ── Security warning toasts ──────────────────────────────────────── */}
      {activeWarningEntries.length > 0 && (
        <div className="shrink-0 flex flex-col gap-0 z-40">
          {activeWarningEntries.map(([type, message]) => (
            <div key={type} className="flex items-center gap-2 px-5 py-2 bg-amber-500/10 border-b border-amber-500/30">
              <svg className="w-3.5 h-3.5 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 110 18A9 9 0 0112 3z" />
              </svg>
              <span className="text-amber-400 text-xs font-mono">{message}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Assessment submitted banner ──────────────────────────────────── */}
      {assessmentSubmitted && finalAssessmentResult && (
        <div className="shrink-0 bg-emerald-500/10 border-b border-emerald-500/30 px-5 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-emerald-400 text-xs font-mono font-semibold">Assessment Submitted</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[#555] text-xs font-mono">
              Score: <span className="text-[#888]">{finalAssessmentResult.totalScore}</span>
            </span>
            <span className="text-[#555] text-xs font-mono">
              Percentage: <span className="text-[#888]">{finalAssessmentResult.percentage}%</span>
            </span>
          </div>
        </div>
      )}

      {/* ── Fullscreen required overlay ──────────────────────────────────── */}
      {fullscreenRequired && (
        <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center">
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6 w-full max-w-md">
            <h3 className="text-white font-semibold text-lg mb-2">Fullscreen Required</h3>
            <p className="text-[#888] text-sm mb-5">This coding assessment must remain in fullscreen mode.</p>
            <button
              onClick={async () => {
                try {
                  await document.documentElement.requestFullscreen();
                  setFullscreenRequired(false);
                } catch {}
              }}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white py-2 rounded-lg font-medium"
            >
              Return to Fullscreen
            </button>
          </div>
        </div>
      )}

      {/* ── Timer expired banner ─────────────────────────────────────────── */}
      {timerExpired && (
        <div className="shrink-0 bg-rose-500/10 border-b border-rose-500/30 px-5 py-2.5 flex items-center gap-2">
          <svg className="w-4 h-4 text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 110 18A9 9 0 0112 3z" />
          </svg>
          <span className="text-rose-400 text-sm font-medium">Assessment Time Expired — the editor has been disabled.</span>
        </div>
      )}

      {/* ── Submit assessment confirmation dialog ────────────────────────── */}
      {showSubmitDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-violet-500/10 border border-violet-500/30 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M16 12l-4-4-4 4M12 8v8" />
                </svg>
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Submit Assessment?</p>
                <p className="text-[#666] text-xs mt-0.5">You won't be able to make changes after submitting.</p>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                disabled={isFinalSubmitting}
                onClick={() => setShowSubmitDialog(false)}
                className="flex-1 px-4 py-2 bg-[#1e1e1e] border border-[#2a2a2a] text-[#aaa] text-sm rounded-lg hover:border-[#333] hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                disabled={isFinalSubmitting}
                onClick={handleFinalSubmit}
                className="flex-1 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
              >
                {isFinalSubmitting ? (
                  <>
                    <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Submitting Assessment...
                  </>
                ) : "Confirm Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Final result modal ───────────────────────────────────────────── */}
      {showResultModal && finalAssessmentResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Assessment Submitted Successfully</p>
                <p className="text-[#555] text-xs mt-0.5">
                  {new Date(finalAssessmentResult.submittedAt).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="bg-[#0f0f0f] border border-[#1e1e1e] rounded-lg divide-y divide-[#1e1e1e] mb-5">
              {[
                { label: "Questions Completed", value: `${finalAssessmentResult.completedQuestions} / ${finalAssessmentResult.totalQuestions}`, warn: false },
                { label: "Total Score",          value: String(finalAssessmentResult.totalScore),       warn: false },
                { label: "Percentage",           value: `${finalAssessmentResult.percentage}%`,         warn: false },
                { label: "Security Violations",  value: String(finalAssessmentResult.securityViolations), warn: finalAssessmentResult.securityViolations > 0 },
              ].map(({ label, value, warn }) => (
                <div key={label} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-[11px] font-mono text-[#555]">{label}</span>
                  <span className={`text-[11px] font-mono font-semibold ${warn ? "text-amber-400" : "text-[#ccc]"}`}>{value}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowResultModal(false)}
              className="w-full px-4 py-2 bg-[#1e1e1e] border border-[#2a2a2a] text-[#aaa] text-sm rounded-lg hover:border-[#333] hover:text-white transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal" className="h-full">

          {/* ── LEFT PANEL ──────────────────────────────────────────────── */}
          <Panel defaultSize={40} minSize={25} maxSize={55}>
            <div className="h-full bg-[#111] flex flex-col overflow-hidden border-r border-[#1f1f1f]">

              {/* Question navigator */}
              <div className="px-4 pt-4 pb-3 border-b border-[#1a1a1a] shrink-0">
                <p className="text-[#555] text-[10px] font-mono uppercase tracking-widest mb-3">Questions</p>
                <div className="flex flex-wrap gap-2">
                  {assessment.questions.map((q, idx) => {
                    const diff     = q.codingQuestion.difficulty;
                    const isActive = idx === activeQuestionIndex;
                    const isSubQ   = !!submissionMap[q.codingQuestion.id];
                    return (
                      <button
                        key={q.id}
                        disabled={isFinalSubmitting}
                        onClick={() => { if (!isFinalSubmitting) setActiveQuestionIndex(idx); }}
                        className={`
                          relative px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all duration-150
                          ${isFinalSubmitting ? "cursor-not-allowed opacity-40" : ""}
                          ${isActive
                            ? "bg-violet-600 text-white shadow-lg shadow-violet-900/40"
                            : "bg-[#1a1a1a] text-[#777] border border-[#242424] hover:border-[#333] hover:text-[#aaa]"
                          }
                        `}
                      >
                        <span>Q{idx + 1}</span>
                        {!isActive && (
                          isSubQ ? (
                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500" />
                          ) : (
                            <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${
                              diff === "Easy" ? "bg-emerald-500" : diff === "Medium" ? "bg-amber-500" : "bg-rose-500"
                            }`} />
                          )
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Question detail */}
              {cq && (
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 scrollbar-thin">
                  <div className="space-y-3">
                    <h2 className="text-white font-semibold text-base leading-snug">{cq.title}</h2>
                    <div className="flex flex-wrap gap-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${DIFFICULTY_STYLES[cq.difficulty] || DIFFICULTY_STYLES.Medium}`}>
                        {cq.difficulty}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-violet-500/10 text-violet-400 border border-violet-500/25">
                        {cq.category}
                      </span>
                    </div>
                  </div>

                  <Section label="Description">
                    <p className="text-[#c0c0c0] text-sm leading-relaxed whitespace-pre-wrap">{cq.description}</p>
                  </Section>

                  {publicTestCases.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[#444] text-[10px] font-mono uppercase tracking-widest">Public Test Cases</p>
                      <div className="space-y-2">
                        {publicTestCases.map((tc, i) => (
                          <div key={tc.id ?? i} className="bg-[#161616] border border-[#1e1e1e] rounded-lg overflow-hidden">
                            <div className="px-3 py-2 border-b border-[#1e1e1e] flex items-center gap-2">
                              <span className="w-4 h-4 rounded-full bg-[#242424] border border-[#2e2e2e] flex items-center justify-center text-[10px] font-mono text-[#666]">
                                {i + 1}
                              </span>
                              <span className="text-[11px] font-mono text-[#555]">Case {i + 1}</span>
                            </div>
                            <div className="px-3 py-2.5 space-y-2.5">
                              <div>
                                <p className="text-[10px] font-mono uppercase tracking-widest text-[#444] mb-1">Input</p>
                                <pre className="text-xs text-[#b0b0b0] font-mono bg-[#111] rounded px-2.5 py-2 whitespace-pre-wrap leading-relaxed">{tc.input}</pre>
                              </div>
                              <div>
                                <p className="text-[10px] font-mono uppercase tracking-widest text-[#444] mb-1">Expected Output</p>
                                <pre className="text-xs text-[#b0b0b0] font-mono bg-[#111] rounded px-2.5 py-2 whitespace-pre-wrap leading-relaxed">{getExpectedOutput(tc)}</pre>
                              </div>
                              {tc.explanation && (
                                <div>
                                  <p className="text-[10px] font-mono uppercase tracking-widest text-[#444] mb-1">Explanation</p>
                                  <p className="text-xs text-[#888] leading-relaxed">{tc.explanation}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {cq.constraints && (
                    <Section label="Constraints">
                      <p className="text-[#c0c0c0] text-sm leading-relaxed font-mono whitespace-pre-wrap">{cq.constraints}</p>
                    </Section>
                  )}
                  {cq.inputFormat && (
                    <Section label="Input Format">
                      <p className="text-[#c0c0c0] text-sm leading-relaxed whitespace-pre-wrap">{cq.inputFormat}</p>
                    </Section>
                  )}
                  {cq.outputFormat && (
                    <Section label="Output Format">
                      <p className="text-[#c0c0c0] text-sm leading-relaxed whitespace-pre-wrap">{cq.outputFormat}</p>
                    </Section>
                  )}

                  {/* ── Security Monitoring Panel ── */}
                  <div className="border border-[#1e1e1e] rounded-lg overflow-hidden">
                    <button
                      onClick={() => setMonitoringOpen((v) => !v)}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 bg-[#161616] hover:bg-[#1a1a1a] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-3 h-3 text-[#555]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-[#444]">
                          Assessment Monitoring
                        </span>
                        {(tabSwitchCount + fullscreenExitCount + devToolsOpenCount + largePasteCount) > 0 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        )}
                      </div>
                      <svg
                        className={`w-3 h-3 text-[#444] transition-transform ${monitoringOpen ? "rotate-180" : ""}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {monitoringOpen && (
                      <div className="px-3.5 py-3 bg-[#0f0f0f] space-y-2 border-t border-[#1e1e1e]">
                        {[
                          { label: "Tab Switches",       value: tabSwitchCount,      warn: tabSwitchCount > 0 },
                          { label: "Fullscreen Exits",   value: fullscreenExitCount, warn: fullscreenExitCount > 0 },
                          { label: "DevTools Opens",     value: devToolsOpenCount,   warn: devToolsOpenCount > 0 },
                          { label: "Large Paste Events", value: largePasteCount,     warn: largePasteCount > 0 },
                        ].map(({ label, value, warn }) => (
                          <div key={label} className="flex items-center justify-between">
                            <span className="text-[11px] text-[#555] font-mono">{label}</span>
                            <span className={`text-[11px] font-mono font-semibold ${warn ? "text-amber-400" : "text-[#444]"}`}>
                              {value}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* ── End Security Monitoring Panel ── */}

                </div>
              )}
            </div>
          </Panel>

          {/* Resize handle */}
          <PanelResizeHandle className="w-1 bg-[#1a1a1a] hover:bg-violet-600/60 transition-colors duration-150 cursor-col-resize group relative">
            <div className="absolute inset-y-0 -left-0.5 -right-0.5 group-hover:bg-violet-600/20 transition-colors" />
          </PanelResizeHandle>

          {/* ── RIGHT PANEL ─────────────────────────────────────────────── */}
          <Panel defaultSize={60} minSize={35}>
            <PanelGroup direction="vertical" className="h-full">

              {/* ── Editor sub-panel ───────────────────────────────────── */}
              <Panel defaultSize={72} minSize={40}>
                <div className="h-full bg-[#141414] flex flex-col overflow-hidden">

                  {/* Editor toolbar */}
                  <div className="flex items-center justify-between px-4 py-2.5 bg-[#111] border-b border-[#1f1f1f] shrink-0">
                    <div className="flex items-center gap-1 bg-[#1a1a1a] rounded-lg p-0.5 border border-[#242424]">
                      {(Object.keys(LANGUAGE_LABELS) as Language[]).map((lang) => (
                        <button
                          key={lang}
                          onClick={() => { if (!assessmentSubmitted) setLanguage(lang); }}
                          className={`
                            px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150
                            ${assessmentSubmitted ? "cursor-not-allowed opacity-40" : ""}
                            ${language === lang
                              ? "bg-[#2a2a2a] text-white shadow-sm"
                              : "text-[#666] hover:text-[#aaa]"
                            }
                          `}
                        >
                          {LANGUAGE_LABELS[lang]}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleRunCode}
                        disabled={timerExpired || assessmentSubmitted || isRunning || isFinalSubmitting}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-all"
                      >
                        {isRunning ? (
                          <>
                            <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                            Running…
                          </>
                        ) : <>▶ Run Code</>}
                      </button>

                      <button
                        onClick={handleSubmitQuestion}
                        disabled={timerExpired || assessmentSubmitted || isSubmitting || isCurrentQuestionSubmitted || isFinalSubmitting}
                        className={`
                          flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all border
                          ${isCurrentQuestionSubmitted
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 cursor-default"
                            : "bg-[#1a1a1a] border-[#2a2a2a] text-[#aaa] hover:text-white hover:border-[#333] disabled:opacity-40 disabled:cursor-not-allowed"
                          }
                        `}
                      >
                        {isSubmitting ? (
                          <>
                            <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                            Submitting…
                          </>
                        ) : isCurrentQuestionSubmitted ? (
                          <>
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                            Submitted ✓
                          </>
                        ) : "Submit Question"}
                      </button>

                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                      </div>
                    </div>
                  </div>

                  {/* Monaco Editor */}
                  <div className="flex-1 overflow-hidden">
                    <MonacoEditor
                      height="100%"
                      language={MONACO_LANGUAGE_MAP[language]}
                      value={editorCode}
                      onChange={(val) => {
                        const code = val ?? "";

                        // ── Feature 5: Large Paste Detection ─────────────
                        const added = code.length - prevCodeLengthRef.current;
                        if (added > 300) {
                          const isHighRisk = added > 1000;
                          const label = isHighRisk ? "High Risk Paste Detected" : "Large Paste Detected";
                          largePasteCountRef.current += 1;
                          const next = largePasteCountRef.current;
                          setLargePasteCount(next);
                          showWarning("LARGE_PASTE", `Warning: ${label} (${next})`);
                          fireSecurityEvent("LARGE_PASTE", `added:${added},highRisk:${isHighRisk},count:${next}`);
                        }
                        prevCodeLengthRef.current = code.length;
                        // ── End paste detection ───────────────────────────

                        setEditorCode(code);
                        if (cq) {
                          const cacheKey = `${cq.id}-${language}`;
                          setCodeCache((prev) => ({ ...prev, [cacheKey]: code }));
                        }
                      }}
                      theme="vs-dark"
                      options={{
                        fontSize: 14,
                        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
                        fontLigatures: true,
                        lineHeight: 22,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        wordWrap: "on",
                        tabSize: 2,
                        insertSpaces: true,
                        automaticLayout: true,
                        padding: { top: 16, bottom: 16 },
                        renderLineHighlight: "gutter",
                        cursorBlinking: "smooth",
                        smoothScrolling: true,
                        contextmenu: true,
                        scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
                        readOnly: assessmentSubmitted,
                      }}
                    />
                  </div>
                </div>
              </Panel>

              {/* Vertical resize handle */}
              <PanelResizeHandle className="h-1 bg-[#1a1a1a] hover:bg-violet-600/60 transition-colors duration-150 cursor-row-resize group relative">
                <div className="absolute inset-x-0 -top-0.5 -bottom-0.5 group-hover:bg-violet-600/20 transition-colors" />
              </PanelResizeHandle>

              {/* ── Test Results sub-panel ──────────────────────────────── */}
              <Panel defaultSize={28} minSize={18}>
                <div className="h-full bg-[#111] flex flex-col overflow-hidden">

                  {/* Test Results Panel */}
                  <div className="flex flex-col flex-1 overflow-hidden">

                    {/* Panel header */}
                    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#1a1a1a] shrink-0">
                      <p className="text-[10px] uppercase tracking-widest text-[#555] font-mono">Test Results</p>

                      {runResult && currentSubmission && (
                        <div className="flex items-center gap-1 ml-2 bg-[#1a1a1a] rounded-md p-0.5 border border-[#242424]">
                          <button
                            onClick={() => setResultsView("run")}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-all ${
                              resultsView === "run" ? "bg-[#2a2a2a] text-white" : "text-[#555] hover:text-[#aaa]"
                            }`}
                          >
                            Run
                          </button>
                          <button
                            onClick={() => setResultsView("submit")}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-all ${
                              resultsView === "submit" ? "bg-[#2a2a2a] text-white" : "text-[#555] hover:text-[#aaa]"
                            }`}
                          >
                            Submit
                          </button>
                        </div>
                      )}

                      {resultsView === "run" && runResult && (
                        <span className={`ml-auto text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                          !runResult.success
                            ? "bg-rose-500/15 text-rose-400 border border-rose-500/25"
                            : runResult.status === "PASSED"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                            : "bg-amber-500/15 text-amber-400 border border-amber-500/25"
                        }`}>
                          {runResult.status}
                        </span>
                      )}
                      {resultsView === "submit" && currentSubmission && (
                        <span className={`ml-auto text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                          !currentSubmission.result.success
                            ? "bg-rose-500/15 text-rose-400 border border-rose-500/25"
                            : currentSubmission.result.status === "PASSED"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                            : "bg-amber-500/15 text-amber-400 border border-amber-500/25"
                        }`}>
                          {currentSubmission.result.status}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 overflow-y-auto">

                      {/* ── RUN VIEW ── */}
                      {resultsView === "run" && (
                        <>
                          {!isRunning && !runResult && (
                            <p className="text-[#444] text-xs font-mono text-center py-6">Run your code to see test results</p>
                          )}
                          {isRunning && (
                            <div className="flex items-center gap-3 py-6 justify-center">
                              <svg className="animate-spin w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                              </svg>
                              <span className="text-sm text-[#888] font-mono">Running code…</span>
                            </div>
                          )}
                          {runResult && !runResult.success && (
                            <div className="m-4 rounded-lg border border-rose-500/30 bg-rose-500/5 overflow-hidden">
                              <div className="flex items-center gap-2.5 px-4 py-3 border-b border-rose-500/20 bg-rose-500/[0.07]">
                                <svg className="w-4 h-4 text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 110 18A9 9 0 0112 3z" />
                                </svg>
                                <span className="text-rose-400 text-xs font-semibold">{runResult.status}</span>
                              </div>
                              <pre className="px-4 py-3 text-xs text-rose-300/80 font-mono leading-relaxed whitespace-pre-wrap overflow-auto">{runResult.error}</pre>
                            </div>
                          )}
                          {runResult && runResult.success && (
                            <div className="p-4 space-y-3">
                              <div className="flex items-center gap-3 pb-1">
                                {runResult.status === "PASSED" ? (
                                  <div className="flex items-center gap-2">
                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40">
                                      <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                      </svg>
                                    </span>
                                    <span className="text-emerald-400 text-sm font-semibold">Accepted</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-rose-500/20 border border-rose-500/40">
                                      <svg className="w-3 h-3 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </span>
                                    <span className="text-rose-400 text-sm font-semibold">Wrong Answer</span>
                                  </div>
                                )}
                                <span className="text-[#555] text-xs font-mono ml-auto">
                                  Passed {runResult.passedCases} / {runResult.totalCases} Public Test Cases
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {runResult.results.map((tc, i) => (
                                  <button
                                    key={tc.testCaseNo}
                                    onClick={() => setActiveTestCase(i)}
                                    className={`
                                      flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-all border
                                      ${activeTestCase === i
                                        ? tc.passed
                                          ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                                          : "bg-rose-500/20 border-rose-500/50 text-rose-300"
                                        : tc.passed
                                          ? "bg-[#1a1a1a] border-emerald-500/20 text-emerald-600 hover:border-emerald-500/40 hover:text-emerald-400"
                                          : "bg-[#1a1a1a] border-rose-500/20 text-rose-600 hover:border-rose-500/40 hover:text-rose-400"
                                      }
                                    `}
                                  >
                                    {tc.passed ? (
                                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                      </svg>
                                    ) : (
                                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    )}
                                    Case {tc.testCaseNo}
                                  </button>
                                ))}
                              </div>
                              {runResult.results[activeTestCase] && (() => {
                                const tc       = runResult.results[activeTestCase];
                                const caseData = getResultCaseData(tc, activeTestCase);
                                return (
                                  <div className="bg-[#161616] border border-[#1e1e1e] rounded-lg overflow-hidden">
                                    <div className="divide-y divide-[#1e1e1e]">
                                      <div className="px-4 py-3 space-y-1.5">
                                        <p className="text-[10px] font-mono uppercase tracking-widest text-[#444]">Input</p>
                                        <pre className="text-xs text-[#b0b0b0] font-mono bg-[#111] rounded px-2.5 py-2 whitespace-pre-wrap leading-relaxed">{caseData.input}</pre>
                                      </div>
                                      <div className="px-4 py-3 space-y-1.5">
                                        <p className="text-[10px] font-mono uppercase tracking-widest text-[#444]">Expected Output</p>
                                        <pre className="text-xs text-emerald-300/80 font-mono bg-emerald-500/5 border border-emerald-500/15 rounded px-2.5 py-2 whitespace-pre-wrap leading-relaxed">{caseData.expected}</pre>
                                      </div>
                                      {!tc.passed && caseData.received !== undefined && (
                                        <div className="px-4 py-3 space-y-1.5">
                                          <p className="text-[10px] font-mono uppercase tracking-widest text-[#444]">Your Output</p>
                                          <pre className="text-xs text-rose-300/80 font-mono bg-rose-500/5 border border-rose-500/15 rounded px-2.5 py-2 whitespace-pre-wrap leading-relaxed">{caseData.received}</pre>
                                        </div>
                                      )}
                                      <div className="px-4 py-2.5 flex items-center gap-2">
                                        <p className="text-[10px] font-mono uppercase tracking-widest text-[#444]">Status</p>
                                        <span className={`ml-auto inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                                          tc.passed
                                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                                            : "bg-rose-500/15 text-rose-400 border border-rose-500/25"
                                        }`}>
                                          {tc.passed ? (
                                            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                          ) : (
                                            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                          )}
                                          {tc.passed ? "Passed" : "Failed"}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </>
                      )}

                      {/* ── SUBMIT VIEW ── */}
                      {resultsView === "submit" && (
                        <>
                          {isSubmitting && (
                            <div className="flex items-center gap-3 py-6 justify-center">
                              <svg className="animate-spin w-4 h-4 text-violet-500" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                              </svg>
                              <span className="text-sm text-[#888] font-mono">Submitting…</span>
                            </div>
                          )}
                          {!isSubmitting && !currentSubmission && (
                            <p className="text-[#444] text-xs font-mono text-center py-6">Submit your solution to see results</p>
                          )}
                          {!isSubmitting && currentSubmission && !currentSubmission.result.success && (
                            <div className="m-4 rounded-lg border border-rose-500/30 bg-rose-500/5 overflow-hidden">
                              <div className="flex items-center gap-2.5 px-4 py-3 border-b border-rose-500/20 bg-rose-500/[0.07]">
                                <svg className="w-4 h-4 text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 110 18A9 9 0 0112 3z" />
                                </svg>
                                <span className="text-rose-400 text-xs font-semibold">{currentSubmission.result.status}</span>
                              </div>
                              <pre className="px-4 py-3 text-xs text-rose-300/80 font-mono leading-relaxed whitespace-pre-wrap overflow-auto">
                                {(currentSubmission.result as SubmitError).error}
                              </pre>
                            </div>
                          )}
                          {!isSubmitting && currentSubmission && currentSubmission.result.success && (
                            <div className="p-4 space-y-3">
                              <div className="flex items-center gap-3 pb-1">
                                {currentSubmission.result.status === "PASSED" ? (
                                  <div className="flex items-center gap-2">
                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40">
                                      <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                      </svg>
                                    </span>
                                    <span className="text-emerald-400 text-sm font-semibold">Accepted</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-rose-500/20 border border-rose-500/40">
                                      <svg className="w-3 h-3 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </span>
                                    <span className="text-rose-400 text-sm font-semibold">Failed Hidden Test Cases</span>
                                  </div>
                                )}
                                <span className="text-[#555] text-xs font-mono ml-auto">
                                  Passed {(currentSubmission.result as SubmitSuccess).passedCases} / {(currentSubmission.result as SubmitSuccess).totalCases} Hidden Test Cases
                                </span>
                              </div>
                              <div className="bg-[#161616] border border-[#1e1e1e] rounded-lg overflow-hidden">
                                <div className="divide-y divide-[#1e1e1e]">
                                  <div className="px-4 py-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <p className="text-[10px] font-mono uppercase tracking-widest text-[#444]">Score</p>
                                      <span className="text-xs font-mono text-[#888]">
                                        {(currentSubmission.result as SubmitSuccess).passedCases} / {(currentSubmission.result as SubmitSuccess).totalCases}
                                      </span>
                                    </div>
                                    <div className="w-full bg-[#1e1e1e] rounded-full h-1.5 overflow-hidden">
                                      <div
                                        className={`h-full rounded-full transition-all ${
                                          currentSubmission.result.status === "PASSED" ? "bg-emerald-500" : "bg-amber-500"
                                        }`}
                                        style={{
                                          width: `${Math.round(
                                            ((currentSubmission.result as SubmitSuccess).passedCases /
                                              (currentSubmission.result as SubmitSuccess).totalCases) * 100
                                          )}%`,
                                        }}
                                      />
                                    </div>
                                  </div>
                                  <div className="px-4 py-2.5 flex items-center gap-2">
                                    <p className="text-[10px] font-mono uppercase tracking-widest text-[#444]">Submission ID</p>
                                    <span className="ml-auto text-[10px] font-mono text-[#555]">
                                      {(currentSubmission.result as SubmitSuccess).submissionId}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}

                    </div>
                  </div>

                </div>
              </Panel>

            </PanelGroup>
          </Panel>

        </PanelGroup>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-[#444] text-[10px] font-mono uppercase tracking-widest">{label}</p>
      <div className="bg-[#161616] rounded-lg px-3.5 py-3 border border-[#1e1e1e]">
        {children}
      </div>
    </div>
  );
}