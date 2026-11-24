'use client';
import { clearSession, getToken } from '@/lib/auth';
import { API_BASE_URL } from '@/lib/api';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar, { Icon } from '../../components/Navbar';

interface Dashboard {
  atsScore?: number;
  resumeUploaded?: boolean;
  testsTaken?: number;
  averageScore?: number;
  practiceExamsTaken?: number;
  completedAssessments?: number;
}

interface PendingTest {
  id: string;
  title: string;
  duration: number;
  type: 'MCQ' | 'CODING';
  securityLevel?: string;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function ScoreRing({ score, size = 96 }: { score: number; size?: number }) {
  const r = size / 2 - 7;
  const c = 2 * Math.PI * r;
  const color = score >= 80 ? 'var(--green)' : score >= 40 ? 'var(--amber)' : 'var(--rose)';
  return (
    <div className="bx-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg)" strokeWidth="8" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(100, Math.max(0, score)) / 100)}
          style={{ transition: 'stroke-dashoffset .8s ease' }} />
      </svg>
      <b>{score}</b>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [pendingTests, setPendingTests] = useState<PendingTest[]>([]);
  const [showTestsPopup, setShowTestsPopup] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push('/login'); return; }

    fetch(`${API_BASE_URL}/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) { clearSession(); router.push('/login'); return; }
        setDashboard(data);
      })
      .catch(console.error);

    // Pending assigned tests: shown in "Up next" and in a once-per-session pop-up.
    const fetchPendingTests = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [mcqRes, codingRes] = await Promise.all([
          fetch(`${API_BASE_URL}/tests/assigned`, { headers }),
          fetch(`${API_BASE_URL}/coding-tests/assigned`, { headers }),
        ]);
        const mcqData = mcqRes.ok ? await mcqRes.json() : [];
        const codingData = codingRes.ok ? await codingRes.json() : [];
        const pending: PendingTest[] = [
          ...mcqData.map((t: PendingTest) => ({ id: t.id, title: t.title, duration: t.duration, type: 'MCQ' as const })),
          ...codingData.filter((t: { attempted?: boolean }) => !t.attempted).map((t: PendingTest) => ({
            id: t.id, title: t.title, duration: t.duration,
            type: 'CODING' as const, securityLevel: t.securityLevel,
          })),
        ];
        if (pending.length > 0) {
          setPendingTests(pending);
          const shownKey = 'rg_tests_popup_shown';
          if (!sessionStorage.getItem(shownKey)) {
            setTimeout(() => setShowTestsPopup(true), 1200);
            sessionStorage.setItem(shownKey, '1');
          }
        }
      } catch { /* the dashboard still works without pending tests */ }
    };
    fetchPendingTests();
  }, [router]);

  if (!dashboard) {
    return (
      <div className="bx">
        <Navbar />
        <div className="loading"><span className="spin" />Loading your dashboard…</div>
      </div>
    );
  }

  const ats = dashboard.atsScore ?? 0;
  const avg = dashboard.averageScore ?? 0;
  const next = pendingTests[0];
  const later = pendingTests.slice(1, 3);

  return (
    <div className="bx">
      <Navbar />
      <main className="wrap">
        <div className="head fade">
          <div>
            <h1>{greeting()}</h1>
            <p>
              {pendingTests.length > 0
                ? `You have ${pendingTests.length} test${pendingTests.length === 1 ? '' : 's'} waiting.`
                : 'You’re all caught up. A practice round keeps you sharp.'}
            </p>
          </div>
          <div className="act">
            <Link href="/practice" className="btn"><Icon name="bolt" size={16} />Practice</Link>
            <Link href="/resumes" className="btn dark"><Icon name="upload" size={16} />Check resume</Link>
          </div>
        </div>

        <div className="grid fade dash-grid">
          {/* Up next */}
          <section className="tile dark up-next">
            <div className="lbl"><Icon name="target" size={15} />Up next</div>
            {next ? (
              <>
                <div>
                  <h2 className="un-title">{next.title}</h2>
                  <div className="chips" style={{ marginTop: 10 }}>
                    <span className="chip on-hero">
                      <Icon name={next.type === 'CODING' ? 'code' : 'list'} size={13} />{next.type === 'CODING' ? 'Coding' : 'MCQ'}
                    </span>
                    <span className="chip on-hero"><Icon name="clock" size={13} />{next.duration} min</span>
                    {next.securityLevel && (
                      <span className="chip on-hero"><Icon name="shield" size={13} />{next.securityLevel === 'PRO' ? 'Pro proctoring' : 'Basic proctoring'}</span>
                    )}
                  </div>
                </div>
                {later.length > 0 && (
                  <div className="un-later">
                    <span>Also waiting</span>
                    {later.map(t => <div key={`${t.type}-${t.id}`}>{t.title} · {t.duration} min</div>)}
                  </div>
                )}
                <Link href="/assigned-tests" className="btn lime" style={{ alignSelf: 'flex-start' }}>
                  Go to test<Icon name="arrow" size={16} />
                </Link>
              </>
            ) : (
              <>
                <div>
                  <h2 className="un-title">No tests waiting</h2>
                  <p className="sub" style={{ maxWidth: 320 }}>When a recruiter invites you, the test shows up here. Until then, practise to stay ready.</p>
                </div>
                <Link href="/practice" className="btn lime" style={{ alignSelf: 'flex-start' }}>
                  Start a practice test<Icon name="arrow" size={16} />
                </Link>
              </>
            )}
          </section>

          {/* Resume / ATS */}
          <Link href="/resumes" className="tile hov ats">
            <div className="lbl"><Icon name="file" size={15} />Resume ATS score</div>
            {dashboard.resumeUploaded ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 10 }}>
                <ScoreRing score={ats} />
                <div>
                  <div style={{ fontWeight: 600 }}>{ats >= 80 ? 'Strong match' : ats >= 60 ? 'Good match' : ats >= 40 ? 'Partial match' : 'Needs work'}</div>
                  <div className="t2" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>See missing skills <Icon name="arrow" size={12} /></div>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontWeight: 600, fontSize: 16 }}>No resume yet</div>
                <p className="t2" style={{ marginBottom: 12 }}>Pick your role and upload a PDF to get a score.</p>
                <span className="btn sm dark"><Icon name="upload" size={14} />Upload resume</span>
              </div>
            )}
          </Link>

          {/* Pending */}
          <Link href="/assigned-tests" className="tile indigo hov">
            <div className="lbl"><Icon name="clip" size={15} />Waiting for you</div>
            <div className="num">{pendingTests.length}</div>
            <div className="sub">assigned test{pendingTests.length === 1 ? '' : 's'}</div>
          </Link>

          {/* Completed */}
          <Link href="/my-results" className="tile lime hov">
            <div className="lbl"><Icon name="check" size={15} />Completed</div>
            <div className="num">{dashboard.completedAssessments ?? 0}</div>
            <div className="sub">tests taken</div>
          </Link>

          {/* Average score */}
          <Link href="/my-results" className="tile hov wide2">
            <div className="lbl"><Icon name="chart" size={15} />Average score</div>
            <div className="num">{avg}<small>%</small></div>
            <div className="bar" style={{ marginTop: 12 }}><i style={{ width: `${avg}%`, background: avg >= 70 ? 'var(--green)' : avg >= 40 ? 'var(--amber)' : 'var(--rose)' }} /></div>
            <div className="t2" style={{ marginTop: 8 }}>across {dashboard.testsTaken ?? 0} attempt{(dashboard.testsTaken ?? 0) === 1 ? '' : 's'}</div>
          </Link>

          {/* Practice */}
          <Link href="/practice" className="tile amber hov wide2">
            <div className="lbl"><Icon name="bolt" size={15} />Practice</div>
            <div className="num">{dashboard.practiceExamsTaken ?? 0}</div>
            <div className="sub">practice test{(dashboard.practiceExamsTaken ?? 0) === 1 ? '' : 's'} done</div>
          </Link>
        </div>

        {/* Quick actions */}
        <div className="grid fade quick" style={{ marginTop: 12 }}>
          {[
            { href: '/resumes', icon: 'file', tone: 'indigo', t: 'Score your resume', d: 'Match it against one of 20 roles' },
            { href: '/practice', icon: 'bolt', tone: 'amber', t: 'Take a practice test', d: 'Timed questions, instant results' },
            { href: '/my-results', icon: 'trophy', tone: 'lime', t: 'Review your results', d: 'Scores and answers from past tests' },
          ].map(a => (
            <Link key={a.href} href={a.href} className="tile line hov" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span className={`ico ${a.tone}`}><Icon name={a.icon} /></span>
              <span className="grow"><span className="t1" style={{ display: 'block' }}>{a.t}</span><span className="t2" style={{ display: 'block' }}>{a.d}</span></span>
              <Icon name="arrow" size={16} />
            </Link>
          ))}
        </div>
      </main>

      {/* New tests pop-up (once per session) */}
      {showTestsPopup && pendingTests.length > 0 && (
        <div className="modal" onClick={() => setShowTestsPopup(false)}>
          <div className="box" role="dialog" aria-modal="true" aria-labelledby="pending-title" onClick={e => e.stopPropagation()}>
            <span className="ico dark" style={{ marginBottom: 14 }}><Icon name="clip" /></span>
            <h2 id="pending-title" style={{ margin: 0, fontSize: 20, letterSpacing: '-.02em' }}>
              {pendingTests.length} test{pendingTests.length === 1 ? '' : 's'} waiting for you
            </h2>
            <p className="t2" style={{ margin: '6px 0 16px' }}>A recruiter has invited you. Start when you have a quiet moment.</p>
            <div className="rows" style={{ marginBottom: 18 }}>
              {pendingTests.slice(0, 4).map(t => (
                <div className="row" key={`${t.type}-${t.id}`}>
                  <span className={`ico ${t.type === 'CODING' ? 'indigo' : 'amber'}`}><Icon name={t.type === 'CODING' ? 'code' : 'list'} size={16} /></span>
                  <div className="grow"><p className="t1">{t.title}</p><p className="t2">{t.type === 'CODING' ? 'Coding' : 'MCQ'} · {t.duration} min</p></div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn ghost" onClick={() => setShowTestsPopup(false)}>Later</button>
              <button className="btn dark" style={{ flex: 1 }} onClick={() => { setShowTestsPopup(false); router.push('/assigned-tests'); }}>
                View tests<Icon name="arrow" size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .bx .dash-grid{grid-template-columns:repeat(4,minmax(0,1fr));grid-auto-rows:minmax(150px,auto)}
        .bx .up-next{grid-column:span 2;grid-row:span 2;display:flex;flex-direction:column;justify-content:space-between;gap:18px;padding:24px}
        .bx .un-title{font-size:clamp(22px,2.6vw,30px);font-weight:600;letter-spacing:-.03em;margin:10px 0 0;line-height:1.15}
        .bx .un-later{font-size:13px;color:#D1D5DB;display:flex;flex-direction:column;gap:4px}
        .bx .un-later span{color:#9CA3AF;font-size:12px}
        .bx .ats,.bx .wide2{grid-column:span 2}
        .bx .quick{grid-template-columns:repeat(3,minmax(0,1fr))}
        @media (max-width:1000px){
          .bx .dash-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
          .bx .quick{grid-template-columns:1fr}
        }
        @media (max-width:560px){
          .bx .dash-grid{grid-template-columns:1fr 1fr}
          .bx .up-next,.bx .ats{grid-column:span 2}
          .bx .up-next{grid-row:auto}
        }
      `}</style>
    </div>
  );
}
