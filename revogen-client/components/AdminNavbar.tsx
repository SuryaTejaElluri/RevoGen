'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { API_BASE_URL } from '@/lib/api';


const css = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap');

  .an-root {
    position: sticky;
    top: 0;
    z-index: 1000;
    font-family: 'Sora', sans-serif;
  }

  .an-bar {
    height: 62px;
    background: rgba(13,15,20,.92);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    border-bottom: 1px solid rgba(255,255,255,.07);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 28px;
    gap: 12px;
  }

  /* ── Brand ── */
  .an-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    flex-shrink: 0;
  }

  .an-logo {
    width: 32px;
    height: 32px;
    border-radius: 9px;
    background: linear-gradient(135deg, #6366f1, #818cf8);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    box-shadow: 0 0 14px rgba(99,102,241,.45);
    flex-shrink: 0;
  }

  .an-brand-text {
    display: flex;
    flex-direction: column;
    line-height: 1;
  }

  .an-brand-name {
    font-size: 14px;
    font-weight: 700;
    color: #f1f5f9;
    letter-spacing: -.2px;
  }

  .an-brand-role {
    font-size: 10px;
    font-weight: 500;
    color: #6366f1;
    letter-spacing: .08em;
    text-transform: uppercase;
    margin-top: 2px;
  }

  /* ── Nav Links ── */
  .an-links {
    display: flex;
    align-items: center;
    gap: 2px;
    flex: 1;
    justify-content: center;
  }

  .an-link {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 7px 14px;
    border-radius: 9px;
    font-size: 13px;
    font-weight: 500;
    color: #64748b;
    text-decoration: none;
    transition: all .18s ease;
    white-space: nowrap;
    border: 1px solid transparent;
    position: relative;
  }

  .an-link:hover {
    color: #e2e8f0;
    background: rgba(255,255,255,.05);
    border-color: rgba(255,255,255,.06);
  }

  .an-link.active {
    color: #a5b4fc;
    background: rgba(99,102,241,.12);
    border-color: rgba(99,102,241,.25);
    font-weight: 600;
  }

  .an-link .an-icon {
    font-size: 14px;
    line-height: 1;
  }

  /* ── Right side ── */
  .an-right {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }

  /* ── Admin chip ── */
  .an-chip {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 5px 12px;
    background: rgba(99,102,241,.1);
    border: 1px solid rgba(99,102,241,.22);
    border-radius: 50px;
    font-size: 11px;
    font-weight: 600;
    color: #818cf8;
    letter-spacing: .04em;
  }

  .an-chip-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #6366f1;
    box-shadow: 0 0 6px rgba(99,102,241,.8);
    animation: an-pulse 2s ease-in-out infinite;
  }

  @keyframes an-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: .5; transform: scale(.85); }
  }

  /* ── Logout button ── */
  .an-logout {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 7px 15px;
    border-radius: 9px;
    font-size: 13px;
    font-weight: 600;
    font-family: 'Sora', sans-serif;
    color: #94a3b8;
    background: transparent;
    border: 1px solid rgba(255,255,255,.08);
    cursor: pointer;
    transition: all .18s ease;
  }

  .an-logout:hover {
    color: #ef4444;
    background: rgba(239,68,68,.08);
    border-color: rgba(239,68,68,.25);
  }

  /* ── Mobile hamburger ── */
  .an-hamburger {
    display: none;
    flex-direction: column;
    gap: 5px;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 6px;
    border-radius: 7px;
    transition: background .15s;
  }

  .an-hamburger:hover { background: rgba(255,255,255,.06); }

  .an-hamburger span {
    display: block;
    width: 20px;
    height: 2px;
    background: #64748b;
    border-radius: 2px;
    transition: all .2s ease;
  }

  .an-hamburger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); background: #a5b4fc; }
  .an-hamburger.open span:nth-child(2) { opacity: 0; }
  .an-hamburger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); background: #a5b4fc; }

  /* ── Mobile drawer ── */
  .an-drawer {
    display: none;
    background: rgba(13,15,20,.97);
    border-bottom: 1px solid rgba(255,255,255,.07);
    padding: 12px 20px 18px;
    flex-direction: column;
    gap: 4px;
  }

  .an-drawer .an-link {
    padding: 10px 14px;
    justify-content: flex-start;
  }

  .an-drawer-footer {
    margin-top: 10px;
    padding-top: 12px;
    border-top: 1px solid rgba(255,255,255,.06);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  @media (max-width: 768px) {
    .an-links,
    .an-chip,
    .an-right .an-logout { display: none; }
    .an-hamburger { display: flex; }
    .an-drawer.open { display: flex; }
  }

  @media (min-width: 769px) {
    .an-drawer { display: none !important; }
  }
`;

const NAV_LINKS = [
  { href: '/admin',              label: 'Dashboard',         icon: '⬛' },
  { href: '/admin/tests',        label: 'Tests',             icon: '📄' },
  { href: '/admin/Create_Tests', label: 'Create Assessment', icon: '🆕' },
  { href: '/admin/credits',      label: 'Revo Credits',      icon: '🪙' },
];

export default function AdminNavbar() {
  const pathname = usePathname();
  const [open, setOpen] = require('react').useState(false);

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    window.location.href = '/login';
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <nav className="an-root">
        <div className="an-bar">

          {/* Brand */}
          <Link href="/admin" className="an-brand">
            <div className="an-logo">⚡</div>
            <div className="an-brand-text">
              <span className="an-brand-name">RevoGen AI</span>
              <span className="an-brand-role">Admin Panel</span>
            </div>
          </Link>

          {/* Nav Links */}
          <div className="an-links">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`an-link${isActive(link.href) ? ' active' : ''}`}
              >
                <span className="an-icon">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right */}
          <div className="an-right">
            <div className="an-chip">
              <span className="an-chip-dot" />
              Admin
            </div>

            <button className="an-logout" onClick={handleLogout}>
              <span>↩</span> Logout
            </button>

            {/* Hamburger */}
            <button
              className={`an-hamburger${open ? ' open' : ''}`}
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
            >
              <span /><span /><span />
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        <div className={`an-drawer${open ? ' open' : ''}`}>
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`an-link${isActive(link.href) ? ' active' : ''}`}
              onClick={() => setOpen(false)}
            >
              <span className="an-icon">{link.icon}</span>
              {link.label}
            </Link>
          ))}
          <div className="an-drawer-footer">
            <div className="an-chip">
              <span className="an-chip-dot" />
              Admin
            </div>
            <button className="an-logout" onClick={handleLogout}>
              ↩ Logout
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}