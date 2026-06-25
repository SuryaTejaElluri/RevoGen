import {
  Injectable,
  ForbiddenException,
} from '@nestjs/common';

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
    const invitation =
      await this.prisma.codingInvitation.findFirst({
        where: {
          codingTestId,
          userId,
        },
      });

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
  try {
    const result =
      await this.prisma.codingAttempt.findFirst({
        where: {
          id: attemptId,
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

    console.log(
      "ATTEMPT RESULT:",
      JSON.stringify(result, null, 2),
    );

    return result;
  } catch (error) {
    console.error(
      "GET ATTEMPT ERROR:",
      error,
    );

    throw error;
  }
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
    throw new Error(
      'Attempt not found',
    );
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


async finalSubmit(
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
    throw new Error(
      'Attempt not found',
    );
  }

  const submissions =
    await this.prisma.codingSubmission.findMany({
      where: {
        attemptId,

        status: {
          in: [
            'PASSED',
            'FAILED',
            'PARTIAL',
          ],
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });

  const latestPerQuestion =
    new Map<string, any>();

  submissions.forEach(
    (submission) => {
      if (
        !latestPerQuestion.has(
          submission.questionId,
        )
      ) {
        latestPerQuestion.set(
          submission.questionId,
          submission,
        );
      }
    },
  );

  let totalScore = 0;

  latestPerQuestion.forEach(
    (submission) => {
      totalScore += submission.score;
    },
  );

  const completedQuestions =
    latestPerQuestion.size;

  // percentage = average score across all questions (not just completed ones)
  // e.g. 3 questions, scores [100, 50, 0] → totalScore=150, percentage=50%
  const maxPossibleScore = attempt.totalQuestions * 100;
  const percentage =
    maxPossibleScore === 0
      ? 0
      : (totalScore / maxPossibleScore) * 100;

  await this.prisma.codingAttempt.update({
    where: {
      id: attemptId,
    },

    data: {
      status: 'COMPLETED',
      submittedAt: new Date(),
      completedQuestions,
      totalScore,
      percentage,
    },
  });

  return {
    success: true,
    totalScore,
    completedQuestions,
    totalQuestions:
      attempt.totalQuestions,
    percentage,
  };
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
    throw new Error('Attempt not found');
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
    throw new Error('Attempt not found');
  }

  // Verify admin owns this test
  if (attempt.codingTest.createdById !== adminUserId) {
    throw new Error('Unauthorized');
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
  const attempt = await this.prisma.codingAttempt.findFirst({
    where: { id: attemptId, userId },
  });
  if (!attempt) throw new Error('Attempt not found');

  const submissions = await this.prisma.codingSubmission.findMany({
    where: { attemptId, status: { in: ['PASSED', 'FAILED', 'PARTIAL'] } },
    orderBy: { createdAt: 'desc' },
  });

  const latestPerQuestion = new Map<string, any>();
  submissions.forEach((s) => {
    if (!latestPerQuestion.has(s.questionId)) latestPerQuestion.set(s.questionId, s);
  });

  let totalScore = 0;
  latestPerQuestion.forEach((s) => { totalScore += s.score; });
  const completedQuestions = latestPerQuestion.size;
  // Use score-based percentage so partial submissions count proportionally
  const maxPossible = attempt.totalQuestions * 100;
  const percentage = maxPossible === 0 ? 0 : (totalScore / maxPossible) * 100;

  // Log final proctoring events if provided
  if (proctoringData) {
    const proEvents: { type: string; count: number }[] = [
      { type: 'FACE_MISSING',   count: proctoringData.faceMissingCount ?? 0 },
      { type: 'MULTIPLE_FACES', count: proctoringData.multipleFacesCount ?? 0 },
      { type: 'NOISE_WARNING',  count: proctoringData.noiseWarningCount ?? 0 },
      { type: 'GAZE_AWAY',      count: proctoringData.gazeAwayCount ?? 0 },
      { type: 'PHONE_DETECTED', count: proctoringData.phoneDetectedCount ?? 0 },
    ];
    if (proctoringData.cameraDisabled) {
      await this.prisma.codingSecurityEvent.create({
        data: { attemptId, eventType: 'CAMERA_DISABLED', details: { source: 'final-submit-summary' } },
      });
    }
    if (proctoringData.micDisabled) {
      await this.prisma.codingSecurityEvent.create({
        data: { attemptId, eventType: 'MIC_DISABLED', details: { source: 'final-submit-summary' } },
      });
    }
    // Events are already individually logged during test; summary data stored in attempt details
  }

  await this.prisma.codingAttempt.update({
    where: { id: attemptId },
    data: { status: 'COMPLETED', submittedAt: new Date(), completedQuestions, totalScore, percentage },
  });

  return { success: true, totalScore, completedQuestions, totalQuestions: attempt.totalQuestions, percentage };
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

  if (!attempt) throw new Error('Attempt not found');
  if (attempt.codingTest.createdById !== adminUserId) throw new Error('Unauthorized');

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
  if (!attempt) throw new Error('Attempt not found');
  if (attempt.codingTest.securityLevel !== 'PRO') {
    throw new Error('Screenshots only allowed for PRO assessments');
  }

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