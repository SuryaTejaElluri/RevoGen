'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import AdminNavbar from '@/components/AdminNavbar';

type SortKey = 'recent' | 'oldest' | 'alpha';

function timeAgo(dateStr?: string) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const diffMs = Date.now() - date.getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  const week = Math.floor(day / 7);
  if (week < 5) return `${week}w ago`;
  const month = Math.floor(day / 30);
  if (month < 12) return `${month}mo ago`;
  const year = Math.floor(day / 365);
  return `${year}y ago`;
}

function getTimestamp(test: any): number {
  const raw = test.createdAt || test.updatedAt || test.created_at || test.updated_at;
  const t = raw ? new Date(raw).getTime() : NaN;
  return isNaN(t) ? 0 : t;
}

export default function TestsPage() {
  const [allAssessments, setAllAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'MCQ' | 'CODING' | 'HYBRID'>('ALL');
  const [sortKey, setSortKey] = useState<SortKey>('recent');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const createRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadAll(); }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (createRef.current && !createRef.current.contains(e.target as Node)) {
        setCreateOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const loadAll = async () => {
    setLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [mcqRes, codingRes] = await Promise.allSettled([
        fetch('http://localhost:3000/tests', { headers }),
        fetch('http://localhost:3000/coding-tests', { headers }),
      ]);

      const mcqData =
        mcqRes.status === 'fulfilled' && mcqRes.value.ok
          ? (await mcqRes.value.json()).map((t: any) => ({ ...t, assessmentType: 'MCQ' }))
          : [];

      const codingData =
        codingRes.status === 'fulfilled' && codingRes.value.ok
          ? (await codingRes.value.json()).map((t: any) => ({ ...t, assessmentType: 'CODING' }))
          : [];

      setAllAssessments([...mcqData, ...codingData]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCoding = async (id: string) => {
    if (!confirm('Delete this coding assessment?')) return;
    try {
      const token = localStorage.getItem('access_token');
      await fetch(`http://localhost:3000/coding-tests/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      loadAll();
    } catch (error) {
      console.error(error);
    }
  };

  const mcqCount = allAssessments.filter((a) => a.assessmentType === 'MCQ').length;
  const codingCount = allAssessments.filter((a) => a.assessmentType === 'CODING').length;

  const filtered = useMemo(() => {
    let list =
      activeFilter === 'ALL'
        ? allAssessments
        : allAssessments.filter((a) => a.assessmentType === activeFilter);

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (a) =>
          a.title?.toLowerCase().includes(q) ||
          a.category?.toLowerCase().includes(q)
      );
    }

    const sorted = [...list];
    if (sortKey === 'recent') {
      sorted.sort((a, b) => getTimestamp(b) - getTimestamp(a));
    } else if (sortKey === 'oldest') {
      sorted.sort((a, b) => getTimestamp(a) - getTimestamp(b));
    } else if (sortKey === 'alpha') {
      sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }
    return sorted;
  }, [allAssessments, activeFilter, search, sortKey]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg-base:        #090c12;
          --bg-surface:     #11151f;
          --bg-elevated:    #161b27;
          --bg-card:        #1b2130;
          --border:         #232a3a;
          --border-hover:   #323c52;
          --accent:         #6366f1;
          --accent-bright:  #818cf8;
          --accent-soft:    rgba(99,102,241,0.14);
          --accent-glow:    rgba(99,102,241,0.3);
          --success:        #22c55e;
          --success-bright: #4ade80;
          --success-soft:   rgba(34,197,94,0.12);
          --warning:        #f59e0b;
          --warning-bright: #fbbf24;
          --warning-soft:   rgba(245,158,11,0.12);
          --danger:         #ef4444;
          --danger-bright:  #f87171;
          --danger-soft:    rgba(239,68,68,0.12);
          --orange:         #fb923c;
          --orange-soft:    rgba(251,146,60,0.12);
          --purple:         #a78bfa;
          --purple-soft:    rgba(167,139,250,0.14);
          --pink:           #f472b6;
          --pink-soft:      rgba(244,114,182,0.12);
          --text-primary:   #f1f5f9;
          --text-secondary: #8b96a8;
          --text-muted:     #4b5468;
          --radius-sm:      8px;
          --radius-md:      12px;
          --radius-lg:      16px;
          --shadow-sm:      0 2px 8px rgba(0,0,0,0.35);
          --shadow-md:      0 8px 24px rgba(0,0,0,0.45);
          --shadow-lg:      0 16px 40px rgba(0,0,0,0.55);
          --font-main:      'Plus Jakarta Sans', sans-serif;
          --font-mono:      'JetBrains Mono', monospace;
        }

        body { background: var(--bg-base); font-family: var(--font-main); color: var(--text-primary); }

        .page-wrapper {
          min-height: 100vh;
          background: var(--bg-base);
          background-image:
            radial-gradient(ellipse 70% 35% at 20% -5%, rgba(99,102,241,0.1) 0%, transparent 60%),
            radial-gradient(ellipse 60% 30% at 90% 0%, rgba(167,139,250,0.07) 0%, transparent 55%);
        }

        .page-container {
          max-width: 960px;
          margin: 0 auto;
          padding: 36px 24px 80px;
        }

        /* ── Header ── */
        .page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 28px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .page-header-left { display: flex; align-items: center; gap: 14px; }
        .page-header-icon {
          width: 46px; height: 46px;
          background: linear-gradient(135deg, var(--accent), var(--purple));
          border-radius: var(--radius-md);
          display: flex; align-items: center; justify-content: center;
          font-size: 21px;
          box-shadow: 0 4px 20px var(--accent-glow);
          flex-shrink: 0;
        }
        .page-title { font-size: 23px; font-weight: 800; letter-spacing: -0.4px; }
        .page-subtitle { font-size: 13px; color: var(--text-secondary); margin-top: 3px; }

        /* ── Create Button + Dropdown ── */
        .create-wrapper { position: relative; }
        .create-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 11px 20px;
          background: linear-gradient(135deg, var(--accent), #7c7ff5);
          color: white;
          border: none;
          border-radius: var(--radius-md);
          font-family: var(--font-main);
          font-size: 13px; font-weight: 700;
          cursor: pointer;
          text-decoration: none;
          transition: box-shadow 0.2s, transform 0.12s;
          white-space: nowrap;
          user-select: none;
        }
        .create-btn:hover {
          box-shadow: 0 6px 22px var(--accent-glow);
          transform: translateY(-1px);
        }
        .create-btn:active { transform: translateY(0) scale(0.98); }
        .create-btn .chevron { font-size: 10px; margin-left: 2px; transition: transform 0.2s; }
        .create-btn .chevron.open { transform: rotate(180deg); }

        .create-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          min-width: 220px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-hover);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          z-index: 100;
          overflow: hidden;
          animation: dropIn 0.15s ease;
        }
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
          text-decoration: none;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
          border: none;
          background: none;
          width: 100%;
          font-family: var(--font-main);
        }
        .dropdown-item:hover { background: var(--bg-card); color: var(--text-primary); }
        .dropdown-item + .dropdown-item { border-top: 1px solid var(--border); }
        .dropdown-item .di-icon { font-size: 16px; width: 20px; text-align: center; flex-shrink: 0; }
        .dropdown-item .di-label { flex: 1; }
        .dropdown-item .di-tag {
          font-size: 10px; padding: 2px 7px; border-radius: 10px;
          font-family: var(--font-mono); font-weight: 600; letter-spacing: 0.3px;
        }
        .tag-soon { background: var(--bg-surface); color: var(--text-muted); border: 1px solid var(--border); }

        /* ── Summary Bar ── */
        .summary-bar {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }
        .summary-chip {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 16px;
          text-align: center;
          transition: border-color 0.2s, transform 0.15s;
        }
        .summary-chip:hover { border-color: var(--border-hover); transform: translateY(-2px); }
        .summary-value {
          font-size: 26px; font-weight: 800;
          font-family: var(--font-mono);
          line-height: 1;
        }
        .summary-label {
          font-size: 11px; color: var(--text-muted);
          margin-top: 5px;
          text-transform: uppercase; letter-spacing: 0.7px;
          font-weight: 600;
        }

        /* ── Toolbar: filters + search + sort ── */
        .toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .filter-bar { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .filter-tab {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 20px;
          font-family: var(--font-main);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid var(--border);
          background: var(--bg-surface);
          color: var(--text-secondary);
          transition: background 0.15s, border-color 0.15s, color 0.15s, transform 0.1s;
          user-select: none;
        }
        .filter-tab:hover {
          background: var(--bg-elevated);
          border-color: var(--border-hover);
          color: var(--text-primary);
          transform: translateY(-1px);
        }
        .filter-tab.active {
          background: var(--accent-soft);
          border-color: rgba(99,102,241,0.4);
          color: var(--accent-bright);
        }
        .filter-tab.active-coding {
          background: var(--purple-soft);
          border-color: rgba(167,139,250,0.4);
          color: var(--purple);
        }
        .filter-tab.active-hybrid {
          background: var(--orange-soft);
          border-color: rgba(251,146,60,0.4);
          color: var(--orange);
        }
        .filter-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          border-radius: 9px;
          font-size: 10px;
          font-weight: 700;
          font-family: var(--font-mono);
          background: var(--bg-card);
          color: var(--text-muted);
        }
        .filter-tab.active .filter-count { background: rgba(99,102,241,0.2); color: var(--accent-bright); }
        .filter-tab.active-coding .filter-count { background: rgba(167,139,250,0.2); color: var(--purple); }
        .filter-tab.active-hybrid .filter-count { background: rgba(251,146,60,0.2); color: var(--orange); }

        .right-controls { display: flex; align-items: center; gap: 8px; }
        .search-box {
          display: flex; align-items: center; gap: 7px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 8px 12px;
          transition: border-color 0.15s;
        }
        .search-box:focus-within { border-color: var(--accent); }
        .search-box input {
          background: none; border: none; outline: none;
          color: var(--text-primary); font-size: 12px;
          font-family: var(--font-main);
          width: 140px;
        }
        .search-box input::placeholder { color: var(--text-muted); }
        .search-box .si { color: var(--text-muted); font-size: 14px; }

        .sort-select {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          color: var(--text-secondary);
          border-radius: var(--radius-sm);
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 500;
          font-family: var(--font-main);
          cursor: pointer;
          transition: border-color 0.15s;
        }
        .sort-select:hover, .sort-select:focus { border-color: var(--border-hover); outline: none; }

        /* ── Empty State ── */
        .empty-state { text-align: center; padding: 70px 24px; color: var(--text-muted); }
        .empty-icon { font-size: 42px; margin-bottom: 14px; opacity: 0.7; }
        .empty-text { font-size: 15px; line-height: 1.6; }
        .empty-text strong { color: var(--text-secondary); }

        /* ── Skeleton ── */
        .skeleton-card {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 22px;
          margin-bottom: 14px;
          animation: pulse 1.5s ease-in-out infinite;
        }
        .skeleton-line { background: var(--bg-card); border-radius: 4px; height: 14px; margin-bottom: 10px; }
        .skeleton-line.short { width: 40%; }
        .skeleton-line.medium { width: 65%; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }

        /* ── Test Card ── */
        .test-card {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 20px 22px;
          margin-bottom: 14px;
          transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
          position: relative;
          overflow: hidden;
        }
        .test-card::before {
          content: '';
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 3px;
          opacity: 0.9;
        }
        .test-card.type-mcq::before    { background: linear-gradient(180deg, var(--accent), var(--accent-bright)); }
        .test-card.type-coding::before { background: linear-gradient(180deg, var(--purple), #c4b5fd); }
        .test-card.type-hybrid::before { background: linear-gradient(180deg, var(--orange), #fdba74); }
        .test-card:hover {
          border-color: var(--border-hover);
          box-shadow: var(--shadow-md);
          transform: translateY(-2px);
        }

        .test-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 14px;
          flex-wrap: wrap;
        }
        .test-title { font-size: 16px; font-weight: 700; color: var(--text-primary); letter-spacing: -0.2px; }
        .test-timestamp {
          font-size: 11px;
          color: var(--text-muted);
          font-family: var(--font-mono);
          white-space: nowrap;
          flex-shrink: 0;
          display: flex; align-items: center; gap: 4px;
        }
        .test-meta { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; align-items: center; }
        .meta-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 11px;
          border-radius: 20px;
          font-size: 12px; font-weight: 600;
          font-family: var(--font-mono);
          white-space: nowrap;
        }
        .badge-blue   { background: var(--accent-soft);   color: var(--accent-bright);   border: 1px solid rgba(99,102,241,0.25); }
        .badge-green  { background: var(--success-soft);  color: var(--success-bright);  border: 1px solid rgba(34,197,94,0.25); }
        .badge-yellow { background: var(--warning-soft);  color: var(--warning-bright);  border: 1px solid rgba(245,158,11,0.25); }
        .badge-purple { background: var(--purple-soft);   color: var(--purple);          border: 1px solid rgba(167,139,250,0.25); }
        .badge-orange { background: var(--orange-soft);   color: var(--orange);          border: 1px solid rgba(251,146,60,0.25); }
        .badge-pink   { background: var(--pink-soft);     color: var(--pink);            border: 1px solid rgba(244,114,182,0.25); }
        .badge-type-mcq    { background: var(--accent-soft);  color: var(--accent-bright);  border: 1px solid rgba(99,102,241,0.35);  font-weight: 700; }
        .badge-type-coding { background: var(--purple-soft);  color: var(--purple);         border: 1px solid rgba(167,139,250,0.35); font-weight: 700; }
        .badge-type-hybrid { background: var(--orange-soft);  color: var(--orange);         border: 1px solid rgba(251,146,60,0.35);  font-weight: 700; }

        /* ── Action Buttons ── */
        .test-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 16px;
          padding-top: 14px;
          border-top: 1px solid var(--border);
          align-items: center;
        }
        .action-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: var(--radius-sm);
          font-family: var(--font-main);
          font-size: 12px; font-weight: 600;
          cursor: pointer;
          text-decoration: none;
          transition: background 0.15s, border-color 0.15s, color 0.15s, transform 0.1s;
          border: 1px solid var(--border);
          background: var(--bg-card);
          color: var(--text-secondary);
          white-space: nowrap;
        }
        .action-btn:hover {
          background: var(--bg-elevated);
          border-color: var(--border-hover);
          color: var(--text-primary);
          transform: translateY(-1px);
        }
        .action-btn.primary { background: var(--accent-soft); border-color: rgba(99,102,241,0.3); color: var(--accent-bright); }
        .action-btn.primary:hover { background: rgba(99,102,241,0.22); border-color: var(--accent); }
        .action-btn.success-btn { background: var(--success-soft); border-color: rgba(34,197,94,0.3); color: var(--success-bright); }
        .action-btn.success-btn:hover { background: rgba(34,197,94,0.22); border-color: var(--success); }
        .action-btn.purple-btn { background: var(--purple-soft); border-color: rgba(167,139,250,0.3); color: var(--purple); }
        .action-btn.purple-btn:hover { background: rgba(167,139,250,0.22); border-color: var(--purple); }
        .action-btn.warning-btn { background: var(--warning-soft); border-color: rgba(245,158,11,0.3); color: var(--warning-bright); }
        .action-btn.warning-btn:hover { background: rgba(245,158,11,0.22); border-color: var(--warning); }
        .action-btn.danger-btn { background: var(--danger-soft); border-color: rgba(239,68,68,0.3); color: var(--danger-bright); }
        .action-btn.danger-btn:hover { background: rgba(239,68,68,0.22); border-color: var(--danger); }

        .section-label {
          font-size: 11px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 1px;
          color: var(--text-muted);
          margin-bottom: 14px;
          display: flex; align-items: center; gap: 8px;
        }

        @media (max-width: 600px) {
          .summary-bar { grid-template-columns: repeat(3, 1fr); }
          .page-header { gap: 12px; }
          .toolbar { flex-direction: column; align-items: stretch; }
          .right-controls { justify-content: space-between; }
          .search-box input { width: 100%; }
          .test-actions { gap: 6px; }
          .action-btn { padding: 7px 12px; font-size: 11px; }
        }
      `}</style>

      <AdminNavbar />

      <div className="page-wrapper">
        <div className="page-container">

          {/* Header */}
          <div className="page-header">
            <div className="page-header-left">
              <div className="page-header-icon">🗂️</div>
              <div>
                <div className="page-title">Assessment management</div>
                <div className="page-subtitle">Create, manage and assign assessments to candidates</div>
              </div>
            </div>

            <div className="create-wrapper" ref={createRef}>
              <button className="create-btn" onClick={() => setCreateOpen((o) => !o)}>
                <span>＋</span> Create assessment
                <span className={`chevron${createOpen ? ' open' : ''}`}>▾</span>
              </button>

              {createOpen && (
                <div className="create-dropdown">
                  <Link href="/admin/tests/new" className="dropdown-item" onClick={() => setCreateOpen(false)}>
                    <span className="di-icon">📝</span>
                    <span className="di-label">MCQ assessment</span>
                  </Link>
                  <Link href="/admin/coding-tests/create" className="dropdown-item" onClick={() => setCreateOpen(false)}>
                    <span className="di-icon">💻</span>
                    <span className="di-label">Coding assessment</span>
                  </Link>
                  <Link href="/admin/hybrid-tests/create" className="dropdown-item" onClick={() => setCreateOpen(false)}>
                    <span className="di-icon">🔀</span>
                    <span className="di-label">Hybrid assessment</span>
                    <span className="di-tag tag-soon">Soon</span>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          {!loading && (
            <div className="summary-bar">
              <div className="summary-chip">
                <div className="summary-value" style={{ color: 'var(--text-primary)' }}>{allAssessments.length}</div>
                <div className="summary-label">Total</div>
              </div>
              <div className="summary-chip">
                <div className="summary-value" style={{ color: 'var(--accent-bright)' }}>{mcqCount}</div>
                <div className="summary-label">MCQ</div>
              </div>
              <div className="summary-chip">
                <div className="summary-value" style={{ color: 'var(--purple)' }}>{codingCount}</div>
                <div className="summary-label">Coding</div>
              </div>
            </div>
          )}

          {/* Toolbar: Filters + Search + Sort */}
          {!loading && (
            <div className="toolbar">
              <div className="filter-bar">
                <button
                  className={`filter-tab${activeFilter === 'ALL' ? ' active' : ''}`}
                  onClick={() => setActiveFilter('ALL')}
                >
                  All
                  <span className="filter-count">{allAssessments.length}</span>
                </button>
                <button
                  className={`filter-tab${activeFilter === 'MCQ' ? ' active' : ''}`}
                  onClick={() => setActiveFilter('MCQ')}
                >
                  🟢 MCQ
                  <span className="filter-count">{mcqCount}</span>
                </button>
                <button
                  className={`filter-tab${activeFilter === 'CODING' ? ' active-coding' : ''}`}
                  onClick={() => setActiveFilter('CODING')}
                >
                  🟣 Coding
                  <span className="filter-count">{codingCount}</span>
                </button>
                <button
                  className={`filter-tab${activeFilter === 'HYBRID' ? ' active-hybrid' : ''}`}
                  onClick={() => setActiveFilter('HYBRID')}
                >
                  🟠 Hybrid
                  <span className="filter-count">0</span>
                </button>
              </div>

              <div className="right-controls">
                <div className="search-box">
                  <span className="si">🔍</span>
                  <input
                    type="text"
                    placeholder="Search title or category…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <select
                  className="sort-select"
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as SortKey)}
                >
                  <option value="recent">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="alpha">A → Z</option>
                </select>
              </div>
            </div>
          )}

          {/* Skeleton Loading */}
          {loading && [1, 2, 3].map((i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-line medium" />
              <div className="skeleton-line short" />
              <div className="skeleton-line short" style={{ width: '30%' }} />
            </div>
          ))}

          {/* Empty */}
          {!loading && filtered.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <div className="empty-text">
                {search.trim() ? (
                  <>No assessments match <strong>&ldquo;{search}&rdquo;</strong>.</>
                ) : activeFilter === 'ALL' ? (
                  <>No assessments created yet. Click <strong>Create assessment</strong> to get started.</>
                ) : (
                  <>No {activeFilter.toLowerCase()} assessments found.</>
                )}
              </div>
            </div>
          )}

          {/* Cards */}
          {!loading && filtered.length > 0 && (
            <>
              <div className="section-label">
                <span>{filtered.length} assessment{filtered.length !== 1 ? 's' : ''} found</span>
              </div>

              {filtered.map((test: any) => {
                const isMCQ = test.assessmentType === 'MCQ';
                const isCoding = test.assessmentType === 'CODING';
                const isHybrid = test.assessmentType === 'HYBRID';
                const typeClass = isMCQ ? 'type-mcq' : isCoding ? 'type-coding' : 'type-hybrid';
                const ts = test.createdAt || test.updatedAt || test.created_at || test.updated_at;

                return (
                  <div key={`${test.assessmentType}-${test.id}`} className={`test-card ${typeClass}`}>
                    <div className="test-card-header">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="test-title">{test.title}</div>
                        <div className="test-meta">
                          {isMCQ && <span className="meta-badge badge-type-mcq">🟢 MCQ</span>}
                          {isCoding && <span className="meta-badge badge-type-coding">🟣 CODING</span>}
                          {isHybrid && <span className="meta-badge badge-type-hybrid">🟠 HYBRID</span>}

                          {test.category && (
                            <span className="meta-badge badge-pink">🏷 {test.category}</span>
                          )}
                          {test.duration != null && (
                            <span className="meta-badge badge-yellow">⏱ {test.duration} mins</span>
                          )}
                          {(test.questions?.length != null) && (
                            <span className="meta-badge badge-green">❓ {test.questions.length} Questions</span>
                          )}
                          <span className="meta-badge badge-blue">🆔 {test.id?.toString().slice(0, 8)}…</span>
                        </div>
                      </div>
                      {ts && (
                        <div className="test-timestamp">🕒 {timeAgo(ts)}</div>
                      )}
                    </div>

                    <div className="test-actions">
                      {isMCQ && (
                        <>
                          <Link href={`/admin/tests/${test.id}`} className="action-btn primary">👁 View test</Link>
                          <Link href={`/admin/tests/${test.id}/questions`} className="action-btn">❓ Manage questions</Link>
                          <Link href={`/admin/tests/${test.id}/results`} className="action-btn success-btn">📊 View results</Link>
                          <Link href={`/admin/tests/${test.id}/invite`} className="action-btn warning-btn">✉️ Assign test</Link>
                        </>
                      )}

                      {isCoding && (
                        <>
                          <Link href={`/admin/coding-tests/${test.id}`} className="action-btn purple-btn">👁 View assessment</Link>
                          <Link href={`/admin/coding-tests/${test.id}/results`} className="action-btn success-btn">📊 View results</Link>
                          <Link href={`/admin/coding-tests/${test.id}/assign`} className="action-btn success-btn">✉️ Assign</Link>
                          <button className="action-btn danger-btn" onClick={() => handleDeleteCoding(test.id)}>
                            🗑 Delete
                          </button>
                        </>
                      )}

                      {isHybrid && (
                        <Link href={`/admin/hybrid-tests/${test.id}`} className="action-btn primary">
                          👁 View assessment
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}

        </div>
      </div>
    </>
  );
}