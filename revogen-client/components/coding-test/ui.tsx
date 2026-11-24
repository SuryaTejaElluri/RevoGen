'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Attempt, ExecResult, formatClock, LANGUAGES, LangId, MAX_WARNINGS, Question, STATUS_LABEL } from './lib';
import type { CodingTestState } from './useCodingTest';
import './ct.css';

const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => <div className="empty">Loading editor…</div>,
});

// ── Icons ─────────────────────────────────────────────────────────────────────
const P: Record<string, React.ReactNode> = {
  clock: <><circle cx="10" cy="10" r="7" /><path d="M10 6.5V10l2.5 1.5" /></>,
  alert: <><path d="M10 3l7.5 13h-15L10 3z" /><path d="M10 8v3.5M10 14h.01" /></>,
  check: <><path d="M4 10.5l3.5 3.5L16 5.5" /></>,
  x: <><path d="M5 5l10 10M15 5L5 15" /></>,
  play: <><path d="M6.5 4.5v11l9-5.5-9-5.5z" /></>,
  send: <><path d="M3 10l14-6-6 14-2-6-6-2z" /></>,
  reset: <><path d="M4 9a6 6 0 1 1 1.5 5" /><path d="M4 4v5h5" /></>,
  left: <><path d="M12.5 5L7.5 10l5 5" /></>,
  right: <><path d="M7.5 5l5 5-5 5" /></>,
  flag: <><path d="M5 17V3.5M5 4h9l-2 3.5 2 3.5H5" /></>,
  expand: <><path d="M3.5 7.5v-4h4M16.5 7.5v-4h-4M3.5 12.5v4h4M16.5 12.5v4h-4" /></>,
  lock: <><rect x="4" y="9" width="12" height="8.5" rx="2" /><path d="M7 9V6.5a3 3 0 016 0V9" /></>,
  eye: <><path d="M1.5 10S4.5 4 10 4s8.5 6 8.5 6-3 6-8.5 6-8.5-6-8.5-6z" /><circle cx="10" cy="10" r="2.5" /></>,
  camera: <><rect x="2.5" y="5.5" width="11" height="9" rx="2" /><path d="M13.5 9l4-2.5v7l-4-2.5" /></>,
  mic: <><rect x="7.5" y="2.5" width="5" height="9" rx="2.5" /><path d="M4.5 9.5a5.5 5.5 0 0011 0M10 15v2.5" /></>,
  screen: <><rect x="2.5" y="3.5" width="15" height="10" rx="1.5" /><path d="M7 17h6M10 13.5V17" /></>,
  face: <><circle cx="10" cy="10" r="7" /><path d="M7.5 12.5c.7.8 1.5 1.2 2.5 1.2s1.8-.4 2.5-1.2M7.5 8h.01M12.5 8h.01" /></>,
  monitor: <><rect x="2.5" y="4" width="15" height="10" rx="1.5" /><path d="M7.5 17h5" /></>,
  copy: <><rect x="7" y="7" width="10" height="10" rx="2" /><path d="M13 7V4.5A1.5 1.5 0 0011.5 3h-7A1.5 1.5 0 003 4.5v7A1.5 1.5 0 004.5 13H7" /></>,
  tab: <><rect x="2.5" y="4" width="15" height="12" rx="2" /><path d="M2.5 8h15M7 4v4" /></>,
};
export function Icon({ name, size = 16 }: { name: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {P[name]}
    </svg>
  );
}

const useDarkTheme = () => {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const read = () => setDark(document.documentElement.getAttribute('data-bx-theme') === 'dark');
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-bx-theme'] });
    return () => mo.disconnect();
  }, []);
  return dark;
};

// ── Full-page states ──────────────────────────────────────────────────────────
export function CenterScreen({ icon, tone, title, children, actions }: {
  icon: string; tone?: 'ok' | 'warn' | 'bad'; title: string; children?: React.ReactNode; actions?: React.ReactNode;
}) {
  return (
    <div className="ct">
      <div className="center">
        <div className="modal" style={{ boxShadow: 'none' }}>
          <div className={`ico ${tone ?? ''}`}><Icon name={icon} size={20} /></div>
          <h3>{title}</h3>
          {children}
          {actions && <div className="acts" style={{ justifyContent: 'flex-start' }}>{actions}</div>}
        </div>
      </div>
    </div>
  );
}

