// MCQ practice: papers are built per subject from the bank, answers never leak,
// grading is exact, attempts are unlimited, and assigned tests stay invite-only.
// In-memory fake of Prisma — never touches a real database.
import { TestsService } from './tests.service';

type Row = Record<string, any>;
const matches = (row: Row, where: Row = {}) =>
  Object.entries(where).every(([k, c]) => {
    const v = row[k];
    if (c && typeof c === 'object' && 'in' in c) return c.in.includes(v);
    if (c && typeof c === 'object' && 'equals' in c)
      return String(v).trim().toLowerCase() === String(c.equals).trim().toLowerCase();
    return v === c;
  });

const bankQ = (id: string, category: string, correct = 'right') => ({
  id,
  category,
  question: `${category} question ${id}`,
  optionA: 'wrong a',
  optionB: 'right',
  optionC: 'wrong c',
  optionD: 'wrong d',
  correctAnswer: correct,
});

function setup() {
  let seq = 0;
  const db: Record<string, Row[]> = {
    users: [
      { id: 'cand', email: 'c@x.dev' },
      { id: 'other', email: 'o@x.dev' },
    ],
    tests: [
      { id: 'JAVA', title: 'Java Developer', duration: 30, isPractice: true },
      { id: 'OWN', title: 'Own questions', duration: 10, isPractice: true },
      { id: 'EMPTY', title: 'Empty', duration: 10, isPractice: true },
      { id: 'ASSIGNED', title: 'Hiring round', duration: 20, isPractice: false },
    ],
    modules: [
      { id: 'm1', testId: 'JAVA', module: 'Java', questionCount: 3 },
      { id: 'm2', testId: 'JAVA', module: 'SQL', questionCount: 2 },
      { id: 'm3', testId: 'EMPTY', module: 'Rust', questionCount: 5 },
    ],
    bank: [
      bankQ('j1', 'java'), bankQ('j2', 'Java'), bankQ('j3', 'JAVA'), bankQ('j4', 'Java'),
      bankQ('s1', 'SQL', 'B'),
      bankQ('p1', 'Python'),
    ],
    questions: [
      { ...bankQ('o1', ''), testId: 'OWN' },
      { ...bankQ('o2', ''), testId: 'OWN' },
      { ...bankQ('a1', ''), testId: 'ASSIGNED' },
      { ...bankQ('a2', ''), testId: 'ASSIGNED' },
    ],
    invitations: [{ testId: 'ASSIGNED', email: 'C@X.dev', status: 'PENDING' }],
    attempts: [],
    reports: [],
  };

  const prisma: any = {
    user: { findUnique: async ({ where }) => db.users.find((u) => u.id === where.id) ?? null },
    test: {
      findMany: async ({ where }) =>
        db.tests.filter((t) => matches(t, where)).map((t) => ({
          ...t,
          modules: db.modules.filter((m) => m.testId === t.id),
          _count: { questions: db.questions.filter((q) => q.testId === t.id).length },
        })),
      findFirst: async ({ where }) => {
        const t = db.tests.find((x) => matches(x, where));
        return t ? { ...t, modules: db.modules.filter((m) => m.testId === t.id) } : null;
      },
      findUnique: async ({ where }) => {
        const t = db.tests.find((x) => x.id === where.id);
        return t ? { ...t, questions: db.questions.filter((q) => q.testId === t.id) } : null;
      },
    },
    questionBank: {
      findMany: async ({ where, select }) => {
        const rows = db.bank.filter((q) => matches(q, where));
        return select ? rows.map((r) => ({ id: r.id })) : rows;
      },
    },
    question: { findMany: async ({ where }) => db.questions.filter((q) => matches(q, where)) },
    testInvitation: {
      findFirst: async ({ where }) => db.invitations.find((i) => matches(i, where)) ?? null,
      updateMany: async ({ where, data }) => {
        const rows = db.invitations.filter((i) => matches(i, where));
        rows.forEach((r) => Object.assign(r, data));
        return { count: rows.length };
      },
    },
    attempt: {
      create: async ({ data }) => {
        const { user, test, ...rest } = data;
        const row = { id: `att${++seq}`, createdAt: new Date(), userId: user?.connect?.id, testId: test?.connect?.id, ...rest };
        db.attempts.push(row);
        return row;
      },
      findFirst: async ({ where }) => db.attempts.find((a) => matches(a, where)) ?? null,
    },
    proctoringReport: { create: async ({ data }) => (db.reports.push(data), data) },
  };
  prisma.$transaction = async (fn: any) => (typeof fn === 'function' ? fn(prisma) : Promise.all(fn));

  return { db, service: new TestsService(prisma) };
}

beforeAll(() => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
});

const answerAll = (questions: { id: string }[], letter: string) =>
  Object.fromEntries(questions.map((q) => [q.id, letter]));

