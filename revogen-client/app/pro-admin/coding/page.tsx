'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CodingRow, errorMessages, fmtDate, LANGUAGE_META, Paged, qs, sa, VALIDATOR_META } from '@/components/super-admin/api';
import { Confirm, Empty, ErrorList, Loading, Pagination, SaIcon, SearchBox, useDebounced, useToast } from '@/components/super-admin/ui';

const DIFF_CHIP: Record<string, string> = { EASY: 'green', MEDIUM: 'amber', HARD: 'rose' };

export default function CodingPage() {
  return <Suspense fallback={<Loading />}><CodingBank /></Suspense>;
}

function CodingBank() {
  const params = useSearchParams();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const debounced = useDebounced(search);
  const [difficulty, setDifficulty] = useState(params.get('difficulty') ?? '');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paged<CodingRow> | null>(null);
  const [meta, setMeta] = useState<{ categories: string[]; byDifficulty: Record<string, number> } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [deleting, setDeleting] = useState<CodingRow | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteErrors, setDeleteErrors] = useState<string[]>([]);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();
    const load = async () => {
      try {
        const [list, m] = await Promise.all([
          sa<Paged<CodingRow>>(`/coding${qs({ search: debounced.trim(), difficulty, category, page, pageSize: 20 })}`, { signal: ctrl.signal }),
          sa<{ categories: string[]; byDifficulty: Record<string, number> }>('/coding/meta', { signal: ctrl.signal }),
        ]);
        setData(list);
        setMeta(m);
        setErrors([]);
      } catch (e) {
        if ((e as Error)?.name !== 'AbortError') setErrors(errorMessages(e));
      }
    };
    load();
    return () => ctrl.abort();
  }, [debounced, difficulty, category, page, reload]);

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteErrors([]);
    try {
      await sa(`/coding/${deleting.id}`, { method: 'DELETE' });
      toast('Coding question deleted.');
      setDeleting(null);
      setReload((n) => n + 1);
    } catch (e) {
      setDeleteErrors(errorMessages(e));
    } finally {
      setDeleteBusy(false);
    }
  };

  const total = meta ? Object.values(meta.byDifficulty).reduce((a, b) => a + b, 0) : 0;
  const langLabel = (id: string) => LANGUAGE_META.find((l) => l.id === id)?.label ?? id;

  return (
    <div className="fade">
      <div className="sa-head">
        <div>
          <h1>Coding bank</h1>
          <p>{total} question{total === 1 ? "" : "s"} · {meta?.byDifficulty.EASY ?? 0} easy, {meta?.byDifficulty.MEDIUM ?? 0} medium, {meta?.byDifficulty.HARD ?? 0} hard. Recruiters build coding tests from these.</p>
        </div>
        <div className="act">
          <Link href="/pro-admin/coding/new" className="btn dark"><SaIcon name="plus" size={16} />New question</Link>
        </div>
      </div>

      <div className="tile line">
        <div className="sa-toolbar">
          <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search title or slug" label="Search coding questions" />
          <select className="input" value={difficulty} onChange={(e) => { setDifficulty(e.target.value); setPage(1); }} aria-label="Filter by difficulty">
            <option value="">All difficulties</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
          <select className="input" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} aria-label="Filter by category">
            <option value="">All categories</option>
            {meta?.categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <ErrorList errors={errors} />
        {!data ? <Loading /> : data.items.length === 0 ? (
          <Empty icon="code" title={search || difficulty || category ? 'No questions match' : 'No coding questions yet'}
            action={<Link href="/pro-admin/coding/new" className="btn dark"><SaIcon name="plus" size={16} />Create one</Link>}>
            {search || difficulty || category ? 'Try other filters.' : 'Create the first one with test cases.'}
          </Empty>
        ) : (
          <>
            <div className="sa-table-wrap">
              <table className="sa-table">
                <thead>
                  <tr><th>Question</th><th>Difficulty</th><th className="num-col">Test cases</th><th>Check</th><th>Starter code</th><th className="num-col">Used in</th><th>Updated</th><th className="act-col"><span className="sr-only">Actions</span></th></tr>
                </thead>
                <tbody>
                  {data.items.map((q) => (
                    <tr key={q.id}>
                      <td>
                        <Link href={`/pro-admin/coding/${q.id}`} className="t1" style={{ display: 'block' }}>{q.title}</Link>
                        <span className="t2">{q.category} · <span className="mono">{q.slug}</span></span>
                      </td>
                      <td><span className={`chip ${DIFF_CHIP[q.difficulty]}`}>{q.difficulty[0] + q.difficulty.slice(1).toLowerCase()}</span></td>
                      <td className="num-col">
                        {q.testCases}
                        <span className="t2" style={{ display: 'block', marginTop: 0 }}>{q.hiddenTestCases} hidden</span>
                      </td>
                      <td><span className="chip" title={VALIDATOR_META[q.outputValidator]?.hint}>{VALIDATOR_META[q.outputValidator]?.label ?? q.outputValidator}</span></td>
                      <td className="t2">{q.languages.length ? q.languages.map(langLabel).join(', ') : <span className="chip amber">None</span>}</td>
                      <td className="num-col">{q.usedInTests} test{q.usedInTests === 1 ? '' : 's'}</td>
                      <td className="t2" style={{ whiteSpace: 'nowrap' }}>{fmtDate(q.updatedAt)}</td>
                      <td className="act-col">
                        <Link href={`/pro-admin/coding/${q.id}`} className="sa-icon-btn" aria-label={`Edit ${q.title}`} title="Edit"><SaIcon name="edit" size={16} /></Link>
                        <button className="sa-icon-btn danger" aria-label={`Delete ${q.title}`} title="Delete" onClick={() => { setDeleteErrors([]); setDeleting(q); }}>
                          <SaIcon name="trash" size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={data.page} pages={data.pages} total={data.total} onPage={setPage} />
          </>
        )}
      </div>

      {deleting && (
        <Confirm title={`Delete “${deleting.title}”?`} tone="danger" action="Delete question" busy={deleteBusy} errors={deleteErrors}
          body={deleting.usedInTests > 0 || deleting.submissions > 0
            ? <p>This question is used in {deleting.usedInTests} test{deleting.usedInTests === 1 ? '' : 's'} and has {deleting.submissions} submission{deleting.submissions === 1 ? '' : 's'}, so it can&apos;t be deleted. Remove it from those tests first.</p>
            : <p>The question and its {deleting.testCases} test case{deleting.testCases === 1 ? '' : 's'} will be deleted permanently.</p>}
          onConfirm={confirmDelete} onClose={() => setDeleting(null)} />
      )}
    </div>
  );
}
