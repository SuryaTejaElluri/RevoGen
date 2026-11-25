'use client';

// Super admin console: small shared UI pieces (icons, dialogs, toasts, pagination).
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { ROLE_META } from './api';

// ─── Icons ───────────────────────────────────────────────────────────────────

const PATHS: Record<string, ReactNode> = {
  grid: <><rect x="3" y="3" width="6" height="6" rx="1.5" /><rect x="11" y="3" width="6" height="6" rx="1.5" /><rect x="3" y="11" width="6" height="6" rx="1.5" /><rect x="11" y="11" width="6" height="6" rx="1.5" /></>,
  users: <><circle cx="8" cy="7" r="3" /><path d="M2.5 16.5c.6-2.8 2.8-4.5 5.5-4.5s4.9 1.7 5.5 4.5" /><path d="M13.5 4.2a3 3 0 010 5.6M15 12.3c1.4.6 2.3 2 2.6 4.2" /></>,
  list: <><path d="M7 5h10M7 10h10M7 15h10" /><circle cx="3.5" cy="5" r="1" /><circle cx="3.5" cy="10" r="1" /><circle cx="3.5" cy="15" r="1" /></>,
  code: <><path d="M7 6l-4 4 4 4M13 6l4 4-4 4M11 4l-2 12" /></>,
  plus: <path d="M10 4v12M4 10h12" />,
  search: <><circle cx="9" cy="9" r="5.5" /><path d="M13.5 13.5L17 17" /></>,
  edit: <><path d="M12.5 4.5l3 3L7 16H4v-3l8.5-8.5z" /></>,
  trash: <><path d="M4 6h12M8 6V4h4v2M6 6l1 10h6l1-10" /></>,
  x: <path d="M5 5l10 10M15 5L5 15" />,
  check: <path d="M4 10.5l4 4 8-9" />,
  alert: <><path d="M10 3l8 14H2L10 3z" /><path d="M10 8v4M10 14.5v.5" /></>,
  upload: <><path d="M10 13V4M6 8l4-4 4 4" /><path d="M4 13v3h12v-3" /></>,
  play: <path d="M6 4l10 6-10 6V4z" />,
  shield: <path d="M10 2.5l6 2.5v4.5c0 4-2.6 6.6-6 8-3.4-1.4-6-4-6-8V5l6-2.5z" />,
  coin: <><circle cx="10" cy="10" r="6.5" /><path d="M10 6.5v7M8 8.2c0-.9.9-1.4 2-1.4s2 .5 2 1.4-1 1.3-2 1.6-2 .7-2 1.6.9 1.4 2 1.4 2-.5 2-1.4" /></>,
  mail: <><rect x="3" y="5" width="14" height="10" rx="2" /><path d="M3.5 6l6.5 5 6.5-5" /></>,
  ban: <><circle cx="10" cy="10" r="6.5" /><path d="M5.5 14.5l9-9" /></>,
  out: <><path d="M8 4H5a1 1 0 00-1 1v10a1 1 0 001 1h3" /><path d="M12 6l4 4-4 4M16 10H8" /></>,
  sun: <><circle cx="10" cy="10" r="3.5" /><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.3 4.3l1.4 1.4M14.3 14.3l1.4 1.4M4.3 15.7l1.4-1.4M14.3 5.7l1.4-1.4" /></>,
  moon: <path d="M16 12.5A6.5 6.5 0 017.5 4a6.5 6.5 0 108.5 8.5z" />,
  menu: <path d="M3 6h14M3 10h14M3 14h14" />,
  arrow: <path d="M4 10h12M11 5l5 5-5 5" />,
  back: <path d="M16 10H4M9 5l-5 5 5 5" />,
  eye: <><path d="M2 10s3-5.5 8-5.5S18 10 18 10s-3 5.5-8 5.5S2 10 2 10z" /><circle cx="10" cy="10" r="2.5" /></>,
  eyeOff: <><path d="M3 3l14 14M8.6 5A8 8 0 0118 10s-.9 1.6-2.6 3M5.4 6.6C3.1 8 2 10 2 10s3 5.5 8 5.5c1.3 0 2.4-.3 3.4-.8" /></>,
  copy: <><rect x="7" y="7" width="9" height="9" rx="2" /><path d="M13 7V5a1 1 0 00-1-1H5a1 1 0 00-1 1v7a1 1 0 001 1h2" /></>,
  bolt: <path d="M11 2L4 11h5l-1 7 7-9h-5l1-7z" />,
  chart: <path d="M4 16V9M10 16V4M16 16v-6" />,
  refresh: <><path d="M16 10a6 6 0 11-1.8-4.3" /><path d="M16 3v4h-4" /></>,
  down: <path d="M5 8l5 5 5-5" />,
  up: <path d="M5 12l5-5 5 5" />,
};

