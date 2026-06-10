'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

// ─── Theme Definitions ────────────────────────────────────────────────────────

const themes = {
  light: {
    bg: '#F0F2F8',
    surface: '#FFFFFF',
    surfaceAlt: '#F7F8FC',
    border: '#E2E6F0',
    text: '#0F1523',
    textMuted: '#6B7280',
    textSubtle: '#9CA3AF',
    accent: '#4F6EF7',
    accentSoft: '#EEF1FE',
    success: '#10B981',
    successSoft: '#ECFDF5',
    warning: '#F59E0B',
    warningSoft: '#FFFBEB',
    danger: '#EF4444',
    dangerSoft: '#FEF2F2',
    cardShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
    cardShadowHover: '0 8px 32px rgba(79,110,247,0.12)',
    navBg: '#FFFFFF',
    gradientStart: '#4F6EF7',
    gradientEnd: '#7C3AED',
  },
  dark: {
    bg: '#0B0E1A',
    surface: '#141827',
    surfaceAlt: '#1A1F33',
    border: '#252C45',
    text: '#E8ECFD',
    textMuted: '#8891B4',
    textSubtle: '#4A5178',
    accent: '#6B8BFF',
    accentSoft: '#1A2040',
    success: '#34D399',
    successSoft: '#0D2B23',
    warning: '#FBBF24',
    warningSoft: '#2B2010',
    danger: '#F87171',
    dangerSoft: '#2B1215',
    cardShadow: '0 1px 3px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.3)',
    cardShadowHover: '0 8px 32px rgba(107,139,255,0.2)',
    navBg: '#141827',
    gradientStart: '#6B8BFF',
    gradientEnd: '#A78BFA',
  },
};

// ─── Mock trend data ───────────────────────────────────────────────────────────

