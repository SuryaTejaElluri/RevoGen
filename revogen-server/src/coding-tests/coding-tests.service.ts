import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCodingTestDto } from './dto/create-coding-test.dto';
import { NotFoundException } from '@nestjs/common';
import { UpdateCodingTestDto } from './dto/update-coding-test.dto';
import { StartAssessmentDto } from './dto/start-assessment.dto';
import { FinalSubmitDto } from './dto/final-submit.dto';
import { ForbiddenException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { InviteCodingCandidatesDto } from './dto/invite-coding-candidates.dto';
import { CreateSecurityEventDto } from './dto/create-security-event.dto';

@Injectable()
export class CodingTestsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCodingTestDto, userId: string) {
    const codingTest = await this.prisma.codingTest.create({
      data: {
        title: dto.title,
        description: dto.description,
        category: dto.category,
        duration: dto.duration,
        createdById: userId,
      },
    });

    await this.prisma.codingTestQuestion.createMany({
      data: dto.questionIds.map((questionId, index) => ({
        codingTestId: codingTest.id,
        codingQuestionId: questionId,
        orderNo: index + 1,
      })),
    });

    return this.prisma.codingTest.findUnique({
      where: {
        id: codingTest.id,
      },
      include: {
        questions: {
          include: {
            codingQuestion: true,
          },
        },
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.codingTest.findMany({
      where: {
        createdById: userId,
      },
      include: {
        questions: {
          include: {
            codingQuestion: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, userId: string) {
    const test = await this.prisma.codingTest.findUnique({
      where: { id },
      include: {
        questions: {
          include: {
            codingQuestion: {
              include: {
                testCases: {
                  where: {
                    isHidden: false,
                    isActive: true,
                  },
                  select: {
                    id: true,
                    input: true,
                    expectedOutput: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!test) {
      throw new NotFoundException('Coding test not found');
    }

    if (test.createdById !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return test;
  }

  async update(id: string, dto: UpdateCodingTestDto, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.codingTest.update({
      where: { id },
      data: {
        ...dto,
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.codingTest.delete({
      where: { id },
    });
  }

  async logSecurityEvent(dto: CreateSecurityEventDto) {
    await this.prisma.securityEvent.create({
      data: {
        codingTestId: dto.codingTestId,
        attemptId: dto.attemptId,
        eventType: dto.eventType,
        details: dto.details,
      },
    });

    return {
      success: true,
    };
  }

  async finalSubmit(dto: FinalSubmitDto) {
    const codingTest = await this.prisma.codingTest.findUnique({
      where: {
        id: dto.codingTestId,
      },
      include: {
        questions: true,
      },
    });

    if (!codingTest) {
      throw new NotFoundException('Assessment not found');
    }

    const submissions = await this.prisma.codingSubmission.findMany({
      where: {
        codingTestId: dto.codingTestId,
        attemptId: dto.attemptId,
      },
    });

    const totalQuestions = codingTest.questions.length;
    const uniqueQuestions = new Set(
      submissions.map((s) => s.codingQuestionId),
    );
    const completedQuestions = uniqueQuestions.size;
    const totalScore = submissions.reduce(
      (sum, submission) => sum + submission.score,
      0,
    );
    const maxScore = totalQuestions * 100;
    const percentage =
      maxScore === 0 ? 0 : Math.round((totalScore / maxScore) * 100);

    const securityViolations = await this.prisma.securityEvent.count({
      where: {
        attemptId: dto.attemptId,
      },
    });

    const tabSwitches = await this.prisma.securityEvent.count({
      where: {
        attemptId: dto.attemptId,
        eventType: 'TAB_SWITCH',
      },
    });

    const fullscreenExits = await this.prisma.securityEvent.count({
      where: {
        attemptId: dto.attemptId,
        eventType: 'FULLSCREEN_EXIT',
      },
    });

    const devToolsOpened = await this.prisma.securityEvent.count({
      where: {
        attemptId: dto.attemptId,
        eventType: 'DEVTOOLS_OPENED',
      },
    });

    const largePaste = await this.prisma.securityEvent.count({
      where: {
        attemptId: dto.attemptId,
        eventType: 'LARGE_PASTE',
      },
    });

    const riskPoints =
      tabSwitches * 5 +
      fullscreenExits * 10 +
      devToolsOpened * 20 +
      largePaste * 15;

    let riskLevel = 'LOW';

    if (riskPoints >= 50) {
      riskLevel = 'HIGH';
    } else if (riskPoints >= 20) {
      riskLevel = 'MEDIUM';
    }

    const attempt = await this.prisma.assessmentAttempt.update({
      where: {
        id: dto.attemptId,
      },
      data: {
        totalQuestions,
        completedQuestions,
        totalScore,
        percentage,
        securityViolations,
        riskScore: riskPoints,
        riskLevel,
        status: 'COMPLETED',
        submittedAt: new Date(),
      },
    });

    return {
      success: true,
      attemptId: attempt.id,
      totalQuestions,
      completedQuestions,
      totalScore,
      percentage,
      securityViolations,
      submittedAt: attempt.submittedAt,
    };
  }

  async getResult(attemptId: string, userId: string) {
    const attempt = await this.prisma.assessmentAttempt.findUnique({
      where: {
        id: attemptId,
      },
      include: {
        codingTest: {
          select: {
            title: true,
            duration: true,
            createdById: true,
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException('Result not found');
    }

    if (attempt.codingTest.createdById !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const submissions = await this.prisma.codingSubmission.findMany({
      where: {
        attemptId,
      },
      include: {
        codingQuestion: {
          select: {
            id: true,
            title: true,
            difficulty: true,
            category: true,
          },
        },
      },
      orderBy: {
        submittedAt: 'desc',
      },
    });

    const testQuestions = await this.prisma.codingTestQuestion.findMany({
      where: {
        codingTestId: attempt.codingTestId,
      },
      include: {
        codingQuestion: {
          select: {
            id: true,
            title: true,
            difficulty: true,
            category: true,
          },
        },
      },
      orderBy: {
        orderNo: 'asc',
      },
    });

    const questionReport = testQuestions.map((q) => {
      const submission = submissions.find(
        (s) => s.codingQuestionId === q.codingQuestionId,
      );

      return {
        attemptId,
        questionId: q.codingQuestion.id,
        title: q.codingQuestion.title,
        difficulty: q.codingQuestion.difficulty,
        category: q.codingQuestion.category,
        attempted: !!submission,
        status: submission?.status ?? 'NOT_ATTEMPTED',
        score: submission?.score ?? 0,
        passedCases: submission?.passedCases ?? 0,
        totalCases: submission?.totalCases ?? 0,
        language: submission?.language ?? null,
        submittedAt: submission?.submittedAt ?? null,
      };
    });

    const securityEvents = await this.prisma.securityEvent.findMany({
      where: {
        attemptId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const eventSummary = {
      TAB_SWITCH: 0,
      FULLSCREEN_EXIT: 0,
      DEVTOOLS_OPENED: 0,
      LARGE_PASTE: 0,
      REFRESH_ATTEMPT: 0,
    };

    for (const event of securityEvents) {
      if (event.eventType in eventSummary) {
        eventSummary[event.eventType as keyof typeof eventSummary]++;
      }
    }

    const riskPoints =
      eventSummary.TAB_SWITCH * 2 +
      eventSummary.FULLSCREEN_EXIT * 5 +
      eventSummary.LARGE_PASTE * 10 +
      eventSummary.DEVTOOLS_OPENED * 20 +
      eventSummary.REFRESH_ATTEMPT * 5;

    let riskLevel = 'LOW';

    if (riskPoints >= 50) {
      riskLevel = 'HIGH';
    } else if (riskPoints >= 20) {
      riskLevel = 'MEDIUM';
    }

    return {
      summary: attempt,
      reportDetails: {
        testName: attempt.codingTest.title,
        duration: attempt.codingTest.duration,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
      },
      questions: questionReport,
      proctoring: {
        riskScore: attempt.riskScore,
        riskLevel: attempt.riskLevel,
        eventSummary,
        totalEvents: securityEvents.length,
      },
      securityEvents,
    };
  }

  async getSecurityEvents(codingTestId: string, userId: string) {
    const test = await this.prisma.codingTest.findUnique({
      where: {
        id: codingTestId,
      },
    });

    if (!test) {
      throw new NotFoundException('Coding test not found');
    }

    if (test.createdById !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.securityEvent.findMany({
      where: {
        codingTestId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async startAssessment(
  dto: StartAssessmentDto,
  email: string,
) {
    const codingTest = await this.prisma.codingTest.findUnique({
      where: {
        id: dto.codingTestId,
      },
      include: {
        questions: true,
      },
    });

    if (!codingTest) {
      throw new NotFoundException('Assessment not found');
    }
console.log("JWT Email:", email);
console.log("DTO:", dto);
    const assignment =
  await this.prisma.codingAssignment.findFirst({
    where: {
      codingTestId: dto.codingTestId,
      candidateEmail: email,
    },
  });

  console.log("Assignment:", assignment);

if (!assignment) {
  throw new ForbiddenException(
    'Assessment not assigned',
  );
}

const existingAttempt =
  await this.prisma.assessmentAttempt.findFirst({
    where: {
      codingTestId: dto.codingTestId,
      candidateEmail: email,
    },
  });

if (existingAttempt) {
  return {
    attemptId: existingAttempt.id,
    resumed: true,
  };
}
    const attempt = await this.prisma.assessmentAttempt.create({
  data: {
    codingTestId: dto.codingTestId,

    candidateName: assignment.candidateName,
    candidateEmail: assignment.candidateEmail,

    totalQuestions: codingTest.questions.length,
    completedQuestions: 0,
    totalScore: 0,
    percentage: 0,
    securityViolations: 0,
    riskScore: 0,
    riskLevel: 'LOW',
    status: 'IN_PROGRESS',
    startedAt: new Date(),
    submittedAt: new Date(),
  },
});
    return {
      success: true,
      attemptId: attempt.id,
    };
  }

  async getAttempts(codingTestId: string, userId: string) {
    const test = await this.prisma.codingTest.findUnique({
      where: {
        id: codingTestId,
      },
    });

    if (!test) {
      throw new NotFoundException('Coding test not found');
    }

    if (test.createdById !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const attempts = await this.prisma.assessmentAttempt.findMany({
      where: {
        codingTestId,
        status: 'COMPLETED',
      },
      orderBy: {
        submittedAt: 'desc',
      },
    });

    const results = await Promise.all(
      attempts.map(async (attempt) => {
        const securityEvents = await this.prisma.securityEvent.findMany({
          where: {
            attemptId: attempt.id,
          },
        });

        const assignment =
  await this.prisma.codingAssignment.findFirst({
    where: {
      attemptId: attempt.id,
    },
  });

        const eventSummary = {
          TAB_SWITCH: 0,
          FULLSCREEN_EXIT: 0,
          DEVTOOLS_OPENED: 0,
          LARGE_PASTE: 0,
          REFRESH_ATTEMPT: 0,
        };

        securityEvents.forEach((event) => {
          if (event.eventType in eventSummary) {
            eventSummary[event.eventType as keyof typeof eventSummary]++;
          }
        });

        const riskScore =
          eventSummary.TAB_SWITCH * 2 +
          eventSummary.FULLSCREEN_EXIT * 5 +
          eventSummary.LARGE_PASTE * 10 +
          eventSummary.DEVTOOLS_OPENED * 20 +
          eventSummary.REFRESH_ATTEMPT * 5;

        let riskLevel = 'LOW';

        if (riskScore >= 50) {
          riskLevel = 'HIGH';
        } else if (riskScore >= 20) {
          riskLevel = 'MEDIUM';
        }

        console.log(attempt);

        return {
           
          
          ...attempt,
          riskScore,
          riskLevel,
        };
      }),
    );

    return results;
  }

  async inviteCandidates(
    codingTestId: string,
    dto: InviteCodingCandidatesDto,
    userId: string,
  ) {
    const codingTest = await this.prisma.codingTest.findUnique({
      where: {
        id: codingTestId,
      },
    });

    if (!codingTest) {
      throw new NotFoundException('Coding test not found');
    }

    if (codingTest.createdById !== userId) {
      throw new ForbiddenException('Access denied');
    }

    let count = 0;

    for (const email of dto.emails) {
      await this.prisma.codingAssignment.upsert({
        where: {
          candidateEmail_codingTestId: {
            candidateEmail: email,
            codingTestId,
          },
        },
        update: {},
        create: {
          codingTestId,
          candidateEmail: email,
          candidateName: email,
          accessToken: randomUUID(),
        },
      });

      count++;
    }

    return {
      count,
    };
  }

  async getInvitations(codingTestId: string, userId: string) {
    const codingTest = await this.prisma.codingTest.findUnique({
      where: {
        id: codingTestId,
      },
    });

    if (!codingTest) {
      throw new NotFoundException('Coding test not found');
    }

    if (codingTest.createdById !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.codingAssignment.findMany({
      where: {
        codingTestId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getAssignedCodingTests(email: string) {
    return this.prisma.codingAssignment.findMany({
      where: {
        candidateEmail: email,
      },
      include: {
        codingTest: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getCandidateAssessment(
  codingTestId: string,
  email: string,
) {
  const assignment =
    await this.prisma.codingAssignment.findFirst({
      where: {
        codingTestId,
        candidateEmail: email,
      },
      include: {
        codingTest: {
          include: {
            questions: {
              include: {
                codingQuestion: true,
              },
            },
          },
        },
      },
    });

  if (!assignment) {
    throw new ForbiddenException(
      'Assessment not assigned to you',
    );
  }

  return assignment.codingTest;
}
}