// Pending coding-test invitations: invite → sign up → see and start the test,
// and credits are only charged once per candidate.
// Uses an in-memory fake of the Prisma calls involved — never a real database.
import { CodingTestsService } from './coding-tests.service';
import { CodingAttemptsService } from '../coding-attempts/coding-attempts.service';
import {
  linkPendingCodingInvitations,
  normalizeEmail,
} from '../common/invitations';

type Row = Record<string, any>;

function matches(row: Row, where: Row = {}): boolean {
  return Object.entries(where).every(([key, cond]) => {
    const value = row[key];
    if (cond && typeof cond === 'object' && 'equals' in cond) {
      return cond.mode === 'insensitive'
        ? String(value ?? '').toLowerCase() ===
            String(cond.equals).toLowerCase()
        : value === cond.equals;
    }
    if (cond && typeof cond === 'object' && 'in' in cond)
      return cond.in.includes(value);
    return value === cond;
  });
}

function makeFakePrisma() {
  let seq = 0;
  const db = {
    users: [] as Row[],
    codingTests: [] as Row[],
    invitations: [] as Row[],
    attempts: [] as Row[],
    wallets: [] as Row[],
    questions: [] as Row[],
  };
  const table = (rows: Row[]) => ({
    findFirst: async ({ where }: Row = {}) =>
      rows.find((r) => matches(r, where)) ?? null,
    findUnique: async ({ where }: Row) =>
      rows.find((r) => matches(r, where)) ?? null,
    findMany: async ({ where }: Row = {}) =>
      rows.filter((r) => matches(r, where)),
    count: async ({ where }: Row = {}) =>
      rows.filter((r) => matches(r, where)).length,
    create: async ({ data }: Row) => {
      if (
        rows === db.invitations &&
        rows.some(
          (r) =>
            r.codingTestId === data.codingTestId &&
            r.candidateEmail === data.candidateEmail,
        )
      ) {
        throw Object.assign(new Error('Unique constraint failed'), {
          code: 'P2002',
        });
      }
      const row = {
        id: `id${++seq}`,
        status: 'PENDING',
        createdAt: new Date(seq),
        ...data,
      };
      rows.push(row);
      return row;
    },
    update: async ({ where, data }: Row) => {
      const row = rows.find((r) => matches(r, where));
      Object.assign(row!, data);
      return row;
    },
    updateMany: async ({ where, data }: Row) => {
      const hit = rows.filter((r) => matches(r, where));
      hit.forEach((r) => Object.assign(r, data));
      return { count: hit.length };
    },
    deleteMany: async ({ where }: Row) => {
      const keep = rows.filter((r) => !matches(r, where));
      const count = rows.length - keep.length;
      rows.splice(0, rows.length, ...keep);
      return { count };
    },
  });
  const prisma: any = {
    user: table(db.users),
    codingTest: table(db.codingTests),
    codingInvitation: {
      ...table(db.invitations),
      // getAssignedTests includes the test
      findMany: async ({ where }: Row = {}) =>
        db.invitations
          .filter((r) => matches(r, where))
          .map((r) => ({
            ...r,
            codingTest: db.codingTests.find((t) => t.id === r.codingTestId),
          })),
    },
    codingAttempt: table(db.attempts),
    codingTestQuestion: table(db.questions),
    adminCredits: table(db.wallets),
    $transaction: async (fn: (tx: any) => any) => fn(prisma),
  };
  return { prisma, db };
}