export function LoadingScreen({ label = 'Loading your test…' }: { label?: string }) {
  return (
    <div className="ct"><div className="center" style={{ gap: 10, color: 'var(--muted)' }}><span className="spin" />{label}</div></div>
  );
}

export function StatusScreens({ t }: { t: CodingTestState }) {
  if (t.phase === 'loading') return <LoadingScreen />;
  if (t.phase === 'error') {
    return (
      <CenterScreen icon="alert" tone="bad" title="We couldn’t open this test"
        actions={<><button className="btn primary" onClick={() => window.location.reload()}>Try again</button><Link className="btn" href="/assigned-tests">Back to assigned tests</Link></>}>
        <p>{t.loadError}</p>
      </CenterScreen>
    );
  }
  if (t.phase === 'submitted') {
    return (
      <CenterScreen icon="check" tone="ok" title="You’ve already submitted this test"
        actions={<><Link className="btn primary" href="/dashboard">Go to dashboard</Link><Link className="btn" href="/my-results">View results</Link></>}>
        <p>Your answers were sent to the recruiter. Each test can only be taken once.</p>
      </CenterScreen>
    );
  }
  return null;
}

// ── Before you start ─────────────────────────────────────────────────────────
export interface GateCheck {
  id: string;
  icon: string;
  title: string;
  detail: string;
  state: 'idle' | 'busy' | 'ok' | 'bad';
  action?: { label: string; onClick: () => void };
}

export function Gate({ attempt, timeLeft, checks, rules, preview, canStart, starting, onStart }: {
  attempt: Attempt;
  timeLeft: number;
  checks: GateCheck[];
  rules: { icon: string; text: string }[];
  preview?: React.ReactNode;
  canStart: boolean;
  starting?: boolean;
  onStart: () => void;
}) {
  const [agreed, setAgreed] = useState(false);
  const ct = attempt.codingTest;
  const pro = ct.securityLevel === 'PRO';
  const resumed = timeLeft < ct.duration * 60 - 30;
  return (
    <div className="ct gate-wrap">
      <div className="gate">
        <section className="card">
          <span className={`chip ${pro ? 'accent' : ''}`}><Icon name="lock" size={13} />{pro ? 'Pro proctoring' : 'Basic proctoring'}</span>
          <h1>{ct.title}</h1>
          {ct.description && <p className="note" style={{ marginTop: 0 }}>{ct.description}</p>}
          <div className="facts">
            <div><b>{ct.questions.length}</b><span>question{ct.questions.length === 1 ? '' : 's'}</span></div>
            <div><b>{ct.duration} min</b><span>total time</span></div>
            <div><b style={{ color: resumed ? 'var(--warn)' : undefined }}>{formatClock(timeLeft)}</b><span>{resumed ? 'time left (timer kept running)' : 'time left'}</span></div>
          </div>
          <ul className="rules">
            {rules.map((r) => <li key={r.text}><Icon name={r.icon} />{r.text}</li>)}
          </ul>
        </section>

        <section className="card">
          <b style={{ fontSize: 16 }}>Before you start</b>
          <p className="note" style={{ marginTop: 4 }}>Every item must be green.</p>
          {preview}
          <div className="checks">
            {checks.map((c) => (
              <div key={c.id} className={`check ${c.state}`}>
                <span className="st">{c.state === 'busy' ? <span className="spin" /> : <Icon name={c.state === 'ok' ? 'check' : c.state === 'bad' ? 'x' : c.icon} size={14} />}</span>
                <span className="grow"><b>{c.title}</b><span>{c.detail}</span></span>
                {c.action && c.state !== 'ok' && c.state !== 'busy' && (
                  <button className="btn sm" onClick={c.action.onClick}>{c.action.label}</button>
                )}
              </div>
            ))}
          </div>
          <label className="agree">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            <span>I’ll work on my own, stay in fullscreen, and understand that leaving the test is recorded.</span>
          </label>
          <button className="btn primary lg" style={{ width: '100%' }} disabled={!canStart || !agreed || starting} onClick={onStart}>
            {starting ? <><span className="spin" />Starting…</> : <>Start test<Icon name="right" /></>}
          </button>
          {timeLeft <= 0 && <p className="note" style={{ color: 'var(--bad)' }}>Time is up for this test. Starting will submit it.</p>}
        </section>
      </div>
    </div>
  );
}

