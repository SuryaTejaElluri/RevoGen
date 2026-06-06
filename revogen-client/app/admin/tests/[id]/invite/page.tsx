'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import AdminNavbar from '@/components/AdminNavbar';

export default function InvitePage() {
  const params = useParams();
  const testId = params.id as string;

  const [emails, setEmails] = useState('');
  const [loading, setLoading] = useState(false);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [fetchingInvites, setFetchingInvites] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { loadInvitations(); }, []);

  const loadInvitations = async () => {
    try {
      setFetchingInvites(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:3000/tests/${testId}/invitations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setInvitations(data);
    } catch (error) {
      console.error(error);
    } finally {
      setFetchingInvites(false);
    }
  };

  const assignTest = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const emailList = emails.split('\n').map((e) => e.trim()).filter(Boolean);
      const response = await fetch(`http://localhost:3000/tests/${testId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ emails: emailList }),
      });
      const data = await response.json();
      alert(`${data.count} invitations created`);
      setEmails('');
      loadInvitations();
    } catch (error) {
      console.error(error);
      alert('Failed to assign test');
    } finally {
      setLoading(false);
    }
  };

  const completedCount = invitations.filter((i) => i.status === 'COMPLETED').length;
  const pendingCount = invitations.filter((i) => i.status === 'PENDING').length;
  const emailCount = emails.split('\n').map((e) => e.trim()).filter(Boolean).length;

  const filteredInvitations = invitations.filter((i) =>
    i.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          --text-primary:   #e6edf3;
          --text-secondary: #8b949e;
          --text-muted:     #484f58;
          --radius-sm:      6px;
          --radius-md:      10px;
          --radius-lg:      14px;
          --shadow-sm:      0 1px 3px rgba(0,0,0,0.4);
          --shadow-md:      0 4px 12px rgba(0,0,0,0.5);
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
          max-width: 840px;
          margin: 0 auto;
          padding: 36px 24px 80px;
        }

        /* ── Header ── */
        .page-header {
          display: flex; align-items: center; gap: 14px;
          margin-bottom: 32px;
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

        /* ── Card ── */
        .card {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 22px 24px;
          margin-bottom: 20px;
          box-shadow: var(--shadow-sm);
        }

        .section-label {
          font-size: 11px; font-weight: 600;
          text-transform: uppercase; letter-spacing: 1px;
          color: var(--text-muted);
          margin-bottom: 14px;
        }

        /* ── Stats Bar ── */
        .stats-bar {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }
        .stat-chip {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 14px 16px;
          text-align: center;
        }
        .stat-value {
          font-size: 24px; font-weight: 700;
          font-family: var(--font-mono);
          color: var(--accent); line-height: 1;
        }
        .stat-label {
          font-size: 11px; color: var(--text-muted);
          margin-top: 4px; text-transform: uppercase; letter-spacing: 0.6px;
        }

        /* ── Textarea ── */
        .email-textarea {
          width: 100%;
          min-height: 140px;
          padding: 12px 14px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-family: var(--font-mono);
          font-size: 13px;
          resize: vertical;
          outline: none;
          line-height: 1.6;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .email-textarea::placeholder { color: var(--text-muted); font-family: var(--font-main); }
        .email-textarea:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-glow);
        }

        .textarea-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 10px;
          margin-bottom: 16px;
        }
        .email-counter {
          font-size: 12px; font-family: var(--font-mono);
          color: var(--text-muted);
        }
        .email-counter span { color: var(--accent); font-weight: 500; }

        /* ── Submit ── */
        .submit-btn {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          width: 100%; padding: 12px 20px;
          background: var(--accent); color: white;
          border: none; border-radius: var(--radius-md);
          font-family: var(--font-main);
          font-size: 14px; font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, box-shadow 0.2s, transform 0.1s;
          letter-spacing: 0.1px;
        }
        .submit-btn:hover:not(:disabled) {
          background: #4493ff;
          box-shadow: 0 4px 16px var(--accent-glow);
          transform: translateY(-1px);
        }
        .submit-btn:active:not(:disabled) { transform: translateY(0); }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .spinner {
          width: 15px; height: 15px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite; display: inline-block;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Search ── */
        .search-input {
          width: 100%;
          padding: 9px 14px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-family: var(--font-main);
          font-size: 13px;
          outline: none;
          margin-bottom: 16px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .search-input::placeholder { color: var(--text-muted); }
        .search-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-glow);
        }

        /* ── Invitation List ── */
        .invite-list { display: flex; flex-direction: column; gap: 8px; }

        .invite-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 12px 16px;
          gap: 12px;
          transition: border-color 0.15s, background 0.15s;
        }
        .invite-row:hover { border-color: var(--border-hover); background: var(--bg-elevated); }

        .invite-left { display: flex; align-items: center; gap: 12px; }
        .invite-avatar {
          width: 34px; height: 34px;
          background: var(--accent-soft);
          border: 1px solid rgba(56,139,253,0.25);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 600; color: var(--accent);
          font-family: var(--font-mono);
          flex-shrink: 0;
          text-transform: uppercase;
        }
        .invite-email {
          font-size: 13px; font-weight: 500;
          color: var(--text-primary);
          font-family: var(--font-mono);
        }

        .status-badge {
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 11px; font-weight: 600;
          font-family: var(--font-mono);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          flex-shrink: 0;
        }
        .status-completed {
          background: var(--success-soft);
          color: var(--success);
          border: 1px solid rgba(63,185,80,0.25);
        }
        .status-pending {
          background: var(--warning-soft);
          color: var(--warning);
          border: 1px solid rgba(210,153,34,0.25);
        }
        .status-other {
          background: var(--bg-elevated);
          color: var(--text-secondary);
          border: 1px solid var(--border);
        }

        /* ── Empty ── */
        .empty-state {
          text-align: center; padding: 40px 24px;
          color: var(--text-muted);
        }
        .empty-icon { font-size: 36px; margin-bottom: 10px; }
        .empty-text { font-size: 13px; }

        /* ── Skeleton ── */
        .skeleton-row {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 12px 16px;
          display: flex; align-items: center; gap: 12px;
          margin-bottom: 8px;
          animation: pulse 1.5s ease-in-out infinite;
        }
        .skel-circle { width: 34px; height: 34px; background: var(--bg-elevated); border-radius: 50%; flex-shrink:0; }
        .skel-line { height: 12px; background: var(--bg-elevated); border-radius: 4px; flex: 1; }
        .skel-badge { width: 70px; height: 22px; background: var(--bg-elevated); border-radius: 20px; flex-shrink:0; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>

      <AdminNavbar />

      <div className="page-wrapper">
        <div className="page-container">

          {/* Header */}
          <div className="page-header">
            <div className="page-header-icon">✉️</div>
            <div>
              <div className="page-title">Assign Test</div>
              <div className="page-subtitle">Invite candidates by email to take this test</div>
            </div>
          </div>

          {/* Stats */}
          <div className="stats-bar">
            <div className="stat-chip">
              <div className="stat-value">{invitations.length}</div>
              <div className="stat-label">Total Assigned</div>
            </div>
            <div className="stat-chip">
              <div className="stat-value" style={{ color: 'var(--success)' }}>{completedCount}</div>
              <div className="stat-label">Completed</div>
            </div>
            <div className="stat-chip">
              <div className="stat-value" style={{ color: 'var(--warning)' }}>{pendingCount}</div>
              <div className="stat-label">Pending</div>
            </div>
          </div>

          {/* Invite Form */}
          <div className="card">
            <div className="section-label">Invite Candidates</div>
            <textarea
              className="email-textarea"
              placeholder={"alice@example.com\nbob@example.com\ncharlie@example.com"}
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
            />
            <div className="textarea-footer">
              <div className="email-counter">
                <span>{emailCount}</span> email{emailCount !== 1 ? 's' : ''} entered
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>One email per line</div>
            </div>
            <button
              className="submit-btn"
              onClick={assignTest}
              disabled={loading || emailCount === 0}
            >
              {loading ? (
                <><span className="spinner" /> Sending Invitations…</>
              ) : (
                <><span>✦</span> Send {emailCount > 0 ? `${emailCount} ` : ''}Invitation{emailCount !== 1 ? 's' : ''}</>
              )}
            </button>
          </div>

          {/* Candidates List */}
          <div className="card">
            <div className="section-label">Assigned Candidates</div>

            {invitations.length > 4 && (
              <input
                className="search-input"
                placeholder="🔍  Search by email…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            )}

            {fetchingInvites && (
              <div>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton-row">
                    <div className="skel-circle" />
                    <div className="skel-line" />
                    <div className="skel-badge" />
                  </div>
                ))}
              </div>
            )}

            {!fetchingInvites && invitations.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <div className="empty-text">No candidates assigned yet. Enter emails above to get started.</div>
              </div>
            )}

            {!fetchingInvites && invitations.length > 0 && (
              <div className="invite-list">
                {filteredInvitations.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">🔍</div>
                    <div className="empty-text">No results for "<strong>{searchQuery}</strong>"</div>
                  </div>
                ) : filteredInvitations.map((invitation) => (
                  <div key={invitation.id} className="invite-row">
                    <div className="invite-left">
                      <div className="invite-avatar">
                        {invitation.email?.[0] ?? '?'}
                      </div>
                      <div className="invite-email">{invitation.email}</div>
                    </div>
                    <span className={`status-badge ${
                      invitation.status === 'COMPLETED' ? 'status-completed'
                        : invitation.status === 'PENDING' ? 'status-pending'
                        : 'status-other'
                    }`}>
                      {invitation.status === 'COMPLETED' ? '✓ ' : invitation.status === 'PENDING' ? '⏳ ' : ''}
                      {invitation.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}