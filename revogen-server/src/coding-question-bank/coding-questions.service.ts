import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateCodingQuestionDto } from './dto/create-coding-question.dto';
import { UpdateCodingQuestionDto } from './dto/update-coding-question.dto';

@Injectable()
export class CodingQuestionsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreateCodingQuestionDto) {
    return this.prisma.codingQuestion.create({
      data: {
        title: dto.title,
        slug: dto.slug,
        description: dto.description,
        constraints: dto.constraints,
        inputFormat: dto.inputFormat,
        outputFormat: dto.outputFormat,
        difficulty: dto.difficulty as any,
        category: dto.category as any,
        starterCode: dto.starterCode,
        solutionCode: dto.solutionCode,
        timeLimit: dto.timeLimit ?? 1000,
        memoryLimit: dto.memoryLimit ?? 256,

        testCases: {
          create: dto.testCases ?? [],
        },
      },
      include: {
        testCases: true,
      },
    });
  }

 async findAll(
  difficulty?: string,
  category?: string,
) {
  return this.prisma.codingQuestion.findMany({
    where: {
      ...(difficulty && { difficulty: difficulty as any }),
      ...(category && { category: category as any }),
    },
    include: {
      testCases: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

  async findOne(id: string) {
    const question =
      await this.prisma.codingQuestion.findUnique({
        where: { id },
        include: {
          testCases: true,
        },
      });

    if (!question) {
      throw new NotFoundException(
        'Coding question not found',
      );
    }

    return question;
  }

  async update(
  id: string,
  dto: UpdateCodingQuestionDto,
) {
  await this.findOne(id);

  return this.prisma.codingQuestion.update({
    where: { id },
    data: {
      title: dto.title,
      slug: dto.slug,
      description: dto.description,
      constraints: dto.constraints,
      inputFormat: dto.inputFormat,
      outputFormat: dto.outputFormat,
      difficulty: dto.difficulty as any,
      category: dto.category as any,
      starterCode: dto.starterCode,
      solutionCode: dto.solutionCode,
      timeLimit: dto.timeLimit,
      memoryLimit: dto.memoryLimit,
    },
    include: {
      testCases: true,
    },
  });
}

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.codingQuestion.delete({
      where: { id },
    });
  }
}