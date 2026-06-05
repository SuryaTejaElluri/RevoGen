import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TestsService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async createTest(data: {
    title: string;
    category: string;
    duration: number;
  }) {
    return this.prisma.test.create({
      data,
    });
  }

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
) {
  return this.prisma.question.create({
    data: {
      ...data,
      testId,
    },
  });
}
async findById(id: string) {
  const test = await this.prisma.test.findUnique({
    where: {
      id,
    },
    include: {
      questions: true,
    },
  });

  if (!test) {
    return null;
  }

  return {
    ...test,

    questions: test.questions.map(
      ({ correctAnswer, ...question }) =>
        question,
    ),
  };
}
async submitTest(
  testId: string,
  userId: string,
  answers: any,
  tabSwitches: number,
  fullscreenViolations: number,
) {
  const test =
    await this.prisma.test.findUnique({
      where: {
        id: testId,
      },
      include: {
        questions: true,
      },
    });

  if (!test) {
    throw new Error('Test not found');
  }

  let score = 0;

  for (const question of test.questions) {
    const userAnswer =
      answers[question.id];

    if (
      userAnswer ===
      question.correctAnswer
    ) {
      score++;
    }
  }

  const totalQuestions =
    test.questions.length;

 const percentage =
  totalQuestions > 0
    ? (score / totalQuestions) * 100
    : 0;
  const attempt =
  await this.prisma.attempt.create({
    data: {
      score,
      totalQuestions,
      percentage,

      tabSwitches:
        tabSwitches ?? 0,

      fullscreenViolations:
        fullscreenViolations ?? 0,

      user: {
        connect: {
          id: userId,
        },
      },

      test: {
        connect: {
          id: testId,
        },
      },
    },
  });

    await this.prisma.testInvitation.updateMany({
  where: {
    email: (
      await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
      })
    )?.email,

    testId,
  },

  data: {
    status: 'COMPLETED',
  },
});

  return {
    score,
    totalQuestions,
    percentage,
    attempt,
  };
}
async getUserAttempts(userId: string) {
  return this.prisma.attempt.findMany({
    where: {
      userId,
    },

    include: {
      test: true,
    },

    orderBy: {
      createdAt: 'desc',
    },
  });
}
async findAll() {
  return this.prisma.test.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });

  
}

async addQuestionFromBank(
  testId: string,
  questionId: string,
) {
  const bankQuestion =
    await this.prisma.questionBank.findUnique({
      where: {
        id: questionId,
      },
    });

  if (!bankQuestion) {
    throw new Error(
      'Question not found',
    );
  }

  return this.prisma.question.create({
    data: {
      question:
        bankQuestion.question,

      optionA:
        bankQuestion.optionA,

      optionB:
        bankQuestion.optionB,

      optionC:
        bankQuestion.optionC,

      optionD:
        bankQuestion.optionD,

      correctAnswer:
        bankQuestion.correctAnswer,

      testId,
    },
  });
}
async inviteCandidates(
  testId: string,
  emails: string[],
) {
  const invitations =
    emails.map((email) => ({
      email,
      testId,
    }));

  await this.prisma.testInvitation.createMany({
    data: invitations,

    skipDuplicates: true,
  });

  return {
    message:
      'Invitations created successfully',
    count: invitations.length,
  };
}
async getAssignedTests(
  email: string,
) {
  const invitations =
    await this.prisma.testInvitation.findMany({
      where: {
        email,
        status: 'PENDING',
      },

      include: {
        test: true,
      },
    });

  const uniqueTests =
    Array.from(
      new Map(
        invitations.map(
          (invitation) => [
            invitation.test.id,
            invitation.test,
          ],
        ),
      ).values(),
    );

  return uniqueTests;
}
async getResults(
  testId: string,
) {
  return this.prisma.attempt.findMany({
    where: {
      testId,
    },

    include: {
      user: true,
    },

    orderBy: {
      percentage: 'desc',
    },
  });
}

async getInvitations(
  testId: string,
) {
  return this.prisma.testInvitation.findMany({
    where: {
      testId,
    },

    orderBy: {
      createdAt: 'desc',
    },
  });
}
async hasAttempted(
  testId: string,
  userId: string,
) {
  const attempt =
    await this.prisma.attempt.findFirst({
      where: {
        testId,
        userId,
      },
    });

  return {
    attempted: !!attempt,
  };
}

async getDashboardStats() {
  const totalTests =
    await this.prisma.test.count();

  const totalCandidates =
    await this.prisma.user.count({
      where: {
        role: 'USER',
      },
    });

  const totalAttempts =
    await this.prisma.attempt.count();

  return {
    totalTests,
    totalCandidates,
    totalAttempts,
  };
}
}
