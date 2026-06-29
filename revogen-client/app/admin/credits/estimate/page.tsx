'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminSidebar from '@/components/AdminSidebar';

const API = 'http://localhost:3000';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('access_token') ?? ''}`, 'Content-Type': 'application/json' });

interface EstimateResult {
  requiredCredits: number;
  currentBalance: number;
  remainingBalance: number;
  enoughCredits: boolean;
}

export default function EstimatePage() {
  const [securityLevel, setSecurityLevel] = useState<'BASIC' | 'PRO'>('BASIC');
  const [candidateCount, setCandidateCount] = useState(5);
  const [result, setResult]   = useState<EstimateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme]     = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const saved = (localStorage.getItem('adm_theme') as 'dark' | 'light') ?? 'dark';
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('adm_theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  const estimate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/credits/estimate`, {
        method: 'POST',
        headers: h(),
        body: JSON.stringify({ securityLevel, candidateCount }),
      });
      if (res.ok) setResult(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // Auto-estimate on input changes
  useEffect(() => { estimate(); }, [securityLevel, candidateCount]);

  const costPerCandidate = securityLevel === 'PRO' ? 10 : 5;

  return (
    <>
      <EstimateStyle />
      <div className="adm-shell">
        <AdminSidebar theme={theme} onToggleTheme={toggleTheme} />
        <div className="adm-main">
          <div className="adm">

            {/* Header */}
            <div className="adm-header">
              <div>
                <nav style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6, display: 'flex', gap: 6, alignItems: 'center' }}>
                  <Link href="/admin/credits" style={{ color: 'var(--muted)', textDecoration: 'none' }}>Credits</Link>
                  <span>/</span>
                  <span style={{ color: 'var(--text)' }}>Estimate</span>
                </nav>
                <h1 className="adm-h1">🧮 Assignment Cost Estimator</h1>
                <p className="adm-subtitle">Calculate how many credits a coding assignment will consume</p>
              </div>
              <Link href="/admin/credits" className="btn btn-secondary">← Back to Wallet</Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

              {/* ── Inputs ── */}
              <div className="section">
                <div className="section-title">Configure Assignment</div>

                {/* Security Level */}
                <div className="field">
                  <label className="field-label">Security Level</label>
                  <div className="level-grid">
                    {(['BASIC', 'PRO'] as const).map(lvl => (
                      <button
                        key={lvl}
                        className={`level-btn${securityLevel === lvl ? ' active' : ''}`}
                        onClick={() => setSecurityLevel(lvl)}
                        style={securityLevel === lvl ? { '--lvl-accent': lvl === 'PRO' ? '#a78bfa' : '#22c55e' } as any : {}}
                      >
                        <span className="level-icon">{lvl === 'PRO' ? '🛡️' : '🔒'}</span>
                        <span className="level-name">{lvl}</span>
                        <span className="level-cost">{lvl === 'PRO' ? 10 : 5} cr/candidate</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Candidate Count */}
                <div className="field">
                  <label className="field-label">
                    Number of Candidates
                    <span style={{ marginLeft: 8, fontWeight: 400, color: 'var(--muted)' }}>{candidateCount}</span>
                  </label>
                  <input
                    type="range"
                    min={1} max={50}
                    value={candidateCount}
                    onChange={e => setCandidateCount(Number(e.target.value))}
                    className="slider"
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                    <span>1</span><span>25</span><span>50</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                    {[5, 10, 15, 20, 25].map(n => (
                      <button
                        key={n}
                        onClick={() => setCandidateCount(n)}
                        className={`quick-num${candidateCount === n ? ' active' : ''}`}
                      >{n}</button>
                    ))}
                  </div>
                </div>

                {/* Pricing Note */}
                <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
                  <strong style={{ color: 'var(--text)' }}>Pricing:</strong> BASIC = 5 credits/candidate · PRO = 10 credits/candidate
                </div>
              </div>

              {/* ── Result ── */}
              <div>
                {loading ? (
                  <div className="section" style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontSize: 13, color: 'var(--muted)' }}>Calculating…</div>
                  </div>
                ) : result ? (
                  <div className={`result-card${result.enoughCredits ? ' result-ok' : ' result-err'}`}>
                    <div className="result-icon">{result.enoughCredits ? '✅' : '⚠️'}</div>
                    <div className="result-status">
                      {result.enoughCredits ? 'Sufficient Credits' : 'Insufficient Credits'}
                    </div>

                    <div className="result-rows">
                      <ResultRow label="Required Credits"  value={result.requiredCredits}  color="#6366f1" />
                      <ResultRow label="Current Balance"   value={result.currentBalance}   color="#22c55e" />
                      <ResultRow label="Remaining Balance" value={result.remainingBalance}  color={result.remainingBalance < 0 ? '#fb7185' : '#f59e0b'} />
                    </div>

                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 4 }}>
                      <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>
                        <strong style={{ color: 'var(--text)' }}>{candidateCount}</strong> candidates ×{' '}
                        <strong style={{ color: 'var(--text)' }}>{costPerCandidate}</strong> credits ({securityLevel}) ={' '}
                        <strong style={{ color: '#6366f1' }}>{result.requiredCredits} credits</strong>
                      </div>

                      {!result.enoughCredits && (
                        <div className="insufficient-msg">
                          You need <strong>{result.requiredCredits - result.currentBalance} more credits</strong> to proceed.
                          <Link href="/admin/credits/packs" style={{ display: 'block', marginTop: 10, textAlign: 'center', padding: '10px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, color: '#a5b4fc', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                            Buy Credits →
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}

                {/* Pricing Reference */}
                <div className="section" style={{ marginTop: 16 }}>
                  <div className="section-title" style={{ marginBottom: 12 }}>Pricing Reference</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        <th style={{ textAlign: 'left', padding: '0 0 10px', color: 'var(--muted)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Level</th>
                        <th style={{ textAlign: 'center', padding: '0 0 10px', color: 'var(--muted)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Per Candidate</th>
                        <th style={{ textAlign: 'right', padding: '0 0 10px', color: 'var(--muted)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>10 Candidates</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: 'rgba(34,197,94,0.12)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}>🔒 BASIC</span>
                        </td>
                        <td style={{ padding: '10px 0', textAlign: 'center', color: 'var(--text)', fontWeight: 700, borderBottom: '1px solid var(--border)' }}>5</td>
                        <td style={{ padding: '10px 0', textAlign: 'right', color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>50 credits</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '10px 0' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: 'rgba(167,139,250,0.12)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.3)' }}>🛡️ PRO</span>
                        </td>
                        <td style={{ padding: '10px 0', textAlign: 'center', color: 'var(--text)', fontWeight: 700 }}>10</td>
                        <td style={{ padding: '10px 0', textAlign: 'right', color: 'var(--muted)' }}>100 credits</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

function ResultRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 13, color: 'var(--muted)' }}>{label}</span>
      <span style={{ fontSize: 20, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  );
}

function EstimateStyle() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
      :root,[data-theme='dark']{--bg:#0b0d14;--surface:#13151f;--surface-2:#1a1d29;--border:#252836;--text:#edeef3;--muted:#8b8d9b;--accent:#6366f1;--accent-soft:rgba(99,102,241,0.14);}
      [data-theme='light']{--bg:#f6f7fb;--surface:#ffffff;--surface-2:#f0f1f6;--border:#e4e6ed;--text:#15171f;--muted:#6b6e7c;--accent:#6366f1;--accent-soft:rgba(99,102,241,0.10);}
      .adm-shell{display:flex;min-height:100vh;background:var(--bg);}
      .adm-main{flex:1;min-width:0;}
      .adm{font-family:'Inter',sans-serif;color:var(--text);padding:28px 32px 60px;}
      .adm-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:26px;flex-wrap:wrap;gap:12px;}
      .adm-h1{font-size:25px;font-weight:800;margin:0 0 4px;letter-spacing:-0.5px;}
      .adm-subtitle{color:var(--muted);font-size:13.5px;margin:0;}
      .btn{display:inline-flex;align-items:center;gap:6px;border-radius:9px;padding:9px 16px;font-size:13px;font-weight:600;text-decoration:none;border:1px solid transparent;cursor:pointer;transition:opacity .15s,border-color .15s;}
      .btn-secondary{background:var(--surface);border-color:var(--border);color:var(--muted);}.btn-secondary:hover{color:var(--text);border-color:var(--accent);}

      .section{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:24px;}
      .section-title{font-size:15px;font-weight:700;color:var(--text);margin:0 0 20px;}

      .field{margin-bottom:24px;}
      .field-label{display:block;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin-bottom:10px;}

      .level-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
      .level-btn{
        display:flex;flex-direction:column;align-items:center;gap:4px;
        padding:16px 12px;border-radius:12px;border:2px solid var(--border);
        background:var(--surface-2);cursor:pointer;transition:all .15s;
        font-family:inherit;
      }
      .level-btn:hover{border-color:var(--accent);}
      .level-btn.active{border-color:var(--lvl-accent,var(--accent));background:rgba(99,102,241,0.08);}
      .level-icon{font-size:22px;}
      .level-name{font-size:14px;font-weight:700;color:var(--text);}
      .level-cost{font-size:11px;color:var(--muted);}

      .slider{width:100%;accent-color:var(--accent);cursor:pointer;}

      .quick-num{padding:6px 14px;border-radius:8px;border:1px solid var(--border);background:var(--surface-2);color:var(--muted);font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s;}
      .quick-num:hover{border-color:var(--accent);color:var(--text);}
      .quick-num.active{background:var(--accent-soft);border-color:var(--accent);color:#a5b4fc;}

      .result-card{background:var(--surface);border:2px solid var(--border);border-radius:16px;padding:28px 24px;display:flex;flex-direction:column;gap:0;}
      .result-ok{border-color:rgba(34,197,94,0.4);}
      .result-err{border-color:rgba(251,113,133,0.4);}
      .result-icon{font-size:36px;margin-bottom:8px;text-align:center;}
      .result-status{font-size:18px;font-weight:800;text-align:center;margin-bottom:20px;color:var(--text);}
      .result-rows{margin-bottom:16px;}
      .insufficient-msg{font-size:13px;color:#fb7185;line-height:1.5;}

      @media(max-width:900px){.adm{padding:20px;}div[style*='grid-template-columns:1fr 1fr']{grid-template-columns:1fr !important;}}
    `}</style>
  );
}
