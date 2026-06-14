'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import AdminNavbar from '@/components/AdminNavbar';

export default function TestsPage() {
  const [allAssessments, setAllAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'MCQ' | 'CODING' | 'HYBRID'>('ALL');
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
    const token = localStorage.getItem(
      'access_token',
    );

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    const [mcqRes, codingRes] =
      await Promise.allSettled([
        fetch(
          'http://localhost:3000/tests',
          { headers },
        ),
        fetch(
          'http://localhost:3000/coding-tests',
          { headers },
        ),
      ]);

    const mcqData =
      mcqRes.status === 'fulfilled' &&
      mcqRes.value.ok
        ? (await mcqRes.value.json()).map(
            (t: any) => ({
              ...t,
              assessmentType: 'MCQ',
            }),
          )
        : [];

    const codingData =
      codingRes.status === 'fulfilled' &&
      codingRes.value.ok
        ? (await codingRes.value.json()).map(
            (t: any) => ({
              ...t,
              assessmentType: 'CODING',
            }),
          )
        : [];

    setAllAssessments([
      ...mcqData,
      ...codingData,
    ]);
  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }
};

  const handleDeleteCoding = async (id: string) => {
    if (!confirm('Delete this coding assessment?')) return;
    try {
     const token =
  localStorage.getItem('access_token');

await fetch(
  `http://localhost:3000/coding-tests/${id}`,
  {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  },
);
      loadAll();
    } catch (error) {
      console.error(error);
    }
  };

  const filtered =
    activeFilter === 'ALL'
      ? allAssessments
      : allAssessments.filter((a) => a.assessmentType === activeFilter);

  const mcqCount = allAssessments.filter((a) => a.assessmentType === 'MCQ').length;
  const codingCount = allAssessments.filter((a) => a.assessmentType === 'CODING').length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg-base:        #0d1117;
          --bg-surface:     #161b22;
          --bg-elevated:    #1c2330;
          --bg-card:        #21262d;
          --border:         #30363d;
          --border-hover:   #3d444d;
          --accent:         #388bfd;
          --accent-soft:    rgba(56,139,253,0.12);
          --accent-glow:    rgba(56,139,253,0.25);
          --success:        #3fb950;
          --success-soft:   rgba(63,185,80,0.12);
          --warning:        #d29922;
          --warning-soft:   rgba(210,153,34,0.12);
          --danger:         #f85149;
          --danger-soft:    rgba(248,81,73,0.12);
          --orange:         #f0883e;
          --orange-soft:    rgba(240,136,62,0.12);
          --purple:         #bc8cff;
          --purple-soft:    rgba(188,140,255,0.12);
          --text-primary:   #e6edf3;
          --text-secondary: #8b949e;
          --text-muted:     #484f58;
          --radius-sm:      6px;
          --radius-md:      10px;
          --radius-lg:      14px;
          --shadow-sm:      0 1px 3px rgba(0,0,0,0.4);
          --shadow-md:      0 4px 12px rgba(0,0,0,0.5);
          --shadow-lg:      0 8px 24px rgba(0,0,0,0.6);
          --font-main:      'Sora', sans-serif;
          --font-mono:      'JetBrains Mono', monospace;
        }

        body { background: var(--bg-base); font-family: var(--font-main); color: var(--text-primary); }

        .page-wrapper {
          min-height: 100vh;
          background: var(--bg-base);
          background-image: radial-gradient(ellipse 80% 40% at 50% -5%, rgba(56,139,253,0.07) 0%, transparent 60%);
        }

        .page-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 36px 24px 80px;
        }

        /* ── Header ── */
        .page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 32px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .page-header-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .page-header-icon {
          width: 44px; height: 44px;
          background: var(--accent-soft);
          border: 1px solid rgba(56,139,253,0.3);
          border-radius: var(--radius-md);
          display: flex; align-items: center; justify-content: center;
          font-size: 20px;
          box-shadow: 0 0 16px var(--accent-glow);
          flex-shrink: 0;
        }
        .page-title { font-size: 22px; font-weight: 700; letter-spacing: -0.3px; }
        .page-subtitle { font-size: 13px; color: var(--text-secondary); margin-top: 2px; }

        /* ── Create Button + Dropdown ── */
        .create-wrapper {
          position: relative;
        }
        .create-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          background: var(--accent);
          color: white;
          border: none;
          border-radius: var(--radius-md);
          font-family: var(--font-main);
          font-size: 13px; font-weight: 600;
          cursor: pointer;
          text-decoration: none;
          transition: background 0.2s, box-shadow 0.2s, transform 0.1s;
          white-space: nowrap;
          user-select: none;
        }
        .create-btn:hover {
          background: #4493ff;
          box-shadow: 0 4px 16px var(--accent-glow);
          transform: translateY(-1px);
        }
        .create-btn:active { transform: translateY(0); }
        .create-btn .chevron {
          font-size: 10px;
          margin-left: 2px;
          transition: transform 0.2s;
        }
        .create-btn .chevron.open { transform: rotate(180deg); }

        .create-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          min-width: 210px;
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
          padding: 11px 16px;
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
        .dropdown-item:hover {
          background: var(--bg-card);
          color: var(--text-primary);
        }
        .dropdown-item + .dropdown-item {
          border-top: 1px solid var(--border);
        }
        .dropdown-item .di-icon {
          font-size: 15px;
          width: 20px;
          text-align: center;
          flex-shrink: 0;
        }
        .dropdown-item .di-label { flex: 1; }
        .dropdown-item .di-tag {
          font-size: 10px;
          padding: 2px 7px;
          border-radius: 10px;
          font-family: var(--font-mono);
          font-weight: 600;
          letter-spacing: 0.3px;
        }
        .tag-soon {
          background: var(--bg-surface);
          color: var(--text-muted);
          border: 1px solid var(--border);
        }

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
          padding: 14px 16px;
          text-align: center;
        }
        .summary-value {
          font-size: 24px; font-weight: 700;
          font-family: var(--font-mono);
          color: var(--accent);
          line-height: 1;
        }
        .summary-label {
          font-size: 11px; color: var(--text-muted);
          margin-top: 4px;
          text-transform: uppercase; letter-spacing: 0.6px;
        }

        /* ── Filter Tabs ── */
        .filter-bar {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .filter-tab {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 16px;
          border-radius: 20px;
          font-family: var(--font-main);
          font-size: 12px;
          font-weight: 500;
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
          border-color: rgba(56,139,253,0.4);
          color: var(--accent);
          font-weight: 600;
        }
        .filter-tab.active-coding {
          background: var(--purple-soft);
          border-color: rgba(188,140,255,0.4);
          color: var(--purple);
          font-weight: 600;
        }
        .filter-tab.active-hybrid {
          background: var(--orange-soft);
          border-color: rgba(240,136,62,0.4);
          color: var(--orange);
          font-weight: 600;
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
        .filter-tab.active   .filter-count { background: rgba(56,139,253,0.2);  color: var(--accent); }
        .filter-tab.active-coding .filter-count { background: rgba(188,140,255,0.2); color: var(--purple); }
        .filter-tab.active-hybrid .filter-count { background: rgba(240,136,62,0.2);  color: var(--orange); }

        /* ── Empty State ── */
        .empty-state {
          text-align: center;
          padding: 64px 24px;
          color: var(--text-muted);
        }
        .empty-icon { font-size: 40px; margin-bottom: 12px; }
        .empty-text { font-size: 15px; }

        /* ── Skeleton ── */
        .skeleton-card {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 22px;
          margin-bottom: 14px;
          animation: pulse 1.5s ease-in-out infinite;
        }
        .skeleton-line {
          background: var(--bg-card);
          border-radius: 4px;
          height: 14px; margin-bottom: 10px;
        }
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
          border-radius: 3px 0 0 3px;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .test-card.type-mcq::before    { background: var(--accent); }
        .test-card.type-coding::before { background: var(--purple); }
        .test-card.type-hybrid::before { background: var(--orange); }
        .test-card:hover {
          border-color: var(--border-hover);
          box-shadow: var(--shadow-md);
          transform: translateY(-1px);
        }
        .test-card:hover::before { opacity: 1; }

        .test-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 14px;
          flex-wrap: wrap;
        }
        .test-title {
          font-size: 16px; font-weight: 600;
          color: var(--text-primary);
          letter-spacing: -0.2px;
        }
        .test-meta {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 7px;
          align-items: center;
        }
        .meta-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 12px; font-weight: 500;
          font-family: var(--font-mono);
          white-space: nowrap;
        }
        .badge-blue   { background: var(--accent-soft);   color: var(--accent);   border: 1px solid rgba(56,139,253,0.2); }
        .badge-green  { background: var(--success-soft);  color: var(--success);  border: 1px solid rgba(63,185,80,0.2); }
        .badge-yellow { background: var(--warning-soft);  color: var(--warning);  border: 1px solid rgba(210,153,34,0.2); }
        .badge-purple { background: var(--purple-soft);   color: var(--purple);   border: 1px solid rgba(188,140,255,0.2); }
        .badge-orange { background: var(--orange-soft);   color: var(--orange);   border: 1px solid rgba(240,136,62,0.2); }
        .badge-type-mcq    { background: var(--accent-soft);  color: var(--accent);  border: 1px solid rgba(56,139,253,0.3);  font-weight: 700; }
        .badge-type-coding { background: var(--purple-soft);  color: var(--purple);  border: 1px solid rgba(188,140,255,0.3); font-weight: 700; }
        .badge-type-hybrid { background: var(--orange-soft);  color: var(--orange);  border: 1px solid rgba(240,136,62,0.3);  font-weight: 700; }

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
          padding: 7px 14px;
          border-radius: var(--radius-sm);
          font-family: var(--font-main);
          font-size: 12px; font-weight: 500;
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
        .action-btn.primary {
          background: var(--accent-soft);
          border-color: rgba(56,139,253,0.3);
          color: var(--accent);
        }
        .action-btn.primary:hover {
          background: rgba(56,139,253,0.2);
          border-color: var(--accent);
        }
        .action-btn.success-btn {
          background: var(--success-soft);
          border-color: rgba(63,185,80,0.3);
          color: var(--success);
        }
        .action-btn.success-btn:hover {
          background: rgba(63,185,80,0.2);
          border-color: var(--success);
        }
        .action-btn.purple-btn {
          background: var(--purple-soft);
          border-color: rgba(188,140,255,0.3);
          color: var(--purple);
        }
        .action-btn.purple-btn:hover {
          background: rgba(188,140,255,0.2);
          border-color: var(--purple);
        }
        .action-btn.warning-btn {
          background: var(--warning-soft);
          border-color: rgba(210,153,34,0.3);
          color: var(--warning);
        }
        .action-btn.warning-btn:hover {
          background: rgba(210,153,34,0.2);
          border-color: var(--warning);
        }
        .action-btn.danger-btn {
          background: var(--danger-soft);
          border-color: rgba(248,81,73,0.3);
          color: var(--danger);
        }
        .action-btn.danger-btn:hover {
          background: rgba(248,81,73,0.2);
          border-color: var(--danger);
        }

        .section-label {
          font-size: 11px; font-weight: 600;
          text-transform: uppercase; letter-spacing: 1px;
          color: var(--text-muted);
          margin-bottom: 14px;
        }

        @media (max-width: 600px) {
          .summary-bar { grid-template-columns: repeat(3, 1fr); }
          .page-header { gap: 12px; }
          .test-actions { gap: 6px; }
          .action-btn { padding: 6px 11px; font-size: 11px; }
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
                <div className="page-title">Assessment Management</div>
                <div className="page-subtitle">Create, manage and assign assessments to candidates</div>
              </div>
            </div>

            <div className="create-wrapper" ref={createRef}>
              <button
                className="create-btn"
                onClick={() => setCreateOpen((o) => !o)}
              >
                <span>＋</span> Create Assessment
                <span className={`chevron${createOpen ? ' open' : ''}`}>▾</span>
              </button>

              {createOpen && (
                <div className="create-dropdown">
                  <Link
                    href="/admin/tests/new"
                    className="dropdown-item"
                    onClick={() => setCreateOpen(false)}
                  >
                    <span className="di-icon">📝</span>
                    <span className="di-label">MCQ Assessment</span>
                  </Link>
                  <Link
                    href="/admin/coding-tests/create"
                    className="dropdown-item"
                    onClick={() => setCreateOpen(false)}
                  >
                    <span className="di-icon">💻</span>
                    <span className="di-label">Coding Assessment</span>
                  </Link>
                  <Link
                    href="/admin/hybrid-tests/create"
                    className="dropdown-item"
                    onClick={() => setCreateOpen(false)}
                  >
                    <span className="di-icon">🔀</span>
                    <span className="di-label">Hybrid Assessment</span>
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
                <div className="summary-value">{allAssessments.length}</div>
                <div className="summary-label">Total</div>
              </div>
              <div className="summary-chip">
                <div className="summary-value" style={{ color: 'var(--accent)' }}>{mcqCount}</div>
                <div className="summary-label">MCQ</div>
              </div>
              <div className="summary-chip">
                <div className="summary-value" style={{ color: 'var(--purple)' }}>{codingCount}</div>
                <div className="summary-label">Coding</div>
              </div>
            </div>
          )}

          {/* Filter Tabs */}
          {!loading && (
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
                {activeFilter === 'ALL'
                  ? <>No assessments created yet. Click <strong>Create Assessment</strong> to get started.</>
                  : <>No {activeFilter.toLowerCase()} assessments found.</>}
              </div>
            </div>
          )}

          {/* Cards */}
          {!loading && filtered.length > 0 && (
            <>
              <div className="section-label">
                {filtered.length} assessment{filtered.length !== 1 ? 's' : ''} found
              </div>

              {filtered.map((test: any) => {
                const isMCQ    = test.assessmentType === 'MCQ';
                const isCoding = test.assessmentType === 'CODING';
                const isHybrid = test.assessmentType === 'HYBRID';
                const typeClass = isMCQ ? 'type-mcq' : isCoding ? 'type-coding' : 'type-hybrid';

                return (
                  <div key={`${test.assessmentType}-${test.id}`} className={`test-card ${typeClass}`}>
                    <div className="test-card-header">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="test-title">{test.title}</div>
                        <div className="test-meta">
                          {/* Assessment Type Badge */}
                          {isMCQ && (
                            <span className="meta-badge badge-type-mcq">🟢 MCQ</span>
                          )}
                          {isCoding && (
                            <span className="meta-badge badge-type-coding">🟣 CODING</span>
                          )}
                          {isHybrid && (
                            <span className="meta-badge badge-type-hybrid">🟠 HYBRID</span>
                          )}

                          {test.category && (
                            <span className="meta-badge badge-purple">🏷 {test.category}</span>
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
                    </div>

                    <div className="test-actions">
                      {isMCQ && (
                        <>
                          <Link href={`/admin/tests/${test.id}`} className="action-btn primary">
                            👁 View Test
                          </Link>
                          <Link href={`/admin/tests/${test.id}/questions`} className="action-btn">
                            ❓ Manage Questions
                          </Link>
                          <Link href={`/admin/tests/${test.id}/results`} className="action-btn success-btn">
                            📊 View Results
                          </Link>
                          <Link href={`/admin/tests/${test.id}/invite`} className="action-btn warning-btn">
                            ✉️ Assign Test
                          </Link>
                        </>
                      )}

                      {isCoding && (
                        <>
                          <Link href={`/admin/coding-tests/${test.id}`} className="action-btn purple-btn">
                            👁 View Assessment
                          </Link>

                          <Link
  href={`/admin/coding-tests/${test.id}/results`}
  className="action-btn success-btn"
>
  📊 Results
</Link>

 <Link
      href={`/admin/coding-tests/${test.id}/assign`}
      className="action-btn success-btn"
    >
      ✉️ Assign
    </Link>
                          <button
                            className="action-btn danger-btn"
                            onClick={() => handleDeleteCoding(test.id)}
                          >
                            🗑 Delete
                          </button>
                        </>
                      )}

                      {isHybrid && (
                        <Link href={`/admin/hybrid-tests/${test.id}`} className="action-btn primary">
                          👁 View Assessment
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