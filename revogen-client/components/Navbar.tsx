'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');

  .rg-nav-outer {
    position: sticky;
    top: 0;
    z-index: 1000;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 14px 20px;
    pointer-events: none;
  }

  .rg-nav-pill {
    pointer-events: all;
    width: 100%;
    max-width: 1100px;
    height: 52px;
    background: #111113;
    border-radius: 999px;
    display: flex;
    align-items: center;
    padding: 0 6px 0 6px;
    gap: 0;
    box-shadow:
      0 2px 8px rgba(0,0,0,0.35),
      0 8px 32px rgba(0,0,0,0.28),
      0 0 0 1px rgba(255,255,255,0.07) inset;
    font-family: 'DM Sans', system-ui, sans-serif;
  }

  /* ── Logo icon ── */
  .rg-pill-logo {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: #000;
    border: 1.5px solid rgba(255,255,255,0.10);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    text-decoration: none;
    transition: border-color 0.15s;
    margin-right: 4px;
  }
  .rg-pill-logo:hover { border-color: rgba(255,255,255,0.25); }

  /* ── Nav links ── */
  .rg-pill-links {
    display: flex;
    align-items: center;
    gap: 0;
    flex: 1;
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .rg-pill-link {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 999px;
    font-size: 13.5px;
    font-weight: 500;
    color: rgba(255,255,255,0.55);
    text-decoration: none;
    letter-spacing: -0.01em;
    transition: color 0.15s, background 0.15s;
    white-space: nowrap;
    line-height: 1;
  }

  .rg-pill-link:hover {
    color: rgba(255,255,255,0.90);
    background: rgba(255,255,255,0.07);
  }

  .rg-pill-link.active {
    color: #fff;
    background: rgba(255,255,255,0.10);
  }

  /* ── Right: email pill ── */
  .rg-pill-right {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
    flex-shrink: 0;
    padding-right: 2px;
  }

  .rg-email-pill {
    display: flex;
    align-items: center;
    height: 36px;
    padding: 0 16px;
    border-radius: 999px;
    background: #fff;
    color: #111;
    font-size: 13px;
    font-weight: 500;
    font-family: 'DM Sans', system-ui, sans-serif;
    letter-spacing: -0.01em;
    white-space: nowrap;
    cursor: pointer;
    border: none;
    transition: background 0.15s, color 0.15s;
    text-decoration: none;
    gap: 7px;
  }

  .rg-email-pill:hover {
    background: #f0f0f0;
  }

  .rg-signout-pill {
    display: flex;
    align-items: center;
    height: 36px;
    padding: 0 15px;
    border-radius: 999px;
    background: transparent;
    color: rgba(255,255,255,0.45);
    font-size: 13px;
    font-weight: 500;
    font-family: 'DM Sans', system-ui, sans-serif;
    border: 1.5px solid rgba(255,255,255,0.10);
    cursor: pointer;
    letter-spacing: -0.01em;
    transition: color 0.15s, border-color 0.15s, background 0.15s;
    gap: 6px;
  }

  .rg-signout-pill:hover {
    color: rgba(239,68,68,0.9);
    border-color: rgba(239,68,68,0.3);
    background: rgba(239,68,68,0.07);
  }

  /* ── Hamburger ── */
  .rg-burger {
    display: none;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 4px;
    width: 36px;
    height: 36px;
    cursor: pointer;
    border-radius: 999px;
    border: 1.5px solid rgba(255,255,255,0.10);
    background: transparent;
    padding: 0;
    transition: border-color 0.15s;
    flex-shrink: 0;
  }
  .rg-burger:hover { border-color: rgba(255,255,255,0.25); }

  .rg-burger span {
    display: block;
    width: 14px;
    height: 1.5px;
    background: rgba(255,255,255,0.6);
    border-radius: 2px;
    transition: transform 0.22s cubic-bezier(.4,0,.2,1), opacity 0.16s;
    transform-origin: center;
  }
  .rg-burger.open span:nth-child(1) { transform: translateY(5.5px) rotate(45deg); }
  .rg-burger.open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
  .rg-burger.open span:nth-child(3) { transform: translateY(-5.5px) rotate(-45deg); }

  /* ── Mobile drawer (drops below pill) ── */
  .rg-drawer {
    display: none;
    position: fixed;
    top: 80px;
    left: 20px;
    right: 20px;
    z-index: 999;
    background: #111113;
    border-radius: 20px;
    box-shadow: 0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.07) inset;
    padding: 10px;
    flex-direction: column;
    gap: 2px;
    font-family: 'DM Sans', system-ui, sans-serif;
  }

  .rg-drawer.open {
    display: flex;
    animation: drawerIn 0.18s cubic-bezier(.4,0,.2,1);
  }

  @keyframes drawerIn {
    from { opacity: 0; transform: translateY(-8px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .rg-drawer .rg-pill-link {
    font-size: 14px;
    padding: 10px 16px;
    border-radius: 12px;
    width: 100%;
  }

  .rg-drawer-sep {
    height: 1px;
    background: rgba(255,255,255,0.06);
    margin: 6px 4px;
  }

  .rg-drawer .rg-signout-pill {
    border-radius: 12px;
    width: 100%;
    justify-content: center;
    padding: 10px;
    height: auto;
    font-size: 13.5px;
  }

  @media (max-width: 768px) {
    .rg-pill-links       { display: none; }
    .rg-email-pill       { display: none; }
    .rg-signout-pill-desk { display: none; }
    .rg-burger           { display: flex; }
  }

  @media (max-width: 480px) {
    .rg-nav-outer { padding: 12px 14px; }
  }
`;

// ── Tiny SVG icons ────────────────────────────────────────────────────────────
const LogoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white" opacity="0.9"/>
  </svg>
);

const LogoutIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

interface NavItem { href: string; label: string; }

const NAV_ITEMS: NavItem[] = [
  { href: '/',               label: 'Home'     },
  { href: '/dashboard',      label: 'Dashboard'},
  { href: '/assigned-tests', label: 'Assigned Test' },
  { href: '/practice',       label: 'Practice' },
  { href: '/my-results',     label: 'Results'  },
  { href: '/resumes',        label: 'Resumes'  },
];

export default function Navbar() {
  const router   = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('Account');

  useEffect(() => {
    const id = 'rg-pill-styles';
    if (document.getElementById(id)) return;
    const tag = document.createElement('style');
    tag.id = id;
    tag.innerHTML = styles;
    document.head.appendChild(tag);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  // Optionally read email from localStorage/token
  useEffect(() => {
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload?.email) setUserEmail(payload.email);
      }
    } catch {}
  }, []);

  const logout = () => {
    localStorage.removeItem('access_token');
    router.push('/login');
  };

  return (
    <>
      <div className="rg-nav-outer">
        <div className="rg-nav-pill">

          {/* Logo */}
          <Link href="/" className="rg-pill-logo" aria-label="Home">
            <LogoIcon />
          </Link>

          {/* Desktop links */}
          <ul className="rg-pill-links">
            {NAV_ITEMS.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={`rg-pill-link${pathname === href ? ' active' : ''}`}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Right side */}
          <div className="rg-pill-right">
            <span className="rg-email-pill" onClick={logout} style={{ cursor: 'pointer' }}>
              {userEmail}
            </span>

            <button className="rg-signout-pill rg-signout-pill-desk" onClick={logout}>
              <LogoutIcon />
              Sign out
            </button>

            {/* Mobile hamburger */}
            <button
              className={`rg-burger${menuOpen ? ' open' : ''}`}
              onClick={() => setMenuOpen(p => !p)}
              aria-label="Toggle menu"
            >
              <span /><span /><span />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      <div className={`rg-drawer${menuOpen ? ' open' : ''}`}>
        {NAV_ITEMS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`rg-pill-link${pathname === href ? ' active' : ''}`}
          >
            {label}
          </Link>
        ))}
        <div className="rg-drawer-sep" />
        <button className="rg-signout-pill" onClick={logout}>
          <LogoutIcon />
          Sign out
        </button>
      </div>
    </>
  );
}