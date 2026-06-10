import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateCodingTestDto } from './dto/create-coding-test.dto';
import { NotFoundException } from '@nestjs/common';
import { UpdateCodingTestDto } from './dto/update-coding-test.dto';
@Injectable()
export class CodingTestsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreateCodingTestDto) {
    const codingTest =
      await this.prisma.codingTest.create({
        data: {
          title: dto.title,
          description: dto.description,
          category: dto.category,
          duration: dto.duration,
        },
      });

    await this.prisma.codingTestQuestion.createMany({
      data: dto.questionIds.map(
        (questionId, index) => ({
          codingTestId: codingTest.id,
          codingQuestionId: questionId,
          orderNo: index + 1,
        }),
      ),
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

  async findAll() {
    return this.prisma.codingTest.findMany({
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

 async findOne(id: string) {
  const test = await this.prisma.codingTest.findUnique({
    where: { id },
    include: {
      questions: {
        include: {
          codingQuestion: true,
        },
      },
    },
  });

  if (!test) {
    throw new NotFoundException(
      'Coding test not found',
    );
  }

  return test;
}

async update(
  id: string,
  dto: UpdateCodingTestDto,
) {
  await this.findOne(id);

  return this.prisma.codingTest.update({
    where: { id },
    data: {
      ...dto,
    },
  });
}

async remove(id: string) {
  await this.findOne(id);

  return this.prisma.codingTest.delete({
    where: { id },
  });
}
}