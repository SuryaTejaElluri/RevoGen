'use client';

import { clearSession, getToken } from '@/lib/auth';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import './candidate/bento.css';

// Candidate area navigation (Bento theme). Render inside a `.bx` root.

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: 'home' },
  { href: '/assigned-tests', label: 'Assigned tests', icon: 'clip' },
  { href: '/practice', label: 'Practice', icon: 'bolt' },
  { href: '/my-results', label: 'Results', icon: 'chart' },
  { href: '/resumes', label: 'Resumes', icon: 'file' },
];

export const BX_ICONS: Record<string, React.ReactNode> = {
  home: <><path d="M3 9.5L10 4l7 5.5V16a1 1 0 01-1 1h-4v-4.5H8V17H4a1 1 0 01-1-1V9.5z" /></>,
  clip: <><rect x="4.5" y="3.5" width="11" height="14" rx="2" /><path d="M7.5 3.5V2.5h5v1M7.5 9h5M7.5 12.5h3" /></>,
  bolt: <><path d="M11 2.5L4.5 11H10l-1 6.5L15.5 9H10l1-6.5z" /></>,
  chart: <><path d="M3.5 16.5h13M6 13.5V9M10 13.5V5.5M14 13.5v-3" /></>,
  file: <><path d="M11 2.5H5.5A1.5 1.5 0 004 4v12a1.5 1.5 0 001.5 1.5h9A1.5 1.5 0 0016 16V7.5l-5-5z" /><path d="M11 2.5v5h5" /></>,
  out: <><path d="M8 17H4.5A1.5 1.5 0 013 15.5v-11A1.5 1.5 0 014.5 3H8M13 14l4-4-4-4M17 10H8" /></>,
  arrow: <><path d="M4 10h11M11 5.5l4.5 4.5-4.5 4.5" /></>,
  code: <><path d="M7 5.5L2.5 10 7 14.5M13 5.5l4.5 4.5-4.5 4.5" /></>,
  list: <><path d="M7 5.5h9M7 10h9M7 14.5h9" /><circle cx="3.75" cy="5.5" r=".75" /><circle cx="3.75" cy="10" r=".75" /><circle cx="3.75" cy="14.5" r=".75" /></>,
  clock: <><circle cx="10" cy="10" r="7" /><path d="M10 6.5V10l2.5 1.5" /></>,
  shield: <><path d="M10 2.5l6 2.5v4.5c0 4-2.6 6.9-6 8-3.4-1.1-6-4-6-8V5l6-2.5z" /></>,
  check: <><path d="M4 10.5l3.5 3.5L16 5.5" /></>,
  x: <><path d="M5 5l10 10M15 5L5 15" /></>,
  upload: <><path d="M10 13V3.5M6 7.5l4-4 4 4M3.5 13.5v2A1.5 1.5 0 005 17h10a1.5 1.5 0 001.5-1.5v-2" /></>,
  target: <><circle cx="10" cy="10" r="7" /><circle cx="10" cy="10" r="3.5" /><circle cx="10" cy="10" r=".6" /></>,
  spark: <><path d="M10 2.5l1.6 4.4 4.4 1.6-4.4 1.6L10 14.5l-1.6-4.4L4 8.5l4.4-1.6L10 2.5z" /></>,
  trophy: <><path d="M6.5 3.5h7v4a3.5 3.5 0 01-7 0v-4zM6.5 5H3.5v1a3 3 0 003 3M13.5 5h3v1a3 3 0 01-3 3M10 11v3M7 17h6M8 14h4v3H8z" /></>,
  menu: <><path d="M3 5.5h14M3 10h14M3 14.5h14" /></>,
  play: <><path d="M6.5 4.5v11l9-5.5-9-5.5z" /></>,
  alert: <><circle cx="10" cy="10" r="7.5" /><path d="M10 6.5v4M10 13.5h.01" /></>,
  eye: <><path d="M1.5 10S4.5 4 10 4s8.5 6 8.5 6-3 6-8.5 6-8.5-6-8.5-6z" /><circle cx="10" cy="10" r="2.5" /></>,
  trash: <><path d="M4 6h12M8 6V4.5h4V6M5.5 6l.8 10.5h7.4L14.5 6" /></>,
  calendar: <><rect x="3" y="4.5" width="14" height="12.5" rx="2" /><path d="M3 8.5h14M7 2.5v4M13 2.5v4" /></>,
};

export function Icon({ name, size = 18 }: { name: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {BX_ICONS[name]}
    </svg>
  );
}

function emailFromToken(): string {
  try {
    const token = getToken();
    if (!token) return '';
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload?.email === 'string' ? payload.email : '';
  } catch {
    return '';
  }
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  // Menus remember the page they were opened on, so they close after navigating.
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const [drawerPath, setDrawerPath] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const whoRef = useRef<HTMLDivElement>(null);

  const menuOpen = menuPath === pathname;
  const drawerOpen = drawerPath === pathname;

  useEffect(() => {
    // Read the signed-in email after mount (the token lives in a browser cookie).
    const t = setTimeout(() => setEmail(emailFromToken()), 0);
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { clearTimeout(t); window.removeEventListener('scroll', onScroll); };
  }, []);

  // Close the account menu on outside click.
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => { if (!whoRef.current?.contains(e.target as Node)) setMenuPath(null); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [menuOpen]);

  const logout = () => {
    clearSession();
    router.push('/login');
  };

  const initial = (email || '?').charAt(0).toUpperCase();
  const isOn = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className={`nav${scrolled ? ' sc' : ''}`}>
      <div className="nav-in">
        <Link href="/dashboard" className="brand">
          <img src="/revogen-icon.svg" alt="" width={26} height={26} />
          Revogen
        </Link>

        <ul className="links">
          {NAV_ITEMS.map(item => (
            <li key={item.href}>
              <Link href={item.href} className={isOn(item.href) ? 'on' : undefined} aria-current={isOn(item.href) ? 'page' : undefined}>
                <Icon name={item.icon} size={15} />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="who" ref={whoRef}>
          <button className="who-btn" onClick={() => setMenuPath(menuOpen ? null : pathname)} aria-haspopup="menu" aria-expanded={menuOpen}>
            <span className="avatar">{initial}</span>
            <span className="em">{email || 'Account'}</span>
          </button>
          {menuOpen && (
            <div className="menu" role="menu">
              {email && <div className="hd">Signed in as<br /><b style={{ color: 'var(--ink)' }}>{email}</b></div>}
              <div className="sep" />
              <button className="mi danger" role="menuitem" onClick={logout}><Icon name="out" size={16} />Sign out</button>
            </div>
          )}
        </div>

        <button className="burger" onClick={() => setDrawerPath(drawerOpen ? null : pathname)} aria-label={drawerOpen ? 'Close menu' : 'Open menu'} aria-expanded={drawerOpen}>
          <Icon name={drawerOpen ? 'x' : 'menu'} />
        </button>
      </div>

      <nav className={`drawer${drawerOpen ? ' open' : ''}`}>
        {NAV_ITEMS.map(item => (
          <Link key={item.href} href={item.href} className={isOn(item.href) ? 'on' : undefined}>
            <Icon name={item.icon} size={16} />
            {item.label}
          </Link>
        ))}
        <button onClick={logout}><Icon name="out" size={16} />Sign out{email ? ` (${email})` : ''}</button>
      </nav>
    </header>
  );
}
