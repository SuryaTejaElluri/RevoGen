'use client';

import { useEffect, useState, useMemo } from 'react';
import Navbar from '@/components/Navbar';

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const IconClipboard = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="2" width="6" height="4" rx="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <path d="M12 11h4M12 16h4M8 11h.01M8 16h.01" />
  </svg>
);

const IconPractice = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <circle cx="12" cy="17" r=".5" fill="currentColor" />
  </svg>
);

const IconAssigned = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
  </svg>
);

const IconCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconCalendar = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

const IconEmpty = () => (
  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /><path d="M9 9h6M9 12h4" />
  </svg>
);

const IconTrophy = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

const IconChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

// ─── Mini ring chart (SVG) ───────────────────────────────────────────────────
function RingChart({
  slices,
  total,
}: {
  slices: { value: number; color: string }[];
  total: number;
}) {
  const r = 15.9;
  const circ = 2 * Math.PI * r;
  let offset = circ * 0.25;

  if (total === 0) {
    return (
      <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%' }}>
        <circle cx="18" cy="18" r={r} fill="none" stroke="var(--border)" strokeWidth="3.2" />
        <text x="18" y="21" textAnchor="middle" fontSize="7" fontWeight="700" fill="var(--text-muted)">0</text>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%' }}>
      <circle cx="18" cy="18" r={r} fill="none" stroke="var(--border)" strokeWidth="3.2" />
      {slices.map((s, i) => {
        const dash = (s.value / total) * circ;
        const gap = circ - dash;
        const el = (
          <circle
            key={i}
            cx="18" cy="18" r={r}
            fill="none"
            stroke={s.color}
            strokeWidth="3.2"
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        );
        offset -= dash;
        return el;
      })}
      <text x="18" y="21" textAnchor="middle" fontSize="7" fontWeight="800" fill="var(--text-primary)">
        {total}
      </text>
    </svg>
  );
}

// ─── Score ring ──────────────────────────────────────────────────────────────
function ScoreRing({ pct }: { pct: number }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = pct >= 75 ? '#0d9e6b' : pct >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <svg viewBox="0 0 44 44" width="44" height="44" style={{ flexShrink: 0 }}>
      <circle cx="22" cy="22" r={r} fill="none" stroke="var(--border)" strokeWidth="3.5" />
      <circle
        cx="22" cy="22" r={r}
        fill="none"
        stroke={color}
        strokeWidth="3.5"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeDashoffset={circ * 0.25}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.8s ease' }}
      />
      <text x="22" y="26" textAnchor="middle" fontSize="8" fontWeight="800" fill={color}>
        {Math.round(pct)}%
      </text>
    </svg>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  :root {
    --bg: #f0f4ff;
    --surface: #ffffff;
    --surface-alt: #f8faff;
    --border: #dde3f5;
    --border-strong: #b9c5e8;
    --text-primary: #0f1730;
    --text-secondary: #4a5578;
    --text-muted: #8692b3;
    --accent: #3a57e8;
    --accent-light: #edf0fe;
    --accent-hover: #2942d0;
    --success: #0d9e6b;
    --success-light: #e6f8f3;
    --success-border: rgba(13,158,107,0.2);
    --warning: #d97706;
    --warning-light: #fef3e2;
    --warning-border: rgba(217,119,6,0.2);
    --danger: #ef4444;
    --danger-light: #fef2f2;
    --purple: #7c3aed;
    --purple-light: #f3effe;
    --purple-border: rgba(124,58,237,0.2);
    --shadow-sm: 0 1px 3px 0 rgb(58 87 232 / 0.08), 0 1px 2px -1px rgb(58 87 232 / 0.05);
    --shadow-md: 0 4px 20px -2px rgb(58 87 232 / 0.12), 0 2px 8px -2px rgb(58 87 232 / 0.07);
    --shadow-lg: 0 16px 40px -4px rgb(58 87 232 / 0.16), 0 6px 12px -2px rgb(58 87 232 / 0.08);
    --radius-sm: 8px;
    --radius-md: 14px;
    --radius-lg: 20px;
    --radius-xl: 28px;
  }

  [data-theme='dark'] {
    --bg: #080d1c;
    --surface: #111828;
    --surface-alt: #161f33;
    --border: #1e2a45;
    --border-strong: #2a3a5c;
    --text-primary: #e8eeff;
    --text-secondary: #8898c8;
    --text-muted: #4a5a80;
    --accent: #5b76f0;
    --accent-light: #111d40;
    --accent-hover: #7089f5;
    --success: #10b981;
    --success-light: #052015;
    --success-border: rgba(16,185,129,0.2);
    --warning: #f59e0b;
    --warning-light: #1c1200;
    --warning-border: rgba(245,158,11,0.2);
    --danger: #f87171;
    --danger-light: #2a0a0a;
    --purple: #a78bfa;
    --purple-light: #1a0f33;
    --purple-border: rgba(167,139,250,0.2);
    --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.4);
    --shadow-md: 0 4px 20px -2px rgb(0 0 0 / 0.5);
    --shadow-lg: 0 16px 40px -4px rgb(0 0 0 / 0.6);
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background-color: var(--bg);
    color: var(--text-primary);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    transition: background-color 0.3s ease, color 0.3s ease;
  }

  /* ── Page wrapper ── */
  .rp-page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  /* ── Hero ── */
  .rp-hero {
    background: linear-gradient(135deg, #1e3a8a 0%, #3a57e8 52%, #6366f1 100%);
    padding: 64px 24px 88px;   /* ← more top & bottom room in the hero */
    position: relative;
    overflow: hidden;
  }

  .rp-hero::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 55% 70% at 85% -15%, rgba(255,255,255,0.09) 0%, transparent 60%),
      radial-gradient(ellipse 35% 55% at -5% 115%, rgba(99,102,241,0.25) 0%, transparent 60%);
    pointer-events: none;
  }

  .rp-hero::after {
    content: '';
    position: absolute;
    bottom: -1px; left: 0; right: 0;
    height: 52px;
    background: var(--bg);
    clip-path: ellipse(56% 100% at 50% 100%);
  }

  .rp-hero-inner {
    max-width: 1200px;
    margin: 0 auto;
    position: relative;
    z-index: 1;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 24px;
  }

  .rp-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(255,255,255,0.14);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 999px;
    padding: 5px 14px;
    font-size: 0.75rem;
    font-weight: 700;
    color: rgba(255,255,255,0.9);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-bottom: 16px;   /* ← slightly more room below eyebrow */
  }

  .rp-eyebrow-dot {
    width: 6px; height: 6px;
    background: #34d399;
    border-radius: 50%;
    animation: rp-pulse 2s infinite;
  }

  @keyframes rp-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.75); }
  }

  .rp-hero-title {
    font-size: clamp(1.75rem, 4vw, 2.75rem);
    font-weight: 800;
    color: #fff;
    line-height: 1.15;
    letter-spacing: -0.025em;
    margin-bottom: 12px;   /* ← tighter gap to subtitle */
  }

  .rp-hero-sub {
    font-size: 0.98rem;
    color: rgba(255,255,255,0.68);
    max-width: 440px;
    line-height: 1.65;
  }

  /* ── Stats floating bar ── */
  .rp-stats-wrap {
    max-width: 1200px;
    margin: -30px auto 0;   /* ← pulls up into hero wave slightly more */
    padding: 0 24px;
    position: relative;
    z-index: 2;
  }

  .rp-stats-bar {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-lg);
    padding: 22px 36px;    /* ← a touch more horizontal breathing room */
    display: flex;
    align-items: stretch;
    gap: 0;
  }

  .rp-stat {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 10px 24px;    /* ← more vertical & horizontal padding per stat */
    position: relative;
  }

  .rp-stat:not(:last-child)::after {
    content: '';
    position: absolute;
    right: 0; top: 50%;
    transform: translateY(-50%);
    height: 40px;
    width: 1px;
    background: var(--border);
  }

  .rp-stat-icon {
    width: 40px; height: 40px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }

  .rp-stat-icon.total    { background: var(--accent-light); color: var(--accent); }
  .rp-stat-icon.practice { background: var(--accent-light); color: var(--accent); }
  .rp-stat-icon.assigned { background: var(--purple-light); color: var(--purple); }

  .rp-stat-text { min-width: 0; }

  .rp-stat-value {
    font-size: 1.65rem;
    font-weight: 800;
    color: var(--text-primary);
    line-height: 1;
    letter-spacing: -0.035em;
  }

  .rp-stat-label {
    font-size: 0.72rem;
    color: var(--text-muted);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    margin-top: 4px;
  }

  .rp-stat-ring {
    width: 48px; height: 48px;
    flex-shrink: 0;
    margin-left: auto;
  }

  /* ── Main ── */
  .rp-main {
    flex: 1;
    max-width: 1200px;
    width: 100%;
    margin: 56px auto 96px;   /* ← more top + bigger bottom margin */
    padding: 0 24px;
  }

  /* ── Chart row ── */
  .rp-charts {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;              /* ← slightly wider gap between chart cards */
    margin-bottom: 40px;    /* ← more space before toolbar */
  }

  .rp-chart-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 26px 28px;     /* ← more padding inside chart cards */
    box-shadow: var(--shadow-sm);
    display: flex;
    align-items: center;
    gap: 24px;
    animation: rp-fadeUp 0.4s ease both;
  }

  .rp-chart-card:nth-child(2) { animation-delay: 0.07s; }

  .rp-ring-wrap {
    width: 86px; height: 86px;
    flex-shrink: 0;
  }

  .rp-chart-legend { flex: 1; }

  .rp-chart-title {
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--text-primary);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 14px;    /* ← more gap below chart title */
  }

  .rp-legend-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.82rem;
    color: var(--text-secondary);
    padding: 5px 0;         /* ← a touch more vertical padding per legend row */
  }

  .rp-legend-dot {
    width: 9px; height: 9px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .rp-legend-count {
    margin-left: auto;
    font-weight: 700;
    font-size: 0.88rem;
    color: var(--text-primary);
  }

  /* ── Toolbar ── */
  .rp-toolbar {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }

  .rp-section-label {
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--text-primary);
    text-transform: uppercase;
    letter-spacing: 0.07em;
    display: flex;
    align-items: center;
    gap: 8px;
    margin-right: auto;
  }

  .rp-section-label::before {
    content: '';
    display: inline-block;
    width: 4px; height: 16px;
    background: var(--accent);
    border-radius: 2px;
  }

  .rp-search-wrap {
    position: relative;
    width: 240px;
  }

  .rp-search-icon {
    position: absolute;
    left: 12px; top: 50%;
    transform: translateY(-50%);
    color: var(--text-muted);
    pointer-events: none;
    display: flex;
  }

  .rp-search {
    width: 100%;
    height: 40px;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: 0 12px 0 36px;
    font-size: 0.85rem;
    font-family: inherit;
    background: var(--surface);
    color: var(--text-primary);
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .rp-search::placeholder { color: var(--text-muted); }

  .rp-search:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgb(58 87 232 / 0.12);
  }

  .rp-filter-wrap { position: relative; }

  .rp-filter {
    height: 40px;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: 0 34px 0 14px;
    font-size: 0.85rem;
    font-family: inherit;
    background: var(--surface);
    color: var(--text-primary);
    outline: none;
    cursor: pointer;
    appearance: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    min-width: 170px;
  }

  .rp-filter:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgb(58 87 232 / 0.12);
  }

  .rp-filter-chevron {
    position: absolute;
    right: 10px; top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    color: var(--text-muted);
    display: flex;
  }

  .rp-count {
    font-size: 0.78rem;
    color: var(--text-muted);
    font-weight: 600;
    white-space: nowrap;
  }

  /* ── Assessment list ── */
  .rp-list {
    display: flex;
    flex-direction: column;
    gap: 16px;              /* ← slightly more gap between cards */
  }

  .rp-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 24px 28px;     /* ← more horizontal padding in cards */
    box-shadow: var(--shadow-sm);
    display: flex;
    align-items: center;
    gap: 18px;
    transition: transform 0.22s cubic-bezier(.4,0,.2,1), box-shadow 0.22s, border-color 0.22s;
    animation: rp-fadeUp 0.35s ease both;
    position: relative;
    overflow: hidden;
  }

  .rp-card::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 3px;
    background: var(--card-stripe, var(--accent));
    opacity: 0;
    transition: opacity 0.2s;
  }

  .rp-card:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-lg);
    border-color: var(--border-strong);
  }

  .rp-card:hover::before { opacity: 1; }

  .rp-card.is-practice { --card-stripe: var(--accent); }
  .rp-card.is-assigned  { --card-stripe: var(--purple); }

  .rp-card-icon {
    width: 44px; height: 44px;
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }

  .rp-card-icon.practice { background: var(--accent-light); color: var(--accent); }
  .rp-card-icon.assigned { background: var(--purple-light); color: var(--purple); }

  .rp-card-body { flex: 1; min-width: 0; }

  .rp-card-title {
    font-size: 0.97rem;
    font-weight: 700;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 10px;    /* ← more room between title and meta row */
    letter-spacing: -0.01em;
  }

  .rp-card-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  /* ── Badges ── */
  .rp-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    border: 1px solid transparent;
  }

  .rp-badge.practice {
    background: var(--accent-light);
    color: var(--accent);
    border-color: rgba(58,87,232,0.2);
  }

  .rp-badge.assigned {
    background: var(--purple-light);
    color: var(--purple);
    border-color: var(--purple-border);
  }

  .rp-badge.completed {
    background: var(--success-light);
    color: var(--success);
    border-color: var(--success-border);
  }

  .rp-badge.submitted {
    background: var(--warning-light);
    color: var(--warning);
    border-color: var(--warning-border);
  }

  .rp-date {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 0.75rem;
    color: var(--text-muted);
    font-weight: 500;
  }

  /* ── Score area ── */
  .rp-score-area {
    display: flex;
    align-items: center;
    gap: 14px;
    flex-shrink: 0;
    padding-left: 20px;     /* ← more breathing room to the left of score */
    border-left: 1px solid var(--border);
  }

  .rp-score-detail {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 3px;
  }

  .rp-score-fraction {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--text-primary);
    line-height: 1;
  }

  .rp-score-sub {
    font-size: 0.7rem;
    color: var(--text-muted);
    font-weight: 500;
  }

  .rp-submitted-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;      /* ← slightly more padding */
    background: var(--success-light);
    border: 1px solid var(--success-border);
    border-radius: var(--radius-md);
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--success);
    flex-shrink: 0;
  }

  /* ── Skeleton ── */
  .rp-skeleton-list { display: flex; flex-direction: column; gap: 16px; }

  .rp-skel-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 24px 28px;
    display: flex;
    align-items: center;
    gap: 18px;
  }

  .rp-skel {
    background: linear-gradient(
      90deg,
      var(--surface-alt) 25%,
      var(--border) 50%,
      var(--surface-alt) 75%
    );
    background-size: 200% 100%;
    animation: rp-shimmer 1.5s infinite;
    border-radius: var(--radius-sm);
  }

  .rp-skel-circle { width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0; }
  .rp-skel-body { flex: 1; display: flex; flex-direction: column; gap: 10px; }
  .rp-skel-line { height: 13px; }
  .rp-skel-line.w60 { width: 60%; }
  .rp-skel-line.w35 { width: 35%; }

  @keyframes rp-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* ── Empty ── */
  .rp-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    padding: 96px 24px;     /* ← more vertical padding in empty states */
    text-align: center;
    background: var(--surface);
    border: 2px dashed var(--border);
    border-radius: var(--radius-xl);
    animation: rp-fadeUp 0.5s ease;
  }

  .rp-empty-icon {
    width: 88px; height: 88px;
    background: var(--accent-light);
    border-radius: 22px;
    display: flex; align-items: center; justify-content: center;
    color: var(--accent);
    margin-bottom: 8px;
  }

  .rp-empty-title {
    font-size: 1.15rem;
    font-weight: 800;
    color: var(--text-primary);
    letter-spacing: -0.01em;
  }

  .rp-empty-desc {
    font-size: 0.88rem;
    color: var(--text-muted);
    max-width: 340px;
    line-height: 1.65;
  }

  .rp-empty-cta {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 28px;
    background: linear-gradient(135deg, var(--accent) 0%, #6366f1 100%);
    color: #fff;
    border: none;
    border-radius: var(--radius-md);
    font-size: 0.88rem;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    text-decoration: none;
    transition: transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 4px 14px rgb(58 87 232 / 0.38);
    margin-top: 8px;
  }

  .rp-empty-cta:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgb(58 87 232 / 0.45);
  }

  /* ── Footer ── */
  .rp-footer {
    background: var(--surface);
    border-top: 1px solid var(--border);
    padding: 32px 24px;     /* ← more vertical padding in footer */
    text-align: center;
    color: var(--text-muted);
    font-size: 0.8rem;
    font-weight: 500;
    margin-top: auto;
  }

  .rp-footer a {
    color: var(--accent);
    text-decoration: none;
    font-weight: 700;
  }

  /* ── Animations ── */
  @keyframes rp-fadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── Responsive ── */
  @media (max-width: 900px) {
    .rp-charts { grid-template-columns: 1fr; }
  }

  @media (max-width: 768px) {
    .rp-hero { padding: 48px 24px 76px; }

    .rp-hero-inner { flex-direction: column; align-items: flex-start; }

    .rp-stats-bar {
      flex-wrap: wrap;
      padding: 16px 20px;
      gap: 12px;
    }

    .rp-stat {
      flex: 1 1 calc(50% - 6px);
      min-width: 120px;
      padding: 8px 12px;
    }

    .rp-stat:not(:last-child)::after { display: none; }

    .rp-stat-ring { display: none; }

    .rp-main {
      margin-top: 44px;
      margin-bottom: 72px;
    }

    .rp-toolbar { flex-direction: column; align-items: stretch; }

    .rp-section-label { margin-right: 0; }

    .rp-search-wrap { width: 100%; }

    .rp-filter { width: 100%; }

    .rp-card { flex-wrap: wrap; padding: 20px; }

    .rp-score-area {
      border-left: none;
      border-top: 1px solid var(--border);
      padding-left: 0;
      padding-top: 16px;
      width: 100%;
      justify-content: flex-start;
    }
  }

  @media (max-width: 480px) {
    .rp-stat { flex: 1 1 100%; }
    .rp-card { padding: 18px; }
    .rp-hero { padding: 40px 18px 68px; }
    .rp-main { margin-top: 36px; margin-bottom: 60px; }
  }
