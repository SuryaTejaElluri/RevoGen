'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:             #0a0c10;
    --surface:        #0f1117;
    --surface-2:      #161921;
    --border:         #1e2330;
    --border-hover:   #2e3550;
    --accent:         #4f8ef7;
    --accent-dim:     rgba(79,142,247,0.12);
    --accent-glow:    rgba(79,142,247,0.3);
    --success:        #22d3a5;
    --success-dim:    rgba(34,211,165,0.12);
    --success-glow:   rgba(34,211,165,0.25);
    --text-primary:   #e8eaf0;
    --text-secondary: #7a8299;
    --text-muted:     #4a5068;
    --font:           'Sora', sans-serif;
    --mono:           'JetBrains Mono', monospace;
  }

  html, body {
    height: 100%;
    background: var(--bg);
    color: var(--text-primary);
    font-family: var(--font);
  }

  /* ── Page Shell ── */
  .ty-shell {
    min-height: 100vh;
    background: var(--bg);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 24px;
    position: relative;
    overflow: hidden;
  }

  /* ── Background radial glow ── */
  .ty-shell::before {
    content: '';
    position: absolute;
    top: -120px;
    left: 50%;
    transform: translateX(-50%);
    width: 700px;
    height: 700px;
    background: radial-gradient(ellipse at center, rgba(34,211,165,0.07) 0%, transparent 70%);
    pointer-events: none;
  }

  .ty-shell::after {
    content: '';
    position: absolute;
    bottom: -100px;
    right: -100px;
    width: 500px;
    height: 500px;
    background: radial-gradient(ellipse at center, rgba(79,142,247,0.05) 0%, transparent 70%);
    pointer-events: none;
  }

  /* ── Card ── */
  .ty-card {
    position: relative;
    z-index: 1;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 24px;
    padding: 60px 56px;
    max-width: 540px;
    width: 100%;
    text-align: center;
    animation: cardReveal 0.6s cubic-bezier(0.34,1.46,0.64,1) both;
  }

  @keyframes cardReveal {
    from { opacity: 0; transform: translateY(32px) scale(0.96); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  /* ── Success Ring ── */
  .success-ring {
    position: relative;
    width: 88px;
    height: 88px;
    margin: 0 auto 32px;
    animation: ringPop 0.5s 0.3s cubic-bezier(0.34,1.56,0.64,1) both;
  }

  @keyframes ringPop {
    from { opacity: 0; transform: scale(0.5); }
    to   { opacity: 1; transform: scale(1); }
  }

  .success-ring svg {
    width: 88px;
    height: 88px;
    position: absolute;
    top: 0; left: 0;
  }

  .ring-bg {
    fill: none;
    stroke: var(--surface-2);
    stroke-width: 3;
  }

  .ring-fill {
    fill: none;
    stroke: var(--success);
    stroke-width: 3;
    stroke-linecap: round;
    stroke-dasharray: 245;
    stroke-dashoffset: 245;
    animation: ringFill 1s 0.5s ease forwards;
    filter: drop-shadow(0 0 6px var(--success-glow));
  }

  @keyframes ringFill {
    to { stroke-dashoffset: 0; }
  }

  .ring-icon {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    animation: iconPop 0.4s 1.2s cubic-bezier(0.34,1.56,0.64,1) both;
    opacity: 0;
  }

  @keyframes iconPop {
    from { opacity: 0; transform: scale(0.6); }
    to   { opacity: 1; transform: scale(1); }
  }

  /* ── Typography ── */
  .ty-title {
    font-size: 28px;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 12px;
    animation: fadeUp 0.5s 0.7s ease both;
    opacity: 0;
    letter-spacing: -0.02em;
  }

  .ty-subtitle {
    font-size: 15px;
    line-height: 1.7;
    color: var(--text-secondary);
    margin-bottom: 36px;
    animation: fadeUp 0.5s 0.85s ease both;
    opacity: 0;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── Info Chips ── */
  .info-chips {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 36px;
    animation: fadeUp 0.5s 1s ease both;
    opacity: 0;
  }

  .info-chip {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 13px 16px;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 12px;
    text-align: left;
  }

  .chip-icon {
    width: 34px;
    height: 34px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    flex-shrink: 0;
  }

  .chip-icon.green  { background: var(--success-dim); }
  .chip-icon.blue   { background: var(--accent-dim); }
  .chip-icon.amber  { background: rgba(245,158,11,0.1); }

  .chip-text { font-size: 13px; color: var(--text-secondary); line-height: 1.5; }
  .chip-text strong { color: var(--text-primary); font-weight: 600; display: block; font-size: 13px; }

  /* ── Divider ── */
  .ty-divider {
    height: 1px;
    background: var(--border);
    margin-bottom: 28px;
    animation: fadeUp 0.5s 1.1s ease both;
    opacity: 0;
  }

  /* ── Buttons ── */
  .ty-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    animation: fadeUp 0.5s 1.2s ease both;
    opacity: 0;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    padding: 14px 24px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    font-family: var(--font);
    cursor: pointer;
    border: 1.5px solid transparent;
    transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
    text-decoration: none;
    width: 100%;
  }

  .btn-primary {
    background: var(--accent);
    color: #fff;
    border-color: var(--accent);
  }

  .btn-primary:hover {
    background: #3b7de8;
    box-shadow: 0 0 0 4px var(--accent-glow);
    transform: translateY(-1px);
  }

  .btn-ghost {
    background: transparent;
    color: var(--text-secondary);
    border-color: var(--border);
  }

  .btn-ghost:hover {
    border-color: var(--border-hover);
    color: var(--text-primary);
    background: var(--surface-2);
    transform: translateY(-1px);
  }

  /* ── Timer bar ── */
  .redirect-bar {
    margin-top: 20px;
    animation: fadeUp 0.5s 1.4s ease both;
    opacity: 0;
  }

  .redirect-label {
    font-size: 12px;
    color: var(--text-muted);
    margin-bottom: 8px;
    font-family: var(--mono);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  .redirect-track {
    height: 3px;
    background: var(--surface-2);
    border-radius: 99px;
    overflow: hidden;
  }

  .redirect-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--accent), var(--success));
    border-radius: 99px;
    transition: width 1s linear;
  }

  /* ── Floating particles ── */
  .particles {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
    z-index: 0;
  }

  .particle {
    position: absolute;
    border-radius: 50%;
    animation: float linear infinite;
    opacity: 0;
  }

  @keyframes float {
    0%   { opacity: 0; transform: translateY(100vh) scale(0); }
    10%  { opacity: 0.6; }
    90%  { opacity: 0.3; }
    100% { opacity: 0; transform: translateY(-20vh) scale(1); }
  }
