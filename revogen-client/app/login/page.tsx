'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/api';
import { setSession } from '@/lib/auth';
import AuthShell, { AuthIcon } from '@/components/auth/AuthShell';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || null;
  const justRegistered = searchParams.get('registered') === '1';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const login = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.message || 'Login failed. Check your credentials.'); return; }
      setSession(data.access_token);
      // Honor redirect param for candidates; admins always go to their panel
      if (data.role === 'SUPER_ADMIN') router.push('/pro-admin');
      else if (data.role === 'ADMIN') router.push('/admin');
      else router.push(redirectTo || '/dashboard');
    } catch {
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      kicker="Welcome back"
      title={<>Pick up where<br />you <em>left off.</em></>}
      sub="Your tests, results and resume checks are waiting. Log in to keep hiring, or keep preparing, on evidence."
      topRight={<>New here? <Link href="/register" className="link">Create an account<AuthIcon name="arrow" size={13} /></Link></>}
    >
      <form className="form" onSubmit={login} noValidate>
        <div className="form-ico"><AuthIcon name="key" size={20} /></div>
        <h2>Log in to Revogen</h2>
        <p className="lead">Use the email you signed up with.</p>

        {justRegistered && !error && (
          <div className="alert ok" role="status">
            <AuthIcon name="ok" />
            <span>Account created. Confirm your email from the link we sent, then log in here.</span>
          </div>
        )}
        {error && (
          <div className="alert" role="alert">
            <AuthIcon name="alert" />
            <span>{error}</span>
          </div>
        )}

        <div className="fields">
          <div className="field">
            <label htmlFor="l-email">Email</label>
            <div className="ctl">
              <AuthIcon name="mail" />
              <input id="l-email" type="email" placeholder="name@company.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" autoFocus />
            </div>
          </div>
          <div className="field">
            <label htmlFor="l-pass">Password <Link href="/forgot-password">Forgot password?</Link></label>
            <div className="ctl">
              <AuthIcon name="lock" />
              <input id="l-pass" className="pad-r" type={showPassword ? 'text' : 'password'} placeholder="Your password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
              <button type="button" className="eye" onClick={() => setShowPassword(s => !s)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                <AuthIcon name={showPassword ? 'eyeOff' : 'eye'} />
              </button>
            </div>
          </div>
          <button type="submit" className="submit" disabled={loading}>
            {loading ? <><span className="spin" />Logging in…</> : <>Log in<AuthIcon name="arrow" /></>}
          </button>
        </div>

        <div className="divider">New to Revogen?</div>
        <div className="roles">
          <Link href="/register/candidate" className="role">
            <span className="ri"><AuthIcon name="cap" /></span>
            <span><b>Candidate</b><span>Practise and take tests</span></span>
          </Link>
          <Link href="/register/recruiter" className="role">
            <span className="ri"><AuthIcon name="briefcase" /></span>
            <span><b>Recruiter</b><span>Screen and hire</span></span>
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
