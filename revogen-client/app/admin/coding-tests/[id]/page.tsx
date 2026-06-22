'use client';

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
      
      const res = await fetch(`http://localhost:3000/coding-tests/${assessmentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!res.ok) {
        throw new Error('Failed to load assessment details');
      }
      
      const data: Assessment = await res.json();
      setAssessment(data);

      // Set all questions to be expanded by default
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
    
    // Check local storage for theme preference
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
  const difficultyCounts = {
    EASY: 0,
    MEDIUM: 0,
    HARD: 0
  };

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
      <div className={`theme-wrapper ${theme}`}>
        <div className="layout-container">
          <div className="main-content">
            <div className="skeleton-box title-skeleton"></div>
            <div className="stats-grid">
              {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skeleton-box stat-card-skeleton"></div>)}
            </div>
            <div className="skeleton-box info-card-skeleton"></div>
            <div className="skeleton-box list-skeleton"></div>
          </div>
          <aside className="sidebar">
            <div className="skeleton-box sidebar-skeleton"></div>
          </aside>
        </div>
        <style jsx global>{styles}</style>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className={`theme-wrapper ${theme}`}>
        <div className="error-screen">
          <div className="glass-card error-card">
            <h2>Something went wrong</h2>
            <p>{error || 'Assessment not found'}</p>
            <button onClick={() => router.push('/admin/tests')} className="btn primary">
              Back to Tests
            </button>
          </div>
        </div>
        <style jsx global>{styles}</style>
      </div>
    );
  }

  return (
    <>
    <AdminNavbar/>

    <div className={`theme-wrapper ${theme}`}>
      <div className="layout-container">
        <div className="main-content">
          
          {/* Header */}
          <header className="page-header">
            <div className="header-titles">
              <h1>📄 Assessment Details</h1>
              <p className="subtitle">Review coding assessment configuration, questions, and test cases.</p>
            </div>
            <div className="header-actions">
              <button onClick={toggleTheme} className="btn secondary outline glass-btn theme-toggle">
                {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
              </button>
              <button
                onClick={() => router.push(`/admin/coding-tests/${assessmentId}/assign`)}
                className="btn secondary outline glass-btn"
              >
                👥 Assign Candidates
              </button>
              <button
                onClick={() => router.push(`/admin/coding-tests/${assessmentId}/results`)}
                className="btn secondary outline glass-btn"
              >
                📊 View Results
              </button>
              <button 
                onClick={() => router.push('/admin/tests')} 
                className="btn secondary outline glass-btn"
              >
                ← Back To Tests
              </button>
            </div>
          </header>

          {/* Top Statistics Cards */}
          <section className="stats-grid">
            <div className="glass-card stat-card">
              <span className="stat-label">Assessment Title</span>
              <span className="stat-value text-truncate" title={assessment.title}>{assessment.title}</span>
            </div>
            <div className="glass-card stat-card">
              <span className="stat-label">Duration</span>
              <span className="stat-value">{assessment.duration} Minutes</span>
            </div>
            <div className="glass-card stat-card">
              <span className="stat-label">Security Level</span>
              <span className="badge security-badge">{assessment.securityLevel}</span>
            </div>
            <div className="glass-card stat-card">
              <span className="stat-label">Questions</span>
              <span className="stat-value">{assessment.questions.length}</span>
            </div>
            <div className="glass-card stat-card">
              <span className="stat-label">Status</span>
              <span className={`badge ${assessment.isActive ? 'status-active' : 'status-inactive'}`}>
                {assessment.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="glass-card stat-card">
              <span className="stat-label">Created</span>
              <span className="stat-value">{formatDate(assessment.createdAt)}</span>
            </div>
          </section>

          {/* Assessment Information Card */}
          <section className="glass-card info-card">
            <h2 className="section-title">Assessment Information</h2>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Title</span>
                <span className="info-text">{assessment.title}</span>
              </div>
              <div className="info-item">
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

          {/* Questions Section */}
          <section className="questions-section">
            <h2 className="section-title">Assessment Questions</h2>
            
            {assessment.questions.length === 0 ? (
              <div className="glass-card empty-state">
                <p>No Questions Found</p>
              </div>
            ) : (
              <div className="questions-list">
                {assessment.questions
                  .sort((a, b) => a.order - b.order)
                  .map((q) => {
                    const isExpanded = !!expandedQuestions[q.id];
                    const qData = q.question;
                    const languages = Object.keys(qData.starterCodes || {});
                    const testCases = qData.testCases || [];

                    return (
                      <div key={q.id} className="glass-card question-card">
                        <div className="question-header">
                          <div className="question-meta">
                            <span className="q-order">Question #{q.order}</span>
                            <h3 className="q-title">{qData.title}</h3>
                            <div className="q-tags">
                              <span className={`badge diff-${(qData.difficulty || 'EASY').toLowerCase()}`}>
                                Difficulty: {qData.difficulty}
                              </span>
                              <span className="badge tag-category">
                                Category: {qData.category}
                              </span>
                            </div>
                          </div>
                          <button 
                            onClick={() => toggleQuestion(q.id)} 
                            className="btn secondary sm outline glass-btn"
                          >
                            {isExpanded ? 'Hide Details' : 'View Details'}
                          </button>
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="question-details">
                            <div className="detail-section">
                              <h4>Description</h4>
                              <div className="markdown-content">{qData.description}</div>
                            </div>
                            
                            <div className="detail-grid">
                              <div className="detail-section">
                                <h4>Input Format</h4>
                                <div className="markdown-content">{qData.inputFormat}</div>
                              </div>
                              
                              <div className="detail-section">
                                <h4>Output Format</h4>
                                <div className="markdown-content">{qData.outputFormat}</div>
                              </div>
                            </div>
                            
                            <div className="detail-section">
                              <h4>Constraints</h4>
                              <div className="markdown-content constraints-box">{qData.constraints}</div>
                            </div>

                            {/* Test Cases Section */}
                            {testCases.length > 0 && (
                              <div className="detail-section">
                                <h4>Test Cases ({testCases.length})</h4>
                                <div className="test-cases-grid">
                                  {testCases.map((tc, index) => (
                                    <div key={tc.id} className="test-case-card">
                                      <div className="tc-header">
                                        <span className="tc-title">Test Case {index + 1}</span>
                                        {tc.isHidden && <span className="badge status-inactive">Hidden</span>}
                                      </div>
                                      <div className="tc-body">
                                        <div className="tc-io">
                                          <span className="tc-label">Input:</span>
                                          <pre className="tc-code">{tc.input}</pre>
                                        </div>
                                        <div className="tc-io">
                                          <span className="tc-label">Expected Output:</span>
                                          <pre className="tc-code">{tc.expectedOutput}</pre>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {languages.length > 0 && (
                              <div className="detail-section">
                                <h4>Available Languages</h4>
                                <div className="language-badges">
                                  {languages.map(lang => (
                                    <span key={lang} className="badge lang-badge">
                                      {formatLanguage(lang)}
                                    </span>
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

        {/* Sticky Sidebar */}
        <aside className="sidebar">
          <div className="glass-card sticky-card">
            <h3 className="sidebar-title">Assessment Summary</h3>
            <div className="summary-list">
              <div className="summary-item">
                <span className="label">Name</span>
                <span className="value text-truncate" title={assessment.title}>{assessment.title}</span>
              </div>
              <div className="summary-item">
                <span className="label">Duration</span>
                <span className="value">{assessment.duration} min</span>
              </div>
              <div className="summary-item">
                <span className="label">Security Level</span>
                <span className="value">{assessment.securityLevel}</span>
              </div>
              <hr className="divider" />
              <div className="summary-item">
                <span className="label">Total Questions</span>
                <span className="value">{assessment.questions.length}</span>
              </div>
              <div className="summary-item diff-stat">
                <span className="label">Easy Questions</span>
                <span className="value text-green">{difficultyCounts.EASY}</span>
              </div>
              <div className="summary-item diff-stat">
                <span className="label">Medium Questions</span>
                <span className="value text-yellow">{difficultyCounts.MEDIUM}</span>
              </div>
              <div className="summary-item diff-stat">
                <span className="label">Hard Questions</span>
                <span className="value text-red">{difficultyCounts.HARD}</span>
              </div>
            </div>
          </div>
        </aside>

      </div>
      <style jsx global>{styles}</style>
    </div>

    </>

  );
}

// --- Global Styles (SaaS Theme with Glassmorphism) ---
const styles = `
  /* Default Dark Theme Variables */
  .theme-wrapper.dark {
    --bg-base: #050505;
    --glass-bg: rgba(20, 20, 22, 0.65);
    --glass-border: rgba(255, 255, 255, 0.08);
    --glass-hover: rgba(30, 30, 35, 0.8);
    --text-primary: #f4f4f5;
    --text-secondary: #a1a1aa;
    --text-muted: #71717a;
    --code-bg: rgba(0, 0, 0, 0.4);
    --code-border: rgba(255, 255, 255, 0.04);
  }

  /* Light Theme Variables */
  .theme-wrapper.light {
    --bg-base: #f8fafc;
    --glass-bg: rgba(255, 255, 255, 0.85);
    --glass-border: rgba(0, 0, 0, 0.1);
    --glass-hover: rgba(255, 255, 255, 1);
    --text-primary: #0f172a;
    --text-secondary: #475569;
    --text-muted: #64748b;
    --code-bg: #f1f5f9;
    --code-border: rgba(0, 0, 0, 0.05);
  }

  /* Universal Variables */
  .theme-wrapper {
    --accent-blue: #3b82f6;
    --accent-blue-hover: #2563eb;
    
    --color-easy: #10b981;
    --bg-easy: rgba(16, 185, 129, 0.1);
    
    --color-medium: #f59e0b;
    --bg-medium: rgba(245, 158, 11, 0.1);
    
    --color-hard: #ef4444;
    --bg-hard: rgba(239, 68, 68, 0.1);
    
    --radius-sm: 6px;
    --radius-md: 10px;
    --radius-lg: 16px;
    
    --font-sans: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;

    background-color: var(--bg-base);
    min-height: 100vh;
    color: var(--text-primary);
    font-family: var(--font-sans);
    transition: background-color 0.3s ease, color 0.3s ease;
  }

  /* Apply background elements dynamically based on theme */
  .theme-wrapper.dark {
    background-image: 
      radial-gradient(circle at 15% 50%, rgba(59, 130, 246, 0.03), transparent 25%),
      radial-gradient(circle at 85% 30%, rgba(16, 185, 129, 0.02), transparent 25%);
    background-attachment: fixed;
  }

  .theme-wrapper.light {
    background-image: 
      radial-gradient(circle at 15% 50%, rgba(59, 130, 246, 0.05), transparent 25%),
      radial-gradient(circle at 85% 30%, rgba(16, 185, 129, 0.05), transparent 25%);
    background-attachment: fixed;
  }

  /* Layout - FULL WIDTH update */
  .layout-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 100%;
    margin: 0 auto;
    padding: 2rem;
    gap: 2rem;
  }

  @media (min-width: 1024px) {
    .layout-container {
      flex-direction: row;
      align-items: flex-start;
      padding: 2.5rem 4rem; /* More breathing room for full width */
    }
  }

  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2rem;
    min-width: 0;
  }

  .sidebar {
    width: 100%;
  }

  @media (min-width: 1024px) {
    .sidebar {
      width: 360px;
      position: sticky;
      top: 2.5rem;
    }
  }

  /* Glass Cards */
  .glass-card {
    background: var(--glass-bg);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-lg);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    transition: background 0.3s, border-color 0.3s;
  }
  
  .theme-wrapper.dark .glass-card {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  }

  /* Typography */
  h1, h2, h3, h4 {
    margin: 0;
    font-weight: 600;
    letter-spacing: -0.02em;
  }

  .section-title {
    font-size: 1.25rem;
    color: var(--text-primary);
    margin-bottom: 1.25rem;
  }

  .text-truncate {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  /* Header */
  .page-header {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--glass-border);
  }

  @media (min-width: 768px) {
    .page-header {
      flex-direction: row;
      justify-content: space-between;
      align-items: flex-end;
    }
  }

  .page-header h1 {
    font-size: 1.75rem;
    color: var(--text-primary);
  }

  .subtitle {
    color: var(--text-secondary);
    font-size: 0.95rem;
    margin-top: 0.5rem;
  }

  .header-actions {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  /* Stats Grid */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
  }

  .stat-card {
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    transition: transform 0.2s, background 0.2s;
  }
  
  .stat-card:hover {
    background: var(--glass-hover);
    transform: translateY(-2px);
  }

  .stat-label {
    font-size: 0.85rem;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .stat-value {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  /* Info Card */
  .info-card {
    padding: 1.5rem;
  }

  .info-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  @media (min-width: 640px) {
    .info-grid {
      grid-template-columns: 1fr 1fr;
    }
  }

  .info-item {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .info-label {
    font-size: 0.85rem;
    color: var(--text-secondary);
  }

  .info-text {
    font-size: 1rem;
    color: var(--text-primary);
    line-height: 1.5;
  }

  /* Questions Section */
  .questions-section {
    display: flex;
    flex-direction: column;
  }

  .questions-list {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .question-card {
    padding: 1.5rem;
    transition: background 0.2s;
  }

  .question-header {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  @media (min-width: 640px) {
    .question-header {
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
    }
  }

  .question-meta {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .q-order {
    font-size: 0.85rem;
    color: var(--accent-blue);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .q-title {
    font-size: 1.25rem;
    color: var(--text-primary);
  }

  .q-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-top: 0.25rem;
  }

  /* Question Details (Expanded) */
  .question-details {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--glass-border);
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    animation: fadeIn 0.3s ease-in-out;
  }

  .detail-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  @media (min-width: 768px) {
    .detail-grid {
      grid-template-columns: 1fr 1fr;
    }
  }

  .detail-section h4 {
    font-size: 0.9rem;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.75rem;
  }

  .markdown-content {
    font-size: 0.95rem;
    color: var(--text-primary);
    line-height: 1.6;
    background: var(--code-bg);
    padding: 1rem;
    border-radius: var(--radius-md);
    border: 1px solid var(--code-border);
    white-space: pre-wrap;
  }

  .constraints-box {
    font-family: monospace;
    font-size: 0.9rem;
  }

  /* Test Cases Design */
  .test-cases-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
  }

  .test-case-card {
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-md);
    overflow: hidden;
  }

  .tc-header {
    background: rgba(0, 0, 0, 0.03);
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--glass-border);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .theme-wrapper.dark .tc-header {
    background: rgba(255, 255, 255, 0.03);
  }

  .tc-title {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-secondary);
  }

  .tc-body {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .tc-io {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .tc-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    color: var(--text-muted);
    letter-spacing: 0.05em;
  }

  .tc-code {
    background: var(--code-bg);
    border: 1px solid var(--code-border);
    padding: 0.75rem;
    border-radius: var(--radius-sm);
    font-family: monospace;
    font-size: 0.85rem;
    color: var(--text-primary);
    white-space: pre-wrap;
    margin: 0;
  }

  .language-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  /* Badges */
  .badge {
    display: inline-flex;
    align-items: center;
    padding: 0.3rem 0.75rem;
    border-radius: 99px;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    border: 1px solid transparent;
  }

  .security-badge {
    background: rgba(161, 161, 170, 0.1);
    color: var(--text-secondary);
    border-color: var(--glass-border);
    align-self: flex-start;
  }

  .status-active {
    background: var(--bg-easy);
    color: var(--color-easy);
    border-color: rgba(16, 185, 129, 0.2);
    align-self: flex-start;
  }

  .status-inactive {
    background: rgba(161, 161, 170, 0.1);
    color: var(--text-muted);
    border-color: var(--glass-border);
    align-self: flex-start;
  }

  .diff-easy {
    background: var(--bg-easy);
    color: var(--color-easy);
    border-color: rgba(16, 185, 129, 0.2);
  }

  .diff-medium {
    background: var(--bg-medium);
    color: var(--color-medium);
    border-color: rgba(245, 158, 11, 0.2);
  }

  .diff-hard {
    background: var(--bg-hard);
    color: var(--color-hard);
    border-color: rgba(239, 68, 68, 0.2);
  }

  .tag-category {
    background: rgba(59, 130, 246, 0.1);
    color: var(--accent-blue);
    border-color: rgba(59, 130, 246, 0.2);
  }

  .lang-badge {
    background: rgba(161, 161, 170, 0.1);
    color: var(--text-primary);
    border-color: var(--glass-border);
  }

  /* Buttons */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.6rem 1.2rem;
    font-size: 0.875rem;
    font-weight: 500;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid transparent;
  }

  .btn.primary {
    background: var(--accent-blue);
    color: #ffffff;
  }

  .btn.primary:hover {
    background: var(--accent-blue-hover);
  }

  .btn.secondary {
    background: transparent;
    color: var(--text-primary);
  }

  .btn.outline {
    border-color: var(--glass-border);
  }

  .btn.outline:hover {
    background: var(--glass-hover);
  }

  .glass-btn {
    background: var(--glass-bg);
  }

  .btn.sm {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
  }

  /* Sidebar */
  .sticky-card {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
  }

  .sidebar-title {
    font-size: 1.1rem;
    color: var(--text-primary);
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--glass-border);
  }

  .summary-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .summary-item {
    display: flex;
    justify-content: space-between;
    font-size: 0.9rem;
    align-items: center;
  }

  .summary-item .label {
    color: var(--text-secondary);
  }

  .summary-item .value {
    color: var(--text-primary);
    font-weight: 500;
  }

  .divider {
    border: none;
    border-top: 1px solid var(--glass-border);
    margin: 0.5rem 0;
  }

  .text-green { color: var(--color-easy) !important; }
  .text-yellow { color: var(--color-medium) !important; }
  .text-red { color: var(--color-hard) !important; }

  /* Error / Empty States */
  .error-screen {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    padding: 2rem;
  }

  .error-card {
    padding: 3rem;
    text-align: center;
    max-width: 400px;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    align-items: center;
  }

  .error-card p {
    color: var(--text-secondary);
  }

  .empty-state {
    padding: 4rem;
    text-align: center;
    color: var(--text-muted);
    font-size: 1.1rem;
  }

  /* Animations & Skeletons */
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .skeleton-box {
    background: var(--code-bg);
    border-radius: var(--radius-md);
    position: relative;
    overflow: hidden;
  }

  .skeleton-box::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, var(--glass-border), transparent);
    animation: shimmer 1.5s infinite;
  }

  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }

  .title-skeleton { height: 60px; width: 40%; margin-bottom: 1rem; }
  .stat-card-skeleton { height: 100px; }
  .info-card-skeleton { height: 200px; }
  .list-skeleton { height: 400px; }
  .sidebar-skeleton { height: 500px; }
`;