describe('Coding test invitations for candidates without an account', () => {
  let prisma: any;
  let db: ReturnType<typeof makeFakePrisma>['db'];
  let tests: CodingTestsService;
  let attempts: CodingAttemptsService;
  let deduct: jest.Mock;

  const ADMIN = 'admin-1';

  beforeEach(() => {
    ({ prisma, db } = makeFakePrisma());
    db.users.push({
      id: ADMIN,
      email: 'recruiter@acme.com',
      name: 'Recruiter',
    });
    db.wallets.push({ userId: ADMIN, balance: 100 });
    db.codingTests.push({
      id: 'test-1',
      createdById: ADMIN,
      title: 'Backend round',
      securityLevel: 'BASIC',
      duration: 45,
      description: '',
    });

    deduct = jest.fn(async (_tx, userId: string, amount: number) => {
      const w = db.wallets.find((x) => x.userId === userId)!;
      w.balance -= amount;
      return { newBalance: w.balance };
    });
    const credits: any = { deductCreditsWithinTx: deduct };
    const mail: any = {
      sendCodingTestInvitation: jest.fn(async () => undefined),
    };
    tests = new CodingTestsService(prisma, credits, mail);
    attempts = new CodingAttemptsService(prisma);
  });

  it('normalises emails', () => {
    expect(normalizeEmail('  Priya@Gmail.COM ')).toBe('priya@gmail.com');
  });

  it('stores an invitation to an unknown email as pending and charges once', async () => {
    const res = await tests.inviteCandidate(
      'test-1',
      { candidateEmail: ' Priya@Gmail.com ' },
      ADMIN,
    );
    expect(res.pending).toBe(true);
    expect(res.creditsUsed).toBeGreaterThan(0);
    expect(db.invitations).toHaveLength(1);
    expect(db.invitations[0]).toMatchObject({
      candidateEmail: 'priya@gmail.com',
      userId: null,
      status: 'PENDING',
    });
    expect(deduct).toHaveBeenCalledTimes(1);
  });

  it('shows the test to the candidate after they sign up, and lets them start it', async () => {
    await tests.inviteCandidate(
      'test-1',
      { candidateEmail: 'priya@gmail.com' },
      ADMIN,
    );
    // Candidate registers later (with different capitalisation).
    db.users.push({ id: 'cand-1', email: 'Priya@gmail.com', name: 'Priya' });

    const assigned = await tests.getAssignedTests('cand-1', 'Priya@gmail.com');
    expect(assigned.map((t) => t.id)).toEqual(['test-1']);
    expect(db.invitations[0].userId).toBe('cand-1');

    const started = await attempts.startTest('test-1', 'cand-1');
    expect(started.attemptId).toBeTruthy();
  });

  it('lets a new candidate start straight from the link, even before opening Assigned tests', async () => {
    await tests.inviteCandidate(
      'test-1',
      { candidateEmail: 'sam@x.dev' },
      ADMIN,
    );
    db.users.push({ id: 'cand-2', email: 'sam@x.dev', name: 'Sam' });
    const started = await attempts.startTest('test-1', 'cand-2');
    expect(started.attemptId).toBeTruthy();
    expect(db.invitations[0].userId).toBe('cand-2');
  });

  it('does not charge again when the same candidate is re-invited, whatever the capitalisation', async () => {
    await tests.inviteCandidate(
      'test-1',
      { candidateEmail: 'priya@gmail.com' },
      ADMIN,
    );
    const before = db.wallets[0].balance;
    const again = await tests.inviteCandidate(
      'test-1',
      { candidateEmail: 'PRIYA@gmail.com ' },
      ADMIN,
    );
    expect(again.alreadyInvited).toBe(true);
    expect(again.creditsUsed).toBe(0);
    expect(db.wallets[0].balance).toBe(before);
    expect(db.invitations).toHaveLength(1);
    expect(deduct).toHaveBeenCalledTimes(1);
  });

  it('links a pending invitation when re-invited after the candidate registered', async () => {
    await tests.inviteCandidate(
      'test-1',
      { candidateEmail: 'lee@x.dev' },
      ADMIN,
    );
    db.users.push({ id: 'cand-3', email: 'lee@x.dev', name: 'Lee' });
    const again = await tests.inviteCandidate(
      'test-1',
      { candidateEmail: 'lee@x.dev' },
      ADMIN,
    );
    expect(again.pending).toBe(false);
    expect(db.invitations[0].userId).toBe('cand-3');
    expect(deduct).toHaveBeenCalledTimes(1);
  });

  it('never re-links an invitation that already belongs to someone', async () => {
    db.invitations.push({
      id: 'inv-x',
      codingTestId: 'test-1',
      candidateEmail: 'a@x.dev',
      userId: 'someone-else',
      status: 'PENDING',
    });
    const linked = await linkPendingCodingInvitations(
      prisma,
      'cand-9',
      'a@x.dev',
    );
    expect(linked).toBe(0);
    expect(db.invitations[0].userId).toBe('someone-else');
  });

  it('still refuses candidates who were never invited', async () => {
    db.users.push({ id: 'cand-4', email: 'nobody@x.dev' });
    await expect(attempts.startTest('test-1', 'cand-4')).rejects.toThrow(
      'Not invited',
    );
  });

  it('rejects invalid email addresses without charging', async () => {
    await expect(
      tests.inviteCandidate(
        'test-1',
        { candidateEmail: 'not-an-email' },
        ADMIN,
      ),
    ).rejects.toThrow('valid email');
    expect(deduct).not.toHaveBeenCalled();
  });

  it('only removes invitations that belong to the given test', async () => {
    db.codingTests.push({
      id: 'test-2',
      createdById: ADMIN,
      title: 'Other',
      securityLevel: 'BASIC',
      duration: 30,
    });
    db.invitations.push({
      id: 'inv-other',
      codingTestId: 'test-2',
      candidateEmail: 'z@x.dev',
      userId: null,
    });
    await expect(
      tests.removeInvitation('test-1', 'inv-other', ADMIN),
    ).rejects.toThrow('not found');
    expect(db.invitations.find((i) => i.id === 'inv-other')).toBeTruthy();
  });
});
