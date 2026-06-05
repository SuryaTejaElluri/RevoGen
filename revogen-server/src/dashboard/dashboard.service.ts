import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async getDashboard(userId: string) {
    const attempts =
  await this.prisma.attempt.findMany({
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

    const resume =
      await this.prisma.resume.findFirst({
        where: {
          userId,
          isActive: true,
        },
        include: {
          analysis: true,
        },
      });

    const testsTaken =
      attempts.length;

    const averageScore =
      testsTaken > 0
        ? Math.round(
            attempts.reduce(
              (sum, a) =>
                sum + a.percentage,
              0,
            ) / testsTaken,
          )
        : 0;

    const totalTabSwitches =
      attempts.reduce(
        (sum, a) =>
          sum + a.tabSwitches,
        0,
      );

    const totalFullscreenViolations =
      attempts.reduce(
        (sum, a) =>
          sum +
          a.fullscreenViolations,
        0,
      );

    return {
      atsScore:
        resume?.analysis?.atsScore ??
        0,

      testsTaken,

      averageScore,

      totalTabSwitches,

      totalFullscreenViolations,

      recentAttempts:
        attempts.slice(0, 5),
    };
  }
}