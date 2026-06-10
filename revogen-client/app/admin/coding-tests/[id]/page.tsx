'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminNavbar from '@/components/AdminNavbar';

interface Question {
  id: string;
  title: string;
  difficulty: string;
  category: string;
  marks: number;
  order: number;
  description?: string;
  constraints?: string;
  inputFormat?: string;
  outputFormat?: string;
  timeLimit?: number;
  memoryLimit?: number;
}

interface Assessment {
  id: string;
  title: string;
  description?: string;
  category?: string;
  duration: number;
  createdAt?: string;
  updatedAt?: string;
  questions?: Question[];
}

export default function CodingAssessmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { loadAssessment(); }, [id]);

  const loadAssessment = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`http://localhost:3000/coding-tests/${id}`);
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      setAssessment(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this coding assessment? This action cannot be undone.')) return;
    setDeleting(true);
    try {
      await fetch(`http://localhost:3000/coding-tests/${id}`, { method: 'DELETE' });
      router.push('/admin/tests');
    } catch {
      alert('Failed to delete assessment. Please try again.');
      setDeleting(false);
    }
  };

  const toggleExpand = (qid: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(qid) ? next.delete(qid) : next.add(qid);
      return next;
    });
  };

  const difficultyClass = (d: string) => {
    const v = d?.toUpperCase();
    if (v === 'EASY')   return 'badge-diff-easy';
    if (v === 'MEDIUM') return 'badge-diff-medium';
    if (v === 'HARD')   return 'badge-diff-hard';
    return 'badge-diff-easy';
  };

  const formatDate = (s?: string) => {
    if (!s) return '—';
    try { return new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
    catch { return s; }
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
          --danger-soft:    rgba(248,81,73,0.12);
          --purple:         #bc8cff;
          --purple-soft:    rgba(188,140,255,0.12);
          --orange:         #f0883e;
          --orange-soft:    rgba(240,136,62,0.12);
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
          align-items: flex-start;
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
          background: var(--purple-soft);
          border: 1px solid rgba(188,140,255,0.3);
          border-radius: var(--radius-md);
          display: flex; align-items: center; justify-content: center;
          font-size: 20px;
          box-shadow: 0 0 16px rgba(188,140,255,0.2);
          flex-shrink: 0;
        }
        .page-title { font-size: 22px; font-weight: 700; letter-spacing: -0.3px; }
        .page-subtitle { font-size: 13px; color: var(--text-secondary); margin-top: 2px; }

        .header-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
          flex-shrink: 0;
        }

        /* ── Action Buttons ── */
        .action-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 15px;
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
        .action-btn:active { transform: translateY(0); }
        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
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

        /* ── Info Card ── */
        .info-card {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 24px;
          margin-bottom: 28px;
          position: relative;
          overflow: hidden;
        }
        .info-card::before {
          content: '';
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 3px;
          background: var(--purple);
          border-radius: 3px 0 0 3px;
        }

        .info-card-title {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.2px;
          margin-bottom: 6px;
        }
        .info-card-description {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 20px;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 12px;
        }
        .info-item {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 12px 14px;
        }
        .info-item-label {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: var(--text-muted);
          margin-bottom: 5px;
        }
        .info-item-value {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          font-family: var(--font-mono);
        }

        /* ── Section Header ── */
        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 8px;
        }
        .section-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .section-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 22px;
          height: 22px;
          padding: 0 6px;
          border-radius: 11px;
          font-size: 11px;
          font-weight: 700;
          font-family: var(--font-mono);
          background: var(--purple-soft);
          color: var(--purple);
          border: 1px solid rgba(188,140,255,0.2);
        }

        /* ── Question Card ── */
        .q-card {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          margin-bottom: 12px;
          overflow: hidden;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .q-card:hover {
          border-color: var(--border-hover);
          box-shadow: var(--shadow-sm);
        }

        .q-card-header {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 18px;
          cursor: pointer;
          user-select: none;
        }

        .q-order {
          width: 28px; height: 28px;
          border-radius: 50%;
          background: var(--bg-card);
          border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          font-size: 11px;
          font-weight: 700;
          font-family: var(--font-mono);
          color: var(--text-muted);
          flex-shrink: 0;
        }

        .q-info { flex: 1; min-width: 0; }
        .q-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 6px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .q-meta {
          display: flex;
          gap: 7px;
          flex-wrap: wrap;
          align-items: center;
        }

        .meta-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 9px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 500;
          font-family: var(--font-mono);
          white-space: nowrap;
        }
        .badge-blue   { background: var(--accent-soft);   color: var(--accent);   border: 1px solid rgba(56,139,253,0.2); }
        .badge-green  { background: var(--success-soft);  color: var(--success);  border: 1px solid rgba(63,185,80,0.2); }
        .badge-yellow { background: var(--warning-soft);  color: var(--warning);  border: 1px solid rgba(210,153,34,0.2); }
        .badge-purple { background: var(--purple-soft);   color: var(--purple);   border: 1px solid rgba(188,140,255,0.2); }
        .badge-orange { background: var(--orange-soft);   color: var(--orange);   border: 1px solid rgba(240,136,62,0.2); }

        .badge-diff-easy   { background: var(--success-soft); color: var(--success); border: 1px solid rgba(63,185,80,0.2);   font-weight: 700; }
        .badge-diff-medium { background: var(--warning-soft); color: var(--warning); border: 1px solid rgba(210,153,34,0.2); font-weight: 700; }
        .badge-diff-hard   { background: var(--danger-soft);  color: var(--danger);  border: 1px solid rgba(248,81,73,0.2);  font-weight: 700; }

        .q-marks {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 9px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          font-family: var(--font-mono);
          background: var(--accent-soft);
          color: var(--accent);
          border: 1px solid rgba(56,139,253,0.2);
          white-space: nowrap;
        }

        .q-toggle {
          width: 28px; height: 28px;
          border-radius: var(--radius-sm);
          background: var(--bg-card);
          border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          font-size: 11px;
          color: var(--text-muted);
          flex-shrink: 0;
          transition: background 0.15s, border-color 0.15s, color 0.15s;
          cursor: pointer;
        }
        .q-card:hover .q-toggle {
          background: var(--bg-elevated);
          border-color: var(--border-hover);
          color: var(--text-secondary);
        }
        .q-toggle.expanded {
          background: var(--purple-soft);
          border-color: rgba(188,140,255,0.3);
          color: var(--purple);
        }

        /* ── Expanded Details ── */
        .q-details {
          border-top: 1px solid var(--border);
          padding: 18px 20px 20px;
          background: var(--bg-card);
          animation: expandIn 0.15s ease;
        }
        @keyframes expandIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 10px;
          margin-bottom: 16px;
        }
        .detail-chip {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 10px 12px;
        }
        .detail-chip-label {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.7px;
          color: var(--text-muted);
          margin-bottom: 4px;
        }
        .detail-chip-value {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          font-family: var(--font-mono);
        }

        .detail-section { margin-bottom: 14px; }
        .detail-section:last-child { margin-bottom: 0; }
        .detail-section-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.7px;
          color: var(--text-muted);
          margin-bottom: 6px;
        }
        .detail-section-body {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.65;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 12px 14px;
          white-space: pre-wrap;
          font-family: var(--font-mono);
        }

        /* ── Skeleton ── */
        .skeleton-card {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 24px;
          margin-bottom: 16px;
          animation: pulse 1.5s ease-in-out infinite;
        }
        .skeleton-line {
          background: var(--bg-card);
          border-radius: 4px;
          height: 14px;
          margin-bottom: 10px;
        }
        .skeleton-line.short  { width: 35%; }
        .skeleton-line.medium { width: 60%; }
        .skeleton-line.long   { width: 85%; }
        .skeleton-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-top: 16px;
        }
        .skeleton-chip {
          background: var(--bg-card);
          border-radius: var(--radius-md);
          height: 56px;
        }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }

        /* ── Error & Empty ── */
        .state-box {
          text-align: center;
          padding: 72px 24px;
          color: var(--text-muted);
        }
        .state-icon  { font-size: 44px; margin-bottom: 14px; }
        .state-title { font-size: 18px; font-weight: 600; color: var(--text-secondary); margin-bottom: 8px; }
        .state-text  { font-size: 14px; }

        .no-questions {
          text-align: center;
          padding: 40px 24px;
          background: var(--bg-surface);
          border: 1px dashed var(--border);
          border-radius: var(--radius-lg);
          color: var(--text-muted);
          font-size: 14px;
        }

        @media (max-width: 640px) {
          .info-grid    { grid-template-columns: repeat(2, 1fr); }
          .detail-grid  { grid-template-columns: repeat(2, 1fr); }
          .header-actions { width: 100%; justify-content: flex-end; }
          .skeleton-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <AdminNavbar />

      <div className="page-wrapper">
        <div className="page-container">

          {/* Header */}
          <div className="page-header">
            <div className="page-header-left">
              <div className="page-header-icon">💻</div>
              <div>
                <div className="page-title">Coding Assessment Details</div>
                <div className="page-subtitle">View assessment configuration and assigned coding questions.</div>
              </div>
            </div>

            <div className="header-actions">
              <Link href="/admin/tests" className="action-btn">
                ← Back to Tests
              </Link>
              {assessment && (
                <>
                  <Link href={`/admin/coding-tests/${id}/edit`} className="action-btn warning-btn">
                    ✏️ Edit Assessment
                  </Link>
                  <button
                    className="action-btn danger-btn"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? '⏳ Deleting…' : '🗑 Delete Assessment'}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <>
              <div className="skeleton-card">
                <div className="skeleton-line medium" />
                <div className="skeleton-line long" />
                <div className="skeleton-line short" />
                <div className="skeleton-grid">
                  {[1,2,3,4].map((i) => <div key={i} className="skeleton-chip" />)}
                </div>
              </div>
              {[1,2,3].map((i) => (
                <div key={i} className="skeleton-card" style={{ padding: '18px 20px' }}>
                  <div className="skeleton-line medium" />
                  <div className="skeleton-line short" />
                </div>
              ))}
            </>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="state-box">
              <div className="state-icon">⚠️</div>
              <div className="state-title">Assessment Not Found</div>
              <div className="state-text">
                This assessment may have been deleted or the ID is invalid.{' '}
                <Link href="/admin/tests" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                  Go back to Tests
                </Link>
              </div>
            </div>
          )}

          {/* Content */}
          {!loading && !error && assessment && (
            <>
              {/* Assessment Info Card */}
              <div className="info-card">
                <div className="info-card-title">{assessment.title}</div>
                {assessment.description && (
                  <div className="info-card-description">{assessment.description}</div>
                )}
                <div className="info-grid">
                  {assessment.category && (
                    <div className="info-item">
                      <div className="info-item-label">Category</div>
                      <div className="info-item-value">{assessment.category}</div>
                    </div>
                  )}
                  <div className="info-item">
                    <div className="info-item-label">Duration</div>
                    <div className="info-item-value">{assessment.duration} mins</div>
                  </div>
                  <div className="info-item">
                    <div className="info-item-label">Questions</div>
                    <div className="info-item-value" style={{ color: 'var(--purple)' }}>
                      {assessment.questions?.length ?? 0}
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-item-label">Assessment ID</div>
                    <div className="info-item-value" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {assessment.id?.toString().slice(0, 12)}…
                    </div>
                  </div>
                  {assessment.createdAt && (
                    <div className="info-item">
                      <div className="info-item-label">Created</div>
                      <div className="info-item-value" style={{ fontSize: '12px' }}>
                        {formatDate(assessment.createdAt)}
                      </div>
                    </div>
                  )}
                  {assessment.updatedAt && (
                    <div className="info-item">
                      <div className="info-item-label">Updated</div>
                      <div className="info-item-value" style={{ fontSize: '12px' }}>
                        {formatDate(assessment.updatedAt)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Questions Section */}
              <div className="section-header">
                <div className="section-title">
                  Assigned Questions
                  <span className="section-count">{assessment.questions?.length ?? 0}</span>
                </div>
              </div>

              {(!assessment.questions || assessment.questions.length === 0) && (
                <div className="no-questions">
                  No questions assigned to this assessment yet.
                </div>
              )}

              {assessment.questions && assessment.questions.length > 0 &&
                [...assessment.questions]
                  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                  .map((q) => {
                    const expanded = expandedIds.has(q.id);
                    const hasDetails = q.description || q.constraints || q.inputFormat || q.outputFormat || q.timeLimit || q.memoryLimit;

                    return (
                      <div key={q.id} className="q-card">
                        <div
                          className="q-card-header"
                          onClick={() => hasDetails && toggleExpand(q.id)}
                          style={{ cursor: hasDetails ? 'pointer' : 'default' }}
                        >
                          <div className="q-order">{q.order ?? '—'}</div>

                          <div className="q-info">
                            <div className="q-title">{q.title}</div>
                            <div className="q-meta">
                              {q.difficulty && (
                                <span className={`meta-badge ${difficultyClass(q.difficulty)}`}>
                                  {q.difficulty.toUpperCase()}
                                </span>
                              )}
                              {q.category && (
                                <span className="meta-badge badge-purple">
                                  {q.category}
                                </span>
                              )}
                              {q.marks != null && (
                                <span className="q-marks">⭐ {q.marks} pts</span>
                              )}
                            </div>
                          </div>

                          {hasDetails && (
                            <div className={`q-toggle${expanded ? ' expanded' : ''}`}>
                              {expanded ? '▲' : '▼'}
                            </div>
                          )}
                        </div>

                        {expanded && hasDetails && (
                          <div className="q-details">
                            {(q.timeLimit != null || q.memoryLimit != null) && (
                              <div className="detail-grid" style={{ marginBottom: '14px' }}>
                                {q.timeLimit != null && (
                                  <div className="detail-chip">
                                    <div className="detail-chip-label">Time Limit</div>
                                    <div className="detail-chip-value">{q.timeLimit}s</div>
                                  </div>
                                )}
                                {q.memoryLimit != null && (
                                  <div className="detail-chip">
                                    <div className="detail-chip-label">Memory Limit</div>
                                    <div className="detail-chip-value">{q.memoryLimit} MB</div>
                                  </div>
                                )}
                              </div>
                            )}

                            {q.description && (
                              <div className="detail-section">
                                <div className="detail-section-label">Description</div>
                                <div className="detail-section-body">{q.description}</div>
                              </div>
                            )}
                            {q.constraints && (
                              <div className="detail-section">
                                <div className="detail-section-label">Constraints</div>
                                <div className="detail-section-body">{q.constraints}</div>
                              </div>
                            )}
                            {q.inputFormat && (
                              <div className="detail-section">
                                <div className="detail-section-label">Input Format</div>
                                <div className="detail-section-body">{q.inputFormat}</div>
                              </div>
                            )}
                            {q.outputFormat && (
                              <div className="detail-section">
                                <div className="detail-section-label">Output Format</div>
                                <div className="detail-section-body">{q.outputFormat}</div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
              }
            </>
          )}

        </div>
      </div>
    </>
  );
}