// ── Workspace ─────────────────────────────────────────────────────────────────
function Problem({ q }: { q: Question }) {
  const diff = (q.difficulty ?? '').toUpperCase();
  const diffTone = diff === 'EASY' ? 'ok' : diff === 'HARD' ? 'bad' : 'warn';
  const samples = q.testCases.filter((t) => !t.isHidden);
  return (
    <div className="prob sel">
      <div className="meta">
        {diff && <span className={`chip ${diffTone}`}>{diff.charAt(0) + diff.slice(1).toLowerCase()}</span>}
        {q.category && <span className="chip">{q.category.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}</span>}
      </div>
      <h1>{q.title}</h1>
      <h2>Problem</h2>
      <p className="txt">{q.description}</p>
      {q.inputFormat && <><h2>Input format</h2><p className="txt">{q.inputFormat}</p></>}
      {q.outputFormat && <><h2>Output format</h2><p className="txt">{q.outputFormat}</p></>}
      {q.constraints && <><h2>Constraints</h2><p className="txt">{q.constraints}</p></>}
      {samples.length > 0 && <h2>Examples</h2>}
      {samples.map((tc, i) => (
        <div className="ex" key={tc.id ?? i}>
          <div className="ex-h"><span>Example {i + 1}</span></div>
          <div className="ex-b">
            <div><div className="k">Input</div><pre>{tc.input || '(empty)'}</pre></div>
            <div><div className="k">Output</div><pre>{tc.expectedOutput}</pre></div>
          </div>
        </div>
      ))}
      {(q.hiddenTestCount ?? 0) > 0 && (
        <p className="note">Your submission is also checked against {q.hiddenTestCount} hidden test{q.hiddenTestCount === 1 ? '' : 's'}.</p>
      )}
    </div>
  );
}

