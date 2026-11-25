'use client';

// Create / edit a coding question: details, test cases, starter code, a reference
// solution runner (checks test cases through Judge0), and a candidate-view preview.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CodingQuestion, errorMessages, LANGUAGE_META, sa, timeAgo, VALIDATOR_META } from './api';
import { Confirm, ErrorList, Loading, SaIcon, useToast } from './ui';

const Monaco = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => <div className="sa-loading" style={{ padding: 30 }}><span className="spin" />Loading editor…</div>,
});

type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
interface Case { k: number; input: string; expectedOutput: string; explanation: string; isHidden: boolean }
interface Form {
  title: string; slug: string; category: string; difficulty: Difficulty; description: string;
  inputFormat: string; outputFormat: string; constraints: string;
  starterCodes: Record<string, string>; outputValidator: string; floatPrecision: number; testCases: Case[];
}
interface RunResult { index: number; status: string; ran: boolean; output: string; error: string | null; time: string | null; memory: number | null; matches: boolean | null }

const LIMITS = { title: 150, description: 20000, text: 5000, cases: 100, starter: 20000 };
const TABS = ['Details', 'Test cases', 'Starter code', 'Reference solution', 'Preview'] as const;
type Tab = (typeof TABS)[number];

const TEMPLATES: Record<string, string> = {
  python: 'import sys\n\ndef solve(data):\n    # write your solution here\n    return ""\n\nif __name__ == "__main__":\n    print(solve(sys.stdin.read()))\n',
  javascript: "const data = require('fs').readFileSync(0, 'utf8');\n\nfunction solve(input) {\n  // write your solution here\n  return '';\n}\n\nconsole.log(solve(data));\n",
  java: 'import java.util.*;\nimport java.io.*;\n\npublic class Solution {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // write your solution here\n    }\n}\n',
  cpp: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // write your solution here\n    return 0;\n}\n',
  c: '#include <stdio.h>\n\nint main(void) {\n    // write your solution here\n    return 0;\n}\n',
};

let seq = 0;
const newCase = (isHidden = false, input = '', expectedOutput = ''): Case => ({ k: ++seq, input, expectedOutput, explanation: '', isHidden });

const blank = (): Form => ({
  title: '', slug: '', category: '', difficulty: 'EASY', description: '', inputFormat: '', outputFormat: '', constraints: '',
  starterCodes: {}, outputValidator: 'EXACT', floatPrecision: 6, testCases: [newCase(false), newCase(true)],
});

const fromQuestion = (q: CodingQuestion): Form => ({
  title: q.title, slug: q.slug, category: q.category, difficulty: q.difficulty, description: q.description,
  inputFormat: q.inputFormat ?? '', outputFormat: q.outputFormat ?? '', constraints: q.constraints ?? '',
  starterCodes: { ...(q.starterCodes ?? {}) }, outputValidator: q.outputValidator, floatPrecision: q.floatPrecision,
  testCases: q.testCases.map((t) => ({ k: ++seq, input: t.input, expectedOutput: t.expectedOutput, explanation: t.explanation ?? '', isHidden: t.isHidden })),
});

/** What gets sent (and compared to detect unsaved changes). */
const payload = (f: Form) => ({
  title: f.title.trim(),
  ...(f.slug.trim() ? { slug: f.slug.trim() } : {}),
  category: f.category.trim(),
  difficulty: f.difficulty,
  description: f.description.trim(),
  inputFormat: f.inputFormat.trim() || undefined,
  outputFormat: f.outputFormat.trim() || undefined,
  constraints: f.constraints.trim() || undefined,
  starterCodes: Object.fromEntries(Object.entries(f.starterCodes).filter(([, v]) => v.trim())),
  outputValidator: f.outputValidator,
  floatPrecision: f.floatPrecision,
  testCases: f.testCases.map((t) => ({ input: t.input, expectedOutput: t.expectedOutput, isHidden: t.isHidden, ...(t.explanation.trim() ? { explanation: t.explanation.trim() } : {}) })),
});

