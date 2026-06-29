"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { API_BASE_URL } from '@/lib/api';

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

// ─── Interfaces ────────────────────────────────────────────────────────────────

interface StarterCode {
  language: string;
  code: string;
}

interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

interface Question {
  id: string;
  title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  category: string;
  description: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  starterCodes: {
    python?: string;
    java?: string;
    cpp?: string;
    javascript?: string;
    c?: string;
  };
  testCases: TestCase[];
}

interface CodingTest {
  title: string;
  description: string;
  duration: number;
  securityLevel: string;
  questions: Question[];
}

interface Attempt {
  id: string;
  status: string;
  codingTest: CodingTest;
}

interface RunTestResult {
  testCaseNo: number;       // was testCaseId: string
  passed: boolean;
  input?: string;
  expected?: string;        // was expectedOutput
  received?: string;        // was actualOutput
  error?: string;
}

interface RunResult {
  success: boolean;
  status: string;
  passedCases: number;
  totalCases: number;
  error?: string;           // compile error / TLE / runtime message
  results?: RunTestResult[];
}
interface SubmitResult {
  success: boolean;
  status: string;
  passedCases: number;
  totalCases: number;
  score: number;
  executionTime?: number;
  memoryUsed?: number;
}

interface FinalSubmitResult {
  success: boolean;
  totalScore: number;
  completedQuestions: number;
  totalQuestions: number;
  percentage: number;
}

interface QuestionState {
  status: "NOT_STARTED" | "ATTEMPTED" | "SUBMITTED" | "PASSED" | "PARTIAL" | "FAILED";
  score: number;
  passedCases: number;
  totalCases: number;
  language: Language;
  code: string;
}

type Language = "cpp" | "java" | "python" | "javascript" | "c";

interface Toast {
  id: string;
  message: string;
  type: "warning" | "error" | "success" | "info";
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const MAX_WARNINGS = 5;

const LANGUAGE_LABELS: Record<Language, string> = {
  cpp: "C++",
  java: "Java",
  python: "Python",
  javascript: "JavaScript",
  c: "C",
};

const MONACO_LANGUAGE_MAP: Record<Language, string> = {
  cpp: "cpp",
  java: "java",
  python: "python",
  javascript: "javascript",
  c: "c",
};

const STATUS_CONFIG = {
  NOT_STARTED: { label: "Not Started", color: "#6b7280", bg: "rgba(107,114,128,0.15)" },
  ATTEMPTED:   { label: "Attempted",   color: "#f59e0b", bg: "rgba(245,158,11,0.15)"  },
  SUBMITTED:   { label: "Submitted",   color: "#3b82f6", bg: "rgba(59,130,246,0.15)"  },
  PASSED:      { label: "Passed",      color: "#10b981", bg: "rgba(16,185,129,0.15)"  },
  PARTIAL:     { label: "Partial",     color: "#f97316", bg: "rgba(249,115,22,0.15)"  },
  FAILED:      { label: "Failed",      color: "#ef4444", bg: "rgba(239,68,68,0.15)"   },
};

// Color for compact question navigator dots
const STATUS_DOT_COLOR: Record<string, string> = {
  NOT_STARTED: "#6b7280",
  ATTEMPTED:   "#f59e0b",
  SUBMITTED:   "#3b82f6",
  PASSED:      "#10b981",
  PARTIAL:     "#f97316",
  FAILED:      "#ef4444",
};

const DIFFICULTY_CONFIG = {
  EASY:   { label: "Easy",   color: "#10b981" },
  MEDIUM: { label: "Medium", color: "#f59e0b" },
  HARD:   { label: "Hard",   color: "#ef4444" },
};

// ─── Helper Functions ──────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function getStorageKey(attemptId: string, questionId: string, language: string): string {
  return `${attemptId}-${questionId}-${language}`;
}

