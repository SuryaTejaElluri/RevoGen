'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/api';

export default function RecruiterRegisterPage() {
  const router = useRouter();
  const [name,            setName]            = useState('');
  const [email,           setEmail]           = useState('');
  const [phone,           setPhone]           = useState('');
  const [company,         setCompany]         = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword,    setShowPassword]    = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState('');
  const [dark,            setDark]            = useState(true);
  const [showMailPopup,   setShowMailPopup]   = useState(false);

  useEffect(() => { const s = localStorage.getItem('rg_theme'); if (s === 'light') setDark(false); else setDark(true); }, []);
  useEffect(() => { localStorage.setItem('rg_theme', dark ? 'dark' : 'light'); }, [dark]);

  const getStrength = (pw: string) => {
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  };
  const strength      = getStrength(password);
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = ['', '#ef4444', '#f59e0b', '#3b82f6', '#22c55e'][strength];

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
        body: JSON.stringify({ name, email, password, phone: phone || undefined, role: 'ADMIN' }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Registration failed. Please try again.'); return; }
      setShowMailPopup(true);
    } catch {
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const d = dark;

  return (
    <>
      <style>{STYLES}</style>
      <div className={`rg-root ${d ? 'dark' : 'light'}`}>

        {/* ── Left panel ── */}
        <div className="rg-left">
          <div className="rg-left-bg" />
          <div className="rg-left-inner">
            <Link href="/" className="rg-brand">
              <span className="rg-brand-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" /></svg>
              </span>
              <span className="rg-brand-name">RevoGen <em>AI</em></span>
            </Link>

            <div className="rg-left-intro">
              <div className="rg-eyebrow"><span className="eyebrow-dot" />For Recruiters &amp; Hiring Teams</div>
              <h2>Hire Smarter.<br /><span className="hero-blue">Move Faster.</span></h2>
              <p>Create assessments, invite candidates, analyse performance, and make data-driven hiring decisions — all powered by AI.</p>
            </div>

            <div className="rg-cards">
              {[
                { icon:'📝', title:'Create Assessments',  desc:'Build MCQ + coding tests in minutes with AI assistance.' },
                { icon:'✉️', title:'Invite Candidates',   desc:'Bulk email invitations with automated reminders.' },
                { icon:'📊', title:'Analyse Performance', desc:'Leaderboards, topic breakdowns, and score comparisons.' },
                { icon:'🚀', title:'Hire Faster',         desc:'AI automation reduces time-to-hire by up to 70%.' },
              ].map((c, i) => (
                <div key={c.title} className="rg-card" style={{ animationDelay:`${i*0.07}s` }}>
                  <div className="rg-card-icon">{c.icon}</div>
                  <h3>{c.title}</h3>
                  <p>{c.desc}</p>
                </div>
              ))}
            </div>

            <div className="rg-admin-note">
              <span className="note-icon">ℹ️</span>
              Recruiter accounts get full <strong>Admin dashboard</strong> access to create, assign, and evaluate candidate assessments.
            </div>

            <div className="rg-stats">
              {[['⚡','AI Powered'],['🔒','Secure Tests'],['📊','Analytics'],['🎯','Hire Faster']].map(([icon,label]) => (
                <div key={String(label)} className="rg-stat">
                  <span className="stat-icon">{icon}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>

            <div className="rg-left-foot">
              © 2025 RevoGen AI ·{' '}
              <Link href="/register/candidate" style={{ color:'#3b82f6', textDecoration:'none', fontWeight:600 }}>
                Register as Candidate →
              </Link>
            </div>
          </div>
        </div>

        {/* ── Right form ── */}
        <div className="rg-right">
          <button className="rg-theme-toggle" onClick={() => setDark(!d)} aria-label="Toggle theme">
            <span>{d ? '☀️' : '🌙'}</span>
            <div className="toggle-track"><div className="toggle-thumb" /></div>
            <span>{d ? 'Light' : 'Dark'}</span>
          </button>

          <div className="rg-form-wrap">
            <div className="rg-form-card">

              <div className="rg-form-head">
                <div className="rg-form-tag">💼 Recruiter Account — Admin Access</div>
                <h1 className="rg-form-title">Create recruiter account</h1>
                <p className="rg-form-sub">Already have an account? <Link href="/login">Log in →</Link></p>
              </div>

              {/* Social buttons */}
              <div className="rg-oauth-row">
                <button className="rg-oauth-btn" onClick={() => alert('Coming soon!')}>
                  <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Sign up with Google
                </button>
                <button className="rg-oauth-btn" onClick={() => alert('Coming soon!')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  Sign up with LinkedIn
                </button>
              </div>

              <div className="rg-divider"><div className="rg-div-line" /><span className="rg-div-text">or sign up with email</span><div className="rg-div-line" /></div>

              {error && <div className="rg-error"><span>⚠</span>{error}</div>}

              <div className="rg-row">
                <div className="rg-field">
                  <label className="rg-label">Full name</label>
                  <input className="rg-input" type="text" placeholder="Priya Menon" value={name} onChange={e => setName(e.target.value)} autoComplete="name" />
                </div>
                <div className="rg-field">
                  <label className="rg-label">Phone <span className="opt">(optional)</span></label>
                  <div className="rg-phone-wrap">
                    <span className="rg-phone-prefix">+91</span>
                    <input className="rg-input rg-phone-input" type="tel" placeholder="98765 43210" value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel" />
                  </div>
                </div>
              </div>

              <div className="rg-row">
                <div className="rg-field">
                  <label className="rg-label">Work email</label>
                  <input className="rg-input" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
                </div>
                <div className="rg-field">
                  <label className="rg-label">Company <span className="opt">(optional)</span></label>
                  <input className="rg-input" type="text" placeholder="Acme Corp" value={company} onChange={e => setCompany(e.target.value)} />
                </div>
              </div>

              <div className="rg-row">
                <div className="rg-field">
                  <label className="rg-label">Password</label>
                  <div className="rg-input-wrap">
                    <input className="rg-input has-toggle" type={showPassword ? 'text' : 'password'} placeholder="Min. 8 chars" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
                    <button type="button" className="rg-eye-btn" onClick={() => setShowPassword(!showPassword)}>{showPassword ? '🙈' : '👁️'}</button>
                  </div>
                  {password && (
                    <div className="rg-pw-strength">
                      <div className="rg-strength-bars">
                        {[1,2,3,4].map(i => <div key={i} className="rg-strength-bar" style={{ background: i <= strength ? strengthColor : 'rgba(255,255,255,.12)' }} />)}
                      </div>
                      <span className="rg-strength-text" style={{ color: strengthColor }}>{strengthLabel}</span>
                    </div>
                  )}
                </div>
                <div className="rg-field">
                  <label className="rg-label">Confirm password</label>
                  <div className="rg-input-wrap">
                    <input className="rg-input has-toggle" type={showConfirm ? 'text' : 'password'} placeholder="Repeat password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} autoComplete="new-password" />
                    <button type="button" className="rg-eye-btn" onClick={() => setShowConfirm(!showConfirm)}>{showConfirm ? '🙈' : '👁️'}</button>
                  </div>
                  {confirmPassword && (
                    <div className="rg-match-hint" style={{ color: password === confirmPassword ? '#22c55e' : '#ef4444' }}>
                      {password === confirmPassword ? '✓ Match' : '✗ No match'}
                    </div>
                  )}
                </div>
              </div>

              <label className="rg-terms">
                <input type="checkbox" defaultChecked />
                <span>I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a></span>
              </label>

              <button className="rg-btn-submit" onClick={register} disabled={loading}>
                {loading ? <><div className="rg-spinner" /> Creating account…</> : <>Create recruiter account →</>}
              </button>

              <p className="rg-switch-link">
                Looking for a job?{' '}
                <Link href="/register/candidate">Register as Candidate →</Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Email popup ── */}
      {showMailPopup && (
        <div className="rg-popup-overlay" onClick={() => { setShowMailPopup(false); router.push('/login?registered=1'); }}>
          <div className="rg-popup" onClick={e => e.stopPropagation()}>
            <div className="rg-popup-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="3" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>
            <div className="rg-popup-dots"><div className="pd pd1" /><div className="pd pd2" /><div className="pd pd3" /></div>
            <h2 className="rg-popup-title">Check your inbox!</h2>
            <p className="rg-popup-body">Your recruiter account has been created. We&apos;ve sent a <strong>confirmation link</strong> to your email. After confirming, you&apos;ll have full Admin access.</p>
            <div className="rg-popup-email">{email || 'your email'}</div>
            <div className="rg-popup-tips">
              {["Check your spam folder if you don't see it.", "The confirmation link expires in 24 hours.", "After confirming, you'll get full Admin dashboard access."].map((tip, i) => (
                <div key={i} className="rg-popup-tip"><span className="tip-dot" />{tip}</div>
              ))}
            </div>
            <button className="rg-popup-btn" onClick={() => { setShowMailPopup(false); router.push('/login?registered=1'); }}>
              Got it — go to login →
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Styles — Recruiter (Blue primary CTA, Red accent) ──────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased}

  .rg-root{min-height:100vh;display:flex;font-family:'Inter',sans-serif}
  .rg-root.dark {background:#0a0a0a;color:#f1f5f9}
  .rg-root.light{background:#f8fafc;color:#0f172a}

  /* LEFT */
  .rg-left{width:44%;min-height:100vh;display:flex;flex-direction:column;padding:48px 44px;position:relative;overflow:hidden;flex-shrink:0}
  .rg-root.dark  .rg-left{background:#0d0d0d;border-right:1px solid rgba(255,255,255,.07)}
  .rg-root.light .rg-left{background:#0f172a}
  .rg-left-bg{position:absolute;inset:0;pointer-events:none;background:
    radial-gradient(ellipse 65% 50% at 85% 5%, rgba(59,130,246,.2) 0%,transparent 55%),
    radial-gradient(ellipse 50% 60% at 10% 90%, rgba(239,68,68,.12) 0%,transparent 55%),
    radial-gradient(ellipse 40% 35% at 55% 50%, rgba(34,197,94,.07) 0%,transparent 60%)}
  .rg-left-inner{position:relative;z-index:1;display:flex;flex-direction:column;gap:26px;height:100%}

  .rg-brand{display:flex;align-items:center;gap:10px;text-decoration:none;width:fit-content}
  .rg-brand-icon{width:36px;height:36px;border-radius:10px;flex-shrink:0;background:linear-gradient(135deg,#3b82f6,#2563eb);display:flex;align-items:center;justify-content:center;box-shadow:0 0 18px rgba(59,130,246,.4)}
  .rg-brand-icon svg{width:18px;height:18px}
  .rg-brand-name{font-size:1.15rem;font-weight:800;letter-spacing:-.03em;color:#fff}
  .rg-brand-name em{font-style:normal;color:#3b82f6}

  .rg-eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:.7rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#3b82f6;background:rgba(59,130,246,.1);border:1px solid rgba(59,130,246,.3);padding:5px 13px;border-radius:100px;width:fit-content}
  .eyebrow-dot{width:6px;height:6px;border-radius:50%;background:#ef4444;box-shadow:0 0 8px #ef4444;animation:pulseRed 2s ease-in-out infinite;flex-shrink:0}
  @keyframes pulseRed{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.75)}}

  .rg-left-intro h2{font-size:clamp(1.6rem,2.4vw,2.2rem);font-weight:900;letter-spacing:-.04em;color:#fff;line-height:1.2;margin-bottom:10px}
  .hero-blue{color:#3b82f6;text-shadow:0 0 32px rgba(59,130,246,.5)}
  .rg-left-intro p{font-size:.88rem;color:#94a3b8;line-height:1.7;max-width:95%}

  .rg-cards{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .rg-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:14px;transition:all .22s;animation:fadeUp .5s ease both;cursor:default}
  .rg-card:hover{background:rgba(59,130,246,.07);border-color:rgba(59,130,246,.25);transform:translateY(-2px)}
  .rg-card-icon{font-size:1.3rem;margin-bottom:8px}
  .rg-card h3{font-size:.8rem;font-weight:700;color:#e2e8f0;margin-bottom:4px;letter-spacing:-.01em}
  .rg-card p{font-size:.72rem;color:#64748b;line-height:1.5}

  .rg-admin-note{display:flex;align-items:flex-start;gap:10px;padding:12px 14px;border-radius:11px;font-size:.78rem;line-height:1.55;background:rgba(59,130,246,.08);border:1px solid rgba(59,130,246,.22);color:#93c5fd}
  .rg-admin-note strong{color:#bfdbfe}
  .note-icon{font-size:1rem;flex-shrink:0}

  .rg-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:auto}
  .rg-stat{display:flex;flex-direction:column;align-items:center;gap:5px;padding:10px 6px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:10px;text-align:center}
  .stat-icon{font-size:.95rem}
  .rg-stat span:last-child{font-size:.62rem;font-weight:600;color:#64748b;letter-spacing:.02em}
  .rg-left-foot{font-size:.72rem;color:#475569}
  @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}

  /* RIGHT */
  .rg-right{flex:1;display:flex;align-items:center;justify-content:center;padding:44px 40px;position:relative;overflow-y:auto}
  .rg-root.dark  .rg-right{background:#0a0a0a}
  .rg-root.light .rg-right{background:#f8fafc}

  .rg-theme-toggle{position:absolute;top:22px;right:22px;background:none;border:none;cursor:pointer;display:flex;align-items:center;gap:7px;padding:6px 12px;border-radius:100px;font-family:'Inter',sans-serif;font-size:.78rem;font-weight:600;transition:all .2s;z-index:2}
  .rg-root.dark  .rg-theme-toggle{background:rgba(255,255,255,.06);color:#94a3b8;border:1px solid rgba(255,255,255,.1)}
  .rg-root.light .rg-theme-toggle{background:#fff;color:#475569;border:1px solid #e2e8f0;box-shadow:0 1px 6px rgba(0,0,0,.06)}
  .toggle-track{width:32px;height:18px;border-radius:100px;position:relative;transition:background .25s;flex-shrink:0}
  .rg-root.dark  .toggle-track{background:#3b82f6}
  .rg-root.light .toggle-track{background:#cbd5e1}
  .toggle-thumb{position:absolute;top:2px;width:14px;height:14px;border-radius:50%;background:#fff;transition:transform .25s;box-shadow:0 1px 4px rgba(0,0,0,.3)}
  .rg-root.dark  .toggle-thumb{transform:translateX(16px)}
  .rg-root.light .toggle-thumb{transform:translateX(2px)}

  .rg-form-wrap{width:100%;max-width:460px;animation:fadeUp .4s ease both}
  .rg-form-card{border-radius:20px;padding:36px;transition:background .3s,border-color .3s}
  .rg-root.dark  .rg-form-card{background:#141414;border:1px solid rgba(255,255,255,.08);box-shadow:0 20px 60px rgba(0,0,0,.6)}
  .rg-root.light .rg-form-card{background:#fff;border:1px solid #e2e8f0;box-shadow:0 8px 40px rgba(0,0,0,.08)}

  .rg-form-head{margin-bottom:20px}
  .rg-form-tag{display:inline-block;font-size:.68rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px;color:#3b82f6;background:rgba(59,130,246,.1);border:1px solid rgba(59,130,246,.25);padding:4px 11px;border-radius:100px}
  .rg-form-title{font-size:1.65rem;font-weight:900;letter-spacing:-.04em;line-height:1.15;margin-bottom:7px}
  .rg-root.dark  .rg-form-title{color:#f1f5f9}
  .rg-root.light .rg-form-title{color:#0f172a}
  .rg-form-sub{font-size:.84rem;color:#64748b}
  .rg-form-sub a{color:#3b82f6;font-weight:600;text-decoration:none}
  .rg-form-sub a:hover{text-decoration:underline}

  .rg-oauth-row{display:flex;gap:10px;margin-bottom:16px}
  .rg-oauth-btn{flex:1;padding:10px 8px;border-radius:10px;font-family:'Inter',sans-serif;font-size:.78rem;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;transition:all .18s}
  .rg-root.dark  .rg-oauth-btn{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:#cbd5e1}
  .rg-root.dark  .rg-oauth-btn:hover{background:rgba(255,255,255,.09);border-color:rgba(255,255,255,.2)}
  .rg-root.light .rg-oauth-btn{background:#fff;border:1.5px solid #e2e8f0;color:#334155}
  .rg-root.light .rg-oauth-btn:hover{border-color:#94a3b8;background:#f8fafc}

  .rg-divider{display:flex;align-items:center;gap:10px;margin-bottom:16px}
  .rg-div-line{flex:1;height:1px}
  .rg-root.dark  .rg-div-line{background:rgba(255,255,255,.08)}
  .rg-root.light .rg-div-line{background:#e2e8f0}
  .rg-div-text{font-size:.72rem;font-weight:600;white-space:nowrap;color:#475569}

  .rg-error{display:flex;align-items:center;gap:8px;padding:10px 13px;border-radius:9px;font-size:.8rem;font-weight:500;margin-bottom:14px;animation:shake .28s ease;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);color:#ef4444}
  @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}

  .rg-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .rg-field{margin-bottom:14px}
  .rg-label{display:block;font-size:.78rem;font-weight:600;margin-bottom:5px}
  .rg-root.dark  .rg-label{color:#94a3b8}
  .rg-root.light .rg-label{color:#475569}
  .rg-label .opt{font-weight:400;opacity:.55;font-size:.72rem}
  .rg-input-wrap{position:relative}
  .rg-input{width:100%;padding:11px 14px;border-radius:9px;font-family:'Inter',sans-serif;font-size:.86rem;outline:none;transition:border-color .18s,box-shadow .18s,background .18s}
  .rg-root.dark  .rg-input{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);color:#f1f5f9}
  .rg-root.dark  .rg-input:focus{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.18);background:rgba(59,130,246,.05)}
  .rg-root.light .rg-input{background:#fff;border:1.5px solid #e2e8f0;color:#0f172a}
  .rg-root.light .rg-input:focus{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.12)}
  .rg-input::placeholder{color:#475569;opacity:.7}
  .rg-input.has-toggle{padding-right:44px}
  .rg-eye-btn{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:.9rem;color:#475569;transition:color .18s}
  .rg-eye-btn:hover{color:#3b82f6}
  .rg-phone-wrap{display:flex}
  .rg-phone-prefix{padding:11px 11px;border-radius:9px 0 0 9px;font-size:.86rem;font-weight:700;flex-shrink:0;border-right:none}
  .rg-root.dark  .rg-phone-prefix{background:rgba(59,130,246,.12);border:1px solid rgba(255,255,255,.1);color:#3b82f6}
  .rg-root.light .rg-phone-prefix{background:#eff6ff;border:1.5px solid #e2e8f0;color:#3b82f6}
  .rg-phone-input{border-radius:0 9px 9px 0 !important}

  .rg-pw-strength{margin-top:6px}
  .rg-strength-bars{display:flex;gap:3px;margin-bottom:3px}
  .rg-strength-bar{flex:1;height:3px;border-radius:100px;transition:background .3s}
  .rg-strength-text{font-size:.7rem;font-weight:700}
  .rg-match-hint{font-size:.7rem;font-weight:700;margin-top:4px}

  .rg-terms{display:flex;align-items:flex-start;gap:9px;margin-bottom:16px;font-size:.76rem;line-height:1.55;color:#64748b;cursor:pointer}
  .rg-terms input[type=checkbox]{margin-top:2px;flex-shrink:0;accent-color:#3b82f6}
  .rg-terms a{color:#3b82f6;text-decoration:none;font-weight:600}
  .rg-terms a:hover{text-decoration:underline}

  /* Submit — BLUE for recruiter */
  .rg-btn-submit{width:100%;padding:13px;border:none;border-radius:10px;font-family:'Inter',sans-serif;font-size:.9rem;font-weight:800;cursor:pointer;transition:all .22s;display:flex;align-items:center;justify-content:center;gap:8px;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff;letter-spacing:-.01em;box-shadow:0 6px 22px rgba(59,130,246,.38)}
  .rg-btn-submit:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 10px 30px rgba(59,130,246,.5)}
  .rg-btn-submit:disabled{opacity:.55;cursor:not-allowed;transform:none}
  .rg-spinner{width:15px;height:15px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .65s linear infinite}
  @keyframes spin{to{transform:rotate(360deg)}}

  .rg-switch-link{text-align:center;margin-top:14px;font-size:.78rem;color:#64748b}
  .rg-switch-link a{color:#22c55e;font-weight:700;text-decoration:none}
  .rg-switch-link a:hover{text-decoration:underline}

  /* Popup */
  .rg-popup-overlay{position:fixed;inset:0;background:rgba(0,0,0,.75);backdrop-filter:blur(8px);z-index:999;display:flex;align-items:center;justify-content:center;padding:24px;animation:fadeIn .2s ease}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  .rg-popup{background:#141414;border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:40px 36px 32px;max-width:400px;width:100%;text-align:center;box-shadow:0 30px 80px rgba(0,0,0,.7);animation:popIn .3s cubic-bezier(.34,1.56,.64,1)}
  @keyframes popIn{from{opacity:0;transform:scale(.88) translateY(14px)}to{opacity:1;transform:scale(1) translateY(0)}}
  .rg-popup-icon{width:72px;height:72px;border-radius:50%;background:rgba(59,130,246,.12);border:1px solid rgba(59,130,246,.3);display:flex;align-items:center;justify-content:center;margin:0 auto 18px;animation:bounceIn .5s cubic-bezier(.34,1.56,.64,1) .1s both}
  @keyframes bounceIn{from{opacity:0;transform:scale(.5)}to{opacity:1;transform:scale(1)}}
  .rg-popup-icon svg{width:34px;height:34px}
  .rg-popup-dots{display:flex;justify-content:center;gap:6px;margin-bottom:16px}
  .pd{width:8px;height:8px;border-radius:50%;animation:dotPop .35s cubic-bezier(.34,1.56,.64,1) both}
  .pd1{background:#3b82f6;animation-delay:.2s}
  .pd2{background:#22c55e;animation-delay:.32s}
  .pd3{background:#ef4444;animation-delay:.44s}
  @keyframes dotPop{from{opacity:0;transform:scale(0)}to{opacity:1;transform:scale(1)}}
  .rg-popup-title{font-size:1.35rem;font-weight:800;letter-spacing:-.03em;margin-bottom:8px;color:#f1f5f9}
  .rg-popup-body{font-size:.85rem;color:#64748b;line-height:1.65;margin-bottom:12px}
  .rg-popup-body strong{color:#e2e8f0;font-weight:700}
  .rg-popup-email{display:inline-block;background:rgba(59,130,246,.1);border:1px solid rgba(59,130,246,.25);border-radius:100px;padding:6px 16px;font-size:.8rem;font-weight:600;color:#3b82f6;margin-bottom:18px}
  .rg-popup-tips{text-align:left;border-radius:12px;padding:13px 15px;margin-bottom:22px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07)}
  .rg-popup-tip{display:flex;align-items:center;gap:8px;font-size:.75rem;color:#64748b;padding:4px 0}
  .tip-dot{width:5px;height:5px;border-radius:50%;background:#3b82f6;flex-shrink:0}
  .rg-popup-btn{width:100%;padding:12px;border:none;border-radius:10px;font-family:'Inter',sans-serif;font-size:.88rem;font-weight:800;cursor:pointer;color:#fff;transition:all .2s;background:linear-gradient(135deg,#3b82f6,#2563eb);box-shadow:0 6px 20px rgba(59,130,246,.35)}
  .rg-popup-btn:hover{transform:translateY(-1px);box-shadow:0 10px 28px rgba(59,130,246,.5)}

  @media(max-width:780px){.rg-root{flex-direction:column}.rg-left{width:100%;min-height:auto;padding:32px 24px 28px}.rg-right{padding:28px 20px 48px}.rg-form-card{padding:26px 22px 22px;border-radius:16px}.rg-row{grid-template-columns:1fr}.rg-theme-toggle{position:static;align-self:flex-end;margin-bottom:12px}}
  @media(max-width:480px){.rg-cards{grid-template-columns:1fr 1fr}.rg-stats{grid-template-columns:repeat(2,1fr)}}
  @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.001ms!important}}
`;
