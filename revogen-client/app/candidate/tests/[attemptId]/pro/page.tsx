"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";
import { API_BASE_URL } from "@/lib/api";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

// ─── Interfaces ───────────────────────────────────────────────────────────────
interface TestCase { id: string; input: string; expectedOutput: string; isHidden: boolean; }
interface Question {
  id: string; title: string; difficulty: string; category: string;
  description: string; inputFormat: string; outputFormat: string;
  constraints: string; starterCodes: Record<string, string>; testCases: TestCase[];
}
interface AssessmentData {
  id: string; status: string;
  codingTest: { title: string; description: string; duration: number; securityLevel: string; questions: { question: Question }[]; };
}
interface RunTestResult { testCaseNo: number; passed: boolean; input?: string; expected?: string; received?: string; }
interface ExecutionResult {
  success: boolean; status: string; passedCases: number; totalCases: number;
  score?: number; error?: string; results?: RunTestResult[];
}
interface ProctorStats {
  faceMissingCount: number; multipleFacesCount: number; noiseWarningCount: number;
  gazeAwayCount: number; phoneDetectedCount: number; faceNotCenteredCount: number;
  cameraEnabled: boolean; micEnabled: boolean;
}
type ToastType = "success" | "error" | "warning" | "info";
interface Toast { id: number; message: string; type: ToastType; }

// ─── Language Config ──────────────────────────────────────────────────────────
const LANGUAGE_CONFIG: Record<string, { label: string; apiLang: string; monaco: string; color: string }> = {
  javascript: { label: "JavaScript", apiLang: "javascript", monaco: "javascript", color: "#f7df1e" },
  typescript: { label: "TypeScript", apiLang: "typescript", monaco: "typescript", color: "#3178c6" },
  python:     { label: "Python",     apiLang: "python",     monaco: "python",     color: "#3572A5" },
  python3:    { label: "Python",     apiLang: "python",     monaco: "python",     color: "#3572A5" },
  java:       { label: "Java",       apiLang: "java",       monaco: "java",       color: "#ed8b00" },
  cpp:        { label: "C++",        apiLang: "cpp",        monaco: "cpp",        color: "#00599c" },
  "c++":      { label: "C++",        apiLang: "cpp",        monaco: "cpp",        color: "#00599c" },
  c:          { label: "C",          apiLang: "c",          monaco: "c",          color: "#555555" },
  csharp:     { label: "C#",         apiLang: "csharp",     monaco: "csharp",     color: "#9b4f96" },
  "c#":       { label: "C#",         apiLang: "csharp",     monaco: "csharp",     color: "#9b4f96" },
  go:         { label: "Go",         apiLang: "go",         monaco: "go",         color: "#00ADD8" },
  golang:     { label: "Go",         apiLang: "go",         monaco: "go",         color: "#00ADD8" },
  rust:       { label: "Rust",       apiLang: "rust",       monaco: "rust",       color: "#dea584" },
  ruby:       { label: "Ruby",       apiLang: "ruby",       monaco: "ruby",       color: "#CC342D" },
  php:        { label: "PHP",        apiLang: "php",        monaco: "php",        color: "#777bb4" },
  kotlin:     { label: "Kotlin",     apiLang: "kotlin",     monaco: "kotlin",     color: "#F18E33" },
  swift:      { label: "Swift",      apiLang: "swift",      monaco: "swift",      color: "#F05138" },
};

function langConfig(key: string) {
  const k = key.toLowerCase().trim();
  return LANGUAGE_CONFIG[k] ?? { label: key.charAt(0).toUpperCase() + key.slice(1), apiLang: k, monaco: k, color: "#6366f1" };
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

const DIFF_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  EASY:   { color: "#22c55e", bg: "rgba(34,197,94,0.1)",   border: "rgba(34,197,94,0.3)"   },
  MEDIUM: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.3)"  },
  HARD:   { color: "#ef4444", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.3)"   },
};
const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  PASSED:      { color: "#22c55e", bg: "rgba(34,197,94,0.15)",   label: "Passed"     },
  PARTIAL:     { color: "#f59e0b", bg: "rgba(245,158,11,0.15)",  label: "Partial"    },
  ATTEMPTED:   { color: "#6366f1", bg: "rgba(99,102,241,0.15)",  label: "Attempted"  },
  FAILED:      { color: "#ef4444", bg: "rgba(239,68,68,0.15)",   label: "Failed"     },
  NOT_STARTED: { color: "#475569", bg: "rgba(71,85,105,0.15)",   label: "Not Started"},
};

