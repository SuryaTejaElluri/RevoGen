'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminNavbar from '@/components/AdminNavbar';

export default function TestsPage() {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadTests(); }, []);

  const loadTests = async () => {
    try {
      const response = await fetch('http://localhost:3000/tests');
      const data = await response.json();
      setTests(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

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
          background-image:
            radial-gradient(ellipse 80% 40% at 50% -5%, rgba(56,139,253,0.07) 0%, transparent 60%);
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
        }
        .page-title { font-size: 22px; font-weight: 700; letter-spacing: -0.3px; }
        .page-subtitle { font-size: 13px; color: var(--text-secondary); margin-top: 2px; }

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
        }
        .create-btn:hover {
          background: #4493ff;
          box-shadow: 0 4px 16px var(--accent-glow);
          transform: translateY(-1px);
        }
        .create-btn:active { transform: translateY(0); }

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
          background: var(--accent);
          border-radius: 3px 0 0 3px;
          opacity: 0;
          transition: opacity 0.2s;
        }
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
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 5px;
        }
        .meta-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 12px; font-weight: 500;
          font-family: var(--font-mono);
        }
        .badge-blue { background: var(--accent-soft); color: var(--accent); border: 1px solid rgba(56,139,253,0.2); }
        .badge-green { background: var(--success-soft); color: var(--success); border: 1px solid rgba(63,185,80,0.2); }
        .badge-yellow { background: var(--warning-soft); color: var(--warning); border: 1px solid rgba(210,153,34,0.2); }
        .badge-purple { background: var(--purple-soft); color: var(--purple); border: 1px solid rgba(188,140,255,0.2); }

        /* ── Action Buttons ── */
        .test-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 16px;
          padding-top: 14px;
          border-top: 1px solid var(--border);
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
          transition: background 0.15s, border-color 0.15s, transform 0.1s;
          border: 1px solid var(--border);
          background: var(--bg-card);
          color: var(--text-secondary);
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

        .section-label {
          font-size: 11px; font-weight: 600;
          text-transform: uppercase; letter-spacing: 1px;
          color: var(--text-muted);
          margin-bottom: 14px;
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
                <div className="page-title">Test Management</div>
                <div className="page-subtitle">Create, manage and assign tests to candidates</div>
              </div>
            </div>
            <Link href="/admin/tests/new" className="create-btn">
              <span>＋</span> Create Test
            </Link>
          </div>

          {/* Summary */}
          {!loading && (
            <div className="summary-bar">
              <div className="summary-chip">
                <div className="summary-value">{tests.length}</div>
                <div className="summary-label">Total Tests</div>
              </div>
              <div className="summary-chip">
                <div className="summary-value" style={{ color: 'var(--success)' }}>
                  {tests.filter((t) => t.duration <= 30).length}
                </div>
                <div className="summary-label">≤ 30 min</div>
              </div>
              <div className="summary-chip">
                <div className="summary-value" style={{ color: 'var(--purple)' }}>
                  {tests.filter((t) => t.duration > 30).length}
                </div>
                <div className="summary-label">&gt; 30 min</div>
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
          {!loading && tests.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <div className="empty-text">No tests created yet. Click <strong>Create Test</strong> to get started.</div>
            </div>
          )}

          {/* Test Cards */}
          {!loading && tests.length > 0 && (
            <>
              <div className="section-label">{tests.length} test{tests.length !== 1 ? 's' : ''} found</div>
              {tests.map((test: any) => (
                <div key={test.id} className="test-card">
                  <div className="test-card-header">
                    <div>
                      <div className="test-title">{test.title}</div>
                      <div className="test-meta">
                        {test.category && (
                          <span className="meta-badge badge-purple">🏷 {test.category}</span>
                        )}
                        <span className="meta-badge badge-yellow">⏱ {test.duration} mins</span>
                        <span className="meta-badge badge-blue">🆔 {test.id?.toString().slice(0, 8)}…</span>
                      </div>
                    </div>
                  </div>

                  <div className="test-actions">
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
                  </div>
                </div>
              ))}
            </>
          )}

        </div>
      </div>
    </>
  );
}