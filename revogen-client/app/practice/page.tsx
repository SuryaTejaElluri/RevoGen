'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { API_BASE_URL } from '@/lib/api';

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
  </svg>
);
const IconClock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);
const IconList = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);
const IconPlay = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);
const IconBook = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);
const IconEmpty = () => (
  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    <line x1="9" y1="9" x2="15" y2="9" /><line x1="9" y1="13" x2="13" y2="13" />
  </svg>
);
const IconChevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6" />
  </svg>
);
const IconArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);
const IconZap = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);
const IconTarget = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
  </svg>
);
const IconTrophy = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="8 21 12 17 16 21" />
    <line x1="12" y1="17" x2="12" y2="11" />
    <path d="M7 4H4v7a5 5 0 0 0 10 0V4H7z" />
    <path d="M17 4h3v7a5 5 0 0 1-10 0" />
  </svg>
);

// ─── Theme definitions ────────────────────────────────────────────────────────
const themes = {
  light: {
    bg:           '#F0F2F8',
    surface:      '#FFFFFF',
    surfaceAlt:   '#F7F8FC',
    border:       '#E2E6F0',
    text:         '#0F1523',
    textMuted:    '#6B7280',
    textSubtle:   '#9CA3AF',
    accent:       '#4F6EF7',
    accentHover:  '#3B5BDB',
    accentSoft:   '#EEF1FE',
    accentMuted:  '#C7D2FE',
    success:      '#10B981',
    successSoft:  '#ECFDF5',
    amber:        '#F59E0B',
    amberSoft:    '#FFFBEB',
    rose:         '#F43F5E',
    roseSoft:     '#FFF1F3',
    shadow:       '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
    shadowHover:  '0 8px 32px rgba(79,110,247,0.14)',
    shadowLg:     '0 12px 40px rgba(0,0,0,0.10)',
    gradStart:    '#4F6EF7',
    gradEnd:      '#7C3AED',
    navBg:        '#FFFFFF',
    skeletonBase: '#E2E6F0',
    skeletonShim: '#EEF0F8',
  },
  dark: {
    bg:           '#0B0E1A',
    surface:      '#141827',
    surfaceAlt:   '#1A1F33',
    border:       '#252C45',
    text:         '#E8ECFD',
    textMuted:    '#8891B4',
    textSubtle:   '#4A5178',
    accent:       '#6B8BFF',
    accentHover:  '#8BA3FF',
    accentSoft:   '#1A2040',
    accentMuted:  '#2D3A6B',
    success:      '#34D399',
    successSoft:  '#0D2B23',
    amber:        '#FBBF24',
    amberSoft:    '#2B2010',
    rose:         '#F87171',
    roseSoft:     '#2B1215',
    shadow:       '0 1px 3px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.3)',
    shadowHover:  '0 8px 32px rgba(107,139,255,0.2)',
    shadowLg:     '0 12px 40px rgba(0,0,0,0.5)',
    gradStart:    '#6B8BFF',
    gradEnd:      '#A78BFA',
    navBg:        '#141827',
    skeletonBase: '#1A2040',
    skeletonShim: '#252C45',
  },
};

