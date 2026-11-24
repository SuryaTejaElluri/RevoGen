'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/api';
import AuthShell, { AuthIcon } from './AuthShell';

export type AccountType = 'candidate' | 'recruiter';

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

// One sign-up form for /register, /register/candidate and /register/recruiter.
export default function RegisterForm({ initialType = 'candidate' }: { initialType?: AccountType }) {
  const router = useRouter();
  const [accountType, setAccountType] = useState<AccountType>(initialType);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showMailPopup, setShowMailPopup] = useState(false);

  const isRecruiter = accountType === 'recruiter';
  const strength = getStrength(password);

  const register = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name || !email || !password || !confirmPassword) { setError('Please fill in all required fields.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (strength < 2) { setError('Password too weak — add uppercase, numbers, or symbols.'); return; }
    if (phone && !/^\+?[\d\s\-()]{7,15}$/.test(phone)) { setError('Please enter a valid phone number.'); return; }
    if (!agreed) { setError('Please accept the Terms of Service and Privacy Policy.'); return; }
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone: phone || undefined, role: isRecruiter ? 'ADMIN' : 'USER' }),
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

  const goToLogin = () => { setShowMailPopup(false); router.push('/login?registered=1'); };

  return (
    <>
      <AuthShell
        kicker={isRecruiter ? 'For hiring teams' : 'For candidates'}
        title={isRecruiter
          ? <>Hire on what people<br /><em>can actually do.</em></>
          : <>Show what you<br /><em>can actually do.</em></>}
        sub={isRecruiter
          ? 'Screen resumes, run proctored MCQ and coding rounds, and shortlist on real evidence. All in one place.'
          : 'Practise with real tests, check your resume against the role you want, and take assigned tests in one dashboard.'}
        topRight={<>Have an account? <Link href="/login" className="link">Log in<AuthIcon name="arrow" size={13} /></Link></>}
      >
        <form className="form" onSubmit={register} noValidate>
          <div className="form-ico"><AuthIcon name="sparkle" size={20} /></div>
          <h2>Create your account</h2>
          <p className="lead">{isRecruiter ? 'Set up a recruiter workspace in a minute.' : 'Free for candidates. Takes a minute.'}</p>

          <div className="seg" role="tablist" aria-label="Account type">
            <button type="button" role="tab" aria-selected={!isRecruiter} className={!isRecruiter ? 'on' : ''} onClick={() => setAccountType('candidate')}>
              <AuthIcon name="cap" />Candidate
            </button>
            <button type="button" role="tab" aria-selected={isRecruiter} className={isRecruiter ? 'on' : ''} onClick={() => setAccountType('recruiter')}>
              <AuthIcon name="briefcase" />Recruiter
            </button>
          </div>

          {error && (
            <div className="alert" role="alert">
              <AuthIcon name="alert" />
              <span>{error}</span>
            </div>
          )}

          <div className="fields">
            <div className="two">
              <div className="field">
                <label htmlFor="r-name">Full name</label>
                <div className="ctl">
                  <AuthIcon name="user" />
                  <input id="r-name" type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} autoComplete="name" />
                </div>
              </div>
              <div className="field">
                <label htmlFor="r-phone">Phone <i>optional</i></label>
                <div className="ctl">
                  <AuthIcon name="phone" />
                  <input id="r-phone" type="tel" placeholder="+91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel" />
                </div>
              </div>
            </div>

            <div className="field">
              <label htmlFor="r-email">{isRecruiter ? 'Work email' : 'Email'}</label>
              <div className="ctl">
                <AuthIcon name="mail" />
                <input id="r-email" type="email" placeholder={isRecruiter ? 'name@company.com' : 'name@example.com'} value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
              </div>
            </div>

            {isRecruiter && (
              <div className="field">
                <label htmlFor="r-company">Company <i>optional</i></label>
                <div className="ctl">
                  <AuthIcon name="building" />
                  <input id="r-company" type="text" placeholder="Where you hire for" value={company} onChange={e => setCompany(e.target.value)} autoComplete="organization" />
                </div>
              </div>
            )}

            <div className="two">
              <div className="field">
                <label htmlFor="r-pass">Password</label>
                <div className="ctl">
                  <AuthIcon name="lock" />
                  <input id="r-pass" className="pad-r" type={showPassword ? 'text' : 'password'} placeholder="Min. 8 characters" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
                  <button type="button" className="eye" onClick={() => setShowPassword(s => !s)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    <AuthIcon name={showPassword ? 'eyeOff' : 'eye'} />
                  </button>
                </div>
              </div>
              <div className="field">
                <label htmlFor="r-confirm">Confirm</label>
                <div className="ctl">
                  <AuthIcon name="lock" />
                  <input id="r-confirm" className="pad-r" type={showConfirm ? 'text' : 'password'} placeholder="Repeat password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} autoComplete="new-password" />
                  <button type="button" className="eye" onClick={() => setShowConfirm(s => !s)} aria-label={showConfirm ? 'Hide password' : 'Show password'}>
                    <AuthIcon name={showConfirm ? 'eyeOff' : 'eye'} />
                  </button>
                </div>
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

            <label className="check">
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
              <span>I agree to the Terms of Service and Privacy Policy.</span>
            </label>

            <button type="submit" className="submit" disabled={loading}>
              {loading
                ? <><span className="spin" />Creating account…</>
                : <>{isRecruiter ? 'Create recruiter account' : 'Create candidate account'}<AuthIcon name="arrow" /></>}
            </button>
          </div>

          <p className="fine">Already registered? <Link href="/login">Log in instead</Link></p>
        </form>
      </AuthShell>

      {showMailPopup && (
        <div className="au au-modal" style={{ display: 'flex', minHeight: 0 }} onClick={goToLogin}>
          <div className="box" role="dialog" aria-modal="true" aria-labelledby="mail-title" onClick={e => e.stopPropagation()}>
            <div className="mi"><AuthIcon name="inbox" size={22} /></div>
            <h3 id="mail-title">Check your inbox</h3>
            <p>Your account is created. We&apos;ve sent a confirmation link to:</p>
            <div className="em"><AuthIcon name="mail" />{email || 'your email'}</div>
            <ul>
              <li>Click the link to activate your account.</li>
              <li>The link expires in 24 hours.</li>
              <li>Not there? Check your spam or junk folder.</li>
            </ul>
            <button type="button" className="submit" onClick={goToLogin}>Go to login<AuthIcon name="arrow" /></button>
          </div>
        </div>
      )}
    </>
  );
}
