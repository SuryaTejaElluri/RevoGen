import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ResumesService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async create(data: {
    title: string;
    fileUrl: string;
    fileType: string;
    userId: string;
  }) {
    return this.prisma.resume.create({
      data,
    });
  }

  async findAll(userId: string) {
    return this.prisma.resume.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findById(id: string) {
    return this.prisma.resume.findUnique({
      where: { id },
    });
  }

  async createAnalysis(data: {
  resumeId: string;
  skills: any;
  education: any;
  projects: any;
  rawText: string;
  atsScore: number;
  missingSkills: any;
}) {
  return this.prisma.resumeAnalysis.upsert({
    where: {
      resumeId: data.resumeId,
    },

    update: {
      skills: data.skills,
      education: data.education,
      projects: data.projects,
      rawText: data.rawText,
      atsScore: data.atsScore,
      missingSkills: data.missingSkills,
    },

    create: data,
  });

}
}