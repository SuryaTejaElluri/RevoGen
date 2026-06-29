'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { API_BASE_URL } from '@/lib/api';


export type Theme = 'dark' | 'light';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap');

  .an-root {
    position: sticky;
    top: 0;
    height: 100vh;
    z-index: 1000;
    font-family: 'Sora', sans-serif;
    flex-shrink: 0;
  }

  .an-bar {
    width: 232px;
    height: 100%;
    background: rgba(13,15,20,.92);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    border-right: 1px solid rgba(255,255,255,.07);
    display: flex;
    flex-direction: column;
    padding: 20px 16px;
    gap: 22px;
    transition: width .18s ease;
    overflow: hidden;
  }

  [data-theme='light'] .an-bar {
    background: rgba(255,255,255,.92);
    border-right: 1px solid rgba(15,17,23,.08);
  }

  .an-bar.collapsed { width: 76px; padding: 20px 12px; align-items: center; }

  /* ── Brand ── */
  .an-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    flex-shrink: 0;
  }

  .an-bar.collapsed .an-brand { justify-content: center; }

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
    overflow: hidden;
    white-space: nowrap;
  }

  .an-brand-name {
    font-size: 14px;
    font-weight: 700;
    color: #f1f5f9;
    letter-spacing: -.2px;
  }

  [data-theme='light'] .an-brand-name { color: #15171f; }

  .an-brand-role {
    font-size: 10px;
    font-weight: 500;
    color: #6366f1;
    letter-spacing: .08em;
    text-transform: uppercase;
    margin-top: 2px;
  }

  /* ── Top row: brand + collapse toggle ── */
  .an-top-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .an-bar.collapsed .an-top-row { flex-direction: column; gap: 14px; }

  .an-collapse-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: 7px;
    background: transparent;
    border: 1px solid rgba(255,255,255,.08);
    color: #64748b;
    cursor: pointer;
    font-size: 11px;
    flex-shrink: 0;
    transition: all .15s ease;
  }

  [data-theme='light'] .an-collapse-btn { border-color: rgba(15,17,23,.1); }
  .an-collapse-btn:hover { color: #a5b4fc; border-color: rgba(99,102,241,.3); }

  /* ── Nav Links ── */
  .an-links {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    width: 100%;
  }

  .an-link {
    display: flex;
    align-items: center;
    gap: 11px;
    padding: 9px 12px;
    border-radius: 9px;
    font-size: 13px;
    font-weight: 500;
    color: #64748b;
    text-decoration: none;
    transition: all .18s ease;
    white-space: nowrap;
    border: 1px solid transparent;
    position: relative;
    overflow: hidden;
  }

  .an-bar.collapsed .an-link { justify-content: center; padding: 10px; width: 44px; }

  .an-link:hover {
    color: #e2e8f0;
    background: rgba(255,255,255,.05);
    border-color: rgba(255,255,255,.06);
  }

  [data-theme='light'] .an-link:hover {
    color: #15171f;
    background: rgba(15,17,23,.04);
    border-color: rgba(15,17,23,.06);
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
    flex-shrink: 0;
  }

  .an-link .an-label {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* ── Bottom block ── */
  .an-bottom {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex-shrink: 0;
    width: 100%;
    border-top: 1px solid rgba(255,255,255,.06);
    padding-top: 14px;
  }

  [data-theme='light'] .an-bottom { border-top-color: rgba(15,17,23,.08); }

  /* ── Theme toggle ── */
  .an-theme-toggle {
    display: flex;
    align-items: center;
    gap: 11px;
    width: 100%;
    padding: 8px 12px;
    border-radius: 9px;
    border: none;
    background: transparent;
    cursor: pointer;
    color: #64748b;
    font-size: 13px;
    font-weight: 500;
    font-family: 'Sora', sans-serif;
    transition: all .18s ease;
  }

  .an-bar.collapsed .an-theme-toggle { justify-content: center; padding: 8px; width: 44px; }
  .an-theme-toggle:hover { color: #e2e8f0; background: rgba(255,255,255,.05); }
  [data-theme='light'] .an-theme-toggle:hover { color: #15171f; background: rgba(15,17,23,.04); }

  .an-theme-track {
    width: 34px;
    height: 18px;
    border-radius: 11px;
    background: #2a2d3a;
    border: 1px solid rgba(255,255,255,.08);
    display: flex;
    align-items: center;
    padding: 2px;
    flex-shrink: 0;
    transition: background .2s;
  }

  [data-theme='light'] .an-theme-track { background: #fde9c8; border-color: rgba(15,17,23,.08); justify-content: flex-start; }
  [data-theme='dark'] .an-theme-track { justify-content: flex-end; }

  .an-theme-thumb {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #13151f;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 8px;
  }

  [data-theme='light'] .an-theme-thumb { background: #fff; }

  /* ── Admin chip ── */
  .an-chip {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 6px 12px;
    background: rgba(99,102,241,.1);
    border: 1px solid rgba(99,102,241,.22);
    border-radius: 50px;
    font-size: 11px;
    font-weight: 600;
    color: #818cf8;
    letter-spacing: .04em;
    white-space: nowrap;
    overflow: hidden;
  }

  .an-bar.collapsed .an-chip { width: 26px; height: 26px; padding: 0; justify-content: center; border-radius: 50%; }
  .an-bar.collapsed .an-chip span:last-child { display: none; }

  .an-chip-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #6366f1;
    box-shadow: 0 0 6px rgba(99,102,241,.8);
    animation: an-pulse 2s ease-in-out infinite;
    flex-shrink: 0;
  }

  @keyframes an-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: .5; transform: scale(.85); }
  }

  /* ── Logout button ── */
  .an-logout {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 9px 13px;
    border-radius: 9px;
    font-size: 13px;
    font-weight: 600;
    font-family: 'Sora', sans-serif;
    color: #94a3b8;
    background: transparent;
    border: 1px solid rgba(255,255,255,.08);
    cursor: pointer;
    transition: all .18s ease;
    white-space: nowrap;
  }

  [data-theme='light'] .an-logout { border-color: rgba(15,17,23,.1); color: #5d616e; }
  .an-bar.collapsed .an-logout { justify-content: center; padding: 9px; width: 44px; }

  .an-logout:hover {
    color: #ef4444;
    background: rgba(239,68,68,.08);
    border-color: rgba(239,68,68,.25);
  }

  @media (max-width: 768px) {
    .an-bar { position: fixed; left: 0; top: 0; z-index: 1000; }
  }
`;

const NAV_LINKS = [
  { href: '/admin',              label: 'Dashboard',         icon: '⬛' },
  { href: '/admin/tests',        label: 'Tests',             icon: '📄' },
  { href: '/admin/Create_Tests', label: 'Create Assessment', icon: '🆕' },
  { href: '/admin/credits',      label: 'Revo Credits',      icon: '🪙' },
];

export default function AdminSidebar({
  theme = 'dark',
  onToggleTheme,
}: {
  theme?: Theme;
  onToggleTheme?: () => void;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

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
        <div className={`an-bar${collapsed ? ' collapsed' : ''}`}>

          {/* Brand + collapse toggle */}
          <div className="an-top-row">
            <Link href="/admin" className="an-brand">
              <div className="an-logo">⚡</div>
              {!collapsed && (
                <div className="an-brand-text">
                  <span className="an-brand-name">RevoGen AI</span>
                  <span className="an-brand-role">Admin Panel</span>
                </div>
              )}
            </Link>

            <button
              className="an-collapse-btn"
              onClick={() => setCollapsed(!collapsed)}
              aria-label="Toggle sidebar"
            >
              {collapsed ? '»' : '«'}
            </button>
          </div>

          {/* Nav Links */}
          <div className="an-links">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`an-link${isActive(link.href) ? ' active' : ''}`}
                title={collapsed ? link.label : undefined}
              >
                <span className="an-icon">{link.icon}</span>
                {!collapsed && <span className="an-label">{link.label}</span>}
              </Link>
            ))}
          </div>

          {/* Bottom: theme toggle + chip + logout */}
          <div className="an-bottom">
            {onToggleTheme && (
              <button className="an-theme-toggle" onClick={onToggleTheme} aria-label="Toggle theme">
                <span className="an-theme-track">
                  <span className="an-theme-thumb">{theme === 'dark' ? '🌙' : '☀️'}</span>
                </span>
                {!collapsed && <span>{theme === 'dark' ? 'Dark mode' : 'Light mode'}</span>}
              </button>
            )}

            <div className="an-chip">
              <span className="an-chip-dot" />
              {!collapsed && <span>Admin</span>}
            </div>

            <button
              className="an-logout"
              onClick={handleLogout}
              title={collapsed ? 'Logout' : undefined}
            >
              <span>↩</span> {!collapsed && 'Logout'}
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}