const trendData = [
  { month: 'Jan', score: 62, exams: 2 },
  { month: 'Feb', score: 68, exams: 3 },
  { month: 'Mar', score: 74, exams: 4 },
  { month: 'Apr', score: 71, exams: 3 },
  { month: 'May', score: 80, exams: 5 },
  { month: 'Jun', score: 87, exams: 6 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({
  cx, cy, midAngle, innerRadius, outerRadius, percent,
}: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return percent > 0.08 ? (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  ) : null;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label, value, icon, color, colorSoft, theme,
}: {
  label: string; value: string | number; icon: string;
  color: string; colorSoft: string; theme: typeof themes.light;
}) {
  return (
    <div style={{
      background: theme.surface,
      border: `1px solid ${theme.border}`,
      borderRadius: '16px',
      padding: '24px',
      boxShadow: theme.cardShadow,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'default',
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = theme.cardShadowHover;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = theme.cardShadow;
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: theme.textMuted, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</span>
        <div style={{
          width: 40, height: 40, borderRadius: '10px',
          background: colorSoft, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '20px',
        }}>{icon}</div>
      </div>
      <div style={{ fontSize: '36px', fontWeight: 800, color: theme.text, lineHeight: 1, fontFamily: "'DM Mono', monospace" }}>{value}</div>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        fontSize: '12px', fontWeight: 600, color: color,
        background: colorSoft, padding: '3px 8px', borderRadius: '20px', alignSelf: 'flex-start',
      }}>
        <span>↑</span> Active
      </div>
    </div>
  );
}

function ResumeCard({ dashboard, theme, router }: { dashboard: any; theme: typeof themes.light; router: any }) {
  const score = dashboard.atsScore ?? 0;
  const arc = (score / 100) * 283;

  return (
    <div style={{
      background: theme.surface,
      border: `1px solid ${theme.border}`,
      borderRadius: '16px',
      padding: '28px',
      boxShadow: theme.cardShadow,
      display: 'flex',
      alignItems: 'center',
      gap: '32px',
      flexWrap: 'wrap',
    }}>
      <div style={{ position: 'relative', width: 100, height: 100, flexShrink: 0 }}>
        <svg width="100" height="100" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke={theme.border} strokeWidth="8" />
          <circle
            cx="50" cy="50" r="45" fill="none"
            stroke={score >= 70 ? theme.success : score >= 40 ? theme.warning : theme.danger}
            strokeWidth="8"
            strokeDasharray={`${arc} 283`}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
            style={{ transition: 'stroke-dasharray 1s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: '22px', fontWeight: 800, color: theme.text, fontFamily: "'DM Mono', monospace" }}>{score}</span>
          <span style={{ fontSize: '10px', color: theme.textMuted, fontWeight: 600, letterSpacing: '0.05em' }}>ATS</span>
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 160 }}>
        <h2 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 700, color: theme.text }}>Resume Status</h2>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600,
          color: dashboard.resumeUploaded ? theme.success : theme.danger,
          background: dashboard.resumeUploaded ? theme.successSoft : theme.dangerSoft,
          padding: '4px 10px', borderRadius: '20px', marginBottom: '12px',
        }}>
          {dashboard.resumeUploaded ? '✓ Uploaded' : '✗ Not Uploaded'}
        </div>
        <p style={{ margin: 0, fontSize: '13px', color: theme.textMuted, lineHeight: 1.5 }}>
          {score >= 70
            ? 'Your resume is well-optimized for ATS systems.'
            : 'Upload or improve your resume to increase your ATS score.'}
        </p>
      </div>
      <button
        onClick={() => router.push('/resume')}
        style={{
          background: `linear-gradient(135deg, ${theme.gradientStart}, ${theme.gradientEnd})`,
          color: '#fff', border: 'none', borderRadius: '10px',
          padding: '10px 20px', fontWeight: 700, fontSize: '14px',
          cursor: 'pointer', whiteSpace: 'nowrap', letterSpacing: '0.02em',
          boxShadow: `0 4px 14px ${theme.accent}40`,
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
      >
        {dashboard.resumeUploaded ? 'Update Resume' : 'Upload Resume'}
      </button>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<any>(null);
  const [isDark, setIsDark] = useState(false);

  const theme = isDark ? themes.dark : themes.light;

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { router.push('/login'); return; }

    fetch('http://localhost:3000/dashboard', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) { localStorage.removeItem('access_token'); router.push('/login'); return; }
        setDashboard(data);
      })
      .catch(console.error);
  }, [router]);

  if (!dashboard) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: theme.bg, fontFamily: "'DM Sans', sans-serif",
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            border: `3px solid ${theme.border}`,
            borderTopColor: theme.accent,
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p style={{ color: theme.textMuted, fontWeight: 500, margin: 0 }}>Loading your dashboard…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const pieData = [
    { name: 'Completed', value: dashboard.completedAssessments ?? 0, color: theme.success },
    {
      name: 'Remaining',
      value: Math.max(0, (dashboard.assignedAssessments ?? 0) - (dashboard.completedAssessments ?? 0)),
      color: theme.accent,
    },
    { name: 'Practice', value: dashboard.practiceExamsTaken ?? 0, color: theme.warning },
  ];

  const quickActions = [
    { label: 'Upload Resume', icon: '📄', path: '/resume', color: theme.accent, colorSoft: theme.accentSoft },
    { label: 'Practice Exams', icon: '📝', path: '/practice', color: theme.success, colorSoft: theme.successSoft },
    { label: 'My Assessments', icon: '📊', path: '/results', color: theme.warning, colorSoft: theme.warningSoft },
  ];

  return (
    <>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .dash-card {
          animation: fadeUp 0.4s ease both;
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: theme.bg, transition: 'background 0.3s, color 0.3s' }}>
        <Navbar />

        {/* Top bar */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: theme.navBg,
          borderBottom: `1px solid ${theme.border}`,
          padding: '12px 32px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: theme.cardShadow,
        }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: theme.text, letterSpacing: '-0.02em' }}>Dashboard</h1>
            <p style={{ fontSize: '13px', color: theme.textMuted, marginTop: 2 }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Theme toggle */}
          <button
            onClick={() => setIsDark(d => !d)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: theme.surfaceAlt, border: `1px solid ${theme.border}`,
              borderRadius: '50px', padding: '6px 14px',
              cursor: 'pointer', color: theme.text, fontWeight: 600, fontSize: '13px',
              transition: 'all 0.2s', boxShadow: theme.cardShadow,
            }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = theme.cardShadowHover)}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = theme.cardShadow)}
          >
            <span style={{ fontSize: '16px' }}>{isDark ? '☀️' : '🌙'}</span>
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>

        {/* Main content */}
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Welcome banner */}
          <div className="dash-card" style={{
            background: `linear-gradient(135deg, ${theme.gradientStart} 0%, ${theme.gradientEnd} 100%)`,
            borderRadius: '20px', padding: '32px 36px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: '16px',
            boxShadow: `0 8px 32px ${theme.accent}40`,
            animationDelay: '0ms',
          }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '13px', fontWeight: 600, marginBottom: '8px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Welcome back
              </p>
              <h2 style={{ color: '#fff', fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
                Ready to level up? 🚀
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginTop: '8px', maxWidth: 400 }}>
                You have {Math.max(0, (dashboard.assignedAssessments ?? 0) - (dashboard.completedAssessments ?? 0))} pending assessments. Keep the momentum going!
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {quickActions.map(action => (
                <button
                  key={action.path}
                  onClick={() => router.push(action.path)}
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(10px)',
                    color: '#fff', border: '1px solid rgba(255,255,255,0.25)',
                    borderRadius: '10px', padding: '10px 18px',
                    fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    transition: 'background 0.2s',
                    letterSpacing: '0.01em',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
                >
                  {action.icon} {action.label}
                </button>
              ))}
            </div>
          </div>

          {/* Resume Card */}
          <div className="dash-card" style={{ animationDelay: '60ms' }}>
            <ResumeCard dashboard={dashboard} theme={theme} router={router} />
          </div>

          {/* Stats Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            {[
              { label: 'Assigned', value: dashboard.assignedAssessments ?? 0, icon: '🎯', color: theme.accent, colorSoft: theme.accentSoft, delay: '80ms' },
              { label: 'Completed', value: dashboard.completedAssessments ?? 0, icon: '✅', color: theme.success, colorSoft: theme.successSoft, delay: '120ms' },
              { label: 'Practice Taken', value: dashboard.practiceExamsTaken ?? 0, icon: '📝', color: theme.warning, colorSoft: theme.warningSoft, delay: '160ms' },
              { label: 'ATS Score', value: `${dashboard.atsScore ?? 0}%`, icon: '⚡', color: theme.danger, colorSoft: theme.dangerSoft, delay: '200ms' },
            ].map((stat) => (
              <div key={stat.label} className="dash-card" style={{ animationDelay: stat.delay }}>
                <StatCard
                  label={stat.label}
                  value={stat.value}
                  icon={stat.icon}
                  color={stat.color}
                  colorSoft={stat.colorSoft}
                  theme={theme}
                />
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>

            {/* Pie Chart */}
            <div className="dash-card" style={{
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              borderRadius: '16px', padding: '24px',
              boxShadow: theme.cardShadow,
              animationDelay: '220ms',
            }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: theme.text, marginBottom: '4px' }}>Assessment Breakdown</h3>
              <p style={{ fontSize: '13px', color: theme.textMuted, marginBottom: '20px' }}>Distribution across categories</p>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%" cy="50%"
                    innerRadius={55} outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    labelLine={false}
                    label={renderCustomLabel}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: theme.surface,
                      border: `1px solid ${theme.border}`,
                      borderRadius: '10px',
                      color: theme.text,
                      fontSize: '13px',
                      boxShadow: theme.cardShadow,
                    }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => (
                      <span style={{ color: theme.textMuted, fontSize: '12px', fontWeight: 600 }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Area Chart */}
            <div className="dash-card" style={{
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              borderRadius: '16px', padding: '24px',
              boxShadow: theme.cardShadow,
              animationDelay: '260ms',
            }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: theme.text, marginBottom: '4px' }}>Score Trend</h3>
              <p style={{ fontSize: '13px', color: theme.textMuted, marginBottom: '20px' }}>Monthly ATS score progression</p>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trendData} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={theme.accent} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={theme.accent} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.border} vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: theme.textMuted, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: theme.textMuted, fontSize: 12 }} axisLine={false} tickLine={false} domain={[50, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: theme.surface,
                      border: `1px solid ${theme.border}`,
                      borderRadius: '10px',
                      color: theme.text,
                      fontSize: '13px',
                      boxShadow: theme.cardShadow,
                    }}
                  />
                  <Area
                    type="monotone" dataKey="score"
                    stroke={theme.accent} strokeWidth={2.5}
                    fill="url(#scoreGrad)"
                    dot={{ fill: theme.accent, r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="dash-card" style={{
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: '16px', padding: '24px',
            boxShadow: theme.cardShadow,
            animationDelay: '300ms',
          }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: theme.text, marginBottom: '4px' }}>Recent Activity</h3>
            <p style={{ fontSize: '13px', color: theme.textMuted, marginBottom: '20px' }}>Your latest interactions</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {[
                { action: 'Completed', detail: 'JavaScript Fundamentals Assessment', time: '2h ago', icon: '✅', color: theme.success, colorSoft: theme.successSoft },
                { action: 'Uploaded', detail: 'Updated resume — v3.pdf', time: '5h ago', icon: '📄', color: theme.accent, colorSoft: theme.accentSoft },
                { action: 'Practice', detail: 'React Hooks Practice Exam — 78%', time: '1d ago', icon: '📝', color: theme.warning, colorSoft: theme.warningSoft },
                { action: 'Assigned', detail: 'System Design Assessment', time: '2d ago', icon: '🎯', color: theme.danger, colorSoft: theme.dangerSoft },
              ].map((item, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '12px 14px', borderRadius: '10px',
                  transition: 'background 0.15s',
                  cursor: 'default',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = theme.surfaceAlt)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: '8px',
                    background: item.colorSoft, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '16px', flexShrink: 0,
                  }}>{item.icon}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: theme.text, margin: 0 }}>
                      <span style={{ color: item.color }}>{item.action}</span> · {item.detail}
                    </p>
                  </div>
                  <span style={{ fontSize: '12px', color: theme.textSubtle, fontWeight: 500, flexShrink: 0 }}>{item.time}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}