describe('MCQ practice', () => {
  it('lists practice tests with their subject mix and no questions or answers', async () => {
    const { service } = setup();
    const list = await service.getPracticeTests();
    const java = list.find((t) => t.id === 'JAVA')!;
    expect(java.modules).toEqual([
      { module: 'Java', questionCount: 3 },
      { module: 'SQL', questionCount: 2 },
    ]);
    expect(java.questionCount).toBe(5);
    expect(list.find((t) => t.id === 'OWN')!.questionCount).toBe(2);
    expect(JSON.stringify(list)).not.toMatch(/correctAnswer|optionA/);
    expect(list.some((t) => t.id === 'ASSIGNED')).toBe(false);
  });

  it('builds a paper per subject, case-insensitively, and reports shortfalls', async () => {
    const { service } = setup();
    const res = await service.startPractice('JAVA', 'cand');
    const bySubject = (m: string) => res.questions.filter((q) => q.module === m);
    expect(bySubject('Java')).toHaveLength(3);
    expect(bySubject('SQL')).toHaveLength(1);
    expect(res.shortfalls).toEqual([{ module: 'SQL', requested: 2, available: 1 }]);
    expect(new Set(res.questions.map((q) => q.id)).size).toBe(4);
    expect(JSON.stringify(res.questions)).not.toMatch(/correctAnswer/);
    expect(res.questions[0].options).toEqual(
      expect.objectContaining({ A: expect.any(String), D: expect.any(String) }),
    );
  });

  it('falls back to the test’s own questions when it has no subjects', async () => {
    const { service } = setup();
    const res = await service.startPractice('OWN', 'cand');
    expect(res.questions.map((q) => q.id).sort()).toEqual(['o1', 'o2']);
  });

  it('refuses a practice test with no questions, and non-practice tests', async () => {
    const { service } = setup();
    await expect(service.startPractice('EMPTY', 'cand')).rejects.toThrow(/no questions/);
    await expect(service.startPractice('ASSIGNED', 'cand')).rejects.toThrow(/not found/);
  });

  it('grades exactly, with a per-subject breakdown and review, and saves an attempt', async () => {
    const { service, db } = setup();
    const { paper, questions } = await service.startPractice('JAVA', 'cand');
    const answers = answerAll(questions, 'B');
    answers[questions[0].id] = 'A'; // one wrong
    const res = await service.submitPractice('JAVA', 'cand', paper, answers);
    expect(res.totalQuestions).toBe(4);
    expect(res.score).toBe(3);
    expect(res.percentage).toBe(75);
    expect(res.modules.reduce((n, m) => n + m.total, 0)).toBe(4);
    expect(res.review.every((r) => r.correct === 'B')).toBe(true);
    expect(res.review[0]).toEqual(expect.objectContaining({ selected: 'A', isCorrect: false }));
    expect(db.attempts).toHaveLength(1);
    expect(db.attempts[0]).toEqual(expect.objectContaining({ userId: 'cand', testId: 'JAVA', score: 3 }));
  });

  it('allows unlimited attempts', async () => {
    const { service, db } = setup();
    for (let i = 0; i < 3; i++) {
      const { paper, questions } = await service.startPractice('JAVA', 'cand');
      await service.submitPractice('JAVA', 'cand', paper, answerAll(questions, 'B'));
    }
    expect(db.attempts).toHaveLength(3);
  });

  it('counts unanswered questions as wrong', async () => {
    const { service } = setup();
    const { paper } = await service.startPractice('OWN', 'cand');
    const res = await service.submitPractice('OWN', 'cand', paper, {});
    expect(res).toEqual(expect.objectContaining({ score: 0, totalQuestions: 2, percentage: 0, answered: 0 }));
  });

  it('rejects a tampered, foreign or mismatched paper', async () => {
    const { service } = setup();
    const { paper } = await service.startPractice('JAVA', 'cand');
    const [body, sig] = paper.split('.');
    const forged = Buffer.from(
      JSON.stringify({ ...JSON.parse(Buffer.from(body, 'base64url').toString()), q: ['p1'] }),
    ).toString('base64url');
    await expect(service.submitPractice('JAVA', 'cand', `${forged}.${sig}`, {})).rejects.toThrow(/no longer valid/);
    await expect(service.submitPractice('JAVA', 'other', paper, {})).rejects.toThrow(/no longer valid/);
    await expect(service.submitPractice('OWN', 'cand', paper, {})).rejects.toThrow(/no longer valid/);
    await expect(service.submitPractice('JAVA', 'cand', 'garbage', {})).rejects.toThrow(/no longer valid/);
  });
});

describe('Assigned MCQ submit', () => {
  it('lets an invited candidate submit once (email matched case-insensitively)', async () => {
    const { service, db } = setup();
    await service.submitTest('ASSIGNED', 'cand', { a1: 'B', a2: 'A' }, {});
    expect(db.attempts[0]).toEqual(expect.objectContaining({ score: 1, totalQuestions: 2 }));
    await expect(service.submitTest('ASSIGNED', 'cand', {}, {})).rejects.toThrow(/already submitted/);
  });

  it('refuses candidates who were not invited', async () => {
    const { service } = setup();
    await expect(service.submitTest('ASSIGNED', 'other', {}, {})).rejects.toThrow(/not invited/);
  });
});
