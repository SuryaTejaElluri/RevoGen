'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

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
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);
const IconBook = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);
const IconEmpty = () => (
  <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    <line x1="9" y1="9" x2="15" y2="9" /><line x1="9" y1="13" x2="13" y2="13" />
  </svg>
);
const IconChevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6" />
  </svg>
);
const IconStar = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const IconArrow = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

// ─── Difficulty badge helper ──────────────────────────────────────────────────
function getDifficulty(duration: number): { label: string; cls: string } {
  if (duration <= 20) return { label: 'Quick', cls: 'diff-quick' };
  if (duration <= 45) return { label: 'Medium', cls: 'diff-medium' };
  return { label: 'In-depth', cls: 'diff-hard' };
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function PracticePage() {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'default' | 'duration' | 'questions'>('default');

  useEffect(() => {
    loadTests();
  }, []);

  // ── API call unchanged ──
  const loadTests = async () => {
    try {
      const response = await fetch('http://localhost:3000/tests/practice');
      const data = await response.json();
      setTests(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ── Derived / filtered list ──
  const filtered = useMemo(() => {
    let list = tests.filter((t) =>
      t.title?.toLowerCase().includes(search.toLowerCase())
    );
    if (sort === 'duration') list = [...list].sort((a, b) => a.duration - b.duration);
    if (sort === 'questions') list = [...list].sort((a, b) => b.questions.length - a.questions.length);
    return list;
  }, [tests, search, sort]);

  const totalQuestions = tests.reduce((s, t) => s + (t.questions?.length ?? 0), 0);
  const avgDuration = tests.length
    ? Math.round(tests.reduce((s, t) => s + (t.duration ?? 0), 0) / tests.length)
    : 0;

  return (
    <>
      <Navbar />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --primary:        #2563eb;
          --primary-hover:  #1d4ed8;
          --primary-light:  #eff6ff;
          --primary-muted:  #bfdbfe;
          --success:        #22c55e;
          --success-light:  #f0fdf4;
          --amber:          #f59e0b;
          --amber-light:    #fffbeb;
          --rose:           #f43f5e;
          --rose-light:     #fff1f2;
          --bg:             #f1f5f9;
          --card:           #ffffff;
          --border:         #e2e8f0;
          --text:           #0f172a;
          --muted:          #64748b;
          --radius:         16px;
          --shadow-sm:      0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04);
          --shadow:         0 4px 16px rgba(0,0,0,.07), 0 1px 4px rgba(0,0,0,.04);
          --shadow-lg:      0 12px 32px rgba(0,0,0,.10), 0 4px 12px rgba(0,0,0,.06);
          --font-display:   'Sora', sans-serif;
          --font-body:      'DM Sans', sans-serif;
          --transition:     0.2s cubic-bezier(.4,0,.2,1);
        }

        @media (prefers-color-scheme: dark) {
          :root {
            --bg:            #0d1117;
            --card:          #161b22;
            --border:        #21262d;
            --text:          #e6edf3;
            --muted:         #8b949e;
            --primary-light: #1a2540;
            --success-light: #0d2218;
            --amber-light:   #2b1e00;
            --rose-light:    #2b0a10;
            --shadow-sm:     0 1px 3px rgba(0,0,0,.3);
            --shadow:        0 4px 16px rgba(0,0,0,.4);
            --shadow-lg:     0 12px 32px rgba(0,0,0,.5);
          }
        }

        body { background: var(--bg); }

        /* ── Page ── */
        .practice-page {
          min-height: 100vh;
          background: var(--bg);
          font-family: var(--font-body);
          color: var(--text);
          padding-bottom: 80px;
        }

        .practice-container {
          max-width: 1160px;
          margin: 0 auto;
          padding: 0 24px;
        }

        /* ── Header ── */
        .practice-header {
          padding: 48px 0 36px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .practice-eyebrow {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: var(--primary);
          margin-bottom: 4px;
        }

        .practice-header h1 {
          font-family: var(--font-display);
          font-size: clamp(26px, 4vw, 36px);
          font-weight: 800;
          color: var(--text);
          line-height: 1.15;
          letter-spacing: -.02em;
        }

        .practice-header p {
          font-size: 15px;
          color: var(--muted);
          margin-top: 6px;
        }

        .practice-divider {
          height: 1px;
          background: linear-gradient(90deg, var(--border) 0%, transparent 100%);
          margin-bottom: 32px;
        }

        /* ── Stats row ── */
        .stats-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 32px;
        }

        .stat-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 22px 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: var(--shadow-sm);
          transition: transform var(--transition), box-shadow var(--transition);
          animation: fadeUp .4s ease both;
        }

        .stat-card:nth-child(2) { animation-delay: .07s; }
        .stat-card:nth-child(3) { animation-delay: .14s; }

        .stat-card:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow-lg);
        }

        .stat-icon {
          width: 46px; height: 46px;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .stat-icon.blue   { background: var(--primary-light); color: var(--primary); }
        .stat-icon.green  { background: var(--success-light); color: var(--success); }
        .stat-icon.amber  { background: var(--amber-light);   color: var(--amber);   }

        .stat-body {}
        .stat-number {
          font-family: var(--font-display);
          font-size: 28px;
          font-weight: 800;
          color: var(--text);
          letter-spacing: -.03em;
          line-height: 1;
        }
        .stat-label {
          font-size: 13px;
          color: var(--muted);
          font-weight: 500;
          margin-top: 3px;
        }

        /* ── Toolbar ── */
        .toolbar {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .search-wrap {
          position: relative;
          flex: 1;
          min-width: 200px;
        }

        .search-icon {
          position: absolute;
          left: 14px; top: 50%;
          transform: translateY(-50%);
          color: var(--muted);
          pointer-events: none;
          display: flex;
        }

        .search-input {
          width: 100%;
          height: 42px;
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 0 14px 0 40px;
          font-size: 14px;
          font-family: var(--font-body);
          background: var(--card);
          color: var(--text);
          outline: none;
          transition: border-color var(--transition), box-shadow var(--transition);
        }
        .search-input::placeholder { color: var(--muted); }
        .search-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(37,99,235,.12);
        }

        .sort-wrap { position: relative; }

        .sort-select {
          height: 42px;
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 0 36px 0 14px;
          font-size: 14px;
          font-family: var(--font-body);
          background: var(--card);
          color: var(--text);
          outline: none;
          cursor: pointer;
          appearance: none;
          transition: border-color var(--transition), box-shadow var(--transition);
          min-width: 150px;
        }
        .sort-select:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(37,99,235,.12);
        }
        .sort-chevron {
          position: absolute; right: 12px; top: 50%;
          transform: translateY(-50%);
          pointer-events: none; color: var(--muted);
        }

        .result-count {
          font-size: 13px;
          color: var(--muted);
          white-space: nowrap;
          font-weight: 500;
        }

        /* ── Cards grid ── */
        .tests-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }

        .test-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 26px;
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
          gap: 0;
          transition: transform var(--transition), box-shadow var(--transition), border-color var(--transition);
          animation: fadeUp .35s ease both;
          position: relative;
          overflow: hidden;
        }

        .test-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--primary), #60a5fa);
          opacity: 0;
          transition: opacity var(--transition);
        }

        .test-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
          border-color: var(--primary-muted);
        }

        .test-card:hover::before { opacity: 1; }

        .card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 14px;
        }

        .card-icon-wrap {
          width: 44px; height: 44px;
          background: var(--primary-light);
          color: var(--primary);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .card-title {
          font-family: var(--font-display);
          font-size: 16px;
          font-weight: 700;
          color: var(--text);
          line-height: 1.35;
          flex: 1;
          margin-top: 2px;
        }

        .diff-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 9px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: .02em;
          flex-shrink: 0;
        }

        .diff-quick  { background: var(--success-light); color: #16a34a; border: 1px solid #bbf7d0; }
        .diff-medium { background: var(--amber-light);   color: #b45309; border: 1px solid #fde68a; }
        .diff-hard   { background: var(--rose-light);    color: #be123c; border: 1px solid #fecdd3; }

        .card-divider {
          height: 1px;
          background: var(--border);
          margin: 16px 0;
        }

        .card-meta {
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: var(--muted);
          font-weight: 500;
        }

        .meta-item strong {
          color: var(--text);
          font-weight: 700;
        }

        .start-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          height: 44px;
          background: var(--primary);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          font-family: var(--font-body);
          cursor: pointer;
          text-decoration: none;
          transition: background var(--transition), transform var(--transition), box-shadow var(--transition);
          margin-top: auto;
        }

        .start-btn:hover {
          background: var(--primary-hover);
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(37,99,235,.28);
        }

        .start-btn:active { transform: translateY(0); }

        /* ── Skeleton ── */
        .tests-grid-skel {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }

        .skel-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 26px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .skel {
          background: linear-gradient(90deg, var(--border) 25%, color-mix(in srgb, var(--border) 60%, var(--bg)) 50%, var(--border) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
          border-radius: 8px;
        }

        .skel-top { display: flex; gap: 12px; align-items: center; }
        .skel-circle { width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0; }
        .skel-lines { flex: 1; display: flex; flex-direction: column; gap: 8px; }
        .skel-h { height: 14px; }
        .skel-h.w60 { width: 60%; }
        .skel-h.w35 { width: 35%; }
        .skel-h.w80 { width: 80%; }
        .skel-btn { height: 44px; border-radius: 10px; }

        /* ── Empty state ── */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding: 80px 24px;
          text-align: center;
          animation: fadeUp .5s ease;
        }

        .empty-icon-wrap {
          width: 100px; height: 100px;
          background: var(--primary-light);
          border-radius: 24px;
          display: flex; align-items: center; justify-content: center;
          color: var(--primary);
          margin-bottom: 8px;
        }

        .empty-title {
          font-family: var(--font-display);
          font-size: 22px;
          font-weight: 700;
          color: var(--text);
        }

        .empty-desc {
          font-size: 14px;
          color: var(--muted);
          max-width: 360px;
          line-height: 1.6;
        }

        /* ── Animations ── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .stats-row { grid-template-columns: 1fr 1fr; }
          .stats-row .stat-card:first-child { grid-column: span 2; }
          .tests-grid,
          .tests-grid-skel { grid-template-columns: 1fr; }
        }

        @media (max-width: 480px) {
          .practice-container { padding: 0 16px; }
          .stats-row { grid-template-columns: 1fr; }
          .stats-row .stat-card:first-child { grid-column: span 1; }
        }
      `}</style>

      <div className="practice-page">
        <div className="practice-container">

          {/* ── Header ── */}
          <header className="practice-header">
            <span className="practice-eyebrow">Assessment Hub</span>
            <h1>Practice Exams</h1>
            <p>Improve your skills by taking real assessment exams.</p>
          </header>
          <div className="practice-divider" />

          {/* ── Stats ── */}
          {!loading && tests.length > 0 && (
            <div className="stats-row">
              <div className="stat-card">
                <div className="stat-icon blue"><IconBook /></div>
                <div className="stat-body">
                  <div className="stat-number">{tests.length}</div>
                  <div className="stat-label">Available Exams</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon green"><IconList /></div>
                <div className="stat-body">
                  <div className="stat-number">{totalQuestions}</div>
                  <div className="stat-label">Total Questions</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon amber"><IconClock /></div>
                <div className="stat-body">
                  <div className="stat-number">{avgDuration}<span style={{ fontSize: 16, fontWeight: 600 }}>m</span></div>
                  <div className="stat-label">Avg. Duration</div>
                </div>
              </div>
            </div>
          )}

          {/* ── Toolbar ── */}
          {!loading && tests.length > 0 && (
            <div className="toolbar">
              <div className="search-wrap">
                <span className="search-icon"><IconSearch /></span>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search exams…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="sort-wrap">
                <select
                  className="sort-select"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as any)}
                >
                  <option value="default">Default Order</option>
                  <option value="duration">Shortest First</option>
                  <option value="questions">Most Questions</option>
                </select>
                <span className="sort-chevron"><IconChevron /></span>
              </div>
              <span className="result-count">
                {filtered.length} exam{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* ── Skeletons ── */}
          {loading && (
            <div className="tests-grid-skel">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div className="skel-card" key={i}>
                  <div className="skel-top">
                    <div className="skel skel-circle" />
                    <div className="skel-lines">
                      <div className="skel skel-h w80" />
                      <div className="skel skel-h w35" />
                    </div>
                  </div>
                  <div className="skel skel-h w60" />
                  <div className="skel skel-btn" />
                </div>
              ))}
            </div>
          )}

          {/* ── No results ── */}
          {!loading && filtered.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon-wrap"><IconEmpty /></div>
              <div className="empty-title">
                {tests.length === 0 ? 'No Exams Available' : 'No Matches Found'}
              </div>
              <p className="empty-desc">
                {tests.length === 0
                  ? 'Check back soon — new practice exams will be added shortly.'
                  : 'Try adjusting your search to find what you\'re looking for.'}
              </p>
            </div>
          )}

          {/* ── Test cards ── */}
          {!loading && filtered.length > 0 && (
            <div className="tests-grid">
              {filtered.map((test, idx) => {
                const diff = getDifficulty(test.duration);
                return (
                  <div
                    className="test-card"
                    key={test.id}
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className="card-top">
                      <div className="card-icon-wrap"><IconBook /></div>
                      <div className="card-title">{test.title}</div>
                      <span className={`diff-badge ${diff.cls}`}>
                        <IconStar />
                        {diff.label}
                      </span>
                    </div>

                    <div className="card-divider" />

                    <div className="card-meta">
                      <div className="meta-item">
                        <IconClock />
                        <strong>{test.duration}</strong> mins
                      </div>
                      <div className="meta-item">
                        <IconList />
                        <strong>{test.questions.length}</strong> questions
                      </div>
                    </div>

                    <Link href={`/tests/${test.id}`} style={{ textDecoration: 'none' }}>
                      <button className="start-btn">
                        <IconPlay />
                        Start Exam
                        <IconArrow />
                      </button>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </>
  );
}