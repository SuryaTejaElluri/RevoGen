"use client";

// Basic coding test: fullscreen + tab/focus/copy monitoring. No camera.
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCodingTest } from "@/components/coding-test/useCodingTest";
import { Gate, GateCheck, StatusScreens, Workspace, LoadingScreen } from "@/components/coding-test/ui";

const RULES = [
  { icon: "clock", text: "The timer keeps running even if you close or refresh the page." },
  { icon: "expand", text: "The test runs in fullscreen. Leaving fullscreen or switching tabs is recorded as a warning." },
  { icon: "copy", text: "Copy, paste and right-click are disabled." },
  { icon: "alert", text: "At 5 warnings, or when time runs out, your test is submitted automatically." },
  { icon: "send", text: "Submit each question to score it. Any unsubmitted code is submitted for you when you finish." },
];

function useEnvironment() {
  const [env, setEnv] = useState({ wide: true, fullscreen: true, online: true, ready: false });
  useEffect(() => {
    const read = () => setEnv({
      wide: window.innerWidth >= 1024,
      fullscreen: !!document.fullscreenEnabled,
      online: navigator.onLine,
      ready: true,
    });
    read();
    window.addEventListener("resize", read);
    window.addEventListener("online", read);
    window.addEventListener("offline", read);
    return () => {
      window.removeEventListener("resize", read);
      window.removeEventListener("online", read);
      window.removeEventListener("offline", read);
    };
  }, []);
  return env;
}

export default function BasicCodingTestPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const router = useRouter();
  const env = useEnvironment();
  const [starting, setStarting] = useState(false);
  const t = useCodingTest({ attemptId, mode: "BASIC" });

  useEffect(() => {
    if (t.phase !== "done") return;
    const done = t.questions.filter((q) => ["PASSED", "PARTIAL", "FAILED"].includes(t.statuses[q.id] ?? "")).length;
    router.replace(`/tests/thank-you?type=coding&answered=${done}&total=${t.questions.length}`);
  }, [t.phase, t.questions, t.statuses, router]);

  if (t.phase === "loading" || t.phase === "error" || t.phase === "submitted") return <StatusScreens t={t} />;
  if (t.phase === "done") return <LoadingScreen label="Test submitted. Taking you to the next page…" />;

  if (t.phase === "gate" && t.attempt) {
    const checks: GateCheck[] = [
      {
        id: "screen", icon: "monitor", title: "Laptop or desktop screen",
        detail: env.wide ? "Your screen is large enough." : "Use a laptop or desktop, or make this window wider (at least 1024px).",
        state: !env.ready ? "busy" : env.wide ? "ok" : "bad",
      },
      {
        id: "fullscreen", icon: "expand", title: "Fullscreen supported",
        detail: env.fullscreen ? "We’ll switch to fullscreen when you start." : "This browser can’t go fullscreen. Use Chrome, Edge or Firefox.",
        state: !env.ready ? "busy" : env.fullscreen ? "ok" : "bad",
      },
      {
        id: "online", icon: "send", title: "Connected to the internet",
        detail: env.online ? "Your code runs on our servers." : "You’re offline. Reconnect to start.",
        state: !env.ready ? "busy" : env.online ? "ok" : "bad",
      },
    ];
    return (
      <Gate
        attempt={t.attempt}
        timeLeft={t.timeLeft}
        checks={checks}
        rules={RULES}
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

  return <Workspace t={t} />;
}
