'use client';

import { useState } from 'react';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/api';
import AuthShell, { AuthIcon } from '@/components/auth/AuthShell';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        setSent(true);
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

  return (
    <AuthShell
      kicker="Account recovery"
      title={<>Locked out?<br /><em>Let&apos;s get you back in.</em></>}
      sub="Enter the email on your account and we'll send a link to set a new password. Your tests and results stay exactly as they were."
      topRight={<>Remembered it? <Link href="/login" className="link">Log in<AuthIcon name="arrow" size={13} /></Link></>}
    >
      {sent ? (
        <div className="form" role="status">
          <div className="form-ico" style={{ color: 'var(--ok)' }}><AuthIcon name="inbox" size={20} /></div>
          <h2>Check your inbox</h2>
          <p className="lead">If an account exists for this email, a password reset link is on its way.</p>
          <div className="alert ok">
            <AuthIcon name="mail" />
            <span style={{ wordBreak: 'break-all' }}>{email}</span>
          </div>
          <ul className="tips">
            <li>Open the link from the same device if you can.</li>
            <li>Not there after a few minutes? Check your spam or junk folder.</li>
            <li>Wrong address? <button type="button" className="inline-link" onClick={() => setSent(false)}>Try a different email</button></li>
          </ul>
          <Link href="/login" className="submit">Back to login<AuthIcon name="arrow" /></Link>
        </div>
      ) : (
        <form className="form" onSubmit={handleSubmit} noValidate>
          <div className="form-ico"><AuthIcon name="lock" size={20} /></div>
          <h2>Reset your password</h2>
          <p className="lead">We&apos;ll email you a secure link to choose a new one.</p>

          {error && (
            <div className="alert" role="alert">
              <AuthIcon name="alert" />
              <span>{error}</span>
            </div>
          )}

          <div className="fields">
            <div className="field">
              <label htmlFor="f-email">Email</label>
              <div className="ctl">
                <AuthIcon name="mail" />
                <input id="f-email" type="email" placeholder="name@company.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" autoFocus />
              </div>
            </div>
            <button type="submit" className="submit" disabled={loading}>
              {loading ? <><span className="spin" />Sending link…</> : <>Send reset link<AuthIcon name="arrow" /></>}
            </button>
          </div>

          <p className="fine"><Link href="/login">Back to login</Link></p>
        </form>
      )}
    </AuthShell>
  );
}
