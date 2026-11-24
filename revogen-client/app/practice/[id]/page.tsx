'use client';

// Practice MCQ runner: a fresh random paper per attempt (e.g. 20 Java + 10 SQL),
// unlimited retakes, no proctoring, and a full answer review at the end.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Icon } from '@/components/Navbar';
import '@/components/candidate/bento.css';
import { API_BASE_URL } from '@/lib/api';
import { getToken } from '@/lib/auth';

type Letter = 'A' | 'B' | 'C' | 'D';
const LETTERS: Letter[] = ['A', 'B', 'C', 'D'];

interface PaperQuestion { id: string; module: string; question: string; options: Record<Letter, string> }
interface Paper {
  paper: string;
  test: { id: string; title: string; duration: number };
  questions: PaperQuestion[];
  shortfalls: { module: string; requested: number; available: number }[];
}
interface ReviewItem extends PaperQuestion { selected: Letter | null; correct: Letter | null; isCorrect: boolean }
interface Result {
  attemptId: string;
  title: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  answered: number;
  modules: { module: string; correct: number; total: number }[];
  review: ReviewItem[];
}

type Phase = 'loading' | 'error' | 'intro' | 'running' | 'submitting' | 'result';
type ReviewFilter = 'all' | 'wrong' | 'skipped';

