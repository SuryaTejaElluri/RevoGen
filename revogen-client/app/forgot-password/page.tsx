'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/api';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('rg_theme');
    if (saved === 'dark') setDark(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('rg_theme', dark ? 'dark' : 'light');
  }, [dark]);

  const handleSubmit = async () => {
    setError('');
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      // Always show success regardless of response — never reveal email existence
      if (res.ok || res.status === 400) {
        setShowPopup(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.message || 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const d = dark;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Sora', sans-serif; }

        .rg-root { min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: 'Sora', sans-serif; transition: background .3s, color .3s; padding: 24px; position: relative; }
        .rg-root.light { background: #f9f8f6; color: #181716; }
        .rg-root.dark  { background: #0f0e0d; color: #f0ede8; }

        /* Background grid */
        .rg-bg-grid { position: fixed; inset: 0; pointer-events: none; opacity: .03; background-image: linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px); background-size: 48px 48px; }
        .rg-root.dark .rg-bg-grid { opacity: .04; background-image: linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px); }
        .rg-bg-blob { position: fixed; border-radius: 50%; filter: blur(100px); pointer-events: none; }
        .rg-bg-blob-1 { width: 400px; height: 400px; top: -80px; left: -100px; background: radial-gradient(circle, rgba(26,108,246,.12) 0%, transparent 70%); }
        .rg-bg-blob-2 { width: 320px; height: 320px; bottom: -60px; right: -80px; background: radial-gradient(circle, rgba(124,58,237,.08) 0%, transparent 70%); }

        /* Theme toggle */
        .rg-theme-toggle { position: fixed; top: 24px; right: 24px; background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 100px; font-family: 'Sora', sans-serif; font-size: .8rem; font-weight: 600; transition: all .2s; z-index: 10; }
        .rg-root.light .rg-theme-toggle { background: #f0ede8; color: #5a5753; border: 1px solid #e0ddd8; }
        .rg-root.light .rg-theme-toggle:hover { background: #e5e2dc; }
        .rg-root.dark  .rg-theme-toggle { background: #1e1c1a; color: #9a9896; border: 1px solid #2a2826; }
        .rg-root.dark  .rg-theme-toggle:hover { background: #2a2826; }
        .toggle-track { width: 36px; height: 20px; border-radius: 100px; position: relative; transition: background .25s; flex-shrink: 0; }
        .rg-root.light .toggle-track { background: #d4d0cb; }
        .rg-root.dark  .toggle-track { background: #1a6cf6; }
        .toggle-thumb { position: absolute; top: 2px; width: 16px; height: 16px; border-radius: 50%; background: #fff; transition: transform .25s; box-shadow: 0 1px 4px rgba(0,0,0,.3); }
        .rg-root.light .toggle-thumb { transform: translateX(2px); }
        .rg-root.dark  .toggle-thumb { transform: translateX(18px); }

        /* Card */
        .fp-card { width: 100%; max-width: 440px; border-radius: 20px; padding: 44px 40px 40px; position: relative; animation: cardIn .35s cubic-bezier(.34,1.56,.64,1); }
        .rg-root.light .fp-card { background: #fff; border: 1px solid #e0ddd8; box-shadow: 0 20px 60px rgba(0,0,0,.08); }
        .rg-root.dark  .fp-card { background: #1a1816; border: 1px solid #2a2826; box-shadow: 0 20px 60px rgba(0,0,0,.4); }
        @keyframes cardIn { from { opacity: 0; transform: translateY(20px) scale(.97); } to { opacity: 1; transform: translateY(0) scale(1); } }

        /* Top accent line */
        .fp-card-line { position: absolute; top: 0; left: 0; right: 0; height: 3px; border-radius: 20px 20px 0 0; background: linear-gradient(90deg, #1a6cf6, #7c3aed); }

        /* Brand */
        .fp-brand { display: flex; align-items: center; gap: 8px; margin-bottom: 32px; }
        .fp-brand-dot { width: 8px; height: 8px; background: #1a6cf6; border-radius: 50%; animation: pulseDot 2s ease-in-out infinite; }
        @keyframes pulseDot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(.8)} }
        .fp-brand-name { font-size: 1.15rem; font-weight: 800; letter-spacing: -.04em; }
        .rg-root.light .fp-brand-name { color: #181716; }
        .rg-root.dark  .fp-brand-name { color: #f0ede8; }

        /* Icon */
        .fp-icon { width: 56px; height: 56px; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; background: rgba(26,108,246,.1); border: 1px solid rgba(26,108,246,.2); }

        /* Text */
        .fp-tag { font-size: .74rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: #1a6cf6; margin-bottom: 8px; }
        .fp-title { font-size: 1.7rem; font-weight: 800; letter-spacing: -.04em; line-height: 1.15; margin-bottom: 10px; }
        .rg-root.light .fp-title { color: #181716; }
        .rg-root.dark  .fp-title { color: #f0ede8; }
        .fp-sub { font-size: .875rem; line-height: 1.6; margin-bottom: 28px; }
        .rg-root.light .fp-sub { color: #6a6663; }
        .rg-root.dark  .fp-sub { color: #5a5753; }

        /* Field */
        .fp-field { margin-bottom: 18px; }
        .fp-label { display: block; font-size: .82rem; font-weight: 600; margin-bottom: 7px; }
        .rg-root.light .fp-label { color: #3a3835; }
        .rg-root.dark  .fp-label { color: #9a9896; }
        .fp-input { width: 100%; padding: 13px 16px; border-radius: 10px; font-family: 'Sora', sans-serif; font-size: .9rem; outline: none; transition: border-color .2s, box-shadow .2s; }
        .rg-root.light .fp-input { background: #fff; border: 1.5px solid #e0ddd8; color: #181716; }
        .rg-root.light .fp-input:focus { border-color: #1a6cf6; box-shadow: 0 0 0 3px rgba(26,108,246,.1); }
        .rg-root.dark  .fp-input { background: #141210; border: 1.5px solid #2e2c2a; color: #f0ede8; }
        .rg-root.dark  .fp-input:focus { border-color: #1a6cf6; box-shadow: 0 0 0 3px rgba(26,108,246,.15); }
        .fp-input::placeholder { color: #8a8680; }

        /* Error */
        .fp-error { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 8px; font-size: .82rem; font-weight: 500; margin-bottom: 16px; animation: shakeIn .3s ease; background: #fff1f0; border: 1px solid #fecaca; color: #c0392b; }
        .rg-root.dark .fp-error { background: rgba(192,57,43,.15); border-color: rgba(192,57,43,.3); color: #f87171; }
        @keyframes shakeIn { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-4px)} 40%,80%{transform:translateX(4px)} }

        /* Submit button */
        .fp-btn { width: 100%; padding: 14px; border: none; border-radius: 10px; font-family: 'Sora', sans-serif; font-size: .93rem; font-weight: 700; cursor: pointer; transition: all .25s; display: flex; align-items: center; justify-content: center; gap: 8px; background: #1a6cf6; color: #fff; letter-spacing: -.01em; margin-bottom: 16px; }
        .fp-btn:hover:not(:disabled) { background: #2d7cf7; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(26,108,246,.35); }
        .fp-btn:disabled { opacity: .55; cursor: not-allowed; transform: none; }
        .fp-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,.3); border-top-color: #fff; border-radius: 50%; animation: spin .7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Back link */
        .fp-back { display: flex; align-items: center; justify-content: center; gap: 6px; font-size: .84rem; font-weight: 600; color: #1a6cf6; text-decoration: none; }
        .fp-back:hover { text-decoration: underline; }

        /* Success popup */
        .fp-popup-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.55); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); z-index: 50; display: flex; align-items: center; justify-content: center; padding: 24px; animation: overlayIn .25s ease; }
        @keyframes overlayIn { from{opacity:0} to{opacity:1} }
        .fp-popup { width: 100%; max-width: 420px; border-radius: 24px; padding: 44px 36px 36px; text-align: center; position: relative; animation: popupIn .38s cubic-bezier(.34,1.56,.64,1); }
        .rg-root.light .fp-popup { background: #fff; border: 1px solid #e0ddd8; box-shadow: 0 32px 80px rgba(0,0,0,.15); }
        .rg-root.dark  .fp-popup { background: #1a1816; border: 1px solid #2e2c2a; box-shadow: 0 32px 80px rgba(0,0,0,.5); }
        @keyframes popupIn { from{opacity:0;transform:scale(.85) translateY(16px)} to{opacity:1;transform:scale(1) translateY(0)} }
        .fp-popup-icon { width: 72px; height: 72px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; animation: iconBounce .5s cubic-bezier(.34,1.56,.64,1) .1s both; }
        @keyframes iconBounce { from{opacity:0;transform:scale(.5)} to{opacity:1;transform:scale(1)} }
        .fp-popup-icon.success { background: linear-gradient(135deg, #e8faf3, #d1f5e8); }
        .rg-root.dark .fp-popup-icon.success { background: linear-gradient(135deg, rgba(16,185,129,.2), rgba(16,185,129,.08)); }
        .fp-popup-title { font-size: 1.35rem; font-weight: 800; letter-spacing: -.03em; margin-bottom: 10px; animation: fadeUp .3s ease .2s both; }
        .rg-root.light .fp-popup-title { color: #181716; }
        .rg-root.dark  .fp-popup-title { color: #f0ede8; }
        .fp-popup-body { font-size: .88rem; line-height: 1.65; margin-bottom: 28px; animation: fadeUp .3s ease .28s both; }
        .rg-root.light .fp-popup-body { color: #6a6663; }
        .rg-root.dark  .fp-popup-body { color: #7a7673; }
        .fp-popup-btn { width: 100%; padding: 13px; border: none; border-radius: 10px; font-family: 'Sora', sans-serif; font-size: .9rem; font-weight: 700; cursor: pointer; background: #1a6cf6; color: #fff; transition: all .2s; animation: fadeUp .3s ease .36s both; }
        .fp-popup-btn:hover { background: #2d7cf7; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(26,108,246,.3); }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

        @media (max-width: 480px) { .fp-card { padding: 36px 24px 32px; border-radius: 16px; } }
      `}</style>

      <div className={`rg-root ${d ? 'dark' : 'light'}`}>
        <div className="rg-bg-grid" />
        <div className="rg-bg-blob rg-bg-blob-1" />
        <div className="rg-bg-blob rg-bg-blob-2" />

        {/* Theme toggle */}
        <button className="rg-theme-toggle" onClick={() => setDark(!d)}>
          <span>{d ? '☀️' : '🌙'}</span>
          <div className="toggle-track"><div className="toggle-thumb" /></div>
          <span>{d ? 'Light' : 'Dark'}</span>
        </button>

        <div className="fp-card">
          <div className="fp-card-line" />

          {/* Brand */}
          <div className="fp-brand">
            <span className="fp-brand-dot" />
            <span className="fp-brand-name">RevoGen</span>
          </div>

          {/* Icon */}
          <div className="fp-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1a6cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="3" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>

          <div className="fp-tag">Account Recovery</div>
          <h1 className="fp-title">Forgot your<br />password?</h1>
          <p className="fp-sub">
            Enter your email address and we'll send you a link to reset your password. The link will expire in 30 minutes.
          </p>

          {error && <div className="fp-error"><span>⚠️</span>{error}</div>}

          <div className="fp-field">
            <label className="fp-label">Email address</label>
            <input
              className="fp-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              autoComplete="email"
              autoFocus
            />
          </div>

          <button className="fp-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? <><div className="fp-spinner" /> Sending…</> : <>Send reset link →</>}
          </button>

          <Link href="/login" className="fp-back">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Back to Login
          </Link>
        </div>

        {/* Success popup */}
        {showPopup && (
          <div className="fp-popup-overlay">
            <div className="fp-popup">
              <div className="fp-popup-icon success">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <path d="M8 16l5 5 9-9" stroke="#0e9f6e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{ strokeDasharray: 30, strokeDashoffset: 0, animation: 'drawCheck .4s ease .2s both' }} />
                </svg>
              </div>
              <h2 className="fp-popup-title">Check your inbox!</h2>
              <p className="fp-popup-body">
                If an account exists for <strong>{email}</strong>, a password reset link has been sent. Check your spam folder if you don't see it.
              </p>
              <button className="fp-popup-btn" onClick={() => { setShowPopup(false); router.push('/login'); }}>
                Back to Login →
              </button>
            </div>
            <style>{`@keyframes drawCheck{from{stroke-dashoffset:30}to{stroke-dashoffset:0}}`}</style>
          </div>
        )}
      </div>
    </>
  );
}
