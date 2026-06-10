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

  .filter-input {
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

  .filter-input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-glow);
  }

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
    
  .basic-badge {
    background: var(--green-dim);
    color: var(--green);
    border: 1px solid rgba(16,185,129,.25);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.05em;
    margin-top: 6px;
    display: inline-block;
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

function calculateRiskScore(result: any) {
  if (typeof result.riskScore === 'number') {
    return Math.min(result.riskScore, 100);
  }
  const calculatedRisk =
  (result.tabSwitches || 0) * 10 +
  (result.fullscreenViolations || 0) * 8 +
  (result.copyAttempts || 0) * 15 +
  (result.rightClickAttempts || 0) * 5;
  return Math.min(calculatedRisk, 100);
}

function calculateSecurityScore(riskScore: number) {
  return Math.max(100 - riskScore, 0);
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

  const [results, setResults]       = useState<any[]>([]);
  const [minPercentage, setMinPercentage]   = useState(0);
  const [openId, setOpenId]         = useState<string | null>(null);

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

  const filteredResults = results.filter((r: any) => r.percentage >= minPercentage);

  /* Aggregate stats */
  const avgPct   = filteredResults.length
    ? Math.round(filteredResults.reduce((s: number, r: any) => s + r.percentage, 0) / filteredResults.length)
    : 0;
  const highRisk   = filteredResults.filter((r: any) => calculateRiskScore(r) >= 50).length;
  const trusted    = filteredResults.filter((r: any) => calculateRiskScore(r) < 20).length;

  const copyEmails = () => {
    const emails = filteredResults.map((r: any) => r.user.email);
    navigator.clipboard.writeText(emails.join(','));
    alert(`${emails.length} emails copied to clipboard`);
  };

  const exportCSV = () => {
    const headers = [
  'Rank',
  'Name',
  'Email',
  'Score',
  'Percentage',
  'RiskScore',
  'SecurityScore',
  'TabSwitches',
  'FullscreenViolations',
  'CopyAttempts',
  'RightClickAttempts'
];
    const rows = filteredResults.map((r: any, i: number) => {
      const risk = calculateRiskScore(r);
      const security = calculateSecurityScore(risk);
      return [
        i + 1,
        r.user.name,
        r.user.email,
        `${r.score}/${r.totalQuestions}`,
        `${r.percentage}%`,
        risk,
        security,
        r.tabSwitches ?? 0,
        r.fullscreenViolations ?? 0,
        r.copyAttempts ?? 0,
        r.rightClickAttempts ?? 0,
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
              <p className="rp-subtitle">{results.length} total submissions — basic monitoring &amp; ranked</p>
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

          {/* ── Stats Bar ── */}
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
              console.log(result);
              {filteredResults.map((result: any, index: number) => {
                const risk    = calculateRiskScore(result);
                const security = calculateSecurityScore(risk);
                const pct     = result.percentage;
                const isOpen  = openId === result.id;

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

                      {/* Info */}
                      <div className="cand-info">
                        <div className="cand-name">{result.user.name}</div>
                        <div className="cand-email">
                          {result.user.email}
                          <br/>
                          <span className="basic-badge">BASIC</span>
                        </div>
                      </div>

                      {/* Score */}
                      <div className="score-pill">
                        <span className="score-pct" style={{ color: pctColor(pct) }}>{pct}%</span>
                        <span className="score-raw">{result.score}/{result.totalQuestions}</span>
                      </div>

                      {/* Verdict */}
                      <div className={`verdict-badge ${verdictClass(risk)}`}>
                        {verdictLabel(risk)}
                      </div>

                      {/* Risk Ring */}
                      <RiskRing score={risk} />

                      {/* Chevron */}
                      <span className="chevron">▼</span>
                    </div>

                    {/* ── Expanded Detail ── */}
                    {isOpen && (
                      <div className="cand-detail">
                        {/* Left — Performance */}
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
                        </div>

                        {/* Right — Security & Activity */}
                        <div className="detail-section">
                          <h5>Security &amp; Activity</h5>
                          <div className="detail-row">
                            <span className="detail-key">🗂 Tab Switches</span>
                            <span className={`detail-val ${(result.tabSwitches ?? 0) > 0 ? 'bad' : 'ok'}`}>
                              {result.tabSwitches ?? 0}
                            </span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-key">🖥 Fullscreen Exits</span>
                            <span className={`detail-val ${(result.fullscreenViolations ?? 0) > 0 ? 'bad' : 'ok'}`}>
                              {result.fullscreenViolations ?? 0}
                            </span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-key">📋 Copy Attempts</span>
                            <span className={`detail-val ${(result.copyAttempts ?? 0) > 0 ? 'bad' : 'ok'}`}>
                              {result.copyAttempts ?? 0}
                            </span>
                          </div>
                          <div className="detail-row">
  <span className="detail-key">🖱 Right Clicks</span>
  <span
    className={`detail-val ${
      (result.rightClickAttempts ?? 0) > 0 ? 'mid' : 'ok'
    }`}
  >
    {result.rightClickAttempts ?? 0}
  </span>
</div>
                          <div className="detail-row">
                            <span className="detail-key">🔐 Security Score</span>
                            <span
  className={`detail-val ${
    security >= 80
      ? 'ok'
      : security >= 50
      ? 'mid'
      : 'bad'
  }`}
>
                              {security} / 100
                              <span className="mini-bar-track">
                                <span
                                  className="mini-bar-fill"
                                  style={{ width: `${security}%`, background: 'var(--green)' }}
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