'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminNavbar from '@/components/AdminNavbar';

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuestionResult {
  questionId: string; title: string; difficulty: string;
  status: string; score: number; passedCases: number; totalCases: number; language: string;
}
interface SecurityEventCounts {
  TAB_SWITCH?: number; WINDOW_BLUR?: number; RIGHT_CLICK?: number;
  FULLSCREEN_EXIT?: number; COPY_ATTEMPT?: number; PASTE_ATTEMPT?: number;
  DEVTOOLS_SHORTCUT?: number; KEYBOARD_SHORTCUT_BLOCKED?: number;
  FACE_MISSING?: number; MULTIPLE_FACES?: number; NOISE_WARNING?: number;
  CAMERA_DISABLED?: number; MIC_DISABLED?: number; GAZE_AWAY?: number;
  PHONE_DETECTED?: number; [key: string]: number | undefined;
}
interface ProSummary {
  faceMissingCount: number; multipleFacesCount: number; noiseWarningCount: number;
  cameraDisabled: boolean; micDisabled: boolean; gazeAwayCount: number; phoneDetectedCount: number;
}
interface Result {
  id: string; candidateEmail: string; status: string;
  totalScore: number; percentage: number; completedQuestions: number; totalQuestions: number;
  submittedAt: string | null; startedAt: string; riskScore: number;
  suspicionLevel: string; totalSecurityEvents: number;
  securityEventCounts: SecurityEventCounts; questionResults: QuestionResult[];
  proSummary?: ProSummary;
}
interface SecurityEvent { id: string; eventType: string; details: any; timestamp: string; screenshotUrl?: string | null; }
interface ProProctoring {
  cameraEnabled: boolean; micEnabled: boolean; faceMissingCount: number;
  multipleFacesCount: number; noiseWarningCount: number; gazeAwayCount: number;
  phoneDetectedCount: number; faceNotCenteredCount: number;
  tabSwitches: number; fullscreenExits: number; copyAttempts: number; devtoolsAttempts: number;
}
interface AttemptReport {
  attemptId: string; candidateEmail: string; candidateName: string | null;
  status: string; startedAt: string; submittedAt: string | null;
  totalScore: number; percentage: number; completedQuestions: number; totalQuestions: number;
  testTitle: string; testDuration: number; riskScore: number; suspicionLevel: string;
  securityEventCounts: SecurityEventCounts; securityEvents: SecurityEvent[];
  totalSecurityEvents: number; proProctoring?: ProProctoring;
  questionSummary: Array<{
    questionId: string; questionTitle: string; difficulty: string; category: string;
    language: string; sourceCode?: string | null; status: string; score: number;
    passedCases: number; totalCases: number; submittedAt: string; submissionCount: number;
  }>;
}
type SortKey = 'rank' | 'percentage' | 'totalScore' | 'riskScore' | 'submittedAt' | 'totalSecurityEvents';
type SortDir = 'asc' | 'desc';
type StatusFilter = 'ALL' | 'COMPLETED' | 'IN_PROGRESS';

// ─── Constants ────────────────────────────────────────────────────────────────
const SUSPICION_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  CLEAN:  { label: 'Clean',  color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.25)'   },
  LOW:    { label: 'Low',    color: '#84cc16', bg: 'rgba(132,204,22,0.1)',  border: 'rgba(132,204,22,0.25)'  },
  MEDIUM: { label: 'Medium', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)'  },
  HIGH:   { label: 'High',   color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)'   },
};
const EVENT_META: Record<string, { label: string; icon: string; color: string; weight: number; isPro?: boolean }> = {
  TAB_SWITCH:                { label: 'Tab Switch',          icon: '🔀', color: '#f59e0b', weight: 10 },
  WINDOW_BLUR:               { label: 'Window Focus Lost',   icon: '👁️', color: '#f59e0b', weight: 5  },
  RIGHT_CLICK:               { label: 'Right Click',         icon: '🖱️', color: '#8b949e', weight: 5  },
  FULLSCREEN_EXIT:           { label: 'Fullscreen Exit',     icon: '🔲', color: '#ef4444', weight: 15 },
  COPY_ATTEMPT:              { label: 'Copy Attempt',        icon: '📋', color: '#ef4444', weight: 20 },
  PASTE_ATTEMPT:             { label: 'Paste Attempt',       icon: '📌', color: '#ef4444', weight: 20 },
  DEVTOOLS_SHORTCUT:         { label: 'DevTools Attempt',    icon: '🛠️', color: '#a855f7', weight: 25 },
  KEYBOARD_SHORTCUT_BLOCKED: { label: 'Keyboard Shortcut',  icon: '⌨️', color: '#8b949e', weight: 5  },
  FACE_MISSING:              { label: 'Face Missing',        icon: '👤', color: '#f97316', weight: 8,  isPro: true },
  MULTIPLE_FACES:            { label: 'Multiple Faces',      icon: '👥', color: '#ef4444', weight: 30, isPro: true },
  NOISE_WARNING:             { label: 'Noise Warning',       icon: '🔊', color: '#f59e0b', weight: 5,  isPro: true },
  CAMERA_DISABLED:           { label: 'Camera Disabled',     icon: '📷', color: '#ef4444', weight: 20, isPro: true },
  MIC_DISABLED:              { label: 'Mic Disabled',        icon: '🎤', color: '#ef4444', weight: 10, isPro: true },
  GAZE_AWAY:                 { label: 'Gaze Away',           icon: '👀', color: '#f59e0b', weight: 8,  isPro: true },
  PHONE_DETECTED:            { label: 'Phone Detected',      icon: '📱', color: '#ef4444', weight: 35, isPro: true },
  FACE_NOT_CENTERED:         { label: 'Face Not Centered',   icon: '🎯', color: '#f59e0b', weight: 5,  isPro: true },
};
const DIFF_COLOR: Record<string, string> = { EASY: '#22c55e', MEDIUM: '#f59e0b', HARD: '#ef4444' };
const STATUS_COLOR: Record<string, { color: string; bg: string }> = {
  PASSED:  { color: '#22c55e', bg: 'rgba(34,197,94,0.12)'  },
  PARTIAL: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  FAILED:  { color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
};
const td: React.CSSProperties = { padding: '11px 14px', verticalAlign: 'middle' };

// ─── Helpers ──────────────────────────────────────────────────────────────────
function PercentageBar({ value }: { value: number }) {
  const color = value >= 80 ? '#22c55e' : value >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: '#1e293b', borderRadius: 99, overflow: 'hidden', minWidth: 60 }}>
        <div style={{ width: `${Math.min(value, 100)}%`, height: '100%', background: color, borderRadius: 99 }} />
      </div>
      <span style={{ color, fontWeight: 700, fontSize: 12, minWidth: 36 }}>{value.toFixed(1)}%</span>
    </div>
  );
}
function StatCard({ label, value, accent }: { label: string; value: string | number; accent: string }) {
  return (
    <div style={{ background: '#1e293b', border: '1px solid #334155', borderTop: `3px solid ${accent}`, borderRadius: 12, padding: '14px 18px', flex: 1, minWidth: 120 }}>
      <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9' }}>{value}</div>
    </div>
  );
}
function SuspicionBadge({ level }: { level: string }) {
  const c = SUSPICION_CFG[level] ?? SUSPICION_CFG.CLEAN;
  return <span style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}`, padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 700 }}>{c.label}</span>;
}
function RiskCircle({ score, level }: { score: number; level: string }) {
  const c = SUSPICION_CFG[level] ?? SUSPICION_CFG.CLEAN;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: c.bg, border: `2px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: c.color }}>{score}</div>
      <SuspicionBadge level={level} />
    </div>
  );
}

