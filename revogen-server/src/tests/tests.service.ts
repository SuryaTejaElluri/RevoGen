import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TestsService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async createTest(data: {
  title: string;
  duration: number;
  
   securityLevel?: 'BASIC' | 'PRO';

  modules: {
    module: string;
    questionCount: number;
  }[];

  autoGenerate?: boolean;
}) {
  const test =
    await this.prisma.test.create({
      data: {
        title: data.title,

        duration: data.duration,

         securityLevel:
        data.securityLevel ??
        'BASIC',

        modules: {
          create: data.modules,
        },
      },

      include: {
        modules: true,
      },
    });

  // AUTO MODE
  if (data.autoGenerate !== false) {
    for (const module of data.modules) {
      const bankQuestions =
        await this.prisma.questionBank.findMany({
          where: {
            category: module.module,
          },
        });

      if (
        bankQuestions.length <
        module.questionCount
      ) {
        throw new Error(
          `${module.module} only has ${bankQuestions.length} questions available`,
        );
      }

      const shuffled =
        [...bankQuestions].sort(
          () => Math.random() - 0.5,
        );

      const selectedQuestions =
        shuffled.slice(
          0,
          module.questionCount,
        );

      for (const question of selectedQuestions) {
        await this.prisma.question.create({
          data: {
            question:
              question.question,

            optionA:
              question.optionA,

            optionB:
              question.optionB,

            optionC:
              question.optionC,

            optionD:
              question.optionD,

            correctAnswer:
              question.correctAnswer,

            testId: test.id,
          },
        });
      }
    }
  }

  return await this.prisma.test.findUnique({
    where: {
      id: test.id,
    },

    include: {
      modules: true,
      questions: true,
    },
  });
}

async getModules(
  testId: string,
) {
  return this.prisma.testModule.findMany({
    where: {
      testId,
    },
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
  proctoringData: any,
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

    const selectedOption =
      userAnswer === 'A'
        ? question.optionA
        : userAnswer === 'B'
        ? question.optionB
        : userAnswer === 'C'
        ? question.optionC
        : userAnswer === 'D'
        ? question.optionD
        : '';

    if (
      selectedOption ===
      question.correctAnswer
    ) {
      score++;
    }
    console.log(proctoringData);
    
  }

  const totalQuestions =
    test.questions.length;

  const percentage = Number(
    (
      (score / totalQuestions) *
      100
    ).toFixed(2),
  );
console.log('PROCTORING DATA');
console.log(JSON.stringify(proctoringData, null, 2));
  const attempt =
    await this.prisma.attempt.create({
      data: {
        score,
        totalQuestions,
        percentage,

        tabSwitches:
  proctoringData.tabSwitches ?? 0,

fullscreenViolations:
  proctoringData.fullscreenViolations ?? 0,
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
    console.log('PROCTORING DATA RECEIVED');
console.log(JSON.stringify(proctoringData, null, 2));

console.log(
  'copyAttempts =',
  proctoringData.summary?.copyAttempts,
);

console.log(
  'rightClickAttempts =',
  proctoringData.summary?.rightClickAttempts,
);

  await this.prisma.proctoringReport.create({
    
    data: {
      
      attemptId: attempt.id,

      cameraEnabled:
        proctoringData.cameraEnabled ??
        false,

      microphoneEnabled:
        proctoringData.microphoneEnabled ??
        false,

      tabSwitches:
        proctoringData.summary
          ?.tabSwitches ?? 0,

      fullscreenViolations:
        proctoringData.summary
          ?.fullscreenViolations ?? 0,

       copyAttempts:
  proctoringData.summary?.copyAttempts ?? 0,

rightClickAttempts:
  proctoringData.summary?.rightClickAttempts ?? 0,

      idleEvents:
        proctoringData.summary
          ?.idleEvents ?? 0,

      resizeEvents:
        proctoringData.summary
          ?.resizeEvents ?? 0,

      faceMissingEvents:
        proctoringData.summary
          ?.faceMissingEvents ?? 0,

      multipleFaceEvents:
        proctoringData.summary
          ?.multipleFaceEvents ?? 0,

      noiseWarnings:
        proctoringData.summary
          ?.noiseWarnings ?? 0,

      riskScore:
        proctoringData.riskScore ?? 0,

      securityScore:
        Math.max(
          0,
          100 -
            (proctoringData.riskScore ??
              0),
        ),

      suspicionLevel:
        proctoringData.summary
          ?.riskLevel ?? 'LOW',
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
      test: true, 
      proctoringReport: true,
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

  const attempts =
    await this.prisma.attempt.findMany();

  const averageScore =
    attempts.length > 0
      ? attempts.reduce(
          (sum, attempt) =>
            sum + attempt.percentage,
          0,
        ) / attempts.length
      : 0;

  const pendingInvitations =
    await this.prisma.testInvitation.count({
      where: {
        status: 'PENDING',
      },
    });

  const completedInvitations =
    await this.prisma.testInvitation.count({
      where: {
        status: 'COMPLETED',
      },
    });

  const totalInvitations =
    pendingInvitations +
    completedInvitations;

  const completionRate =
    totalInvitations > 0
      ? (
          (completedInvitations /
            totalInvitations) *
          100
        )
      : 0;

  return {
    totalTests,
    totalCandidates,
    totalAttempts,

    averageScore:
      averageScore.toFixed(1),

    pendingInvitations,

    completedInvitations,

    completionRate:
      completionRate.toFixed(1),
  };
}

async getPracticeTests() {
  return this.prisma.test.findMany({
    where: {
      isPractice: true,
    },

    include: {
      questions: true,
    },

    orderBy: {
      title: 'asc',
    },
  });
}

}
