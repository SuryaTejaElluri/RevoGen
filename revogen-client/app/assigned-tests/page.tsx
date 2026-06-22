'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';

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
    --warning: #d97706;
    --warning-light: #fef3e2;
    --coding: #7c3aed;
    --coding-light: #f3effe;
    --shadow-sm: 0 1px 3px 0 rgb(58 87 232 / 0.08), 0 1px 2px -1px rgb(58 87 232 / 0.06);
    --shadow-md: 0 4px 20px -2px rgb(58 87 232 / 0.12), 0 2px 8px -2px rgb(58 87 232 / 0.08);
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
    --warning: #f59e0b;
    --warning-light: #1c1200;
    --coding: #a78bfa;
    --coding-light: #1a0f33;
    --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.4);
    --shadow-md: 0 4px 20px -2px rgb(0 0 0 / 0.5);
    --shadow-lg: 0 16px 40px -4px rgb(0 0 0 / 0.6);
  }

  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    background-color: var(--bg);
    color: var(--text-primary);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    transition: background-color 0.3s ease, color 0.3s ease;
    min-height: 100vh;
  }

  /* ── Page wrapper ── */
  .page-wrapper {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  /* ── Hero banner ── */
  .hero-banner {
    background: linear-gradient(135deg, #1e3a8a 0%, #3a57e8 50%, #6366f1 100%);
    padding: 56px 24px 72px;
    position: relative;
    overflow: hidden;
  }

  .hero-banner::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 60% 80% at 80% -20%, rgba(255,255,255,0.08) 0%, transparent 60%),
      radial-gradient(ellipse 40% 60% at -10% 110%, rgba(99,102,241,0.3) 0%, transparent 60%);
    pointer-events: none;
  }

  .hero-banner::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 48px;
    background: var(--bg);
    clip-path: ellipse(56% 100% at 50% 100%);
  }

  .hero-inner {
    max-width: 1200px;
    margin: 0 auto;
    position: relative;
    z-index: 1;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 24px;
  }

  .hero-label {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(255,255,255,0.15);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 999px;
    padding: 6px 14px;
    font-size: 0.78rem;
    font-weight: 600;
    color: rgba(255,255,255,0.9);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    margin-bottom: 16px;
  }

  .hero-label span {
    display: inline-block;
    width: 6px;
    height: 6px;
    background: #34d399;
    border-radius: 50%;
    animation: pulse-dot 2s infinite;
  }

  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(0.8); }
  }

  .hero-title {
    font-size: clamp(1.8rem, 4vw, 2.8rem);
    font-weight: 800;
    color: #ffffff;
    line-height: 1.15;
    letter-spacing: -0.02em;
    margin-bottom: 10px;
  }

  .hero-subtitle {
    font-size: 1rem;
    color: rgba(255,255,255,0.7);
    font-weight: 400;
    max-width: 460px;
  }

  .hero-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
  }

  .theme-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(255,255,255,0.15);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,0.25);
    color: white;
    padding: 10px 18px;
    border-radius: 999px;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 600;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .theme-toggle:hover {
    background: rgba(255,255,255,0.25);
    transform: translateY(-1px);
  }

  /* ── Stats bar ── */
  .stats-bar {
    max-width: 1200px;
    margin: -24px auto 0;
    padding: 0 24px;
    position: relative;
    z-index: 2;
  }

  .stats-inner {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-lg);
    padding: 20px 32px;
    display: flex;
    align-items: center;
    gap: 0;
    overflow: hidden;
  }

  .stat-item {
    flex: 1;
    text-align: center;
    padding: 8px 16px;
    position: relative;
  }

  .stat-item:not(:last-child)::after {
    content: '';
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    height: 36px;
    width: 1px;
    background: var(--border);
  }

  .stat-value {
    font-size: 1.6rem;
    font-weight: 800;
    color: var(--accent);
    line-height: 1;
    letter-spacing: -0.03em;
    margin-bottom: 4px;
  }

  .stat-label {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  /* ── Main content ── */
  .main-content {
    flex: 1;
    max-width: 1200px;
    width: 100%;
    margin: 48px auto 80px;
    padding: 0 24px;
  }

  /* ── Section heading ── */
  .section-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 28px;
    gap: 16px;
  }

  .section-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .section-title::before {
    content: '';
    display: inline-block;
    width: 4px;
    height: 18px;
    background: var(--accent);
    border-radius: 2px;
  }

  .filter-tabs {
    display: flex;
    gap: 6px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 4px;
  }

  .filter-tab {
    padding: 6px 16px;
    border-radius: 999px;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.18s ease;
  }

  .filter-tab.active {
    background: var(--accent);
    color: white;
  }

  /* ── Test grid ── */
  .test-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 20px;
  }

  /* ── Test card ── */
  .test-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 28px;
    box-shadow: var(--shadow-sm);
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    flex-direction: column;
    gap: 0;
    position: relative;
    overflow: hidden;
  }

  .test-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--card-accent, var(--accent));
    opacity: 0;
    transition: opacity 0.25s ease;
  }

  .test-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
    border-color: var(--border-strong);
  }

  .test-card:hover::before {
    opacity: 1;
  }

  .test-card.mcq-card { --card-accent: var(--accent); }
  .test-card.coding-card { --card-accent: var(--coding); }

  /* ── Card top row ── */
  .card-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 16px;
  }

  .card-icon {
    width: 44px;
    height: 44px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    flex-shrink: 0;
  }

  .card-icon.mcq-icon {
    background: var(--accent-light);
  }

  .card-icon.coding-icon {
    background: var(--coding-light);
  }

  .type-badge {
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    padding: 4px 10px;
    border-radius: 999px;
  }

  .type-badge.mcq-badge {
    background: var(--accent-light);
    color: var(--accent);
  }

  .type-badge.coding-badge {
    background: var(--coding-light);
    color: var(--coding);
  }

  /* ── Card body ── */
  .card-title {
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--text-primary);
    line-height: 1.35;
    margin-bottom: 6px;
    letter-spacing: -0.01em;
  }

  .card-category {
    font-size: 0.82rem;
    color: var(--text-muted);
    font-weight: 500;
    margin-bottom: 20px;
  }

  /* ── Meta chips ── */
  .meta-chips {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 24px;
  }

  .meta-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: var(--surface-alt);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 5px 10px;
    font-size: 0.78rem;
    color: var(--text-secondary);
    font-weight: 500;
  }

  .meta-chip-icon {
    font-size: 0.85rem;
  }

  /* ── Divider ── */
  .card-divider {
    height: 1px;
    background: var(--border);
    margin-bottom: 20px;
  }

  /* ── Start button ── */
  .btn-start {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 13px 20px;
    border-radius: var(--radius-md);
    border: none;
    font-size: 0.9rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    letter-spacing: 0.01em;
    position: relative;
    overflow: hidden;
  }

  .btn-start::after {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(255,255,255,0);
    transition: background 0.2s ease;
  }

  .btn-start:hover::after {
    background: rgba(255,255,255,0.1);
  }

  .btn-start:active {
    transform: scale(0.98);
  }

  .btn-start.mcq-btn {
    background: linear-gradient(135deg, var(--accent) 0%, #6366f1 100%);
    color: white;
    box-shadow: 0 4px 14px 0 rgb(58 87 232 / 0.4);
  }

  .btn-start.coding-btn {
    background: linear-gradient(135deg, var(--coding) 0%, #a855f7 100%);
    color: white;
    box-shadow: 0 4px 14px 0 rgb(124 58 237 / 0.4);
  }

  .btn-start:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 20px 0 rgb(58 87 232 / 0.45);
  }

  .btn-arrow {
    display: inline-block;
    transition: transform 0.2s ease;
  }

  .btn-start:hover .btn-arrow {
    transform: translateX(3px);
  }

  /* ── Attempted badge ── */
  .attempted-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: var(--success-light);
    color: var(--success);
    font-size: 0.72rem;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 999px;
    border: 1px solid rgba(13, 158, 107, 0.2);
    margin-bottom: 12px;
    width: fit-content;
  }

  /* ── Empty state ── */
  .empty-state {
    grid-column: 1 / -1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 24px;
    text-align: center;
    background: var(--surface);
    border: 2px dashed var(--border);
    border-radius: var(--radius-xl);
  }

  .empty-icon {
    font-size: 3rem;
    margin-bottom: 16px;
    opacity: 0.6;
  }

  .empty-title {
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 8px;
  }

  .empty-desc {
    font-size: 0.9rem;
    color: var(--text-muted);
    max-width: 320px;
  }

  /* ── Loading skeleton ── */
  .skeleton-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 28px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .skeleton-line {
    background: linear-gradient(90deg, var(--surface-alt) 25%, var(--border) 50%, var(--surface-alt) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: var(--radius-sm);
  }

  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* ── Footer spacer ── */
  .page-footer {
    background: var(--surface);
    border-top: 1px solid var(--border);
    padding: 28px 24px;
    text-align: center;
    color: var(--text-muted);
    font-size: 0.82rem;
    font-weight: 500;
    margin-top: auto;
  }

  .page-footer a {
    color: var(--accent);
    text-decoration: none;
    font-weight: 600;
  }

  /* ── Responsive ── */
  @media (max-width: 768px) {
    .hero-inner {
      flex-direction: column;
      align-items: flex-start;
      gap: 20px;
    }

    .hero-actions {
      width: 100%;
    }

    .theme-toggle {
      width: 100%;
      justify-content: center;
    }

    .stats-inner {
      padding: 16px 12px;
      gap: 0;
    }

    .stat-value {
      font-size: 1.3rem;
    }

    .test-grid {
      grid-template-columns: 1fr;
    }

    .section-heading {
      flex-direction: column;
      align-items: flex-start;
    }

    .hero-banner {
      padding: 40px 24px 64px;
    }

    .main-content {
      margin-top: 36px;
      margin-bottom: 60px;
    }
  }

  @media (max-width: 480px) {
    .stat-item {
      padding: 6px 8px;
    }

    .stats-inner {
      flex-wrap: wrap;
      gap: 12px;
    }

    .stat-item::after {
      display: none;
    }
  }
`;

interface Test {
  id: string;
  title: string;
  category: string;
  duration: number;
  type: 'MCQ' | 'CODING';
  attempted?: boolean;
  attemptId?: string | null;
  securityLevel?: string;
}

type FilterType = 'ALL' | 'MCQ' | 'CODING';

export default function AssignedTestsPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [theme, setTheme] = useState('light');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('ALL');
  const router = useRouter();

  const startCodingTest = async (codingTestId: string, securityLevel?: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(
        `http://localhost:3000/coding-attempts/start/${codingTestId}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (!data.attemptId) {
        alert('Unable to start test');
        return;
      }
      const path = securityLevel === 'PRO' ? 'pro' : 'basic';
      window.location.href = `/candidate/tests/${data.attemptId}/${path}`;
    } catch (err) {
      console.error(err);
      alert('Failed to start coding test');
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
    loadTests();
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const loadTests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [mcqRes, codingRes] = await Promise.all([
        fetch('http://localhost:3000/tests/assigned', { headers }),
        fetch('http://localhost:3000/coding-tests/assigned', { headers }),
      ]);

      const mcqData = await mcqRes.json();
      const codingData = await codingRes.json();

      const formattedMcq: Test[] = mcqData.map((item: any) => ({
        id: item.id,
        title: item.title,
        category: item.category,
        duration: item.duration,
        type: 'MCQ',
        attempted: false, // MCQ completed tests are filtered server-side
      }));

      const formattedCoding: Test[] = codingData.map((item: any) => ({
        id: item.id,
        title: item.title,
        category: 'Coding',
        duration: item.duration,
        type: 'CODING',
        attempted: item.attempted,
        attemptId: item.attemptId,
        securityLevel: item.securityLevel,
      }));

      setTests([...formattedMcq, ...formattedCoding]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTests =
    filter === 'ALL' ? tests : tests.filter((t) => t.type === filter);

  const mcqCount = tests.filter((t) => t.type === 'MCQ').length;
  const codingCount = tests.filter((t) => t.type === 'CODING').length;
  const totalMins = tests.reduce((sum, t) => sum + (t.duration || 0), 0);

  return (
    <>
      <style>{styles}</style>

      <div className="page-wrapper">
        <Navbar />

        {/* ── Hero ── */}
        <section className="hero-banner">
          <div className="hero-inner">
            <div>
              <div className="hero-label">
                <span />
                Active Assessments
              </div>
              <h1 className="hero-title">Your Assigned Tests</h1>
              <p className="hero-subtitle">
                Complete your assessments before the deadline. Each test is
                timed — make sure you're in a distraction-free environment.
              </p>
            </div>
            <div className="hero-actions">
              <button onClick={toggleTheme} className="theme-toggle">
                {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
              </button>
            </div>
          </div>
        </section>

        {/* ── Stats bar ── */}
        <div className="stats-bar">
          <div className="stats-inner">
            <div className="stat-item">
              <div className="stat-value">{tests.length}</div>
              <div className="stat-label">Total Tests</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{mcqCount}</div>
              <div className="stat-label">MCQ Tests</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{codingCount}</div>
              <div className="stat-label">Coding Tests</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{totalMins}</div>
              <div className="stat-label">Total Mins</div>
            </div>
          </div>
        </div>

        {/* ── Main content ── */}
        <main className="main-content">
          {/* Filter bar */}
          {!loading && tests.length > 0 && (
            <div className="section-heading">
              <div className="section-title">All Tests</div>
              <div className="filter-tabs">
                {(['ALL', 'MCQ', 'CODING'] as FilterType[]).map((f) => (
                  <button
                    key={f}
                    className={`filter-tab${filter === f ? ' active' : ''}`}
                    onClick={() => setFilter(f)}
                  >
                    {f === 'ALL' ? 'All' : f === 'MCQ' ? '📝 MCQ' : '💻 Coding'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cards grid */}
          <div className="test-grid">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton-card">
                  <div
                    className="skeleton-line"
                    style={{ height: 44, width: 44, borderRadius: 12 }}
                  />
                  <div
                    className="skeleton-line"
                    style={{ height: 20, width: '70%' }}
                  />
                  <div
                    className="skeleton-line"
                    style={{ height: 14, width: '45%' }}
                  />
                  <div
                    className="skeleton-line"
                    style={{ height: 14, width: '55%', marginTop: 8 }}
                  />
                  <div
                    className="skeleton-line"
                    style={{ height: 44, marginTop: 20 }}
                  />
                </div>
              ))
            ) : filteredTests.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <div className="empty-title">
                  {tests.length === 0
                    ? 'No tests assigned yet'
                    : `No ${filter} tests found`}
                </div>
                <p className="empty-desc">
                  {tests.length === 0
                    ? 'Your administrator will assign tests to you. Check back soon.'
                    : 'Try switching to a different filter above.'}
                </p>
              </div>
            ) : (
              filteredTests.map((test) => (
                <div
                  key={test.id}
                  className={`test-card ${
                    test.type === 'MCQ' ? 'mcq-card' : 'coding-card'
                  }`}
                >
                  {/* Top row */}
                  <div className="card-top">
                    <div
                      className={`card-icon ${
                        test.type === 'MCQ' ? 'mcq-icon' : 'coding-icon'
                      }`}
                    >
                      {test.type === 'MCQ' ? '📝' : '💻'}
                    </div>
                    <span
                      className={`type-badge ${
                        test.type === 'MCQ' ? 'mcq-badge' : 'coding-badge'
                      }`}
                    >
                      {test.type === 'MCQ' ? 'MCQ' : 'Coding'}
                    </span>
                  </div>

                  {/* Title & category */}
                  <h2 className="card-title">{test.title}</h2>
                  <p className="card-category">📁 {test.category}</p>

                  {/* Attempted */}
                  {test.attempted && (
                    <div className="attempted-badge">✓ Completed</div>
                  )}

                  {/* Meta chips */}
                  <div className="meta-chips">
                    <span className="meta-chip">
                      <span className="meta-chip-icon">⏱️</span>
                      {test.duration} mins
                    </span>
                    <span className="meta-chip">
                      <span className="meta-chip-icon">
                        {test.type === 'MCQ' ? '🎯' : '🔧'}
                      </span>
                      {test.type === 'MCQ' ? 'Multiple choice' : 'Problem solving'}
                    </span>
                    {test.securityLevel && (
                      <span className="meta-chip">
                        <span className="meta-chip-icon">🔒</span>
                        {test.securityLevel}
                      </span>
                    )}
                  </div>

                  <div className="card-divider" />

                  {/* CTA */}
                  <button
                    className={`btn-start ${
                      test.type === 'MCQ' ? 'mcq-btn' : 'coding-btn'
                    }`}
                    disabled={test.attempted}
                    style={test.attempted ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                    onClick={() => {
                      if (test.attempted) return;
                      if (test.type === 'MCQ') {
                        router.push(`/tests/${test.id}`);
                      } else {
                        startCodingTest(test.id, test.securityLevel);
                      }
                    }}
                  >
                    {test.attempted ? '✓ Already Submitted' : 'Start Test'}
                    {!test.attempted && <span className="btn-arrow">→</span>}
                  </button>
                </div>
              ))
            )}
          </div>
        </main>

        {/* ── Footer ── */}
        <footer className="page-footer">
          Having trouble? Contact your&nbsp;
          <a href="mailto:support@yourplatform.com">assessment coordinator</a>
          &nbsp;for help.
        </footer>
      </div>
    </>
  );
}