`;

const REDIRECT_DELAY = 10; // seconds

export default function ThankYouPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(REDIRECT_DELAY);

  useEffect(() => {
    if (countdown <= 0) {
      router.push('/dashboard');
      return;
    }
    const t = setTimeout(() => setCountdown(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, router]);

  // Inject styles
  useEffect(() => {
    const tag = document.createElement('style');
    tag.innerHTML = styles;
    document.head.appendChild(tag);
    return () => { document.head.removeChild(tag); };
  }, []);

  const progress = ((REDIRECT_DELAY - countdown) / REDIRECT_DELAY) * 100;

  return (
    <div className="ty-shell">
      {/* Floating particles */}
      <div className="particles">
        {Array.from({ length: 14 }).map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              width: `${4 + Math.random() * 6}px`,
              height: `${4 + Math.random() * 6}px`,
              background: i % 2 === 0 ? 'var(--success)' : 'var(--accent)',
              animationDuration: `${6 + Math.random() * 8}s`,
              animationDelay: `${Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      <div className="ty-card">
        {/* Animated success ring */}
        <div className="success-ring">
          <svg viewBox="0 0 88 88">
            <circle className="ring-bg" cx="44" cy="44" r="39" />
            <circle className="ring-fill" cx="44" cy="44" r="39" transform="rotate(-90 44 44)" />
          </svg>
          <div className="ring-icon">✓</div>
        </div>

        <h1 className="ty-title">Assessment Submitted!</h1>
        <p className="ty-subtitle">
          Your responses have been recorded successfully.<br />
          The recruitment team will review your assessment shortly.
        </p>

        {/* Info chips */}
        <div className="info-chips">
          <div className="info-chip">
            <div className="chip-icon green">✅</div>
            <div className="chip-text">
              <strong>Submission Confirmed</strong>
              All answers have been securely saved to our servers.
            </div>
          </div>
          <div className="info-chip">
            <div className="chip-icon blue">📋</div>
            <div className="chip-text">
              <strong>Under Review</strong>
              Your assessment is now queued for recruiter evaluation.
            </div>
          </div>
          <div className="info-chip">
            <div className="chip-icon amber">📬</div>
            <div className="chip-text">
              <strong>Expect a Response</strong>
              You'll be notified once the review is complete.
            </div>
          </div>
        </div>

        <div className="ty-divider" />

        {/* Actions */}
        <div className="ty-actions">
          <Link href="/dashboard" className="btn btn-primary">
            Go to Dashboard →
          </Link>
          <Link href="/my-results" className="btn btn-ghost">
            View My Results
          </Link>
        </div>

        {/* Auto redirect countdown */}
        <div className="redirect-bar">
          <div className="redirect-label">
            ⏳ Redirecting to dashboard in {countdown}s
          </div>
          <div className="redirect-track">
            <div className="redirect-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}