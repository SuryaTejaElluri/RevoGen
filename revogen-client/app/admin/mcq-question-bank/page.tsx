'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import AdminNavbar from '@/components/AdminNavbar';
import { API_BASE_URL } from '@/lib/api';

interface MCQQuestion {
  id: string;
  category: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  createdAt: string;
}

const OPTIONS = ['A', 'B', 'C', 'D'] as const;
function getOption(q: MCQQuestion, l: string) {
  return l === 'A' ? q.optionA : l === 'B' ? q.optionB : l === 'C' ? q.optionC : q.optionD;
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function QuestionModal({ q, onClose }: { q: MCQQuestion; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)', padding: '24px 16px' }}>
      <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, width: '100%', maxWidth: 620, boxShadow: '0 32px 80px rgba(0,0,0,0.7)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div>
            <span style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)', padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, display: 'inline-block', marginBottom: 10 }}>{q.category}</span>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', lineHeight: 1.6, margin: 0 }}>{q.question}</p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>✕</button>
        </div>

        {/* Options */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {OPTIONS.map(letter => {
            const text = getOption(q, letter);
            const isCorrect = q.correctAnswer === text;
            return (
              <div key={letter} style={{
                display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 16px',
                borderRadius: 10, border: `1px solid ${isCorrect ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.06)'}`,
                background: isCorrect ? 'rgba(34,197,94,0.07)' : 'rgba(15,23,42,0.6)',
              }}>
                <span style={{
                  width: 26, height: 26, minWidth: 26, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, fontFamily: 'monospace', flexShrink: 0,
                  background: isCorrect ? 'rgba(34,197,94,0.15)' : 'rgba(30,41,59,0.8)',
                  border: `1px solid ${isCorrect ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.08)'}`,
                  color: isCorrect ? '#4ade80' : '#64748b',
                }}>{letter}</span>
                <span style={{ fontSize: 14, color: isCorrect ? '#4ade80' : '#94a3b8', lineHeight: 1.55, fontWeight: isCorrect ? 600 : 400 }}>{text}</span>
                {isCorrect && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#22c55e', fontWeight: 700, flexShrink: 0 }}>✓ Correct</span>}
              </div>
            );
          })}
        </div>

        <div style={{ padding: '0 24px 20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', borderRadius: 9, padding: '9px 20px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MCQQuestionBankPage() {
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [selected, setSelected]   = useState<MCQQuestion | null>(null);

  // Filters
  const [search, setSearch]   = useState('');
  const [filterCat, setFilterCat] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    fetch(`${API_BASE_URL}/question-bank`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => { if (!r.ok) throw new Error('Failed to load'); return r.json(); })
      .then(data => setQuestions(Array.isArray(data) ? data : []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() =>
    Array.from(new Set(questions.map(q => q.category).filter(Boolean))).sort(),
    [questions]
  );

  const filtered = useMemo(() => questions.filter(q => {
    const s = search.trim().toLowerCase();
    const matchSearch = !s || q.question.toLowerCase().includes(s) || q.category.toLowerCase().includes(s);
    const matchCat    = !filterCat || q.category === filterCat;
    return matchSearch && matchCat;
  }), [questions, search, filterCat]);

  const stats = useMemo(() => {
    const byCategory: Record<string, number> = {};
    questions.forEach(q => { byCategory[q.category] = (byCategory[q.category] ?? 0) + 1; });
    return { total: questions.length, byCategory };
  }, [questions]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #030712; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.25); border-radius: 4px; }
        .qb-input { background: rgba(15,23,42,0.8); border: 1px solid rgba(255,255,255,0.08); color: #e2e8f0; border-radius: 9px; padding: 9px 14px; font-size: 13px; font-family: 'Inter',sans-serif; width: 100%; outline: none; transition: border-color 0.15s; }
        .qb-input:focus { border-color: rgba(99,102,241,0.45); box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
        .qb-select { background: rgba(15,23,42,0.8); border: 1px solid rgba(255,255,255,0.08); color: #e2e8f0; border-radius: 9px; padding: 9px 14px; font-size: 13px; font-family: 'Inter',sans-serif; outline: none; cursor: pointer; transition: border-color 0.15s; }
        .qb-select:focus { border-color: rgba(99,102,241,0.45); }
        .qb-card { background: rgba(15,23,42,0.7); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; padding: 18px 20px; cursor: pointer; transition: all 0.15s; position: relative; overflow: hidden; }
        .qb-card::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: linear-gradient(180deg,#6366f1,#a78bfa); opacity: 0.8; }
        .qb-card:hover { background: rgba(99,102,241,0.06); border-color: rgba(99,102,241,0.28); transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,0,0,0.35); }
        .qb-badge { display: inline-flex; align-items: center; padding: 3px 9px; border-radius: 99px; font-size: 11px; font-weight: 700; }
        .qb-opt { display: flex; align-items: center; gap: 6px; padding: 5px 0; }
        .qb-opt-letter { width: 20px; height: 20px; border-radius: 5px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; font-family: monospace; border: 1px solid rgba(255,255,255,0.08); background: rgba(30,41,59,0.8); color: #64748b; flex-shrink: 0; }
        .qb-opt-text { font-size: 12px; color: #64748b; }
        .qb-opt.correct .qb-opt-letter { background: rgba(34,197,94,0.15); border-color: rgba(34,197,94,0.4); color: #4ade80; }
        .qb-opt.correct .qb-opt-text { color: #4ade80; font-weight: 600; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .qb-card { animation: fadeIn 0.18s ease both; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <AdminNavbar />
      {selected && <QuestionModal q={selected} onClose={() => setSelected(null)} />}

      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#030712 0%,#0a0f1e 100%)', fontFamily: "'Inter',sans-serif", color: '#e2e8f0', paddingBottom: 80 }}>
        {/* Ambient glow */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
          <div style={{ position: 'absolute', top: -100, left: '25%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,0.07),transparent 70%)', filter: 'blur(40px)' }} />
        </div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: '36px 24px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>📝</div>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.3px' }}>MCQ Question Bank</h1>
                <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Browse and inspect all MCQ questions across categories</p>
              </div>
            </div>
            <Link href="/admin/question-bank" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(255,255,255,0.07)', color: '#94a3b8', borderRadius: 9, padding: '8px 16px', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>← Question Bank</Link>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 12, marginBottom: 28 }}>
            <div style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(99,102,241,0.2)', borderTop: '3px solid #6366f1', borderRadius: 12, padding: '14px 18px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Total</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#818cf8' }}>{stats.total}</div>
            </div>
            {Object.entries(stats.byCategory).map(([cat, count]) => (
              <div key={cat} style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.06)', borderTop: '3px solid #a78bfa', borderRadius: 12, padding: '14px 18px', cursor: 'pointer' }}
                onClick={() => setFilterCat(filterCat === cat ? '' : cat)}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: filterCat === cat ? '#a78bfa' : '#94a3b8' }}>{count}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, marginBottom: 16, alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#475569', pointerEvents: 'none' }}>🔍</span>
              <input className="qb-input" style={{ paddingLeft: 36 }} placeholder="Search questions…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="qb-select" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Results count + clear */}
          <div style={{ fontSize: 12, color: '#475569', marginBottom: 20, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 10 }}>
            {loading ? 'Loading…' : `Showing ${filtered.length} of ${questions.length} questions`}
            {(search || filterCat) && (
              <button onClick={() => { setSearch(''); setFilterCat(''); }} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Clear filters ×</button>
            )}
          </div>

          {/* Error */}
          {error && <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '14px 18px', color: '#f87171', fontSize: 14, marginBottom: 20 }}>⚠ {error}</div>}

          {/* Loading */}
          {loading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(360px,1fr))', gap: 12 }}>
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '18px 20px', height: 130 }}>
                  <div style={{ height: 13, width: '70%', background: 'rgba(30,41,59,0.8)', borderRadius: 5, marginBottom: 10 }} />
                  <div style={{ height: 10, width: '40%', background: 'rgba(30,41,59,0.6)', borderRadius: 5, marginBottom: 8 }} />
                  <div style={{ height: 10, width: '55%', background: 'rgba(30,41,59,0.5)', borderRadius: 5 }} />
                </div>
              ))}
            </div>
          )}

          {/* Empty */}
          {!loading && !error && filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '64px 20px' }}>
              <div style={{ fontSize: 38, marginBottom: 12 }}>🔍</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>No questions found</h3>
              <p style={{ color: '#475569', fontSize: 14 }}>Try adjusting your filters or search term.</p>
            </div>
          )}

          {/* Grid */}
          {!loading && !error && filtered.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(360px,1fr))', gap: 12 }}>
              {filtered.map((q, i) => {
                const opts = OPTIONS.map(l => ({ letter: l, text: getOption(q, l), isCorrect: q.correctAnswer === getOption(q, l) }));
                return (
                  <div key={q.id} className="qb-card" style={{ animationDelay: `${Math.min(i, 15) * 0.03}s` }} onClick={() => setSelected(q)}>
                    {/* Category + question */}
                    <div style={{ marginBottom: 12 }}>
                      <span className="qb-badge" style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.18)', marginBottom: 8, display: 'inline-flex' }}>
                        {q.category}
                      </span>
                      <p style={{ fontSize: 13.5, fontWeight: 600, color: '#f1f5f9', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {q.question}
                      </p>
                    </div>

                    {/* Options preview */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 12px', marginBottom: 12 }}>
                      {opts.map(o => (
                        <div key={o.letter} className={`qb-opt${o.isCorrect ? ' correct' : ''}`}>
                          <span className="qb-opt-letter">{o.letter}</span>
                          <span className="qb-opt-text" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130 }}>{o.text}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: 11, color: '#6366f1', fontWeight: 600 }}>View details →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
