'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminNavbar from '@/components/AdminNavbar';
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

const C = {
  accent: '#6366f1', accent2: '#22d3ee',
  success: '#10b981', danger: '#f43f5e',
  warning: '#f59e0b', purple: '#8b5cf6',
};

function StatCard({
  title, value, sub, icon, color,
}: { title: string; value: string | number; sub: string; icon: string; color: string }) {
  return (
    <div style={{
      background: '#1e293b', border: `1px solid #334155`,
      borderTop: `3px solid ${color}`, borderRadius: 14,
      padding: '18px 20px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 8 }}>{title}</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: '#f1f5f9', lineHeight: 1 }}>{value}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>{sub}</div>
        </div>
        <span style={{ fontSize: 24, opacity: 0.7 }}>{icon}</span>
      </div>
    </div>
  );
}

const TooltipPie = ({ active, payload }: any) => active && payload?.length ? (
  <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '8px 14px', fontSize: 13, color: '#f1f5f9' }}>
    <span style={{ color: payload[0].payload.fill, fontWeight: 700 }}>{payload[0].name}</span>
    <span style={{ marginLeft: 8 }}>{payload[0].value}</span>
  </div>
) : null;

const TooltipBar = ({ active, payload, label }: any) => active && payload?.length ? (
  <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '8px 14px', fontSize: 13, color: '#f1f5f9' }}>
    <div style={{ color: '#64748b', fontSize: 11, marginBottom: 2 }}>{label}</div>
    <div style={{ color: C.accent, fontWeight: 700 }}>{payload[0].value}</div>
  </div>
) : null;

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [mcq, setMcq] = useState<MCQStats | null>(null);
  const [coding, setCoding] = useState<CodingStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const h = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch('http://localhost:3000/tests/dashboard/stats', { headers: h }).then(r => r.json()),
      fetch('http://localhost:3000/coding-tests/dashboard/stats', { headers: h }).then(r => r.json()),
      fetch('http://localhost:3000/users/leaderboard', { headers: h }).then(r => r.json()),
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
    key: a.id, icon: '📝', type: 'MCQ',
    label: `${a.user?.name ?? a.user?.email} completed "${a.test?.title}"`,
    score: `${a.percentage.toFixed(1)}%`,
    time: a.createdAt,
  }));
  const codingActivity = (coding?.recentAttempts ?? []).map(a => ({
    key: a.id, icon: '💻', type: 'Coding',
    label: `${a.candidateEmail} ${a.status === 'COMPLETED' ? 'completed' : 'started'} "${a.testTitle}"`,
    score: a.status === 'COMPLETED' ? `${a.percentage.toFixed(1)}%` : a.status,
    time: a.createdAt,
  }));
  const recentActivity = [...mcqActivity, ...codingActivity]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 8);

  const quickActions = [
    { href: '/admin/tests/new',            icon: '📝', title: 'Create MCQ Test',    accent: C.accent   },
    { href: '/admin/coding-tests/create',  icon: '💻', title: 'Create Coding Test', accent: C.purple   },
    { href: '/admin/tests',                icon: '🗂️', title: 'All Assessments',    accent: C.accent2  },
    { href: '/admin/questions',            icon: '🧩', title: 'Question Bank',      accent: C.warning  },
    { href: '/admin/users',                icon: '👥', title: 'Manage Users',       accent: C.success  },
    { href: '/admin/questions/new',        icon: '➕', title: 'Add Question',       accent: C.danger   },
  ];

  if (loading) {
    return (
      <>
        <AdminNavbar />
        <div style={{ background: '#0f172a', minHeight: '100vh', padding: '40px 32px', color: '#f1f5f9' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ background: '#1e293b', borderRadius: 14, height: 110, animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        .adm { font-family:'Inter',sans-serif; background:#0f172a; min-height:100vh; color:#f1f5f9; }
        .section { background:#1e293b; border:1px solid #334155; border-radius:16px; padding:24px; }
        .section-title { font-size:16px; font-weight:700; color:#f1f5f9; margin:0 0 18px; }
        a.qa-card { display:block; background:#1e293b; border:1px solid #334155; border-radius:12px; padding:18px; text-decoration:none; transition:border-color .18s,transform .15s; }
        a.qa-card:hover { transform:translateY(-2px); }
        .activity-row { display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid #1e293b; font-size:13px; }
        .activity-row:last-child { border-bottom:none; }
        .lb-row { background:#0f172a; border:1px solid #334155; border-radius:10px; padding:14px 16px; display:flex; align-items:center; justify-content:space-between; text-decoration:none; transition:border-color .2s; margin-bottom:10px; }
        .lb-row:hover { border-color:#6366f144; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
      `}</style>
      <AdminNavbar />

      <div className="adm" style={{ padding: '32px' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.5px' }}>Admin Dashboard</h1>
            <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
              MCQ + Coding assessments · {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link href="/admin/tests/new" style={{ background: C.accent, color: '#fff', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
              + New Test
            </Link>
            <Link href="/admin/tests" style={{ background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
              View All
            </Link>
          </div>
        </div>

        {/* ── Combined Stat Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16, marginBottom: 28 }}>
          <StatCard title="Total Tests"      value={totalTests}                         sub="MCQ + Coding"            icon="🗂️" color={C.accent}   />
          <StatCard title="MCQ Tests"        value={mcq?.totalTests ?? 0}               sub="Your assessments"        icon="📝" color="#818cf8"    />
          <StatCard title="Coding Tests"     value={coding?.totalCodingTests ?? 0}      sub="Your assessments"        icon="💻" color={C.purple}   />
          <StatCard title="Total Attempts"   value={totalAttempts}                       sub="All submissions"         icon="✏️" color={C.accent2}  />
          <StatCard title="Candidates"       value={mcq?.totalCandidates ?? 0}          sub="Registered users"        icon="👥" color={C.success}  />
          <StatCard title="Avg MCQ Score"    value={`${mcq?.averageScore ?? 0}%`}       sub="Across your MCQ tests"   icon="🎯" color={C.warning}  />
          <StatCard title="Avg Coding Score" value={`${coding?.avgCodingScore ?? 0}%`}  sub="Coding completions"      icon="📊" color="#f97316"    />
          <StatCard title="Pending Invites"  value={pendingAll}                          sub="Awaiting response"       icon="⏳" color={C.danger}   />
          <StatCard title="Completion Rate"  value={`${mcq?.completionRate ?? 0}%`}     sub="MCQ invites"             icon="✅" color={C.success}  />
          <StatCard title="High Risk"        value={coding?.highRiskCount ?? 0}         sub="Coding candidates"       icon="🚨" color={C.danger}   />
        </div>

        {/* ── Quick Actions ── */}
        <div style={{ marginBottom: 28 }}>
          <div className="section-title" style={{ marginBottom: 14 }}>Quick Actions</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', gap: 12 }}>
            {quickActions.map(a => (
              <Link key={a.href} href={a.href} className="qa-card" style={{ borderTop: `3px solid ${a.accent}` }}>
                <div style={{ fontSize: 22, marginBottom: 8 }}>{a.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>{a.title}</div>
                <div style={{ fontSize: 11, color: a.accent, marginTop: 6, fontWeight: 600 }}>Open →</div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Charts Row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(360px,1fr))', gap: 20, marginBottom: 28 }}>

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
                  <Legend formatter={v => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 4 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.success }}>{completedAll}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Completed</div>
              </div>
              <div style={{ width: 1, background: '#334155' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.danger }}>{pendingAll}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Pending</div>
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
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<TooltipBar />} cursor={{ fill: '#334155', radius: 8 }} />
                  <Bar dataKey="value" fill="url(#bg)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ── Recent Activity + Leaderboard ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(360px,1fr))', gap: 20, marginBottom: 28 }}>

          {/* Real Recent Activity */}
          <div className="section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div className="section-title" style={{ margin: 0 }}>Recent Submissions</div>
              <Link href="/admin/tests" style={{ fontSize: 12, color: C.accent, textDecoration: 'none', fontWeight: 600 }}>View all →</Link>
            </div>
            {recentActivity.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#475569', padding: '24px 0', fontSize: 13 }}>No submissions yet.</div>
            ) : (
              recentActivity.map(item => (
                <div key={item.key} className="activity-row">
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#cbd5e1', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                      <span style={{ fontSize: 11, background: '#334155', color: '#64748b', borderRadius: 4, padding: '1px 6px' }}>{item.type}</span>
                      <span style={{ fontSize: 11, color: C.success, fontWeight: 700 }}>{item.score}</span>
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: '#475569', whiteSpace: 'nowrap', flexShrink: 0 }}>{timeAgo(item.time)}</span>
                </div>
              ))
            )}
          </div>

          {/* Top Candidates Leaderboard */}
          <div className="section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div className="section-title" style={{ margin: 0 }}>🏆 Top Candidates</div>
              <Link href="/admin/users" style={{ fontSize: 12, color: C.accent, textDecoration: 'none', fontWeight: 600 }}>View all →</Link>
            </div>
            {leaderboard.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#475569', padding: '24px 0', fontSize: 13 }}>No candidates yet.</div>
            ) : (
              leaderboard.map((c, i) => (
                <Link key={c.id} href={`/admin/users/${c.id}`} className="lb-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                      background: i === 0 ? 'linear-gradient(135deg,#f59e0b,#fbbf24)' : i === 1 ? 'linear-gradient(135deg,#94a3b8,#cbd5e1)' : i === 2 ? 'linear-gradient(135deg,#b45309,#d97706)' : '#334155',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 800, color: '#fff',
                    }}>#{i + 1}</div>
                    <div>
                      <div style={{ color: '#f8fafc', fontWeight: 600, fontSize: 14 }}>{c.name}</div>
                      <div style={{ color: '#64748b', fontSize: 12 }}>{c.email}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: C.success, fontWeight: 800, fontSize: 18 }}>{c.rankingScore}</div>
                    <div style={{ color: '#64748b', fontSize: 11 }}>Ranking Score</div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* ── MCQ vs Coding Breakdown ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          <div className="section">
            <div className="section-title">📝 MCQ Assessment Summary</div>
            {[
              { label: 'Tests Created',       value: mcq?.totalTests ?? 0,            color: C.accent   },
              { label: 'Total Attempts',       value: mcq?.totalAttempts ?? 0,         color: C.accent2  },
              { label: 'Average Score',        value: `${mcq?.averageScore ?? 0}%`,    color: C.warning  },
              { label: 'Completion Rate',      value: `${mcq?.completionRate ?? 0}%`,  color: C.success  },
              { label: 'Pending Invitations',  value: mcq?.pendingInvitations ?? 0,    color: C.danger   },
              { label: 'Completed Invitations',value: mcq?.completedInvitations ?? 0, color: C.success  },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #334155', fontSize: 13 }}>
                <span style={{ color: '#94a3b8' }}>{r.label}</span>
                <span style={{ color: r.color, fontWeight: 700 }}>{r.value}</span>
              </div>
            ))}
            <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
              <Link href="/admin/tests" style={{ flex: 1, textAlign: 'center', background: C.accent, color: '#fff', borderRadius: 8, padding: '8px 0', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>Manage Tests</Link>
              <Link href="/admin/tests/new" style={{ flex: 1, textAlign: 'center', background: '#334155', color: '#94a3b8', borderRadius: 8, padding: '8px 0', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>+ New MCQ</Link>
            </div>
          </div>

          <div className="section">
            <div className="section-title">💻 Coding Assessment Summary</div>
            {[
              { label: 'Tests Created',        value: coding?.totalCodingTests ?? 0,    color: C.purple  },
              { label: 'Total Attempts',        value: coding?.totalCodingAttempts ?? 0, color: C.accent2 },
              { label: 'Average Score',         value: `${coding?.avgCodingScore ?? 0}%`,color: C.warning },
              { label: 'High Risk Candidates',  value: coding?.highRiskCount ?? 0,       color: C.danger  },
              { label: 'Pending Invitations',   value: coding?.pendingCodingInvites ?? 0,color: C.danger  },
              { label: 'Completed Invitations', value: coding?.completedCodingInvites ?? 0, color: C.success },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #334155', fontSize: 13 }}>
                <span style={{ color: '#94a3b8' }}>{r.label}</span>
                <span style={{ color: r.color, fontWeight: 700 }}>{r.value}</span>
              </div>
            ))}
            <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
              <Link href="/admin/tests" style={{ flex: 1, textAlign: 'center', background: C.purple, color: '#fff', borderRadius: 8, padding: '8px 0', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>Manage Tests</Link>
              <Link href="/admin/coding-tests/create" style={{ flex: 1, textAlign: 'center', background: '#334155', color: '#94a3b8', borderRadius: 8, padding: '8px 0', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>+ New Coding</Link>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