// ─── Difficulty helper ────────────────────────────────────────────────────────
function getDifficulty(duration: number): { label: string; type: 'quick' | 'medium' | 'hard' } {
  if (duration <= 20) return { label: 'Quick', type: 'quick' };
  if (duration <= 45) return { label: 'Medium', type: 'medium' };
  return { label: 'In-depth', type: 'hard' };
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────
function SkeletonCard({ t }: { t: typeof themes.light }) {
  return (
    <div style={{
      background: t.surface, border: `1px solid ${t.border}`,
      borderRadius: '16px', padding: '26px',
      display: 'flex', flexDirection: 'column', gap: '16px',
    }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div style={{ width: 44, height: 44, borderRadius: '12px', background: t.skeletonBase, flexShrink: 0, animation: 'shimmer 1.4s infinite' }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ height: 14, borderRadius: '6px', background: t.skeletonBase, width: '75%', animation: 'shimmer 1.4s infinite' }} />
          <div style={{ height: 11, borderRadius: '6px', background: t.skeletonBase, width: '40%', animation: 'shimmer 1.4s infinite 0.1s' }} />
        </div>
      </div>
      <div style={{ height: 1, background: t.border }} />
      <div style={{ display: 'flex', gap: '16px' }}>
        <div style={{ height: 12, borderRadius: '6px', background: t.skeletonBase, width: '30%', animation: 'shimmer 1.4s infinite 0.05s' }} />
        <div style={{ height: 12, borderRadius: '6px', background: t.skeletonBase, width: '30%', animation: 'shimmer 1.4s infinite 0.1s' }} />
      </div>
      <div style={{ height: 44, borderRadius: '10px', background: t.skeletonBase, animation: 'shimmer 1.4s infinite' }} />
    </div>
  );
}

// ─── Test Card ────────────────────────────────────────────────────────────────
function TestCard({ test, idx, t }: { test: any; idx: number; t: typeof themes.light }) {
  const [hovered, setHovered] = useState(false);
  const diff = getDifficulty(test.duration);

  const diffStyles: Record<string, { bg: string; color: string; border: string }> = {
    quick:  { bg: t.successSoft, color: t.success,  border: t.success + '40' },
    medium: { bg: t.amberSoft,   color: t.amber,    border: t.amber + '40' },
    hard:   { bg: t.roseSoft,    color: t.rose,     border: t.rose + '40' },
  };
  const ds = diffStyles[diff.type];

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: t.surface,
        border: `1px solid ${hovered ? t.accentMuted : t.border}`,
        borderRadius: '16px',
        padding: '26px',
        display: 'flex', flexDirection: 'column',
        boxShadow: hovered ? t.shadowHover : t.shadow,
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'all 0.22s cubic-bezier(.4,0,.2,1)',
        animation: 'fadeUp 0.38s ease both',
        animationDelay: `${idx * 55}ms`,
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Accent top bar on hover */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
        background: `linear-gradient(90deg, ${t.gradStart}, ${t.gradEnd})`,
        opacity: hovered ? 1 : 0, transition: 'opacity 0.2s',
      }} />

      {/* Card top */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
        <div style={{
          width: 44, height: 44, borderRadius: '12px',
          background: t.accentSoft, color: t.accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <IconBook />
        </div>
        <div style={{ flex: 1, marginTop: '2px' }}>
          <p style={{
            fontWeight: 700, fontSize: '15px', color: t.text,
            lineHeight: 1.35, margin: 0, fontFamily: "'DM Sans', sans-serif",
          }}>{test.title}</p>
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px',
          padding: '3px 9px', borderRadius: '20px',
          fontSize: '11px', fontWeight: 700, letterSpacing: '0.03em',
          background: ds.bg, color: ds.color, border: `1px solid ${ds.border}`,
          flexShrink: 0,
        }}>
          <IconZap /> {diff.label}
        </span>
      </div>

      <div style={{ height: 1, background: t.border, marginBottom: '16px' }} />

      {/* Meta */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: t.textMuted, fontWeight: 500 }}>
          <IconClock />
          <strong style={{ color: t.text, fontWeight: 700 }}>{test.duration}</strong> mins
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: t.textMuted, fontWeight: 500 }}>
          <IconList />
          <strong style={{ color: t.text, fontWeight: 700 }}>{test.questions.length}</strong> questions
        </div>
      </div>

      {/* CTA */}
      <Link href={`/tests/${test.id}`} style={{ textDecoration: 'none', marginTop: 'auto' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          height: '44px', borderRadius: '10px',
          background: hovered
            ? `linear-gradient(135deg, ${t.gradStart}, ${t.gradEnd})`
            : t.accentSoft,
          color: hovered ? '#fff' : t.accent,
          fontSize: '14px', fontWeight: 700, letterSpacing: '0.02em',
          boxShadow: hovered ? `0 4px 18px ${t.accent}40` : 'none',
          transition: 'all 0.22s cubic-bezier(.4,0,.2,1)',
          fontFamily: "'DM Sans', sans-serif",
          cursor: 'pointer',
        }}>
          <IconPlay /> Start Exam <IconArrow />
        </div>
      </Link>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PracticePage() {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'default' | 'duration' | 'questions'>('default');
  const [isDark, setIsDark] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const t = isDark ? themes.dark : themes.light;

  useEffect(() => { loadTests(); }, []);

  const loadTests = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/tests/practice`);
      const data = await res.json();
      setTests(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let list = tests.filter(t => t.title?.toLowerCase().includes(search.toLowerCase()));
    if (sort === 'duration')  list = [...list].sort((a, b) => a.duration - b.duration);
    if (sort === 'questions') list = [...list].sort((a, b) => b.questions.length - a.questions.length);
    return list;
  }, [tests, search, sort]);

  const totalQuestions = tests.reduce((s, t) => s + (t.questions?.length ?? 0), 0);
  const avgDuration    = tests.length
    ? Math.round(tests.reduce((s, t) => s + (t.duration ?? 0), 0) / tests.length)
    : 0;

  const stats = [
    { label: 'Available Exams',   value: tests.length,    unit: '',  icon: <IconBook />,   color: t.accent,   colorSoft: t.accentSoft },
    { label: 'Total Questions',   value: totalQuestions,  unit: '',  icon: <IconTarget />, color: t.success,  colorSoft: t.successSoft },
    { label: 'Avg. Duration',     value: avgDuration,     unit: 'm', icon: <IconTrophy />, color: t.amber,    colorSoft: t.amberSoft },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .practice-select {
          appearance: none;
          -webkit-appearance: none;
          cursor: pointer;
        }
        .practice-select:focus { outline: none; }

        @media (max-width: 768px) {
          .stats-grid  { grid-template-columns: 1fr 1fr !important; }
          .tests-grid  { grid-template-columns: 1fr !important; }
          .toolbar-row { flex-direction: column !important; align-items: stretch !important; }
        }
        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: 1fr !important; }
          .page-pad   { padding: 0 16px !important; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: t.bg, transition: 'background 0.3s', fontFamily: "'DM Sans', sans-serif", color: t.text }}>
        <Navbar />

        {/* ── Sticky top bar ── */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: t.navBg, borderBottom: `1px solid ${t.border}`,
          padding: '12px 32px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: t.shadow, transition: 'background 0.3s, border-color 0.3s',
        }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.accent, marginBottom: '2px' }}>
              Assessment Hub
            </p>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: t.text, letterSpacing: '-0.02em', lineHeight: 1 }}>
              Practice Exams
            </h1>
          </div>

          {/* Theme toggle */}
          <button
            onClick={() => setIsDark(d => !d)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: t.surfaceAlt, border: `1px solid ${t.border}`,
              borderRadius: '50px', padding: '6px 14px',
              cursor: 'pointer', color: t.text, fontWeight: 600, fontSize: '13px',
              transition: 'all 0.2s', boxShadow: t.shadow,
              fontFamily: "'DM Sans', sans-serif",
            }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = t.shadowHover)}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = t.shadow)}
          >
            <span style={{ fontSize: '16px' }}>{isDark ? '☀️' : '🌙'}</span>
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>

        <div className="page-pad" style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>

          {/* ── Hero banner ── */}
          <div style={{
            background: `linear-gradient(135deg, ${t.gradStart} 0%, ${t.gradEnd} 100%)`,
            borderRadius: '20px', padding: '36px 40px',
            marginBottom: '32px',
            boxShadow: `0 8px 32px ${t.accent}40`,
            animation: 'fadeUp 0.4s ease both',
          }}>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>
              Sharpen your skills
            </p>
            <h2 style={{ color: '#fff', fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '8px' }}>
              Ready to ace your next interview? 🎯
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: '14px', maxWidth: 480, lineHeight: 1.6 }}>
              Practice with real-world assessments. Each exam is timed and mirrors what top companies actually test.
            </p>
          </div>

          {/* ── Stats ── */}
          {!loading && tests.length > 0 && (
            <div className="stats-grid" style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px',
            }}>
              {stats.map((s, i) => (
                <div key={s.label} style={{
                  background: t.surface, border: `1px solid ${t.border}`,
                  borderRadius: '14px', padding: '20px 22px',
                  display: 'flex', alignItems: 'center', gap: '14px',
                  boxShadow: t.shadow,
                  animation: 'fadeUp 0.4s ease both',
                  animationDelay: `${i * 60}ms`,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'default',
                }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
                    (e.currentTarget as HTMLElement).style.boxShadow = t.shadowHover;
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                    (e.currentTarget as HTMLElement).style.boxShadow = t.shadow;
                  }}
                >
                  <div style={{
                    width: 46, height: 46, borderRadius: '12px',
                    background: s.colorSoft, color: s.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>{s.icon}</div>
                  <div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: t.text, letterSpacing: '-0.03em', lineHeight: 1, fontFamily: "'DM Mono', monospace" }}>
                      {s.value}<span style={{ fontSize: '16px', fontWeight: 600 }}>{s.unit}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: t.textMuted, fontWeight: 600, marginTop: '3px', letterSpacing: '0.02em' }}>
                      {s.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Toolbar ── */}
          {!loading && tests.length > 0 && (
            <div className="toolbar-row" style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              marginBottom: '24px', flexWrap: 'wrap',
            }}>
              {/* Search */}
              <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                <span style={{
                  position: 'absolute', left: '14px', top: '50%',
                  transform: 'translateY(-50%)', color: t.textMuted,
                  display: 'flex', pointerEvents: 'none',
                }}>
                  <IconSearch />
                </span>
                <input
                  type="text"
                  placeholder="Search exams…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  style={{
                    width: '100%', height: '42px',
                    border: `1.5px solid ${searchFocused ? t.accent : t.border}`,
                    borderRadius: '10px', padding: '0 14px 0 40px',
                    fontSize: '14px', background: t.surface, color: t.text,
                    fontFamily: "'DM Sans', sans-serif",
                    outline: 'none',
                    boxShadow: searchFocused ? `0 0 0 3px ${t.accentSoft}` : 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                />
              </div>

              {/* Sort */}
              <div style={{ position: 'relative' }}>
                <select
                  className="practice-select"
                  value={sort}
                  onChange={e => setSort(e.target.value as any)}
                  style={{
                    height: '42px', minWidth: '160px',
                    border: `1.5px solid ${t.border}`, borderRadius: '10px',
                    padding: '0 36px 0 14px',
                    fontSize: '14px', background: t.surface, color: t.text,
                    fontFamily: "'DM Sans', sans-serif",
                    transition: 'border-color 0.2s',
                  }}
                >
                  <option value="default">Default Order</option>
                  <option value="duration">Shortest First</option>
                  <option value="questions">Most Questions</option>
                </select>
                <span style={{
                  position: 'absolute', right: '12px', top: '50%',
                  transform: 'translateY(-50%)', color: t.textMuted, pointerEvents: 'none',
                }}>
                  <IconChevron />
                </span>
              </div>

              {/* Result count */}
              <span style={{
                fontSize: '13px', color: t.textMuted, fontWeight: 600, whiteSpace: 'nowrap',
                padding: '8px 14px', background: t.surfaceAlt,
                border: `1px solid ${t.border}`, borderRadius: '10px',
              }}>
                {filtered.length} exam{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* ── Skeleton ── */}
          {loading && (
            <div className="tests-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
              {[0, 1, 2, 3, 4, 5].map(i => <SkeletonCard key={i} t={t} />)}
            </div>
          )}

          {/* ── Empty state ── */}
          {!loading && filtered.length === 0 && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: '16px',
              padding: '80px 24px', textAlign: 'center',
              animation: 'fadeUp 0.5s ease',
            }}>
              <div style={{
                width: 96, height: 96, borderRadius: '24px',
                background: t.accentSoft, color: t.accent,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '8px',
              }}>
                <IconEmpty />
              </div>
              <p style={{ fontSize: '20px', fontWeight: 800, color: t.text, letterSpacing: '-0.02em' }}>
                {tests.length === 0 ? 'No Exams Available' : 'No Matches Found'}
              </p>
              <p style={{ fontSize: '14px', color: t.textMuted, maxWidth: '360px', lineHeight: 1.65 }}>
                {tests.length === 0
                  ? 'Check back soon — new practice exams will be added shortly.'
                  : "Try adjusting your search to find what you're looking for."}
              </p>
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{
                    background: t.accentSoft, color: t.accent, border: 'none',
                    borderRadius: '10px', padding: '10px 20px', fontWeight: 700,
                    fontSize: '14px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Clear Search
                </button>
              )}
            </div>
          )}

          {/* ── Cards grid ── */}
          {!loading && filtered.length > 0 && (
            <div className="tests-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
              {filtered.map((test, idx) => (
                <TestCard key={test.id} test={test} idx={idx} t={t} />
              ))}
            </div>
          )}

        </div>
      </div>
    </>
  );
}