'use client';

import { useEffect, useState, useMemo } from 'react';
import Navbar from '@/components/Navbar';

// ─── Minimal inline pie chart ────────────────────────────────────────────────
function PieChart({
  practice,
  assigned,
}: {
  practice: number;
  assigned: number;
}) {
  const total = practice + assigned;
  if (total === 0) {
    return (
      <svg viewBox="0 0 36 36" className="pie-svg">
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3.2" />
      </svg>
    );
  }
  const pct = (practice / total) * 100;
  const dashArray = `${pct} ${100 - pct}`;

  return (
    <svg viewBox="0 0 36 36" className="pie-svg">
      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3.2" />
      <circle
        cx="18" cy="18" r="15.9"
        fill="none"
        stroke="#2563eb"
        strokeWidth="3.2"
        strokeDasharray={dashArray}
        strokeDashoffset="25"
        strokeLinecap="round"
      />
      <circle
        cx="18" cy="18" r="15.9"
        fill="none"
        stroke="#a855f7"
        strokeWidth="3.2"
        strokeDasharray={`${100 - pct} ${pct}`}
        strokeDashoffset={`${-(pct - 25)}`}
        strokeLinecap="round"
      />
      <text x="18" y="20.5" textAnchor="middle" fontSize="7" fontWeight="700" fill="currentColor">
        {total}
      </text>
    </svg>
  );
}

