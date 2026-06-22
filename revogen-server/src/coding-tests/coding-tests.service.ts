import { Injectable, NotFoundException } from '@nestjs/common';
import { InviteCandidateDto } from './dto/invite-candidate.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCodingTestDto } from './dto/create-coding-test.dto';

@Injectable()
export class CodingTestsService {
  constructor(private prisma: PrismaService) {}

  private readonly EVENT_WEIGHTS: Record<string, number> = {
    TAB_SWITCH: 10,
    WINDOW_BLUR: 5,
    RIGHT_CLICK: 5,
    FULLSCREEN_EXIT: 15,
    COPY_ATTEMPT: 20,
    PASTE_ATTEMPT: 20,
    DEVTOOLS_SHORTCUT: 25,
    KEYBOARD_SHORTCUT_BLOCKED: 5,
    FACE_MISSING: 8,
    MULTIPLE_FACES: 30,
    NOISE_WARNING: 5,
    CAMERA_DISABLED: 20,
    MIC_DISABLED: 10,
    FACE_NOT_CENTERED: 5,
    GAZE_AWAY: 8,
    PHONE_DETECTED: 35,
  };

  async create(dto: CreateCodingTestDto, userId: string) {
    const codingTest = await this.prisma.codingTest.create({
      data: {
        title: dto.title,
        description: dto.description,
        duration: dto.duration,
        securityLevel: dto.securityLevel as any,
        createdById: userId,
      },
    });

    await this.prisma.codingTestQuestion.createMany({
      data: dto.questionIds.map((questionId, index) => ({
        codingTestId: codingTest.id,
        questionId,
        order: index + 1,
      })),
    });

    return {
      success: true,
      codingTestId: codingTest.id,
    };
  }

  async findAll(userId: string) {
    return this.prisma.codingTest.findMany({
      where: {
        createdById: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        questions: {
          include: {
            question: true,
          },
        },
      },
    });
  }

  async findOne(id: string, userId: string) {
    return this.prisma.codingTest.findFirst({
      where: {
        id,
        createdById: userId,
      },
      include: {
        questions: {
          orderBy: {
            order: 'asc',
          },
          include: {
            question: {
              include: {
                testCases: true,
              },
            },
          },
        },
      },
    });
  }

  // Invitation limits by security level
  private readonly INVITE_LIMITS: Record<string, number> = {
    BASIC: 4,
    PRO: 3,
  };

