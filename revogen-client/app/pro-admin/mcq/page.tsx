'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { errorMessages, fmtDate, Mcq, Paged, qs, sa } from '@/components/super-admin/api';
import { Confirm, Empty, ErrorList, Loading, Modal, Pagination, SaIcon, SearchBox, useDebounced, useToast } from '@/components/super-admin/ui';

const LETTERS = ['A', 'B', 'C', 'D'] as const;
type Letter = (typeof LETTERS)[number];
interface Form { category: string; question: string; options: Record<Letter, string>; correct: Letter | '' }
const EMPTY: Form = { category: '', question: '', options: { A: '', B: '', C: '', D: '' }, correct: '' };
const LIMITS = { category: 60, question: 2000, option: 500 };

const letterOf = (q: Mcq): Letter | '' => {
  const i = [q.optionA, q.optionB, q.optionC, q.optionD].findIndex((o) => o.trim() === q.correctAnswer.trim());
  if (i >= 0) return LETTERS[i];
  return /^[ABCD]$/i.test(q.correctAnswer.trim()) ? (q.correctAnswer.trim().toUpperCase() as Letter) : '';
};

/** Same rules as the server (question-bank/mcq-input.ts), shown while typing. */
function checkForm(f: Form): Record<string, string> {
  const e: Record<string, string> = {};
  const cat = f.category.trim();
  if (!cat) e.category = 'Category is required.';
  else if (cat.length > LIMITS.category) e.category = `At most ${LIMITS.category} characters.`;
  else if (!/^[\p{L}\p{N} .+#&/()_-]+$/u.test(cat)) e.category = 'Use letters, numbers, spaces and . + # & / ( ) _ -';
  if (f.question.trim().length < 5) e.question = 'At least 5 characters.';
  else if (f.question.length > LIMITS.question) e.question = `At most ${LIMITS.question} characters.`;
  const seen = new Map<string, Letter>();
  LETTERS.forEach((l) => {
    const v = f.options[l].trim();
    if (!v) e[l] = 'Required.';
    else if (v.length > LIMITS.option) e[l] = `At most ${LIMITS.option} characters.`;
    else if (seen.has(v.toLowerCase())) e[l] = `Same as option ${seen.get(v.toLowerCase())}.`;
    else seen.set(v.toLowerCase(), l);
  });
  if (!f.correct) e.correct = 'Mark the correct option.';
  return e;
}

export default function McqPage() {
  return <Suspense fallback={<Loading />}><McqBank /></Suspense>;
}

function McqBank() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const debounced = useDebounced(search);
  const [category, setCategory] = useState(params.get('category') ?? '');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paged<Mcq> | null>(null);
  const [categories, setCategories] = useState<{ category: string; count: number }[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [editing, setEditing] = useState<{ id?: string; form: Form } | null>(
    params.get('new') ? { form: { ...EMPTY, category: params.get('category') ?? '' } } : null,
  );
  const [deleting, setDeleting] = useState<Mcq | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();
    const load = async () => {
      try {
        const [list, cats] = await Promise.all([
          sa<Paged<Mcq>>(`/mcq${qs({ search: debounced.trim(), category, page, pageSize: 20 })}`, { signal: ctrl.signal }),
          sa<{ category: string; count: number }[]>('/mcq/categories', { signal: ctrl.signal }),
        ]);
        setData(list);
        setCategories(cats);
        setErrors([]);
      } catch (e) {
        if ((e as Error)?.name !== 'AbortError') setErrors(errorMessages(e));
      }
    };
    load();
    return () => ctrl.abort();
  }, [debounced, category, page, reload]);

  const refresh = useCallback(() => setReload((n) => n + 1), []);

  const closeEditor = () => {
    setEditing(null);
    if (params.get('new')) router.replace('/pro-admin/mcq');
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await sa(`/mcq/${deleting.id}`, { method: 'DELETE' });
      toast('Question deleted.');
      setDeleting(null);
      refresh();
    } catch (e) {
      toast(errorMessages(e).join(' '), 'bad');
    } finally {
      setDeleteBusy(false);
    }
  };

  const total = categories.reduce((n, c) => n + c.count, 0);

  return (
    <div className="fade">
      <div className="sa-head">
        <div>
          <h1>MCQ bank</h1>
          <p>{total.toLocaleString()} questions across {categories.length} subjects. Practice tests draw from here by subject name.</p>
        </div>
        <div className="act">
          <button className="btn" onClick={() => setBulkOpen(true)}><SaIcon name="upload" size={16} />Bulk import</button>
          <button className="btn dark" onClick={() => setEditing({ form: { ...EMPTY, category } })}><SaIcon name="plus" size={16} />New question</button>
        </div>
      </div>

      <div className="tile line">
        <div className="sa-toolbar">
          <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search question or options" label="Search questions" />
          <select className="input" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} aria-label="Filter by subject">
            <option value="">All subjects</option>
            {categories.map((c) => <option key={c.category} value={c.category}>{c.category} ({c.count})</option>)}
          </select>
        </div>

        <ErrorList errors={errors} />
        {!data ? <Loading /> : data.items.length === 0 ? (
          <Empty title={search || category ? 'No questions match' : 'No questions yet'}
            action={<button className="btn dark" onClick={() => setEditing({ form: { ...EMPTY, category } })}><SaIcon name="plus" size={16} />Add a question</button>}>
            {search || category ? 'Try another search or subject.' : 'Add one, or bulk import a CSV.'}
          </Empty>
        ) : (
          <>
            <div className="sa-table-wrap">
              <table className="sa-table">
                <thead><tr><th>Question</th><th>Subject</th><th>Answer</th><th>Added</th><th className="act-col"><span className="sr-only">Actions</span></th></tr></thead>
                <tbody>
                  {data.items.map((q) => {
                    const l = letterOf(q);
                    return (
                      <tr key={q.id}>
                        <td><div className="sa-clamp">{q.question}</div></td>
                        <td><span className="chip">{q.category}</span></td>
                        <td>
                          <span className="chip green" title={q.correctAnswer}>{l || '?'}</span>{' '}
                          <span className="t2" style={{ display: 'inline' }}>{q.correctAnswer.length > 28 ? `${q.correctAnswer.slice(0, 28)}…` : q.correctAnswer}</span>
                        </td>
                        <td className="t2" style={{ whiteSpace: 'nowrap' }}>{fmtDate(q.createdAt)}</td>
                        <td className="act-col">
                          <button className="sa-icon-btn" aria-label="Edit question" title="Edit"
                            onClick={() => setEditing({ id: q.id, form: { category: q.category, question: q.question, options: { A: q.optionA, B: q.optionB, C: q.optionC, D: q.optionD }, correct: l } })}>
                            <SaIcon name="edit" size={16} />
                          </button>
                          <button className="sa-icon-btn danger" aria-label="Delete question" title="Delete" onClick={() => setDeleting(q)}>
                            <SaIcon name="trash" size={16} />
                          </button>
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

      {editing && (
        <McqEditor
          key={editing.id ?? 'new'}
          id={editing.id}
          initial={editing.form}
          categories={categories.map((c) => c.category)}
          onClose={closeEditor}
          onSaved={(again, last) => {
            refresh();
            if (again) setEditing({ form: { ...EMPTY, category: last.category } });
            else closeEditor();
          }}
        />
      )}

      {deleting && (
        <Confirm title="Delete this question?" tone="danger" action="Delete" busy={deleteBusy}
          body={<><p>“{deleting.question.slice(0, 160)}{deleting.question.length > 160 ? '…' : ''}”</p><p className="t2">It will no longer be drawn for practice tests. Tests that already copied it keep their copy.</p></>}
          onConfirm={confirmDelete} onClose={() => setDeleting(null)} />
      )}

      {bulkOpen && <BulkImport onClose={() => setBulkOpen(false)} onImported={refresh} />}
    </div>
  );
}

function McqEditor({ id, initial, categories, onClose, onSaved }: {
  id?: string; initial: Form; categories: string[]; onClose: () => void; onSaved: (again: boolean, last: Form) => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState<Form>(initial);
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const fieldErrors = useMemo(() => checkForm(form), [form]);
  const show = (k: string) => (touched ? fieldErrors[k] : undefined);

  const save = async (again: boolean) => {
    setTouched(true);
    if (Object.keys(fieldErrors).length) return;
    setBusy(true);
    setServerErrors([]);
    const body = {
      category: form.category.trim(),
      question: form.question.trim(),
      optionA: form.options.A.trim(),
      optionB: form.options.B.trim(),
      optionC: form.options.C.trim(),
      optionD: form.options.D.trim(),
      correctAnswer: form.correct,
    };
    try {
      await sa(id ? `/mcq/${id}` : '/mcq', { method: id ? 'PUT' : 'POST', body });
      toast(id ? 'Question updated.' : 'Question added.');
      onSaved(again, form);
    } catch (e) {
      setServerErrors(errorMessages(e));
    } finally {
      setBusy(false);
    }
  };

  const setOpt = (l: Letter, v: string) => setForm((f) => ({ ...f, options: { ...f.options, [l]: v } }));

  return (
    <Modal wide title={id ? 'Edit MCQ' : 'New MCQ'} onClose={onClose} footer={
      <>
        <span className="t2" style={{ marginRight: 'auto', alignSelf: 'center' }}>Click a letter to mark the correct answer.</span>
        <button className="btn" onClick={onClose} disabled={busy}>Cancel</button>
        {!id && <button className="btn" onClick={() => save(true)} disabled={busy}>Save and add another</button>}
        <button className="btn dark" onClick={() => save(false)} disabled={busy}>{busy && <span className="spin" />}{id ? 'Save changes' : 'Save question'}</button>
      </>
    }>
      <form className="sa-form" onSubmit={(e) => { e.preventDefault(); save(false); }}>
        <div className={`field${show('category') ? ' err' : ''}`}>
          <div className="lab"><label htmlFor="mcq-cat">Subject</label><span className="hint">Must match the practice test subject, e.g. Java, SQL</span></div>
          <input id="mcq-cat" className="input" list="mcq-cats" value={form.category} maxLength={LIMITS.category + 10}
            onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Java" />
          <datalist id="mcq-cats">{categories.map((c) => <option key={c} value={c} />)}</datalist>
          {show('category') && <span className="msg">{show('category')}</span>}
        </div>
        <div className={`field${show('question') ? ' err' : ''}`}>
          <div className="lab"><label htmlFor="mcq-q">Question</label><span className="count">{form.question.length}/{LIMITS.question}</span></div>
          <textarea id="mcq-q" className="input" rows={4} value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })}
            placeholder="Which keyword prevents a method from being overridden in Java?" />
          {show('question') && <span className="msg">{show('question')}</span>}
        </div>
        <div className="sa-form-2">
          {LETTERS.map((l) => (
            <div key={l} className={`field${show(l) ? ' err' : ''}`}>
              <div className="sa-opt">
                <button type="button" className={`sa-opt-l${form.correct === l ? ' on' : ''}`} onClick={() => setForm({ ...form, correct: l })}
                  aria-pressed={form.correct === l} aria-label={`Mark option ${l} as correct`} title="Mark as correct">
                  {form.correct === l ? <SaIcon name="check" size={16} /> : l}
                </button>
                <input className="input" value={form.options[l]} onChange={(e) => setOpt(l, e.target.value)} placeholder={`Option ${l}`} aria-label={`Option ${l}`} />
              </div>
              {show(l) && <span className="msg" style={{ paddingLeft: 44 }}>{show(l)}</span>}
            </div>
          ))}
        </div>
        {show('correct') && <span className="msg" style={{ color: 'var(--rose)', fontSize: 13 }}>{show('correct')}</span>}
        <button type="submit" hidden />
      </form>
      <ErrorList errors={serverErrors} />
    </Modal>
  );
}

// ─── Bulk import ─────────────────────────────────────────────────────────────

const HEADERS = ['category', 'question', 'optionA', 'optionB', 'optionC', 'optionD', 'correctAnswer'];
const TEMPLATE = `${HEADERS.join(',')}\nJava,"Which keyword prevents a method from being overridden?",static,final,private,abstract,B\nSQL,Which clause filters grouped rows?,WHERE,HAVING,ORDER BY,LIMIT,HAVING\n`;

/** RFC 4180-style CSV: quoted fields, escaped quotes, commas and newlines inside quotes. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  const src = text.replace(/^﻿/, '');
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"' && field === '') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((v) => v.trim() !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((v) => v.trim() !== '')) rows.push(row);
  return rows;
}

interface BulkReport {
  dryRun: boolean; total: number; valid: number; invalid: number; duplicates: number; created: number;
  report: { row: number; status: 'ok' | 'invalid' | 'duplicate'; errors: string[]; question?: string }[];
}

function BulkImport({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const toast = useToast();
  const [text, setText] = useState('');
  const [report, setReport] = useState<BulkReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const rows = useMemo(() => {
    const grid = parseCsv(text);
    if (!grid.length) return { items: [] as Record<string, string>[], headerError: '' };
    const header = grid[0].map((h) => h.trim());
    const missing = HEADERS.filter((h) => !header.some((x) => x.toLowerCase() === h.toLowerCase()));
    if (missing.length) return { items: [], headerError: `The first row must be the header. Missing: ${missing.join(', ')}.` };
    const idx = HEADERS.map((h) => header.findIndex((x) => x.toLowerCase() === h.toLowerCase()));
    return { items: grid.slice(1).map((r) => Object.fromEntries(HEADERS.map((h, i) => [h, (r[idx[i]] ?? '').trim()]))), headerError: '' };
  }, [text]);

  const run = async (dryRun: boolean) => {
    setBusy(true);
    setErrors([]);
    try {
      const r = await sa<BulkReport>('/mcq/bulk', { method: 'POST', body: { rows: rows.items, dryRun } });
      setReport(r);
      if (!dryRun) {
        toast(`Imported ${r.created} question${r.created === 1 ? '' : 's'}.`);
        onImported();
      }
    } catch (e) {
      setErrors(errorMessages(e));
    } finally {
      setBusy(false);
    }
  };

  const onFile = async (file?: File) => {
    if (!file) return;
    if (file.size > 2_000_000) { setErrors(['That file is larger than 2 MB. Split it into smaller files.']); return; }
    setText(await file.text());
    setReport(null);
  };

  const checked = report?.dryRun ? report : null;
  const done = report && !report.dryRun ? report : null;

  return (
    <Modal wide title="Bulk import MCQs" onClose={onClose} footer={
      done ? <button className="btn dark" onClick={onClose}>Done</button> : (
        <>
          <button className="btn" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn" onClick={() => run(true)} disabled={busy || !rows.items.length}>{busy && !checked && <span className="spin" />}Check {rows.items.length || ''} rows</button>
          <button className="btn dark" onClick={() => run(false)} disabled={busy || !checked || checked.valid === 0}>
            {busy && checked && <span className="spin" />}Import {checked ? checked.valid : ''} valid
          </button>
        </>
      )
    }>
      {done ? (
        <div className="alert ok">Imported {done.created} question{done.created === 1 ? '' : 's'}. Skipped {done.invalid} invalid and {done.duplicates} duplicate row{done.invalid + done.duplicates === 1 ? '' : 's'}.</div>
      ) : (
        <>
          <p className="t2" style={{ marginTop: 0 }}>
            Paste CSV or choose a file. Columns: <span className="mono">{HEADERS.join(', ')}</span>. The answer can be a letter (A–D) or the option&apos;s text. Up to 500 rows; duplicates are skipped.
          </p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            <label className="btn sm"><SaIcon name="upload" size={14} />Choose CSV file
              <input type="file" accept=".csv,text/csv" hidden onChange={(e) => onFile(e.target.files?.[0])} />
            </label>
            <a className="btn sm ghost" href={`data:text/csv;charset=utf-8,${encodeURIComponent(TEMPLATE)}`} download="mcq-template.csv">Download template</a>
          </div>
          <textarea className="input mono" rows={9} value={text} onChange={(e) => { setText(e.target.value); setReport(null); }} placeholder={TEMPLATE} aria-label="CSV data" />
          {rows.headerError && <div className="alert" style={{ marginTop: 10 }}>{rows.headerError}</div>}
        </>
      )}
      <ErrorList errors={errors} />
      {report && (
        <>
          <div className="chips" style={{ marginTop: 14 }}>
            <span className="chip green">{report.valid} valid</span>
            <span className={`chip ${report.invalid ? 'rose' : ''}`}>{report.invalid} invalid</span>
            <span className={`chip ${report.duplicates ? 'amber' : ''}`}>{report.duplicates} duplicates</span>
          </div>
          {report.report.some((r) => r.status !== 'ok') && (
            <div className="sa-bulk-report">
              <table className="sa-table">
                <thead><tr><th>Line</th><th>Status</th><th>Problem</th></tr></thead>
                <tbody>
                  {report.report.filter((r) => r.status !== 'ok').map((r) => (
                    <tr key={r.row}>
                      <td className="num-col">{r.row + 1}</td>
                      <td><span className={`chip ${r.status === 'invalid' ? 'rose' : 'amber'}`}>{r.status === 'invalid' ? 'Invalid' : 'Duplicate'}</span></td>
                      <td>{r.question && <div className="t2" style={{ marginTop: 0 }}>{r.question}</div>}{r.errors.join(' ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
