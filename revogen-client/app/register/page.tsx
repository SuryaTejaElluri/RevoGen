'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('rg_theme');
    if (saved === 'dark') setDark(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('rg_theme', dark ? 'dark' : 'light');
  }, [dark]);

  const getStrength = (pw: string) => {
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };

  const strength = getStrength(password);
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = ['', '#e74c3c', '#f39c12', '#1a6cf6', '#0e9f6e'][strength];

  const register = async () => {
    setError('');
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (strength < 2) {
      setError('Password is too weak. Add uppercase letters, numbers, or symbols.');
      return;
    }
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || 'Registration failed. Please try again.');
        return;
      }
      router.push('/login?registered=1');
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
            radial-gradient(ellipse 70% 50% at 70% 20%, rgba(14,159,110,0.2) 0%, transparent 60%),
            radial-gradient(ellipse 50% 60% at 20% 80%, rgba(26,108,246,0.12) 0%, transparent 60%);
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
          background: #0e9f6e;
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
        .rg-left-body h2 .green { color: #3ecf8e; }
        .rg-left-body p {
          font-size: 0.9rem;
          color: #6a6663;
          line-height: 1.7;
          margin-bottom: 32px;
        }

        .rg-steps { display: flex; flex-direction: column; gap: 0; }
        .rg-step {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          position: relative;
          padding-bottom: 24px;
        }
        .rg-step:last-child { padding-bottom: 0; }
        .rg-step-line {
          position: absolute;
          left: 17px;
          top: 36px;
          bottom: 0;
          width: 2px;
          background: rgba(255,255,255,0.06);
        }
        .rg-step:last-child .rg-step-line { display: none; }
        .rg-step-num {
          width: 34px; height: 34px;
          border-radius: 50%;
          background: rgba(14,159,110,0.15);
          border: 1.5px solid rgba(14,159,110,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
          color: #3ecf8e;
          flex-shrink: 0;
          position: relative;
          z-index: 1;
        }
        .rg-step-title { font-size: 0.88rem; font-weight: 700; color: #d4d0cb; margin-bottom: 3px; margin-top: 6px; }
        .rg-step-sub { font-size: 0.78rem; color: #4a4844; line-height: 1.5; }

        .rg-left-foot {
          font-size: 0.75rem;
          color: #3a3835;
          position: relative;
          z-index: 1;
        }

        /* Right panel */
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
        .rg-root.dark  .toggle-track { background: #0e9f6e; }
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
          max-width: 420px;
        }
        .rg-form-head { margin-bottom: 32px; }
        .rg-form-tag {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #0e9f6e;
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

        .rg-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

        .rg-field { margin-bottom: 16px; }
        .rg-field.full { grid-column: 1 / -1; }
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
          border-color: #0e9f6e;
          box-shadow: 0 0 0 3px rgba(14,159,110,0.1);
        }
        .rg-root.dark .rg-input {
          background: #1a1816;
          border: 1.5px solid #2e2c2a;
          color: #f0ede8;
        }
        .rg-root.dark .rg-input:focus {
          border-color: #0e9f6e;
          box-shadow: 0 0 0 3px rgba(14,159,110,0.15);
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
        .rg-eye-btn:hover { color: #0e9f6e; }

        /* Password strength */
        .rg-pw-strength { margin-top: 8px; }
        .rg-strength-bars {
          display: flex;
          gap: 4px;
          margin-bottom: 4px;
        }
        .rg-strength-bar {
          flex: 1;
          height: 3px;
          border-radius: 100px;
          transition: background 0.3s;
        }
        .rg-strength-text {
          font-size: 0.72rem;
          font-weight: 600;
          transition: color 0.3s;
        }

        /* Match indicator */
        .rg-match-hint {
          font-size: 0.72rem;
          font-weight: 600;
          margin-top: 6px;
          height: 14px;
        }

        .rg-error {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 0.82rem;
          font-weight: 500;
          margin-bottom: 18px;
          animation: shakeIn 0.3s ease;
          background: #fff1f0;
          border: 1px solid #fecaca;
          color: #c0392b;
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

        .rg-terms {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 20px;
          font-size: 0.78rem;
          line-height: 1.5;
        }
        .rg-root.light .rg-terms { color: #6a6663; }
        .rg-root.dark  .rg-terms { color: #5a5753; }
        .rg-terms input[type=checkbox] { margin-top: 2px; flex-shrink: 0; accent-color: #0e9f6e; }
        .rg-terms a { color: #1a6cf6; text-decoration: none; font-weight: 600; }

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
          background: #0e9f6e;
          color: #fff;
          letter-spacing: -0.01em;
        }
        .rg-btn-submit:hover:not(:disabled) {
          background: #0c8a60;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(14,159,110,0.3);
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

        @media (max-width: 780px) {
          .rg-left { display: none; }
          .rg-right { padding: 80px 24px 40px; align-items: flex-start; padding-top: 100px; }
          .rg-two-col { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className={`rg-root ${d ? 'dark' : 'light'}`}>

        {/* Left panel */}
        <div className="rg-left">
          <div className="rg-left-bg" />
          <div className="rg-left-grid" />

          <Link href="/" className="rg-brand">
            <span className="rg-brand-dot" />
            <span className="rg-brand-name">RevoGen</span>
          </Link>

          <div className="rg-left-body">
            <h2>
              Start your<br />
              career journey<br />
              <span className="green">today</span>
            </h2>
            <p>Create a free account and get your first resume score in under 2 minutes.</p>

            <div className="rg-steps">
              {[
                { n: '01', title: 'Create your account', sub: 'Free forever. No credit card required.' },
                { n: '02', title: 'Upload your resume', sub: 'PDF or Word — we handle both.' },
                { n: '03', title: 'Get your ATS score', sub: 'Instant analysis with actionable fixes.' },
                { n: '04', title: 'Land the interview', sub: 'Practice tests to ace every screening.' },
              ].map((s) => (
                <div key={s.n} className="rg-step">
                  <div className="rg-step-line" />
                  <div className="rg-step-num">{s.n}</div>
                  <div>
                    <div className="rg-step-title">{s.title}</div>
                    <div className="rg-step-sub">{s.sub}</div>
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
              <div className="rg-form-tag">Free forever</div>
              <h1 className="rg-form-title">Create your<br />account</h1>
              <p className="rg-form-sub">
                Already have an account?{' '}
                <Link href="/login">Log in →</Link>
              </p>
            </div>

            {error && (
              <div className="rg-error">
                <span>⚠️</span>
                {error}
              </div>
            )}

            <div className="rg-field">
              <label className="rg-label">Full name</label>
              <input
                className="rg-input"
                type="text"
                placeholder="Arjun Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>

            <div className="rg-field">
              <label className="rg-label">Email address</label>
              <input
                className="rg-input"
                type="email"
                placeholder="arjun@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="rg-field">
              <label className="rg-label">Password</label>
              <div className="rg-input-wrap">
                <input
                  className="rg-input has-toggle"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="rg-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide' : 'Show'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {password && (
                <div className="rg-pw-strength">
                  <div className="rg-strength-bars">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="rg-strength-bar"
                        style={{ background: i <= strength ? strengthColor : (d ? '#2a2826' : '#e5e2dc') }}
                      />
                    ))}
                  </div>
                  <span className="rg-strength-text" style={{ color: strengthColor }}>
                    {strengthLabel}
                  </span>
                </div>
              )}
            </div>

            <div className="rg-field" style={{ marginBottom: 24 }}>
              <label className="rg-label">Confirm password</label>
              <div className="rg-input-wrap">
                <input
                  className="rg-input has-toggle"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="rg-eye-btn"
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label={showConfirm ? 'Hide' : 'Show'}
                >
                  {showConfirm ? '🙈' : '👁️'}
                </button>
              </div>
              {confirmPassword && (
                <div
                  className="rg-match-hint"
                  style={{ color: password === confirmPassword ? '#0e9f6e' : '#e74c3c' }}
                >
                  {password === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                </div>
              )}
            </div>

            <label className="rg-terms">
              <input type="checkbox" defaultChecked />
              <span>
                I agree to the{' '}
                <a href="#">Terms of Service</a>
                {' '}and{' '}
                <a href="#">Privacy Policy</a>
              </span>
            </label>

            <button
              className="rg-btn-submit"
              onClick={register}
              disabled={loading}
            >
              {loading ? (
                <><div className="rg-spinner" /> Creating account…</>
              ) : (
                <>Create account — it's free →</>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}