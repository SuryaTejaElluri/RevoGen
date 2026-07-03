'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_BASE_URL } from '@/lib/api';

/* ─── Types ─────────────────────────────────────────────── */
type Stage = 'loading' | 'success' | 'error';

/* ─── Icons (inline SVG — no extra deps) ────────────────── */
const CheckIcon = () => (
  <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
    <path
      d="M10 21.5l8 8 14-14"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ strokeDasharray: 60, strokeDashoffset: 0, animation: 'drawCheck .55s ease .35s both' }}
    />
  </svg>
);

const XIcon = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
    <path d="M10 10l16 16M26 10L10 26" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
  </svg>
);

const MailIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="3" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

/* ─── Progress dots ──────────────────────────────────────── */
function ProgressDots() {
  return (
    <div className="flex items-center gap-2 justify-center mt-2">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="block h-2 w-2 rounded-full bg-blue-400"
          style={{ animation: `dotBounce .9s ease-in-out ${i * .2}s infinite` }}
        />
      ))}
    </div>
  );
}

/* ─── Particle emitter (success confetti-like) ───────────── */
function Sparkles() {
  const items = [
    { top: '12%', left: '8%', delay: '0s', size: 6, color: '#34d399' },
    { top: '8%', left: '88%', delay: '.15s', size: 8, color: '#60a5fa' },
    { top: '80%', left: '6%', delay: '.3s', size: 5, color: '#a78bfa' },
    { top: '75%', left: '90%', delay: '.1s', size: 7, color: '#f472b6' },
    { top: '20%', left: '50%', delay: '.25s', size: 5, color: '#fbbf24' },
    { top: '60%', left: '30%', delay: '.4s', size: 6, color: '#34d399' },
    { top: '35%', left: '78%', delay: '.05s', size: 5, color: '#60a5fa' },
  ];
  return (
    <>
      {items.map((p, i) => (
        <span
          key={i}
          className="pointer-events-none absolute rounded-full"
          style={{
            top: p.top,
            left: p.left,
            width: p.size,
            height: p.size,
            background: p.color,
            animation: `sparkleFloat 3s ease-in-out ${p.delay} infinite`,
            opacity: .7,
          }}
        />
      ))}
    </>
  );
}

