// Integrity of coding tests: hidden tests stay hidden, only the owner can act on an
// attempt, time limits are enforced, final submit is idempotent, and recruiters only
// see their own results. In-memory fake of Prisma + Judge0 — never a real database.
import { CodingAttemptsService } from './coding-attempts.service';
import { CodingSubmissionsService } from '../coding-submissions/coding-submissions.service';
import { CodingTestsService } from '../coding-tests/coding-tests.service';

type Row = Record<string, any>;
const matches = (row: Row, where: Row = {}) =>
  Object.entries(where).every(([k, c]) => {
    const v = row[k];
    if (c && typeof c === 'object' && 'in' in c) return c.in.includes(v);
    if (c && typeof c === 'object' && 'equals' in c)
      return String(v).toLowerCase() === String(c.equals).toLowerCase();
    return v === c;
  });

function setup() {
  let seq = 0;
  const now = Date.now();
  const db: Record<string, Row[]> = {
    users: [
      { id: 'admin', email: 'r@acme.com' },
      { id: 'cand', email: 'c@x.dev' },
      { id: 'other', email: 'o@x.dev' },
    ],
    tests: [
      {
        id: 'T1',
        createdById: 'admin',
        title: 'Backend',
        duration: 45,
        securityLevel: 'BASIC',
      },
    ],
    testQuestions: [{ codingTestId: 'T1', questionId: 'Q1', order: 1 }],
    questions: [
      { id: 'Q1', title: 'Sum', difficulty: 'EASY', outputValidator: 'EXACT' },
    ],
    testCases: [
      {
        id: 'tc1',
        questionId: 'Q1',
        input: '1 2',
        expectedOutput: '3',
        isHidden: false,
      },
      {
        id: 'tc2',
        questionId: 'Q1',
        input: 'SECRET-IN',
        expectedOutput: 'SECRET-OUT',
        isHidden: true,
      },
    ],
    attempts: [
      {
        id: 'A1',
        codingTestId: 'T1',
        userId: 'cand',
        candidateEmail: 'c@x.dev',
        status: 'IN_PROGRESS',
        startedAt: new Date(now - 5 * 60_000),
        totalQuestions: 1,
        totalScore: 0,
        completedQuestions: 0,
        percentage: 0,
      },
    ],
    submissions: [] as Row[],
    events: [] as Row[],
    invitations: [
      {
        id: 'I1',
        codingTestId: 'T1',
        userId: 'cand',
        candidateEmail: 'c@x.dev',
        status: 'PENDING',
      },
    ],
  };
  const tbl = (rows: Row[]) => ({
    findFirst: async ({ where }: Row = {}) =>
      rows.find((r) => matches(r, where)) ?? null,
    findUnique: async ({ where }: Row) =>
      rows.find((r) => matches(r, where)) ?? null,
    findMany: async ({ where }: Row = {}) =>
      rows
        .filter((r) => matches(r, where))
        .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)),
    create: async ({ data }: Row) => {
      const r = { id: `id${++seq}`, createdAt: ++seq, ...data };
      rows.push(r);
      return r;
    },
    update: async ({ where, data }: Row) =>
      Object.assign(rows.find((r) => matches(r, where))!, data),
    updateMany: async ({ where, data }: Row) => {
      const h = rows.filter((r) => matches(r, where));
      h.forEach((r) => Object.assign(r, data));
      return { count: h.length };
    },
    count: async ({ where }: Row = {}) =>
      rows.filter((r) => matches(r, where)).length,
  });
  const prisma: any = {
    codingAttempt: {
      ...tbl(db.attempts),
      findFirst: async ({ where, include, select }: Row = {}) => {
        const a = db.attempts.find((r) => matches(r, where));
        if (!a) return null;
        const test = db.tests.find((t) => t.id === a.codingTestId)!;
        if (select?.codingTest)
          return {
            userId: a.userId,
            codingTest: { createdById: test.createdById },
          };
        const out: Row = { ...a, codingTest: { ...test } };
        if (include?.codingTest?.include?.questions) {
          out.codingTest.questions = db.testQuestions
            .filter((q) => q.codingTestId === test.id)
            .map((tq) => ({
              ...tq,
              question: {
                ...db.questions.find((q) => q.id === tq.questionId),
                testCases: db.testCases.filter(
                  (c) => c.questionId === tq.questionId,
                ),
              },
            }));
        }
        if (include?.submissions)
          out.submissions = db.submissions.filter((s) => s.attemptId === a.id);
        return out;
      },
    },
    codingTest: tbl(db.tests),
    codingTestQuestion: tbl(db.testQuestions),
    codingQuestionBank: {
      findUnique: async ({ where, include }: Row) => {
        const q = db.questions.find((x) => x.id === where.id);
        if (!q) return null;
        const onlyVisible = include?.testCases?.where?.isHidden === false;
        return {
          ...q,
          testCases: db.testCases.filter(
            (c) => c.questionId === q.id && (!onlyVisible || !c.isHidden),
          ),
        };
      },
    },
    codingSubmission: tbl(db.submissions),
    codingSecurityEvent: tbl(db.events),
    codingInvitation: tbl(db.invitations),
  };
  // Fake Judge0: "add the two numbers" if code says ok, compile error if code says broken.
  const judge0: any = {
    createSubmission: async (code: string, _l: number, stdin: string) => ({
      token: JSON.stringify({ code, stdin }),
    }),
    getSubmissionResult: async (token: string) => {
      const { code, stdin } = JSON.parse(token);
      if (code.includes('broken'))
        return {
          status: { id: 6, description: 'Compilation Error' },
          compile_output: 'SyntaxError: oops',
        };
      const out = stdin === '1 2' ? '3' : 'wrong';
      return { status: { id: 3, description: 'Accepted' }, stdout: out };
    },
  };
  return {
    db,
    attempts: new CodingAttemptsService(prisma),
    subs: new CodingSubmissionsService(prisma, judge0),
    tests: new CodingTestsService(prisma, {} as any, {} as any),
  };
}

