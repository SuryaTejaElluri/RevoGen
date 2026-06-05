'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: '📄',
      title: 'Resume Analysis',
      desc: 'Deep AI analysis of your resume — structure, keywords, tone, and impact. Get actionable feedback tailored to your target role.',
      color: '#1a6cf6',
      bg: '#eef4ff',
    },
    {
      icon: '🎯',
      title: 'ATS Score',
      desc: 'Simulate how Applicant Tracking Systems parse your resume. Identify missing keywords and fix formatting issues before applying.',
      color: '#0e9f6e',
      bg: '#eafaf4',
    },
    {
      icon: '🧪',
      title: 'Screening Tests',
      desc: 'Practice aptitude, technical, and HR screening tests matched to job descriptions. Know what to expect before the interview.',
      color: '#7c3aed',
      bg: '#f3f0ff',
    },
    {
      icon: '📊',
      title: 'Dashboard Analytics',
      desc: 'Track your improvement over time with visual charts and progress metrics. See exactly where to focus your energy.',
      color: '#ea580c',
      bg: '#fff4ee',
    },
    {
      icon: '🗂️',
      title: 'Application Tracker',
      desc: 'Coming soon — manage all your job applications in one place. Status updates, follow-up reminders, and pipeline view.',
      color: '#64748b',
      bg: '#f1f5f9',
      soon: true,
    },
  ];

  const steps = [
    { num: '01', title: 'Upload your resume', desc: 'Paste your PDF or Word file.' },
    { num: '02', title: 'Choose a target role', desc: 'Enter the job description or pick from presets.' },
    { num: '03', title: 'Get your report', desc: 'Receive ATS score, feedback, and test prep instantly.' },
    { num: '04', title: 'Iterate & apply', desc: 'Fix issues, retake tests, and land the interview.' },
  ];

  const testimonials = [
    {
      name: 'Priya S.',
      role: 'Software Intern @ Infosys',
      text: 'RevoGen flagged 8 missing keywords I never would have caught. My callback rate doubled after fixing my resume.',
      avatar: 'PS',
    },
    {
      name: 'Rahul M.',
      role: 'MBA Graduate',
      text: 'The screening tests felt like the actual assessments. I walked into Deloitte\'s aptitude round feeling completely prepared.',
      avatar: 'RM',
    },
    {
      name: 'Ananya K.',
      role: 'Final Year, NIT Trichy',
      text: 'Dashboard analytics showed my weak areas clearly. Fixed them in two weeks, got shortlisted by TCS and Wipro.',
      avatar: 'AK',
    },
  ];

  const handleContact = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        html { scroll-behavior: smooth; }

        body {
          font-family: 'Sora', sans-serif;
          background: #f9f8f6;
          color: #181716;
          overflow-x: hidden;
        }

        .revogen-nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          transition: all 0.3s ease;
          padding: 0 5vw;
        }
        .revogen-nav.scrolled {
          background: rgba(249,248,246,0.92);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(0,0,0,0.06);
        }
        .nav-inner {
          max-width: 1160px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 68px;
        }
        .nav-logo {
          font-size: 1.35rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          color: #181716;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .nav-logo-dot {
          width: 8px; height: 8px;
          background: #1a6cf6;
          border-radius: 50%;
          display: inline-block;
        }
        .nav-links {
          display: flex;
          align-items: center;
          gap: 32px;
          list-style: none;
        }
        .nav-links a {
          font-size: 0.9rem;
          font-weight: 500;
          color: #4a4844;
          text-decoration: none;
          transition: color 0.2s;
        }
        .nav-links a:hover { color: #1a6cf6; }
        .nav-cta {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .btn-ghost {
          padding: 8px 18px;
          border: 1.5px solid #d4d0cb;
          border-radius: 8px;
          background: transparent;
          font-family: 'Sora', sans-serif;
          font-size: 0.875rem;
          font-weight: 500;
          color: #181716;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.2s;
        }
        .btn-ghost:hover { border-color: #1a6cf6; color: #1a6cf6; }
        .btn-primary {
          padding: 8px 18px;
          border: none;
          border-radius: 8px;
          background: #181716;
          font-family: 'Sora', sans-serif;
          font-size: 0.875rem;
          font-weight: 600;
          color: #f9f8f6;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.2s;
        }
        .btn-primary:hover { background: #1a6cf6; transform: translateY(-1px); }
        .hamburger {
          display: none;
          flex-direction: column;
          gap: 5px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
        }
        .hamburger span {
          width: 22px; height: 2px;
          background: #181716;
          border-radius: 2px;
          transition: all 0.25s;
          display: block;
        }
        .mobile-menu {
          display: none;
          position: fixed;
          top: 68px; left: 0; right: 0;
          background: #f9f8f6;
          border-bottom: 1px solid #e5e2dc;
          padding: 20px 5vw 24px;
          flex-direction: column;
          gap: 16px;
          z-index: 99;
        }
        .mobile-menu.open { display: flex; }
        .mobile-menu a {
          font-size: 1rem;
          font-weight: 500;
          color: #181716;
          text-decoration: none;
        }

        /* ── HERO ── */
        .hero {
          min-height: 100vh;
          display: flex;
          align-items: center;
          padding: 100px 5vw 80px;
          position: relative;
          overflow: hidden;
        }
        .hero-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 60% 50% at 80% 20%, rgba(26,108,246,0.08) 0%, transparent 70%),
            radial-gradient(ellipse 40% 40% at 20% 80%, rgba(124,58,237,0.06) 0%, transparent 70%),
            #f9f8f6;
          z-index: 0;
        }
        .hero-grid-lines {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px);
          background-size: 60px 60px;
          z-index: 0;
          mask-image: radial-gradient(ellipse 80% 70% at 50% 50%, black 0%, transparent 100%);
        }
        .hero-inner {
          max-width: 1160px;
          margin: 0 auto;
          width: 100%;
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
        }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #eef4ff;
          border: 1px solid #bcd2fc;
          border-radius: 100px;
          padding: 5px 14px;
          font-size: 0.78rem;
          font-weight: 600;
          color: #1a6cf6;
          margin-bottom: 20px;
          letter-spacing: 0.02em;
        }
        .hero-badge-dot {
          width: 6px; height: 6px;
          background: #1a6cf6;
          border-radius: 50%;
          animation: pulse 1.8s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        .hero h1 {
          font-size: clamp(2.4rem, 4.5vw, 3.8rem);
          font-weight: 800;
          letter-spacing: -0.04em;
          line-height: 1.1;
          margin-bottom: 24px;
          color: #181716;
        }
        .hero h1 .accent {
          color: #1a6cf6;
          position: relative;
        }
        .hero-desc {
          font-size: 1.05rem;
          color: #5a5753;
          line-height: 1.7;
          margin-bottom: 36px;
          max-width: 480px;
        }
        .hero-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .btn-hero-primary {
          padding: 14px 28px;
          background: #181716;
          color: #f9f8f6;
          border: none;
          border-radius: 10px;
          font-family: 'Sora', sans-serif;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.25s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .btn-hero-primary:hover {
          background: #1a6cf6;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(26,108,246,0.25);
        }
        .btn-hero-secondary {
          padding: 14px 28px;
          background: transparent;
          color: #181716;
          border: 1.5px solid #c8c4be;
          border-radius: 10px;
          font-family: 'Sora', sans-serif;
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.25s;
        }
        .btn-hero-secondary:hover {
          border-color: #181716;
          background: #181716;
          color: #f9f8f6;
        }
        .hero-stats {
          display: flex;
          gap: 32px;
          margin-top: 48px;
        }
        .hero-stat span {
          display: block;
          font-size: 1.6rem;
          font-weight: 800;
          letter-spacing: -0.04em;
          color: #181716;
        }
        .hero-stat p {
          font-size: 0.82rem;
          color: #8a8680;
          margin-top: 2px;
        }

        /* Hero visual (right side) */
        .hero-visual {
          position: relative;
        }
        .resume-card {
          background: #fff;
          border-radius: 16px;
          border: 1px solid #e5e2dc;
          padding: 28px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.08);
          position: relative;
        }
        .resume-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid #f0ede8;
        }
        .resume-avatar {
          width: 44px; height: 44px;
          background: #eef4ff;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
        }
        .resume-card-title { font-weight: 700; font-size: 0.95rem; }
        .resume-card-sub { font-size: 0.78rem; color: #8a8680; margin-top: 2px; }
        .ats-score-circle {
          position: absolute;
          top: -20px;
          right: -20px;
          width: 80px; height: 80px;
          background: #fff;
          border-radius: 50%;
          border: 1px solid #e5e2dc;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 24px rgba(0,0,0,0.1);
        }
        .ats-score-num {
          font-size: 1.4rem;
          font-weight: 800;
          color: #0e9f6e;
          line-height: 1;
        }
        .ats-score-label {
          font-size: 0.6rem;
          color: #8a8680;
          font-weight: 600;
          margin-top: 2px;
        }
        .score-bar-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }
        .score-bar-label {
          font-size: 0.78rem;
          color: #5a5753;
          width: 100px;
          flex-shrink: 0;
        }
        .score-bar-track {
          flex: 1;
          height: 6px;
          background: #f0ede8;
          border-radius: 100px;
          overflow: hidden;
        }
        .score-bar-fill {
          height: 100%;
          border-radius: 100px;
          animation: barGrow 1s ease-out forwards;
          transform-origin: left;
        }
        @keyframes barGrow {
          from { width: 0% !important; }
        }
        .score-bar-pct {
          font-size: 0.75rem;
          font-weight: 600;
          width: 30px;
          text-align: right;
        }
        .floating-tag {
          position: absolute;
          background: #fff;
          border: 1px solid #e5e2dc;
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 0.8rem;
          font-weight: 600;
          box-shadow: 0 8px 20px rgba(0,0,0,0.08);
          display: flex;
          align-items: center;
          gap: 6px;
          animation: floatTag 3s ease-in-out infinite;
        }
        @keyframes floatTag {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .tag-1 { bottom: -16px; left: -24px; animation-delay: 0s; }
        .tag-2 { top: 50%; right: -30px; animation-delay: 1.5s; }

        /* ── SECTIONS ── */
        section { padding: 96px 5vw; }
        .section-inner { max-width: 1160px; margin: 0 auto; }
        .section-tag {
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #1a6cf6;
          margin-bottom: 12px;
        }
        .section-title {
          font-size: clamp(1.8rem, 3vw, 2.6rem);
          font-weight: 800;
          letter-spacing: -0.04em;
          line-height: 1.15;
          margin-bottom: 16px;
          color: #181716;
        }
        .section-sub {
          font-size: 1rem;
          color: #6a6663;
          max-width: 520px;
          line-height: 1.7;
        }

        /* ── HOW IT WORKS ── */
        .how-it-works { background: #fff; }
        .steps-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0;
          margin-top: 56px;
          position: relative;
        }
        .steps-grid::before {
          content: '';
          position: absolute;
          top: 28px;
          left: 14%;
          right: 14%;
          height: 1px;
          background: linear-gradient(90deg, #e5e2dc 0%, #1a6cf6 50%, #e5e2dc 100%);
        }
        .step-item { text-align: center; padding: 0 16px; }
        .step-num {
          width: 56px; height: 56px;
          border-radius: 50%;
          background: #f9f8f6;
          border: 1.5px solid #e5e2dc;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Mono', monospace;
          font-size: 0.85rem;
          font-weight: 500;
          color: #1a6cf6;
          margin: 0 auto 20px;
          position: relative;
          z-index: 1;
          background: #fff;
          transition: all 0.3s;
        }
        .step-item:hover .step-num {
          background: #1a6cf6;
          color: #fff;
          border-color: #1a6cf6;
          transform: scale(1.1);
        }
        .step-title { font-weight: 700; font-size: 0.95rem; margin-bottom: 8px; color: #181716; }
        .step-desc { font-size: 0.85rem; color: #8a8680; line-height: 1.6; }

        /* ── FEATURES ── */
        .features { background: #f9f8f6; }
        .features-layout {
          display: grid;
          grid-template-columns: 1fr 1.4fr;
          gap: 60px;
          margin-top: 56px;
          align-items: start;
        }
        .feature-tabs { display: flex; flex-direction: column; gap: 6px; }
        .feature-tab {
          padding: 16px 20px;
          border-radius: 12px;
          border: 1.5px solid transparent;
          cursor: pointer;
          transition: all 0.25s;
          text-align: left;
          background: transparent;
          font-family: 'Sora', sans-serif;
          width: 100%;
        }
        .feature-tab:hover { background: #fff; border-color: #e5e2dc; }
        .feature-tab.active { background: #fff; border-color: #e5e2dc; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
        .feature-tab-head {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.95rem;
          font-weight: 700;
          color: #181716;
          margin-bottom: 4px;
        }
        .feature-tab-sub { font-size: 0.8rem; color: #8a8680; text-align: left; }
        .soon-badge {
          font-size: 0.65rem;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 100px;
          background: #f1f5f9;
          color: #64748b;
          letter-spacing: 0.05em;
        }
        .feature-panel {
          background: #fff;
          border-radius: 20px;
          border: 1px solid #e5e2dc;
          padding: 40px;
          min-height: 320px;
        }
        .feature-panel-icon { font-size: 2.8rem; margin-bottom: 20px; }
        .feature-panel-title {
          font-size: 1.5rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          margin-bottom: 14px;
          color: #181716;
        }
        .feature-panel-desc { font-size: 1rem; color: #5a5753; line-height: 1.75; }

        /* ── TESTIMONIALS ── */
        .testimonials { background: #fff; }
        .testimonials-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-top: 56px;
        }
        .testimonial-card {
          background: #f9f8f6;
          border: 1px solid #e5e2dc;
          border-radius: 16px;
          padding: 28px;
          transition: all 0.25s;
        }
        .testimonial-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 40px rgba(0,0,0,0.06);
          background: #fff;
        }
        .testimonial-text {
          font-size: 0.93rem;
          color: #3a3835;
          line-height: 1.7;
          margin-bottom: 20px;
          font-style: italic;
        }
        .testimonial-author { display: flex; align-items: center; gap: 12px; }
        .testimonial-avatar {
          width: 38px; height: 38px;
          border-radius: 50%;
          background: #eef4ff;
          border: 1px solid #bcd2fc;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.72rem;
          font-weight: 700;
          color: #1a6cf6;
        }
        .testimonial-name { font-weight: 700; font-size: 0.88rem; color: #181716; }
        .testimonial-role { font-size: 0.75rem; color: #8a8680; }

        /* ── CTA BANNER ── */
        .cta-banner {
          background: #181716;
          padding: 80px 5vw;
          text-align: center;
        }
        .cta-banner h2 {
          font-size: clamp(1.8rem, 3vw, 2.8rem);
          font-weight: 800;
          letter-spacing: -0.04em;
          color: #f9f8f6;
          margin-bottom: 16px;
        }
        .cta-banner p {
          font-size: 1rem;
          color: #9a9896;
          margin-bottom: 32px;
        }

        /* ── CONTACT ── */
        .contact { background: #f9f8f6; }
        .contact-layout {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 80px;
          margin-top: 56px;
          align-items: start;
        }
        .contact-info h3 {
          font-size: 1.2rem;
          font-weight: 700;
          margin-bottom: 12px;
          color: #181716;
        }
        .contact-info p { font-size: 0.9rem; color: #6a6663; line-height: 1.7; margin-bottom: 28px; }
        .contact-detail {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
          font-size: 0.88rem;
          color: #5a5753;
        }
        .contact-detail-icon {
          width: 34px; height: 34px;
          background: #eef4ff;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
        }
        .contact-form { display: flex; flex-direction: column; gap: 14px; }
        .form-field label {
          display: block;
          font-size: 0.82rem;
          font-weight: 600;
          color: #4a4844;
          margin-bottom: 6px;
        }
        .form-field input,
        .form-field textarea {
          width: 100%;
          padding: 12px 16px;
          border: 1.5px solid #e0ddd8;
          border-radius: 10px;
          font-family: 'Sora', sans-serif;
          font-size: 0.9rem;
          color: #181716;
          background: #fff;
          transition: border-color 0.2s;
          resize: none;
          outline: none;
        }
        .form-field input:focus,
        .form-field textarea:focus { border-color: #1a6cf6; }
        .btn-submit {
          padding: 14px 28px;
          background: #181716;
          color: #f9f8f6;
          border: none;
          border-radius: 10px;
          font-family: 'Sora', sans-serif;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s;
          margin-top: 4px;
        }
        .btn-submit:hover { background: #1a6cf6; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(26,108,246,0.25); }
        .success-msg {
          padding: 20px;
          background: #eafaf4;
          border: 1px solid #a7e9d2;
          border-radius: 12px;
          text-align: center;
          color: #0e9f6e;
          font-weight: 600;
          font-size: 0.95rem;
        }

        /* ── FOOTER ── */
        .footer {
          background: #181716;
          color: #9a9896;
          padding: 60px 5vw 32px;
        }
        .footer-inner {
          max-width: 1160px;
          margin: 0 auto;
        }
        .footer-top {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 48px;
          padding-bottom: 48px;
          border-bottom: 1px solid #2a2826;
          margin-bottom: 32px;
        }
        .footer-brand-name {
          font-size: 1.2rem;
          font-weight: 800;
          color: #f9f8f6;
          letter-spacing: -0.03em;
          margin-bottom: 12px;
        }
        .footer-brand-desc { font-size: 0.85rem; line-height: 1.7; }
        .footer-col-title {
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #f9f8f6;
          margin-bottom: 16px;
        }
        .footer-links { display: flex; flex-direction: column; gap: 10px; }
        .footer-links a {
          font-size: 0.85rem;
          color: #6a6663;
          text-decoration: none;
          transition: color 0.2s;
        }
        .footer-links a:hover { color: #f9f8f6; }
        .footer-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.8rem;
          color: #4a4844;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 900px) {
          .nav-links, .nav-cta { display: none; }
          .hamburger { display: flex; }
          .hero-inner { grid-template-columns: 1fr; }
          .hero-visual { display: none; }
          .steps-grid { grid-template-columns: 1fr 1fr; }
          .steps-grid::before { display: none; }
          .features-layout { grid-template-columns: 1fr; }
          .testimonials-grid { grid-template-columns: 1fr; }
          .contact-layout { grid-template-columns: 1fr; gap: 40px; }
          .footer-top { grid-template-columns: 1fr 1fr; gap: 32px; }
          .footer-bottom { flex-direction: column; gap: 8px; text-align: center; }
        }
        @media (max-width: 560px) {
          .steps-grid { grid-template-columns: 1fr; }
          .footer-top { grid-template-columns: 1fr; }
          .hero-stats { gap: 20px; }
        }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav className={`revogen-nav${scrolled ? ' scrolled' : ''}`}>
        <div className="nav-inner">
          <Link href="/" className="nav-logo">
            <span className="nav-logo-dot" />
            RevoGen
          </Link>

          <ul className="nav-links">
            <li><a href="#features">Features</a></li>
            <li><a href="#how-it-works">How it works</a></li>
            <li><a href="#testimonials">Reviews</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>

          <div className="nav-cta">
            <Link href="/login" className="btn-ghost">Log in</Link>
            <Link href="/register" className="btn-primary">Get started →</Link>
          </div>

          <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div className={`mobile-menu${menuOpen ? ' open' : ''}`}>
        <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
        <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
        <a href="#testimonials" onClick={() => setMenuOpen(false)}>Reviews</a>
        <a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a>
        <Link href="/login" className="btn-ghost" style={{ width: 'fit-content' }}>Log in</Link>
        <Link href="/register" className="btn-primary" style={{ width: 'fit-content' }}>Get started →</Link>
      </div>

      {/* ── HERO ── */}
      <section className="hero" ref={heroRef}>
        <div className="hero-bg" />
        <div className="hero-grid-lines" />
        <div className="hero-inner">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="hero-badge-dot" />
              AI-powered career platform
            </div>
            <h1>
              Land your dream job with <span className="accent">AI-powered</span> resume intelligence
            </h1>
            <p className="hero-desc">
              Resume analysis, ATS scoring, screening test prep, and career analytics — everything a student or job seeker needs to stand out.
            </p>
            <div className="hero-actions">
              <Link href="/register" className="btn-hero-primary">
                Analyze my resume →
              </Link>
              <a href="#how-it-works" className="btn-hero-secondary">
                See how it works
              </a>
            </div>
            <div className="hero-stats">
              <div className="hero-stat">
                <span>94%</span>
                <p>ATS pass rate</p>
              </div>
              <div className="hero-stat">
                <span>12k+</span>
                <p>Resumes analyzed</p>
              </div>
              <div className="hero-stat">
                <span>3×</span>
                <p>More callbacks</p>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="resume-card">
              <div className="ats-score-circle">
                <span className="ats-score-num">87</span>
                <span className="ats-score-label">ATS Score</span>
              </div>
              <div className="resume-card-header">
                <div className="resume-avatar">📄</div>
                <div>
                  <div className="resume-card-title">Resume Analysis</div>
                  <div className="resume-card-sub">Software Engineer · 3 YOE</div>
                </div>
              </div>
              {[
                { label: 'Keyword Match', pct: 87, color: '#0e9f6e' },
                { label: 'Formatting', pct: 92, color: '#1a6cf6' },
                { label: 'Impact Language', pct: 74, color: '#ea580c' },
                { label: 'Quantified Results', pct: 68, color: '#7c3aed' },
              ].map((bar) => (
                <div key={bar.label} className="score-bar-row">
                  <span className="score-bar-label">{bar.label}</span>
                  <div className="score-bar-track">
                    <div
                      className="score-bar-fill"
                      style={{ width: `${bar.pct}%`, background: bar.color }}
                    />
                  </div>
                  <span className="score-bar-pct" style={{ color: bar.color }}>
                    {bar.pct}%
                  </span>
                </div>
              ))}
            </div>
            <div className="floating-tag tag-1">
              <span>✅</span> 5 issues fixed
            </div>
            <div className="floating-tag tag-2">
              <span>🎯</span> Top 10%
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="how-it-works" id="how-it-works">
        <div className="section-inner">
          <p className="section-tag">Process</p>
          <h2 className="section-title">From upload to interview-ready in minutes</h2>
          <p className="section-sub">
            Four simple steps, powered by AI that understands what recruiters actually look for.
          </p>
          <div className="steps-grid">
            {steps.map((step) => (
              <div key={step.num} className="step-item">
                <div className="step-num">{step.num}</div>
                <div className="step-title">{step.title}</div>
                <div className="step-desc">{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="features" id="features">
        <div className="section-inner">
          <p className="section-tag">Features</p>
          <h2 className="section-title">Everything you need to get hired</h2>
          <p className="section-sub">
            Five integrated tools built specifically for students and early-career job seekers in India and beyond.
          </p>
          <div className="features-layout">
            <div className="feature-tabs">
              {features.map((f, i) => (
                <button
                  key={f.title}
                  className={`feature-tab${activeFeature === i ? ' active' : ''}`}
                  onClick={() => setActiveFeature(i)}
                >
                  <div className="feature-tab-head">
                    <span>{f.icon}</span>
                    {f.title}
                    {f.soon && <span className="soon-badge">Soon</span>}
                  </div>
                  <div className="feature-tab-sub">{f.desc.slice(0, 50)}…</div>
                </button>
              ))}
            </div>
            <div
              className="feature-panel"
              style={{ borderTop: `4px solid ${features[activeFeature].color}` }}
            >
              <div className="feature-panel-icon">{features[activeFeature].icon}</div>
              <div className="feature-panel-title">{features[activeFeature].title}</div>
              <div className="feature-panel-desc">{features[activeFeature].desc}</div>
              {!features[activeFeature].soon && (
                <Link
                  href="/register"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    marginTop: 28,
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    color: features[activeFeature].color,
                    textDecoration: 'none',
                  }}
                >
                  Try it free →
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="testimonials" id="testimonials">
        <div className="section-inner">
          <p className="section-tag">Reviews</p>
          <h2 className="section-title">Trusted by students who got hired</h2>
          <div className="testimonials-grid">
            {testimonials.map((t) => (
              <div key={t.name} className="testimonial-card">
                <p className="testimonial-text">"{t.text}"</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">{t.avatar}</div>
                  <div>
                    <div className="testimonial-name">{t.name}</div>
                    <div className="testimonial-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <div className="cta-banner">
        <h2>Ready to upgrade your resume?</h2>
        <p>Join 12,000+ students who've improved their ATS scores with RevoGen.</p>
        <Link href="/register" className="btn-hero-primary" style={{ display: 'inline-flex' }}>
          Start for free — no credit card →
        </Link>
      </div>

      {/* ── CONTACT ── */}
      <section className="contact" id="contact">
        <div className="section-inner">
          <p className="section-tag">Contact</p>
          <h2 className="section-title">Get in touch</h2>
          <div className="contact-layout">
            <div className="contact-info">
              <h3>We'd love to hear from you</h3>
              <p>
                Have a question, feedback, or partnership inquiry? Drop us a message and we'll respond within 24 hours.
              </p>
              <div className="contact-detail">
                <span className="contact-detail-icon">✉️</span>
                hello@revogen.ai
              </div>
              <div className="contact-detail">
                <span className="contact-detail-icon">🏙️</span>
                Hyderabad, India
              </div>
              <div className="contact-detail">
                <span className="contact-detail-icon">⏰</span>
                Mon–Fri, 9am–6pm IST
              </div>
            </div>
            <div>
              {submitted ? (
                <div className="success-msg">
                  ✅ Message sent! We'll get back to you within 24 hours.
                </div>
              ) : (
                <form className="contact-form" onSubmit={handleContact}>
                  <div className="form-field">
                    <label>Your name</label>
                    <input
                      type="text"
                      placeholder="Arjun Sharma"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label>Email address</label>
                    <input
                      type="email"
                      placeholder="arjun@example.com"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label>Message</label>
                    <textarea
                      rows={5}
                      placeholder="Tell us what's on your mind…"
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      required
                    />
                  </div>
                  <button type="submit" className="btn-submit">Send message →</button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-top">
            <div>
              <div className="footer-brand-name">🚀 RevoGen</div>
              <p className="footer-brand-desc">
                AI-powered resume analysis, ATS scoring, and career growth platform for students and job seekers across India.
              </p>
            </div>
            <div>
              <div className="footer-col-title">Product</div>
              <div className="footer-links">
                <a href="#features">Resume Analysis</a>
                <a href="#features">ATS Score</a>
                <a href="#features">Screening Tests</a>
                <a href="#features">Dashboard</a>
              </div>
            </div>
            <div>
              <div className="footer-col-title">Company</div>
              <div className="footer-links">
                <a href="#contact">About</a>
                <a href="#contact">Blog</a>
                <a href="#contact">Careers</a>
                <a href="#contact">Press</a>
              </div>
            </div>
            <div>
              <div className="footer-col-title">Legal</div>
              <div className="footer-links">
                <a href="#contact">Privacy Policy</a>
                <a href="#contact">Terms of Service</a>
                <a href="#contact">Cookie Policy</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2025 RevoGen. All rights reserved.</span>
            <span>Made with ♥ in India</span>
          </div>
        </div>
      </footer>
    </>
  );
}