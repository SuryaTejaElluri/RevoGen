'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');

  .mn-outer {
    position: fixed; top: 0; left: 0; right: 0; z-index: 200;
    transition: background 0.35s, border-color 0.35s, backdrop-filter 0.35s;
    font-family: 'Inter', sans-serif;
  }
  .mn-outer.scrolled {
    background: rgba(3,4,10,0.82);
    backdrop-filter: blur(22px) saturate(140%);
    border-bottom: 1px solid rgba(124,92,255,0.18);
  }
  .mn-inner {
    max-width: 1240px; margin: 0 auto;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 24px; height: 70px;
  }
  .mn-logo {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1.35rem; font-weight: 700; letter-spacing: -0.02em;
    background: linear-gradient(135deg, #A78BFA, #00E5FF);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    text-decoration: none;
    display: flex; align-items: center; gap: 10px;
  }
  .mn-links { display: flex; align-items: center; gap: 2px; list-style: none; margin: 0; padding: 0; }
  .mn-links a {
    color: rgba(255,255,255,0.52); font-size: 0.875rem; font-weight: 500;
    text-decoration: none; padding: 8px 15px; border-radius: 9px;
    transition: color 0.2s, background 0.2s;
  }
  .mn-links a:hover { color: rgba(255,255,255,0.92); background: rgba(255,255,255,0.06); }
  .mn-links a.active { color: #A78BFA; background: rgba(124,92,255,0.1); }
  .mn-actions { display: flex; align-items: center; gap: 10px; }
  .mn-ghost {
    background: transparent; border: 1px solid rgba(255,255,255,0.14);
    color: rgba(255,255,255,0.85); font-size: 0.875rem; font-weight: 500;
    padding: 8px 18px; border-radius: 10px; cursor: pointer;
    text-decoration: none; transition: all 0.2s; font-family: 'Inter', sans-serif;
  }
  .mn-ghost:hover { border-color: #7C5CFF; color: #A78BFA; background: rgba(124,92,255,0.07); }
  .mn-primary {
    background: linear-gradient(135deg, #7C5CFF, #5B3FD9);
    color: #fff; font-size: 0.875rem; font-weight: 600;
    padding: 8px 20px; border-radius: 10px; cursor: pointer;
    text-decoration: none; border: none; font-family: 'Inter', sans-serif;
    box-shadow: 0 4px 16px rgba(124,92,255,0.42);
    transition: all 0.2s;
  }
  .mn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 26px rgba(124,92,255,0.58); }
  .mn-burger {
    display: none; flex-direction: column; gap: 5px;
    background: transparent; border: 1.5px solid rgba(255,255,255,0.12);
    cursor: pointer; padding: 8px; border-radius: 10px; transition: border-color 0.15s;
  }
  .mn-burger:hover { border-color: rgba(124,92,255,0.5); }
  .mn-burger span { display: block; width: 18px; height: 1.5px; background: rgba(255,255,255,0.6); border-radius: 2px; transition: all 0.2s ease; }
  .mn-burger.open span:nth-child(1) { transform: translateY(6.5px) rotate(45deg); }
  .mn-burger.open span:nth-child(2) { opacity: 0; }
  .mn-burger.open span:nth-child(3) { transform: translateY(-6.5px) rotate(-45deg); }

  .mn-drawer {
    display: none; position: fixed;
    top: 78px; left: 16px; right: 16px; z-index: 199;
    background: #0D0F1A; border: 1px solid rgba(124,92,255,0.18); border-radius: 18px;
    padding: 10px; flex-direction: column; gap: 2px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.6);
    font-family: 'Inter', sans-serif;
  }
  .mn-drawer.open { display: flex; animation: drawerSlide 0.18s ease; }
  @keyframes drawerSlide { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
  .mn-drawer a {
    color: rgba(255,255,255,0.62); font-size: 0.9rem; font-weight: 500;
    text-decoration: none; padding: 12px 16px; border-radius: 11px;
    transition: all 0.15s;
  }
  .mn-drawer a:hover { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.92); }
  .mn-drawer a.active { color: #A78BFA; background: rgba(124,92,255,0.1); }
  .mn-drawer-sep { height: 1px; background: rgba(255,255,255,0.06); margin: 6px 4px; }
  .mn-drawer-btns { display: flex; gap: 8px; padding: 4px; }
  .mn-drawer-btns a { flex: 1; text-align: center; border-radius: 11px; padding: 11px; font-size: 0.875rem; }

  @media (max-width: 860px) {
    .mn-links { display: none; }
    .mn-actions .mn-ghost,
    .mn-actions .mn-primary { display: none; }
    .mn-burger { display: flex; }
  }
`;

const NAV_LINKS = [
  { href: '/features',    label: 'Features'    },
  { href: '/solutions',   label: 'Solutions'   },
  { href: '/assessments', label: 'Assessments' },
  { href: '/resume-ai',   label: 'Resume AI'   },
  { href: '/about',       label: 'About'       },
  { href: '/contact',     label: 'Contact'     },
];

export default function MarketingNav() {
  const pathname  = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open,     setOpen]     = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <nav className={`mn-outer${scrolled ? ' scrolled' : ''}`}>
        <div className="mn-inner">
          <Link href="/" className="mn-logo">
            <img src="/revogen-icon.svg" alt="Revogen" width={34} height={34} style={{ borderRadius: 10 }} />
            Revogen
          </Link>

          <ul className="mn-links">
            {NAV_LINKS.map(({ href, label }) => (
              <li key={href}>
                <Link href={href} className={pathname === href ? 'active' : ''}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mn-actions">
            <Link href="/login"               className="mn-ghost">Login</Link>
            <Link href="/register/candidate" className="mn-primary">Get Started →</Link>
            <button
              className={`mn-burger${open ? ' open' : ''}`}
              onClick={() => setOpen(p => !p)}
              aria-label="Toggle menu"
            >
              <span /><span /><span />
            </button>
          </div>
        </div>
      </nav>

      <div className={`mn-drawer${open ? ' open' : ''}`}>
        {NAV_LINKS.map(({ href, label }) => (
          <Link key={href} href={href} className={pathname === href ? 'active' : ''}>{label}</Link>
        ))}
        <div className="mn-drawer-sep" />
        <div className="mn-drawer-btns">
          <Link href="/login"               className="mn-ghost"   style={{ textAlign: 'center', display: 'block', borderRadius: 11 }}>Login</Link>
          <Link href="/register/candidate" className="mn-primary" style={{ textAlign: 'center', display: 'block', borderRadius: 11 }}>Get Started →</Link>
        </div>
      </div>
    </>
  );
}