const tone = (pct: number) => (pct >= 75 ? 'var(--green)' : pct >= 50 ? 'var(--amber)' : 'var(--rose)');
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.max(0, s % 60)).padStart(2, '0')}`;

async function api<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify(body ?? {}),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) throw new Error('Your session has ended. Please sign in again.');
  if (!res.ok) {
    const msg = Array.isArray(data?.message) ? data.message[0] : data?.message;
    throw new Error(msg || 'Something went wrong. Please try again.');
  }
  return data as T;
}

function Ring({ pct, size = 120 }: { pct: number; size?: number }) {
  const r = size / 2 - 9;
  const c = 2 * Math.PI * r;
  return (
    <div className="bx-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg)" strokeWidth="10" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={tone(pct)} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} style={{ transition: 'stroke-dashoffset .8s ease' }} />
      </svg>
      <b style={{ fontSize: size > 100 ? 28 : 16 }}>{Math.round(pct)}%</b>
    </div>
  );
}

export default function PracticeRunnerPage() {
  const { id } = useParams<{ id: string }>();

  const [phase, setPhase] = useState<Phase>('loading');
  const [error, setError] = useState('');
  const [needsLogin, setNeedsLogin] = useState(false);
  const [paper, setPaper] = useState<Paper | null>(null);
  const [answers, setAnswers] = useState<Record<string, Letter>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [current, setCurrent] = useState(0);
  const [endsAt, setEndsAt] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const [now, setNow] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [timeTaken, setTimeTaken] = useState(0);
  const [timedOut, setTimedOut] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('all');

  // Fetch a new random paper. Called on load and for every retake.
  const loadPaper = useCallback(async () => {
    if (!getToken()) {
      setNeedsLogin(true);
      setPhase('error');
      return;
    }
    setPhase('loading');
    setError('');
    try {
      const p = await api<Paper>(`/tests/${id}/practice/start`, {});
      setPaper(p);
      setAnswers({});
      setFlagged(new Set());
      setCurrent(0);
      setResult(null);
      setTimedOut(false);
      setSubmitError('');
      setReviewFilter('all');
      setPhase('intro');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load this practice test.');
      setPhase('error');
    }
  }, [id]);

  useEffect(() => {
    const t = setTimeout(loadPaper, 0);
    return () => clearTimeout(t);
  }, [loadPaper]);

  const submit = useCallback(async (auto = false) => {
    if (!paper) return;
    setConfirming(false);
    setSubmitError('');
    setPhase('submitting');
    if (auto) setTimedOut(true);
    try {
      const r = await api<Result>(`/tests/${id}/practice/submit`, { paper: paper.paper, answers });
      setTimeTaken(Math.round((Date.now() - startedAt) / 1000));
      setResult(r);
      setPhase('result');
      window.scrollTo({ top: 0 });
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Could not submit. Please try again.');
      setPhase('running');
    }
  }, [answers, id, paper, startedAt]);

  // The timer calls the latest submit without re-creating the interval.
  const submitRef = useRef(submit);
  useEffect(() => { submitRef.current = submit; }, [submit]);

  useEffect(() => {
    if (phase !== 'running' || !endsAt) return;
    const t = setInterval(() => {
      const n = Date.now();
      setNow(n);
      if (n >= endsAt) {
        clearInterval(t);
        submitRef.current(true);
      }
    }, 500);
    return () => clearInterval(t);
  }, [phase, endsAt]);

  // Warn before leaving mid-test.
  useEffect(() => {
    if (phase !== 'running') return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [phase]);

  const begin = () => {
    if (!paper) return;
    const t = Date.now();
    setStartedAt(t);
    setNow(t);
    setEndsAt(t + paper.test.duration * 60_000);
    setPhase('running');
  };

  const questions = useMemo(() => paper?.questions ?? [], [paper]);
  const q = questions[current];
  const answeredCount = Object.keys(answers).length;
  const unanswered = questions.length - answeredCount;
  const left = Math.max(0, Math.ceil((endsAt - now) / 1000));

  const choose = useCallback((letter: Letter) => {
    if (!q) return;
    setAnswers(a => {
      const next = { ...a };
      if (next[q.id] === letter) delete next[q.id]; else next[q.id] = letter;
      return next;
    });
  }, [q]);

  const toggleFlag = () => {
    if (!q) return;
    setFlagged(f => {
      const n = new Set(f);
      if (n.has(q.id)) n.delete(q.id); else n.add(q.id);
      return n;
    });
  };

  // Keyboard: A–D or 1–4 to answer, ←/→ to move.
  useEffect(() => {
    if (phase !== 'running' || confirming) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toUpperCase();
      const idx = ['1', '2', '3', '4'].indexOf(k);
      if (idx >= 0) choose(LETTERS[idx]);
      else if ((LETTERS as string[]).includes(k)) choose(k as Letter);
      else if (e.key === 'ArrowRight') setCurrent(c => Math.min(questions.length - 1, c + 1));
      else if (e.key === 'ArrowLeft') setCurrent(c => Math.max(0, c - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, confirming, choose, questions.length]);

  // Subject mix for the intro, in paper order.
  const mix = useMemo(() => {
    const m = new Map<string, number>();
    questions.forEach(x => m.set(x.module, (m.get(x.module) ?? 0) + 1));
    return [...m.entries()];
  }, [questions]);

  const reviewItems = useMemo(() => (result?.review ?? []).filter(r =>
    reviewFilter === 'all' ? true : reviewFilter === 'wrong' ? r.selected && !r.isCorrect : !r.selected,
  ), [result, reviewFilter]);

  const title = paper?.test.title ?? 'Practice test';

  return (
    <div className="bx pt">
      <header className="pt-bar">
        <div className="pt-bar-in">
          <Link href="/practice" className="pt-back" onClick={e => {
            if (phase === 'running' && !window.confirm('Leave this practice test? Your answers will be lost.')) e.preventDefault();
          }}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 15l-5-5 5-5" /></svg>
            Practice
          </Link>
          <div className="pt-bar-title">{title}</div>
          {phase === 'running' || phase === 'submitting' ? (
            <div className={`pt-timer${left <= 60 ? ' low' : ''}`} aria-live="off" aria-label={`Time left ${fmt(left)}`}>
              <Icon name="clock" size={15} />{fmt(left)}
            </div>
          ) : <span className="chip amber"><Icon name="bolt" size={12} />Practice</span>}
        </div>
      </header>

      <main className="wrap pt-main">
        {phase === 'loading' && (
          <div className="loading" style={{ minHeight: 320 }}><span className="spin" />Building your question paper…</div>
        )}

        {phase === 'error' && (
          <div className="tile line pt-center">
            <span className="ico rose"><Icon name="alert" size={22} /></span>
            {needsLogin ? (
              <>
                <h2>Sign in to practise</h2>
                <p className="t2">Practice is free and unlimited, but you need an account so we can save your scores.</p>
                <div className="pt-actions">
                  <Link href={`/login?redirect=${encodeURIComponent(`/practice/${id}`)}`} className="btn dark">Sign in<Icon name="arrow" size={16} /></Link>
                  <Link href="/register" className="btn">Create account</Link>
                </div>
              </>
            ) : (
              <>
                <h2>Couldn’t start this test</h2>
                <p className="t2">{error}</p>
                <div className="pt-actions">
                  <button className="btn dark" onClick={loadPaper}>Try again</button>
                  <Link href="/practice" className="btn">All practice tests</Link>
                </div>
              </>
            )}
          </div>
        )}

        {phase === 'intro' && paper && (
          <div className="pt-intro fade">
            <div className="tile dark pt-intro-hero">
              <div className="lbl"><Icon name="bolt" size={15} />Practice test</div>
              <h1>{paper.test.title}</h1>
              <p className="sub">A new set of questions is picked for you every time, so retakes stay fresh. Your score is saved to Results.</p>
              <div className="chips" style={{ marginTop: 16 }}>
                <span className="chip on-hero"><Icon name="target" size={12} />{questions.length} questions</span>
                <span className="chip on-hero"><Icon name="clock" size={12} />{paper.test.duration} min</span>
                <span className="chip on-hero"><Icon name="check" size={12} />Unlimited attempts</span>
              </div>
            </div>
            <div className="tile line">
              <div className="tile-h"><h2>What’s in this paper</h2></div>
              <div className="pt-mix">
                {mix.map(([m, n]) => (
                  <div key={m} className="pt-mix-row">
                    <span className="t1">{m}</span>
                    <span className="pt-mix-bar"><i style={{ width: `${(n / questions.length) * 100}%` }} /></span>
                    <span className="t2">{n}</span>
                  </div>
                ))}
              </div>
              {paper.shortfalls.length > 0 && (
                <p className="pt-note">
                  <Icon name="alert" size={14} />
                  Fewer questions than planned right now:{' '}
                  {paper.shortfalls.map(s => `${s.module} ${s.available}/${s.requested}`).join(', ')}.
                </p>
              )}
              <ul className="pt-rules">
                <li>The timer starts when you press Start. When it runs out, your answers are submitted.</li>
                <li>Use <kbd>A</kbd>–<kbd>D</kbd> or <kbd>1</kbd>–<kbd>4</kbd> to answer, and <kbd>←</kbd> <kbd>→</kbd> to move.</li>
                <li>You can flag questions and come back to them before submitting.</li>
              </ul>
              <button className="btn dark block" onClick={begin}>Start test<Icon name="arrow" size={16} /></button>
            </div>
          </div>
        )}

        {(phase === 'running' || phase === 'submitting') && q && (
          <div className="pt-run">
            <section className="tile line pt-q" aria-labelledby="pt-q-text">
              <div className="pt-q-head">
                <span className="chip indigo">{q.module}</span>
                <span className="t2">Question {current + 1} of {questions.length}</span>
                <button className={`btn sm ghost pt-flag${flagged.has(q.id) ? ' on' : ''}`} onClick={toggleFlag} aria-pressed={flagged.has(q.id)}>
                  <svg width="14" height="14" viewBox="0 0 20 20" fill={flagged.has(q.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden><path d="M5 17V3.5h9l-1.8 3.5L14 10.5H5" /></svg>
                  {flagged.has(q.id) ? 'Flagged' : 'Flag'}
                </button>
              </div>
              <h2 id="pt-q-text" className="pt-q-text">{q.question}</h2>
              <div className="pt-opts" role="radiogroup" aria-labelledby="pt-q-text">
                {LETTERS.map(l => (
                  <button key={l} role="radio" aria-checked={answers[q.id] === l}
                    className={`pt-opt${answers[q.id] === l ? ' on' : ''}`} onClick={() => choose(l)} disabled={phase === 'submitting'}>
                    <span className="pt-opt-l">{l}</span>
                    <span className="pt-opt-t">{q.options[l]}</span>
                  </button>
                ))}
              </div>
              <div className="pt-q-foot">
                <button className="btn" onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}>Previous</button>
                {current < questions.length - 1 ? (
                  <button className="btn dark" onClick={() => setCurrent(c => c + 1)}>Next<Icon name="arrow" size={16} /></button>
                ) : (
                  <button className="btn lime" onClick={() => setConfirming(true)} disabled={phase === 'submitting'}>Finish test</button>
                )}
              </div>
            </section>

            <aside className="tile line pt-side">
              <div className="pt-side-stat">
                <div><b>{answeredCount}</b><span className="t2">answered</span></div>
                <div><b>{unanswered}</b><span className="t2">left</span></div>
                <div><b>{flagged.size}</b><span className="t2">flagged</span></div>
              </div>
              <div className="pt-prog"><i style={{ width: `${(answeredCount / questions.length) * 100}%` }} /></div>
              <div className="pt-nav" aria-label="Questions">
                {questions.map((x, i) => (
                  <button key={x.id} onClick={() => setCurrent(i)} aria-label={`Question ${i + 1}${answers[x.id] ? ', answered' : ''}${flagged.has(x.id) ? ', flagged' : ''}`}
                    className={[i === current && 'cur', answers[x.id] && 'done', flagged.has(x.id) && 'flag'].filter(Boolean).join(' ')}>
                    {i + 1}
                  </button>
                ))}
              </div>
              <div className="pt-legend t2">
                <span><i className="done" />Answered</span><span><i className="flag" />Flagged</span><span><i />Not yet</span>
              </div>
              {submitError && <div className="alert" role="alert">{submitError}</div>}
              <button className="btn dark block" onClick={() => setConfirming(true)} disabled={phase === 'submitting'}>
                {phase === 'submitting' ? <><span className="spin" />Submitting…</> : 'Submit test'}
              </button>
            </aside>
          </div>
        )}

        {phase === 'result' && result && (
          <div className="pt-result fade">
            <div className="grid pt-res-top">
              <div className="tile line pt-res-score">
                <Ring pct={result.percentage} />
                <div>
                  <div className="lbl"><Icon name="trophy" size={15} />{timedOut ? 'Time’s up — submitted' : 'Your score'}</div>
                  <h1 className="pt-res-h">{result.score} / {result.totalQuestions} correct</h1>
                  <p className="t2">
                    {result.percentage >= 75 ? 'Strong result. Try a retake to see it hold with new questions.'
                      : result.percentage >= 50 ? 'Good base. Review the misses below, then retake.'
                        : 'Keep going — review the answers below and try again.'}
                  </p>
                  <div className="chips" style={{ marginTop: 10 }}>
                    <span className="chip"><Icon name="check" size={12} />{result.answered} answered</span>
                    <span className="chip"><Icon name="clock" size={12} />{fmt(timeTaken)} taken</span>
                  </div>
                </div>
              </div>
              <div className="tile line">
                <div className="tile-h"><h2>By subject</h2></div>
                <div className="pt-mix">
                  {result.modules.map(m => {
                    const p = m.total ? (m.correct / m.total) * 100 : 0;
                    return (
                      <div key={m.module} className="pt-mix-row">
                        <span className="t1">{m.module}</span>
                        <span className="pt-mix-bar"><i style={{ width: `${p}%`, background: tone(p) }} /></span>
                        <span className="t2">{m.correct}/{m.total}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-actions" style={{ margin: '14px 0' }}>
              <button className="btn dark" onClick={loadPaper}><Icon name="bolt" size={16} />Retake with new questions</button>
              <Link href="/my-results" className="btn"><Icon name="chart" size={16} />All results</Link>
              <Link href="/practice" className="btn ghost">Back to practice</Link>
            </div>

            <div className="tile line">
              <div className="tile-h" style={{ flexWrap: 'wrap' }}>
                <h2>Review answers</h2>
                <div className="seg" role="tablist" aria-label="Filter review">
                  {([
                    ['all', `All ${result.review.length}`],
                    ['wrong', `Wrong ${result.review.filter(r => r.selected && !r.isCorrect).length}`],
                    ['skipped', `Skipped ${result.review.filter(r => !r.selected).length}`],
                  ] as [ReviewFilter, string][]).map(([k, l]) => (
                    <button key={k} role="tab" aria-selected={reviewFilter === k} className={reviewFilter === k ? 'on' : ''} onClick={() => setReviewFilter(k)}>{l}</button>
                  ))}
                </div>
              </div>
              {reviewItems.length === 0 ? (
                <div className="empty"><b>Nothing here</b>{reviewFilter === 'wrong' ? 'No wrong answers — nice.' : 'You answered every question.'}</div>
              ) : (
                <ol className="pt-review">
                  {reviewItems.map(r => {
                    const n = result.review.indexOf(r) + 1;
                    return (
                      <li key={r.id} className="pt-rv">
                        <div className="pt-rv-head">
                          <span className={`chip ${r.isCorrect ? 'green' : r.selected ? 'rose' : ''}`}>
                            <Icon name={r.isCorrect ? 'check' : 'x'} size={12} />{r.isCorrect ? 'Correct' : r.selected ? 'Wrong' : 'Skipped'}
                          </span>
                          <span className="t2">Q{n} · {r.module}</span>
                        </div>
                        <p className="pt-rv-q">{r.question}</p>
                        <div className="pt-rv-opts">
                          {LETTERS.map(l => {
                            const isRight = r.correct === l;
                            const isMine = r.selected === l;
                            return (
                              <div key={l} className={`pt-rv-opt${isRight ? ' right' : ''}${isMine && !isRight ? ' mine' : ''}`}>
                                <span className="pt-opt-l">{l}</span>
                                <span>{r.options[l]}</span>
                                {isRight && <span className="pt-tag">Correct answer</span>}
                                {isMine && <span className="pt-tag">Your answer</span>}
                              </div>
                            );
                          })}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </div>
        )}
      </main>

      {confirming && (
        <div className="pt-modal" role="dialog" aria-modal="true" aria-labelledby="pt-confirm-h" onClick={() => setConfirming(false)}>
          <div className="tile pt-modal-card" onClick={e => e.stopPropagation()}>
            <h2 id="pt-confirm-h">Submit your answers?</h2>
            <p className="t2">
              {unanswered > 0
                ? `You have ${unanswered} unanswered question${unanswered === 1 ? '' : 's'}${flagged.size ? ` and ${flagged.size} flagged` : ''}. Unanswered questions count as wrong.`
                : flagged.size ? `All answered. ${flagged.size} still flagged for review.` : 'All questions answered.'}
            </p>
            <div className="pt-actions" style={{ justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setConfirming(false)} autoFocus>Keep working</button>
              <button className="btn dark" onClick={() => submit(false)}>Submit</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .bx.pt{min-height:100vh;background:var(--bg)}
        .bx .pt-bar{position:sticky;top:0;z-index:20;background:var(--nav-bg);backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}
        .bx .pt-bar-in{max-width:1200px;margin:0 auto;padding:12px 24px;display:flex;align-items:center;gap:16px}
        .bx .pt-back{display:inline-flex;align-items:center;gap:4px;font-size:14px;color:var(--muted)}
        .bx .pt-back:hover{color:var(--ink)}
        .bx .pt-bar-title{flex:1;text-align:center;font-weight:600;font-size:15px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .bx .pt-timer{display:inline-flex;align-items:center;gap:6px;font-family:var(--mono);font-size:15px;font-weight:600;padding:6px 12px;border-radius:99px;background:var(--tile);border:1px solid var(--line)}
        .bx .pt-timer.low{background:var(--rose-bg);color:var(--rose-ink);border-color:transparent}
        .bx .pt-main{padding-top:24px;padding-bottom:48px}
        .bx .pt-center{max-width:520px;margin:40px auto;text-align:center;display:flex;flex-direction:column;align-items:center;gap:8px;padding:32px}
        .bx .pt-center h2{margin:8px 0 0;font-size:20px}
        .bx .pt-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px}
        .bx .pt-center .pt-actions{justify-content:center}
        .bx .pt-intro{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:12px;max-width:1000px;margin:0 auto}
        .bx .pt-intro-hero h1{font-size:30px;letter-spacing:-.03em;margin:12px 0 8px}
        .bx .pt-mix{display:flex;flex-direction:column;gap:12px}
        .bx .pt-mix-row{display:grid;grid-template-columns:minmax(80px,140px) 1fr 44px;align-items:center;gap:12px}
        .bx .pt-mix-row .t2{text-align:right;font-variant-numeric:tabular-nums}
        .bx .pt-mix-bar{height:8px;border-radius:99px;background:var(--bg);overflow:hidden}
        .bx .pt-mix-bar i{display:block;height:100%;border-radius:99px;background:var(--indigo);transition:width .6s ease}
        .bx .pt-note{display:flex;gap:8px;align-items:flex-start;font-size:13px;color:var(--amber-ink);background:var(--amber-bg);padding:10px 12px;border-radius:var(--r-sm);margin:16px 0 0}
        .bx .pt-rules{margin:18px 0;padding-left:18px;color:var(--muted);font-size:13.5px;line-height:1.7}
        .bx kbd{font-family:var(--mono);font-size:11.5px;padding:1px 6px;border-radius:6px;border:1px solid var(--line2);background:var(--bg);color:var(--ink2)}
        .bx .pt-run{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:12px;align-items:start}
        .bx .pt-q{padding:28px}
        .bx .pt-q-head{display:flex;align-items:center;gap:12px}
        .bx .pt-flag{margin-left:auto}
        .bx .pt-flag.on{color:var(--amber)}
        .bx .pt-q-text{font-size:19px;font-weight:600;line-height:1.5;letter-spacing:-.01em;margin:20px 0 22px;white-space:pre-wrap}
        .bx .pt-opts{display:flex;flex-direction:column;gap:10px}
        .bx .pt-opt{display:flex;align-items:center;gap:14px;text-align:left;width:100%;padding:14px 16px;border-radius:var(--r-sm);border:1.5px solid var(--line);background:var(--tile);color:var(--ink);font:inherit;font-size:15px;cursor:pointer;transition:border-color .12s,background .12s}
        .bx .pt-opt:hover:not(:disabled){border-color:var(--line2);background:var(--bg)}
        .bx .pt-opt.on{border-color:var(--indigo);background:var(--indigo-bg);color:var(--indigo-ink)}
        .bx .pt-opt-l{width:28px;height:28px;border-radius:8px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:13px;background:var(--bg);color:var(--ink2)}
        .bx .pt-opt.on .pt-opt-l{background:var(--indigo);color:#fff}
        .bx .pt-opt-t{white-space:pre-wrap}
        .bx .pt-q-foot{display:flex;justify-content:space-between;margin-top:24px;padding-top:18px;border-top:1px solid var(--line)}
        .bx .pt-side{position:sticky;top:76px;display:flex;flex-direction:column;gap:14px}
        .bx .pt-side-stat{display:grid;grid-template-columns:repeat(3,1fr);text-align:center}
        .bx .pt-side-stat b{display:block;font-size:22px;letter-spacing:-.02em}
        .bx .pt-side-stat .t2{font-size:12px}
        .bx .pt-prog{height:6px;border-radius:99px;background:var(--bg);overflow:hidden}
        .bx .pt-prog i{display:block;height:100%;background:var(--green);transition:width .3s}
        .bx .pt-nav{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;max-height:320px;overflow:auto}
        .bx .pt-nav button{aspect-ratio:1;border-radius:9px;border:1px solid var(--line);background:var(--tile);color:var(--ink2);font:inherit;font-size:12.5px;font-weight:500;cursor:pointer;position:relative}
        .bx .pt-nav button.done{background:var(--green-bg);color:var(--green-ink);border-color:transparent}
        .bx .pt-nav button.flag::after{content:'';position:absolute;top:3px;right:3px;width:6px;height:6px;border-radius:50%;background:var(--amber)}
        .bx .pt-nav button.cur{outline:2px solid var(--ink);outline-offset:1px}
        .bx .pt-legend{display:flex;gap:12px;font-size:12px;flex-wrap:wrap}
        .bx .pt-legend span{display:inline-flex;align-items:center;gap:5px}
        .bx .pt-legend i{width:10px;height:10px;border-radius:3px;border:1px solid var(--line2);background:var(--tile)}
        .bx .pt-legend i.done{background:var(--green-bg);border-color:transparent}
        .bx .pt-legend i.flag{background:var(--amber);border-color:transparent;border-radius:50%}
        .bx .pt-res-top{grid-template-columns:minmax(0,1.2fr) minmax(0,1fr)}
        .bx .pt-res-score{display:flex;align-items:center;gap:24px}
        .bx .pt-res-h{font-size:26px;letter-spacing:-.03em;margin:6px 0}
        .bx .pt-review{list-style:none;margin:0;padding:0;display:flex;flex-direction:column}
        .bx .pt-rv{padding:18px 0;border-bottom:1px solid var(--line)}
        .bx .pt-rv:last-child{border-bottom:0}
        .bx .pt-rv-head{display:flex;align-items:center;gap:10px}
        .bx .pt-rv-q{font-weight:600;line-height:1.5;margin:10px 0 12px;white-space:pre-wrap}
        .bx .pt-rv-opts{display:grid;grid-template-columns:1fr 1fr;gap:8px}
        .bx .pt-rv-opt{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:10px;border:1px solid var(--line);font-size:14px;flex-wrap:wrap}
        .bx .pt-rv-opt .pt-opt-l{width:24px;height:24px;font-size:12px}
        .bx .pt-rv-opt.right{background:var(--green-bg);color:var(--green-ink);border-color:transparent}
        .bx .pt-rv-opt.right .pt-opt-l{background:var(--green);color:#fff}
        .bx .pt-rv-opt.mine{background:var(--rose-bg);color:var(--rose-ink);border-color:transparent}
        .bx .pt-rv-opt.mine .pt-opt-l{background:var(--rose);color:#fff}
        .bx .pt-tag{margin-left:auto;font-size:11.5px;font-weight:600;opacity:.85}
        .bx .pt-tag + .pt-tag{margin-left:0}
        .bx .pt-tag + .pt-tag::before{content:'· ';opacity:.6}
        .bx .pt-modal{position:fixed;inset:0;z-index:50;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;padding:20px}
        .bx .pt-modal-card{max-width:440px;width:100%;padding:24px;box-shadow:0 30px 60px -20px rgba(0,0,0,.4)}
        .bx .pt-modal-card h2{margin:0 0 8px;font-size:18px}
        .bx .btn .spin{width:14px;height:14px}
        @media (max-width:900px){
          .bx .pt-intro,.bx .pt-run,.bx .pt-res-top{grid-template-columns:1fr}
          .bx .pt-side{position:static}
          .bx .pt-nav{grid-template-columns:repeat(10,1fr)}
        }
        @media (max-width:560px){
          .bx .pt-q{padding:18px}
          .bx .pt-bar-in{padding:10px 14px}
          .bx .pt-bar-title{display:none}
          .bx .pt-bar-in{justify-content:space-between}
          .bx .pt-res-score{flex-direction:column;align-items:flex-start}
          .bx .pt-rv-opts{grid-template-columns:1fr}
          .bx .pt-nav{grid-template-columns:repeat(6,1fr)}
        }
      `}</style>
    </div>
  );
}
