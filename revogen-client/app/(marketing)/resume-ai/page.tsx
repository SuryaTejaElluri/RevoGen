'use client';

import Link from 'next/link';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --void: #03040A; --void2: #060814;
    --card: rgba(16,20,38,0.6); --border: rgba(52,232,158,0.22); --border2: rgba(255,255,255,0.07);
    --nebula: #7C5CFF; --nebula2: #A78BFA; --aqua: #00E5FF;
    --green: #34E89E; --green2: #6EF0BC; --gold: #FFC857;
    --text: #F4F6FF; --muted: #9AA3C7; --muted2: #5E6694;
    --display: 'Space Grotesk', sans-serif; --body: 'Inter', sans-serif;
  }
  body { background: var(--void); color: var(--text); font-family: var(--body); -webkit-font-smoothing: antialiased; overflow-x: hidden; }
  ::selection { background: rgba(52,232,158,0.35); color: #000; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-thumb { background: linear-gradient(var(--green), var(--aqua)); border-radius: 4px; }

  .rp-page { padding-top: 70px; }

  /* Hero */
  .rp-hero { padding: 100px 24px 80px; text-align: center; background: radial-gradient(ellipse 800px 500px at 50% 0%, rgba(52,232,158,0.12), transparent 65%), radial-gradient(ellipse 600px 400px at 80% 60%, rgba(0,229,255,0.08), transparent 60%); }
  .rp-badge { display:inline-flex; align-items:center; gap:8px; background:rgba(52,232,158,0.1); border:1px solid rgba(52,232,158,0.3); padding:6px 18px; border-radius:100px; font-size:0.78rem; font-weight:700; color:var(--green2); letter-spacing:0.08em; text-transform:uppercase; margin-bottom:28px; }
  .rp-badge-dot { width:6px; height:6px; border-radius:50%; background:var(--green); box-shadow:0 0 8px var(--green); animation:pulse 2s ease-in-out infinite; }
  @keyframes pulse{0%,100%{opacity:1;transform:scale(1);}50%{opacity:.5;transform:scale(.85);}}
  .rp-h1 { font-family:var(--display); font-size:clamp(2.2rem,5vw,4rem); font-weight:800; letter-spacing:-0.03em; line-height:1.1; max-width:820px; margin:0 auto 22px; }
  .rp-h1 .grad { background:linear-gradient(120deg,var(--green),var(--aqua),var(--nebula2)); background-size:200%; -webkit-background-clip:text; -webkit-text-fill-color:transparent; animation:shimmer 5s linear infinite; }
  @keyframes shimmer{0%{background-position:-400px 0;}100%{background-position:400px 0;}}
  .rp-sub { font-size:1.1rem; color:var(--muted); max-width:580px; margin:0 auto 42px; line-height:1.75; }
  .rp-cta-row { display:flex; gap:14px; justify-content:center; flex-wrap:wrap; }
  .btn-primary { background:linear-gradient(135deg,var(--green),#1FA876); color:#000; font-size:0.95rem; font-weight:700; padding:13px 30px; border-radius:12px; text-decoration:none; transition:all 0.2s; box-shadow:0 8px 24px rgba(52,232,158,0.35); border:none; cursor:pointer; font-family:var(--body); display:inline-block; }
  .btn-primary:hover { transform:translateY(-2px); box-shadow:0 12px 34px rgba(52,232,158,0.5); }
  .btn-ghost { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.14); color:var(--text); font-size:0.95rem; font-weight:600; padding:13px 30px; border-radius:12px; text-decoration:none; transition:all 0.2s; display:inline-block; }
  .btn-ghost:hover { background:rgba(255,255,255,0.08); border-color:var(--green); }

  /* Section */
  .rp-section { padding:90px 24px; }
  .rp-inner { max-width:1200px; margin:0 auto; }
  .rp-label { display:inline-flex; align-items:center; gap:9px; color:var(--green2); font-size:0.75rem; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; margin-bottom:16px; }
  .rp-label::before { content:''; width:20px; height:2px; background:linear-gradient(90deg,var(--green),var(--aqua)); border-radius:1px; }
  .rp-h2 { font-family:var(--display); font-size:clamp(1.7rem,3.5vw,2.6rem); font-weight:700; letter-spacing:-0.025em; line-height:1.2; margin-bottom:14px; }
  .rp-section-sub { color:var(--muted); font-size:1rem; line-height:1.75; max-width:560px; margin-bottom:56px; }

  /* Pipeline */
  .rp-pipeline { display:flex; align-items:stretch; justify-content:center; gap:0; flex-wrap:wrap; }
  .rp-pipe-step { flex:1; min-width:160px; max-width:220px; display:flex; flex-direction:column; align-items:center; text-align:center; gap:12px; position:relative; }
  .rp-pipe-icon { width:72px; height:72px; border-radius:22px; background:var(--card); border:1px solid rgba(52,232,158,0.25); display:flex; align-items:center; justify-content:center; font-size:32px; box-shadow:0 8px 24px rgba(0,0,0,0.3); }
  .rp-pipe-num { font-family:var(--display); font-size:0.7rem; color:var(--green2); font-weight:700; letter-spacing:0.07em; }
  .rp-pipe-label { font-family:var(--display); font-size:0.92rem; font-weight:700; }
  .rp-pipe-desc { font-size:0.78rem; color:var(--muted); line-height:1.5; }
  .rp-pipe-arrow { display:flex; align-items:center; padding:0 8px; padding-top:36px; }
  .rp-arrow { width:40px; height:2px; background:linear-gradient(90deg,var(--green),var(--aqua)); border-radius:1px; position:relative; }
  .rp-arrow::after { content:'▶'; position:absolute; right:-6px; top:50%; transform:translateY(-50%); color:var(--aqua); font-size:10px; }

  /* Score display */
  .rp-score-demo { background:var(--void2); }
  .rp-demo-grid { display:grid; grid-template-columns:1fr 1fr; gap:48px; align-items:center; }
  .rp-score-card { background:var(--card); border:1px solid rgba(52,232,158,0.2); border-radius:26px; padding:36px; backdrop-filter:blur(18px); }
  .rp-score-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:28px; }
  .rp-score-title { font-family:var(--display); font-size:1rem; font-weight:700; }
  .rp-score-badge { background:rgba(52,232,158,0.12); border:1px solid rgba(52,232,158,0.25); border-radius:100px; padding:5px 14px; font-size:0.75rem; font-weight:700; color:var(--green2); }
  .rp-score-ring-wrap { display:flex; align-items:center; gap:28px; margin-bottom:28px; }
  .rp-score-ring { width:120px; height:120px; border-radius:50%; background:conic-gradient(var(--green) 82%, rgba(255,255,255,0.06) 0); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .rp-score-ring-inner { width:88px; height:88px; border-radius:50%; background:var(--void2); display:flex; flex-direction:column; align-items:center; justify-content:center; }
  .rp-score-num { font-family:var(--display); font-size:1.7rem; font-weight:800; color:var(--green); }
  .rp-score-lbl { font-size:0.65rem; color:var(--muted2); }
  .rp-score-breakdown { flex:1; display:flex; flex-direction:column; gap:10px; }
  .rp-score-row { display:flex; align-items:center; gap:10px; font-size:0.8rem; }
  .rp-score-row-label { color:var(--muted); width:100px; flex-shrink:0; }
  .rp-score-bar { flex:1; background:rgba(255,255,255,0.06); border-radius:4px; height:6px; overflow:hidden; }
  .rp-score-fill { height:100%; border-radius:4px; }
  .rp-score-pct { color:var(--text); font-weight:600; width:32px; text-align:right; font-size:0.78rem; }
  .rp-missing-skills { background:rgba(255,111,165,0.06); border:1px solid rgba(255,111,165,0.18); border-radius:14px; padding:18px; margin-top:18px; }
  .rp-missing-title { font-size:0.8rem; font-weight:700; color:#FF6FA5; margin-bottom:10px; }
  .rp-missing-tags { display:flex; flex-wrap:wrap; gap:7px; }
  .rp-missing-tag { background:rgba(255,111,165,0.1); border:1px solid rgba(255,111,165,0.22); border-radius:100px; padding:4px 12px; font-size:0.75rem; color:#FF6FA5; }
  .rp-ai-sugg { background:rgba(124,92,255,0.08); border:1px solid rgba(124,92,255,0.18); border-radius:14px; padding:18px; margin-top:10px; }
  .rp-ai-sugg-title { font-size:0.8rem; font-weight:700; color:var(--nebula2); margin-bottom:10px; display:flex; align-items:center; gap:6px; }
  .rp-ai-sugg-item { font-size:0.78rem; color:var(--muted); padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.05); display:flex; align-items:flex-start; gap:8px; }
  .rp-ai-sugg-item:last-child { border-bottom:none; }
  .rp-ai-sugg-item::before { content:'→'; color:var(--nebula2); flex-shrink:0; }

  /* Benefits */
  .rp-benefits-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
  .rp-benefit { background:var(--card); border:1px solid var(--border2); border-radius:20px; padding:28px; backdrop-filter:blur(14px); transition:all 0.25s; }
  .rp-benefit:hover { border-color:rgba(52,232,158,0.25); transform:translateY(-4px); }
  .rp-benefit-icon { font-size:2rem; margin-bottom:14px; display:block; }
  .rp-benefit h3 { font-family:var(--display); font-size:1rem; font-weight:700; margin-bottom:8px; }
  .rp-benefit p { font-size:0.85rem; color:var(--muted); line-height:1.65; }

  /* CTA */
  .rp-cta { background:linear-gradient(135deg,rgba(52,232,158,0.1),rgba(0,229,255,0.06)); border-top:1px solid rgba(52,232,158,0.2); border-bottom:1px solid rgba(52,232,158,0.2); padding:80px 24px; text-align:center; }
  .rp-cta h2 { font-family:var(--display); font-size:clamp(1.6rem,3vw,2.4rem); font-weight:700; letter-spacing:-0.025em; margin-bottom:14px; }
  .rp-cta p { color:var(--muted); font-size:1rem; margin-bottom:36px; }

  .rp-footer { background:var(--void2); border-top:1px solid var(--border2); padding:40px 24px; text-align:center; }
  .rp-footer p { color:var(--muted2); font-size:0.82rem; }

  @media (max-width:860px) { .rp-demo-grid { grid-template-columns:1fr; } .rp-benefits-grid { grid-template-columns:1fr; } .rp-pipe-arrow { display:none; } .rp-pipeline { gap:20px; } }
  @media (max-width:560px) { .rp-benefits-grid { grid-template-columns:1fr; } }
`;

const PIPELINE = [
  { icon: '📄', num: '01', label: 'Upload Resume', desc: 'PDF or DOCX — we parse it instantly' },
  { icon: '🔍', num: '02', label: 'ATS Score',     desc: 'Get a 0–100 compatibility score' },
  { icon: '🧩', num: '03', label: 'Missing Skills', desc: 'See exactly what gaps exist' },
  { icon: '🤖', num: '04', label: 'AI Suggestions', desc: 'Actionable bullet improvements' },
  { icon: '✨', num: '05', label: 'Better Resume',   desc: 'Apply with confidence' },
];

const BENEFITS = [
  { icon: '⚡', title: 'Instant Results',         desc: 'Get your ATS score and full analysis in under 30 seconds. No waiting, no scheduling.' },
  { icon: '🎯', title: 'JD-Specific Matching',    desc: 'Paste any job description and see exactly how well your resume matches it.' },
  { icon: '🤖', title: 'AI-Powered Suggestions',  desc: 'GPT-generated, actionable rewrites for every weak section of your resume.' },
  { icon: '📊', title: 'Detailed Breakdown',      desc: 'Scores across formatting, keywords, experience relevance, and skills coverage.' },
  { icon: '🔒', title: 'Private & Secure',        desc: 'Your resume is analysed and never stored or shared with third parties.' },
  { icon: '♾️', title: 'Unlimited Uploads',       desc: 'Tailor your resume for every application — analyse as many versions as you need.' },
];

export default function ResumeAIPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="rp-page">

        {/* Hero */}
        <section className="rp-hero">
          <div className="rp-badge"><span className="rp-badge-dot" />Resume AI</div>
          <h1 className="rp-h1">Your resume, <span className="grad">AI-optimised</span> in seconds</h1>
          <p className="rp-sub">Upload your resume, get an ATS score, see what skills are missing, and receive AI-written suggestions to make it past every screener.</p>
          <div className="rp-cta-row">
            <Link href="/login" className="btn-primary">Analyse My Resume →</Link>
            <Link href="/features" className="btn-ghost">All Features</Link>
          </div>
        </section>

        {/* Pipeline */}
        <section className="rp-section" style={{ background: 'var(--void2)', padding: '70px 24px' }}>
          <div className="rp-inner">
            <h2 className="rp-h2" style={{ textAlign: 'center', marginBottom: 48 }}>How it works — 5 steps</h2>
            <div className="rp-pipeline">
              {PIPELINE.map((step, i) => (
                <>
                  <div key={step.num} className="rp-pipe-step">
                    <div className="rp-pipe-icon">{step.icon}</div>
                    <span className="rp-pipe-num">{step.num}</span>
                    <span className="rp-pipe-label">{step.label}</span>
                    <span className="rp-pipe-desc">{step.desc}</span>
                  </div>
                  {i < PIPELINE.length - 1 && (
                    <div key={`arrow-${i}`} className="rp-pipe-arrow">
                      <div className="rp-arrow" />
                    </div>
                  )}
                </>
              ))}
            </div>
          </div>
        </section>

        {/* Score demo */}
        <section className="rp-section rp-score-demo">
          <div className="rp-inner">
            <div className="rp-demo-grid">
              {/* Visual */}
              <div className="rp-score-card">
                <div className="rp-score-header">
                  <span className="rp-score-title">Resume Analysis Report</span>
                  <span className="rp-score-badge">✓ AI Analysed</span>
                </div>
                <div className="rp-score-ring-wrap">
                  <div className="rp-score-ring">
                    <div className="rp-score-ring-inner">
                      <span className="rp-score-num">82</span>
                      <span className="rp-score-lbl">ATS Score</span>
                    </div>
                  </div>
                  <div className="rp-score-breakdown">
                    {[
                      { label: 'Keywords',   pct: 88, color: 'var(--green)' },
                      { label: 'Formatting', pct: 76, color: 'var(--aqua)' },
                      { label: 'Experience', pct: 91, color: 'var(--nebula2)' },
                      { label: 'Skills',     pct: 65, color: 'var(--gold)' },
                    ].map(r => (
                      <div key={r.label} className="rp-score-row">
                        <span className="rp-score-row-label">{r.label}</span>
                        <div className="rp-score-bar">
                          <div className="rp-score-fill" style={{ width: `${r.pct}%`, background: r.color }} />
                        </div>
                        <span className="rp-score-pct">{r.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rp-missing-skills">
                  <div className="rp-missing-title">⚠️ Missing Keywords</div>
                  <div className="rp-missing-tags">
                    {['Docker', 'Kubernetes', 'GraphQL', 'CI/CD', 'AWS'].map(s => (
                      <span key={s} className="rp-missing-tag">{s}</span>
                    ))}
                  </div>
                </div>
                <div className="rp-ai-sugg">
                  <div className="rp-ai-sugg-title">🤖 AI Suggestions</div>
                  {[
                    'Add Docker/Kubernetes experience in skills section',
                    'Quantify your impact — replace "worked on" with "reduced latency by 40%"',
                    'Include CI/CD pipeline experience from Project X',
                  ].map(s => (
                    <div key={s} className="rp-ai-sugg-item">{s}</div>
                  ))}
                </div>
              </div>

              {/* Text */}
              <div>
                <span className="rp-label">Resume AI Analysis</span>
                <h2 className="rp-h2">Know exactly why your resume gets rejected — and fix it</h2>
                <p style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.78, marginBottom: 24 }}>
                  Most resumes fail ATS filters before a human ever reads them. Our AI parses your resume the same way ATS systems do — and tells you exactly what to fix, with specific language suggestions.
                </p>
                <p style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.78, marginBottom: 32 }}>
                  Upload once, target any job description. Get a tailored score and rewrite suggestions every time — so every application you send is your strongest possible version.
                </p>
                <Link href="/login" className="btn-primary">Analyse My Resume →</Link>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="rp-section">
          <div className="rp-inner">
            <span className="rp-label">Why Revogen Resume AI</span>
            <h2 className="rp-h2">Everything you need to get past the screener</h2>
            <p className="rp-section-sub">Built for students, job seekers, and anyone serious about landing their next role.</p>
            <div className="rp-benefits-grid">
              {BENEFITS.map(b => (
                <div key={b.title} className="rp-benefit">
                  <span className="rp-benefit-icon">{b.icon}</span>
                  <h3>{b.title}</h3>
                  <p>{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="rp-cta">
          <h2>Upload your resume — it takes 30 seconds</h2>
          <p>Find out your ATS score, missing skills, and exactly how to improve it. Free to start.</p>
          <div className="rp-cta-row">
            <Link href="/login" className="btn-primary">Get My Resume Score →</Link>
            <Link href="/register/candidate" className="btn-ghost">Create Account</Link>
          </div>
        </div>

        <div className="rp-footer">
          <p>© {new Date().getFullYear()} Revogen AI · <Link href="/privacy" style={{ color: 'inherit' }}>Privacy</Link> · <Link href="/terms" style={{ color: 'inherit' }}>Terms</Link></p>
        </div>
      </div>
    </>
  );
}
