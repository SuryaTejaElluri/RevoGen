import { linkPendingCodingInvitations } from '../common/invitations';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { attemptEndsAt, remainingSeconds } from '../common/coding-attempt';

import { PrismaService } from '../prisma/prisma.service';
import { uploadProctoringScreenshot } from '../cloudinary/cloudinary-proctor.provider';
@Injectable()
export class CodingAttemptsService {
  constructor(
    private prisma: PrismaService,
  ) {}

// ─── Shared event weights (used by both BASIC and PRO) ────────────────────────
  private readonly EVENT_WEIGHTS: Record<string, number> = {
    // BASIC events
    TAB_SWITCH: 10,
    WINDOW_BLUR: 5,
    RIGHT_CLICK: 5,
    FULLSCREEN_EXIT: 15,
    COPY_ATTEMPT: 20,
    PASTE_ATTEMPT: 20,
    DEVTOOLS_SHORTCUT: 25,
    KEYBOARD_SHORTCUT_BLOCKED: 5,
    // PRO-only events
    FACE_MISSING: 8,
    MULTIPLE_FACES: 30,
    NOISE_WARNING: 5,
    CAMERA_DISABLED: 20,
    MIC_DISABLED: 10,
    FACE_NOT_CENTERED: 5,
    GAZE_AWAY: 8,
    PHONE_DETECTED: 35,
  };

