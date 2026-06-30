'use client';
import { API_BASE_URL } from '@/lib/api';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminNavbar from '@/components/AdminNavbar';

// ─── Types ────────────────────────────────────────────────────────────────────
interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

interface CodingQuestion {
  id: string;
  title: string;
  slug: string;
  difficulty: string;
  category: string;
  description: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  starterCodes: Record<string, string>;
  testCases: TestCase[];
}

// ─── Difficulty config ────────────────────────────────────────────────────────
const DIFF: Record<string, { color: string; bg: string; border: string }> = {
  EASY:   { color: '#22c55e', bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.25)'   },
  MEDIUM: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.25)'  },
  HARD:   { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.25)'   },
};
function diffCfg(d: string) { return DIFF[(d ?? '').toUpperCase()] ?? DIFF.EASY; }

// ─── Language label map ───────────────────────────────────────────────────────
const LANG_LABEL: Record<string, string> = {
  python: 'Python', python3: 'Python', javascript: 'JavaScript', typescript: 'TypeScript',
  java: 'Java', cpp: 'C++', 'c++': 'C++', c: 'C', csharp: 'C#', 'c#': 'C#',
  go: 'Go', golang: 'Go', rust: 'Rust', ruby: 'Ruby', php: 'PHP', kotlin: 'Kotlin', swift: 'Swift',
};
const langLabel = (k: string) => LANG_LABEL[k.toLowerCase()] ?? k;

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function QuestionModal({ q, onClose }: { q: CodingQuestion; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'description' | 'testcases' | 'code'>('description');
  const dc = diffCfg(q.difficulty);
  const publicCases = q.testCases?.filter(t => !t.isHidden) ?? [];
  const languages = Object.keys(q.starterCodes ?? {});

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)', overflowY: 'auto', padding: '40px 16px 60px' }}>
      <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, width: '100%', maxWidth: 780, boxShadow: '0 32px 80px rgba(0,0,0,0.7)' }}>

        {/* Header */}
        <div style={{ padding: '22px 28px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, paddingBottom: 18 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                <span style={{ background: dc.bg, color: dc.color, border: `1px solid ${dc.border}`, padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700 }}>{q.difficulty}</span>
                <span style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)', padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>{q.category}</span>
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9', margin: 0, lineHeight: 1.3 }}>{q.title}</h2>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>✕ Close</button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 2 }}>
            {([['description','📄 Description'], ['testcases', `📋 Test Cases (${publicCases.length})`], ['code', `💻 Starter Code (${languages.length})`]] as const).map(([tab, label]) => (
              <button key={tab} onClick={() => setActiveTab(tab as any)} style={{ background: 'transparent', border: 'none', borderBottom: `2px solid ${activeTab === tab ? '#6366f1' : 'transparent'}`, color: activeTab === tab ? '#a5b4fc' : '#64748b', padding: '9px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>{label}</button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '22px 28px', maxHeight: 520, overflowY: 'auto' }}>

          {/* Description Tab */}
          {activeTab === 'description' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <Label text="Problem Statement" />
                <div style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.8 }}>{q.description || '—'}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Section label="Input Format" value={q.inputFormat} />
                <Section label="Output Format" value={q.outputFormat} />
              </div>
              <Section label="Constraints" value={q.constraints} mono />
            </div>
          )}

          {/* Test Cases Tab */}
          {activeTab === 'testcases' && (
            <div>
              {publicCases.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#475569', fontSize: 14 }}>No public test cases.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {publicCases.map((tc, i) => (
                    <div key={tc.id} style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '14px 16px' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', marginBottom: 10 }}>Test Case {i + 1}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <CodeBlock label="Input" value={tc.input} />
                        <CodeBlock label="Expected Output" value={tc.expectedOutput} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Starter Code Tab */}
          {activeTab === 'code' && (
            <div>
              {languages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#475569', fontSize: 14 }}>No starter code available.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {languages.map((lang) => (
                    <div key={lang}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>{langLabel(lang)}</div>
                      <pre style={{ background: '#030712', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '12px 14px', fontFamily: "'JetBrains Mono','Fira Code',monospace", fontSize: 12, color: '#94a3b8', whiteSpace: 'pre-wrap', margin: 0, lineHeight: 1.6, overflowX: 'auto' }}>{q.starterCodes[lang] || '// No starter code'}</pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Label({ text }: { text: string }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{text}</div>;
}
function Section({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <Label text={label} />
      <div style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, padding: '10px 12px', fontFamily: mono ? "'JetBrains Mono',monospace" : 'inherit', fontSize: 13, color: '#94a3b8', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{value || '—'}</div>
    </div>
  );
}
function CodeBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
      <pre style={{ background: '#030712', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 6, padding: '8px 10px', fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: '#a5b4fc', whiteSpace: 'pre-wrap', margin: 0 }}>{value}</pre>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CodingQuestionBankPage() {
  const router = useRouter();
  const [questions, setQuestions]   = useState<CodingQuestion[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [selected, setSelected]     = useState<CodingQuestion | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError]     = useState('');

  // Filters
  const [search, setSearch]         = useState('');
  const [filterDiff, setFilterDiff] = useState('');
  const [filterCat, setFilterCat]   = useState('');

  // ─── Open detail: fetch full question by ID ───────────────────────────────
  const openDetail = async (id: string) => {
    setDetailError('');
    setDetailLoading(true);
    setSelected(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      // Endpoint: GET /coding-question-bank/:id
      const res = await fetch(`${API_BASE_URL}/coding-question-bank/${id}`, {
        headers: { Authorization: `Bearer ${token ?? ''}` },
      });
      if (!res.ok) throw new Error(`Failed to load question details (${res.status})`);
      const data: CodingQuestion = await res.json();
      setSelected(data);
    } catch (e: any) {
      setDetailError(e.message ?? 'Failed to load question details');
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) { router.push('/login'); return; }
    fetch(`${API_BASE_URL}/coding-question-bank`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => { if (!r.ok) throw new Error('Unauthorized'); return r.json(); })
      .then(data => setQuestions(Array.isArray(data) ? data : []))
      .catch(e => setError(e.message ?? 'Failed to load'))
      .finally(() => setLoading(false));
  }, [router]);

  const categories = useMemo(() => Array.from(new Set(questions.map(q => q.category).filter(Boolean))).sort(), [questions]);
  const difficulties = useMemo(() => Array.from(new Set(questions.map(q => (q.difficulty ?? '').toUpperCase()).filter(Boolean))), [questions]);

  const filtered = useMemo(() => questions.filter(q => {
    const matchSearch = !search.trim() || q.title.toLowerCase().includes(search.toLowerCase()) || q.category?.toLowerCase().includes(search.toLowerCase());
    const matchDiff   = !filterDiff || (q.difficulty ?? '').toUpperCase() === filterDiff;
    const matchCat    = !filterCat  || q.category === filterCat;
    return matchSearch && matchDiff && matchCat;
  }), [questions, search, filterDiff, filterCat]);

  const stats = useMemo(() => ({
    total: questions.length,
    easy:   questions.filter(q => (q.difficulty ?? '').toUpperCase() === 'EASY').length,
    medium: questions.filter(q => (q.difficulty ?? '').toUpperCase() === 'MEDIUM').length,
    hard:   questions.filter(q => (q.difficulty ?? '').toUpperCase() === 'HARD').length,
  }), [questions]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #030712; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.25); border-radius: 4px; }
        .qb-card { background: rgba(15,23,42,0.7); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 18px 20px; cursor: pointer; transition: all 0.15s; }
        .qb-card:hover { background: rgba(99,102,241,0.06); border-color: rgba(99,102,241,0.25); transform: translateY(-1px); box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
        .qb-input { background: rgba(15,23,42,0.8); border: 1px solid rgba(255,255,255,0.08); color: #e2e8f0; border-radius: 9px; padding: 9px 14px; font-size: 13px; font-family: 'Inter',sans-serif; width: 100%; outline: none; transition: border-color 0.15s; }
        .qb-input:focus { border-color: rgba(99,102,241,0.45); }
        .qb-select { background: rgba(15,23,42,0.8); border: 1px solid rgba(255,255,255,0.08); color: #e2e8f0; border-radius: 9px; padding: 9px 14px; font-size: 13px; font-family: 'Inter',sans-serif; outline: none; cursor: pointer; transition: border-color 0.15s; }
        .qb-select:focus { border-color: rgba(99,102,241,0.45); }
        .qb-badge { display: inline-flex; align-items: center; padding: 3px 9px; border-radius: 99px; font-size: 11px; font-weight: 700; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to { transform: rotate(360deg); } }
        .qb-card { animation: fadeIn 0.2s ease both; }
      `}</style>

      <AdminNavbar />

      {selected && <QuestionModal q={selected} onClose={() => setSelected(null)} />}

      {/* Detail loading overlay */}
      {detailLoading && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, backdropFilter: 'blur(6px)' }}>
          <div style={{ background: '#0f172a', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 14, padding: '32px 40px', textAlign: 'center' }}>
            <div style={{ width: 36, height: 36, border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
            <p style={{ color: '#94a3b8', fontSize: 14, fontWeight: 500 }}>Loading question details…</p>
          </div>
        </div>
      )}

      {/* Detail fetch error toast */}
      {detailError && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: 'rgba(15,23,42,0.97)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 10, padding: '12px 18px', color: '#f87171', fontSize: 13, fontWeight: 500, zIndex: 999, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
          ⚠ {detailError}
          <button onClick={() => setDetailError('')} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', marginLeft: 10, fontSize: 14, fontWeight: 700 }}>×</button>
        </div>
      )}

      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#030712 0%,#0a0f1e 100%)', fontFamily: "'Inter',sans-serif", color: '#e2e8f0', paddingBottom: 80 }}>
        {/* Ambient glow */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
          <div style={{ position: 'absolute', top: -100, left: '30%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,0.06),transparent 70%)', filter: 'blur(40px)' }} />
        </div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: '36px 24px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🧩</div>
                <div>
                  <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.3px' }}>RevoGen Question Bank</h1>
                  <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Coding questions available for assessments</p>
                </div>
              </div>
            </div>
            <Link href="/admin" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(255,255,255,0.07)', color: '#94a3b8', borderRadius: 9, padding: '8px 16px', fontSize: 13, fontWeight: 500, textDecoration: 'none', transition: 'all 0.15s' }}>← Dashboard</Link>
          </div>

          {/* Stats Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 28 }}>
            {[['Total',stats.total,'#6366f1'],['Easy',stats.easy,'#22c55e'],['Medium',stats.medium,'#f59e0b'],['Hard',stats.hard,'#ef4444']].map(([label,val,color]) => (
              <div key={label as string} style={{ background: 'rgba(15,23,42,0.7)', border: `1px solid ${color as string}20`, borderTop: `3px solid ${color as string}`, borderRadius: 12, padding: '14px 18px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{label as string}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: color as string }}>{val as number}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 10, marginBottom: 24, alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#475569', pointerEvents: 'none' }}>🔍</span>
              <input className="qb-input" style={{ paddingLeft: 36 }} placeholder="Search by title or category…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="qb-select" value={filterDiff} onChange={e => setFilterDiff(e.target.value)}>
              <option value="">All Difficulties</option>
              {difficulties.map(d => <option key={d} value={d}>{d.charAt(0) + d.slice(1).toLowerCase()}</option>)}
            </select>
            <select className="qb-select" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Results count */}
          <div style={{ fontSize: 12, color: '#475569', marginBottom: 16, fontWeight: 500 }}>
            {loading ? 'Loading…' : `Showing ${filtered.length} of ${questions.length} questions`}
            {(search || filterDiff || filterCat) && (
              <button onClick={() => { setSearch(''); setFilterDiff(''); setFilterCat(''); }} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: 12, fontWeight: 600, marginLeft: 10 }}>Clear filters ×</button>
            )}
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '14px 18px', color: '#f87171', fontSize: 14, marginBottom: 20 }}>⚠ {error}</div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 14 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '18px 20px', height: 120 }}>
                  <div style={{ height: 14, width: '60%', background: 'rgba(30,41,59,0.8)', borderRadius: 6, marginBottom: 10 }} />
                  <div style={{ height: 10, width: '35%', background: 'rgba(30,41,59,0.6)', borderRadius: 6, marginBottom: 8 }} />
                  <div style={{ height: 10, width: '50%', background: 'rgba(30,41,59,0.5)', borderRadius: 6 }} />
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>No questions found</h3>
              <p style={{ color: '#475569', fontSize: 14 }}>Try adjusting your filters.</p>
            </div>
          )}

          {/* Question Grid */}
          {!loading && !error && filtered.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 14 }}>
              {filtered.map((q, i) => {
                const dc = diffCfg(q.difficulty);
                const langs = Object.keys(q.starterCodes ?? {});
                const publicCases = q.testCases?.filter(t => !t.isHidden) ?? [];
                return (
                  <div key={q.id} className="qb-card" style={{ animationDelay: `${Math.min(i, 12) * 0.04}s` }} onClick={() => openDetail(q.id)}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', lineHeight: 1.4, flex: 1 }}>{q.title}</h3>
                      <span className="qb-badge" style={{ background: dc.bg, color: dc.color, border: `1px solid ${dc.border}`, flexShrink: 0 }}>{q.difficulty}</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                      {q.category && <span className="qb-badge" style={{ background: 'rgba(99,102,241,0.08)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.18)' }}>{q.category}</span>}
                      {langs.slice(0, 4).map(l => <span key={l} className="qb-badge" style={{ background: 'rgba(30,41,59,0.8)', color: '#64748b', border: '1px solid rgba(255,255,255,0.05)', fontSize: 10 }}>{langLabel(l)}</span>)}
                      {langs.length > 4 && <span className="qb-badge" style={{ background: 'rgba(30,41,59,0.6)', color: '#475569', border: '1px solid rgba(255,255,255,0.04)', fontSize: 10 }}>+{langs.length - 4}</span>}
                    </div>
                    <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 12 }}>{q.description || 'No description.'}</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: '#475569' }}>📋 {publicCases.length} public test case{publicCases.length !== 1 ? 's' : ''}</span>
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
