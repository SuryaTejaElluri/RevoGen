'use client';

import Link from 'next/link';
import { useState, useCallback } from 'react';

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

  .cp-page { padding-top: 70px; }

  /* Hero */
  .cp-hero { padding:90px 24px 60px; text-align:center; background:radial-gradient(ellipse 800px 500px at 50% 0%,rgba(124,92,255,0.14),transparent 65%); }
  .cp-badge { display:inline-flex; align-items:center; gap:8px; background:rgba(124,92,255,0.1); border:1px solid rgba(124,92,255,0.3); padding:6px 18px; border-radius:100px; font-size:0.78rem; font-weight:700; color:var(--nebula2); letter-spacing:0.08em; text-transform:uppercase; margin-bottom:24px; }
  .cp-badge-dot { width:6px; height:6px; border-radius:50%; background:var(--aqua); box-shadow:0 0 8px var(--aqua); animation:pulse 2s ease-in-out infinite; }
  @keyframes pulse{0%,100%{opacity:1;transform:scale(1);}50%{opacity:.5;transform:scale(.85);}}
  .cp-h1 { font-family:var(--display); font-size:clamp(2rem,4.5vw,3.6rem); font-weight:800; letter-spacing:-0.03em; line-height:1.1; max-width:720px; margin:0 auto 18px; }
  .cp-h1 .grad { background:linear-gradient(120deg,var(--nebula2),var(--aqua)); background-size:200%; -webkit-background-clip:text; -webkit-text-fill-color:transparent; animation:shimmer 5s linear infinite; }
  @keyframes shimmer{0%{background-position:-400px 0;}100%{background-position:400px 0;}}
  .cp-sub { font-size:1.05rem; color:var(--muted); max-width:520px; margin:0 auto; line-height:1.75; }

  /* Main layout */
  .cp-section { padding:72px 24px 100px; }
  .cp-inner { max-width:1100px; margin:0 auto; display:grid; grid-template-columns:5fr 4fr; gap:52px; align-items:start; }

  /* Form */
  .cp-form-card { background:var(--card); border:1px solid var(--border2); border-radius:26px; padding:42px; backdrop-filter:blur(18px); }
  .cp-form-title { font-family:var(--display); font-size:1.1rem; font-weight:700; margin-bottom:30px; display:flex; align-items:center; gap:10px; }
  .cp-row { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
  .cp-group { display:flex; flex-direction:column; gap:8px; margin-bottom:18px; }
  .cp-label { font-size:0.82rem; font-weight:600; color:var(--muted); }
  .cp-input {
    background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.09); border-radius:12px;
    color:var(--text); font-size:0.9rem; padding:13px 16px; outline:none;
    transition:border-color 0.2s, background 0.2s; font-family:var(--body); width:100%;
  }
  .cp-input:focus { border-color:var(--nebula); background:rgba(0,0,0,0.45); }
  .cp-input::placeholder { color:var(--muted2); }
  textarea.cp-input { resize:vertical; min-height:130px; }
  .cp-select { appearance:none; cursor:pointer; }
  .cp-submit {
    background:linear-gradient(135deg,var(--nebula),#5B3FD9); color:#fff; font-size:0.95rem; font-weight:700;
    padding:15px 28px; border-radius:13px; cursor:pointer; border:none; width:100%;
    transition:all 0.2s; font-family:var(--body); box-shadow:0 8px 26px rgba(124,92,255,0.45);
  }
  .cp-submit:hover { transform:translateY(-1px); box-shadow:0 12px 34px rgba(124,92,255,0.6); }
  .cp-submit:disabled { opacity:0.6; cursor:not-allowed; }
  .cp-success { text-align:center; padding:48px 0; }
  .cp-success-icon { font-size:3.5rem; margin-bottom:16px; }
  .cp-success-title { font-family:var(--display); font-size:1.25rem; font-weight:700; margin-bottom:10px; }
  .cp-success-sub { color:var(--muted); font-size:0.9rem; }

  /* Right sidebar */
  .cp-sidebar { display:flex; flex-direction:column; gap:20px; }
  .cp-info-card { background:var(--card); border:1px solid var(--border2); border-radius:22px; padding:28px; backdrop-filter:blur(16px); }
  .cp-info-card h3 { font-family:var(--display); font-size:1rem; font-weight:700; margin-bottom:18px; }
  .cp-info-item { display:flex; align-items:center; gap:13px; margin-bottom:14px; }
  .cp-info-item:last-child { margin-bottom:0; }
  .cp-info-icon { font-size:1.2rem; width:36px; height:36px; border-radius:10px; background:rgba(124,92,255,0.1); border:1px solid rgba(124,92,255,0.18); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .cp-info-text { font-size:0.875rem; color:var(--muted); }
  .cp-info-link { color:var(--nebula2); text-decoration:none; font-size:0.875rem; font-weight:500; transition:color 0.2s; }
  .cp-info-link:hover { color:var(--aqua); }

  /* Social links */
  .cp-socials { display:flex; gap:10px; flex-wrap:wrap; }
  .cp-social { display:flex; align-items:center; gap:8px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.09); border-radius:12px; padding:10px 16px; text-decoration:none; color:var(--muted); font-size:0.85rem; font-weight:500; transition:all 0.2s; }
  .cp-social:hover { border-color:var(--nebula); color:var(--nebula2); background:rgba(124,92,255,0.08); }
  .cp-social-icon { font-size:1.1rem; }

  /* FAQ */
  .cp-faq-section { padding:80px 24px; background:var(--void2); }
  .cp-faq-inner { max-width:840px; margin:0 auto; }
  .cp-faq-label { display:inline-flex; align-items:center; gap:9px; color:var(--nebula2); font-size:0.75rem; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; margin-bottom:16px; }
  .cp-faq-label::before { content:''; width:20px; height:2px; background:linear-gradient(90deg,var(--nebula),var(--aqua)); border-radius:1px; }
  .cp-faq-h2 { font-family:var(--display); font-size:clamp(1.7rem,3.5vw,2.6rem); font-weight:700; letter-spacing:-0.025em; margin-bottom:48px; }
  .cp-faq-list { display:flex; flex-direction:column; gap:12px; }
  .cp-faq-item { background:var(--card); border:1px solid var(--border2); border-radius:16px; overflow:hidden; backdrop-filter:blur(14px); transition:border-color 0.2s; }
  .cp-faq-item:hover { border-color:rgba(124,92,255,0.2); }
  .cp-faq-q { padding:20px 24px; cursor:pointer; display:flex; align-items:center; justify-content:space-between; gap:16px; font-size:0.95rem; font-weight:600; list-style:none; }
  .cp-faq-q::-webkit-details-marker { display:none; }
  .cp-faq-chevron { font-size:0.8rem; color:var(--muted2); transition:transform 0.2s; flex-shrink:0; }
  details[open] .cp-faq-chevron { transform:rotate(180deg); }
  .cp-faq-a { padding:0 24px 20px; color:var(--muted); font-size:0.875rem; line-height:1.78; }

  .cp-footer { background:var(--void2); border-top:1px solid var(--border2); padding:40px 24px; text-align:center; }
  .cp-footer p { color:var(--muted2); font-size:0.82rem; }

  @media (max-width:860px) { .cp-inner { grid-template-columns:1fr; } .cp-row { grid-template-columns:1fr; } }
`;

const FAQS = [
  { q: 'Is Revogen free to use?', a: 'Revogen uses a Revo Credits system. You get a set of free credits to start — enough to run your first few assessments. Additional credits can be purchased in packs. Pricing is coming soon.' },
  { q: 'How do I invite candidates to a test?', a: 'After creating a test in the admin dashboard, click "Invite" and enter candidate email addresses. They\'ll receive a branded email with a unique test link. You can also bulk-upload a CSV of emails.' },
  { q: 'What languages are supported in coding assessments?', a: 'We support Python, JavaScript, TypeScript, Java, C, C++, Go, Rust, Ruby, PHP, Kotlin, and Swift — with more being added regularly.' },
  { q: 'How does the AI resume analysis work?', a: 'You upload a PDF or DOCX resume. Our AI parses it, extracts skills and experience, and scores it against ATS criteria (formatting, keyword density, section completeness). You can also paste a job description for a tailored match score.' },
  { q: 'Can candidates take tests on mobile?', a: 'MCQ tests are fully mobile-responsive. Coding assessments are optimised for desktop for the best editor experience, though they will render on mobile.' },
  { q: 'Is my data secure?', a: 'Yes. All data is encrypted in transit and at rest. Candidate data is never shared with third parties. You can request deletion of your data at any time.' },
  { q: 'Do you offer a demo or onboarding call?', a: 'Absolutely — fill out the contact form and mention you\'d like a demo. We\'ll schedule a 30-minute walkthrough of the platform tailored to your use case.' },
  { q: 'Can I customise assessments with my own questions?', a: 'Yes. You can write your own MCQ questions and coding problems, or use AI generation, or mix both. You can also import from the question bank.' },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', company: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); setSubmitted(true); }, 900);
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="cp-page">

        {/* Hero */}
        <section className="cp-hero">
          <div className="cp-badge"><span className="cp-badge-dot" />Contact</div>
          <h1 className="cp-h1">Let&apos;s talk about <span className="grad">your hiring goals</span></h1>
          <p className="cp-sub">Whether you&apos;re a startup or an enterprise — we&apos;ll help you set up the right assessment workflow for your team.</p>
        </section>

        {/* Form + sidebar */}
        <section className="cp-section">
          <div className="cp-inner">
            {/* Form */}
            <div className="cp-form-card">
              {submitted ? (
                <div className="cp-success">
                  <div className="cp-success-icon">✅</div>
                  <div className="cp-success-title">Message received!</div>
                  <div className="cp-success-sub">We&apos;ll get back to you within 24 hours on business days.</div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="cp-form-title">✉️ Send us a message</div>
                  <div className="cp-row">
                    <div className="cp-group">
                      <label className="cp-label">Full Name *</label>
                      <input className="cp-input" type="text" placeholder="Arjun Sharma" required value={form.name} onChange={e => setForm(s => ({ ...s, name: e.target.value }))} />
                    </div>
                    <div className="cp-group">
                      <label className="cp-label">Work Email *</label>
                      <input className="cp-input" type="email" placeholder="arjun@company.com" required value={form.email} onChange={e => setForm(s => ({ ...s, email: e.target.value }))} />
                    </div>
                  </div>
                  <div className="cp-row">
                    <div className="cp-group">
                      <label className="cp-label">Company / College</label>
                      <input className="cp-input" type="text" placeholder="TechScale Inc." value={form.company} onChange={e => setForm(s => ({ ...s, company: e.target.value }))} />
                    </div>
                    <div className="cp-group">
                      <label className="cp-label">I am a… *</label>
                      <select className="cp-input cp-select" required value={form.subject} onChange={e => setForm(s => ({ ...s, subject: e.target.value }))}>
                        <option value="">Select…</option>
                        <option>Recruiter / HR</option>
                        <option>Engineering Manager</option>
                        <option>Student</option>
                        <option>College / Institution</option>
                        <option>Bootcamp</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="cp-group">
                    <label className="cp-label">Message *</label>
                    <textarea className="cp-input" placeholder="Tell us about your hiring challenges, team size, or what you'd like a demo of..." required value={form.message} onChange={e => setForm(s => ({ ...s, message: e.target.value }))} />
                  </div>
                  <button type="submit" className="cp-submit" disabled={loading}>
                    {loading ? 'Sending…' : 'Send Message →'}
                  </button>
                </form>
              )}
            </div>

            {/* Sidebar */}
            <div className="cp-sidebar">
              <div className="cp-info-card">
                <h3>📬 Get in touch</h3>
                <p style={{ color: 'var(--muted)', fontSize: '0.875rem', lineHeight: 1.65, marginBottom: 20 }}>
                  We typically respond within 24 hours on business days.
                </p>
                <div className="cp-info-item">
                  <div className="cp-info-icon">📧</div>
                  <a href="mailto:support@revogen.ai" className="cp-info-link">support@revogen.ai</a>
                </div>
                <div className="cp-info-item">
                  <div className="cp-info-icon">🏢</div>
                  <a href="mailto:enterprise@revogen.ai" className="cp-info-link">enterprise@revogen.ai</a>
                </div>
                <div className="cp-info-item">
                  <div className="cp-info-icon">📍</div>
                  <span className="cp-info-text">Hyderabad, India</span>
                </div>
              </div>

              <div className="cp-info-card">
                <h3>🌐 Find us online</h3>
                <div className="cp-socials">
                  <a href="https://linkedin.com/company/revogen" target="_blank" rel="noreferrer" className="cp-social">
                    <span className="cp-social-icon">💼</span> LinkedIn
                  </a>
                  <a href="https://github.com/revogen-ai" target="_blank" rel="noreferrer" className="cp-social">
                    <span className="cp-social-icon">🐙</span> GitHub
                  </a>
                  <a href="https://twitter.com/revogenai" target="_blank" rel="noreferrer" className="cp-social">
                    <span className="cp-social-icon">🐦</span> Twitter
                  </a>
                </div>
              </div>

              <div className="cp-info-card">
                <h3>🚀 Enterprise & Partnerships</h3>
                <p style={{ color: 'var(--muted)', fontSize: '0.875rem', lineHeight: 1.65, marginBottom: 18 }}>
                  Need custom integrations, SSO, API access, or volume pricing? Our enterprise team is ready.
                </p>
                <a href="mailto:enterprise@revogen.ai" style={{ background: 'linear-gradient(135deg,var(--nebula),#5B3FD9)', color: '#fff', display: 'block', textAlign: 'center', padding: '12px', borderRadius: 12, textDecoration: 'none', fontSize: '0.9rem', fontWeight: 700, boxShadow: '0 6px 20px rgba(124,92,255,0.4)' }}>
                  Contact Enterprise Team →
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="cp-faq-section">
          <div className="cp-faq-inner">
            <span className="cp-faq-label">FAQ</span>
            <h2 className="cp-faq-h2">Common questions</h2>
            <div className="cp-faq-list">
              {FAQS.map((faq, i) => (
                <details key={i} className="cp-faq-item">
                  <summary className="cp-faq-q">
                    {faq.q}
                    <span className="cp-faq-chevron">▼</span>
                  </summary>
                  <div className="cp-faq-a">{faq.a}</div>
                </details>
              ))}
            </div>
          </div>
        </section>

        <div className="cp-footer">
          <p>© {new Date().getFullYear()} Revogen AI · <Link href="/privacy" style={{ color: 'inherit' }}>Privacy</Link> · <Link href="/terms" style={{ color: 'inherit' }}>Terms</Link></p>
        </div>
      </div>
    </>
  );
}
