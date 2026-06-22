import {
  Injectable,
  ForbiddenException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CodingAttemptsService {
  constructor(
    private prisma: PrismaService,
  ) {}

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

  const percentage =
    attempt.totalQuestions === 0
      ? 0
      : (
          completedQuestions /
          attempt.totalQuestions
        ) * 100;

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
    throw new Error(
      'Attempt not found',
    );
  }

  return this.prisma.codingSecurityEvent.create({
    data: {
      attemptId,
      eventType,
      details,
    },
  });
}

}