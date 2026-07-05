'use client';

import Link from 'next/link';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --void: #03040A; --void2: #060814;
    --card: rgba(16,20,38,0.6); --card2: #0D1126;
    --border: rgba(124,92,255,0.22); --border2: rgba(255,255,255,0.07);
    --nebula: #7C5CFF; --nebula2: #A78BFA;
    --aqua: #00E5FF; --aqua2: #5EEAD4;
    --gold: #FFC857; --rose: #FF6FA5; --green: #34E89E;
    --text: #F4F6FF; --muted: #9AA3C7; --muted2: #5E6694;
    --display: 'Space Grotesk', sans-serif;
    --body: 'Inter', sans-serif;
  }
  body { background: var(--void); color: var(--text); font-family: var(--body); -webkit-font-smoothing: antialiased; overflow-x: hidden; }
  ::selection { background: rgba(124,92,255,0.4); color: #fff; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-thumb { background: linear-gradient(var(--nebula), var(--aqua)); border-radius: 4px; }

  .fp-page { padding-top: 70px; min-height: 100vh; }

  /* Hero */
  .fp-hero {
    padding: 100px 24px 80px;
    text-align: center;
    background:
      radial-gradient(ellipse 800px 500px at 50% 0%, rgba(124,92,255,0.15), transparent 65%),
      radial-gradient(ellipse 600px 400px at 80% 60%, rgba(0,229,255,0.08), transparent 60%);
  }
  .fp-badge {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(124,92,255,0.1); border: 1px solid rgba(124,92,255,0.3);
    padding: 6px 18px; border-radius: 100px;
    font-size: 0.78rem; font-weight: 700; color: var(--nebula2); letter-spacing: 0.08em;
    text-transform: uppercase; margin-bottom: 28px;
  }
  .fp-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--aqua); box-shadow: 0 0 8px var(--aqua); animation: pulse 2s ease-in-out infinite; }
  @keyframes pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:.5; transform:scale(.85); } }
  .fp-h1 {
    font-family: var(--display); font-size: clamp(2.2rem, 5vw, 4rem);
    font-weight: 800; letter-spacing: -0.03em; line-height: 1.1;
    max-width: 860px; margin: 0 auto 22px;
  }
  .fp-h1 .grad {
    background: linear-gradient(120deg, var(--nebula2) 0%, var(--aqua) 50%, var(--rose) 80%);
    background-size: 200%; -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    animation: shimmer 5s linear infinite;
  }
  @keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
  .fp-sub { font-size: 1.1rem; color: var(--muted); max-width: 580px; margin: 0 auto 40px; line-height: 1.75; }
  .fp-cta-row { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }
  .btn-primary {
    background: linear-gradient(135deg, var(--nebula), #5B3FD9); color: #fff;
    font-size: 0.95rem; font-weight: 700; padding: 13px 30px; border-radius: 12px;
    text-decoration: none; transition: all 0.2s; box-shadow: 0 8px 24px rgba(124,92,255,0.42);
    border: none; cursor: pointer; font-family: var(--body);
  }
  .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 34px rgba(124,92,255,0.6); }
  .btn-ghost {
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.14);
    color: var(--text); font-size: 0.95rem; font-weight: 600; padding: 13px 30px; border-radius: 12px;
    text-decoration: none; transition: all 0.2s; font-family: var(--body);
  }
  .btn-ghost:hover { background: rgba(255,255,255,0.08); border-color: var(--nebula); }

  /* Section */
  .fp-section { padding: 90px 24px; }
  .fp-inner { max-width: 1200px; margin: 0 auto; }
  .fp-label {
    display: inline-flex; align-items: center; gap: 9px;
    color: var(--nebula2); font-size: 0.75rem; font-weight: 700;
    letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 16px;
  }
  .fp-label::before { content: ''; width: 20px; height: 2px; background: linear-gradient(90deg, var(--nebula), var(--aqua)); border-radius: 1px; }
  .fp-h2 { font-family: var(--display); font-size: clamp(1.7rem, 3.5vw, 2.6rem); font-weight: 700; letter-spacing: -0.025em; line-height: 1.2; margin-bottom: 14px; }
  .fp-section-sub { color: var(--muted); font-size: 1rem; line-height: 1.75; max-width: 560px; margin-bottom: 56px; }

  /* Feature cards — main */
  .fp-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
  .fp-card {
    background: var(--card); border: 1px solid var(--border2); border-radius: 22px;
    padding: 32px; transition: all 0.32s; position: relative; overflow: hidden;
    backdrop-filter: blur(18px); display: flex; flex-direction: column; gap: 0;
  }
  .fp-card::before {
    content: ''; position: absolute; inset: 0;
    background: var(--hover-grad, linear-gradient(135deg, rgba(124,92,255,0.06), transparent));
    opacity: 0; transition: opacity 0.3s;
  }
  .fp-card:hover { border-color: var(--border); transform: translateY(-6px); box-shadow: 0 28px 60px rgba(0,0,0,0.5); }
  .fp-card:hover::before { opacity: 1; }
  .fp-card-icon {
    width: 56px; height: 56px; border-radius: 16px; margin-bottom: 20px;
    display: flex; align-items: center; justify-content: center; font-size: 26px;
    background: var(--icon-bg, rgba(124,92,255,0.15)); border: 1px solid var(--icon-border, rgba(124,92,255,0.25));
    position: relative; z-index: 1; flex-shrink: 0;
  }
  .fp-card h3 { font-family: var(--display); font-size: 1.1rem; font-weight: 700; margin-bottom: 12px; position: relative; z-index: 1; }
  .fp-card p { color: var(--muted); font-size: 0.875rem; line-height: 1.7; margin-bottom: 20px; position: relative; z-index: 1; }
  .fp-bullets { list-style: none; display: flex; flex-direction: column; gap: 8px; position: relative; z-index: 1; margin-top: auto; }
  .fp-bullets li { color: var(--muted); font-size: 0.82rem; display: flex; align-items: flex-start; gap: 9px; }
  .fp-bullets li::before { content: '✓'; color: var(--green); font-weight: 700; flex-shrink: 0; margin-top: 1px; }
  .fp-card-screen {
    margin-top: 20px; position: relative; z-index: 1;
    background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px; overflow: hidden; height: 90px;
    display: flex; flex-direction: column; gap: 6px; padding: 12px;
  }
  .fp-screen-line { height: 8px; border-radius: 4px; background: rgba(255,255,255,0.05); }
  .fp-screen-bar  { height: 8px; border-radius: 4px; background: linear-gradient(90deg, var(--nebula), var(--aqua)); opacity: 0.5; }

  /* Wide card */
  .fp-card.wide { grid-column: span 2; }

  /* Benefits strip */
  .fp-benefits { background: var(--void2); }
  .fp-benefits-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
  .fp-benefit {
    text-align: center; padding: 32px 20px;
    background: var(--card); border: 1px solid var(--border2); border-radius: 18px;
    backdrop-filter: blur(14px); transition: all 0.25s;
  }
  .fp-benefit:hover { border-color: var(--border); transform: translateY(-4px); }
  .fp-benefit-icon { font-size: 2.2rem; margin-bottom: 14px; display: block; }
  .fp-benefit-num { font-family: var(--display); font-size: 2rem; font-weight: 800; background: linear-gradient(135deg, var(--nebula2), var(--aqua)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .fp-benefit-label { color: var(--muted); font-size: 0.85rem; margin-top: 6px; }

  /* CTA band */
  .fp-cta-band {
    background: linear-gradient(135deg, rgba(124,92,255,0.14), rgba(0,229,255,0.06));
    border-top: 1px solid rgba(124,92,255,0.2); border-bottom: 1px solid rgba(124,92,255,0.2);
    padding: 80px 24px; text-align: center;
  }
  .fp-cta-band h2 { font-family: var(--display); font-size: clamp(1.6rem, 3vw, 2.4rem); font-weight: 700; letter-spacing: -0.025em; margin-bottom: 14px; }
  .fp-cta-band p { color: var(--muted); font-size: 1rem; margin-bottom: 36px; }

  /* Footer strip */
  .fp-footer { background: var(--void2); border-top: 1px solid var(--border2); padding: 48px 24px; text-align: center; }
  .fp-footer p { color: var(--muted2); font-size: 0.82rem; }

  @media (max-width: 1000px) { .fp-cards { grid-template-columns: repeat(2, 1fr); } .fp-card.wide { grid-column: span 1; } }
  @media (max-width: 700px)  { .fp-cards { grid-template-columns: 1fr; } .fp-benefits-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 480px)  { .fp-benefits-grid { grid-template-columns: 1fr; } }
`;

const CARDS = [
  {
    icon: '🧠', title: 'AI-Powered MCQ Assessments',
    iconBg: 'rgba(124,92,255,0.18)', iconBorder: 'rgba(124,92,255,0.28)',
    hoverGrad: 'linear-gradient(135deg,rgba(124,92,255,0.08),transparent)',
    desc: 'Generate intelligent multiple-choice assessments tailored to any domain, difficulty, and skill set — in seconds. No manual question writing needed.',
    bullets: ['Auto-generate with AI (GPT-powered)', 'Role-based question banks (20+ domains)', 'Randomise questions & options', 'Timed test with anti-cheat controls', 'Instant scoring & detailed analytics'],
    screenshot: true,
  },
  {
    icon: '💻', title: 'Coding Assessments',
    iconBg: 'rgba(0,229,255,0.15)', iconBorder: 'rgba(0,229,255,0.28)',
    hoverGrad: 'linear-gradient(135deg,rgba(0,229,255,0.07),transparent)',
    desc: 'A full in-browser IDE with real-time code evaluation. Candidates write, run, and submit code — you see results immediately.',
    bullets: ['10+ languages (Python, JS, Java, C++…)', 'Custom & AI-generated test cases', 'Time & memory limits configurable', 'AI evaluation with feedback', 'Monaco editor (VS Code-like experience)'],
    screenshot: true,
  },
  {
    icon: '📄', title: 'Resume ATS & AI Analysis',
    iconBg: 'rgba(52,232,158,0.15)', iconBorder: 'rgba(52,232,158,0.28)',
    hoverGrad: 'linear-gradient(135deg,rgba(52,232,158,0.07),transparent)',
    desc: 'Upload resumes and get an ATS compatibility score, missing skills report, and AI-driven improvement suggestions instantly.',
    bullets: ['PDF/DOCX upload', 'ATS score 0–100', 'Missing skills & keyword gaps', 'AI suggestions for improvement', 'Match against job descriptions'],
    screenshot: false,
  },
  {
    icon: '🎙️', title: 'AI Mock Interviews', wide: true,
    iconBg: 'rgba(255,111,165,0.15)', iconBorder: 'rgba(255,111,165,0.28)',
    hoverGrad: 'linear-gradient(135deg,rgba(255,111,165,0.07),transparent)',
    desc: 'Conversational AI conducts full technical and behavioural interviews, adapts to candidate responses, and generates a detailed feedback report.',
    bullets: ['Adaptive question flow', 'Real-time transcription', 'Behavioural & technical personas', 'Detailed score + feedback report', 'Role-specific interview simulations'],
    screenshot: false,
  },
  {
    icon: '👥', title: 'Candidate Management',
    iconBg: 'rgba(255,200,87,0.15)', iconBorder: 'rgba(255,200,87,0.28)',
    hoverGrad: 'linear-gradient(135deg,rgba(255,200,87,0.07),transparent)',
    desc: 'Centralise every candidate\'s journey — from invitation to final report — in one clean dashboard.',
    bullets: ['Bulk invite via email', 'Real-time progress tracking', 'Score comparison & leaderboard', 'Export PDF/CSV reports'],
    screenshot: false,
  },
  {
    icon: '🔒', title: 'Exam Security & Proctoring',
    iconBg: 'rgba(255,99,99,0.15)', iconBorder: 'rgba(255,99,99,0.28)',
    hoverGrad: 'linear-gradient(135deg,rgba(255,99,99,0.07),transparent)',
    desc: 'Fullscreen lockdown, tab-switch detection, copy-paste blocking, and webcam monitoring keep every assessment fair.',
    bullets: ['Fullscreen enforcement', 'Tab/window visibility alerts', 'Clipboard restrictions', 'Webcam snapshot proctoring', 'Full activity audit log'],
    screenshot: false,
  },
  {
    icon: '📊', title: 'Performance Analytics',
    iconBg: 'rgba(94,234,212,0.15)', iconBorder: 'rgba(94,234,212,0.28)',
    hoverGrad: 'linear-gradient(135deg,rgba(94,234,212,0.07),transparent)',
    desc: 'Rich dashboards that show performance trends, topic-level insights, and candidate comparisons — turning raw scores into hiring decisions.',
    bullets: ['Score distribution charts', 'Topic-wise breakdown', 'Time-spent analysis', 'Batch comparisons', 'AI-generated insights'],
    screenshot: false,
  },
  {
    icon: '✉️', title: 'Email Invitations',
    iconBg: 'rgba(167,139,250,0.15)', iconBorder: 'rgba(167,139,250,0.28)',
    hoverGrad: 'linear-gradient(135deg,rgba(167,139,250,0.07),transparent)',
    desc: 'Send branded test invitations to hundreds of candidates in one click. Automated reminders keep response rates high.',
    bullets: ['Bulk invite with one click', 'Custom email templates', 'Auto-reminders & follow-ups', 'Real-time open/start tracking'],
    screenshot: false,
  },
  {
    icon: '💎', title: 'Revo Credits System',
    iconBg: 'rgba(255,200,87,0.15)', iconBorder: 'rgba(255,200,87,0.28)',
    hoverGrad: 'linear-gradient(135deg,rgba(255,200,87,0.07),transparent)',
    desc: 'A flexible, transparent credit system for AI features. Pay only for what you use — no surprise bills.',
    bullets: ['Credits for AI question generation', 'Credits for resume analysis', 'Credits for mock interviews', 'Rollover credits monthly', 'Buy packs anytime'],
    screenshot: false,
  },
];

const BENEFITS = [
  { icon: '⚡', num: '10×', label: 'Faster screening vs manual review' },
  { icon: '🎯', num: '94%', label: 'Average completion rate' },
  { icon: '🏆', num: '500+', label: 'Questions in the bank' },
  { icon: '🌍', num: '10+', label: 'Supported coding languages' },
];

export default function FeaturesPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="fp-page">

        {/* Hero */}
        <section className="fp-hero">
          <div className="fp-badge"><span className="fp-badge-dot" />Platform Features</div>
          <h1 className="fp-h1">Every tool you need to <br /><span className="grad">hire the best engineers</span></h1>
          <p className="fp-sub">From AI-written questions to live code execution and resume screening — Revogen handles the full assessment lifecycle in one platform.</p>
          <div className="fp-cta-row">
            <Link href="/register/candidate" className="btn-primary">Start Free →</Link>
            <Link href="/assessments" className="btn-ghost">See Assessments</Link>
          </div>
        </section>

        {/* All feature cards */}
        <section className="fp-section">
          <div className="fp-inner">
            <span className="fp-label">All Modules</span>
            <h2 className="fp-h2">Built for every step of technical hiring</h2>
            <p className="fp-section-sub">Nine tightly integrated modules that work together — or independently — to fit your workflow.</p>
            <div className="fp-cards">
              {CARDS.map((c) => (
                <div
                  key={c.title}
                  className={`fp-card${c.wide ? ' wide' : ''}`}
                  style={{
                    '--hover-grad': c.hoverGrad,
                    '--icon-bg':     c.iconBg,
                    '--icon-border': c.iconBorder,
                  } as React.CSSProperties}
                >
                  <div className="fp-card-icon">{c.icon}</div>
                  <h3>{c.title}</h3>
                  <p>{c.desc}</p>
                  <ul className="fp-bullets">{c.bullets.map(b => <li key={b}>{b}</li>)}</ul>
                  {c.screenshot && (
                    <div className="fp-card-screen">
                      <div className="fp-screen-bar" style={{ width: '75%' }} />
                      <div className="fp-screen-line" style={{ width: '55%' }} />
                      <div className="fp-screen-bar" style={{ width: '40%', opacity: 0.3 }} />
                      <div className="fp-screen-line" style={{ width: '65%' }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="fp-section fp-benefits">
          <div className="fp-inner">
            <span className="fp-label">By The Numbers</span>
            <h2 className="fp-h2" style={{ marginBottom: 40 }}>Results that speak for themselves</h2>
            <div className="fp-benefits-grid">
              {BENEFITS.map(b => (
                <div key={b.label} className="fp-benefit">
                  <span className="fp-benefit-icon">{b.icon}</span>
                  <div className="fp-benefit-num">{b.num}</div>
                  <div className="fp-benefit-label">{b.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA band */}
        <div className="fp-cta-band">
          <h2>Ready to transform your hiring process?</h2>
          <p>Join hundreds of companies already using Revogen to find top engineering talent.</p>
          <div className="fp-cta-row">
            <Link href="/register/recruiter" className="btn-primary">Get Started Free →</Link>
            <Link href="/contact" className="btn-ghost">Talk to Sales</Link>
          </div>
        </div>

        {/* Footer strip */}
        <div className="fp-footer">
          <p>© {new Date().getFullYear()} Revogen AI · <Link href="/privacy" style={{ color: 'inherit' }}>Privacy</Link> · <Link href="/terms" style={{ color: 'inherit' }}>Terms</Link></p>
        </div>
      </div>
    </>
  );
}
