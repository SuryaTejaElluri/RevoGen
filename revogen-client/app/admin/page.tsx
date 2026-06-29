'use client';

import { useEffect, useMemo, useState, ReactNode, CSSProperties } from 'react';
import Link from 'next/link';
import AdminSidebar, { Theme } from '@/components/AdminSidebar' 

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MCQStats {
  totalTests: number;
  totalCandidates: number;
  totalAttempts: number;
  averageScore: string;
  completionRate: string;
  pendingInvitations: number;
  completedInvitations: number;
  recentAttempts: {
    id: string;
    percentage: number;
    createdAt: string;
    user: { name: string; email: string };
    test: { title: string };
  }[];
}

interface CodingStats {
  totalCodingTests: number;
  totalCodingAttempts: number;
  avgCodingScore: string;
  pendingCodingInvites: number;
  completedCodingInvites: number;
  highRiskCount: number;
  recentAttempts: {
    id: string;
    candidateEmail: string;
    testTitle: string;
    status: string;
    percentage: number;
    createdAt: string;
  }[];
}

interface Candidate {
  id: string;
  name: string;
  email: string;
  rankingScore: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// Brand palette — tuned to read correctly on both dark and light surfaces
const C = {
  accent: '#6366f1', accent2: '#22d3ee',
  success: '#22c55e', danger: '#fb7185',
  warning: '#f5a524', purple: '#a78bfa',
};

function StatCard({
  title, value, sub, icon, color,
}: { title: string; value: string | number; sub: string; icon: ReactNode; color: string }) {
  return (
    <div className="stat-card" style={{ '--glow': color } as CSSProperties}>
      <div className="stat-card-glow" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
        <div>
          <div className="stat-title">{title}</div>
          <div className="stat-value">{value}</div>
          <div className="stat-sub">{sub}</div>
        </div>
        <span className="stat-icon" style={{ color }}>{icon}</span>
      </div>
    </div>
  );
}

const TooltipPie = ({ active, payload }: any) => active && payload?.length ? (
  <div className="chart-tooltip">
    <span style={{ color: payload[0].payload.fill, fontWeight: 700 }}>{payload[0].name}</span>
    <span style={{ marginLeft: 8 }}>{payload[0].value}</span>
  </div>
) : null;

const TooltipBar = ({ active, payload, label }: any) => active && payload?.length ? (
  <div className="chart-tooltip">
    <div style={{ color: 'var(--muted)', fontSize: 11, marginBottom: 2 }}>{label}</div>
    <div style={{ color: C.accent, fontWeight: 700 }}>{payload[0].value}</div>
  </div>
) : null;

// ─── Small inline icon set for stat cards / quick actions ─────────────────

const SI = {
  grid: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  doc: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M14 3v5h5M9 13h6M9 17h6" />
    </svg>
  ),
  code: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 8-4 4 4 4M15 8l4 4-4 4" />
    </svg>
  ),
  pencil: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  ),
  users: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3.2" /><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
      <circle cx="17.5" cy="8.5" r="2.6" /><path d="M16 14.1c2.6.4 4.5 2.3 4.5 5.4" />
    </svg>
  ),
  target: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.2" fill="currentColor" />
    </svg>
  ),
  bars: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 21V10M12 21V4M19 21v-7" />
    </svg>
  ),
  clock: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" />
    </svg>
  ),
  check: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 13 4 4L19 7" />
    </svg>
  ),
  alert: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    </svg>
  ),
  plus: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [mcq, setMcq] = useState<MCQStats | null>(null);
  const [coding, setCoding] = useState<CodingStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<Theme>('dark');

  // Theme: default dark, persisted, syncs <html> attribute for global styling hooks
  useEffect(() => {
    const saved = (localStorage.getItem('adm_theme') as Theme | null) ?? 'dark';
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  const toggleTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('adm_theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const h = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch('http://localhost:3000/tests/dashboard/stats', { headers: h }).then(r => r.json()),
      fetch('http://localhost:3000/coding-tests/dashboard/stats', { headers: h }).then(r => r.json()),
      fetch('http://localhost:3000/users/my-leaderboard', { headers: h }).then(r => r.json()),
    ]).then(([mcqData, codingData, lbData]) => {
      setMcq(mcqData);
      setCoding(codingData);
      setLeaderboard(Array.isArray(lbData) ? lbData.slice(0, 5) : []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // ── Derived ──
  const totalTests   = (mcq?.totalTests ?? 0) + (coding?.totalCodingTests ?? 0);
  const totalAttempts = (mcq?.totalAttempts ?? 0) + (coding?.totalCodingAttempts ?? 0);
  const pendingAll   = (mcq?.pendingInvitations ?? 0) + (coding?.pendingCodingInvites ?? 0);
  const completedAll = (mcq?.completedInvitations ?? 0) + (coding?.completedCodingInvites ?? 0);

  const pieData = [
    { name: 'Completed', value: completedAll },
    { name: 'Pending',   value: pendingAll   },
  ];

  const barData = [
    { name: 'MCQ Tests',     value: mcq?.totalTests ?? 0 },
    { name: 'Coding Tests',  value: coding?.totalCodingTests ?? 0 },
    { name: 'MCQ Attempts',  value: mcq?.totalAttempts ?? 0 },
    { name: 'Code Attempts', value: coding?.totalCodingAttempts ?? 0 },
    { name: 'Candidates',    value: mcq?.totalCandidates ?? 0 },
  ];

  // Merge recent activity from both MCQ and Coding
  const mcqActivity = (mcq?.recentAttempts ?? []).map(a => ({
    key: a.id, icon: SI.doc, type: 'MCQ',
    label: `${a.user?.name ?? a.user?.email} completed "${a.test?.title}"`,
    score: `${a.percentage.toFixed(1)}%`,
    time: a.createdAt,
  }));
  const codingActivity = (coding?.recentAttempts ?? []).map(a => ({
    key: a.id, icon: SI.code, type: 'Coding',
    label: `${a.candidateEmail} ${a.status === 'COMPLETED' ? 'completed' : 'started'} "${a.testTitle}"`,
    score: a.status === 'COMPLETED' ? `${a.percentage.toFixed(1)}%` : a.status,
    time: a.createdAt,
  }));
  const recentActivity = useMemo(() =>
    [...mcqActivity, ...codingActivity]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 8),
    [mcq, coding]
  );

  const quickActions = [
    { href: '/admin/tests/new',            icon: SI.doc,    title: 'Create MCQ Test',    accent: C.accent   },
    { href: '/admin/coding-tests/create',  icon: SI.code,   title: 'Create Coding Test', accent: C.purple   },
    { href: '/admin/tests',                icon: SI.grid,   title: 'All Assessments',    accent: C.accent2  },
    { href: '/admin/questions',            icon: SI.bars,   title: 'Question Bank',      accent: C.warning  },
  ];

  return (
    <>
      <GlobalStyle />
      <div className="adm-shell">
        <AdminSidebar theme={theme} onToggleTheme={toggleTheme} />

        <div className="adm-main">
          {loading ? (
            <div className="adm-loading">
              <div className="topbar-skeleton" />
              <div className="stat-grid">
                {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton-card" />)}
              </div>
            </div>
          ) : (
            <div className="adm">

              {/* ── Header ── */}
              <div className="adm-header">
                <div>
                  <h1 className="adm-h1">Dashboard</h1>
                  <p className="adm-subtitle">
                    MCQ + Coding assessments · {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <Link href="/admin/tests/new" className="btn btn-primary">
                    {SI.plus} New Test
                  </Link>
                  <Link href="/admin/tests" className="btn btn-secondary">
                    View All
                  </Link>
                </div>
              </div>

              {/* ── Combined Stat Cards ── */}
              <div className="stat-grid">
                <StatCard title="Total Tests"      value={totalTests}                         sub="MCQ + Coding"            icon={SI.grid}   color={C.accent}   />
                <StatCard title="MCQ Tests"        value={mcq?.totalTests ?? 0}               sub="Your assessments"        icon={SI.doc}    color="#818cf8"    />
                <StatCard title="Coding Tests"     value={coding?.totalCodingTests ?? 0}      sub="Your assessments"        icon={SI.code}   color={C.purple}   />
                <StatCard title="Total Attempts"   value={totalAttempts}                       sub="All submissions"         icon={SI.pencil} color={C.accent2}  />
                <StatCard title="Candidates"       value={mcq?.totalCandidates ?? 0}          sub="Registered users"        icon={SI.users}  color={C.success}  />
                <StatCard title="Avg MCQ Score"    value={`${mcq?.averageScore ?? 0}%`}       sub="Across your MCQ tests"   icon={SI.target} color={C.warning}  />
                <StatCard title="Avg Coding Score" value={`${coding?.avgCodingScore ?? 0}%`}  sub="Coding completions"      icon={SI.bars}   color="#f97316"    />
                <StatCard title="Pending Invites"  value={pendingAll}                          sub="Awaiting response"       icon={SI.clock}  color={C.danger}   />
                <StatCard title="Completion Rate"  value={`${mcq?.completionRate ?? 0}%`}     sub="MCQ invites"             icon={SI.check}  color={C.success}  />
                <StatCard title="High Risk"        value={coding?.highRiskCount ?? 0}         sub="Coding candidates"       icon={SI.alert}  color={C.danger}   />
              </div>

              {/* ── Quick Actions ── */}
              <div className="adm-block">
                <div className="section-title">Quick Actions</div>
                <div className="qa-grid">
                  {quickActions.map(a => (
                    <Link key={a.href} href={a.href} className="qa-card" style={{ '--accent': a.accent } as CSSProperties}>
                      <div className="qa-icon" style={{ color: a.accent }}>{a.icon}</div>
                      <div className="qa-title">{a.title}</div>
                      <div className="qa-open" style={{ color: a.accent }}>Open →</div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* ── Charts Row ── */}
              <div className="grid-2col">

                {/* Invitation Status Pie */}
                <div className="section">
                  <div className="section-title">Invitation Status (All Tests)</div>
                  <div style={{ height: 240 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={96} paddingAngle={4} dataKey="value" stroke="none">
                          <Cell fill={C.success} />
                          <Cell fill={C.danger}  />
                        </Pie>
                        <Tooltip content={<TooltipPie />} />
                        <Legend formatter={v => <span style={{ color: 'var(--muted)', fontSize: 12 }}>{v}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 4 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: C.success }}>{completedAll}</div>
                      <div className="stat-sub" style={{ marginTop: 0 }}>Completed</div>
                    </div>
                    <div style={{ width: 1, background: 'var(--border)' }} />
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: C.danger }}>{pendingAll}</div>
                      <div className="stat-sub" style={{ marginTop: 0 }}>Pending</div>
                    </div>
                  </div>
                </div>

                {/* Platform Metrics Bar */}
                <div className="section">
                  <div className="section-title">Platform Metrics</div>
                  <div style={{ height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData} barSize={36}>
                        <defs>
                          <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={C.accent} />
                            <stop offset="100%" stopColor={C.accent2} stopOpacity={0.7} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<TooltipBar />} cursor={{ fill: 'var(--surface-2)', radius: 8 }} />
                        <Bar dataKey="value" fill="url(#bg)" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* ── Recent Activity + Leaderboard ── */}
              <div className="grid-2col">

                {/* Real Recent Activity */}
                <div className="section">
                  <div className="section-head">
                    <div className="section-title" style={{ margin: 0 }}>Recent Submissions</div>
                    <Link href="/admin/tests" className="link-accent">View all →</Link>
                  </div>
                  {recentActivity.length === 0 ? (
                    <div className="empty-state">No submissions yet.</div>
                  ) : (
                    recentActivity.map(item => (
                      <div key={item.key} className="activity-row">
                        <span className="activity-icon">{item.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="activity-label">{item.label}</div>
                          <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                            <span className="activity-tag">{item.type}</span>
                            <span style={{ fontSize: 11, color: C.success, fontWeight: 700 }}>{item.score}</span>
                          </div>
                        </div>
                        <span className="activity-time">{timeAgo(item.time)}</span>
                      </div>
                    ))
                  )}
                </div>

                {/* Top Candidates Leaderboard */}
                <div className="section">
                  <div className="section-head">
                    <div className="section-title" style={{ margin: 0 }}>Top Candidates</div>
                  </div>
                  {leaderboard.length === 0 ? (
                    <div className="empty-state">No invited candidates have attempted a test yet.</div>
                  ) : (
                    leaderboard.map((c, i) => (
                      <div key={c.id} className="lb-row">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div className="lb-rank" style={{
                            background: i === 0 ? 'linear-gradient(135deg,#f5a524,#fbbf24)' : i === 1 ? 'linear-gradient(135deg,#94a3b8,#cbd5e1)' : i === 2 ? 'linear-gradient(135deg,#b45309,#d97706)' : 'var(--surface-2)',
                          }}>#{i + 1}</div>
                          <div>
                            <div className="lb-name">{c.name}</div>
                            <div className="lb-email">{c.email}</div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ color: C.success, fontWeight: 800, fontSize: 18 }}>{c.rankingScore}%</div>
                          <div className="stat-sub" style={{ marginTop: 0 }}>Avg Test Score</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* ── MCQ vs Coding Breakdown ── */}
              <div className="grid-2col">

                <div className="section">
                  <div className="section-title">MCQ Assessment Summary</div>
                  {[
                    { label: 'Tests Created',        value: mcq?.totalTests ?? 0,            color: C.accent   },
                    { label: 'Total Attempts',       value: mcq?.totalAttempts ?? 0,         color: C.accent2  },
                    { label: 'Average Score',        value: `${mcq?.averageScore ?? 0}%`,    color: C.warning  },
                    { label: 'Completion Rate',      value: `${mcq?.completionRate ?? 0}%`,  color: C.success  },
                    { label: 'Pending Invitations',  value: mcq?.pendingInvitations ?? 0,    color: C.danger   },
                    { label: 'Completed Invitations',value: mcq?.completedInvitations ?? 0, color: C.success  },
                  ].map(r => (
                    <div key={r.label} className="summary-row">
                      <span style={{ color: 'var(--muted)' }}>{r.label}</span>
                      <span style={{ color: r.color, fontWeight: 700 }}>{r.value}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 16 }}>
                    <Link href="/admin/tests" className="btn btn-block btn-primary">Manage MCQ Tests</Link>
                  </div>
                </div>

                <div className="section">
                  <div className="section-title">Coding Assessment Summary</div>
                  {[
                    { label: 'Tests Created',         value: coding?.totalCodingTests ?? 0,    color: C.purple  },
                    { label: 'Total Attempts',         value: coding?.totalCodingAttempts ?? 0, color: C.accent2 },
                    { label: 'Average Score',          value: `${coding?.avgCodingScore ?? 0}%`,color: C.warning },
                    { label: 'High Risk Candidates',   value: coding?.highRiskCount ?? 0,       color: C.danger  },
                    { label: 'Pending Invitations',    value: coding?.pendingCodingInvites ?? 0,color: C.danger  },
                    { label: 'Completed Invitations',  value: coding?.completedCodingInvites ?? 0, color: C.success },
                  ].map(r => (
                    <div key={r.label} className="summary-row">
                      <span style={{ color: 'var(--muted)' }}>{r.label}</span>
                      <span style={{ color: r.color, fontWeight: 700 }}>{r.value}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 16 }}>
                    <Link href="/admin/coding-tests" className="btn btn-block" style={{ background: C.purple, color: '#fff' }}>Manage Coding Tests</Link>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Global styles (theme tokens + component classes) ──────────────────────

function GlobalStyle() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

      :root,
      [data-theme='dark'] {
        --bg: #0b0d14;
        --surface: #13151f;
        --surface-2: #1a1d29;
        --border: #252836;
        --text: #edeef3;
        --muted: #8b8d9b;
        --accent: ${C.accent};
        --accent-2: ${C.accent2};
        --accent-soft: rgba(99,102,241,0.14);
        --danger: ${C.danger};
        --danger-soft: rgba(251,113,133,0.12);
      }
      [data-theme='light'] {
        --bg: #f6f7fb;
        --surface: #ffffff;
        --surface-2: #f0f1f6;
        --border: #e4e6ed;
        --text: #15171f;
        --muted: #6b6e7c;
        --accent: ${C.accent};
        --accent-2: ${C.accent2};
        --accent-soft: rgba(99,102,241,0.10);
        --danger: ${C.danger};
        --danger-soft: rgba(251,113,133,0.10);
      }

      .adm-shell { display: flex; min-height: 100vh; background: var(--bg); }
      .adm-main { flex: 1; min-width: 0; }
      .adm { font-family: 'Inter', sans-serif; color: var(--text); padding: 28px 32px 40px; }

      .adm-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 26px; flex-wrap: wrap; gap: 12px; }
      .adm-h1 { font-size: 25px; font-weight: 800; margin: 0 0 4px; letter-spacing: -0.5px; }
      .adm-subtitle { color: var(--muted); font-size: 13.5px; margin: 0; }

      .btn { display: inline-flex; align-items: center; gap: 6px; border-radius: 9px; padding: 9px 16px; font-size: 13px; font-weight: 600; text-decoration: none; border: 1px solid transparent; cursor: pointer; transition: opacity .15s, border-color .15s; }
      .btn svg { width: 15px; height: 15px; }
      .btn-primary { background: var(--accent); color: #fff; }
      .btn-primary:hover { opacity: 0.88; }
      .btn-secondary { background: var(--surface); border-color: var(--border); color: var(--muted); }
      .btn-secondary:hover { color: var(--text); border-color: var(--accent); }
      .btn-block { display: flex; justify-content: center; width: 100%; }

      .stat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; margin-bottom: 28px; }
      .stat-card { position: relative; overflow: hidden; background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 18px 20px; }
      .stat-card-glow { position: absolute; top: -30px; right: -30px; width: 90px; height: 90px; border-radius: 50%; background: var(--glow); opacity: 0.16; filter: blur(6px); pointer-events: none; }
      .stat-title { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; margin-bottom: 8px; }
      .stat-value { font-size: 28px; font-weight: 800; color: var(--text); line-height: 1; font-variant-numeric: tabular-nums; }
      .stat-sub { font-size: 12px; color: var(--muted); margin-top: 6px; }
      .stat-icon { display: flex; opacity: 0.9; }

      .adm-block { margin-bottom: 28px; }
      .section { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 24px; }
      .section-title { font-size: 15px; font-weight: 700; color: var(--text); margin: 0 0 18px; }
      .section-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
      .link-accent { font-size: 12px; color: var(--accent); text-decoration: none; font-weight: 600; }

      .qa-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 12px; }
      .qa-card { display: block; background: var(--surface); border: 1px solid var(--border); border-top: 3px solid var(--accent); border-radius: 12px; padding: 18px; text-decoration: none; transition: border-color .18s, transform .15s; }
      .qa-card:hover { transform: translateY(-2px); }
      .qa-icon { margin-bottom: 10px; display: flex; }
      .qa-title { font-size: 13px; font-weight: 700; color: var(--text); }
      .qa-open { font-size: 11px; margin-top: 6px; font-weight: 600; }

      .grid-2col { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 20px; margin-bottom: 28px; }

      .activity-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--border); font-size: 13px; }
      .activity-row:last-child { border-bottom: none; }
      .activity-icon { display: flex; color: var(--accent); flex-shrink: 0; }
      .activity-label { color: var(--text); font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; opacity: 0.88; }
      .activity-tag { font-size: 11px; background: var(--surface-2); color: var(--muted); border-radius: 4px; padding: 1px 6px; }
      .activity-time { font-size: 11px; color: var(--muted); white-space: nowrap; flex-shrink: 0; }

      .lb-row { background: var(--bg); border: 1px solid var(--border); border-radius: 10px; padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
      .lb-rank { width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; color: #fff; }
      .lb-name { color: var(--text); font-weight: 600; font-size: 14px; }
      .lb-email { color: var(--muted); font-size: 12px; }

      .summary-row { display: flex; justify-content: space-between; padding: 9px 0; border-bottom: 1px solid var(--border); font-size: 13px; }
      .summary-row:last-child { border-bottom: none; }

      .empty-state { text-align: center; color: var(--muted); padding: 24px 0; font-size: 13px; }
      .chart-tooltip { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 8px 14px; font-size: 13px; color: var(--text); }

      .adm-loading { padding: 28px 32px; }
      .topbar-skeleton { height: 40px; width: 240px; border-radius: 10px; background: var(--surface-2); margin-bottom: 28px; animation: pulse 1.5s ease-in-out infinite; }
      .skeleton-card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; height: 110px; animation: pulse 1.5s ease-in-out infinite; }
      @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

      @media (max-width: 900px) {
        .adm { padding: 20px; }
      }
    `}</style>
  );
}