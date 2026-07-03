'use client';
import { API_BASE_URL } from '@/lib/api';

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
  const [pendingTests, setPendingTests] = useState<{ id: string; title: string; duration: number; type: 'MCQ' | 'CODING'; securityLevel?: string }[]>([]);
  const [showTestsPopup, setShowTestsPopup] = useState(false);

  const theme = isDark ? themes.dark : themes.light;

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { router.push('/login'); return; }

    fetch(`${API_BASE_URL}/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) { localStorage.removeItem('access_token'); router.push('/login'); return; }
        setDashboard(data);
      })
      .catch(console.error);

    // Fetch pending assigned tests for the popup notification
    const fetchPendingTests = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [mcqRes, codingRes] = await Promise.all([
          fetch(`${API_BASE_URL}/tests/assigned`, { headers }),
          fetch(`${API_BASE_URL}/coding-tests/assigned`, { headers }),
        ]);
        const mcqData = mcqRes.ok ? await mcqRes.json() : [];
        const codingData = codingRes.ok ? await codingRes.json() : [];
        const pending = [
          ...mcqData.map((t: any) => ({ id: t.id, title: t.title, duration: t.duration, type: 'MCQ' as const })),
          ...codingData.filter((t: any) => !t.attempted).map((t: any) => ({
            id: t.id, title: t.title, duration: t.duration,
            type: 'CODING' as const, securityLevel: t.securityLevel,
          })),
        ];
        if (pending.length > 0) {
          setPendingTests(pending);
          // Only show popup once per session
          const shownKey = 'rg_tests_popup_shown';
          if (!sessionStorage.getItem(shownKey)) {
            setTimeout(() => setShowTestsPopup(true), 1200);
            sessionStorage.setItem(shownKey, '1');
          }
        }
      } catch { /* swallow */ }
    };
    fetchPendingTests();
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
    { label: 'Upload Resume', icon: '📄', path: '/resumes', color: theme.accent, colorSoft: theme.accentSoft },
    { label: 'Practice Exams', icon: '📝', path: '/practice', color: theme.success, colorSoft: theme.successSoft },
    { label: 'My Assessments', icon: '📊', path: '/assigned-tests', color: theme.warning, colorSoft: theme.warningSoft },
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
        @keyframes overlayIn { from{opacity:0} to{opacity:1} }
        @keyframes popupSlideUp { from{opacity:0;transform:translateY(40px) scale(.96)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes bellRing { 0%,100%{transform:rotate(0)} 15%{transform:rotate(18deg)} 30%{transform:rotate(-16deg)} 45%{transform:rotate(12deg)} 60%{transform:rotate(-8deg)} 75%{transform:rotate(4deg)} }
        @keyframes badgePop { from{opacity:0;transform:scale(0)} to{opacity:1;transform:scale(1)} }
        @keyframes rowSlide { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
        @keyframes pulseRing { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(1.9);opacity:0} }
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

      {/* ── Assigned Tests Notification Popup ── */}
      {showTestsPopup && (
        <div
          onClick={() => setShowTestsPopup(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px',
            animation: 'overlayIn .25s ease',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: isDark ? '#141827' : '#ffffff',
              border: `1px solid ${isDark ? '#252C45' : '#E2E6F0'}`,
              borderRadius: '24px',
              padding: '36px',
              maxWidth: '480px',
              width: '100%',
              boxShadow: isDark
                ? '0 40px 100px rgba(0,0,0,.7), 0 0 0 1px rgba(255,255,255,.05) inset'
                : '0 40px 100px rgba(79,110,247,.15), 0 0 0 1px rgba(0,0,0,.04)',
              animation: 'popupSlideUp .38s cubic-bezier(.34,1.56,.64,1)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Gradient top strip */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
              background: `linear-gradient(90deg, ${theme.gradientStart}, ${theme.gradientEnd})`,
            }} />

            {/* Close button */}
            <button
              onClick={() => setShowTestsPopup(false)}
              style={{
                position: 'absolute', top: 16, right: 16,
                width: 32, height: 32, borderRadius: '50%',
                background: isDark ? '#252C45' : '#F0F2F8',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: theme.textMuted, fontSize: '16px',
                transition: 'background .2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = isDark ? '#2d3659' : '#E2E6F0')}
              onMouseLeave={e => (e.currentTarget.style.background = isDark ? '#252C45' : '#F0F2F8')}
            >✕</button>

            {/* Bell icon with ring animation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                  position: 'absolute', inset: '-6px', borderRadius: '50%',
                  border: `2px solid ${theme.accent}`,
                  animation: 'pulseRing 1.8s ease-out .5s infinite',
                }} />
                <div style={{
                  width: 56, height: 56, borderRadius: '16px',
                  background: `linear-gradient(135deg, ${theme.gradientStart}22, ${theme.gradientEnd}22)`,
                  border: `1px solid ${theme.accent}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '26px',
                  animation: 'bellRing .8s ease .3s both',
                }}>🔔</div>
                {/* Badge count */}
                <div style={{
                  position: 'absolute', top: -6, right: -6,
                  width: 22, height: 22, borderRadius: '50%',
                  background: theme.danger,
                  color: '#fff', fontSize: '11px', fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `2px solid ${isDark ? '#141827' : '#fff'}`,
                  animation: 'badgePop .4s cubic-bezier(.34,1.56,.64,1) .6s both',
                }}>{pendingTests.length}</div>
              </div>
              <div>
                <p style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: theme.accent, marginBottom: '4px' }}>
                  Action Required
                </p>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: theme.text, letterSpacing: '-0.02em', margin: 0 }}>
                  You have {pendingTests.length} pending {pendingTests.length === 1 ? 'assessment' : 'assessments'}!
                </h2>
              </div>
            </div>

            <p style={{ fontSize: '14px', color: theme.textMuted, lineHeight: 1.6, marginBottom: '20px' }}>
              Your recruiter has assigned the following {pendingTests.length === 1 ? 'test' : 'tests'} to you. Complete {pendingTests.length === 1 ? 'it' : 'them'} before the deadline.
            </p>

            {/* Test list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
              {pendingTests.slice(0, 4).map((t, i) => (
                <div
                  key={t.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: isDark ? '#1A1F33' : '#F7F8FC',
                    border: `1px solid ${isDark ? '#252C45' : '#E2E6F0'}`,
                    animation: `rowSlide .3s ease ${i * 0.07 + 0.3}s both`,
                  }}
                >
                  <div style={{
                    width: 34, height: 34, borderRadius: '10px', flexShrink: 0,
                    background: t.type === 'CODING'
                      ? (isDark ? '#1A0F33' : '#F3EFFE')
                      : (isDark ? '#1A2040' : '#EEF1FE'),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px',
                  }}>{t.type === 'CODING' ? '💻' : '📝'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: theme.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t.title}
                    </p>
                    <p style={{ margin: 0, fontSize: '11px', color: theme.textMuted, fontWeight: 500, marginTop: '2px' }}>
                      {t.type === 'CODING' ? 'Coding' : 'MCQ'} · {t.duration} mins
                    </p>
                  </div>
                  <span style={{
                    fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em',
                    textTransform: 'uppercase', padding: '3px 8px', borderRadius: '20px',
                    background: isDark ? '#2B2010' : '#FFFBEB',
                    color: theme.warning, flexShrink: 0,
                  }}>Pending</span>
                </div>
              ))}
              {pendingTests.length > 4 && (
                <p style={{ margin: 0, fontSize: '12px', color: theme.textMuted, textAlign: 'center', fontWeight: 600 }}>
                  +{pendingTests.length - 4} more test{pendingTests.length - 4 > 1 ? 's' : ''}
                </p>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => { setShowTestsPopup(false); router.push('/assigned-tests'); }}
                style={{
                  flex: 1, padding: '13px',
                  background: `linear-gradient(135deg, ${theme.gradientStart}, ${theme.gradientEnd})`,
                  color: '#fff', border: 'none', borderRadius: '12px',
                  fontWeight: 700, fontSize: '14px', cursor: 'pointer',
                  boxShadow: `0 4px 20px ${theme.accent}40`,
                  transition: 'opacity .2s, transform .2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '.88'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                🚀 Start Now
              </button>
              <button
                onClick={() => setShowTestsPopup(false)}
                style={{
                  padding: '13px 20px',
                  background: isDark ? '#1A1F33' : '#F0F2F8',
                  color: theme.textMuted, border: `1px solid ${theme.border}`,
                  borderRadius: '12px', fontWeight: 600, fontSize: '14px',
                  cursor: 'pointer', transition: 'background .2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = isDark ? '#252C45' : '#E2E6F0')}
                onMouseLeave={e => (e.currentTarget.style.background = isDark ? '#1A1F33' : '#F0F2F8')}
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}