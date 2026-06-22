import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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

    let score = 0;
    for (const question of test.questions) {
      const userAnswer = answers[question.id];
      const selectedOption =
        userAnswer === 'A' ? question.optionA
        : userAnswer === 'B' ? question.optionB
        : userAnswer === 'C' ? question.optionC
        : userAnswer === 'D' ? question.optionD
        : '';
      if (selectedOption === question.correctAnswer) score++;
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
        riskScore: proctoringData.riskScore ?? 0,
        securityScore: Math.max(0, 100 - (proctoringData.riskScore ?? 0)),
        suspicionLevel: proctoringData.summary?.riskLevel ?? 'LOW',
      },
    });

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      await this.prisma.testInvitation.updateMany({
        where: { email: user.email, testId },
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

    await this.prisma.testInvitation.createMany({
      data: emails.map((email) => ({ email, testId })),
      skipDuplicates: true,
    });

    return { message: 'Invitations created successfully', count: emails.length };
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
      where: { email },
      include: { test: true },
    });

    // Filter out tests where the candidate has already submitted (COMPLETED)
    const filtered = await Promise.all(
      invitations.map(async (inv) => {
        // Find the user by email to check attempts
        const user = await this.prisma.user.findUnique({ where: { email } });
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

  // ─── Practice tests (public) ──────────────────────────────────────────────────

  async getPracticeTests() {
    return this.prisma.test.findMany({
      where: { isPractice: true },
      include: { questions: true },
      orderBy: { title: 'asc' },
    });
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
