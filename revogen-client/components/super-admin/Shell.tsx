'use client';

// Super admin console frame: checks the signed-in user is a super admin (the server
// enforces it on every request too), then renders the sidebar and the page.
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import '@/components/candidate/bento.css';
import './sa.css';
import { clearSession, getToken } from '@/lib/auth';
import { sa, SaError } from './api';
import { SaIcon, ToastProvider } from './ui';

const THEME_KEY = 'bx_theme';
const NAV = [
  { href: '/pro-admin', label: 'Overview', icon: 'grid' },
  { href: '/pro-admin/users', label: 'Users', icon: 'users' },
  { href: '/pro-admin/mcq', label: 'MCQ bank', icon: 'list' },
  { href: '/pro-admin/coding', label: 'Coding bank', icon: 'code' },
];

interface Me { userId: string; email: string; role: string }
const MeCtx = createContext<Me | null>(null);
export const useMe = () => useContext(MeCtx);

type Gate = { state: 'checking' } | { state: 'ok'; me: Me } | { state: 'denied'; message: string };

export default function Shell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [gate, setGate] = useState<Gate>({ state: 'checking' });
  const [navPath, setNavPath] = useState<string | null>(null);
  const [dark, setDark] = useState<boolean | null>(null);
  const navOpen = navPath === pathname;

  useEffect(() => {
    const check = async () => {
      if (!getToken()) {
        router.replace(`/login?redirect=${encodeURIComponent(pathname || '/pro-admin')}`);
        return;
      }
      try {
        const me = await sa<Me>('/me');
        setGate({ state: 'ok', me });
      } catch (e) {
        if (e instanceof SaError && e.status === 401) {
          clearSession();
          router.replace(`/login?redirect=${encodeURIComponent(pathname || '/pro-admin')}`);
          return;
        }
        setGate({ state: 'denied', message: e instanceof SaError && e.status === 403 ? 'This area is for super admins only.' : (e as Error).message });
      }
    };
    check();
    // Checked once per visit; every API call is re-checked by the server anyway.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDark(document.documentElement.getAttribute('data-bx-theme') === 'dark'), 0);
    return () => clearTimeout(t);
  }, []);

  const toggleTheme = () => {
    const next = !(dark ?? false);
    document.documentElement.setAttribute('data-bx-theme', next ? 'dark' : 'light');
    try { localStorage.setItem(THEME_KEY, next ? 'dark' : 'light'); } catch { /* private mode */ }
    setDark(next);
  };

  const signOut = () => {
    clearSession();
    router.replace('/login');
  };

  if (gate.state === 'checking') {
    return <div className="bx sa-gate"><span className="spin" />Checking access…</div>;
  }
  if (gate.state === 'denied') {
    return (
      <div className="bx sa-gate">
        <span className="ico rose" style={{ width: 52, height: 52 }}><SaIcon name="shield" size={24} /></span>
        <h1>No access</h1>
        <p>{gate.message}</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/" className="btn">Home</Link>
          <button className="btn dark" onClick={signOut}>Sign in as someone else</button>
        </div>
      </div>
    );
  }

  const active = (href: string) => (href === '/pro-admin' ? pathname === href : pathname?.startsWith(href));

  return (
    <MeCtx.Provider value={gate.me}>
      <ToastProvider>
        <div className={`bx sa${navOpen ? ' nav-open' : ''}`}>
          <aside className="sa-side" aria-label="Console navigation">
            <div className="sa-brand">
              <span className="sa-logo">R</span>
              <div>
                <b>Revogen</b>
                <span>Super admin</span>
              </div>
            </div>
            <nav className="sa-nav">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className={active(n.href) ? 'on' : ''} aria-current={active(n.href) ? 'page' : undefined}
                  onClick={() => setNavPath(null)}>
                  <SaIcon name={n.icon} />{n.label}
                </Link>
              ))}
            </nav>
            <div className="sa-side-foot">
              <button className="sa-side-btn" onClick={toggleTheme} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
                <SaIcon name={dark ? 'sun' : 'moon'} />{dark ? 'Light mode' : 'Dark mode'}
              </button>
              <div className="sa-who" title={gate.me.email}>
                <span className="avatar">{gate.me.email[0]?.toUpperCase()}</span>
                <span className="sa-who-mail">{gate.me.email}</span>
              </div>
              <button className="sa-side-btn" onClick={signOut}><SaIcon name="out" />Sign out</button>
            </div>
          </aside>
          <div className="sa-scrim" onClick={() => setNavPath(null)} />
          <div className="sa-main">
            <header className="sa-top">
              <button className="sa-burger" aria-label="Open menu" aria-expanded={navOpen} onClick={() => setNavPath(navOpen ? null : pathname)}>
                <SaIcon name="menu" />
              </button>
              <b>Revogen console</b>
            </header>
            <main className="sa-content">{children}</main>
          </div>
        </div>
      </ToastProvider>
    </MeCtx.Provider>
  );
}
