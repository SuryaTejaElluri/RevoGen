'use client';
import { getToken } from '@/lib/auth';
import CandidateFooter from '@/components/candidate/Footer';
import { API_BASE_URL } from '@/lib/api';

import { useEffect, useState } from 'react';
import Navbar, { Icon } from '@/components/Navbar';
import { useRouter } from 'next/navigation';

interface Test {
  id: string;
  title: string;
  category: string;
  duration: number;
  type: 'MCQ' | 'CODING';
  attempted?: boolean;
  attemptId?: string | null;
  securityLevel?: string;
}

type FilterType = 'ALL' | 'MCQ' | 'CODING';

export default function AssignedTestsPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [startingId, setStartingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const router = useRouter();

  // Auth guard — redirect unauthenticated visitors to login, preserving the destination
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/login?redirect=/assigned-tests');
    }
  }, [router]);

  const startCodingTest = async (codingTestId: string, securityLevel?: string) => {
    setError('');
    setStartingId(codingTestId);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/coding-attempts/start/${codingTestId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.attemptId) {
        setError(data.message || 'Unable to start this test. Please try again.');
        return;
      }
      const path = securityLevel === 'PRO' ? 'pro' : 'basic';
      window.location.assign(`/candidate/tests/${data.attemptId}/${path}`);
    } catch (err) {
      console.error(err);
      setError('Failed to start the coding test. Check your connection and try again.');
    } finally {
      setStartingId(null);
    }
  };

  // Load both test lists once on mount (`loading` starts true).
  useEffect(() => {
    const loadTests = async () => {
      try {
        const token = getToken();
        const headers = { Authorization: `Bearer ${token}` };
        const [mcqRes, codingRes] = await Promise.all([
          fetch(`${API_BASE_URL}/tests/assigned`, { headers }),
          fetch(`${API_BASE_URL}/coding-tests/assigned`, { headers }),
        ]);
        const mcqData = mcqRes.ok ? await mcqRes.json() : [];
        const codingData = codingRes.ok ? await codingRes.json() : [];

        const formattedMcq: Test[] = mcqData.map((item: Test) => ({
          id: item.id,
          title: item.title,
          category: item.category,
          duration: item.duration,
          type: 'MCQ',
          attempted: false, // MCQ completed tests are filtered server-side
        }));
        const formattedCoding: Test[] = codingData.map((item: Test) => ({
          id: item.id,
          title: item.title,
          category: 'Coding',
          duration: item.duration,
          type: 'CODING',
          attempted: item.attempted,
          attemptId: item.attemptId,
          securityLevel: item.securityLevel,
        }));
        setTests([...formattedMcq, ...formattedCoding]);
      } catch (err) {
        console.error(err);
        setError('Could not load your tests. Refresh the page to try again.');
      } finally {
        setLoading(false);
      }
    };
    loadTests();
  }, []);


  const filteredTests = filter === 'ALL' ? tests : tests.filter(t => t.type === filter);
  const pending = tests.filter(t => !t.attempted);
  const mcqCount = tests.filter(t => t.type === 'MCQ').length;
  const codingCount = tests.filter(t => t.type === 'CODING').length;
  const totalMins = pending.reduce((sum, t) => sum + (t.duration || 0), 0);

  const start = (test: Test) => {
    if (test.attempted) return;
    if (test.type === 'MCQ') router.push(`/tests/${test.id}`);
    else startCodingTest(test.id, test.securityLevel);
  };

  return (
    <div className="bx">
      <Navbar />
      <main className="wrap">
        <div className="head fade">
          <div>
            <h1>Assigned tests</h1>
            <p>Tests recruiters have invited you to. Each one is timed, so start when you have a quiet moment.</p>
          </div>
        </div>

        <div className="grid fade at-top">
          <div className="tile dark">
            <div className="lbl"><Icon name="clip" size={15} />To do</div>
            <div className="num">{loading ? '–' : pending.length}</div>
            <div className="sub">{loading ? 'Loading…' : pending.length ? `about ${totalMins} min in total` : 'nothing waiting'}</div>
          </div>
          <div className="tile indigo">
            <div className="lbl"><Icon name="list" size={15} />MCQ</div>
            <div className="num">{loading ? '–' : mcqCount}</div>
            <div className="sub">multiple choice</div>
          </div>
          <div className="tile lime">
            <div className="lbl"><Icon name="code" size={15} />Coding</div>
            <div className="num">{loading ? '–' : codingCount}</div>
            <div className="sub">problem solving</div>
          </div>
          <div className="tile line tips">
            <div className="lbl"><Icon name="shield" size={15} />Before you start</div>
            <ul>
              <li>Tests open in fullscreen. Leaving it or switching tabs is logged.</li>
              <li>Pro tests need your camera, and block copy and paste.</li>
              <li>The timer can’t be paused, and time-outs submit automatically.</li>
            </ul>
          </div>
        </div>

        {error && <div className="alert" role="alert" style={{ marginTop: 12 }}>{error}</div>}

        <div className="tile line fade" style={{ marginTop: 12 }}>
          <div className="tile-h">
            <h2>{filter === 'ALL' ? 'All tests' : filter === 'MCQ' ? 'MCQ tests' : 'Coding tests'}</h2>
            {!loading && tests.length > 0 && (
              <div className="seg" role="tablist" aria-label="Filter tests">
                {(['ALL', 'MCQ', 'CODING'] as FilterType[]).map(f => (
                  <button key={f} role="tab" aria-selected={filter === f} className={filter === f ? 'on' : ''} onClick={() => setFilter(f)}>
                    {f === 'ALL' ? 'All' : f === 'MCQ' ? 'MCQ' : 'Coding'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {loading ? (
            <div className="loading" style={{ minHeight: 200 }}><span className="spin" />Loading your tests…</div>
          ) : filteredTests.length === 0 ? (
            <div className="empty">
              <span className="ico indigo"><Icon name="clip" size={22} /></span>
              <b>{tests.length === 0 ? 'No tests assigned yet' : `No ${filter === 'MCQ' ? 'MCQ' : 'coding'} tests`}</b>
              {tests.length === 0
                ? 'When a recruiter invites you, the test appears here. Practise in the meantime.'
                : 'Try a different filter.'}
            </div>
          ) : (
            <div className="grid at-cards">
              {filteredTests.map(test => (
                <article key={`${test.type}-${test.id}`} className={`tile at-card ${test.attempted ? 'done' : ''}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <span className={`ico ${test.type === 'CODING' ? 'indigo' : 'amber'}`}>
                      <Icon name={test.type === 'CODING' ? 'code' : 'list'} />
                    </span>
                    {test.attempted
                      ? <span className="chip green"><Icon name="check" size={12} />Submitted</span>
                      : <span className={`chip ${test.type === 'CODING' ? 'indigo' : 'amber'}`}>{test.type === 'CODING' ? 'Coding' : 'MCQ'}</span>}
                  </div>
                  <h3 className="at-title">{test.title}</h3>
                  <p className="t2" style={{ margin: 0 }}>{test.category}</p>
                  <div className="chips" style={{ margin: '12px 0 16px' }}>
                    <span className="chip"><Icon name="clock" size={12} />{test.duration} min</span>
                    {test.securityLevel && (
                      <span className="chip"><Icon name="shield" size={12} />{test.securityLevel === 'PRO' ? 'Pro proctoring' : 'Basic proctoring'}</span>
                    )}
                  </div>
                  <button
                    className={`btn block ${test.attempted ? '' : 'dark'}`}
                    disabled={test.attempted || startingId === test.id}
                    onClick={() => start(test)}
                  >
                    {test.attempted
                      ? 'Already submitted'
                      : startingId === test.id
                        ? <><span className="spin" style={{ width: 14, height: 14, borderTopColor: 'currentColor' }} />Starting…</>
                        : <>Start test<Icon name="arrow" size={16} /></>}
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
      <CandidateFooter />

      <style>{`
        .bx .at-top{grid-template-columns:repeat(3,minmax(0,1fr)) minmax(0,1.6fr)}
        .bx .tips ul{margin:10px 0 0;padding-left:18px;font-size:13.5px;color:var(--ink2);display:flex;flex-direction:column;gap:5px}
        .bx .at-cards{grid-template-columns:repeat(auto-fill,minmax(260px,1fr))}
        .bx .at-card{background:var(--bg);display:flex;flex-direction:column;transition:transform .15s,box-shadow .15s}
        .bx .at-card:not(.done):hover{transform:translateY(-2px);box-shadow:0 14px 30px -18px var(--shadow)}
        .bx .at-card .btn{margin-top:auto}
        .bx .at-card.done{opacity:.75}
        .bx .at-title{font-size:16.5px;font-weight:600;letter-spacing:-.01em;margin:14px 0 2px}
        @media (max-width:1000px){.bx .at-top{grid-template-columns:repeat(3,minmax(0,1fr))}.bx .tips{grid-column:1/-1}}
        @media (max-width:560px){.bx .at-top{grid-template-columns:1fr 1fr}}
      `}</style>
    </div>
  );
}