// ─── Full Detail Report Modal ─────────────────────────────────────────────────
function ReportModal({ report, onClose }: { report: AttemptReport; onClose: () => void }) {
  const [tab, setTab] = useState<'overview' | 'proctoring' | 'timeline' | 'questions' | 'analytics'>('overview');
  const c = SUSPICION_CFG[report.suspicionLevel] ?? SUSPICION_CFG.CLEAN;
  const durationMs = report.submittedAt && report.startedAt
    ? new Date(report.submittedAt).getTime() - new Date(report.startedAt).getTime() : null;
  const durationStr = durationMs ? `${Math.floor(durationMs / 60000)}m ${Math.floor((durationMs % 60000) / 1000)}s` : '—';
  const isPro = !!(report.proProctoring);

  const TABS = [
    { key: 'overview',   label: '📊 Overview'   },
    { key: 'proctoring', label: isPro ? '📹 Proctoring (PRO)' : '🛡️ Security'  },
    { key: 'timeline',   label: '📅 Timeline'   },
    { key: 'questions',  label: '💻 Questions'  },
    { key: 'analytics',  label: '📈 Analytics'  },
  ] as const;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(6px)', overflowY: 'auto', padding: '32px 16px 48px' }}>
      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 18, width: '100%', maxWidth: 860, boxShadow: '0 32px 96px rgba(0,0,0,0.7)' }}>

        {/* Header */}
        <div style={{ padding: '20px 28px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: '#6366f1', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' as const }}>Candidate Report</span>
              {isPro && <span style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.3)', padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700 }}>PRO</span>}
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#f8fafc', margin: 0 }}>{report.candidateEmail}</h2>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{report.testTitle} · {report.testDuration}min</div>
          </div>
          <button onClick={onClose} style={{ background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>✕ Close</button>
        </div>

        {/* Risk Hero Bar */}
        <div style={{ padding: '16px 28px', background: `linear-gradient(135deg, #0f172a 50%, ${c.bg})`, borderBottom: '1px solid #1e293b', display: 'flex', gap: 28, flexWrap: 'wrap' as const, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 4 }}>Risk Score</div>
            <div style={{ fontSize: 44, fontWeight: 900, color: c.color, lineHeight: 1 }}>{report.riskScore}</div>
            <div style={{ marginTop: 6 }}><SuspicionBadge level={report.suspicionLevel} /></div>
          </div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' as const }}>
            {[
              { label: 'Score',      value: `${report.totalScore}pts`, color: '#6366f1' },
              { label: 'Percentage', value: `${report.percentage.toFixed(1)}%`, color: '#38bdf8' },
              { label: 'Solved',     value: `${report.completedQuestions}/${report.totalQuestions}`, color: '#22c55e' },
              { label: 'Duration',   value: durationStr, color: '#f59e0b' },
              { label: 'Events',     value: String(report.totalSecurityEvents), color: report.totalSecurityEvents > 5 ? '#ef4444' : '#64748b' },
              { label: 'Status',     value: report.status, color: report.status === 'COMPLETED' ? '#22c55e' : '#f59e0b' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' as const }}>
                <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 3 }}>{s.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #1e293b', padding: '0 28px', overflowX: 'auto' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)} style={{ padding: '11px 14px', border: 'none', borderBottom: `2px solid ${tab === t.key ? '#6366f1' : 'transparent'}`, background: 'transparent', color: tab === t.key ? '#e2e8f0' : '#64748b', fontWeight: 600, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ padding: '22px 28px', maxHeight: 500, overflowY: 'auto' }}>
          {tab === 'overview'   && <OverviewTab report={report} />}
          {tab === 'proctoring' && <ProctoringTab report={report} />}
          {tab === 'timeline'   && <TimelineTab events={report.securityEvents} startedAt={report.startedAt} />}
          {tab === 'questions'  && <QuestionsTab questions={report.questionSummary} />}
          {tab === 'analytics'  && <AnalyticsTab report={report} />}
        </div>
      </div>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ report }: { report: AttemptReport }) {
  const entries = Object.entries(report.securityEventCounts).filter(([, v]) => (v ?? 0) > 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 18 }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 10 }}>Violation Breakdown</div>
        {entries.length === 0 ? (
          <div style={{ textAlign: 'center' as const, padding: '20px 0', color: '#22c55e', fontWeight: 600 }}>✅ No violations recorded</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
            {entries.map(([type, count]) => {
              const m = EVENT_META[type] ?? { label: type, icon: '⚠️', color: '#8b949e', weight: 5 };
              const contrib = (count ?? 0) * m.weight;
              return (
                <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#1e293b', borderRadius: 8, padding: '9px 12px' }}>
                  <span style={{ fontSize: 16 }}>{m.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>{m.label}</div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>+{m.weight} risk/event{m.isPro ? ' · PRO' : ''}</div>
                  </div>
                  <span style={{ background: `${m.color}20`, color: m.color, border: `1px solid ${m.color}40`, borderRadius: 6, padding: '2px 9px', fontSize: 12, fontWeight: 800 }}>×{count}</span>
                  <span style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: 5, padding: '2px 7px', fontSize: 10, fontWeight: 700 }}>+{contrib}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {entries.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 8 }}>Risk Composition</div>
          <div style={{ height: 12, background: '#1e293b', borderRadius: 99, overflow: 'hidden', display: 'flex' }}>
            {entries.map(([type, count]) => {
              const m = EVENT_META[type] ?? { color: '#8b949e', weight: 5 };
              const pct = Math.min(((count ?? 0) * m.weight), 100);
              return <div key={type} title={`${type}: +${(count ?? 0) * m.weight}`} style={{ height: '100%', background: m.color, width: `${pct}%`, opacity: 0.85 }} />;
            })}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const, marginTop: 6 }}>
            {entries.map(([type]) => {
              const m = EVENT_META[type] ?? { label: type, color: '#8b949e' };
              return <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#64748b' }}><div style={{ width: 8, height: 8, borderRadius: 2, background: m.color }} />{m.label}</div>;
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Proctoring Tab ───────────────────────────────────────────────────────────
function ProctoringTab({ report }: { report: AttemptReport }) {
  const ec = report.securityEventCounts;
  const pro = report.proProctoring;
  const isPro = !!pro;

  const Row = ({ icon, label, value, ok }: { icon: string; label: string; value: string | number; ok?: boolean }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1e293b' }}>
      <span style={{ fontSize: 13, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 8 }}><span>{icon}</span>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: ok === undefined ? '#e2e8f0' : ok ? '#22c55e' : '#ef4444', fontFamily: 'monospace' }}>{value}</span>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 20 }}>
      {isPro && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase' as const, letterSpacing: 1 }}>📹 PRO Proctoring</div>
            <span style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.3)', padding: '2px 7px', borderRadius: 99, fontSize: 10, fontWeight: 700 }}>ACTIVE</span>
          </div>
          <div style={{ background: '#1e293b', borderRadius: 10, padding: '4px 16px' }}>
            <Row icon="📷" label="Camera Enabled" value={pro!.cameraEnabled ? 'Yes' : 'No'} ok={pro!.cameraEnabled} />
            <Row icon="🎤" label="Microphone Enabled" value={pro!.micEnabled ? 'Yes' : 'No'} ok={pro!.micEnabled} />
            <Row icon="👤" label="Face Missing Events" value={pro!.faceMissingCount} ok={pro!.faceMissingCount === 0} />
            <Row icon="👥" label="Multiple Faces Detected" value={pro!.multipleFacesCount} ok={pro!.multipleFacesCount === 0} />
            <Row icon="👀" label="Gaze Away Events" value={pro!.gazeAwayCount} ok={pro!.gazeAwayCount === 0} />
            <Row icon="🔊" label="Noise Warnings" value={pro!.noiseWarningCount} ok={pro!.noiseWarningCount === 0} />
            <Row icon="📱" label="Phone Detected" value={pro!.phoneDetectedCount} ok={pro!.phoneDetectedCount === 0} />
            <Row icon="🎯" label="Face Not Centered" value={pro!.faceNotCenteredCount} ok={pro!.faceNotCenteredCount === 0} />
          </div>
        </div>
      )}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 12 }}>🛡️ Security Monitoring</div>
        <div style={{ background: '#1e293b', borderRadius: 10, padding: '4px 16px' }}>
          <Row icon="🔀" label="Tab Switches"    value={ec.TAB_SWITCH ?? 0}        ok={(ec.TAB_SWITCH ?? 0) === 0} />
          <Row icon="🔲" label="Fullscreen Exits" value={ec.FULLSCREEN_EXIT ?? 0}  ok={(ec.FULLSCREEN_EXIT ?? 0) === 0} />
          <Row icon="📋" label="Copy Attempts"   value={ec.COPY_ATTEMPT ?? 0}      ok={(ec.COPY_ATTEMPT ?? 0) === 0} />
          <Row icon="📌" label="Paste Attempts"  value={ec.PASTE_ATTEMPT ?? 0}     ok={(ec.PASTE_ATTEMPT ?? 0) === 0} />
          <Row icon="🛠️" label="DevTools Opens"  value={ec.DEVTOOLS_SHORTCUT ?? 0} ok={(ec.DEVTOOLS_SHORTCUT ?? 0) === 0} />
          <Row icon="🖱️" label="Right Clicks"    value={ec.RIGHT_CLICK ?? 0}       ok={(ec.RIGHT_CLICK ?? 0) === 0} />
          <Row icon="👁️" label="Window Blur"     value={ec.WINDOW_BLUR ?? 0}       ok={(ec.WINDOW_BLUR ?? 0) <= 2} />
          <Row icon="⌨️" label="Blocked Shortcuts" value={ec.KEYBOARD_SHORTCUT_BLOCKED ?? 0} ok={(ec.KEYBOARD_SHORTCUT_BLOCKED ?? 0) === 0} />
        </div>
      </div>
    </div>
  );
}

