'use client';

import { getToken } from '@/lib/auth';
import { useEffect, useRef, useState } from 'react';
import Navbar, { Icon } from '../../components/Navbar';
import { API_BASE_URL } from '@/lib/api';

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

interface Resume {
  id: string;
  title: string;
  fileType?: string;
  createdAt?: string;
  analysis?: { atsScore?: number; projects?: { targetRole?: { title?: string } } } | null;
}

interface Analysis {
  atsScore: number;
  rating?: string;
  targetRole?: { title?: string };
  coreSkills?: string[];
  bonusSkills?: string[];
  coreMatched?: string[];
  coreMissing?: string[];
  bonusMatched?: string[];
  bonusMissing?: string[];
  bonusTarget?: number;
  impliedSkills?: string[];
  otherSkills?: string[];
  coreMatchPercent?: number;
  bonusMatchPercent?: number;
  missingSkills?: string[];
  bonusMissingSkills?: string[];
  tips?: string[];
}

const tone = (score: number) => (score >= 80 ? 'var(--green)' : score >= 40 ? 'var(--amber)' : 'var(--rose)');

// ─── Pieces ───────────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const size = 128, r = 54, c = 2 * Math.PI * r;
  return (
    <div className="bx-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="10" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={score >= 80 ? 'var(--lime)' : score >= 40 ? '#FBBF24' : '#FB7185'} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(100, score) / 100)} style={{ transition: 'stroke-dashoffset .9s ease' }} />
      </svg>
      <b style={{ fontSize: 34, color: '#fff' }}>{score}</b>
    </div>
  );
}

function SkillGroup({ title, items, chip }: { title: string; items?: string[]; chip: string }) {
  if (!items?.length) return null;
  return (
    <div style={{ marginBottom: 16 }}>
      <div className="t2" style={{ fontWeight: 500, color: 'var(--ink2)', marginBottom: 8 }}>{title} <span style={{ color: 'var(--dim)' }}>· {items.length}</span></div>
      <div className="chips">{items.map(s => <span key={s} className={`chip ${chip}`}>{s}</span>)}</div>
    </div>
  );
}

