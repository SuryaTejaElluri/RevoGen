'use client';

import Link from 'next/link';
import AdminNavbar from '@/components/AdminNavbar';

interface SecurityFeature {
  label: string;
}

const basicFeatures: SecurityFeature[] = [
  { label: 'Tab switch detection' },
  { label: 'Fullscreen monitoring' },
  { label: 'Copy / paste detection' },
  { label: 'Refresh attempt detection' },
];

const proFeatures: SecurityFeature[] = [
  { label: 'Screen share monitoring' },
  { label: 'Webcam monitoring' },
  { label: 'Face detection' },
  { label: 'Multi-device detection' },
  { label: 'Advanced risk analysis' },
];

export default function CreateAssessmentSelectPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg-base:        #090c12;
          --bg-surface:     #11151f;
          --bg-elevated:    #161b27;
          --bg-card:        #1b2130;
          --border:         #232a3a;
          --border-hover:   #323c52;
          --accent:         #6366f1;
          --accent-bright:  #818cf8;
          --accent-soft:    rgba(99,102,241,0.14);
          --accent-glow:    rgba(99,102,241,0.3);
          --success:        #22c55e;
          --success-bright: #4ade80;
          --success-soft:   rgba(34,197,94,0.12);
          --warning:        #f59e0b;
          --warning-bright: #fbbf24;
          --warning-soft:   rgba(245,158,11,0.12);
          --danger:         #ef4444;
          --danger-bright:  #f87171;
          --danger-soft:    rgba(239,68,68,0.12);
          --orange:         #fb923c;
          --orange-soft:    rgba(251,146,60,0.12);
          --purple:         #a78bfa;
          --purple-bright:  #c4b5fd;
          --purple-soft:    rgba(167,139,250,0.14);
          --pink:           #f472b6;
          --pink-soft:      rgba(244,114,182,0.12);
          --text-primary:   #f1f5f9;
          --text-secondary: #8b96a8;
          --text-muted:     #4b5468;
          --radius-sm:      8px;
          --radius-md:      12px;
          --radius-lg:      16px;
          --radius-xl:      20px;
          --shadow-sm:      0 2px 8px rgba(0,0,0,0.35);
          --shadow-md:      0 8px 24px rgba(0,0,0,0.45);
          --shadow-lg:      0 16px 40px rgba(0,0,0,0.55);
          --font-main:      'Plus Jakarta Sans', sans-serif;
          --font-mono:      'JetBrains Mono', monospace;
        }

        body { background: var(--bg-base); font-family: var(--font-main); color: var(--text-primary); }

        .page-wrapper {
          min-height: 100vh;
          background: var(--bg-base);
          background-image:
            radial-gradient(ellipse 70% 35% at 20% -5%, rgba(99,102,241,0.1) 0%, transparent 60%),
            radial-gradient(ellipse 60% 30% at 90% 0%, rgba(167,139,250,0.07) 0%, transparent 55%);
        }

        .page-container {
          max-width: 1040px;
          margin: 0 auto;
          padding: 48px 24px 90px;
        }

        /* ── Hero ── */
        .hero {
          text-align: center;
          margin-bottom: 44px;
        }
        .hero-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: var(--accent-bright);
          background: var(--accent-soft);
          border: 1px solid rgba(99,102,241,0.3);
          padding: 5px 14px;
          border-radius: 20px;
          margin-bottom: 18px;
        }
        .hero-title {
          font-size: 32px;
          font-weight: 800;
          letter-spacing: -0.6px;
          margin-bottom: 10px;
        }
        .hero-subtitle {
          font-size: 14.5px;
          color: var(--text-secondary);
          max-width: 520px;
          margin: 0 auto;
          line-height: 1.6;
        }

        /* ── Type Cards ── */
        .type-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
          margin-bottom: 56px;
        }
        .type-card {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 26px 24px;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: border-color 0.2s, box-shadow 0.2s, transform 0.18s;
        }
        .type-card:not(.disabled):hover {
          border-color: var(--border-hover);
          box-shadow: var(--shadow-md);
          transform: translateY(-3px);
        }
        .type-card.disabled { opacity: 0.6; }

        .type-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          opacity: 0.9;
        }
        .type-card.mcq::before    { background: linear-gradient(90deg, var(--accent), var(--accent-bright)); }
        .type-card.coding::before { background: linear-gradient(90deg, var(--purple), var(--purple-bright)); }
        .type-card.hybrid::before { background: linear-gradient(90deg, var(--orange), #fdba74); }

        .soon-tag {
          position: absolute;
          top: 18px;
          right: 18px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          padding: 4px 10px;
          border-radius: 20px;
          background: var(--bg-card);
          color: var(--text-muted);
          border: 1px solid var(--border);
          font-family: var(--font-mono);
        }

        .type-icon {
          width: 50px; height: 50px;
          border-radius: var(--radius-md);
          display: flex; align-items: center; justify-content: center;
          font-size: 23px;
          margin-bottom: 18px;
        }
        .type-icon.mcq    { background: var(--accent-soft); }
        .type-icon.coding { background: var(--purple-soft); }
        .type-icon.hybrid { background: var(--orange-soft); }

        .type-title {
          font-size: 17px;
          font-weight: 700;
          letter-spacing: -0.2px;
          margin-bottom: 8px;
        }
        .type-desc {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.65;
          margin-bottom: 18px;
          flex: 1;
        }

        .type-tags {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }
        .type-tag {
          font-size: 10.5px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 20px;
          font-family: var(--font-mono);
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .tag-basic { background: var(--success-soft); color: var(--success-bright); border: 1px solid rgba(34,197,94,0.25); }
        .tag-pro   { background: var(--purple-soft); color: var(--purple-bright); border: 1px solid rgba(167,139,250,0.3); }
        .tag-feature { background: var(--bg-card); color: var(--text-muted); border: 1px solid var(--border); }

        .type-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 12px;
          border-radius: var(--radius-md);
          border: none;
          font-family: var(--font-main);
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          text-decoration: none;
          transition: box-shadow 0.2s, transform 0.12s;
          color: white;
        }
        .type-btn.mcq    { background: linear-gradient(135deg, var(--accent), #7c7ff5); }
        .type-btn.coding { background: linear-gradient(135deg, var(--purple), var(--purple-bright)); color: #1b1233; }
        .type-btn:hover  { box-shadow: 0 6px 20px var(--accent-glow); transform: translateY(-1px); }
        .type-btn:active { transform: translateY(0) scale(0.98); }

        .type-btn.disabled {
          background: var(--bg-card);
          color: var(--text-muted);
          cursor: not-allowed;
          pointer-events: none;
        }
        .type-btn.disabled:hover { box-shadow: none; transform: none; }

        /* ── Security Section ── */
        .security-section {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: 36px 36px 32px;
        }
        .security-header {
          text-align: center;
          margin-bottom: 28px;
        }
        .security-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 10px;
        }
        .security-title {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.4px;
          margin-bottom: 8px;
        }
        .security-subtitle {
          font-size: 13.5px;
          color: var(--text-secondary);
          max-width: 480px;
          margin: 0 auto;
          line-height: 1.6;
        }

        .tier-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }
        .tier-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 22px 22px 20px;
          position: relative;
        }
        .tier-card.pro {
          border: 1.5px solid rgba(167,139,250,0.4);
        }
        .tier-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }
        .tier-name {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 15px;
          font-weight: 700;
        }
        .tier-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
        .tier-dot.basic { background: var(--success-bright); box-shadow: 0 0 8px rgba(34,197,94,0.6); }
        .tier-dot.pro   { background: var(--purple-bright); box-shadow: 0 0 8px rgba(167,139,250,0.6); }
        .tier-badge {
          font-size: 10px;
          font-weight: 700;
          padding: 3px 9px;
          border-radius: 20px;
          font-family: var(--font-mono);
          letter-spacing: 0.3px;
        }
        .tier-badge.included { background: var(--success-soft); color: var(--success-bright); border: 1px solid rgba(34,197,94,0.25); }
        .tier-badge.upcoming { background: var(--purple-soft); color: var(--purple-bright); border: 1px solid rgba(167,139,250,0.3); }
        .tier-sub {
          font-size: 12px;
          color: var(--text-muted);
          margin-bottom: 16px;
        }
        .tier-list { display: flex; flex-direction: column; gap: 10px; }
        .tier-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: var(--text-secondary);
        }
        .tier-check {
          width: 18px; height: 18px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px;
          flex-shrink: 0;
          font-weight: 700;
        }
        .tier-check.basic { background: var(--success-soft); color: var(--success-bright); }
        .tier-check.pro   { background: var(--purple-soft); color: var(--purple-bright); }

        .applies-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 18px;
          padding-top: 16px;
          border-top: 1px solid var(--border);
          font-size: 11.5px;
          color: var(--text-muted);
        }
        .applies-badge {
          font-size: 10.5px;
          font-weight: 600;
          padding: 3px 9px;
          border-radius: 20px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          color: var(--text-secondary);
        }

        @media (max-width: 800px) {
          .type-grid { grid-template-columns: 1fr; }
          .tier-grid { grid-template-columns: 1fr; }
          .security-section { padding: 28px 22px; }
        }
      `}</style>

      <AdminNavbar />

      <div className="page-wrapper">
        <div className="page-container">

          {/* Hero */}
          <div className="hero">
            <div className="hero-eyebrow">🗂️ New assessment</div>
            <div className="hero-title">Create a new assessment</div>
            <div className="hero-subtitle">
              Choose the assessment type that fits your hiring needs. Every assessment
              ships with built-in proctoring to keep results trustworthy.
            </div>
          </div>

          {/* Type Selection */}
          <div className="type-grid">

            {/* MCQ */}
            <div className="type-card mcq">
              <div className="type-icon mcq">📝</div>
              <div className="type-title">MCQ assessment</div>
              <div className="type-desc">
                Multiple-choice questions to quickly evaluate theoretical knowledge,
                concepts and problem-solving fundamentals at scale.
              </div>
              <div className="type-tags">
                <span className="type-tag tag-basic">🟢 Basic secured</span>
                <span className="type-tag tag-pro">🟣 Pro ready</span>
              </div>
              <Link href="/admin/tests/new" className="type-btn mcq">
                Create MCQ test <span>→</span>
              </Link>
            </div>

            {/* Coding */}
            <div className="type-card coding">
              <div className="type-icon coding">💻</div>
              <div className="type-title">Coding assessment</div>
              <div className="type-desc">
                Real-world coding challenges with live execution and test cases
                to evaluate practical, hands-on engineering skills.
              </div>
              <div className="type-tags">
                <span className="type-tag tag-basic">🟢 Basic secured</span>
                <span className="type-tag tag-pro">🟣 Pro ready</span>
              </div>
              <Link href="/admin/coding-tests/create" className="type-btn coding">
                Create coding test <span>→</span>
              </Link>
            </div>

            {/* Hybrid */}
            <div className="type-card hybrid disabled">
              <span className="soon-tag">Coming soon</span>
              <div className="type-icon hybrid">🔀</div>
              <div className="type-title">Hybrid assessment</div>
              <div className="type-desc">
                Combine MCQs and coding challenges in a single seamless
                assessment flow for a complete skills evaluation.
              </div>
              <div className="type-tags">
                <span className="type-tag tag-feature">🟢 Basic secured</span>
                <span className="type-tag tag-feature">🟣 Pro ready</span>
              </div>
              <button className="type-btn disabled" disabled>
                Coming soon
              </button>
            </div>

          </div>

          {/* Security Tiers */}
          <div className="security-section">
            <div className="security-header">
              <div className="security-eyebrow">Built-in protection</div>
              <div className="security-title">Security levels</div>
              <div className="security-subtitle">
                Both MCQ and coding assessments come with proctoring to detect
                suspicious behaviour and protect the integrity of every test.
              </div>
            </div>

            <div className="tier-grid">

              {/* Basic */}
              <div className="tier-card basic">
                <div className="tier-head">
                  <div className="tier-name">
                    <span className="tier-dot basic" />
                    Basic proctoring
                  </div>
                  <span className="tier-badge included">Included</span>
                </div>
                <div className="tier-sub">Active on every assessment by default</div>
                <div className="tier-list">
                  {basicFeatures.map((f) => (
                    <div className="tier-item" key={f.label}>
                      <span className="tier-check basic">✓</span>
                      {f.label}
                    </div>
                  ))}
                </div>
                <div className="applies-row">
                  Applies to <span className="applies-badge">📝 MCQ</span>
                  <span className="applies-badge">💻 Coding</span>
                </div>
              </div>

              {/* Pro */}
              <div className="tier-card pro">
                <div className="tier-head">
                  <div className="tier-name">
                    <span className="tier-dot pro" />
                    Pro proctoring
                  </div>
                  <span className="tier-badge upcoming">Future</span>
                </div>
                <div className="tier-sub">Advanced monitoring, rolling out soon</div>
                <div className="tier-list">
                  {proFeatures.map((f) => (
                    <div className="tier-item" key={f.label}>
                      <span className="tier-check pro">✓</span>
                      {f.label}
                    </div>
                  ))}
                </div>
                <div className="applies-row">
                  Applies to <span className="applies-badge">📝 MCQ</span>
                  <span className="applies-badge">💻 Coding</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </>
  );
}