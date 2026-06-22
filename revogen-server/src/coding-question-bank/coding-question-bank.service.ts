import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import { CreateCodingQuestionDto } from './dto/create-coding-question.dto';

@Injectable()
export class CodingQuestionBankService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async create(
    dto: CreateCodingQuestionDto,
  ) {
    const question =
      await this.prisma.codingQuestionBank.create({
        data: {
          title: dto.title,
          slug: dto.slug,
          category: dto.category,
          difficulty: dto.difficulty as any,
          description: dto.description,
          inputFormat: dto.inputFormat,
          outputFormat: dto.outputFormat,
          constraints: dto.constraints,
          examples: dto.examples,
          starterCodes: dto.starterCode,
        },
      });

    if (
      dto.testCases &&
      dto.testCases.length > 0
    ) {
      await this.prisma.codingQuestionTestCase.createMany({
        data: dto.testCases.map(
          (testCase) => ({
            questionId: question.id,
            input: testCase.input,
            expectedOutput:
              testCase.expectedOutput,
            explanation:
              testCase.explanation,
            isHidden:
              testCase.isHidden ?? false,
          }),
        ),
      });
    }

    return {
      success: true,
      questionId: question.id,
    };
  }


  async findAll() {
  return this.prisma.codingQuestionBank.findMany({
    select: {
      id: true,
      title: true,
      category: true,
      difficulty: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

async findOne(id: string) {
  return this.prisma.codingQuestionBank.findUnique({
    where: {
      id,
    },
    include: {
      testCases: true,
    },
  });
}
}