// ─── Timeline Tab ─────────────────────────────────────────────────────────────
function TimelineTab({ events, startedAt }: { events: SecurityEvent[]; startedAt: string }) {
  if (events.length === 0) return <div style={{ textAlign: 'center' as const, padding: '32px 0', color: '#22c55e', fontWeight: 600 }}>✅ No security events</div>;
  const startTime = new Date(startedAt).getTime();
  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const }}>
      {events.map((ev, i) => {
        const m = EVENT_META[ev.eventType] ?? { label: ev.eventType, icon: '⚠️', color: '#8b949e' };
        const elapsed = Math.floor((new Date(ev.timestamp).getTime() - startTime) / 1000);
        const elStr = elapsed >= 0 ? `+${Math.floor(elapsed / 60)}m ${elapsed % 60}s` : '—';
        const isLast = i === events.length - 1;
        return (
          <div key={ev.id} style={{ display: 'flex', gap: 14, paddingBottom: isLast ? 0 : 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', width: 32, flexShrink: 0 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: `${m.color}20`, border: `2px solid ${m.color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>{m.icon}</div>
              {!isLast && <div style={{ width: 2, flex: 1, background: '#1e293b', marginTop: 5 }} />}
            </div>
            <div style={{ flex: 1, paddingTop: 3, paddingBottom: isLast ? 0 : 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 3 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: m.color }}>{m.label}{(m as any).isPro ? ' 🔴' : ''}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span style={{ fontSize: 10, color: '#475569', background: '#1e293b', padding: '1px 7px', borderRadius: 4 }}>{elStr}</span>
                  <span style={{ fontSize: 10, color: '#334155' }}>{new Date(ev.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
              {ev.details && Object.keys(ev.details).filter(k => k !== 'timestamp' && k !== 'url').length > 0 && (
                <div style={{ background: '#1e293b', borderRadius: 5, padding: '4px 9px', fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>
                  {Object.entries(ev.details).filter(([k]) => k !== 'timestamp' && k !== 'url').map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(' · ')}
                </div>
              )}
              {/* Screenshot thumbnail — PRO proctoring screen capture */}
              {ev.screenshotUrl && (
                <div style={{ marginTop: 8 }}>
                  <img
                    src={ev.screenshotUrl}
                    alt={`Screenshot: ${ev.eventType}`}
                    title="Click to view full size"
                    onClick={() => window.open(ev.screenshotUrl!, '_blank')}
                    style={{
                      width: '100%',
                      maxWidth: 480,
                      height: 'auto',
                      borderRadius: 8,
                      border: `1px solid ${m.color}40`,
                      cursor: 'pointer',
                      display: 'block',
                      transition: 'opacity 0.15s, transform 0.15s',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLImageElement).style.opacity = '0.85';
                      (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.01)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLImageElement).style.opacity = '1';
                      (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)';
                    }}
                  />
                  <div style={{ fontSize: 10, color: '#475569', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>🖥️</span> Screen capture · Click to view full size
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Questions Tab ────────────────────────────────────────────────────────────
function QuestionsTab({ questions }: { questions: AttemptReport['questionSummary'] }) {
  if (questions.length === 0) return <div style={{ textAlign: 'center' as const, padding: '32px 0', color: '#475569' }}>No submissions yet.</div>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
      {questions.map((q) => {
        const sc = STATUS_COLOR[q.status] ?? { color: '#8b949e', bg: 'rgba(139,148,158,0.1)' };
        const pct = q.totalCases > 0 ? Math.round((q.passedCases / q.totalCases) * 100) : 0;
        return (
          <div key={q.questionId} style={{ background: '#1e293b', border: '1px solid #334155', borderLeft: `3px solid ${sc.color}`, borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', marginBottom: 3 }}>{q.questionTitle}</div>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' as const, fontSize: 11 }}>
                  <span style={{ color: DIFF_COLOR[q.difficulty] ?? '#8b949e', fontWeight: 700 }}>{q.difficulty}</span>
                  <span style={{ color: '#475569' }}>·</span>
                  <span style={{ color: '#475569' }}>{q.category}</span>
                  <span style={{ color: '#475569' }}>·</span>
                  <span style={{ color: '#6366f1', fontFamily: 'monospace' }}>{q.language}</span>
                  <span style={{ color: '#475569' }}>·</span>
                  <span style={{ color: '#64748b' }}>{q.submissionCount} attempt{q.submissionCount !== 1 ? 's' : ''}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-end', gap: 5 }}>
                <span style={{ background: sc.bg, color: sc.color, padding: '2px 9px', borderRadius: 99, fontSize: 10, fontWeight: 700 }}>{q.status}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#6366f1' }}>{q.score}pts</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, height: 4, background: '#334155', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: sc.color, borderRadius: 99 }} />
              </div>
              <span style={{ fontSize: 11, color: sc.color, fontWeight: 700 }}>{q.passedCases}/{q.totalCases} cases</span>
            </div>

            {/* View submitted code */}
            {q.sourceCode && (
              <div style={{ marginTop: 10 }}>
                <details>
                  <summary style={{
                    cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#6366f1',
                    background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)',
                    borderRadius: 6, padding: '5px 10px', listStyle: 'none', userSelect: 'none' as const,
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                  }}>
                    <span>{'</>'}</span> View Submitted Code ({q.language})
                  </summary>
                  <div style={{ position: 'relative' as const, marginTop: 6 }}>
                    <div style={{
                      position: 'absolute' as const, top: 8, right: 10,
                      fontSize: 10, color: '#6366f1', fontFamily: 'monospace',
                      fontWeight: 700, background: 'rgba(99,102,241,0.1)',
                      padding: '2px 7px', borderRadius: 4, zIndex: 1,
                    }}>
                      {q.language}
                    </div>
                    <pre style={{
                      background: '#0d1117', border: '1px solid #30363d',
                      borderRadius: 8, padding: '14px 16px',
                      fontSize: 12, fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                      color: '#e6edf3', lineHeight: 1.6,
                      overflowX: 'auto' as const, whiteSpace: 'pre' as const,
                      margin: 0, maxHeight: 360, overflowY: 'auto' as const,
                    }}>
                      {q.sourceCode}
                    </pre>
                  </div>
                </details>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Analytics Tab ────────────────────────────────────────────────────────────
function AnalyticsTab({ report }: { report: AttemptReport }) {
  const totalPossible = report.questionSummary.reduce((s, q) => s + 100, 0);
  const solved = report.questionSummary.filter(q => q.status === 'PASSED').length;
  const partial = report.questionSummary.filter(q => q.status === 'PARTIAL').length;
  const failed = report.questionSummary.filter(q => q.status === 'FAILED').length;
  const notAttempted = report.totalQuestions - report.questionSummary.length;
  const langMap: Record<string, number> = {};
  report.questionSummary.forEach(q => { langMap[q.language] = (langMap[q.language] || 0) + 1; });

  const Meter = ({ label, value, max, color }: { label: string; value: number; max: number; color: string }) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>
        <span>{label}</span><span style={{ color, fontWeight: 700 }}>{value}</span>
      </div>
      <div style={{ height: 8, background: '#1e293b', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ width: `${max > 0 ? (value / max) * 100 : 0}%`, height: '100%', background: color, borderRadius: 99 }} />
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10 }}>
        {[
          { label: 'Total Score',    value: `${report.totalScore}`, accent: '#6366f1' },
          { label: 'Percentage',     value: `${report.percentage.toFixed(1)}%`, accent: '#38bdf8' },
          { label: 'Solved',         value: `${solved}/${report.totalQuestions}`, accent: '#22c55e' },
          { label: 'Risk Score',     value: String(report.riskScore), accent: report.riskScore > 60 ? '#ef4444' : report.riskScore > 20 ? '#f59e0b' : '#22c55e' },
        ].map(s => <StatCard key={s.label} label={s.label} value={s.value} accent={s.accent} />)}
      </div>

      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 12 }}>Question Performance</div>
        <Meter label="✅ Passed"       value={solved}       max={report.totalQuestions} color="#22c55e" />
        <Meter label="🟡 Partial"      value={partial}      max={report.totalQuestions} color="#f59e0b" />
        <Meter label="❌ Failed"        value={failed}       max={report.totalQuestions} color="#ef4444" />
        <Meter label="⬜ Not Attempted" value={notAttempted} max={report.totalQuestions} color="#334155" />
      </div>

      {Object.keys(langMap).length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 10 }}>Languages Used</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
            {Object.entries(langMap).map(([lang, cnt]) => (
              <span key={lang} style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)', padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>
                {lang} × {cnt}
              </span>
            ))}
          </div>
        </div>
      )}

      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 10 }}>Timeline</div>
        <div style={{ background: '#1e293b', borderRadius: 10, padding: '12px 16px', display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
          {[
            { label: 'Started At',   value: new Date(report.startedAt).toLocaleString() },
            { label: 'Submitted At', value: report.submittedAt ? new Date(report.submittedAt).toLocaleString() : 'Not submitted' },
            { label: 'Candidate',    value: report.candidateName ?? report.candidateEmail },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: '#64748b' }}>{r.label}</span>
              <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CodingTestResultsPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params.id as string;

  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [sortKey, setSortKey] = useState<SortKey>('percentage');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [minPct, setMinPct] = useState(0);
  const [maxRisk, setMaxRisk] = useState(100);
  const [exportFlash, setExportFlash] = useState(false);
  const [selectedReport, setSelectedReport] = useState<AttemptReport | null>(null);
  const [reportLoading, setReportLoading] = useState<string | null>(null);

  useEffect(() => { loadResults(); }, []);

  const loadResults = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`http://localhost:3000/coding-tests/${testId}/results`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const openReport = useCallback(async (result: Result) => {
    setReportLoading(result.id);
    try {
      const token = localStorage.getItem('access_token');
      // Try PRO report first if applicable, fall back to basic report
      const isPro = !!(result.proSummary && (
        result.proSummary.faceMissingCount > 0 || result.proSummary.multipleFacesCount > 0 ||
        result.proSummary.cameraDisabled || result.proSummary.micDisabled
      ));
      const endpoint = isPro
        ? `http://localhost:3000/coding-attempts/${result.id}/pro/report`
        : `http://localhost:3000/coding-attempts/${result.id}/report`;
      let res = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok && isPro) {
        // fallback to basic report
        res = await fetch(`http://localhost:3000/coding-attempts/${result.id}/report`, { headers: { Authorization: `Bearer ${token}` } });
      }
      if (!res.ok) throw new Error('Failed');
      const data: AttemptReport = await res.json();
      setSelectedReport(data);
    } catch { alert('Failed to load report.'); }
    finally { setReportLoading(null); }
  }, []);

  const rankedResults = useMemo(() => {
    const sorted = [...results].filter(r => r.status === 'COMPLETED').sort((a, b) => b.percentage - a.percentage);
    const m = new Map<string, number>(); sorted.forEach((r, i) => m.set(r.id, i + 1)); return m;
  }, [results]);

  const filtered = useMemo(() => {
    let d = [...results];
    if (search.trim()) d = d.filter(r => r.candidateEmail.toLowerCase().includes(search.toLowerCase()));
    if (statusFilter !== 'ALL') d = d.filter(r => r.status === statusFilter);
    d = d.filter(r => r.percentage >= minPct && r.riskScore <= maxRisk);
    d.sort((a, b) => {
      let av: number, bv: number;
      if (sortKey === 'rank') { av = rankedResults.get(a.id) ?? 9999; bv = rankedResults.get(b.id) ?? 9999; }
      else if (sortKey === 'submittedAt') { av = a.submittedAt ? new Date(a.submittedAt).getTime() : 0; bv = b.submittedAt ? new Date(b.submittedAt).getTime() : 0; }
      else { av = a[sortKey] as number; bv = b[sortKey] as number; }
      return sortDir === 'asc' ? av - bv : bv - av;
    });
    return d;
  }, [results, search, statusFilter, sortKey, sortDir, minPct, maxRisk, rankedResults]);

  const stats = useMemo(() => {
    const done = results.filter(r => r.status === 'COMPLETED');
    const avgPct = done.length ? Math.round(done.reduce((s, r) => s + r.percentage, 0) / done.length) : 0;
    const top = done.length ? Math.max(...done.map(r => r.percentage)) : 0;
    const highRisk = results.filter(r => r.suspicionLevel === 'HIGH').length;
    const totalViol = results.reduce((s, r) => s + r.totalSecurityEvents, 0);
    const proCount = results.filter(r => r.proSummary && (r.proSummary.faceMissingCount > 0 || r.proSummary.multipleFacesCount > 0)).length;
    return { total: results.length, done: done.length, avgPct, top, highRisk, totalViol, proCount };
  }, [results]);

  const handleSort = (k: SortKey) => { if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortKey(k); setSortDir('desc'); } };

  const exportCSV = () => {
    const h = ['Rank','Email','Status','Score','Percentage','Solved','Risk','Suspicion','Events',
                'TabSwitch','CopyAttempt','DevTools','FullscreenExit','FaceMissing','MultipleFaces','NoiseWarning','SubmittedAt'];
    const rows = filtered.map(r => {
      const rk = rankedResults.get(r.id) ?? '-';
      const ec = r.securityEventCounts;
      const ps = r.proSummary;
      return [rk, r.candidateEmail, r.status, r.totalScore, `${r.percentage.toFixed(1)}%`,
        `${r.completedQuestions}/${r.totalQuestions}`, r.riskScore, r.suspicionLevel, r.totalSecurityEvents,
        ec.TAB_SWITCH ?? 0, ec.COPY_ATTEMPT ?? 0, ec.DEVTOOLS_SHORTCUT ?? 0, ec.FULLSCREEN_EXIT ?? 0,
        ps?.faceMissingCount ?? 0, ps?.multipleFacesCount ?? 0, ps?.noiseWarningCount ?? 0,
        r.submittedAt ? new Date(r.submittedAt).toLocaleString() : '-'];
    });
    const csv = [h, ...rows].map(row => row.map(String).join(',')).join('\n');
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: `results-${testId}.csv` });
    a.click(); setExportFlash(true); setTimeout(() => setExportFlash(false), 1800);
  };

  const SI = ({ col }: { col: SortKey }) => <span style={{ opacity: sortKey === col ? 1 : 0.3, fontSize: 10, marginLeft: 3 }}>{sortKey === col ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}</span>;
  const statusClr: Record<string, { bg: string; color: string }> = {
    COMPLETED:   { bg: 'rgba(34,197,94,0.12)',  color: '#22c55e' },
    IN_PROGRESS: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
  };

  return (
    <>
      <AdminNavbar />
      {selectedReport && <ReportModal report={selectedReport} onClose={() => setSelectedReport(null)} />}

      <div style={{ minHeight: '100vh', background: '#0a0f1e', color: '#f1f5f9', fontFamily: "'Inter', system-ui, sans-serif" }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #0f172a 60%, #1a1040)', borderBottom: '1px solid #1e293b', padding: '24px 32px 18px' }}>
          <div style={{ maxWidth: 1320, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' as const, gap: 14 }}>
              <div>
                <p style={{ fontSize: 10, color: '#6366f1', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' as const, margin: '0 0 3px' }}>Coding Assessment · Results</p>
                <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: '#f8fafc' }}>Test Results & Security Reports</h1>
                <p style={{ margin: '3px 0 0', color: '#64748b', fontSize: 12 }}>
                  Test ID: <code style={{ color: '#818cf8', background: '#1e293b', padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>{testId}</code>
                  {' · '}Click <strong style={{ color: '#94a3b8' }}>View Report</strong> for full analysis
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
                <button onClick={() => router.push(`/admin/coding-tests/${testId}/assign`)} style={{ background: 'transparent', border: '1px solid #334155', color: '#94a3b8', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>👥 Assign</button>
                <button onClick={() => router.push(`/admin/coding-tests/${testId}`)} style={{ background: 'transparent', border: '1px solid #334155', color: '#94a3b8', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>📄 Details</button>
                <button onClick={exportCSV} style={{ background: exportFlash ? '#22c55e' : '#6366f1', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 700, fontSize: 12, cursor: 'pointer', transition: 'background 0.3s' }}>
                  {exportFlash ? '✓ Exported!' : '⬇ Export CSV'}
                </button>
              </div>
            </div>

            {!loading && (
              <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' as const }}>
                <StatCard label="Total"       value={stats.total}              accent="#6366f1" />
                <StatCard label="Completed"   value={stats.done}               accent="#22c55e" />
                <StatCard label="Avg Score"   value={`${stats.avgPct}%`}       accent="#38bdf8" />
                <StatCard label="Top Score"   value={`${stats.top.toFixed(1)}%`} accent="#a78bfa" />
                <StatCard label="High Risk"   value={stats.highRisk}           accent="#ef4444" />
                <StatCard label="Violations"  value={stats.totalViol}          accent="#f59e0b" />
                {stats.proCount > 0 && <StatCard label="PRO Face Events" value={stats.proCount} accent="#7c3aed" />}
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div style={{ background: '#0f172a', borderBottom: '1px solid #1e293b', padding: '10px 32px' }}>
          <div style={{ maxWidth: 1320, margin: '0 auto', display: 'flex', gap: 10, flexWrap: 'wrap' as const, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 160 }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#475569', fontSize: 12 }}>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search email..." style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9', padding: '7px 10px 7px 30px', fontSize: 12, outline: 'none', boxSizing: 'border-box' as const }} />
            </div>
            <div style={{ display: 'flex', gap: 3, background: '#1e293b', borderRadius: 7, padding: 3, border: '1px solid #334155' }}>
              {(['ALL', 'COMPLETED', 'IN_PROGRESS'] as StatusFilter[]).map(s => (
                <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: '5px 11px', borderRadius: 5, border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer', background: statusFilter === s ? '#6366f1' : 'transparent', color: statusFilter === s ? 'white' : '#64748b' }}>
                  {s === 'IN_PROGRESS' ? 'In Progress' : s === 'ALL' ? 'All' : 'Completed'}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1e293b', border: '1px solid #334155', borderRadius: 7, padding: '5px 11px' }}>
              <span style={{ fontSize: 10, color: '#64748b' }}>Min %</span>
              <input type="range" min={0} max={100} value={minPct} onChange={e => setMinPct(+e.target.value)} style={{ width: 65, accentColor: '#6366f1' }} />
              <span style={{ fontSize: 11, color: '#818cf8', fontWeight: 700, minWidth: 22 }}>{minPct}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1e293b', border: '1px solid #334155', borderRadius: 7, padding: '5px 11px' }}>
              <span style={{ fontSize: 10, color: '#64748b' }}>Max Risk</span>
              <input type="range" min={0} max={100} value={maxRisk} onChange={e => setMaxRisk(+e.target.value)} style={{ width: 65, accentColor: '#ef4444' }} />
              <span style={{ fontSize: 11, color: '#f87171', fontWeight: 700, minWidth: 22 }}>{maxRisk}</span>
            </div>
            <span style={{ fontSize: 11, color: '#475569', marginLeft: 'auto' }}><strong style={{ color: '#94a3b8' }}>{filtered.length}</strong> / {results.length}</span>
          </div>
        </div>

        {/* Table */}
        <div style={{ maxWidth: 1320, margin: '22px auto', padding: '0 32px 60px' }}>
          {loading ? (
            <div style={{ textAlign: 'center' as const, padding: '80px 0', color: '#475569' }}>⏳ Loading results...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center' as const, padding: '60px 0', color: '#475569' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
              <p>No results match your filters.</p>
              <button onClick={() => { setSearch(''); setStatusFilter('ALL'); setMinPct(0); setMaxRisk(100); }} style={{ marginTop: 12, background: '#6366f1', color: 'white', border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontWeight: 600 }}>Clear</button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #1e293b', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' as const, background: '#0f172a' }}>
                <thead>
                  <tr style={{ background: '#1e293b', borderBottom: '2px solid #334155' }}>
                    {([
                      { k: 'rank',               l: 'Rank' },
                      { k: null,                 l: 'Candidate' },
                      { k: null,                 l: 'Status' },
                      { k: 'totalScore',         l: 'Score' },
                      { k: 'percentage',         l: 'Percentage' },
                      { k: null,                 l: 'Solved' },
                      { k: 'riskScore',          l: 'Risk' },
                      { k: 'totalSecurityEvents',l: 'Events' },
                      { k: null,                 l: 'Top Issues' },
                      { k: null,                 l: 'PRO' },
                      { k: 'submittedAt',        l: 'Submitted' },
                      { k: null,                 l: 'Report' },
                    ] as { k: SortKey | null; l: string }[]).map(({ k, l }) => (
                      <th key={l} onClick={() => k && handleSort(k)} style={{ padding: '11px 13px', textAlign: 'left' as const, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 1, color: k ? '#94a3b8' : '#64748b', cursor: k ? 'pointer' : 'default', whiteSpace: 'nowrap' as const, userSelect: 'none' as const }}>
                        {l}{k && <SI col={k} />}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, idx) => {
                    const rank = rankedResults.get(r.id);
                    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;
                    const sc = statusClr[r.status] ?? { bg: 'rgba(148,163,184,0.1)', color: '#94a3b8' };
                    const isLoading = reportLoading === r.id;
                    const ps = r.proSummary;
                    const hasPro = ps && (ps.faceMissingCount + ps.multipleFacesCount + ps.noiseWarningCount + ps.gazeAwayCount + ps.phoneDetectedCount) > 0;
                    return (
                      <tr key={r.id} style={{ borderBottom: '1px solid #1e293b', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)', transition: 'background 0.12s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.06)')}
                        onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)')}>
                        {/* Rank */}
                        <td style={td}>
                          {rank ? (medal ? <span style={{ fontSize: 18 }}>{medal}</span> : <span style={{ width: 26, height: 26, borderRadius: '50%', background: '#1e293b', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#64748b' }}>{rank}</span>) : <span style={{ color: '#334155', fontSize: 12 }}>—</span>}
                        </td>
                        {/* Candidate */}
                        <td style={td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                            <div style={{ width: 29, height: 29, borderRadius: '50%', background: `hsl(${r.candidateEmail.charCodeAt(0) * 15},60%,25%)`, border: `2px solid hsl(${r.candidateEmail.charCodeAt(0) * 15},60%,35%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: `hsl(${r.candidateEmail.charCodeAt(0) * 15},80%,70%)`, flexShrink: 0 }}>
                              {r.candidateEmail[0].toUpperCase()}
                            </div>
                            <span style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 500 }}>{r.candidateEmail}</span>
                          </div>
                        </td>
                        {/* Status */}
                        <td style={td}><span style={{ background: sc.bg, color: sc.color, padding: '3px 9px', borderRadius: 99, fontSize: 10, fontWeight: 700, border: `1px solid ${sc.color}33` }}>{r.status === 'IN_PROGRESS' ? 'In Progress' : r.status.charAt(0) + r.status.slice(1).toLowerCase()}</span></td>
                        {/* Score */}
                        <td style={td}><span style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 14 }}>{r.totalScore}</span><span style={{ color: '#475569', fontSize: 11, marginLeft: 2 }}>pts</span></td>
                        {/* Percentage */}
                        <td style={{ ...td, minWidth: 140 }}><PercentageBar value={r.percentage} /></td>
                        {/* Solved */}
                        <td style={td}><span style={{ fontSize: 12, fontWeight: 600 }}><span style={{ color: '#38bdf8' }}>{r.completedQuestions}</span><span style={{ color: '#334155' }}>/{r.totalQuestions}</span></span></td>
                        {/* Risk */}
                        <td style={td}><RiskCircle score={r.riskScore} level={r.suspicionLevel} /></td>
                        {/* Events */}
                        <td style={td}><span style={{ background: r.totalSecurityEvents > 5 ? 'rgba(239,68,68,0.1)' : r.totalSecurityEvents > 0 ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)', color: r.totalSecurityEvents > 5 ? '#ef4444' : r.totalSecurityEvents > 0 ? '#f59e0b' : '#22c55e', padding: '3px 9px', borderRadius: 99, fontSize: 12, fontWeight: 700 }}>{r.totalSecurityEvents}</span></td>
                        {/* Top Issues */}
                        <td style={td}>
                          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' as const, maxWidth: 140 }}>
                            {Object.entries(r.securityEventCounts).filter(([, v]) => (v ?? 0) > 0).slice(0, 3).map(([type, count]) => {
                              const m = EVENT_META[type] ?? { icon: '⚠️', color: '#8b949e' };
                              return <span key={type} title={type} style={{ fontSize: 10, background: '#1e293b', color: m.color, padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>{m.icon}{count}</span>;
                            })}
                          </div>
                        </td>
                        {/* PRO */}
                        <td style={td}>
                          {hasPro ? (
                            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 2 }}>
                              {(ps?.faceMissingCount ?? 0) > 0 && <span style={{ fontSize: 10, color: '#f97316' }}>👤 ×{ps!.faceMissingCount}</span>}
                              {(ps?.multipleFacesCount ?? 0) > 0 && <span style={{ fontSize: 10, color: '#ef4444' }}>👥 ×{ps!.multipleFacesCount}</span>}
                              {(ps?.noiseWarningCount ?? 0) > 0 && <span style={{ fontSize: 10, color: '#f59e0b' }}>🔊 ×{ps!.noiseWarningCount}</span>}
                            </div>
                          ) : <span style={{ fontSize: 10, color: '#334155' }}>—</span>}
                        </td>
                        {/* Submitted */}
                        <td style={td}>
                          {r.submittedAt ? (
                            <div>
                              <div style={{ fontSize: 11, color: '#94a3b8' }}>{new Date(r.submittedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                              <div style={{ fontSize: 10, color: '#475569' }}>{new Date(r.submittedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                          ) : <span style={{ color: '#334155', fontSize: 11 }}>—</span>}
                        </td>
                        {/* Report button */}
                        <td style={td}>
                          <button onClick={() => openReport(r)} disabled={isLoading} style={{ display: 'flex', alignItems: 'center', gap: 5, background: isLoading ? '#1e293b' : 'rgba(99,102,241,0.15)', color: isLoading ? '#475569' : '#818cf8', border: `1px solid ${isLoading ? '#334155' : 'rgba(99,102,241,0.3)'}`, borderRadius: 7, padding: '5px 11px', cursor: isLoading ? 'not-allowed' : 'pointer', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' as const }}>
                            {isLoading ? '⏳' : '🔍'} {isLoading ? 'Loading' : 'View Report'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {!loading && filtered.length > 0 && (
            <div style={{ marginTop: 10, textAlign: 'right' as const, fontSize: 10, color: '#334155' }}>
              Rank = completed submissions sorted by percentage · Click View Report for full 5-tab analysis
            </div>
          )}
        </div>
      </div>
    </>
  );
}
