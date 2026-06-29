'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import AdminSidebar from '@/components/AdminSidebar';

const API = 'http://localhost:3000';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('access_token') ?? ''}` });

interface Transaction {
  id: string;
  type: string;
  credits: number;
  balanceAfter: number;
  description: string;
  referenceId?: string;
  metadata?: { codingTestId?: string; securityLevel?: string; candidateCount?: number; [k: string]: any };
  createdAt: string;
}

const TYPES = ['ALL', 'BONUS', 'PURCHASE', 'USAGE', 'ADMIN', 'REFUND'] as const;

function typeBadge(type: string) {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    BONUS:    { bg: 'rgba(34,197,94,0.12)',   color: '#4ade80', border: 'rgba(34,197,94,0.3)'   },
    PURCHASE: { bg: 'rgba(99,102,241,0.12)',  color: '#a5b4fc', border: 'rgba(99,102,241,0.3)'  },
    USAGE:    { bg: 'rgba(251,113,133,0.12)', color: '#fb7185', border: 'rgba(251,113,133,0.3)' },
    ADMIN:    { bg: 'rgba(245,158,11,0.12)',  color: '#fbbf24', border: 'rgba(245,158,11,0.3)'  },
    REFUND:   { bg: 'rgba(34,211,238,0.12)',  color: '#67e8f9', border: 'rgba(34,211,238,0.3)'  },
  };
  return map[type] ?? { bg: 'rgba(100,116,139,0.12)', color: '#94a3b8', border: 'rgba(100,116,139,0.3)' };
}

function formatDate(d: string) {
  const dt = new Date(d);
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' ' + dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export default function HistoryPage() {
  const [items, setItems]         = useState<Transaction[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch]       = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [loading, setLoading]     = useState(true);
  const [expanded, setExpanded]   = useState<Set<string>>(new Set());
  const [theme, setTheme]         = useState<'dark' | 'light'>('dark');

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

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/credits/history?page=${p}&limit=20`, { headers: h() });
      if (res.ok) {
        const d = await res.json();
        setItems(d.items ?? []);
        setTotal(d.total ?? 0);
        setTotalPages(d.totalPages ?? 1);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(page); }, [page]);

  const displayed = items.filter(t => {
    const matchType = typeFilter === 'ALL' || t.type === typeFilter;
    const matchSearch = !search.trim() ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.type.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  return (
    <>
      <HistoryStyle />
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
                  <span style={{ color: 'var(--text)' }}>History</span>
                </nav>
                <h1 className="adm-h1">📜 Transaction History</h1>
                <p className="adm-subtitle">{total} total transactions — newest first</p>
              </div>
              <Link href="/admin/credits" className="btn btn-secondary">← Back to Wallet</Link>
            </div>

            {/* Filters */}
            <div className="filters-row">
              <div className="search-box">
                <span style={{ fontSize: 14, color: 'var(--muted)' }}>🔍</span>
                <input
                  className="search-input"
                  placeholder="Search description or type…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="type-pills">
                {TYPES.map(t => (
                  <button
                    key={t}
                    className={`type-pill${typeFilter === t ? ' active' : ''}`}
                    onClick={() => setTypeFilter(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="section">
              {loading ? (
                <div>
                  {[1,2,3,4,5].map(i => (
                    <div key={i} style={{ height: 52, borderRadius: 8, background: 'var(--surface-2)', marginBottom: 8, animation: 'pulse 1.5s ease-in-out infinite' }} />
                  ))}
                </div>
              ) : displayed.length === 0 ? (
                <div className="empty-state">
                  <div style={{ fontSize: 42, marginBottom: 12 }}>📭</div>
                  <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>No transactions found</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>Try a different filter or search term.</div>
                </div>
              ) : (
                <table className="tx-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Description</th>
                      <th style={{ textAlign: 'right' }}>Credits</th>
                      <th style={{ textAlign: 'right' }}>Balance</th>
                      <th style={{ textAlign: 'right' }}>Date</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {displayed.map(tx => {
                      const b = typeBadge(tx.type);
                      const isOpen = expanded.has(tx.id);
                      const hasMeta = tx.metadata && Object.keys(tx.metadata).length > 0;
                      return (
                        <>
                          <tr key={tx.id} className="tx-row">
                            <td>
                              <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: b.bg, color: b.color, border: `1px solid ${b.border}` }}>
                                {tx.type}
                              </span>
                            </td>
                            <td style={{ color: 'var(--text)', fontSize: 13, maxWidth: 280 }}>
                              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description}</div>
                              {tx.referenceId && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, fontFamily: 'monospace' }}>ref: {tx.referenceId.slice(0, 12)}…</div>}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: tx.credits >= 0 ? '#4ade80' : '#fb7185', fontFamily: 'monospace', fontSize: 14 }}>
                              {tx.credits >= 0 ? '+' : ''}{tx.credits}
                            </td>
                            <td style={{ textAlign: 'right', color: 'var(--muted)', fontFamily: 'monospace', fontSize: 13 }}>{tx.balanceAfter}</td>
                            <td style={{ textAlign: 'right', color: 'var(--muted)', fontSize: 12, whiteSpace: 'nowrap' }}>{formatDate(tx.createdAt)}</td>
                            <td style={{ textAlign: 'right' }}>
                              {hasMeta && (
                                <button
                                  onClick={() => toggleExpand(tx.id)}
                                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 8px', fontSize: 11, color: 'var(--muted)', cursor: 'pointer', transition: 'all .15s' }}
                                >
                                  {isOpen ? '▲' : '▼'}
                                </button>
                              )}
                            </td>
                          </tr>
                          {isOpen && hasMeta && (
                            <tr key={`${tx.id}-meta`}>
                              <td colSpan={6} style={{ padding: '0 0 14px 0', borderBottom: '1px solid var(--border)' }}>
                                <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', fontSize: 12, color: 'var(--muted)', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                                  {tx.metadata?.securityLevel && <span><strong style={{ color: 'var(--text)' }}>Security Level:</strong> {tx.metadata.securityLevel}</span>}
                                  {tx.metadata?.candidateCount !== undefined && <span><strong style={{ color: 'var(--text)' }}>Candidates:</strong> {tx.metadata.candidateCount}</span>}
                                  {tx.metadata?.codingTestId && <span><strong style={{ color: 'var(--text)' }}>Test ID:</strong> <span style={{ fontFamily: 'monospace' }}>{tx.metadata.codingTestId.slice(0, 16)}…</span></span>}
                                  {Object.entries(tx.metadata ?? {})
                                    .filter(([k]) => !['securityLevel', 'candidateCount', 'codingTestId'].includes(k))
                                    .map(([k, v]) => (
                                      <span key={k}><strong style={{ color: 'var(--text)' }}>{k}:</strong> {String(v)}</span>
                                    ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
                <span style={{ color: 'var(--muted)', fontSize: 13 }}>Page {page} of {totalPages}</span>
                <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next →</button>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}

function HistoryStyle() {
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
      .btn-primary{background:var(--accent);color:#fff;}.btn-primary:hover{opacity:0.88;}
      .btn-secondary{background:var(--surface);border-color:var(--border);color:var(--muted);}.btn-secondary:hover{color:var(--text);border-color:var(--accent);}

      .filters-row{display:flex;gap:12px;align-items:center;margin-bottom:20px;flex-wrap:wrap;}
      .search-box{display:flex;align-items:center;gap:8px;background:var(--surface);border:1px solid var(--border);border-radius:9px;padding:8px 14px;flex:1;max-width:360px;transition:border-color .15s;}
      .search-box:focus-within{border-color:var(--accent);}
      .search-input{background:none;border:none;outline:none;color:var(--text);font-size:13px;font-family:inherit;width:100%;}
      .search-input::placeholder{color:var(--muted);}
      .type-pills{display:flex;gap:6px;flex-wrap:wrap;}
      .type-pill{padding:6px 14px;border-radius:20px;border:1px solid var(--border);background:var(--surface);color:var(--muted);font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;}
      .type-pill:hover{border-color:var(--accent);color:var(--text);}
      .type-pill.active{background:var(--accent-soft);border-color:var(--accent);color:#a5b4fc;}

      .section{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:24px;margin-bottom:20px;}
      .tx-table{width:100%;border-collapse:collapse;font-size:13px;}
      .tx-table th{text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);padding:0 0 12px;border-bottom:1px solid var(--border);}
      .tx-table td{padding:14px 8px 14px 0;border-bottom:1px solid var(--border);vertical-align:middle;}
      .tx-table tr:last-child td{border-bottom:none;}
      .tx-row:hover td{background:rgba(99,102,241,0.03);}
      .empty-state{text-align:center;padding:48px 24px;color:var(--muted);}
      .pagination{display:flex;align-items:center;justify-content:center;gap:16px;padding:20px 0;}
      .page-btn{padding:8px 18px;border-radius:9px;border:1px solid var(--border);background:var(--surface);color:var(--muted);font-size:13px;font-weight:600;cursor:pointer;transition:all .15s;}
      .page-btn:hover:not(:disabled){border-color:var(--accent);color:var(--text);}
      .page-btn:disabled{opacity:0.4;cursor:not-allowed;}
      @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
      @media(max-width:900px){.adm{padding:20px;}}
    `}</style>
  );
}
