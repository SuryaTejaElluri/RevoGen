'use client';

import { getToken } from '@/lib/auth';
import { useEffect, useRef, useState } from 'react';
import Navbar from '../../components/Navbar';
import { API_BASE_URL } from '@/lib/api';

// ─── Palette ──────────────────────────────────────────────────────────────────

const C = {
  bg:          '#F4F6FB',
  surface:     '#FFFFFF',
  surfaceAlt:  '#F9FAFD',
  border:      '#E3E8F4',
  text:        '#0D1526',
  textMuted:   '#64748B',
  textSubtle:  '#A0ABBD',
  teal:        '#0EA5A0',
  tealSoft:    '#E6F7F6',
  tealDark:    '#0C8A86',
  indigo:      '#4361EE',
  indigoSoft:  '#EEF1FD',
  indigoDark:  '#2C42B5',
  amber:       '#F59E0B',
  amberSoft:   '#FFFBEB',
  rose:        '#F43F5E',
  roseSoft:    '#FFF1F3',
  green:       '#10B981',
  greenSoft:   '#ECFDF5',
  shadow:      '0 1px 4px rgba(0,0,0,0.05), 0 6px 20px rgba(0,0,0,0.04)',
  shadowHover: '0 8px 30px rgba(14,165,160,0.15)',
};

// ─── Roles (loaded from the server: GET /resumes/roles) ─────────────────────

export interface MarketRole {
  id: string;
  title: string;
  category: string;
  icon: string;
  description: string;
  coreSkills: string[];
  bonusSkills: string[];
  tips: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 75 ? C.teal : score >= 45 ? C.amber : C.rose;

  return (
    <div style={{ position: 'relative', width: 140, height: 140, flexShrink: 0 }}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke={C.border} strokeWidth="10" />
        <circle
          cx="70" cy="70" r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={`${circ}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: '32px', fontWeight: 800, color: C.text, fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: '11px', fontWeight: 700, color: C.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>ATS Score</span>
      </div>
    </div>
  );
}

function SkillPill({ label, variant }: { label: string; variant: 'present' | 'missing-core' | 'missing-bonus' }) {
  let bg = C.tealSoft;
  let color = C.tealDark;
  let border = '#B2E4E2';
  let symbol = '✓';

  if (variant === 'missing-core') {
    bg = C.roseSoft;
    color = C.rose;
    border = '#FECDD3';
    symbol = '✕';
  } else if (variant === 'missing-bonus') {
    bg = C.indigoSoft;
    color = C.indigo;
    border = '#C7D2FE';
    symbol = '+';
  }

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
      background: bg,
      color: color,
      border: `1px solid ${border}`,
      letterSpacing: '0.02em',
    }}>
      <span>{symbol}</span> {label}
    </span>
  );
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: C.textMuted }}>{label}</span>
        <span style={{ fontSize: '13px', fontWeight: 700, color: C.text, fontFamily: "'DM Mono', monospace" }}>{value}%</span>
      </div>
      <div style={{ height: '7px', background: C.border, borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${Math.min(100, Math.max(0, value))}%`, background: color,
          borderRadius: '10px', transition: 'width 1s ease',
        }} />
      </div>
    </div>
  );
}

// ─── Upload Zone ──────────────────────────────────────────────────────────────

function UploadZone({
  file, onFile,
}: {
  file: File | null;
  onFile: (f: File) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) onFile(dropped);
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      style={{
        border: `2px dashed ${dragging ? C.teal : file ? C.teal : C.border}`,
        borderRadius: '14px',
        padding: '32px 24px',
        textAlign: 'center',
        cursor: 'pointer',
        background: dragging ? C.tealSoft : file ? C.tealSoft : C.surfaceAlt,
        transition: 'all 0.2s',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx"
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }}
      />
      <div style={{ fontSize: '36px', marginBottom: '12px' }}>
        {file ? '📄' : '☁️'}
      </div>
      <p style={{ fontWeight: 700, color: file ? C.tealDark : C.text, margin: '0 0 4px', fontSize: '15px' }}>
        {file ? file.name : 'Drop your resume here'}
      </p>
      <p style={{ fontSize: '13px', color: C.textMuted, margin: 0 }}>
        {file ? `${(file.size / 1024).toFixed(1)} KB · Click to replace` : 'PDF or DOCX, up to 5 MB · Click to browse'}
      </p>
    </div>
  );
}

