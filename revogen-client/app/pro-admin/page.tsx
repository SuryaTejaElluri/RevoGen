'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { errorMessages, initials, Overview, sa, timeAgo } from '@/components/super-admin/api';
import { ErrorList, Loading, RoleChip, SaIcon } from '@/components/super-admin/ui';

const DIFF_TONE: Record<string, string> = { EASY: 'var(--green)', MEDIUM: 'var(--amber)', HARD: 'var(--rose)' };

export default function OverviewPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const load = useCallback(async () => {
    try {
      setData(await sa<Overview>('/overview'));
      setErrors([]);
    } catch (e) {
      setErrors(errorMessages(e));
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  if (!data) return errors.length ? <ErrorList errors={errors} /> : <Loading label="Loading overview…" />;

  const { users, content, activity, credits, coverage, signups } = data;
  const maxSignup = Math.max(1, ...signups.map((s) => s.count));
  const signups14 = signups.reduce((n, s) => n + s.count, 0);
  const maxCat = Math.max(1, ...content.mcqCategories.map((c) => c.count));
  const gaps = coverage.filter((c) => !c.ready).length;

  return (
    <div className="fade">
      <div className="sa-head">
        <div>
          <h1>Overview</h1>
          <p>Everything happening on Revogen at a glance.</p>
        </div>
        <div className="act">
          <button className="btn" onClick={load}><SaIcon name="refresh" size={16} />Refresh</button>
          <Link href="/pro-admin/mcq?new=1" className="btn"><SaIcon name="plus" size={16} />MCQ</Link>
          <Link href="/pro-admin/coding/new" className="btn dark"><SaIcon name="plus" size={16} />Coding question</Link>
        </div>
      </div>

      <div className="grid sa-kpis">
        <Link href="/pro-admin/users" className="tile dark hov">
          <div className="lbl"><SaIcon name="users" size={15} />Users</div>
          <div className="num">{users.total.toLocaleString()}</div>
          <div className="sub">+{users.new7} this week · +{users.new30} in 30 days</div>
        </Link>
        <Link href="/pro-admin/users?role=ADMIN" className="tile indigo hov">
          <div className="lbl"><SaIcon name="shield" size={15} />Recruiters</div>
          <div className="num">{users.recruiters.toLocaleString()}</div>
          <div className="sub">{users.candidates.toLocaleString()} candidates · {users.superAdmins} super admin{users.superAdmins === 1 ? '' : 's'}</div>
        </Link>
        <Link href="/pro-admin/mcq" className="tile lime hov">
          <div className="lbl"><SaIcon name="list" size={15} />Question bank</div>
          <div className="num">{(content.mcqQuestions + content.codingQuestions).toLocaleString()}</div>
          <div className="sub">{content.mcqQuestions} MCQ · {content.codingQuestions} coding</div>
        </Link>
        <div className="tile amber">
          <div className="lbl"><SaIcon name="chart" size={15} />Attempts</div>
          <div className="num">{(activity.mcqAttempts + activity.codingAttempts).toLocaleString()}</div>
          <div className="sub">{activity.attempts7} in the last 7 days</div>
        </div>
      </div>

      <div className="grid sa-two">
        <div className="tile line">
          <div className="tile-h">
            <h2>Signups · last 14 days</h2>
            <span className="t2">{signups14} new</span>
          </div>
          <div className="sa-bars" role="img" aria-label={`Signups per day: ${signups.map((s) => s.count).join(', ')}`}>
            {signups.map((s, i) => (
              <div key={s.date} className={`b${i === signups.length - 1 ? ' today' : ''}`} title={`${s.date}: ${s.count}`}>
                <i style={{ height: `${(s.count / maxSignup) * 100}%` }} />
                <span>{new Date(`${s.date}T00:00:00Z`).getUTCDate()}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="tile line">
          <div className="tile-h">
            <h2>Newest accounts</h2>
            <Link href="/pro-admin/users" className="more t2">All users →</Link>
          </div>
          <div className="rows">
            {data.recentUsers.map((u) => (
              <Link key={u.id} href={`/pro-admin/users/${u.id}`} className="row">
                <span className="avatar">{initials(u.name, u.email)}</span>
                <div className="grow">
                  <p className="t1">{u.name || u.email}</p>
                  <p className="t2">{u.email} · {timeAgo(u.createdAt)}</p>
                </div>
                <RoleChip role={u.role} />
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="tile line" style={{ marginTop: 12 }}>
        <div className="tile-h" style={{ flexWrap: 'wrap' }}>
          <h2>Practice coverage</h2>
          <span className={`chip ${gaps ? 'amber' : 'green'}`}>
            {coverage.length === 0 ? 'No practice tests' : gaps ? `${gaps} of ${coverage.length} tests short of questions` : 'Every practice test is fully stocked'}
          </span>
        </div>
        <p className="t2" style={{ margin: '-6px 0 14px' }}>
          Each practice attempt draws questions per subject from the MCQ bank. A subject with fewer bank questions than it needs gives a shorter paper.
        </p>
        {coverage.length > 0 && (
          <div className="sa-cov-grid">
            {coverage.map((t) => (
              <div key={t.id} className="sa-cov">
                <h3>{t.title}<span className={`sa-dot ${t.ready ? 'ok' : 'warn'}`} aria-label={t.ready ? 'ready' : 'short of questions'} /></h3>
                {t.subjects.length === 0 && <p className="t2">Uses its own questions (no subjects).</p>}
                {t.subjects.map((s) => (
                  <div key={s.module} className="sa-meter">
                    <span>{s.module}</span>
                    <span className="bar"><i style={{ width: `${Math.min(100, (s.available / Math.max(1, s.needed)) * 100)}%`, background: s.ok ? 'var(--green)' : 'var(--amber)' }} /></span>
                    <span className="v">{s.available}/{s.needed}</span>
                  </div>
                ))}
                {!t.ready && (
                  <Link href={`/pro-admin/mcq?category=${encodeURIComponent(t.subjects.find((s) => !s.ok)?.module ?? '')}&new=1`} className="btn sm" style={{ marginTop: 10 }}>
                    <SaIcon name="plus" size={14} />Add questions
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid sa-three">
        <div className="tile line">
          <div className="tile-h"><h2>MCQ by subject</h2><Link href="/pro-admin/mcq" className="more t2">Open →</Link></div>
          {content.mcqCategories.length === 0 ? <p className="t2">No MCQ questions yet.</p> : content.mcqCategories.slice(0, 8).map((c) => (
            <Link key={c.category} href={`/pro-admin/mcq?category=${encodeURIComponent(c.category)}`} className="sa-meter">
              <span>{c.category}</span>
              <span className="bar"><i style={{ width: `${(c.count / maxCat) * 100}%` }} /></span>
              <span className="v">{c.count}</span>
            </Link>
          ))}
        </div>
        <div className="tile line">
          <div className="tile-h"><h2>Coding by difficulty</h2><Link href="/pro-admin/coding" className="more t2">Open →</Link></div>
          {['EASY', 'MEDIUM', 'HARD'].map((d) => {
            const n = content.codingByDifficulty[d] ?? 0;
            return (
              <Link key={d} href={`/pro-admin/coding?difficulty=${d}`} className="sa-meter">
                <span>{d[0] + d.slice(1).toLowerCase()}</span>
                <span className="bar"><i style={{ width: `${(n / Math.max(1, content.codingQuestions)) * 100}%`, background: DIFF_TONE[d] }} /></span>
                <span className="v">{n}</span>
              </Link>
            );
          })}
        </div>
        <div className="tile line">
          <div className="tile-h"><h2>Platform</h2></div>
          <dl className="sa-kv" style={{ gridTemplateColumns: '1fr auto' }}>
            <dt>Assigned MCQ tests</dt><dd>{content.mcqTests}</dd>
            <dt>Practice tests</dt><dd>{content.practiceTests}</dd>
            <dt>Coding tests</dt><dd>{content.codingTests}</dd>
            <dt>Credits held by recruiters</dt><dd>{credits.outstanding.toLocaleString()} ({credits.wallets} wallets)</dd>
            <dt>Unverified accounts</dt><dd>{users.unverified}</dd>
            <dt>Suspended accounts</dt><dd>{users.suspended}</dd>
          </dl>
        </div>
      </div>
    </div>
  );
}
