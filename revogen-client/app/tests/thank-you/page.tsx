'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/api';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg-0:           #09090B;
    --bg-1:           #0B0B0F;
    --bg-2:           #111118;
    --surface:        rgba(20, 20, 28, 0.65);
    --surface-solid:  #14141C;
    --surface-2:      rgba(255, 255, 255, 0.03);
    --border:         rgba(255, 255, 255, 0.08);
    --border-strong:  rgba(255, 255, 255, 0.14);

    --indigo:         #6366F1;
    --violet:         #8B5CF6;
    --emerald:        #10B981;
    --emerald-soft:   rgba(16, 185, 129, 0.14);
    --amber:          #F59E0B;
    --amber-soft:     rgba(245, 158, 11, 0.14);
    --rose:           #F43F5E;
    --indigo-soft:    rgba(99, 102, 241, 0.16);
    --violet-soft:    rgba(139, 92, 246, 0.14);

    --text-primary:   #F4F4F5;
    --text-secondary: #A1A1AA;
    --text-muted:     #71717A;
    --text-faint:     #52525B;

    --font:           'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
    --mono:           'JetBrains Mono', ui-monospace, monospace;

    --shadow-card:    0 1px 0 rgba(255,255,255,0.04) inset,
                      0 0 0 1px rgba(255,255,255,0.04),
                      0 20px 40px -16px rgba(0,0,0,0.6),
                      0 40px 80px -24px rgba(0,0,0,0.5);

    --grad-primary:   linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
    --grad-success:   linear-gradient(135deg, #10B981 0%, #34D399 100%);
  }

  html, body {
    min-height: 100%;
    background: var(--bg-0);
    color: var(--text-primary);
    font-family: var(--font);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    font-feature-settings: "cv11", "ss01", "ss03";
  }

  /* ── Page Shell ── */
  .ty-shell {
    min-height: 100vh;
    background:
      radial-gradient(1200px 600px at 50% -10%, rgba(99,102,241,0.12), transparent 60%),
      radial-gradient(900px 500px at 90% 110%, rgba(139,92,246,0.10), transparent 60%),
      radial-gradient(700px 400px at 5% 100%, rgba(16,185,129,0.06), transparent 60%),
      var(--bg-0);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 24px;
    position: relative;
    overflow: hidden;
  }

  /* Grid texture */
  .ty-shell::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(to right, rgba(255,255,255,0.025) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255,255,255,0.025) 1px, transparent 1px);
    background-size: 56px 56px;
    mask-image: radial-gradient(ellipse 70% 60% at 50% 40%, #000 30%, transparent 80%);
    pointer-events: none;
  }

  /* ── Top Brand Bar ── */
  .ty-brand {
    position: absolute;
    top: 28px;
    left: 50%;
    transform: translateX(-50%);
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 8px 14px 8px 10px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 999px;
    font-size: 12.5px;
    font-weight: 500;
    color: var(--text-secondary);
    backdrop-filter: blur(14px);
    z-index: 2;
    animation: fadeDown 0.5s ease both;
  }

  .ty-brand-dot {
    width: 18px; height: 18px;
    border-radius: 6px;
    background: var(--grad-primary);
    box-shadow: 0 0 12px rgba(99,102,241,0.5);
  }

  @keyframes fadeDown {
    from { opacity: 0; transform: translate(-50%, -8px); }
    to   { opacity: 1; transform: translate(-50%, 0); }
  }

  /* ── Card ── */
  .ty-card {
    position: relative;
    z-index: 1;
    background: linear-gradient(180deg, rgba(24,24,32,0.85) 0%, rgba(14,14,20,0.85) 100%);
    border: 1px solid var(--border);
    border-radius: 24px;
    padding: 56px 48px 40px;
    max-width: 540px;
    width: 100%;
    text-align: center;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    box-shadow: var(--shadow-card);
    animation: cardReveal 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  /* gradient ring */
  .ty-card::before {
    content: '';
    position: absolute;
    inset: -1px;
    border-radius: 24px;
    padding: 1px;
    background: linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0) 40%);
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
            mask-composite: exclude;
    pointer-events: none;
  }

  @keyframes cardReveal {
    from { opacity: 0; transform: translateY(24px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  /* ── Success Ring ── */
  .success-ring {
    position: relative;
    width: 88px;
    height: 88px;
    margin: 0 auto 32px;
    animation: ringPop 0.5s 0.25s cubic-bezier(0.34,1.56,0.64,1) both;
  }

  .success-ring::after {
    content: '';
    position: absolute;
    inset: -16px;
    border-radius: 50%;
    background: radial-gradient(circle, var(--emerald-soft), transparent 65%);
    z-index: -1;
  }

  @keyframes ringPop {
    from { opacity: 0; transform: scale(0.6); }
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
    stroke: rgba(255,255,255,0.06);
    stroke-width: 3;
  }

  .ring-fill {
    fill: none;
    stroke: url(#emeraldGrad);
    stroke-width: 3;
    stroke-linecap: round;
    stroke-dasharray: 267;
    stroke-dashoffset: 267;
    animation: ringFill 1s 0.5s ease forwards;
    filter: drop-shadow(0 0 10px rgba(16,185,129,0.55));
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
    animation: iconPop 0.4s 1.1s cubic-bezier(0.34,1.56,0.64,1) both;
    opacity: 0;
    color: #fff;
  }

  @keyframes iconPop {
    from { opacity: 0; transform: scale(0.5); }
    to   { opacity: 1; transform: scale(1); }
  }

  /* ── Status pill ── */
  .ty-status {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    border-radius: 999px;
    background: var(--emerald-soft);
    border: 1px solid rgba(16,185,129,0.25);
    color: #6EE7B7;
    font-size: 11.5px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    margin-bottom: 18px;
    animation: fadeUp 0.5s 0.6s ease both;
    opacity: 0;
  }

  .ty-status .dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--emerald);
    box-shadow: 0 0 0 3px rgba(16,185,129,0.18);
    animation: pulseDot 2s ease-in-out infinite;
  }

  @keyframes pulseDot {
    0%, 100% { box-shadow: 0 0 0 3px rgba(16,185,129,0.18); }
    50%      { box-shadow: 0 0 0 6px rgba(16,185,129,0.05); }
  }

  /* ── Typography ── */
  .ty-title {
    font-size: 30px;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 12px;
    animation: fadeUp 0.5s 0.7s ease both;
    opacity: 0;
    letter-spacing: -0.028em;
    line-height: 1.18;
    background: linear-gradient(180deg, #FFFFFF 0%, #B4B4C0 120%);
    -webkit-background-clip: text;
            background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .ty-subtitle {
    font-size: 15px;
    line-height: 1.65;
    color: var(--text-secondary);
    margin-bottom: 36px;
    animation: fadeUp 0.5s 0.8s ease both;
    opacity: 0;
    max-width: 420px;
    margin-left: auto;
    margin-right: auto;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── Info Chips ── */
  .info-chips {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 32px;
    animation: fadeUp 0.5s 0.95s ease both;
    opacity: 0;
  }

  .info-chip {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 16px;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 14px;
    text-align: left;
    transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
  }

  .info-chip:hover {
    border-color: var(--border-strong);
    background: rgba(255,255,255,0.04);
    transform: translateY(-1px);
  }

  .chip-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border: 1px solid transparent;
  }

  .chip-icon.green  {
    background: var(--emerald-soft);
    border-color: rgba(16,185,129,0.22);
    color: #34D399;
  }
  .chip-icon.blue   {
    background: var(--indigo-soft);
    border-color: rgba(99,102,241,0.25);
    color: #A5B4FC;
  }
  .chip-icon.amber  {
    background: var(--amber-soft);
    border-color: rgba(245,158,11,0.22);
    color: #FCD34D;
  }

  .chip-text {
    font-size: 13px;
    color: var(--text-secondary);
    line-height: 1.5;
  }

  .chip-text strong {
    color: var(--text-primary);
    font-weight: 600;
    display: block;
    font-size: 13.5px;
    margin-bottom: 2px;
    letter-spacing: -0.005em;
  }

  /* ── Divider ── */
  .ty-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--border), transparent);
    margin-bottom: 24px;
    animation: fadeUp 0.5s 1.05s ease both;
    opacity: 0;
  }

  /* ── Buttons ── */
  .ty-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    animation: fadeUp 0.5s 1.15s ease both;
    opacity: 0;
  }

  .btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 13px 22px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    font-family: var(--font);
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
    text-decoration: none;
    width: 100%;
    letter-spacing: -0.005em;
    outline: none;
  }

  .btn:focus-visible {
    box-shadow: 0 0 0 2px var(--bg-0), 0 0 0 4px var(--indigo);
  }

  .btn-primary {
    background: var(--grad-primary);
    color: #fff;
    box-shadow:
      0 1px 0 rgba(255,255,255,0.18) inset,
      0 8px 24px -8px rgba(99,102,241,0.55);
  }

  .btn-primary:hover {
    transform: translateY(-1px);
    box-shadow:
      0 1px 0 rgba(255,255,255,0.22) inset,
      0 10px 28px -6px rgba(99,102,241,0.7);
  }

  .btn-primary:active {
    transform: translateY(0);
    filter: brightness(0.96);
  }

  .btn-ghost {
    background: var(--surface-2);
    color: var(--text-primary);
    border-color: var(--border);
  }

  .btn-ghost:hover {
    border-color: var(--border-strong);
    background: rgba(255,255,255,0.05);
    transform: translateY(-1px);
  }

  .btn-ghost:active { transform: translateY(0); }

  .btn .arrow {
    transition: transform 0.2s ease;
  }
  .btn-primary:hover .arrow { transform: translateX(3px); }

  /* ── Timer bar ── */
  .redirect-bar {
    margin-top: 24px;
    animation: fadeUp 0.5s 1.3s ease both;
    opacity: 0;
  }

  .redirect-label {
    font-size: 11.5px;
    color: var(--text-muted);
    margin-bottom: 10px;
    font-family: var(--mono);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    letter-spacing: 0.02em;
  }

  .redirect-label .spinner {
    width: 11px; height: 11px;
    border-radius: 50%;
    border: 1.5px solid rgba(255,255,255,0.12);
    border-top-color: var(--indigo);
    animation: spin 0.9s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  .redirect-track {
    height: 3px;
    background: rgba(255,255,255,0.06);
    border-radius: 99px;
    overflow: hidden;
    position: relative;
  }

  .redirect-fill {
    height: 100%;
    background: var(--grad-primary);
    border-radius: 99px;
    transition: width 1s linear;
    box-shadow: 0 0 12px rgba(99,102,241,0.6);
  }

  /* ── Footer hint ── */
  .ty-foothint {
    margin-top: 28px;
    font-size: 12px;
    color: var(--text-faint);
    animation: fadeUp 0.5s 1.45s ease both;
    opacity: 0;
  }

  .ty-foothint a {
    color: var(--text-secondary);
    text-decoration: none;
    border-bottom: 1px dashed var(--border-strong);
    transition: color 0.2s ease;
  }

  .ty-foothint a:hover { color: var(--text-primary); }

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
    filter: blur(0.5px);
  }

  @keyframes float {
    0%   { opacity: 0; transform: translateY(100vh) scale(0); }
    10%  { opacity: 0.5; }
    90%  { opacity: 0.2; }
    100% { opacity: 0; transform: translateY(-20vh) scale(1); }
  }

  /* ── Responsive ── */
  @media (max-width: 600px) {
    .ty-shell {
      padding: 88px 16px 48px;
      justify-content: flex-start;
    }

    .ty-card {
      padding: 40px 24px 32px;
      border-radius: 20px;
    }

    .ty-title { font-size: 24px; }

    .ty-subtitle {
      font-size: 14px;
      margin-bottom: 28px;
    }

    .success-ring {
      width: 76px;
      height: 76px;
      margin-bottom: 24px;
    }

    .success-ring svg { width: 76px; height: 76px; }
  }

  @media (max-width: 380px) {
    .ty-card { padding: 36px 20px 28px; }
    .chip-icon { width: 32px; height: 32px; }
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.001ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.001ms !important;
    }
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
              width: `${3 + Math.random() * 5}px`,
              height: `${3 + Math.random() * 5}px`,
              background: i % 3 === 0
                ? 'rgba(16,185,129,0.7)'
                : i % 3 === 1
                ? 'rgba(99,102,241,0.7)'
                : 'rgba(139,92,246,0.7)',
              animationDuration: `${7 + Math.random() * 9}s`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Top brand pill */}
      <div className="ty-brand">
        <span className="ty-brand-dot" />
        <span>Assessment Portal</span>
      </div>

      <div className="ty-card">
        {/* Animated success ring */}
        <div className="success-ring">
          <svg viewBox="0 0 96 96">
            <defs>
              <linearGradient id="emeraldGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#34D399" />
              </linearGradient>
            </defs>
            <circle className="ring-bg" cx="48" cy="48" r="42.5" />
            <circle className="ring-fill" cx="48" cy="48" r="42.5" transform="rotate(-90 48 48)" />
          </svg>
          <div className="ring-icon">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
              <path d="M5 12.5l4.5 4.5L19 7.5"
                stroke="currentColor" strokeWidth="2.4"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <div className="ty-status">
          <span className="dot" />
          Submission Received
        </div>

        <h1 className="ty-title">Assessment Submitted</h1>
        <p className="ty-subtitle">
          Your responses have been recorded successfully. The recruitment team
          will review your assessment shortly.
        </p>

        {/* Info chips */}
        <div className="info-chips">
          <div className="info-chip">
            <div className="chip-icon green">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor"
                  strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="chip-text">
              <strong>Submission Confirmed</strong>
              All answers have been securely saved to our servers.
            </div>
          </div>
          <div className="info-chip">
            <div className="chip-icon blue">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="4" y="3.5" width="16" height="17" rx="2.5"
                  stroke="currentColor" strokeWidth="1.8" />
                <path d="M8 9h8M8 13h8M8 17h5" stroke="currentColor"
                  strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <div className="chip-text">
              <strong>Under Review</strong>
              Your assessment is now queued for recruiter evaluation.
            </div>
          </div>
          <div className="info-chip">
            <div className="chip-icon amber">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M3 7.5l9 6 9-6M4 6h16a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V7a1 1 0 011-1z"
                  stroke="currentColor" strokeWidth="1.8"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="chip-text">
              <strong>Expect a Response</strong>
              You&apos;ll be notified once the review is complete.
            </div>
          </div>
        </div>

        <div className="ty-divider" />

        {/* Actions */}
        <div className="ty-actions">
          <Link href="/dashboard" className="btn btn-primary">
            Go to Dashboard
            <svg className="arrow" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <Link href="/my-results" className="btn btn-ghost">
            View My Results
          </Link>
        </div>

        {/* Auto redirect countdown */}
        <div className="redirect-bar">
          <div className="redirect-label">
            <span className="spinner" />
            Redirecting to dashboard in {countdown}s
          </div>
          <div className="redirect-track">
            <div className="redirect-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="ty-foothint">
          Need help? <a href="/support">Contact support</a>
        </div>
      </div>
    </div>
  );
}