// ─── Resume Card ──────────────────────────────────────────────────────────────

function ResumeCard({
  resume,
  onAnalyze,
  isAnalyzing,
  canScore,
}: {
  resume: any;
  onAnalyze: (id: string) => void;
  isAnalyzing: boolean;
  canScore: boolean;
}) {
  const score = resume.analysis?.atsScore ?? resume.atsScore ?? null;
  const scoredFor: string | undefined = resume.analysis?.projects?.targetRole?.title;
  const kind = /pdf/i.test(resume.fileType ?? "") ? "PDF" : /word|officedocument/i.test(resume.fileType ?? "") ? "Word document" : "Document";
  const disabled = isAnalyzing || !canScore;
  const color = score === null ? C.textSubtle : score >= 75 ? C.green : score >= 45 ? C.amber : C.rose;
  const colorSoft = score === null ? C.surfaceAlt : score >= 75 ? C.greenSoft : score >= 45 ? C.amberSoft : C.roseSoft;

  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: '14px',
      padding: '20px 24px',
      display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
      boxShadow: C.shadow,
      transition: 'box-shadow 0.2s, transform 0.2s',
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = C.shadowHover;
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = C.shadow;
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: '10px',
        background: C.indigoSoft, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: '22px', flexShrink: 0,
      }}>📄</div>

      <div style={{ flex: 1, minWidth: 160 }}>
        <p style={{ fontWeight: 700, color: C.text, fontSize: '15px', margin: '0 0 3px' }}>{resume.title}</p>
        <p style={{ fontSize: '12px', color: C.textMuted, margin: 0 }}>{kind}{scoredFor ? ` · last scored for ${scoredFor}` : ' · not scored yet'}</p>
      </div>

      {score !== null && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '6px 14px', borderRadius: '20px',
          background: colorSoft,
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
          <span style={{ fontSize: '13px', fontWeight: 700, color, fontFamily: "'DM Mono', monospace" }}>
            {score} ATS
          </span>
        </div>
      )}

      <button
        onClick={() => onAnalyze(resume.id)}
        disabled={disabled}
        title={!canScore ? 'Choose a role first' : undefined}
        style={{
          background: disabled
            ? C.border
            : `linear-gradient(135deg, ${C.teal}, ${C.tealDark})`,
          color: disabled ? C.textMuted : '#fff',
          border: 'none', borderRadius: '10px',
          padding: '9px 18px', fontWeight: 700, fontSize: '13px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', gap: '7px',
          whiteSpace: 'nowrap',
          boxShadow: disabled ? 'none' : `0 4px 14px ${C.teal}40`,
          transition: 'opacity 0.2s',
          letterSpacing: '0.01em',
        }}
        onMouseEnter={e => { if (!disabled) (e.currentTarget.style.opacity = '0.85'); }}
        onMouseLeave={e => { (e.currentTarget.style.opacity = '1'); }}
      >
        {isAnalyzing ? (
          <>
            <span style={{
              width: 14, height: 14, border: `2px solid ${C.textMuted}`,
              borderTopColor: '#fff', borderRadius: '50%',
              display: 'inline-block', animation: 'spin 0.7s linear infinite',
            }} />
            Evaluating…
          </>
        ) : (
          <><span>⚡</span> Score for this role</>
        )}
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ResumePage() {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [resumes, setResumes] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'suggestions'>('overview');

  // Role selection state — the user must pick a role before uploading or analysing.
  const [roles, setRoles] = useState<MarketRole[]>([]);
  const [rolesError, setRolesError] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [customJdOpen, setCustomJdOpen] = useState(false);
  const [customJd, setCustomJd] = useState('');
  const [error, setError] = useState('');

  const currentRole = roles.find(r => r.id === selectedRoleId) ?? null;
  const usingJd = customJdOpen && customJd.trim().length > 20;
  const canScore = !!currentRole || usingJd;
  const rolesByCategory = roles.reduce<Record<string, MarketRole[]>>((acc, r) => {
    (acc[r.category] ||= []).push(r);
    return acc;
  }, {});

  const loadResumes = async () => {
    const token = getToken();
    const res = await fetch(`${API_BASE_URL}/resumes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setResumes(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    loadResumes();
    fetch(`${API_BASE_URL}/resumes/roles`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setRoles(data);
        else setRolesError('Could not load roles. Refresh the page to try again.');
      })
      .catch(() => setRolesError('Could not load roles. Refresh the page to try again.'));
  }, []);

  const analyzeResume = async (id: string) => {
    setError('');
    if (!canScore) { setError('Choose the role you are applying for first.'); return; }
    setAnalyzingId(id);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/resumes/${id}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          roleId: selectedRoleId || undefined,
          customJd: usingJd ? customJd : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Analysis failed. Please try again.'); return; }
      setAnalysis(data);
      setActiveTab('overview');
      loadResumes();
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setAnalyzingId(null);
    }
  };

  // Upload, then score straight away against the chosen role.
  const uploadResume = async () => {
    setError('');
    if (!canScore) { setError('Choose the role you are applying for first.'); return; }
    if (!file || !title.trim()) { setError('Add a title and choose a file.'); return; }
    setUploading(true);
    try {
      const token = getToken();
      const formData = new FormData();
      formData.append('title', title);
      formData.append('resume', file);
      const res = await fetch(`${API_BASE_URL}/resumes/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.message || 'Upload failed. Please try again.'); return; }
      setTitle(''); setFile(null);
      await loadResumes();
      if (data?.id) await analyzeResume(data.id);
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Real numbers from the server — no derived or estimated sub-scores.
  const subScores = analysis ? [
    {
      label: 'Must-have skills (70% of score)',
      value: analysis.coreMatchPercent ?? 0,
      note: `${analysis.coreMatched?.length ?? 0} of ${analysis.coreSkills?.length ?? 0} found`,
    },
    ...(analysis.bonusSkills?.length ? [{
      label: 'Nice-to-have skills (30% of score)',
      value: analysis.bonusMatchPercent ?? 0,
      note: `${analysis.bonusMatched?.length ?? 0} found · ${analysis.bonusTarget ?? 0} needed for full credit`,
    }] : []),
  ] : [];

  const suggestions: string[] = analysis?.tips ?? [];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=DM+Mono:wght@400;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Sora', sans-serif; }
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .card { animation: fadeUp 0.4s ease both; }
        .analysis-panel { animation: slideIn 0.4s ease both; }
        input[type="text"]:focus, select:focus, textarea:focus {
          outline: none; border-color: ${C.teal} !important;
          box-shadow: 0 0 0 3px ${C.tealSoft};
        }
        ::placeholder { color: ${C.textSubtle}; }
      `}</style>

      <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Sora', sans-serif" }}>
        <Navbar />

        {/* Page header */}
        <div style={{
          background: C.surface,
          borderBottom: `1px solid ${C.border}`,
          padding: '20px 32px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: C.shadow,
        }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: C.text, letterSpacing: '-0.02em', margin: 0 }}>
              AI Resume & ATS Optimizer
            </h1>
            <p style={{ fontSize: '13px', color: C.textMuted, marginTop: '3px' }}>
              Select target industry roles or paste specific JDs to evaluate real market competitiveness
            </p>
          </div>
          <div style={{
            padding: '6px 14px', borderRadius: '20px',
            background: C.tealSoft, color: C.tealDark,
            fontSize: '13px', fontWeight: 700,
          }}>
            {resumes.length} Resume{resumes.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '28px' }}>

          {/* ── Role Selector Bar ── */}
          <div className="card" style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: '18px', padding: '24px 32px',
            boxShadow: C.shadow,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '14px' }}>
              <div>
                <span style={{
                  fontSize: '11px', fontWeight: 800, color: C.indigo, letterSpacing: '0.08em',
                  textTransform: 'uppercase', background: C.indigoSoft, padding: '4px 10px', borderRadius: '20px',
                }}>
                  Target Role Selection
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: C.text, marginTop: '8px', marginBottom: '2px' }}>
                  Evaluate against market role benchmarks
                </h3>
                <p style={{ fontSize: '13px', color: C.textMuted, margin: 0 }}>
                  Resumes will be matched against the core and secondary competencies of your chosen role
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  onClick={() => setCustomJdOpen(!customJdOpen)}
                  style={{
                    background: customJdOpen ? C.indigoSoft : C.surfaceAlt,
                    color: customJdOpen ? C.indigoDark : C.textMuted,
                    border: `1.5px solid ${customJdOpen ? C.indigo : C.border}`,
                    borderRadius: '10px', padding: '9px 16px', fontSize: '13px', fontWeight: 600,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                    fontFamily: "'Sora', sans-serif",
                  }}
                >
                  <span>📋</span> {customJdOpen ? 'Using Custom JD' : '+ Paste Custom JD'}
                </button>
              </div>
            </div>

            {/* Role Dropdown + Preview */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '20px', alignItems: 'center' }}>
              <div>
                <label htmlFor="role-select" style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', marginBottom: '8px' }}>
                  Your target role <span style={{ color: C.rose }}>*</span> ({roles.length || 20} roles)
                </label>
                <select
                  id="role-select"
                  value={selectedRoleId}
                  onChange={e => { setSelectedRoleId(e.target.value); setError(''); }}
                  disabled={!roles.length}
                  style={{
                    width: '100%', padding: '12px 14px',
                    borderRadius: '10px', border: `1.5px solid ${selectedRoleId ? C.teal : C.border}`,
                    background: C.surfaceAlt, color: selectedRoleId ? C.text : C.textMuted,
                    fontSize: '14px', fontWeight: 600, fontFamily: "'Sora', sans-serif",
                    cursor: 'pointer',
                  }}
                >
                  <option value="" disabled>{roles.length ? 'Choose the role you are applying for…' : 'Loading roles…'}</option>
                  {Object.entries(rolesByCategory).map(([category, list]) => (
                    <optgroup key={category} label={category}>
                      {list.map(r => (
                        <option key={r.id} value={r.id}>{r.icon} {r.title}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {rolesError && <p style={{ fontSize: '12px', color: C.rose, margin: '8px 0 0' }}>{rolesError}</p>}
              </div>

              {/* Role preview: what the resume will be scored against */}
              <div style={{
                background: C.surfaceAlt, border: `1px solid ${C.border}`,
                borderRadius: '12px', padding: '14px 18px', minHeight: 92,
              }}>
                {currentRole ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '18px' }}>{currentRole.icon}</span>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: C.text }}>{currentRole.title}</span>
                      <span style={{ fontSize: '11px', color: C.textMuted, background: C.border, padding: '2px 8px', borderRadius: '4px' }}>
                        {currentRole.category}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: C.textMuted, margin: '0 0 8px 0', lineHeight: 1.5 }}>
                      {currentRole.description}
                    </p>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: 6 }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: C.textMuted }}>Must-have:</span>
                      {currentRole.coreSkills.map(s => (
                        <span key={s} style={{ fontSize: '11px', background: C.tealSoft, color: C.tealDark, padding: '1px 7px', borderRadius: '4px', fontWeight: 600 }}>{s}</span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: C.textMuted }}>Nice-to-have:</span>
                      {currentRole.bonusSkills.map(s => (
                        <span key={s} style={{ fontSize: '11px', background: C.indigoSoft, color: C.indigoDark, padding: '1px 7px', borderRadius: '4px', fontWeight: 600 }}>{s}</span>
                      ))}
                    </div>
                  </>
                ) : (
                  <p style={{ fontSize: '13px', color: C.textMuted, margin: 0, lineHeight: 1.6 }}>
                    Pick a role to see the skills your resume will be scored against.
                    Must-have skills count for 70% of the score and nice-to-have skills for 30%.
                  </p>
                )}
              </div>
            </div>

            {/* Custom JD input if expanded */}
            {customJdOpen && (
              <div style={{ marginTop: '20px', borderTop: `1px solid ${C.border}`, paddingTop: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: C.indigo, textTransform: 'uppercase', marginBottom: '8px' }}>
                  Paste Custom Job Description (Optional)
                </label>
                <textarea
                  rows={4}
                  placeholder="Paste the full job description or key technical requirements here to compare against a specific hiring posting..."
                  value={customJd}
                  onChange={e => setCustomJd(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 14px',
                    borderRadius: '10px', border: `1.5px solid ${C.indigo}40`,
                    background: C.surfaceAlt, color: C.text,
                    fontSize: '13px', lineHeight: 1.6, fontFamily: "'Sora', sans-serif",
                  }}
                />
              </div>
            )}
          </div>

          {/* ── Upload Section ── */}
          <div className="card" style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: '18px', padding: '32px',
            boxShadow: C.shadow, animationDelay: '0ms',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '9px',
                background: C.tealSoft, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '18px',
              }}>📤</div>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: C.text, margin: 0 }}>Upload New Resume</h2>
                <p style={{ fontSize: '12px', color: C.textMuted, margin: 0 }}>PDF or Word (.docx), up to 5 MB</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: C.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Resume Identifier / Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alex Chen — Senior Frontend Resume"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  style={{
                    width: '100%', padding: '11px 14px',
                    border: `1.5px solid ${C.border}`, borderRadius: '10px',
                    fontSize: '14px', color: C.text, background: C.surfaceAlt,
                    fontFamily: "'Sora', sans-serif",
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                />

                <div style={{ marginTop: '20px' }}>
                  <button
                    onClick={uploadResume}
                    disabled={uploading || !title || !file || !canScore}
                    style={{
                      width: '100%',
                      background: uploading || !title || !file || !canScore
                        ? C.border
                        : `linear-gradient(135deg, ${C.teal}, ${C.tealDark})`,
                      color: uploading || !title || !file || !canScore ? C.textMuted : '#fff',
                      border: 'none', borderRadius: '11px',
                      padding: '13px 24px', fontWeight: 700, fontSize: '14px',
                      cursor: uploading || !title || !file || !canScore ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      boxShadow: uploading || !title || !file || !canScore ? 'none' : `0 4px 18px ${C.teal}40`,
                      transition: 'opacity 0.2s',
                      letterSpacing: '0.02em',
                      fontFamily: "'Sora', sans-serif",
                    }}
                    onMouseEnter={e => { if (!uploading && title && file && canScore) (e.currentTarget.style.opacity = '0.85'); }}
                    onMouseLeave={e => { (e.currentTarget.style.opacity = '1'); }}
                  >
                    {uploading ? (
                      <>
                        <span style={{
                          width: 16, height: 16, border: '2.5px solid rgba(255,255,255,0.4)',
                          borderTopColor: '#fff', borderRadius: '50%',
                          display: 'inline-block', animation: 'spin 0.7s linear infinite',
                        }} />
                        Uploading…
                      </>
                    ) : (
                      <><span>☁️</span> {canScore ? "Upload and score" : "Choose a role first"}</>
                    )}
                  </button>
                </div>
              </div>

              <UploadZone file={file} onFile={setFile} />
            </div>
          </div>

          {error && (
            <div role="alert" style={{
              background: C.roseSoft, border: `1px solid ${C.rose}40`, color: C.rose,
              borderRadius: '12px', padding: '12px 16px', fontSize: '14px', fontWeight: 600,
            }}>
              {error}
            </div>
          )}

          {/* ── Analysis Results Panel ── */}
          {analysis && (
            <div className="analysis-panel" style={{
              background: C.surface, border: `1.5px solid ${C.teal}40`,
              borderRadius: '18px', padding: '32px',
              boxShadow: `0 8px 32px ${C.teal}15`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '10px', background: C.tealSoft,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
                  }}>⚡</div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: 0 }}>
                        ATS Optimization Report
                      </h2>
                      <span style={{
                        fontSize: '11px', fontWeight: 700, color: C.indigo, background: C.indigoSoft,
                        padding: '3px 10px', borderRadius: '20px',
                      }}>
                        {analysis.targetRole?.title || currentRole?.title}
                      </span>
                    </div>
                    <p style={{ fontSize: '13px', color: C.textMuted, margin: '2px 0 0' }}>
                      Score = 70% must-have skills + 30% nice-to-have skills for this role
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setAnalysis(null)}
                  style={{
                    background: 'transparent', border: `1px solid ${C.border}`,
                    borderRadius: '8px', padding: '6px 14px',
                    fontSize: '12px', fontWeight: 600, color: C.textMuted,
                    cursor: 'pointer', fontFamily: "'Sora', sans-serif",
                  }}
                >✕ Close Report</button>
              </div>

              {/* Score + tabs layout */}
              <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
                {/* Left: ring */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                  <ScoreRing score={analysis.atsScore ?? 0} />
                  <div style={{
                    padding: '6px 18px', borderRadius: '20px',
                    background: (analysis.atsScore ?? 0) >= 80 ? C.greenSoft : (analysis.atsScore ?? 0) >= 40 ? C.amberSoft : C.roseSoft,
                    color: (analysis.atsScore ?? 0) >= 80 ? C.green : (analysis.atsScore ?? 0) >= 40 ? C.amber : C.rose,
                    fontSize: '12px', fontWeight: 700, textAlign: 'center',
                  }}>
                    {analysis.rating ?? 'Match score'}
                  </div>
                </div>

                {/* Right: tabs */}
                <div style={{ flex: 1, minWidth: 280 }}>
                  {/* Tab bar */}
                  <div style={{
                    display: 'flex', gap: '4px', marginBottom: '20px',
                    background: C.surfaceAlt, padding: '4px', borderRadius: '10px',
                    border: `1px solid ${C.border}`,
                  }}>
                    {(['overview', 'skills', 'suggestions'] as const).map(tab => (
                      <button key={tab} onClick={() => setActiveTab(tab)} style={{
                        flex: 1, padding: '8px 12px', borderRadius: '7px',
                        border: 'none', cursor: 'pointer',
                        fontWeight: 700, fontSize: '12px', letterSpacing: '0.03em',
                        textTransform: 'capitalize', fontFamily: "'Sora', sans-serif",
                        background: activeTab === tab ? C.surface : 'transparent',
                        color: activeTab === tab ? C.teal : C.textMuted,
                        boxShadow: activeTab === tab ? C.shadow : 'none',
                        transition: 'all 0.15s',
                      }}>
                        {tab === 'overview' ? '📊 Match Breakdown' : tab === 'skills' ? '🏷️ Skill Alignment' : '💡 Actionable Tips'}
                      </button>
                    ))}
                  </div>

                  {/* Tab: Overview */}
                  {activeTab === 'overview' && (
                    <div>
                      {subScores.map(s => (
                        <div key={s.label} style={{ marginBottom: 6 }}>
                          <ScoreBar label={s.label} value={s.value} color={s.value >= 80 ? C.teal : s.value >= 40 ? C.amber : C.rose} />
                          <p style={{ fontSize: '12px', color: C.textMuted, margin: '-8px 0 12px' }}>{s.note}</p>
                        </div>
                      ))}
                      {analysis.coreMissing?.length > 0 ? (
                        <p style={{ fontSize: '13px', color: C.text, background: C.roseSoft, borderRadius: 10, padding: '10px 14px', margin: '8px 0 0', lineHeight: 1.55 }}>
                          <b>Biggest gain:</b> add {analysis.coreMissing.join(', ')}. Each missing must-have costs about {Math.round(70 / Math.max(1, analysis.coreSkills?.length ?? 1))} points.
                        </p>
                      ) : (
                        <p style={{ fontSize: '13px', color: C.tealDark, background: C.tealSoft, borderRadius: 10, padding: '10px 14px', margin: '8px 0 0' }}>
                          All must-have skills for this role were found.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Tab: Skills */}
                  {activeTab === 'skills' && (
                    <div>
                      {[
                        { title: 'Must-haves found', items: analysis.coreMatched, variant: 'present' as const, color: C.tealDark },
                        { title: 'Must-haves missing', items: analysis.coreMissing ?? analysis.missingSkills, variant: 'missing-core' as const, color: C.rose },
                        { title: 'Nice-to-haves found', items: analysis.bonusMatched, variant: 'present' as const, color: C.tealDark },
                        { title: 'Nice-to-haves to consider', items: analysis.bonusMissing ?? analysis.bonusMissingSkills, variant: 'missing-bonus' as const, color: C.indigo },
                      ].filter(g => g.items?.length > 0).map(g => (
                        <div key={g.title} style={{ marginBottom: '18px' }}>
                          <p style={{ fontSize: '11px', fontWeight: 800, color: g.color, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}>
                            {g.title} ({g.items.length})
                          </p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {g.items.map((s: string) => <SkillPill key={s} label={s} variant={g.variant} />)}
                          </div>
                        </div>
                      ))}

                      {analysis.impliedSkills?.length > 0 && (
                        <p style={{ fontSize: '12px', color: C.textMuted, margin: '0 0 14px', lineHeight: 1.55 }}>
                          Credited from related skills (not written on your resume): <b style={{ color: C.text }}>{analysis.impliedSkills.join(', ')}</b>.
                          Write them out so keyword filters find them.
                        </p>
                      )}

                      {analysis.otherSkills?.length > 0 && (
                        <div>
                          <p style={{ fontSize: '11px', fontWeight: 800, color: C.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}>
                            Other skills on your resume ({analysis.otherSkills.length})
                          </p>
                          <p style={{ fontSize: '12px', color: C.textMuted, margin: 0, lineHeight: 1.7 }}>
                            {analysis.otherSkills.join(' · ')}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab: Suggestions */}
                  {activeTab === 'suggestions' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {suggestions.map((s: string, i: number) => (
                        <div key={i} style={{
                          display: 'flex', gap: '12px', alignItems: 'flex-start',
                          padding: '12px 14px',
                          background: C.surfaceAlt,
                          borderRadius: '10px',
                          border: `1px solid ${C.border}`,
                        }}>
                          <span style={{
                            width: 22, height: 22, borderRadius: '50%',
                            background: C.tealSoft, color: C.tealDark,
                            fontSize: '11px', fontWeight: 800,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, marginTop: '1px',
                          }}>{i + 1}</span>
                          <p style={{ fontSize: '13px', color: C.text, lineHeight: 1.55, margin: 0, fontWeight: 500 }}>{s}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Resume List ── */}
          <div className="card" style={{ animationDelay: '80ms' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '9px', background: C.indigoSoft,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
                }}>📁</div>
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: 700, color: C.text, margin: 0 }}>My Resumes</h2>
                  <p style={{ fontSize: '12px', color: C.textMuted, margin: 0 }}>
                    Pick a role above, then score any resume against it
                  </p>
                </div>
              </div>
            </div>

            {resumes.length === 0 ? (
              <div style={{
                background: C.surface, border: `1px dashed ${C.border}`,
                borderRadius: '14px', padding: '48px 24px',
                textAlign: 'center',
                boxShadow: C.shadow,
              }}>
                <p style={{ fontSize: '32px', marginBottom: '12px' }}>📁</p>
                <p style={{ fontWeight: 700, color: C.text, fontSize: '15px', margin: '0 0 4px' }}>No resumes uploaded yet</p>
                <p style={{ fontSize: '13px', color: C.textMuted, margin: 0 }}>Choose your role and upload a resume above to get your ATS score</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {resumes.map((resume, i) => (
                  <div key={resume.id} style={{ animation: `fadeUp 0.35s ease both`, animationDelay: `${i * 50}ms` }}>
                    <ResumeCard
                      resume={resume}
                      onAnalyze={analyzeResume}
                      isAnalyzing={analyzingId === resume.id}
                      canScore={canScore}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
