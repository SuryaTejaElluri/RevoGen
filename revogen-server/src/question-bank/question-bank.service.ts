import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QuestionBankService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async create(body: any) {
    return this.prisma.questionBank.create({
      data: body,
    });
  }

  async findAll(category?: string) {
    return this.prisma.questionBank.findMany({
      where: category
        ? {
            category,
          }
        : {},

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.questionBank.findUnique({
      where: {
        id,
      },
    });
  }

  async update(
    id: string,
    body: any,
  ) {
    return this.prisma.questionBank.update({
      where: {
        id,
      },

      data: body,
    });
  }

  async remove(id: string) {
    await this.prisma.questionBank.delete({
      where: {
        id,
      },
    });

    return {
      message:
        'Question deleted successfully',
    };
  }

  async getQuestionStats() {
  const result =
    await this.prisma.questionBank.groupBy({
      by: ['category'],

      _count: {
        category: true,
      },
    });

  return result.map((item) => ({
    category: item.category,
    count: item._count.category,
  }));
}

  async getCategories() {
    const categories =
      await this.prisma.questionBank.findMany({
        distinct: ['category'],

        select: {
          category: true,
        },
      });

    return categories.map(
      (item) => item.category,
    );
  }
  async getStats() {
  const questions =
    await this.prisma.questionBank.groupBy({
      by: ['category'],

      _count: {
        category: true,
      },
    });
    

  return (questions.map((item) => ({
    category: item.category,
    count: item._count.category,
  })));
}
}