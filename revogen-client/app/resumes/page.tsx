'use client';

import { useEffect, useRef, useState } from 'react';
import Navbar from '../../components/Navbar';

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
  amber:       '#F59E0B',
  amberSoft:   '#FFFBEB',
  rose:        '#F43F5E',
  roseSoft:    '#FFF1F3',
  green:       '#10B981',
  greenSoft:   '#ECFDF5',
  shadow:      '0 1px 4px rgba(0,0,0,0.05), 0 6px 20px rgba(0,0,0,0.04)',
  shadowHover: '0 8px 30px rgba(14,165,160,0.15)',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 70 ? C.teal : score >= 40 ? C.amber : C.rose;

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
        <span style={{ fontSize: '30px', fontWeight: 800, color: C.text, fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: '11px', fontWeight: 700, color: C.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>ATS Score</span>
      </div>
    </div>
  );
}

function SkillPill({ label, variant }: { label: string; variant: 'present' | 'missing' }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
      background: variant === 'present' ? C.tealSoft : C.roseSoft,
      color: variant === 'present' ? C.tealDark : C.rose,
      border: `1px solid ${variant === 'present' ? '#B2E4E2' : '#FECDD3'}`,
      letterSpacing: '0.02em',
    }}>
      {variant === 'present' ? '✓' : '+'} {label}
    </span>
  );
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: C.textMuted }}>{label}</span>
        <span style={{ fontSize: '13px', fontWeight: 700, color: C.text, fontFamily: "'DM Mono', monospace" }}>{value}%</span>
      </div>
      <div style={{ height: '6px', background: C.border, borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${value}%`, background: color,
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
        accept=".pdf,.doc,.docx"
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
        {file ? `${(file.size / 1024).toFixed(1)} KB · Click to change` : 'PDF, DOC, DOCX · Click to browse'}
      </p>
    </div>
  );
}

// ─── Resume Card ──────────────────────────────────────────────────────────────

function ResumeCard({
  resume,
  onAnalyze,
  isAnalyzing,
}: {
  resume: any;
  onAnalyze: (id: string) => void;
  isAnalyzing: boolean;
}) {
  const score = resume.atsScore ?? null;
  const color = score === null ? C.textSubtle : score >= 70 ? C.green : score >= 40 ? C.amber : C.rose;
  const colorSoft = score === null ? C.surfaceAlt : score >= 70 ? C.greenSoft : score >= 40 ? C.amberSoft : C.roseSoft;

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
        <p style={{ fontSize: '12px', color: C.textMuted, margin: 0 }}>{resume.fileType ?? 'Document'}</p>
      </div>

      {score !== null && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '5px 12px', borderRadius: '20px',
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
        disabled={isAnalyzing}
        style={{
          background: isAnalyzing
            ? C.border
            : `linear-gradient(135deg, ${C.teal}, ${C.tealDark})`,
          color: isAnalyzing ? C.textMuted : '#fff',
          border: 'none', borderRadius: '10px',
          padding: '9px 18px', fontWeight: 700, fontSize: '13px',
          cursor: isAnalyzing ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', gap: '7px',
          whiteSpace: 'nowrap',
          boxShadow: isAnalyzing ? 'none' : `0 4px 14px ${C.teal}40`,
          transition: 'opacity 0.2s',
          letterSpacing: '0.01em',
        }}
        onMouseEnter={e => { if (!isAnalyzing) (e.currentTarget.style.opacity = '0.85'); }}
        onMouseLeave={e => { (e.currentTarget.style.opacity = '1'); }}
      >
        {isAnalyzing ? (
          <>
            <span style={{
              width: 14, height: 14, border: `2px solid ${C.textMuted}`,
              borderTopColor: 'transparent', borderRadius: '50%',
              display: 'inline-block', animation: 'spin 0.7s linear infinite',
            }} />
            Analyzing…
          </>
        ) : (
          <><span>⚡</span> Analyze</>
        )}
      </button>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ResumePage() {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [resumes, setResumes] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'suggestions'>('overview');

  const loadResumes = async () => {
    const token = localStorage.getItem('access_token');
    const res = await fetch('http://localhost:3000/resumes', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setResumes(data);
  };

  useEffect(() => { loadResumes(); }, []);

  const uploadResume = async () => {
    if (!file || !title) { alert('Title and file required'); return; }
    setUploading(true);
    const token = localStorage.getItem('access_token');
    const formData = new FormData();
    formData.append('title', title);
    formData.append('resume', file);
    const res = await fetch('http://localhost:3000/resumes/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    setUploading(false);
    if (!res.ok) { alert('Upload failed'); return; }
    setTitle(''); setFile(null);
    loadResumes();
  };

  const analyzeResume = async (id: string) => {
    setAnalyzingId(id);
    const token = localStorage.getItem('access_token');
    const res = await fetch(`http://localhost:3000/resumes/${id}/analyze`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setAnalysis(data);
    setAnalyzingId(null);
    loadResumes();
  };

  // Derive sub-scores from analysis (estimated breakdowns)
  const subScores = analysis ? {
    'Keyword Match':    Math.min(100, Math.round((analysis.atsScore ?? 0) * 1.1)),
    'Format & Layout':  Math.min(100, Math.round((analysis.atsScore ?? 0) * 0.9 + 5)),
    'Skills Coverage':  Math.min(100, Math.round(
      ((analysis.skills?.length ?? 0) /
        Math.max(1, (analysis.skills?.length ?? 0) + (analysis.missingSkills?.length ?? 0))) * 100
    )),
    'Readability':      Math.min(100, Math.round((analysis.atsScore ?? 0) * 0.95 + 8)),
  } : null;

  const suggestions = analysis ? [
    analysis.missingSkills?.length > 0 && `Add missing skills: ${analysis.missingSkills.slice(0, 3).join(', ')}`,
    (analysis.atsScore ?? 0) < 70 && 'Use more industry-specific keywords from job descriptions.',
    (analysis.atsScore ?? 0) < 80 && 'Quantify achievements with numbers (e.g., "increased sales by 30%").',
    'Ensure consistent date formatting throughout your resume.',
    'Use bullet points for work experience to improve ATS parsing.',
  ].filter(Boolean) as string[] : [];

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
        input[type="text"]:focus { outline: none; border-color: ${C.teal} !important; box-shadow: 0 0 0 3px ${C.tealSoft}; }
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
              Resume Manager
            </h1>
            <p style={{ fontSize: '13px', color: C.textMuted, marginTop: '3px' }}>
              Upload, manage and analyze your resumes for ATS optimization
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
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: C.text, margin: 0 }}>Upload Resume</h2>
                <p style={{ fontSize: '12px', color: C.textMuted, margin: 0 }}>Supports PDF, DOC, DOCX</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: C.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Resume Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Software Engineer — Google 2024"
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
                    disabled={uploading || !title || !file}
                    style={{
                      width: '100%',
                      background: uploading || !title || !file
                        ? C.border
                        : `linear-gradient(135deg, ${C.teal}, ${C.tealDark})`,
                      color: uploading || !title || !file ? C.textMuted : '#fff',
                      border: 'none', borderRadius: '11px',
                      padding: '13px 24px', fontWeight: 700, fontSize: '14px',
                      cursor: uploading || !title || !file ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      boxShadow: uploading || !title || !file ? 'none' : `0 4px 18px ${C.teal}40`,
                      transition: 'opacity 0.2s',
                      letterSpacing: '0.02em',
                      fontFamily: "'Sora', sans-serif",
                    }}
                    onMouseEnter={e => { if (!uploading && title && file) (e.currentTarget.style.opacity = '0.85'); }}
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
                      <><span>☁️</span> Upload Resume</>
                    )}
                  </button>
                </div>
              </div>

              <UploadZone file={file} onFile={setFile} />
            </div>
          </div>

          {/* ── Analysis Panel ── */}
          {analysis && (
            <div className="analysis-panel" style={{
              background: C.surface, border: `1.5px solid ${C.teal}40`,
              borderRadius: '18px', padding: '32px',
              boxShadow: `0 8px 32px ${C.teal}15`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '9px', background: C.tealSoft,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
                  }}>⚡</div>
                  <div>
                    <h2 style={{ fontSize: '17px', fontWeight: 800, color: C.text, margin: 0 }}>Analysis Results</h2>
                    <p style={{ fontSize: '12px', color: C.textMuted, margin: 0 }}>AI-powered ATS optimization report</p>
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
                >✕ Close</button>
              </div>

              {/* Score + tabs layout */}
              <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
                {/* Left: ring */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                  <ScoreRing score={analysis.atsScore ?? 0} />
                  <div style={{
                    padding: '6px 16px', borderRadius: '20px',
                    background: (analysis.atsScore ?? 0) >= 70 ? C.greenSoft : (analysis.atsScore ?? 0) >= 40 ? C.amberSoft : C.roseSoft,
                    color: (analysis.atsScore ?? 0) >= 70 ? C.green : (analysis.atsScore ?? 0) >= 40 ? C.amber : C.rose,
                    fontSize: '12px', fontWeight: 700, textAlign: 'center',
                  }}>
                    {(analysis.atsScore ?? 0) >= 70 ? '🟢 Strong Profile' : (analysis.atsScore ?? 0) >= 40 ? '🟡 Needs Work' : '🔴 Needs Attention'}
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
                        flex: 1, padding: '7px 12px', borderRadius: '7px',
                        border: 'none', cursor: 'pointer',
                        fontWeight: 700, fontSize: '12px', letterSpacing: '0.03em',
                        textTransform: 'capitalize', fontFamily: "'Sora', sans-serif",
                        background: activeTab === tab ? C.surface : 'transparent',
                        color: activeTab === tab ? C.teal : C.textMuted,
                        boxShadow: activeTab === tab ? C.shadow : 'none',
                        transition: 'all 0.15s',
                      }}>
                        {tab === 'overview' ? '📊 Overview' : tab === 'skills' ? '🏷 Skills' : '💡 Suggestions'}
                      </button>
                    ))}
                  </div>

                  {/* Tab: Overview */}
                  {activeTab === 'overview' && subScores && (
                    <div>
                      {Object.entries(subScores).map(([label, val]) => (
                        <ScoreBar key={label} label={label} value={val} color={val >= 70 ? C.teal : val >= 40 ? C.amber : C.rose} />
                      ))}
                    </div>
                  )}

                  {/* Tab: Skills */}
                  {activeTab === 'skills' && (
                    <div>
                      {analysis.skills?.length > 0 && (
                        <div style={{ marginBottom: '20px' }}>
                          <p style={{ fontSize: '12px', fontWeight: 700, color: C.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '10px' }}>
                            Detected Skills ({analysis.skills.length})
                          </p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {analysis.skills.map((s: string, i: number) => (
                              <SkillPill key={i} label={s} variant="present" />
                            ))}
                          </div>
                        </div>
                      )}
                      {analysis.missingSkills?.length > 0 && (
                        <div>
                          <p style={{ fontSize: '12px', fontWeight: 700, color: C.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '10px' }}>
                            Missing Skills ({analysis.missingSkills.length})
                          </p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {analysis.missingSkills.map((s: string, i: number) => (
                              <SkillPill key={i} label={s} variant="missing" />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab: Suggestions */}
                  {activeTab === 'suggestions' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {suggestions.map((s, i) => (
                        <div key={i} style={{
                          display: 'flex', gap: '12px', alignItems: 'flex-start',
                          padding: '12px 14px',
                          background: C.surfaceAlt,
                          borderRadius: '10px',
                          border: `1px solid ${C.border}`,
                        }}>
                          <span style={{
                            width: 22, height: 22, borderRadius: '50%',
                            background: C.amberSoft, color: C.amber,
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
                }}>🗂</div>
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: 700, color: C.text, margin: 0 }}>My Resumes</h2>
                  <p style={{ fontSize: '12px', color: C.textMuted, margin: 0 }}>Click Analyze to get your ATS score</p>
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
                <p style={{ fontSize: '32px', marginBottom: '12px' }}>📂</p>
                <p style={{ fontWeight: 700, color: C.text, fontSize: '15px', margin: '0 0 4px' }}>No resumes yet</p>
                <p style={{ fontSize: '13px', color: C.textMuted, margin: 0 }}>Upload your first resume above to get started</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {resumes.map((resume, i) => (
                  <div key={resume.id} style={{ animation: `fadeUp 0.35s ease both`, animationDelay: `${i * 50}ms` }}>
                    <ResumeCard
                      resume={resume}
                      onAnalyze={analyzeResume}
                      isAnalyzing={analyzingId === resume.id}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Tips Banner ── */}
          <div className="card" style={{
            background: `linear-gradient(135deg, ${C.indigo}10, ${C.teal}10)`,
            border: `1px solid ${C.indigo}20`,
            borderRadius: '14px', padding: '20px 24px',
            display: 'flex', alignItems: 'flex-start', gap: '16px',
            animationDelay: '120ms',
          }}>
            <span style={{ fontSize: '24px', flexShrink: 0 }}>💡</span>
            <div>
              <p style={{ fontWeight: 700, color: C.text, fontSize: '14px', margin: '0 0 6px' }}>Pro Tips for a Higher ATS Score</p>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                {[
                  'Use keywords from the job description',
                  'Avoid tables and graphics in your resume',
                  'Use standard section headings like "Experience"',
                  'Save as PDF for best compatibility',
                ].map((tip, i) => (
                  <span key={i} style={{ fontSize: '12px', color: C.textMuted, display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ color: C.teal }}>✓</span> {tip}
                  </span>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}