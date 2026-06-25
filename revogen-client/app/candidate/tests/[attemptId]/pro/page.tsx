"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

interface Question {
  id: string;
  title: string;
  difficulty: string;
  category: string;
  description: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  starterCodes: Record<string, string>;
  testCases: TestCase[];
}

interface AssessmentData {
  id: string;
  status: string;
  codingTest: {
    title: string;
    description: string;
    duration: number;
    securityLevel: string;
    questions: { question: Question }[];
  };
}

interface RunTestResult {
  testCaseNo: number;
  passed: boolean;
  input?: string;
  expected?: string;
  received?: string;
}

interface ExecutionResult {
  success: boolean;
  status: string;
  passedCases: number;
  totalCases: number;
  score?: number;
  error?: string;
  results?: RunTestResult[];
}

interface ProctorStats {
  faceMissingCount: number;
  multipleFacesCount: number;
  noiseWarningCount: number;
  gazeAwayCount: number;
  phoneDetectedCount: number;
  faceNotCenteredCount: number;
  cameraEnabled: boolean;
  micEnabled: boolean;
}

type ToastType = "success" | "error" | "warning" | "info";

// ─── Constants ────────────────────────────────────────────────────────────────

const API_BASE = "http://localhost:3000";

/**
 * Maps a starterCodes key (whatever the backend sends) to the language string
 * the execution API expects AND to the Monaco language id. The keys here are
 * lowercased, so lookups are case-insensitive against backend keys.
 */
const LANGUAGE_CONFIG: Record<
  string,
  { label: string; apiLang: string; monaco: string }
> = {
  javascript: { label: "JavaScript", apiLang: "javascript", monaco: "javascript" },
  typescript: { label: "TypeScript", apiLang: "typescript", monaco: "typescript" },
  python: { label: "Python", apiLang: "python", monaco: "python" },
  python3: { label: "Python", apiLang: "python", monaco: "python" },
  java: { label: "Java", apiLang: "java", monaco: "java" },
  cpp: { label: "C++", apiLang: "cpp", monaco: "cpp" },
  "c++": { label: "C++", apiLang: "cpp", monaco: "cpp" },
  c: { label: "C", apiLang: "c", monaco: "c" },
  csharp: { label: "C#", apiLang: "csharp", monaco: "csharp" },
  "c#": { label: "C#", apiLang: "csharp", monaco: "csharp" },
  go: { label: "Go", apiLang: "go", monaco: "go" },
  golang: { label: "Go", apiLang: "go", monaco: "go" },
  rust: { label: "Rust", apiLang: "rust", monaco: "rust" },
  ruby: { label: "Ruby", apiLang: "ruby", monaco: "ruby" },
  php: { label: "PHP", apiLang: "php", monaco: "php" },
  kotlin: { label: "Kotlin", apiLang: "kotlin", monaco: "kotlin" },
  swift: { label: "Swift", apiLang: "swift", monaco: "swift" },
};

