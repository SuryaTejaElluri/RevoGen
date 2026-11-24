'use client';

// Shown after any test (MCQ or coding) is submitted.
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Icon } from '@/components/Navbar';
import '@/components/candidate/bento.css';

const REDIRECT_SECONDS = 15;

function ThankYou() {
  const router = useRouter();
  const params = useSearchParams();
  const type = params.get('type');
  const answered = Number(params.get('answered'));
  const total = Number(params.get('total'));
  const showCount = type === 'coding' && Number.isFinite(total) && total > 0 && Number.isFinite(answered);

  const [left, setLeft] = useState(REDIRECT_SECONDS);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    if (left <= 0) { router.push('/dashboard'); return; }
    const id = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [left, paused, router]);

  // Leave fullscreen if the test page didn't.
  useEffect(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }, []);

  return (
    <div className="bx">
      <main className="wrap" style={{ maxWidth: 720, paddingTop: 64 }}>
        <div className="fade" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <img src="/revogen-icon.svg" alt="" width={26} height={26} style={{ borderRadius: 7 }} />
          <b style={{ fontSize: 15 }}>Revogen</b>
        </div>

        <section className="tile dark fade" style={{ padding: 32 }}>
          <span className="ico" style={{ background: 'var(--lime)', color: 'var(--lime-ink)', width: 52, height: 52, borderRadius: 16 }}>
            <Icon name="check" size={26} />
          </span>
          <h1 style={{ fontSize: 'clamp(26px,4vw,34px)', letterSpacing: '-.03em', fontWeight: 600, margin: '20px 0 8px' }}>Test submitted</h1>
          <p className="sub" style={{ fontSize: 16, maxWidth: 520, opacity: .85 }}>
            Your answers have been sent to the recruiter. There’s nothing else you need to do for this test.
          </p>
          {showCount && (
            <div className="chips" style={{ marginTop: 16 }}>
              <span className="chip on-hero"><Icon name="code" size={13} />{answered} of {total} question{total === 1 ? '' : 's'} answered</span>
            </div>
          )}
        </section>

        <section className="tile line fade" style={{ marginTop: 12 }}>
          <div className="tile-h"><h2>What happens next</h2></div>
          <div className="rows">
            <div className="row">
              <span className="ico indigo"><Icon name="clip" size={17} /></span>
              <div className="grow"><p className="t1">The recruiter reviews your work</p><p className="t2" style={{ whiteSpace: 'normal' }}>They see your score, your code, and the test’s integrity report.</p></div>
            </div>
            <div className="row">
              <span className="ico lime"><Icon name="calendar" size={17} /></span>
              <div className="grow"><p className="t1">You’ll hear back from them directly</p><p className="t2" style={{ whiteSpace: 'normal' }}>Usually by email. Keep an eye on your inbox, including spam.</p></div>
            </div>
            <div className="row">
              <span className="ico amber"><Icon name="bolt" size={17} /></span>
              <div className="grow"><p className="t1">Keep practising</p><p className="t2" style={{ whiteSpace: 'normal' }}>Practice tests are free and don’t affect this result.</p></div>
            </div>
          </div>
        </section>

        <div className="fade" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 16 }}>
          <Link href="/dashboard" className="btn dark">Go to dashboard<Icon name="arrow" size={16} /></Link>
          <Link href="/practice" className="btn">Practice</Link>
          <span className="t2" style={{ marginLeft: 'auto' }}>
            {paused ? 'Staying on this page.' : <>Going to your dashboard in {left}s · <button className="btn ghost sm" style={{ padding: '2px 6px' }} onClick={() => setPaused(true)}>Stay here</button></>}
          </span>
        </div>
      </main>
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={null}>
      <ThankYou />
    </Suspense>
  );
}
