"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

// ════════════════════════════════════════════════════════════════════════════
// GLOBAL CSS — Space / Deep-Orbit theme
// ════════════════════════════════════════════════════════════════════════════
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700;800;900&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --void:     #03040A;
    --void2:    #060814;
    --card:     rgba(16,20,38,0.55);
    --card-solid: #0D1126;
    --card2:    #131830;
    --border:   rgba(124,140,255,0.18);
    --border2:  rgba(255,255,255,0.06);
    --nebula:   #7C5CFF;
    --nebula2:  #A78BFA;
    --aqua:     #00E5FF;
    --aqua2:    #5EEAD4;
    --gold:     #FFC857;
    --rose:     #FF6FA5;
    --green:    #34E89E;
    --text:     #F4F6FF;
    --muted:    #9AA3C7;
    --muted2:   #5E6694;
    --display:  'Space Grotesk', 'Inter', sans-serif;
    --body:     'Inter', sans-serif;
  }

  html { scroll-behavior: smooth; }

  body {
    background: var(--void);
    color: var(--text);
    font-family: var(--body);
    line-height: 1.6;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
  }

  ::selection { background: rgba(124,92,255,0.4); color: #fff; }

  ::-webkit-scrollbar { width: 7px; }
  ::-webkit-scrollbar-track { background: var(--void); }
  ::-webkit-scrollbar-thumb { background: linear-gradient(var(--nebula), var(--aqua)); border-radius: 4px; }

  a { color: inherit; }

  /* ── Space canvas background (fixed, behind everything) ── */
  .space-canvas {
    position: fixed; inset: 0; z-index: 0;
    pointer-events: none;
  }
  .space-canvas canvas { display: block; width: 100%; height: 100%; }

  .space-nebula-glow {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background:
      radial-gradient(ellipse 900px 600px at 18% 8%, rgba(124,92,255,0.16), transparent 60%),
      radial-gradient(ellipse 700px 500px at 85% 18%, rgba(0,229,255,0.10), transparent 60%),
      radial-gradient(ellipse 800px 700px at 50% 95%, rgba(255,111,165,0.07), transparent 65%),
      radial-gradient(ellipse 1200px 900px at 50% 0%, rgba(8,10,26,0) 0%, var(--void) 100%);
  }

  .page-content { position: relative; z-index: 1; }

  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50%       { transform: translateY(-22px) rotate(3deg); }
  }
  @keyframes pulse-glow {
    0%, 100% { opacity: 0.5; transform: scale(1); }
    50%       { opacity: 1;   transform: scale(1.06); }
  }
  @keyframes count-up {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes flow-dot {
    0%   { transform: translateX(0);    opacity: 0; }
    10%  { opacity: 1; }
    90%  { opacity: 1; }
    100% { transform: translateX(80px); opacity: 0; }
  }
  @keyframes slide-in-up {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes ring-pulse {
    0%   { transform: scale(0.9); opacity: 0.6; }
    100% { transform: scale(1.6); opacity: 0; }
  }
  @keyframes twinkle {
    0%, 100% { opacity: 0.25; }
    50%       { opacity: 1; }
  }

  .anim-slide-up { animation: slide-in-up 0.7s cubic-bezier(.16,.84,.44,1) both; }
  .delay-1 { animation-delay: 0.08s; }
  .delay-2 { animation-delay: 0.16s; }
  .delay-3 { animation-delay: 0.24s; }
  .delay-4 { animation-delay: 0.32s; }
  .delay-5 { animation-delay: 0.40s; }
  .delay-6 { animation-delay: 0.48s; }

  /* ── Nav ── */
  .nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    transition: background 0.35s, border-color 0.35s, backdrop-filter 0.35s;
  }
  .nav.scrolled {
    background: rgba(3,4,10,0.78);
    backdrop-filter: blur(22px) saturate(140%);
    border-bottom: 1px solid var(--border);
  }
  .nav-inner {
    max-width: 1240px; margin: 0 auto;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 24px; height: 70px;
  }
  .nav-logo {
    font-family: var(--display);
    font-size: 1.4rem; font-weight: 700; letter-spacing: -0.02em;
    background: linear-gradient(135deg, var(--nebula2), var(--aqua));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    text-decoration: none;
    display: flex; align-items: center; gap: 10px;
  }
  .nav-logo-icon {
    width: 36px; height: 36px;
    background: linear-gradient(135deg, var(--nebula), var(--aqua));
    border-radius: 11px;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; flex-shrink: 0;
    box-shadow: 0 0 0 1px rgba(255,255,255,0.08) inset, 0 6px 18px rgba(124,92,255,0.35);
  }
  .nav-links { display: flex; align-items: center; gap: 4px; list-style: none; }
  .nav-links a {
    color: var(--muted); font-size: 0.9rem; font-weight: 500;
    text-decoration: none; padding: 8px 14px; border-radius: 9px;
    transition: color 0.2s, background 0.2s;
  }
  .nav-links a:hover { color: var(--text); background: rgba(255,255,255,0.05); }
  .nav-actions { display: flex; align-items: center; gap: 10px; }
  .btn-ghost {
    background: transparent; border: 1px solid rgba(255,255,255,0.14);
    color: var(--text); font-size: 0.875rem; font-weight: 500;
    padding: 9px 20px; border-radius: 10px; cursor: pointer;
    text-decoration: none; transition: all 0.2s;
  }
  .btn-ghost:hover { border-color: var(--nebula); color: var(--nebula2); background: rgba(124,92,255,0.06); }
  .btn-primary {
    background: linear-gradient(135deg, var(--nebula), #5B3FD9);
    color: #fff; font-size: 0.875rem; font-weight: 600;
    padding: 9px 20px; border-radius: 10px; cursor: pointer;
    text-decoration: none; border: none;
    transition: all 0.2s; white-space: nowrap;
    box-shadow: 0 4px 18px rgba(124,92,255,0.45);
  }
  .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(124,92,255,0.6); }
  .nav-mobile-toggle { display: none; background: none; border: none; cursor: pointer; color: var(--text); font-size: 1.2rem; }

  /* ── Hero ── */
  .hero {
    min-height: 100vh;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    position: relative; overflow: hidden;
    padding: 130px 24px 90px;
    text-align: center;
  }
  .hero-orb {
    position: absolute; border-radius: 50%; animation: float 9s ease-in-out infinite;
    filter: blur(2px);
  }
  .hero-ring {
    position: absolute; border: 1px solid rgba(124,92,255,0.18); border-radius: 50%;
    pointer-events: none;
  }
  .hero-badge {
    display: inline-flex; align-items: center; gap: 9px;
    background: rgba(124,92,255,0.1); border: 1px solid rgba(124,92,255,0.32);
    padding: 7px 18px; border-radius: 100px;
    font-size: 0.8rem; font-weight: 600; color: var(--nebula2);
    margin-bottom: 30px; letter-spacing: 0.02em;
    backdrop-filter: blur(6px);
  }
  .hero-badge-dot {
    width: 6px; height: 6px; border-radius: 50%; background: var(--aqua);
    animation: pulse-glow 2s ease-in-out infinite;
    box-shadow: 0 0 8px var(--aqua);
  }
  .hero-h1 {
    font-family: var(--display);
    font-size: clamp(2.4rem, 6vw, 5.2rem);
    font-weight: 700; letter-spacing: -0.03em; line-height: 1.08;
    max-width: 920px; margin: 0 auto 26px;
  }
  .hero-h1 .grad {
    background: linear-gradient(120deg, var(--nebula2) 0%, var(--aqua) 45%, var(--rose) 75%, var(--nebula2) 100%);
    background-size: 250%;
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    animation: shimmer 6s linear infinite;
  }
  .hero-sub {
    font-size: clamp(1rem, 2vw, 1.2rem); color: var(--muted);
    max-width: 640px; margin: 0 auto 42px; font-weight: 400; line-height: 1.75;
  }
  .hero-ctas { display: flex; align-items: center; justify-content: center; gap: 14px; flex-wrap: wrap; margin-bottom: 64px; }
  .btn-hero-primary {
    background: linear-gradient(135deg, var(--nebula), #5B3FD9);
    color: #fff; font-size: 1rem; font-weight: 700;
    padding: 15px 34px; border-radius: 13px; cursor: pointer;
    text-decoration: none; border: none;
    box-shadow: 0 10px 36px rgba(124,92,255,0.5);
    transition: all 0.25s; display: flex; align-items: center; gap: 9px;
  }
  .btn-hero-primary:hover { transform: translateY(-2px); box-shadow: 0 14px 46px rgba(124,92,255,0.65); }
  .btn-hero-secondary {
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.14);
    color: var(--text); font-size: 1rem; font-weight: 600;
    padding: 15px 34px; border-radius: 13px; cursor: pointer;
    text-decoration: none; transition: all 0.25s; display: flex; align-items: center; gap: 9px;
    backdrop-filter: blur(10px);
  }
  .btn-hero-secondary:hover { background: rgba(255,255,255,0.08); border-color: var(--nebula); }
  .hero-trusted { display: flex; align-items: center; gap: 13px; justify-content: center; flex-wrap: wrap; }
  .hero-trusted-text { color: var(--muted2); font-size: 0.8rem; }
  .hero-avatars { display: flex; }
  .hero-avatar {
    width: 32px; height: 32px; border-radius: 50%;
    border: 2px solid var(--void);
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700; margin-left: -8px;
  }

  /* ── Section shared ── */
  .section { padding: 110px 24px; position: relative; }
  .section-inner { max-width: 1200px; margin: 0 auto; }
  .section-label {
    display: inline-flex; align-items: center; gap: 9px;
    color: var(--nebula2); font-size: 0.78rem; font-weight: 700;
    letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 18px;
    font-family: var(--display);
  }
  .section-label::before {
    content: ''; width: 22px; height: 2px;
    background: linear-gradient(90deg, var(--nebula), var(--aqua));
    border-radius: 1px;
  }
  .section-h2 {
    font-family: var(--display);
    font-size: clamp(1.8rem, 4vw, 3rem); font-weight: 700;
    letter-spacing: -0.025em; line-height: 1.15; margin-bottom: 18px;
  }
  .section-sub { color: var(--muted); font-size: 1.05rem; line-height: 1.75; max-width: 600px; }
  .section-header { margin-bottom: 60px; }

  /* ── Glass card base ── */
  .glass {
    background: var(--card);
    border: 1px solid var(--border2);
    backdrop-filter: blur(18px);
  }

  /* ── Stats ── */
  .stats-band {
    background: linear-gradient(135deg, rgba(124,92,255,0.07), rgba(0,229,255,0.04));
    border-top: 1px solid var(--border2); border-bottom: 1px solid var(--border2);
    padding: 68px 24px; position: relative;
  }
  .stats-grid { max-width: 1000px; margin: 0 auto; display: grid; grid-template-columns: repeat(4, 1fr); gap: 32px; text-align: center; }
  .stat-num {
    font-family: var(--display);
    font-size: 2.9rem; font-weight: 700; letter-spacing: -0.04em;
    background: linear-gradient(135deg, var(--nebula2), var(--aqua));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    line-height: 1;
  }
  .stat-label { color: var(--muted); font-size: 0.875rem; margin-top: 10px; }

  /* ── Features grid (bento) ── */
  .features-bento { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
  .feature-card {
    background: var(--card);
    border: 1px solid var(--border2);
    border-radius: 22px; padding: 30px;
    transition: all 0.35s cubic-bezier(.16,.84,.44,1); position: relative; overflow: hidden;
    cursor: default; backdrop-filter: blur(16px);
  }
  .feature-card::before {
    content: ''; position: absolute; inset: 0;
    background: var(--card-grad, linear-gradient(135deg, rgba(124,92,255,0.05), transparent));
    opacity: 0; transition: opacity 0.35s;
  }
  .feature-card:hover { border-color: var(--border); transform: translateY(-5px); box-shadow: 0 24px 56px rgba(0,0,0,0.45); }
  .feature-card:hover::before { opacity: 1; }
  .feature-icon {
    width: 54px; height: 54px; border-radius: 15px; margin-bottom: 22px;
    display: flex; align-items: center; justify-content: center; font-size: 25px;
    background: var(--icon-bg, linear-gradient(135deg, rgba(124,92,255,0.22), rgba(124,92,255,0.05)));
    border: 1px solid var(--icon-border, rgba(124,92,255,0.22));
    position: relative; z-index: 1;
  }
  .feature-card h3 { font-family: var(--display); font-size: 1.08rem; font-weight: 700; margin-bottom: 11px; position: relative; z-index: 1; }
  .feature-card p { color: var(--muted); font-size: 0.875rem; line-height: 1.7; margin-bottom: 18px; position: relative; z-index: 1; }
  .feature-bullets { list-style: none; display: flex; flex-direction: column; gap: 7px; position: relative; z-index: 1; }
  .feature-bullets li { color: var(--muted); font-size: 0.8rem; display: flex; align-items: flex-start; gap: 8px; }
  .feature-bullets li::before { content: '✓'; color: var(--green); font-weight: 700; flex-shrink: 0; margin-top: 1px; }
  .feature-card.large { grid-column: span 2; }

  /* ── Workflow ── */
  .workflow-section { background: var(--void2); }
  .workflow-steps { display: flex; align-items: flex-start; justify-content: center; gap: 0; flex-wrap: wrap; position: relative; }
  .workflow-step {
    display: flex; flex-direction: column; align-items: center; text-align: center; gap: 14px;
    flex: 1; min-width: 120px; max-width: 160px; position: relative;
  }
  .workflow-connector {
    flex: 1; display: flex; align-items: flex-start; justify-content: center;
    padding-top: 31px; min-width: 40px; max-width: 80px; position: relative; overflow: hidden;
  }
  .connector-line { width: 100%; height: 2px; background: linear-gradient(90deg, var(--nebula), var(--aqua)); position: relative; border-radius: 1px; }
  .connector-dot {
    position: absolute; top: 50%; left: 0; transform: translateY(-50%);
    width: 8px; height: 8px; border-radius: 50%; background: var(--aqua);
    animation: flow-dot 3s ease-in-out infinite; box-shadow: 0 0 10px var(--aqua);
  }
  .workflow-icon-wrap {
    width: 62px; height: 62px; border-radius: 19px;
    background: linear-gradient(135deg, var(--nebula), #5B3FD9);
    display: flex; align-items: center; justify-content: center; font-size: 27px;
    box-shadow: 0 10px 28px rgba(124,92,255,0.4), 0 0 0 1px rgba(255,255,255,0.08) inset;
  }
  .workflow-step-label { color: var(--muted); font-size: 0.8rem; font-weight: 600; line-height: 1.4; }
  .workflow-step-num { font-family: var(--display); font-size: 0.7rem; color: var(--nebula2); font-weight: 700; letter-spacing: 0.06em; }

  /* ── Platform features ── */
  .platform-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
  .platform-item {
    background: var(--card); border: 1px solid var(--border2); border-radius: 15px;
    padding: 22px; display: flex; flex-direction: column; gap: 11px; transition: all 0.3s; backdrop-filter: blur(14px);
  }
  .platform-item:hover { border-color: var(--border); transform: translateY(-3px); box-shadow: 0 16px 36px rgba(0,0,0,0.35); }
  .platform-item-icon { font-size: 23px; }
  .platform-item-name { font-family: var(--display); font-size: 0.92rem; font-weight: 600; }
  .platform-item-desc { color: var(--muted); font-size: 0.78rem; line-height: 1.55; }

  /* ── Dashboard mockups ── */
  .mockups-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
  .mockup-card { background: var(--card); border: 1px solid var(--border2); border-radius: 22px; overflow: hidden; transition: all 0.35s; backdrop-filter: blur(16px); }
  .mockup-card:hover { transform: translateY(-7px); box-shadow: 0 30px 64px rgba(0,0,0,0.5); border-color: var(--border); }
  .mockup-topbar { background: rgba(255,255,255,0.02); padding: 13px 16px; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid var(--border2); }
  .mockup-dot { width: 10px; height: 10px; border-radius: 50%; }
  .mockup-title-bar { flex: 1; background: rgba(0,0,0,0.25); border-radius: 6px; height: 21px; margin: 0 8px; font-size: 0.7rem; color: var(--muted2); display: flex; align-items: center; padding: 0 10px; }
  .mockup-body { padding: 20px; min-height: 200px; }
  .mockup-sidebar { display: grid; grid-template-columns: 80px 1fr; gap: 12px; height: 100%; }
  .mockup-nav-items { display: flex; flex-direction: column; gap: 6px; }
  .mockup-nav-item { height: 28px; border-radius: 7px; background: rgba(255,255,255,0.03); transition: background 0.2s; }
  .mockup-nav-item.active { background: rgba(124,92,255,0.28); }
  .mockup-content { display: flex; flex-direction: column; gap: 10px; }
  .mockup-stat-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; }
  .mockup-stat-box { background: rgba(0,0,0,0.3); border-radius: 9px; padding: 11px; display: flex; flex-direction: column; gap: 4px; }
  .mockup-stat-val { font-family: var(--display); font-size: 1.12rem; font-weight: 700; }
  .mockup-stat-lbl { font-size: 0.6rem; color: var(--muted2); }
  .mockup-bar-chart { display: flex; align-items: flex-end; gap: 5px; height: 60px; }
  .mockup-bar { flex: 1; background: linear-gradient(to top, var(--nebula), var(--aqua)); border-radius: 4px 4px 0 0; opacity: 0.78; }
  .mockup-code-lines { display: flex; flex-direction: column; gap: 9px; }
  .mockup-code-line { height: 12px; border-radius: 4px; background: rgba(255,255,255,0.04); }
  .mockup-code-line.kw { background: rgba(124,92,255,0.4); width: 30%; }
  .mockup-code-line.fn { background: rgba(0,229,255,0.28); width: 60%; }
  .mockup-code-line.str { background: rgba(52,232,158,0.24); width: 50%; }
  .mockup-card-label { padding: 17px 20px; border-top: 1px solid var(--border2); display: flex; align-items: center; justify-content: space-between; }
  .mockup-label-name { font-family: var(--display); font-size: 0.875rem; font-weight: 600; }
  .mockup-label-badge { font-size: 0.7rem; font-weight: 600; color: var(--nebula2); background: rgba(124,92,255,0.13); border: 1px solid rgba(124,92,255,0.24); padding: 3px 11px; border-radius: 100px; }

  /* ── Comparison ── */
  .compare-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .compare-card { background: var(--card); border: 1px solid var(--border2); border-radius: 22px; padding: 38px; backdrop-filter: blur(16px); }
  .compare-card.highlight { border-color: rgba(124,92,255,0.4); background: linear-gradient(135deg, rgba(124,92,255,0.1), rgba(0,229,255,0.04)); }
  .compare-head { font-family: var(--display); font-size: 1.12rem; font-weight: 700; margin-bottom: 26px; display: flex; align-items: center; gap: 10px; }
  .compare-list { list-style: none; display: flex; flex-direction: column; gap: 13px; }
  .compare-list li { display: flex; align-items: flex-start; gap: 12px; font-size: 0.9rem; color: var(--muted); }
  .compare-icon { font-size: 16px; flex-shrink: 0; margin-top: 1px; }

  /* ── Testimonials ── */
  .testimonials-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
  .testi-card { background: var(--card); border: 1px solid var(--border2); border-radius: 22px; padding: 30px; transition: all 0.3s; display: flex; flex-direction: column; gap: 17px; backdrop-filter: blur(16px); }
  .testi-card:hover { border-color: var(--border); transform: translateY(-5px); box-shadow: 0 20px 48px rgba(0,0,0,0.4); }
  .testi-stars { color: var(--gold); font-size: 0.9rem; letter-spacing: 2px; }
  .testi-quote { color: var(--muted); font-size: 0.9rem; line-height: 1.75; flex: 1; }
  .testi-author { display: flex; align-items: center; gap: 12px; }
  .testi-avatar { width: 41px; height: 41px; border-radius: 50%; background: linear-gradient(135deg, var(--nebula), var(--aqua)); display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700; flex-shrink: 0; }
  .testi-name { font-size: 0.875rem; font-weight: 600; }
  .testi-role { font-size: 0.75rem; color: var(--muted2); }

  /* ── Pricing ── */
  .pricing-section { background: var(--void2); }
  .pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
  .pricing-card { background: var(--card); border: 1px solid var(--border2); border-radius: 22px; padding: 34px; display: flex; flex-direction: column; gap: 21px; transition: all 0.3s; position: relative; overflow: hidden; backdrop-filter: blur(16px); }
  .pricing-card:hover { transform: translateY(-5px); box-shadow: 0 24px 52px rgba(0,0,0,0.4); }
  .pricing-card.featured { border-color: rgba(124,92,255,0.5); background: linear-gradient(135deg, rgba(124,92,255,0.12), rgba(0,229,255,0.04)); }
  .pricing-badge { position: absolute; top: 0; right: 28px; background: linear-gradient(135deg, var(--nebula), var(--aqua)); color: #fff; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.05em; padding: 5px 15px; border-radius: 0 0 10px 10px; }
  .pricing-plan { font-family: var(--display); font-size: 0.8rem; font-weight: 700; color: var(--nebula2); text-transform: uppercase; letter-spacing: 0.09em; }
  .pricing-coming-soon { font-family: var(--display); font-size: 1.45rem; font-weight: 700; color: var(--muted); display: flex; align-items: center; gap: 10px; }
  .pricing-desc { color: var(--muted); font-size: 0.875rem; line-height: 1.65; }
  .pricing-features { list-style: none; display: flex; flex-direction: column; gap: 11px; }
  .pricing-features li { font-size: 0.875rem; color: var(--muted); display: flex; gap: 10px; align-items: flex-start; }
  .pricing-features li span { color: var(--green); font-weight: 700; flex-shrink: 0; }
  .pricing-cta { background: rgba(255,255,255,0.05); border: 1px solid var(--border2); color: var(--text); font-size: 0.9rem; font-weight: 600; padding: 13px 20px; border-radius: 12px; cursor: pointer; text-decoration: none; text-align: center; transition: all 0.2s; display: block; }
  .pricing-cta:hover { background: rgba(255,255,255,0.1); }
  .pricing-cta.featured { background: linear-gradient(135deg, var(--nebula), #5B3FD9); border-color: transparent; box-shadow: 0 8px 24px rgba(124,92,255,0.45); }
  .pricing-cta.featured:hover { box-shadow: 0 12px 34px rgba(124,92,255,0.6); }
  .credits-note { text-align: center; color: var(--muted); font-size: 0.875rem; margin-top: 34px; display: flex; align-items: center; justify-content: center; gap: 8px; }
  .credits-icon { font-size: 16px; }

  /* ── Contact ── */
  .contact-grid { display: grid; grid-template-columns: 5fr 4fr; gap: 48px; align-items: start; }
  .contact-form { background: var(--card); border: 1px solid var(--border2); border-radius: 26px; padding: 42px; backdrop-filter: blur(18px); }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .form-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 17px; }
  .form-label { font-size: 0.825rem; font-weight: 600; color: var(--muted); }
  .form-input {
    background: rgba(0,0,0,0.28); border: 1px solid var(--border2); border-radius: 11px;
    color: var(--text); font-size: 0.9rem; padding: 13px 16px; outline: none;
    transition: border-color 0.2s, background 0.2s; font-family: inherit;
  }
  .form-input:focus { border-color: var(--nebula); background: rgba(0,0,0,0.4); }
  .form-input::placeholder { color: var(--muted2); }
  textarea.form-input { resize: vertical; min-height: 120px; }
  .form-submit {
    background: linear-gradient(135deg, var(--nebula), #5B3FD9);
    color: #fff; font-size: 0.95rem; font-weight: 700;
    padding: 15px 28px; border-radius: 13px; cursor: pointer;
    border: none; width: 100%; transition: all 0.2s; font-family: inherit;
    box-shadow: 0 8px 26px rgba(124,92,255,0.45);
  }
  .form-submit:hover { transform: translateY(-1px); box-shadow: 0 12px 34px rgba(124,92,255,0.6); }
  .contact-info { display: flex; flex-direction: column; gap: 24px; }
  .contact-info-card { background: var(--card); border: 1px solid var(--border2); border-radius: 22px; padding: 30px; display: flex; flex-direction: column; gap: 17px; backdrop-filter: blur(16px); }
  .contact-info-card h3 { font-family: var(--display); font-size: 1.08rem; font-weight: 700; margin-bottom: 4px; }
  .contact-info-item { display: flex; align-items: center; gap: 12px; color: var(--muted); font-size: 0.875rem; }
  .contact-info-item-icon { font-size: 18px; }

  /* ── Footer ── */
  .footer { background: var(--void2); border-top: 1px solid var(--border2); padding: 76px 24px 42px; position: relative; }
  .footer-inner { max-width: 1200px; margin: 0 auto; }
  .footer-top { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px; margin-bottom: 58px; }
  .footer-brand-desc { color: var(--muted); font-size: 0.875rem; line-height: 1.75; margin: 16px 0 24px; max-width: 280px; }
  .footer-socials { display: flex; gap: 10px; }
  .footer-social { width: 37px; height: 37px; border-radius: 11px; background: var(--card); border: 1px solid var(--border2); display: flex; align-items: center; justify-content: center; font-size: 16px; text-decoration: none; transition: all 0.2s; }
  .footer-social:hover { border-color: var(--nebula); background: rgba(124,92,255,0.13); }
  .footer-col h4 { font-family: var(--display); font-size: 0.875rem; font-weight: 700; margin-bottom: 17px; color: var(--text); }
  .footer-links { list-style: none; display: flex; flex-direction: column; gap: 11px; }
  .footer-links a { color: var(--muted); font-size: 0.85rem; text-decoration: none; transition: color 0.2s; }
  .footer-links a:hover { color: var(--text); }
  .footer-bottom { border-top: 1px solid var(--border2); padding-top: 30px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; }
  .footer-copy { color: var(--muted2); font-size: 0.8rem; }
  .footer-legal { display: flex; gap: 24px; }
  .footer-legal a { color: var(--muted2); font-size: 0.8rem; text-decoration: none; }
  .footer-legal a:hover { color: var(--muted); }

  /* ── Mobile ── */
  @media (max-width: 900px) {
    .features-bento { grid-template-columns: 1fr 1fr; }
    .feature-card.large { grid-column: span 1; }
    .stats-grid { grid-template-columns: repeat(2, 1fr); }
    .platform-grid { grid-template-columns: repeat(2, 1fr); }
    .mockups-grid { grid-template-columns: 1fr; }
    .compare-grid { grid-template-columns: 1fr; }
    .testimonials-grid { grid-template-columns: 1fr; }
    .pricing-grid { grid-template-columns: 1fr; }
    .contact-grid { grid-template-columns: 1fr; }
    .footer-top { grid-template-columns: 1fr 1fr; gap: 32px; }
    .workflow-connector { display: none; }
    .workflow-steps { gap: 24px; justify-content: flex-start; }
    .nav-links { display: none; }
    .nav-mobile-toggle { display: block; }
  }
  @media (max-width: 600px) {
    .features-bento { grid-template-columns: 1fr; }
    .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 20px; }
    .platform-grid { grid-template-columns: 1fr 1fr; }
    .form-row { grid-template-columns: 1fr; }
    .footer-top { grid-template-columns: 1fr; }
    .footer-bottom { flex-direction: column; align-items: flex-start; }
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; }
  }
`;

// ════════════════════════════════════════════════════════════════════════════
// SPACE BACKGROUND — stars, twinkle, occasional meteors, all canvas-driven
// ════════════════════════════════════════════════════════════════════════════
function SpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    type Star = { x: number; y: number; r: number; baseAlpha: number; tw: number; speed: number };
    type Meteor = {
      x: number; y: number; vx: number; vy: number;
      len: number; life: number; maxLife: number; alpha: number;
    };

    let stars: Star[] = [];
    let meteors: Meteor[] = [];
    let lastMeteorAt = 0;
    let nextMeteorDelay = 3500 + Math.random() * 4000;

    const setupCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const starCount = Math.round((width * height) / 9000);
      stars = Array.from({ length: Math.min(starCount, 220) }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.3 + 0.3,
        baseAlpha: Math.random() * 0.6 + 0.25,
        tw: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.012 + 0.004,
      }));
    };

    const spawnMeteor = () => {
      const fromTop = Math.random() < 0.7;
      const startX = fromTop ? Math.random() * width * 0.8 : -40;
      const startY = fromTop ? -40 : Math.random() * height * 0.5;
      const angle = (Math.PI / 180) * (130 + Math.random() * 20); // diagonal downward-left to right
      const speed = 7 + Math.random() * 4;
      meteors.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed * -1,
        vy: Math.sin(angle) * speed,
        len: 90 + Math.random() * 70,
        life: 0,
        maxLife: 60 + Math.random() * 20,
        alpha: 1,
      });
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, width, height);

      // stars
      for (const s of stars) {
        const a = s.baseAlpha + Math.sin(t * s.speed + s.tw) * 0.28;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(244,246,255,${Math.max(0, Math.min(1, a))})`;
        ctx.fill();
      }

      // meteor spawn timing (few, rare, smooth)
      if (t - lastMeteorAt > nextMeteorDelay) {
        spawnMeteor();
        lastMeteorAt = t;
        nextMeteorDelay = 5000 + Math.random() * 6000;
      }

      // meteors
      meteors = meteors.filter((m) => m.life < m.maxLife);
      for (const m of meteors) {
        m.x += m.vx;
        m.y += m.vy;
        m.life += 1;
        const progress = m.life / m.maxLife;
        m.alpha = progress < 0.15 ? progress / 0.15 : 1 - (progress - 0.15) / 0.85;

        const tailX = m.x - m.vx * (m.len / 8);
        const tailY = m.y - m.vy * (m.len / 8);

        const grad = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
        grad.addColorStop(0, `rgba(255,255,255,${0.95 * m.alpha})`);
        grad.addColorStop(0.4, `rgba(167,139,250,${0.55 * m.alpha})`);
        grad.addColorStop(1, "rgba(167,139,250,0)");

        ctx.beginPath();
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(m.x, m.y, 1.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${m.alpha})`;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    setupCanvas();
    rafRef.current = requestAnimationFrame(draw);

    const onResize = () => setupCanvas();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <>
      <div className="space-canvas" aria-hidden="true">
        <canvas ref={canvasRef} />
      </div>
      <div className="space-nebula-glow" aria-hidden="true" />
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// DATA
// ════════════════════════════════════════════════════════════════════════════

const FEATURES = [
  {
    icon: "🧠", title: "AI-Powered MCQ Assessments",
    iconBg: "linear-gradient(135deg,rgba(124,92,255,0.28),rgba(124,92,255,0.05))",
    iconBorder: "rgba(124,92,255,0.28)",
    cardGrad: "linear-gradient(135deg,rgba(124,92,255,0.07),transparent)",
    desc: "Generate intelligent multiple-choice assessments tailored to any domain, difficulty level, and skill set in seconds.",
    bullets: ["Auto-generate questions with AI", "Role-based question banks", "Randomise & anti-cheat options", "Instant scoring & analytics"],
  },
  {
    icon: "💻", title: "Coding Assessments",
    iconBg: "linear-gradient(135deg,rgba(0,229,255,0.28),rgba(0,229,255,0.05))",
    iconBorder: "rgba(0,229,255,0.28)",
    cardGrad: "linear-gradient(135deg,rgba(0,229,255,0.07),transparent)",
    desc: "A full in-browser IDE supporting 10+ languages with real-time code evaluation and AI-driven test case generation.",
    bullets: ["Multi-language support", "Custom test cases", "Time & memory limits", "AI code evaluation"],
  },
  {
    icon: "📄", title: "AI Resume Analysis",
    iconBg: "linear-gradient(135deg,rgba(52,232,158,0.28),rgba(52,232,158,0.05))",
    iconBorder: "rgba(52,232,158,0.28)",
    cardGrad: "linear-gradient(135deg,rgba(52,232,158,0.07),transparent)",
    desc: "Upload resumes and let Revogen AI extract skills, match them to job requirements, and generate a compatibility score.",
    bullets: ["Skill extraction", "JD matching score", "Keyword gaps report", "Batch processing"],
    large: false,
  },
  {
    icon: "🎙️", title: "AI Mock Interviews",
    iconBg: "linear-gradient(135deg,rgba(255,111,165,0.28),rgba(255,111,165,0.05))",
    iconBorder: "rgba(255,111,165,0.28)",
    cardGrad: "linear-gradient(135deg,rgba(255,111,165,0.07),transparent)",
    desc: "Conversational AI conducts realistic technical and behavioural interviews, giving candidates detailed feedback.",
    bullets: ["Adaptive question flow", "Real-time transcription", "Feedback report", "Role-specific personas"],
    large: true,
  },
  {
    icon: "👥", title: "Candidate Management",
    iconBg: "linear-gradient(135deg,rgba(255,200,87,0.28),rgba(255,200,87,0.05))",
    iconBorder: "rgba(255,200,87,0.28)",
    cardGrad: "linear-gradient(135deg,rgba(255,200,87,0.07),transparent)",
    desc: "Centralise every candidate's journey — invitations, test status, scores, and interview feedback — in one dashboard.",
    bullets: ["Bulk invite via email", "Progress tracking", "Score comparison", "Export reports"],
  },
  {
    icon: "🔒", title: "Secure Browser Monitoring",
    iconBg: "linear-gradient(135deg,rgba(255,99,99,0.28),rgba(255,99,99,0.05))",
    iconBorder: "rgba(255,99,99,0.28)",
    cardGrad: "linear-gradient(135deg,rgba(255,99,99,0.07),transparent)",
    desc: "Fullscreen lockdown, tab-switch detection, copy-paste blocking, and webcam proctoring keep assessments fair.",
    bullets: ["Fullscreen enforcement", "Tab visibility alerts", "Clipboard restrictions", "Activity log"],
  },
];

const WORKFLOW = [
  { icon: "📋", label: "Create Assessment", delay: 0 },
  { icon: "✉️", label: "Invite Candidates", delay: 0.6 },
  { icon: "🔑", label: "Candidate Login", delay: 1.2 },
  { icon: "🧪", label: "Take Assessment", delay: 1.8 },
  { icon: "🤖", label: "AI Evaluation", delay: 2.4 },
  { icon: "📊", label: "Reports Generated", delay: 3.0 },
  { icon: "🎯", label: "Hiring Decision", delay: 3.6 },
];

const PLATFORM_FEATURES = [
  { icon: "🤖", name: "AI Engine", desc: "GPT-powered question & interview generation" },
  { icon: "📝", name: "MCQ Engine", desc: "Configurable quiz builder with randomisation" },
  { icon: "💡", name: "Question Bank", desc: "Curated library across 20+ domains" },
  { icon: "🖥️", name: "Code Sandbox", desc: "In-browser IDE with 10+ languages" },
  { icon: "📊", name: "Analytics", desc: "Real-time dashboards and leaderboards" },
  { icon: "🛡️", name: "Proctoring", desc: "Full-stack exam security layer" },
  { icon: "📧", name: "Email Invites", desc: "Bulk candidate invitations & reminders" },
  { icon: "🏆", name: "Leaderboard", desc: "Rank candidates by performance automatically" },
  { icon: "💎", name: "Revo Credits", desc: "Flexible pay-as-you-go AI usage credits" },
  { icon: "📄", name: "Resume AI", desc: "Multi-format parsing and JD matching" },
  { icon: "🎙️", name: "Mock Interview", desc: "AI-driven adaptive interview sessions" },
  { icon: "📑", name: "Reports", desc: "Branded PDF reports for every assessment" },
];

const TESTIMONIALS = [
  {
    stars: "★★★★★",
    quote: "Revogen completely transformed how we assess engineering talent. What took two weeks of back-and-forth now happens in 48 hours. The AI resume matching alone saved us 30 hours last month.",
    initials: "AK", name: "Ananya Kapoor", role: "Head of Engineering Recruitment · Infosys",
  },
  {
    stars: "★★★★★",
    quote: "The coding sandbox is production-grade. Candidates get a real IDE experience and we get instant, unbiased evaluations. Our offer acceptance rate jumped 22% since switching.",
    initials: "RS", name: "Rahul Sharma", role: "CTO · TechScale Ventures",
  },
  {
    stars: "★★★★★",
    quote: "As a startup we can't afford a full talent team. Revogen's AI mock interviews screen 80% of applicants automatically. We only talk to candidates who've already proven themselves.",
    initials: "PM", name: "Priya Menon", role: "Founder · DevSprint Labs",
  },
];

const PRICING = [
  {
    plan: "Starter", priceNote: "Coming Soon",
    desc: "Everything you need to start assessing candidates at scale.",
    features: ["50 Revo Credits / month", "MCQ & Coding assessments", "Email invitations", "Basic analytics", "Community support"],
    featured: false, cta: "Get Notified",
  },
  {
    plan: "Professional", priceNote: "Coming Soon",
    desc: "The complete hiring platform for growing engineering teams.",
    features: ["200 Revo Credits / month", "AI Resume Analysis", "AI Mock Interviews", "Advanced proctoring", "Priority support", "Custom branding"],
    featured: true, cta: "Get Notified", badge: "Most Popular",
  },
  {
    plan: "Enterprise", priceNote: "Coming Soon",
    desc: "Custom workflows and unlimited capacity for large organisations.",
    features: ["Unlimited Revo Credits", "Dedicated account manager", "SSO & SAML", "API access", "SLA guarantee", "Custom integrations"],
    featured: false, cta: "Contact Sales",
  },
];

const AVATAR_GRADIENTS: [string, string][] = [
  ["#7C5CFF", "#A78BFA"],
  ["#00E5FF", "#5EEAD4"],
  ["#FF6FA5", "#FFA8C9"],
  ["#34E89E", "#6EF0BC"],
  ["#FFC857", "#FFE0A3"],
];

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [formState, setFormState] = useState({ name: "", email: "", company: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const countersRef = useRef<HTMLDivElement>(null);
  const [countersVisible, setCountersVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setCountersVisible(true); },
      { threshold: 0.3 }
    );
    if (countersRef.current) obs.observe(countersRef.current);
    return () => obs.disconnect();
  }, []);

  const handleFormSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />
      <SpaceBackground />

      <div className="page-content">
        {/* ── Nav ─────────────────────────────────────────────────────────── */}
        <nav className={`nav${scrolled ? " scrolled" : ""}`}>
          <div className="nav-inner">
           <Link href="/" className="nav-logo">
  <img
    src="/revogen-icon.svg"
    alt="Revogen"
    style={{
      width: "36px",
      height: "36px",
      minWidth: "36px",
      borderRadius: "11px",
      display: "block",
    }}
  />
  <span style={{ fontSize: "1.4rem", fontWeight: 700 }}>Revogen</span>
</Link>
            <ul className="nav-links">
              <li><a href="#features">Features</a></li>
              <li><a href="#assessments">Assessments</a></li>
              <li><a href="#workflow">How it Works</a></li>
              <li><a href="#pricing">Pricing</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
            <div className="nav-actions">
              <Link href="/login" className="btn-ghost">Login</Link>
              <Link href="/register" className="btn-primary">Register →</Link>
              <button className="nav-mobile-toggle" onClick={() => setMobileOpen((o) => !o)} aria-label="Toggle menu">
                {mobileOpen ? "✕" : "☰"}
              </button>
            </div>
          </div>
          {mobileOpen && (
            <div style={{ background: "rgba(3,4,10,0.97)", borderTop: "1px solid rgba(124,92,255,0.18)", padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px", backdropFilter: "blur(20px)" }}>
              {["features", "assessments", "workflow", "pricing", "contact"].map((id) => (
                <a
                  key={id}
                  href={`#${id}`}
                  style={{ color: "var(--muted)", textDecoration: "none", textTransform: "capitalize", fontWeight: 600 }}
                  onClick={() => setMobileOpen(false)}
                >
                  {id.charAt(0).toUpperCase() + id.slice(1)}
                </a>
              ))}
              <Link href="/login" style={{ color: "var(--muted)", textDecoration: "none", fontWeight: 600 }}>Login</Link>
              <Link href="/register" className="btn-primary" style={{ textAlign: "center" }}>Register →</Link>
            </div>
          )}
        </nav>

        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <section className="hero">
          <div aria-hidden="true">
            <div className="hero-ring" style={{ width: 520, height: 520, top: "8%", left: "50%", transform: "translateX(-50%)" }} />
            <div className="hero-ring" style={{ width: 760, height: 760, top: "2%", left: "50%", transform: "translateX(-50%)", opacity: 0.6 }} />
            <div className="hero-orb" style={{ width: 170, height: 170, top: "14%", left: "9%", background: "radial-gradient(circle,rgba(124,92,255,0.16),transparent)", animationDuration: "11s" }} />
            <div className="hero-orb" style={{ width: 130, height: 130, top: "68%", right: "11%", background: "radial-gradient(circle,rgba(0,229,255,0.13),transparent)", animationDuration: "9s", animationDelay: "-3s" }} />
            <div className="hero-orb" style={{ width: 90, height: 90, top: "48%", left: "16%", background: "radial-gradient(circle,rgba(255,111,165,0.12),transparent)", animationDuration: "13s", animationDelay: "-6s" }} />
          </div>

          <div style={{ position: "relative", zIndex: 1 }}>
            <div className="hero-badge anim-slide-up">
              <span className="hero-badge-dot" />
              AI-Powered Technical Hiring Platform
            </div>

            <h1 className="hero-h1 anim-slide-up delay-1">
              Hire Smarter with <br />
              <span className="grad">AI-Driven Assessments</span>
            </h1>

            <p className="hero-sub anim-slide-up delay-2">
              Revogen AI combines MCQ and coding assessments, AI resume screening, and intelligent mock interviews — everything your team needs to identify top engineering talent, faster.
            </p>

            <div className="hero-ctas anim-slide-up delay-3">
              <Link href="/register" className="btn-hero-primary">
                Start Hiring Free <span>→</span>
              </Link>
              <a href="#features" className="btn-hero-secondary">
                <span>▶</span> Explore Platform
              </a>
            </div>

            <div className="hero-trusted anim-slide-up delay-4">
              <div className="hero-avatars">
                {["AK", "RS", "PM", "VR", "NK"].map((initials, idx) => {
                  const [c1, c2] = AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length];
                  return (
                    <div key={initials} className="hero-avatar" style={{ background: `linear-gradient(135deg,${c1},${c2})` }}>
                      {initials}
                    </div>
                  );
                })}
              </div>
              <span className="hero-trusted-text">Trusted by 500+ companies</span>
            </div>
          </div>
        </section>

        {/* ── Stats ───────────────────────────────────────────────────────── */}
        <div className="stats-band" ref={countersRef}>
          <div className="stats-grid">
            {[["500+", "Questions in Bank"], ["100+", "Coding Problems"], ["10+", "Assessment Types"], ["AI", "Powered Platform"]].map(([num, lbl]) => (
              <div key={lbl} style={{ animation: countersVisible ? "count-up 0.6s ease both" : "none" }}>
                <div className="stat-num">{num}</div>
                <div className="stat-label">{lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Assessment Features ──────────────────────────────────────────── */}
        <section className="section" id="assessments">
          <div className="section-inner">
            <div className="section-header">
              <span className="section-label">Assessment Suite</span>
              <h2 className="section-h2">Everything you need to evaluate talent</h2>
              <p className="section-sub">From AI-written questions to live code execution — Revogen handles the full assessment lifecycle so your team can focus on building.</p>
            </div>
            <div className="features-bento">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className={`feature-card${f.large ? " large" : ""}`}
                  style={{ "--card-grad": f.cardGrad, "--icon-bg": f.iconBg, "--icon-border": f.iconBorder } as React.CSSProperties}
                >
                  <div className="feature-icon">{f.icon}</div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                  <ul className="feature-bullets">
                    {f.bullets.map((b) => <li key={b}>{b}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Workflow ────────────────────────────────────────────────────── */}
        <section className="section workflow-section" id="workflow">
          <div className="section-inner">
            <div className="section-header" style={{ textAlign: "center" }}>
              <span className="section-label" style={{ justifyContent: "center" }}>How It Works</span>
              <h2 className="section-h2">From assessment creation to hire — in one flow</h2>
              <p className="section-sub" style={{ margin: "0 auto" }}>A unified pipeline that keeps recruiters, candidates, and AI in perfect sync.</p>
            </div>
            <div className="workflow-steps">
              {WORKFLOW.map((step, i) => (
                <WorkflowStepItem key={step.label} step={step} isLast={i === WORKFLOW.length - 1} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* ── Platform Features ────────────────────────────────────────────── */}
        <section className="section" id="features">
          <div className="section-inner">
            <div className="section-header">
              <span className="section-label">Platform Capabilities</span>
              <h2 className="section-h2">Built for serious hiring teams</h2>
              <p className="section-sub">Every feature is designed to save time, reduce bias, and surface the strongest candidates.</p>
            </div>
            <div className="platform-grid">
              {PLATFORM_FEATURES.map((pf) => (
                <div key={pf.name} className="platform-item">
                  <span className="platform-item-icon">{pf.icon}</span>
                  <span className="platform-item-name">{pf.name}</span>
                  <span className="platform-item-desc">{pf.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Dashboard Mockups ────────────────────────────────────────────── */}
        <section className="section" style={{ background: "var(--void2)" }}>
          <div className="section-inner">
            <div className="section-header">
              <span className="section-label">Platform Preview</span>
              <h2 className="section-h2">A workspace your team will actually love</h2>
              <p className="section-sub">Intuitive dashboards, clean interfaces, and actionable data at every step.</p>
            </div>
            <div className="mockups-grid">
              {/* Admin Dashboard */}
              <div className="mockup-card">
                <div className="mockup-topbar">
                  <div className="mockup-dot" style={{ background: "#FF5F57" }} />
                  <div className="mockup-dot" style={{ background: "#FEBC2E" }} />
                  <div className="mockup-dot" style={{ background: "#28C840" }} />
                  <div className="mockup-title-bar">revogen.ai/admin</div>
                </div>
                <div className="mockup-body">
                  <div className="mockup-sidebar">
                    <div className="mockup-nav-items">
                      {[true, false, false, false, false].map((a, i) => (
                        <div key={`nav-${i}`} className={`mockup-nav-item${a ? " active" : ""}`} />
                      ))}
                    </div>
                    <div className="mockup-content">
                      <div className="mockup-stat-row">
                        {[
                          { v: "142", l: "Candidates", c: "var(--nebula)" },
                          { v: "28", l: "Active Tests", c: "var(--aqua)" },
                          { v: "94%", l: "Completion", c: "var(--green)" },
                        ].map((s) => (
                          <div key={s.l} className="mockup-stat-box">
                            <span className="mockup-stat-val" style={{ color: s.c }}>{s.v}</span>
                            <span className="mockup-stat-lbl">{s.l}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mockup-bar-chart">
                        {[40, 65, 55, 80, 72, 90, 68, 75, 85, 95].map((h, i) => (
                          <div key={`bar-${i}`} className="mockup-bar" style={{ height: `${h}%` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mockup-card-label">
                  <span className="mockup-label-name">Admin Dashboard</span>
                  <span className="mockup-label-badge">Live</span>
                </div>
              </div>

              {/* Code Editor */}
              <div className="mockup-card">
                <div className="mockup-topbar">
                  <div className="mockup-dot" style={{ background: "#FF5F57" }} />
                  <div className="mockup-dot" style={{ background: "#FEBC2E" }} />
                  <div className="mockup-dot" style={{ background: "#28C840" }} />
                  <div className="mockup-title-bar">Two Sum · Python · 18:42 ⏱</div>
                </div>
                <div className="mockup-body">
                  <div className="mockup-code-lines">
                    <div className="mockup-code-line kw" />
                    <div className="mockup-code-line fn" />
                    <div className="mockup-code-line" style={{ width: "45%", background: "rgba(255,255,255,0.05)" }} />
                    <div className="mockup-code-line str" />
                    <div className="mockup-code-line" style={{ width: "70%", background: "rgba(255,255,255,0.05)" }} />
                    <div className="mockup-code-line fn" />
                    <div className="mockup-code-line kw" />
                    <div className="mockup-code-line" style={{ width: "35%", background: "rgba(255,255,255,0.05)" }} />
                    <div className="mockup-code-line str" />
                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      <div style={{ height: 28, borderRadius: 8, background: "linear-gradient(135deg,var(--green),#1FA876)", flex: 1, opacity: 0.85 }} />
                      <div style={{ height: 28, borderRadius: 8, background: "rgba(255,255,255,0.05)", flex: 2 }} />
                    </div>
                  </div>
                </div>
                <div className="mockup-card-label">
                  <span className="mockup-label-name">Coding Platform</span>
                  <span className="mockup-label-badge">10+ Languages</span>
                </div>
              </div>

              {/* Reports */}
              <div className="mockup-card">
                <div className="mockup-topbar">
                  <div className="mockup-dot" style={{ background: "#FF5F57" }} />
                  <div className="mockup-dot" style={{ background: "#FEBC2E" }} />
                  <div className="mockup-dot" style={{ background: "#28C840" }} />
                  <div className="mockup-title-bar">Assessment Report · Batch #7</div>
                </div>
                <div className="mockup-body">
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                      { name: "Arjun V.", score: 94, c: "var(--green)" },
                      { name: "Sneha R.", score: 88, c: "var(--aqua)" },
                      { name: "Rohan K.", score: 76, c: "var(--nebula)" },
                      { name: "Meera P.", score: 61, c: "var(--gold)" },
                    ].map((c) => (
                      <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg,${c.c},transparent)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                          {c.name[0]}
                        </div>
                        <div style={{ flex: 1, background: "rgba(0,0,0,0.3)", borderRadius: 6, height: 12, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${c.score}%`, background: `linear-gradient(90deg,${c.c},transparent)`, borderRadius: 6 }} />
                        </div>
                        <span style={{ fontSize: "0.7rem", fontWeight: 700, color: c.c, width: 30, textAlign: "right" }}>{c.score}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mockup-card-label">
                  <span className="mockup-label-name">Analytics & Reports</span>
                  <span className="mockup-label-badge">AI Insights</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Comparison ──────────────────────────────────────────────────── */}
        <section className="section">
          <div className="section-inner">
            <div className="section-header" style={{ textAlign: "center" }}>
              <span className="section-label" style={{ justifyContent: "center" }}>Why Revogen</span>
              <h2 className="section-h2">Replace your spreadsheet hiring process</h2>
            </div>
            <div className="compare-grid">
              <div className="compare-card">
                <p className="compare-head">❌ Traditional Hiring</p>
                <ul className="compare-list">
                  {[
                    "Manual resume screening takes days",
                    "Phone screens miss technical depth",
                    "No standardised coding test",
                    "Bias in unstructured interviews",
                    "Scattered tools: email, sheets, docs",
                    "Zero insight into candidate quality",
                  ].map((t) => (
                    <li key={t}><span className="compare-icon">✗</span>{t}</li>
                  ))}
                </ul>
              </div>
              <div className="compare-card highlight">
                <p className="compare-head">⚡ Revogen AI</p>
                <ul className="compare-list">
                  {[
                    "AI screens resumes in seconds",
                    "Structured technical assessments",
                    "In-browser coding with AI evaluation",
                    "Consistent AI mock interview scoring",
                    "One unified hiring dashboard",
                    "Leaderboard, reports & analytics",
                  ].map((t) => (
                    <li key={t} style={{ color: "var(--text)" }}><span className="compare-icon" style={{ color: "var(--green)" }}>✓</span>{t}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── Testimonials ────────────────────────────────────────────────── */}
        <section className="section" style={{ background: "var(--void2)" }}>
          <div className="section-inner">
            <div className="section-header">
              <span className="section-label">Testimonials</span>
              <h2 className="section-h2">Teams that ship faster with Revogen</h2>
            </div>
            <div className="testimonials-grid">
              {TESTIMONIALS.map((t) => (
                <div key={t.name} className="testi-card">
                  <span className="testi-stars">{t.stars}</span>
                  <p className="testi-quote">&ldquo;{t.quote}&rdquo;</p>
                  <div className="testi-author">
                    <div className="testi-avatar">{t.initials}</div>
                    <div>
                      <div className="testi-name">{t.name}</div>
                      <div className="testi-role">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing ─────────────────────────────────────────────────────── */}
        <section className="section pricing-section" id="pricing">
          <div className="section-inner">
            <div className="section-header" style={{ textAlign: "center" }}>
              <span className="section-label" style={{ justifyContent: "center" }}>Pricing</span>
              <h2 className="section-h2">Simple, credit-based pricing</h2>
              <p className="section-sub" style={{ margin: "0 auto" }}>Use Revo Credits across AI assessments, resume analysis, and mock interviews. No surprises.</p>
            </div>
            <div className="pricing-grid">
              {PRICING.map((p) => (
                <div key={p.plan} className={`pricing-card${p.featured ? " featured" : ""}`}>
                  {p.badge && <div className="pricing-badge">{p.badge}</div>}
                  <div>
                    <div className="pricing-plan">{p.plan}</div>
                    <div className="pricing-coming-soon">🚀 Coming Soon</div>
                  </div>
                  <p className="pricing-desc">{p.desc}</p>
                  <ul className="pricing-features">
                    {p.features.map((f) => (<li key={f}><span>✓</span>{f}</li>))}
                  </ul>
                  <a href="#contact" className={`pricing-cta${p.featured ? " featured" : ""}`}>{p.cta}</a>
                </div>
              ))}
            </div>
            <div className="credits-note">
              <span className="credits-icon">💎</span>
              All plans use <strong style={{ color: "var(--nebula2)" }}>Revo Credits</strong> — a flexible AI token system. Credits roll over monthly.
            </div>
          </div>
        </section>

        {/* ── Contact ─────────────────────────────────────────────────────── */}
        <section className="section" id="contact">
          <div className="section-inner">
            <div className="section-header">
              <span className="section-label">Contact</span>
              <h2 className="section-h2">Let&apos;s talk about your hiring goals</h2>
              <p className="section-sub">Whether you&apos;re a startup or enterprise, we&apos;ll help you set up the right assessment workflow.</p>
            </div>
            <div className="contact-grid">
              <div className="contact-form">
                {submitted ? (
                  <div style={{ textAlign: "center", padding: "40px 0" }}>
                    <div style={{ fontSize: "3rem", marginBottom: 16 }}>✅</div>
                    <h3 style={{ fontFamily: "var(--display)", fontSize: "1.2rem", fontWeight: 700, marginBottom: 8 }}>Message received!</h3>
                    <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>We&apos;ll get back to you within 24 hours.</p>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit}>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input
                          className="form-input" type="text" placeholder="Arjun Sharma" required
                          value={formState.name} onChange={(e) => setFormState((s) => ({ ...s, name: e.target.value }))}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Work Email</label>
                        <input
                          className="form-input" type="email" placeholder="arjun@company.com" required
                          value={formState.email} onChange={(e) => setFormState((s) => ({ ...s, email: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Company</label>
                      <input
                        className="form-input" type="text" placeholder="TechScale Inc."
                        value={formState.company} onChange={(e) => setFormState((s) => ({ ...s, company: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Message</label>
                      <textarea
                        className="form-input" placeholder="Tell us about your hiring challenges and team size..." required
                        value={formState.message} onChange={(e) => setFormState((s) => ({ ...s, message: e.target.value }))}
                      />
                    </div>
                    <button type="submit" className="form-submit">Send Message →</button>
                  </form>
                )}
              </div>
              <div className="contact-info">
                <div className="contact-info-card">
                  <h3>Get in touch</h3>
                  <p style={{ color: "var(--muted)", fontSize: "0.875rem", lineHeight: 1.6 }}>Our team typically responds within 24 hours on business days.</p>
                  <div className="contact-info-item">
                    <span className="contact-info-item-icon">📧</span>
                    <span>support@revogen.ai</span>
                  </div>
                  <div className="contact-info-item">
                    <span className="contact-info-item-icon">💼</span>
                    <span>linkedin.com/company/revogen</span>
                  </div>
                  <div className="contact-info-item">
                    <span className="contact-info-item-icon">🐙</span>
                    <span>github.com/revogen-ai</span>
                  </div>
                  <div className="contact-info-item">
                    <span className="contact-info-item-icon">📍</span>
                    <span>Bengaluru, India</span>
                  </div>
                </div>
                <div className="contact-info-card">
                  <h3>Enterprise Enquiries</h3>
                  <p style={{ color: "var(--muted)", fontSize: "0.875rem", lineHeight: 1.6 }}>Need custom integrations, dedicated support, or volume pricing? Our enterprise team is ready.</p>
                  <a href="mailto:enterprise@revogen.ai" className="btn-primary" style={{ textAlign: "center", display: "block" }}>
                    Contact Sales →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <footer className="footer">
          <div className="footer-inner">
            <div className="footer-top">
              <div>
                <Link href="/" className="nav-logo">
  <img src="/revogen-icon.svg" alt="Revogen" width={36} height={36} style={{ borderRadius: 11 }} />
  
</Link>
                <p className="footer-brand-desc">
                  The AI-powered technical assessment platform trusted by engineering teams. Build better hiring pipelines, faster.
                </p>
                <div className="footer-socials">
                  {[["🐙", "https://github.com"], ["💼", "https://linkedin.com"], ["🐦", "https://twitter.com"], ["📧", "mailto:support@revogen.ai"]].map(([icon, href]) => (
                    <a key={href} className="footer-social" href={href as string} target="_blank" rel="noreferrer">{icon}</a>
                  ))}
                </div>
              </div>
              <div className="footer-col">
                <h4>Product</h4>
                <ul className="footer-links">
                  <li><a href="#assessments">MCQ Assessments</a></li>
                  <li><a href="#assessments">Coding Platform</a></li>
                  <li><a href="#assessments">Resume AI</a></li>
                  <li><a href="#assessments">Mock Interviews</a></li>
                  <li><a href="#pricing">Pricing</a></li>
                </ul>
              </div>
              <div className="footer-col">
                <h4>Company</h4>
                <ul className="footer-links">
                  <li><a href="#contact">About</a></li>
                  <li><a href="#contact">Contact</a></li>
                  <li><a href="#">Privacy Policy</a></li>
                  <li><a href="#">Terms of Service</a></li>
                </ul>
              </div>
              <div className="footer-col">
                <h4>Resources</h4>
                <ul className="footer-links">
                  <li><a href="#">Documentation</a></li>
                  <li><a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a></li>
                  <li><a href="#contact">Support</a></li>
                  <li><a href="#">FAQ</a></li>
                  <li><a href="#">Changelog</a></li>
                </ul>
              </div>
            </div>
            <div className="footer-bottom">
              <span className="footer-copy">© {new Date().getFullYear()} Revogen AI. All rights reserved.</span>
              <div className="footer-legal">
                <a href="#">Privacy</a>
                <a href="#">Terms</a>
                <a href="#">Cookies</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Sub-component — workflow step + connector, properly keyed (fixes the
// "each child in a list should have a unique key" / fragment key bug from
// the previous version which wrapped a key-less <> fragment around two
// keyed children inside a .map()).
// ════════════════════════════════════════════════════════════════════════════
function WorkflowStepItem({
  step,
  isLast,
  index,
}: {
  step: { icon: string; label: string; delay: number };
  isLast: boolean;
  index: number;
}) {
  return (
    <div style={{ display: "contents" }}>
      <div className="workflow-step" style={{ animation: `slide-in-up 0.5s ease ${step.delay}s both` }}>
        <div className="workflow-icon-wrap">{step.icon}</div>
        <span className="workflow-step-num">{String(index + 1).padStart(2, "0")}</span>
        <span className="workflow-step-label">{step.label}</span>
      </div>
      {!isLast && (
        <div className="workflow-connector">
          <div className="connector-line">
            <div className="connector-dot" style={{ animationDelay: `${step.delay}s` }} />
          </div>
        </div>
      )}
    </div>
  );
}