/** Same rules as the server DTO + service; field → message. */
function validate(f: Form): Record<string, string> {
  const e: Record<string, string> = {};
  if (f.title.trim().length < 3) e.title = 'Title must be at least 3 characters.';
  else if (f.title.length > LIMITS.title) e.title = `At most ${LIMITS.title} characters.`;
  if (f.slug.trim() && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(f.slug.trim())) e.slug = 'Lowercase letters, numbers and single dashes only.';
  const cat = f.category.trim();
  if (cat.length < 2 || cat.length > 40) e.category = 'Category must be 2–40 characters.';
  else if (!/^[A-Za-z0-9 _&+./-]+$/.test(cat)) e.category = 'Letters, numbers, spaces and _ & + . / - only.';
  if (f.description.trim().length < 10) e.description = 'Description must be at least 10 characters.';
  else if (f.description.length > LIMITS.description) e.description = 'Description is too long.';
  (['inputFormat', 'outputFormat', 'constraints'] as const).forEach((k) => { if (f[k].length > LIMITS.text) e[k] = 'Too long (5000 characters max).'; });
  if (!Number.isInteger(f.floatPrecision) || f.floatPrecision < 0 || f.floatPrecision > 12) e.floatPrecision = 'Whole number from 0 to 12.';
  if (!f.testCases.length) e.testCases = 'Add at least one test case.';
  else if (f.testCases.length > LIMITS.cases) e.testCases = `At most ${LIMITS.cases} test cases.`;
  else if (!f.testCases.some((t) => !t.isHidden)) e.testCases = 'Add at least one visible (sample) test case.';
  f.testCases.forEach((t, i) => { if (!t.expectedOutput.trim()) e[`case-${t.k}`] = `Test case ${i + 1}: expected output is empty.`; });
  Object.entries(f.starterCodes).forEach(([l, v]) => { if (v.length > LIMITS.starter) e[`starter-${l}`] = `Starter code for ${l} is too long.`; });
  return e;
}

/** Which tab a validation error belongs to. */
const DETAIL_FIELDS = ['title', 'slug', 'category', 'description', 'inputFormat', 'outputFormat', 'constraints'];
const TAB_OF = (k: string): Tab | null =>
  DETAIL_FIELDS.includes(k) ? 'Details'
    : k === 'testCases' || k === 'floatPrecision' || k.startsWith('case-') ? 'Test cases'
      : k.startsWith('starter-') ? 'Starter code' : null;

const slugify = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 150);

