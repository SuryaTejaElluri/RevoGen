'use client';

import Link from 'next/link';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --void: #03040A; --void2: #060814;
    --card: rgba(16,20,38,0.6); --border: rgba(124,92,255,0.22); --border2: rgba(255,255,255,0.07);
    --nebula: #7C5CFF; --nebula2: #A78BFA; --aqua: #00E5FF;
    --gold: #FFC857; --rose: #FF6FA5; --green: #34E89E;
    --text: #F4F6FF; --muted: #9AA3C7; --muted2: #5E6694;
    --display: 'Space Grotesk', sans-serif; --body: 'Inter', sans-serif; --mono: 'JetBrains Mono', monospace;
  }
  body { background: var(--void); color: var(--text); font-family: var(--body); -webkit-font-smoothing: antialiased; overflow-x: hidden; }
  ::selection { background: rgba(124,92,255,0.4); color: #fff; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-thumb { background: linear-gradient(var(--nebula), var(--aqua)); border-radius: 4px; }

  .ap-page { padding-top: 70px; }

  /* Hero */
  .ap-hero { padding: 100px 24px 80px; text-align: center; background: radial-gradient(ellipse 800px 500px at 50% 0%, rgba(124,92,255,0.15), transparent 65%); }
  .ap-badge { display:inline-flex; align-items:center; gap:8px; background:rgba(124,92,255,0.1); border:1px solid rgba(124,92,255,0.3); padding:6px 18px; border-radius:100px; font-size:0.78rem; font-weight:700; color:var(--nebula2); letter-spacing:0.08em; text-transform:uppercase; margin-bottom:28px; }
  .ap-badge-dot { width:6px; height:6px; border-radius:50%; background:var(--aqua); box-shadow:0 0 8px var(--aqua); animation:pulse 2s ease-in-out infinite; }
  @keyframes pulse{0%,100%{opacity:1;transform:scale(1);}50%{opacity:.5;transform:scale(.85);}}
  .ap-h1 { font-family:var(--display); font-size:clamp(2.2rem,5vw,4rem); font-weight:800; letter-spacing:-0.03em; line-height:1.1; max-width:820px; margin:0 auto 22px; }
  .ap-h1 .grad { background:linear-gradient(120deg,var(--nebula2),var(--aqua),var(--gold)); background-size:200%; -webkit-background-clip:text; -webkit-text-fill-color:transparent; animation:shimmer 5s linear infinite; }
  @keyframes shimmer{0%{background-position:-400px 0;}100%{background-position:400px 0;}}
  .ap-sub { font-size:1.1rem; color:var(--muted); max-width:580px; margin:0 auto 42px; line-height:1.75; }
  .ap-cta-row { display:flex; gap:14px; justify-content:center; flex-wrap:wrap; }
  .btn-primary { background:linear-gradient(135deg,var(--nebula),#5B3FD9); color:#fff; font-size:0.95rem; font-weight:700; padding:13px 30px; border-radius:12px; text-decoration:none; transition:all 0.2s; box-shadow:0 8px 24px rgba(124,92,255,0.42); border:none; cursor:pointer; font-family:var(--body); display:inline-block; }
  .btn-primary:hover { transform:translateY(-2px); box-shadow:0 12px 34px rgba(124,92,255,0.6); }
  .btn-ghost { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.14); color:var(--text); font-size:0.95rem; font-weight:600; padding:13px 30px; border-radius:12px; text-decoration:none; transition:all 0.2s; display:inline-block; }
  .btn-ghost:hover { background:rgba(255,255,255,0.08); border-color:var(--nebula); }

  /* Section */
  .ap-section { padding:90px 24px; }
  .ap-inner { max-width:1200px; margin:0 auto; }
  .ap-label { display:inline-flex; align-items:center; gap:9px; color:var(--nebula2); font-size:0.75rem; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; margin-bottom:16px; }
  .ap-label::before { content:''; width:20px; height:2px; background:linear-gradient(90deg,var(--nebula),var(--aqua)); border-radius:1px; }
  .ap-h2 { font-family:var(--display); font-size:clamp(1.7rem,3.5vw,2.6rem); font-weight:700; letter-spacing:-0.025em; line-height:1.2; margin-bottom:14px; }
  .ap-section-sub { color:var(--muted); font-size:1rem; line-height:1.75; max-width:560px; margin-bottom:56px; }

  /* MCQ + Coding cards */
  .ap-big-grid { display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-bottom:24px; }
  .ap-big-card { background:var(--card); border:1px solid var(--border2); border-radius:26px; padding:40px; backdrop-filter:blur(18px); transition:all 0.32s; position:relative; overflow:hidden; }
  .ap-big-card:hover { border-color:var(--border); transform:translateY(-6px); box-shadow:0 30px 70px rgba(0,0,0,0.5); }
  .ap-big-card::before { content:''; position:absolute; inset:0; background:var(--hov,''); opacity:0; transition:opacity 0.3s; }
  .ap-big-card:hover::before { opacity:1; }
  .ap-card-icon { width:64px; height:64px; border-radius:18px; display:flex; align-items:center; justify-content:center; font-size:30px; margin-bottom:24px; position:relative; z-index:1; }
  .ap-big-card h3 { font-family:var(--display); font-size:1.5rem; font-weight:700; margin-bottom:14px; position:relative; z-index:1; }
  .ap-big-card p  { color:var(--muted); font-size:0.95rem; line-height:1.75; margin-bottom:24px; position:relative; z-index:1; }
  .ap-tag-row { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:24px; position:relative; z-index:1; }
  .ap-tag { font-size:0.78rem; font-weight:600; padding:5px 13px; border-radius:100px; }
  .ap-features-list { list-style:none; display:flex; flex-direction:column; gap:10px; position:relative; z-index:1; }
  .ap-features-list li { display:flex; align-items:flex-start; gap:10px; font-size:0.875rem; color:var(--muted); }
  .ap-features-list li span.check { color:var(--green); font-weight:700; flex-shrink:0; }

  /* Code mockup */
  .ap-code-mock { background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.06); border-radius:14px; margin-top:24px; overflow:hidden; position:relative; z-index:1; }
  .ap-code-topbar { background:rgba(255,255,255,0.02); padding:10px 16px; display:flex; align-items:center; gap:7px; border-bottom:1px solid rgba(255,255,255,0.05); }
  .ap-code-dot { width:9px; height:9px; border-radius:50%; }
  .ap-code-body { padding:16px 18px; font-family:var(--mono); font-size:0.78rem; line-height:1.8; }
  .tok-kw  { color:#818cf8; }
  .tok-fn  { color:#34d399; }
  .tok-str { color:#fbbf24; }
  .tok-cm  { color:#475569; }
  .tok-var { color:#e2e8f0; }
  .tok-num { color:#f472b6; }

  /* MCQ mockup */
  .ap-mcq-mock { background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.06); border-radius:14px; margin-top:24px; overflow:hidden; position:relative; z-index:1; padding:20px; }
  .ap-mcq-q { font-size:0.82rem; font-weight:600; margin-bottom:14px; color:var(--text); }
  .ap-mcq-opts { display:flex; flex-direction:column; gap:8px; }
  .ap-mcq-opt { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:9px; padding:9px 14px; font-size:0.78rem; color:var(--muted); display:flex; align-items:center; gap:10px; }
  .ap-mcq-opt.selected { background:rgba(124,92,255,0.15); border-color:rgba(124,92,255,0.4); color:#fff; }
  .ap-mcq-dot { width:14px; height:14px; border-radius:50%; border:2px solid rgba(255,255,255,0.2); flex-shrink:0; }
  .ap-mcq-dot.sel { background:var(--nebula); border-color:var(--nebula); }

  /* Security section */
  .ap-security-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
  .ap-security-card { background:var(--card); border:1px solid var(--border2); border-radius:16px; padding:24px; backdrop-filter:blur(14px); transition:all 0.25s; }
  .ap-security-card:hover { border-color:var(--border); transform:translateY(-4px); }
  .ap-security-icon { font-size:2rem; margin-bottom:12px; display:block; }
  .ap-security-title { font-family:var(--display); font-size:0.95rem; font-weight:700; margin-bottom:8px; }
  .ap-security-desc { font-size:0.82rem; color:var(--muted); line-height:1.6; }

  /* Languages */
  .ap-langs { display:flex; flex-wrap:wrap; gap:10px; }
  .ap-lang { display:flex; align-items:center; gap:8px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:100px; padding:8px 18px; font-size:0.85rem; font-weight:600; transition:all 0.2s; }
  .ap-lang:hover { border-color:var(--nebula); background:rgba(124,92,255,0.1); color:var(--nebula2); }

  /* CTA */
  .ap-cta { background:linear-gradient(135deg,rgba(124,92,255,0.14),rgba(0,229,255,0.06)); border-top:1px solid rgba(124,92,255,0.2); border-bottom:1px solid rgba(124,92,255,0.2); padding:80px 24px; text-align:center; }
  .ap-cta h2 { font-family:var(--display); font-size:clamp(1.6rem,3vw,2.4rem); font-weight:700; letter-spacing:-0.025em; margin-bottom:14px; }
  .ap-cta p { color:var(--muted); font-size:1rem; margin-bottom:36px; }

  .ap-footer { background:var(--void2); border-top:1px solid var(--border2); padding:40px 24px; text-align:center; }
  .ap-footer p { color:var(--muted2); font-size:0.82rem; }

  @media (max-width:860px) { .ap-big-grid { grid-template-columns:1fr; } .ap-security-grid { grid-template-columns:repeat(2,1fr); } }
  @media (max-width:560px) { .ap-security-grid { grid-template-columns:1fr; } }
`;

const SECURITY_FEATURES = [
  { icon: '🖥️', title: 'Fullscreen Lockdown',     desc: 'Forces candidates into fullscreen mode. Any attempt to exit is logged and flagged immediately.' },
  { icon: '🪟', title: 'Tab Switch Detection',     desc: 'Every tab change or window focus loss is recorded in a timestamped activity log.' },
  { icon: '📋', title: 'Clipboard Restriction',    desc: 'Copy-paste is disabled during the assessment to prevent content sharing.' },
  { icon: '⏱️', title: 'Timed Assessments',        desc: 'Per-question or total test timers with auto-submit on expiry.' },
  { icon: '🎲', title: 'Question Randomisation',   desc: 'Questions and answer options are shuffled per candidate to prevent cheating.' },
  { icon: '📸', title: 'Webcam Proctoring',        desc: 'Periodic snapshots and face-detection alerts for live monitoring.' },
];

const LANGUAGES = [
  '🐍 Python', '☕ Java', '🟨 JavaScript', '⚡ TypeScript', '🔵 C', '🔵 C++',
  '🦀 Rust', '🐹 Go', '💎 Ruby', '🐘 PHP', '🟣 Kotlin', '🍎 Swift',
];

export default function AssessmentsPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="ap-page">

        {/* Hero */}
        <section className="ap-hero">
          <div className="ap-badge"><span className="ap-badge-dot" />Assessment Platform</div>
          <h1 className="ap-h1">Assessments that <span className="grad">actually measure skill</span></h1>
          <p className="ap-sub">MCQ tests, live coding challenges, timed rounds, and AI evaluation — all in one platform. Built to be fair, fast, and impossible to fake.</p>
          <div className="ap-cta-row">
            <Link href="/register/recruiter" className="btn-primary">Create Your First Test →</Link>
            <Link href="/features" className="btn-ghost">All Features</Link>
          </div>
        </section>

        {/* MCQ + Coding */}
        <section className="ap-section">
          <div className="ap-inner">
            <span className="ap-label">Assessment Types</span>
            <h2 className="ap-h2">Two powerful assessment formats</h2>
            <p className="ap-section-sub">Choose MCQ for knowledge checks, coding for technical depth, or combine both in a single test.</p>
            <div className="ap-big-grid">

              {/* MCQ Card */}
              <div className="ap-big-card" style={{ '--hov': 'linear-gradient(135deg,rgba(124,92,255,0.08),transparent)' } as React.CSSProperties}>
                <div className="ap-card-icon" style={{ background: 'rgba(124,92,255,0.15)', border: '1px solid rgba(124,92,255,0.25)' }}>📝</div>
                <h3>MCQ Assessments</h3>
                <p>AI-generated multiple-choice questions across 20+ technical domains. Configure difficulty, time limits, and scoring in minutes.</p>
                <div className="ap-tag-row">
                  {['AI Generated', 'Auto Graded', 'Randomised', 'Anti-Cheat'].map(t => (
                    <span key={t} className="ap-tag" style={{ background: 'rgba(124,92,255,0.1)', border: '1px solid rgba(124,92,255,0.22)', color: 'var(--nebula2)' }}>{t}</span>
                  ))}
                </div>
                <ul className="ap-features-list">
                  {['AI generates questions from topic + difficulty', 'Role-based question banks (DSA, DBMS, OS…)', 'Single, multiple, and fill-in-the-blank formats', 'Per-question time limits', 'Instant scoring and explanations'].map(f => (
                    <li key={f}><span className="check">✓</span>{f}</li>
                  ))}
                </ul>
                <div className="ap-mcq-mock">
                  <div className="ap-mcq-q">Q3 · What is the time complexity of binary search?</div>
                  <div className="ap-mcq-opts">
                    {[['O(n)', false], ['O(log n)', true], ['O(n²)', false], ['O(1)', false]].map(([opt, sel]) => (
                      <div key={String(opt)} className={`ap-mcq-opt${sel ? ' selected' : ''}`}>
                        <div className={`ap-mcq-dot${sel ? ' sel' : ''}`} />
                        {String(opt)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Coding Card */}
              <div className="ap-big-card" style={{ '--hov': 'linear-gradient(135deg,rgba(0,229,255,0.07),transparent)' } as React.CSSProperties}>
                <div className="ap-card-icon" style={{ background: 'rgba(0,229,255,0.12)', border: '1px solid rgba(0,229,255,0.25)' }}>💻</div>
                <h3>Coding Assessments</h3>
                <p>A full in-browser IDE powered by Monaco. Candidates write, run, and submit code in 10+ languages. AI evaluates logic, correctness, and efficiency.</p>
                <div className="ap-tag-row">
                  {['10+ Languages', 'Live Execution', 'AI Evaluation', 'Custom Test Cases'].map(t => (
                    <span key={t} className="ap-tag" style={{ background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)', color: 'var(--aqua)' }}>{t}</span>
                  ))}
                </div>
                <ul className="ap-features-list">
                  {['Monaco editor (VS Code experience)', 'Real-time code execution', 'AI + rule-based test case generation', 'Time and memory limit controls', 'AI-written feedback per submission'].map(f => (
                    <li key={f}><span className="check">✓</span>{f}</li>
                  ))}
                </ul>
                <div className="ap-code-mock">
                  <div className="ap-code-topbar">
                    <div className="ap-code-dot" style={{ background: '#FF5F57' }} />
                    <div className="ap-code-dot" style={{ background: '#FEBC2E' }} />
                    <div className="ap-code-dot" style={{ background: '#28C840' }} />
                    <span style={{ fontSize: '0.7rem', color: 'var(--muted2)', marginLeft: 8 }}>solution.py · Two Sum · ⏱ 22:14</span>
                  </div>
                  <div className="ap-code-body">
                    <span className="tok-kw">def </span><span className="tok-fn">twoSum</span><span className="tok-var">(nums, target):</span><br />
                    &nbsp;&nbsp;<span className="tok-cm"># hash map approach — O(n)</span><br />
                    &nbsp;&nbsp;<span className="tok-var">seen = </span><span className="tok-kw">{'{}'}</span><br />
                    &nbsp;&nbsp;<span className="tok-kw">for </span><span className="tok-var">i, n </span><span className="tok-kw">in </span><span className="tok-fn">enumerate</span><span className="tok-var">(nums):</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="tok-var">diff = target - n</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="tok-kw">if </span><span className="tok-var">diff </span><span className="tok-kw">in </span><span className="tok-var">seen:</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="tok-kw">return </span><span className="tok-var">[seen[diff], i]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="tok-var">seen[n] = i</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Supported languages */}
        <section className="ap-section" style={{ background: 'var(--void2)', paddingTop: 60, paddingBottom: 60 }}>
          <div className="ap-inner">
            <span className="ap-label">Languages Supported</span>
            <h2 className="ap-h2" style={{ marginBottom: 32 }}>Code in any language you hire for</h2>
            <div className="ap-langs">
              {LANGUAGES.map(l => (
                <div key={l} className="ap-lang">{l}</div>
              ))}
            </div>
          </div>
        </section>

        {/* Security & Proctoring */}
        <section className="ap-section">
          <div className="ap-inner">
            <span className="ap-label">Exam Security</span>
            <h2 className="ap-h2">Assessments you can trust</h2>
            <p className="ap-section-sub">Multi-layer proctoring ensures every result reflects genuine candidate ability — not Google.</p>
            <div className="ap-security-grid">
              {SECURITY_FEATURES.map(s => (
                <div key={s.title} className="ap-security-card">
                  <span className="ap-security-icon">{s.icon}</span>
                  <div className="ap-security-title">{s.title}</div>
                  <div className="ap-security-desc">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="ap-cta">
          <h2>Create your first assessment today</h2>
          <p>Set up a full coding + MCQ test in under 5 minutes. No manual question writing required.</p>
          <div className="ap-cta-row">
            <Link href="/register/recruiter" className="btn-primary">Start Free →</Link>
            <Link href="/contact" className="btn-ghost">Talk to Us</Link>
          </div>
        </div>

        <div className="ap-footer">
          <p>© {new Date().getFullYear()} Revogen AI · <Link href="/privacy" style={{ color: 'inherit' }}>Privacy</Link> · <Link href="/terms" style={{ color: 'inherit' }}>Terms</Link></p>
        </div>
      </div>
    </>
  );
}