  async inviteCandidate(codingTestId: string, dto: InviteCandidateDto, userId: string) {
    const test = await this.prisma.codingTest.findFirst({
      where: { id: codingTestId, createdById: userId },
    });

    if (!test) {
      throw new NotFoundException('Coding test not found');
    }

    const limit = this.INVITE_LIMITS[test.securityLevel] ?? 4;

    // Check if already invited — re-inviting same email doesn't consume a slot
    const alreadyInvited = await this.prisma.codingInvitation.findUnique({
      where: {
        codingTestId_candidateEmail: {
          codingTestId,
          candidateEmail: dto.candidateEmail,
        },
      },
    });

    const currentCount = await this.prisma.codingInvitation.count({
      where: { codingTestId },
    });

    if (!alreadyInvited && currentCount >= limit) {
      throw new Error(
        `Invitation limit reached. Maximum ${limit} candidates allowed for ${test.securityLevel} security.`,
      );
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.candidateEmail },
    });

    const invitation = await this.prisma.codingInvitation.upsert({
      where: {
        codingTestId_candidateEmail: {
          codingTestId,
          candidateEmail: dto.candidateEmail,
        },
      },
      update: {},
      create: {
        codingTestId,
        candidateEmail: dto.candidateEmail,
        userId: existingUser?.id,
      },
    });

    const newCount = alreadyInvited ? currentCount : currentCount + 1;

    return {
      success: true,
      invitationId: invitation.id,
      currentCount: newCount,
      limit,
      remaining: limit - newCount,
    };
  }

  async getInvitations(codingTestId: string, userId: string) {
    const test = await this.prisma.codingTest.findFirst({
      where: {
        id: codingTestId,
        createdById: userId,
      },
    });

    if (!test) {
      throw new NotFoundException('Coding test not found');
    }

    return this.prisma.codingInvitation.findMany({
      where: {
        codingTestId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getAssignedTests(userId: string) {
    const invitations = await this.prisma.codingInvitation.findMany({
      where: {
        userId,
      },
      include: {
        codingTest: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const results = await Promise.all(
      invitations.map(async (invitation) => {
        const attempt = await this.prisma.codingAttempt.findFirst({
          where: {
            codingTestId: invitation.codingTestId,
            userId,
          },
        });

        return {
          id: invitation.codingTest.id,
          title: invitation.codingTest.title,
          description: invitation.codingTest.description,
          duration: invitation.codingTest.duration,
          securityLevel: invitation.codingTest.securityLevel,
          status: attempt?.status ?? 'NOT_STARTED',
          attempted: attempt?.status === 'COMPLETED',
          attemptId: attempt?.id ?? null,
        };
      }),
    );

    return results.filter((r) => r.status !== 'COMPLETED');
  }

  async getInvitationsWithAttempts(codingTestId: string, userId: string) {
    const test = await this.prisma.codingTest.findFirst({
      where: {
        id: codingTestId,
        createdById: userId,
      },
    });

    if (!test) {
      throw new NotFoundException('Coding test not found');
    }

    const invitations = await this.prisma.codingInvitation.findMany({
      where: { codingTestId },
      orderBy: { createdAt: 'desc' },
    });

    // Enrich with attempt status
    const enriched = await Promise.all(
      invitations.map(async (inv) => {
        const attempt = inv.userId
          ? await this.prisma.codingAttempt.findFirst({
              where: { codingTestId, userId: inv.userId },
              select: { id: true, status: true },
            })
          : null;
        return {
          ...inv,
          attemptStatus: attempt?.status ?? null,
          attemptId: attempt?.id ?? null,
        };
      }),
    );

    return enriched;
  }

  async removeInvitation(codingTestId: string, invitationId: string, userId: string) {
    const test = await this.prisma.codingTest.findFirst({
      where: {
        id: codingTestId,
        createdById: userId,
      },
    });

    if (!test) {
      throw new NotFoundException('Coding test not found');
    }

    return this.prisma.codingInvitation.delete({
      where: {
        id: invitationId,
      },
    });
  }

  async getResults(testId: string, userId: string) {
    const attempts = await this.prisma.codingAttempt.findMany({
      where: {
        codingTestId: testId,
      },
      include: {
        securityEvents: true,
        submissions: {
          include: {
            question: {
              select: {
                id: true,
                title: true,
                difficulty: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: {
        totalScore: 'desc',
      },
    });

    const eventWeights = this.EVENT_WEIGHTS;

    return attempts.map((attempt) => {
      let riskScore = 0;
      const eventCounts: Record<string, number> = {};
      
      attempt.securityEvents.forEach((event) => {
        riskScore += eventWeights[event.eventType] ?? 5;
        eventCounts[event.eventType] = (eventCounts[event.eventType] || 0) + 1;
      });

      riskScore = Math.min(riskScore, 100);

      const suspicionLevel =
        riskScore === 0 ? 'CLEAN' :
        riskScore <= 20 ? 'LOW' :
        riskScore <= 60 ? 'MEDIUM' : 'HIGH';

      // Latest submission per question
      const latestPerQuestion = new Map<string, any>();
      attempt.submissions.forEach((sub) => {
        if (!latestPerQuestion.has(sub.questionId)) {
          latestPerQuestion.set(sub.questionId, sub);
        }
      });

      const questionResults = Array.from(latestPerQuestion.values()).map((sub) => ({
        questionId: sub.questionId,
        title: sub.question.title,
        difficulty: sub.question.difficulty,
        status: sub.status,
        score: sub.score,
        passedCases: sub.passedCases,
        totalCases: sub.totalCases,
        language: sub.language,
      }));

      // PRO proctoring summary from events
      const proSummary = {
        faceMissingCount: eventCounts['FACE_MISSING'] ?? 0,
        multipleFacesCount: eventCounts['MULTIPLE_FACES'] ?? 0,
        noiseWarningCount: eventCounts['NOISE_WARNING'] ?? 0,
        cameraDisabled: (eventCounts['CAMERA_DISABLED'] ?? 0) > 0,
        micDisabled: (eventCounts['MIC_DISABLED'] ?? 0) > 0,
        gazeAwayCount: eventCounts['GAZE_AWAY'] ?? 0,
        phoneDetectedCount: eventCounts['PHONE_DETECTED'] ?? 0,
      };

      return {
        id: attempt.id,
        candidateEmail: attempt.candidateEmail,
        status: attempt.status,
        totalScore: attempt.totalScore,
        percentage: attempt.percentage,
        completedQuestions: attempt.completedQuestions,
        totalQuestions: attempt.totalQuestions,
        submittedAt: attempt.submittedAt,
        startedAt: attempt.startedAt,
        riskScore,
        suspicionLevel,
        totalSecurityEvents: attempt.securityEvents.length,
        securityEventCounts: eventCounts,
        questionResults,
        proSummary,
      };
    });
  }

  async getCodingDashboardStats(adminId: string) {
    const tests = await this.prisma.codingTest.findMany({
      where: { createdById: adminId },
      select: { id: true },
    });
    const testIds = tests.map((t) => t.id);

    const totalCodingTests = tests.length;

    const totalCodingAttempts = await this.prisma.codingAttempt.count({
      where: { codingTestId: { in: testIds } },
    });

    const completedAttempts = await this.prisma.codingAttempt.findMany({
      where: { codingTestId: { in: testIds }, status: 'COMPLETED' },
      select: { percentage: true },
    });

    const avgCodingScore =
      completedAttempts.length > 0
        ? completedAttempts.reduce((s, a) => s + a.percentage, 0) / completedAttempts.length
        : 0;

    const pendingCodingInvites = await this.prisma.codingInvitation.count({
      where: { codingTestId: { in: testIds }, status: 'PENDING' },
    });

    const completedCodingInvites = await this.prisma.codingInvitation.count({
      where: { codingTestId: { in: testIds }, status: 'COMPLETED' },
    });

    // High risk: attempts with more than 3 security events
    const attemptsWithEvents = await this.prisma.codingAttempt.findMany({
      where: { codingTestId: { in: testIds } },
      select: {
        id: true,
        _count: { select: { securityEvents: true } },
      },
    });
    
    const highRiskCount = attemptsWithEvents.filter(
      (a) => a._count.securityEvents > 3,
    ).length;

    // Recent 5 coding submissions
    const recentAttempts = await this.prisma.codingAttempt.findMany({
      where: { codingTestId: { in: testIds } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { codingTest: { select: { title: true } } },
    });

    return {
      totalCodingTests,
      totalCodingAttempts,
      avgCodingScore: avgCodingScore.toFixed(1),
      pendingCodingInvites,
      completedCodingInvites,
      highRiskCount,
      recentAttempts: recentAttempts.map((a) => ({
        id: a.id,
        candidateEmail: a.candidateEmail,
        testTitle: a.codingTest.title,
        status: a.status,
        percentage: a.percentage,
        createdAt: a.createdAt,
      })),
    };
  }
}