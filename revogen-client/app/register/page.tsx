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
  const [showMailPopup, setShowMailPopup] = useState(false);

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
  const strengthColor = ['', '#e74c3c', '#f39c12', '#4f6df5', '#0e9f6e'][strength];

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
      setShowMailPopup(true);
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
        .rg-root.light { background: linear-gradient(160deg, #f3f4fd 0%, #eef0fb 45%, #f6f3fd 100%); color: #171528; }
        .rg-root.dark  { background: linear-gradient(160deg, #08070f 0%, #0c0a1a 50%, #0a0714 100%); color: #eeeefb; }

        /* ── Left panel ── */
        .rg-left { width: 44%; min-height: 100vh; display: flex; flex-direction: column; gap: 34px; padding: 52px 48px; position: relative; overflow: hidden; flex-shrink: 0; }
        .rg-root.light .rg-left { background: linear-gradient(155deg, #1b1440 0%, #2a1b63 42%, #1c3fa0 100%); }
        .rg-root.dark  .rg-left { background: linear-gradient(155deg, #0c0918 0%, #171034 42%, #0e1c47 100%); border-right: 1px solid rgba(255,255,255,.06); }
        .rg-left-bg { position: absolute; inset: 0; background:
          radial-gradient(ellipse 60% 45% at 80% 8%, rgba(139,92,246,.35) 0%, transparent 60%),
          radial-gradient(ellipse 55% 55% at 5% 95%, rgba(59,130,246,.28) 0%, transparent 60%),
          radial-gradient(ellipse 40% 40% at 90% 90%, rgba(79,70,229,.25) 0%, transparent 65%);
          pointer-events: none; }
        .rg-left-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px); background-size: 46px 46px; mask-image: radial-gradient(ellipse 90% 80% at 50% 30%, black 30%, transparent 90%); pointer-events: none; }
        .rg-left-inner { position: relative; z-index: 1; display: flex; flex-direction: column; gap: 30px; height: 100%; animation: rgFadeIn .6s ease both; }

        .rg-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .rg-brand-mark { width: 34px; height: 34px; border-radius: 10px; background: linear-gradient(135deg, #6366f1, #8b5cf6 55%, #3b82f6); display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 18px rgba(99,102,241,.45); flex-shrink: 0; }
        .rg-brand-mark svg { width: 18px; height: 18px; }
        .rg-brand-name { font-size: 1.18rem; font-weight: 800; letter-spacing: -.03em; color: #fdfdff; }
        .rg-brand-name span { color: #a5b4fc; }

        .rg-left-intro { }
        .rg-left-eyebrow { display: inline-flex; align-items: center; gap: 7px; font-size: .72rem; font-weight: 700; letter-spacing: .09em; text-transform: uppercase; color: #c7d2fe; background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.14); padding: 6px 12px; border-radius: 100px; margin-bottom: 18px; }
        .rg-left-eyebrow .dot { width: 6px; height: 6px; border-radius: 50%; background: #34d399; animation: pulseDot 2s ease-in-out infinite; flex-shrink: 0; }
        @keyframes pulseDot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.55;transform:scale(.75)} }
        .rg-left-intro h2 { font-size: clamp(1.5rem, 2.2vw, 2.05rem); font-weight: 800; letter-spacing: -.035em; color: #fbfbff; line-height: 1.18; margin-bottom: 14px; }
        .rg-left-intro h2 .grad { background: linear-gradient(90deg, #a5b4fc, #c4b5fd 55%, #93c5fd); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .rg-left-intro p { font-size: .89rem; color: #b9bde0; line-height: 1.68; max-width: 92%; }

        /* ── Highlight cards ── */
        .rg-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .rg-card { background: rgba(255,255,255,.055); border: 1px solid rgba(255,255,255,.11); border-radius: 14px; padding: 16px 16px 15px; backdrop-filter: blur(6px); transition: transform .25s ease, background .25s ease, border-color .25s ease, box-shadow .25s ease; animation: rgFadeUp .55s ease both; }
        .rg-card:hover { transform: translateY(-3px); background: rgba(255,255,255,.09); border-color: rgba(165,180,252,.35); box-shadow: 0 14px 30px rgba(30,20,80,.35); }
        .rg-card-icon { width: 32px; height: 32px; border-radius: 9px; display: flex; align-items: center; justify-content: center; margin-bottom: 11px; }
        .rg-card-icon svg { width: 16px; height: 16px; }
        .rg-card:nth-child(1) .rg-card-icon { background: linear-gradient(135deg, #6366f1, #4f46e5); box-shadow: 0 6px 14px rgba(99,102,241,.35); }
        .rg-card:nth-child(2) .rg-card-icon { background: linear-gradient(135deg, #3b82f6, #2563eb); box-shadow: 0 6px 14px rgba(59,130,246,.35); }
        .rg-card:nth-child(3) .rg-card-icon { background: linear-gradient(135deg, #8b5cf6, #7c3aed); box-shadow: 0 6px 14px rgba(139,92,246,.35); }
        .rg-card:nth-child(4) .rg-card-icon { background: linear-gradient(135deg, #6d28d9, #4338ca); box-shadow: 0 6px 14px rgba(109,40,217,.35); }
        .rg-card h3 { font-size: .82rem; font-weight: 700; color: #f3f2ff; letter-spacing: -.01em; margin-bottom: 5px; }
        .rg-card p { font-size: .73rem; line-height: 1.5; color: #a9adcf; }

        /* ── Bottom stats ── */
        .rg-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: auto; }
        .rg-stat { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; padding: 12px 6px 12px 13px; border-radius: 12px; background: rgba(255,255,255,.045); border: 1px solid rgba(255,255,255,.09); }
        .rg-stat svg { width: 15px; height: 15px; color: #b3befd; }
        .rg-stat span { font-size: .68rem; font-weight: 600; color: #d6d8f2; letter-spacing: -.01em; line-height: 1.25; }
        .rg-left-foot { font-size: .72rem; color: #7a7fa8; }

        /* ── Right panel ── */
        .rg-right { flex: 1; display: flex; align-items: center; justify-content: center; padding: 44px; position: relative; overflow-y: auto; }
        .rg-right-bg { position: absolute; inset: 0; pointer-events: none; }
        .rg-root.light .rg-right-bg { background: radial-gradient(ellipse 50% 40% at 85% 0%, rgba(99,102,241,.08) 0%, transparent 60%); }
        .rg-root.dark  .rg-right-bg { background: radial-gradient(ellipse 50% 40% at 85% 0%, rgba(99,102,241,.12) 0%, transparent 60%); }

        .rg-theme-toggle { position: absolute; top: 26px; right: 26px; background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 8px; padding: 7px 13px; border-radius: 100px; font-family: 'Sora', sans-serif; font-size: .8rem; font-weight: 600; transition: all .2s; z-index: 2; }
        .rg-root.light .rg-theme-toggle { background: rgba(255,255,255,.7); color: #47447a; border: 1px solid rgba(99,102,241,.18); box-shadow: 0 2px 10px rgba(30,20,90,.06); }
        .rg-root.light .rg-theme-toggle:hover { background: #fff; }
        .rg-root.dark  .rg-theme-toggle { background: rgba(255,255,255,.05); color: #c7c9ec; border: 1px solid rgba(255,255,255,.1); }
        .rg-root.dark  .rg-theme-toggle:hover { background: rgba(255,255,255,.09); }
        .toggle-track { width: 36px; height: 20px; border-radius: 100px; position: relative; transition: background .25s; flex-shrink: 0; }
        .rg-root.light .toggle-track { background: #d8d9f2; }
        .rg-root.dark  .toggle-track { background: #6366f1; }
        .toggle-thumb { position: absolute; top: 2px; width: 16px; height: 16px; border-radius: 50%; background: #fff; transition: transform .25s; box-shadow: 0 1px 4px rgba(0,0,0,.3); }
        .rg-root.light .toggle-thumb { transform: translateX(2px); }
        .rg-root.dark  .toggle-thumb { transform: translateX(18px); }

        /* ── Form card (glassmorphism) ── */
        .rg-form-wrap { width: 100%; max-width: 460px; position: relative; z-index: 1; animation: rgFadeUp .55s ease both; }
        .rg-form-card { border-radius: 22px; padding: 38px 38px 34px; backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); transition: background .3s, border-color .3s, box-shadow .3s; }
        .rg-root.light .rg-form-card { background: rgba(255,255,255,.72); border: 1px solid rgba(255,255,255,.9); box-shadow: 0 24px 60px rgba(43,33,110,.1), 0 2px 8px rgba(43,33,110,.05); }
        .rg-root.dark  .rg-form-card { background: rgba(22,19,38,.6); border: 1px solid rgba(255,255,255,.08); box-shadow: 0 24px 60px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.02); }

        .rg-form-head { margin-bottom: 22px; }
        .rg-form-tag { font-size: .72rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; margin-bottom: 9px; display: inline-block; }
        .tag-cand { color: #4f46e5; }
        .tag-rec  { color: #8b5cf6; }
        .rg-form-title { font-size: 1.75rem; font-weight: 800; letter-spacing: -.04em; line-height: 1.15; margin-bottom: 8px; white-space: pre-line; }
        .rg-root.light .rg-form-title { color: #17152b; }
        .rg-root.dark  .rg-form-title { color: #f4f3fc; }
        .rg-form-sub { font-size: .86rem; }
        .rg-root.light .rg-form-sub { color: #67658c; }
        .rg-root.dark  .rg-form-sub { color: #9491b8; }
        .rg-form-sub a { color: #4f46e5; font-weight: 600; text-decoration: none; }
        .rg-root.dark .rg-form-sub a { color: #a5b4fc; }
        .rg-form-sub a:hover { text-decoration: underline; }

        /* ── Account type switcher ── */
        .rg-type-switch { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 22px; padding: 4px; border-radius: 13px; }
        .rg-root.light .rg-type-switch { background: rgba(99,102,241,.08); }
        .rg-root.dark  .rg-type-switch { background: rgba(255,255,255,.045); }
        .rg-type-btn { padding: 10px 14px; border: none; border-radius: 10px; font-family: 'Sora', sans-serif; font-size: .85rem; font-weight: 600; cursor: pointer; transition: all .2s; display: flex; align-items: center; justify-content: center; gap: 7px; }
        .rg-type-btn.inactive { background: transparent; }
        .rg-root.light .rg-type-btn.inactive { color: #6f6c96; }
        .rg-root.dark  .rg-type-btn.inactive { color: #8583ab; }
        .rg-type-btn.inactive:hover { color: #4f46e5; }
        .rg-type-btn.active-cand { background: linear-gradient(135deg, #6366f1, #4f46e5); color: #fff; box-shadow: 0 4px 16px rgba(79,70,229,.35); }
        .rg-type-btn.active-rec  { background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: #fff; box-shadow: 0 4px 16px rgba(139,92,246,.35); }

        /* ── Form fields ── */
        .rg-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .rg-field { margin-bottom: 16px; }
        .rg-label { display: block; font-size: .8rem; font-weight: 600; margin-bottom: 6px; }
        .rg-root.light .rg-label { color: #423f66; }
        .rg-root.dark  .rg-label { color: #b3b0d6; }
        .rg-label .opt { font-weight: 400; opacity: .6; font-size: .74rem; margin-left: 4px; }
        .rg-input-wrap { position: relative; }
        .rg-input { width: 100%; padding: 12px 16px; border-radius: 11px; font-family: 'Sora', sans-serif; font-size: .88rem; outline: none; transition: border-color .2s, box-shadow .2s, background .2s; }
        .rg-root.light .rg-input { background: rgba(255,255,255,.85); border: 1.5px solid rgba(99,102,241,.15); color: #17152b; }
        .rg-root.light .rg-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,.12); background: #fff; }
        .rg-root.dark  .rg-input { background: rgba(255,255,255,.04); border: 1.5px solid rgba(255,255,255,.09); color: #f4f3fc; }
        .rg-root.dark  .rg-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,.18); background: rgba(255,255,255,.06); }
        .rg-input.rec:focus { box-shadow: 0 0 0 3px rgba(139,92,246,.18) !important; }
        .rg-root.light .rg-input.rec:focus { border-color: #8b5cf6 !important; }
        .rg-root.dark  .rg-input.rec:focus { border-color: #8b5cf6 !important; }
        .rg-input::placeholder { color: #9694b8; }
        .rg-input.has-toggle { padding-right: 46px; }
        .rg-eye-btn { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: .95rem; color: #9694b8; transition: color .2s; }
        .rg-eye-btn:hover { color: #4f46e5; }

        /* ── Phone input ── */
        .rg-phone-wrap { display: flex; gap: 0; }
        .rg-phone-prefix { padding: 12px 12px; border-radius: 11px 0 0 11px; font-size: .88rem; font-weight: 600; flex-shrink: 0; border: 1.5px solid rgba(99,102,241,.15); border-right: none; }
        .rg-root.light .rg-phone-prefix { background: rgba(99,102,241,.07); color: #55527c; }
        .rg-root.dark  .rg-phone-prefix { background: rgba(255,255,255,.05); color: #b3b0d6; border-color: rgba(255,255,255,.09); }
        .rg-phone-input { border-radius: 0 11px 11px 0 !important; }

        /* ── Password strength ── */
        .rg-pw-strength { margin-top: 7px; }
        .rg-strength-bars { display: flex; gap: 4px; margin-bottom: 4px; }
        .rg-strength-bar { flex: 1; height: 3px; border-radius: 100px; transition: background .3s; }
        .rg-strength-text { font-size: .72rem; font-weight: 600; }
        .rg-match-hint { font-size: .72rem; font-weight: 600; margin-top: 5px; }

        /* ── Error ── */
        .rg-error { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 10px; font-size: .82rem; font-weight: 500; margin-bottom: 16px; animation: shakeIn .3s ease; background: #fff1f0; border: 1px solid #fecaca; color: #c0392b; }
        .rg-root.dark .rg-error { background: rgba(192,57,43,.15); border-color: rgba(192,57,43,.3); color: #f87171; }
        @keyframes shakeIn { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-4px)} 40%,80%{transform:translateX(4px)} }

        /* ── Terms ── */
        .rg-terms { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 18px; font-size: .78rem; line-height: 1.5; }
        .rg-root.light .rg-terms { color: #67658c; }
        .rg-root.dark  .rg-terms { color: #9491b8; }
        .rg-terms input[type=checkbox] { margin-top: 2px; flex-shrink: 0; accent-color: #4f46e5; }
        .rg-terms a { color: #4f46e5; text-decoration: none; font-weight: 600; }
        .rg-root.dark .rg-terms a { color: #a5b4fc; }

        /* ── Submit ── */
        .rg-btn-submit { width: 100%; padding: 13.5px; border: none; border-radius: 11px; font-family: 'Sora', sans-serif; font-size: .93rem; font-weight: 700; cursor: pointer; transition: all .25s; display: flex; align-items: center; justify-content: center; gap: 8px; color: #fff; letter-spacing: -.01em; }
        .rg-btn-submit.btn-cand { background: linear-gradient(135deg, #6366f1, #4f46e5); }
        .rg-btn-submit.btn-cand:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 26px rgba(79,70,229,.4); }
        .rg-btn-submit.btn-rec  { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
        .rg-btn-submit.btn-rec:hover:not(:disabled)  { transform: translateY(-2px); box-shadow: 0 10px 26px rgba(139,92,246,.4); }
        .rg-btn-submit:disabled { opacity: .55; cursor: not-allowed; transform: none; }
        .rg-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,.3); border-top-color: #fff; border-radius: 50%; animation: spin .7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Recruiter note ── */
        .rg-rec-note { display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; border-radius: 11px; font-size: .8rem; line-height: 1.5; margin-bottom: 18px; background: rgba(139,92,246,.09); border: 1px solid rgba(139,92,246,.22); color: #8b5cf6; }
        .rg-root.dark .rg-rec-note { color: #c4b5fd; }

        @keyframes rgFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes rgFadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        @media (max-width: 940px) {
          .rg-cards { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 780px) {
          .rg-root { flex-direction: column; }
          .rg-left { width: 100%; min-height: auto; padding: 40px 24px 34px; gap: 24px; }
          .rg-left-inner { gap: 22px; }
          .rg-cards { grid-template-columns: 1fr 1fr; }
          .rg-stats { grid-template-columns: 1fr 1fr; }
          .rg-right { padding: 32px 20px 48px; }
          .rg-form-card { padding: 30px 24px 26px; border-radius: 18px; }
          .rg-row { grid-template-columns: 1fr; }
          .rg-theme-toggle { position: static; align-self: flex-end; margin-bottom: 14px; }
        }
        @media (max-width: 460px) {
          .rg-cards { grid-template-columns: 1fr; }
        }

        /* ── Mail confirmation popup ── */
        .rg-popup-overlay { position: fixed; inset: 0; background: rgba(10,7,20,.65); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); z-index: 999; display: flex; align-items: center; justify-content: center; padding: 24px; animation: fadeInOverlay .25s ease; }
        @keyframes fadeInOverlay { from { opacity: 0; } to { opacity: 1; } }
        .rg-popup { background: #fff; border-radius: 22px; padding: 44px 40px 36px; max-width: 420px; width: 100%; text-align: center; box-shadow: 0 32px 80px rgba(30,20,80,.3), 0 0 0 1px rgba(0,0,0,.04); animation: popupIn .35s cubic-bezier(.34,1.56,.64,1); position: relative; }
        .rg-root.dark .rg-popup { background: #171430; border: 1px solid rgba(255,255,255,.08); box-shadow: 0 32px 80px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.05); }
        @keyframes popupIn { from { opacity: 0; transform: scale(.85) translateY(16px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .rg-popup-icon { width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #eef0ff 0%, #e3e0fd 100%); display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; animation: iconBounce .6s cubic-bezier(.34,1.56,.64,1) .15s both; }
        .rg-root.dark .rg-popup-icon { background: linear-gradient(135deg, rgba(99,102,241,.22) 0%, rgba(139,92,246,.12) 100%); }
        @keyframes iconBounce { from { opacity: 0; transform: scale(.5); } to { opacity: 1; transform: scale(1); } }
        .rg-popup-icon svg { width: 38px; height: 38px; }
        .rg-popup-dots { display: flex; justify-content: center; gap: 6px; margin-bottom: 20px; }
        .rg-popup-dot { width: 8px; height: 8px; border-radius: 50%; background: #4f46e5; animation: dotPop .4s cubic-bezier(.34,1.56,.64,1) both; }
        .rg-popup-dot:nth-child(1) { animation-delay: .3s; }
        .rg-popup-dot:nth-child(2) { animation-delay: .42s; background: #7c3aed; }
        .rg-popup-dot:nth-child(3) { animation-delay: .54s; background: #3b82f6; }
        @keyframes dotPop { from { opacity: 0; transform: scale(0); } to { opacity: 1; transform: scale(1); } }
        .rg-popup-title { font-size: 1.45rem; font-weight: 800; letter-spacing: -.03em; margin-bottom: 10px; animation: fadeSlideUp .35s ease .25s both; }
        .rg-root.light .rg-popup-title { color: #17152b; }
        .rg-root.dark  .rg-popup-title { color: #f4f3fc; }
        .rg-popup-body { font-size: .88rem; line-height: 1.65; margin-bottom: 28px; animation: fadeSlideUp .35s ease .32s both; }
        .rg-root.light .rg-popup-body { color: #67658c; }
        .rg-root.dark  .rg-popup-body { color: #a29ecb; }
        .rg-popup-body strong { font-weight: 700; }
        .rg-root.light .rg-popup-body strong { color: #17152b; }
        .rg-root.dark  .rg-popup-body strong { color: #d8d6f2; }
        .rg-popup-email-box { display: inline-flex; align-items: center; gap: 8px; background: rgba(99,102,241,.08); border-radius: 100px; padding: 7px 14px 7px 10px; font-size: .8rem; font-weight: 600; color: #423f66; margin-bottom: 20px; animation: fadeSlideUp .35s ease .38s both; }
        .rg-root.dark .rg-popup-email-box { background: rgba(255,255,255,.06); color: #c7c9ec; }
        .rg-popup-email-box svg { width: 14px; height: 14px; color: #4f46e5; flex-shrink: 0; }
        .rg-popup-tips { text-align: left; border-radius: 13px; padding: 14px 16px; margin-bottom: 24px; animation: fadeSlideUp .35s ease .44s both; }
        .rg-root.light .rg-popup-tips { background: #f6f5fd; border: 1px solid rgba(99,102,241,.14); }
        .rg-root.dark  .rg-popup-tips { background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.08); }
        .rg-popup-tip { display: flex; align-items: center; gap: 8px; font-size: .77rem; margin-bottom: 7px; }
        .rg-popup-tip:last-child { margin-bottom: 0; }
        .rg-popup-tip span.dot { width: 5px; height: 5px; border-radius: 50%; background: #4f46e5; flex-shrink: 0; }
        .rg-root.light .rg-popup-tip { color: #67658c; }
        .rg-root.dark  .rg-popup-tip { color: #9491b8; }
        .rg-popup-btn { width: 100%; padding: 13px; border: none; border-radius: 11px; font-family: 'Sora', sans-serif; font-size: .9rem; font-weight: 700; cursor: pointer; background: linear-gradient(135deg, #6366f1, #4f46e5); color: #fff; transition: all .2s; animation: fadeSlideUp .35s ease .5s both; }
        .rg-popup-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 22px rgba(79,70,229,.35); }
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div className={`rg-root ${d ? 'dark' : 'light'}`}>

        {/* Left panel — branding & product introduction */}
        <div className="rg-left">
          <div className="rg-left-bg" /><div className="rg-left-grid" />
          <div className="rg-left-inner">
            <Link href="/" className="rg-brand">
              <span className="rg-brand-mark">
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" /></svg>
              </span>
              <span className="rg-brand-name">RevoGen <span>AI</span></span>
            </Link>

            <div className="rg-left-intro">
              <div className="rg-left-eyebrow"><span className="dot" />AI-Powered Coding Assessments &amp; Career Platform</div>
              <h2>Prepare for interviews. <span className="grad">Hire with confidence.</span></h2>
              <p>Help candidates prepare for technical interviews while enabling organizations to conduct secure online coding assessments.</p>
            </div>

            <div className="rg-cards">
              <div className="rg-card">
                <div className="rg-card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m8 9-4 3 4 3M16 9l4 3-4 3M13 6l-2 12" /></svg></div>
                <h3>Coding Assessments</h3>
                <p>Conduct secure online coding tests with multiple difficulty levels and real-time evaluation.</p>
              </div>
              <div className="rg-card">
                <div className="rg-card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10M18 20V4M6 20v-4" /></svg></div>
                <h3>Practice &amp; Improve</h3>
                <p>Practice coding problems, strengthen problem-solving skills, and prepare for interviews.</p>
              </div>
              <div className="rg-card">
                <div className="rg-card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18M7 15l4-5 3 3 5-7" /></svg></div>
                <h3>Track Your Progress</h3>
                <p>View completed assessments, coding attempts, scores, and performance history.</p>
              </div>
              <div className="rg-card">
                <div className="rg-card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z M14 2v6h6M9 15l2 2 4-4" /></svg></div>
                <h3>ATS Resume Analysis</h3>
                <p>Upload your resume, receive ATS scores, identify missing skills, and improve employability.</p>
              </div>
            </div>

            <div className="rg-stats">
              <div className="rg-stat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" /></svg><span>AI Powered</span></div>
              <div className="rg-stat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 4 5v6c0 5 3.4 8.7 8 11 4.6-2.3 8-6 8-11V5l-8-3Z" /></svg><span>Secure Assessments</span></div>
              <div className="rg-stat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m8 9-4 3 4 3M16 9l4 3-4 3M13 6l-2 12" /></svg><span>Practice Coding</span></div>
              <div className="rg-stat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z M14 2v6h6M9 15l2 2 4-4" /></svg><span>Resume ATS</span></div>
            </div>

            <div className="rg-left-foot">© 2025 RevoGen AI · Made in India</div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="rg-right">
          <div className="rg-right-bg" />
          <button className="rg-theme-toggle" onClick={() => setDark(!d)}>
            <span>{d ? '☀️' : '🌙'}</span>
            <div className="toggle-track"><div className="toggle-thumb" /></div>
            <span>{d ? 'Light' : 'Dark'}</span>
          </button>

          <div className="rg-form-wrap">
            <div className="rg-form-card">
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
                        {[1,2,3,4].map(i => <div key={i} className="rg-strength-bar" style={{ background: i <= strength ? strengthColor : (d ? 'rgba(255,255,255,.09)' : 'rgba(99,102,241,.14)') }} />)}
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
      </div>

      {/* ── Email confirmation popup ── */}
      {showMailPopup && (
        <div className="rg-popup-overlay" onClick={() => { setShowMailPopup(false); router.push('/login?registered=1'); }}>
          <div className="rg-popup" onClick={e => e.stopPropagation()}>
            {/* Icon */}
            <div className="rg-popup-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="3" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>

            {/* Animated dots */}
            <div className="rg-popup-dots">
              <div className="rg-popup-dot" /><div className="rg-popup-dot" /><div className="rg-popup-dot" />
            </div>

            <h2 className="rg-popup-title">Check your inbox!</h2>

            <p className="rg-popup-body">
              Your account has been created successfully. We've sent a <strong>confirmation link</strong> to your email address.
            </p>

            <div className="rg-popup-email-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" />
              </svg>
              {email || 'your email'}
            </div>

            <div className="rg-popup-tips">
              {[
                "Check your spam or junk folder if you don't see it.",
                'The confirmation link expires in 24 hours.',
                'Click the link to activate your account.',
              ].map((tip, i) => (
                <div key={i} className="rg-popup-tip"><span className="dot" />{tip}</div>
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