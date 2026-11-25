'use client';

import { Fragment, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { errorMessages, fmtDate, initials, sa, timeAgo, UserDetail } from '@/components/super-admin/api';
import { useMe } from '@/components/super-admin/Shell';
import { ErrorList, Loading, RoleChip, SaIcon, useToast } from '@/components/super-admin/ui';
import { CreditsDialog, DeleteDialog, RoleDialog, SuspendDialog } from '@/components/super-admin/UserActions';

type Kind = 'role' | 'suspend' | 'credits' | 'delete';

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const me = useMe();
  const toast = useToast();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [action, setAction] = useState<Kind | null>(null);
  const [verifying, setVerifying] = useState(false);

  const load = useCallback(async () => {
    try {
      setUser(await sa<UserDetail>(`/users/${id}`));
      setErrors([]);
    } catch (e) {
      setErrors(errorMessages(e));
    }
  }, [id]);

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  const verify = async () => {
    setVerifying(true);
    try {
      await sa(`/users/${id}/verify`, { method: 'PATCH' });
      toast('Email marked as verified.');
      load();
    } catch (e) {
      toast(errorMessages(e).join(' '), 'bad');
    } finally {
      setVerifying(false);
    }
  };

  if (!user) {
    return errors.length ? (
      <div>
        <Link href="/pro-admin/users" className="sa-crumb"><SaIcon name="back" size={14} />Users</Link>
        <ErrorList errors={errors} />
      </div>
    ) : <Loading label="Loading user…" />;
  }

  const self = user.id === me?.userId;
  const isRecruiter = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
  const suspended = user.role === 'SUSPENDED';
  const done = () => { setAction(null); load(); };

  return (
    <div className="fade">
      <Link href="/pro-admin/users" className="sa-crumb"><SaIcon name="back" size={14} />Users</Link>

      <div className="tile line" style={{ marginBottom: 12 }}>
        <div className="sa-head" style={{ marginBottom: 0, alignItems: 'center' }}>
          <div className="sa-profile">
            <span className="avatar">{initials(user.name, user.email)}</span>
            <div>
              <h1 style={{ fontSize: 22 }}>{user.name || user.email}</h1>
              <div className="chips" style={{ marginTop: 6 }}>
                <RoleChip role={user.role} />
                <span className={`chip ${user.isVerified ? 'green' : 'amber'}`}>{user.isVerified ? 'Email verified' : 'Email not verified'}</span>
                {self && <span className="chip lime">You</span>}
              </div>
            </div>
          </div>
          {!self && (
            <div className="act">
              {!suspended && <button className="btn dark" onClick={() => setAction('role')}><SaIcon name="shield" size={16} />Change role</button>}
              {isRecruiter && <button className="btn" onClick={() => setAction('credits')}><SaIcon name="coin" size={16} />Adjust credits</button>}
              {!user.isVerified && <button className="btn" onClick={verify} disabled={verifying}>{verifying ? <span className="spin" /> : <SaIcon name="mail" size={16} />}Mark verified</button>}
              {user.role !== 'SUPER_ADMIN' && (
                <button className={`btn ${suspended ? 'dark' : 'sa-danger-ghost'}`} onClick={() => setAction('suspend')}><SaIcon name="ban" size={16} />{suspended ? 'Reactivate' : 'Suspend'}</button>
              )}
              {user.role !== 'SUPER_ADMIN' && <button className="btn sa-danger-ghost" onClick={() => setAction('delete')}><SaIcon name="trash" size={16} />Delete</button>}
            </div>
          )}
        </div>
      </div>

      <div className="grid sa-two" style={{ marginTop: 0 }}>
        <div className="tile line">
          <div className="tile-h"><h2>Account</h2></div>
          <dl className="sa-kv">
            <dt>Email</dt><dd>{user.email}</dd>
            <dt>Phone</dt><dd>{user.phone || '—'}</dd>
            <dt>Sign-in</dt><dd>{user.provider === 'credentials' ? 'Email and password' : user.provider}</dd>
            <dt>Joined</dt><dd>{fmtDate(user.createdAt)} ({timeAgo(user.createdAt)})</dd>
            <dt>Last updated</dt><dd>{timeAgo(user.updatedAt)}</dd>
            {isRecruiter && <><dt>Revo Credits</dt><dd><b>{user.credits ?? 0}</b></dd></>}
            {user.profile && Object.entries(user.profile)
              .filter(([k, v]) => !['id', 'userId', 'createdAt', 'updatedAt'].includes(k) && v !== null && v !== '' && typeof v !== 'object')
              .map(([k, v]) => <Fragment key={k}><dt>{k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())}</dt><dd>{String(v)}</dd></Fragment>)}
          </dl>
        </div>
        <div className="tile line">
          <div className="tile-h"><h2>Activity</h2></div>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))' }}>
            {[
              ['MCQ attempts', user.counts.attempts],
              ['Coding attempts', user.counts.codingAttempts],
              ['Resumes', user.counts.resumes],
              ['MCQ tests created', user.counts.tests],
              ['Coding tests created', user.counts.codingTests],
            ].map(([l, v]) => (
              <div key={l as string} style={{ background: 'var(--bg)', borderRadius: 12, padding: '12px 14px' }}>
                <div className="t2" style={{ margin: 0 }}>{l}</div>
                <div style={{ fontSize: 22, fontWeight: 600 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid sa-two">
        <div className="tile line">
          <div className="tile-h"><h2>Recent test attempts</h2></div>
          {user.attempts.length + user.codingAttempts.length === 0 ? <p className="t2">No attempts yet.</p> : (
            <div className="rows">
              {user.attempts.map((a) => (
                <div key={a.id} className="row">
                  <span className={`ico ${a.test.isPractice ? 'amber' : 'indigo'}`}><SaIcon name={a.test.isPractice ? 'bolt' : 'list'} size={16} /></span>
                  <div className="grow"><p className="t1">{a.test.title}</p><p className="t2">{a.test.isPractice ? 'Practice' : 'Assigned MCQ'} · {timeAgo(a.createdAt)}</p></div>
                  <b>{Math.round(a.percentage)}%</b>
                </div>
              ))}
              {user.codingAttempts.map((a) => (
                <div key={a.id} className="row">
                  <span className="ico sky"><SaIcon name="code" size={16} /></span>
                  <div className="grow"><p className="t1">{a.codingTest.title}</p><p className="t2">Coding · {a.status.replace('_', ' ').toLowerCase()} · {timeAgo(a.createdAt)}</p></div>
                  <b>{Math.round(a.percentage)}%</b>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="tile line">
          <div className="tile-h"><h2>{isRecruiter ? 'Tests created' : 'Credit history'}</h2></div>
          {isRecruiter ? (
            user.tests.length + user.codingTests.length === 0 ? <p className="t2">No tests created.</p> : (
              <div className="rows">
                {user.tests.map((t) => (
                  <div key={t.id} className="row">
                    <span className="ico indigo"><SaIcon name="list" size={16} /></span>
                    <div className="grow"><p className="t1">{t.title}</p><p className="t2">MCQ{t.isPractice ? ' · practice' : ''} · {t._count.invitations} invited · {t._count.attempts} attempts</p></div>
                  </div>
                ))}
                {user.codingTests.map((t) => (
                  <div key={t.id} className="row">
                    <span className="ico sky"><SaIcon name="code" size={16} /></span>
                    <div className="grow"><p className="t1">{t.title}</p><p className="t2">Coding · {t._count.invitations} invited · {t._count.attempts} attempts</p></div>
                  </div>
                ))}
              </div>
            )
          ) : <p className="t2">Candidates don&apos;t have a credits wallet.</p>}
        </div>
      </div>

      {isRecruiter && (
        <div className="tile line" style={{ marginTop: 12 }}>
          <div className="tile-h"><h2>Credit history</h2><span className="t2">Balance {user.credits ?? 0}</span></div>
          {user.transactions.length === 0 ? <p className="t2">No credit activity yet.</p> : (
            <div className="sa-table-wrap">
              <table className="sa-table">
                <thead><tr><th>When</th><th>Type</th><th>Description</th><th className="num-col">Change</th><th className="num-col">Balance</th></tr></thead>
                <tbody>
                  {user.transactions.map((t) => (
                    <tr key={t.id}>
                      <td className="t2" style={{ whiteSpace: 'nowrap' }}>{fmtDate(t.createdAt)}</td>
                      <td><span className="chip">{t.type.toLowerCase()}</span></td>
                      <td>{t.description}</td>
                      <td className="num-col" style={{ color: t.credits >= 0 ? 'var(--green)' : 'var(--rose)', fontWeight: 600 }}>{t.credits > 0 ? '+' : ''}{t.credits}</td>
                      <td className="num-col">{t.balanceAfter}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {action === 'role' && <RoleDialog user={user} onClose={() => setAction(null)} onDone={done} />}
      {action === 'suspend' && <SuspendDialog user={user} onClose={() => setAction(null)} onDone={done} />}
      {action === 'credits' && <CreditsDialog user={user} onClose={() => setAction(null)} onDone={done} />}
      {action === 'delete' && <DeleteDialog user={user} onClose={() => setAction(null)} onDone={() => { setAction(null); router.replace('/pro-admin/users'); }} />}
    </div>
  );
}