// ─── Toast Component ──────────────────────────────────────────────────────────
function ToastContainer({ toasts }: { toasts: Toast[] }) {
  const icons: Record<ToastType, string> = { success: "✓", error: "✕", warning: "⚠", info: "ℹ" };
  const colors: Record<ToastType, { bg: string; border: string; icon: string; bar: string }> = {
    success: { bg: "rgba(15,23,42,0.97)", border: "rgba(34,197,94,0.5)",  icon: "#22c55e", bar: "#22c55e" },
    error:   { bg: "rgba(15,23,42,0.97)", border: "rgba(239,68,68,0.5)",  icon: "#ef4444", bar: "#ef4444" },
    warning: { bg: "rgba(15,23,42,0.97)", border: "rgba(245,158,11,0.5)", icon: "#f59e0b", bar: "#f59e0b" },
    info:    { bg: "rgba(15,23,42,0.97)", border: "rgba(99,102,241,0.5)", icon: "#6366f1", bar: "#6366f1" },
  };
  return (
    <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10, maxWidth: 380 }}>
      {toasts.map((t) => {
        const c = colors[t.type];
        return (
          <div key={t.id} style={{
            background: c.bg, border: `1px solid ${c.border}`, borderRadius: 12,
            padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 12,
            boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px ${c.border}`,
            backdropFilter: "blur(20px)", overflow: "hidden", position: "relative",
            animation: "toastIn 0.3s cubic-bezier(0.34,1.56,0.64,1)",
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8, background: `${c.icon}20`,
              border: `1px solid ${c.icon}40`, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 13, fontWeight: 800, color: c.icon, flexShrink: 0,
            }}>{icons[t.type]}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#e2e8f0", lineHeight: 1.4, wordBreak: "break-word" }}>{t.message}</p>
            </div>
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0, height: 3,
              background: `linear-gradient(90deg, ${c.bar}, transparent)`,
              animation: "toastBar 4s linear forwards",
            }} />
          </div>
        );
      })}
      <style>{`
        @keyframes toastIn { from { opacity:0; transform:translateX(60px) scale(0.9); } to { opacity:1; transform:translateX(0) scale(1); } }
        @keyframes toastBar { from { width:100%; } to { width:0%; } }
      `}</style>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProAssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params.attemptId as string;

  // Assessment state
  const [assessment, setAssessment]         = useState<AssessmentData | null>(null);
  const [questions, setQuestions]           = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex]   = useState(0);
  const [timeLeft, setTimeLeft]             = useState<number | null>(null);
  const [loadError, setLoadError]           = useState<string | null>(null);

  // Editor state
  const [availableLangs, setAvailableLangs] = useState<string[]>([]);
  const [language, setLanguage]             = useState<string>("");
  const [sourceCode, setSourceCode]         = useState<Record<string, Record<string, string>>>({});
  const [questionStatus, setQuestionStatus] = useState<Record<string, string>>({});
  const [activeResultTab, setActiveResultTab] = useState<"testcases" | "result">("testcases");

  // Execution state
  const [isRunning, setIsRunning]           = useState(false);
  const [isSubmitting, setIsSubmitting]     = useState(false);
  const [runResults, setRunResults]         = useState<ExecutionResult | null>(null);

  // Proctoring state
  const [securityReady, setSecurityReady]           = useState(false);
  const [warnings, setWarnings]                     = useState(0);
  const [isInitializingProctoring, setIsInitializingProctoring] = useState(false);
  const [cameraStream, setCameraStream]             = useState<MediaStream | null>(null);
  const [faceCount, setFaceCount]                   = useState(0);
  const [screenshotsTaken, setScreenshotsTaken]     = useState(0);
  const [proctorStats, setProctorStats]             = useState<ProctorStats>({
    faceMissingCount: 0, multipleFacesCount: 0, noiseWarningCount: 0,
    gazeAwayCount: 0, phoneDetectedCount: 0, faceNotCenteredCount: 0,
    cameraEnabled: false, micEnabled: false,
  });

  // UI / Modal state
  const [showWarningModal, setShowWarningModal]         = useState(false);
  const [warningMessage, setWarningMessage]             = useState("");
  const [showFinalSubmitModal, setShowFinalSubmitModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal]         = useState(false);
  const [autoSubmitCountdown, setAutoSubmitCountdown]   = useState<number | null>(null);
  const [isFinalSubmitting, setIsFinalSubmitting]       = useState(false);
  const [screenShareEnabled, setScreenShareEnabled]     = useState(false);
  const [toasts, setToasts]                             = useState<Toast[]>([]);
  const [initStep, setInitStep]                         = useState(0);

  // Refs
  const videoRef              = useRef<HTMLVideoElement>(null);
  const screenVideoRef        = useRef<HTMLVideoElement>(null);
  const faceDetectorRef       = useRef<any>(null);
  const faceDetectionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const micIntervalRef        = useRef<ReturnType<typeof setInterval> | null>(null);
  const noFaceTimerRef        = useRef<number>(0);
  const lastFaceNotCenteredAtRef = useRef<number>(0);
  const audioCtxRef           = useRef<AudioContext | null>(null);
  const analyserRef           = useRef<AnalyserNode | null>(null);
  const isAutoSubmittingRef   = useRef(false);
  const timerRef              = useRef<ReturnType<typeof setInterval> | null>(null);
  const warningsRef           = useRef(0);
  const screenStreamRef       = useRef<MediaStream | null>(null);
  const multipleFacesTimerRef = useRef<number>(0);
  const screenshotCountRef    = useRef(0);

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const getToken = () => (typeof window !== "undefined" && localStorage.getItem("access_token")) || "";

  const addToast = useCallback((msg: string, type: ToastType = "success") => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, message: msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  }, []);

  const logSecurityEvent = useCallback(async (eventType: string, details: Record<string, any> = {}) => {
    try {
      await fetch(`${API_BASE_URL}/coding-attempts/${attemptId}/security-event`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ eventType, details: { ...details, timestamp: new Date().toISOString() } }),
      });
    } catch { /* silent */ }
  }, [attemptId]);

  const grabFrameFromStream = async (stream: MediaStream | null, retries = 2): Promise<ImageBitmap | null> => {
    if (!stream) return null;
    const track = stream.getVideoTracks()[0];
    if (!track || track.readyState !== "live") return null;
    const ImageCaptureCtor = (window as any).ImageCapture;
    if (!ImageCaptureCtor) return null;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const capture = new ImageCaptureCtor(track);
        const bitmap: ImageBitmap = await capture.grabFrame();
        if (bitmap.width === 0 || bitmap.height === 0) { bitmap.close?.(); throw new Error("empty frame"); }
        return bitmap;
      } catch (err) {
        if (attempt === retries) return null;
        await new Promise((r) => setTimeout(r, 150 * (attempt + 1)));
      }
    }
    return null;
  };

  const captureAndUploadScreenshot = useCallback(async (eventType: string, details: Record<string, any> = {}) => {
    // Hard cap: max 10 screenshots total
    if (screenshotCountRef.current >= 10) return;
    try {
      const [screenBitmap, camBitmap] = await Promise.all([
        grabFrameFromStream(screenStreamRef.current),
        grabFrameFromStream(cameraStream),
      ]);
      const screenVid = screenVideoRef.current;
      const camVid = videoRef.current;
      const screenVidReady = !!screenVid && screenVid.readyState >= 2 && screenVid.videoWidth > 0;
      const camVidReady = !!camVid && camVid.readyState >= 2 && camVid.videoWidth > 0;
      if (!screenBitmap && !camBitmap && !screenVidReady && !camVidReady) return;

      const screenSrc = screenBitmap ? screenBitmap : screenVidReady ? screenVid! : null;
      const camSrc = camBitmap ? camBitmap : camVidReady ? camVid! : null;
      const dims = (src: ImageBitmap | HTMLVideoElement) =>
        src instanceof HTMLVideoElement ? { w: src.videoWidth, h: src.videoHeight } : { w: src.width, h: src.height };

      const baseSrc = screenSrc ?? camSrc!;
      const baseDims = dims(baseSrc);
      const canvas = document.createElement("canvas");
      canvas.width = baseDims.w || 1280; canvas.height = baseDims.h || 720;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(baseSrc as any, 0, 0, canvas.width, canvas.height);

      if (baseSrc === screenSrc && camSrc) {
        const camDims = dims(camSrc);
        const pipW = Math.round(canvas.width * 0.22);
        const pipH = Math.round(pipW * (camDims.h / Math.max(camDims.w, 1)));
        const pipX = canvas.width - pipW - 16; const pipY = canvas.height - pipH - 16;
        ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(pipX - 3, pipY - 3, pipW + 6, pipH + 6);
        ctx.drawImage(camSrc as any, pipX, pipY, pipW, pipH);
        ctx.fillStyle = "#ffffff"; ctx.font = `bold ${Math.round(canvas.width * 0.012)}px sans-serif`;
        ctx.fillText("Webcam", pipX + 6, pipY + Math.round(canvas.width * 0.016));
      }

      ctx.fillStyle = "rgba(239,68,68,0.85)";
      const labelH = Math.round(canvas.height * 0.04);
      ctx.fillRect(0, 0, canvas.width, labelH);
      ctx.fillStyle = "#ffffff"; ctx.font = `bold ${Math.round(labelH * 0.6)}px sans-serif`;
      ctx.fillText(`⚠ ${eventType.replace(/_/g, " ")}  •  ${new Date().toLocaleTimeString()}`, 12, Math.round(labelH * 0.75));

      screenBitmap?.close?.(); camBitmap?.close?.();

      const MAX_DIM = 1280; const MAX_BYTES = 350_000;
      let outCanvas = canvas;
      if (canvas.width > MAX_DIM || canvas.height > MAX_DIM) {
        const scale = MAX_DIM / Math.max(canvas.width, canvas.height);
        const small = document.createElement("canvas");
        small.width = Math.round(canvas.width * scale); small.height = Math.round(canvas.height * scale);
        const sctx = small.getContext("2d");
        if (sctx) { sctx.drawImage(canvas, 0, 0, small.width, small.height); outCanvas = small; }
      }
      let quality = 0.7;
      let imageDataUrl = outCanvas.toDataURL("image/jpeg", quality);
      for (let a = 0; a < 5 && imageDataUrl.length > MAX_BYTES; a++) {
        if (quality > 0.35) { quality -= 0.15; imageDataUrl = outCanvas.toDataURL("image/jpeg", quality); }
        else {
          const shrink = document.createElement("canvas");
          shrink.width = Math.round(outCanvas.width * 0.75); shrink.height = Math.round(outCanvas.height * 0.75);
          const shctx = shrink.getContext("2d");
          if (!shctx) break;
          shctx.drawImage(outCanvas, 0, 0, shrink.width, shrink.height);
          outCanvas = shrink; imageDataUrl = outCanvas.toDataURL("image/jpeg", quality);
        }
      }
      screenshotCountRef.current += 1;
      setScreenshotsTaken(screenshotCountRef.current);
      fetch(`${API_BASE_URL}/coding-attempts/${attemptId}/security-screenshot`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ eventType, imageDataUrl, details: { ...details, timestamp: new Date().toISOString() } }),
      }).catch(() => {});
    } catch { /* silent */ }
  }, [attemptId, cameraStream]);

  // captureWebcamOnly: used for TAB_SWITCH where the screen is black/hidden.
  // Grabs only the webcam frame so we still get a useful image.
  const captureWebcamOnly = useCallback(async (eventType: string, details: Record<string, any> = {}) => {
    if (screenshotCountRef.current >= 10) return;
    try {
      const camBitmap = await grabFrameFromStream(cameraStream);
      const camVid = videoRef.current;
      const camVidReady = !!camVid && camVid.readyState >= 2 && camVid.videoWidth > 0;
      const camSrc = camBitmap ?? (camVidReady ? camVid! : null);
      if (!camSrc) return;

      const dims = (src: ImageBitmap | HTMLVideoElement) =>
        src instanceof HTMLVideoElement ? { w: src.videoWidth, h: src.videoHeight } : { w: src.width, h: src.height };
      const { w, h } = dims(camSrc);
      const canvas = document.createElement("canvas");
      canvas.width = w || 640; canvas.height = h || 480;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Dark bg to make it clear this is a tab-away capture
      ctx.fillStyle = "#0d1117";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw webcam centered
      const scale = Math.min(canvas.width / (w || 640), canvas.height / (h || 480)) * 0.85;
      const dw = (w || 640) * scale; const dh = (h || 480) * scale;
      const dx = (canvas.width - dw) / 2; const dy = (canvas.height - dh) / 2;
      ctx.drawImage(camSrc as any, dx, dy, dw, dh);
      camBitmap?.close?.();

      // Event watermark
      ctx.fillStyle = "rgba(239,68,68,0.9)";
      const labelH = Math.round(canvas.height * 0.06);
      ctx.fillRect(0, 0, canvas.width, labelH);
      ctx.fillStyle = "#ffffff"; ctx.font = `bold ${Math.round(labelH * 0.55)}px sans-serif`;
      ctx.fillText(`⚠ ${eventType.replace(/_/g, " ")}  •  ${new Date().toLocaleTimeString()}  •  TAB AWAY`, 12, Math.round(labelH * 0.72));

      // Notice text
      ctx.fillStyle = "rgba(255,255,255,0.4)"; ctx.font = `${Math.round(canvas.height * 0.025)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("Candidate left the exam tab — screen capture not available", canvas.width / 2, canvas.height - 16);
      ctx.textAlign = "left";

      let quality = 0.75;
      const imageDataUrl = canvas.toDataURL("image/jpeg", quality);
      screenshotCountRef.current += 1;
      setScreenshotsTaken(screenshotCountRef.current);
      fetch(`${API_BASE_URL}/coding-attempts/${attemptId}/security-screenshot`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ eventType, imageDataUrl, details: { ...details, note: "tab_away_webcam_only", timestamp: new Date().toISOString() } }),
      }).catch(() => {});
    } catch { /* silent */ }
  }, [attemptId, cameraStream]);

  const logEventWithScreenshot = useCallback((eventType: string, details: Record<string, any> = {}) => {
    if (eventType === "TAB_SWITCH") {
      // Capture webcam immediately when tab switches — screen will be black/hidden.
      // Do NOT wait for tab return; the webcam is the evidence here.
      captureWebcamOnly(eventType, details);
    } else if (eventType === "MULTIPLE_FACES") {
      // Multiple faces — capture immediately with full screen+webcam composite
      captureAndUploadScreenshot(eventType, details);
    } else {
      // Other events — wait 2s for screen to settle, then capture
      setTimeout(() => captureAndUploadScreenshot(eventType, details), 2000);
    }
  }, [captureAndUploadScreenshot, captureWebcamOnly]);

  // ─── executeFinalSubmit ───────────────────────────────────────────────────
  const executeFinalSubmit = useCallback(async () => {
    if (isAutoSubmittingRef.current) return;
    isAutoSubmittingRef.current = true;
    setIsFinalSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/coding-attempts/${attemptId}/pro/final-submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ proctoringData: proctorStats }),
      });
      if (!res.ok) throw new Error(`Submit failed (${res.status})`);
      cameraStream?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close().catch(() => {});
      if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
      setIsFinalSubmitting(false);
      setShowFinalSubmitModal(false);
      setShowSuccessModal(true);
    } catch {
      addToast("Failed to submit. Please try again.", "error");
      isAutoSubmittingRef.current = false;
      setIsFinalSubmitting(false);
    }
  }, [attemptId, proctorStats, addToast, cameraStream]);

  const executeFinalSubmitRef = useRef(executeFinalSubmit);
  useEffect(() => { executeFinalSubmitRef.current = executeFinalSubmit; }, [executeFinalSubmit]);

  // ─── addWarning ───────────────────────────────────────────────────────────
  const addWarning = useCallback((message: string) => {
    if (isAutoSubmittingRef.current) return;
    warningsRef.current += 1;
    setWarnings(warningsRef.current);
    setWarningMessage(message);
    setShowWarningModal(true);
    addToast(`Warning ${warningsRef.current}/5: ${message}`, "warning");
    if (warningsRef.current >= 5) {
      let count = 5;
      setAutoSubmitCountdown(count);
      const interval = setInterval(() => {
        count--;
        setAutoSubmitCountdown(count);
        if (count <= 0) {
          clearInterval(interval);
          setAutoSubmitCountdown(null);
          executeFinalSubmitRef.current();
        }
      }, 1000);
    }
  }, [addToast]);

  // ─── useEffects ───────────────────────────────────────────────────────────
  // 1. Load attempt
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/coding-attempts/${attemptId}`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (!res.ok) throw new Error(`Failed to load (${res.status})`);
        const raw = await res.json();
        if (!raw?.codingTest) { setLoadError("This assessment could not be found."); return; }
        setAssessment(raw);
        const qs: Question[] = raw.codingTest.questions.map((q: any) => q.question);
        setQuestions(qs);
        setTimeLeft(raw.codingTest.duration * 60);

        const langSet: string[] = [];
        qs.forEach((q) => {
          Object.keys(q.starterCodes ?? {}).forEach((k) => {
            if (!langSet.some((x) => x.toLowerCase() === k.toLowerCase())) langSet.push(k);
          });
        });
        const langs = langSet.length ? langSet : ["python"];
        setAvailableLangs(langs);

        const savedLang = localStorage.getItem(`pro_${attemptId}_lang`);
        const initialLang = savedLang && langs.some((l) => l.toLowerCase() === savedLang.toLowerCase())
          ? langs.find((l) => l.toLowerCase() === savedLang.toLowerCase())!
          : langs[0];
        setLanguage(initialLang);

        const status: Record<string, string> = {};
        const code: Record<string, Record<string, string>> = {};
        qs.forEach((q) => {
          status[q.id] = "NOT_STARTED";
          code[q.id] = {};
          langs.forEach((lang) => {
            const saved = localStorage.getItem(`pro_${attemptId}_${q.id}_${lang.toLowerCase()}`);
            const starterKey = Object.keys(q.starterCodes ?? {}).find((k) => k.toLowerCase() === lang.toLowerCase());
            const starter = starterKey ? q.starterCodes[starterKey] : "";
            code[q.id][lang] = saved ?? starter ?? "";
          });
        });
        setQuestionStatus(status);
        setSourceCode(code);
      } catch (err: any) {
        setLoadError(err?.message ?? "Failed to load assessment");
        addToast("Failed to load assessment", "error");
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId]);

  // 2. Autosave
  useEffect(() => {
    if (!questions.length || !language) return;
    const q = questions[currentQIndex];
    if (!q) return;
    const t = setTimeout(() => {
      localStorage.setItem(`pro_${attemptId}_${q.id}_${language.toLowerCase()}`, sourceCode[q.id]?.[language] ?? "");
    }, 2000);
    return () => clearTimeout(t);
  }, [sourceCode, currentQIndex, language, attemptId, questions]);

  // 3. Timer
  useEffect(() => {
    if (!securityReady || timeLeft === null) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timerRef.current!);
          if (!isAutoSubmittingRef.current) executeFinalSubmitRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [securityReady]);

  // 3b. Attach camera stream
  useEffect(() => {
    const v = videoRef.current;
    if (v && cameraStream && v.srcObject !== cameraStream) {
      v.srcObject = cameraStream;
      v.play().catch(() => {});
    }
  }, [cameraStream, securityReady]);

  // 3c. Re-attach screen stream
  useEffect(() => {
    const sv = screenVideoRef.current;
    const stream = screenStreamRef.current;
    if (sv && stream && sv.srcObject !== stream) {
      sv.srcObject = stream;
      sv.play().catch(() => {});
    }
  }, [screenShareEnabled, securityReady]);

  // 4. Face detection + mic loop
  useEffect(() => {
    if (!securityReady) return;
    if (faceDetectorRef.current) {
      faceDetectionIntervalRef.current = setInterval(() => {
        if (!videoRef.current || videoRef.current.readyState < 2) return;
        try {
          const res = faceDetectorRef.current.detectForVideo(videoRef.current, performance.now());
          const realFaces = res.detections.filter(
            (d: any) => (d.categories?.[0]?.score ?? d.score ?? 1) >= 0.75
          ).length;
          setFaceCount(realFaces);
          if (realFaces === 0) {
            noFaceTimerRef.current += 500;
            if (noFaceTimerRef.current >= 3000) {
              noFaceTimerRef.current = 0;
              setProctorStats((p) => ({ ...p, faceMissingCount: p.faceMissingCount + 1 }));
              logEventWithScreenshot("FACE_MISSING", { duration_ms: 3000 });
              addToast("Face not detected! Please stay in frame.", "error");
            }
          } else if (realFaces > 1) {
            noFaceTimerRef.current = 0; multipleFacesTimerRef.current = 0;
            setProctorStats((p) => ({ ...p, multipleFacesCount: p.multipleFacesCount + 1 }));
            logEventWithScreenshot("MULTIPLE_FACES", { count: realFaces });
            addWarning("Multiple faces detected in camera.");
          } else {
            noFaceTimerRef.current = 0; multipleFacesTimerRef.current = 0;
            const box = res.detections[0]?.boundingBox;
            if (box && videoRef.current?.videoWidth) {
              const cx = (box.originX + box.width / 2) / videoRef.current.videoWidth;
              if (cx < 0.2 || cx > 0.8) {
                const now = Date.now();
                if (now - lastFaceNotCenteredAtRef.current > 4000) {
                  lastFaceNotCenteredAtRef.current = now;
                  setProctorStats((p) => ({ ...p, faceNotCenteredCount: p.faceNotCenteredCount + 1 }));
                  logSecurityEvent("FACE_NOT_CENTERED", { x: cx });
                  addToast("Please center your face in the camera.", "warning");
                }
              }
            }
          }
        } catch { /* ignore */ }
      }, 500);
    }
    if (analyserRef.current) {
      micIntervalRef.current = setInterval(() => {
        if (!analyserRef.current) return;
        const buf = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(buf);
        const avg = buf.reduce((a, b) => a + b, 0) / buf.length;
        if (avg > 40) {
          setProctorStats((p) => ({ ...p, noiseWarningCount: p.noiseWarningCount + 1 }));
          logSecurityEvent("NOISE_WARNING", { level: Math.round(avg) });
        }
      }, 1500);
    }
    return () => { clearInterval(faceDetectionIntervalRef.current!); clearInterval(micIntervalRef.current!); };
  }, [securityReady, addWarning, addToast, logSecurityEvent, logEventWithScreenshot]);

  // 5. Security event listeners
  useEffect(() => {
    if (!securityReady) return;
    const onVis = () => { if (document.hidden) { logEventWithScreenshot("TAB_SWITCH"); addWarning("Tab switching is not allowed."); } };
    const onBlur = () => { logEventWithScreenshot("WINDOW_BLUR"); addWarning("Window focus lost."); };
    const onCtx = (e: MouseEvent) => { e.preventDefault(); logSecurityEvent("RIGHT_CLICK", { x: e.clientX, y: e.clientY }); };
    const onFS = () => { if (!document.fullscreenElement) { logEventWithScreenshot("FULLSCREEN_EXIT"); addWarning("Exiting fullscreen is not allowed."); } };
    const onCopy = (e: ClipboardEvent) => { e.preventDefault(); logEventWithScreenshot("COPY_ATTEMPT", { text: window.getSelection()?.toString().slice(0, 100) }); addWarning("Copying is not allowed."); };
    const onPaste = (e: ClipboardEvent) => { e.preventDefault(); logSecurityEvent("PASTE_ATTEMPT"); addWarning("Pasting is not allowed."); };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "F12" || (e.ctrlKey && e.shiftKey && ["I","J","C"].includes(e.key.toUpperCase()))) {
        e.preventDefault(); logEventWithScreenshot("DEVTOOLS_SHORTCUT", { key: e.key }); addWarning("DevTools not allowed.");
      }
      if (e.ctrlKey && ["c","v","x","a"].includes(e.key.toLowerCase())) {
        e.preventDefault(); logSecurityEvent("KEYBOARD_SHORTCUT_BLOCKED", { key: `Ctrl+${e.key.toUpperCase()}` });
      }
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("blur", onBlur);
    document.addEventListener("contextmenu", onCtx);
    document.addEventListener("fullscreenchange", onFS);
    document.addEventListener("copy", onCopy);
    document.addEventListener("paste", onPaste);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("contextmenu", onCtx);
      document.removeEventListener("fullscreenchange", onFS);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("keydown", onKey);
    };
  }, [securityReady, addWarning, logSecurityEvent, logEventWithScreenshot]);

  // 6. Cleanup on unmount
  useEffect(() => {
    return () => {
      cameraStream?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close().catch(() => {});
      clearInterval(faceDetectionIntervalRef.current!);
      clearInterval(micIntervalRef.current!);
      clearInterval(timerRef.current!);
    };
  }, [cameraStream]);

  // ─── enterAssessment ─────────────────────────────────────────────────────
  const enterAssessment = async () => {
    setIsInitializingProctoring(true);
    setInitStep(1);
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 } }, audio: true });
      setCameraStream(stream);
      setProctorStats((p) => ({ ...p, cameraEnabled: true, micEnabled: true }));
      addToast("Camera and microphone connected.", "success");
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      ctx.createMediaStreamSource(stream).connect(analyser);
    } catch (err: any) {
      const name = err?.name ?? "";
      let msg = "Camera/mic unavailable. Proctoring will be limited.";
      if (name === "NotAllowedError" || name === "SecurityError") msg = "Camera/mic permission denied. Please allow access in your browser and reload.";
      else if (name === "NotFoundError" || name === "DevicesNotFoundError") msg = "No camera or microphone found on this device.";
      else if (name === "NotReadableError" || name === "TrackStartError") msg = "Camera/mic is already in use by another application.";
      logSecurityEvent("CAMERA_DISABLED", { reason: name });
      logSecurityEvent("MIC_DISABLED", { reason: name });
      addToast(msg, "error");
    }
    setInitStep(2);
    try {
      // Request full-monitor screen share. The `displaySurface: "monitor"` hint
      // tells the browser to pre-select the monitor tab, but the user can still
      // pick a window or browser tab in Chrome's picker. We enforce it below.
      const screenStream = await (navigator.mediaDevices as any).getDisplayMedia({
        video: { displaySurface: "monitor", frameRate: { ideal: 15 } },
        audio: false,
        // Chrome 107+ supports this to pre-filter the picker to screens only.
        // Not all browsers honour it but it's a strong hint.
        preferCurrentTab: false,
      } as any);

      // ── Enforce entire-screen only ──────────────────────────────────────
      // After the user picks, read back what they actually selected.
      const videoTrack = screenStream.getVideoTracks()[0];
      const settings = videoTrack?.getSettings() as any;
      const surface: string = settings?.displaySurface ?? "";

      if (surface && surface !== "monitor") {
        // Candidate picked a window or browser tab — reject it.
        screenStream.getTracks().forEach((t: MediaStreamTrack) => t.stop());
        logSecurityEvent("SCREEN_SHARE_WRONG_SURFACE", { surface });
        addToast(
          `You must share your entire screen, not a window or browser tab. You selected: "${surface}". Please try again and choose a monitor.`,
          "error"
        );
        setIsInitializingProctoring(false);
        setInitStep(0);
        return;
      }

      screenStreamRef.current = screenStream;
      setScreenShareEnabled(true);
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = screenStream;
        await screenVideoRef.current.play().catch(() => {});
      }
      videoTrack?.addEventListener("ended", () => {
        setScreenShareEnabled(false);
        logSecurityEvent("SCREEN_SHARE_STOPPED");
        addToast("Screen sharing stopped. This has been recorded.", "error");
      });
      addToast("Full screen sharing active ✓", "success");
    } catch (err: any) {
      logSecurityEvent("SCREEN_SHARE_DENIED", { reason: err?.name });
      addToast("Screen sharing is required for PRO assessments. Please allow screen share and try again.", "error");
      setIsInitializingProctoring(false);
      setInitStep(0);
      return;
    }
    setInitStep(3);
    try {
      const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm");
      faceDetectorRef.current = await FaceDetector.createFromOptions(vision, {
        baseOptions: { modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite", delegate: "GPU" },
        runningMode: "VIDEO", minDetectionConfidence: 0.5,
      });
    } catch { addToast("Face detection could not start; basic proctoring active.", "warning"); }
    setInitStep(4);
    try { await document.documentElement.requestFullscreen(); } catch { /* ignore */ }
    setIsInitializingProctoring(false);
    setSecurityReady(true);
  };

  // ─── Language / Code / Run / Submit ──────────────────────────────────────
  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    localStorage.setItem(`pro_${attemptId}_lang`, newLang);
    setRunResults(null);
    setSourceCode((prev) => {
      const next: Record<string, Record<string, string>> = {};
      questions.forEach((q) => {
        const existing = prev[q.id]?.[newLang];
        if (existing !== undefined) { next[q.id] = { ...(prev[q.id] ?? {}) }; }
        else {
          const saved = localStorage.getItem(`pro_${attemptId}_${q.id}_${newLang.toLowerCase()}`);
          const starterKey = Object.keys(q.starterCodes ?? {}).find((k) => k.toLowerCase() === newLang.toLowerCase());
          const starter = starterKey ? q.starterCodes[starterKey] : "";
          next[q.id] = { ...(prev[q.id] ?? {}), [newLang]: saved ?? starter ?? "" };
        }
      });
      return next;
    });
    addToast(`Switched to ${langConfig(newLang).label}`, "info");
  };

  const handleCodeChange = (val: string | undefined) => {
    if (val === undefined || !questions[currentQIndex] || !language) return;
    const q = questions[currentQIndex];
    setSourceCode((p) => ({ ...p, [q.id]: { ...(p[q.id] ?? {}), [language]: val } }));
    if (questionStatus[q.id] === "NOT_STARTED") setQuestionStatus((p) => ({ ...p, [q.id]: "ATTEMPTED" }));
  };

  const currentCode = () => sourceCode[questions[currentQIndex]?.id ?? ""]?.[language] ?? "";

  const handleQuestionChange = (idx: number) => {
    setCurrentQIndex(idx);
    setRunResults(null);
    setActiveResultTab("testcases");
  };

  const handleRunCode = async () => {
    if (!questions[currentQIndex]) return;
    const q = questions[currentQIndex];
    const code = currentCode();
    if (!code.trim()) { addToast("Write some code before running.", "warning"); return; }
    setIsRunning(true); setRunResults(null); setActiveResultTab("result");
    try {
      const res = await fetch(`${API_BASE_URL}/coding-submissions/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ attemptId, questionId: q.id, language: langConfig(language).apiLang, sourceCode: code }),
      });
      if (!res.ok) throw new Error(`Run failed (${res.status})`);
      const data: ExecutionResult = await res.json();
      setRunResults(data);
      if (questionStatus[q.id] === "NOT_STARTED") setQuestionStatus((p) => ({ ...p, [q.id]: "ATTEMPTED" }));
      addToast(`Ran ${data.passedCases}/${data.totalCases} test cases`, data.passedCases === data.totalCases ? "success" : "info");
    } catch { addToast("Failed to run code", "error"); }
    finally { setIsRunning(false); }
  };

  const handleSubmitCode = async () => {
    if (!questions[currentQIndex]) return;
    const q = questions[currentQIndex];
    const code = currentCode();
    if (!code.trim()) { addToast("Write some code before submitting.", "warning"); return; }
    setIsSubmitting(true); setRunResults(null); setActiveResultTab("result");
    try {
      const res = await fetch(`${API_BASE_URL}/coding-submissions/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ attemptId, questionId: q.id, language: langConfig(language).apiLang, sourceCode: code }),
      });
      if (!res.ok) throw new Error(`Submit failed (${res.status})`);
      const data: ExecutionResult = await res.json();
      setRunResults(data);
      const st = data.status === "PASSED" ? "PASSED" : data.status === "PARTIAL" ? "PARTIAL" : data.passedCases > 0 ? "PARTIAL" : "FAILED";
      setQuestionStatus((p) => ({ ...p, [q.id]: st }));
      addToast(`${data.passedCases}/${data.totalCases} test cases passed`, data.status === "PASSED" ? "success" : "warning");
    } catch { addToast("Failed to submit", "error"); }
    finally { setIsSubmitting(false); }
  };

  // ─── Derived values ───────────────────────────────────────────────────────
  const currentQ = questions[currentQIndex];
  const publicTestCases = currentQ?.testCases.filter((t) => !t.isHidden) ?? [];
  const timerColor = timeLeft !== null && timeLeft < 300 ? "#ef4444" : timeLeft !== null && timeLeft < 600 ? "#f59e0b" : "#22c55e";
  const timerUrgent = timeLeft !== null && timeLeft < 300;
  const completedCount = Object.values(questionStatus).filter((s) => s === "PASSED" || s === "PARTIAL").length;
  const diffCfg = DIFF_CONFIG[(currentQ?.difficulty ?? "").toUpperCase()] ?? DIFF_CONFIG.EASY;

  // ─── Loading / Error states ───────────────────────────────────────────────
  if (loadError && !assessment) {
    return (
      <div style={{ minHeight: "100vh", background: "#030712", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',sans-serif" }}>
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ color: "#f87171", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Failed to Load</h2>
          <p style={{ color: "#94a3b8", fontSize: 14 }}>{loadError}</p>
          <button onClick={() => router.back()} style={{ marginTop: 24, background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Go Back</button>
        </div>
      </div>
    );
  }

  // ─── Security Gate ────────────────────────────────────────────────────────
  if (!securityReady) {
    const INIT_STEPS = [
      { label: "Requesting camera & microphone", icon: "📷" },
      { label: "Enabling screen sharing", icon: "🖥️" },
      { label: "Loading face detection AI", icon: "🤖" },
      { label: "Entering fullscreen mode", icon: "⛶" },
    ];
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { background: #030712; }
          @keyframes glow { 0%,100%{box-shadow:0 0 20px rgba(99,102,241,0.3)} 50%{box-shadow:0 0 40px rgba(99,102,241,0.6)} }
          @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
          @keyframes spin { to{transform:rotate(360deg)} }
          @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        `}</style>
        <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#030712 0%,#0f172a 50%,#030712 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',sans-serif", padding: 20 }}>
          <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
            <div style={{ position: "absolute", top: "20%", left: "15%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,0.08),transparent 70%)", filter: "blur(40px)" }} />
            <div style={{ position: "absolute", bottom: "20%", right: "15%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(168,85,247,0.06),transparent 70%)", filter: "blur(40px)" }} />
          </div>
          <div style={{ position: "relative", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 20, padding: "48px 44px", maxWidth: 560, width: "100%", backdropFilter: "blur(20px)", boxShadow: "0 32px 64px rgba(0,0,0,0.5)", animation: "fadeUp 0.4s ease" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, marginBottom: 20, animation: "glow 2s ease-in-out infinite" }}>🎥</div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.5px", marginBottom: 6, textAlign: "center" }}>PRO Proctored Assessment</h1>
              {assessment && (<p style={{ color: "#64748b", fontSize: 14, textAlign: "center" }}>{assessment.codingTest.title}</p>)}
            </div>
            {assessment && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 28 }}>
                {[["⏱ Duration", `${assessment.codingTest.duration} min`], ["📝 Questions", String(assessment.codingTest.questions.length)], ["🔴 Security", "PRO"]].map(([l, v]) => (
                  <div key={l} style={{ background: "rgba(30,41,59,0.8)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>{l}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0" }}>{v}</div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ background: "rgba(30,41,59,0.6)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px 20px", marginBottom: 28 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>Requirements</p>
              {[["📷","Webcam & microphone access required"],["🖥️","Entire screen sharing required — window/tab sharing is rejected"],["⛶","Fullscreen mode will be enforced"],["🤖","AI face detection will be active — max 10 screenshots"],["🚫","Tab switching, copy/paste, DevTools are blocked"]].map(([icon, text]) => (
                <div key={text as string} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 16, width: 24, textAlign: "center" }}>{icon}</span>
                  <span style={{ fontSize: 13, color: "#94a3b8" }}>{text as string}</span>
                </div>
              ))}
            </div>
            {isInitializingProctoring && (
              <div style={{ marginBottom: 24 }}>
                {INIT_STEPS.map((step, i) => {
                  const done = initStep > i + 1; const active = initStep === i + 1;
                  return (
                    <div key={step.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0" }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0, background: done ? "rgba(34,197,94,0.15)" : active ? "rgba(99,102,241,0.15)" : "rgba(30,41,59,0.8)", border: `1px solid ${done ? "rgba(34,197,94,0.4)" : active ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.06)"}` }}>
                        {done ? "✓" : active ? <div style={{ width: 12, height: 12, border: "2px solid #6366f1", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> : step.icon}
                      </div>
                      <span style={{ fontSize: 13, color: done ? "#22c55e" : active ? "#a5b4fc" : "#475569" }}>{step.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
            {loadError && (<div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, padding: "10px 14px", marginBottom: 20, color: "#f87171", fontSize: 13, textAlign: "center" }}>{loadError}</div>)}
            <button onClick={enterAssessment} disabled={isInitializingProctoring || !!loadError} style={{ width: "100%", padding: "15px 0", background: isInitializingProctoring || loadError ? "rgba(30,41,59,0.8)" : "linear-gradient(135deg,#6366f1,#8b5cf6)", color: isInitializingProctoring || loadError ? "#475569" : "#fff", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: isInitializingProctoring || loadError ? "not-allowed" : "pointer", letterSpacing: "0.3px", transition: "all 0.2s" }}>
              {isInitializingProctoring ? "Initializing..." : "Allow Camera & Start Assessment →"}
            </button>
          </div>
          <ToastContainer toasts={toasts} />
        </div>
      </>
    );
  }

  // ─── Main Layout ─────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #030712; overflow: hidden; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.25); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(99,102,241,0.45); }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-ring { 0%,100%{transform:scale(1);opacity:0.8} 50%{transform:scale(1.05);opacity:1} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes resultSlide { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes warningPop { 0%{opacity:0;transform:scale(0.85)} 60%{transform:scale(1.03)} 100%{opacity:1;transform:scale(1)} }
        @keyframes successBounce { 0%{opacity:0;transform:scale(0.7) translateY(30px)} 60%{transform:scale(1.05)} 100%{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes timerPulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
        .pro-header { background: rgba(10,15,28,0.95); border-bottom: 1px solid rgba(99,102,241,0.15); backdrop-filter: blur(20px); }
        .q-nav-btn:hover { background: rgba(99,102,241,0.08) !important; border-color: rgba(99,102,241,0.25) !important; }
        .q-nav-btn.active { background: rgba(99,102,241,0.12) !important; border-color: rgba(99,102,241,0.45) !important; }
        .lang-opt:hover { background: rgba(99,102,241,0.1) !important; }
        .run-btn:hover:not(:disabled) { background: rgba(71,85,105,0.9) !important; border-color: rgba(148,163,184,0.4) !important; transform: translateY(-1px); }
        .submit-btn:hover:not(:disabled) { background: rgba(34,197,94,0.9) !important; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(34,197,94,0.3) !important; }
        .final-btn:hover:not(:disabled) { background: linear-gradient(135deg,#4f46e5,#7c3aed) !important; transform: translateY(-1px); box-shadow: 0 4px 20px rgba(99,102,241,0.4) !important; }
        .tc-row:hover { background: rgba(99,102,241,0.05) !important; }
      `}</style>

      {/* Hidden screen capture video */}
      <video ref={screenVideoRef} autoPlay playsInline muted style={{ position: "fixed", top: -9999, left: -9999, width: 1, height: 1, opacity: 0, pointerEvents: "none" }} />

      {/* Toast Container */}
      <ToastContainer toasts={toasts} />

      {/* Warning Modal */}
      {showWarningModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(8px)" }}>
          <div style={{ background: "rgba(15,23,42,0.98)", border: "1px solid rgba(239,68,68,0.35)", borderRadius: 18, padding: "36px 40px", maxWidth: 440, width: "90%", textAlign: "center", boxShadow: "0 32px 64px rgba(0,0,0,0.7)", animation: "warningPop 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(239,68,68,0.12)", border: "2px solid rgba(239,68,68,0.35)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, margin: "0 auto 20px" }}>⚠️</div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#f1f5f9", marginBottom: 10 }}>Security Violation</h3>
            <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>{warningMessage}</p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "10px 16px", marginBottom: 24 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: i < warnings ? "#ef4444" : "rgba(71,85,105,0.5)", transition: "background 0.3s" }} />
              ))}
              <span style={{ fontSize: 13, fontWeight: 600, color: "#ef4444", marginLeft: 8 }}>{warnings}/5 warnings</span>
              {autoSubmitCountdown !== null && <span style={{ fontSize: 13, color: "#f59e0b", marginLeft: 4, animation: "timerPulse 1s ease-in-out infinite" }}>• Auto-submit in {autoSubmitCountdown}s</span>}
            </div>
            {warnings < 5 && (
              <button onClick={() => setShowWarningModal(false)} style={{ background: "rgba(239,68,68,0.15)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "10px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer", width: "100%" }}>
                I Understand
              </button>
            )}
          </div>
        </div>
      )}

      {/* Final Submit Confirm Modal */}
      {showFinalSubmitModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(10px)" }}>
          <div style={{ background: "rgba(15,23,42,0.98)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 20, padding: "40px 44px", maxWidth: 480, width: "90%", boxShadow: "0 32px 64px rgba(0,0,0,0.7)", animation: "warningPop 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: "linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.2))", border: "1px solid rgba(99,102,241,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 18px" }}>🚀</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9", marginBottom: 8 }}>Submit Assessment?</h2>
              <p style={{ color: "#64748b", fontSize: 14 }}>You cannot change your answers after submission.</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 28 }}>
              {[["Solved", `${completedCount}/${questions.length}`, "#22c55e"], ["Warnings", `${warnings}/5`, warnings >= 4 ? "#ef4444" : warnings >= 2 ? "#f59e0b" : "#22c55e"], ["Screenshots", `${screenshotsTaken}/10`, "#6366f1"]].map(([l, v, c]) => (
                <div key={l as string} style={{ background: "rgba(30,41,59,0.8)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "14px 12px", textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 5 }}>{l as string}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: c as string }}>{v as string}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setShowFinalSubmitModal(false)} disabled={isFinalSubmitting} style={{ flex: 1, background: "rgba(30,41,59,0.8)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "12px 0", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button onClick={executeFinalSubmit} disabled={isFinalSubmitting} className="final-btn" style={{ flex: 2, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", border: "none", borderRadius: 10, padding: "12px 0", fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {isFinalSubmitting ? (<><div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Submitting...</>) : "Confirm Submit →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, backdropFilter: "blur(12px)" }}>
          <div style={{ background: "rgba(15,23,42,0.99)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 24, padding: "56px 52px", maxWidth: 500, width: "90%", textAlign: "center", boxShadow: "0 40px 80px rgba(0,0,0,0.8), 0 0 60px rgba(34,197,94,0.08)", animation: "successBounce 0.5s cubic-bezier(0.34,1.56,0.64,1)" }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "radial-gradient(circle,rgba(34,197,94,0.2),rgba(34,197,94,0.05))", border: "2px solid rgba(34,197,94,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, margin: "0 auto 24px", animation: "pulse-ring 2s ease-in-out infinite" }}>✓</div>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: "#f1f5f9", marginBottom: 10, letterSpacing: "-0.5px" }}>Assessment Submitted!</h2>
            <p style={{ color: "#64748b", fontSize: 15, lineHeight: 1.7, marginBottom: 8 }}>Your responses have been recorded and all proctoring data has been saved.</p>
            <p style={{ color: "#475569", fontSize: 13, marginBottom: 32 }}>Questions solved: <strong style={{ color: "#22c55e" }}>{completedCount}</strong> / {questions.length}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button onClick={() => router.push("/tests/thank-you")} style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#fff", border: "none", borderRadius: 12, padding: "14px 0", fontSize: 15, fontWeight: 700, cursor: "pointer", letterSpacing: "0.2px" }}>Continue →</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN WRAPPER ─────────────────────────────────────────────────── */}
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", background: "#030712", fontFamily: "'Inter',sans-serif", color: "#e2e8f0" }}>

        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <div className="pro-header" style={{ height: 56, minHeight: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", gap: 12, flexShrink: 0 }}>
          {/* Left: branding */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>⌨️</div>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>{assessment?.codingTest?.title ?? "Assessment"}</span>
            <span style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 4, letterSpacing: 1, flexShrink: 0 }}>PRO</span>
          </div>

          {/* Right: status widgets */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            {/* Screen share status */}
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 8, background: screenShareEnabled ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${screenShareEnabled ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`, fontSize: 11, fontWeight: 600, color: screenShareEnabled ? "#86efac" : "#fca5a5" }}>
              <span style={{ fontSize: 13 }}>🖥️</span>{screenShareEnabled ? "Sharing" : "No Share"}
            </div>

            {/* Screenshots counter */}
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 8, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", fontSize: 11, fontWeight: 600, color: "#a5b4fc" }}>
              📸 {screenshotsTaken}/10
            </div>

            {/* Webcam preview */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <video ref={videoRef} autoPlay playsInline muted style={{ width: 72, height: 52, objectFit: "cover", borderRadius: 8, border: `2px solid ${faceCount === 1 ? "rgba(34,197,94,0.6)" : faceCount === 0 ? "rgba(239,68,68,0.6)" : "rgba(245,158,11,0.6)"}`, background: "#000", transform: "scaleX(-1)", display: "block" }} />
              <div style={{ position: "absolute", bottom: 3, left: "50%", transform: "translateX(-50%)", background: faceCount === 1 ? "rgba(34,197,94,0.85)" : "rgba(239,68,68,0.85)", borderRadius: 4, padding: "1px 5px", fontSize: 9, fontWeight: 700, color: "#fff", whiteSpace: "nowrap" }}>{faceCount === 0 ? "No face" : faceCount === 1 ? "✓ Face OK" : `${faceCount} faces`}</div>
            </div>

            {/* Timer */}
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 17, fontWeight: 700, color: timerColor, minWidth: 72, textAlign: "center", padding: "5px 10px", background: `${timerColor}10`, border: `1px solid ${timerColor}30`, borderRadius: 8, animation: timerUrgent ? "timerPulse 1s ease-in-out infinite" : "none" }}>
              {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
            </div>

            {/* Warnings */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 8, background: warnings > 0 ? "rgba(239,68,68,0.1)" : "rgba(30,41,59,0.8)", border: `1px solid ${warnings > 0 ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.06)"}`, fontSize: 12, fontWeight: 700, color: warnings > 0 ? "#fca5a5" : "#64748b" }}>
              ⚠ {warnings}/5
            </div>

            {/* Final Submit */}
            <button onClick={() => setShowFinalSubmitModal(true)} style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", border: "none", borderRadius: 8, padding: "7px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", letterSpacing: "0.2px", transition: "all 0.2s" }}>
              Submit All
            </button>
          </div>
        </div>

        {/* ── BODY ────────────────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>

          {/* Question Navigator — 5% */}
          <div style={{ width: "5%", minWidth: 56, maxWidth: 72, background: "rgba(10,15,28,0.95)", borderRight: "1px solid rgba(255,255,255,0.04)", display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 6px", gap: 6, overflowY: "auto", flexShrink: 0 }}>
            {questions.map((q, i) => {
              const st = questionStatus[q.id] ?? "NOT_STARTED";
              const cfg = STATUS_CONFIG[st] ?? STATUS_CONFIG.NOT_STARTED;
              const isActive = i === currentQIndex;
              return (
                <button key={q.id} className={`q-nav-btn ${isActive ? "active" : ""}`} onClick={() => handleQuestionChange(i)} title={q.title} style={{ width: 40, height: 40, borderRadius: 10, background: isActive ? "rgba(99,102,241,0.15)" : "rgba(30,41,59,0.6)", border: `1px solid ${isActive ? "rgba(99,102,241,0.5)" : cfg.color + "30"}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s", flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: isActive ? "#a5b4fc" : cfg.color }}>{i + 1}</span>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.color, marginTop: 2 }} />
                </button>
              );
            })}
            <div style={{ marginTop: "auto", paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.04)", width: "100%", textAlign: "center" }}>
              <div style={{ fontSize: 9, color: "#475569", fontWeight: 700 }}>{completedCount}/{questions.length}</div>
            </div>
          </div>

          {/* Question Panel — 45% */}
          <div style={{ width: "45%", background: "#080d1a", borderRight: "1px solid rgba(255,255,255,0.04)", display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0 }}>
            {currentQ ? (
              <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
                {/* Question header */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#475569", background: "rgba(30,41,59,0.8)", padding: "3px 8px", borderRadius: 6 }}>Q{currentQIndex + 1} of {questions.length}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: diffCfg.color, background: diffCfg.bg, border: `1px solid ${diffCfg.border}`, padding: "3px 8px", borderRadius: 6 }}>{currentQ.difficulty}</span>
                    <span style={{ fontSize: 11, color: "#475569", background: "rgba(30,41,59,0.6)", border: "1px solid rgba(255,255,255,0.05)", padding: "3px 8px", borderRadius: 6 }}>{currentQ.category}</span>
                    {questionStatus[currentQ.id] !== "NOT_STARTED" && (() => { const s = STATUS_CONFIG[questionStatus[currentQ.id]] ?? STATUS_CONFIG.NOT_STARTED; return <span style={{ fontSize: 11, fontWeight: 700, color: s.color, background: s.bg, padding: "3px 8px", borderRadius: 6, marginLeft: "auto" }}>{s.label}</span>; })()}
                  </div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", lineHeight: 1.3, letterSpacing: "-0.3px" }}>{currentQ.title}</h2>
                </div>

                {/* Description */}
                <div style={{ marginBottom: 20 }}>
                  {currentQ.description.split("\n").map((line, i) => (
                    <p key={i} style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.75, marginBottom: 6 }}>{line}</p>
                  ))}
                </div>

                {/* Sections */}
                {[["Input Format", currentQ.inputFormat, "📥"], ["Output Format", currentQ.outputFormat, "📤"], ["Constraints", currentQ.constraints, "⚡"]].map(([label, content, icon]) => (
                  <div key={label as string} style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
                      <span style={{ fontSize: 13 }}>{icon as string}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", textTransform: "uppercase" as const, letterSpacing: 1 }}>{label as string}</span>
                    </div>
                    <div style={{ background: "rgba(15,23,42,0.7)", border: "1px solid rgba(99,102,241,0.1)", borderRadius: 8, padding: "12px 14px", fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: "#94a3b8", lineHeight: 1.7, whiteSpace: "pre-wrap" as const }}>{content as string}</div>
                  </div>
                ))}

                {/* Examples */}
                {publicTestCases.length > 0 && (
                  <div style={{ marginTop: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
                      <span style={{ fontSize: 13 }}>📋</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", textTransform: "uppercase" as const, letterSpacing: 1 }}>Examples</span>
                    </div>
                    {publicTestCases.map((tc, i) => (
                      <div key={tc.id} style={{ background: "rgba(15,23,42,0.7)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, padding: "14px 16px", marginBottom: 10, animation: "fadeIn 0.3s ease" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", marginBottom: 10 }}>Example {i + 1}</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          {[["Input", tc.input], ["Expected Output", tc.expectedOutput]].map(([lbl, val]) => (
                            <div key={lbl as string}>
                              <div style={{ fontSize: 10, fontWeight: 600, color: "#475569", marginBottom: 4, textTransform: "uppercase" as const, letterSpacing: 0.5 }}>{lbl as string}</div>
                              <pre style={{ background: "#030712", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 6, padding: "8px 10px", fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: "#a5b4fc", whiteSpace: "pre-wrap" as const, margin: 0 }}>{val as string}</pre>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#475569", fontSize: 14 }}>Select a question to begin</div>
            )}
          </div>

          {/* Editor Panel — 50% */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

            {/* Editor Toolbar */}
            <div style={{ height: 48, minHeight: 48, background: "rgba(10,15,28,0.95)", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", gap: 8, padding: "0 14px", flexShrink: 0 }}>
              {/* Language selector */}
              <div style={{ position: "relative" }}>
                <select value={language} onChange={(e) => handleLanguageChange(e.target.value)} style={{ background: "rgba(30,41,59,0.8)", border: "1px solid rgba(99,102,241,0.2)", color: "#e2e8f0", borderRadius: 7, padding: "5px 32px 5px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", appearance: "none" as const }}>
                  {availableLangs.map((l) => <option key={l} value={l}>{langConfig(l).label}</option>)}
                </select>
                <div style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: 10, color: "#6366f1" }}>▼</div>
              </div>

              {/* Lang color dot */}
              {language && <div style={{ width: 8, height: 8, borderRadius: "50%", background: langConfig(language).color, flexShrink: 0 }} />}

              <div style={{ flex: 1 }} />

              {/* Run Code */}
              <button onClick={handleRunCode} disabled={isRunning || isSubmitting} className="run-btn" style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(30,41,59,0.8)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, padding: "5px 14px", fontSize: 12, fontWeight: 700, cursor: isRunning || isSubmitting ? "not-allowed" : "pointer", opacity: isRunning || isSubmitting ? 0.5 : 1, transition: "all 0.15s" }}>
                {isRunning ? (<><div style={{ width: 12, height: 12, border: "2px solid rgba(148,163,184,0.3)", borderTopColor: "#94a3b8", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Running...</>) : (<>▶ Run Code</>)}
              </button>

              {/* Submit Code */}
              <button onClick={handleSubmitCode} disabled={isRunning || isSubmitting} className="submit-btn" style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(34,197,94,0.85)", color: "#fff", border: "none", borderRadius: 7, padding: "5px 14px", fontSize: 12, fontWeight: 700, cursor: isRunning || isSubmitting ? "not-allowed" : "pointer", opacity: isRunning || isSubmitting ? 0.5 : 1, transition: "all 0.15s" }}>
                {isSubmitting ? (<><div style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Submitting...</>) : (<>✓ Submit</>)}
              </button>
            </div>

            {/* Monaco Editor */}
            <div style={{ flex: 1, overflow: "hidden", minHeight: 0 }}>
              <MonacoEditor
                height="100%"
                language={langConfig(language).monaco}
                theme="vs-dark"
                path={`${currentQ?.id ?? "q"}_${language}`}
                value={(() => {
                  const fromState = sourceCode[currentQ?.id ?? ""]?.[language];
                  if (fromState !== undefined) return fromState;
                  const saved = typeof window !== "undefined" ? localStorage.getItem(`pro_${attemptId}_${currentQ?.id ?? ""}_${language.toLowerCase()}`) : null;
                  if (saved !== null) return saved;
                  const starterKey = Object.keys(currentQ?.starterCodes ?? {}).find((k) => k.toLowerCase() === language.toLowerCase());
                  return starterKey ? (currentQ?.starterCodes[starterKey] ?? "") : "";
                })()}
                onChange={handleCodeChange}
                options={{ minimap: { enabled: false }, fontSize: 14, scrollBeyondLastLine: false, lineNumbers: "on", renderLineHighlight: "line", fontFamily: "'JetBrains Mono', 'Fira Code', monospace", padding: { top: 12, bottom: 12 } }}
              />
            </div>

            {/* Results Panel */}
            <div style={{ height: 260, minHeight: 260, maxHeight: 260, background: "rgba(8,13,26,0.98)", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
              {/* Tabs */}
              <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.04)", padding: "0 14px", gap: 2, height: 38, flexShrink: 0 }}>
                {([["testcases", `Test Cases (${publicTestCases.length})`], ["result", isRunning || isSubmitting ? "Running…" : "Results"]] as const).map(([tab, label]) => (
                  <button key={tab} onClick={() => setActiveResultTab(tab)} style={{ background: "transparent", border: "none", borderBottom: `2px solid ${activeResultTab === tab ? "#6366f1" : "transparent"}`, color: activeResultTab === tab ? "#a5b4fc" : "#475569", padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "color 0.15s", whiteSpace: "nowrap" as const }}>
                    {label}
                  </button>
                ))}
                {(isRunning || isSubmitting) && (
                  <div style={{ marginLeft: 8, display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#6366f1" }}>
                    <div style={{ width: 10, height: 10, border: "1.5px solid rgba(99,102,241,0.3)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                    {isRunning ? "Executing code..." : "Submitting..."}
                  </div>
                )}
              </div>

              {/* Tab Content */}
              <div style={{ flex: 1, overflowY: "auto", padding: "10px 14px" }}>

                {/* Test Cases Tab */}
                {activeResultTab === "testcases" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {publicTestCases.length === 0 ? (
                      <div style={{ color: "#475569", fontSize: 13, textAlign: "center", padding: "20px 0" }}>No public test cases available.</div>
                    ) : publicTestCases.map((tc, i) => (
                      <div key={tc.id} className="tc-row" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 8, padding: "8px 12px", transition: "background 0.15s" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", marginBottom: 6 }}>Case {i + 1}</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          {[["Input", tc.input], ["Expected", tc.expectedOutput]].map(([lbl, val]) => (
                            <div key={lbl as string}>
                              <div style={{ fontSize: 9, fontWeight: 700, color: "#475569", textTransform: "uppercase" as const, letterSpacing: 0.5, marginBottom: 3 }}>{lbl as string}</div>
                              <pre style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#94a3b8", margin: 0, whiteSpace: "pre-wrap" as const }}>{val as string}</pre>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Results Tab */}
                {activeResultTab === "result" && (
                  <div style={{ animation: "resultSlide 0.25s ease" }}>
                    {/* Loading skeleton */}
                    {(isRunning || isSubmitting) && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                          <div style={{ width: 28, height: 28, border: "2.5px solid rgba(99,102,241,0.2)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#a5b4fc" }}>Executing your code...</div>
                            <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>Running against all test cases</div>
                          </div>
                        </div>
                        {[1, 2, 3].map((n) => (
                          <div key={n} style={{ height: 36, background: "linear-gradient(90deg,rgba(30,41,59,0.6) 25%,rgba(99,102,241,0.08) 50%,rgba(30,41,59,0.6) 75%)", backgroundSize: "200% 100%", borderRadius: 8, animation: "shimmer 1.4s ease-in-out infinite", animationDelay: `${n * 0.1}s` }} />
                        ))}
                      </div>
                    )}

                    {/* No results yet */}
                    {!runResults && !isRunning && !isSubmitting && (
                      <div style={{ textAlign: "center", padding: "20px 0" }}>
                        <div style={{ fontSize: 24, marginBottom: 8 }}>▶</div>
                        <p style={{ fontSize: 13, color: "#475569" }}>Run or submit your code to see results here.</p>
                      </div>
                    )}

                    {/* Error result */}
                    {runResults && !isRunning && !isSubmitting && (runResults.error || ["COMPILE_ERROR","RUNTIME_ERROR","TIME_LIMIT_EXCEEDED"].includes(runResults.status)) && (
                      <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "12px 14px", animation: "resultSlide 0.2s ease" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                          <span style={{ fontSize: 16 }}>❌</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#f87171" }}>{runResults.status.replace(/_/g, " ")}</span>
                        </div>
                        <pre style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#fca5a5", whiteSpace: "pre-wrap" as const, margin: 0, lineHeight: 1.6 }}>{runResults.error ?? "An error occurred"}</pre>
                      </div>
                    )}

                    {/* Success result with test case breakdown */}
                    {runResults && !isRunning && !isSubmitting && !runResults.error && !["COMPILE_ERROR","RUNTIME_ERROR","TIME_LIMIT_EXCEEDED"].includes(runResults.status) && (
                      <div style={{ animation: "resultSlide 0.25s ease" }}>
                        {/* Summary header */}
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, padding: "10px 12px", background: runResults.passedCases === runResults.totalCases ? "rgba(34,197,94,0.06)" : "rgba(245,158,11,0.06)", border: `1px solid ${runResults.passedCases === runResults.totalCases ? "rgba(34,197,94,0.2)" : "rgba(245,158,11,0.2)"}`, borderRadius: 10 }}>
                          <span style={{ fontSize: 20 }}>{runResults.passedCases === runResults.totalCases ? "🎉" : "⚠️"}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: runResults.passedCases === runResults.totalCases ? "#86efac" : "#fde68a" }}>
                              {runResults.passedCases === runResults.totalCases ? "All tests passed!" : `${runResults.passedCases} / ${runResults.totalCases} tests passed`}
                            </div>
                            <div style={{ fontSize: 11, color: "#475569", marginTop: 1 }}>Status: {runResults.status}</div>
                          </div>
                          {runResults.score !== undefined && (<div style={{ textAlign: "center" }}><div style={{ fontSize: 18, fontWeight: 800, color: "#a5b4fc" }}>{runResults.score}</div><div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase" as const }}>pts</div></div>)}
                          {/* Progress bar */}
                          <div style={{ width: 80 }}>
                            <div style={{ height: 6, background: "rgba(30,41,59,0.8)", borderRadius: 99, overflow: "hidden" }}>
                              <div style={{ height: "100%", borderRadius: 99, width: `${runResults.totalCases > 0 ? (runResults.passedCases / runResults.totalCases) * 100 : 0}%`, background: runResults.passedCases === runResults.totalCases ? "#22c55e" : "#f59e0b", transition: "width 0.4s ease" }} />
                            </div>
                          </div>
                        </div>

                        {/* Per test-case rows */}
                        {runResults.results && runResults.results.length > 0 && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            {runResults.results.map((r, i) => (
                              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, background: r.passed ? "rgba(34,197,94,0.04)" : "rgba(239,68,68,0.04)", border: `1px solid ${r.passed ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)"}`, borderRadius: 8, padding: "8px 10px", animation: `resultSlide 0.2s ease`, animationDelay: `${i * 0.04}s`, animationFillMode: "both" }}>
                                <div style={{ width: 20, height: 20, borderRadius: "50%", background: r.passed ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0, marginTop: 1 }}>{r.passed ? "✓" : "✕"}</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: r.passed ? "#86efac" : "#fca5a5", marginBottom: 3 }}>Test Case {r.testCaseNo}</div>
                                  {!r.passed && r.input !== undefined && (
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                                      {[["Input", r.input], ["Expected", r.expected], ["Received", r.received]].filter(([, v]) => v !== undefined).map(([lbl, val]) => (
                                        <div key={lbl as string} style={{ gridColumn: lbl === "Input" ? "1 / -1" : "auto" }}>
                                          <div style={{ fontSize: 9, fontWeight: 700, color: "#475569", textTransform: "uppercase" as const, letterSpacing: 0.5, marginBottom: 2 }}>{lbl as string}</div>
                                          <pre style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: lbl === "Received" ? "#fca5a5" : "#64748b", margin: 0, whiteSpace: "pre-wrap" as const }}>{val as string}</pre>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>{/* end editor panel */}
        </div>{/* end body */}
      </div>{/* end main wrapper */}
    </>
  );
}