function langConfig(key: string) {
  const k = key.toLowerCase().trim();
  return (
    LANGUAGE_CONFIG[k] ?? {
      label: key.charAt(0).toUpperCase() + key.slice(1),
      apiLang: k,
      monaco: k,
    }
  );
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0)
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProAssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params.attemptId as string;

  // Assessment
  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Editor
  // The languages available across the loaded questions (raw starterCodes keys).
  const [availableLangs, setAvailableLangs] = useState<string[]>([]);
  // The currently selected language, stored as a raw starterCodes key.
  const [language, setLanguage] = useState<string>("");
  /**
   * Source code is keyed per question AND per language:
   *   sourceCode[questionId][langKey] = "<code>"
   * This is the core fix for the "stuck on Python" bug — each language keeps
   * its own buffer, seeded from that language's starter code on first touch.
   */
  const [sourceCode, setSourceCode] = useState<
    Record<string, Record<string, string>>
  >({});
  const [questionStatus, setQuestionStatus] = useState<Record<string, string>>({});
  const [activeResultTab, setActiveResultTab] = useState<"testcases" | "result">(
    "testcases"
  );

  // Execution
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runResults, setRunResults] = useState<ExecutionResult | null>(null);

  // Security / proctoring
  const [securityReady, setSecurityReady] = useState(false);
  const [warnings, setWarnings] = useState(0);
  const [isInitializingProctoring, setIsInitializingProctoring] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [faceCount, setFaceCount] = useState(0);
  const [proctorStats, setProctorStats] = useState<ProctorStats>({
    faceMissingCount: 0,
    multipleFacesCount: 0,
    noiseWarningCount: 0,
    gazeAwayCount: 0,
    phoneDetectedCount: 0,
    faceNotCenteredCount: 0,
    cameraEnabled: false,
    micEnabled: false,
  });

  // UI / Modals
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [showFinalSubmitModal, setShowFinalSubmitModal] = useState(false);
  const [autoSubmitCountdown, setAutoSubmitCountdown] = useState<number | null>(null);
  const [isFinalSubmitting, setIsFinalSubmitting] = useState(false);
  const [screenShareEnabled, setScreenShareEnabled] = useState(false);
  const [toasts, setToasts] = useState<
    { id: number; message: string; type: ToastType }[]
  >([]);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null); // hidden — holds screen capture feed
  const faceDetectorRef = useRef<any>(null);
  const faceDetectionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const micIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const noFaceTimerRef = useRef<number>(0);
  const lastFaceNotCenteredAtRef = useRef<number>(0); // debounce for FACE_NOT_CENTERED screenshots
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const isAutoSubmittingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const warningsRef = useRef(0);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const multipleFacesTimerRef = useRef<number>(0); // consecutive ms with >1 face

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const getToken = () =>
    (typeof window !== "undefined" && localStorage.getItem("access_token")) || "";

  const addToast = useCallback((msg: string, type: ToastType = "success") => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, message: msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  }, []);

  const logSecurityEvent = useCallback(
    async (eventType: string, details: Record<string, any> = {}) => {
      try {
        await fetch(`${API_BASE}/coding-attempts/${attemptId}/security-event`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({
            eventType,
            details: { ...details, timestamp: new Date().toISOString() },
          }),
        });
      } catch {
        /* silent */
      }
    },
    [attemptId]
  );

  // ─── Screenshot capture + upload ─────────────────────────────────────────
  // Captures the full screen (via screenVideoRef) and overlays the webcam face
  // (from videoRef) as a small PiP in the bottom-right corner.
  // grabFrameFromSource: pulls one decoded bitmap out of either a MediaStream
  // (preferred — via ImageCapture.grabFrame / track + ImageCapture, which reads
  // straight off the MediaStreamTrack and does NOT depend on any <video> element
  // being mounted, visible, or sized) or, as a fallback, an actual <video>
  // element that is confirmed to be playing.
  //
  // This replaces the old approach of drawing from screenVideoRef directly.
  // That approach broke whenever the <video> was display:none/zero-size
  // (browser stops decoding into it) AND, after switching it to an off-screen
  // absolutely-positioned element, was still unreliable across browsers because
  // "off-screen but technically in the DOM" rendering/decoding behavior differs
  // by engine. Reading frames directly off the track sidesteps all of that.
  const grabFrameFromStream = async (
    stream: MediaStream | null,
    retries = 2
  ): Promise<ImageBitmap | null> => {
    if (!stream) return null;
    const track = stream.getVideoTracks()[0];
    if (!track || track.readyState !== "live") return null;
    // @ts-ignore — ImageCapture is not yet in standard TS DOM lib typings
    const ImageCaptureCtor = (window as any).ImageCapture;
    if (!ImageCaptureCtor) return null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const capture = new ImageCaptureCtor(track);
        const bitmap: ImageBitmap = await capture.grabFrame();
        // A frame with zero area means the OS compositor hadn't delivered a
        // real frame yet — this happens right around tab-switch/focus-change
        // moments. Treat it as a failure and retry rather than uploading a
        // blank screenshot.
        if (bitmap.width === 0 || bitmap.height === 0) {
          bitmap.close?.();
          throw new Error("grabFrame returned an empty (0x0) frame");
        }
        return bitmap;
      } catch (err) {
        if (attempt === retries) {
          console.warn("[proctoring] grabFrame failed after retries", err);
          return null;
        }
        // Short backoff — gives the compositor/OS time to deliver a real
        // frame after a visibility/focus transition. ~150ms, ~300ms.
        await new Promise((r) => setTimeout(r, 150 * (attempt + 1)));
      }
    }
    return null;
  };

  const captureAndUploadScreenshot = useCallback(
    async (eventType: string, details: Record<string, any> = {}) => {
      try {
        // 1. Try to grab real frames directly from the MediaStream tracks —
        //    this is independent of any <video> element's visibility/layout.
        const [screenBitmap, camBitmap] = await Promise.all([
          grabFrameFromStream(screenStreamRef.current),
          grabFrameFromStream(cameraStream),
        ]);

        // 2. Fallback to the <video> elements if ImageCapture isn't supported
        //    in this browser (e.g. older Firefox/Safari) or grabFrame failed.
        const screenVid = screenVideoRef.current;
        const camVid = videoRef.current;
        const screenVidReady =
          !!screenVid &&
          screenVid.readyState >= 2 &&
          screenVid.videoWidth > 0 &&
          screenVid.videoHeight > 0;
        const camVidReady =
          !!camVid &&
          camVid.readyState >= 2 &&
          camVid.videoWidth > 0 &&
          camVid.videoHeight > 0;

        const haveScreen = !!screenBitmap || screenVidReady;
        const haveCam = !!camBitmap || camVidReady;

        if (!haveScreen && !haveCam) {
          console.warn(
            "[proctoring] captureAndUploadScreenshot: no source available",
            {
              hasScreenStream: !!screenStreamRef.current,
              hasCamStream: !!cameraStream,
              screenBitmap: !!screenBitmap,
              camBitmap: !!camBitmap,
              screenVidReady,
              camVidReady,
            }
          );
          return;
        }

        // Resolve a single drawable source + its natural dimensions for screen
        // and camera, preferring the bitmap (grabFrame) over the <video> element.
        const screenSrc: ImageBitmap | HTMLVideoElement | null = screenBitmap
          ? screenBitmap
          : screenVidReady
          ? screenVid!
          : null;
        const camSrc: ImageBitmap | HTMLVideoElement | null = camBitmap
          ? camBitmap
          : camVidReady
          ? camVid!
          : null;

        const dims = (src: ImageBitmap | HTMLVideoElement) =>
          src instanceof HTMLVideoElement
            ? { w: src.videoWidth, h: src.videoHeight }
            : { w: src.width, h: src.height };

        const baseSrc = screenSrc ?? camSrc!; // we already know at least one exists
        const baseDims = dims(baseSrc);

        const canvas = document.createElement("canvas");
        canvas.width = baseDims.w || 1280;
        canvas.height = baseDims.h || 720;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Draw full screen (or webcam fallback) as background
        ctx.drawImage(baseSrc as any, 0, 0, canvas.width, canvas.height);

        // Overlay webcam feed as PiP in bottom-right corner (if screen is base
        // and we also have a camera source)
        if (baseSrc === screenSrc && camSrc) {
          const camDims = dims(camSrc);
          const pipW = Math.round(canvas.width * 0.22);
          const pipH = Math.round(pipW * (camDims.h / Math.max(camDims.w, 1)));
          const pipX = canvas.width - pipW - 16;
          const pipY = canvas.height - pipH - 16;
          // Draw a border around the PiP
          ctx.fillStyle = "rgba(0,0,0,0.6)";
          ctx.fillRect(pipX - 3, pipY - 3, pipW + 6, pipH + 6);
          ctx.drawImage(camSrc as any, pipX, pipY, pipW, pipH);
          // Label
          ctx.fillStyle = "#ffffff";
          ctx.font = `bold ${Math.round(canvas.width * 0.012)}px sans-serif`;
          ctx.fillText("Webcam", pipX + 6, pipY + Math.round(canvas.width * 0.016));
        }

        // Add event type watermark at top-left
        ctx.fillStyle = "rgba(239,68,68,0.85)";
        const labelH = Math.round(canvas.height * 0.04);
        ctx.fillRect(0, 0, canvas.width, labelH);
        ctx.fillStyle = "#ffffff";
        ctx.font = `bold ${Math.round(labelH * 0.6)}px sans-serif`;
        ctx.fillText(
          `⚠ ${eventType.replace(/_/g, " ")}  •  ${new Date().toLocaleTimeString()}`,
          12,
          Math.round(labelH * 0.75)
        );

        // Release bitmaps now that they're drawn (frees memory promptly)
        screenBitmap?.close?.();
        camBitmap?.close?.();

        // ── Downscale + adaptively compress to avoid 413 Payload Too Large ──
        // A raw 1920x1080+ screen capture as JPEG q0.7 can easily be 300-800KB,
        // and base64-encoding it in JSON adds ~33% on top of that — backends
        // with a default body-size limit (often 1MB or even 100KB on some
        // frameworks) reject it outright. We cap the longest side and walk the
        // quality down until the encoded payload fits a safe budget.
        const MAX_DIMENSION = 1280; // longest side, px — plenty for review purposes
        const MAX_PAYLOAD_BYTES = 350_000; // ~350KB raw → ~470KB after base64+JSON

        let outCanvas = canvas;
        if (canvas.width > MAX_DIMENSION || canvas.height > MAX_DIMENSION) {
          const scale = MAX_DIMENSION / Math.max(canvas.width, canvas.height);
          const small = document.createElement("canvas");
          small.width = Math.round(canvas.width * scale);
          small.height = Math.round(canvas.height * scale);
          const sctx = small.getContext("2d");
          if (sctx) {
            sctx.drawImage(canvas, 0, 0, small.width, small.height);
            outCanvas = small;
          }
        }

        let quality = 0.7;
        let imageDataUrl = outCanvas.toDataURL("image/jpeg", quality);
        // Walk quality down (and as a last resort shrink dimensions further)
        // until we're under the payload budget, capped at a few attempts so a
        // pathological case can't loop forever.
        for (let attempt = 0; attempt < 5 && imageDataUrl.length > MAX_PAYLOAD_BYTES; attempt++) {
          if (quality > 0.35) {
            quality -= 0.15;
            imageDataUrl = outCanvas.toDataURL("image/jpeg", quality);
          } else {
            // Quality is already low — shrink dimensions instead.
            const shrink = document.createElement("canvas");
            shrink.width = Math.round(outCanvas.width * 0.75);
            shrink.height = Math.round(outCanvas.height * 0.75);
            const shctx = shrink.getContext("2d");
            if (!shctx) break;
            shctx.drawImage(outCanvas, 0, 0, shrink.width, shrink.height);
            outCanvas = shrink;
            imageDataUrl = outCanvas.toDataURL("image/jpeg", quality);
          }
        }

        if (imageDataUrl.length > MAX_PAYLOAD_BYTES) {
          console.warn(
            "[proctoring] screenshot still large after compression — backend may still reject with 413",
            { finalBytes: imageDataUrl.length, quality, w: outCanvas.width, h: outCanvas.height }
          );
        }

        console.log("[proctoring] screenshot captured", {
          eventType,
          width: outCanvas.width,
          height: outCanvas.height,
          quality,
          usedScreen: !!screenSrc,
          usedCam: !!camSrc,
          bytes: imageDataUrl.length,
        });

        // Fire and forget — never block the test
        fetch(`${API_BASE}/coding-attempts/${attemptId}/security-screenshot`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({
            eventType,
            imageDataUrl,
            details: { ...details, timestamp: new Date().toISOString() },
          }),
        })
          .then((res) => {
            if (!res.ok) {
              console.error(
                "[proctoring] security-screenshot upload failed",
                res.status,
                res.statusText
              );
            }
          })
          .catch((err) => {
            console.error("[proctoring] security-screenshot upload error", err);
          });
      } catch (err) {
        console.error("[proctoring] captureAndUploadScreenshot threw", err);
      }
    },
    [attemptId, cameraStream]
  );

  // logEventWithScreenshot: for HIGH-severity events → screenshot + log in one call
  // logSecurityEvent: for low-severity events → log only, no screenshot
  const logEventWithScreenshot = useCallback(
    (eventType: string, details: Record<string, any> = {}) => {
      // captureAndUploadScreenshot calls the /security-screenshot endpoint which
      // both uploads the image AND creates the CodingSecurityEvent record.
      // We do NOT call logSecurityEvent here — that would create a duplicate event.

      if (eventType === "TAB_SWITCH") {
        // Wait until candidate returns to the tab so we capture their screen
        const waitForReturn = () => {
          if (!document.hidden) {
            document.removeEventListener("visibilitychange", waitForReturn);
            captureAndUploadScreenshot(eventType, details);
          }
        };
        document.addEventListener("visibilitychange", waitForReturn);
        // Safety fallback: capture after 10s even if they never return
        setTimeout(() => {
          document.removeEventListener("visibilitychange", waitForReturn);
          captureAndUploadScreenshot(eventType, details);
        }, 10000);
      } else if (eventType === "MULTIPLE_FACES") {
        // Multiple faces — capture immediately, no delay
        captureAndUploadScreenshot(eventType, details);
      } else {
        // All other events — wait 2s for screen to settle before capturing
        setTimeout(() => captureAndUploadScreenshot(eventType, details), 2000);
      }
    },
    [captureAndUploadScreenshot]
  );

  // ─── executeFinalSubmit (MUST be before addWarning) ───────────────────────

  const executeFinalSubmit = useCallback(async () => {
    if (isAutoSubmittingRef.current) return;
    isAutoSubmittingRef.current = true;
    setIsFinalSubmitting(true);
    try {
      const res = await fetch(
        `${API_BASE}/coding-attempts/${attemptId}/pro/final-submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ proctoringData: proctorStats }),
        }
      );
      if (!res.ok) throw new Error(`Submit failed (${res.status})`);
      // Release media + fullscreen before navigating away.
      cameraStream?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close().catch(() => {});
      if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
      router.push("/tests/thank-you");
    } catch {
      addToast("Failed to submit. Please try again.", "error");
      isAutoSubmittingRef.current = false;
      setIsFinalSubmitting(false);
    }
  }, [attemptId, proctorStats, addToast, router, cameraStream]);

  const executeFinalSubmitRef = useRef(executeFinalSubmit);
  useEffect(() => {
    executeFinalSubmitRef.current = executeFinalSubmit;
  }, [executeFinalSubmit]);

  // ─── addWarning ───────────────────────────────────────────────────────────

  const addWarning = useCallback(
    (message: string) => {
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
    },
    [addToast]
  );

  // ─── useEffects ───────────────────────────────────────────────────────────

  // 1. Fetch attempt data
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/coding-attempts/${attemptId}`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (!res.ok) throw new Error(`Failed to load (${res.status})`);
        const raw = await res.json();
        if (!raw?.codingTest) {
          setLoadError("This assessment could not be found.");
          return;
        }
        setAssessment(raw);
        const qs: Question[] = raw.codingTest.questions.map((q: any) => q.question);
        setQuestions(qs);
        setTimeLeft(raw.codingTest.duration * 60);

        // ── Determine available languages from the actual starterCodes keys ──
        // Union of every starter-code key across all questions, in stable order.
        const langSet: string[] = [];
        qs.forEach((q) => {
          Object.keys(q.starterCodes ?? {}).forEach((k) => {
            if (!langSet.some((x) => x.toLowerCase() === k.toLowerCase()))
              langSet.push(k);
          });
        });
        const langs = langSet.length ? langSet : ["python"];
        setAvailableLangs(langs);

        // Pick an initial language: prefer a previously saved choice, else first.
        const savedLang = localStorage.getItem(`pro_${attemptId}_lang`);
        const initialLang =
          savedLang && langs.some((l) => l.toLowerCase() === savedLang.toLowerCase())
            ? langs.find((l) => l.toLowerCase() === savedLang.toLowerCase())!
            : langs[0];
        setLanguage(initialLang);

        // ── Seed per-question, per-language code buffers ──
        const status: Record<string, string> = {};
        const code: Record<string, Record<string, string>> = {};
        qs.forEach((q) => {
          status[q.id] = "NOT_STARTED";
          code[q.id] = {};
          langs.forEach((lang) => {
            const saved = localStorage.getItem(
              `pro_${attemptId}_${q.id}_${lang.toLowerCase()}`
            );
            // starterCodes may use a differently-cased key — find it.
            const starterKey = Object.keys(q.starterCodes ?? {}).find(
              (k) => k.toLowerCase() === lang.toLowerCase()
            );
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

  // 2. Autosave (debounced 2s) — saves the current question + current language buffer
  useEffect(() => {
    if (!questions.length || !language) return;
    const q = questions[currentQIndex];
    if (!q) return;
    const t = setTimeout(() => {
      localStorage.setItem(
        `pro_${attemptId}_${q.id}_${language.toLowerCase()}`,
        sourceCode[q.id]?.[language] ?? ""
      );
    }, 2000);
    return () => clearTimeout(t);
  }, [sourceCode, currentQIndex, language, attemptId, questions]);

  // 3. Timer — depends only on [securityReady]
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

  // 3b. Attach the camera stream to the video element.
  // FIX: the stream is attached here (after the <video> is mounted), not inside
  // enterAssessment where the element doesn't exist yet. Runs whenever either
  // the stream or the mounted state changes.
  useEffect(() => {
    const v = videoRef.current;
    if (v && cameraStream && v.srcObject !== cameraStream) {
      v.srcObject = cameraStream;
      v.play().catch(() => {
        /* autoplay can reject silently; muted+playsInline covers most cases */
      });
    }
  }, [cameraStream, securityReady]);

  // 3c. Re-attach screen stream to screenVideoRef when it remounts after securityReady
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
          const res = faceDetectorRef.current.detectForVideo(
            videoRef.current,
            performance.now()
          );
          const count: number = res.detections.length;
          // Only count high-confidence detections as real faces (≥0.75 score).
          // This prevents bending-down reflections/shadows from triggering false positives.
          const realFaces = res.detections.filter(
            (d: any) => (d.categories?.[0]?.score ?? d.score ?? 1) >= 0.75
          ).length;
          setFaceCount(realFaces);
          if (realFaces === 0) {
            noFaceTimerRef.current += 500;
            if (noFaceTimerRef.current >= 3000) {
              noFaceTimerRef.current = 0;
              setProctorStats((p) => ({
                ...p,
                faceMissingCount: p.faceMissingCount + 1,
              }));
              logEventWithScreenshot("FACE_MISSING", { duration_ms: 3000 });
              addToast("Face not detected!", "error");
            }
          } else if (realFaces > 1) {
            // Multiple real faces — trigger immediately, no delay needed
            noFaceTimerRef.current = 0;
            multipleFacesTimerRef.current = 0;
            setProctorStats((p) => ({
              ...p,
              multipleFacesCount: p.multipleFacesCount + 1,
            }));
            logEventWithScreenshot("MULTIPLE_FACES", { count: realFaces });
            addWarning("Multiple faces detected in camera.");
          } else {
            noFaceTimerRef.current = 0;
            multipleFacesTimerRef.current = 0;
            const box = res.detections[0]?.boundingBox;
            if (box && videoRef.current && videoRef.current.videoWidth) {
              const cx =
                (box.originX + box.width / 2) / videoRef.current.videoWidth;
              if (cx < 0.2 || cx > 0.8) {
                const now = Date.now();
                // Debounce: only screenshot once every 4s while face stays
                // off-center, otherwise this fires (and uploads) every 500ms.
                if (now - lastFaceNotCenteredAtRef.current > 4000) {
                  lastFaceNotCenteredAtRef.current = now;
                  setProctorStats((p) => ({
                    ...p,
                    faceNotCenteredCount: p.faceNotCenteredCount + 1,
                  }));
                  logEventWithScreenshot("FACE_NOT_CENTERED", { x: cx });
                }
              }
            }
          }
        } catch {
          /* ignore per-frame detection errors */
        }
      }, 500);
    }

    if (analyserRef.current) {
      micIntervalRef.current = setInterval(() => {
        if (!analyserRef.current) return;
        const buf = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(buf);
        const avg = buf.reduce((a, b) => a + b, 0) / buf.length;
        if (avg > 40) {
          setProctorStats((p) => ({
            ...p,
            noiseWarningCount: p.noiseWarningCount + 1,
          }));
          logSecurityEvent("NOISE_WARNING", { level: Math.round(avg) });
        }
      }, 1500);
    }

    return () => {
      clearInterval(faceDetectionIntervalRef.current!);
      clearInterval(micIntervalRef.current!);
    };
  }, [securityReady, addWarning, addToast, logSecurityEvent, logEventWithScreenshot]);

  // 5. Security event listeners
  useEffect(() => {
    if (!securityReady) return;
    const onVis = () => {
      if (document.hidden) {
        logEventWithScreenshot("TAB_SWITCH");
        addWarning("Tab switching is not allowed.");
      }
    };
    const onBlur = () => {
      logEventWithScreenshot("WINDOW_BLUR");
      addWarning("Window focus lost.");
    };
    const onCtx = (e: MouseEvent) => {
      e.preventDefault();
      logSecurityEvent("RIGHT_CLICK", { x: e.clientX, y: e.clientY });
    };
    const onFS = () => {
      if (!document.fullscreenElement) {
        logEventWithScreenshot("FULLSCREEN_EXIT");
        addWarning("Exiting fullscreen is not allowed.");
      }
    };
    const onCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      logEventWithScreenshot("COPY_ATTEMPT", {
        text: window.getSelection()?.toString().slice(0, 100),
      });
      addWarning("Copying is not allowed.");
    };
    const onPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      logSecurityEvent("PASTE_ATTEMPT");
      addWarning("Pasting is not allowed.");
    };
    const onKey = (e: KeyboardEvent) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key.toUpperCase()))
      ) {
        e.preventDefault();
        logEventWithScreenshot("DEVTOOLS_SHORTCUT", { key: e.key });
        addWarning("DevTools not allowed.");
      }
      if (e.ctrlKey && ["c", "v", "x", "a"].includes(e.key.toLowerCase())) {
        e.preventDefault();
        logSecurityEvent("KEYBOARD_SHORTCUT_BLOCKED", {
          key: `Ctrl+${e.key.toUpperCase()}`,
        });
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

  // ─── enterAssessment ──────────────────────────────────────────────────────

  const enterAssessment = async () => {
    setIsInitializingProctoring(true);

    // Step 1: camera + mic. Distinguish the failure reasons so we can tell the
    // user exactly what's wrong instead of a generic "camera disabled".
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 } },
        audio: true,
      });
      setCameraStream(stream);
      setProctorStats((p) => ({ ...p, cameraEnabled: true, micEnabled: true }));
      addToast("Camera and microphone connected.", "success");

      // Audio analyser for noise detection.
      const AudioCtx =
        window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      ctx.createMediaStreamSource(stream).connect(analyser);
    } catch (err: any) {
      const name = err?.name ?? "";
      let msg = "Camera/mic unavailable. Proctoring will be limited.";
      if (name === "NotAllowedError" || name === "SecurityError") {
        msg =
          "Camera/mic permission denied. Please allow access in your browser and reload.";
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        msg = "No camera or microphone found on this device.";
      } else if (name === "NotReadableError" || name === "TrackStartError") {
        msg = "Camera/mic is already in use by another application.";
      }
      logSecurityEvent("CAMERA_DISABLED", { reason: name });
      logSecurityEvent("MIC_DISABLED", { reason: name });
      addToast(msg, "error");
      // Log the failure but still allow entry — candidate is warned,
      // admin will see CAMERA_DISABLED event in the security report.
      // Do not hard-block entry: that would make the test unusable on devices
      // where the browser denies permission.
    }

    // Step 2: Screen share — ask candidate to share their entire screen.
    try {
      const screenStream = await (navigator.mediaDevices as any).getDisplayMedia({
        video: { displaySurface: "monitor" }, // prefer full screen over window/tab
        audio: false,
      });
      screenStreamRef.current = screenStream;
      setScreenShareEnabled(true);
      // Attach directly here — screenVideoRef is already mounted at this point
      // (the page has loaded before enterAssessment is called)
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = screenStream;
        await screenVideoRef.current.play().catch(() => {});
      }
      // If candidate stops sharing screen themselves, log it
      screenStream.getVideoTracks()[0]?.addEventListener("ended", () => {
        setScreenShareEnabled(false);
        logSecurityEvent("SCREEN_SHARE_STOPPED");
        addToast("Screen sharing stopped. This has been recorded.", "error");
      });
      addToast("Screen sharing active.", "success");
    } catch {
      // Screen share denied or cancelled — block entry, this is required for PRO
      logSecurityEvent("SCREEN_SHARE_DENIED");
      addToast("Screen sharing is required for PRO assessments. Please allow screen share and try again.", "error");
      setIsInitializingProctoring(false);
      return; // ← Block entry until screen is shared
    }

    // Step 3: face detector (best-effort; failure here shouldn't block entry).
    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      faceDetectorRef.current = await FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        minDetectionConfidence: 0.5,
      });
    } catch {
      addToast("Face detection could not start; basic proctoring active.", "warning");
    }

    // Step 4: fullscreen (best-effort).
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      /* ignore */
    }

    setIsInitializingProctoring(false);
    setSecurityReady(true);
  };

  // ─── Language / Run / Submit / CodeChange ─────────────────────────────────

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    localStorage.setItem(`pro_${attemptId}_lang`, newLang);

    // Eagerly seed all questions for the new language so currentCode()
    // returns the correct value in the same render cycle.
    setSourceCode((prev) => {
      const next: Record<string, Record<string, string>> = {};
      questions.forEach((q) => {
        const existing = prev[q.id]?.[newLang];
        if (existing !== undefined) {
          // Already have a buffer — keep everything as-is
          next[q.id] = { ...(prev[q.id] ?? {}) };
        } else {
          // Seed from localStorage or starter code
          const saved = localStorage.getItem(
            `pro_${attemptId}_${q.id}_${newLang.toLowerCase()}`
          );
          const starterKey = Object.keys(q.starterCodes ?? {}).find(
            (k) => k.toLowerCase() === newLang.toLowerCase()
          );
          const starter = starterKey ? q.starterCodes[starterKey] : "";
          next[q.id] = {
            ...(prev[q.id] ?? {}),
            [newLang]: saved ?? starter ?? "",
          };
        }
      });
      return next;
    });

    addToast(`Switched to ${langConfig(newLang).label}`, "info");
  };

  const handleCodeChange = (val: string | undefined) => {
    if (val === undefined || !questions[currentQIndex] || !language) return;
    const q = questions[currentQIndex];
    setSourceCode((p) => ({
      ...p,
      [q.id]: { ...(p[q.id] ?? {}), [language]: val },
    }));
    if (questionStatus[q.id] === "NOT_STARTED")
      setQuestionStatus((p) => ({ ...p, [q.id]: "ATTEMPTED" }));
  };

  const currentCode = () =>
    sourceCode[questions[currentQIndex]?.id ?? ""]?.[language] ?? "";

  const handleRunCode = async () => {
    if (!questions[currentQIndex]) return;
    const q = questions[currentQIndex];
    const code = currentCode();
    if (!code.trim()) {
      addToast("Write some code before running.", "warning");
      return;
    }
    setIsRunning(true);
    setRunResults(null);
    setActiveResultTab("result");
    try {
      const res = await fetch(`${API_BASE}/coding-submissions/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          attemptId,
          questionId: q.id,
          language: langConfig(language).apiLang,
          sourceCode: code,
        }),
      });
      if (!res.ok) throw new Error(`Run failed (${res.status})`);
      const data: ExecutionResult = await res.json();
      setRunResults(data);
      if (questionStatus[q.id] === "NOT_STARTED")
        setQuestionStatus((p) => ({ ...p, [q.id]: "ATTEMPTED" }));
      addToast(
        `Ran ${data.passedCases}/${data.totalCases} test cases`,
        data.passedCases === data.totalCases ? "success" : "info"
      );
    } catch {
      addToast("Failed to run code", "error");
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitCode = async () => {
    if (!questions[currentQIndex]) return;
    const q = questions[currentQIndex];
    const code = currentCode();
    if (!code.trim()) {
      addToast("Write some code before submitting.", "warning");
      return;
    }
    setIsSubmitting(true);
    setRunResults(null);
    setActiveResultTab("result");
    try {
      const res = await fetch(`${API_BASE}/coding-submissions/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          attemptId,
          questionId: q.id,
          language: langConfig(language).apiLang,
          sourceCode: code,
        }),
      });
      if (!res.ok) throw new Error(`Submit failed (${res.status})`);
      const data: ExecutionResult = await res.json();
      setRunResults(data);
      const st =
        data.status === "PASSED"
          ? "PASSED"
          : data.status === "PARTIAL"
          ? "PARTIAL"
          : data.passedCases > 0
          ? "PARTIAL"
          : "FAILED";
      setQuestionStatus((p) => ({ ...p, [q.id]: st }));
      addToast(
        `${data.passedCases}/${data.totalCases} test cases passed`,
        data.status === "PASSED" ? "success" : "warning"
      );
    } catch {
      addToast("Failed to submit", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Derived values ───────────────────────────────────────────────────────

  const currentQ = questions[currentQIndex];
  const publicTestCases = currentQ?.testCases.filter((t) => !t.isHidden) ?? [];
  const timerColor =
    timeLeft !== null && timeLeft < 300
      ? "#f85149"
      : timeLeft !== null && timeLeft < 600
      ? "#f59e0b"
      : "#3fb950";
  const completedCount = Object.values(questionStatus).filter(
    (s) => s === "PASSED" || s === "PARTIAL"
  ).length;

  const statusDot = (status: string) => {
    switch (status) {
      case "PASSED":
        return { bg: "#238636", label: "P" };
      case "PARTIAL":
        return { bg: "#fb8500", label: "~" };
      case "ATTEMPTED":
        return { bg: "#d29922", label: "A" };
      case "FAILED":
        return { bg: "#da3633", label: "F" };
      default:
        return { bg: "#30363d", label: "-" };
    }
  };

  // ─── Security Gate ────────────────────────────────────────────────────────

  if (!securityReady) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0d1117",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Segoe UI', sans-serif",
          color: "#c9d1d9",
        }}
      >
        <div
          style={{
            background: "#161b22",
            border: "1px solid #30363d",
            borderRadius: 12,
            padding: "48px 40px",
            maxWidth: 520,
            width: "100%",
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 16, textAlign: "center" }}>
            🎥
          </div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "#e6edf3",
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            PRO Proctored Assessment
          </h1>
          {assessment && (
            <p
              style={{
                color: "#8b949e",
                textAlign: "center",
                marginBottom: 24,
                fontSize: 14,
              }}
            >
              {assessment.codingTest.title}
            </p>
          )}

          {loadError && (
            <div
              style={{
                background: "#3d0a0a",
                border: "1px solid #f85149",
                borderRadius: 8,
                padding: "12px 16px",
                marginBottom: 20,
                color: "#ffa198",
                fontSize: 13,
                textAlign: "center",
              }}
            >
              {loadError}
            </div>
          )}

          <div
            style={{
              background: "#0d1117",
              border: "1px solid #30363d",
              borderRadius: 8,
              padding: "16px 20px",
              marginBottom: 24,
            }}
          >
            <p
              style={{
                fontSize: 13,
                color: "#8b949e",
                marginBottom: 12,
                fontWeight: 600,
              }}
            >
              Requirements:
            </p>
            {[
              "📷 Webcam access required",
              "🎙️ Microphone access required",
              "🖥️ Screen sharing required (full screen)",
              "⛶ Fullscreen mode will be enabled",
              "🚫 Tab switching is not allowed",
            ].map((r) => (
              <div
                key={r}
                style={{ fontSize: 13, color: "#c9d1d9", marginBottom: 6 }}
              >
                {r}
              </div>
            ))}
          </div>

          {assessment && (
            <div
              style={{
                display: "flex",
                gap: 12,
                marginBottom: 28,
                justifyContent: "center",
              }}
            >
              {[
                ["Duration", `${assessment.codingTest.duration} min`],
                ["Questions", String(assessment.codingTest.questions.length)],
                ["Security", "PRO 🔴"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    background: "#0d1117",
                    border: "1px solid #30363d",
                    borderRadius: 8,
                    padding: "10px 14px",
                    textAlign: "center",
                    flex: 1,
                  }}
                >
                  <div
                    style={{ fontSize: 11, color: "#8b949e", marginBottom: 4 }}
                  >
                    {label}
                  </div>
                  <div
                    style={{ fontSize: 14, fontWeight: 600, color: "#e6edf3" }}
                  >
                    {value}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={enterAssessment}
            disabled={isInitializingProctoring || !!loadError}
            style={{
              width: "100%",
              padding: "14px 0",
              background:
                isInitializingProctoring || loadError
                  ? "#30363d"
                  : "linear-gradient(135deg, #7c3aed, #6366f1)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              cursor:
                isInitializingProctoring || loadError
                  ? "not-allowed"
                  : "pointer",
              transition: "opacity 0.2s",
            }}
          >
            {isInitializingProctoring
              ? "Initializing proctoring..."
              : "Allow Camera & Start →"}
          </button>
        </div>

        {/* Toasts also render on the gate screen so permission errors are visible */}
        <ToastStack toasts={toasts} />
      </div>
    );
  }

  // ─── Main Layout ──────────────────────────────────────────────────────────

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "#0d1117",
        color: "#c9d1d9",
        fontFamily: "'Segoe UI', sans-serif",
      }}
    >
      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <div
        style={{
          height: 64,
          minHeight: 64,
          background: "#161b22",
          borderBottom: "1px solid #30363d",
          borderLeft: "4px solid #7c3aed",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          gap: 16,
        }}
      >
        {/* Left */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 18 }}>⌨️</span>
          <span style={{ fontSize: 15, fontWeight: 600, color: "#e6edf3" }}>
            {assessment?.codingTest?.title ?? "Assessment"}
          </span>
          <span
            style={{
              background: "linear-gradient(135deg, #7c3aed, #6366f1)",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 4,
              letterSpacing: 1,
            }}
          >
            PRO
          </span>
        </div>

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* Fallback-only screen capture video. The PRIMARY capture path is now
              ImageCapture.grabFrame() on the raw MediaStreamTrack (see
              captureAndUploadScreenshot / grabFrameFromStream above), which does
              NOT depend on this element at all — so the old display:none decode
              issue can't recur for browsers that support ImageCapture (all
              current Chrome/Edge). This element only matters as a fallback for
              browsers without ImageCapture (older Firefox/Safari). It's kept
              off-screen with a real (1x1) rendered size rather than display:none,
              since some engines stop decoding into display:none video elements. */}
          <video
            ref={screenVideoRef}
            autoPlay
            playsInline
            muted
            style={{
              position: "fixed",
              top: -9999,
              left: -9999,
              width: 1,
              height: 1,
              opacity: 0,
              pointerEvents: "none",
            }}
          />

          {/* Screen share status indicator */}
          <div style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "3px 9px", borderRadius: 6,
            background: screenShareEnabled ? "rgba(63,185,80,0.12)" : "rgba(248,81,73,0.12)",
            border: `1px solid ${screenShareEnabled ? "#3fb95040" : "#f8514940"}`,
            fontSize: 11, fontWeight: 600,
            color: screenShareEnabled ? "#3fb950" : "#f85149",
          }}>
            <span style={{ fontSize: 14 }}>🖥️</span>
            {screenShareEnabled ? "Screen Shared" : "No Screen Share"}
          </div>

          {/* Webcam preview — THE single video element used everywhere */}
          <div style={{ position: "relative" }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: 80,
                height: 60,
                objectFit: "cover",
                borderRadius: 6,
                border: `2px solid ${faceCount === 1 ? "#3fb950" : "#f85149"}`,
                background: "#000",
                transform: "scaleX(-1)", // mirror like a typical webcam preview
              }}
            />
          </div>

          {/* Timer */}
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 18,
              fontWeight: 700,
              color: timerColor,
              minWidth: 80,
              textAlign: "center",
            }}
          >
            {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
          </div>

          {/* Warnings badge */}
          <div
            style={{
              background: warnings > 0 ? "#da3633" : "#30363d",
              color: "#fff",
              borderRadius: 6,
              padding: "4px 10px",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            ⚠️ {warnings}/5
          </div>

          {/* Submit button */}
          <button
            onClick={() => setShowFinalSubmitModal(true)}
            style={{
              background: "#238636",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "8px 18px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Submit
          </button>
        </div>
      </div>

      {/* ── BODY ────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Question Navigator (20%) */}
        <div
          style={{
            width: "20%",
            minWidth: 180,
            background: "#161b22",
            borderRight: "1px solid #30363d",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "14px 16px",
              fontSize: 12,
              fontWeight: 700,
              color: "#8b949e",
              borderBottom: "1px solid #30363d",
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Questions
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
            {questions.map((q, i) => {
              const dot = statusDot(questionStatus[q.id] ?? "NOT_STARTED");
              const isActive = i === currentQIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQIndex(i)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    background: isActive ? "#1f2428" : "transparent",
                    border: isActive
                      ? "1px solid #58a6ff"
                      : "1px solid transparent",
                    borderRadius: 6,
                    color: "#c9d1d9",
                    cursor: "pointer",
                    textAlign: "left",
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 4,
                      background: dot.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#fff",
                      flexShrink: 0,
                    }}
                  >
                    {dot.label}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{ fontSize: 12, color: "#8b949e", marginBottom: 2 }}
                    >
                      Q{i + 1}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "#e6edf3",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {q.title}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <div
            style={{
              padding: "12px 16px",
              borderTop: "1px solid #30363d",
              fontSize: 12,
              color: "#8b949e",
            }}
          >
            {completedCount}/{questions.length} solved
          </div>
        </div>

        {/* Question Detail (35%) */}
        <div
          style={{
            width: "35%",
            background: "#0d1117",
            borderRight: "1px solid #30363d",
            overflowY: "auto",
            padding: "20px 24px",
          }}
        >
          {currentQ ? (
            <>
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#e6edf3",
                  marginBottom: 10,
                }}
              >
                {currentQ.title}
              </h2>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <span
                  style={{
                    background:
                      currentQ.difficulty === "Easy"
                        ? "#1a4731"
                        : currentQ.difficulty === "Medium"
                        ? "#3d2f0a"
                        : "#3d0a0a",
                    color:
                      currentQ.difficulty === "Easy"
                        ? "#3fb950"
                        : currentQ.difficulty === "Medium"
                        ? "#f59e0b"
                        : "#f85149",
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: 4,
                  }}
                >
                  {currentQ.difficulty}
                </span>
                <span
                  style={{
                    background: "#161b22",
                    border: "1px solid #30363d",
                    color: "#8b949e",
                    fontSize: 11,
                    padding: "2px 8px",
                    borderRadius: 4,
                  }}
                >
                  {currentQ.category}
                </span>
              </div>

              <div style={{ marginBottom: 18 }}>
                {currentQ.description.split("\n").map((line, i) => (
                  <p
                    key={i}
                    style={{
                      fontSize: 14,
                      color: "#c9d1d9",
                      lineHeight: 1.6,
                      marginBottom: 6,
                    }}
                  >
                    {line}
                  </p>
                ))}
              </div>

              {[
                ["Input Format", currentQ.inputFormat],
                ["Output Format", currentQ.outputFormat],
                ["Constraints", currentQ.constraints],
              ].map(([label, content]) => (
                <div key={label} style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#8b949e",
                      marginBottom: 6,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    {label}
                  </div>
                  <div
                    style={{
                      background: "#161b22",
                      border: "1px solid #30363d",
                      borderRadius: 6,
                      padding: "10px 12px",
                      fontFamily: "monospace",
                      fontSize: 13,
                      color: "#c9d1d9",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {content}
                  </div>
                </div>
              ))}

              {publicTestCases.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#8b949e",
                      marginBottom: 10,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    Examples
                  </div>
                  {publicTestCases.map((tc, i) => (
                    <div
                      key={tc.id}
                      style={{
                        background: "#161b22",
                        border: "1px solid #30363d",
                        borderRadius: 8,
                        padding: "12px 14px",
                        marginBottom: 10,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#58a6ff",
                          marginBottom: 8,
                        }}
                      >
                        Example {i + 1}
                      </div>
                      <div
                        style={{ fontSize: 12, color: "#8b949e", marginBottom: 4 }}
                      >
                        Input:
                      </div>
                      <pre
                        style={{
                          background: "#0d1117",
                          border: "1px solid #30363d",
                          borderRadius: 4,
                          padding: "6px 10px",
                          fontFamily: "monospace",
                          fontSize: 12,
                          color: "#c9d1d9",
                          whiteSpace: "pre-wrap",
                          marginBottom: 8,
                        }}
                      >
                        {tc.input}
                      </pre>
                      <div
                        style={{ fontSize: 12, color: "#8b949e", marginBottom: 4 }}
                      >
                        Expected Output:
                      </div>
                      <pre
                        style={{
                          background: "#0d1117",
                          border: "1px solid #30363d",
                          borderRadius: 4,
                          padding: "6px 10px",
                          fontFamily: "monospace",
                          fontSize: 12,
                          color: "#c9d1d9",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {tc.expectedOutput}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={{ color: "#8b949e", fontSize: 14 }}>
              Loading question...
            </div>
          )}
        </div>

        {/* Editor Panel (45%) */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Toolbar */}
          <div
            style={{
              height: 48,
              minHeight: 48,
              background: "#161b22",
              borderBottom: "1px solid #30363d",
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "0 14px",
            }}
          >
            {/* Language dropdown — built from the question's actual starterCodes */}
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              style={{
                background: "#0d1117",
                border: "1px solid #30363d",
                color: "#c9d1d9",
                borderRadius: 6,
                padding: "5px 10px",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {availableLangs.map((l) => (
                <option key={l} value={l}>
                  {langConfig(l).label}
                </option>
              ))}
            </select>

            <button
              onClick={handleRunCode}
              disabled={isRunning || isSubmitting}
              style={{
                background: "#21262d",
                color: "#c9d1d9",
                border: "1px solid #30363d",
                borderRadius: 6,
                padding: "5px 14px",
                fontSize: 13,
                fontWeight: 600,
                cursor: isRunning || isSubmitting ? "not-allowed" : "pointer",
                opacity: isRunning || isSubmitting ? 0.6 : 1,
              }}
            >
              {isRunning ? "Running..." : "▶ Run Code"}
            </button>

            <button
              onClick={handleSubmitCode}
              disabled={isRunning || isSubmitting}
              style={{
                background: "#238636",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "5px 14px",
                fontSize: 13,
                fontWeight: 600,
                cursor: isRunning || isSubmitting ? "not-allowed" : "pointer",
                opacity: isRunning || isSubmitting ? 0.6 : 1,
              }}
            >
              {isSubmitting ? "Submitting..." : "Submit Code"}
            </button>
          </div>

          {/* Monaco */}
          <div style={{ flex: 1, overflow: "hidden" }}>
            <MonacoEditor
              height="100%"
              language={langConfig(language).monaco}
              theme="vs-dark"
              path={`${currentQ?.id ?? "q"}.${language}`}
              value={(() => {
                const fromState = sourceCode[currentQ?.id ?? ""]?.[language];
                if (fromState !== undefined) return fromState;
                // State hasn't committed yet — fall back to localStorage or starter code
                const saved = typeof window !== "undefined"
                  ? localStorage.getItem(`pro_${attemptId}_${currentQ?.id ?? ""}_${language.toLowerCase()}`)
                  : null;
                if (saved !== null) return saved;
                const starterKey = Object.keys(currentQ?.starterCodes ?? {}).find(
                  (k) => k.toLowerCase() === language.toLowerCase()
                );
                return starterKey ? (currentQ?.starterCodes[starterKey] ?? "") : "";
              })()}
              onChange={handleCodeChange}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                scrollBeyondLastLine: false,
              }}
            />
          </div>

          {/* Results Panel */}
          <div
            style={{
              height: 260,
              minHeight: 260,
              background: "#161b22",
              borderTop: "1px solid #30363d",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Tabs */}
            <div
              style={{
                display: "flex",
                borderBottom: "1px solid #30363d",
                padding: "0 14px",
              }}
            >
              {(
                [
                  ["testcases", `Test Cases (${publicTestCases.length})`],
                  ["result", "Results"],
                ] as const
              ).map(([tab, label]) => (
                <button
                  key={tab}
                  onClick={() => setActiveResultTab(tab)}
                  style={{
                    background: "transparent",
                    border: "none",
                    borderBottom:
                      activeResultTab === tab
                        ? "2px solid #58a6ff"
                        : "2px solid transparent",
                    color: activeResultTab === tab ? "#58a6ff" : "#8b949e",
                    padding: "10px 14px",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    marginRight: 4,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>
              {activeResultTab === "testcases" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {publicTestCases.length === 0 ? (
                    <span style={{ fontSize: 13, color: "#8b949e" }}>
                      No public test cases.
                    </span>
                  ) : (
                    publicTestCases.map((tc, i) => (
                      <div
                        key={tc.id}
                        style={{
                          background: "#0d1117",
                          border: "1px solid #30363d",
                          borderRadius: 6,
                          padding: "8px 12px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: "#58a6ff",
                            marginBottom: 4,
                          }}
                        >
                          Case {i + 1}
                        </div>
                        <div style={{ display: "flex", gap: 12 }}>
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                fontSize: 10,
                                color: "#8b949e",
                                marginBottom: 2,
                              }}
                            >
                              Input
                            </div>
                            <pre
                              style={{
                                fontFamily: "monospace",
                                fontSize: 12,
                                color: "#c9d1d9",
                                margin: 0,
                                whiteSpace: "pre-wrap",
                              }}
                            >
                              {tc.input}
                            </pre>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                fontSize: 10,
                                color: "#8b949e",
                                marginBottom: 2,
                              }}
                            >
                              Expected
                            </div>
                            <pre
                              style={{
                                fontFamily: "monospace",
                                fontSize: 12,
                                color: "#c9d1d9",
                                margin: 0,
                                whiteSpace: "pre-wrap",
                              }}
                            >
                              {tc.expectedOutput}
                            </pre>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeResultTab === "result" && (
                <div>
                  {!runResults ? (
                    <span style={{ fontSize: 13, color: "#8b949e" }}>
                      Run or submit code to see results.
                    </span>
                  ) : runResults.error ||
                    ["COMPILE_ERROR", "RUNTIME_ERROR", "TIME_LIMIT_EXCEEDED"].includes(
                      runResults.status
                    ) ? (
                    <div
                      style={{
                        background: "#3d0a0a",
                        border: "1px solid #f85149",
                        borderRadius: 6,
                        padding: "12px 14px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#f85149",
                          marginBottom: 6,
                        }}
                      >
                        {runResults.status}
                      </div>
                      <pre
                        style={{
                          fontFamily: "monospace",
                          fontSize: 12,
                          color: "#ffa198",
                          whiteSpace: "pre-wrap",
                          margin: 0,
                        }}
                      >
                        {runResults.error}
                      </pre>
                    </div>
                  ) : (
                    <>
                      <div
                        style={{
                          background:
                            runResults.status === "PASSED" ? "#1a4731" : "#3d0a0a",
                          border: `1px solid ${
                            runResults.status === "PASSED" ? "#3fb950" : "#f85149"
                          }`,
                          borderRadius: 6,
                          padding: "10px 14px",
                          marginBottom: 10,
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color:
                              runResults.status === "PASSED" ? "#3fb950" : "#f85149",
                          }}
                        >
                          {runResults.status}
                        </span>
                        <span style={{ fontSize: 13, color: "#c9d1d9" }}>
                          {runResults.passedCases}/{runResults.totalCases} passed
                        </span>
                        {runResults.score !== undefined && (
                          <span style={{ fontSize: 13, color: "#58a6ff" }}>
                            Score: {runResults.score}
                          </span>
                        )}
                      </div>
                      {runResults.results?.map((r) => (
                        <div
                          key={r.testCaseNo}
                          style={{
                            background: "#0d1117",
                            border: `1px solid ${
                              r.passed ? "#3fb950" : "#f85149"
                            }`,
                            borderRadius: 6,
                            padding: "8px 12px",
                            marginBottom: 6,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: r.passed ? "#3fb950" : "#f85149",
                              marginBottom: r.passed ? 0 : 8,
                            }}
                          >
                            {r.passed ? "✓" : "✗"} Case {r.testCaseNo}
                          </div>
                          {!r.passed && (
                            <div
                              style={{
                                display: "flex",
                                gap: 12,
                                flexWrap: "wrap",
                              }}
                            >
                              {r.input !== undefined && (
                                <div style={{ flex: 1, minWidth: 120 }}>
                                  <div
                                    style={{
                                      fontSize: 10,
                                      color: "#8b949e",
                                      marginBottom: 2,
                                    }}
                                  >
                                    Input
                                  </div>
                                  <pre
                                    style={{
                                      fontFamily: "monospace",
                                      fontSize: 11,
                                      color: "#c9d1d9",
                                      margin: 0,
                                      whiteSpace: "pre-wrap",
                                    }}
                                  >
                                    {r.input}
                                  </pre>
                                </div>
                              )}
                              {r.expected !== undefined && (
                                <div style={{ flex: 1, minWidth: 120 }}>
                                  <div
                                    style={{
                                      fontSize: 10,
                                      color: "#8b949e",
                                      marginBottom: 2,
                                    }}
                                  >
                                    Expected
                                  </div>
                                  <pre
                                    style={{
                                      fontFamily: "monospace",
                                      fontSize: 11,
                                      color: "#3fb950",
                                      margin: 0,
                                      whiteSpace: "pre-wrap",
                                    }}
                                  >
                                    {r.expected}
                                  </pre>
                                </div>
                              )}
                              {r.received !== undefined && (
                                <div style={{ flex: 1, minWidth: 120 }}>
                                  <div
                                    style={{
                                      fontSize: 10,
                                      color: "#8b949e",
                                      marginBottom: 2,
                                    }}
                                  >
                                    Received
                                  </div>
                                  <pre
                                    style={{
                                      fontFamily: "monospace",
                                      fontSize: 11,
                                      color: "#f85149",
                                      margin: 0,
                                      whiteSpace: "pre-wrap",
                                    }}
                                  >
                                    {r.received}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── WARNING MODAL ────────────────────────────────────────────── */}
      {showWarningModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "#161b22",
              border: "1px solid #f85149",
              borderRadius: 12,
              padding: "32px 36px",
              maxWidth: 440,
              width: "90%",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#f85149",
                marginBottom: 10,
              }}
            >
              Security Warning
            </h2>
            <p
              style={{
                fontSize: 14,
                color: "#c9d1d9",
                marginBottom: 16,
                lineHeight: 1.5,
              }}
            >
              {warningMessage}
            </p>
            <div
              style={{
                background: "#0d1117",
                border: "1px solid #30363d",
                borderRadius: 6,
                padding: "10px 14px",
                marginBottom: 16,
                display: "flex",
                justifyContent: "center",
                gap: 20,
                fontSize: 13,
                color: "#8b949e",
              }}
            >
              <span>Warnings: {warnings}/5</span>
              <span>
                📷 Camera: {proctorStats.cameraEnabled ? "Active" : "Inactive"}
              </span>
              <span>👤 Faces: {faceCount}</span>
            </div>
            {autoSubmitCountdown !== null ? (
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#f85149",
                  marginBottom: 4,
                }}
              >
                Submitting in {autoSubmitCountdown}s...
              </div>
            ) : (
              <button
                onClick={() => setShowWarningModal(false)}
                style={{
                  background: "#21262d",
                  color: "#c9d1d9",
                  border: "1px solid #30363d",
                  borderRadius: 6,
                  padding: "10px 24px",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Acknowledge & Continue
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── FINAL SUBMIT MODAL ───────────────────────────────────────── */}
      {showFinalSubmitModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "#161b22",
              border: "1px solid #30363d",
              borderRadius: 12,
              padding: "32px 36px",
              maxWidth: 480,
              width: "90%",
            }}
          >
            <h2
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "#e6edf3",
                marginBottom: 16,
                textAlign: "center",
              }}
            >
              🚀 Submit Assessment?
            </h2>

            <div
              style={{
                display: "flex",
                gap: 16,
                marginBottom: 20,
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  background: "#0d1117",
                  border: "1px solid #30363d",
                  borderRadius: 8,
                  padding: "10px 18px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 11, color: "#8b949e", marginBottom: 4 }}>
                  Solved
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#3fb950" }}>
                  {completedCount}/{questions.length}
                </div>
              </div>
              <div
                style={{
                  background: "#0d1117",
                  border: "1px solid #30363d",
                  borderRadius: 8,
                  padding: "10px 18px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 11, color: "#8b949e", marginBottom: 4 }}>
                  Warnings
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: warnings > 0 ? "#f85149" : "#3fb950",
                  }}
                >
                  {warnings}/5
                </div>
              </div>
            </div>

            {/* Proctoring Summary */}
            <div
              style={{
                background: "#0d1117",
                border: "1px solid #30363d",
                borderRadius: 8,
                padding: "14px 16px",
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#8b949e",
                  marginBottom: 10,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Proctoring Summary
              </div>
              {[
                ["Face Missing", proctorStats.faceMissingCount],
                ["Multiple Faces", proctorStats.multipleFacesCount],
                ["Noise Warnings", proctorStats.noiseWarningCount],
                ["Face Uncentered", proctorStats.faceNotCenteredCount],
              ].map(([label, count]) => (
                <div
                  key={label as string}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 13,
                    color: "#c9d1d9",
                    marginBottom: 6,
                  }}
                >
                  <span>{label as string}:</span>
                  <span
                    style={{
                      color: (count as number) > 0 ? "#f59e0b" : "#3fb950",
                      fontWeight: 600,
                    }}
                  >
                    {count as number} times
                  </span>
                </div>
              ))}
              <div
                style={{
                  display: "flex",
                  gap: 20,
                  marginTop: 8,
                  paddingTop: 8,
                  borderTop: "1px solid #30363d",
                  fontSize: 13,
                  color: "#c9d1d9",
                }}
              >
                <span>Camera: {proctorStats.cameraEnabled ? "✅" : "❌"}</span>
                <span>Mic: {proctorStats.micEnabled ? "✅" : "❌"}</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setShowFinalSubmitModal(false)}
                disabled={isFinalSubmitting}
                style={{
                  flex: 1,
                  background: "#21262d",
                  color: "#c9d1d9",
                  border: "1px solid #30363d",
                  borderRadius: 6,
                  padding: "10px 0",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: isFinalSubmitting ? "not-allowed" : "pointer",
                  opacity: isFinalSubmitting ? 0.5 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={executeFinalSubmit}
                disabled={isFinalSubmitting}
                style={{
                  flex: 1,
                  background: isFinalSubmitting ? "#30363d" : "#238636",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  padding: "10px 0",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: isFinalSubmitting ? "not-allowed" : "pointer",
                }}
              >
                {isFinalSubmitting ? "Submitting..." : "Submit Now"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOASTS ───────────────────────────────────────────────────── */}
      <ToastStack toasts={toasts} />
    </div>
  );
}

// ─── Toast Stack (shared between gate + main views) ──────────────────────────

function ToastStack({
  toasts,
}: {
  toasts: { id: number; message: string; type: ToastType }[];
}) {
  const colors: Record<ToastType, { bg: string; border: string }> = {
    success: { bg: "#1a4731", border: "#3fb950" },
    error: { bg: "#3d0a0a", border: "#f85149" },
    warning: { bg: "#3d2f0a", border: "#f59e0b" },
    info: { bg: "#0d2436", border: "#58a6ff" },
  };
  const icons: Record<ToastType, string> = {
    success: "✓",
    error: "✕",
    warning: "⚠️",
    info: "ℹ️",
  };
  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        zIndex: 2000,
      }}
    >
      {toasts.map((t) => {
        const c = colors[t.type] ?? colors.info;
        return (
          <div
            key={t.id}
            style={{
              background: c.bg,
              border: `1px solid ${c.border}`,
              color: "#e6edf3",
              borderRadius: 8,
              padding: "10px 16px",
              fontSize: 13,
              maxWidth: 340,
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
            }}
          >
            <span style={{ flexShrink: 0 }}>{icons[t.type]}</span>
            <span>{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}