'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminNavbar from '@/components/AdminNavbar';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';

interface DashboardStats {
  totalTests: number;
  totalCandidates: number;
  totalAttempts: number;
  averageScore: number;
  completionRate: number;
  pendingInvitations: number;
  completedInvitations: number;
}

interface Candidate {
  id: string;
  name: string;
  email: string;
  atsScore: number;
  averageTestScore: number;
  rankingScore: number;
}

const ACCENT = '#6366f1';
const ACCENT2 = '#22d3ee';
const SUCCESS = '#10b981';
const DANGER = '#f43f5e';

const CustomTooltipPie = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: 10,
          padding: '10px 18px',
          color: '#f1f5f9',
          fontSize: 14,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <span style={{ color: payload[0].payload.fill || '#fff', fontWeight: 700 }}>
          {payload[0].name}
        </span>
        <span style={{ marginLeft: 8 }}>{payload[0].value}</span>
      </div>
    );
  }
  return null;
};

const CustomTooltipBar = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: 10,
          padding: '10px 18px',
          color: '#f1f5f9',
          fontSize: 14,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <p style={{ marginBottom: 4, color: '#94a3b8', fontSize: 12 }}>{label}</p>
        <p style={{ color: ACCENT, fontWeight: 700 }}>{payload[0].value}</p>
      </div>
    );
  }
  return null;
};

