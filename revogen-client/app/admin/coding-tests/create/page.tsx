'use client';
import { getToken } from '@/lib/auth';
import { API_BASE_URL } from '@/lib/api';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminNavbar from '@/components/AdminNavbar';

interface CodingQuestion {
  id: string;
  title: string;
  difficulty: string;
  category: string;
}

export default function CreateCodingAssessmentPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState<number | ''>(60);
  const [securityLevel, setSecurityLevel] = useState('BASIC');
  const [questions, setQuestions] = useState<CodingQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadQuestions(); }, []);

  const loadQuestions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/coding-question-bank`, {
        headers: { Authorization: `Bearer ${getToken() ?? ''}` },
      });
      if (response.ok) { const data = await response.json(); setQuestions(data); }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const categories = useMemo(() => Array.from(new Set(questions.map(q => q.category).filter(Boolean))), [questions]);
  const difficulties = useMemo(() => Array.from(new Set(questions.map(q => q.difficulty).filter(Boolean))), [questions]);

  const filteredQuestions = useMemo(() => questions.filter(q => {
    const matchSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = filterCategory ? q.category === filterCategory : true;
    const matchDiff = filterDifficulty ? q.difficulty === filterDifficulty : true;
    return matchSearch && matchCat && matchDiff;
  }), [questions, searchQuery, filterCategory, filterDifficulty]);

  const selectedStats = useMemo(() => {
    const sel = questions.filter(q => selectedIds.includes(q.id));
    return {
      total: sel.length,
      easy: sel.filter(q => q.difficulty?.toUpperCase() === 'EASY').length,
      medium: sel.filter(q => q.difficulty?.toUpperCase() === 'MEDIUM').length,
      hard: sel.filter(q => q.difficulty?.toUpperCase() === 'HARD').length,
    };
  }, [questions, selectedIds]);

  const toggleQuestion = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const diffStyle = (diff: string) => {
    switch (diff?.toUpperCase()) {
      case 'EASY':   return { bg: 'rgba(74,222,128,0.12)',  color: '#4ade80', border: 'rgba(74,222,128,0.25)' };
      case 'MEDIUM': return { bg: 'rgba(251,191,36,0.12)',  color: '#fbbf24', border: 'rgba(251,191,36,0.25)' };
      case 'HARD':   return { bg: 'rgba(248,113,113,0.12)', color: '#f87171', border: 'rgba(248,113,113,0.25)' };
      default:       return { bg: 'rgba(129,140,248,0.12)', color: '#818cf8', border: 'rgba(129,140,248,0.25)' };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (!title.trim()) return setError('Title is required.');
    if (!duration) return setError('Duration is required.');
    if (selectedIds.length === 0) return setError('Please select at least one question.');
    setSubmitting(true);
    try {
      const token = getToken();
      const payload = { title, description, duration: Number(duration), securityLevel, questionIds: selectedIds };
      const response = await fetch(`${API_BASE_URL}/coding-tests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) { console.log('Create Error:', data); throw new Error(data.message || 'Failed to create assessment.'); }
      router.push(`/admin/coding-tests/${data.codingTestId}/assign`);
    } catch (err: any) {
      console.error(err); setError(err.message || 'An error occurred.');
    } finally { setSubmitting(false); }
  };


  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{
      --void:#04060d;--base:#070b12;--surface:#0c1018;--card:#101520;--elevated:#161c28;
      --bdr1:rgba(255,255,255,0.05);--bdr2:rgba(255,255,255,0.09);--bdr3:rgba(255,255,255,0.15);
      --ind:#6366f1;--ind-l:#818cf8;--ind-s:rgba(99,102,241,0.14);--ind-g:rgba(99,102,241,0.35);
      --cyan:#22d3ee;--cyan-s:rgba(34,211,238,0.1);
      --grn:#4ade80;--grn-s:rgba(74,222,128,0.1);
      --amb:#fbbf24;--amb-s:rgba(251,191,36,0.1);
      --red:#f87171;--red-s:rgba(248,113,113,0.1);
      --pur:#c084fc;--pur-s:rgba(192,132,252,0.1);
      --t1:#f0f4ff;--t2:#c7d2fe;--t3:#94a3b8;--t4:#64748b;--t5:#2d3748;
      --r-s:8px;--r-m:12px;--r-l:16px;--r-xl:22px;
      --fn:'Inter',sans-serif;--mo:'JetBrains Mono',monospace;
    }
    body{background:var(--base);font-family:var(--fn);color:var(--t1);-webkit-font-smoothing:antialiased}

    /* PAGE */
    .pg{
      min-height:100vh;background:var(--base);
      background-image:
        radial-gradient(ellipse 140% 55% at 50% -8%,rgba(99,102,241,.2) 0%,transparent 55%),
        radial-gradient(ellipse 70% 35% at 92% 8%,rgba(34,211,238,.07) 0%,transparent 50%),
        radial-gradient(ellipse 55% 45% at 4% 65%,rgba(192,132,252,.06) 0%,transparent 50%);
    }

    /* TOPBAR */
    .topbar{
      width:100%;padding:11px 0;
      background:linear-gradient(90deg,rgba(99,102,241,.07),rgba(34,211,238,.03) 60%,rgba(192,132,252,.05));
      border-bottom:1px solid var(--bdr1);
    }
    .topbar-in{
      max-width:1280px;margin:0 auto;padding:0 32px;
      display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;
    }
    .crumb{display:flex;align-items:center;gap:7px;font-size:12px;color:var(--t4)}
    .crumb a{color:var(--t3);text-decoration:none;transition:color .18s}
    .crumb a:hover{color:var(--ind-l)}
    .crumb-sep{color:var(--t5)}
    .crumb-cur{color:var(--t2);font-weight:500}
    .qbank-btn{
      display:inline-flex;align-items:center;gap:6px;
      padding:5px 13px;border-radius:20px;
      background:var(--pur-s);border:1px solid rgba(192,132,252,.22);
      color:var(--pur);font-size:11px;font-weight:700;text-decoration:none;
      text-transform:uppercase;letter-spacing:.6px;transition:all .2s;
    }
    .qbank-btn:hover{background:rgba(192,132,252,.18);border-color:rgba(192,132,252,.4);transform:translateY(-1px)}

    /* HERO */
    .hero{
      width:100%;padding:52px 0 44px;text-align:center;
      background:linear-gradient(180deg,rgba(99,102,241,.06) 0%,transparent 100%);
      border-bottom:1px solid var(--bdr1);margin-bottom:40px;
    }
    .hero-pill{
      display:inline-flex;align-items:center;gap:8px;
      padding:6px 16px;border-radius:20px;margin-bottom:22px;
      background:var(--ind-s);border:1px solid rgba(99,102,241,.28);
      font-size:11px;font-weight:700;letter-spacing:.9px;text-transform:uppercase;color:var(--ind-l);
    }
    .hero-dot{
      width:7px;height:7px;border-radius:50%;background:var(--ind-l);
      box-shadow:0 0 8px var(--ind);animation:hpulse 2s ease-in-out infinite;
    }
    @keyframes hpulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.45;transform:scale(.8)}}
    .hero-h1{
      font-size:clamp(30px,4.5vw,46px);font-weight:800;letter-spacing:-1.2px;line-height:1.08;
      background:linear-gradient(135deg,#f0f4ff 0%,#c7d2fe 45%,#a5b4fc 100%);
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
      margin-bottom:14px;
    }
    .hero-sub{font-size:15px;color:var(--t3);max-width:480px;margin:0 auto;line-height:1.65}
  `;


  const CSS2 = `
    /* LAYOUT */
    .wrap{max-width:1280px;margin:0 auto;padding:0 32px 100px;position:relative;z-index:1}
    .grid{display:grid;grid-template-columns:1fr 368px;gap:28px;align-items:start}
    @media(max-width:980px){.grid{grid-template-columns:1fr}.sticky-side{position:static!important}}

    /* SECTION LABEL */
    .sec-label{
      display:flex;align-items:center;gap:10px;
      font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;
      color:var(--ind-l);margin-bottom:18px;
    }
    .sec-label-num{
      width:22px;height:22px;border-radius:50%;
      background:var(--ind-s);border:1px solid rgba(99,102,241,.3);
      display:grid;place-content:center;font-size:11px;font-weight:800;
    }
    .sec-divider{flex:1;height:1px;background:linear-gradient(90deg,rgba(99,102,241,.2),transparent)}

    /* CARD */
    .card{
      background:var(--card);
      border:1px solid var(--bdr2);
      border-radius:var(--r-xl);
      padding:28px;margin-bottom:24px;
      box-shadow:0 2px 16px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.04);
      transition:border-color .2s;
    }
    .card:hover{border-color:var(--bdr3)}

    /* FORM */
    .frow{display:flex;gap:16px;flex-wrap:wrap}
    .frow>*{flex:1;min-width:190px}
    .fg{margin-bottom:18px}
    .flbl{
      display:block;font-size:11px;font-weight:700;letter-spacing:.6px;
      text-transform:uppercase;color:var(--t4);margin-bottom:8px;
    }
    .finput,.ftxt,.fsel{
      width:100%;padding:11px 15px;
      background:var(--elevated);border:1px solid var(--bdr2);
      color:var(--t1);border-radius:var(--r-m);
      font-family:var(--fn);font-size:14px;
      transition:border-color .18s,box-shadow .18s;
      outline:none;
    }
    .finput:focus,.ftxt:focus,.fsel:focus{
      border-color:var(--ind);box-shadow:0 0 0 3px var(--ind-s);
    }
    .finput::placeholder,.ftxt::placeholder{color:var(--t5)}
    .ftxt{resize:vertical;min-height:88px;line-height:1.6}
    .fsel{cursor:pointer;appearance:none;
      background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%2364748b' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
      background-repeat:no-repeat;background-position:right 14px center;padding-right:36px;
    }
    option{background:var(--elevated);color:var(--t1)}

    /* SECURITY TOGGLE */
    .sec-tog{display:grid;grid-template-columns:1fr 1fr;gap:14px}
    .sec-opt{
      display:flex;flex-direction:column;gap:5px;
      padding:14px 16px;border:1px solid var(--bdr2);
      border-radius:var(--r-l);background:var(--elevated);
      cursor:pointer;text-align:left;transition:all .2s;font-family:var(--fn);
      position:relative;overflow:hidden;
    }
    .sec-opt::before{
      content:'';position:absolute;inset:0;opacity:0;
      background:linear-gradient(135deg,rgba(99,102,241,.08),rgba(34,211,238,.04));
      transition:opacity .2s;
    }
    .sec-opt:hover{border-color:var(--bdr3)}
    .sec-opt:hover::before{opacity:1}
    .sec-opt.act{border-color:rgba(99,102,241,.5);background:var(--ind-s)}
    .sec-opt.act::before{opacity:1}
    .sec-opt-name{
      font-size:13px;font-weight:700;letter-spacing:.3px;
      text-transform:uppercase;color:var(--t2);
    }
    .sec-opt.act .sec-opt-name{color:var(--ind-l)}
    .sec-opt-desc{font-size:12px;color:var(--t4);line-height:1.5}
    .sec-opt-icon{font-size:18px;margin-bottom:4px}
  `;


  const CSS3 = `
    /* FILTER BAR */
    .fbar{display:grid;grid-template-columns:2fr 1fr 1fr;gap:12px;margin-bottom:22px}
    @media(max-width:600px){.fbar{grid-template-columns:1fr}}
    .fbar-icon-wrap{position:relative}
    .fbar-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--t4);font-size:14px;pointer-events:none}
    .fbar .finput{padding-left:36px}

    /* QUESTION CARDS */
    .qcard{
      display:flex;align-items:flex-start;gap:14px;
      padding:16px 18px;border:1px solid var(--bdr1);
      border-radius:var(--r-l);background:var(--elevated);
      margin-bottom:10px;cursor:pointer;
      transition:border-color .18s,background .18s,transform .15s,box-shadow .18s;
      position:relative;overflow:hidden;
    }
    .qcard::before{
      content:'';position:absolute;left:0;top:0;bottom:0;width:3px;
      background:linear-gradient(180deg,var(--ind),var(--cyan));
      opacity:0;transition:opacity .2s;border-radius:0 2px 2px 0;
    }
    .qcard:hover{border-color:var(--bdr3);background:var(--card);transform:translateY(-1px);box-shadow:0 4px 16px rgba(0,0,0,.4)}
    .qcard.sel{border-color:rgba(99,102,241,.45);background:rgba(99,102,241,.06)}
    .qcard.sel::before{opacity:1}

    .qchk{
      width:20px;height:20px;border-radius:6px;flex-shrink:0;
      border:2px solid var(--bdr3);background:var(--card);
      display:grid;place-content:center;transition:all .18s;margin-top:1px;
    }
    .qcard.sel .qchk{background:var(--ind);border-color:var(--ind);box-shadow:0 0 8px var(--ind-g)}
    .qchk-tick{
      width:10px;height:10px;
      clip-path:polygon(14% 44%,0 65%,50% 100%,100% 16%,80% 0%,43% 62%);
      background:white;opacity:0;transition:opacity .18s;
    }
    .qcard.sel .qchk-tick{opacity:1}

    .qinfo{flex:1}
    .qtitle{font-size:14px;font-weight:600;color:var(--t1);margin-bottom:9px;line-height:1.4}
    .qmeta{display:flex;gap:7px;flex-wrap:wrap}

    /* BADGES */
    .badge{
      display:inline-flex;align-items:center;gap:4px;
      padding:3px 10px;border-radius:20px;
      font-size:10px;font-weight:700;font-family:var(--mo);
      text-transform:uppercase;letter-spacing:.4px;
      border:1px solid transparent;
    }

    /* SIDEBAR */
    .sticky-side{position:sticky;top:24px}
    .sidebar-card{
      background:var(--card);border:1px solid var(--bdr2);
      border-radius:var(--r-xl);padding:24px;
      box-shadow:0 2px 16px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.04);
    }
    .s-head{
      display:flex;align-items:center;justify-content:space-between;
      margin-bottom:18px;padding-bottom:16px;
      border-bottom:1px solid var(--bdr1);
    }
    .s-head-title{font-size:14px;font-weight:700;color:var(--t1)}
    .s-count{
      padding:3px 10px;border-radius:20px;
      background:var(--ind-s);border:1px solid rgba(99,102,241,.28);
      color:var(--ind-l);font-size:12px;font-weight:700;font-family:var(--mo);
    }

    .diff-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px}

    .sel-list{max-height:320px;overflow-y:auto;padding-right:6px;margin-bottom:20px}
    .sel-list::-webkit-scrollbar{width:4px}
    .sel-list::-webkit-scrollbar-track{background:transparent}
    .sel-list::-webkit-scrollbar-thumb{background:var(--bdr3);border-radius:4px}

    .sel-item{
      display:flex;align-items:center;gap:10px;
      padding:10px 12px;background:var(--elevated);
      border:1px solid var(--bdr1);border-radius:var(--r-m);
      margin-bottom:8px;font-size:13px;
      transition:border-color .18s;
    }
    .sel-item:hover{border-color:var(--bdr3)}
    .sel-title{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--t2)}
    .sel-remove{
      background:none;border:none;color:var(--t4);cursor:pointer;
      font-size:18px;line-height:1;padding:2px 4px;border-radius:4px;
      transition:all .18s;flex-shrink:0;
    }
    .sel-remove:hover{color:var(--red);background:var(--red-s)}

    /* SUMMARY */
    .summary{
      background:var(--elevated);border:1px solid var(--bdr2);
      border-radius:var(--r-l);overflow:hidden;margin-bottom:20px;
    }
    .sum-row{
      display:flex;align-items:center;justify-content:space-between;
      padding:13px 16px;font-size:13px;
    }
    .sum-row+.sum-row{border-top:1px solid var(--bdr1)}
    .sum-lbl{color:var(--t4);font-weight:500}
    .sum-val{color:var(--t1);font-weight:700;font-family:var(--mo);font-size:13px}

    /* SUBMIT */
    .submit-btn{
      width:100%;display:flex;justify-content:center;align-items:center;gap:8px;
      padding:15px;
      background:linear-gradient(135deg,#6366f1 0%,#818cf8 100%);
      color:white;border:none;border-radius:var(--r-l);
      font-family:var(--fn);font-size:14px;font-weight:700;letter-spacing:.2px;
      cursor:pointer;transition:all .2s;
      box-shadow:0 4px 16px rgba(99,102,241,.3);
    }
    .submit-btn:hover:not(:disabled){
      background:linear-gradient(135deg,#818cf8 0%,#a5b4fc 100%);
      box-shadow:0 6px 24px rgba(99,102,241,.5);transform:translateY(-1px);
    }
    .submit-btn:disabled{opacity:.45;cursor:not-allowed;transform:none}

    /* ALERT */
    .alert-err{
      background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.25);
      color:var(--red);padding:12px 16px;border-radius:var(--r-m);
      font-size:13px;font-weight:500;margin-bottom:18px;
      display:flex;align-items:center;gap:8px;
    }

    /* EMPTY / LOADING */
    .empty{
      text-align:center;padding:48px 20px;color:var(--t5);
      font-size:13px;
    }
    .empty-icon{font-size:36px;margin-bottom:10px;display:block;opacity:.5}

    /* LOADING SKELETON */
    .skeleton-q{
      height:72px;border-radius:var(--r-l);
      background:linear-gradient(90deg,var(--elevated) 25%,var(--card) 50%,var(--elevated) 75%);
      background-size:200% 100%;
      animation:shimmer 1.6s infinite;margin-bottom:10px;
    }
    @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
  `;


  return (
    <>
      <style>{CSS + CSS2 + CSS3}</style>
      <AdminNavbar />

      <div className="pg">

        {/* Top bar */}
        <div className="topbar">
          <div className="topbar-in">
            <div className="crumb">
              <Link href="/admin" className="crumb-a">Admin</Link>
              <span className="crumb-sep">›</span>
              <Link href="/admin/coding-tests" className="crumb-a">Coding Tests</Link>
              <span className="crumb-sep">›</span>
              <span className="crumb-cur">Create Assessment</span>
            </div>
            <Link href="/admin/coding-question-bank" target="_blank" rel="noopener noreferrer" className="qbank-btn">
              🧩 Question Bank ↗
            </Link>
          </div>
        </div>

        {/* Hero */}
        <div className="hero">
          <div className="hero-pill">
            <span className="hero-dot" />
            New Coding Assessment
          </div>
          <h1 className="hero-h1">Create Coding Assessment</h1>
          <p className="hero-sub">Build a timed coding challenge by selecting questions from the question bank.</p>
        </div>

        {/* Main layout */}
        <div className="wrap">
          <form onSubmit={handleSubmit} className="grid">

            {/* ── Left Column ── */}
            <div>

              {/* Details Card */}
              <div className="card">
                <div className="sec-label">
                  <span className="sec-label-num">1</span>
                  Assessment Details
                  <span className="sec-divider" />
                </div>

                <div className="frow">
                  <div className="fg">
                    <label className="flbl">Title *</label>
                    <input
                      type="text"
                      className="finput"
                      placeholder="e.g., Java Coding Round"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="fg">
                    <label className="flbl">Duration (Minutes) *</label>
                    <input
                      type="number"
                      className="finput"
                      placeholder="60"
                      value={duration}
                      onChange={e => setDuration(e.target.value ? Number(e.target.value) : '')}
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div className="fg">
                  <label className="flbl">Security Level</label>
                  <div className="sec-tog">
                    <button type="button" className={`sec-opt ${securityLevel === 'BASIC' ? 'act' : ''}`} onClick={() => setSecurityLevel('BASIC')}>
                      <span className="sec-opt-icon">🔓</span>
                      <span className="sec-opt-name">Basic</span>
                      <span className="sec-opt-desc">Standard test environment</span>
                    </button>
                    <button type="button" className={`sec-opt ${securityLevel === 'PRO' ? 'act' : ''}`} onClick={() => setSecurityLevel('PRO')}>
                      <span className="sec-opt-icon">🛡️</span>
                      <span className="sec-opt-name">Pro</span>
                      <span className="sec-opt-desc">Enhanced proctoring &amp; lockdown</span>
                    </button>
                  </div>
                </div>

                <div className="fg" style={{ marginBottom: 0 }}>
                  <label className="flbl">Description</label>
                  <textarea
                    className="ftxt"
                    placeholder="Brief details about this assessment..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                </div>
              </div>


              {/* Questions Card */}
              <div className="card">
                <div className="sec-label">
                  <span className="sec-label-num">2</span>
                  Select Questions
                  <span className="sec-divider" />
                </div>

                {/* Filter Bar */}
                <div className="fbar">
                  <div className="fbar-icon-wrap">
                    <span className="fbar-icon">🔍</span>
                    <input
                      type="text"
                      className="finput"
                      placeholder="Search questions..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <select
                    className="fsel"
                    value={filterCategory}
                    onChange={e => setFilterCategory(e.target.value)}
                  >
                    <option value="">All Categories</option>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                  <select
                    className="fsel"
                    value={filterDifficulty}
                    onChange={e => setFilterDifficulty(e.target.value)}
                  >
                    <option value="">All Difficulties</option>
                    {difficulties.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                {/* Question list */}
                {loading ? (
                  <div>
                    {[1,2,3,4,5].map(i => <div key={i} className="skeleton-q" />)}
                  </div>
                ) : filteredQuestions.length === 0 ? (
                  <div className="empty">
                    <span className="empty-icon">🔎</span>
                    No questions match your filters.
                  </div>
                ) : (
                  <div>
                    {filteredQuestions.map(q => {
                      const isSelected = selectedIds.includes(q.id);
                      const ds = diffStyle(q.difficulty);
                      return (
                        <div
                          key={q.id}
                          className={`qcard ${isSelected ? 'sel' : ''}`}
                          onClick={() => toggleQuestion(q.id)}
                        >
                          <div className="qchk">
                            <div className="qchk-tick" />
                          </div>
                          <div className="qinfo">
                            <div className="qtitle">{q.title}</div>
                            <div className="qmeta">
                              <span className="badge" style={{ background: ds.bg, color: ds.color, borderColor: ds.border }}>
                                {q.difficulty}
                              </span>
                              {q.category && (
                                <span className="badge" style={{ background: 'rgba(129,140,248,0.1)', color: '#818cf8', borderColor: 'rgba(129,140,248,0.22)' }}>
                                  {q.category}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>


            {/* ── Sidebar ── */}
            <div className="sticky-side">
              <div className="sidebar-card">

                <div className="s-head">
                  <span className="s-head-title">Selected Questions</span>
                  <span className="s-count">{selectedStats.total}</span>
                </div>

                <div className="diff-row">
                  <span className="badge" style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80', borderColor: 'rgba(74,222,128,0.22)' }}>
                    ✓ Easy {selectedStats.easy}
                  </span>
                  <span className="badge" style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24', borderColor: 'rgba(251,191,36,0.22)' }}>
                    ◈ Medium {selectedStats.medium}
                  </span>
                  <span className="badge" style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', borderColor: 'rgba(248,113,113,0.22)' }}>
                    ✕ Hard {selectedStats.hard}
                  </span>
                </div>

                {error && (
                  <div className="alert-err">
                    <span>⚠️</span> {error}
                  </div>
                )}

                {selectedIds.length === 0 ? (
                  <div className="empty" style={{ padding: '24px 0' }}>
                    <span className="empty-icon">📋</span>
                    No questions selected yet.
                  </div>
                ) : (
                  <div className="sel-list">
                    {selectedIds.map(id => {
                      const q = questions.find(x => x.id === id);
                      if (!q) return null;
                      return (
                        <div key={q.id} className="sel-item">
                          <span style={{ fontSize: 15, flexShrink: 0 }}>💻</span>
                          <span className="sel-title">{q.title}</span>
                          <button
                            type="button"
                            className="sel-remove"
                            onClick={() => toggleQuestion(q.id)}
                            title="Remove"
                          >×</button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="summary">
                  <div className="sum-row">
                    <span className="sum-lbl">Duration</span>
                    <span className="sum-val">{duration ? `${duration} min` : '—'}</span>
                  </div>
                  <div className="sum-row">
                    <span className="sum-lbl">Security</span>
                    <span className="sum-val">{securityLevel}</span>
                  </div>
                  <div className="sum-row">
                    <span className="sum-lbl">Questions</span>
                    <span className="sum-val">{selectedIds.length}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="submit-btn"
                  disabled={submitting || selectedIds.length === 0}
                >
                  {submitting ? (
                    <>⏳ Creating...</>
                  ) : (
                    <>🚀 Create Assessment</>
                  )}
                </button>

              </div>
            </div>

          </form>
        </div>
      </div>
    </>
  );
}
