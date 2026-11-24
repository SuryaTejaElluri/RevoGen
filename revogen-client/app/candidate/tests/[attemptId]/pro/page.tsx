"use client";

// Pro coding test: everything in Basic, plus camera + mic, entire-screen share,
// face detection and evidence screenshots.
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCodingTest } from "@/components/coding-test/useCodingTest";
import { useProctoring } from "@/components/coding-test/useProctoring";
import { Gate, GateCheck, Icon, LoadingScreen, StatusScreens, Workspace } from "@/components/coding-test/ui";

const RULES = [
  { icon: "camera", text: "Your camera, microphone and entire screen are recorded for the recruiter while you work." },
  { icon: "face", text: "Stay in view of the camera. No one else should be in the room." },
  { icon: "expand", text: "The test runs in fullscreen. Leaving it, switching tabs or stopping screen share is a warning." },
  { icon: "copy", text: "Copy, paste and right-click are disabled." },
  { icon: "alert", text: "At 5 warnings, or when time runs out, your test is submitted automatically." },
  { icon: "send", text: "Any unsubmitted code is submitted for you when you finish." },
];

export default function ProCodingTestPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const [env, setEnv] = useState({ wide: true, fullscreen: true, ready: false });
  const p = useProctoring(attemptId);
  const t = useCodingTest({
    attemptId,
    mode: "PRO",
    logEvent: p.logEvent,
    finalSubmitBody: p.finalBody,
    onFinished: p.stop,
  });

  const {
    camera, screen, model, faces, notice, screenLost, cameraLost,
    requestCamera, requestScreen, loadModel, restartCamera, attachVideo,
  } = p;

  // Proctoring warnings (face, screen share, camera) go through the same warning system.
  const { setWarn } = p;
  useEffect(() => { setWarn(t.warn); }, [setWarn, t.warn]);
  const { setRunning } = p;
  useEffect(() => { setRunning(t.phase === "running"); }, [setRunning, t.phase]);

  useEffect(() => {
    const read = () => setEnv({ wide: window.innerWidth >= 1024, fullscreen: !!document.fullscreenEnabled, ready: true });
    read();
    window.addEventListener("resize", read);
    return () => window.removeEventListener("resize", read);
  }, []);

  useEffect(() => {
    if (t.phase !== "done") return;
    const done = t.questions.filter((q) => ["PASSED", "PARTIAL", "FAILED"].includes(t.statuses[q.id] ?? "")).length;
    router.replace(`/tests/thank-you?type=coding&answered=${done}&total=${t.questions.length}`);
  }, [t.phase, t.questions, t.statuses, router]);

  if (t.phase === "loading" || t.phase === "error" || t.phase === "submitted") return <StatusScreens t={t} />;
  if (t.phase === "done") return <LoadingScreen label="Test submitted. Taking you to the next page…" />;

  if (t.phase === "gate" && t.attempt) {
    const faceState = camera.state !== "ok" || model.state !== "ok" ? "idle" : faces === 1 ? "ok" : "bad";
    const checks: GateCheck[] = [
      {
        id: "screen-size", icon: "monitor", title: "Laptop or desktop screen",
        detail: env.wide ? "Your screen is large enough." : "Use a laptop or desktop, or widen this window (1024px+).",
        state: !env.ready ? "busy" : env.wide && env.fullscreen ? "ok" : "bad",
      },
      { id: "camera", icon: "camera", title: "Camera and microphone", detail: camera.detail, state: camera.state,
        action: { label: camera.state === "bad" ? "Try again" : "Allow", onClick: requestCamera } },
      { id: "screen", icon: "screen", title: "Share your entire screen", detail: screen.detail, state: screen.state,
        action: { label: screen.state === "bad" ? "Try again" : "Share screen", onClick: requestScreen } },
      { id: "model", icon: "eye", title: "Face detection", detail: model.detail, state: model.state,
        action: model.state === "bad" ? { label: "Retry", onClick: loadModel } : undefined },
      {
        id: "face", icon: "face", title: "Your face is visible",
        detail: faceState === "idle" ? "Turn on your camera first." : faces === 1 ? "We can see you." : faces === 0 ? "Move into the frame, in good light." : "Only you should be in view.",
        state: faceState as GateCheck["state"],
      },
    ];
    return (
      <Gate
        attempt={t.attempt}
        timeLeft={t.timeLeft}
        checks={checks}
        rules={RULES}
        preview={
          <div className="preview">
            <video ref={attachVideo} muted playsInline autoPlay />
            <span className={`tag chip ${camera.state === "ok" ? (faces === 1 ? "ok" : "warn") : ""}`}>
              {camera.state === "ok" ? `${faces} face${faces === 1 ? "" : "s"} detected` : "Camera off"}
            </span>
          </div>
        }
        canStart={checks.every((c) => c.state === "ok")}
        starting={starting}
        onStart={async () => {
          setStarting(true);
          if (t.timeLeft <= 0) { await t.finish("time"); return; }
          await t.start();
        }}
      />
    );
  }

  return (
    <>
      <Workspace
        t={t}
        camera={
          <>
            {notice && <span className="chip warn" role="status"><Icon name="face" size={13} />{notice}</span>}
            <span className="cam" title="Your camera">
              <video ref={attachVideo} muted playsInline autoPlay />
              <i className={cameraLost ? "off" : ""} />
            </span>
          </>
        }
      />
      {t.phase === "running" && (screenLost || cameraLost) && !t.warningMsg && (
        <div className="ct" style={{ position: "fixed", inset: 0, zIndex: 60, background: "transparent", pointerEvents: "none" }}>
          <div className="overlay" style={{ pointerEvents: "auto" }}>
            <div className="modal" role="alertdialog" aria-modal="true">
              <div className="ico warn"><Icon name={screenLost ? "screen" : "camera"} size={20} /></div>
              <h3>{screenLost ? "Share your screen again" : "Turn your camera back on"}</h3>
              <p>Pro tests need your {screenLost ? "entire screen shared" : "camera on"} the whole time. This was recorded as a warning.</p>
              <div className="acts">
                <button className="btn primary" onClick={async () => {
                  if (screenLost) await requestScreen(); else await restartCamera();
                  if (!document.fullscreenElement) await t.enterFullscreen();
                }}>
                  {screenLost ? "Share entire screen" : "Turn camera on"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