export default function AdminPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<Candidate[]>([]);

  useEffect(() => {
    loadStats();
    loadLeaderboard();
  }, []);

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:3000/tests/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:3000/users/leaderboard', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setLeaderboard(data.slice(0, 5));
    } catch (error) {
      console.error(error);
    }
  };

  const statCards = [
    {
      title: 'Total Tests',
      value: stats?.totalTests ?? 0,
      icon: '📋',
      gradient: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
      sub: 'All active assessments',
    },
    {
      title: 'Candidates',
      value: stats?.totalCandidates ?? 0,
      icon: '👥',
      gradient: 'linear-gradient(135deg, #0ea5e9 0%, #22d3ee 100%)',
      sub: 'Registered users',
    },
    {
      title: 'Attempts',
      value: stats?.totalAttempts ?? 0,
      icon: '✏️',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
      sub: 'Total submissions',
    },
    {
      title: 'Avg. Score',
      value: `${stats?.averageScore ?? 0}%`,
      icon: '🎯',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
      sub: 'Across all tests',
    },
    {
      title: 'Completion Rate',
      value: `${stats?.completionRate ?? 0}%`,
      icon: '✅',
      gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
      sub: 'Invites completed',
    },
    {
      title: 'Pending Invites',
      value: stats?.pendingInvitations ?? 0,
      icon: '⏳',
      gradient: 'linear-gradient(135deg, #f43f5e 0%, #fb7185 100%)',
      sub: 'Awaiting response',
    },
    {
      title: 'Completed Invites',
      value: stats?.completedInvitations ?? 0,
      icon: '📬',
      gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
      sub: 'Fully finished',
    },
  ];

  const pieData = [
    { name: 'Completed', value: stats?.completedInvitations ?? 0 },
    { name: 'Pending', value: stats?.pendingInvitations ?? 0 },
  ];

  const PIE_COLORS = [SUCCESS, DANGER];

  const barData = [
    { name: 'Tests', value: stats?.totalTests ?? 0 },
    { name: 'Candidates', value: stats?.totalCandidates ?? 0 },
    { name: 'Attempts', value: stats?.totalAttempts ?? 0 },
  ];

  const quickActions = [
    {
      href: '/admin/questions',
      icon: '🧩',
      title: 'Question Bank',
      desc: 'Create, edit and manage all assessment questions.',
      accent: '#6366f1',
    },
    {
      href: '/admin/tests',
      icon: '📝',
      title: 'Tests',
      desc: 'Create tests, assign questions and review results.',
      accent: '#0ea5e9',
    },
    {
      href: '/admin/users',
      icon: '👤',
      title: 'Users',
      desc: 'Manage candidates and platform users.',
      accent: '#8b5cf6',
    },
    {
      href: '/admin/resumes',
      icon: '📄',
      title: 'Resume Analysis',
      desc: 'Review ATS scores, skills and resume insights.',
      accent: '#10b981',
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');
        .admin-root {
          font-family: 'DM Sans', sans-serif;
          background: #0f172a;
          min-height: 100vh;
          color: #f1f5f9;
        }
        .stat-card {
          border-radius: 16px;
          padding: 24px 20px;
          color: #fff;
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 24px rgba(0,0,0,0.28);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 36px rgba(0,0,0,0.38);
        }
        .stat-card::after {
          content: attr(data-icon);
          position: absolute;
          right: 16px;
          top: 16px;
          font-size: 32px;
          opacity: 0.28;
        }
        .section-card {
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 20px;
          padding: 28px;
        }
        .section-title {
          font-family: 'Syne', sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: #f1f5f9;
          margin-bottom: 20px;
          letter-spacing: -0.3px;
        }
        .quick-card {
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 16px;
          padding: 24px;
          text-decoration: none;
          display: block;
          transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
          position: relative;
          overflow: hidden;
        }
        .quick-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
        .quick-card::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          border-radius: 4px 0 0 4px;
          transition: opacity 0.2s;
          opacity: 0.7;
        }
        .quick-card:hover::before {
          opacity: 1;
        }
        .insight-item {
          border-radius: 12px;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 15px;
        }
        .activity-item {
          padding: 14px 0;
          border-bottom: 1px solid #334155;
          font-size: 14px;
          color: #94a3b8;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .activity-item:last-child {
          border-bottom: none;
        }
        .recruit-stat {
          background: #0f172a;
          border-radius: 14px;
          padding: 20px;
          text-align: center;
        }
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #0f172a;
          border: 1px solid #334155;
          border-radius: 999px;
          padding: 4px 14px;
          font-size: 12px;
          color: #94a3b8;
        }
        .badge-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: ${SUCCESS};
        }
        .shimmer-bar {
          height: 8px;
          border-radius: 999px;
          background: linear-gradient(90deg, #334155 25%, #475569 50%, #334155 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .progress-bar-bg {
          background: #0f172a;
          border-radius: 999px;
          height: 8px;
          overflow: hidden;
        }
        .progress-bar-fill {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, ${ACCENT}, ${ACCENT2});
          transition: width 1s ease;
        }
        .leaderboard-row {
          background: #0f172a;
          border: 1px solid #334155;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          text-decoration: none;
          transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
        }
        .leaderboard-row:hover {
          border-color: #6366f144;
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(0,0,0,0.3);
        }
      `}</style>
      <AdminNavbar />
      <div className="admin-root" style={{ padding: '36px 32px 60px' }}>
        {/* Header */}
        <div
          style={{
            marginBottom: 36,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #22d3ee)',
                  borderRadius: 10,
                  width: 40,
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                }}
              >
                🏠
              </span>
              <h1
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 32,
                  fontWeight: 800,
                  color: '#f1f5f9',
                  margin: 0,
                  letterSpacing: '-1px',
                }}
              >
                Admin Dashboard
              </h1>
            </div>
            <p style={{ color: '#64748b', fontSize: 15, margin: 0 }}>
              Manage tests, candidates, resumes, and platform performance.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <span className="badge">
              <span className="badge-dot" />
              Live
            </span>
            <span className="badge">
              🕒{' '}
              {new Date().toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Stat Cards */}
        {loading ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 20,
              marginBottom: 36,
            }}
          >
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                style={{ background: '#1e293b', borderRadius: 16, padding: 24, height: 110 }}
              >
                <div className="shimmer-bar" style={{ width: '60%', marginBottom: 16 }} />
                <div
                  className="shimmer-bar"
                  style={{ width: '40%', height: 28, borderRadius: 8 }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 20,
              marginBottom: 36,
            }}
          >
            {statCards.map((card, i) => (
              <div
                key={i}
                className="stat-card"
                data-icon={card.icon}
                style={{ background: card.gradient }}
              >
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    opacity: 0.82,
                    marginBottom: 10,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  {card.title}
                </p>
                <h2
                  style={{
                    fontSize: 38,
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 800,
                    margin: '0 0 6px',
                  }}
                >
                  {card.value}
                </h2>
                <p style={{ fontSize: 12, opacity: 0.7, margin: 0 }}>{card.sub}</p>
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div style={{ marginBottom: 36 }}>
          <h2
            className="section-title"
            style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 700 }}
          >
            Quick Actions
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
              gap: 18,
            }}
          >
            {quickActions.map((action) => (
              <Link key={action.href} href={action.href} className="quick-card">
                <style>{`.quick-card[href="${action.href}"]::before { background: ${action.accent}; } .quick-card[href="${action.href}"]:hover { border-color: ${action.accent}44; }`}</style>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{action.icon}</div>
                <h3
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 17,
                    fontWeight: 700,
                    color: '#f1f5f9',
                    marginBottom: 8,
                  }}
                >
                  {action.title}
                </h3>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
                  {action.desc}
                </p>
                <div
                  style={{
                    marginTop: 16,
                    color: action.accent,
                    fontSize: 12,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  Open <span style={{ fontSize: 16 }}>→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Charts */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: 24,
            marginBottom: 36,
          }}
        >
          {/* Pie Chart */}
          <div className="section-card">
            <p className="section-title">Invitation Status</p>
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={68}
                    outerRadius={108}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltipPie />} />
                  <Legend
                    formatter={(value) => (
                      <span style={{ color: '#94a3b8', fontSize: 13 }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 28, marginTop: 8 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: SUCCESS }}>
                  {stats?.completedInvitations ?? 0}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>Completed</div>
              </div>
              <div style={{ width: 1, background: '#334155' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: DANGER }}>
                  {stats?.pendingInvitations ?? 0}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>Pending</div>
              </div>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="section-card">
            <p className="section-title">Platform Metrics</p>
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} barSize={44}>
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={ACCENT} stopOpacity={1} />
                      <stop offset="100%" stopColor={ACCENT2} stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#64748b', fontSize: 13 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    content={<CustomTooltipBar />}
                    cursor={{ fill: '#334155', radius: 8 }}
                  />
                  <Bar dataKey="value" fill="url(#barGrad)" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Insights + Activity */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: 24,
            marginBottom: 36,
          }}
        >
          {/* AI Insights */}
          <div className="section-card">
            <p className="section-title">AI Insights</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                {
                  icon: '📈',
                  label: 'Average Score',
                  value: `${stats?.averageScore ?? 0}%`,
                  bg: '#10b98118',
                  color: SUCCESS,
                },
                {
                  icon: '🎯',
                  label: 'Completion Rate',
                  value: `${stats?.completionRate ?? 0}%`,
                  bg: '#6366f118',
                  color: ACCENT,
                },
                {
                  icon: '⏳',
                  label: 'Pending Invites',
                  value: stats?.pendingInvitations ?? 0,
                  bg: '#f43f5e18',
                  color: DANGER,
                },
                {
                  icon: '👥',
                  label: 'Candidates',
                  value: stats?.totalCandidates ?? 0,
                  bg: '#0ea5e918',
                  color: ACCENT2,
                },
              ].map((item, i) => (
                <div key={i} className="insight-item" style={{ background: item.bg }}>
                  <span style={{ fontSize: 20 }}>{item.icon}</span>
                  <span style={{ flex: 1, color: '#94a3b8', fontSize: 14 }}>{item.label}</span>
                  <span
                    style={{
                      fontFamily: "'Syne', sans-serif",
                      fontWeight: 800,
                      fontSize: 18,
                      color: item.color,
                    }}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
              {/* Progress bars */}
              <div style={{ marginTop: 8 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 6,
                    fontSize: 13,
                    color: '#64748b',
                  }}
                >
                  <span>Completion Progress</span>
                  <span style={{ color: '#f1f5f9' }}>{stats?.completionRate ?? 0}%</span>
                </div>
                <div className="progress-bar-bg">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${stats?.completionRate ?? 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="section-card">
            <p className="section-title">Recent Activity</p>
            {[
              { icon: '📩', text: 'Test invitations sent to candidates', time: 'Just now' },
              { icon: '👤', text: 'New candidates joined the platform', time: '2m ago' },
              { icon: '📝', text: 'Assessment submissions recorded', time: '15m ago' },
              { icon: '📄', text: 'Resume analysis reports generated', time: '1h ago' },
              { icon: '🔔', text: 'Scores updated for recent test', time: '3h ago' },
            ].map((item, i) => (
              <div key={i} className="activity-item">
                <span style={{ fontSize: 18, minWidth: 28 }}>{item.icon}</span>
                <span style={{ flex: 1, color: '#cbd5e1', fontSize: 14 }}>{item.text}</span>
                <span style={{ color: '#475569', fontSize: 12, whiteSpace: 'nowrap' }}>
                  {item.time}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recruitment Overview */}
        <div className="section-card">
          <p className="section-title">Recruitment Overview</p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: 16,
            }}
          >
            {[
              { label: 'Candidates', value: stats?.totalCandidates, icon: '👥', color: ACCENT2 },
              { label: 'Tests Conducted', value: stats?.totalTests, icon: '📋', color: ACCENT },
              {
                label: 'Attempts Recorded',
                value: stats?.totalAttempts,
                icon: '✏️',
                color: '#8b5cf6',
              },
              {
                label: 'Avg. Score',
                value: `${stats?.averageScore ?? 0}%`,
                icon: '🎯',
                color: '#f59e0b',
              },
            ].map((item, i) => (
              <div key={i} className="recruit-stat">
                <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
                <div
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 32,
                    fontWeight: 800,
                    color: item.color,
                  }}
                >
                  {item.value}
                </div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Candidates Leaderboard */}
        <div className="section-card" style={{ marginTop: '24px' }}>
          <p className="section-title">🏆 Top Candidates</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {leaderboard.map((candidate, index) => (
              <Link
                key={candidate.id}
                href={`/admin/users/${candidate.id}`}
                style={{ textDecoration: 'none' }}
              >
                <div className="leaderboard-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background:
                          index === 0
                            ? 'linear-gradient(135deg, #f59e0b, #fbbf24)'
                            : index === 1
                            ? 'linear-gradient(135deg, #94a3b8, #cbd5e1)'
                            : index === 2
                            ? 'linear-gradient(135deg, #b45309, #d97706)'
                            : 'linear-gradient(135deg, #334155, #475569)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: "'Syne', sans-serif",
                        fontWeight: 800,
                        fontSize: 14,
                        color: '#fff',
                        flexShrink: 0,
                      }}
                    >
                      #{index + 1}
                    </div>
                    <div>
                      <div style={{ color: '#f8fafc', fontWeight: 700, fontSize: 15 }}>
                        {candidate.name}
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: 13 }}>{candidate.email}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        color: '#22c55e',
                        fontWeight: 800,
                        fontSize: 20,
                        fontFamily: "'Syne', sans-serif",
                      }}
                    >
                      {candidate.rankingScore}
                    </div>
                    <div style={{ color: '#64748b', fontSize: 12 }}>Ranking Score</div>
                  </div>
                </div>
              </Link>
            ))}
            {leaderboard.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  color: '#475569',
                  padding: '32px 0',
                  fontSize: 14,
                }}
              >
                No candidates available yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}