// ─── Status distribution donut ────────────────────────────────────────────────
function StatusDonut({
  completed,
  submitted,
}: {
  completed: number;
  submitted: number;
}) {
  const total = completed + submitted;
  if (total === 0) {
    return (
      <svg viewBox="0 0 36 36" className="pie-svg">
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3.2" />
      </svg>
    );
  }
  const pct = (completed / total) * 100;
  return (
    <svg viewBox="0 0 36 36" className="pie-svg">
      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3.2" />
      <circle
        cx="18" cy="18" r="15.9"
        fill="none"
        stroke="#22c55e"
        strokeWidth="3.2"
        strokeDasharray={`${pct} ${100 - pct}`}
        strokeDashoffset="25"
        strokeLinecap="round"
      />
      <circle
        cx="18" cy="18" r="15.9"
        fill="none"
        stroke="#f97316"
        strokeWidth="3.2"
        strokeDasharray={`${100 - pct} ${pct}`}
        strokeDashoffset={`${-(pct - 25)}`}
        strokeLinecap="round"
      />
      <text x="18" y="20.5" textAnchor="middle" fontSize="7" fontWeight="700" fill="currentColor">
        {total}
      </text>
    </svg>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconClipboard = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="2" width="6" height="4" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M12 11h4M12 16h4M8 11h.01M8 16h.01" />
  </svg>
);
const IconPractice = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><circle cx="12" cy="17" r=".5" fill="currentColor" />
  </svg>
);
const IconAssigned = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
  </svg>
);
const IconEmpty = () => (
  <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /><path d="M9 9h6M9 12h4" />
  </svg>
);
const IconCalendar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IconChevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function MyResultsPage() {
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'practice' | 'assigned'>('all');

  useEffect(() => {
    loadResults();
  }, []);

  // ── API call unchanged ──
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

  // ── Derived stats ──
  const stats = useMemo(() => {
    const practice = attempts.filter((a) => a.test?.isPractice).length;
    const assigned = attempts.filter((a) => !a.test?.isPractice).length;
    return { total: attempts.length, practice, assigned };
  }, [attempts]);

  // ── Filtered list ──
  const filtered = useMemo(() => {
    return attempts.filter((a) => {
      const matchesSearch = a.test?.title?.toLowerCase().includes(search.toLowerCase());
      const matchesFilter =
        filter === 'all' ||
        (filter === 'practice' && a.test?.isPractice) ||
        (filter === 'assigned' && !a.test?.isPractice);
      return matchesSearch && matchesFilter;
    });
  }, [attempts, search, filter]);

  return (
    <>
      <Navbar />

      <style>{`
        /* ── Reset & tokens ── */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --primary: #2563eb;
          --primary-light: #eff6ff;
          --primary-muted: #bfdbfe;
          --success: #22c55e;
          --success-light: #f0fdf4;
          --warning: #f97316;
          --warning-light: #fff7ed;
          --purple: #a855f7;
          --purple-light: #faf5ff;
          --bg: #f1f5f9;
          --card: #ffffff;
          --border: #e2e8f0;
          --text: #0f172a;
          --muted: #64748b;
          --radius: 16px;
          --shadow-sm: 0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04);
          --shadow: 0 4px 16px rgba(0,0,0,.07), 0 1px 4px rgba(0,0,0,.04);
          --shadow-lg: 0 12px 32px rgba(0,0,0,.10), 0 4px 12px rgba(0,0,0,.06);
          --font-display: 'Sora', 'Segoe UI', sans-serif;
          --font-body: 'DM Sans', 'Segoe UI', sans-serif;
          --transition: 0.2s cubic-bezier(.4,0,.2,1);
        }

        @media (prefers-color-scheme: dark) {
          :root {
            --bg: #0d1117;
            --card: #161b22;
            --border: #21262d;
            --text: #e6edf3;
            --muted: #8b949e;
            --primary-light: #1a2540;
            --success-light: #0d2218;
            --warning-light: #2b1500;
            --purple-light: #1e0f3a;
            --shadow-sm: 0 1px 3px rgba(0,0,0,.3);
            --shadow: 0 4px 16px rgba(0,0,0,.4);
            --shadow-lg: 0 12px 32px rgba(0,0,0,.5);
          }
        }

        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

        body { background: var(--bg); }

        /* ── Page shell ── */
        .results-page {
          min-height: 100vh;
          background: var(--bg);
          font-family: var(--font-body);
          color: var(--text);
          padding-bottom: 80px;
        }

        .results-container {
          max-width: 1160px;
          margin: 0 auto;
          padding: 0 24px;
        }

        /* ── Header ── */
        .results-header {
          padding: 48px 0 36px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .results-header-eyebrow {
          font-family: var(--font-body);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: var(--primary);
          margin-bottom: 4px;
        }

        .results-header h1 {
          font-family: var(--font-display);
          font-size: clamp(26px, 4vw, 36px);
          font-weight: 800;
          color: var(--text);
          line-height: 1.15;
          letter-spacing: -.02em;
        }

        .results-header p {
          font-size: 15px;
          color: var(--muted);
          margin-top: 6px;
          font-weight: 400;
        }

        .results-divider {
          height: 1px;
          background: linear-gradient(90deg, var(--border) 0%, transparent 100%);
          margin-bottom: 32px;
        }

        /* ── Stats grid ── */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 32px;
        }

        .stat-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 24px;
          display: flex;
          align-items: flex-start;
          gap: 18px;
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
          width: 48px; height: 48px;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .stat-icon.total  { background: var(--primary-light); color: var(--primary); }
        .stat-icon.prac   { background: var(--primary-light); color: var(--primary); }
        .stat-icon.assign { background: var(--purple-light);  color: var(--purple);  }

        .stat-body { flex: 1; min-width: 0; }

        .stat-number {
          font-family: var(--font-display);
          font-size: 32px;
          font-weight: 800;
          color: var(--text);
          line-height: 1;
          letter-spacing: -.03em;
        }

        .stat-label {
          font-size: 13px;
          color: var(--muted);
          font-weight: 500;
          margin-top: 4px;
        }

        .stat-chart { width: 52px; height: 52px; flex-shrink: 0; color: var(--text); }

        .pie-svg { width: 100%; height: 100%; }

        /* ── Charts row ── */
        .charts-row {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin-bottom: 32px;
        }

        .chart-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 24px;
          box-shadow: var(--shadow-sm);
          display: flex;
          align-items: center;
          gap: 28px;
          animation: fadeUp .4s .2s ease both;
        }

        .chart-donut-wrap {
          width: 90px; height: 90px; flex-shrink: 0;
          color: var(--text);
        }

        .chart-legend { flex: 1; display: flex; flex-direction: column; gap: 10px; }

        .chart-title {
          font-family: var(--font-display);
          font-size: 14px;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 6px;
        }

        .legend-item {
          display: flex; align-items: center; gap: 8px;
          font-size: 13px; color: var(--muted);
        }

        .legend-dot {
          width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
        }

        .legend-val {
          font-weight: 700;
          color: var(--text);
          margin-left: auto;
          font-size: 14px;
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

        .filter-wrap { position: relative; }

        .filter-select {
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
          min-width: 160px;
        }

        .filter-select:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(37,99,235,.12);
        }

        .filter-chevron {
          position: absolute;
          right: 12px; top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          color: var(--muted);
        }

        .result-count {
          font-size: 13px;
          color: var(--muted);
          white-space: nowrap;
          font-weight: 500;
        }

        /* ── Assessment cards ── */
        .cards-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .assessment-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 24px 28px;
          box-shadow: var(--shadow-sm);
          display: flex;
          align-items: center;
          gap: 20px;
          transition: transform var(--transition), box-shadow var(--transition), border-color var(--transition);
          animation: fadeUp .35s ease both;
        }

        .assessment-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
          border-color: var(--primary-muted);
        }

        .card-type-icon {
          width: 46px; height: 46px;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .card-type-icon.practice { background: var(--primary-light); color: var(--primary); }
        .card-type-icon.assigned { background: var(--purple-light);  color: var(--purple);  }

        .card-body { flex: 1; min-width: 0; }

        .card-title {
          font-family: var(--font-display);
          font-size: 16px;
          font-weight: 700;
          color: var(--text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 8px;
        }

        .card-meta {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: .01em;
        }

        .badge-practice {
          background: var(--primary-light);
          color: var(--primary);
          border: 1px solid var(--primary-muted);
        }

        .badge-assigned {
          background: var(--purple-light);
          color: var(--purple);
          border: 1px solid #d8b4fe;
        }

        .badge-completed {
          background: var(--success-light);
          color: #16a34a;
          border: 1px solid #bbf7d0;
        }

        .badge-submitted {
          background: var(--warning-light);
          color: #c2410c;
          border: 1px solid #fed7aa;
        }

        .card-date {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          color: var(--muted);
          font-weight: 500;
        }

        .card-success-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: var(--success-light);
          border: 1px solid #bbf7d0;
          border-radius: 8px;
          font-size: 12px;
          color: #16a34a;
          font-weight: 600;
          flex-shrink: 0;
        }

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
          max-width: 380px;
          line-height: 1.6;
        }

        .empty-cta {
          margin-top: 8px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 28px;
          background: var(--primary);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          font-family: var(--font-body);
          cursor: pointer;
          transition: background var(--transition), transform var(--transition), box-shadow var(--transition);
          text-decoration: none;
        }

        .empty-cta:hover {
          background: #1d4ed8;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(37,99,235,.3);
        }

        /* ── Skeleton loader ── */
        .skeleton-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 24px 28px;
          display: flex; gap: 20px; align-items: center;
        }

        .skel {
          background: linear-gradient(90deg, var(--border) 25%, color-mix(in srgb, var(--border) 60%, var(--bg)) 50%, var(--border) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
          border-radius: 8px;
        }

        .skel-circle { width: 46px; height: 46px; border-radius: 12px; flex-shrink: 0; }
        .skel-body { flex: 1; display: flex; flex-direction: column; gap: 10px; }
        .skel-line { height: 14px; }
        .skel-line.wide { width: 60%; }
        .skel-line.narrow { width: 35%; }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .stats-grid { grid-template-columns: 1fr 1fr; }
          .stats-grid .stat-card:first-child { grid-column: span 2; }
          .charts-row { grid-template-columns: 1fr; }
          .assessment-card { flex-wrap: wrap; }
          .card-success-indicator { width: 100%; justify-content: center; }
          .stat-chart { display: none; }
        }

        @media (max-width: 480px) {
          .results-container { padding: 0 16px; }
          .stats-grid { grid-template-columns: 1fr; }
          .stats-grid .stat-card:first-child { grid-column: span 1; }
          .assessment-card { padding: 18px; }
        }
      `}</style>

      <div className="results-page">
        <div className="results-container">

          {/* ── Header ── */}
          <header className="results-header">
            <span className="results-header-eyebrow">Dashboard</span>
            <h1>My Assessments</h1>
            <p>Track all assessments you have completed.</p>
          </header>
          <div className="results-divider" />

          {/* ── Stats ── */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon total"><IconClipboard /></div>
              <div className="stat-body">
                <div className="stat-number">{stats.total}</div>
                <div className="stat-label">Total Assessments</div>
              </div>
              <div className="stat-chart">
                <PieChart practice={stats.practice} assigned={stats.assigned} />
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon prac"><IconPractice /></div>
              <div className="stat-body">
                <div className="stat-number">{stats.practice}</div>
                <div className="stat-label">Practice Exams</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon assign"><IconAssigned /></div>
              <div className="stat-body">
                <div className="stat-number">{stats.assigned}</div>
                <div className="stat-label">Assigned Assessments</div>
              </div>
            </div>
          </div>

          {/* ── Charts row ── */}
          {stats.total > 0 && (
            <div className="charts-row">
              <div className="chart-card">
                <div className="chart-donut-wrap">
                  <PieChart practice={stats.practice} assigned={stats.assigned} />
                </div>
                <div className="chart-legend">
                  <div className="chart-title">Assessment Types</div>
                  <div className="legend-item">
                    <span className="legend-dot" style={{ background: '#2563eb' }} />
                    Practice Exams
                    <span className="legend-val">{stats.practice}</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot" style={{ background: '#a855f7' }} />
                    Assigned
                    <span className="legend-val">{stats.assigned}</span>
                  </div>
                </div>
              </div>
              <div className="chart-card">
                <div className="chart-donut-wrap">
                  <StatusDonut completed={stats.practice} submitted={stats.assigned} />
                </div>
                <div className="chart-legend">
                  <div className="chart-title">Completion Status</div>
                  <div className="legend-item">
                    <span className="legend-dot" style={{ background: '#22c55e' }} />
                    Completed
                    <span className="legend-val">{stats.practice}</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot" style={{ background: '#f97316' }} />
                    Submitted
                    <span className="legend-val">{stats.assigned}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Toolbar ── */}
          {!loading && attempts.length > 0 && (
            <div className="toolbar">
              <div className="search-wrap">
                <span className="search-icon"><IconSearch /></span>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search assessments…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="filter-wrap">
                <select
                  className="filter-select"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                >
                  <option value="all">All Assessments</option>
                  <option value="practice">Practice Exams</option>
                  <option value="assigned">Assigned Assessments</option>
                </select>
                <span className="filter-chevron"><IconChevron /></span>
              </div>
              <span className="result-count">
                {filtered.length} result{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* ── Loading skeletons ── */}
          {loading && (
            <div className="cards-list">
              {[0, 1, 2].map((i) => (
                <div className="skeleton-card" key={i}>
                  <div className="skel skel-circle" />
                  <div className="skel-body">
                    <div className="skel skel-line wide" />
                    <div className="skel skel-line narrow" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Empty state ── */}
          {!loading && attempts.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon-wrap"><IconEmpty /></div>
              <div className="empty-title">No Assessments Yet</div>
              <p className="empty-desc">
                Complete a practice exam or assigned assessment to see your history.
              </p>
              <a href="/practice" className="empty-cta">Browse Practice Exams</a>
            </div>
          )}

          {/* ── Assessment cards ── */}
          {!loading && filtered.length > 0 && (
            <div className="cards-list">
              {filtered.map((attempt: any, idx: number) => {
                const isPractice = attempt.test?.isPractice;
                return (
                  <div
                    className="assessment-card"
                    key={attempt.id}
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className={`card-type-icon ${isPractice ? 'practice' : 'assigned'}`}>
                      {isPractice ? <IconPractice /> : <IconAssigned />}
                    </div>

                    <div className="card-body">
                      <div className="card-title">{attempt.test?.title ?? 'Untitled Assessment'}</div>
                      <div className="card-meta">
                        <span className={`badge ${isPractice ? 'badge-practice' : 'badge-assigned'}`}>
                          {isPractice ? 'Practice Exam' : 'Assigned Assessment'}
                        </span>
                        
                        <span className={`badge ${isPractice ? 'badge-completed' : 'badge-submitted'}`}>
                          <IconCheck />
                          {isPractice ? 'Completed' : 'Submitted'}
                        </span>
                        <span className="card-date">
                          <IconCalendar />
                          {new Date(attempt.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {attempt.test?.isPractice && (
  <div
    style={{
      marginTop: '10px',
      display: 'flex',
      gap: '20px',
      fontSize: '14px',
      fontWeight: '600',
    }}
  >
    <span>
      Score:
      {' '}
      {attempt.score}
      /
      {attempt.totalQuestions}
    </span>

    <span>
      Percentage:
      {' '}
      {Number(
  attempt.percentage,
).toFixed(2)}
%
    </span>
  </div>
)}

                    {attempt.test?.isPractice ? (
  <div
    className="card-success-indicator"
  >
    <IconCheck />

    {Number(
  attempt.percentage,
).toFixed(2)}
%
  </div>
) : (
  <div
    className="card-success-indicator"
  >
    <IconCheck />
    Submitted
  </div>
)}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── No search results ── */}
          {!loading && attempts.length > 0 && filtered.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon-wrap"><IconSearch /></div>
              <div className="empty-title">No matches found</div>
              <p className="empty-desc">Try adjusting your search or filter.</p>
            </div>
          )}

        </div>
      </div>
    </>
  );
}