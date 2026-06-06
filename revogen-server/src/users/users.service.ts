import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async create(data: {
    name: string;
    email: string;
    password: string;
  }) {
    return this.prisma.user.create({
      data,
    });
  }
  async findAll() {
  return this.prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });
}
async getCandidateProfile(id: string) {
  const user = await this.prisma.user.findUnique({
    where: { id },

    include: {
      profile: true,

      resumes: {
        include: {
          analysis: true,
        },
      },

      attempts: {
        include: {
          test: true,
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  const activeResume =
    user.resumes.find(
      (r) => r.isActive,
    ) || user.resumes[0];

  const atsScore =
    activeResume?.analysis?.atsScore ??
    0;

  const averageTestScore =
    user.attempts.length > 0
      ? user.attempts.reduce(
          (sum, a) =>
            sum + a.percentage,
          0,
        ) / user.attempts.length
      : 0;

  const rankingScore =
    averageTestScore * 0.7 +
    atsScore * 0.3;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,

    atsScore,

    averageTestScore:
      Number(
        averageTestScore.toFixed(
          2,
        ),
      ),

    rankingScore: Number(
      rankingScore.toFixed(2),
    ),

    profile: user.profile,

    skills:
      activeResume?.analysis
        ?.skills ?? [],

    missingSkills:
      activeResume?.analysis
        ?.missingSkills ?? [],

    attempts: user.attempts,
  };
}

async getLeaderboard() {
  const users =
    await this.prisma.user.findMany({
      where: {
        role: 'USER',
      },

      include: {
        resumes: {
          include: {
            analysis: true,
          },
        },

        attempts: true,
      },
    });

  return users
    .map((user) => {
      const resume =
        user.resumes.find(
          (r) => r.isActive,
        ) || user.resumes[0];

      const atsScore =
        resume?.analysis
          ?.atsScore ?? 0;

      const avgScore =
        user.attempts.length > 0
          ? user.attempts.reduce(
              (sum, a) =>
                sum +
                a.percentage,
              0,
            ) /
            user.attempts.length
          : 0;

      const rankingScore =
        avgScore * 0.7 +
        atsScore * 0.3;

      return {
        id: user.id,
        name: user.name,
        email: user.email,

        atsScore,

        averageTestScore:
          Number(
            avgScore.toFixed(2),
          ),

        rankingScore:
          Number(
            rankingScore.toFixed(
              2,
            ),
          ),
      };
    })
    .sort(
      (a, b) =>
        b.rankingScore -
        a.rankingScore,
    );
}

async updateRole(
  userId: string,
  role: string,
) {
  return this.prisma.user.update({
    where: {
      id: userId,
    },

    data: {
      role,
    },
  });
}

async deleteUser(
  userId: string,
) {
  return this.prisma.user.delete({
    where: {
      id: userId,
    },
  });
}
}