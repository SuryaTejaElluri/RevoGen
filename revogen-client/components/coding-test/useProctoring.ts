'use client';

// Pro proctoring: camera + mic, entire-screen share, face detection, evidence screenshots.
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './lib';

// Pinned to the installed @mediapipe/tasks-vision version so the WASM files always match.
const MEDIAPIPE_VERSION = '0.10.35';
const WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`;
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite';

const MAX_SCREENSHOTS = 10;
const SCREENSHOT_EVENTS = new Set(['TAB_SWITCH', 'WINDOW_BLUR', 'FULLSCREEN_EXIT', 'COPY_ATTEMPT', 'PASTE_ATTEMPT', 'DEVTOOLS_SHORTCUT', 'MULTIPLE_FACES', 'FACE_MISSING', 'SCREEN_SHARE_STOPPED']);

export type CheckState = 'idle' | 'busy' | 'ok' | 'bad';

export interface ProctorStats {
  cameraEnabled: boolean;
  micEnabled: boolean;
  faceMissingCount: number;
  multipleFacesCount: number;
  noiseWarningCount: number;
  faceNotCenteredCount: number;
}

interface FaceDetectorLike {
  detectForVideo: (v: HTMLVideoElement, t: number) => { detections: { categories?: { score: number }[]; boundingBox?: { originX: number; width: number } }[] };
  close?: () => void;
}

export function useProctoring(attemptId: string) {
  const [camera, setCamera] = useState<{ state: CheckState; detail: string }>({ state: 'idle', detail: 'Needed so the recruiter can verify it’s you.' });
  const [screen, setScreen] = useState<{ state: CheckState; detail: string }>({ state: 'idle', detail: 'Share your entire screen, not a window or tab.' });
  const [model, setModel] = useState<{ state: CheckState; detail: string }>({ state: 'idle', detail: 'Loads automatically.' });
  const [faces, setFaces] = useState(0);
  const [running, setRunning] = useState(false);
  const [screenLost, setScreenLost] = useState(false);
  const [cameraLost, setCameraLost] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const camStream = useRef<MediaStream | null>(null);
  const scrStream = useRef<MediaStream | null>(null);
  const videoEl = useRef<HTMLVideoElement | null>(null);
  const screenVideo = useRef<HTMLVideoElement | null>(null);
  const detector = useRef<FaceDetectorLike | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const audioCtx = useRef<AudioContext | null>(null);
  const shots = useRef(0);
  const stats = useRef<ProctorStats>({ cameraEnabled: false, micEnabled: false, faceMissingCount: 0, multipleFacesCount: 0, noiseWarningCount: 0, faceNotCenteredCount: 0 });
  const warnRef = useRef<(msg: string, type: string, d?: Record<string, unknown>) => void>(() => {});

  // Attach the camera to whichever <video> is on screen (gate preview or top-bar thumbnail).
  const attachVideo = useCallback((el: HTMLVideoElement | null) => {
    videoEl.current = el;
    if (el && camStream.current && el.srcObject !== camStream.current) {
      el.srcObject = camStream.current;
      el.play().catch(() => {});
    }
  }, []);

  // ── Camera + microphone ────────────────────────────────────────────────
  const requestCamera = useCallback(async () => {
    setCamera({ state: 'busy', detail: 'Waiting for permission…' });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 } }, audio: true });
      camStream.current = stream;
      stats.current.cameraEnabled = true;
      stats.current.micEnabled = stream.getAudioTracks().length > 0;
      if (videoEl.current) { videoEl.current.srcObject = stream; videoEl.current.play().catch(() => {}); }
      try {
        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new Ctx();
        const a = ctx.createAnalyser();
        a.fftSize = 256;
        ctx.createMediaStreamSource(stream).connect(a);
        audioCtx.current = ctx;
        analyser.current = a;
      } catch { /* mic level monitoring is optional */ }
      stream.getVideoTracks()[0]?.addEventListener('ended', () => {
        setCameraLost(true);
        warnRef.current('Your camera turned off. Turn it back on to continue.', 'CAMERA_DISABLED');
      });
      setCamera({ state: 'ok', detail: 'Camera and microphone are on.' });
    } catch (err) {
      const name = (err as DOMException)?.name ?? '';
      const detail =
        name === 'NotAllowedError' || name === 'SecurityError' ? 'Permission was blocked. Allow camera and microphone in the address bar, then try again.'
          : name === 'NotFoundError' ? 'No camera or microphone was found on this device.'
            : name === 'NotReadableError' ? 'Your camera is being used by another app. Close it and try again.'
              : 'Couldn’t start your camera. Try again.';
      setCamera({ state: 'bad', detail });
    }
  }, []);

  // ── Entire-screen share ────────────────────────────────────────────────
  const requestScreen = useCallback(async () => {
    setScreen({ state: 'busy', detail: 'Choose “Entire screen” in the browser dialog…' });
    try {
      const stream: MediaStream = await (navigator.mediaDevices as MediaDevices & { getDisplayMedia: (c: unknown) => Promise<MediaStream> })
        .getDisplayMedia({ video: { displaySurface: 'monitor', frameRate: { ideal: 10 } }, audio: false });
      const track = stream.getVideoTracks()[0];
      const surface = (track?.getSettings() as MediaTrackSettings & { displaySurface?: string })?.displaySurface;
      if (surface && surface !== 'monitor') {
        stream.getTracks().forEach((t) => t.stop());
        setScreen({ state: 'bad', detail: `You shared a ${surface === 'browser' ? 'browser tab' : 'window'}. Share your entire screen instead.` });
        return;
      }
      scrStream.current = stream;
      if (!screenVideo.current) {
        const v = document.createElement('video');
        v.muted = true; v.playsInline = true;
        screenVideo.current = v;
      }
      screenVideo.current.srcObject = stream;
      screenVideo.current.play().catch(() => {});
      track?.addEventListener('ended', () => {
        scrStream.current = null;
        setScreenLost(true);
        setScreen({ state: 'bad', detail: 'Screen sharing stopped.' });
        warnRef.current('You stopped sharing your screen. Share it again to continue.', 'SCREEN_SHARE_STOPPED');
      });
      setScreenLost(false);
      setScreen({ state: 'ok', detail: 'Your entire screen is being shared.' });
    } catch {
      setScreen({ state: 'bad', detail: 'Screen sharing was cancelled. It’s required for Pro tests.' });
    }
  }, []);

  // ── Face detection model ───────────────────────────────────────────────
  const loadModel = useCallback(async () => {
    setModel({ state: 'busy', detail: 'Loading face detection…' });
    try {
      const { FaceDetector, FilesetResolver } = await import('@mediapipe/tasks-vision');
      const vision = await FilesetResolver.forVisionTasks(WASM_URL);
      const create = (delegate: 'GPU' | 'CPU') =>
        FaceDetector.createFromOptions(vision, { baseOptions: { modelAssetPath: MODEL_URL, delegate }, runningMode: 'VIDEO', minDetectionConfidence: 0.5 });
      detector.current = (await create('GPU').catch(() => create('CPU'))) as unknown as FaceDetectorLike;
      setModel({ state: 'ok', detail: 'Face detection is ready.' });
    } catch {
      setModel({ state: 'bad', detail: 'Face detection couldn’t load. Check your connection and retry.' });
    }
  }, []);

  // Start loading face detection right away (deferred one tick so it isn't a render-time state update).
  useEffect(() => { const id = setTimeout(loadModel, 0); return () => clearTimeout(id); }, [loadModel]);

  // Count faces continuously (gate preview + during the test).
  useEffect(() => {
    if (camera.state !== 'ok' || model.state !== 'ok') return;
    let missingSince = 0;
    let lastCentre = 0;
    let lastMissingLog = 0;
    const iv = setInterval(() => {
      const v = videoEl.current;
      if (!v || v.readyState < 2 || !detector.current) return;
      let count = 0;
      let box: { originX: number; width: number } | undefined;
      try {
        const res = detector.current.detectForVideo(v, performance.now());
        const real = res.detections.filter((d) => (d.categories?.[0]?.score ?? 1) >= 0.75);
        count = real.length;
        box = real[0]?.boundingBox;
      } catch { return; }
      setFaces(count);
      if (!running) return;

      const now = Date.now();
      if (count === 0) {
        if (!missingSince) missingSince = now;
        if (now - missingSince > 4000) {
          setNotice('We can’t see your face. Stay in front of the camera.');
          if (now - lastMissingLog > 15000) {
            lastMissingLog = now;
            stats.current.faceMissingCount++;
            warnRef.current('We couldn’t see your face for a few seconds.', 'FACE_MISSING', { seconds: Math.round((now - missingSince) / 1000) });
          }
        }
      } else {
        missingSince = 0;
        setNotice(null);
        if (count > 1) {
          stats.current.multipleFacesCount++;
          warnRef.current('More than one person was detected on camera.', 'MULTIPLE_FACES', { count });
        } else if (box && v.videoWidth) {
          const cx = (box.originX + box.width / 2) / v.videoWidth;
          if ((cx < 0.15 || cx > 0.85) && now - lastCentre > 15000) {
            lastCentre = now;
            stats.current.faceNotCenteredCount++;
            api(`/coding-attempts/${attemptId}/security-event`, { method: 'POST', body: JSON.stringify({ eventType: 'FACE_NOT_CENTERED', details: { x: Math.round(cx * 100) / 100 } }) }).catch(() => {});
          }
        }
      }
    }, 600);
    return () => clearInterval(iv);
  }, [attemptId, camera.state, model.state, running]);

  // Background noise (logged at most every 15 s).
  useEffect(() => {
    if (!running || !analyser.current) return;
    let last = 0;
    const iv = setInterval(() => {
      const a = analyser.current;
      if (!a) return;
      const buf = new Uint8Array(a.frequencyBinCount);
      a.getByteFrequencyData(buf);
      const avg = buf.reduce((s, x) => s + x, 0) / buf.length;
      if (avg > 45 && Date.now() - last > 15000) {
        last = Date.now();
        stats.current.noiseWarningCount++;
        api(`/coding-attempts/${attemptId}/security-event`, { method: 'POST', body: JSON.stringify({ eventType: 'NOISE_WARNING', details: { level: Math.round(avg) } }) }).catch(() => {});
      }
    }, 1500);
    return () => clearInterval(iv);
  }, [attemptId, running]);

  // ── Evidence screenshots ──────────────────────────────────────────────
  const capture = useCallback(async (eventType: string): Promise<string | null> => {
    const cam = videoEl.current;
    const scr = screenVideo.current;
    const camOk = !!cam && cam.readyState >= 2 && cam.videoWidth > 0;
    const scrOk = eventType !== 'TAB_SWITCH' && !!scr && scr.readyState >= 2 && scr.videoWidth > 0;
    if (!camOk && !scrOk) return null;
    const base = scrOk ? scr! : cam!;
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, 1280 / Math.max(base.videoWidth, base.videoHeight));
    canvas.width = Math.round(base.videoWidth * scale);
    canvas.height = Math.round(base.videoHeight * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(base, 0, 0, canvas.width, canvas.height);
    if (scrOk && camOk) {
      const w = Math.round(canvas.width * 0.22);
      const h = Math.round(w * (cam!.videoHeight / Math.max(1, cam!.videoWidth)));
      ctx.fillStyle = 'rgba(0,0,0,.6)';
      ctx.fillRect(canvas.width - w - 19, canvas.height - h - 19, w + 6, h + 6);
      ctx.drawImage(cam!, canvas.width - w - 16, canvas.height - h - 16, w, h);
    }
    const bar = Math.max(22, Math.round(canvas.height * 0.045));
    ctx.fillStyle = 'rgba(220,38,38,.88)';
    ctx.fillRect(0, 0, canvas.width, bar);
    ctx.fillStyle = '#fff';
    ctx.font = `600 ${Math.round(bar * 0.55)}px sans-serif`;
    ctx.fillText(`${eventType.replace(/_/g, ' ')}  •  ${new Date().toLocaleTimeString()}${eventType === 'TAB_SWITCH' ? '  •  webcam only (tab hidden)' : ''}`, 10, Math.round(bar * 0.72));
    let q = 0.7;
    let url = canvas.toDataURL('image/jpeg', q);
    while (url.length > 350_000 && q > 0.3) { q -= 0.15; url = canvas.toDataURL('image/jpeg', q); }
    return url;
  }, []);

  /** Record an event; for serious ones attach a screenshot (max 10 per test). Never drops the event. */
  const logEvent = useCallback((eventType: string, details: Record<string, unknown> = {}) => {
    const plain = () => api(`/coding-attempts/${attemptId}/security-event`, {
      method: 'POST', body: JSON.stringify({ eventType, details: { ...details, timestamp: new Date().toISOString() } }),
    }).catch(() => {});
    if (!SCREENSHOT_EVENTS.has(eventType) || shots.current >= MAX_SCREENSHOTS) { plain(); return; }
    const delay = eventType === 'TAB_SWITCH' || eventType === 'MULTIPLE_FACES' ? 0 : 1200;
    setTimeout(async () => {
      const imageDataUrl = await capture(eventType).catch(() => null);
      if (!imageDataUrl) { plain(); return; }
      shots.current++;
      api(`/coding-attempts/${attemptId}/security-screenshot`, {
        method: 'POST', body: JSON.stringify({ eventType, imageDataUrl, details: { ...details, timestamp: new Date().toISOString() } }), timeoutMs: 30_000,
      }).catch(plain);
    }, delay);
  }, [attemptId, capture]);

  const stop = useCallback(() => {
    setRunning(false);
    camStream.current?.getTracks().forEach((t) => t.stop());
    scrStream.current?.getTracks().forEach((t) => t.stop());
    audioCtx.current?.close().catch(() => {});
    detector.current?.close?.();
  }, []);

  useEffect(() => () => stop(), [stop]);

  return {
    camera, screen, model, faces, notice, screenLost, cameraLost,
    requestCamera, requestScreen, loadModel, attachVideo, logEvent, stop,
    setRunning, setWarn: (fn: typeof warnRef.current) => { warnRef.current = fn; },
    restartCamera: async () => { setCameraLost(false); await requestCamera(); },
    finalBody: () => ({ proctoringData: { ...stats.current } }),
  };
}
