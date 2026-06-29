'use client';
import { API_BASE_URL } from '@/lib/api';

import { useEffect, useState, CSSProperties } from 'react';
import Link from 'next/link';
import AdminSidebar from '@/components/AdminSidebar';


const token = () => (typeof window !== 'undefined' ? localStorage.getItem('access_token') ?? '' : '');
const h = () => ({ Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' });

// ─── Types ────────────────────────────────────────────────────────────────────

interface Wallet {
  balance: number;
  walletId: string | null;
  updatedAt: string | null;
}

interface Transaction {
  id: string;
  type: string;
  credits: number;
  balanceAfter: number;
  description: string;
  metadata?: any;
  createdAt: string;
}

interface HistoryResponse {
  items: Transaction[];
  total: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

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

// ─── Component ────────────────────────────────────────────────────────────────

export default function CreditsPage() {
  const [wallet, setWallet]         = useState<Wallet | null>(null);
  const [history, setHistory]       = useState<Transaction[]>([]);
  const [totalTx, setTotalTx]       = useState(0);
  const [loading, setLoading]       = useState(true);
  const [theme, setTheme]           = useState<'dark' | 'light'>('dark');

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

  const load = async () => {
    setLoading(true);
    try {
      const [wRes, hRes] = await Promise.all([
        fetch(`${API_BASE_URL}/credits`, { headers: h() }),
        fetch(`${API_BASE_URL}/credits/history?page=1&limit=10`, { headers: h() }),
      ]);
      if (wRes.ok) setWallet(await wRes.json());
      if (hRes.ok) {
        const d: HistoryResponse = await hRes.json();
        setHistory(d.items ?? []);
        setTotalTx(d.total ?? 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const creditsUsed = history
    .filter(t => t.type === 'USAGE')
    .reduce((s, t) => s + Math.abs(t.credits), 0);

  const lastTx = history[0];

  return (
    <>
      <GlobalStyle />
      <div className="adm-shell">
        <AdminSidebar theme={theme} onToggleTheme={toggleTheme} />
        <div className="adm-main">
          {loading ? <CreditsPageSkeleton /> : (
            <div className="adm">

              {/* ── Header ── */}
              <div className="adm-header">
                <div>
                  <h1 className="adm-h1">🪙 Revo Credits</h1>
                  <p className="adm-subtitle">Manage your credit wallet and track usage</p>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <Link href="/admin/credits/packs" className="btn btn-secondary">View Packs</Link>
                  <Link href="/admin/credits/history" className="btn btn-primary">Full History</Link>
                </div>
              </div>

              {/* ── Wallet Hero Card ── */}
              <div className="wallet-hero">
                <div className="wallet-glow" />
                <div className="wallet-content">
                  <div className="wallet-label">Available Balance</div>
                  <div className="wallet-balance">
                    <span className="wallet-coin">🪙</span>
                    <span>{wallet?.balance ?? 0}</span>
                    <span className="wallet-unit">Credits</span>
                  </div>
                  {wallet?.updatedAt && (
                    <div className="wallet-updated">Last updated {timeAgo(wallet.updatedAt)}</div>
                  )}
                </div>
                <div className="wallet-actions">
                  <Link href="/admin/credits/packs" className="wallet-btn-primary">
                    Buy Credits
                    <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '2px 8px', marginLeft: 6 }}>Coming Soon</span>
                  </Link>
                  <Link href="/admin/credits/estimate" className="wallet-btn-secondary">
                    Estimate Cost
                  </Link>
                </div>
              </div>

              {/* ── Quick Stats ── */}
              <div className="stat-grid" style={{ marginTop: 24, marginBottom: 28 }}>
                <StatCard title="Available Credits"  value={wallet?.balance ?? 0}  sub="Current balance"  color="#6366f1" icon="🪙" />
                <StatCard title="Credits Used"       value={creditsUsed}            sub="Coding assignments" color="#fb7185" icon="📉" />
                <StatCard title="Last Transaction"   value={lastTx ? `${lastTx.credits > 0 ? '+' : ''}${lastTx.credits}` : '—'}  sub={lastTx ? timeAgo(lastTx.createdAt) : 'No transactions'} color="#22c55e" icon="🔄" />
                <StatCard title="Total Transactions" value={totalTx}               sub="All time"        color="#f59e0b" icon="📊" />
              </div>

              {/* ── Quick Actions ── */}
              <div className="section" style={{ marginBottom: 24 }}>
                <div className="section-title">Quick Actions</div>
                <div className="qa-grid">
                  <QuickAction href="/admin/credits/estimate" icon="🧮" title="Estimate Cost"    accent="#6366f1" desc="Plan assignment spend" />
                  <QuickAction href="/admin/credits/history"  icon="📜" title="Transaction History" accent="#22c55e" desc="View all transactions" />
                  <QuickAction href="/admin/credits/packs"    icon="📦" title="Credit Packs"     accent="#f59e0b" desc="Browse available packs" />
                  <QuickAction href="/admin/credits/packs"    icon="💳" title="Buy Credits"      accent="#a78bfa" desc="Coming soon" comingSoon />
                </div>
              </div>

              {/* ── Recent Transactions ── */}
              <div className="section">
                <div className="section-head">
                  <div className="section-title" style={{ margin: 0 }}>Recent Transactions</div>
                  <Link href="/admin/credits/history" className="link-accent">View all →</Link>
                </div>

                {history.length === 0 ? (
                  <div className="empty-state">
                    <div style={{ fontSize: 42, marginBottom: 14 }}>📭</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>No transactions found</div>
                    <div style={{ fontSize: 13, color: 'var(--muted)' }}>Transactions will appear here once you assign coding tests or receive credits.</div>
                  </div>
                ) : (
                  <table className="tx-table">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Description</th>
                        <th style={{ textAlign: 'right' }}>Credits</th>
                        <th style={{ textAlign: 'right' }}>Balance After</th>
                        <th style={{ textAlign: 'right' }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map(tx => {
                        const b = typeBadge(tx.type);
                        return (
                          <tr key={tx.id}>
                            <td>
                              <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: b.bg, color: b.color, border: `1px solid ${b.border}` }}>
                                {tx.type}
                              </span>
                            </td>
                            <td style={{ color: 'var(--text)', fontSize: 13 }}>{tx.description}</td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: tx.credits >= 0 ? '#4ade80' : '#fb7185', fontFamily: 'monospace' }}>
                              {tx.credits >= 0 ? '+' : ''}{tx.credits}
                            </td>
                            <td style={{ textAlign: 'right', color: 'var(--muted)', fontFamily: 'monospace' }}>{tx.balanceAfter}</td>
                            <td style={{ textAlign: 'right', color: 'var(--muted)', fontSize: 12, whiteSpace: 'nowrap' }}>{timeAgo(tx.createdAt)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ title, value, sub, color, icon }: { title: string; value: string | number; sub: string; color: string; icon: string }) {
  return (
    <div className="stat-card" style={{ '--glow': color } as CSSProperties}>
      <div className="stat-card-glow" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
        <div>
          <div className="stat-title">{title}</div>
          <div className="stat-value">{value}</div>
          <div className="stat-sub">{sub}</div>
        </div>
        <span style={{ fontSize: 22 }}>{icon}</span>
      </div>
    </div>
  );
}

function QuickAction({ href, icon, title, accent, desc, comingSoon }: { href: string; icon: string; title: string; accent: string; desc: string; comingSoon?: boolean }) {
  return (
    <Link href={href} className="qa-card" style={{ '--accent': accent } as CSSProperties}>
      <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
      <div className="qa-title">
        {title}
        {comingSoon && <span style={{ fontSize: 10, background: 'rgba(167,139,250,0.15)', color: '#a78bfa', borderRadius: 20, padding: '2px 7px', marginLeft: 6, fontWeight: 600 }}>Soon</span>}
      </div>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{desc}</div>
      <div className="qa-open" style={{ color: accent }}>Open →</div>
    </Link>
  );
}

function CreditsPageSkeleton() {
  return (
    <div className="adm">
      <div style={{ height: 40, width: 200, borderRadius: 10, background: 'var(--surface-2)', marginBottom: 28, animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div style={{ height: 180, borderRadius: 16, background: 'var(--surface)', marginBottom: 24, animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div className="stat-grid" style={{ marginBottom: 28 }}>
        {[1,2,3,4].map(i => <div key={i} className="stat-card" style={{ height: 110, animation: 'pulse 1.5s ease-in-out infinite' }} />)}
      </div>
      <div style={{ height: 300, borderRadius: 16, background: 'var(--surface)', animation: 'pulse 1.5s ease-in-out infinite' }} />
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function GlobalStyle() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

      :root, [data-theme='dark'] {
        --bg: #0b0d14; --surface: #13151f; --surface-2: #1a1d29;
        --border: #252836; --text: #edeef3; --muted: #8b8d9b;
        --accent: #6366f1; --accent-soft: rgba(99,102,241,0.14);
      }
      [data-theme='light'] {
        --bg: #f6f7fb; --surface: #ffffff; --surface-2: #f0f1f6;
        --border: #e4e6ed; --text: #15171f; --muted: #6b6e7c;
        --accent: #6366f1; --accent-soft: rgba(99,102,241,0.10);
      }

      .adm-shell { display: flex; min-height: 100vh; background: var(--bg); }
      .adm-main  { flex: 1; min-width: 0; }
      .adm { font-family: 'Inter', sans-serif; color: var(--text); padding: 28px 32px 60px; }

      .adm-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 26px; flex-wrap: wrap; gap: 12px; }
      .adm-h1 { font-size: 25px; font-weight: 800; margin: 0 0 4px; letter-spacing: -0.5px; }
      .adm-subtitle { color: var(--muted); font-size: 13.5px; margin: 0; }

      .btn { display: inline-flex; align-items: center; gap: 6px; border-radius: 9px; padding: 9px 16px; font-size: 13px; font-weight: 600; text-decoration: none; border: 1px solid transparent; cursor: pointer; transition: opacity .15s, border-color .15s; }
      .btn-primary   { background: var(--accent); color: #fff; }
      .btn-primary:hover { opacity: 0.88; }
      .btn-secondary { background: var(--surface); border-color: var(--border); color: var(--muted); }
      .btn-secondary:hover { color: var(--text); border-color: var(--accent); }

      /* ── Wallet Hero ── */
      .wallet-hero {
        position: relative;
        overflow: hidden;
        background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%);
        border: 1px solid rgba(99,102,241,0.35);
        border-radius: 20px;
        padding: 32px 36px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
        flex-wrap: wrap;
      }
      .wallet-glow {
        position: absolute; top: -60px; right: -60px;
        width: 220px; height: 220px; border-radius: 50%;
        background: rgba(99,102,241,0.3); filter: blur(60px);
        pointer-events: none;
      }
      .wallet-content { position: relative; }
      .wallet-label { font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.6); margin-bottom: 8px; }
      .wallet-balance { display: flex; align-items: baseline; gap: 10px; }
      .wallet-coin { font-size: 32px; }
      .wallet-balance span:nth-child(2) { font-size: 56px; font-weight: 800; color: #fff; line-height: 1; font-variant-numeric: tabular-nums; }
      .wallet-unit { font-size: 20px; font-weight: 500; color: rgba(255,255,255,0.5); }
      .wallet-updated { font-size: 12px; color: rgba(255,255,255,0.4); margin-top: 8px; }
      .wallet-actions { display: flex; gap: 10px; flex-wrap: wrap; position: relative; }
      .wallet-btn-primary {
        display: inline-flex; align-items: center;
        background: rgba(255,255,255,0.15); color: #fff;
        border: 1px solid rgba(255,255,255,0.25); border-radius: 10px;
        padding: 10px 20px; font-size: 14px; font-weight: 600;
        text-decoration: none; cursor: pointer; backdrop-filter: blur(4px);
        transition: background .15s; white-space: nowrap;
      }
      .wallet-btn-primary:hover { background: rgba(255,255,255,0.22); }
      .wallet-btn-secondary {
        display: inline-flex; align-items: center;
        background: transparent; color: rgba(255,255,255,0.7);
        border: 1px solid rgba(255,255,255,0.15); border-radius: 10px;
        padding: 10px 20px; font-size: 14px; font-weight: 600;
        text-decoration: none; transition: all .15s; white-space: nowrap;
      }
      .wallet-btn-secondary:hover { color: #fff; border-color: rgba(255,255,255,0.35); }

      /* ── Stat Cards ── */
      .stat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
      .stat-card {
        position: relative; overflow: hidden;
        background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 18px 20px;
        transition: border-color .2s, transform .15s;
      }
      .stat-card:hover { border-color: var(--accent); transform: translateY(-2px); }
      .stat-card-glow { position: absolute; top: -30px; right: -30px; width: 90px; height: 90px; border-radius: 50%; background: var(--glow); opacity: 0.16; filter: blur(6px); pointer-events: none; }
      .stat-title { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; font-weight: 600; margin-bottom: 8px; }
      .stat-value { font-size: 28px; font-weight: 800; color: var(--text); line-height: 1; font-variant-numeric: tabular-nums; }
      .stat-sub   { font-size: 12px; color: var(--muted); margin-top: 6px; }

      /* ── Section ── */
      .section { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 24px; }
      .section-title { font-size: 15px; font-weight: 700; color: var(--text); margin: 0 0 18px; }
      .section-head  { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }
      .link-accent   { font-size: 12px; color: var(--accent); text-decoration: none; font-weight: 600; }
      .link-accent:hover { opacity: 0.8; }

      /* ── Quick Actions ── */
      .qa-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
      .qa-card {
        display: block; background: var(--surface); border: 1px solid var(--border);
        border-top: 3px solid var(--accent); border-radius: 12px; padding: 18px;
        text-decoration: none; transition: border-color .18s, transform .15s;
      }
      .qa-card:hover { transform: translateY(-2px); }
      .qa-title { font-size: 13px; font-weight: 700; color: var(--text); }
      .qa-open  { font-size: 11px; margin-top: 8px; font-weight: 600; }

      /* ── Transaction Table ── */
      .tx-table { width: 100%; border-collapse: collapse; font-size: 13px; }
      .tx-table th { text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); padding: 0 0 12px; border-bottom: 1px solid var(--border); }
      .tx-table td { padding: 14px 0; border-bottom: 1px solid var(--border); vertical-align: middle; }
      .tx-table tr:last-child td { border-bottom: none; }
      .tx-table tbody tr:hover td { background: rgba(99,102,241,0.04); }

      .empty-state { text-align: center; padding: 48px 24px; color: var(--muted); }

      @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      @media (max-width:900px) { .adm { padding: 20px; } .wallet-hero { padding: 24px; } .wallet-balance span:nth-child(2) { font-size: 40px; } }
    `}</style>
  );
}
