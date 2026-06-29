'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/api';

type AccountType = 'candidate' | 'recruiter';

export default function RegisterPage() {
  const router = useRouter();
  const [accountType, setAccountType] = useState<AccountType>('candidate');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
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

  const register = async () => {
    setError('');
    if (!name || !email || !password || !confirmPassword) { setError('Please fill in all required fields.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (strength < 2) { setError('Password too weak — add uppercase, numbers, or symbols.'); return; }
    if (phone && !/^\+?[\d\s\-()]{7,15}$/.test(phone)) { setError('Please enter a valid phone number.'); return; }
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone: phone || undefined, role: isRecruiter ? 'ADMIN' : 'USER' }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Registration failed. Please try again.'); return; }
      router.push('/login?registered=1');
    } catch {
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const d = dark;
  const isRecruiter = accountType === 'recruiter';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Sora', sans-serif; }

        .rg-root { min-height: 100vh; display: flex; font-family: 'Sora', sans-serif; transition: background .3s, color .3s; }
        .rg-root.light { background: #f9f8f6; color: #181716; }
        .rg-root.dark  { background: #0f0e0d; color: #f0ede8; }

        /* ── Left panel ── */
        .rg-left { width: 40%; min-height: 100vh; display: flex; flex-direction: column; justify-content: space-between; padding: 48px; position: relative; overflow: hidden; flex-shrink: 0; }
        .rg-root.light .rg-left { background: #181716; }
        .rg-root.dark  .rg-left { background: #0a0908; border-right: 1px solid #2a2826; }
        .rg-left-bg { position: absolute; inset: 0; background: radial-gradient(ellipse 70% 50% at 70% 20%, rgba(14,159,110,0.2) 0%, transparent 60%), radial-gradient(ellipse 50% 60% at 20% 80%, rgba(26,108,246,0.12) 0%, transparent 60%); pointer-events: none; }
        .rg-left-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px); background-size: 48px 48px; pointer-events: none; }
        .rg-brand { display: flex; align-items: center; gap: 8px; text-decoration: none; position: relative; z-index: 1; }
        .rg-brand-dot { width: 8px; height: 8px; background: #0e9f6e; border-radius: 50%; animation: pulseDot 2s ease-in-out infinite; }
        @keyframes pulseDot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(.8)} }
        .rg-brand-name { font-size: 1.3rem; font-weight: 800; letter-spacing: -.04em; color: #f9f8f6; }
        .rg-left-body { position: relative; z-index: 1; }
        .rg-left-body h2 { font-size: clamp(1.5rem, 2.3vw, 2rem); font-weight: 800; letter-spacing: -.04em; color: #f9f8f6; line-height: 1.2; margin-bottom: 14px; }
        .rg-left-body h2 .green { color: #3ecf8e; }
        .rg-left-body p { font-size: .88rem; color: #6a6663; line-height: 1.7; margin-bottom: 28px; }
        .rg-steps { display: flex; flex-direction: column; gap: 0; }
        .rg-step { display: flex; align-items: flex-start; gap: 14px; position: relative; padding-bottom: 22px; }
        .rg-step:last-child { padding-bottom: 0; }
        .rg-step-line { position: absolute; left: 17px; top: 36px; bottom: 0; width: 2px; background: rgba(255,255,255,.06); }
        .rg-step:last-child .rg-step-line { display: none; }
        .rg-step-num { width: 34px; height: 34px; border-radius: 50%; background: rgba(14,159,110,.15); border: 1.5px solid rgba(14,159,110,.3); display: flex; align-items: center; justify-content: center; font-size: .75rem; font-weight: 700; color: #3ecf8e; flex-shrink: 0; position: relative; z-index: 1; }
        .rg-step-title { font-size: .86rem; font-weight: 700; color: #d4d0cb; margin-bottom: 3px; margin-top: 6px; }
        .rg-step-sub { font-size: .76rem; color: #4a4844; line-height: 1.5; }
        .rg-left-foot { font-size: .75rem; color: #3a3835; position: relative; z-index: 1; }

        /* ── Right panel ── */
        .rg-right { flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px; position: relative; overflow-y: auto; }
        .rg-theme-toggle { position: absolute; top: 24px; right: 24px; background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 100px; font-family: 'Sora', sans-serif; font-size: .8rem; font-weight: 600; transition: all .2s; }
        .rg-root.light .rg-theme-toggle { background: #f0ede8; color: #5a5753; border: 1px solid #e0ddd8; }
        .rg-root.light .rg-theme-toggle:hover { background: #e5e2dc; }
        .rg-root.dark  .rg-theme-toggle { background: #1e1c1a; color: #9a9896; border: 1px solid #2a2826; }
        .rg-root.dark  .rg-theme-toggle:hover { background: #2a2826; }
        .toggle-track { width: 36px; height: 20px; border-radius: 100px; position: relative; transition: background .25s; flex-shrink: 0; }
        .rg-root.light .toggle-track { background: #d4d0cb; }
        .rg-root.dark  .toggle-track { background: #0e9f6e; }
        .toggle-thumb { position: absolute; top: 2px; width: 16px; height: 16px; border-radius: 50%; background: #fff; transition: transform .25s; box-shadow: 0 1px 4px rgba(0,0,0,.3); }
        .rg-root.light .toggle-thumb { transform: translateX(2px); }
        .rg-root.dark  .toggle-thumb { transform: translateX(18px); }

        /* ── Account type switcher ── */
        .rg-type-switch { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 24px; padding: 4px; border-radius: 12px; }
        .rg-root.light .rg-type-switch { background: #f0ede8; }
        .rg-root.dark  .rg-type-switch { background: #1a1816; }
        .rg-type-btn { padding: 10px 14px; border: none; border-radius: 9px; font-family: 'Sora', sans-serif; font-size: .85rem; font-weight: 600; cursor: pointer; transition: all .2s; display: flex; align-items: center; justify-content: center; gap: 7px; }
        .rg-type-btn.inactive { background: transparent; }
        .rg-root.light .rg-type-btn.inactive { color: #8a8680; }
        .rg-root.dark  .rg-type-btn.inactive { color: #5a5753; }
        .rg-type-btn.active-cand { background: #0e9f6e; color: #fff; box-shadow: 0 2px 12px rgba(14,159,110,.3); }
        .rg-type-btn.active-rec  { background: #1a6cf6; color: #fff; box-shadow: 0 2px 12px rgba(26,108,246,.3); }

        /* ── Form ── */
        .rg-form-wrap { width: 100%; max-width: 440px; }
        .rg-form-head { margin-bottom: 24px; }
        .rg-form-tag { font-size: .74rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; margin-bottom: 8px; }
        .tag-cand { color: #0e9f6e; }
        .tag-rec  { color: #1a6cf6; }
        .rg-form-title { font-size: 1.8rem; font-weight: 800; letter-spacing: -.04em; line-height: 1.15; margin-bottom: 8px; }
        .rg-root.light .rg-form-title { color: #181716; }
        .rg-root.dark  .rg-form-title { color: #f0ede8; }
        .rg-form-sub { font-size: .875rem; }
        .rg-root.light .rg-form-sub { color: #6a6663; }
        .rg-root.dark  .rg-form-sub { color: #5a5753; }
        .rg-form-sub a { color: #1a6cf6; font-weight: 600; text-decoration: none; }
        .rg-form-sub a:hover { text-decoration: underline; }

        .rg-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .rg-field { margin-bottom: 16px; }
        .rg-label { display: block; font-size: .82rem; font-weight: 600; margin-bottom: 6px; }
        .rg-root.light .rg-label { color: #3a3835; }
        .rg-root.dark  .rg-label { color: #9a9896; }
        .rg-label .opt { font-weight: 400; opacity: .6; font-size: .75rem; margin-left: 4px; }
        .rg-input-wrap { position: relative; }
        .rg-input { width: 100%; padding: 12px 16px; border-radius: 10px; font-family: 'Sora', sans-serif; font-size: .88rem; outline: none; transition: border-color .2s, box-shadow .2s; }
        .rg-root.light .rg-input { background: #fff; border: 1.5px solid #e0ddd8; color: #181716; }
        .rg-root.light .rg-input:focus { border-color: #0e9f6e; box-shadow: 0 0 0 3px rgba(14,159,110,.1); }
        .rg-root.dark  .rg-input { background: #1a1816; border: 1.5px solid #2e2c2a; color: #f0ede8; }
        .rg-root.dark  .rg-input:focus { border-color: #0e9f6e; box-shadow: 0 0 0 3px rgba(14,159,110,.15); }
        .rg-input.rec:focus { box-shadow: 0 0 0 3px rgba(26,108,246,.15) !important; }
        .rg-root.light .rg-input.rec:focus { border-color: #1a6cf6 !important; }
        .rg-root.dark  .rg-input.rec:focus { border-color: #1a6cf6 !important; }
        .rg-input::placeholder { color: #8a8680; }
        .rg-input.has-toggle { padding-right: 46px; }
        .rg-eye-btn { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: .95rem; color: #8a8680; transition: color .2s; }
        .rg-eye-btn:hover { color: #0e9f6e; }

        /* ── Phone input ── */
        .rg-phone-wrap { display: flex; gap: 0; }
        .rg-phone-prefix { padding: 12px 12px; border-radius: 10px 0 0 10px; font-size: .88rem; font-weight: 600; flex-shrink: 0; border: 1.5px solid #e0ddd8; border-right: none; }
        .rg-root.light .rg-phone-prefix { background: #f0ede8; color: #6a6663; border-color: #e0ddd8; }
        .rg-root.dark  .rg-phone-prefix { background: #1e1c1a; color: #6a6663; border-color: #2e2c2a; }
        .rg-phone-input { border-radius: 0 10px 10px 0 !important; }

        /* ── Password strength ── */
        .rg-pw-strength { margin-top: 7px; }
        .rg-strength-bars { display: flex; gap: 4px; margin-bottom: 4px; }
        .rg-strength-bar { flex: 1; height: 3px; border-radius: 100px; transition: background .3s; }
        .rg-strength-text { font-size: .72rem; font-weight: 600; }
        .rg-match-hint { font-size: .72rem; font-weight: 600; margin-top: 5px; }

        /* ── Error ── */
        .rg-error { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 8px; font-size: .82rem; font-weight: 500; margin-bottom: 16px; animation: shakeIn .3s ease; background: #fff1f0; border: 1px solid #fecaca; color: #c0392b; }
        .rg-root.dark .rg-error { background: rgba(192,57,43,.15); border-color: rgba(192,57,43,.3); color: #f87171; }
        @keyframes shakeIn { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-4px)} 40%,80%{transform:translateX(4px)} }

        /* ── Terms ── */
        .rg-terms { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 18px; font-size: .78rem; line-height: 1.5; }
        .rg-root.light .rg-terms { color: #6a6663; }
        .rg-root.dark  .rg-terms { color: #5a5753; }
        .rg-terms input[type=checkbox] { margin-top: 2px; flex-shrink: 0; accent-color: #0e9f6e; }
        .rg-terms a { color: #1a6cf6; text-decoration: none; font-weight: 600; }

        /* ── Submit ── */
        .rg-btn-submit { width: 100%; padding: 13px; border: none; border-radius: 10px; font-family: 'Sora', sans-serif; font-size: .93rem; font-weight: 700; cursor: pointer; transition: all .25s; display: flex; align-items: center; justify-content: center; gap: 8px; color: #fff; letter-spacing: -.01em; }
        .rg-btn-submit.btn-cand { background: #0e9f6e; }
        .rg-btn-submit.btn-cand:hover:not(:disabled) { background: #0c8a60; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(14,159,110,.3); }
        .rg-btn-submit.btn-rec  { background: #1a6cf6; }
        .rg-btn-submit.btn-rec:hover:not(:disabled)  { background: #2d7cf7; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(26,108,246,.3); }
        .rg-btn-submit:disabled { opacity: .55; cursor: not-allowed; transform: none; }
        .rg-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,.3); border-top-color: #fff; border-radius: 50%; animation: spin .7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Recruiter note ── */
        .rg-rec-note { display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; border-radius: 10px; font-size: .8rem; line-height: 1.5; margin-bottom: 18px; background: rgba(26,108,246,.08); border: 1px solid rgba(26,108,246,.2); color: #4d8ff8; }

        @media (max-width: 780px) { .rg-left { display: none; } .rg-right { padding: 80px 24px 40px; align-items: flex-start; } .rg-row { grid-template-columns: 1fr; } }
      `}</style>

      <div className={`rg-root ${d ? 'dark' : 'light'}`}>

        {/* Left panel */}
        <div className="rg-left">
          <div className="rg-left-bg" /><div className="rg-left-grid" />
          <Link href="/" className="rg-brand"><span className="rg-brand-dot" /><span className="rg-brand-name">RevoGen</span></Link>
          <div className="rg-left-body">
            <h2>Start your career journey <span className="green">today</span></h2>
            <p>Create a free account and get your first resume score in under 2 minutes.</p>
            <div className="rg-steps">
              {[
                { n: '01', title: 'Create your account', sub: 'Free forever. No credit card required.' },
                { n: '02', title: 'Upload your resume', sub: 'PDF or Word — we handle both.' },
                { n: '03', title: 'Get your ATS score', sub: 'Instant analysis with actionable fixes.' },
                { n: '04', title: 'Land the interview', sub: 'Practice tests to ace every screening.' },
              ].map(s => (
                <div key={s.n} className="rg-step">
                  <div className="rg-step-line" />
                  <div className="rg-step-num">{s.n}</div>
                  <div><div className="rg-step-title">{s.title}</div><div className="rg-step-sub">{s.sub}</div></div>
                </div>
              ))}
            </div>
          </div>
          <div className="rg-left-foot">© 2025 RevoGen · Made in India</div>
        </div>

        {/* Right form panel */}
        <div className="rg-right">
          <button className="rg-theme-toggle" onClick={() => setDark(!d)}>
            <span>{d ? '☀️' : '🌙'}</span>
            <div className="toggle-track"><div className="toggle-thumb" /></div>
            <span>{d ? 'Light' : 'Dark'}</span>
          </button>

          <div className="rg-form-wrap">
            <div className="rg-form-head">
              <div className={`rg-form-tag ${isRecruiter ? 'tag-rec' : 'tag-cand'}`}>
                {isRecruiter ? 'For Recruiters' : 'Free forever'}
              </div>
              <h1 className="rg-form-title">
                {isRecruiter ? 'Hire smarter\nwith AI' : 'Create your\naccount'}
              </h1>
              <p className="rg-form-sub">Already have an account? <Link href="/login">Log in →</Link></p>
            </div>

            {/* Account type toggle */}
            <div className="rg-type-switch">
              <button
                className={`rg-type-btn ${accountType === 'candidate' ? 'active-cand' : 'inactive'}`}
                onClick={() => setAccountType('candidate')}
              >
                🎓 Candidate
              </button>
              <button
                className={`rg-type-btn ${accountType === 'recruiter' ? 'active-rec' : 'inactive'}`}
                onClick={() => setAccountType('recruiter')}
              >
                💼 Recruiter
              </button>
            </div>

            {isRecruiter && (
              <div className="rg-rec-note">
                <span style={{ fontSize: '1rem', flexShrink: 0 }}>ℹ️</span>
                <span>Recruiter accounts get full Admin dashboard access to create and assign assessments to candidates.</span>
              </div>
            )}

            {error && <div className="rg-error"><span>⚠️</span>{error}</div>}

            {/* Name + Phone */}
            <div className="rg-row">
              <div className="rg-field">
                <label className="rg-label">Full name</label>
                <input className={`rg-input${isRecruiter ? ' rec' : ''}`} type="text" placeholder="Arjun Sharma" value={name} onChange={e => setName(e.target.value)} autoComplete="name" />
              </div>
              <div className="rg-field">
                <label className="rg-label">Phone <span className="opt">(optional)</span></label>
                <div className="rg-phone-wrap">
                  <span className="rg-phone-prefix">+91</span>
                  <input
                    className={`rg-input rg-phone-input${isRecruiter ? ' rec' : ''}`}
                    type="tel"
                    placeholder="98765 43210"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    autoComplete="tel"
                  />
                </div>
              </div>
            </div>

            {/* Email + Company (recruiter only) */}
            {isRecruiter ? (
              <div className="rg-row">
                <div className="rg-field">
                  <label className="rg-label">Work email</label>
                  <input className="rg-input rec" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
                </div>
                <div className="rg-field">
                  <label className="rg-label">Company <span className="opt">(optional)</span></label>
                  <input className="rg-input rec" type="text" placeholder="Acme Corp" value={company} onChange={e => setCompany(e.target.value)} />
                </div>
              </div>
            ) : (
              <div className="rg-field">
                <label className="rg-label">Email address</label>
                <input className="rg-input" type="email" placeholder="arjun@example.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
              </div>
            )}

            {/* Password */}
            <div className="rg-row">
              <div className="rg-field">
                <label className="rg-label">Password</label>
                <div className="rg-input-wrap">
                  <input className={`rg-input has-toggle${isRecruiter ? ' rec' : ''}`} type={showPassword ? 'text' : 'password'} placeholder="Min. 8 chars" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
                  <button type="button" className="rg-eye-btn" onClick={() => setShowPassword(!showPassword)}>{showPassword ? '🙈' : '👁️'}</button>
                </div>
                {password && (
                  <div className="rg-pw-strength">
                    <div className="rg-strength-bars">
                      {[1,2,3,4].map(i => <div key={i} className="rg-strength-bar" style={{ background: i <= strength ? strengthColor : (d ? '#2a2826' : '#e5e2dc') }} />)}
                    </div>
                    <span className="rg-strength-text" style={{ color: strengthColor }}>{strengthLabel}</span>
                  </div>
                )}
              </div>
              <div className="rg-field">
                <label className="rg-label">Confirm password</label>
                <div className="rg-input-wrap">
                  <input className={`rg-input has-toggle${isRecruiter ? ' rec' : ''}`} type={showConfirm ? 'text' : 'password'} placeholder="Repeat password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} autoComplete="new-password" />
                  <button type="button" className="rg-eye-btn" onClick={() => setShowConfirm(!showConfirm)}>{showConfirm ? '🙈' : '👁️'}</button>
                </div>
                {confirmPassword && (
                  <div className="rg-match-hint" style={{ color: password === confirmPassword ? '#0e9f6e' : '#e74c3c' }}>
                    {password === confirmPassword ? '✓ Match' : '✗ No match'}
                  </div>
                )}
              </div>
            </div>

            <label className="rg-terms">
              <input type="checkbox" defaultChecked />
              <span>I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a></span>
            </label>

            <button className={`rg-btn-submit ${isRecruiter ? 'btn-rec' : 'btn-cand'}`} onClick={register} disabled={loading}>
              {loading
                ? <><div className="rg-spinner" /> Creating account…</>
                : isRecruiter
                  ? <>Create recruiter account →</>
                  : <>Create account — it's free →</>
              }
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
