'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminNavbar from '@/components/AdminNavbar';
import { API_BASE_URL } from '@/lib/api';

interface Question {
  id: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
}

interface Test {
  id: string;
  title: string;
  category?: string;
  duration: number;
  securityLevel: string;
  questions: Question[];
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const;

function getOptionText(q: Question, letter: string) {
  if (letter === 'A') return q.optionA;
  if (letter === 'B') return q.optionB;
  if (letter === 'C') return q.optionC;
  return q.optionD;
}

export default function TestQuestionsPage() {
  const params   = useParams();
  const router   = useRouter();
  const testId   = params.id as string;

  const [test, setTest]       = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res   = await fetch(`${API_BASE_URL}/tests/${testId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data  = await res.json();
        setTest(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [testId]);

  const filtered = (test?.questions ?? []).filter(q =>
    q.question.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:           #090c12;
          --surface:      #10141e;
          --surface-2:    #161b27;
          --card:         #1b2130;
          --border:       #232a3a;
          --border-h:     #323c52;
          --accent:       #6366f1;
          --accent-b:     #818cf8;
          --accent-soft:  rgba(99,102,241,0.13);
          --accent-glow:  rgba(99,102,241,0.28);
          --success:      #22c55e;
          --success-b:    #4ade80;
          --success-soft: rgba(34,197,94,0.11);
          --danger:       #ef4444;
          --danger-b:     #f87171;
          --danger-soft:  rgba(239,68,68,0.11);
          --warn:         #f59e0b;
          --warn-b:       #fbbf24;
          --warn-soft:    rgba(245,158,11,0.11);
          --purple:       #a78bfa;
          --purple-soft:  rgba(167,139,250,0.13);
          --text:         #f1f5f9;
          --text-2:       #8b96a8;
          --text-3:       #4b5468;
          --font:         'Plus Jakarta Sans', sans-serif;
          --mono:         'JetBrains Mono', monospace;
          --r-sm:         8px;
          --r-md:         12px;
          --r-lg:         16px;
          --r-xl:         20px;
        }

        body { background: var(--bg); font-family: var(--font); color: var(--text); }

        .shell {
          min-height: 100vh;
          background: var(--bg);
          background-image:
            radial-gradient(ellipse 65% 30% at 15% -5%, rgba(99,102,241,0.09) 0%, transparent 55%),
            radial-gradient(ellipse 55% 25% at 85% 0%, rgba(167,139,250,0.06) 0%, transparent 50%);
        }

        .container {
          max-width: 900px;
          margin: 0 auto;
          padding: 32px 24px 80px;
        }

        /* ── Back button ── */
        .back-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-2);
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          margin-bottom: 24px;
          font-family: var(--font);
          transition: color 0.15s;
        }
        .back-btn:hover { color: var(--text); }

        /* ── Page header ── */
        .page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 28px;
          flex-wrap: wrap;
        }
        .header-left { display: flex; align-items: center; gap: 14px; }
        .header-icon {
          width: 48px; height: 48px;
          background: linear-gradient(135deg, var(--accent), var(--purple));
          border-radius: var(--r-md);
          display: flex; align-items: center; justify-content: center;
          font-size: 22px;
          box-shadow: 0 4px 20px var(--accent-glow);
          flex-shrink: 0;
        }
        .page-title {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.4px;
          color: var(--text);
        }
        .page-sub {
          font-size: 13px;
          color: var(--text-2);
          margin-top: 3px;
        }

        /* ── Stats row ── */
        .stats-row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 24px;
        }
        .stat-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-2);
          font-family: var(--mono);
        }
        .stat-chip.blue   { background: var(--accent-soft);  border-color: rgba(99,102,241,0.25); color: var(--accent-b); }
        .stat-chip.green  { background: var(--success-soft); border-color: rgba(34,197,94,0.25);  color: var(--success-b); }
        .stat-chip.yellow { background: var(--warn-soft);    border-color: rgba(245,158,11,0.25); color: var(--warn-b); }
        .stat-chip.purple { background: var(--purple-soft);  border-color: rgba(167,139,250,0.25); color: var(--purple); }

        /* ── Toolbar ── */
        .toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .search-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r-sm);
          padding: 9px 14px;
          flex: 1;
          max-width: 380px;
          transition: border-color 0.15s;
        }
        .search-box:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
        .search-box input {
          background: none;
          border: none;
          outline: none;
          color: var(--text);
          font-size: 13px;
          font-family: var(--font);
          width: 100%;
        }
        .search-box input::placeholder { color: var(--text-3); }
        .search-icon { color: var(--text-3); font-size: 14px; flex-shrink: 0; }

        .toolbar-right { display: flex; gap: 8px; align-items: center; }

        .ghost-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r-sm);
          font-family: var(--font);
          font-size: 12px;
          font-weight: 600;
          color: var(--text-2);
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s, color 0.15s;
          white-space: nowrap;
        }
        .ghost-btn:hover { background: var(--surface-2); border-color: var(--border-h); color: var(--text); }

        .count-label {
          font-size: 12px;
          color: var(--text-3);
          font-family: var(--mono);
          white-space: nowrap;
        }
        .count-label strong { color: var(--text-2); }

        /* ── Question Card ── */
        .q-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r-xl);
          margin-bottom: 12px;
          overflow: hidden;
          transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
          position: relative;
        }
        .q-card::before {
          content: '';
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 3px;
          background: linear-gradient(180deg, var(--accent), var(--purple));
          opacity: 0.7;
        }
        .q-card:hover {
          border-color: var(--border-h);
          box-shadow: 0 8px 28px rgba(0,0,0,0.4);
          transform: translateY(-2px);
        }

        .q-top {
          padding: 20px 24px 16px 28px;
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }
        .q-num {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          min-width: 32px;
          border-radius: 8px;
          background: var(--accent-soft);
          border: 1px solid rgba(99,102,241,0.25);
          font-family: var(--mono);
          font-size: 12px;
          font-weight: 700;
          color: var(--accent-b);
          flex-shrink: 0;
          margin-top: 2px;
        }
        .q-text {
          font-size: 15px;
          font-weight: 600;
          line-height: 1.65;
          color: var(--text);
          flex: 1;
        }
        .reveal-toggle {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          font-family: var(--font);
          cursor: pointer;
          border: 1px solid;
          transition: all 0.15s;
          white-space: nowrap;
          flex-shrink: 0;
          background: none;
        }
        .reveal-toggle.hidden {
          border-color: rgba(99,102,241,0.3);
          color: var(--accent-b);
          background: var(--accent-soft);
        }
        .reveal-toggle.hidden:hover {
          background: rgba(99,102,241,0.22);
          border-color: var(--accent);
        }
        .reveal-toggle.shown {
          border-color: rgba(34,197,94,0.3);
          color: var(--success-b);
          background: var(--success-soft);
        }
        .reveal-toggle.shown:hover {
          background: rgba(34,197,94,0.22);
          border-color: var(--success);
        }

        /* ── Options Grid ── */
        .options-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          padding: 0 24px 20px 28px;
        }
        .option-row {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 11px 14px;
          border-radius: var(--r-md);
          border: 1px solid var(--border);
          background: var(--surface-2);
          transition: border-color 0.15s, background 0.15s;
        }
        .option-row.correct {
          border-color: rgba(34,197,94,0.4);
          background: rgba(34,197,94,0.07);
        }
        .option-row.correct-hidden {
          border-color: var(--border);
          background: var(--surface-2);
        }
        .option-letter {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          min-width: 24px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          font-family: var(--mono);
          flex-shrink: 0;
          border: 1px solid var(--border);
          background: var(--card);
          color: var(--text-2);
          transition: all 0.15s;
        }
        .option-row.correct .option-letter {
          border-color: rgba(34,197,94,0.5);
          background: rgba(34,197,94,0.15);
          color: var(--success-b);
        }
        .option-text {
          font-size: 13px;
          line-height: 1.5;
          color: var(--text-2);
          padding-top: 3px;
        }
        .option-row.correct .option-text {
          color: var(--success-b);
          font-weight: 600;
        }
        .correct-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          font-weight: 700;
          color: var(--success-b);
          margin-left: auto;
          padding-left: 6px;
          white-space: nowrap;
          flex-shrink: 0;
        }

        /* ── Loading / Empty ── */
        .center-screen {
          min-height: 60vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .empty-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r-xl);
          padding: 56px 48px;
          max-width: 400px;
          text-align: center;
        }
        .big-icon { font-size: 44px; margin-bottom: 16px; }
        .empty-title { font-size: 19px; font-weight: 700; margin-bottom: 8px; }
        .empty-sub { font-size: 13px; color: var(--text-2); line-height: 1.7; }

        .spinner {
          width: 38px; height: 38px;
          border: 3px solid var(--border);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 0.75s linear infinite;
          margin: 0 auto 18px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Skeleton ── */
        .skel-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r-xl);
          padding: 22px 24px;
          margin-bottom: 12px;
          animation: pulse 1.5s ease-in-out infinite;
        }
        .skel-line {
          background: var(--card);
          border-radius: 4px;
          height: 13px;
          margin-bottom: 10px;
        }
        .skel-line.w-80 { width: 80%; }
        .skel-line.w-50 { width: 50%; }
        .skel-line.w-35 { width: 35%; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }

        @media (max-width: 640px) {
          .options-grid { grid-template-columns: 1fr; }
          .page-header { flex-direction: column; }
          .toolbar { flex-direction: column; align-items: stretch; }
          .search-box { max-width: 100%; }
        }
      `}</style>

      <AdminNavbar />

      <div className="shell">
        <div className="container">

          {/* Back */}
          <button className="back-btn" onClick={() => router.back()}>
            ← Back
          </button>

          {/* Loading skeletons */}
          {loading && (
            <>
              <div style={{ height: 60, marginBottom: 28 }} />
              {[1, 2, 3].map(i => (
                <div key={i} className="skel-card">
                  <div className="skel-line w-80" />
                  <div className="skel-line w-50" />
                  <div className="skel-line w-35" />
                </div>
              ))}
            </>
          )}

          {/* No test */}
          {!loading && !test && (
            <div className="center-screen">
              <div className="empty-card">
                <div className="big-icon">⚠️</div>
                <div className="empty-title">Assessment not found</div>
                <div className="empty-sub">This assessment doesn't exist or you don't have access to it.</div>
              </div>
            </div>
          )}

          {/* Main content */}
          {!loading && test && (
            <>
              {/* Page Header */}
              <div className="page-header">
                <div className="header-left">
                  <div className="header-icon">❓</div>
                  <div>
                    <div className="page-title">{test.title}</div>
                    <div className="page-sub">Question bank for this assessment</div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="stats-row">
                <span className="stat-chip green">❓ {test.questions.length} Questions</span>
                <span className="stat-chip yellow">⏱ {test.duration} min</span>
                <span className="stat-chip blue">🔒 {test.securityLevel}</span>
              </div>

              {/* Toolbar */}
              <div className="toolbar">
                <div className="search-box">
                  <span className="search-icon">🔍</span>
                  <input
                    type="text"
                    placeholder="Search questions…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <div className="toolbar-right">
                  <span className="count-label">
                    Showing <strong>{filtered.length}</strong> of <strong>{test.questions.length}</strong>
                  </span>
                </div>
              </div>

              {/* Empty search */}
              {filtered.length === 0 && (
                <div className="center-screen" style={{ minHeight: 200 }}>
                  <div style={{ textAlign: 'center', color: 'var(--text-3)' }}>
                    <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
                    <div style={{ fontSize: 14 }}>No questions match <strong style={{ color: 'var(--text-2)' }}>"{search}"</strong></div>
                  </div>
                </div>
              )}

              {/* Question Cards */}
              {filtered.map((q, index) => (
                <div key={q.id} className="q-card">
                  <div className="q-top">
                    <span className="q-num">{index + 1}</span>
                    <p className="q-text">{q.question}</p>
                  </div>

                  <div className="options-grid">
                    {OPTION_LABELS.map(letter => {
                      const isCorrect = q.correctAnswer === getOptionText(q, letter);
                      return (
                        <div
                          key={letter}
                          className={`option-row ${isCorrect ? 'correct' : 'correct-hidden'}`}
                        >
                          <span className="option-letter">{letter}</span>
                          <span className="option-text">{getOptionText(q, letter)}</span>
                          {isCorrect && (
                            <span className="correct-badge">✓ Correct</span>
                          )}
                        </div>
                      );
                    })}
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
