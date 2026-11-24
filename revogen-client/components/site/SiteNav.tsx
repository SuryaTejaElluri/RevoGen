"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const NAV_LINKS = [
  { href: "/features", label: "Features" },
  { href: "/solutions", label: "Solutions" },
  { href: "/assessments", label: "Assessments" },
  { href: "/resume-ai", label: "Resume AI" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function SiteNav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  // The menu remembers which page it was opened on, so it closes itself after navigating.
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const menuOpen = menuPath === pathname;
  const setMenuOpen = (fn: (open: boolean) => boolean) => setMenuPath(fn(menuOpen) ? pathname : null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`nav${scrolled || menuOpen ? " sc" : ""}`}>
      <div className="wrap nav-in">
        <Link href="/" className="logo">
          <img src="/revogen-icon.svg" alt="" width={26} height={26} />
          Revogen
        </Link>
        <ul className="nav-links">
          {NAV_LINKS.map(l => (
            <li key={l.href}>
              <Link href={l.href} className={pathname === l.href ? "on" : undefined} aria-current={pathname === l.href ? "page" : undefined}>{l.label}</Link>
            </li>
          ))}
        </ul>
        <div className="nav-act">
          <Link href="/login" className="btn">Log in</Link>
          <Link href="/register" className="btn btn-solid">Get started</Link>
          <button className="burger" onClick={() => setMenuOpen(o => !o)} aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              {menuOpen ? <path d="M3 3l10 10M13 3L3 13" /> : <path d="M2 4.5h12M2 8h12M2 11.5h12" />}
            </svg>
          </button>
        </div>
      </div>
      {menuOpen && (
        <nav className="drawer">
          {NAV_LINKS.map(l => (
            <Link key={l.href} href={l.href} className={pathname === l.href ? "on" : undefined}>{l.label}</Link>
          ))}
          <div className="nav-act">
            <Link href="/login" className="btn" style={{ flex: 1, justifyContent: "center" }}>Log in</Link>
            <Link href="/register" className="btn btn-solid" style={{ flex: 1, justifyContent: "center" }}>Get started</Link>
          </div>
        </nav>
      )}
    </header>
  );
}
