'use client';

import Link from 'next/link';

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

  .ab-page { padding-top: 70px; }

  /* Hero */
  .ab-hero { padding:100px 24px 80px; text-align:center; background:radial-gradient(ellipse 800px 500px at 50% 0%,rgba(124,92,255,0.14),transparent 65%); }
  .ab-badge { display:inline-flex; align-items:center; gap:8px; background:rgba(124,92,255,0.1); border:1px solid rgba(124,92,255,0.3); padding:6px 18px; border-radius:100px; font-size:0.78rem; font-weight:700; color:var(--nebula2); letter-spacing:0.08em; text-transform:uppercase; margin-bottom:28px; }
  .ab-badge-dot { width:6px; height:6px; border-radius:50%; background:var(--aqua); box-shadow:0 0 8px var(--aqua); animation:pulse 2s ease-in-out infinite; }
  @keyframes pulse{0%,100%{opacity:1;transform:scale(1);}50%{opacity:.5;transform:scale(.85);}}
  .ab-h1 { font-family:var(--display); font-size:clamp(2.2rem,5vw,4rem); font-weight:800; letter-spacing:-0.03em; line-height:1.1; max-width:820px; margin:0 auto 22px; }
  .ab-h1 .grad { background:linear-gradient(120deg,var(--nebula2),var(--aqua),var(--gold)); background-size:200%; -webkit-background-clip:text; -webkit-text-fill-color:transparent; animation:shimmer 5s linear infinite; }
  @keyframes shimmer{0%{background-position:-400px 0;}100%{background-position:400px 0;}}
  .ab-sub { font-size:1.1rem; color:var(--muted); max-width:620px; margin:0 auto; line-height:1.8; }

  /* Section */
  .ab-section { padding:90px 24px; }
  .ab-inner { max-width:1100px; margin:0 auto; }
  .ab-label { display:inline-flex; align-items:center; gap:9px; color:var(--nebula2); font-size:0.75rem; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; margin-bottom:16px; }
  .ab-label::before { content:''; width:20px; height:2px; background:linear-gradient(90deg,var(--nebula),var(--aqua)); border-radius:1px; }
  .ab-h2 { font-family:var(--display); font-size:clamp(1.7rem,3.5vw,2.6rem); font-weight:700; letter-spacing:-0.025em; line-height:1.2; margin-bottom:20px; }

  /* Story */
  .ab-story-grid { display:grid; grid-template-columns:1fr 1fr; gap:64px; align-items:center; }
  .ab-story-text p { color:var(--muted); font-size:0.97rem; line-height:1.85; margin-bottom:18px; }
  .ab-story-text p strong { color:var(--text); }
  .ab-story-visual { background:var(--card); border:1px solid var(--border2); border-radius:26px; padding:36px; backdrop-filter:blur(18px); }
  .ab-quote { font-family:var(--display); font-size:1.25rem; font-weight:700; line-height:1.55; color:var(--text); position:relative; margin-bottom:20px; }
  .ab-quote::before { content:'"'; font-size:4rem; color:rgba(124,92,255,0.3); position:absolute; top:-16px; left:-4px; font-family:Georgia,serif; }
  .ab-quote-attr { display:flex; align-items:center; gap:12px; }
  .ab-quote-avatar { width:44px; height:44px; border-radius:50%; background:linear-gradient(135deg,var(--nebula),var(--aqua)); display:flex; align-items:center; justify-content:center; font-size:16px; font-weight:700; flex-shrink:0; }
  .ab-quote-name { font-weight:700; font-size:0.9rem; }
  .ab-quote-role { font-size:0.78rem; color:var(--muted2); }

  /* Mission / Vision cards */
  .ab-mv-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
  .ab-mv-card { background:var(--card); border:1px solid var(--border2); border-radius:24px; padding:36px; backdrop-filter:blur(18px); transition:all 0.3s; }
  .ab-mv-card:hover { border-color:var(--border); transform:translateY(-5px); box-shadow:0 24px 56px rgba(0,0,0,0.45); }
  .ab-mv-icon { font-size:2.5rem; margin-bottom:18px; display:block; }
  .ab-mv-card h3 { font-family:var(--display); font-size:1.2rem; font-weight:700; margin-bottom:14px; }
  .ab-mv-card p { color:var(--muted); font-size:0.9rem; line-height:1.75; }

  /* Tech stack */
  .ab-tech-section { background:var(--void2); }
  .ab-tech-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
  .ab-tech-card { background:var(--card); border:1px solid var(--border2); border-radius:18px; padding:24px; text-align:center; backdrop-filter:blur(14px); transition:all 0.25s; }
  .ab-tech-card:hover { border-color:var(--border); transform:translateY(-4px); }
  .ab-tech-icon { font-size:2rem; margin-bottom:10px; display:block; }
  .ab-tech-name { font-family:var(--display); font-size:0.9rem; font-weight:700; margin-bottom:6px; }
  .ab-tech-desc { font-size:0.78rem; color:var(--muted2); line-height:1.55; }

  /* Values */
  .ab-values { display:flex; flex-direction:column; gap:20px; }
  .ab-value { display:flex; align-items:flex-start; gap:20px; background:var(--card); border:1px solid var(--border2); border-radius:18px; padding:26px; backdrop-filter:blur(14px); transition:all 0.25s; }
  .ab-value:hover { border-color:var(--border); }
  .ab-value-num { font-family:var(--display); font-size:2rem; font-weight:800; background:linear-gradient(135deg,var(--nebula2),var(--aqua)); -webkit-background-clip:text; -webkit-text-fill-color:transparent; flex-shrink:0; width:48px; }
  .ab-value h4 { font-family:var(--display); font-size:1rem; font-weight:700; margin-bottom:8px; }
  .ab-value p { font-size:0.875rem; color:var(--muted); line-height:1.7; }

  /* CTA */
  .ab-cta { background:linear-gradient(135deg,rgba(124,92,255,0.14),rgba(0,229,255,0.06)); border-top:1px solid rgba(124,92,255,0.2); border-bottom:1px solid rgba(124,92,255,0.2); padding:80px 24px; text-align:center; }
  .ab-cta h2 { font-family:var(--display); font-size:clamp(1.6rem,3vw,2.4rem); font-weight:700; letter-spacing:-0.025em; margin-bottom:14px; }
  .ab-cta p { color:var(--muted); font-size:1rem; margin-bottom:36px; }
  .ab-cta-row { display:flex; gap:14px; justify-content:center; flex-wrap:wrap; }
  .btn-primary { background:linear-gradient(135deg,var(--nebula),#5B3FD9); color:#fff; font-size:0.95rem; font-weight:700; padding:13px 30px; border-radius:12px; text-decoration:none; transition:all 0.2s; box-shadow:0 8px 24px rgba(124,92,255,0.42); display:inline-block; }
  .btn-primary:hover { transform:translateY(-2px); box-shadow:0 12px 34px rgba(124,92,255,0.6); }
  .btn-ghost { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.14); color:var(--text); font-size:0.95rem; font-weight:600; padding:13px 30px; border-radius:12px; text-decoration:none; transition:all 0.2s; display:inline-block; }
  .btn-ghost:hover { background:rgba(255,255,255,0.08); border-color:var(--nebula); }

  .ab-footer { background:var(--void2); border-top:1px solid var(--border2); padding:40px 24px; text-align:center; }
  .ab-footer p { color:var(--muted2); font-size:0.82rem; }

  @media (max-width:860px) { .ab-story-grid { grid-template-columns:1fr; gap:40px; } .ab-mv-grid { grid-template-columns:1fr; } .ab-tech-grid { grid-template-columns:repeat(2,1fr); } }
  @media (max-width:480px) { .ab-tech-grid { grid-template-columns:1fr; } }
`;

const TECH_STACK = [
  { icon: '⚡', name: 'Next.js 16',       desc: 'App Router, RSC, and edge-ready rendering' },
  { icon: '🤖', name: 'GPT-4o',           desc: 'Powers question generation, interview AI, and resume analysis' },
  { icon: '💻', name: 'Monaco Editor',    desc: 'VS Code-grade in-browser code editing' },
  { icon: '🔐', name: 'JWT Auth',         desc: 'Stateless, secure token-based authentication' },
  { icon: '🐍', name: 'FastAPI',          desc: 'High-performance Python backend' },
  { icon: '🗄️', name: 'PostgreSQL',       desc: 'Reliable relational data for all assessment records' },
  { icon: '📊', name: 'Recharts',         desc: 'Animated analytics dashboards' },
  { icon: '🌐', name: 'TypeScript',       desc: 'End-to-end type safety across the stack' },
];

const VALUES = [
  { num: '01', title: 'Transparency over hype', desc: 'We show you exactly what our AI does and how it scores. No black-box magic — every recommendation comes with an explanation.' },
  { num: '02', title: 'Speed without sacrifice', desc: 'Hiring should be fast, but never sloppy. We automate the grunt work so humans can focus on what actually requires human judgment.' },
  { num: '03', title: 'Fairness by design', desc: 'Standardised assessments reduce unconscious bias. Every candidate gets the same test, the same time, the same AI evaluation.' },
  { num: '04', title: 'Built for builders', desc: 'We\'re engineers building tools for engineers. Our UX decisions come from using the same tools we ship — not from guesswork.' },
];

export default function AboutPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="ab-page">

        {/* Hero */}
        <section className="ab-hero">
          <div className="ab-badge"><span className="ab-badge-dot" />Our Story</div>
          <h1 className="ab-h1">We&apos;re building the <span className="grad">hiring infrastructure</span> engineers deserve</h1>
          <p className="ab-sub">Revogen was born from frustration — with broken hiring pipelines, irrelevant take-home tests, and resumes lost in inbox black holes. We decided to fix it.</p>
        </section>

        {/* Story */}
        <section className="ab-section">
          <div className="ab-inner">
            <div className="ab-story-grid">
              <div className="ab-story-text">
                <span className="ab-label">The Origin Story</span>
                <h2 className="ab-h2">Built by engineers who hated the interview process</h2>
                <p>We started Revogen after going through dozens of interviews that felt like a lottery — inconsistent questions, biased screeners, and zero feedback. The process was broken for everyone involved.</p>
                <p>Recruiters were drowning in unqualified applications. Candidates were guessing what companies actually wanted. And hiring managers kept getting surprised by who showed up on day one.</p>
                <p><strong>We knew AI could fix this.</strong> Not by replacing human judgment — but by handling the repetitive, time-consuming, and bias-prone parts of the pipeline so humans can focus on what actually matters: deciding if someone is a great fit for the team.</p>
                <p>Today, Revogen powers technical assessments, resume screening, and AI mock interviews for hundreds of teams across India and growing.</p>
              </div>
              <div>
                <div className="ab-story-visual">
                  <div className="ab-quote">
                    We didn&apos;t build Revogen to automate hiring. We built it to make hiring fair — for both sides of the table.
                  </div>
                  <div className="ab-quote-attr">
                    <div className="ab-quote-avatar">R</div>
                    <div>
                      <div className="ab-quote-name">Revogen Team</div>
                      <div className="ab-quote-role">Founders · Bengaluru, India</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission + Vision */}
        <section className="ab-section" style={{ background: 'var(--void2)', paddingTop: 80 }}>
          <div className="ab-inner">
            <span className="ab-label" style={{ justifyContent: 'center', display: 'flex', marginBottom: 48 }}>Mission & Vision</span>
            <div className="ab-mv-grid">
              <div className="ab-mv-card">
                <span className="ab-mv-icon">🎯</span>
                <h3>Our Mission</h3>
                <p>To eliminate the friction, bias, and inefficiency in technical hiring by building AI-native tools that give every candidate a fair shot and every recruiter the signal they need to hire with confidence.</p>
              </div>
              <div className="ab-mv-card">
                <span className="ab-mv-icon">🔭</span>
                <h3>Our Vision</h3>
                <p>A world where the best engineers get hired — regardless of which college they attended, who they know, or how polished their resume looks. Technical merit, demonstrated and measured objectively.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Technology */}
        <section className="ab-section ab-tech-section">
          <div className="ab-inner">
            <span className="ab-label">Technology</span>
            <h2 className="ab-h2">Modern stack, built for scale</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.97rem', lineHeight: 1.75, maxWidth: 560, marginBottom: 48 }}>
              We built Revogen with best-in-class tools — not legacy enterprise software. That means fast iteration, reliable performance, and AI that actually works.
            </p>
            <div className="ab-tech-grid">
              {TECH_STACK.map(t => (
                <div key={t.name} className="ab-tech-card">
                  <span className="ab-tech-icon">{t.icon}</span>
                  <div className="ab-tech-name">{t.name}</div>
                  <div className="ab-tech-desc">{t.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="ab-section">
          <div className="ab-inner">
            <span className="ab-label">What We Stand For</span>
            <h2 className="ab-h2" style={{ marginBottom: 48 }}>Four principles we build by</h2>
            <div className="ab-values">
              {VALUES.map(v => (
                <div key={v.num} className="ab-value">
                  <div className="ab-value-num">{v.num}</div>
                  <div>
                    <h4>{v.title}</h4>
                    <p>{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="ab-cta">
          <h2>Want to work with us or try the platform?</h2>
          <p>We&apos;re always open to feedback, partnerships, and conversations about the future of hiring.</p>
          <div className="ab-cta-row">
            <Link href="/register/candidate" className="btn-primary">Try Revogen Free →</Link>
            <Link href="/contact"  className="btn-ghost">Get in Touch</Link>
          </div>
        </div>

        <div className="ab-footer">
          <p>© {new Date().getFullYear()} Revogen AI · <Link href="/privacy" style={{ color: 'inherit' }}>Privacy</Link> · <Link href="/terms" style={{ color: 'inherit' }}>Terms</Link></p>
        </div>
      </div>
    </>
  );
}
