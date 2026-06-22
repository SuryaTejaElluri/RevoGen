import {
  Injectable,
   NotFoundException,
} from '@nestjs/common';


import { InviteCandidateDto } from './dto/invite-candidate.dto';

import { PrismaService }
from '../prisma/prisma.service';

import { CreateCodingTestDto }
from './dto/create-coding-test.dto';

@Injectable()
export class CodingTestsService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async create(
    dto: CreateCodingTestDto,
    userId: string,
  ) {
    const codingTest =
      await this.prisma.codingTest.create({
        data: {
          title: dto.title,
          description: dto.description,
          duration: dto.duration,
          securityLevel:
            dto.securityLevel as any,
          createdById: userId,
        },
      });

    await this.prisma.codingTestQuestion.createMany({
      data: dto.questionIds.map(
        (
          questionId,
          index,
        ) => ({
          codingTestId:
            codingTest.id,
          questionId,
          order: index + 1,
        }),
      ),
    });

    return {
      success: true,
      codingTestId:
        codingTest.id,
    };
  }

  async findAll(
    userId: string,
  ) {
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

  async findOne(
  id: string,
  userId: string,
) {
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

  async inviteCandidate(
  codingTestId: string,
  dto: InviteCandidateDto,
  userId: string,
) {
  const test =
    await this.prisma.codingTest.findFirst({
      where: {
        id: codingTestId,
        createdById: userId,
      },
    });

  if (!test) {
    throw new NotFoundException(
      'Coding test not found',
    );
  }

  const existingUser =
    await this.prisma.user.findUnique({
      where: {
        email: dto.candidateEmail,
      },
    });

  const invitation =
    await this.prisma.codingInvitation.upsert({
      where: {
        codingTestId_candidateEmail: {
          codingTestId,
          candidateEmail:
            dto.candidateEmail,
        },
      },
      update: {},
      create: {
        codingTestId,
        candidateEmail:
          dto.candidateEmail,
        userId:
          existingUser?.id,
      },
    });

  return {
    success: true,
    invitationId:
      invitation.id,
  };
}

async getInvitations(
  codingTestId: string,
  userId: string,
) {
  const test =
    await this.prisma.codingTest.findFirst({
      where: {
        id: codingTestId,
        createdById: userId,
      },
    });

  if (!test) {
    throw new NotFoundException(
      'Coding test not found',
    );
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





async getAssignedTests(
  userId: string,
) {
  const invitations =
    await this.prisma.codingInvitation.findMany({
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
    invitations.map(
      async (invitation) => {
        const attempt =
          await this.prisma.codingAttempt.findFirst({
            where: {
              codingTestId:
                invitation.codingTestId,

              userId,
            },
          });

        return {
          id:
            invitation.codingTest.id,

          title:
            invitation.codingTest.title,

          description:
            invitation.codingTest.description,

          duration:
            invitation.codingTest.duration,

          securityLevel:
            invitation.codingTest.securityLevel,

          status:
            attempt?.status ??
            'NOT_STARTED',

          attempted:
            attempt?.status ===
            'COMPLETED',

          attemptId:
            attempt?.id ?? null,
        };
      },
    ),
  );

  return results;
}



async findInvitations(
  codingTestId: string,
  userId: string,
) {
  const test =
    await this.prisma.codingTest.findFirst({
      where: {
        id: codingTestId,
        createdById: userId,
      },
    });

  if (!test) {
    throw new NotFoundException(
      'Coding test not found',
    );
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

async removeInvitation(
  codingTestId: string,
  invitationId: string,
  userId: string,
) {
  const test =
    await this.prisma.codingTest.findFirst({
      where: {
        id: codingTestId,
        createdById: userId,
      },
    });

  if (!test) {
    throw new NotFoundException(
      'Coding test not found',
    );
  }

  return this.prisma.codingInvitation.delete({
    where: {
      id: invitationId,
    },
  });
}


async getResults(
  testId: string,
  userId: string,
) {
  const attempts =
    await this.prisma.codingAttempt.findMany({
      where: {
        codingTestId: testId,
      },

      include: {
        securityEvents: true,
      },

      orderBy: {
        totalScore: 'desc',
      },
    });

  return attempts.map((attempt) => {
    let riskScore = 0;

    attempt.securityEvents.forEach(
      (event) => {
        switch (event.eventType) {
          case 'TAB_SWITCH':
            riskScore += 10;
            break;

          case 'WINDOW_BLUR':
            riskScore += 5;
            break;

          case 'RIGHT_CLICK':
            riskScore += 5;
            break;

          case 'FULLSCREEN_EXIT':
            riskScore += 15;
            break;

          case 'COPY_ATTEMPT':
            riskScore += 20;
            break;

          case 'PASTE_ATTEMPT':
            riskScore += 20;
            break;

          case 'DEVTOOLS_SHORTCUT':
            riskScore += 25;
            break;
        }
      },
    );

    return {
      id: attempt.id,

      candidateEmail:
        attempt.candidateEmail,

      status:
        attempt.status,

      totalScore:
        attempt.totalScore,

      percentage:
        attempt.percentage,

      completedQuestions:
        attempt.completedQuestions,

      totalQuestions:
        attempt.totalQuestions,

      submittedAt:
        attempt.submittedAt,

      riskScore,
    };
  });
}

}