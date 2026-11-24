import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InviteCandidateDto } from './dto/invite-candidate.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCodingTestDto } from './dto/create-coding-test.dto';
import { CreditsService } from '../credits/credits.service';
import { CREDIT_COST } from '../common/constants/credits.constants';
import { MailService } from '../mail/mail.service';
import {
  isValidEmail,
  linkPendingCodingInvitations,
  normalizeEmail,
} from '../common/invitations';
@Injectable()
export class CodingTestsService {
  constructor(
    private prisma: PrismaService,
    private creditsService: CreditsService,
     private readonly mailService: MailService,
  ) {}

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

  async deleteTest(id: string, userId: string) {
    const test = await this.prisma.codingTest.findFirst({
      where: { id, createdById: userId },
    });
    if (!test) {
      throw new NotFoundException('Coding test not found or access denied');
    }
    await this.prisma.codingTest.delete({ where: { id } });
    return { success: true };
  }

  async inviteCandidate(
    codingTestId: string,
    dto: InviteCandidateDto,
    userId: string,
  ) {
    const candidateEmail = normalizeEmail(dto?.candidateEmail);
    if (!isValidEmail(candidateEmail)) {
      throw new BadRequestException('Enter a valid email address.');
    }

    // 1. Load test (must belong to this admin)
    const test = await this.prisma.codingTest.findFirst({
      where: { id: codingTestId, createdById: userId },
    });
    if (!test) {
      throw new NotFoundException('Coding test not found');
    }

    const limit = this.INVITE_LIMITS[test.securityLevel] ?? 4;

    // 2. Already invited? Compare case-insensitively so "Priya@x.com" and
    //    "priya@x.com " are the same candidate and are never charged twice.
    const alreadyInvited = await this.prisma.codingInvitation.findFirst({
      where: {
        codingTestId,
        candidateEmail: { equals: candidateEmail, mode: 'insensitive' },
      },
    });

    const currentCount = await this.prisma.codingInvitation.count({
      where: { codingTestId },
    });

    if (!alreadyInvited && currentCount >= limit) {
      throw new BadRequestException(
        `Invitation limit reached. Maximum ${limit} candidates allowed for ${test.securityLevel} security.`,
      );
    }

    // 3. Registered user with this email? If not, the invitation stays pending
    //    (userId = null) and is linked when they sign up and log in.
    const existingUser = await this.prisma.user.findFirst({
      where: { email: { equals: candidateEmail, mode: 'insensitive' } },
      select: { id: true, name: true },
    });

    // 4. Credits: only a brand-new invitation costs credits. Re-inviting the
    //    same candidate just re-sends the email.
    const isNew = !alreadyInvited;
    const creditsPerCandidate = CREDIT_COST[test.securityLevel] ?? 5;
    const requiredCredits = isNew ? creditsPerCandidate : 0;

    if (isNew) {
      const wallet = await this.prisma.adminCredits.findUnique({
        where: { userId },
      });
      const available = wallet?.balance ?? 0;
      if (available < requiredCredits) {
        throw new BadRequestException({
          success: false,
          message: 'Insufficient Revo Credits.',
          requiredCredits,
          availableCredits: available,
        });
      }
    }

    // 5. Transaction
    let remainingCredits = 0;

    const invitation = await this.prisma.$transaction(async (tx) => {
      if (!isNew) {
        const wallet = await tx.adminCredits.findUnique({ where: { userId } });
        remainingCredits = wallet?.balance ?? 0;

        // Link a pending invitation if the candidate has registered since.
        if (!alreadyInvited.userId && existingUser) {
          return tx.codingInvitation.update({
            where: { id: alreadyInvited.id },
            data: { userId: existingUser.id },
          });
        }
        return alreadyInvited;
      }

      const result = await this.creditsService.deductCreditsWithinTx(
        tx,
        userId,
        requiredCredits,
        `Coding Test Assignment (${test.securityLevel})`,
        codingTestId,
      );
      remainingCredits = result.newBalance;

      return tx.codingInvitation.create({
        data: {
          codingTestId,
          candidateEmail,
          userId: existingUser?.id ?? null,
        },
      });
    });

    const newCount = isNew ? currentCount + 1 : currentCount;

    // Send invitation email (don't fail the invitation if email fails)
    try {
      await this.mailService.sendCodingTestInvitation(
        candidateEmail,
        existingUser?.name ?? null,
        test.title,
        test.securityLevel,
        test.duration,
        `${process.env.CLIENT_URL}/assigned-tests`,
      );
    } catch (err) {
      console.error('Failed to send coding test invitation email', err);
    }

    return {
      success: true,
      invitationId: invitation.id,
      alreadyInvited: !isNew,
      pending: !invitation.userId,
      currentCount: newCount,
      limit,
      remaining: limit - newCount,
      creditsUsed: requiredCredits,
      remainingCredits,
    };
  }

  async getInvitations(codingTestId: string, userId: string) {
    const test = await this.prisma.codingTest.findFirst({
      where: { id: codingTestId, createdById: userId },
    });

    if (!test) {
      throw new NotFoundException('Coding test not found');
    }

    const invitations = await this.prisma.codingInvitation.findMany({
      where: { codingTestId },
      orderBy: { createdAt: 'desc' },
    });

    // Enrich every invitation with real attempt status.
    // Look up by userId first (most reliable); fall back to candidateEmail
    // so we catch attempts made before the user registered.
    const enriched = await Promise.all(
      invitations.map(async (inv) => {
        const attempt = await this.prisma.codingAttempt.findFirst({
          where: {
            codingTestId,
            ...(inv.userId
              ? { userId: inv.userId }
              : { candidateEmail: inv.candidateEmail }),
          },
          select: { id: true, status: true, percentage: true, submittedAt: true },
        });
        return {
          ...inv,
          attemptStatus: attempt?.status ?? null,
          attemptId: attempt?.id ?? null,
          attemptPercentage: attempt?.percentage ?? null,
          submittedAt: attempt?.submittedAt ?? null,
        };
      }),
    );

    return enriched;
  }

  async getAssignedTests(userId: string, email?: string) {
    // Pick up invitations sent before this account existed.
    await linkPendingCodingInvitations(this.prisma, userId, email);

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

    // Only delete an invitation that belongs to this admin's test.
    const { count } = await this.prisma.codingInvitation.deleteMany({
      where: { id: invitationId, codingTestId },
    });
    if (!count) {
      throw new NotFoundException('Invitation not found');
    }
    return { success: true };
  }

  async getResults(testId: string, userId: string) {
    // Only the recruiter who created the test can see its results.
    const test = await this.prisma.codingTest.findFirst({
      where: { id: testId, createdById: userId },
      select: { id: true },
    });
    if (!test) {
      throw new NotFoundException('Coding test not found');
    }

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