`;

type FilterType = 'all' | 'practice' | 'assigned';

export default function MyResultsPage() {
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:3000/tests/my-attempts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setAttempts(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const practice = attempts.filter((a) => a.test?.isPractice).length;
    const assigned  = attempts.filter((a) => !a.test?.isPractice).length;
    return { total: attempts.length, practice, assigned };
  }, [attempts]);

  const filtered = useMemo(() => {
    return attempts.filter((a) => {
      const matchSearch = a.test?.title?.toLowerCase().includes(search.toLowerCase());
      const matchFilter =
        filter === 'all' ||
        (filter === 'practice' && a.test?.isPractice) ||
        (filter === 'assigned' && !a.test?.isPractice);
      return matchSearch && matchFilter;
    });
  }, [attempts, search, filter]);

  const avgScore = useMemo(() => {
    const prac = attempts.filter((a) => a.test?.isPractice && a.percentage != null);
    if (!prac.length) return null;
    return prac.reduce((sum, a) => sum + Number(a.percentage), 0) / prac.length;
  }, [attempts]);

  return (
    <>
      <style>{styles}</style>

      <div className="rp-page">
        <Navbar />

        {/* ── Hero ── */}
        <section className="rp-hero">
          <div className="rp-hero-inner">
            <div>
              <div className="rp-eyebrow">
                <span className="rp-eyebrow-dot" />
                Results Dashboard
              </div>
              <h1 className="rp-hero-title">My Assessments</h1>
              <p className="rp-hero-sub">
                A complete record of every test you've taken — practice exams
                and assigned assessments in one place.
              </p>
            </div>
          </div>
        </section>

        {/* ── Stats bar ── */}
        <div className="rp-stats-wrap">
          <div className="rp-stats-bar">
            <div className="rp-stat">
              <div className="rp-stat-icon total">
                <IconClipboard />
              </div>
              <div className="rp-stat-text">
                <div className="rp-stat-value">{stats.total}</div>
                <div className="rp-stat-label">Total Taken</div>
              </div>
              <div className="rp-stat-ring">
                <RingChart
                  slices={[
                    { value: stats.practice, color: '#3a57e8' },
                    { value: stats.assigned, color: '#7c3aed' },
                  ]}
                  total={stats.total}
                />
              </div>
            </div>

            <div className="rp-stat">
              <div className="rp-stat-icon practice">
                <IconPractice />
              </div>
              <div className="rp-stat-text">
                <div className="rp-stat-value">{stats.practice}</div>
                <div className="rp-stat-label">Practice Exams</div>
              </div>
            </div>

            <div className="rp-stat">
              <div className="rp-stat-icon assigned">
                <IconAssigned />
              </div>
              <div className="rp-stat-text">
                <div className="rp-stat-value">{stats.assigned}</div>
                <div className="rp-stat-label">Assigned Tests</div>
              </div>
            </div>

            {avgScore !== null && (
              <div className="rp-stat">
                <div className="rp-stat-icon total" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
                  <IconTrophy />
                </div>
                <div className="rp-stat-text">
                  <div className="rp-stat-value">{avgScore.toFixed(1)}%</div>
                  <div className="rp-stat-label">Avg Score</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Main ── */}
        <main className="rp-main">

          {/* Charts */}
          {stats.total > 0 && (
            <div className="rp-charts">
              <div className="rp-chart-card">
                <div className="rp-ring-wrap">
                  <RingChart
                    slices={[
                      { value: stats.practice, color: '#3a57e8' },
                      { value: stats.assigned, color: '#7c3aed' },
                    ]}
                    total={stats.total}
                  />
                </div>
                <div className="rp-chart-legend">
                  <div className="rp-chart-title">Assessment Types</div>
                  <div className="rp-legend-row">
                    <span className="rp-legend-dot" style={{ background: '#3a57e8' }} />
                    Practice Exams
                    <span className="rp-legend-count">{stats.practice}</span>
                  </div>
                  <div className="rp-legend-row">
                    <span className="rp-legend-dot" style={{ background: '#7c3aed' }} />
                    Assigned Tests
                    <span className="rp-legend-count">{stats.assigned}</span>
                  </div>
                </div>
              </div>

              <div className="rp-chart-card">
                <div className="rp-ring-wrap">
                  <RingChart
                    slices={[
                      { value: stats.practice, color: '#0d9e6b' },
                      { value: stats.assigned, color: '#f59e0b' },
                    ]}
                    total={stats.total}
                  />
                </div>
                <div className="rp-chart-legend">
                  <div className="rp-chart-title">Completion Status</div>
                  <div className="rp-legend-row">
                    <span className="rp-legend-dot" style={{ background: '#0d9e6b' }} />
                    Completed
                    <span className="rp-legend-count">{stats.practice}</span>
                  </div>
                  <div className="rp-legend-row">
                    <span className="rp-legend-dot" style={{ background: '#f59e0b' }} />
                    Submitted
                    <span className="rp-legend-count">{stats.assigned}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Toolbar */}
          {!loading && attempts.length > 0 && (
            <div className="rp-toolbar">
              <span className="rp-section-label">All Results</span>

              <div className="rp-search-wrap">
                <span className="rp-search-icon"><IconSearch /></span>
                <input
                  type="text"
                  className="rp-search"
                  placeholder="Search by test name…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="rp-filter-wrap">
                <select
                  className="rp-filter"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as FilterType)}
                >
                  <option value="all">All Assessments</option>
                  <option value="practice">Practice Exams</option>
                  <option value="assigned">Assigned Tests</option>
                </select>
                <span className="rp-filter-chevron"><IconChevronDown /></span>
              </div>

              <span className="rp-count">
                {filtered.length} result{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* Skeletons */}
          {loading && (
            <div className="rp-skeleton-list">
              {[0, 1, 2, 3].map((i) => (
                <div className="rp-skel-card" key={i}>
                  <div className="rp-skel rp-skel-circle" />
                  <div className="rp-skel-body">
                    <div className="rp-skel rp-skel-line w60" />
                    <div className="rp-skel rp-skel-line w35" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No attempts at all */}
          {!loading && attempts.length === 0 && (
            <div className="rp-empty">
              <div className="rp-empty-icon"><IconEmpty /></div>
              <div className="rp-empty-title">No results yet</div>
              <p className="rp-empty-desc">
                Complete a practice exam or an assigned assessment — your results will appear here.
              </p>
              <a href="/practice" className="rp-empty-cta">Browse Practice Exams →</a>
            </div>
          )}

          {/* Cards */}
          {!loading && filtered.length > 0 && (
            <div className="rp-list">
              {filtered.map((attempt: any, idx: number) => {
                const isPractice = attempt.test?.isPractice;
                const pct = attempt.percentage != null ? Number(attempt.percentage) : null;
                const date = attempt.createdAt
                  ? new Date(attempt.createdAt).toLocaleDateString(undefined, {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })
                  : null;

                return (
                  <div
                    className={`rp-card ${isPractice ? 'is-practice' : 'is-assigned'}`}
                    key={attempt.id}
                    style={{ animationDelay: `${idx * 0.045}s` }}
                  >
                    <div className={`rp-card-icon ${isPractice ? 'practice' : 'assigned'}`}>
                      {isPractice ? <IconPractice /> : <IconAssigned />}
                    </div>

                    <div className="rp-card-body">
                      <div className="rp-card-title">
                        {attempt.test?.title ?? 'Untitled Assessment'}
                      </div>
                      <div className="rp-card-meta">
                        <span className={`rp-badge ${isPractice ? 'practice' : 'assigned'}`}>
                          {isPractice ? 'Practice Exam' : 'Assigned Test'}
                        </span>
                        <span className={`rp-badge ${isPractice ? 'completed' : 'submitted'}`}>
                          <IconCheck />
                          {isPractice ? 'Completed' : 'Submitted'}
                        </span>
                        {date && (
                          <span className="rp-date">
                            <IconCalendar /> {date}
                          </span>
                        )}
                      </div>
                    </div>

                    {isPractice && pct !== null ? (
                      <div className="rp-score-area">
                        <ScoreRing pct={pct} />
                        <div className="rp-score-detail">
                          <span className="rp-score-fraction">
                            {attempt.score ?? '–'}/{attempt.totalQuestions ?? '–'}
                          </span>
                          <span className="rp-score-sub">questions</span>
                        </div>
                      </div>
                    ) : !isPractice ? (
                      <div className="rp-submitted-pill">
                        <IconCheck /> Submitted
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}

          {/* No search/filter match */}
          {!loading && attempts.length > 0 && filtered.length === 0 && (
            <div className="rp-empty">
              <div className="rp-empty-icon" style={{ background: 'var(--surface-alt)' }}>
                <IconSearch />
              </div>
              <div className="rp-empty-title">Nothing matches</div>
              <p className="rp-empty-desc">
                Try a different search term or switch the filter above.
              </p>
            </div>
          )}

        </main>

        {/* ── Footer ── */}
        <footer className="rp-footer">
          Need help with your results?&nbsp;
          <a href="mailto:support@yourplatform.com">Contact support</a>
        </footer>
      </div>
    </>
  );
}