export function SaIcon({ name, size = 18, className }: { name: keyof typeof PATHS | string; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      {PATHS[name] ?? null}
    </svg>
  );
}

// ─── Toasts ──────────────────────────────────────────────────────────────────

type Tone = 'ok' | 'bad' | 'info';
interface Toast { id: number; text: string; tone: Tone }
const ToastCtx = createContext<(text: string, tone?: Tone) => void>(() => undefined);
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);
  const push = useCallback((text: string, tone: Tone = 'ok') => {
    const id = ++seq.current;
    setToasts((t) => [...t.slice(-3), { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), tone === 'bad' ? 6000 : 3500);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="sa-toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`sa-toast ${t.tone}`}>
            <SaIcon name={t.tone === 'bad' ? 'alert' : t.tone === 'info' ? 'bolt' : 'check'} size={16} />
            <span>{t.text}</span>
            <button aria-label="Dismiss" onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}><SaIcon name="x" size={14} /></button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

// ─── Dialogs ─────────────────────────────────────────────────────────────────

export function Modal({ title, onClose, children, wide, footer }: {
  title: ReactNode; onClose: () => void; children: ReactNode; wide?: boolean; footer?: ReactNode;
}) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.activeElement as HTMLElement | null;
    box.current?.querySelector<HTMLElement>('input,textarea,select,button:not(.sa-x)')?.focus();
    return () => { document.removeEventListener('keydown', onKey); prev?.focus?.(); };
  }, [onClose]);
  return (
    <div className="sa-modal" role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={box} className={`sa-modal-box${wide ? ' wide' : ''}`}>
        <div className="sa-modal-h">
          <h2>{title}</h2>
          <button className="sa-x" aria-label="Close" onClick={onClose}><SaIcon name="x" /></button>
        </div>
        <div className="sa-modal-b">{children}</div>
        {footer && <div className="sa-modal-f">{footer}</div>}
      </div>
    </div>
  );
}

/** Confirmation dialog; `confirmText` makes the user type a value (e.g. an email) first. */
export function Confirm({ title, body, action, tone = 'dark', confirmText, busy, onConfirm, onClose, errors }: {
  title: string; body: ReactNode; action: string; tone?: 'dark' | 'danger'; confirmText?: string; busy?: boolean;
  onConfirm: () => void; onClose: () => void; errors?: string[];
}) {
  const [typed, setTyped] = useState('');
  const blocked = !!confirmText && typed.trim().toLowerCase() !== confirmText.toLowerCase();
  return (
    <Modal title={title} onClose={onClose} footer={
      <>
        <button className="btn" onClick={onClose} disabled={busy}>Cancel</button>
        <button className={`btn ${tone === 'danger' ? 'sa-danger' : 'dark'}`} onClick={onConfirm} disabled={busy || blocked}>
          {busy && <span className="spin" />}{action}
        </button>
      </>
    }>
      <div className="sa-confirm">{body}</div>
      {confirmText && (
        <div className="field" style={{ marginTop: 14 }}>
          <label htmlFor="sa-confirm-input">Type <b className="mono">{confirmText}</b> to confirm</label>
          <input id="sa-confirm-input" className="input" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
        </div>
      )}
      <ErrorList errors={errors} />
    </Modal>
  );
}

export function ErrorList({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <div className="alert sa-errors" role="alert">
      {errors.length === 1 ? errors[0] : <ul>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>}
    </div>
  );
}

// ─── Bits ────────────────────────────────────────────────────────────────────

export function RoleChip({ role }: { role: string }) {
  const m = ROLE_META[role] ?? { label: role, tone: '' };
  return <span className={`chip sa-role ${m.tone}`}>{m.label}</span>;
}

export function Pagination({ page, pages, total, onPage }: { page: number; pages: number; total: number; onPage: (p: number) => void }) {
  if (total === 0) return null;
  return (
    <div className="sa-pager">
      <span className="t2">{total.toLocaleString()} total · page {page} of {pages}</span>
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="btn sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button>
        <button className="btn sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</button>
      </div>
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder, label }: { value: string; onChange: (v: string) => void; placeholder: string; label: string }) {
  return (
    <div className="sa-search">
      <SaIcon name="search" size={15} />
      <input className="input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={label} />
      {value && <button aria-label="Clear search" onClick={() => onChange('')}><SaIcon name="x" size={14} /></button>}
    </div>
  );
}

/** Value that settles `ms` after the last change (for search boxes). */
export function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return <div className="sa-loading"><span className="spin" />{label}</div>;
}

export function Empty({ icon = 'list', title, children, action }: { icon?: string; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty">
      <span className="ico indigo"><SaIcon name={icon} size={22} /></span>
      <b>{title}</b>
      {children}
      {action && <div style={{ marginTop: 14 }}>{action}</div>}
    </div>
  );
}
