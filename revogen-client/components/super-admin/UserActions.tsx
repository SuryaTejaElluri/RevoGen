'use client';

// Dialogs for acting on a user: change role, suspend/reactivate, adjust credits, delete.
import { useState } from 'react';
import { ASSIGNABLE, errorMessages, Role, ROLE_META, sa, UserRow } from './api';
import { Confirm, ErrorList, Modal, useToast } from './ui';

type Target = Pick<UserRow, 'id' | 'name' | 'email' | 'role'> & { counts?: UserRow['counts']; credits?: number | null };

function RolePicker({ value, onChange, exclude }: { value: Role; onChange: (r: Role) => void; exclude?: Role }) {
  return (
    <div className="sa-role-pick" role="radiogroup">
      {ASSIGNABLE.filter((r) => r !== exclude).map((r) => (
        <label key={r} className={value === r ? 'on' : ''}>
          <input type="radio" name="role" checked={value === r} onChange={() => onChange(r)} />
          <div><b>{ROLE_META[r].label}</b><span>{ROLE_META[r].hint}</span></div>
        </label>
      ))}
    </div>
  );
}

export function RoleDialog({ user, onClose, onDone }: { user: Target; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [role, setRole] = useState<Role>(user.role === 'USER' ? 'ADMIN' : 'USER');
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const owns = (user.counts?.tests ?? 0) + (user.counts?.codingTests ?? 0);

  const save = async () => {
    setBusy(true);
    setErrors([]);
    try {
      await sa(`/users/${user.id}/role`, { method: 'PATCH', body: { role } });
      toast(`${user.name || user.email} is now a ${ROLE_META[role].label.toLowerCase()}.`);
      onDone();
    } catch (e) {
      setErrors(errorMessages(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Change role" onClose={onClose} footer={
      <>
        <button className="btn" onClick={onClose} disabled={busy}>Cancel</button>
        <button className="btn dark" onClick={save} disabled={busy || role === user.role}>{busy && <span className="spin" />}Make {ROLE_META[role].label.toLowerCase()}</button>
      </>
    }>
      <p className="t2" style={{ marginTop: 0 }}>{user.name || user.email} is currently a <b>{ROLE_META[user.role]?.label.toLowerCase()}</b>. The change applies on their next request — no sign-out needed.</p>
      <RolePicker value={role} onChange={setRole} exclude={user.role} />
      {role === 'ADMIN' && <div className="alert info" style={{ marginTop: 12 }}>They get a Revo Credits wallet with the 20-credit welcome bonus if they don&apos;t have one yet.</div>}
      {role === 'SUPER_ADMIN' && <div className="alert" style={{ marginTop: 12 }}>Super admins can manage every user and both question banks. Only promote people you trust.</div>}
      {user.role === 'ADMIN' && role === 'USER' && owns > 0 && (
        <div className="alert info" style={{ marginTop: 12 }}>Their {owns} test{owns === 1 ? '' : 's'} and results stay; they just can&apos;t manage them while they&apos;re a candidate.</div>
      )}
      <ErrorList errors={errors} />
    </Modal>
  );
}

export function SuspendDialog({ user, onClose, onDone }: { user: Target; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const suspended = user.role === 'SUSPENDED';
  const [restore, setRestore] = useState<Role>('USER');
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const save = async () => {
    setBusy(true);
    setErrors([]);
    try {
      await sa(`/users/${user.id}/suspend`, { method: 'PATCH', body: suspended ? { suspended: false, restoreRole: restore } : { suspended: true } });
      toast(suspended ? 'Account reactivated.' : 'Account suspended.');
      onDone();
    } catch (e) {
      setErrors(errorMessages(e));
    } finally {
      setBusy(false);
    }
  };

  if (!suspended) {
    return (
      <Confirm title="Suspend this account?" tone="danger" action="Suspend" busy={busy} errors={errors} onConfirm={save} onClose={onClose}
        body={<>
          <p><b>{user.name || user.email}</b> will be signed out on their next request and can&apos;t sign in until reactivated.</p>
          <p className="t2">Nothing is deleted: their tests, results and credits are kept.</p>
        </>} />
    );
  }
  return (
    <Modal title="Reactivate account" onClose={onClose} footer={
      <>
        <button className="btn" onClick={onClose} disabled={busy}>Cancel</button>
        <button className="btn dark" onClick={save} disabled={busy}>{busy && <span className="spin" />}Reactivate as {ROLE_META[restore].label.toLowerCase()}</button>
      </>
    }>
      <p className="t2" style={{ marginTop: 0 }}>Choose what {user.name || user.email} can do once they&apos;re back.</p>
      <RolePicker value={restore} onChange={setRestore} />
      <ErrorList errors={errors} />
    </Modal>
  );
}

export function CreditsDialog({ user, onClose, onDone }: { user: Target; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [mode, setMode] = useState<'add' | 'remove'>('add');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const n = Number(amount);
  const valid = Number.isInteger(n) && n > 0 && n <= 100000 && reason.trim().length >= 3;
  const balance = user.credits ?? 0;
  const after = balance + (mode === 'add' ? n : -n);

  const save = async () => {
    setBusy(true);
    setErrors([]);
    try {
      const r = await sa<{ balance: number }>(`/users/${user.id}/credits`, { method: 'POST', body: { delta: mode === 'add' ? n : -n, reason: reason.trim() } });
      toast(`Balance is now ${r.balance} credits.`);
      onDone();
    } catch (e) {
      setErrors(errorMessages(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Adjust Revo Credits" onClose={onClose} footer={
      <>
        <button className="btn" onClick={onClose} disabled={busy}>Cancel</button>
        <button className="btn dark" onClick={save} disabled={busy || !valid || after < 0}>{busy && <span className="spin" />}{mode === 'add' ? 'Add' : 'Remove'} {valid ? n : ''} credits</button>
      </>
    }>
      <div className="seg" role="radiogroup" aria-label="Add or remove" style={{ marginBottom: 14 }}>
        <button role="radio" aria-checked={mode === 'add'} className={mode === 'add' ? 'on' : ''} onClick={() => setMode('add')}>Add</button>
        <button role="radio" aria-checked={mode === 'remove'} className={mode === 'remove' ? 'on' : ''} onClick={() => setMode('remove')}>Remove</button>
      </div>
      <div className="sa-form">
        <div className="field">
          <label htmlFor="cr-amount">Credits</label>
          <input id="cr-amount" className="input" type="number" min={1} max={100000} step={1} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="50" />
          <span className="hint">
            Current balance {balance}{amount && Number.isFinite(n) ? ` → ${after}` : ''}{after < 0 && amount ? ' (can’t go below 0)' : ''}
          </span>
        </div>
        <div className="field">
          <label htmlFor="cr-reason">Reason</label>
          <input id="cr-reason" className="input" maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Goodwill top-up for onboarding" />
          <span className="hint">Shown in their credit history.</span>
        </div>
      </div>
      <ErrorList errors={errors} />
    </Modal>
  );
}

export function DeleteDialog({ user, onClose, onDone }: { user: Target; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const owns = (user.counts?.tests ?? 0) + (user.counts?.codingTests ?? 0);

  const save = async () => {
    setBusy(true);
    setErrors([]);
    try {
      await sa(`/users/${user.id}/delete`, { method: 'POST', body: { confirmEmail: user.email } });
      toast('Account deleted.');
      onDone();
    } catch (e) {
      setErrors(errorMessages(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Confirm title={owns ? "This account can't be deleted" : 'Delete this account permanently?'} tone={owns ? 'dark' : 'danger'}
      action={owns ? 'OK' : 'Delete permanently'} busy={busy} errors={errors}
      confirmText={owns ? undefined : user.email} onConfirm={owns ? onClose : save} onClose={onClose}
      body={owns ? (
        <p>{user.name || user.email} owns {owns} test{owns === 1 ? '' : 's'}. Deleting them would orphan candidates&apos; results, so <b>suspend</b> the account instead.</p>
      ) : (
        <>
          <p>This removes <b>{user.email}</b> and everything that belongs to them: test attempts, coding submissions, resumes and credit history. <b>It can&apos;t be undone.</b></p>
          <p className="t2">To keep their data, suspend the account instead.</p>
        </>
      )} />
  );
}
