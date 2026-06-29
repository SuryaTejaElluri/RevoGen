'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminSidebar from '@/components/AdminSidebar';

const API = 'http://localhost:3000';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('access_token') ?? ''}` });

interface Pack {
  id: string;
  name: string;
  credits: number;
  bonusCredits: number;
  price: number;
  description?: string;
  isPopular: boolean;
  displayOrder: number;
}

const PACK_COLORS = [
  { accent: '#6366f1', glow: 'rgba(99,102,241,0.2)',   border: 'rgba(99,102,241,0.3)'  },
  { accent: '#22c55e', glow: 'rgba(34,197,94,0.2)',    border: 'rgba(34,197,94,0.3)'   },
  { accent: '#f59e0b', glow: 'rgba(245,158,11,0.2)',   border: 'rgba(245,158,11,0.3)'  },
  { accent: '#a78bfa', glow: 'rgba(167,139,250,0.2)',  border: 'rgba(167,139,250,0.3)' },
  { accent: '#22d3ee', glow: 'rgba(34,211,238,0.2)',   border: 'rgba(34,211,238,0.3)'  },
  { accent: '#fb7185', glow: 'rgba(251,113,133,0.2)',  border: 'rgba(251,113,133,0.3)' },
];

export default function PacksPage() {
  const [packs, setPacks]   = useState<Pack[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast]   = useState<string | null>(null);
  const [theme, setTheme]   = useState<'dark' | 'light'>('dark');

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

  useEffect(() => {
    fetch(`${API}/credits/packs`, { headers: h() })
      .then(r => r.json())
      .then(d => setPacks(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleBuy = () => {
    setToast('Payment Gateway Coming Soon 🚧');
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <>
      <PacksStyle />
      <div className="adm-shell">
        <AdminSidebar theme={theme} onToggleTheme={toggleTheme} />
        <div className="adm-main">
          <div className="adm">

            {/* Toast */}
            {toast && (
              <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 20px', fontSize: 14, color: 'var(--text)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', gap: 10, backdropFilter: 'blur(12px)' }}>
                🚧 {toast}
              </div>
            )}

            {/* Header */}
            <div className="adm-header">
              <div>
                <nav style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6, display: 'flex', gap: 6, alignItems: 'center' }}>
                  <Link href="/admin/credits" style={{ color: 'var(--muted)', textDecoration: 'none' }}>Credits</Link>
                  <span>/</span>
                  <span style={{ color: 'var(--text)' }}>Packs</span>
                </nav>
                <h1 className="adm-h1">📦 Credit Packs</h1>
                <p className="adm-subtitle">Purchase credits to assign coding assessments to candidates</p>
              </div>
              <Link href="/admin/credits" className="btn btn-secondary">← Back to Wallet</Link>
            </div>

            {/* Coming Soon Banner */}
            <div style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(251,113,133,0.1))', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 14, padding: '16px 20px', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 22 }}>🚧</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fbbf24', marginBottom: 2 }}>Payment Gateway Coming Soon</div>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>Browse available packs below. Razorpay integration will be live in Phase 6 — buy buttons are ready.</div>
              </div>
            </div>

            {loading ? (
              <div className="packs-grid">
                {[1,2,3,4].map(i => (
                  <div key={i} className="pack-card-skeleton" />
                ))}
              </div>
            ) : packs.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: 42, marginBottom: 14 }}>📦</div>
                <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--text)', marginBottom: 6 }}>No credit packs available</div>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>Check back soon — packs will be added by the administrator.</div>
              </div>
            ) : (
              <div className="packs-grid">
                {packs.map((pack, idx) => {
                  const color = PACK_COLORS[idx % PACK_COLORS.length];
                  const totalCredits = pack.credits + pack.bonusCredits;
                  return (
                    <div
                      key={pack.id}
                      className={`pack-card${pack.isPopular ? ' pack-popular' : ''}`}
                      style={{ '--pack-accent': color.accent, '--pack-glow': color.glow, '--pack-border': color.border } as any}
                    >
                      {pack.isPopular && (
                        <div className="popular-badge">⭐ Most Popular</div>
                      )}
                      <div className="pack-glow" />

                      <div className="pack-name" style={{ color: color.accent }}>{pack.name}</div>

                      <div className="pack-credits">
                        <span style={{ fontSize: 48, fontWeight: 800, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{totalCredits}</span>
                        <span className="pack-credits-label">Credits</span>
                      </div>

                      {pack.bonusCredits > 0 && (
                        <div className="pack-bonus">
                          🎁 Includes <strong>{pack.bonusCredits} bonus credits</strong>
                        </div>
                      )}

                      {pack.description && (
                        <p className="pack-desc">{pack.description}</p>
                      )}

                      <div className="pack-features">
                        <div className="pack-feature">✓ {pack.credits} base credits</div>
                        {pack.bonusCredits > 0 && <div className="pack-feature">✓ +{pack.bonusCredits} bonus credits</div>}
                        <div className="pack-feature">✓ Never expires</div>
                        <div className="pack-feature">✓ Instant activation</div>
                      </div>

                      <div className="pack-price">₹{pack.price.toLocaleString('en-IN')}</div>

                      <button className="pack-buy-btn" onClick={handleBuy} style={{ background: color.accent }}>
                        Buy Now — Coming Soon
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}

function PacksStyle() {
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

      .packs-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:20px;}

      .pack-card{
        position:relative;overflow:hidden;
        background:var(--surface);
        border:1px solid var(--pack-border,var(--border));
        border-radius:20px;padding:28px 24px;
        display:flex;flex-direction:column;gap:12px;
        transition:transform .2s,box-shadow .2s;
      }
      .pack-card:hover{transform:translateY(-4px);box-shadow:0 12px 40px rgba(0,0,0,0.4);}
      .pack-popular{border-width:2px;}
      .pack-glow{position:absolute;top:-40px;right:-40px;width:160px;height:160px;border-radius:50%;background:var(--pack-glow,rgba(99,102,241,0.15));filter:blur(40px);pointer-events:none;}

      .popular-badge{position:absolute;top:16px;right:16px;background:linear-gradient(135deg,#f59e0b,#fbbf24);color:#000;font-size:11px;font-weight:700;padding:4px 10px;border-radius:20px;}

      .pack-name{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;position:relative;}
      .pack-credits{display:flex;align-items:baseline;gap:8px;position:relative;}
      .pack-credits-label{font-size:16px;font-weight:600;color:var(--muted);}
      .pack-bonus{font-size:13px;color:var(--muted);background:var(--surface-2);border:1px solid var(--border);border-radius:8px;padding:6px 10px;}
      .pack-desc{font-size:13px;color:var(--muted);line-height:1.5;margin:0;}

      .pack-features{display:flex;flex-direction:column;gap:6px;margin:4px 0;}
      .pack-feature{font-size:13px;color:var(--muted);display:flex;align-items:center;gap:6px;}

      .pack-price{font-size:28px;font-weight:800;color:var(--text);position:relative;font-variant-numeric:tabular-nums;}

      .pack-buy-btn{
        display:flex;align-items:center;justify-content:center;
        width:100%;padding:12px;border:none;border-radius:10px;
        color:#fff;font-size:14px;font-weight:700;font-family:inherit;
        cursor:pointer;transition:opacity .15s,transform .1s;position:relative;
      }
      .pack-buy-btn:hover{opacity:0.88;transform:translateY(-1px);}
      .pack-buy-btn:active{transform:translateY(0);}

      .pack-card-skeleton{height:420px;border-radius:20px;background:var(--surface);border:1px solid var(--border);animation:pulse 1.5s ease-in-out infinite;}

      .empty-state{text-align:center;padding:80px 24px;color:var(--muted);}
      @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
      @media(max-width:900px){.adm{padding:20px;}}
    `}</style>
  );
}