function UploadZone({ file, onFile }: { file: File | null; onFile: (f: File) => void }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click(); } }}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) onFile(f); }}
      className={`drop ${dragging ? 'drag' : ''} ${file ? 'has' : ''}`}
      aria-label={file ? `Selected ${file.name}. Click to replace.` : 'Choose a resume file'}
    >
      <input ref={inputRef} type="file" accept=".pdf,.docx" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
      <span className={`ico ${file ? 'lime' : 'indigo'}`}><Icon name={file ? 'check' : 'upload'} /></span>
      <div>
        <p className="t1" style={{ whiteSpace: 'normal' }}>{file ? file.name : 'Drop your resume here, or click to browse'}</p>
        <p className="t2">{file ? `${(file.size / 1024).toFixed(0)} KB · click to replace` : 'PDF or Word (.docx), up to 5 MB'}</p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ResumePage() {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

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
    const token = getToken();
    fetch(`${API_BASE_URL}/resumes`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setResumes(Array.isArray(data) ? data : []))
      .catch(() => setError('Could not load your resumes. Refresh the page to try again.'));
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
      loadResumes();
      setTimeout(() => reportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
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

  const busy = uploading || !!analyzingId;
  const uploadDisabled = busy || !title.trim() || !file || !canScore;
  const coreMissing = analysis?.coreMissing ?? analysis?.missingSkills ?? [];
  const pointsPerCore = Math.round(70 / Math.max(1, analysis?.coreSkills?.length ?? 1));

  return (
    <div className="bx">
      <Navbar />
      <main className="wrap">
        <div className="head fade">
          <div>
            <h1>Resume ATS check</h1>
            <p>Pick the role you’re applying for, upload your resume, and see which skills recruiters will find, and which they won’t.</p>
          </div>
          <span className="chip dark">{resumes.length} resume{resumes.length === 1 ? '' : 's'}</span>
        </div>

        {/* Step 1 + Step 2 */}
        <div className="grid fade rz-steps">
          <section className="tile line">
            <div className="tile-h">
              <h2><span className="step">1</span>Choose your role</h2>
              <button className={`btn sm ${customJdOpen ? 'dark' : ''}`} onClick={() => setCustomJdOpen(o => !o)}>
                <Icon name="clip" size={14} />{customJdOpen ? 'Using job description' : 'Paste a job description'}
              </button>
            </div>
            <div className="field">
              <label htmlFor="role-select">Target role <span style={{ color: 'var(--rose)' }}>*</span></label>
              <select id="role-select" className="input" value={selectedRoleId} onChange={e => { setSelectedRoleId(e.target.value); setError(''); }} disabled={!roles.length}>
                <option value="" disabled>{roles.length ? `Choose from ${roles.length} roles…` : rolesError ? 'Roles unavailable' : 'Loading roles…'}</option>
                {Object.entries(rolesByCategory).map(([category, list]) => (
                  <optgroup key={category} label={category}>
                    {list.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                  </optgroup>
                ))}
              </select>
              {rolesError && <span className="t2" style={{ color: 'var(--rose)' }}>{rolesError}</span>}
            </div>

            {currentRole ? (
              <div className="role-prev">
                <p className="t2" style={{ margin: '0 0 10px' }}>{currentRole.description}</p>
                <div className="t2" style={{ fontWeight: 500, color: 'var(--ink2)', margin: '0 0 6px' }}>Must-have · 70% of score</div>
                <div className="chips" style={{ marginBottom: 10 }}>{currentRole.coreSkills.map(s => <span key={s} className="chip dark">{s}</span>)}</div>
                <div className="t2" style={{ fontWeight: 500, color: 'var(--ink2)', margin: '0 0 6px' }}>Nice-to-have · 30% of score</div>
                <div className="chips">{currentRole.bonusSkills.map(s => <span key={s} className="chip">{s}</span>)}</div>
              </div>
            ) : (
              <p className="t2" style={{ marginTop: 14 }}>Pick a role to see the exact skills your resume will be scored against.</p>
            )}

            {customJdOpen && (
              <div className="field" style={{ marginTop: 14 }}>
                <label htmlFor="jd">Job description <span className="t2" style={{ fontWeight: 400 }}>(overrides the role)</span></label>
                <textarea id="jd" className="input" rows={4} placeholder="Paste the full job posting here" value={customJd} onChange={e => setCustomJd(e.target.value)} />
              </div>
            )}
          </section>

          <section className="tile line">
            <div className="tile-h"><h2><span className="step">2</span>Upload your resume</h2></div>
            <div className="field" style={{ marginBottom: 12 }}>
              <label htmlFor="rz-title">Title</label>
              <input id="rz-title" className="input" placeholder="For example: Priya, backend, Nov 2026" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <UploadZone file={file} onFile={setFile} />
            <button className="btn dark block" style={{ marginTop: 12 }} onClick={uploadResume} disabled={uploadDisabled}>
              {uploading
                ? <><span className="spin" style={{ width: 14, height: 14, borderTopColor: '#fff' }} />Uploading and scoring…</>
                : canScore ? <>Upload and score<Icon name="arrow" size={16} /></> : 'Choose a role first'}
            </button>
          </section>
        </div>

        {error && <div className="alert fade" role="alert" style={{ marginTop: 12 }}>{error}</div>}

        {/* Report */}
        {analysis && (
          <div ref={reportRef} className="fade" style={{ marginTop: 12, scrollMarginTop: 80 }}>
            <div className="grid rz-report">
              <section className="tile dark rz-score">
                <div className="lbl"><Icon name="target" size={15} />{analysis.targetRole?.title ?? currentRole?.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 18, margin: '14px 0' }}>
                  <ScoreRing score={analysis.atsScore ?? 0} />
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-.02em' }}>{analysis.rating ?? 'Match score'}</div>
                    <div className="sub">70% must-haves + 30% nice-to-haves</div>
                  </div>
                </div>
                <button className="btn sm" style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,.1)', color: '#fff', borderColor: 'transparent' }} onClick={() => setAnalysis(null)}>
                  <Icon name="x" size={14} />Close report
                </button>
              </section>

              <section className="tile indigo">
                <div className="lbl"><Icon name="check" size={15} />Must-have skills</div>
                <div className="num">{analysis.coreMatchPercent ?? 0}<small>%</small></div>
                <div className="bar" style={{ margin: '10px 0 6px', background: 'rgba(255,255,255,.6)' }}><i style={{ width: `${analysis.coreMatchPercent ?? 0}%` }} /></div>
                <div className="sub">{analysis.coreMatched?.length ?? 0} of {analysis.coreSkills?.length ?? 0} found</div>
              </section>

              {(analysis.bonusSkills?.length ?? 0) > 0 && (
                <section className="tile lime">
                  <div className="lbl"><Icon name="spark" size={15} />Nice-to-have skills</div>
                  <div className="num">{analysis.bonusMatchPercent ?? 0}<small>%</small></div>
                  <div className="bar" style={{ margin: '10px 0 6px', background: 'rgba(255,255,255,.6)' }}><i style={{ width: `${analysis.bonusMatchPercent ?? 0}%`, background: 'var(--green)' }} /></div>
                  <div className="sub">{analysis.bonusMatched?.length ?? 0} found · {analysis.bonusTarget ?? 0} for full credit</div>
                </section>
              )}

              <section className={`tile ${coreMissing.length ? 'rose' : 'lime'} rz-gain`}>
                <div className="lbl"><Icon name={coreMissing.length ? 'alert' : 'trophy'} size={15} />{coreMissing.length ? 'Biggest gain' : 'All must-haves found'}</div>
                {coreMissing.length ? (
                  <>
                    <div style={{ fontSize: 17, fontWeight: 600, margin: '8px 0 4px', lineHeight: 1.3 }}>Add {coreMissing.join(', ')}</div>
                    <div className="sub">Each missing must-have costs about {pointsPerCore} points.</div>
                  </>
                ) : (
                  <div className="sub" style={{ marginTop: 8 }}>Every must-have skill for this role is on your resume. Nice work.</div>
                )}
              </section>
            </div>

            <div className="grid rz-detail" style={{ marginTop: 12 }}>
              <section className="tile line">
                <div className="tile-h"><h2>Skills</h2></div>
                <SkillGroup title="Must-haves found" items={analysis.coreMatched} chip="green" />
                <SkillGroup title="Must-haves missing" items={coreMissing} chip="rose" />
                <SkillGroup title="Nice-to-haves found" items={analysis.bonusMatched} chip="indigo" />
                <SkillGroup title="Nice-to-haves to consider" items={analysis.bonusMissing ?? analysis.bonusMissingSkills} chip="out" />
                {(analysis.impliedSkills?.length ?? 0) > 0 && (
                  <p className="t2" style={{ margin: '0 0 14px' }}>
                    Credited from related skills (not written on your resume): <b style={{ color: 'var(--ink)' }}>{analysis.impliedSkills!.join(', ')}</b>. Write them out so keyword filters find them.
                  </p>
                )}
                {(analysis.otherSkills?.length ?? 0) > 0 && (
                  <p className="t2" style={{ margin: 0 }}>Other skills on your resume: {analysis.otherSkills!.join(' · ')}</p>
                )}
              </section>

              <section className="tile line">
                <div className="tile-h"><h2>What to do next</h2></div>
                <ol className="tips-list">
                  {(analysis.tips ?? []).map((tip, i) => <li key={i}><span>{i + 1}</span>{tip}</li>)}
                </ol>
              </section>
            </div>
          </div>
        )}

        {/* My resumes */}
        <section className="tile line fade" style={{ marginTop: 12 }}>
          <div className="tile-h">
            <h2>My resumes</h2>
            {!canScore && resumes.length > 0 && <span className="t2">Pick a role above to score any resume</span>}
          </div>
          {resumes.length === 0 ? (
            <div className="empty">
              <span className="ico indigo"><Icon name="file" size={22} /></span>
              <b>No resumes yet</b>
              Choose your role and upload a resume above to get your ATS score.
            </div>
          ) : (
            <div className="rows">
              {resumes.map(resume => {
                const score = resume.analysis?.atsScore ?? null;
                const scoredFor = resume.analysis?.projects?.targetRole?.title;
                const kind = /pdf/i.test(resume.fileType ?? '') ? 'PDF' : /word|officedocument/i.test(resume.fileType ?? '') ? 'Word' : 'Document';
                const isAnalyzing = analyzingId === resume.id;
                return (
                  <div className="row" key={resume.id}>
                    <span className="ico"><Icon name="file" /></span>
                    <div className="grow">
                      <p className="t1">{resume.title}</p>
                      <p className="t2">{kind}{scoredFor ? ` · last scored for ${scoredFor}` : ' · not scored yet'}</p>
                    </div>
                    {score !== null && (
                      <span className="chip" style={{ background: 'var(--bg)', color: tone(score), fontWeight: 600 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: tone(score) }} />{score} ATS
                      </span>
                    )}
                    <button className="btn sm dark" disabled={busy || !canScore} onClick={() => analyzeResume(resume.id)} title={!canScore ? 'Choose a role first' : undefined}>
                      {isAnalyzing ? <><span className="spin" style={{ width: 12, height: 12, borderTopColor: '#fff' }} />Scoring…</> : <>Score<span className="rz-hide"> for this role</span></>}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <style>{`
        .bx .rz-steps{grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);align-items:start}
        .bx .step{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:var(--dark);color:var(--lime);font-size:12.5px;font-weight:600;margin-right:10px;vertical-align:1px}
        .bx .role-prev{margin-top:14px;background:var(--bg);border-radius:14px;padding:14px}
        .bx .drop{display:flex;align-items:center;gap:14px;border:1.5px dashed var(--line2);border-radius:14px;padding:18px;background:var(--bg);cursor:pointer;transition:border-color .15s,background .15s}
        .bx .drop:hover,.bx .drop.drag{border-color:var(--indigo);background:var(--indigo-bg)}
        .bx .drop.has{border-style:solid;border-color:var(--lime);background:var(--lime-bg)}
        .bx .drop:focus-visible{outline:none;box-shadow:0 0 0 3px rgba(79,70,229,.25)}
        .bx .rz-report{grid-template-columns:minmax(0,1.4fr) repeat(3,minmax(0,1fr))}
        .bx .rz-score{display:flex;flex-direction:column;grid-row:span 1}
        .bx .rz-detail{grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);align-items:start}
        .bx .tips-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px}
        .bx .tips-list li{display:flex;gap:12px;font-size:14px;color:var(--ink2);line-height:1.55}
        .bx .tips-list span{flex-shrink:0;width:24px;height:24px;border-radius:8px;background:var(--bg);color:var(--ink);font-size:12px;font-weight:600;display:flex;align-items:center;justify-content:center}
        @media (max-width:1000px){
          .bx .rz-steps,.bx .rz-detail{grid-template-columns:1fr}
          .bx .rz-report{grid-template-columns:1fr 1fr}
          .bx .rz-score{grid-column:1/-1}
        }
        @media (max-width:560px){.bx .rz-hide{display:none}.bx .rz-report{grid-template-columns:1fr}}
      `}</style>
    </div>
  );
}