function Results({ r, busy, q }: { r: ExecResult | null | undefined; busy: 'run' | 'submit' | null; q: Question }) {
  if (busy) {
    return <div className="empty"><span className="spin" />{busy === 'run' ? 'Running your code on the examples…' : 'Checking your code against all tests…'}</div>;
  }
  if (!r) {
    return <div className="empty">Run to try the examples. Submit to score this question against all tests{(q.hiddenTestCount ?? 0) > 0 ? ', including hidden ones' : ''}.</div>;
  }
  const pct = r.totalCases ? Math.round((r.passedCases / r.totalCases) * 100) : 0;
  const shown = (r.results ?? []).filter((c) => !c.isHidden);
  const hidden = (r.results ?? []).filter((c) => c.isHidden);
  return (
    <div>
      <div className="sum">
        <span className={`chip ${r.error ? 'bad' : pct === 100 ? 'ok' : pct > 0 ? 'warn' : 'bad'}`}>{r.kind === 'run' ? 'Run' : 'Submitted'}</span>
        <b>{r.passedCases} / {r.totalCases} tests passed</b>
        <div className="meter"><i style={{ width: `${pct}%`, background: pct === 100 ? 'var(--ok)' : pct > 0 ? 'var(--warn)' : 'var(--bad)' }} /></div>
        {r.kind === 'submit' && typeof r.score === 'number' && <span className="chip">Score {r.score}/100</span>}
      </div>
      {r.error && (
        <div className="err" style={{ marginBottom: 10 }}>
          <b>{r.status || 'Error'}</b>
          <pre className="sel">{r.error}</pre>
        </div>
      )}
      {shown.map((c) => (
        <div className="case" key={c.testCaseNo}>
          <div className="case-h">
            <span>Example {c.testCaseNo}</span>
            <span className={`chip ${c.passed ? 'ok' : 'bad'}`}><Icon name={c.passed ? 'check' : 'x'} size={12} />{c.passed ? 'Passed' : 'Failed'}</span>
          </div>
          {!c.passed && (
            <div className="case-b sel">
              <div><div className="k">Input</div><pre>{c.input || '(empty)'}</pre></div>
              <div><div className="k">Expected</div><pre>{c.expected}</pre></div>
              <div><div className="k">Your output</div><pre>{c.received || '(no output)'}</pre></div>
            </div>
          )}
        </div>
      ))}
      {hidden.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div className="k" style={{ marginBottom: 6 }}>Hidden tests</div>
          <div className="hidden-grid">
            {hidden.map((c) => (
              <span key={c.testCaseNo} className={`chip ${c.passed ? 'ok' : 'bad'}`}>
                <Icon name={c.passed ? 'check' : 'x'} size={12} />Test {c.testCaseNo}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function Workspace({ t, camera }: { t: CodingTestState; camera?: React.ReactNode }) {
  const dark = useDarkTheme();
  const workRef = useRef<HTMLDivElement>(null);
  const [left, setLeft] = useState(42);
  const [confirm, setConfirm] = useState(false);
  const q = t.current;
  const ct = t.attempt!.codingTest;
  const timerTone = t.timeLeft < 300 ? 'bad' : t.timeLeft < 600 ? 'warn' : '';

  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    const box = workRef.current?.getBoundingClientRect();
    if (!box) return;
    const move = (ev: MouseEvent) => setLeft(Math.min(65, Math.max(25, ((ev.clientX - box.left) / box.width) * 100)));
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  if (!q) return <CenterScreen icon="alert" tone="warn" title="This test has no questions">Contact the recruiter who invited you.</CenterScreen>;

  return (
    <div className="ct">
      {/* Top bar */}
      <header className="top">
        <div className="brand">
          <img src="/revogen-icon.svg" alt="" width={24} height={24} />
          <b>{ct.title}</b>
          <span className={`chip ${ct.securityLevel === 'PRO' ? 'accent' : ''}`}>{ct.securityLevel === 'PRO' ? 'Pro' : 'Basic'}</span>
        </div>
        <div className="grow" />
        {camera}
        <span className={`warns ${t.warnings ? 'on' : ''}`} title="Warnings. The test is submitted automatically at 5.">
          <Icon name="alert" size={14} />{t.warnings}/{MAX_WARNINGS}
        </span>
        <span className={`timer ${timerTone}`} aria-live="off" title="Time left"><Icon name="clock" size={15} />{formatClock(t.timeLeft)}</span>
        <button className="btn primary" onClick={() => setConfirm(true)}><Icon name="flag" />Finish test</button>
      </header>

      {/* Question tabs */}
      <nav className="tabs" aria-label="Questions">
        {t.questions.map((qq, i) => {
          const st = t.statuses[qq.id] ?? 'NOT_STARTED';
          return (
            <button key={qq.id} className={`tab ${i === t.index ? 'on' : ''}`} onClick={() => t.goTo(i)} title={`${qq.title} · ${STATUS_LABEL[st]}`} aria-current={i === t.index}>
              <span className="n">{i + 1}</span>
              <span className="t">{qq.title}</span>
              <span className={`d ${st}`} aria-label={STATUS_LABEL[st]} />
            </button>
          );
        })}
        <span className="sep" />
        <button className="btn sm" disabled={t.index === 0} onClick={() => t.goTo(t.index - 1)}><Icon name="left" size={14} />Previous</button>
        <button className="btn sm" disabled={t.index === t.questions.length - 1} onClick={() => t.goTo(t.index + 1)}>Next<Icon name="right" size={14} /></button>
      </nav>

      {t.actionError && (
        <div className="banner" role="alert"><span>{t.actionError}</span><button className="btn sm ghost" onClick={t.clearActionError}><Icon name="x" size={14} /></button></div>
      )}

      {/* Problem | Editor */}
      <div className="work" ref={workRef} style={{ ['--left' as string]: `${left}%` }}>
        <section className="pane" aria-label="Problem"><Problem q={q} /></section>
        <div className="split" onMouseDown={startDrag} role="separator" aria-orientation="vertical" />
        <section className="pane" aria-label="Code editor">
          <div className="bar">
            <select className="lang" value={t.lang} onChange={(e) => t.changeLanguage(e.target.value as LangId)} aria-label="Language">
              {LANGUAGES.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
            </select>
            <button className="btn sm ghost" onClick={() => { if (window.confirm('Reset this question to the starter code? Your changes in this language will be lost.')) t.resetCode(); }}>
              <Icon name="reset" size={14} />Reset
            </button>
            <div style={{ flex: 1 }} />
            {t.dirty[q.id] && <span className="chip warn">Not submitted</span>}
            <button className="btn" onClick={t.run} disabled={!!t.busy}>{t.busy === 'run' ? <span className="spin" /> : <Icon name="play" size={14} />}Run</button>
            <button className="btn ok" onClick={t.submit} disabled={!!t.busy}>{t.busy === 'submit' ? <span className="spin" /> : <Icon name="send" size={14} />}Submit</button>
          </div>
          <div className="editor">
            <Editor
              key={`${q.id}:${t.lang}`}
              height="100%"
              language={LANGUAGES.find((l) => l.id === t.lang)?.monaco ?? 'python'}
              theme={dark ? 'vs-dark' : 'light'}
              value={t.currentCode}
              onChange={(v) => t.updateCode(v ?? '')}
              options={{
                fontSize: 14, minimap: { enabled: false }, scrollBeyondLastLine: false, automaticLayout: true,
                tabSize: 4, padding: { top: 12 }, contextmenu: false, wordWrap: 'on', fontFamily: 'var(--font-geist-mono), Menlo, monospace',
              }}
            />
          </div>
          <div className="results">
            <div className="res-tabs"><button className="on">Results</button></div>
            <div className="res-body"><Results r={t.results[q.id]} busy={t.busy} q={q} /></div>
          </div>
        </section>
      </div>

      {/* Finish confirm */}
      {confirm && t.phase === 'running' && (
        <div className="overlay" onClick={() => setConfirm(false)}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="fin-t" onClick={(e) => e.stopPropagation()}>
            <div className="ico"><Icon name="flag" size={20} /></div>
            <h3 id="fin-t">Finish and submit your test?</h3>
            <p>You can’t change your answers after this. Your results go straight to the recruiter.</p>
            <div className="stats">
              <div><b>{t.summary.submitted}/{t.questions.length}</b><span>submitted</span></div>
              <div><b>{t.summary.unsubmitted.length}</b><span>with unsaved code</span></div>
              <div><b>{formatClock(t.timeLeft)}</b><span>time left</span></div>
            </div>
            {t.summary.unsubmitted.length > 0 && (
              <ul className="list">
                {t.summary.unsubmitted.map(({ q: uq }) => (
                  <li key={uq.id}><span className="d EDITED" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--warn)' }} />Question {t.questions.indexOf(uq) + 1}: your latest code will be submitted now</li>
                ))}
              </ul>
            )}
            {t.summary.untouched > 0 && <p className="note">{t.summary.untouched} question{t.summary.untouched === 1 ? ' has' : 's have'} no answer and will score 0.</p>}
            <div className="acts">
              <button className="btn ghost" onClick={() => setConfirm(false)}>Keep working</button>
              <button className="btn primary" onClick={() => { setConfirm(false); t.finish('manual'); }}>Submit test</button>
            </div>
          </div>
        </div>
      )}

      {/* Out of fullscreen: block the test until they return */}
      {t.phase === 'running' && !t.isFullscreen && !t.warningMsg && (
        <div className="overlay">
          <div className="modal" role="alertdialog" aria-modal="true" aria-labelledby="fs-t">
            <div className="ico warn"><Icon name="expand" size={20} /></div>
            <h3 id="fs-t">Return to fullscreen</h3>
            <p>The test only runs in fullscreen. Each time you leave it, a warning is recorded.</p>
            <div className="acts"><button className="btn primary" onClick={t.enterFullscreen}><Icon name="expand" />Back to fullscreen</button></div>
          </div>
        </div>
      )}

      {/* Warning */}
      {t.warningMsg && t.phase === 'running' && (
        <div className="overlay">
          <div className="modal" role="alertdialog" aria-modal="true" aria-labelledby="w-t">
            <div className="ico warn"><Icon name="alert" size={20} /></div>
            <h3 id="w-t">Warning {t.warnings} of {MAX_WARNINGS}</h3>
            <p>{t.warningMsg}</p>
            {t.autoSubmitIn !== null
              ? <p style={{ color: 'var(--bad)', fontWeight: 500 }}>Too many warnings. Your test will be submitted in {t.autoSubmitIn}s.</p>
              : <p>At {MAX_WARNINGS} warnings your test is submitted automatically.</p>}
            <div className="acts">
              <button className="btn primary" onClick={async () => { t.dismissWarning(); if (!document.fullscreenElement) await t.enterFullscreen(); }}>
                I understand, return to the test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Finishing */}
      {t.phase === 'finishing' && (
        <div className="overlay">
          <div className="modal" role="alertdialog" aria-modal="true" aria-busy={!t.finishError}>
            {t.finishError ? (
              <>
                <div className="ico bad"><Icon name="alert" size={20} /></div>
                <h3>We couldn’t submit your test</h3>
                <p>{t.finishError}</p>
                <p className="note">Your code is saved in this browser. Check your connection and try again; don’t close this tab.</p>
                <div className="acts"><button className="btn primary" onClick={() => t.finish('manual')}>Try again</button></div>
              </>
            ) : (
              <>
                <div className="ico"><span className="spin" /></div>
                <h3>Submitting your test</h3>
                <p>{t.finishStep || 'Please wait…'}</p>
                <p className="note">Don’t close this tab.</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
