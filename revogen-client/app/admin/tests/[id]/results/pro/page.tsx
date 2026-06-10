'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import AdminNavbar from '@/components/AdminNavbar';

/* ─── Styles ──────────────────────────────────────────────────────────────── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:           #0d0f14;
    --bg2:          #13161e;
    --bg3:          #1a1e28;
    --border:       rgba(255,255,255,.07);
    --border-hover: rgba(255,255,255,.14);

    --accent:       #6366f1;
    --accent2:      #818cf8;
    --accent-glow:  rgba(99,102,241,.18);

    --green:        #10b981;
    --green-dim:    rgba(16,185,129,.12);
    --amber:        #f59e0b;
    --amber-dim:    rgba(245,158,11,.12);
    --red:          #ef4444;
    --red-dim:      rgba(239,68,68,.12);

    --text:         #f1f5f9;
    --text2:        #94a3b8;
    --text3:        #475569;

    --font:         'Sora', sans-serif;
    --mono:         'JetBrains Mono', monospace;

    --radius:       12px;
    --radius-lg:    18px;
    --shadow:       0 8px 32px rgba(0,0,0,.4);
    --transition:   all .2s cubic-bezier(.4,0,.2,1);
  }

  body { background: var(--bg); color: var(--text); font-family: var(--font); }

  /* ── Page Shell ── */
  .rp-shell {
    min-height: 100vh;
    background:
      radial-gradient(ellipse 80% 40% at 60% -10%, rgba(99,102,241,.12), transparent),
      var(--bg);
  }

  .rp-inner {
    max-width: 1320px;
    margin: 0 auto;
    padding: 32px 28px 64px;
  }

  /* ── Header ── */
  .rp-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 32px;
  }

  .rp-title {
    font-size: 26px;
    font-weight: 700;
    letter-spacing: -.5px;
    color: var(--text);
  }

  .rp-subtitle {
    font-size: 13px;
    color: var(--text2);
    margin-top: 4px;
    font-weight: 400;
  }

  .rp-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  /* ── Buttons ── */
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 9px 18px;
    border-radius: var(--radius);
    font-size: 13px;
    font-weight: 600;
    font-family: var(--font);
    cursor: pointer;
    border: 1px solid transparent;
    transition: var(--transition);
    white-space: nowrap;
  }

  .btn:disabled { opacity: .35; cursor: not-allowed; }

  .btn-outline {
    background: transparent;
    border-color: var(--border-hover);
    color: var(--text2);
  }

  .btn-outline:not(:disabled):hover {
    background: var(--bg3);
    color: var(--text);
    border-color: rgba(255,255,255,.2);
  }

  .btn-accent {
    background: var(--accent);
    color: #fff;
    border-color: var(--accent);
  }

  .btn-accent:not(:disabled):hover {
    background: var(--accent2);
    box-shadow: 0 0 0 3px var(--accent-glow);
  }

  /* ── Stats Bar ── */
  .stats-bar {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 14px;
    margin-bottom: 28px;
  }

  .stat-card {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 18px 20px;
    transition: var(--transition);
  }

  .stat-card:hover { border-color: var(--border-hover); }

  .stat-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--text3);
    text-transform: uppercase;
    letter-spacing: .08em;
    margin-bottom: 8px;
  }

  .stat-value {
    font-size: 28px;
    font-weight: 700;
    font-family: var(--mono);
    color: var(--text);
    letter-spacing: -1px;
  }

  .stat-value.green { color: var(--green); }
  .stat-value.amber { color: var(--amber); }
  .stat-value.red   { color: var(--red); }

  /* ── Filters ── */
  .filters-panel {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 20px 24px;
    margin-bottom: 28px;
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    align-items: flex-end;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 160px;
  }

  .filter-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--text3);
    text-transform: uppercase;
    letter-spacing: .08em;
  }

  .filter-input, .filter-select {
    background: var(--bg3);
    border: 1px solid var(--border-hover);
    border-radius: var(--radius);
    padding: 9px 13px;
    font-size: 13px;
    font-family: var(--mono);
    color: var(--text);
    outline: none;
    transition: var(--transition);
    width: 100%;
    -webkit-appearance: none;
  }

  .filter-input:focus, .filter-select:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-glow);
  }

  .filter-select option { background: var(--bg2); }

  /* ── Results count ── */
  .rp-count {
    font-size: 13px;
    color: var(--text2);
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .rp-count strong { color: var(--text); font-family: var(--mono); }

  /* ── Candidate Grid ── */
  .candidates-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  /* ── Candidate Card ── */
  .cand-card {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    transition: var(--transition);
    cursor: pointer;
  }

  .cand-card:hover { border-color: var(--border-hover); box-shadow: var(--shadow); }
  .cand-card.open  { border-color: rgba(99,102,241,.35); }

  .cand-row {
    display: grid;
    grid-template-columns: 48px 1fr auto auto auto auto;
    align-items: center;
    gap: 16px;
    padding: 16px 20px;
  }

  /* ── Rank Badge ── */
  .rank-badge {
    width: 36px;
    height: 36px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--mono);
    font-size: 12px;
    font-weight: 700;
    flex-shrink: 0;
  }

  .rank-badge.gold   { background: rgba(251,191,36,.15); color: #fbbf24; border: 1px solid rgba(251,191,36,.3); }
  .rank-badge.silver { background: rgba(148,163,184,.12); color: #94a3b8; border: 1px solid rgba(148,163,184,.25); }
  .rank-badge.bronze { background: rgba(180,120,60,.12); color: #c97c3a; border: 1px solid rgba(180,120,60,.25); }
  .rank-badge.plain  { background: var(--bg3); color: var(--text3); border: 1px solid var(--border); }

  /* ── Candidate Info ── */
  .cand-info { min-width: 0; }

  .cand-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .cand-email {
    font-size: 12px;
    color: var(--text2);
    margin-top: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-family: var(--mono);
  }

  /* ── Score pill ── */
  .score-pill {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
    flex-shrink: 0;
  }

  .score-pct {
    font-family: var(--mono);
    font-size: 18px;
    font-weight: 700;
    line-height: 1;
  }

  .score-raw {
    font-size: 11px;
    color: var(--text3);
    font-family: var(--mono);
  }

  /* ── Verdict badge ── */
  .verdict-badge {
    padding: 5px 11px;
    border-radius: 50px;
    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;
    flex-shrink: 0;
    border: 1px solid;
  }

  .verdict-badge.trusted  { background: var(--green-dim); color: var(--green); border-color: rgba(16,185,129,.25); }
  .verdict-badge.review   { background: var(--amber-dim); color: var(--amber); border-color: rgba(245,158,11,.25); }
  .verdict-badge.suspect  { background: var(--red-dim);   color: var(--red);   border-color: rgba(239,68,68,.25); }

  /* ── Risk ring ── */
  .risk-ring {
    width: 44px;
    height: 44px;
    flex-shrink: 0;
  }

  /* ── Chevron ── */
  .chevron {
    color: var(--text3);
    font-size: 13px;
    transition: transform .2s ease;
    flex-shrink: 0;
  }

  .cand-card.open .chevron { transform: rotate(180deg); color: var(--accent2); }

  /* ── Expanded Detail ── */
  .cand-detail {
    border-top: 1px solid var(--border);
    padding: 20px 20px 20px 84px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    background: var(--bg);
  }

  .detail-section h5 {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .1em;
    color: var(--text3);
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border);
  }

  .detail-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 7px 0;
    border-bottom: 1px solid rgba(255,255,255,.03);
    font-size: 13px;
  }

  .detail-row:last-child { border-bottom: none; }

  .detail-key { color: var(--text2); display: flex; align-items: center; gap: 6px; }
  .detail-val { font-family: var(--mono); font-size: 12px; font-weight: 600; color: var(--text); }
  .detail-val.ok  { color: var(--green); }
  .detail-val.bad { color: var(--red); }
  .detail-val.mid { color: var(--amber); }

  /* ── Progress bar mini ── */
  .mini-bar-track {
    width: 80px;
    height: 5px;
    background: var(--bg3);
    border-radius: 99px;
    overflow: hidden;
    display: inline-block;
    vertical-align: middle;
    margin-left: 8px;
  }

  .mini-bar-fill {
    height: 100%;
    border-radius: 99px;
    transition: width .4s ease;
  }

  /* ── Empty state ── */
  .empty-state {
    text-align: center;
    padding: 64px 0;
    color: var(--text3);
  }

  .empty-state .icon { font-size: 40px; margin-bottom: 14px; }
  .empty-state p { font-size: 14px; }

  /* ── Responsive ── */
  @media (max-width: 900px) {
    .cand-row {
      grid-template-columns: 40px 1fr auto auto;
    }
    .cand-row .risk-ring,
    .cand-row .verdict-badge { display: none; }
    .cand-detail { grid-template-columns: 1fr; padding-left: 20px; }
  }

  @media (max-width: 640px) {
    .rp-inner { padding: 20px 16px 48px; }
    .rp-header { flex-direction: column; align-items: flex-start; }
    .stats-bar { grid-template-columns: 1fr 1fr; }
  }
`;

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function riskColor(score: number) {
  if (score >= 50) return '#ef4444';
  if (score >= 20) return '#f59e0b';
  return '#10b981';
}

function verdictClass(score: number) {
  if (score >= 50) return 'suspect';
  if (score >= 20) return 'review';
  return 'trusted';
}

function verdictLabel(score: number) {
  if (score >= 50) return '🚨 Suspicious';
  if (score >= 20) return '⚠ Review';
  return '✅ Trusted';
}

function rankClass(i: number) {
  if (i === 0) return 'gold';
  if (i === 1) return 'silver';
  if (i === 2) return 'bronze';
  return 'plain';
}

function pctColor(pct: number) {
  if (pct >= 70) return '#10b981';
  if (pct >= 40) return '#f59e0b';
  return '#ef4444';
}

function barColor(score: number) {
  if (score >= 50) return '#ef4444';
  if (score >= 20) return '#f59e0b';
  return '#10b981';
}

/* ─── Risk Ring SVG ───────────────────────────────────────────────────────── */
function RiskRing({ score }: { score: number }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const fill = ((100 - score) / 100) * circ;
  const color = riskColor(score);
  return (
    <svg className="risk-ring" viewBox="0 0 44 44">
      <circle cx="22" cy="22" r={r} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="4" />
      <circle
        cx="22" cy="22" r={r} fill="none"
        stroke={color} strokeWidth="4"
        strokeDasharray={`${circ - fill} ${fill}`}
        strokeLinecap="round"
        transform="rotate(-90 22 22)"
        style={{ transition: 'stroke-dasharray .5s ease' }}
      />
      <text x="22" y="26" textAnchor="middle" fill={color} fontSize="9" fontWeight="700" fontFamily="'JetBrains Mono',monospace">
        {score}
      </text>
    </svg>
  );
}

/* ─── Main Component ──────────────────────────────────────────────────────── */
export default function TestResultsPage() {
  const params = useParams();
  const id = params.id as string;

  const [results, setResults]               = useState<any[]>([]);
  const [minPercentage, setMinPercentage]   = useState(0);
  const [suspicionFilter, setSuspicionFilter] = useState('ALL');
  const [openId, setOpenId]                 = useState<string | null>(null);

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = css;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  useEffect(() => { loadResults(); }, []);

  const loadResults = async () => {
    const token = localStorage.getItem('access_token');
    try {
      const res  = await fetch(`http://localhost:3000/tests/${id}/results`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setResults(data);
    } catch (e) {
      console.error('Failed to load results', e);
    }
  };

  const filteredResults = results.filter((r: any) =>
    r.percentage >= minPercentage &&
    (suspicionFilter === 'ALL' || r.proctoringReport?.suspicionLevel === suspicionFilter)
  );

  /* Aggregate stats — all sourced from result.proctoringReport?.riskScore */
  const avgPct   = filteredResults.length
    ? Math.round(filteredResults.reduce((s: number, r: any) => s + r.percentage, 0) / filteredResults.length)
    : 0;
  const highRisk = filteredResults.filter((r: any) => (r.proctoringReport?.riskScore ?? 0) >= 50).length;
  const trusted  = filteredResults.filter((r: any) => (r.proctoringReport?.riskScore ?? 0) < 20).length;

  /* ── Copy Emails — null-safe user check ── */
  const copyEmails = () => {
    const emails = filteredResults
      .filter((r: any) => r.user?.email)
      .map((r: any) => r.user.email);
    navigator.clipboard.writeText(emails.join(','));
    alert(`${emails.length} emails copied to clipboard`);
  };

  /* ── Export CSV — full field synchronization ── */
  const exportCSV = () => {
    const headers = [
      'Rank',
      'Name',
      'Email',
      'Score',
      'Percentage',
      'RiskScore',
      'SecurityScore',
      'SuspicionLevel',
      'CameraEnabled',
      'MicrophoneEnabled',
      'CameraDisconnectEvents',
      'MicrophoneDisconnectEvents',
      'FaceMissingEvents',
      'MultipleFaceEvents',
      'NoiseWarnings',
      'TabSwitches',
      'FullscreenViolations',
      'CopyAttempts',
      'RightClickAttempts',
      'IdleEvents',
      'ResizeEvents',
      'ForcedSubmission',
    ];

    const rows = filteredResults.map((r: any, i: number) => {
      const pr = r.proctoringReport;
      return [
        i + 1,
        r.user?.name ?? '',
        r.user?.email ?? '',
        `${r.score}/${r.totalQuestions}`,
        `${r.percentage}%`,
        pr?.riskScore ?? 0,
        pr?.securityScore ?? 100,
        pr?.suspicionLevel ?? 'LOW',
        pr?.cameraEnabled ? 'Yes' : 'No',
        pr?.microphoneEnabled ? 'Yes' : 'No',
        pr?.cameraDisconnectEvents ?? 0,
        pr?.microphoneDisconnectEvents ?? 0,
        pr?.faceMissingEvents ?? 0,
        pr?.multipleFaceEvents ?? 0,
        pr?.noiseWarnings ?? 0,
        pr?.tabSwitches ?? 0,
        pr?.fullscreenViolations ?? 0,
        pr?.copyAttempts ?? 0,
        pr?.rightClickAttempts ?? 0,
        pr?.idleEvents ?? 0,
        pr?.resizeEvents ?? 0,
        r.forcedSubmission ? 'Yes' : 'No',
      ];
    });

    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'candidates.csv';
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  return (
    <>
      <AdminNavbar />

      <div className="rp-shell">
        <div className="rp-inner">

          {/* ── Header ── */}
          <div className="rp-header">
            <div>
              <h1 className="rp-title">Assessment Results</h1>
              <p className="rp-subtitle">{results.length} total submissions — proctored &amp; ranked</p>
            </div>
            <div className="rp-actions">
              <button className="btn btn-outline" onClick={copyEmails} disabled={filteredResults.length === 0}>
                📋 Copy Emails
              </button>
              <button className="btn btn-accent" onClick={exportCSV} disabled={filteredResults.length === 0}>
                ⬇ Export CSV
              </button>
            </div>
          </div>

          {/* ── Stats Bar — all use proctoringReport?.riskScore as source ── */}
          <div className="stats-bar">
            <div className="stat-card">
              <div className="stat-label">Showing</div>
              <div className="stat-value">{filteredResults.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Avg Score</div>
              <div className="stat-value" style={{ color: pctColor(avgPct) }}>{avgPct}%</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Trusted</div>
              <div className="stat-value green">{trusted}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">High Risk</div>
              <div className="stat-value red">{highRisk}</div>
            </div>
          </div>

          {/* ── Filters ── */}
          <div className="filters-panel">
            <div className="filter-group">
              <label className="filter-label">Min Percentage</label>
              <input
                className="filter-input"
                type="number" min={0} max={100}
                value={minPercentage}
                onChange={e => setMinPercentage(Number(e.target.value))}
              />
            </div>
            <div className="filter-group">
              <label className="filter-label">Suspicion Level</label>
              <select
                className="filter-select"
                value={suspicionFilter}
                onChange={e => setSuspicionFilter(e.target.value)}
              >
                <option value="ALL">All Levels</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>

          {/* ── Count ── */}
          <div className="rp-count">
            Showing <strong>{filteredResults.length}</strong> of <strong>{results.length}</strong> candidates
          </div>

          {/* ── Candidate List ── */}
          {filteredResults.length === 0 ? (
            <div className="empty-state">
              <div className="icon">🔍</div>
              <p>No candidates match the current filters.</p>
            </div>
          ) : (
            <div className="candidates-list">
              {filteredResults.map((result: any, index: number) => {
                /* risk sourced exclusively from proctoringReport?.riskScore */
                const risk   = result.proctoringReport?.riskScore ?? 0;
                const pct    = result.percentage;
                const isOpen = openId === result.id;
                const pr     = result.proctoringReport;

                return (
                  <div
                    key={result.id}
                    className={`cand-card${isOpen ? ' open' : ''}`}
                  >
                    {/* ── Summary Row ── */}
                    <div className="cand-row" onClick={() => setOpenId(isOpen ? null : result.id)}>

                      {/* Rank */}
                      <div className={`rank-badge ${rankClass(index)}`}>
                        #{index + 1}
                      </div>

                      {/* Info — null-safe user */}
                      <div className="cand-info">
                        <div className="cand-name">{result.user?.name ?? '—'}</div>
                        <div className="cand-email">{result.user?.email ?? '—'}</div>
                      </div>

                      {/* Score */}
                      <div className="score-pill">
                        <span className="score-pct" style={{ color: pctColor(pct) }}>{pct}%</span>
                        <span className="score-raw">{result.score}/{result.totalQuestions}</span>
                      </div>

                      {/* Verdict — sourced from proctoringReport?.riskScore */}
                      <div className={`verdict-badge ${verdictClass(risk)}`}>
                        {verdictLabel(risk)}
                      </div>

                      {/* Risk Ring — sourced from proctoringReport?.riskScore */}
                      <RiskRing score={risk} />

                      {/* Chevron */}
                      <span className="chevron">▼</span>
                    </div>

                    {/* ── Expanded Detail ── */}
                    {isOpen && (
                      <div className="cand-detail">

                        {/* Left — Performance + Device */}
                        <div className="detail-section">
                          <h5>Performance</h5>
                          <div className="detail-row">
                            <span className="detail-key">📊 Score</span>
                            <span className="detail-val">{result.score} / {result.totalQuestions}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-key">📈 Percentage</span>
                            <span className="detail-val" style={{ color: pctColor(pct) }}>{pct}%</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-key">🎯 Risk Score</span>
                            <span className="detail-val" style={{ color: riskColor(risk) }}>
                              {risk} / 100
                              <span className="mini-bar-track">
                                <span className="mini-bar-fill" style={{ width: `${risk}%`, background: barColor(risk) }} />
                              </span>
                            </span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-key">🛡 Suspicion Level</span>
                            <span className="detail-val" style={{ color: riskColor(risk) }}>
                              {pr?.suspicionLevel ?? 'LOW'}
                            </span>
                          </div>

                          <h5 style={{ marginTop: 20 }}>Device &amp; Session</h5>
                          <div className="detail-row">
                            <span className="detail-key">📷 Camera</span>
                            <span className={`detail-val ${pr?.cameraEnabled ? 'ok' : 'bad'}`}>
                              {pr?.cameraEnabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-key">🎤 Microphone</span>
                            <span className={`detail-val ${pr?.microphoneEnabled ? 'ok' : 'bad'}`}>
                              {pr?.microphoneEnabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-key">📷 Camera Disconnects</span>
                            <span className={`detail-val ${(pr?.cameraDisconnectEvents ?? 0) > 0 ? 'bad' : 'ok'}`}>
                              {pr?.cameraDisconnectEvents ?? 0}
                            </span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-key">🎤 Microphone Disconnects</span>
                            <span className={`detail-val ${(pr?.microphoneDisconnectEvents ?? 0) > 0 ? 'bad' : 'ok'}`}>
                              {pr?.microphoneDisconnectEvents ?? 0}
                            </span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-key">💤 Idle Events</span>
                            <span className="detail-val">{pr?.idleEvents ?? 0}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-key">📏 Resize Events</span>
                            <span className="detail-val">{pr?.resizeEvents ?? 0}</span>
                          </div>
                          {pr?.possibleMultiMonitor !== undefined && (
                            <div className="detail-row">
                              <span className="detail-key">🖥 Multi Monitor</span>
                              <span className={`detail-val ${pr.possibleMultiMonitor ? 'bad' : 'ok'}`}>
                                {pr.possibleMultiMonitor ? 'Detected' : 'Not Detected'}
                              </span>
                            </div>
                          )}
                          <div className="detail-row">
                            <span className="detail-key">🎯 Forced Submission</span>
                            <span className={`detail-val ${result.forcedSubmission ? 'bad' : 'ok'}`}>
                              {result.forcedSubmission ? 'Yes' : 'No'}
                            </span>
                          </div>
                        </div>

                        {/* Right — Proctoring Events + Security Score */}
                        <div className="detail-section">
                          <h5>Proctoring Events</h5>
                          <div className="detail-row">
                            <span className="detail-key">👤 Face Missing</span>
                            <span className={`detail-val ${(pr?.faceMissingEvents ?? 0) > 0 ? 'mid' : 'ok'}`}>
                              {pr?.faceMissingEvents ?? 0}
                            </span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-key">👥 Multiple Faces</span>
                            <span className={`detail-val ${(pr?.multipleFaceEvents ?? 0) > 0 ? 'bad' : 'ok'}`}>
                              {pr?.multipleFaceEvents ?? 0}
                            </span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-key">🔊 Noise Warnings</span>
                            <span className={`detail-val ${(pr?.noiseWarnings ?? 0) > 2 ? 'mid' : 'ok'}`}>
                              {pr?.noiseWarnings ?? 0}
                            </span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-key">🗂 Tab Switches</span>
                            <span className={`detail-val ${(pr?.tabSwitches ?? 0) > 0 ? 'bad' : 'ok'}`}>
                              {pr?.tabSwitches ?? 0}
                            </span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-key">🖥 Fullscreen Exits</span>
                            <span className={`detail-val ${(pr?.fullscreenViolations ?? 0) > 0 ? 'mid' : 'ok'}`}>
                              {pr?.fullscreenViolations ?? 0}
                            </span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-key">📋 Copy Attempts</span>
                            <span className={`detail-val ${(pr?.copyAttempts ?? 0) > 0 ? 'bad' : 'ok'}`}>
                              {pr?.copyAttempts ?? 0}
                            </span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-key">🖱 Right Clicks</span>
                            <span className={`detail-val ${(pr?.rightClickAttempts ?? 0) > 0 ? 'bad' : 'ok'}`}>
                              {pr?.rightClickAttempts ?? 0}
                            </span>
                          </div>

                          <h5 style={{ marginTop: 20 }}>Security Score</h5>
                          <div className="detail-row">
                            <span className="detail-key">🔐 Security Score</span>
                            <span className="detail-val ok">
                              {pr?.securityScore ?? 100} / 100
                              <span className="mini-bar-track">
                                <span
                                  className="mini-bar-fill"
                                  style={{ width: `${pr?.securityScore ?? 100}%`, background: 'var(--green)' }}
                                />
                              </span>
                            </span>
                          </div>
                        </div>

                      </div>
                    )}
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