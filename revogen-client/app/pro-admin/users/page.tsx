'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { errorMessages, fmtDate, initials, qs, sa, UserRow, UsersPage } from '@/components/super-admin/api';
import { useMe } from '@/components/super-admin/Shell';
import { Empty, ErrorList, Loading, Pagination, RoleChip, SaIcon, SearchBox, useDebounced } from '@/components/super-admin/ui';
import { CreditsDialog, DeleteDialog, RoleDialog, SuspendDialog } from '@/components/super-admin/UserActions';

const ROLE_TABS = [
  { key: '', label: 'All' },
  { key: 'USER', label: 'Candidates' },
  { key: 'ADMIN', label: 'Recruiters' },
  { key: 'SUPER_ADMIN', label: 'Super admins' },
  { key: 'SUSPENDED', label: 'Suspended' },
];

type Action = { kind: 'role' | 'suspend' | 'credits' | 'delete'; user: UserRow };

export default function UsersPageRoute() {
  return <Suspense fallback={<Loading />}><Users /></Suspense>;
}

function Users() {
  const params = useSearchParams();
  const me = useMe();
  const [search, setSearch] = useState('');
  const debounced = useDebounced(search);
  const [role, setRole] = useState(params.get('role') ?? '');
  const [verified, setVerified] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<UsersPage | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [action, setAction] = useState<Action | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();
    const load = async () => {
      try {
        setData(await sa<UsersPage>(`/users${qs({ search: debounced.trim(), role, verified, sort, page, pageSize: 20 })}`, { signal: ctrl.signal }));
        setErrors([]);
      } catch (e) {
        if ((e as Error)?.name !== 'AbortError') setErrors(errorMessages(e));
      }
    };
    load();
    return () => ctrl.abort();
  }, [debounced, role, verified, sort, page, reload]);

  useEffect(() => {
    if (!menuFor) return;
    const close = (e: MouseEvent) => { if (!(e.target as HTMLElement).closest('.sa-menu-wrap')) setMenuFor(null); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuFor]);

  const done = () => { setAction(null); setReload((n) => n + 1); };
  const counts = data?.roleCounts ?? {};
  const allCount = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="fade">
      <div className="sa-head">
        <div>
          <h1>Users</h1>
          <p>Change roles, suspend accounts, verify emails and manage recruiter credits.</p>
        </div>
      </div>

      <div className="tile line">
        <div className="sa-tabs" role="tablist" aria-label="Filter by role" style={{ marginTop: -6 }}>
          {ROLE_TABS.map((t) => (
            <button key={t.key} role="tab" aria-selected={role === t.key} className={role === t.key ? 'on' : ''} onClick={() => { setRole(t.key); setPage(1); }}>
              {t.label}<span className="chip">{t.key ? counts[t.key] ?? 0 : allCount}</span>
            </button>
          ))}
        </div>
        <div className="sa-toolbar">
          <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search name or email" label="Search users" />
          <select className="input" value={verified} onChange={(e) => { setVerified(e.target.value); setPage(1); }} aria-label="Filter by email verification">
            <option value="">Any verification</option>
            <option value="verified">Email verified</option>
            <option value="unverified">Not verified</option>
          </select>
          <select className="input" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>

        <ErrorList errors={errors} />
        {!data ? <Loading /> : data.items.length === 0 ? (
          <Empty icon="users" title="No users match">Try another search or filter.</Empty>
        ) : (
          <>
            <div className="sa-table-wrap">
              <table className="sa-table">
                <thead>
                  <tr><th>User</th><th>Role</th><th>Email</th><th className="num-col">Activity</th><th className="num-col">Credits</th><th>Joined</th><th className="act-col"><span className="sr-only">Actions</span></th></tr>
                </thead>
                <tbody>
                  {data.items.map((u) => {
                    const self = u.id === me?.userId;
                    const isRecruiter = u.role === 'ADMIN' || u.role === 'SUPER_ADMIN';
                    return (
                      <tr key={u.id}>
                        <td>
                          <Link href={`/pro-admin/users/${u.id}`} className="sa-cell-user">
                            <span className="avatar">{initials(u.name, u.email)}</span>
                            <div style={{ minWidth: 0 }}>
                              <p className="t1">{u.name || '—'}{self && <span className="chip lime" style={{ marginLeft: 6 }}>You</span>}</p>
                              <p className="t2" style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>{u.email}</p>
                            </div>
                          </Link>
                        </td>
                        <td><RoleChip role={u.role} /></td>
                        <td>
                          <span className={`sa-dot ${u.isVerified ? 'ok' : 'warn'}`} />{' '}
                          <span className="t2" style={{ display: 'inline' }}>{u.isVerified ? 'Verified' : 'Unverified'}</span>
                        </td>
                        <td className="num-col t2">
                          {isRecruiter ? `${u.counts.tests + u.counts.codingTests} tests` : `${u.counts.attempts + u.counts.codingAttempts} attempts`}
                        </td>
                        <td className="num-col">{u.credits ?? <span className="t2">—</span>}</td>
                        <td className="t2" style={{ whiteSpace: 'nowrap' }}>{fmtDate(u.createdAt)}</td>
                        <td className="act-col">
                          <div className="sa-menu-wrap">
                            <button className="btn sm" disabled={self} title={self ? "You can't change your own account here" : undefined}
                              onClick={() => (u.role === 'SUSPENDED' ? setAction({ kind: 'suspend', user: u }) : setAction({ kind: 'role', user: u }))}>
                              {u.role === 'SUSPENDED' ? 'Reactivate' : 'Change role'}
                            </button>
                            <button className="sa-icon-btn" aria-label={`More actions for ${u.email}`} aria-expanded={menuFor === u.id} onClick={() => setMenuFor(menuFor === u.id ? null : u.id)}>
                              <SaIcon name="down" size={15} />
                            </button>
                            {menuFor === u.id && (
                              <div className="sa-menu" role="menu">
                                <Link role="menuitem" href={`/pro-admin/users/${u.id}`}><SaIcon name="eye" size={15} />View details</Link>
                                {isRecruiter && <button role="menuitem" onClick={() => { setMenuFor(null); setAction({ kind: 'credits', user: u }); }}><SaIcon name="coin" size={15} />Adjust credits</button>}
                                {!self && u.role !== 'SUPER_ADMIN' && (
                                  <button role="menuitem" onClick={() => { setMenuFor(null); setAction({ kind: 'suspend', user: u }); }}>
                                    <SaIcon name="ban" size={15} />{u.role === 'SUSPENDED' ? 'Reactivate' : 'Suspend'}
                                  </button>
                                )}
                                {!self && u.role !== 'SUPER_ADMIN' && (
                                  <button role="menuitem" className="danger" onClick={() => { setMenuFor(null); setAction({ kind: 'delete', user: u }); }}><SaIcon name="trash" size={15} />Delete…</button>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination page={data.page} pages={data.pages} total={data.total} onPage={setPage} />
          </>
        )}
      </div>

      {action?.kind === 'role' && <RoleDialog user={action.user} onClose={() => setAction(null)} onDone={done} />}
      {action?.kind === 'suspend' && <SuspendDialog user={action.user} onClose={() => setAction(null)} onDone={done} />}
      {action?.kind === 'credits' && <CreditsDialog user={action.user} onClose={() => setAction(null)} onDone={done} />}
      {action?.kind === 'delete' && <DeleteDialog user={action.user} onClose={() => setAction(null)} onDone={done} />}
    </div>
  );
}
