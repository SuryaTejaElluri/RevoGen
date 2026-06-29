'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/api';


export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('rg_theme');
    if (saved === 'dark') setDark(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('rg_theme', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) router.push('/dashboard');
  }, [router]);

  const login = async () => {
    setError('');
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || 'Login failed. Check your credentials.');
        return;
      }
      localStorage.setItem('access_token', data.access_token);
      if (data.role === 'SUPER_ADMIN') {
  router.push('/pro-admin');
}
else if (data.role === 'ADMIN') {
  router.push('/admin');
}
else {
  router.push('/dashboard');
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

        .rg-root {
          min-height: 100vh;
          display: flex;
          font-family: 'Sora', sans-serif;
          transition: background 0.3s, color 0.3s;
        }
        .rg-root.light { background: #f9f8f6; color: #181716; }
        .rg-root.dark  { background: #0f0e0d; color: #f0ede8; }

        /* Left panel */
        .rg-left {
          width: 42%;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px;
          position: relative;
          overflow: hidden;
          flex-shrink: 0;
        }
        .rg-root.light .rg-left { background: #181716; }
        .rg-root.dark  .rg-left { background: #0a0908; border-right: 1px solid #2a2826; }

        .rg-left-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 70% 50% at 30% 30%, rgba(26,108,246,0.18) 0%, transparent 60%),
            radial-gradient(ellipse 50% 60% at 80% 80%, rgba(124,58,237,0.12) 0%, transparent 60%);
          pointer-events: none;
        }
        .rg-left-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }

        .rg-brand {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          position: relative;
          z-index: 1;
        }
        .rg-brand-dot {
          width: 8px; height: 8px;
          background: #1a6cf6;
          border-radius: 50%;
          animation: pulseDot 2s ease-in-out infinite;
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.8); }
        }
        .rg-brand-name {
          font-size: 1.3rem;
          font-weight: 800;
          letter-spacing: -0.04em;
          color: #f9f8f6;
        }

        .rg-left-body {
          position: relative;
          z-index: 1;
        }
        .rg-left-body h2 {
          font-size: clamp(1.6rem, 2.5vw, 2.2rem);
          font-weight: 800;
          letter-spacing: -0.04em;
          color: #f9f8f6;
          line-height: 1.2;
          margin-bottom: 16px;
        }
        .rg-left-body h2 .blue { color: #4d8ff8; }
        .rg-left-body p {
          font-size: 0.9rem;
          color: #6a6663;
          line-height: 1.7;
          margin-bottom: 36px;
        }
        .rg-feature-list { display: flex; flex-direction: column; gap: 14px; }
        .rg-feature {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 10px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
        }
        .rg-feature-icon {
          font-size: 1.1rem;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .rg-feature-title { font-size: 0.85rem; font-weight: 700; color: #d4d0cb; margin-bottom: 2px; }
        .rg-feature-sub { font-size: 0.78rem; color: #5a5753; }

        .rg-left-foot {
          font-size: 0.75rem;
          color: #3a3835;
          position: relative;
          z-index: 1;
        }

        /* Right panel — form */
        .rg-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 40px;
          position: relative;
        }

        .rg-theme-toggle {
          position: absolute;
          top: 28px;
          right: 28px;
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          border-radius: 100px;
          font-family: 'Sora', sans-serif;
          font-size: 0.8rem;
          font-weight: 600;
          transition: all 0.2s;
        }
        .rg-root.light .rg-theme-toggle { background: #f0ede8; color: #5a5753; border: 1px solid #e0ddd8; }
        .rg-root.light .rg-theme-toggle:hover { background: #e5e2dc; }
        .rg-root.dark  .rg-theme-toggle { background: #1e1c1a; color: #9a9896; border: 1px solid #2a2826; }
        .rg-root.dark  .rg-theme-toggle:hover { background: #2a2826; }

        .toggle-track {
          width: 36px; height: 20px;
          border-radius: 100px;
          position: relative;
          transition: background 0.25s;
          flex-shrink: 0;
        }
        .rg-root.light .toggle-track { background: #d4d0cb; }
        .rg-root.dark  .toggle-track { background: #1a6cf6; }
        .toggle-thumb {
          position: absolute;
          top: 2px;
          width: 16px; height: 16px;
          border-radius: 50%;
          background: #fff;
          transition: transform 0.25s;
          box-shadow: 0 1px 4px rgba(0,0,0,0.3);
        }
        .rg-root.light .toggle-thumb { transform: translateX(2px); }
        .rg-root.dark  .toggle-thumb { transform: translateX(18px); }

        .rg-form-wrap {
          width: 100%;
          max-width: 400px;
        }
        .rg-form-head { margin-bottom: 36px; }
        .rg-form-tag {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #1a6cf6;
          margin-bottom: 10px;
        }
        .rg-form-title {
          font-size: 1.9rem;
          font-weight: 800;
          letter-spacing: -0.04em;
          line-height: 1.15;
          margin-bottom: 8px;
        }
        .rg-root.light .rg-form-title { color: #181716; }
        .rg-root.dark  .rg-form-title { color: #f0ede8; }
        .rg-form-sub { font-size: 0.875rem; }
        .rg-root.light .rg-form-sub { color: #6a6663; }
        .rg-root.dark  .rg-form-sub { color: #5a5753; }
        .rg-form-sub a { color: #1a6cf6; font-weight: 600; text-decoration: none; }
        .rg-form-sub a:hover { text-decoration: underline; }

        .rg-field { margin-bottom: 18px; }
        .rg-label {
          display: block;
          font-size: 0.82rem;
          font-weight: 600;
          margin-bottom: 7px;
        }
        .rg-root.light .rg-label { color: #3a3835; }
        .rg-root.dark  .rg-label { color: #9a9896; }
        .rg-input-wrap { position: relative; }
        .rg-input {
          width: 100%;
          padding: 13px 16px;
          border-radius: 10px;
          font-family: 'Sora', sans-serif;
          font-size: 0.9rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .rg-root.light .rg-input {
          background: #fff;
          border: 1.5px solid #e0ddd8;
          color: #181716;
        }
        .rg-root.light .rg-input:focus {
          border-color: #1a6cf6;
          box-shadow: 0 0 0 3px rgba(26,108,246,0.1);
        }
        .rg-root.dark .rg-input {
          background: #1a1816;
          border: 1.5px solid #2e2c2a;
          color: #f0ede8;
        }
        .rg-root.dark .rg-input:focus {
          border-color: #1a6cf6;
          box-shadow: 0 0 0 3px rgba(26,108,246,0.15);
        }
        .rg-input::placeholder { color: #8a8680; }
        .rg-input.has-toggle { padding-right: 48px; }

        .rg-eye-btn {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1rem;
          color: #8a8680;
          padding: 2px;
          transition: color 0.2s;
        }
        .rg-eye-btn:hover { color: #1a6cf6; }

        .rg-forgot {
          display: block;
          text-align: right;
          font-size: 0.78rem;
          font-weight: 600;
          color: #1a6cf6;
          text-decoration: none;
          margin-top: -8px;
          margin-bottom: 18px;
        }
        .rg-forgot:hover { text-decoration: underline; }

        .rg-error {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 0.82rem;
          font-weight: 500;
          margin-bottom: 18px;
          background: #fff1f0;
          border: 1px solid #fecaca;
          color: #c0392b;
          animation: shakeIn 0.3s ease;
        }
        .rg-root.dark .rg-error {
          background: rgba(192,57,43,0.15);
          border-color: rgba(192,57,43,0.3);
          color: #f87171;
        }
        @keyframes shakeIn {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-4px); }
          40%, 80% { transform: translateX(4px); }
        }

        .rg-btn-submit {
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 10px;
          font-family: 'Sora', sans-serif;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.25s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #181716;
          color: #f9f8f6;
          letter-spacing: -0.01em;
        }
        .rg-root.dark .rg-btn-submit { background: #1a6cf6; }
        .rg-btn-submit:hover:not(:disabled) {
          background: #1a6cf6;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(26,108,246,0.3);
        }
        .rg-root.dark .rg-btn-submit:hover:not(:disabled) {
          background: #2d7cf7;
        }
        .rg-btn-submit:disabled {
          opacity: 0.55;
          cursor: not-allowed;
          transform: none;
        }

        .rg-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .rg-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 24px 0;
        }
        .rg-divider-line {
          flex: 1;
          height: 1px;
        }
        .rg-root.light .rg-divider-line { background: #e5e2dc; }
        .rg-root.dark  .rg-divider-line { background: #2a2826; }
        .rg-divider-text { font-size: 0.75rem; font-weight: 600; }
        .rg-root.light .rg-divider-text { color: #a8a4a0; }
        .rg-root.dark  .rg-divider-text { color: #4a4844; }

        .rg-oauth-row { display: flex; gap: 10px; }
        .rg-oauth-btn {
          flex: 1;
          padding: 11px;
          border-radius: 10px;
          font-family: 'Sora', sans-serif;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          transition: all 0.2s;
        }
        .rg-root.light .rg-oauth-btn {
          background: #fff;
          border: 1.5px solid #e0ddd8;
          color: #3a3835;
        }
        .rg-root.light .rg-oauth-btn:hover { border-color: #c8c4be; background: #f9f8f6; }
        .rg-root.dark .rg-oauth-btn {
          background: #1a1816;
          border: 1.5px solid #2e2c2a;
          color: #d4d0cb;
        }
        .rg-root.dark .rg-oauth-btn:hover { border-color: #4a4844; }

        /* Responsive */
        @media (max-width: 780px) {
          .rg-left { display: none; }
          .rg-right { padding: 80px 24px 40px; align-items: flex-start; padding-top: 100px; }
        }
      `}</style>

      <div className={`rg-root ${d ? 'dark' : 'light'}`}>

        {/* Left decorative panel */}
        <div className="rg-left">
          <div className="rg-left-bg" />
          <div className="rg-left-grid" />

          <Link href="/" className="rg-brand">
            <span className="rg-brand-dot" />
            <span className="rg-brand-name">RevoGen</span>
          </Link>

          <div className="rg-left-body">
            <h2>
              Your career,<br />
              powered by <span className="blue">AI</span>
            </h2>
            <p>Log in to access your resume analysis, ATS scores, and screening test dashboard.</p>
            <div className="rg-feature-list">
              {[
                { icon: '📄', title: 'Resume Analysis', sub: 'Deep AI feedback on structure & keywords' },
                { icon: '🎯', title: 'ATS Score', sub: 'Know your pass rate before you apply' },
                { icon: '🧪', title: 'Screening Tests', sub: 'Practice tests matched to your role' },
                { icon: '📊', title: 'Dashboard Analytics', sub: 'Track progress with visual insights' },
              ].map((f) => (
                <div key={f.title} className="rg-feature">
                  <span className="rg-feature-icon">{f.icon}</span>
                  <div>
                    <div className="rg-feature-title">{f.title}</div>
                    <div className="rg-feature-sub">{f.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rg-left-foot">© 2025 RevoGen · Made in India</div>
        </div>

        {/* Right form panel */}
        <div className="rg-right">

          {/* Dark mode toggle */}
          <button className="rg-theme-toggle" onClick={() => setDark(!d)} aria-label="Toggle theme">
            <span>{d ? '☀️' : '🌙'}</span>
            <div className="toggle-track">
              <div className="toggle-thumb" />
            </div>
            <span>{d ? 'Light' : 'Dark'}</span>
          </button>

          <div className="rg-form-wrap">
            <div className="rg-form-head">
              <div className="rg-form-tag">Welcome back</div>
              <h1 className="rg-form-title">Log in to<br />RevoGen</h1>
              <p className="rg-form-sub">
                Don't have an account?{' '}
                <Link href="/register">Create one free →</Link>
              </p>
            </div>

            {error && (
              <div className="rg-error">
                <span>⚠️</span>
                {error}
              </div>
            )}

            <div className="rg-field">
              <label className="rg-label">Email address</label>
              <input
                className="rg-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && login()}
                autoComplete="email"
              />
            </div>

            <div className="rg-field">
              <label className="rg-label">Password</label>
              <div className="rg-input-wrap">
                <input
                  className="rg-input has-toggle"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && login()}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="rg-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <a href="#" className="rg-forgot">Forgot password?</a>

            <button
              className="rg-btn-submit"
              onClick={login}
              disabled={loading}
            >
              {loading ? (
                <><div className="rg-spinner" /> Logging in…</>
              ) : (
                <>Log in →</>
              )}
            </button>

            <div className="rg-divider">
              <div className="rg-divider-line" />
              <span className="rg-divider-text">or continue with</span>
              <div className="rg-divider-line" />
            </div>

            <div className="rg-oauth-row">
              <button className="rg-oauth-btn">
                <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Google
              </button>
              <button className="rg-oauth-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                LinkedIn
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}