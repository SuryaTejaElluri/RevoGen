import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { assertNotDuplicate, canonicalCategory, requireMcq } from './mcq-input';

@Injectable()
export class QuestionBankService {
  constructor(
    private prisma: PrismaService,
  ) {}

  /** Validated: only the MCQ fields are stored, never arbitrary body keys. */
  async create(body: Record<string, unknown>) {
    const data = requireMcq(body);
    data.category = await canonicalCategory(this.prisma, data.category);
    await assertNotDuplicate(this.prisma, data);
    return this.prisma.questionBank.create({ data });
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

  async update(id: string, body: Record<string, unknown>) {
    const existing = await this.prisma.questionBank.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Question not found');
    // Merge so a partial update is still checked as a whole question.
    const data = requireMcq({ ...existing, ...(body ?? {}) });
    data.category = await canonicalCategory(this.prisma, data.category);
    await assertNotDuplicate(this.prisma, data, id);
    return this.prisma.questionBank.update({ where: { id }, data });
  }

  async remove(id: string) {
    const existing = await this.prisma.questionBank.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException('Question not found');
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