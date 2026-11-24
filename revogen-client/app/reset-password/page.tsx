'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/api';
import AuthShell, { AuthIcon } from '@/components/auth/AuthShell';

type Stage = 'validating' | 'form' | 'expired' | 'success';

const STRENGTH_LABEL = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLOR = ['', '#F87171', '#FBBF24', '#818CF8', '#4ADE80'];

function getStrength(pw: string) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [stage, setStage] = useState<Stage>(token ? 'validating' : 'expired');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(2);

  const strength = getStrength(password);

  // Validate the reset link on load
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetch(`${API_BASE_URL}/auth/validate-reset-token?token=${encodeURIComponent(token)}`)
      .then(res => res.json())
      .then(data => { if (!cancelled) setStage(data.valid ? 'form' : 'expired'); })
      .catch(() => { if (!cancelled) setStage('expired'); });
    return () => { cancelled = true; };
  }, [token]);

  // Countdown redirect after success
  useEffect(() => {
    if (stage !== 'success') return;
    if (countdown <= 0) { router.push('/login'); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [stage, countdown, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <AuthShell
      kicker="Account recovery"
      title={<>A fresh password,<br /><em>same account.</em></>}
      sub="Choose a new password for your Revogen account. Everything else, including your tests, results and resume checks, stays as it was."
      topRight={<>Remembered it? <Link href="/login" className="link">Log in<AuthIcon name="arrow" size={13} /></Link></>}
    >
      {stage === 'validating' && (
        <div className="form center" role="status">
          <div className="big-spin" style={{ marginBottom: 20 }} />
          <h2>Checking your link</h2>
          <p className="lead">One moment while we make sure this reset link is still valid.</p>
        </div>
      )}

      {stage === 'expired' && (
        <div className="form" role="alert">
          <div className="form-ico" style={{ color: 'var(--warn)' }}><AuthIcon name="alert" size={20} /></div>
          <h2>This link has expired</h2>
          <p className="lead">Reset links only work once and for a limited time. Request a new one and use it straight away.</p>
          <Link href="/forgot-password" className="submit">Request a new link<AuthIcon name="arrow" /></Link>
          <p className="fine"><Link href="/login">Back to login</Link></p>
        </div>
      )}

      {stage === 'success' && (
        <div className="form" role="status">
          <div className="form-ico" style={{ color: 'var(--ok)' }}><AuthIcon name="ok" size={20} /></div>
          <h2>Password updated</h2>
          <p className="lead">You can now log in with your new password.</p>
          <div className="alert ok">
            <AuthIcon name="arrow" />
            <span>Taking you to login{countdown > 0 ? ` in ${countdown}s` : '…'}</span>
          </div>
          <Link href="/login" className="submit">Log in now<AuthIcon name="arrow" /></Link>
        </div>
      )}

      {stage === 'form' && (
        <form className="form" onSubmit={handleSubmit} noValidate>
          <div className="form-ico"><AuthIcon name="key" size={20} /></div>
          <h2>Set a new password</h2>
          <p className="lead">At least 8 characters. Mix in capitals, numbers or symbols to make it stronger.</p>

          {error && (
            <div className="alert" role="alert">
              <AuthIcon name="alert" />
              <span>{error}</span>
            </div>
          )}

          <div className="fields">
            <div className="field">
              <label htmlFor="rp-pass">New password</label>
              <div className="ctl">
                <AuthIcon name="lock" />
                <input id="rp-pass" className="pad-r" type={showPw ? 'text' : 'password'} placeholder="Min. 8 characters" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" autoFocus />
                <button type="button" className="eye" onClick={() => setShowPw(s => !s)} aria-label={showPw ? 'Hide password' : 'Show password'}>
                  <AuthIcon name={showPw ? 'eyeOff' : 'eye'} />
                </button>
              </div>
            </div>
            {password && (
              <div className="meter" aria-live="polite">
                <div className="meter-bars">
                  {[1, 2, 3, 4].map(i => <i key={i} style={i <= strength ? { background: STRENGTH_COLOR[strength] } : undefined} />)}
                </div>
                <span style={{ color: STRENGTH_COLOR[strength] }}>{STRENGTH_LABEL[strength] || 'Too short'}</span>
              </div>
            )}
            <div className="field">
              <label htmlFor="rp-confirm">Confirm new password</label>
              <div className="ctl">
                <AuthIcon name="lock" />
                <input id="rp-confirm" className="pad-r" type={showConfirm ? 'text' : 'password'} placeholder="Repeat password" value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" />
                <button type="button" className="eye" onClick={() => setShowConfirm(s => !s)} aria-label={showConfirm ? 'Hide password' : 'Show password'}>
                  <AuthIcon name={showConfirm ? 'eyeOff' : 'eye'} />
                </button>
              </div>
            </div>
            <button type="submit" className="submit" disabled={loading}>
              {loading ? <><span className="spin" />Saving…</> : <>Update password<AuthIcon name="arrow" /></>}
            </button>
          </div>
        </form>
      )}
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}