export default function CodingEditor({ id }: { id?: string }) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<Form | null>(id ? null : blank());
  const [saved, setSaved] = useState<string>(id ? '' : JSON.stringify(payload(blank())));
  const [info, setInfo] = useState<Pick<CodingQuestion, 'usedIn' | 'submissions' | 'updatedAt'> | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [loadErrors, setLoadErrors] = useState<string[]>([]);
  const [tab, setTab] = useState<Tab>('Details');
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteErrors, setDeleteErrors] = useState<string[]>([]);
  const [dark, setDark] = useState(false);

  // Reference solution (not saved — only used to check test cases).
  const [refLang, setRefLang] = useState('python');
  const [refCode, setRefCode] = useState<Record<string, string>>({});
  const [running, setRunning] = useState(false);
  const [runResults, setRunResults] = useState<{ byKey: Record<number, RunResult>; at: number } | null>(null);
  const [runErrors, setRunErrors] = useState<string[]>([]);
  const [starterLang, setStarterLang] = useState('python');

  useEffect(() => {
    const t = setTimeout(() => setDark(document.documentElement.getAttribute('data-bx-theme') === 'dark'), 0);
    const load = async () => {
      try {
        const meta = await sa<{ categories: string[] }>('/coding/meta');
        setCategories(meta.categories);
        if (id) {
          const q = await sa<CodingQuestion>(`/coding/${id}`);
          const f = fromQuestion(q);
          setForm(f);
          setSaved(JSON.stringify(payload(f)));
          setInfo({ usedIn: q.usedIn, submissions: q.submissions, updatedAt: q.updatedAt });
        }
      } catch (e) {
        setLoadErrors(errorMessages(e));
      }
    };
    load();
    return () => clearTimeout(t);
  }, [id]);

  const errors = useMemo(() => (form ? validate(form) : {}), [form]);
  const dirty = !!form && JSON.stringify(payload(form)) !== saved;

  // Warn before leaving with unsaved changes.
  const dirtyRef = useRef(false);
  useEffect(() => { dirtyRef.current = dirty; }, [dirty]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirtyRef.current) e.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);

  const set = useCallback(<K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => (f ? { ...f, [k]: v } : f)), []);
  const setCase = (k: number, patch: Partial<Case>) => setForm((f) => (f ? { ...f, testCases: f.testCases.map((t) => (t.k === k ? { ...t, ...patch } : t)) } : f));
  const moveCase = (k: number, dir: -1 | 1) => setForm((f) => {
    if (!f) return f;
    const i = f.testCases.findIndex((t) => t.k === k);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= f.testCases.length) return f;
    const list = [...f.testCases];
    [list[i], list[j]] = [list[j], list[i]];
    return { ...f, testCases: list };
  });

  if (loadErrors.length) {
    return (
      <div>
        <Link href="/pro-admin/coding" className="sa-crumb"><SaIcon name="back" size={14} />Coding bank</Link>
        <ErrorList errors={loadErrors} />
      </div>
    );
  }
  if (!form) return <Loading label="Loading question…" />;

  const visible = form.testCases.filter((t) => !t.isHidden).length;
  const hidden = form.testCases.length - visible;
  const starterCount = LANGUAGE_META.filter((l) => form.starterCodes[l.id]?.trim()).length;
  const errorCount = Object.keys(errors).length;
  const show = (k: string) => (touched ? errors[k] : undefined);
  const tabErrors = (t: Tab) => Object.keys(errors).some((k) => TAB_OF(k) === t);
  const tabHasError = (t: Tab) => touched && tabErrors(t);

  const save = async () => {
    setTouched(true);
    if (errorCount) {
      const first = TABS.find((t) => tabErrors(t));
      if (first) setTab(first);
      toast(`Fix ${errorCount} problem${errorCount === 1 ? '' : 's'} before saving.`, 'bad');
      return;
    }
    setSaving(true);
    setServerErrors([]);
    try {
      const body = payload(form);
      const q = await sa<CodingQuestion>(id ? `/coding/${id}` : '/coding', { method: id ? 'PUT' : 'POST', body });
      const f = fromQuestion(q);
      setForm(f);
      setSaved(JSON.stringify(payload(f)));
      setInfo({ usedIn: q.usedIn, submissions: q.submissions, updatedAt: q.updatedAt });
      setRunResults(null);
      toast(id ? 'Changes saved.' : 'Coding question created.');
      if (!id) router.replace(`/pro-admin/coding/${q.id}`);
    } catch (e) {
      setServerErrors(errorMessages(e));
    } finally {
      setSaving(false);
    }
  };

  const runReference = async () => {
    const code = refCode[refLang] ?? '';
    if (!code.trim()) { setRunErrors(['Write a reference solution first.']); return; }
    if (form.testCases.length > 50) { setRunErrors(['The runner checks up to 50 test cases at a time.']); return; }
    setRunning(true);
    setRunErrors([]);
    try {
      const r = await sa<{ results: RunResult[] }>('/coding/run', {
        method: 'POST',
        body: {
          language: refLang, sourceCode: code, outputValidator: form.outputValidator, floatPrecision: form.floatPrecision,
          testCases: form.testCases.map((t) => ({ input: t.input, ...(t.expectedOutput.trim() ? { expectedOutput: t.expectedOutput } : {}) })),
        },
      });
      const byKey: Record<number, RunResult> = {};
      r.results.forEach((res) => { const c = form.testCases[res.index]; if (c) byKey[c.k] = res; });
      setRunResults({ byKey, at: Date.now() });
    } catch (e) {
      setRunErrors(errorMessages(e));
    } finally {
      setRunning(false);
    }
  };

  const fillFromRun = (onlyEmpty: boolean) => {
    if (!runResults) return;
    let n = 0;
    setForm((f) => f && ({
      ...f,
      testCases: f.testCases.map((t) => {
        const r = runResults.byKey[t.k];
        if (!r?.ran || (onlyEmpty && t.expectedOutput.trim())) return t;
        if (t.expectedOutput !== r.output) n++;
        return { ...t, expectedOutput: r.output };
      }),
    }));
    setTimeout(() => toast(n ? `Filled ${n} expected output${n === 1 ? '' : 's'} from the reference solution.` : 'Nothing to fill.', n ? 'ok' : 'info'), 0);
  };

  const confirmDelete = async () => {
    if (!id) return;
    setDeleteBusy(true);
    setDeleteErrors([]);
    try {
      await sa(`/coding/${id}`, { method: 'DELETE' });
      setSaved(JSON.stringify(payload(form)));
      dirtyRef.current = false;
      toast('Coding question deleted.');
      router.replace('/pro-admin/coding');
    } catch (e) {
      setDeleteErrors(errorMessages(e));
    } finally {
      setDeleteBusy(false);
    }
  };

  const runSummary = runResults ? Object.values(runResults.byKey) : [];
  const runMatched = runSummary.filter((r) => r.matches === true).length;
  const runCompared = runSummary.filter((r) => r.matches !== null).length;
  const runFailed = runSummary.filter((r) => !r.ran).length;

  const checks: { ok: boolean | 'warn'; text: string }[] = [
    { ok: !errors.title, text: 'Title' },
    { ok: !errors.description, text: 'Problem description' },
    { ok: visible > 0, text: `${visible} visible sample case${visible === 1 ? '' : 's'}` },
    { ok: hidden > 0 ? true : 'warn', text: hidden > 0 ? `${hidden} hidden case${hidden === 1 ? '' : 's'}` : 'No hidden cases — candidates could hard-code the samples' },
    { ok: !Object.keys(errors).some((k) => k.startsWith('case-')), text: 'Every case has an expected output' },
    { ok: starterCount === LANGUAGE_META.length ? true : 'warn', text: `Starter code for ${starterCount}/${LANGUAGE_META.length} languages` },
    { ok: runResults ? (runCompared > 0 && runMatched === runCompared && runFailed === 0 ? true : false) : 'warn', text: runResults ? `Reference solution: ${runMatched}/${runCompared} match${runFailed ? `, ${runFailed} failed to run` : ''}` : 'Not checked with a reference solution' },
  ];

  return (
    <div className="fade">
      <Link href="/pro-admin/coding" className="sa-crumb"><SaIcon name="back" size={14} />Coding bank</Link>
      <div className="sa-head">
        <div>
          <h1>{id ? form.title || 'Untitled question' : 'New coding question'}</h1>
          <p>
            {id && info ? <>Last saved {timeAgo(info.updatedAt)} · used in {info.usedIn.length} test{info.usedIn.length === 1 ? '' : 's'}</> : 'Write the problem, add test cases, then check them with a reference solution.'}
          </p>
        </div>
        <div className="act">
          {id && <button className="btn sa-danger-ghost" onClick={() => { setDeleteErrors([]); setDeleting(true); }}><SaIcon name="trash" size={16} />Delete</button>}
          <button className="btn dark" onClick={save} disabled={saving || (!dirty && !!id)}>{saving && <span className="spin" />}{id ? 'Save changes' : 'Create question'}</button>
        </div>
      </div>

      {id && info && info.usedIn.length > 0 && (
        <div className="alert info" style={{ marginBottom: 14 }}>
          Used in {info.usedIn.slice(0, 3).map((t) => `“${t.title}”`).join(', ')}{info.usedIn.length > 3 ? ` and ${info.usedIn.length - 3} more` : ''}. Changes to test cases apply to new submissions straight away.
        </div>
      )}

      <div className="sa-editor">
        <div className="tile line">
          <div className="sa-tabs" role="tablist">
            {TABS.map((t) => (
              <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>
                {t}
                {t === 'Test cases' && <span className="chip">{form.testCases.length}</span>}
                {t === 'Starter code' && <span className="chip">{starterCount}/{LANGUAGE_META.length}</span>}
                {tabHasError(t) && <span className="sa-dot bad" aria-label="has problems" />}
              </button>
            ))}
          </div>

          {tab === 'Details' && (
            <div className="sa-form">
              <div className="sa-form-2">
                <div className={`field${show('title') ? ' err' : ''}`}>
                  <div className="lab"><label htmlFor="cq-title">Title</label><span className="count">{form.title.length}/{LIMITS.title}</span></div>
                  <input id="cq-title" className="input" value={form.title} placeholder="Two Sum"
                    onChange={(e) => setForm({ ...form, title: e.target.value, ...(id ? {} : { slug: form.slug && form.slug !== slugify(form.title) ? form.slug : slugify(e.target.value) }) })} />
                  {show('title') && <span className="msg">{show('title')}</span>}
                </div>
                <div className={`field${show('slug') ? ' err' : ''}`}>
                  <div className="lab"><label htmlFor="cq-slug">Slug</label><span className="hint">Unique ID in URLs; made from the title</span></div>
                  <input id="cq-slug" className="input mono" value={form.slug} placeholder="two-sum" onChange={(e) => set('slug', e.target.value.toLowerCase())} />
                  {show('slug') && <span className="msg">{show('slug')}</span>}
                </div>
              </div>
              <div className="sa-form-2">
                <div className={`field${show('category') ? ' err' : ''}`}>
                  <label htmlFor="cq-cat">Category</label>
                  <input id="cq-cat" className="input" list="cq-cats" value={form.category} placeholder="ARRAYS" onChange={(e) => set('category', e.target.value)} />
                  <datalist id="cq-cats">{categories.map((c) => <option key={c} value={c} />)}</datalist>
                  {show('category') && <span className="msg">{show('category')}</span>}
                </div>
                <div className="field">
                  <label>Difficulty</label>
                  <div className="seg" role="radiogroup" aria-label="Difficulty">
                    {(['EASY', 'MEDIUM', 'HARD'] as Difficulty[]).map((d) => (
                      <button key={d} type="button" role="radio" aria-checked={form.difficulty === d} className={form.difficulty === d ? 'on' : ''} onClick={() => set('difficulty', d)}>
                        {d[0] + d.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className={`field${show('description') ? ' err' : ''}`}>
                <div className="lab"><label htmlFor="cq-desc">Problem description</label><span className="count">{form.description.length.toLocaleString()}/{LIMITS.description.toLocaleString()}</span></div>
                <textarea id="cq-desc" className="input" rows={8} value={form.description} onChange={(e) => set('description', e.target.value)}
                  placeholder="Given an array of integers and a target, print the indices of the two numbers that add up to the target." />
                {show('description') && <span className="msg">{show('description')}</span>}
              </div>
              <div className="sa-form-3">
                {([['inputFormat', 'Input format', 'First line: n. Second line: n integers.'], ['outputFormat', 'Output format', 'Two indices separated by a space.'], ['constraints', 'Constraints', '2 ≤ n ≤ 10^5']] as const).map(([k, label, ph]) => (
                  <div key={k} className={`field${show(k) ? ' err' : ''}`}>
                    <label htmlFor={`cq-${k}`}>{label} <span className="hint">(optional)</span></label>
                    <textarea id={`cq-${k}`} className="input" rows={4} value={form[k]} placeholder={ph} onChange={(e) => set(k, e.target.value)} />
                    {show(k) && <span className="msg">{show(k)}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'Test cases' && (
            <div>
              <div className="sa-form-2" style={{ marginBottom: 16 }}>
                <div className="field">
                  <label htmlFor="cq-validator">How output is checked</label>
                  <select id="cq-validator" className="input" value={form.outputValidator} onChange={(e) => set('outputValidator', e.target.value)}>
                    {Object.entries(VALIDATOR_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <span className="hint">{VALIDATOR_META[form.outputValidator]?.hint}</span>
                </div>
                {form.outputValidator === 'FLOAT_COMPARE' && (
                  <div className={`field${show('floatPrecision') ? ' err' : ''}`}>
                    <label htmlFor="cq-prec">Decimal precision</label>
                    <input id="cq-prec" className="input" type="number" min={0} max={12} step={1} value={form.floatPrecision}
                      onChange={(e) => set('floatPrecision', e.target.value === '' ? NaN : Number(e.target.value))} />
                    <span className="hint">Answers within 10^-{Number.isFinite(form.floatPrecision) ? form.floatPrecision : 'n'} pass.</span>
                    {show('floatPrecision') && <span className="msg">{show('floatPrecision')}</span>}
                  </div>
                )}
              </div>

              {show('testCases') && <div className="alert" style={{ marginBottom: 12 }}>{show('testCases')}</div>}
              {runResults && (
                <div className={`alert ${runMatched === runCompared && !runFailed && runCompared ? 'ok' : 'info'}`} style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ flex: 1 }}>Reference run: {runMatched}/{runCompared} expected outputs match{runFailed ? `, ${runFailed} case${runFailed === 1 ? '' : 's'} failed to run` : ''}.</span>
                  <button className="btn sm" onClick={() => fillFromRun(true)}>Fill empty outputs</button>
                </div>
              )}

              {form.testCases.map((t, i) => {
                const r = runResults?.byKey[t.k];
                return (
                  <div key={t.k} className={`sa-tc${t.isHidden ? ' hidden-case' : ''}`}>
                    <div className="sa-tc-h">
                      <b>Case {i + 1}</b>
                      <span className={`chip ${t.isHidden ? 'dark' : 'sky'}`}><SaIcon name={t.isHidden ? 'eyeOff' : 'eye'} size={12} />{t.isHidden ? 'Hidden' : 'Sample'}</span>
                      {r && (r.ran
                        ? r.matches === null ? <span className="chip">Ran</span> : <span className={`chip ${r.matches ? 'green' : 'rose'}`}>{r.matches ? 'Matches reference' : 'Differs from reference'}</span>
                        : <span className="chip rose">{r.status}</span>)}
                      <span style={{ marginLeft: 'auto', display: 'flex', gap: 2, alignItems: 'center' }}>
                        <label className="sa-toggle" title="Hidden cases are scored but never shown to candidates">
                          <input type="checkbox" checked={t.isHidden} onChange={(e) => setCase(t.k, { isHidden: e.target.checked })} />Hidden
                        </label>
                        <button className="sa-icon-btn" aria-label="Move up" disabled={i === 0} onClick={() => moveCase(t.k, -1)}><SaIcon name="up" size={15} /></button>
                        <button className="sa-icon-btn" aria-label="Move down" disabled={i === form.testCases.length - 1} onClick={() => moveCase(t.k, 1)}><SaIcon name="down" size={15} /></button>
                        <button className="sa-icon-btn" aria-label="Duplicate case" onClick={() => setForm({ ...form, testCases: [...form.testCases.slice(0, i + 1), { ...t, k: ++seq }, ...form.testCases.slice(i + 1)] })}><SaIcon name="copy" size={15} /></button>
                        <button className="sa-icon-btn danger" aria-label="Remove case" disabled={form.testCases.length === 1} onClick={() => setForm({ ...form, testCases: form.testCases.filter((x) => x.k !== t.k) })}><SaIcon name="trash" size={15} /></button>
                      </span>
                    </div>
                    <div className="sa-tc-io">
                      <div className="field">
                        <label htmlFor={`in-${t.k}`}>Input (stdin)</label>
                        <textarea id={`in-${t.k}`} className="input mono" spellCheck={false} value={t.input} onChange={(e) => setCase(t.k, { input: e.target.value })} placeholder="4&#10;2 7 11 15&#10;9" />
                      </div>
                      <div className={`field${show(`case-${t.k}`) ? ' err' : ''}`}>
                        <label htmlFor={`out-${t.k}`}>Expected output</label>
                        <textarea id={`out-${t.k}`} className="input mono" spellCheck={false} value={t.expectedOutput} onChange={(e) => setCase(t.k, { expectedOutput: e.target.value })} placeholder="0 1" />
                        {show(`case-${t.k}`) && <span className="msg">Expected output is required.</span>}
                      </div>
                    </div>
                    {!t.isHidden && (
                      <div className="field" style={{ marginTop: 8 }}>
                        <input className="input" value={t.explanation} maxLength={1000} onChange={(e) => setCase(t.k, { explanation: e.target.value })} placeholder="Explanation shown with the sample (optional)" aria-label={`Explanation for case ${i + 1}`} />
                      </div>
                    )}
                    {r && !r.ran && r.error && <div className="sa-run bad">{r.error}</div>}
                    {r && r.ran && r.matches === false && <div className="sa-run info">Reference output:{'\n'}{r.output || '(empty)'}</div>}
                  </div>
                );
              })}
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <button className="btn" disabled={form.testCases.length >= LIMITS.cases} onClick={() => setForm({ ...form, testCases: [...form.testCases, newCase(false)] })}><SaIcon name="plus" size={16} />Sample case</button>
                <button className="btn" disabled={form.testCases.length >= LIMITS.cases} onClick={() => setForm({ ...form, testCases: [...form.testCases, newCase(true)] })}><SaIcon name="plus" size={16} />Hidden case</button>
                <span className="t2" style={{ alignSelf: 'center', marginLeft: 'auto' }}>{visible} sample · {hidden} hidden · max {LIMITS.cases}</span>
              </div>
            </div>
          )}

          {tab === 'Starter code' && (
            <div>
              <p className="t2" style={{ marginTop: 0 }}>The code candidates start with. Leave a language empty to give them a blank editor. Programs read from stdin and print to stdout.</p>
              <div className="sa-lang-tabs" role="tablist">
                {LANGUAGE_META.map((l) => (
                  <button key={l.id} role="tab" aria-selected={starterLang === l.id} className={starterLang === l.id ? 'on' : ''} onClick={() => setStarterLang(l.id)}>
                    {l.label}{form.starterCodes[l.id]?.trim() && <SaIcon name="check" size={13} />}
                  </button>
                ))}
              </div>
              <div className="sa-monaco">
                <Monaco height="380px" language={LANGUAGE_META.find((l) => l.id === starterLang)?.monaco} theme={dark ? 'vs-dark' : 'light'}
                  value={form.starterCodes[starterLang] ?? ''}
                  onChange={(v) => set('starterCodes', { ...form.starterCodes, [starterLang]: v ?? '' })}
                  options={{ minimap: { enabled: false }, fontSize: 13, scrollBeyondLastLine: false, tabSize: 4, automaticLayout: true }} />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                <button className="btn sm" onClick={() => set('starterCodes', { ...form.starterCodes, [starterLang]: TEMPLATES[starterLang] })}>Insert template</button>
                <button className="btn sm" onClick={() => set('starterCodes', Object.fromEntries(LANGUAGE_META.map((l) => [l.id, form.starterCodes[l.id]?.trim() ? form.starterCodes[l.id] : TEMPLATES[l.id]])))}>Fill all empty languages</button>
                {form.starterCodes[starterLang]?.trim() && <button className="btn sm ghost" onClick={() => set('starterCodes', { ...form.starterCodes, [starterLang]: '' })}>Clear</button>}
                {show(`starter-${starterLang}`) && <span className="msg">{show(`starter-${starterLang}`)}</span>}
              </div>
            </div>
          )}

          {tab === 'Reference solution' && (
            <div>
              <p className="t2" style={{ marginTop: 0 }}>
                Run a correct solution against every test case through the code runner (uses Judge0 requests). It checks your expected outputs and can fill them in. The solution itself is not saved.
              </p>
              <div className="sa-lang-tabs" role="tablist">
                {LANGUAGE_META.map((l) => (
                  <button key={l.id} role="tab" aria-selected={refLang === l.id} className={refLang === l.id ? 'on' : ''} onClick={() => setRefLang(l.id)}>{l.label}</button>
                ))}
              </div>
              <div className="sa-monaco">
                <Monaco height="340px" language={LANGUAGE_META.find((l) => l.id === refLang)?.monaco} theme={dark ? 'vs-dark' : 'light'}
                  value={refCode[refLang] ?? ''} onChange={(v) => setRefCode((c) => ({ ...c, [refLang]: v ?? '' }))}
                  options={{ minimap: { enabled: false }, fontSize: 13, scrollBeyondLastLine: false, tabSize: 4, automaticLayout: true }} />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <button className="btn dark" onClick={runReference} disabled={running}>{running ? <span className="spin" /> : <SaIcon name="play" size={15} />}Run on {form.testCases.length} case{form.testCases.length === 1 ? '' : 's'}</button>
                {runResults && <>
                  <button className="btn" onClick={() => fillFromRun(true)}>Fill empty expected outputs</button>
                  <button className="btn ghost" onClick={() => fillFromRun(false)}>Replace all expected outputs</button>
                </>}
              </div>
              <ErrorList errors={runErrors} />
              {runResults && (
                <div className="sa-table-wrap" style={{ marginTop: 14 }}>
                  <table className="sa-table">
                    <thead><tr><th>Case</th><th>Status</th><th>Output</th><th className="num-col">Time</th></tr></thead>
                    <tbody>
                      {form.testCases.map((t, i) => {
                        const r = runResults.byKey[t.k];
                        if (!r) return <tr key={t.k}><td>{i + 1}</td><td colSpan={3} className="t2">Added after the run</td></tr>;
                        return (
                          <tr key={t.k}>
                            <td>{i + 1}{t.isHidden && <span className="t2" style={{ display: 'block', marginTop: 0 }}>hidden</span>}</td>
                            <td>{!r.ran ? <span className="chip rose">{r.status}</span> : r.matches === null ? <span className="chip">No expected output</span> : <span className={`chip ${r.matches ? 'green' : 'rose'}`}>{r.matches ? 'Match' : 'Differs'}</span>}</td>
                            <td><div className={`sa-run ${r.ran ? 'info' : 'bad'}`} style={{ marginTop: 0 }}>{r.ran ? r.output || '(empty)' : r.error}</div></td>
                            <td className="num-col t2">{r.time ? `${r.time}s` : '–'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === 'Preview' && (
            <div className="sa-preview">
              <div className="chips" style={{ marginBottom: 8 }}>
                <span className={`chip ${form.difficulty === 'EASY' ? 'green' : form.difficulty === 'MEDIUM' ? 'amber' : 'rose'}`}>{form.difficulty[0] + form.difficulty.slice(1).toLowerCase()}</span>
                {form.category && <span className="chip">{form.category}</span>}
              </div>
              <h1 style={{ fontSize: 22, margin: '4px 0 10px' }}>{form.title || 'Untitled question'}</h1>
              <p className="txt">{form.description || 'No description yet.'}</p>
              {form.inputFormat && <><h2>Input format</h2><p className="txt">{form.inputFormat}</p></>}
              {form.outputFormat && <><h2>Output format</h2><p className="txt">{form.outputFormat}</p></>}
              {form.constraints && <><h2>Constraints</h2><p className="txt">{form.constraints}</p></>}
              {form.testCases.filter((t) => !t.isHidden).map((t, i) => (
                <div key={t.k}>
                  <h2>Example {i + 1}</h2>
                  <div className="sa-form-2">
                    <div><div className="t2" style={{ marginBottom: 4 }}>Input</div><pre>{t.input || ' '}</pre></div>
                    <div><div className="t2" style={{ marginBottom: 4 }}>Output</div><pre>{t.expectedOutput || ' '}</pre></div>
                  </div>
                  {t.explanation && <p className="t2">{t.explanation}</p>}
                </div>
              ))}
              {hidden > 0 && <p className="t2" style={{ marginTop: 16 }}>+ {hidden} hidden test case{hidden === 1 ? '' : 's'} (not shown to candidates).</p>}
            </div>
          )}

          <ErrorList errors={serverErrors} />
        </div>

        <aside className="sa-aside">
          <div className="tile line">
            <div className="tile-h"><h3>Ready to publish?</h3></div>
            {checks.map((c, i) => (
              <div key={i} className={`sa-check ${c.ok === true ? 'ok' : c.ok === 'warn' ? 'warn' : 'bad'}`}>
                <SaIcon name={c.ok === true ? 'check' : c.ok === 'warn' ? 'alert' : 'x'} size={16} />{c.text}
              </div>
            ))}
          </div>
          <div className="tile line">
            <div className="lbl" style={{ marginBottom: 6 }}><SaIcon name="shield" size={15} />Check mode</div>
            <b style={{ fontSize: 14 }}>{VALIDATOR_META[form.outputValidator]?.label}</b>
            <p className="t2">{VALIDATOR_META[form.outputValidator]?.hint}</p>
          </div>
        </aside>
      </div>

      <div className="sa-savebar">
        <span className="t2">{dirty ? 'Unsaved changes' : id ? 'All changes saved' : ''}{touched && errorCount ? ` · ${errorCount} problem${errorCount === 1 ? '' : 's'} to fix` : ''}</span>
        <Link href="/pro-admin/coding" className="btn">Cancel</Link>
        <button className="btn dark" onClick={save} disabled={saving || (!dirty && !!id)}>{saving && <span className="spin" />}{id ? 'Save changes' : 'Create question'}</button>
      </div>

      {deleting && (
        <Confirm title="Delete this coding question?" tone="danger" action="Delete question" busy={deleteBusy} errors={deleteErrors}
          body={info && (info.usedIn.length || info.submissions)
            ? <p>It&apos;s used in {info.usedIn.length} test{info.usedIn.length === 1 ? '' : 's'} and has {info.submissions} submission{info.submissions === 1 ? '' : 's'}, so it can&apos;t be deleted. Remove it from those tests first.</p>
            : <p>“{form.title}” and its {form.testCases.length} test case{form.testCases.length === 1 ? '' : 's'} will be deleted permanently.</p>}
          onConfirm={confirmDelete} onClose={() => setDeleting(false)} />
      )}
    </div>
  );
}
