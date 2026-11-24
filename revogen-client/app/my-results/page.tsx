'use client';

import { getToken } from '@/lib/auth';
import CandidateFooter from '@/components/candidate/Footer';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Navbar, { Icon } from '@/components/Navbar';
import { API_BASE_URL } from '@/lib/api';

interface Attempt {
  id: string;
  score?: number;
  totalQuestions?: number;
  percentage?: number | string | null;
  createdAt?: string;
  test?: { title?: string; isPractice?: boolean };
}

type FilterType = 'all' | 'practice' | 'assigned';

const scoreTone = (pct: number) => (pct >= 75 ? 'var(--green)' : pct >= 50 ? 'var(--amber)' : 'var(--rose)');

function MiniRing({ pct }: { pct: number }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  return (
    <div className="bx-ring" style={{ width: 48, height: 48 }}>
      <svg width="48" height="48" aria-hidden>
        <circle cx="24" cy="24" r={r} fill="none" stroke="var(--bg)" strokeWidth="5" />
        <circle cx="24" cy="24" r={r} fill="none" stroke={scoreTone(pct)} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} />
      </svg>
      <b style={{ fontSize: 12.5 }}>{Math.round(pct)}%</b>
    </div>
  );
}

export default function MyResultsPage() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    const load = async () => {
      try {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/tests/my-attempts`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setAttempts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError('Could not load your results. Refresh the page to try again.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const stats = useMemo(() => {
    const practice = attempts.filter(a => a.test?.isPractice).length;
    return { total: attempts.length, practice, assigned: attempts.length - practice };
  }, [attempts]);

  // Practice scores, oldest → newest, for the trend chart.
  const practiceScores = useMemo(() => attempts
    .filter(a => a.test?.isPractice && a.percentage != null)
    .sort((a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime())
    .map(a => Number(a.percentage)), [attempts]);

  const avgScore = practiceScores.length ? practiceScores.reduce((s, p) => s + p, 0) / practiceScores.length : null;
  const best = practiceScores.length ? Math.max(...practiceScores) : null;
  const recent = practiceScores.slice(-10);

  const filtered = useMemo(() => attempts.filter(a => {
    const matchSearch = (a.test?.title ?? '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || (filter === 'practice' ? a.test?.isPractice : !a.test?.isPractice);
    return matchSearch && matchFilter;
  }), [attempts, search, filter]);

  return (
    <div className="bx">
      <Navbar />
      <main className="wrap">
        <div className="head fade">
          <div>
            <h1>Results</h1>
            <p>Every test you’ve taken. Practice scores are shown straight away; assigned tests are reviewed by the recruiter.</p>
          </div>
        </div>

        <div className="grid fade rs-top">
          <div className="tile dark">
            <div className="lbl"><Icon name="clip" size={15} />Tests taken</div>
            <div className="num">{loading ? '–' : stats.total}</div>
            <div className="sub">{stats.practice} practice · {stats.assigned} assigned</div>
          </div>
          <div className="tile indigo">
            <div className="lbl"><Icon name="chart" size={15} />Average practice score</div>
            <div className="num">{avgScore === null ? '–' : avgScore.toFixed(0)}{avgScore !== null && <small>%</small>}</div>
            <div className="sub">{practiceScores.length ? `across ${practiceScores.length} practice test${practiceScores.length === 1 ? '' : 's'}` : 'take a practice test to see this'}</div>
          </div>
          <div className="tile lime">
            <div className="lbl"><Icon name="trophy" size={15} />Best score</div>
            <div className="num">{best === null ? '–' : Math.round(best)}{best !== null && <small>%</small>}</div>
            <div className="sub">personal best in practice</div>
          </div>
          <div className="tile line rs-trend">
            <div className="lbl"><Icon name="bolt" size={15} />Recent practice scores</div>
            {recent.length >= 2 ? (
              <>
                <div className="spark" style={{ height: 64, marginTop: 14 }} aria-label={`Last ${recent.length} practice scores: ${recent.map(Math.round).join(', ')} percent`}>
                  {recent.map((p, i) => (
                    <i key={i} className={i === recent.length - 1 ? 'hi' : ''} style={{ height: `${Math.max(6, p)}%`, background: scoreTone(p) }} title={`${Math.round(p)}%`} />
                  ))}
                </div>
                <div className="t2" style={{ marginTop: 8 }}>
                  Latest {Math.round(recent[recent.length - 1])}%
                  {recent.length >= 2 && (() => {
                    const d = Math.round(recent[recent.length - 1] - recent[recent.length - 2]);
                    return d === 0 ? ' · same as last time' : ` · ${d > 0 ? '+' : ''}${d} vs last time`;
                  })()}
                </div>
              </>
            ) : (
              <p className="t2" style={{ marginTop: 14 }}>Take two or more practice tests to see your trend here.</p>
            )}
          </div>
        </div>

        {error && <div className="alert" role="alert" style={{ marginTop: 12 }}>{error}</div>}

        <div className="tile line fade" style={{ marginTop: 12 }}>
          <div className="tile-h" style={{ flexWrap: 'wrap' }}>
            <h2>All results <span className="t2" style={{ fontWeight: 400 }}>· {filtered.length}</span></h2>
            {!loading && attempts.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input className="input" style={{ borderRadius: 99, width: 220 }} placeholder="Search by test name" value={search} onChange={e => setSearch(e.target.value)} aria-label="Search results" />
                <div className="seg" role="tablist" aria-label="Filter results">
                  {([['all', 'All'], ['practice', 'Practice'], ['assigned', 'Assigned']] as [FilterType, string][]).map(([k, l]) => (
                    <button key={k} role="tab" aria-selected={filter === k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>{l}</button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {loading ? (
            <div className="loading" style={{ minHeight: 200 }}><span className="spin" />Loading your results…</div>
          ) : attempts.length === 0 ? (
            <div className="empty">
              <span className="ico lime"><Icon name="trophy" size={22} /></span>
              <b>No results yet</b>
              Finish a practice test or an assigned test and it will appear here.
              <div style={{ marginTop: 16 }}><Link href="/practice" className="btn dark">Browse practice tests<Icon name="arrow" size={16} /></Link></div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty"><b>Nothing matches</b>Try a different search or filter.</div>
          ) : (
            <div className="rows">
              {filtered.map(attempt => {
                const isPractice = !!attempt.test?.isPractice;
                const pct = attempt.percentage != null ? Number(attempt.percentage) : null;
                const date = attempt.createdAt
                  ? new Date(attempt.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
                  : null;
                return (
                  <div className="row" key={attempt.id}>
                    <span className={`ico ${isPractice ? 'amber' : 'indigo'}`}><Icon name={isPractice ? 'bolt' : 'clip'} /></span>
                    <div className="grow">
                      <p className="t1">{attempt.test?.title ?? 'Untitled test'}</p>
                      <div className="chips" style={{ marginTop: 5 }}>
                        <span className={`chip ${isPractice ? 'amber' : 'indigo'}`}>{isPractice ? 'Practice' : 'Assigned'}</span>
                        {date && <span className="chip"><Icon name="calendar" size={12} />{date}</span>}
                      </div>
                    </div>
                    {isPractice && pct !== null ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span className="t2 rs-frac">{attempt.score ?? '–'}/{attempt.totalQuestions ?? '–'} correct</span>
                        <MiniRing pct={pct} />
                      </div>
                    ) : (
                      <span className="chip green"><Icon name="check" size={12} />Submitted</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <CandidateFooter />

      <style>{`
        .bx .rs-top{grid-template-columns:repeat(3,minmax(0,1fr)) minmax(0,1.5fr)}
        @media (max-width:1000px){.bx .rs-top{grid-template-columns:repeat(3,minmax(0,1fr))}.bx .rs-trend{grid-column:1/-1}}
        @media (max-width:560px){.bx .rs-top{grid-template-columns:1fr 1fr}.bx .rs-frac{display:none}.bx .tile-h .input{width:100% !important}}
      `}</style>
    </div>
  );
}