function generateId(): string {
  return Math.random().toString(36).slice(2);
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function BasicAssessmentPage() {
  const params   = useParams();
  const router   = useRouter();
  const attemptId = params.attemptId as string;

  // Core state
  const [attempt, setAttempt]               = useState<Attempt | null>(null);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState<string | null>(null);
  const [selectedQIndex, setSelectedQIndex] = useState(0);
  const [language, setLanguage]             = useState<Language>("python");
  const [code, setCode]                     = useState("");
  const [timeLeft, setTimeLeft]             = useState(0);
  const [warnings, setWarnings]             = useState(0);
  const [questionStates, setQuestionStates] = useState<Record<string, QuestionState>>({});
  const [runResult, setRunResult]           = useState<RunResult | null>(null);
  const [submitResult, setSubmitResult]     = useState<SubmitResult | null>(null);
  const [isRunning, setIsRunning]           = useState(false);
  const [isSubmitting, setIsSubmitting]     = useState(false);
  const [isFinalSubmitting, setIsFinalSubmitting] = useState(false);
  const [showFinalConfirm, setShowFinalConfirm]   = useState(false);
  const [showWarningModal, setShowWarningModal]   = useState(false);
  const [warningModalMsg, setWarningModalMsg]     = useState("");
  const [toasts, setToasts]                 = useState<Toast[]>([]);
  const [activeResultTab, setActiveResultTab] = useState<"testcases" | "result">("testcases");
  const [leftPanelWidth, setLeftPanelWidth]   = useState(80);
  const [centerPanelWidth, setCenterPanelWidth] = useState(420);

  // Security gate — candidate must click "Enter Assessment" first
  const [securityReady, setSecurityReady]   = useState(false);
  // Countdown for auto-submit after max warnings
  const [autoSubmitCountdown, setAutoSubmitCountdown] = useState<number | null>(null);

  // Autosave debounce
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAutoSubmitting   = useRef(false);
  const timerRef           = useRef<ReturnType<typeof setInterval> | null>(null);
  const autosaveRef        = useRef<ReturnType<typeof setInterval> | null>(null);
  const warningsRef        = useRef(0);
  const attempIdRef        = useRef(attemptId);
  const draggingLeft       = useRef(false);
  const draggingCenter     = useRef(false);
  const securityReadyRef   = useRef(false);

  // ─── Toast ──────────────────────────────────────────────────────────────────

  const addToast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = generateId();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  // ─── Security Event Logger ───────────────────────────────────────────────────

  const logSecurityEvent = useCallback(async (eventType: string, details?: Record<string, any>) => {
    try {
      const token = localStorage.getItem("access_token") || "";
      await fetch(`${API_BASE_URL}/coding-attempts/${attemptId}/security-event`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventType,
          details: {
            ...details,
            timestamp: new Date().toISOString(),
            url: typeof window !== "undefined" ? window.location.href : "",
          },
        }),
      });
    } catch (err) {
      console.error("Security Event Error", err);
    }
  }, [attemptId]);

  // ─── Final Submit (direct, no confirm) ──────────────────────────────────────

  const handleFinalSubmitDirect = useCallback(async () => {
    try {
      const token = localStorage.getItem("access_token") || "";
      const res = await fetch(
        `${API_BASE_URL}/coding-attempts/${attemptId}/basic/final-submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data: FinalSubmitResult = await res.json();
      if (!res.ok) throw new Error("Final submit failed");
      if (data.success) {
        addToast("Assessment submitted successfully", "success");
        if (document.fullscreenElement) await document.exitFullscreen();
        setTimeout(() => router.push("/tests/thank-you"), 1000);
      }
    } catch {
      addToast("Submission failed. Please try again.", "error");
    } finally {
      setIsFinalSubmitting(false);
    }
  }, [attemptId, addToast, router]);

  // ─── Warning System ─────────────────────────────────────────────────────────

  const addWarning = useCallback(
    (msg: string) => {
      // Only count warnings after security monitoring is enabled
      if (!securityReadyRef.current) return;

      warningsRef.current += 1;
      setWarnings(warningsRef.current);
      setWarningModalMsg(msg);
      setShowWarningModal(true);
      addToast(`⚠️ Warning ${warningsRef.current}/${MAX_WARNINGS}: ${msg}`, "warning");

      if (warningsRef.current >= MAX_WARNINGS) {
        // Start 5-second countdown then auto-submit
        let count = 5;
        setAutoSubmitCountdown(count);
        const interval = setInterval(() => {
          count -= 1;
          setAutoSubmitCountdown(count);
          if (count <= 0) {
            clearInterval(interval);
            setAutoSubmitCountdown(null);
            if (!isAutoSubmitting.current) {
              isAutoSubmitting.current = true;
              addToast("Maximum warnings reached. Auto-submitting...", "error");
              handleFinalSubmitDirect();
            }
          }
        }, 1000);
      }
    },
    [addToast, handleFinalSubmitDirect]
  );

  // ─── Enter Assessment (security gate) ───────────────────────────────────────

  const handleEnterAssessment = useCallback(async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // fullscreen may be denied; proceed anyway
    }
    // Enable security monitoring only after user-initiated entry
    securityReadyRef.current = true;
    setSecurityReady(true);
  }, []);

  // ─── Load Attempt ────────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchAttempt = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("access_token") || "" : "";
        const res = await fetch(`${API_BASE_URL}/coding-attempts/${attemptId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("TOKEN:", token);
        console.log("STATUS:", res.status);
        console.log("CONTENT-TYPE:", res.headers.get("content-type"));

        const text = await res.text();
        console.log("RAW RESPONSE:", text);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const rawData = text ? JSON.parse(text) : null;
        console.log("PARSED DATA:", rawData);

        const data: Attempt = {
          ...rawData,
          codingTest: {
            ...rawData.codingTest,
            questions: rawData.codingTest.questions.map((q: any) => q.question),
          },
        };

        setAttempt(data);
        setTimeLeft(data.codingTest.duration * 60);

        const initial: Record<string, QuestionState> = {};
        data.codingTest.questions.forEach((q) => {
          initial[q.id] = {
            status: "NOT_STARTED",
            score: 0,
            passedCases: 0,
            totalCases: 0,
            language: "python",
            code: "",
          };
        });
        setQuestionStates(initial);

        if (data.codingTest.questions.length > 0) {
          const firstQ = data.codingTest.questions[0];
          const savedCode = localStorage.getItem(getStorageKey(attemptId, firstQ.id, "python"));
          setCode(savedCode || firstQ.starterCodes?.python || "");
        }
      } catch (e: unknown) {
        console.error("🚨 Fetch Attempt Error:", e);
        setError(e instanceof Error ? e.message : "Failed to load assessment");
      } finally {
        setLoading(false);
      }
    };
    fetchAttempt();
  }, [attemptId]);

  // ─── Timer ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!attempt || !securityReady) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          if (!isAutoSubmitting.current) {
            isAutoSubmitting.current = true;
            addToast("Time's up! Auto-submitting...", "error");
            handleFinalSubmitDirect();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [attempt, securityReady, addToast, handleFinalSubmitDirect]);

  // ─── Autosave — debounced on typing ─────────────────────────────────────────

  useEffect(() => {
    if (!attempt) return;
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      const q = attempt.codingTest.questions[selectedQIndex];
      if (q) {
        localStorage.setItem(getStorageKey(attempIdRef.current, q.id, language), code);
      }
    }, 2000);
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [code, attempt, selectedQIndex, language]);

  // ─── Security Handlers ───────────────────────────────────────────────────────

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        logSecurityEvent("TAB_SWITCH", { warningCount: warningsRef.current + 1 });
        addWarning("Tab switching is not allowed.");
      }
    };

    const handleBlur = () => {
      logSecurityEvent("WINDOW_BLUR", { warningCount: warningsRef.current + 1 });
      addWarning("Window focus lost. Stay on the assessment.");
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      logSecurityEvent("RIGHT_CLICK", { x: e.clientX, y: e.clientY });
      addWarning("Right-clicking is not allowed.");
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      logSecurityEvent("COPY_ATTEMPT", {
        selectedText: window.getSelection()?.toString().slice(0, 100),
      });
      addWarning("Copying content is not allowed.");
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      logSecurityEvent("PASTE_ATTEMPT");
      addWarning("Pasting content is not allowed.");
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const isDevTools =
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key.toUpperCase()));
      const isBlockedShortcut =
        e.ctrlKey && ["c", "v", "x", "a"].includes(e.key.toLowerCase());

      if (isDevTools) {
        e.preventDefault();
        logSecurityEvent("DEVTOOLS_SHORTCUT", { key: e.key });
        addWarning("Developer tools are not allowed.");
        return;
      }
      if (isBlockedShortcut) {
        e.preventDefault();
        logSecurityEvent("KEYBOARD_SHORTCUT_BLOCKED", { key: `Ctrl+${e.key.toUpperCase()}` });
        addWarning("Keyboard shortcut blocked.");
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        logSecurityEvent("FULLSCREEN_EXIT", { warningCount: warningsRef.current + 1 });
        addWarning("Exiting fullscreen is not allowed.");
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [addWarning, logSecurityEvent]);

  // ─── Question Change ─────────────────────────────────────────────────────────

  const handleQuestionChange = useCallback(
    (idx: number) => {
      if (!attempt) return;
      // Save current before switching
      const currentQ = attempt.codingTest.questions[selectedQIndex];
      if (currentQ) {
        localStorage.setItem(getStorageKey(attemptId, currentQ.id, language), code);
      }

      const q = attempt.codingTest.questions[idx];
      const savedLang = (questionStates[q.id]?.language || "python") as Language;
      const savedCode =
        localStorage.getItem(getStorageKey(attemptId, q.id, savedLang)) ||
        q.starterCodes?.[savedLang] ||
        "";
      setSelectedQIndex(idx);
      setLanguage(savedLang);
      setCode(savedCode);
      setRunResult(null);
      setSubmitResult(null);
      setActiveResultTab("testcases");
    },
    [attempt, attemptId, questionStates, selectedQIndex, language, code]
  );

  const handleLanguageChange = useCallback(
    (lang: Language) => {
      if (!attempt) return;
      const q = attempt.codingTest.questions[selectedQIndex];
      // Save current code first
      localStorage.setItem(getStorageKey(attemptId, q.id, language), code);
      const savedCode =
        localStorage.getItem(getStorageKey(attemptId, q.id, lang)) ||
        q.starterCodes?.[lang] ||
        "";
      setLanguage(lang);
      setCode(savedCode);
      setQuestionStates((prev) => ({
        ...prev,
        [q.id]: { ...prev[q.id], language: lang },
      }));
    },
    [attempt, attemptId, language, code, selectedQIndex]
  );

  // ─── Run Code ────────────────────────────────────────────────────────────────

  const handleRunCode = async () => {
    if (!attempt) return;
    const q = attempt.codingTest.questions[selectedQIndex];
    setIsRunning(true);
    setRunResult(null);
    setActiveResultTab("result");
    try {
      const token = localStorage.getItem("access_token") || "";
      const res = await fetch(`${API_BASE_URL}/coding-submissions/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ attemptId, questionId: q.id, language, sourceCode: code }),
      });
      const data: RunResult = await res.json();
      setRunResult(data);
      if (questionStates[q.id]?.status === "NOT_STARTED") {
        setQuestionStates((prev) => ({
          ...prev,
          [q.id]: { ...prev[q.id], status: "ATTEMPTED" },
        }));
      }
    } catch {
      addToast("Failed to run code. Check your connection.", "error");
    } finally {
      setIsRunning(false);
    }
  };

  // ─── Submit Code ─────────────────────────────────────────────────────────────

  const handleSubmitCode = async () => {
    if (!attempt) return;
    const q = attempt.codingTest.questions[selectedQIndex];
    setIsSubmitting(true);
    setSubmitResult(null);
    setActiveResultTab("result");
    try {
      const token = localStorage.getItem("access_token") || "";
      const res = await fetch(`${API_BASE_URL}/coding-submissions/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ attemptId, questionId: q.id, language, sourceCode: code }),
      });
      const data: SubmitResult = await res.json();
      setSubmitResult(data);

      const status: QuestionState["status"] =
        data.status === "PASSED" ? "PASSED"
        : data.status === "PARTIAL" ? "PARTIAL"
        : data.passedCases > 0 ? "PARTIAL"
        : "FAILED";

      setQuestionStates((prev) => ({
        ...prev,
        [q.id]: {
          ...prev[q.id],
          status,
          score: data.score,
          passedCases: data.passedCases,
          totalCases: data.totalCases,
        },
      }));

      localStorage.setItem(getStorageKey(attemptId, q.id, language), code);
      addToast(
        `Submitted! ${data.passedCases}/${data.totalCases} test cases passed.`,
        data.status === "PASSED" ? "success" : "warning"
      );
    } catch {
      addToast("Failed to submit. Try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Final Submit (with confirm modal) ───────────────────────────────────────

  const handleFinalSubmit = async () => {
    setShowFinalConfirm(false);
    setIsFinalSubmitting(true);
    await handleFinalSubmitDirect();
  };

  // ─── Resizable Panels ────────────────────────────────────────────────────────

  const handleLeftDividerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    draggingLeft.current = true;
    const startX = e.clientX;
    const startW = leftPanelWidth;
    const onMove = (ev: MouseEvent) => {
      if (!draggingLeft.current) return;
      setLeftPanelWidth(Math.max(60, Math.min(200, startW + (ev.clientX - startX))));
    };
    const onUp = () => {
      draggingLeft.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const handleCenterDividerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    draggingCenter.current = true;
    const startX = e.clientX;
    const startW = centerPanelWidth;
    const onMove = (ev: MouseEvent) => {
      if (!draggingCenter.current) return;
      setCenterPanelWidth(Math.max(300, Math.min(700, startW + (ev.clientX - startX))));
    };
    const onUp = () => {
      draggingCenter.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // ─── Derived ─────────────────────────────────────────────────────────────────

  const currentQuestion  = attempt?.codingTest.questions[selectedQIndex];
  const publicTestCases  = currentQuestion?.testCases.filter((t) => !t.isHidden) || [];
  const timerColor       = timeLeft < 300 ? "#ef4444" : timeLeft < 600 ? "#f59e0b" : "#10b981";

  // Final submit modal — score summary
  const completedCount = Object.values(questionStates).filter(
    (s) => s.status === "PASSED" || s.status === "PARTIAL"
  ).length;
  const totalScore = Object.values(questionStates).reduce((sum, s) => sum + (s.score || 0), 0);

  // ─── Loading / Error ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingInner}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Loading Assessment...</p>
          <p style={styles.loadingSubtext}>Preparing your coding environment</p>
        </div>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div style={styles.loadingContainer}>
        <div style={{ ...styles.loadingInner, gap: 12 }}>
          <div style={{ fontSize: 48 }}>⚠️</div>
          <p style={{ ...styles.loadingText, color: "#ef4444" }}>Failed to Load</p>
          <p style={styles.loadingSubtext}>{error}</p>
          <button onClick={() => router.back()} style={styles.retryBtn}>Go Back</button>
        </div>
      </div>
    );
  }

  // ─── Security Gate ────────────────────────────────────────────────────────────

  if (!securityReady) {
    return (
      <>
        <style>{globalStyles}</style>
        <div style={styles.gateOverlay}>
          <div style={styles.gateCard}>
            <div style={styles.gateIcon}>⌨️</div>
            <h2 style={styles.gateTitle}>{attempt.codingTest.title}</h2>
            <p style={styles.gateDesc}>
              This assessment uses fullscreen mode and security monitoring. Once you enter,
              switching tabs, exiting fullscreen, or using developer tools will be recorded.
            </p>
            <div style={styles.gateMetaRow}>
              <div style={styles.gateMeta}>
                <span style={styles.gateMetaLabel}>Duration</span>
                <span style={styles.gateMetaValue}>{attempt.codingTest.duration} min</span>
              </div>
              <div style={styles.gateMeta}>
                <span style={styles.gateMetaLabel}>Questions</span>
                <span style={styles.gateMetaValue}>{attempt.codingTest.questions.length}</span>
              </div>
              <div style={styles.gateMeta}>
                <span style={styles.gateMetaLabel}>Security</span>
                <span style={styles.gateMetaValue}>{attempt.codingTest.securityLevel}</span>
              </div>
            </div>
            <button style={styles.gateBtn} onClick={handleEnterAssessment}>
              Enter Assessment →
            </button>
          </div>
        </div>
      </>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{globalStyles}</style>

      {/* Toast Container */}
      <div style={styles.toastContainer}>
        {toasts.map((t) => (
          <div key={t.id} style={{ ...styles.toast, ...toastTypeStyles[t.type] }}>
            {t.message}
          </div>
        ))}
      </div>

      {/* Warning Modal */}
      {showWarningModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalIcon}>⚠️</div>
            <h3 style={styles.modalTitle}>Security Warning</h3>
            <p style={styles.modalMsg}>{warningModalMsg}</p>
            <div style={styles.warningBadge}>
              Warnings: {warnings}/{MAX_WARNINGS}
              {autoSubmitCountdown !== null && ` — Auto-submitting in ${autoSubmitCountdown}s`}
            </div>
            {warnings < MAX_WARNINGS && (
              <button style={styles.modalBtn} onClick={() => setShowWarningModal(false)}>
                Acknowledge
              </button>
            )}
          </div>
        </div>
      )}

      {/* Final Submit Confirmation */}
      {showFinalConfirm && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modal, maxWidth: 520 }}>
            <div style={styles.modalIcon}>🚀</div>
            <h3 style={styles.modalTitle}>Submit Assessment?</h3>
            <p style={styles.modalMsg}>
              You cannot change your answers after submission.
            </p>
            <div style={styles.finalSummaryGrid}>
              <div style={styles.finalSummaryItem}>
                <span style={styles.finalSummaryLabel}>Solved</span>
                <span style={styles.finalSummaryValue}>
                  {completedCount}/{attempt.codingTest.questions.length}
                </span>
              </div>
              <div style={styles.finalSummaryItem}>
                <span style={styles.finalSummaryLabel}>Score</span>
                <span style={{ ...styles.finalSummaryValue, color: "#6366f1" }}>{totalScore}</span>
              </div>
              <div style={styles.finalSummaryItem}>
                <span style={styles.finalSummaryLabel}>Warnings</span>
                <span
                  style={{
                    ...styles.finalSummaryValue,
                    color: warnings >= 4 ? "#ef4444" : warnings >= 2 ? "#f59e0b" : "#10b981",
                  }}
                >
                  {warnings}/{MAX_WARNINGS}
                </span>
              </div>
            </div>

            {/* Security breakdown in submit modal */}
            {warnings > 0 && (
              <div style={{
                width: "100%",
                background: "rgba(239,68,68,0.06)",
                border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 10,
                padding: "12px 16px",
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#f87171", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 8 }}>
                  ⚠️ Security Violations Recorded
                </div>
                <div style={{ fontSize: 12, color: "#8b949e", lineHeight: 1.6 }}>
                  Your activity has been flagged. These violations will be visible to the recruiter in the assessment report.
                </div>
              </div>
            )}

            <div style={styles.modalActions}>
              <button
                style={{ ...styles.modalBtn, background: "#374151" }}
                onClick={() => setShowFinalConfirm(false)}
              >
                Cancel
              </button>
              <button style={styles.modalBtn} onClick={handleFinalSubmit} disabled={isFinalSubmitting}>
                {isFinalSubmitting ? "Submitting..." : "Submit Now"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.root}>
        {/* ── Header ── */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.assessmentTitle}>
              <span style={styles.titleIcon}>⌨️</span>
              {attempt.codingTest.title}
            </div>
            <span style={styles.headerDivider} />
            <span style={styles.headerMeta}>{attempt.codingTest.questions.length} Questions</span>
          </div>

          <div style={styles.headerCenter}>
            <div style={{ ...styles.timerBox, color: timerColor, borderColor: timerColor + "40" }}>
              <span style={styles.timerIcon}>⏱</span>
              <span style={styles.timerText}>{formatTime(timeLeft)}</span>
            </div>
          </div>

          <div style={styles.headerRight}>
            <div style={styles.securityBadge}>
              <span style={styles.securityDot} />
              {attempt.codingTest.securityLevel}
            </div>
            <div
              style={{
                ...styles.warningBadgeHeader,
                color:   warnings >= 4 ? "#ef4444" : warnings >= 2 ? "#f59e0b" : "#6b7280",
                borderColor: warnings >= 4 ? "#ef444440" : warnings >= 2 ? "#f59e0b40" : "#374151",
              }}
            >
              ⚠️ {warnings}/{MAX_WARNINGS}
            </div>
            <button
              style={styles.submitBtn}
              onClick={() => setShowFinalConfirm(true)}
              disabled={isFinalSubmitting}
            >
              {isFinalSubmitting ? <span style={styles.btnSpinner} /> : "Submit Assessment"}
            </button>
          </div>
        </header>

        {/* ── Body ── */}
        <div style={styles.body}>
          {/* Left Panel: Compact Question Navigator */}
          <div style={{ ...styles.leftPanel, width: leftPanelWidth, minWidth: leftPanelWidth }}>
            <div style={styles.panelHeader}>Q</div>
            <div style={styles.questionList}>
              {attempt.codingTest.questions.map((q, i) => {
                const qs      = questionStates[q.id];
                const status  = qs?.status || "NOT_STARTED";
                const dotColor = STATUS_DOT_COLOR[status];
                const isActive = i === selectedQIndex;
                return (
                  <button
                    key={q.id}
                    title={`Q${i + 1}: ${q.title} (${status.replace("_", " ")})`}
                    style={{
                      ...styles.questionDot,
                      background:   isActive ? "rgba(99,102,241,0.2)" : "transparent",
                      borderColor:  isActive ? "#6366f1" : dotColor + "60",
                      color:        dotColor,
                    }}
                    onClick={() => handleQuestionChange(i)}
                  >
                    <span
                      style={{
                        ...styles.dotIndicator,
                        background: dotColor,
                        boxShadow: isActive ? `0 0 6px ${dotColor}` : "none",
                      }}
                    />
                    <span style={styles.dotLabel}>Q{i + 1}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Left Divider */}
          <div style={styles.divider} onMouseDown={handleLeftDividerMouseDown} />

          {/* Center Panel: Question Details */}
          <div style={{ ...styles.centerPanel, width: centerPanelWidth, minWidth: centerPanelWidth }}>
            {currentQuestion ? (
              <div style={styles.questionDetail}>
                {/* Question Header */}
                <div style={styles.questionDetailHeader}>
                  <div>
                    <h2 style={styles.questionDetailTitle}>
                      Q{selectedQIndex + 1}. {currentQuestion.title}
                    </h2>
                    <div style={styles.questionDetailMeta}>
                      <span
                        style={{
                          color: DIFFICULTY_CONFIG[currentQuestion.difficulty]?.color,
                          fontWeight: 600,
                          fontSize: 13,
                        }}
                      >
                        {currentQuestion.difficulty}
                      </span>
                      <span style={styles.metaDot} />
                      <span style={styles.categoryChip}>{currentQuestion.category}</span>
                    </div>
                  </div>
                  {questionStates[currentQuestion.id] && (
                    <div
                      style={{
                        ...styles.qStatusBig,
                        color:      STATUS_CONFIG[questionStates[currentQuestion.id].status].color,
                        background: STATUS_CONFIG[questionStates[currentQuestion.id].status].bg,
                      }}
                    >
                      {STATUS_CONFIG[questionStates[currentQuestion.id].status].label}
                    </div>
                  )}
                </div>

                <div style={styles.descriptionSection}>
                  <p style={styles.descriptionText}>{currentQuestion.description}</p>
                </div>

                {currentQuestion.inputFormat && (
                  <div style={styles.section}>
                    <h4 style={styles.sectionTitle}>Input Format</h4>
                    <p style={styles.sectionText}>{currentQuestion.inputFormat}</p>
                  </div>
                )}

                {currentQuestion.outputFormat && (
                  <div style={styles.section}>
                    <h4 style={styles.sectionTitle}>Output Format</h4>
                    <p style={styles.sectionText}>{currentQuestion.outputFormat}</p>
                  </div>
                )}

                {currentQuestion.constraints && (
                  <div style={styles.section}>
                    <h4 style={styles.sectionTitle}>Constraints</h4>
                    <pre style={styles.constraintsPre}>{currentQuestion.constraints}</pre>
                  </div>
                )}

                {publicTestCases.length > 0 && (
                  <div style={styles.section}>
                    <h4 style={styles.sectionTitle}>Example Test Cases</h4>
                    {publicTestCases.map((tc, i) => (
                      <div key={tc.id} style={styles.testCaseBlock}>
                        <div style={styles.tcLabel}>Example {i + 1}</div>
                        <div style={styles.tcRow}>
                          <span style={styles.tcKey}>Input:</span>
                          <pre style={styles.tcPre}>{tc.input}</pre>
                        </div>
                        <div style={styles.tcRow}>
                          <span style={styles.tcKey}>Output:</span>
                          <pre style={styles.tcPre}>{tc.expectedOutput}</pre>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ height: 40 }} />
              </div>
            ) : (
              <div style={styles.emptyCenter}>Select a question to begin</div>
            )}
          </div>

          {/* Center Divider */}
          <div style={styles.divider} onMouseDown={handleCenterDividerMouseDown} />

          {/* Right Panel: Editor */}
          <div style={styles.rightPanel}>
            {/* Editor Toolbar */}
            <div style={styles.editorToolbar}>
              <div style={styles.editorToolbarLeft}>
                <select
                  style={styles.langSelect}
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value as Language)}
                >
                  {(Object.keys(LANGUAGE_LABELS) as Language[]).map((l) => (
                    <option key={l} value={l}>{LANGUAGE_LABELS[l]}</option>
                  ))}
                </select>
              </div>
              <div style={styles.editorToolbarRight}>
                <button style={styles.runBtn} onClick={handleRunCode} disabled={isRunning}>
                  {isRunning ? (
                    <><span style={styles.btnSpinner} /> Running...</>
                  ) : (
                    <>▶ Run Code</>
                  )}
                </button>
                <button style={styles.submitCodeBtn} onClick={handleSubmitCode} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <><span style={styles.btnSpinner} /> Submitting...</>
                  ) : (
                    "Submit Code"
                  )}
                </button>
              </div>
            </div>

            {/* Monaco Editor */}
            <div style={styles.editorWrapper}>
              <Editor
                height="100%"
                language={MONACO_LANGUAGE_MAP[language]}
                value={code}
                onChange={(v) => setCode(v || "")}
                theme="vs-dark"
                options={{
                  fontSize: 14,
                  fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  lineNumbers: "on",
                  glyphMargin: false,
                  folding: true,
                  renderLineHighlight: "line",
                  padding: { top: 12, bottom: 12 },
                  tabSize: 4,
                  wordWrap: "on",
                  smoothScrolling: true,
                  cursorBlinking: "smooth",
                  cursorSmoothCaretAnimation: "on",
                }}
              />
            </div>

            {/* Results Panel */}
            <div style={styles.resultsPanel}>
              <div style={styles.resultsTabs}>
                <button
                  style={{
                    ...styles.resultsTab,
                    ...(activeResultTab === "testcases" ? styles.resultsTabActive : {}),
                  }}
                  onClick={() => setActiveResultTab("testcases")}
                >
                  Test Cases ({publicTestCases.length})
                </button>
                <button
                  style={{
                    ...styles.resultsTab,
                    ...(activeResultTab === "result" ? styles.resultsTabActive : {}),
                  }}
                  onClick={() => setActiveResultTab("result")}
                >
                  Results
                  {(runResult || submitResult) && (
                    <span
                      style={{
                        ...styles.resultDot,
                        background:
                          (runResult?.status || submitResult?.status) === "PASSED"
                            ? "#10b981"
                            : "#ef4444",
                      }}
                    />
                  )}
                </button>
              </div>

              <div style={styles.resultsBody}>
                {/* ── Test Cases Tab ── */}
                {activeResultTab === "testcases" && (
                  <div style={styles.testCaseGrid}>
                    {publicTestCases.length === 0 ? (
                      <p style={styles.emptyText}>No public test cases available.</p>
                    ) : (
                      publicTestCases.map((tc, i) => (
                        <div key={tc.id} style={styles.tcMiniBlock}>
                          <span style={styles.tcMiniLabel}>Case {i + 1}</span>
                          <div style={styles.tcMiniRow}>
                            <span style={styles.tcMiniKey}>In:</span>
                            <code style={styles.tcMiniCode}>{tc.input}</code>
                          </div>
                          <div style={styles.tcMiniRow}>
                            <span style={styles.tcMiniKey}>Out:</span>
                            <code style={styles.tcMiniCode}>{tc.expectedOutput}</code>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

               {activeResultTab === "result" && (
  <div style={styles.resultContent}>
    {!runResult && !submitResult ? (
      <p style={styles.emptyText}>Run or submit code to see results.</p>
    ) : (() => {
      const r = submitResult || runResult!;
      const isCompileError = r.status === "Compilation Error";
      const isTLE = r.status === "Time Limit Exceeded";
      const isRuntimeError = r.status === "Runtime Error";
      const isSystemError = isCompileError || isTLE || isRuntimeError;
      const isPass = r.status === "PASSED";

      return (
        <>
          {/* ── Error Panel (Compile / TLE / Runtime) ── */}
          {isSystemError && (
            <div style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.35)",
              borderRadius: 8,
              padding: "14px 16px",
              display: "flex",
              flexDirection: "column" as const,
              gap: 8,
            }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#f87171", letterSpacing: "0.02em" }}>
                {isCompileError ? "⛔ Compilation Error" : isTLE ? "⏱ Time Limit Exceeded" : "⛔ Runtime Error"}
              </div>
              {(r as RunResult).error && (
                <pre style={{
                  fontSize: 12,
                  color: "#fca5a5",
                  fontFamily: "'JetBrains Mono', monospace",
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                  overflowX: "auto",
                  margin: 0,
                }}>
                  {(r as RunResult).error}
                </pre>
              )}
              <div style={{ fontSize: 12, color: "#8b949e", marginTop: 4 }}>
                Passed: <span style={{ color: "#f87171", fontWeight: 700 }}>{r.passedCases}</span>
                {" / "}{r.totalCases} test cases
              </div>
            </div>
          )}

          {/* ── Summary Bar ── */}
          {!isSystemError && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap" as const,
              padding: "10px 14px",
              background: isPass ? "rgba(16,185,129,0.07)" : "rgba(239,68,68,0.07)",
              border: `1px solid ${isPass ? "#10b98130" : "#ef444430"}`,
              borderRadius: 8,
            }}>
              <div style={{
                fontSize: 14,
                fontWeight: 800,
                letterSpacing: "0.06em",
                color: isPass ? "#10b981" : "#ef4444",
              }}>
                {isPass ? "✓ PASSED" : "✗ FAILED"}
              </div>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap" as const }}>
                <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 1 }}>
                  <span style={{ fontSize: 10, color: "#8b949e", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Passed</span>
                  <span style={{ fontSize: 18, fontWeight: 700, color: "#10b981", fontFamily: "'JetBrains Mono', monospace" }}>{r.passedCases}/{r.totalCases}</span>
                </div>
                {"score" in r && (r as SubmitResult).score != null && (
                  <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 1 }}>
                    <span style={{ fontSize: 10, color: "#8b949e", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Score</span>
                    <span style={{ fontSize: 18, fontWeight: 700, color: "#6366f1", fontFamily: "'JetBrains Mono', monospace" }}>{(r as SubmitResult).score}</span>
                  </div>
                )}
                {(r as SubmitResult).executionTime != null && (
                  <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 1 }}>
                    <span style={{ fontSize: 10, color: "#8b949e", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Time</span>
                    <span style={{ fontSize: 18, fontWeight: 700, color: "#e6edf3", fontFamily: "'JetBrains Mono', monospace" }}>{(r as SubmitResult).executionTime}ms</span>
                  </div>
                )}
                {(r as SubmitResult).memoryUsed != null && (
                  <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 1 }}>
                    <span style={{ fontSize: 10, color: "#8b949e", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Memory</span>
                    <span style={{ fontSize: 18, fontWeight: 700, color: "#e6edf3", fontFamily: "'JetBrains Mono', monospace" }}>{(r as SubmitResult).memoryUsed}MB</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Per Test Case Detail ── */}
          {!isSystemError && runResult?.results && runResult.results.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
              {runResult.results.map((res, i) => (
                <div key={i} style={{
                  background: "#21262d",
                  border: `1px solid ${res.passed ? "#10b98128" : "#ef444428"}`,
                  borderRadius: 8,
                  padding: "10px 14px",
                  display: "flex",
                  flexDirection: "column" as const,
                  gap: 6,
                }}>
                  {/* Row: case label + status badge */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: res.passed ? "#10b981" : "#ef4444" }}>
                      {res.passed ? "✓" : "✗"} Case {res.testCaseNo}
                    </span>
                    <span style={{
                      fontSize: 11, fontWeight: 700,
                      color: res.passed ? "#10b981" : "#ef4444",
                      background: res.passed ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                      padding: "2px 8px", borderRadius: 4,
                    }}>
                      {res.passed ? "PASSED" : "FAILED"}
                    </span>
                  </div>

                  {/* Show input/expected/received only for failed cases that have data */}
                  {!res.passed && res.input != null && (
                    <>
                      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <span style={{ fontSize: 11, color: "#8b949e", fontWeight: 600, width: 66, flexShrink: 0, paddingTop: 3 }}>Input:</span>
                        <pre style={{
                          fontSize: 12, color: "#e6edf3",
                          fontFamily: "'JetBrains Mono', monospace",
                          background: "#161b22", padding: "4px 8px", borderRadius: 5,
                          border: "1px solid #30363d", flex: 1,
                          overflowX: "auto", whiteSpace: "pre-wrap", margin: 0, lineHeight: 1.5,
                        }}>{res.input}</pre>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <span style={{ fontSize: 11, color: "#8b949e", fontWeight: 600, width: 66, flexShrink: 0, paddingTop: 3 }}>Expected:</span>
                        <pre style={{
                          fontSize: 12, color: "#34d399",
                          fontFamily: "'JetBrains Mono', monospace",
                          background: "#161b22", padding: "4px 8px", borderRadius: 5,
                          border: "1px solid #10b98130", flex: 1,
                          overflowX: "auto", whiteSpace: "pre-wrap", margin: 0, lineHeight: 1.5,
                        }}>{res.expected}</pre>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <span style={{ fontSize: 11, color: "#8b949e", fontWeight: 600, width: 66, flexShrink: 0, paddingTop: 3 }}>Received:</span>
                        <pre style={{
                          fontSize: 12, color: "#f87171",
                          fontFamily: "'JetBrains Mono', monospace",
                          background: "#161b22", padding: "4px 8px", borderRadius: 5,
                          border: "1px solid #ef444430", flex: 1,
                          overflowX: "auto", whiteSpace: "pre-wrap", margin: 0, lineHeight: 1.5,
                        }}>{res.received}</pre>
                      </div>
                    </>
                  )}

                  {/* Passed cases: just a clean note */}
                  {res.passed && (
                    <span style={{ fontSize: 12, color: "#6b7280", fontStyle: "italic" }}>
                      Test case hidden — output matched expected.
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      );
    })()}
  </div>
)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; overflow: hidden; background: #0d1117; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: #161b22; }
  ::-webkit-scrollbar-thumb { background: #30363d; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: #484f58; }
  select option { background: #1c2128; color: #e6edf3; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
`;

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    background: "#0d1117",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    color: "#e6edf3",
    overflow: "hidden",
  },

  // ── Security Gate ──
  gateOverlay: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    background: "#0d1117",
    fontFamily: "'Inter', sans-serif",
  },
  gateCard: {
    background: "#161b22",
    border: "1px solid #30363d",
    borderRadius: 20,
    padding: "48px 52px",
    maxWidth: 480,
    width: "90%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 16,
    boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
    animation: "fadeIn 0.3s ease",
  },
  gateIcon: { fontSize: 52, lineHeight: 1 },
  gateTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: "#e6edf3",
    letterSpacing: "-0.02em",
    textAlign: "center",
  },
  gateDesc: {
    fontSize: 14,
    color: "#8b949e",
    lineHeight: 1.7,
    textAlign: "center",
  },
  gateMetaRow: {
    display: "flex",
    gap: 24,
    marginTop: 8,
  },
  gateMeta: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
  },
  gateMetaLabel: {
    fontSize: 11,
    color: "#6b7280",
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
  },
  gateMetaValue: {
    fontSize: 16,
    fontWeight: 700,
    color: "#e6edf3",
  },
  gateBtn: {
    marginTop: 8,
    padding: "12px 36px",
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: "-0.01em",
    transition: "opacity 0.2s",
  },

  // ── Header ──
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 20px",
    height: 56,
    background: "#161b22",
    borderBottom: "1px solid #21262d",
    flexShrink: 0,
    gap: 16,
    zIndex: 10,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    minWidth: 0,
    flex: 1,
  },
  assessmentTitle: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 15,
    fontWeight: 700,
    color: "#e6edf3",
    letterSpacing: "-0.01em",
    whiteSpace: "nowrap",
  },
  titleIcon: { fontSize: 18 },
  headerDivider: { width: 1, height: 20, background: "#30363d", flexShrink: 0 },
  headerMeta: { fontSize: 13, color: "#8b949e", whiteSpace: "nowrap" },
  headerCenter: { display: "flex", justifyContent: "center", flex: "0 0 auto" },
  timerBox: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 16px",
    borderRadius: 8,
    border: "1px solid",
    background: "rgba(0,0,0,0.3)",
    fontFamily: "'JetBrains Mono', monospace",
    transition: "color 0.3s, border-color 0.3s",
  },
  timerIcon: { fontSize: 14 },
  timerText: { fontSize: 18, fontWeight: 700, letterSpacing: "0.04em" },
  headerRight: { display: "flex", alignItems: "center", gap: 10, flex: 1, justifyContent: "flex-end" },
  securityBadge: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 10px",
    borderRadius: 6,
    background: "rgba(99,102,241,0.15)",
    border: "1px solid rgba(99,102,241,0.3)",
    color: "#818cf8",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.05em",
  },
  securityDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#818cf8",
    boxShadow: "0 0 6px #818cf8",
  },
  warningBadgeHeader: {
    padding: "4px 10px",
    borderRadius: 6,
    border: "1px solid",
    fontSize: 12,
    fontWeight: 600,
    transition: "color 0.3s, border-color 0.3s",
  },
  submitBtn: {
    padding: "8px 18px",
    borderRadius: 8,
    border: "none",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    letterSpacing: "-0.01em",
    display: "flex",
    alignItems: "center",
    gap: 6,
    transition: "opacity 0.2s",
    whiteSpace: "nowrap",
  },

  // ── Body ──
  body: { display: "flex", flex: 1, overflow: "hidden", minHeight: 0 },

  // ── Left Panel: Compact Navigator ──
  leftPanel: {
    display: "flex",
    flexDirection: "column",
    background: "#161b22",
    borderRight: "1px solid #21262d",
    overflow: "hidden",
    flexShrink: 0,
  },
  panelHeader: {
    padding: "10px 0",
    fontSize: 10,
    fontWeight: 700,
    color: "#8b949e",
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    borderBottom: "1px solid #21262d",
    flexShrink: 0,
    textAlign: "center" as const,
  },
  questionList: {
    flex: 1,
    overflowY: "auto",
    padding: "8px 6px",
    display: "flex",
    flexDirection: "column",
    gap: 4,
    alignItems: "center",
  },
  questionDot: {
    width: "100%",
    padding: "8px 4px",
    borderRadius: 8,
    border: "1px solid",
    cursor: "pointer",
    transition: "all 0.15s",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    background: "transparent",
  },
  dotIndicator: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    flexShrink: 0,
    transition: "box-shadow 0.2s",
  },
  dotLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: "#8b949e",
    lineHeight: 1,
  },

  // ── Divider ──
  divider: {
    width: 4,
    cursor: "col-resize",
    background: "#21262d",
    flexShrink: 0,
    transition: "background 0.15s",
  },

  // ── Center Panel ──
  centerPanel: {
    display: "flex",
    flexDirection: "column",
    background: "#0d1117",
    overflowY: "auto",
    flexShrink: 0,
  },
  questionDetail: {
    padding: "20px 24px",
    display: "flex",
    flexDirection: "column",
    gap: 0,
  },
  questionDetailHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
  },
  questionDetailTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: "#e6edf3",
    lineHeight: 1.3,
    letterSpacing: "-0.02em",
    marginBottom: 8,
  },
  questionDetailMeta: { display: "flex", alignItems: "center", gap: 8 },
  metaDot: { width: 3, height: 3, borderRadius: "50%", background: "#484f58" },
  categoryChip: {
    fontSize: 12,
    color: "#8b949e",
    background: "#21262d",
    padding: "3px 8px",
    borderRadius: 5,
  },
  qStatusBig: {
    padding: "5px 12px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.04em",
    flexShrink: 0,
    whiteSpace: "nowrap",
  },
  descriptionSection: { marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid #21262d" },
  descriptionText: { fontSize: 14, color: "#c9d1d9", lineHeight: 1.7 },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: "#8b949e",
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    marginBottom: 8,
  },
  sectionText: { fontSize: 13.5, color: "#c9d1d9", lineHeight: 1.6 },
  constraintsPre: {
    fontSize: 13,
    color: "#c9d1d9",
    background: "#161b22",
    padding: "12px 14px",
    borderRadius: 8,
    border: "1px solid #21262d",
    fontFamily: "'JetBrains Mono', monospace",
    lineHeight: 1.6,
    overflowX: "auto",
    whiteSpace: "pre-wrap",
  },
  testCaseBlock: {
    background: "#161b22",
    border: "1px solid #21262d",
    borderRadius: 8,
    padding: "14px 16px",
    marginBottom: 10,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  tcLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: "#6366f1",
    letterSpacing: "0.05em",
    textTransform: "uppercase" as const,
    marginBottom: 2,
  },
  tcRow: { display: "flex", gap: 10, alignItems: "flex-start" },
  tcKey: {
    fontSize: 12,
    color: "#8b949e",
    fontWeight: 600,
    width: 52,
    flexShrink: 0,
    paddingTop: 2,
  },
  tcPre: {
    fontSize: 13,
    color: "#e6edf3",
    fontFamily: "'JetBrains Mono', monospace",
    background: "#0d1117",
    padding: "6px 10px",
    borderRadius: 6,
    border: "1px solid #30363d",
    flex: 1,
    overflowX: "auto",
    whiteSpace: "pre",
    lineHeight: 1.5,
  },
  emptyCenter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    color: "#484f58",
    fontSize: 14,
  },

  // ── Right Panel ──
  rightPanel: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    background: "#0d1117",
    overflow: "hidden",
  },
  editorToolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 16px",
    background: "#161b22",
    borderBottom: "1px solid #21262d",
    flexShrink: 0,
    gap: 12,
  },
  editorToolbarLeft:  { display: "flex", alignItems: "center", gap: 8 },
  editorToolbarRight: { display: "flex", alignItems: "center", gap: 8 },
  langSelect: {
    padding: "5px 10px",
    borderRadius: 6,
    border: "1px solid #30363d",
    background: "#21262d",
    color: "#e6edf3",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    outline: "none",
    fontFamily: "'Inter', sans-serif",
  },
  runBtn: {
    padding: "6px 14px",
    borderRadius: 6,
    border: "1px solid #30363d",
    background: "#21262d",
    color: "#e6edf3",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 6,
    transition: "background 0.15s",
  },
  submitCodeBtn: {
    padding: "6px 14px",
    borderRadius: 6,
    border: "none",
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 6,
    transition: "opacity 0.15s",
  },
  editorWrapper: { flex: 1, minHeight: 0, overflow: "hidden" },
  btnSpinner: {
    width: 12,
    height: 12,
    borderRadius: "50%",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "#fff",
    display: "inline-block",
    animation: "spin 0.8s linear infinite",
  },

  // ── Results Panel ──
  resultsPanel: {
    height: 260,
    background: "#161b22",
    borderTop: "1px solid #21262d",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    overflow: "hidden",
  },
  resultsTabs: { display: "flex", borderBottom: "1px solid #21262d", flexShrink: 0 },
  resultsTab: {
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 500,
    color: "#8b949e",
    background: "transparent",
    border: "none",
    borderBottom: "2px solid transparent",
    cursor: "pointer",
    transition: "all 0.15s",
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginBottom: -1,
  },
  resultsTabActive: { color: "#e6edf3", borderBottom: "2px solid #6366f1" },
  resultDot: { width: 7, height: 7, borderRadius: "50%" },
  resultsBody: { flex: 1, overflowY: "auto", overflowX: "hidden", padding: "12px 16px" },

  // Test cases tab
  testCaseGrid: { display: "flex", gap: 10, flexWrap: "wrap", alignContent: "flex-start" },
  tcMiniBlock: {
    background: "#21262d",
    border: "1px solid #30363d",
    borderRadius: 8,
    padding: "10px 12px",
    minWidth: 160,
    maxWidth: 200,
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  tcMiniLabel: { fontSize: 11, fontWeight: 700, color: "#6366f1", marginBottom: 4, letterSpacing: "0.04em" },
  tcMiniRow: { display: "flex", gap: 6, alignItems: "flex-start" },
  tcMiniKey: { fontSize: 11, color: "#8b949e", fontWeight: 600, width: 26, flexShrink: 0, paddingTop: 1 },
  tcMiniCode: { fontSize: 12, color: "#e6edf3", fontFamily: "'JetBrains Mono', monospace", wordBreak: "break-all", lineHeight: 1.4 },

  // Results tab
  resultContent: { display: "flex", flexDirection: "column", gap: 12 },

  // Error panel
  errorPanel: {
    background: "rgba(239,68,68,0.08)",
    border: "1px solid rgba(239,68,68,0.3)",
    borderRadius: 8,
    padding: "12px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  errorPanelTitle: { fontSize: 13, fontWeight: 800, color: "#f87171", letterSpacing: "0.02em" },
  errorPanelPre: {
    fontSize: 12,
    color: "#fca5a5",
    fontFamily: "'JetBrains Mono', monospace",
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
    overflowX: "auto",
  },

  resultSummary: { display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" },
  resultStatus: {
    padding: "6px 16px",
    borderRadius: 8,
    border: "1px solid",
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: "0.06em",
  },
  resultStats: { display: "flex", gap: 16 },
  resultStat: { display: "flex", flexDirection: "column", alignItems: "center", gap: 2 },
  resultStatLabel: {
    fontSize: 10,
    color: "#8b949e",
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
  },
  resultStatValue: {
    fontSize: 20,
    fontWeight: 700,
    color: "#e6edf3",
    fontFamily: "'JetBrains Mono', monospace",
    lineHeight: 1,
  },

  // Per-testcase detail blocks
  tcDetailList: { display: "flex", flexDirection: "column", gap: 8 },
  tcDetailBlock: {
    background: "#21262d",
    border: "1px solid",
    borderRadius: 8,
    padding: "10px 14px",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  tcDetailHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  tcDetailRow: { display: "flex", gap: 8, alignItems: "flex-start" },
  tcDetailKey: {
    fontSize: 11,
    color: "#8b949e",
    fontWeight: 600,
    width: 60,
    flexShrink: 0,
    paddingTop: 2,
  },
  tcDetailCode: {
    fontSize: 12,
    color: "#e6edf3",
    fontFamily: "'JetBrains Mono', monospace",
    background: "#161b22",
    padding: "3px 8px",
    borderRadius: 5,
    border: "1px solid #30363d",
    lineHeight: 1.5,
    flex: 1,
    wordBreak: "break-all",
  },

  emptyText: { fontSize: 13, color: "#484f58", textAlign: "center" as const, padding: "20px 0", width: "100%" },

  // ── Loading ──
  loadingContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    background: "#0d1117",
    fontFamily: "'Inter', sans-serif",
  },
  loadingInner: { display: "flex", flexDirection: "column", alignItems: "center", gap: 16 },
  spinner: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    border: "3px solid #21262d",
    borderTopColor: "#6366f1",
    animation: "spin 0.8s linear infinite",
  },
  loadingText: { fontSize: 18, fontWeight: 700, color: "#e6edf3" },
  loadingSubtext: { fontSize: 14, color: "#8b949e" },
  retryBtn: {
    padding: "8px 20px",
    borderRadius: 8,
    border: "1px solid #30363d",
    background: "#21262d",
    color: "#e6edf3",
    fontSize: 14,
    cursor: "pointer",
  },

  // ── Modal ──
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.75)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    backdropFilter: "blur(4px)",
  },
  modal: {
    background: "#161b22",
    border: "1px solid #30363d",
    borderRadius: 16,
    padding: "32px 36px",
    maxWidth: 440,
    width: "90%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    animation: "fadeIn 0.2s ease",
    boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
  },
  modalIcon:  { fontSize: 40, lineHeight: 1 },
  modalTitle: { fontSize: 20, fontWeight: 700, color: "#e6edf3", letterSpacing: "-0.02em" },
  modalMsg:   { fontSize: 14, color: "#8b949e", textAlign: "center", lineHeight: 1.6 },
  warningBadge: {
    padding: "6px 14px",
    borderRadius: 8,
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.3)",
    color: "#ef4444",
    fontSize: 13,
    fontWeight: 700,
  },

  // Final submit summary grid
  finalSummaryGrid: {
    display: "flex",
    gap: 24,
    padding: "14px 20px",
    background: "#0d1117",
    borderRadius: 10,
    border: "1px solid #21262d",
    width: "100%",
    justifyContent: "center",
  },
  finalSummaryItem: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4 },
  finalSummaryLabel: {
    fontSize: 11,
    color: "#6b7280",
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  },
  finalSummaryValue: {
    fontSize: 22,
    fontWeight: 800,
    color: "#e6edf3",
    fontFamily: "'JetBrains Mono', monospace",
  },

  modalActions: { display: "flex", gap: 10, marginTop: 8 },
  modalBtn: {
    padding: "10px 24px",
    borderRadius: 8,
    border: "none",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    letterSpacing: "-0.01em",
  },

  // ── Toasts ──
  toastContainer: {
    position: "fixed",
    top: 70,
    right: 20,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    zIndex: 2000,
    maxWidth: 360,
  },
  toast: {
    padding: "10px 16px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
    animation: "slideIn 0.25s ease",
    border: "1px solid",
    lineHeight: 1.4,
  },
};

const toastTypeStyles: Record<Toast["type"], React.CSSProperties> = {
  warning: { background: "#1c1407", borderColor: "#f59e0b40", color: "#fbbf24" },
  error:   { background: "#1c0a0a", borderColor: "#ef444440", color: "#f87171" },
  success: { background: "#0a1c14", borderColor: "#10b98140", color: "#34d399" },
  info:    { background: "#0a0e1c", borderColor: "#6366f140", color: "#a5b4fc" },
};