describe('Coding test integrity', () => {
  it('never sends hidden test cases to the candidate', async () => {
    const { attempts } = setup();
    const a: any = await attempts.getAttempt('A1', 'cand');
    const q = a.codingTest.questions[0].question;
    expect(q.testCases.map((c: Row) => c.id)).toEqual(['tc1']);
    expect(q.hiddenTestCount).toBe(1);
    expect(JSON.stringify(a)).not.toContain('SECRET');
  });

  it('returns time left from the server start time, so refreshing cannot reset the timer', async () => {
    const { attempts } = setup();
    const a: any = await attempts.getAttempt('A1', 'cand');
    expect(a.remainingSeconds).toBeGreaterThan(39 * 60);
    expect(a.remainingSeconds).toBeLessThanOrEqual(40 * 60);
  });

  it('does not reveal hidden test inputs or outputs in submit results', async () => {
    const { subs } = setup();
    const r: any = await subs.submitCode(
      {
        attemptId: 'A1',
        questionId: 'Q1',
        language: 'python',
        sourceCode: 'ok',
      },
      'cand',
    );
    expect(r.passedCases).toBe(1);
    expect(r.totalCases).toBe(2);
    expect(JSON.stringify(r.results)).not.toContain('SECRET');
    expect(r.results[1]).toEqual({
      testCaseNo: 2,
      passed: false,
      isHidden: true,
    });
  });

  it('saves a compile error as a zero-score submission so the recruiter can see it', async () => {
    const { subs, db } = setup();
    const r: any = await subs.submitCode(
      {
        attemptId: 'A1',
        questionId: 'Q1',
        language: 'python',
        sourceCode: 'broken',
      },
      'cand',
    );
    expect(r.success).toBe(false);
    expect(r.error).toContain('SyntaxError');
    expect(db.submissions).toHaveLength(1);
    expect(db.submissions[0]).toMatchObject({ score: 0, status: 'FAILED' });
  });

  it('rejects run/submit from someone else, after submission, after time, or for a foreign question', async () => {
    const { subs, db } = setup();
    const dto = {
      attemptId: 'A1',
      questionId: 'Q1',
      language: 'python',
      sourceCode: 'ok',
    };
    await expect(subs.submitCode(dto, 'other')).rejects.toThrow('not found');
    await expect(
      subs.runCode({ ...dto, questionId: 'Q-OTHER' }, 'cand'),
    ).rejects.toThrow('not part of your test');
    await expect(
      subs.runCode({ ...dto, language: 'cobol' }, 'cand'),
    ).rejects.toThrow('Unsupported language');
    db.attempts[0].startedAt = new Date(Date.now() - 60 * 60_000); // 60 min ago, 45 min test
    await expect(subs.submitCode(dto, 'cand')).rejects.toThrow('Time is up');
    db.attempts[0].startedAt = new Date();
    db.attempts[0].status = 'COMPLETED';
    await expect(subs.submitCode(dto, 'cand')).rejects.toThrow(
      'already been submitted',
    );
  });

  it('scores on final submit, marks the invitation complete, and is safe to call twice', async () => {
    const { subs, attempts, db } = setup();
    await subs.submitCode(
      {
        attemptId: 'A1',
        questionId: 'Q1',
        language: 'python',
        sourceCode: 'ok',
      },
      'cand',
    );
    const first: any = await attempts.finalSubmit('A1', 'cand');
    expect(first).toMatchObject({
      success: true,
      totalScore: 50,
      percentage: 50,
      alreadySubmitted: false,
    });
    expect(db.attempts[0].status).toBe('COMPLETED');
    expect(db.invitations[0].status).toBe('COMPLETED');
    const again: any = await attempts.finalSubmit('A1', 'cand');
    expect(again).toMatchObject({
      success: true,
      totalScore: 50,
      alreadySubmitted: true,
    });
  });

  it('ignores proctoring events sent after the test is submitted', async () => {
    const { attempts, db } = setup();
    db.attempts[0].status = 'COMPLETED';
    const r: any = await attempts.logSecurityEvent(
      'A1',
      'cand',
      'FULLSCREEN_EXIT',
      {},
    );
    expect(r).toEqual({ ignored: true });
    expect(db.events).toHaveLength(0);
  });

  it('returns 404/403-style errors instead of crashing', async () => {
    const { attempts } = setup();
    await expect(attempts.getAttempt('nope', 'cand')).rejects.toMatchObject({
      status: 404,
    });
    await expect(
      attempts.getAttemptReport('A1', 'other'),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('only lets the recruiter who owns the test see results and submissions', async () => {
    const { tests, subs } = setup();
    await expect(tests.getResults('T1', 'other')).rejects.toThrow('not found');
    await expect(subs.getSubmissionsFor('A1', 'other')).rejects.toThrow(
      'access',
    );
    await expect(subs.getSubmissionsFor('A1', 'cand')).resolves.toBeDefined();
  });
});
