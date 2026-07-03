'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/api';

type Stage = 'validating' | 'form' | 'expired' | 'success' | 'error';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [stage, setStage] = useState<Stage>('validating');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dark, setDark] = useState(false);
  const [countdown, setCountdown] = useState(2);

  useEffect(() => {
    const saved = localStorage.getItem('rg_theme');
    if (saved === 'dark') setDark(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('rg_theme', dark ? 'dark' : 'light');
  }, [dark]);

  // Validate token on mount
  useEffect(() => {
    if (!token) { setStage('expired'); return; }
    const validate = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/validate-reset-token?token=${token}`);
        const data = await res.json();
        setStage(data.valid ? 'form' : 'expired');
      } catch {
        setStage('expired');
      }
    };
    validate();
  }, [token]);

  // Countdown redirect after success
  useEffect(() => {
    if (stage !== 'success') return;
    if (countdown <= 0) { router.push('/login'); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [stage, countdown, router]);

  const getStrength = (pw: string) => {
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  };
  const strength = getStrength(password);
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = ['', '#e74c3c', '#f39c12', '#1a6cf6', '#0e9f6e'][strength];

  const handleSubmit = async () => {
    setError('');
    if (!password) { setError('Please enter a new password.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Reset failed. The link may have expired.'); return; }
      setStage('success');
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
        .rg-root { min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: 'Sora', sans-serif; transition: background .3s; padding: 24px; position: relative; }
        .rg-root.light { background: #f9f8f6; color: #181716; }
        .rg-root.dark  { background: #0f0e0d; color: #f0ede8; }
        .rg-bg-grid { position: fixed; inset: 0; pointer-events: none; opacity: .03; background-image: linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px); background-size: 48px 48px; }
        .rg-root.dark .rg-bg-grid { opacity: .04; background-image: linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px); }
        .rg-bg-blob { position: fixed; border-radius: 50%; filter: blur(100px); pointer-events: none; }
        .rg-bg-blob-1 { width: 400px; height: 400px; top: -80px; left: -100px; background: radial-gradient(circle, rgba(26,108,246,.12) 0%, transparent 70%); }
        .rg-bg-blob-2 { width: 320px; height: 320px; bottom: -60px; right: -80px; background: radial-gradient(circle, rgba(124,58,237,.08) 0%, transparent 70%); }
        .rg-theme-toggle { position: fixed; top: 24px; right: 24px; background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 100px; font-family: 'Sora', sans-serif; font-size: .8rem; font-weight: 600; transition: all .2s; z-index: 10; }
        .rg-root.light .rg-theme-toggle { background: #f0ede8; color: #5a5753; border: 1px solid #e0ddd8; }
        .rg-root.dark  .rg-theme-toggle { background: #1e1c1a; color: #9a9896; border: 1px solid #2a2826; }
        .toggle-track { width: 36px; height: 20px; border-radius: 100px; position: relative; transition: background .25s; flex-shrink: 0; }
        .rg-root.light .toggle-track { background: #d4d0cb; }
        .rg-root.dark  .toggle-track { background: #1a6cf6; }
        .toggle-thumb { position: absolute; top: 2px; width: 16px; height: 16px; border-radius: 50%; background: #fff; transition: transform .25s; box-shadow: 0 1px 4px rgba(0,0,0,.3); }
        .rg-root.light .toggle-thumb { transform: translateX(2px); }
        .rg-root.dark  .toggle-thumb { transform: translateX(18px); }
        .rp-card { width: 100%; max-width: 440px; border-radius: 20px; padding: 44px 40px 40px; position: relative; animation: cardIn .35s cubic-bezier(.34,1.56,.64,1); }
        .rg-root.light .rp-card { background: #fff; border: 1px solid #e0ddd8; box-shadow: 0 20px 60px rgba(0,0,0,.08); }
        .rg-root.dark  .rp-card { background: #1a1816; border: 1px solid #2a2826; box-shadow: 0 20px 60px rgba(0,0,0,.4); }
        @keyframes cardIn { from{opacity:0;transform:translateY(20px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        .rp-card-line { position: absolute; top: 0; left: 0; right: 0; height: 3px; border-radius: 20px 20px 0 0; }
        .rp-card-line.blue  { background: linear-gradient(90deg, #1a6cf6, #7c3aed); }
        .rp-card-line.green { background: linear-gradient(90deg, #0e9f6e, #1a6cf6); }
        .rp-card-line.red   { background: linear-gradient(90deg, #e74c3c, #f39c12); }
        .rp-brand { display: flex; align-items: center; gap: 8px; margin-bottom: 28px; }
        .rp-brand-dot { width: 8px; height: 8px; background: #1a6cf6; border-radius: 50%; animation: pulseDot 2s ease-in-out infinite; }
        @keyframes pulseDot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(.8)} }
        .rp-brand-name { font-size: 1.1rem; font-weight: 800; letter-spacing: -.04em; }
        .rg-root.light .rp-brand-name { color: #181716; }
        .rg-root.dark  .rp-brand-name { color: #f0ede8; }
        .rp-icon { width: 56px; height: 56px; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin-bottom: 18px; }
        .rp-icon.blue  { background: rgba(26,108,246,.1); border: 1px solid rgba(26,108,246,.2); }
        .rp-icon.red   { background: rgba(231,76,60,.1); border: 1px solid rgba(231,76,60,.2); }
        .rp-icon.green { background: rgba(14,159,110,.1); border: 1px solid rgba(14,159,110,.2); }
        .rp-tag { font-size: .74rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; margin-bottom: 8px; }
        .rp-tag.blue  { color: #1a6cf6; }
        .rp-tag.red   { color: #e74c3c; }
        .rp-tag.green { color: #0e9f6e; }
        .rp-title { font-size: 1.65rem; font-weight: 800; letter-spacing: -.04em; line-height: 1.15; margin-bottom: 10px; }
        .rg-root.light .rp-title { color: #181716; }
        .rg-root.dark  .rp-title { color: #f0ede8; }
        .rp-sub { font-size: .88rem; line-height: 1.65; margin-bottom: 24px; }
        .rg-root.light .rp-sub { color: #6a6663; }
        .rg-root.dark  .rp-sub { color: #5a5753; }
        .rp-field { margin-bottom: 16px; }
        .rp-label { display: block; font-size: .82rem; font-weight: 600; margin-bottom: 6px; }
        .rg-root.light .rp-label { color: #3a3835; }
        .rg-root.dark  .rp-label { color: #9a9896; }
        .rp-input-wrap { position: relative; }
        .rp-input { width: 100%; padding: 12px 46px 12px 16px; border-radius: 10px; font-family: 'Sora', sans-serif; font-size: .9rem; outline: none; transition: border-color .2s, box-shadow .2s; }
        .rg-root.light .rp-input { background: #fff; border: 1.5px solid #e0ddd8; color: #181716; }
        .rg-root.light .rp-input:focus { border-color: #1a6cf6; box-shadow: 0 0 0 3px rgba(26,108,246,.1); }
        .rg-root.dark  .rp-input { background: #141210; border: 1.5px solid #2e2c2a; color: #f0ede8; }
        .rg-root.dark  .rp-input:focus { border-color: #1a6cf6; box-shadow: 0 0 0 3px rgba(26,108,246,.15); }
        .rp-input::placeholder { color: #8a8680; }
        .rp-eye { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: .95rem; color: #8a8680; transition: color .2s; }
        .rp-eye:hover { color: #1a6cf6; }
        .rp-strength-bars { display: flex; gap: 4px; margin-top: 6px; margin-bottom: 3px; }
        .rp-strength-bar { flex: 1; height: 3px; border-radius: 100px; transition: background .3s; }
        .rp-strength-text { font-size: .72rem; font-weight: 600; }
        .rp-match { font-size: .72rem; font-weight: 600; margin-top: 5px; }
        .rp-error { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 8px; font-size: .82rem; font-weight: 500; margin-bottom: 16px; animation: shakeIn .3s ease; background: #fff1f0; border: 1px solid #fecaca; color: #c0392b; }
        .rg-root.dark .rp-error { background: rgba(192,57,43,.15); border-color: rgba(192,57,43,.3); color: #f87171; }
        @keyframes shakeIn { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-4px)} 40%,80%{transform:translateX(4px)} }
        .rp-btn { width: 100%; padding: 14px; border: none; border-radius: 10px; font-family: 'Sora', sans-serif; font-size: .93rem; font-weight: 700; cursor: pointer; transition: all .25s; display: flex; align-items: center; justify-content: center; gap: 8px; color: #fff; margin-bottom: 16px; letter-spacing: -.01em; }
        .rp-btn.blue { background: #1a6cf6; }
        .rp-btn.blue:hover:not(:disabled) { background: #2d7cf7; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(26,108,246,.35); }
        .rp-btn.red { background: #e74c3c; }
        .rp-btn.red:hover:not(:disabled) { background: #c0392b; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(231,76,60,.35); }
        .rp-btn:disabled { opacity: .55; cursor: not-allowed; transform: none; }
        .rp-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,.3); border-top-color: #fff; border-radius: 50%; animation: spin .7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .rp-back { display: flex; align-items: center; justify-content: center; gap: 6px; font-size: .84rem; font-weight: 600; color: #1a6cf6; text-decoration: none; }
        .rp-back:hover { text-decoration: underline; }
        .rp-spinner-ring { width: 40px; height: 40px; border-radius: 50%; border: 3px solid rgba(26,108,246,.15); border-top-color: #1a6cf6; animation: spin .8s linear infinite; margin: 0 auto 16px; }
        .rp-validating { text-align: center; padding: 12px 0 8px; }
        .rp-validating p { font-size: .88rem; }
        .rg-root.light .rp-validating p { color: #6a6663; }
        .rg-root.dark  .rp-validating p { color: #5a5753; }
        .rp-success-check { width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, rgba(14,159,110,.15), rgba(14,159,110,.06)); box-shadow: 0 0 0 1px rgba(14,159,110,.25), 0 0 32px rgba(14,159,110,.1); animation: iconPop .45s cubic-bezier(.34,1.56,.64,1) both; }
        @keyframes iconPop { from{opacity:0;transform:scale(.5)} to{opacity:1;transform:scale(1)} }
        .rp-ripple { position: absolute; inset: -10px; border-radius: 50%; border: 1px solid rgba(14,159,110,.2); animation: rippleOut 2s ease-out infinite; }
        .rp-ripple-2 { animation-delay: .6s; }
        @keyframes rippleOut { 0%{transform:scale(1);opacity:1} 100%{transform:scale(1.6);opacity:0} }
        .rp-countdown-wrap { display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 20px; }
        .rp-countdown-ring { position: relative; width: 38px; height: 38px; }
        .rp-countdown-ring svg { transform: rotate(-90deg); }
        .rp-countdown-num { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: .85rem; font-weight: 700; color: #0e9f6e; }
        .rp-countdown-text { font-size: .8rem; }
        .rg-root.light .rp-countdown-text { color: #6a6663; }
        .rg-root.dark  .rp-countdown-text { color: #5a5753; }
        .fadeUp { animation: fadeUp .35s ease both; }
        .fadeUp-1 { animation-delay: .1s; }
        .fadeUp-2 { animation-delay: .2s; }
        .fadeUp-3 { animation-delay: .3s; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @media (max-width: 480px) { .rp-card { padding: 36px 24px 32px; border-radius: 16px; } }
      `}</style>

      <div className={`rg-root ${d ? 'dark' : 'light'}`}>
        <div className="rg-bg-grid" />
        <div className="rg-bg-blob rg-bg-blob-1" />
        <div className="rg-bg-blob rg-bg-blob-2" />

        <button className="rg-theme-toggle" onClick={() => setDark(!d)}>
          <span>{d ? '☀️' : '🌙'}</span>
          <div className="toggle-track"><div className="toggle-thumb" /></div>
          <span>{d ? 'Light' : 'Dark'}</span>
        </button>

        <div className="rp-card">
          {/* ── VALIDATING ── */}
          {stage === 'validating' && (
            <>
              <div className="rp-card-line blue" />
              <div className="rp-brand"><span className="rp-brand-dot" /><span className="rp-brand-name">RevoGen</span></div>
              <div className="rp-validating">
                <div className="rp-spinner-ring" />
                <p>Validating your reset link…</p>
              </div>
            </>
          )}

          {/* ── EXPIRED / INVALID ── */}
          {stage === 'expired' && (
            <>
              <div className="rp-card-line red" />
              <div className="rp-brand"><span className="rp-brand-dot" /><span className="rp-brand-name">RevoGen</span></div>
              <div className="rp-icon red">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
              </div>
              <div className="rp-tag red">Link Expired</div>
              <h1 className="rp-title fadeUp">Reset link expired</h1>
              <p className="rp-sub fadeUp fadeUp-1">
                This password reset link is invalid or has expired. Reset links are only valid for 30 minutes. Request a new one below.
              </p>
              <Link href="/forgot-password" className="rp-btn red" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none', marginBottom: 16 }}>
                Request a new link →
              </Link>
              <Link href="/login" className="rp-back">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Back to Login
              </Link>
            </>
          )}

          {/* ── FORM ── */}
          {stage === 'form' && (
            <>
              <div className="rp-card-line blue" />
              <div className="rp-brand"><span className="rp-brand-dot" /><span className="rp-brand-name">RevoGen</span></div>
              <div className="rp-icon blue">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1a6cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              </div>
              <div className="rp-tag blue">Password Reset</div>
              <h1 className="rp-title">Set a new<br />password</h1>
              <p className="rp-sub">Choose a strong password — at least 8 characters with uppercase, numbers, and symbols.</p>

              {error && <div className="rp-error"><span>⚠️</span>{error}</div>}

              <div className="rp-field">
                <label className="rp-label">New password</label>
                <div className="rp-input-wrap">
                  <input className="rp-input" type={showPw ? 'text' : 'password'} placeholder="Min. 8 characters" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
                  <button type="button" className="rp-eye" onClick={() => setShowPw(!showPw)}>{showPw ? '🙈' : '👁️'}</button>
                </div>
                {password && (
                  <>
                    <div className="rp-strength-bars">
                      {[1,2,3,4].map(i => <div key={i} className="rp-strength-bar" style={{ background: i <= strength ? strengthColor : (d ? '#2a2826' : '#e5e2dc') }} />)}
                    </div>
                    <span className="rp-strength-text" style={{ color: strengthColor }}>{strengthLabel}</span>
                  </>
                )}
              </div>

              <div className="rp-field">
                <label className="rp-label">Confirm password</label>
                <div className="rp-input-wrap">
                  <input className="rp-input" type={showConfirm ? 'text' : 'password'} placeholder="Repeat password" value={confirm} onChange={e => setConfirm(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} autoComplete="new-password" />
                  <button type="button" className="rp-eye" onClick={() => setShowConfirm(!showConfirm)}>{showConfirm ? '🙈' : '👁️'}</button>
                </div>
                {confirm && (
                  <div className="rp-match" style={{ color: password === confirm ? '#0e9f6e' : '#e74c3c' }}>
                    {password === confirm ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </div>
                )}
              </div>

              <button className="rp-btn blue" onClick={handleSubmit} disabled={loading} style={{ marginTop: 8 }}>
                {loading ? <><div className="rp-spinner" /> Updating…</> : <>Reset password →</>}
              </button>

              <Link href="/login" className="rp-back">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Back to Login
              </Link>
            </>
          )}

          {/* ── SUCCESS ── */}
          {stage === 'success' && (
            <>
              <div className="rp-card-line green" />
              <div className="rp-brand"><span className="rp-brand-dot" /><span className="rp-brand-name">RevoGen</span></div>
              <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 20px' }}>
                <div className="rp-ripple" />
                <div className="rp-ripple rp-ripple-2" />
                <div className="rp-success-check">
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                    <path d="M10 18.5l5.5 5.5 10.5-10.5" stroke="#0e9f6e" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"
                      style={{ strokeDasharray: 40, strokeDashoffset: 0, animation: 'drawCheck .5s ease .2s both' }} />
                  </svg>
                </div>
              </div>
              <div className="rp-tag green fadeUp">Success</div>
              <h1 className="rp-title fadeUp fadeUp-1">Password updated!</h1>
              <p className="rp-sub fadeUp fadeUp-2">Your password has been changed successfully. You can now log in with your new password.</p>
              <div className="rp-countdown-wrap fadeUp fadeUp-2">
                <div className="rp-countdown-ring">
                  <svg width="38" height="38" viewBox="0 0 38 38">
                    <circle cx="19" cy="19" r="15" fill="none" stroke="rgba(14,159,110,.12)" strokeWidth="3" />
                    <circle cx="19" cy="19" r="15" fill="none" stroke="#0e9f6e" strokeWidth="3" strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 15}`}
                      strokeDashoffset={`${2 * Math.PI * 15 * (1 - countdown / 2)}`}
                      style={{ transition: 'stroke-dashoffset 1s linear' }} />
                  </svg>
                  <span className="rp-countdown-num">{countdown}</span>
                </div>
                <span className="rp-countdown-text">Redirecting to login in {countdown}s…</span>
              </div>
              <button className="rp-btn blue fadeUp fadeUp-3" onClick={() => router.push('/login')}>
                Go to Login →
              </button>
              <style>{`@keyframes drawCheck{from{stroke-dashoffset:40}to{stroke-dashoffset:0}}`}</style>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f8f6' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #e0ddd8', borderTopColor: '#1a6cf6', animation: 'spin .7s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
