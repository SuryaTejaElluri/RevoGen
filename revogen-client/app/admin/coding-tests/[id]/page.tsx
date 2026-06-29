'use client';
import { API_BASE_URL } from '@/lib/api';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminNavbar from '@/components/AdminNavbar';

// --- TypeScript Interfaces ---

export interface QuestionStarterCodes {
  [key: string]: string;
}

export interface TestCase {
  id: string;
  questionId: string;
  input: string;
  expectedOutput: string;
  explanation: string | null;
  isHidden: boolean;
}

export interface QuestionDetail {
  id: string;
  title: string;
  slug: string;
  category: string;
  difficulty: string;
  description: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  starterCodes?: QuestionStarterCodes;
  testCases?: TestCase[];
}

export interface QuestionInfo {
  id: string;
  codingTestId: string;
  questionId: string;
  order: number;
  scoreWeight: number;
  question: QuestionDetail;
}

export interface Assessment {
  id: string;
  title: string;
  description: string;
  duration: number;
  securityLevel: string;
  createdById: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  questions: QuestionInfo[];
}

export default function AssessmentViewPage() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = params.id as string;

  // --- State ---
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // --- API Calls ---
  const fetchAssessment = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

      const res = await fetch(`${API_BASE_URL}/coding-tests/${assessmentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to load assessment details');
      }

      const data: Assessment = await res.json();
      setAssessment(data);

      if (data.questions) {
        const initialExpandedState: Record<string, boolean> = {};
        data.questions.forEach((q) => {
          initialExpandedState[q.id] = true;
        });
        setExpandedQuestions(initialExpandedState);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  }, [assessmentId]);

  useEffect(() => {
    if (assessmentId) {
      fetchAssessment();
    }

    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('app_theme') as 'dark' | 'light';
      if (savedTheme) {
        setTheme(savedTheme);
      }
    }
  }, [assessmentId, fetchAssessment]);

  // --- Handlers & Helpers ---
  const toggleQuestion = (questionId: string) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('app_theme', newTheme);
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-GB', options);
  };

  const formatLanguage = (lang: string) => {
    const map: Record<string, string> = {
      java: 'Java',
      python: 'Python',
      javascript: 'JavaScript',
      c: 'C',
      cpp: 'C++',
      ruby: 'Ruby',
      go: 'Go'
    };
    return map[lang.toLowerCase()] || lang;
  };

  // --- Derived State ---
  const difficultyCounts = { EASY: 0, MEDIUM: 0, HARD: 0 };

  if (assessment && assessment.questions) {
    assessment.questions.forEach(q => {
      const diff = q.question.difficulty?.toUpperCase();
      if (diff === 'EASY' || diff === 'MEDIUM' || diff === 'HARD') {
        difficultyCounts[diff]++;
      }
    });
  }

  // --- Renderers ---
  if (loading) {
    return (
      <div className={`rv-root ${theme}`}>
        <div className="rv-shell">
          <div className="rv-main">
            <div className="sk sk-title" />
            <div className="rv-stats">
              {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="sk sk-stat" />)}
            </div>
            <div className="sk sk-info" />
            <div className="sk sk-list" />
          </div>
          <aside className="rv-side">
            <div className="sk sk-side" />
          </aside>
        </div>
        <style jsx global>{styles}</style>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className={`rv-root ${theme}`}>
        <div className="rv-error">
          <div className="rv-error-card">
            <div className="rv-error-icon">!</div>
            <h2>Something went wrong</h2>
            <p>{error || 'Assessment not found'}</p>
            <button onClick={() => router.push('/admin/tests')} className="btn btn-primary">
              ← Back to Tests
            </button>
          </div>
        </div>
        <style jsx global>{styles}</style>
      </div>
    );
  }

  return (
    <>
      <AdminNavbar />

      <div className={`rv-root ${theme}`}>
        <div className="rv-bg-blob blob-a" />
        <div className="rv-bg-blob blob-b" />

        <div className="rv-shell">
          <div className="rv-main">

            {/* Breadcrumb / Title */}
            <header className="rv-header">
              <div className="rv-crumb">
                <button onClick={() => router.push('/admin/tests')} className="rv-crumb-link">Tests</button>
                <span className="rv-crumb-sep">/</span>
                <span className="rv-crumb-current">Details</span>
              </div>

              <div className="rv-header-row">
                <div className="rv-header-titles">
                  <div className="rv-title-line">
                    <h1>{assessment.title}</h1>
                    <span className={`chip ${assessment.isActive ? 'chip-success' : 'chip-muted'}`}>
                      <span className="chip-dot" />
                      {assessment.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="rv-sub">
                    Review assessment configuration, questions, and test cases.
                  </p>
                </div>

                <div className="rv-actions">
                  <button onClick={toggleTheme} className="btn btn-ghost" aria-label="Toggle theme">
                    {theme === 'dark' ? '☀' : '☾'}
                  </button>
                  <button
                    onClick={() => router.push(`/admin/coding-tests/${assessmentId}/assign`)}
                    className="btn btn-outline"
                  >
                    Assign Candidates
                  </button>
                  <button
                    onClick={() => router.push(`/admin/coding-tests/${assessmentId}/results`)}
                    className="btn btn-outline"
                  >
                    View Results
                  </button>
                  <button
                    onClick={() => router.push('/admin/tests')}
                    className="btn btn-primary"
                  >
                    ← Back
                  </button>
                </div>
              </div>
            </header>

            {/* Top Stats */}
            <section className="rv-stats">
              <div className="stat">
                <span className="stat-label">Duration</span>
                <span className="stat-value">{assessment.duration}<span className="stat-unit"> min</span></span>
              </div>
              <div className="stat">
                <span className="stat-label">Questions</span>
                <span className="stat-value">{assessment.questions.length}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Security Level</span>
                <span className="chip chip-info">{assessment.securityLevel}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Easy</span>
                <span className="stat-value text-easy">{difficultyCounts.EASY}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Medium</span>
                <span className="stat-value text-medium">{difficultyCounts.MEDIUM}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Hard</span>
                <span className="stat-value text-hard">{difficultyCounts.HARD}</span>
              </div>
            </section>

            {/* Assessment Information */}
            <section className="card">
              <div className="card-head">
                <h2 className="card-title">Assessment Information</h2>
                <span className="card-sub">Created {formatDate(assessment.createdAt)}</span>
              </div>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Title</span>
                  <span className="info-text">{assessment.title}</span>
                </div>
                <div className="info-item info-full">
                  <span className="info-label">Description</span>
                  <span className="info-text">{assessment.description || 'No description provided.'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Duration</span>
                  <span className="info-text">{assessment.duration} minutes</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Created Date</span>
                  <span className="info-text">{formatDate(assessment.createdAt)}</span>
                </div>
              </div>
            </section>

            {/* Questions */}
            <section className="rv-questions">
              <div className="rv-questions-head">
                <h2 className="card-title">Questions</h2>
                <span className="card-sub">{assessment.questions.length} total</span>
              </div>

              {assessment.questions.length === 0 ? (
                <div className="card empty">
                  <div className="empty-icon">∅</div>
                  <h3>No questions yet</h3>
                  <p>This assessment doesn&apos;t have any questions assigned.</p>
                </div>
              ) : (
                <div className="q-list">
                  {assessment.questions
                    .sort((a, b) => a.order - b.order)
                    .map((q) => {
                      const isExpanded = !!expandedQuestions[q.id];
                      const qData = q.question;
                      const languages = Object.keys(qData.starterCodes || {});
                      const testCases = qData.testCases || [];
                      const diffKey = (qData.difficulty || 'EASY').toLowerCase();

                      return (
                        <div key={q.id} className="card q-card">
                          <div className="q-head">
                            <div className="q-meta">
                              <div className="q-meta-top">
                                <span className="q-order">#{q.order}</span>
                                <h3 className="q-title">{qData.title}</h3>
                              </div>
                              <div className="q-tags">
                                <span className={`chip chip-diff diff-${diffKey}`}>
                                  <span className="chip-dot" />
                                  {qData.difficulty}
                                </span>
                                <span className="chip chip-muted">{qData.category}</span>
                                <span className="chip chip-muted">Weight: {q.scoreWeight}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => toggleQuestion(q.id)}
                              className="btn btn-outline btn-sm"
                            >
                              {isExpanded ? 'Hide details' : 'View details'}
                              <span className={`caret ${isExpanded ? 'caret-up' : ''}`}>⌃</span>
                            </button>
                          </div>

                          {isExpanded && (
                            <div className="q-body">
                              <div className="detail">
                                <h4>Description</h4>
                                <div className="md">{qData.description}</div>
                              </div>

                              <div className="detail-grid">
                                <div className="detail">
                                  <h4>Input Format</h4>
                                  <div className="md">{qData.inputFormat}</div>
                                </div>
                                <div className="detail">
                                  <h4>Output Format</h4>
                                  <div className="md">{qData.outputFormat}</div>
                                </div>
                              </div>

                              <div className="detail">
                                <h4>Constraints</h4>
                                <pre className="md md-code">{qData.constraints}</pre>
                              </div>

                              {testCases.length > 0 && (
                                <div className="detail">
                                  <h4>
                                    Test Cases <span className="count-pill">{testCases.length}</span>
                                  </h4>
                                  <div className="tc-grid">
                                    {testCases.map((tc, index) => (
                                      <div key={tc.id} className="tc">
                                        <div className="tc-head">
                                          <span className="tc-title">Test Case {index + 1}</span>
                                          {tc.isHidden && <span className="chip chip-warn">Hidden</span>}
                                        </div>
                                        <div className="tc-io">
                                          <span className="tc-label">Input</span>
                                          <pre className="tc-code">{tc.input}</pre>
                                        </div>
                                        <div className="tc-io">
                                          <span className="tc-label">Expected Output</span>
                                          <pre className="tc-code">{tc.expectedOutput}</pre>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {languages.length > 0 && (
                                <div className="detail">
                                  <h4>Available Languages</h4>
                                  <div className="lang-row">
                                    {languages.map(lang => (
                                      <span key={lang} className="chip chip-lang">{formatLanguage(lang)}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <aside className="rv-side">
            <div className="card side-card">
              <h3 className="side-title">Assessment Summary</h3>
              <div className="side-list">
                <div className="side-item">
                  <span className="side-label">Name</span>
                  <span className="side-value truncate" title={assessment.title}>{assessment.title}</span>
                </div>
                <div className="side-item">
                  <span className="side-label">Duration</span>
                  <span className="side-value">{assessment.duration} min</span>
                </div>
                <div className="side-item">
                  <span className="side-label">Security</span>
                  <span className="chip chip-info">{assessment.securityLevel}</span>
                </div>
                <div className="side-item">
                  <span className="side-label">Status</span>
                  <span className={`chip ${assessment.isActive ? 'chip-success' : 'chip-muted'}`}>
                    <span className="chip-dot" />
                    {assessment.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="side-divider" />

                <div className="side-item">
                  <span className="side-label">Total Questions</span>
                  <span className="side-value strong">{assessment.questions.length}</span>
                </div>

                <div className="diff-bars">
                  <div className="diff-bar">
                    <div className="diff-bar-head">
                      <span>Easy</span>
                      <span className="text-easy strong">{difficultyCounts.EASY}</span>
                    </div>
                    <div className="bar">
                      <div className="bar-fill bar-easy" style={{
                        width: `${assessment.questions.length ? (difficultyCounts.EASY / assessment.questions.length) * 100 : 0}%`
                      }} />
                    </div>
                  </div>
                  <div className="diff-bar">
                    <div className="diff-bar-head">
                      <span>Medium</span>
                      <span className="text-medium strong">{difficultyCounts.MEDIUM}</span>
                    </div>
                    <div className="bar">
                      <div className="bar-fill bar-medium" style={{
                        width: `${assessment.questions.length ? (difficultyCounts.MEDIUM / assessment.questions.length) * 100 : 0}%`
                      }} />
                    </div>
                  </div>
                  <div className="diff-bar">
                    <div className="diff-bar-head">
                      <span>Hard</span>
                      <span className="text-hard strong">{difficultyCounts.HARD}</span>
                    </div>
                    <div className="bar">
                      <div className="bar-fill bar-hard" style={{
                        width: `${assessment.questions.length ? (difficultyCounts.HARD / assessment.questions.length) * 100 : 0}%`
                      }} />
                    </div>
                  </div>
                </div>

                <div className="side-divider" />

                <button
                  onClick={() => router.push(`/admin/coding-tests/${assessmentId}/assign`)}
                  className="btn btn-primary btn-block"
                >
                  Assign Candidates
                </button>
                <button
                  onClick={() => router.push(`/admin/coding-tests/${assessmentId}/results`)}
                  className="btn btn-outline btn-block"
                >
                  View Results
                </button>
              </div>
            </div>
          </aside>
        </div>

        <style jsx global>{styles}</style>
      </div>
    </>
  );
}

// --- Premium SaaS Styles ---
const styles = `
  .rv-root.dark {
    --bg: #07090d;
    --bg-elev: #0c1016;
    --surface: rgba(20, 24, 32, 0.7);
    --surface-2: rgba(28, 32, 42, 0.6);
    --border: rgba(255,255,255,0.08);
    --border-strong: rgba(255,255,255,0.14);
    --text: #e6e8ec;
    --text-muted: #9aa3af;
    --text-dim: #6b7280;
    --code-bg: rgba(0,0,0,0.45);
    --shadow-sm: 0 1px 2px rgba(0,0,0,0.4);
    --shadow-md: 0 8px 24px rgba(0,0,0,0.35);
    --shadow-lg: 0 20px 50px rgba(0,0,0,0.5);
    --ring: rgba(59,130,246,0.55);
  }
  .rv-root.light {
    --bg: #f6f7f9;
    --bg-elev: #ffffff;
    --surface: rgba(255,255,255,0.9);
    --surface-2: #f8fafc;
    --border: rgba(15,23,42,0.08);
    --border-strong: rgba(15,23,42,0.14);
    --text: #0f172a;
    --text-muted: #475569;
    --text-dim: #64748b;
    --code-bg: #f1f5f9;
    --shadow-sm: 0 1px 2px rgba(15,23,42,0.06);
    --shadow-md: 0 6px 20px rgba(15,23,42,0.08);
    --shadow-lg: 0 16px 40px rgba(15,23,42,0.12);
    --ring: rgba(59,130,246,0.45);
  }

  .rv-root {
    --primary: #3b82f6;
    --primary-hover: #2563eb;
    --primary-soft: rgba(59,130,246,0.12);
    --success: #10b981;
    --success-soft: rgba(16,185,129,0.12);
    --warn: #f59e0b;
    --warn-soft: rgba(245,158,11,0.12);
    --danger: #ef4444;
    --danger-soft: rgba(239,68,68,0.12);
    --info: #06b6d4;
    --info-soft: rgba(6,182,212,0.12);
    --r-sm: 8px;
    --r-md: 12px;
    --r-lg: 16px;
    --r-xl: 20px;
    --font: ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;

    position: relative;
    min-height: 100vh;
    background: var(--bg);
    color: var(--text);
    font-family: var(--font);
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
  }

  .rv-bg-blob {
    position: fixed;
    width: 600px; height: 600px;
    border-radius: 50%;
    filter: blur(120px);
    opacity: 0.35;
    pointer-events: none;
    z-index: 0;
  }
  .blob-a { top: -200px; left: -150px; background: radial-gradient(circle, #3b82f6, transparent 70%); }
  .blob-b { bottom: -250px; right: -150px; background: radial-gradient(circle, #10b981, transparent 70%); }
  .rv-root.light .rv-bg-blob { opacity: 0.18; }

  .rv-shell {
    position: relative;
    z-index: 1;
    max-width: 1440px;
    margin: 0 auto;
    padding: 32px 28px 64px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 340px;
    gap: 28px;
  }
  @media (max-width: 1100px) {
    .rv-shell { grid-template-columns: 1fr; padding: 20px 16px 48px; }
  }

  .rv-main { min-width: 0; display: flex; flex-direction: column; gap: 24px; }

  /* Header */
  .rv-header { display: flex; flex-direction: column; gap: 14px; }
  .rv-crumb { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-muted); }
  .rv-crumb-link {
    background: none; border: 0; color: var(--text-muted); cursor: pointer; padding: 0;
    font: inherit; transition: color .15s;
  }
  .rv-crumb-link:hover { color: var(--text); }
  .rv-crumb-sep { opacity: 0.5; }
  .rv-crumb-current { color: var(--text); font-weight: 500; }

  .rv-header-row {
    display: flex; align-items: flex-start; justify-content: space-between;
    gap: 20px; flex-wrap: wrap;
  }
  .rv-header-titles { min-width: 0; flex: 1; }
  .rv-title-line { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .rv-title-line h1 {
    font-size: clamp(22px, 2.6vw, 30px);
    font-weight: 700;
    letter-spacing: -0.02em;
    margin: 0;
    line-height: 1.2;
  }
  .rv-sub { color: var(--text-muted); margin: 6px 0 0; font-size: 14px; }
  .rv-actions { display: flex; gap: 8px; flex-wrap: wrap; }

  /* Buttons */
  .btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    height: 38px; padding: 0 14px;
    border-radius: var(--r-sm);
    font-size: 13.5px; font-weight: 500;
    cursor: pointer; user-select: none;
    border: 1px solid transparent;
    transition: all .15s ease;
    white-space: nowrap;
    font-family: inherit;
  }
  .btn:focus-visible { outline: none; box-shadow: 0 0 0 3px var(--ring); }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .btn-primary {
    background: var(--primary); color: #fff;
    box-shadow: var(--shadow-sm), inset 0 1px 0 rgba(255,255,255,0.18);
  }
  .btn-primary:hover { background: var(--primary-hover); transform: translateY(-1px); box-shadow: var(--shadow-md); }
  .btn-primary:active { transform: translateY(0); }

  .btn-outline {
    background: var(--surface);
    color: var(--text);
    border-color: var(--border-strong);
    backdrop-filter: blur(12px);
  }
  .btn-outline:hover { background: var(--surface-2); border-color: var(--text-dim); }

  .btn-ghost {
    background: transparent; color: var(--text-muted);
    border-color: var(--border);
    width: 38px; padding: 0;
  }
  .btn-ghost:hover { color: var(--text); background: var(--surface); }

  .btn-sm { height: 32px; padding: 0 12px; font-size: 12.5px; }
  .btn-block { width: 100%; }

  .caret { display: inline-block; transition: transform .2s; font-size: 14px; line-height: 1; }
  .caret-up { transform: rotate(180deg); }

  /* Stats */
  .rv-stats {
    display: grid;
    grid-template-columns: repeat(6, minmax(0,1fr));
    gap: 12px;
  }
  @media (max-width: 900px) { .rv-stats { grid-template-columns: repeat(3, 1fr); } }
  @media (max-width: 500px) { .rv-stats { grid-template-columns: repeat(2, 1fr); } }

  .stat {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    padding: 14px 16px;
    display: flex; flex-direction: column; gap: 6px;
    backdrop-filter: blur(12px);
    transition: transform .15s, border-color .15s;
  }
  .stat:hover { border-color: var(--border-strong); transform: translateY(-1px); }
  .stat-label { font-size: 12px; color: var(--text-muted); font-weight: 500; text-transform: uppercase; letter-spacing: 0.04em; }
  .stat-value { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
  .stat-unit { font-size: 13px; font-weight: 500; color: var(--text-muted); margin-left: 2px; }

  .text-easy { color: var(--success); }
  .text-medium { color: var(--warn); }
  .text-hard { color: var(--danger); }

  /* Cards */
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    padding: 22px;
    backdrop-filter: blur(14px);
    box-shadow: var(--shadow-sm);
  }
  .card-head {
    display: flex; align-items: baseline; justify-content: space-between;
    gap: 12px; margin-bottom: 18px;
    padding-bottom: 14px;
    border-bottom: 1px solid var(--border);
  }
  .card-title { font-size: 16px; font-weight: 600; margin: 0; letter-spacing: -0.01em; }
  .card-sub { font-size: 12.5px; color: var(--text-muted); }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0,1fr));
    gap: 16px;
  }
  @media (max-width: 700px) { .info-grid { grid-template-columns: 1fr; } }
  .info-item { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
  .info-full { grid-column: 1 / -1; }
  .info-label { font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); font-weight: 600; }
  .info-text { font-size: 14px; color: var(--text); line-height: 1.55; word-break: break-word; }

  /* Chips / badges */
  .chip {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 3px 10px;
    font-size: 12px; font-weight: 500;
    border-radius: 999px;
    border: 1px solid var(--border-strong);
    background: var(--surface-2);
    color: var(--text);
    white-space: nowrap;
  }
  .chip-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
  .chip-success { color: var(--success); background: var(--success-soft); border-color: rgba(16,185,129,0.3); }
  .chip-muted { color: var(--text-muted); }
  .chip-info { color: var(--info); background: var(--info-soft); border-color: rgba(6,182,212,0.3); }
  .chip-warn { color: var(--warn); background: var(--warn-soft); border-color: rgba(245,158,11,0.3); }
  .chip-lang { color: var(--primary); background: var(--primary-soft); border-color: rgba(59,130,246,0.3); }

  .chip-diff.diff-easy   { color: var(--success); background: var(--success-soft); border-color: rgba(16,185,129,0.3); }
  .chip-diff.diff-medium { color: var(--warn);    background: var(--warn-soft);    border-color: rgba(245,158,11,0.3); }
  .chip-diff.diff-hard   { color: var(--danger);  background: var(--danger-soft);  border-color: rgba(239,68,68,0.3); }

  /* Questions */
  .rv-questions { display: flex; flex-direction: column; gap: 14px; }
  .rv-questions-head { display: flex; align-items: baseline; justify-content: space-between; padding: 0 4px; }
  .q-list { display: flex; flex-direction: column; gap: 14px; }

  .q-card { padding: 20px; transition: border-color .15s, transform .15s; }
  .q-card:hover { border-color: var(--border-strong); }

  .q-head {
    display: flex; align-items: flex-start; justify-content: space-between;
    gap: 16px; flex-wrap: wrap;
  }
  .q-meta { min-width: 0; flex: 1; display: flex; flex-direction: column; gap: 10px; }
  .q-meta-top { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .q-order {
    font-size: 12px; font-weight: 600; color: var(--text-muted);
    background: var(--surface-2); padding: 3px 8px; border-radius: 6px;
    border: 1px solid var(--border);
    font-variant-numeric: tabular-nums;
  }
  .q-title { font-size: 17px; font-weight: 600; margin: 0; letter-spacing: -0.01em; line-height: 1.35; }
  .q-tags { display: flex; gap: 6px; flex-wrap: wrap; }

  .q-body {
    margin-top: 18px; padding-top: 18px;
    border-top: 1px dashed var(--border);
    display: flex; flex-direction: column; gap: 18px;
    animation: fadeIn .2s ease;
  }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }

  .detail h4 {
    font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.06em;
    color: var(--text-muted); font-weight: 600; margin: 0 0 8px;
    display: flex; align-items: center; gap: 8px;
  }
  .md {
    color: var(--text); font-size: 14px; line-height: 1.6;
    white-space: pre-wrap; word-break: break-word;
  }
  .md-code {
    background: var(--code-bg);
    border: 1px solid var(--border);
    border-radius: var(--r-sm);
    padding: 12px 14px;
    font-family: ui-monospace, 'JetBrains Mono', Menlo, Consolas, monospace;
    font-size: 13px;
    overflow-x: auto;
    margin: 0;
  }
  .detail-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
  }
  @media (max-width: 700px) { .detail-grid { grid-template-columns: 1fr; } }

  .count-pill {
    font-size: 11px; background: var(--primary-soft); color: var(--primary);
    padding: 1px 7px; border-radius: 999px; font-weight: 600;
  }

  /* Test Cases */
  .tc-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(280px,1fr)); gap: 12px;
  }
  .tc {
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    padding: 14px;
    display: flex; flex-direction: column; gap: 10px;
    transition: border-color .15s;
  }
  .tc:hover { border-color: var(--border-strong); }
  .tc-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .tc-title { font-size: 13px; font-weight: 600; color: var(--text); }
  .tc-io { display: flex; flex-direction: column; gap: 4px; }
  .tc-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
  .tc-code {
    margin: 0;
    background: var(--code-bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 8px 10px;
    font-family: ui-monospace, 'JetBrains Mono', Menlo, Consolas, monospace;
    font-size: 12.5px;
    color: var(--text);
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .lang-row { display: flex; flex-wrap: wrap; gap: 6px; }

  /* Empty / Error */
  .empty {
    display: flex; flex-direction: column; align-items: center; text-align: center;
    padding: 48px 24px; gap: 6px;
  }
  .empty-icon {
    width: 52px; height: 52px; border-radius: 50%;
    display: grid; place-items: center;
    background: var(--surface-2); border: 1px solid var(--border);
    font-size: 22px; color: var(--text-muted); margin-bottom: 8px;
  }
  .empty h3 { margin: 0; font-size: 16px; font-weight: 600; }
  .empty p { margin: 0; color: var(--text-muted); font-size: 14px; }

  .rv-error { min-height: 80vh; display: grid; place-items: center; padding: 24px; }
  .rv-error-card {
    max-width: 420px; width: 100%; text-align: center;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--r-lg); padding: 32px; backdrop-filter: blur(14px);
    box-shadow: var(--shadow-lg);
    display: flex; flex-direction: column; align-items: center; gap: 10px;
  }
  .rv-error-icon {
    width: 56px; height: 56px; border-radius: 50%;
    background: var(--danger-soft); color: var(--danger);
    display: grid; place-items: center; font-size: 26px; font-weight: 700;
    margin-bottom: 6px;
  }
  .rv-error-card h2 { margin: 0; font-size: 18px; font-weight: 600; }
  .rv-error-card p { margin: 0 0 12px; color: var(--text-muted); font-size: 14px; }

  /* Sidebar */
  .rv-side { min-width: 0; }
  @media (min-width: 1101px) {
    .rv-side { position: sticky; top: 24px; align-self: start; }
  }
  .side-card { padding: 20px; }
  .side-title { font-size: 14px; font-weight: 600; margin: 0 0 16px; letter-spacing: -0.01em; }
  .side-list { display: flex; flex-direction: column; gap: 12px; }
  .side-item {
    display: flex; align-items: center; justify-content: space-between; gap: 10px;
    font-size: 13px; min-width: 0;
  }
  .side-label { color: var(--text-muted); font-weight: 500; }
  .side-value { color: var(--text); font-weight: 500; min-width: 0; }
  .side-value.strong { font-weight: 700; font-size: 15px; }
  .side-divider { height: 1px; background: var(--border); margin: 4px 0; }

  .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px; display: inline-block; }

  .diff-bars { display: flex; flex-direction: column; gap: 10px; margin-top: 4px; }
  .diff-bar { display: flex; flex-direction: column; gap: 6px; }
  .diff-bar-head { display: flex; justify-content: space-between; font-size: 12.5px; color: var(--text-muted); }
  .strong { font-weight: 700; }
  .bar { height: 6px; background: var(--surface-2); border-radius: 999px; overflow: hidden; border: 1px solid var(--border); }
  .bar-fill { height: 100%; border-radius: 999px; transition: width .4s ease; }
  .bar-easy { background: linear-gradient(90deg, #059669, #10b981); }
  .bar-medium { background: linear-gradient(90deg, #d97706, #f59e0b); }
  .bar-hard { background: linear-gradient(90deg, #dc2626, #ef4444); }

  /* Skeleton */
  .sk {
    background: linear-gradient(90deg, var(--surface-2) 0%, var(--surface) 50%, var(--surface-2) 100%);
    background-size: 200% 100%;
    animation: shimmer 1.4s linear infinite;
    border-radius: var(--r-md);
    border: 1px solid var(--border);
  }
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  .sk-title { height: 60px; margin-bottom: 24px; }
  .sk-stat { height: 78px; }
  .sk-info { height: 220px; margin-top: 24px; }
  .sk-list { height: 400px; margin-top: 24px; }
  .sk-side { height: 480px; }
`;
