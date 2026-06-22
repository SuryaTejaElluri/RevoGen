'use client';

import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminNavbar from '@/components/AdminNavbar';

// --- TypeScript Interfaces ---

export interface QuestionDetail {
  id: string;
  title: string;
  difficulty: string;
  category: string;
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
  questions: QuestionInfo[];
}

export interface Invitation {
  id: string;
  codingTestId: string;
  candidateEmail: string;
  userId: string | null;
  status: string;
  invitedAt: string;
  createdAt: string;
}

export default function AssignPage() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = params.id as string;

  // --- State ---
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [inviteLoading, setInviteLoading] = useState<boolean>(false);
  const [emails, setEmails] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // --- Constants ---
  const API_BASE_URL = 'http://localhost:3000';

  // Helper to get token
  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  };

  // --- API Calls ---

  const fetchAssessment = useCallback(async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/coding-tests/${assessmentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch assessment');
      const data: Assessment = await res.json();
      setAssessment(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred loading the assessment.');
    }
  }, [assessmentId]);

  const fetchInvitations = useCallback(async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/coding-tests/${assessmentId}/invitations`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch invitations');
      const data: Invitation[] = await res.json();
      setInvitations(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred loading invitations.');
    }
  }, [assessmentId]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    await Promise.all([fetchAssessment(), fetchInvitations()]);
    setLoading(false);
  }, [fetchAssessment, fetchInvitations]);

  // Initial Load
  useEffect(() => {
    if (assessmentId) {
      loadData();
    }
  }, [assessmentId, loadData]);

  // --- Handlers ---

  const handleBulkInvite = async (e: FormEvent) => {
    e.preventDefault();
    
    // Split by comma or whitespace and remove empty entries
    const emailList = emails.split(/[\s,]+/).filter(email => email.trim() !== '');
    
    if (emailList.length === 0) {
      setError('Please enter at least one valid email address.');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setInviteLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = getToken();
      
      // Execute all invite requests concurrently
      const invitePromises = emailList.map(async (candidateEmail) => {
        const res = await fetch(`${API_BASE_URL}/coding-tests/${assessmentId}/invite`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ candidateEmail }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed to invite ${candidateEmail}`);
        }
        return res.json();
      });

      await Promise.all(invitePromises);

      await fetchInvitations();
      setEmails(''); // Clear input on success
      setSuccess(`Successfully invited ${emailList.length} candidate(s)!`);
      
      // Auto dismiss success after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to send one or more invitations.');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemove = async (invitationId: string) => {
    if (!window.confirm('Are you sure you want to remove this invitation?')) return;

    setError(null);
    setSuccess(null);

    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/coding-tests/${assessmentId}/invitations/${invitationId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to remove invitation');
      }

      await fetchInvitations();
      setSuccess('Invitation removed successfully.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to remove invitation.');
    }
  };

  // --- Render Helpers ---

  if (loading) {
    return (
      <div className="layout-container">
        <div className="main-content skeleton-wrapper">
          <div className="skeleton-box title-skeleton"></div>
          <div className="skeleton-grid">
            <div className="skeleton-box card-skeleton"></div>
            <div className="skeleton-box card-skeleton"></div>
            <div className="skeleton-box card-skeleton"></div>
            <div className="skeleton-box card-skeleton"></div>
          </div>
          <div className="skeleton-box big-card-skeleton"></div>
        </div>
        <aside className="sidebar">
          <div className="skeleton-box sidebar-skeleton"></div>
        </aside>
        <style jsx global>{styles}</style>
      </div>
    );
  }

  if (!assessment && error) {
    return (
      <div className="error-screen">
        <h2>Something went wrong</h2>
        <p>{error}</p>
        <button onClick={() => router.push('/tests')} className="btn primary">
          Back to Tests
        </button>
        <style jsx global>{styles}</style>
      </div>
    );
  }

  return (
    <>
    <AdminNavbar />

    <div className="layout-container">
      {/* Banner Overlays */}
      <div className="toast-container">
        {success && <div className="banner success-banner">{success}</div>}
        {error && <div className="banner error-banner">{error}</div>}
      </div>

      <div className="main-content">
        <header className="page-header">
          <div className="header-titles">
            <h1>💻 Coding Assessment Assignment</h1>
            <p className="subtitle">Invite candidates and manage assessment access.</p>
          </div>
          <button 
            onClick={() => router.push('/tests')} 
            className="btn secondary outline"
          >
            Back To Tests
          </button>
        </header>

        {/* Top Summary Cards */}
        <section className="summary-grid">
          <div className="card stat-card">
            <span className="stat-label">Assessment Title</span>
            <span className="stat-value">{assessment?.title}</span>
          </div>
          <div className="card stat-card">
            <span className="stat-label">Duration</span>
            <span className="stat-value">{assessment?.duration} Minutes</span>
          </div>
          <div className="card stat-card">
            <span className="stat-label">Security Level</span>
            <span className="stat-value badge security-badge">{assessment?.securityLevel}</span>
          </div>
          <div className="card stat-card">
            <span className="stat-label">Questions</span>
            <span className="stat-value">{assessment?.questions.length || 0}</span>
          </div>
        </section>

        {/* Invite Candidate Card (Bulk) */}
        <section className="card form-card">
          <h2 className="card-title">Invite Candidates</h2>
          <form onSubmit={handleBulkInvite} className="invite-form">
            <div className="input-group full-width-group">
              <label htmlFor="emails">Candidate Emails (separated by commas or new lines)</label>
              <textarea
                id="emails"
                placeholder="candidate1@gmail.com, candidate2@gmail.com&#10;candidate3@gmail.com"
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                required
                disabled={inviteLoading}
                className="input-field textarea-field"
                rows={5}
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn primary" disabled={inviteLoading || !emails.trim()}>
                {inviteLoading ? 'Sending Invites...' : 'Send Invitations'}
              </button>
            </div>
          </form>
        </section>

        {/* Invited Candidates Table */}
        <section className="card table-card">
          <div className="card-header">
            <h2 className="card-title">Invited Candidates</h2>
            <span className="count-badge">{invitations.length} Total</span>
          </div>
          
          <div className="table-responsive">
            {invitations.length === 0 ? (
              <div className="empty-state">
                <p>No candidates invited yet.</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Linked User</th>
                    <th>Status</th>
                    <th>Invited At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.map((inv) => (
                    <tr key={inv.id}>
                      <td className="font-medium text-white">{inv.candidateEmail}</td>
                      <td>
                        <span className={`badge ${inv.userId ? 'badge-blue' : 'badge-gray'}`}>
                          {inv.userId ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge status-${inv.status.toLowerCase()}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="text-muted">
                        {new Date(inv.invitedAt).toLocaleString()}
                      </td>
                      <td>
                        <button
                          onClick={() => handleRemove(inv.id)}
                          className="btn danger sm"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>

      {/* Sticky Sidebar */}
      <aside className="sidebar">
        <div className="card sticky-card">
          <h3 className="sidebar-title">Assessment Summary</h3>
          <div className="summary-list">
            <div className="summary-item">
              <span className="label">Title</span>
              <span className="value">{assessment?.title}</span>
            </div>
            <div className="summary-item">
              <span className="label">Duration</span>
              <span className="value">{assessment?.duration} min</span>
            </div>
            <div className="summary-item">
              <span className="label">Security Level</span>
              <span className="value">{assessment?.securityLevel}</span>
            </div>
            <div className="summary-item">
              <span className="label">Question Count</span>
              <span className="value">{assessment?.questions.length || 0}</span>
            </div>
            <div className="summary-item">
              <span className="label">Invited Candidates</span>
              <span className="value">{invitations.length}</span>
            </div>
          </div>

          <div className="sidebar-footer">
            <button onClick={() => router.push('/tests')} className="btn primary full-width">
              Continue
            </button>
          </div>
        </div>
      </aside>

      <style jsx global>{styles}</style>
    </div>
    </>
  );
}

// --- Global Styles (SaaS Dark Theme) ---
const styles = `
  :root {
    --bg-base: #000000;
    --bg-surface: #0a0a0a;
    --bg-card: #111111;
    --bg-hover: #1a1a1a;
    
    --border-color: #222222;
    --border-hover: #333333;
    
    --text-primary: #ededed;
    --text-secondary: #a1a1aa;
    --text-muted: #71717a;
    
    --accent-blue: #0070f3;
    --accent-blue-hover: #0051b3;
    --accent-red: #ef4444;
    --accent-red-hover: #dc2626;
    --accent-green: #10b981;
    --accent-green-bg: rgba(16, 185, 129, 0.1);
    
    --radius-sm: 4px;
    --radius-md: 8px;
    --radius-lg: 12px;
    
    --shadow-card: 0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3);
    
    --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  }

  body {
    background-color: var(--bg-base);
    color: var(--text-primary);
    font-family: var(--font-sans);
    margin: 0;
    -webkit-font-smoothing: antialiased;
  }

  /* Layout */
  .layout-container {
    display: flex;
    flex-direction: column;
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem;
    gap: 2rem;
    position: relative;
  }

  @media (min-width: 1024px) {
    .layout-container {
      flex-direction: row;
      align-items: flex-start;
    }
  }

  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    min-width: 0;
  }

  .sidebar {
    width: 100%;
  }

  @media (min-width: 1024px) {
    .sidebar {
      width: 320px;
      position: sticky;
      top: 2rem;
    }
  }

  /* Typography */
  h1, h2, h3 {
    margin: 0;
    font-weight: 600;
    letter-spacing: -0.02em;
  }

  p {
    margin: 0;
  }

  .text-white { color: var(--text-primary); }
  .text-muted { color: var(--text-secondary); }
  .font-medium { font-weight: 500; }

  /* Header */
  .page-header {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border-color);
  }

  @media (min-width: 768px) {
    .page-header {
      flex-direction: row;
      justify-content: space-between;
      align-items: flex-end;
    }
  }

  .page-header h1 {
    font-size: 1.5rem;
    color: var(--text-primary);
  }

  .subtitle {
    color: var(--text-secondary);
    font-size: 0.95rem;
    margin-top: 0.5rem;
  }

  /* Cards */
  .card {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    padding: 1.5rem;
    box-shadow: var(--shadow-card);
  }

  .card-title {
    font-size: 1.125rem;
    margin-bottom: 1rem;
    color: var(--text-primary);
  }

  /* Summary Grid */
  .summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .stat-card {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .stat-label {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  .stat-value {
    font-size: 1.25rem;
    font-weight: 600;
  }

  /* Form Elements */
  .invite-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .full-width-group {
    width: 100%;
  }

  .input-group label {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  .input-field {
    background: var(--bg-base);
    border: 1px solid var(--border-color);
    color: var(--text-primary);
    padding: 0.75rem 1rem;
    border-radius: var(--radius-md);
    font-size: 0.95rem;
    outline: none;
    transition: border-color 0.2s;
  }

  .input-field:focus {
    border-color: var(--accent-blue);
  }

  .textarea-field {
    resize: vertical;
    min-height: 120px;
    font-family: inherit;
    line-height: 1.5;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
  }

  /* Table */
  .table-card {
    padding: 0;
    overflow: hidden;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid var(--border-color);
    margin-bottom: 0;
  }

  .count-badge {
    background: var(--bg-hover);
    color: var(--text-secondary);
    padding: 0.25rem 0.75rem;
    border-radius: 99px;
    font-size: 0.875rem;
    border: 1px solid var(--border-color);
  }

  .table-responsive {
    overflow-x: auto;
  }

  .data-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
    font-size: 0.9rem;
  }

  .data-table th, .data-table td {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--border-color);
    white-space: nowrap;
  }

  .data-table th {
    color: var(--text-muted);
    font-weight: 500;
    text-transform: uppercase;
    font-size: 0.75rem;
    letter-spacing: 0.05em;
    background: var(--bg-surface);
  }

  .data-table tr:last-child td {
    border-bottom: none;
  }

  .data-table tbody tr:hover {
    background: rgba(255, 255, 255, 0.02);
  }

  .empty-state {
    padding: 3rem;
    text-align: center;
    color: var(--text-muted);
  }

  /* Badges */
  .badge {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.6rem;
    border-radius: 99px;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  .security-badge {
    background: rgba(161, 161, 170, 0.1);
    color: var(--text-secondary);
    border: 1px solid var(--border-color);
    align-self: flex-start;
  }

  .status-pending {
    background: rgba(245, 158, 11, 0.1);
    color: #fcd34d;
    border: 1px solid rgba(245, 158, 11, 0.2);
  }

  .badge-blue {
    background: rgba(59, 130, 246, 0.1);
    color: #60a5fa;
    border: 1px solid rgba(59, 130, 246, 0.2);
  }

  .badge-gray {
    background: rgba(161, 161, 170, 0.1);
    color: var(--text-muted);
    border: 1px solid var(--border-color);
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

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn.primary {
    background: var(--text-primary);
    color: var(--bg-base);
  }

  .btn.primary:hover:not(:disabled) {
    background: #d4d4d8;
  }

  .btn.secondary {
    background: var(--bg-surface);
    color: var(--text-primary);
  }

  .btn.outline {
    background: transparent;
    border-color: var(--border-color);
  }

  .btn.outline:hover:not(:disabled) {
    background: var(--bg-hover);
    border-color: var(--border-hover);
  }

  .btn.danger {
    background: rgba(239, 68, 68, 0.1);
    color: var(--accent-red);
    border-color: rgba(239, 68, 68, 0.2);
  }

  .btn.danger:hover {
    background: var(--accent-red);
    color: #fff;
  }

  .btn.sm {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
  }

  .full-width {
    width: 100%;
  }

  /* Sidebar */
  .sticky-card {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    min-height: 100%;
  }

  .sidebar-title {
    font-size: 1rem;
    color: var(--text-primary);
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border-color);
  }

  .summary-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 2rem;
    flex-grow: 1;
  }

  .summary-item {
    display: flex;
    justify-content: space-between;
    font-size: 0.875rem;
  }

  .summary-item .label {
    color: var(--text-secondary);
  }

  .summary-item .value {
    color: var(--text-primary);
    font-weight: 500;
  }

  .sidebar-footer {
    margin-top: auto;
    padding-top: 1rem;
  }

  /* Toasts / Banners */
  .toast-container {
    position: fixed;
    top: 1rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 50;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .banner {
    padding: 0.75rem 1.5rem;
    border-radius: var(--radius-md);
    font-size: 0.875rem;
    font-weight: 500;
    box-shadow: var(--shadow-card);
    animation: slideDown 0.3s ease-out;
  }

  .success-banner {
    background: var(--accent-green-bg);
    border: 1px solid rgba(16, 185, 129, 0.3);
    color: var(--accent-green);
  }

  .error-banner {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: var(--accent-red);
  }

  .error-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 60vh;
    gap: 1.5rem;
    text-align: center;
  }

  @keyframes slideDown {
    from { transform: translateY(-100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  /* Skeletons */
  .skeleton-wrapper {
    gap: 2rem;
  }

  .skeleton-box {
    background: #1a1a1a;
    border-radius: var(--radius-md);
    animation: pulse 2s infinite ease-in-out;
  }

  .title-skeleton {
    height: 48px;
    width: 60%;
  }

  .skeleton-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .card-skeleton {
    height: 100px;
  }

  .big-card-skeleton {
    height: 300px;
  }

  .sidebar-skeleton {
    height: 400px;
  }

  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.4; }
    100% { opacity: 1; }
  }
`;