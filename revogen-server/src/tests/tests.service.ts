import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { correctLetter, isCorrectChoice, PAPER_TTL_MS, shuffle, signPaper, verifyPaper } from './practice-paper';
import { PrismaService } from '../prisma/prisma.service';
import { isValidEmail, normalizeEmail } from '../common/invitations';

@Injectable()
export class TestsService {
  constructor(private prisma: PrismaService) {}

  // ─── Ownership Helper ────────────────────────────────────────────────────────

  private async validateTestOwnership(
    testId: string,
    adminId: string,
  ) {
    const test = await this.prisma.test.findFirst({
      where: { id: testId, createdById: adminId },
    });
    if (!test) {
      throw new ForbiddenException('Access denied');
    }
    return test;
  }

  // ─── Create Test ─────────────────────────────────────────────────────────────

  async createTest(
    data: {
      title: string;
      duration: number;
      securityLevel?: 'BASIC' | 'PRO';
      modules: { module: string; questionCount: number }[];
      autoGenerate?: boolean;
    },
    adminId: string,
  ) {
    const test = await this.prisma.test.create({
      data: {
        title: data.title,
        duration: data.duration,
        securityLevel: data.securityLevel ?? 'BASIC',
        createdById: adminId,
        modules: { create: data.modules },
      },
      include: { modules: true },
    });

    if (data.autoGenerate !== false) {
      for (const module of data.modules) {
        const bankQuestions =
          await this.prisma.questionBank.findMany({
            where: { category: module.module },
          });

        if (bankQuestions.length < module.questionCount) {
          throw new Error(
            `${module.module} only has ${bankQuestions.length} questions available`,
          );
        }

        const selected = [...bankQuestions]
          .sort(() => Math.random() - 0.5)
          .slice(0, module.questionCount);

        for (const q of selected) {
          await this.prisma.question.create({
            data: {
              question: q.question,
              optionA: q.optionA,
              optionB: q.optionB,
              optionC: q.optionC,
              optionD: q.optionD,
              correctAnswer: q.correctAnswer,
              testId: test.id,
            },
          });
        }
      }
    }

    return this.prisma.test.findUnique({
      where: { id: test.id },
      include: { modules: true, questions: true },
    });
  }

  // ─── Get All Tests (admin-scoped) ─────────────────────────────────────────────

