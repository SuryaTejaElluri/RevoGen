'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/api';
import AuthShell, { AuthIcon } from '@/components/auth/AuthShell';

type Stage = 'loading' | 'success' | 'error';

const REDIRECT_SECONDS = 5;
const NO_TOKEN = 'No verification token found. Please use the link from your email.';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [stage, setStage] = useState<Stage>(token ? 'loading' : 'error');
  const [message, setMessage] = useState(token ? '' : NO_TOKEN);
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);
  // Verification links are single-use; make sure we only call the API once per token,
  // even when React runs effects twice in development.
  const verifiedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!token || verifiedFor.current === token) return;
    verifiedFor.current = token;

    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/verify-email?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Verification failed');
        setStage('success');
        setMessage('Your email has been verified successfully.');
      } catch (err) {
        setStage('error');
        // fetch() throws a TypeError when the server can't be reached at all.
        if (err instanceof TypeError) setMessage("Couldn't reach the server. Check your connection and open the link again.");
        else setMessage((err instanceof Error && err.message) || 'Verification failed. The link may have expired.');
      }
    })();
  }, [token]);

  // Auto-redirect countdown on success
  useEffect(() => {
    if (stage !== 'success') return;
    if (countdown <= 0) { router.push('/login'); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [stage, countdown, router]);

  const steps = [
    { label: 'Sign up', done: true },
    { label: 'Verify email', done: stage === 'success', active: stage === 'loading', failed: stage === 'error' },
    { label: 'Log in', done: false },
  ];

  return (
    <AuthShell
      kicker="Almost there"
      title={<>One click and<br /><em>you&apos;re in.</em></>}
      sub="Confirming your email keeps your account secure and makes sure test invites and results reach the right inbox."
      topRight={<>Already verified? <Link href="/login" className="link">Log in<AuthIcon name="arrow" size={13} /></Link></>}
    >
      <div className="form" role="status" aria-live="polite">
        <ol className="steps" aria-label="Sign-up progress">
          {steps.map((s, i) => (
            <li key={s.label} className={s.done ? 'done' : s.failed ? 'failed' : s.active ? 'active' : ''}>
              <span className="dot">{s.done ? <AuthIcon name="check" size={12} /> : s.failed ? '!' : i + 1}</span>
              {s.label}
            </li>
          ))}
        </ol>

        {stage === 'loading' && (
          <>
            <div className="form-ico"><span className="spin dark" /></div>
            <h2>Verifying your email</h2>
            <p className="lead">Hang tight, we&apos;re confirming your address. This only takes a moment.</p>
          </>
        )}

        {stage === 'success' && (
          <>
            <div className="form-ico" style={{ color: 'var(--ok)' }}><AuthIcon name="ok" size={20} /></div>
            <h2>Email verified</h2>
            <p className="lead">{message} Your account is ready to use.</p>
            <div className="countdown">
              <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden>
                <circle cx="20" cy="20" r="17" fill="none" stroke="var(--line2)" strokeWidth="3" />
                <circle cx="20" cy="20" r="17" fill="none" stroke="var(--ok)" strokeWidth="3" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 17}
                  strokeDashoffset={2 * Math.PI * 17 * (1 - countdown / REDIRECT_SECONDS)}
                  transform="rotate(-90 20 20)" style={{ transition: 'stroke-dashoffset 1s linear' }} />
                <text x="20" y="24.5" textAnchor="middle" fontSize="13" fill="var(--text)" fontFamily="var(--mono)">{countdown}</text>
              </svg>
              <span>Taking you to login in {countdown}s</span>
            </div>
            <Link href="/login" className="submit">Log in now<AuthIcon name="arrow" /></Link>
          </>
        )}

        {stage === 'error' && (
          <>
            <div className="form-ico" style={{ color: 'var(--bad)' }}><AuthIcon name="alert" size={20} /></div>
            <h2>We couldn&apos;t verify your email</h2>
            <p className="lead">The link may have expired or already been used.</p>
            <div className="alert" role="alert">
              <AuthIcon name="alert" />
              <span>{message}</span>
            </div>
            <ul className="tips">
              <li>If you&apos;ve already verified, just log in.</li>
              <li>Make sure you opened the most recent email we sent.</li>
              <li>Still stuck? Sign up again with the same email to get a new link.</li>
            </ul>
            <Link href="/login" className="submit">Go to login<AuthIcon name="arrow" /></Link>
            <p className="fine"><Link href="/register">Create a new account</Link></p>
          </>
        )}
      </div>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}
