'use client';

import { useEffect, useMemo, useState } from 'react';
import CandidateFooter from '@/components/candidate/Footer';
import Link from 'next/link';
import Navbar, { Icon } from '@/components/Navbar';
import { API_BASE_URL } from '@/lib/api';

interface PracticeTest {
  id: string;
  title: string;
  duration: number;
  questions?: unknown[];
  category?: string;
}

type SortKey = 'default' | 'duration' | 'questions';

function getDifficulty(duration: number) {
  if (duration <= 20) return { label: 'Quick', tone: 'green' };
  if (duration <= 45) return { label: 'Medium', tone: 'amber' };
  return { label: 'In-depth', tone: 'rose' };
}

const TILE_TONES = ['indigo', 'lime', 'amber', 'sky'];

export default function PracticePage() {
  const [tests, setTests] = useState<PracticeTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('default');

  useEffect(() => {
    fetch(`${API_BASE_URL}/tests/practice`)
      .then(res => res.json())
      .then(data => setTests(Array.isArray(data) ? data : []))
      .catch(e => { console.error(e); setError('Could not load practice tests. Refresh the page to try again.'); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = tests.filter(t => t.title?.toLowerCase().includes(search.toLowerCase()));
    if (sort === 'duration') list = [...list].sort((a, b) => a.duration - b.duration);
    if (sort === 'questions') list = [...list].sort((a, b) => (b.questions?.length ?? 0) - (a.questions?.length ?? 0));
    return list;
  }, [tests, search, sort]);

  const totalQuestions = tests.reduce((s, t) => s + (t.questions?.length ?? 0), 0);
  const avgDuration = tests.length ? Math.round(tests.reduce((s, t) => s + (t.duration ?? 0), 0) / tests.length) : 0;
  const quickest = [...tests].sort((a, b) => a.duration - b.duration)[0];

  return (
    <div className="bx">
      <Navbar />
      <main className="wrap">
        <div className="head fade">
          <div>
            <h1>Practice</h1>
            <p>Real questions, no stakes. Practise as often as you like; it doesn’t affect your assigned tests.</p>
          </div>
        </div>

        <div className="grid fade pr-top">
          <div className="tile dark pr-hero">
            <div className="lbl"><Icon name="bolt" size={15} />Quick start</div>
            {quickest ? (
              <>
                <div>
                  <h2 className="pr-hero-title">{quickest.title}</h2>
                  <p className="sub">The shortest test available: {quickest.duration} min, {quickest.questions?.length ?? 0} questions.</p>
                </div>
                <Link href={`/tests/${quickest.id}`} className="btn lime" style={{ alignSelf: 'flex-start' }}>
                  Start now<Icon name="arrow" size={16} />
                </Link>
              </>
            ) : (
              <p className="sub">{loading ? 'Loading practice tests…' : 'No practice tests are available yet.'}</p>
            )}
          </div>
          <div className="tile indigo">
            <div className="lbl"><Icon name="clip" size={15} />Available</div>
            <div className="num">{loading ? '–' : tests.length}</div>
            <div className="sub">practice tests</div>
          </div>
          <div className="tile lime">
            <div className="lbl"><Icon name="target" size={15} />Questions</div>
            <div className="num">{loading ? '–' : totalQuestions}</div>
            <div className="sub">to work through</div>
          </div>
          <div className="tile amber">
            <div className="lbl"><Icon name="clock" size={15} />Average length</div>
            <div className="num">{loading ? '–' : avgDuration}<small>min</small></div>
            <div className="sub">per test</div>
          </div>
        </div>

        {error && <div className="alert" role="alert" style={{ marginTop: 12 }}>{error}</div>}

        <div className="tile line fade" style={{ marginTop: 12 }}>
          <div className="tile-h" style={{ flexWrap: 'wrap' }}>
            <h2>All practice tests</h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--dim)', display: 'flex' }}>
                  <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden><circle cx="9" cy="9" r="5.5" /><path d="M13.5 13.5L17 17" /></svg>
                </span>
                <input className="input" style={{ paddingLeft: 34, borderRadius: 99, width: 240 }} placeholder="Search tests" value={search} onChange={e => setSearch(e.target.value)} aria-label="Search practice tests" />
              </div>
              <div className="seg" role="tablist" aria-label="Sort">
                {([['default', 'Default'], ['duration', 'Shortest'], ['questions', 'Most questions']] as [SortKey, string][]).map(([k, l]) => (
                  <button key={k} role="tab" aria-selected={sort === k} className={sort === k ? 'on' : ''} onClick={() => setSort(k)}>{l}</button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="loading" style={{ minHeight: 200 }}><span className="spin" />Loading practice tests…</div>
          ) : filtered.length === 0 ? (
            <div className="empty">
              <span className="ico amber"><Icon name="bolt" size={22} /></span>
              <b>{tests.length === 0 ? 'No practice tests yet' : 'No tests match your search'}</b>
              {tests.length === 0 ? 'Check back soon; new practice sets are added regularly.' : 'Try a different word.'}
            </div>
          ) : (
            <div className="grid pr-cards">
              {filtered.map((test, i) => {
                const diff = getDifficulty(test.duration);
                const tone = TILE_TONES[i % TILE_TONES.length];
                return (
                  <Link key={test.id} href={`/tests/${test.id}`} className="tile pr-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span className={`ico ${tone}`}><Icon name="list" /></span>
                      <span className={`chip ${diff.tone}`}>{diff.label}</span>
                    </div>
                    <h3 className="pr-title">{test.title}</h3>
                    <div className="chips" style={{ margin: '10px 0 16px' }}>
                      <span className="chip"><Icon name="clock" size={12} />{test.duration} min</span>
                      <span className="chip"><Icon name="target" size={12} />{test.questions?.length ?? 0} questions</span>
                    </div>
                    <span className="btn dark block">Start practice<Icon name="arrow" size={16} /></span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <CandidateFooter />

      <style>{`
        .bx .pr-top{grid-template-columns:minmax(0,2fr) repeat(3,minmax(0,1fr))}
        .bx .pr-hero{display:flex;flex-direction:column;justify-content:space-between;gap:14px;min-height:170px}
        .bx .pr-hero-title{font-size:22px;font-weight:600;letter-spacing:-.02em;margin:8px 0 4px}
        .bx .pr-cards{grid-template-columns:repeat(auto-fill,minmax(250px,1fr))}
        .bx .pr-card{background:var(--bg);display:flex;flex-direction:column;transition:transform .15s,box-shadow .15s}
        .bx .pr-card:hover{transform:translateY(-2px);box-shadow:0 14px 30px -18px var(--shadow)}
        .bx .pr-card .btn{margin-top:auto}
        .bx .pr-title{font-size:16px;font-weight:600;letter-spacing:-.01em;margin:14px 0 0}
        @media (max-width:1000px){.bx .pr-top{grid-template-columns:repeat(3,minmax(0,1fr))}.bx .pr-hero{grid-column:1/-1}}
        @media (max-width:560px){.bx .pr-top{grid-template-columns:1fr 1fr}.bx .tile-h .input{width:100% !important}}
      `}</style>
    </div>
  );
}