/* ─── Main content ───────────────────────────────────────── */
function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [stage, setStage] = useState<Stage>('loading');
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStage('error');
      setMessage('No verification token found. Please use the link from your email.');
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/verify-email?token=${token}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.message || 'Verification failed');

        setStage('success');
        setMessage('Your email has been verified successfully.');
      } catch (err: any) {
        setStage('error');
        setMessage(err.message || 'Verification failed. The link may have expired.');
      }
    };

    verify();
  }, [searchParams]);

  // Auto-redirect countdown on success
  useEffect(() => {
    if (stage !== 'success') return;
    if (countdown <= 0) { router.push('/login'); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [stage, countdown, router]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        .ve-root { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; font-family: 'Inter', system-ui, sans-serif; background: #020817; position: relative; overflow: hidden; }

        /* Ambient blobs */
        .ve-blob { position: absolute; border-radius: 50%; filter: blur(100px); pointer-events: none; }
        .ve-blob-1 { width: 500px; height: 500px; top: -120px; left: -100px; background: radial-gradient(circle, rgba(59,130,246,.18) 0%, transparent 70%); }
        .ve-blob-2 { width: 400px; height: 400px; bottom: -80px; right: -80px; background: radial-gradient(circle, rgba(139,92,246,.12) 0%, transparent 70%); }
        .ve-blob-3 { width: 300px; height: 300px; top: 40%; left: 50%; transform: translate(-50%,-50%); background: radial-gradient(circle, rgba(16,185,129,.06) 0%, transparent 70%); }

        /* Grid overlay */
        .ve-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px); background-size: 44px 44px; pointer-events: none; }

        /* Card */
        .ve-card { position: relative; width: 100%; max-width: 480px; border-radius: 28px; border: 1px solid rgba(255,255,255,.08); background: linear-gradient(160deg, rgba(15,23,42,.95) 0%, rgba(9,14,28,.98) 100%); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); box-shadow: 0 40px 100px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.05) inset; padding: 48px 40px 40px; text-align: center; overflow: hidden; }
        @media (max-width: 520px) { .ve-card { padding: 36px 24px 32px; border-radius: 20px; } }

        /* Top shimmer line */
        .ve-shimmer { position: absolute; inset-x-0; top: 0; height: 1px; }
        .ve-shimmer-success { background: linear-gradient(90deg, transparent, rgba(52,211,153,.7), transparent); }
        .ve-shimmer-error   { background: linear-gradient(90deg, transparent, rgba(248,113,113,.7), transparent); }
        .ve-shimmer-loading { background: linear-gradient(90deg, transparent, rgba(96,165,250,.7), transparent); animation: shimmerSlide 2s linear infinite; }
        @keyframes shimmerSlide { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }

        /* Brand */
        .ve-brand { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 36px; }
        .ve-brand-dot { width: 8px; height: 8px; background: #0e9f6e; border-radius: 50%; animation: pulseDot 2.2s ease-in-out infinite; }
        @keyframes pulseDot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.75)} }
        .ve-brand-name { font-size: 1.1rem; font-weight: 700; letter-spacing: -.03em; color: #f1f5f9; }

        /* Icon ring */
        .ve-icon-ring { width: 96px; height: 96px; border-radius: 50%; margin: 0 auto 28px; display: flex; align-items: center; justify-content: center; position: relative; }
        .ve-icon-ring-success { background: radial-gradient(circle, rgba(52,211,153,.2) 0%, rgba(16,185,129,.06) 70%); color: #34d399; box-shadow: 0 0 0 1px rgba(52,211,153,.3), 0 0 40px rgba(52,211,153,.15); animation: iconPop .45s cubic-bezier(.34,1.56,.64,1) both; }
        .ve-icon-ring-error   { background: radial-gradient(circle, rgba(248,113,113,.2) 0%, rgba(239,68,68,.06) 70%); color: #f87171; box-shadow: 0 0 0 1px rgba(248,113,113,.3), 0 0 40px rgba(248,113,113,.15); animation: iconPop .45s cubic-bezier(.34,1.56,.64,1) both; }
        .ve-icon-ring-loading { background: radial-gradient(circle, rgba(96,165,250,.15) 0%, transparent 70%); color: #60a5fa; box-shadow: 0 0 0 1px rgba(96,165,250,.2); }
        @keyframes iconPop { from { opacity: 0; transform: scale(.5); } to { opacity: 1; transform: scale(1); } }

        /* Ripple behind icon */
        .ve-ripple { position: absolute; inset: -12px; border-radius: 50%; border: 1px solid; animation: rippleOut 2s ease-out infinite; }
        .ve-ripple-success { border-color: rgba(52,211,153,.2); }
        .ve-ripple-error   { border-color: rgba(248,113,113,.15); }
        .ve-ripple-2 { animation-delay: .6s; }
        @keyframes rippleOut { 0%{transform:scale(1);opacity:1} 100%{transform:scale(1.6);opacity:0} }

        /* Loading spinner ring */
        .ve-spinner { width: 48px; height: 48px; border-radius: 50%; border: 3px solid rgba(96,165,250,.15); border-top-color: #60a5fa; animation: spinRing .8s linear infinite; }
        @keyframes spinRing { to { transform: rotate(360deg); } }

        /* Text */
        .ve-title { font-size: 1.65rem; font-weight: 800; letter-spacing: -.04em; line-height: 1.15; margin-bottom: 10px; }
        .ve-title-success { color: #f1f5f9; }
        .ve-title-error   { color: #f1f5f9; }
        .ve-title-loading { color: #94a3b8; }
        .ve-sub { font-size: .9rem; color: #64748b; line-height: 1.65; margin-bottom: 28px; }

        /* Countdown ring */
        .ve-countdown-wrap { display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 28px; }
        .ve-countdown-ring { position: relative; width: 44px; height: 44px; }
        .ve-countdown-ring svg { transform: rotate(-90deg); }
        .ve-countdown-num { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: .9rem; font-weight: 700; color: #34d399; }
        .ve-countdown-text { font-size: .82rem; color: #475569; }

        /* Steps strip */
        .ve-steps { display: flex; align-items: center; justify-content: center; gap: 0; margin-bottom: 32px; }
        .ve-step { display: flex; align-items: center; gap: 0; }
        .ve-step-circle { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: .7rem; font-weight: 700; }
        .ve-step-circle.done { background: rgba(52,211,153,.15); color: #34d399; border: 1px solid rgba(52,211,153,.3); }
        .ve-step-circle.active { background: rgba(96,165,250,.2); color: #60a5fa; border: 1px solid rgba(96,165,250,.4); animation: stepPulse 1.5s ease-in-out infinite; }
        .ve-step-circle.idle { background: rgba(255,255,255,.03); color: #334155; border: 1px solid rgba(255,255,255,.06); }
        @keyframes stepPulse { 0%,100%{box-shadow:0 0 0 0 rgba(96,165,250,.3)} 50%{box-shadow:0 0 0 5px rgba(96,165,250,0)} }
        .ve-step-line { width: 48px; height: 1px; }
        .ve-step-line.done { background: linear-gradient(90deg, rgba(52,211,153,.5), rgba(52,211,153,.2)); }
        .ve-step-line.idle { background: rgba(255,255,255,.05); }

        /* Buttons */
        .ve-btn-primary { display: inline-flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 13px 20px; border: none; border-radius: 12px; font-family: 'Inter', sans-serif; font-size: .9rem; font-weight: 600; cursor: pointer; transition: all .22s; letter-spacing: -.01em; }
        .ve-btn-success { background: linear-gradient(135deg, #059669 0%, #0e9f6e 100%); color: #fff; box-shadow: 0 4px 24px rgba(16,185,129,.25); }
        .ve-btn-success:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(16,185,129,.35); }
        .ve-btn-error { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #fff; box-shadow: 0 4px 24px rgba(59,130,246,.25); }
        .ve-btn-error:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(59,130,246,.35); }
        .ve-btn-ghost { display: inline-flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 12px 20px; border: 1px solid rgba(255,255,255,.08); border-radius: 12px; background: rgba(255,255,255,.03); font-family: 'Inter', sans-serif; font-size: .9rem; font-weight: 500; color: #64748b; cursor: pointer; transition: all .22s; margin-top: 10px; }
        .ve-btn-ghost:hover { border-color: rgba(255,255,255,.14); color: #94a3b8; background: rgba(255,255,255,.06); }

        /* Info card */
        .ve-info-card { display: flex; align-items: flex-start; gap: 12px; border-radius: 14px; border: 1px solid rgba(96,165,250,.15); background: rgba(96,165,250,.05); padding: 14px 16px; text-align: left; margin-bottom: 24px; }
        .ve-info-icon { width: 32px; height: 32px; border-radius: 8px; background: rgba(96,165,250,.1); display: flex; align-items: center; justify-content: center; color: #60a5fa; flex-shrink: 0; }
        .ve-info-text { font-size: .82rem; color: #64748b; line-height: 1.6; }
        .ve-info-text strong { color: #94a3b8; font-weight: 600; }

        /* Error detail card */
        .ve-error-card { border-radius: 14px; border: 1px solid rgba(248,113,113,.15); background: rgba(248,113,113,.05); padding: 14px 16px; margin-bottom: 24px; text-align: left; }
        .ve-error-label { font-size: .72rem; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: #f87171; margin-bottom: 5px; }
        .ve-error-msg { font-size: .84rem; color: #94a3b8; line-height: 1.55; }

        /* Divider */
        .ve-divider { position: relative; text-align: center; margin: 16px 0; }
        .ve-divider::before { content: ''; position: absolute; inset-y-1/2; left: 0; right: 0; top: 50%; height: 1px; background: rgba(255,255,255,.06); }
        .ve-divider span { position: relative; background: #0a0e1a; padding: 0 10px; font-size: .75rem; color: #334155; }

        /* Animations */
        @keyframes dotBounce { 0%,80%,100%{transform:scale(1)} 40%{transform:scale(1.5)} }
        @keyframes drawCheck { from{stroke-dashoffset:60} to{stroke-dashoffset:0} }
        @keyframes sparkleFloat { 0%,100%{transform:translateY(0) scale(1);opacity:.7} 50%{transform:translateY(-14px) scale(1.3);opacity:1} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .ve-animate { animation: fadeUp .4s ease both; }
        .ve-animate-1 { animation-delay: .1s; }
        .ve-animate-2 { animation-delay: .2s; }
        .ve-animate-3 { animation-delay: .3s; }
        .ve-animate-4 { animation-delay: .4s; }
      `}</style>

      <div className="ve-root">
        <div className="ve-blob ve-blob-1" />
        <div className="ve-blob ve-blob-2" />
        <div className="ve-blob ve-blob-3" />
        <div className="ve-grid" />

        <div className="ve-card">
          {/* Top shimmer */}
          <div className={`ve-shimmer ${stage === 'success' ? 've-shimmer-success' : stage === 'error' ? 've-shimmer-error' : 've-shimmer-loading'}`} />

          {/* Confetti sparks on success */}
          {stage === 'success' && <Sparkles />}

          {/* Brand */}
          <div className="ve-brand">
            <span className="ve-brand-dot" />
            <span className="ve-brand-name">RevoGen</span>
          </div>

          {/* Steps progress */}
          <div className="ve-steps ve-animate">
            {(['Register', 'Verify', 'Login'] as const).map((label, i) => {
              const isDone = stage === 'success' ? i <= 1 : i === 0;
              const isActive = stage === 'loading' && i === 1;
              const cls = isDone ? 'done' : isActive ? 'active' : 'idle';
              return (
                <div key={label} className="ve-step">
                  <div className={`ve-step-circle ${cls}`}>
                    {isDone ? '✓' : i + 1}
                  </div>
                  {i < 2 && <div className={`ve-step-line ${isDone ? 'done' : 'idle'}`} />}
                </div>
              );
            })}
          </div>

          {/* ── LOADING ── */}
          {stage === 'loading' && (
            <div className="ve-animate">
              <div className="ve-icon-ring ve-icon-ring-loading">
                <div className="ve-spinner" />
              </div>
              <h1 className="ve-title ve-title-loading">Verifying your email…</h1>
              <p className="ve-sub">Hang tight, we're confirming your address.</p>
              <ProgressDots />
            </div>
          )}

          {/* ── SUCCESS ── */}
          {stage === 'success' && (
            <>
              <div className="ve-icon-ring ve-icon-ring-success ve-animate">
                <div className="ve-ripple ve-ripple-success" />
                <div className="ve-ripple ve-ripple-success ve-ripple-2" />
                <CheckIcon />
              </div>

              <h1 className="ve-title ve-title-success ve-animate ve-animate-1">
                Email verified!
              </h1>
              <p className="ve-sub ve-animate ve-animate-2">{message}</p>

              {/* Countdown */}
              <div className="ve-countdown-wrap ve-animate ve-animate-2">
                <div className="ve-countdown-ring">
                  <svg width="44" height="44" viewBox="0 0 44 44">
                    <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(52,211,153,.12)" strokeWidth="3" />
                    <circle
                      cx="22" cy="22" r="18" fill="none" stroke="#34d399" strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 18}`}
                      strokeDashoffset={`${2 * Math.PI * 18 * (1 - countdown / 5)}`}
                      style={{ transition: 'stroke-dashoffset 1s linear' }}
                    />
                  </svg>
                  <span className="ve-countdown-num">{countdown}</span>
                </div>
                <span className="ve-countdown-text">Redirecting to login in {countdown}s…</span>
              </div>

              <div className="ve-info-card ve-animate ve-animate-3">
                <div className="ve-info-icon"><MailIcon /></div>
                <p className="ve-info-text">
                  <strong>You're all set.</strong> Your account is now fully activated. Log in to access your dashboard and start using RevoGen.
                </p>
              </div>

              <button className="ve-btn-primary ve-btn-success ve-animate ve-animate-4" onClick={() => router.push('/login')}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 5l4 3-4 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Go to Login
              </button>
            </>
          )}

          {/* ── ERROR ── */}
          {stage === 'error' && (
            <>
              <div className="ve-icon-ring ve-icon-ring-error ve-animate">
                <div className="ve-ripple ve-ripple-error" />
                <XIcon />
              </div>

              <h1 className="ve-title ve-title-error ve-animate ve-animate-1">
                Verification failed
              </h1>
              <p className="ve-sub ve-animate ve-animate-2">
                We couldn't verify your email address. The link may have expired or already been used.
              </p>

              <div className="ve-error-card ve-animate ve-animate-2">
                <div className="ve-error-label">Error detail</div>
                <div className="ve-error-msg">{message}</div>
              </div>

              <button className="ve-btn-primary ve-btn-error ve-animate ve-animate-3" onClick={() => router.push('/login')}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 5l4 3-4 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Go to Login
              </button>

              <div className="ve-divider ve-animate ve-animate-3"><span>or</span></div>

              <button className="ve-btn-ghost ve-animate ve-animate-4" onClick={() => router.push('/register')}>
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.5 1v13M1 7.5h13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
                Create a new account
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            background: '#020817',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(96,165,250,.2)', borderTopColor: '#60a5fa', animation: 'spin .8s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