  async startTest(
    codingTestId: string,
    userId: string,
  ) {
    const findInvitation = () =>
      this.prisma.codingInvitation.findFirst({
        where: {
          codingTestId,
          userId,
        },
      });

    let invitation = await findInvitation();

    // Invited before they had an account? Link the pending invitation and retry.
    if (!invitation && (await linkPendingCodingInvitations(this.prisma, userId)) > 0) {
      invitation = await findInvitation();
    }

    if (!invitation) {
      throw new ForbiddenException(
        'Not invited to this test',
      );
    }

    const existingAttempt =
      await this.prisma.codingAttempt.findFirst({
        where: {
          codingTestId,
          userId,
        },
      });

    if (existingAttempt) {
      return {
        attemptId: existingAttempt.id,
        alreadyStarted: true,
      };
    }

    const totalQuestions =
      await this.prisma.codingTestQuestion.count({
        where: {
          codingTestId,
        },
      });

    const attempt =
      await this.prisma.codingAttempt.create({
        data: {
          codingTestId,
          userId,

          candidateEmail:
            invitation.candidateEmail,

          totalQuestions,
        },
      });

    return {
      attemptId: attempt.id,
      alreadyStarted: false,
    };
  }

async getAttempt(
  attemptId: string,
  userId: string,
) {
  const attempt = await this.prisma.codingAttempt.findFirst({
    where: { id: attemptId, userId },
    include: {
      codingTest: {
        include: {
          questions: {
            orderBy: { order: 'asc' },
            include: { question: { include: { testCases: true } } },
          },
        },
      },
      submissions: {
        select: { questionId: true, status: true, score: true, passedCases: true, totalCases: true, language: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  if (!attempt) throw new NotFoundException('Test attempt not found.');

  // Never send hidden test cases (inputs / expected outputs) to the candidate's browser.
  const questions = attempt.codingTest.questions.map((tq) => {
    const { testCases, ...question } = tq.question as any;
    return {
      ...tq,
      question: {
        ...question,
        testCases: (testCases ?? []).filter((tc: any) => !tc.isHidden),
        hiddenTestCount: (testCases ?? []).filter((tc: any) => tc.isHidden).length,
      },
    };
  });

  return {
    ...attempt,
    codingTest: { ...attempt.codingTest, questions },
    // Timer is based on the server's start time, so refreshing can't reset it.
    serverNow: new Date().toISOString(),
    endsAt: attemptEndsAt(attempt.startedAt, attempt.codingTest.duration).toISOString(),
    remainingSeconds: remainingSeconds(attempt.startedAt, attempt.codingTest.duration),
  };
}

async submitAttempt(
  attemptId: string,
  userId: string,
) {
  const attempt =
    await this.prisma.codingAttempt.findFirst({
      where: {
        id: attemptId,
        userId,
      },
    });

  if (!attempt) {
    throw new NotFoundException('Test attempt not found.');
  }

  const percentage =
    attempt.totalQuestions === 0
      ? 0
      : (attempt.completedQuestions /
          attempt.totalQuestions) *
        100;

  return this.prisma.codingAttempt.update({
    where: {
      id: attemptId,
    },

    data: {
      status: 'COMPLETED',

      submittedAt: new Date(),

      percentage,
    },
  });
}


async findOne(
  id: string,
  userId: string,
) {
  return this.prisma.codingAttempt.findFirst({
    where: {
      id,
      userId,
    },

    include: {
      codingTest: {
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
      },

      submissions: true,
    },
  });
}


/**
 * Score an attempt from the latest submission per question and mark it COMPLETED.
 * Safe to call twice (auto-submit + manual click, retries): an already
 * completed attempt just returns its stored result.
 */
private async completeAttempt(attemptId: string, userId: string) {
  const attempt = await this.prisma.codingAttempt.findFirst({
    where: { id: attemptId, userId },
  });
  if (!attempt) throw new NotFoundException('Test attempt not found.');

  if (attempt.status === 'COMPLETED') {
    return {
      attempt,
      result: {
        success: true,
        alreadySubmitted: true,
        totalScore: attempt.totalScore,
        completedQuestions: attempt.completedQuestions,
        totalQuestions: attempt.totalQuestions,
        percentage: attempt.percentage,
      },
    };
  }

  const submissions = await this.prisma.codingSubmission.findMany({
    where: { attemptId, status: { in: ['PASSED', 'FAILED', 'PARTIAL'] } },
    orderBy: { createdAt: 'desc' },
  });

  // Latest submission per question counts.
  const latestPerQuestion = new Map<string, any>();
  submissions.forEach((sub) => {
    if (!latestPerQuestion.has(sub.questionId)) latestPerQuestion.set(sub.questionId, sub);
  });

  let totalScore = 0;
  latestPerQuestion.forEach((sub) => { totalScore += sub.score; });
  const completedQuestions = latestPerQuestion.size;

  // Percentage = average score across ALL questions (unsubmitted ones count as 0).
  const maxPossibleScore = attempt.totalQuestions * 100;
  const percentage = maxPossibleScore === 0 ? 0 : (totalScore / maxPossibleScore) * 100;

  await this.prisma.codingAttempt.update({
    where: { id: attemptId },
    data: { status: 'COMPLETED', submittedAt: new Date(), completedQuestions, totalScore, percentage },
  });

  // Mark the invitation as COMPLETED so the recruiter's assign page shows it.
  await this.prisma.codingInvitation.updateMany({
    where: { codingTestId: attempt.codingTestId, userId: attempt.userId },
    data: { status: 'COMPLETED' },
  });

  return {
    attempt,
    result: { success: true, alreadySubmitted: false, totalScore, completedQuestions, totalQuestions: attempt.totalQuestions, percentage },
  };
}

async finalSubmit(attemptId: string, userId: string) {
  const { result } = await this.completeAttempt(attemptId, userId);
  return result;
}

async logSecurityEvent(
  attemptId: string,
  userId: string,
  eventType: string,
  details?: any,
) {
  const attempt =
    await this.prisma.codingAttempt.findFirst({
      where: {
        id: attemptId,
        userId,
      },
    });

  if (!attempt) {
    throw new NotFoundException('Test attempt not found.');
  }

  // Leaving fullscreen / closing the tab after submitting is not a violation.
  if (attempt.status !== 'IN_PROGRESS') {
    return { ignored: true };
  }

  return this.prisma.codingSecurityEvent.create({
    data: {
      attemptId,
      eventType,
      details,
    },
  });
}

async getAttemptReport(
  attemptId: string,
  adminUserId: string,
) {
  // Find the attempt and verify admin owns the test
  const attempt = await this.prisma.codingAttempt.findFirst({
    where: { id: attemptId },
    include: {
      codingTest: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      submissions: {
        include: {
          question: {
            select: {
              id: true,
              title: true,
              difficulty: true,
              category: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
      securityEvents: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!attempt) {
    throw new NotFoundException('Test attempt not found.');
  }

  // Verify admin owns this test
  if (attempt.codingTest.createdById !== adminUserId) {
    throw new ForbiddenException('You do not have access to this report.');
  }

  // Build security event counts
  const eventCounts: Record<string, number> = {};

  let riskScore = 0;
  attempt.securityEvents.forEach((event) => {
    eventCounts[event.eventType] = (eventCounts[event.eventType] || 0) + 1;
    riskScore += this.EVENT_WEIGHTS[event.eventType] ?? 5;
  });
  riskScore = Math.min(riskScore, 100);

  const suspicionLevel =
    riskScore === 0 ? 'CLEAN' :
    riskScore <= 20 ? 'LOW' :
    riskScore <= 60 ? 'MEDIUM' : 'HIGH';

  // Build per-question submission summary (latest per question)
  const latestPerQuestion = new Map<string, any>();
  attempt.submissions.forEach((sub) => {
    const existing = latestPerQuestion.get(sub.questionId);
    if (!existing || new Date(sub.createdAt) > new Date(existing.createdAt)) {
      latestPerQuestion.set(sub.questionId, sub);
    }
  });

  const questionSummary = Array.from(latestPerQuestion.values()).map((sub) => ({
    questionId: sub.questionId,
    questionTitle: sub.question.title,
    difficulty: sub.question.difficulty,
    category: sub.question.category,
    language: sub.language,
    sourceCode: sub.sourceCode ?? null,
    status: sub.status,
    score: sub.score,
    passedCases: sub.passedCases,
    totalCases: sub.totalCases,
    submittedAt: sub.createdAt,
    submissionCount: attempt.submissions.filter(
      (s) => s.questionId === sub.questionId,
    ).length,
  }));

  return {
    attemptId: attempt.id,
    candidateEmail: attempt.candidateEmail,
    candidateName: attempt.user?.name ?? null,
    status: attempt.status,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt,
    totalScore: attempt.totalScore,
    percentage: attempt.percentage,
    completedQuestions: attempt.completedQuestions,
    totalQuestions: attempt.totalQuestions,
    testTitle: attempt.codingTest.title,
    testDuration: attempt.codingTest.duration,
    riskScore,
    suspicionLevel,
    securityEventCounts: eventCounts,
    securityEvents: attempt.securityEvents.map((e) => ({
      id: e.id,
      eventType: e.eventType,
      details: e.details,
      timestamp: e.createdAt,
      screenshotUrl: (e as any).screenshotUrl ?? null,
    })),
    totalSecurityEvents: attempt.securityEvents.length,
    questionSummary,
  };
}

async proFinalSubmit(
  attemptId: string,
  userId: string,
  proctoringData?: any,
) {
  const { attempt, result } = await this.completeAttempt(attemptId, userId);

  // Record camera/mic being off for the whole test (only on the first, real submit).
  if (!result.alreadySubmitted && proctoringData) {
    if (proctoringData.cameraDisabled || proctoringData.cameraEnabled === false) {
      await this.prisma.codingSecurityEvent.create({
        data: { attemptId: attempt.id, eventType: 'CAMERA_DISABLED', details: { source: 'final-submit-summary' } },
      });
    }
    if (proctoringData.micDisabled || proctoringData.micEnabled === false) {
      await this.prisma.codingSecurityEvent.create({
        data: { attemptId: attempt.id, eventType: 'MIC_DISABLED', details: { source: 'final-submit-summary' } },
      });
    }
  }

  return result;
}

async getProAttemptReport(
  attemptId: string,
  adminUserId: string,
) {
  const attempt = await this.prisma.codingAttempt.findFirst({
    where: { id: attemptId },
    include: {
      codingTest: true,
      user: { select: { id: true, name: true, email: true } },
      submissions: {
        include: {
          question: { select: { id: true, title: true, difficulty: true, category: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
      securityEvents: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!attempt) throw new NotFoundException('Test attempt not found.');
  if (attempt.codingTest.createdById !== adminUserId) throw new ForbiddenException('You do not have access to this report.');

  const eventCounts: Record<string, number> = {};
  let riskScore = 0;
  attempt.securityEvents.forEach((event) => {
    eventCounts[event.eventType] = (eventCounts[event.eventType] || 0) + 1;
    riskScore += this.EVENT_WEIGHTS[event.eventType] ?? 5;
  });
  riskScore = Math.min(riskScore, 100);

  const suspicionLevel =
    riskScore === 0 ? 'CLEAN' :
    riskScore <= 20 ? 'LOW' :
    riskScore <= 60 ? 'MEDIUM' : 'HIGH';

  const latestPerQuestion = new Map<string, any>();
  attempt.submissions.forEach((sub) => {
    const existing = latestPerQuestion.get(sub.questionId);
    if (!existing || new Date(sub.createdAt) > new Date(existing.createdAt)) {
      latestPerQuestion.set(sub.questionId, sub);
    }
  });

  const questionSummary = Array.from(latestPerQuestion.values()).map((sub) => ({
    questionId: sub.questionId,
    questionTitle: sub.question.title,
    difficulty: sub.question.difficulty,
    category: sub.question.category,
    language: sub.language,
    sourceCode: sub.sourceCode ?? null,
    status: sub.status,
    score: sub.score,
    passedCases: sub.passedCases,
    totalCases: sub.totalCases,
    submittedAt: sub.createdAt,
    submissionCount: attempt.submissions.filter((s) => s.questionId === sub.questionId).length,
  }));

  // PRO-specific proctoring summary
  const proProctoring = {
    cameraEnabled: (eventCounts['CAMERA_DISABLED'] ?? 0) === 0,
    micEnabled: (eventCounts['MIC_DISABLED'] ?? 0) === 0,
    faceMissingCount: eventCounts['FACE_MISSING'] ?? 0,
    multipleFacesCount: eventCounts['MULTIPLE_FACES'] ?? 0,
    noiseWarningCount: eventCounts['NOISE_WARNING'] ?? 0,
    gazeAwayCount: eventCounts['GAZE_AWAY'] ?? 0,
    phoneDetectedCount: eventCounts['PHONE_DETECTED'] ?? 0,
    faceNotCenteredCount: eventCounts['FACE_NOT_CENTERED'] ?? 0,
    tabSwitches: eventCounts['TAB_SWITCH'] ?? 0,
    fullscreenExits: eventCounts['FULLSCREEN_EXIT'] ?? 0,
    copyAttempts: eventCounts['COPY_ATTEMPT'] ?? 0,
    devtoolsAttempts: eventCounts['DEVTOOLS_SHORTCUT'] ?? 0,
  };

  return {
    attemptId: attempt.id,
    candidateEmail: attempt.candidateEmail,
    candidateName: attempt.user?.name ?? null,
    status: attempt.status,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt,
    totalScore: attempt.totalScore,
    percentage: attempt.percentage,
    completedQuestions: attempt.completedQuestions,
    totalQuestions: attempt.totalQuestions,
    testTitle: attempt.codingTest.title,
    testDuration: attempt.codingTest.duration,
    riskScore,
    suspicionLevel,
    securityEventCounts: eventCounts,
    securityEvents: attempt.securityEvents.map((e) => ({
      id: e.id, eventType: e.eventType, details: e.details, timestamp: e.createdAt,
      screenshotUrl: (e as any).screenshotUrl ?? null,
    })),
    totalSecurityEvents: attempt.securityEvents.length,
    questionSummary,
    proProctoring,
  };
}

async uploadSecurityScreenshot(
  attemptId: string,
  userId: string,
  eventType: string,
  imageDataUrl: string,
  details?: any,
) {
  const attempt = await this.prisma.codingAttempt.findFirst({
    where: { id: attemptId, userId },
    include: { codingTest: { select: { securityLevel: true } } },
  });
  if (!attempt) throw new NotFoundException('Test attempt not found.');
  if (attempt.codingTest.securityLevel !== 'PRO') {
    throw new BadRequestException('Screenshots are only used in Pro tests.');
  }
  if (attempt.status !== 'IN_PROGRESS') return { ignored: true };

  let screenshotUrl: string | null = null;
  try {
    const folder = `revogen-proctor/${attemptId}`;
    const result = await uploadProctoringScreenshot(imageDataUrl, folder);
    screenshotUrl = result.secure_url;
  } catch (err) {
    console.error('Screenshot upload failed:', err);
    // Still log the security event even if upload fails
  }

  return this.prisma.codingSecurityEvent.create({
    data: {
      attemptId,
      eventType,
      details: details ?? {},
      screenshotUrl,
    },
  });
}

}