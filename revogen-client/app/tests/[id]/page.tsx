'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/lib/api';

export default function TestInstructionsPage() {
  const router = useRouter();
  const params = useParams();

  const [test, setTest] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    loadTest();
    setTimeout(() => setMounted(true), 80);
  }, []);

  const startAssessment = () => {
    if (test.securityLevel === 'PRO') {
      router.push(`/tests/${params.id}/pro`);
    } else {
      router.push(`/tests/${params.id}/basic`);
    }
  };

  const loadTest = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tests/${params.id}`);
      const data = await response.json();
      setTest(data);
    } catch (error) {
      console.error(error);
    }
  };

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg-page:      #f4f4f5;
      --bg-card:      #ffffff;
      --bg-subtle:    #fafafa;
      --bg-muted:     #f4f4f5;
      
      --border-light: #e4e4e7;
      --border-dark:  #d4d4d8;
      
      --text-main:    #09090b;
      --text-muted:   #71717a;
      --text-invert:  #ffffff;

      --accent-dark:  #18181b;
      --accent-black: #000000;

      --font:         'Inter', sans-serif;
      --radius-sm:    6px;
      --radius-md:    12px;
      --radius-lg:    16px;
      
      --transition:   all 0.2s ease;
    }

    /* Strict Fixed Page styling */
    body { 
      background: var(--bg-page); 
      color: var(--text-main); 
      font-family: var(--font); 
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      -webkit-font-smoothing: antialiased;
    }

    @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Shell ── */
    .inst-shell {
      height: 100vh;
      width: 100vw;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    /* ── Card ── */
    .inst-card {
      width: 100%;
      max-width: 760px;
      max-height: 96vh;
      background: var(--bg-card);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-lg);
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.04);
      display: flex;
      flex-direction: column;
      opacity: 0;
      overflow: hidden;
    }

    .inst-card.visible {
      animation: fadeIn 0.4s ease forwards;
    }

    /* ── Header ── */
    .inst-header {
      padding: 28px 32px 24px;
      border-bottom: 1px solid var(--border-light);
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 20px;
      flex-shrink: 0;
    }

    .inst-title-group { flex: 1; }

    .inst-eyebrow {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      margin-bottom: 6px;
    }

    .inst-title {
      font-size: 24px;
      font-weight: 700;
      color: var(--text-main);
      letter-spacing: -0.02em;
      line-height: 1.2;
      margin-bottom: 6px;
    }

    .inst-subtitle {
      font-size: 14px;
      color: var(--text-muted);
    }

    /* ── Security Badge ── */
    .sec-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: var(--bg-subtle);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-sm);
    }

    .sec-badge-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--accent-black);
    }

    .sec-badge.pro {
      background: var(--accent-dark);
      border-color: var(--accent-black);
      color: var(--text-invert);
    }
    
    .sec-badge.pro .sec-badge-dot {
      background: var(--text-invert);
    }

    .sec-badge-label {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* ── Body ── */
    .inst-body { 
      padding: 28px 32px; 
      flex: 1;
      overflow-y: auto; /* Only scrolls internally if screen is impossibly tiny */
      scrollbar-width: none;
    }
    .inst-body::-webkit-scrollbar { display: none; }

    /* ── Info Grid ── */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 28px;
    }

    .info-tile {
      background: var(--bg-subtle);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-md);
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .info-tile-icon {
      font-size: 20px;
      color: var(--accent-dark);
      opacity: 0.8;
    }

    .info-tile-label {
      font-size: 12px;
      font-weight: 500;
      color: var(--text-muted);
      margin-bottom: 2px;
    }

    .info-tile-value {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-main);
    }

    /* ── PRO Banner ── */
    .pro-banner {
      background: var(--bg-subtle);
      border: 1px solid var(--border-dark);
      border-left: 4px solid var(--accent-black);
      border-radius: var(--radius-sm);
      padding: 14px 16px;
      margin-bottom: 28px;
      font-size: 13px;
      line-height: 1.5;
      color: var(--text-main);
    }

    .pro-banner strong { font-weight: 700; }

    /* ── Section Title ── */
    .section-head {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-main);
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .section-head::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--border-light);
    }

    /* ── Rules Grid ── */
    .rules-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 24px;
    }

    .rule-chip {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      background: var(--bg-muted);
      border-radius: var(--radius-sm);
      font-size: 13px;
      font-weight: 500;
      color: var(--text-main);
    }

    .rule-chip-icon {
      font-size: 14px;
      font-weight: bold;
      opacity: 0.6;
    }

    /* ── Footer / CTA ── */
    .inst-footer {
      padding: 24px 32px;
      background: var(--bg-card);
      border-top: 1px solid var(--border-light);
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .footer-meta {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: var(--text-muted);
      font-weight: 500;
    }

    .cta-btn {
      width: 100%;
      padding: 14px 24px;
      background: var(--accent-black);
      color: var(--text-invert);
      border: none;
      border-radius: var(--radius-sm);
      font-family: var(--font);
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: var(--transition);
    }

    .cta-btn:hover {
      background: var(--text-muted);
      transform: translateY(-1px);
    }

    .cta-btn:active {
      transform: translateY(0);
    }

    /* ── Loader ── */
    .loader-shell {
      height: 100vh;
      width: 100vw;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
    }

    .loader-ring {
      width: 32px;
      height: 32px;
      border: 3px solid var(--border-light);
      border-top-color: var(--accent-black);
      border-radius: 50%;
      animation: spin .8s linear infinite;
    }

    .loader-text {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-muted);
    }

    @media (max-width: 640px) {
      .inst-header { flex-direction: column; padding: 24px 20px 20px; }
      .inst-body   { padding: 20px; }
      .inst-footer { padding: 20px; }
      .rules-grid  { grid-template-columns: 1fr; }
      .sec-badge   { align-self: flex-start; }
    }
  `;

  if (!test) {
    return (
      <>
        <style>{css}</style>
        <div className="loader-shell">
          <div className="loader-ring" />
          <p className="loader-text">Loading instructions...</p>
        </div>
      </>
    );
  }

  const isPro = test.securityLevel === 'PRO';

  return (
    <>
      <style>{css}</style>
      <div className="inst-shell">
        <div className={`inst-card ${mounted ? 'visible' : ''}`}>
          
          {/* ── Header ── */}
          <div className="inst-header">
            <div className="inst-title-group">
              <p className="inst-eyebrow">Assessment Instructions</p>
              <h1 className="inst-title">{test.title}</h1>
              <p className="inst-subtitle">Review the environment requirements before beginning.</p>
            </div>

            <div className={`sec-badge ${isPro ? 'pro' : 'basic'}`}>
              <span className="sec-badge-dot" />
              <span className="sec-badge-label">{isPro ? 'PRO Security' : 'Basic Security'}</span>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="inst-body">
            
            <div className="info-grid">
              <div className="info-tile">
                <span className="info-tile-icon">⏱</span>
                <div>
                  <div className="info-tile-label">Duration</div>
                  <div className="info-tile-value">{test.duration} Minutes</div>
                </div>
              </div>
              <div className="info-tile">
                <span className="info-tile-icon">📄</span>
                <div>
                  <div className="info-tile-label">Total Questions</div>
                  <div className="info-tile-value">{test.questions?.length ?? 0} Questions</div>
                </div>
              </div>
            </div>

            {isPro && (
              <div className="pro-banner">
                <strong>Strict Monitoring Active:</strong> Your webcam, microphone, and screen activity will be continuously recorded and analyzed. Any unauthorized behavior will be flagged automatically.
              </div>
            )}

            <div className="section-head">Standard Rules</div>
            <div className="rules-grid">
              <div className="rule-chip"><span className="rule-chip-icon">✓</span> Fullscreen mode required</div>
              <div className="rule-chip"><span className="rule-chip-icon">✓</span> Tab switching restricted</div>
              <div className="rule-chip"><span className="rule-chip-icon">✓</span> Copy & paste disabled</div>
              <div className="rule-chip"><span className="rule-chip-icon">✓</span> Auto-submit on timeout</div>
            </div>

            {isPro && (
              <>
                <div className="section-head" style={{ marginTop: '16px' }}>Proctoring Requirements</div>
                <div className="rules-grid" style={{ marginBottom: 0 }}>
                  <div className="rule-chip"><span className="rule-chip-icon">✓</span> Webcam access required</div>
                  <div className="rule-chip"><span className="rule-chip-icon">✓</span> Microphone monitoring</div>
                  <div className="rule-chip"><span className="rule-chip-icon">✓</span> Face detection active</div>
                  <div className="rule-chip"><span className="rule-chip-icon">✓</span> Noise level analysis</div>
                </div>
              </>
            )}

          </div>

          {/* ── Footer / CTA ── */}
          <div className="inst-footer">
            <div className="footer-meta">
              <span>System Status: Ready</span>
              <span>{isPro ? 'PRO Mode' : 'Basic Mode'}</span>
            </div>
            
            <button className="cta-btn" onClick={startAssessment}>
              Start Assessment
            </button>
          </div>

        </div>
      </div>
    </>
  );
}