  async findAll(adminId: string) {
    return this.prisma.test.findMany({
      where: { createdById: adminId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { questions: true, invitations: true, attempts: true },
        },
      },
    });
  }

  // ─── Get Single Test ──────────────────────────────────────────────────────────

  async findById(id: string, adminId?: string) {
    const test = await this.prisma.test.findUnique({
      where: { id },
      include: { questions: true },
    });

    if (!test) return null;

    // Admin access: enforce ownership
    if (adminId && test.createdById && test.createdById !== adminId) {
      throw new ForbiddenException('Access denied');
    }

    return {
      ...test,
      questions: test.questions.map(
        ({ correctAnswer, ...q }) => q,
      ),
    };
  }

  // ─── Modules ─────────────────────────────────────────────────────────────────

  async getModules(testId: string, adminId: string) {
    await this.validateTestOwnership(testId, adminId);
    return this.prisma.testModule.findMany({ where: { testId } });
  }

  // ─── Add Question ─────────────────────────────────────────────────────────────

  async addQuestion(
    testId: string,
    data: {
      question: string;
      optionA: string;
      optionB: string;
      optionC: string;
      optionD: string;
      correctAnswer: string;
    },
    adminId: string,
  ) {
    await this.validateTestOwnership(testId, adminId);
    return this.prisma.question.create({
      data: { ...data, testId },
    });
  }

  // ─── Add Question from Bank ───────────────────────────────────────────────────

  async addQuestionFromBank(
    testId: string,
    questionId: string,
    adminId: string,
  ) {
    await this.validateTestOwnership(testId, adminId);

    const bankQuestion =
      await this.prisma.questionBank.findUnique({
        where: { id: questionId },
      });

    if (!bankQuestion) throw new NotFoundException('Question not found');

    return this.prisma.question.create({
      data: {
        question: bankQuestion.question,
        optionA: bankQuestion.optionA,
        optionB: bankQuestion.optionB,
        optionC: bankQuestion.optionC,
        optionD: bankQuestion.optionD,
        correctAnswer: bankQuestion.correctAnswer,
        testId,
      },
    });
  }

  // ─── Submit Test (candidate) ──────────────────────────────────────────────────

  async submitTest(
    testId: string,
    userId: string,
    answers: any,
    proctoringData: any,
  ) {
    const test = await this.prisma.test.findUnique({
      where: { id: testId },
      include: { questions: true },
    });

    if (!test) throw new NotFoundException('Test not found');
    answers = answers && typeof answers === 'object' ? answers : {};
    proctoringData = proctoringData ?? {};

    // Assigned (non-practice) tests: only invited candidates, and only once.
    if (!test.isPractice) {
      const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
      const invited = user
        ? await this.prisma.testInvitation.findFirst({
            where: { testId, email: { equals: normalizeEmail(user.email), mode: 'insensitive' } },
          })
        : null;
      if (!invited) throw new ForbiddenException('You were not invited to this test.');
      const previous = await this.prisma.attempt.findFirst({ where: { testId, userId } });
      if (previous) throw new ForbiddenException('You have already submitted this test.');
    }
    if (!test.questions.length) throw new BadRequestException('This test has no questions.');

    let score = 0;
    for (const question of test.questions) {
      const userAnswer = answers[question.id];
      if (isCorrectChoice(question, userAnswer)) score++;
    }

    const totalQuestions = test.questions.length;
    const percentage = Number(((score / totalQuestions) * 100).toFixed(2));

    const attempt = await this.prisma.attempt.create({
      data: {
        score,
        totalQuestions,
        percentage,
        tabSwitches: proctoringData.tabSwitches ?? 0,
        fullscreenViolations: proctoringData.fullscreenViolations ?? 0,
        user: { connect: { id: userId } },
        test: { connect: { id: testId } },
      },
    });

    await this.prisma.proctoringReport.create({
      data: {
        attemptId: attempt.id,
        cameraEnabled: proctoringData.cameraEnabled ?? false,
        microphoneEnabled: proctoringData.microphoneEnabled ?? false,
        tabSwitches: proctoringData.summary?.tabSwitches ?? 0,
        fullscreenViolations: proctoringData.summary?.fullscreenViolations ?? 0,
        copyAttempts: proctoringData.summary?.copyAttempts ?? 0,
        rightClickAttempts: proctoringData.summary?.rightClickAttempts ?? 0,
        idleEvents: proctoringData.summary?.idleEvents ?? 0,
        resizeEvents: proctoringData.summary?.resizeEvents ?? 0,
        faceMissingEvents: proctoringData.summary?.faceMissingEvents ?? 0,
        multipleFaceEvents: proctoringData.summary?.multipleFaceEvents ?? 0,
        noiseWarnings: proctoringData.summary?.noiseWarnings ?? 0,
        cameraDisconnectEvents: proctoringData.summary?.cameraDisconnectEvents ?? 0,
        microphoneDisconnectEvents: proctoringData.summary?.microphoneDisconnectEvents ?? 0,
        riskScore: proctoringData.riskScore ?? 0,
        securityScore: Math.max(0, 100 - (proctoringData.riskScore ?? 0)),
        suspicionLevel: proctoringData.summary?.riskLevel ?? 'LOW',
      },
    });

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      await this.prisma.testInvitation.updateMany({
        where: { email: { equals: user.email, mode: 'insensitive' }, testId },
        data: { status: 'COMPLETED' },
      });
    }

    return { score, totalQuestions, percentage, attempt };
  }

  // ─── Get Results (admin-scoped) ───────────────────────────────────────────────

  async getResults(testId: string, adminId: string) {
    await this.validateTestOwnership(testId, adminId);
    return this.prisma.attempt.findMany({
      where: { testId },
      include: { user: true, test: true, proctoringReport: true },
      orderBy: { percentage: 'desc' },
    });
  }

  // ─── Invite Candidates (admin-scoped) ─────────────────────────────────────────

  async inviteCandidates(
    testId: string,
    emails: string[],
    adminId: string,
  ) {
    await this.validateTestOwnership(testId, adminId);

    const clean = Array.from(
      new Set((emails ?? []).map((e) => normalizeEmail(e)).filter((e) => isValidEmail(e))),
    );
    if (!clean.length) {
      throw new BadRequestException('Enter at least one valid email address.');
    }

    await this.prisma.testInvitation.createMany({
      data: clean.map((email) => ({ email, testId })),
      skipDuplicates: true,
    });

    return { message: 'Invitations created successfully', count: clean.length };
  }

  // ─── Get Invitations (admin-scoped) ───────────────────────────────────────────

  async getInvitations(testId: string, adminId: string) {
    await this.validateTestOwnership(testId, adminId);
    return this.prisma.testInvitation.findMany({
      where: { testId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Candidate: get assigned tests ────────────────────────────────────────────

  async getAssignedTests(email: string) {
    const invitations = await this.prisma.testInvitation.findMany({
      where: { email: { equals: normalizeEmail(email), mode: 'insensitive' } },
      include: { test: true },
    });
    const user = await this.prisma.user.findFirst({
      where: { email: { equals: normalizeEmail(email), mode: 'insensitive' } },
      select: { id: true },
    });

    // Filter out tests where the candidate has already submitted (COMPLETED)
    const filtered = await Promise.all(
      invitations.map(async (inv) => {
        if (!user) return inv;
        const attempt = await this.prisma.attempt.findFirst({
          where: { testId: inv.testId, userId: user.id },
        });
        // Hide if already completed
        if (attempt) return null;
        return inv;
      }),
    );

    const validInvitations = filtered.filter(Boolean) as typeof invitations;

    const uniqueTests = Array.from(
      new Map(validInvitations.map((inv) => [inv.test.id, inv.test])).values(),
    );
    return uniqueTests;
  }

  // ─── Candidate: has attempted ─────────────────────────────────────────────────

  async hasAttempted(testId: string, userId: string) {
    const attempt = await this.prisma.attempt.findFirst({
      where: { testId, userId },
    });
    return { attempted: !!attempt };
  }

  // ─── Candidate: my attempts ───────────────────────────────────────────────────

  async getUserAttempts(userId: string) {
    return this.prisma.attempt.findMany({
      where: { userId },
      include: { test: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Dashboard stats (admin-scoped) ───────────────────────────────────────────

  async getDashboardStats(adminId: string) {
    const totalTests = await this.prisma.test.count({
      where: { createdById: adminId },
    });

    const adminTestIds = (
      await this.prisma.test.findMany({
        where: { createdById: adminId },
        select: { id: true },
      })
    ).map((t) => t.id);

    const totalCandidates = await this.prisma.user.count({
      where: { role: 'USER' },
    });

    const totalAttempts = await this.prisma.attempt.count({
      where: { testId: { in: adminTestIds } },
    });

    const attempts = await this.prisma.attempt.findMany({
      where: { testId: { in: adminTestIds } },
    });

    const averageScore =
      attempts.length > 0
        ? attempts.reduce((s, a) => s + a.percentage, 0) / attempts.length
        : 0;

    const pendingInvitations =
      await this.prisma.testInvitation.count({
        where: { testId: { in: adminTestIds }, status: 'PENDING' },
      });

    const completedInvitations =
      await this.prisma.testInvitation.count({
        where: { testId: { in: adminTestIds }, status: 'COMPLETED' },
      });

    const totalInvitations = pendingInvitations + completedInvitations;
    const completionRate =
      totalInvitations > 0
        ? (completedInvitations / totalInvitations) * 100
        : 0;

    return {
      totalTests,
      totalCandidates,
      totalAttempts,
      averageScore: averageScore.toFixed(1),
      pendingInvitations,
      completedInvitations,
      completionRate: completionRate.toFixed(1),
      recentAttempts: await this.prisma.attempt.findMany({
        where: { testId: { in: adminTestIds } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          user: { select: { name: true, email: true } },
          test: { select: { title: true } },
        },
      }),
    };
  }

  // ─── Delete Test (admin-scoped) ──────────────────────────────────────────────

  async deleteTest(testId: string, adminId: string) {
    await this.validateTestOwnership(testId, adminId);
    await this.prisma.test.delete({ where: { id: testId } });
    return { success: true };
  }

  // ─── Practice tests (public) ──────────────────────────────────────────────────

  // ─── Practice (public list, unlimited attempts) ──────────────────────────────

  /** Practice tests with their subject mix — never the questions or answers. */
  async getPracticeTests() {
    const tests = await this.prisma.test.findMany({
      where: { isPractice: true },
      include: { modules: true, _count: { select: { questions: true } } },
      orderBy: { title: 'asc' },
    });
    return tests.map((t) => {
      const modules = t.modules.map((m) => ({ module: m.module, questionCount: m.questionCount }));
      const fromModules = modules.reduce((n, m) => n + m.questionCount, 0);
      return {
        id: t.id,
        title: t.title,
        duration: t.duration,
        modules,
        questionCount: fromModules || t._count.questions,
      };
    });
  }

  /**
   * Build a fresh random paper for one practice attempt: for each subject in the
   * test (e.g. Java 20, SQL 10) pick that many questions from the question bank.
   * Falls back to questions attached directly to the test if it has no subjects.
   */
  async startPractice(testId: string, userId: string) {
    const test = await this.prisma.test.findFirst({
      where: { id: testId, isPractice: true },
      include: { modules: true },
    });
    if (!test) throw new NotFoundException('Practice test not found');

    type Served = { id: string; module: string; question: string; optionA: string; optionB: string; optionC: string; optionD: string };
    const served: Served[] = [];
    const shortfalls: { module: string; requested: number; available: number }[] = [];
    let source: 'bank' | 'test' = 'bank';

    if (test.modules.length) {
      for (const m of test.modules) {
        const pool = await this.prisma.questionBank.findMany({
          where: { category: { equals: m.module.trim(), mode: 'insensitive' } },
          select: { id: true },
        });
        const pickedIds = shuffle(pool.map((p) => p.id)).slice(0, m.questionCount);
        if (pickedIds.length < m.questionCount) {
          shortfalls.push({ module: m.module, requested: m.questionCount, available: pickedIds.length });
        }
        if (!pickedIds.length) continue;
        const picked = await this.prisma.questionBank.findMany({ where: { id: { in: pickedIds } } });
        picked.forEach((q) => served.push({ ...q, module: m.module }));
      }
    } else {
      source = 'test';
      const own = await this.prisma.question.findMany({ where: { testId } });
      shuffle(own).forEach((q) => served.push({ ...q, module: 'General' }));
    }

    if (!served.length) {
      throw new BadRequestException('This practice test has no questions yet. Please try another one.');
    }

    const paper = signPaper({ t: test.id, u: userId, q: served.map((q) => q.id), s: source, i: Date.now() });
    return {
      paper,
      test: { id: test.id, title: test.title, duration: test.duration },
      shortfalls,
      questions: served.map((q) => ({
        id: q.id,
        module: q.module,
        question: q.question,
        options: { A: q.optionA, B: q.optionB, C: q.optionC, D: q.optionD },
      })),
    };
  }

  /** Grade a practice paper, save the attempt, and return a full review. */
  async submitPractice(testId: string, userId: string, paperToken: string, answers: Record<string, string> = {}) {
    const paper = verifyPaper(paperToken);
    if (!paper || paper.t !== testId || paper.u !== userId) {
      throw new BadRequestException('This practice session is no longer valid. Please start the test again.');
    }
    if (Date.now() - paper.i > PAPER_TTL_MS) {
      throw new BadRequestException('This practice session has expired. Please start the test again.');
    }
    const test = await this.prisma.test.findFirst({ where: { id: testId, isPractice: true }, include: { modules: true } });
    if (!test) throw new NotFoundException('Practice test not found');

    const rows: { id: string; question: string; optionA: string; optionB: string; optionC: string; optionD: string; correctAnswer: string; category?: string }[] =
      paper.s === 'bank'
        ? await this.prisma.questionBank.findMany({ where: { id: { in: paper.q } } })
        : await this.prisma.question.findMany({ where: { id: { in: paper.q }, testId } });
    const byId = new Map(rows.map((r) => [r.id, r]));

    // Map bank categories back to the test's subject names (case-insensitive).
    const subjectFor = (category?: string) =>
      test.modules.find((m) => m.module.trim().toLowerCase() === (category ?? '').trim().toLowerCase())?.module ?? category ?? 'General';

    const answerMap = answers && typeof answers === 'object' ? answers : {};
    const review = paper.q
      .map((id) => byId.get(id))
      .filter((q): q is NonNullable<typeof q> => !!q)
      .map((q) => {
        const selected = answerMap[q.id] ? String(answerMap[q.id]).toUpperCase() : null;
        return {
          id: q.id,
          module: paper.s === 'bank' ? subjectFor(q.category) : 'General',
          question: q.question,
          options: { A: q.optionA, B: q.optionB, C: q.optionC, D: q.optionD },
          selected,
          correct: correctLetter(q),
          isCorrect: isCorrectChoice(q, selected ?? undefined),
        };
      });

    const totalQuestions = review.length;
    if (!totalQuestions) throw new BadRequestException('None of the questions in this session exist any more. Please start again.');
    const score = review.filter((r) => r.isCorrect).length;
    const percentage = Number(((score / totalQuestions) * 100).toFixed(2));

    const attempt = await this.prisma.attempt.create({
      data: { score, totalQuestions, percentage, userId, testId },
    });

    const modules = new Map<string, { module: string; correct: number; total: number }>();
    review.forEach((r) => {
      const m = modules.get(r.module) ?? { module: r.module, correct: 0, total: 0 };
      m.total++;
      if (r.isCorrect) m.correct++;
      modules.set(r.module, m);
    });

    return {
      attemptId: attempt.id,
      testId,
      title: test.title,
      score,
      totalQuestions,
      percentage,
      answered: review.filter((r) => r.selected).length,
      modules: [...modules.values()],
      review,
    };
  }

  // ─── Candidate report (verify admin owns the test) ───────────────────────────

  async getAttemptReport(attemptId: string, adminId: string) {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        test: true,
        user: { select: { id: true, name: true, email: true } },
        proctoringReport: true,
      },
    });

    if (!attempt) throw new NotFoundException('Attempt not found');

    // Ownership check — if test has an owner, enforce it
    if (attempt.test.createdById && attempt.test.createdById !== adminId) {
      throw new ForbiddenException('Access denied');
    }

    return attempt;
  }
}
