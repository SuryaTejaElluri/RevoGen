// Super admin: security fixes, user management rules, MCQ and coding bank rules.
// In-memory fake of Prisma and Judge0 — never touches a real database.
import 'reflect-metadata';
import { BadRequestException, ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { AuthService } from '../auth/auth.service';
import { RegisterDto } from '../auth/dto/register.dto';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { SuperAdminGuard } from '../auth/super-admin.guard';
import { AdminGuard } from '../auth/admin.guard';
import { CreditsController } from '../credits/credits.controller';
import { CodingQuestionBankController } from '../coding-question-bank/coding-question-bank.controller';
import { strictBody } from '../common/roles';
import { parseMcq } from '../question-bank/mcq-input';
import { CodingQuestionDto } from './dto';
import { SuperAdminUsersService } from './users.service';
import { SuperAdminMcqService } from './mcq.service';
import { SuperAdminCodingService } from './coding.service';

type Row = Record<string, any>;

const lc = (v: unknown) => String(v ?? '').toLowerCase();
function matches(row: Row, where: Row = {}): boolean {
  return Object.entries(where).every(([k, c]) => {
    if (k === 'NOT') return !matches(row, c);
    if (k === 'OR') return (c as Row[]).some((w) => matches(row, w));
    const v = row[k];
    if (c && typeof c === 'object' && !(c instanceof Date)) {
      if ('in' in c) return c.in.includes(v);
      if ('equals' in c) return c.mode === 'insensitive' ? lc(v) === lc(c.equals) : v === c.equals;
      if ('contains' in c) return lc(v).includes(lc(c.contains));
    }
    return v === c;
  });
}

function fakeDb() {
  let seq = 0;
  const id = () => `00000000-0000-4000-8000-${String(++seq).padStart(12, '0')}`;
  const db: Record<string, Row[]> = {
    users: [], wallets: [], transactions: [], tests: [], codingTests: [], bank: [], coding: [], cases: [], codingTestQuestions: [], submissions: [],
  };
  const table = (name: string) => ({
    findUnique: async ({ where }: Row) => db[name].find((r) => matches(r, where)) ?? null,
    findUniqueOrThrow: async ({ where }: Row) => {
      const r = db[name].find((x) => matches(x, where));
      if (!r) throw new Error('not found');
      return r;
    },
    findFirst: async ({ where }: Row) => db[name].find((r) => matches(r, where)) ?? null,
    findMany: async ({ where }: Row = {}) => db[name].filter((r) => matches(r, where)),
    count: async ({ where }: Row = {}) => db[name].filter((r) => matches(r, where)).length,
    create: async ({ data }: Row) => {
      const row = { id: id(), createdAt: new Date(), updatedAt: new Date(), ...data };
      db[name].push(row);
      return row;
    },
    createMany: async ({ data }: Row) => {
      (data as Row[]).forEach((d) => db[name].push({ id: id(), createdAt: new Date(), ...d }));
      return { count: data.length };
    },
    update: async ({ where, data }: Row) => {
      const r = db[name].find((x) => matches(x, where));
      if (!r) throw new Error('not found');
      Object.assign(r, data, { updatedAt: new Date() });
      return r;
    },
    delete: async ({ where }: Row) => {
      const i = db[name].findIndex((x) => matches(x, where));
      return db[name].splice(i, 1)[0];
    },
    deleteMany: async ({ where }: Row) => {
      const before = db[name].length;
      db[name] = db[name].filter((x) => !matches(x, where));
      return { count: before - db[name].length };
    },
  });

  const prisma: any = {
    user: table('users'),
    adminCredits: table('wallets'),
    creditTransaction: table('transactions'),
    test: table('tests'),
    codingTest: table('codingTests'),
    questionBank: table('bank'),
    codingQuestionTestCase: table('cases'),
    codingQuestionBank: {
      ...table('coding'),
      findUnique: async ({ where }: Row) => {
        const q = db.coding.find((r) => matches(r, where));
        if (!q) return null;
        const uses = db.codingTestQuestions.filter((x) => x.questionId === q.id);
        return {
          ...q,
          testCases: db.cases.filter((c) => c.questionId === q.id),
          questions: uses.map((u) => ({ codingTest: db.codingTests.find((t) => t.id === u.codingTestId) })),
          _count: { questions: uses.length, submissions: db.submissions.filter((s) => s.questionId === q.id).length },
        };
      },
    },
  };
  prisma.$transaction = async (fn: any) => fn(prisma);
  return { db, prisma };
}

const addUser = (db: Record<string, Row[]>, role: string, email = `${role.toLowerCase()}${db.users.length}@x.dev`) => {
  const u = { id: `00000000-0000-4000-9000-${String(db.users.length + 1).padStart(12, '0')}`, name: role, email, role, isVerified: false, createdAt: new Date(), updatedAt: new Date() };
  db.users.push(u);
  return u;
};

// ─── Security fixes ──────────────────────────────────────────────────────────

describe('security fixes', () => {
  it('sign-up never grants super admin, even when the request asks for it', async () => {
    const { db, prisma } = fakeDb();
    const users = { findByEmail: async () => null, create: async (data: Row) => prisma.user.create({ data }) };
    const mail = { sendVerificationEmail: async () => undefined };
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    const auth = new AuthService(users as any, {} as any, prisma, mail as any);
    await auth.register({ name: 'Eve', email: 'eve@x.dev', password: 'secret12', role: 'SUPER_ADMIN' } as RegisterDto);
    await auth.register({ name: 'Rita', email: 'rita@x.dev', password: 'secret12', role: 'ADMIN' } as RegisterDto);
    expect(db.users.map((u) => u.role)).toEqual(['USER', 'ADMIN']);
  });

  it('the sign-up body is validated: unknown roles and extra fields are rejected', async () => {
    const pipe = strictBody();
    const meta = { type: 'body' as const, metatype: RegisterDto };
    await expect(pipe.transform({ name: 'Eve', email: 'eve@x.dev', password: 'secret12', role: 'SUPER_ADMIN' }, meta)).rejects.toThrow(BadRequestException);
    await expect(pipe.transform({ name: 'Eve', email: 'eve@x.dev', password: 'secret12', isVerified: true }, meta)).rejects.toThrow(BadRequestException);
    await expect(pipe.transform({ name: 'Eve', email: 'not-an-email', password: 'secret12' }, meta)).rejects.toThrow(BadRequestException);
    await expect(pipe.transform({ name: 'Eve', email: 'eve@x.dev', password: 'secret12', role: 'ADMIN' }, meta)).resolves.toBeInstanceOf(RegisterDto);
  });

  it('the token check uses the role in the database and blocks suspended or deleted users', async () => {
    const { db, prisma } = fakeDb();
    const strategy = new JwtStrategy({ getOrThrow: () => 'secret' } as any, prisma);
    const demoted = addUser(db, 'USER');
    const suspended = addUser(db, 'SUSPENDED');
    await expect(strategy.validate({ sub: demoted.id })).resolves.toEqual(expect.objectContaining({ role: 'USER' }));
    await expect(strategy.validate({ sub: suspended.id })).rejects.toThrow(UnauthorizedException);
    await expect(strategy.validate({ sub: 'gone' })).rejects.toThrow(UnauthorizedException);
  });

  it('SuperAdminGuard turns away recruiters with a 403', () => {
    const ctx = (role: string) => ({ switchToHttp: () => ({ getRequest: () => ({ user: { role } }) }) }) as any;
    expect(() => new SuperAdminGuard().canActivate(ctx('ADMIN'))).toThrow(ForbiddenException);
    expect(new SuperAdminGuard().canActivate(ctx('SUPER_ADMIN'))).toBe(true);
    expect(() => new AdminGuard().canActivate(ctx('USER'))).toThrow(ForbiddenException);
  });

  it('only super admins can add credits; the coding bank needs a login', () => {
    const guards = (fn: unknown) => (Reflect.getMetadata(GUARDS_METADATA, fn as object) ?? []) as unknown[];
    const proto = CreditsController.prototype;
    expect(guards(proto.addCredits)).toContain(SuperAdminGuard);
    expect(guards(proto.adminAddCredits)).toContain(SuperAdminGuard);
    expect(guards(proto.adminDeductCredits)).toContain(SuperAdminGuard);
    expect(guards(CodingQuestionBankController)).toContain(AdminGuard);
    expect(guards(CodingQuestionBankController.prototype.create)).toContain(SuperAdminGuard);
  });
});

// ─── Users ───────────────────────────────────────────────────────────────────

describe('super admin: users', () => {
  function setup() {
    const { db, prisma } = fakeDb();
    const me = addUser(db, 'SUPER_ADMIN', 'boss@x.dev');
    const actor = { userId: me.id, email: me.email };
    return { db, prisma, me, actor, users: new SuperAdminUsersService(prisma) };
  }

  it("won't change your own role or demote the last super admin", async () => {
    const { db, me, actor, users } = setup();
    await expect(users.updateRole(actor, me.id, 'USER')).rejects.toThrow(/own role/);
    const other = addUser(db, 'SUPER_ADMIN');
    const third = addUser(db, 'ADMIN');
    await users.updateRole(actor, other.id, 'ADMIN'); // fine: `me` is still a super admin
    db.users.find((u) => u.id === me.id)!.role = 'ADMIN'; // pretend only `other`… is gone
    db.users.find((u) => u.id === other.id)!.role = 'SUPER_ADMIN';
    await expect(users.updateRole({ userId: third.id, email: third.email }, other.id, 'USER')).rejects.toThrow(/at least one super admin/);
  });

  it('promoting to recruiter gives a wallet with the welcome bonus, once', async () => {
    const { db, actor, users } = setup();
    const cand = addUser(db, 'USER');
    const res = await users.updateRole(actor, cand.id, 'ADMIN');
    expect(res.role).toBe('ADMIN');
    expect(db.wallets).toEqual([expect.objectContaining({ userId: cand.id, balance: 20 })]);
    await users.updateRole(actor, cand.id, 'USER');
    await users.updateRole(actor, cand.id, 'ADMIN');
    expect(db.wallets).toHaveLength(1);
  });

  it('suspends and reactivates with a chosen role; super admins and yourself are protected', async () => {
    const { db, me, actor, users } = setup();
    const rec = addUser(db, 'ADMIN');
    await users.setSuspended(actor, rec.id, true);
    expect(db.users.find((u) => u.id === rec.id)!.role).toBe('SUSPENDED');
    await expect(users.updateRole(actor, rec.id, 'USER')).rejects.toThrow(/suspended/);
    await users.setSuspended(actor, rec.id, false, 'ADMIN');
    expect(db.users.find((u) => u.id === rec.id)!.role).toBe('ADMIN');
    await expect(users.setSuspended(actor, me.id, true)).rejects.toThrow(/own account/);
    const sa2 = addUser(db, 'SUPER_ADMIN');
    await expect(users.setSuspended(actor, sa2.id, true)).rejects.toThrow(/another role/);
  });

  it('adjusts credits with a reason and never below zero', async () => {
    const { db, actor, users } = setup();
    const rec = addUser(db, 'ADMIN');
    await expect(users.adjustCredits(actor, rec.id, { delta: 30, reason: 'Top-up' })).resolves.toEqual(expect.objectContaining({ balance: 50 }));
    await expect(users.adjustCredits(actor, rec.id, { delta: -60, reason: 'Oops' })).rejects.toThrow(/only 50/);
    expect(db.transactions.at(-1)).toEqual(expect.objectContaining({ type: 'ADMIN', credits: 30, balanceAfter: 50, description: 'Top-up' }));
    const cand = addUser(db, 'USER');
    await expect(users.adjustCredits(actor, cand.id, { delta: 5, reason: 'x y z' })).rejects.toThrow(/Only recruiters/);
  });

  it('deletes only with the typed email, and never someone who owns tests', async () => {
    const { db, me, actor, users } = setup();
    const cand = addUser(db, 'USER');
    const rec = addUser(db, 'ADMIN');
    db.tests.push({ id: 't1', createdById: rec.id });
    await expect(users.remove(actor, me.id, me.email)).rejects.toThrow(/own account/);
    await expect(users.remove(actor, cand.id, 'wrong@x.dev')).rejects.toThrow(/doesn't match/);
    await expect(users.remove(actor, rec.id, rec.email)).rejects.toThrow(ConflictException);
    await expect(users.remove(actor, cand.id, cand.email.toUpperCase())).resolves.toEqual({ deleted: true, id: cand.id });
    expect(db.users.some((u) => u.id === cand.id)).toBe(false);
  });
});

// ─── MCQ ─────────────────────────────────────────────────────────────────────

describe('super admin: MCQ bank', () => {
  const q = (over: Row = {}) => ({ category: 'Java', question: 'Which keyword stops overriding?', optionA: 'static', optionB: 'final', optionC: 'private', optionD: 'abstract', correctAnswer: 'B', ...over });

  it('validates every field and stores the answer as the option text', () => {
    expect(parseMcq(q()).data).toEqual(expect.objectContaining({ correctAnswer: 'final' }));
    expect(parseMcq(q({ correctAnswer: 'FINAL' })).data?.correctAnswer).toBe('final');
    expect(parseMcq(q({ optionC: 'Final' })).errors).toContain('All four options must be different.');
    expect(parseMcq(q({ correctAnswer: 'volatile' })).errors).toContain('The correct answer must be one of the four options.');
    expect(parseMcq(q({ category: 'Java<script>' })).errors[0]).toMatch(/Category can only use/);
    expect(parseMcq(q({ question: 'hi' })).errors[0]).toMatch(/at least 5/);
    expect(parseMcq(q({ category: '  C++  ' })).data?.category).toBe('C++');
  });

  it('reuses the existing subject spelling and rejects duplicates', async () => {
    const { db, prisma } = fakeDb();
    const mcq = new SuperAdminMcqService(prisma);
    await mcq.create(q());
    const second = await mcq.create(q({ category: 'java', question: 'What does JVM stand for?', optionA: 'a', optionB: 'b', optionC: 'c', optionD: 'Java Virtual Machine', correctAnswer: 'D' }));
    expect(second.category).toBe('Java');
    await expect(mcq.create(q({ category: 'JAVA', question: 'which keyword stops overriding?' }))).rejects.toThrow(ConflictException);
    expect(db.bank).toHaveLength(2);
  });

  it('bulk import reports invalid and duplicate rows; dry run saves nothing', async () => {
    const { db, prisma } = fakeDb();
    const mcq = new SuperAdminMcqService(prisma);
    await mcq.create(q());
    const rows = [q({ question: 'What is JDK?' }), q(), q({ question: 'What is JDK?' }), q({ optionA: '' }), q({ category: 'sql', question: 'Which clause filters groups?', optionA: 'WHERE', optionB: 'HAVING', optionC: 'ORDER BY', optionD: 'LIMIT', correctAnswer: 'HAVING' })];
    const dry = await mcq.bulk(rows, true);
    expect(dry).toEqual(expect.objectContaining({ total: 5, valid: 2, invalid: 1, duplicates: 2, created: 0 }));
    expect(db.bank).toHaveLength(1);
    const real = await mcq.bulk(rows, false);
    expect(real.created).toBe(2);
    expect(db.bank).toHaveLength(3);
  });
});

// ─── Coding ──────────────────────────────────────────────────────────────────

describe('super admin: coding bank', () => {
  const dto = (over: Partial<CodingQuestionDto> = {}): CodingQuestionDto => ({
    title: 'Two Sum', category: 'ARRAYS', difficulty: 'EASY', description: 'Print the indices of two numbers that add to target.',
    outputValidator: 'EXACT', floatPrecision: 6, starterCodes: { python: 'print()' },
    testCases: [{ input: '1 2', expectedOutput: '3', isHidden: false }, { input: '2 2', expectedOutput: '4', isHidden: true }],
    ...over,
  });
  const judge0 = {
    runBatch: async (_code: string, _lang: number, inputs: string[]) =>
      inputs.map((i) => (i === 'crash'
        ? { status: { id: 11, description: 'Runtime Error' }, stdout: null, stderr: 'boom', compile_output: null, message: null }
        : { status: { id: 3, description: 'Accepted' }, stdout: `${i.split(' ').map(Number).reduce((a, b) => a + b, 0)}\n`, stderr: null, compile_output: null, message: null })),
  };

  it('validates the body shape (nested test cases included)', async () => {
    const pipe = strictBody();
    const meta = { type: 'body' as const, metatype: CodingQuestionDto };
    await expect(pipe.transform({ ...dto(), testCases: [] }, meta)).rejects.toThrow(BadRequestException);
    await expect(pipe.transform({ ...dto(), testCases: [{ input: '1', expectedOutput: '1', isHidden: 'yes' }] }, meta)).rejects.toThrow(BadRequestException);
    await expect(pipe.transform({ ...dto(), difficulty: 'IMPOSSIBLE' }, meta)).rejects.toThrow(BadRequestException);
    await expect(pipe.transform({ ...dto(), slug: 'Bad Slug' }, meta)).rejects.toThrow(BadRequestException);
    await expect(pipe.transform(dto(), meta)).resolves.toBeInstanceOf(CodingQuestionDto);
  });

  it('creates with a unique slug, keeps case order, and requires a sample case', async () => {
    const { db, prisma } = fakeDb();
    const coding = new SuperAdminCodingService(prisma, judge0 as any);
    const a = await coding.create(dto());
    const b = await coding.create(dto());
    expect([a.slug, b.slug]).toEqual(['two-sum', 'two-sum-2']);
    expect(db.cases.filter((c) => c.questionId === a.id).map((c) => c.input)).toEqual(['1 2', '2 2']);
    await expect(coding.create(dto({ testCases: [{ input: '1', expectedOutput: '1', isHidden: true }] }))).rejects.toThrow(BadRequestException);
    await expect(coding.create(dto({ testCases: [{ input: '1', expectedOutput: '  ', isHidden: false }] }))).rejects.toThrow(BadRequestException);
    await expect(coding.create(dto({ starterCodes: { ruby: 'puts 1' } }))).rejects.toThrow(BadRequestException);
    await expect(coding.create(dto({ slug: 'two-sum' }))).rejects.toThrow(ConflictException);
  });

  it('update replaces the test cases', async () => {
    const { db, prisma } = fakeDb();
    const coding = new SuperAdminCodingService(prisma, judge0 as any);
    const q = await coding.create(dto());
    await coding.update(q.id, dto({ title: 'Two Sum II', testCases: [{ input: '5 5', expectedOutput: '10', isHidden: false }] }));
    expect(db.cases.filter((c) => c.questionId === q.id)).toHaveLength(1);
    expect(db.coding[0].title).toBe('Two Sum II');
  });

  it("refuses to delete a question that's in a test or has submissions", async () => {
    const { db, prisma } = fakeDb();
    const coding = new SuperAdminCodingService(prisma, judge0 as any);
    const q = await coding.create(dto());
    db.codingTests.push({ id: 'ct1', title: 'Backend round' });
    db.codingTestQuestions.push({ codingTestId: 'ct1', questionId: q.id });
    await expect(coding.remove(q.id)).rejects.toThrow(/Backend round/);
    db.codingTestQuestions = [];
    db.submissions.push({ questionId: q.id });
    await expect(coding.remove(q.id)).rejects.toThrow(/submission/);
    db.submissions = [];
    await expect(coding.remove(q.id)).resolves.toEqual({ deleted: true, id: q.id });
  });

  it('runs a reference solution and compares with expected outputs', async () => {
    const { prisma } = fakeDb();
    const coding = new SuperAdminCodingService(prisma, judge0 as any);
    const r = await coding.runReference({
      language: 'python', sourceCode: 'x',
      testCases: [{ input: '1 2', expectedOutput: '3' }, { input: '2 2', expectedOutput: '5' }, { input: '4 4' }, { input: 'crash', expectedOutput: '1' }],
    });
    expect(r.results.map((x) => x.matches)).toEqual([true, false, null, null]);
    expect(r.results[2].output).toBe('8');
    expect(r.results[3]).toEqual(expect.objectContaining({ ran: false, error: 'boom' }));
    expect(r).toEqual(expect.objectContaining({ ran: 3, matched: 1, compared: 2 }));
  });
});
