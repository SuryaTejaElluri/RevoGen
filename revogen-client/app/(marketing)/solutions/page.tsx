'use client';

import Link from 'next/link';
import { useState } from 'react';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --void: #03040A; --void2: #060814;
    --card: rgba(16,20,38,0.6); --border: rgba(124,92,255,0.22); --border2: rgba(255,255,255,0.07);
    --nebula: #7C5CFF; --nebula2: #A78BFA; --aqua: #00E5FF;
    --gold: #FFC857; --rose: #FF6FA5; --green: #34E89E;
    --text: #F4F6FF; --muted: #9AA3C7; --muted2: #5E6694;
    --display: 'Space Grotesk', sans-serif; --body: 'Inter', sans-serif;
  }
  body { background: var(--void); color: var(--text); font-family: var(--body); -webkit-font-smoothing: antialiased; overflow-x: hidden; }
  ::selection { background: rgba(124,92,255,0.4); color: #fff; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-thumb { background: linear-gradient(var(--nebula), var(--aqua)); border-radius: 4px; }

  .sp-page { padding-top: 70px; }

  /* Hero */
  .sp-hero {
    padding: 100px 24px 80px; text-align: center;
    background: radial-gradient(ellipse 800px 500px at 50% 0%, rgba(124,92,255,0.15), transparent 65%);
  }
  .sp-badge {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(124,92,255,0.1); border: 1px solid rgba(124,92,255,0.3);
    padding: 6px 18px; border-radius: 100px; font-size: 0.78rem; font-weight: 700;
    color: var(--nebula2); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 28px;
  }
  .sp-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--aqua); box-shadow: 0 0 8px var(--aqua); animation: pulse 2s ease-in-out infinite; }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:.5;transform:scale(.85);} }
  .sp-h1 { font-family: var(--display); font-size: clamp(2.2rem,5vw,4rem); font-weight: 800; letter-spacing: -0.03em; line-height: 1.1; max-width: 820px; margin: 0 auto 22px; }
  .sp-h1 .grad { background: linear-gradient(120deg,var(--nebula2),var(--aqua),var(--rose)); background-size: 200%; -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: shimmer 5s linear infinite; }
  @keyframes shimmer { 0%{background-position:-400px 0;} 100%{background-position:400px 0;} }
  .sp-sub { font-size: 1.1rem; color: var(--muted); max-width: 580px; margin: 0 auto; line-height: 1.75; }

  /* Tab nav */
  .sp-tabs { display: flex; justify-content: center; flex-wrap: wrap; gap: 10px; padding: 48px 24px 0; }
  .sp-tab {
    display: flex; align-items: center; gap: 9px;
    padding: 10px 22px; border-radius: 100px; cursor: pointer; border: none; font-family: var(--body);
    font-size: 0.9rem; font-weight: 600; transition: all 0.22s;
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09); color: var(--muted);
  }
  .sp-tab:hover { background: rgba(255,255,255,0.07); color: var(--text); }
  .sp-tab.active { background: linear-gradient(135deg, var(--nebula), #5B3FD9); color: #fff; border-color: transparent; box-shadow: 0 6px 20px rgba(124,92,255,0.42); }
  .sp-tab-icon { font-size: 1.1rem; }

  /* Content */
  .sp-content { max-width: 1200px; margin: 0 auto; padding: 64px 24px 100px; }

  .sp-panel { display: none; }
  .sp-panel.active { display: block; animation: fadeUp 0.4s ease; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }

  .sp-panel-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center; }
  .sp-panel-grid.flip { direction: rtl; }
  .sp-panel-grid.flip > * { direction: ltr; }

  .sp-panel-label {
    display: inline-flex; align-items: center; gap: 8px;
    color: var(--nebula2); font-size: 0.75rem; font-weight: 700;
    letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 16px;
  }
  .sp-panel-label::before { content:''; width:18px; height:2px; background: linear-gradient(90deg,var(--nebula),var(--aqua)); border-radius:1px; }
  .sp-panel h2 { font-family: var(--display); font-size: clamp(1.7rem,3vw,2.5rem); font-weight: 800; letter-spacing: -0.025em; margin-bottom: 18px; }
  .sp-panel p  { color: var(--muted); font-size: 0.95rem; line-height: 1.78; margin-bottom: 28px; }
  .sp-use-cases { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 34px; }
  .sp-use-case {
    background: rgba(124,92,255,0.08); border: 1px solid rgba(124,92,255,0.18); border-radius: 13px;
    padding: 16px; display: flex; align-items: flex-start; gap: 11px; transition: all 0.2s;
  }
  .sp-use-case:hover { border-color: rgba(124,92,255,0.35); background: rgba(124,92,255,0.12); }
  .sp-uc-icon { font-size: 1.3rem; flex-shrink: 0; margin-top: 2px; }
  .sp-uc-title { font-size: 0.85rem; font-weight: 700; margin-bottom: 4px; }
  .sp-uc-desc  { font-size: 0.78rem; color: var(--muted); line-height: 1.5; }

  .sp-visual {
    background: rgba(16,20,38,0.6); border: 1px solid rgba(255,255,255,0.07); border-radius: 24px;
    overflow: hidden; backdrop-filter: blur(18px);
  }
  .sp-visual-top { background: rgba(255,255,255,0.02); padding: 14px 18px; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid rgba(255,255,255,0.06); }
  .sp-vdot { width: 10px; height: 10px; border-radius: 50%; }
  .sp-visual-body { padding: 24px; display: flex; flex-direction: column; gap: 14px; min-height: 280px; }
  .sp-metric { display: flex; align-items: center; gap: 14px; background: rgba(0,0,0,0.25); border-radius: 12px; padding: 14px 18px; }
  .sp-metric-icon { font-size: 1.5rem; }
  .sp-metric-val { font-family: var(--display); font-size: 1.3rem; font-weight: 700; }
  .sp-metric-label { font-size: 0.75rem; color: var(--muted2); }
  .sp-prog-bar { background: rgba(0,0,0,0.3); border-radius: 6px; height: 6px; overflow: hidden; flex: 1; }
  .sp-prog-fill { height: 100%; border-radius: 6px; background: linear-gradient(90deg, var(--nebula), var(--aqua)); }

  .btn-primary { background: linear-gradient(135deg,var(--nebula),#5B3FD9); color:#fff; font-size:0.95rem; font-weight:700; padding:13px 30px; border-radius:12px; text-decoration:none; transition:all 0.2s; box-shadow:0 8px 24px rgba(124,92,255,0.42); border:none; cursor:pointer; font-family:var(--body); display:inline-block; }
  .btn-primary:hover { transform:translateY(-2px); box-shadow:0 12px 34px rgba(124,92,255,0.6); }

  /* CTA */
  .sp-cta { background:linear-gradient(135deg,rgba(124,92,255,0.14),rgba(0,229,255,0.06)); border-top:1px solid rgba(124,92,255,0.2); border-bottom:1px solid rgba(124,92,255,0.2); padding:80px 24px; text-align:center; }
  .sp-cta h2 { font-family:var(--display); font-size:clamp(1.6rem,3vw,2.4rem); font-weight:700; letter-spacing:-0.025em; margin-bottom:14px; }
  .sp-cta p { color:var(--muted); font-size:1rem; margin-bottom:36px; }

  .sp-footer { background:var(--void2); border-top:1px solid var(--border2); padding:40px 24px; text-align:center; }
  .sp-footer p { color:var(--muted2); font-size:0.82rem; }

  @media (max-width:860px) { .sp-panel-grid { grid-template-columns:1fr; gap:40px; } .sp-panel-grid.flip { direction:ltr; } .sp-use-cases { grid-template-columns:1fr; } }
`;

const AUDIENCES = [
  {
    id: 'students', icon: '🎓', label: 'Students',
    color: '#A78BFA',
    title: 'Launch your tech career with confidence',
    desc: 'Revogen gives students a structured way to practice, measure progress, and walk into interviews ready. From DSA fundamentals to system design — we\'ve got the practice arena and AI feedback to help you level up fast.',
    useCases: [
      { icon: '💪', title: 'Practice Daily', desc: 'Hundreds of coding problems sorted by difficulty and topic' },
      { icon: '📈', title: 'Track Progress', desc: 'See scores, streaks, and topic-wise improvement over time' },
      { icon: '📄', title: 'Resume Review', desc: 'Upload your resume, get an ATS score + skills gap report' },
      { icon: '🎙️', title: 'Mock Interviews', desc: 'AI conducts realistic interviews and gives detailed feedback' },
    ],
    metrics: [
      { icon: '🏆', val: '3.2×', label: 'More likely to pass technical screens', prog: 80 },
      { icon: '⚡', val: '47%', label: 'Faster interview preparation', prog: 47 },
    ],
  },
  {
    id: 'recruiters', icon: '🔍', label: 'Recruiters',
    color: '#00E5FF',
    title: 'Screen technical talent at scale',
    desc: 'Stop drowning in unqualified resumes and scheduling chaos. Revogen automates the screening pipeline — from resume parsing to coding tests to AI mock interviews — so you only spend time on candidates who are actually ready.',
    useCases: [
      { icon: '📋', title: 'Create Assessments', desc: 'Build MCQ + coding tests in minutes with AI assistance' },
      { icon: '✉️', title: 'Invite Candidates', desc: 'Bulk email invitations with automated reminders' },
      { icon: '📊', title: 'Analyse Performance', desc: 'Leaderboards, topic breakdowns, and score comparisons' },
      { icon: '🚀', title: 'Hire Faster', desc: 'Reduce time-to-hire by 70% with automated pipelines' },
    ],
    metrics: [
      { icon: '⏱️', val: '70%', label: 'Reduction in screening time', prog: 70 },
      { icon: '🎯', val: '3×',  label: 'More qualified shortlists', prog: 90 },
    ],
  },
  {
    id: 'colleges', icon: '🏛️', label: 'Colleges',
    color: '#34E89E',
    title: 'Prepare students for the real world',
    desc: 'Revogen\'s platform integrates into college curricula and placement cells — run internal coding contests, conduct mock placement tests, and track which students are placement-ready.',
    useCases: [
      { icon: '📝', title: 'Placement Tests', desc: 'Run mock placement drives with MCQ + coding rounds' },
      { icon: '🏆', title: 'Coding Contests', desc: 'Organise college-wide coding competitions' },
      { icon: '📊', title: 'Batch Analytics', desc: 'See department and batch-level performance dashboards' },
      { icon: '📄', title: 'Resume Prep', desc: 'Help students polish resumes with AI ATS scoring' },
    ],
    metrics: [
      { icon: '🎓', val: '89%', label: 'Placement rate improvement', prog: 89 },
      { icon: '📈', val: '2.4×', label: 'Student coding skills improvement', prog: 75 },
    ],
  },
  {
    id: 'companies', icon: '🏢', label: 'Companies',
    color: '#FFC857',
    title: 'Build elite engineering teams',
    desc: 'From seed-stage startups to enterprise organisations — Revogen gives your hiring team the infrastructure to assess candidates consistently, fairly, and at any scale.',
    useCases: [
      { icon: '🏗️', title: 'Create Assessments', desc: 'Custom coding + MCQ tests for any role or seniority' },
      { icon: '🔒', title: 'Secure Testing', desc: 'Proctored tests with fullscreen, tab, and clipboard controls' },
      { icon: '📊', title: 'Analyse Performance', desc: 'Data-driven hiring decisions with rich reports' },
      { icon: '⚡', title: 'Hire Faster', desc: 'AI automation cuts the hiring cycle from weeks to days' },
    ],
    metrics: [
      { icon: '💰', val: '60%', label: 'Reduction in hiring costs', prog: 60 },
      { icon: '📅', val: '5×',  label: 'Faster time-to-offer', prog: 85 },
    ],
  },
  {
    id: 'bootcamps', icon: '⚡', label: 'Bootcamps',
    color: '#FF6FA5',
    title: 'Validate skills. Prove outcomes.',
    desc: 'Bootcamps live or die by outcomes. Revogen lets you run standardised assessments, track cohort progress, and generate reports that prove your graduates are job-ready to employers.',
    useCases: [
      { icon: '🧪', title: 'Skill Validation', desc: 'Standardised end-of-module coding assessments' },
      { icon: '📊', title: 'Cohort Tracking', desc: 'Monitor every student\'s growth across the program' },
      { icon: '📄', title: 'Resume Workshops', desc: 'AI resume review integrated into curriculum' },
      { icon: '🤝', title: 'Employer Reports', desc: 'Share anonymised performance data with hiring partners' },
    ],
    metrics: [
      { icon: '🏆', val: '92%', label: 'Graduate placement rate', prog: 92 },
      { icon: '⭐', val: '4.9', label: 'Average employer satisfaction score', prog: 96 },
    ],
  },
];

export default function SolutionsPage() {
  const [active, setActive] = useState('students');
  const panel = AUDIENCES.find(a => a.id === active)!;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="sp-page">

        {/* Hero */}
        <section className="sp-hero">
          <div className="sp-badge"><span className="sp-badge-dot" />Solutions By Role</div>
          <h1 className="sp-h1">Built for <span className="grad">every kind of learner</span><br />and hiring team</h1>
          <p className="sp-sub">Whether you&apos;re a student preparing for placements, a recruiter scaling pipelines, or a company building elite teams — Revogen adapts to you.</p>
        </section>

        {/* Tab nav */}
        <div className="sp-tabs">
          {AUDIENCES.map(a => (
            <button
              key={a.id}
              className={`sp-tab${active === a.id ? ' active' : ''}`}
              onClick={() => setActive(a.id)}
            >
              <span className="sp-tab-icon">{a.icon}</span>
              {a.label}
            </button>
          ))}
        </div>

        {/* Panel content */}
        <div className="sp-content">
          <div className={`sp-panel active`}>
            <div className="sp-panel-grid">
              {/* Left — text */}
              <div>
                <div className="sp-panel-label">For {panel.label}</div>
                <h2>{panel.title}</h2>
                <p>{panel.desc}</p>
                <div className="sp-use-cases">
                  {panel.useCases.map(uc => (
                    <div key={uc.title} className="sp-use-case">
                      <span className="sp-uc-icon">{uc.icon}</span>
                      <div>
                        <div className="sp-uc-title">{uc.title}</div>
                        <div className="sp-uc-desc">{uc.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  href={['students','bootcamps'].includes(panel.id) ? '/register/candidate' : '/register/recruiter'}
                  className="btn-primary"
                >
                  Get Started as {panel.label} →
                </Link>
              </div>

              {/* Right — visual */}
              <div>
                <div className="sp-visual">
                  <div className="sp-visual-top">
                    <div className="sp-vdot" style={{ background: '#FF5F57' }} />
                    <div className="sp-vdot" style={{ background: '#FEBC2E' }} />
                    <div className="sp-vdot" style={{ background: '#28C840' }} />
                    <div style={{ flex: 1, background: 'rgba(0,0,0,0.25)', borderRadius: 6, height: 22, marginLeft: 8, display: 'flex', alignItems: 'center', padding: '0 12px' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--muted2)' }}>revogen.ai / {panel.id}</span>
                    </div>
                  </div>
                  <div className="sp-visual-body">
                    <div style={{ fontFamily: 'var(--display)', fontSize: '0.78rem', fontWeight: 700, color: 'var(--nebula2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                      {panel.label} Dashboard
                    </div>
                    {panel.metrics.map(m => (
                      <div key={m.label} className="sp-metric">
                        <span className="sp-metric-icon">{m.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div className="sp-metric-val" style={{ color: panel.color }}>{m.val}</div>
                          <div className="sp-metric-label">{m.label}</div>
                        </div>
                        <div style={{ width: 80 }}>
                          <div className="sp-prog-bar">
                            <div className="sp-prog-fill" style={{ width: `${m.prog}%`, background: `linear-gradient(90deg, ${panel.color}, #5B3FD9)` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                      {panel.useCases.slice(0, 3).map(uc => (
                        <div key={uc.title} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: '10px 14px' }}>
                          <span style={{ fontSize: '1.1rem' }}>{uc.icon}</span>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{uc.title}</span>
                          <div style={{ marginLeft: 'auto', width: 7, height: 7, borderRadius: '50%', background: panel.color, boxShadow: `0 0 8px ${panel.color}` }} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="sp-cta">
          <h2>Ready to see Revogen in action?</h2>
          <p>Start free — no credit card required. Set up your first assessment in under 5 minutes.</p>
          <Link href="/register/recruiter" className="btn-primary">Start for Free →</Link>
        </div>

        <div className="sp-footer">
          <p>© {new Date().getFullYear()} Revogen AI · <Link href="/privacy" style={{ color: 'inherit' }}>Privacy</Link> · <Link href="/terms" style={{ color: 'inherit' }}>Terms</Link></p>
        </div>
      </div>
    </>
  );
}
