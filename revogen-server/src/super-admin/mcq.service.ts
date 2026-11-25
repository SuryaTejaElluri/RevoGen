import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { assertNotDuplicate, canonicalCategory, McqData, parseMcq, requireMcq } from '../question-bank/mcq-input';
import { ListMcqQueryDto } from './dto';

const key = (category: string, question: string) => `${category.trim().toLowerCase()}\u0000${question.trim().toLowerCase()}`;

@Injectable()
export class SuperAdminMcqService {
  constructor(private readonly prisma: PrismaService) {}

  async list(q: ListMcqQueryDto) {
    const page = q.page ?? 1;
    const pageSize = q.pageSize ?? 20;
    const search = q.search?.trim();
    const where: Prisma.QuestionBankWhereInput = {
      ...(q.category ? { category: { equals: q.category, mode: 'insensitive' } } : {}),
      ...(search
        ? {
            OR: [
              { question: { contains: search, mode: 'insensitive' } },
              { optionA: { contains: search, mode: 'insensitive' } },
              { optionB: { contains: search, mode: 'insensitive' } },
              { optionC: { contains: search, mode: 'insensitive' } },
              { optionD: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [total, items] = await Promise.all([
      this.prisma.questionBank.count({ where }),
      this.prisma.questionBank.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
    ]);
    return { total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)), items };
  }

  /** Categories with counts, merging spellings that differ only in case. */
  async categories() {
    const rows = await this.prisma.questionBank.groupBy({ by: ['category'], _count: { _all: true } });
    const merged = new Map<string, { category: string; count: number }>();
    rows.forEach((r) => {
      const k = r.category.trim().toLowerCase();
      const m = merged.get(k);
      if (m) m.count += r._count._all;
      else merged.set(k, { category: r.category.trim(), count: r._count._all });
    });
    return [...merged.values()].sort((a, b) => a.category.localeCompare(b.category));
  }

  async get(id: string) {
    const q = await this.prisma.questionBank.findUnique({ where: { id } });
    if (!q) throw new NotFoundException('Question not found');
    return q;
  }

  async create(body: Record<string, unknown>) {
    const data = requireMcq(body);
    data.category = await canonicalCategory(this.prisma, data.category);
    await assertNotDuplicate(this.prisma, data);
    return this.prisma.questionBank.create({ data });
  }

  async update(id: string, body: Record<string, unknown>) {
    await this.get(id);
    const data = requireMcq(body);
    data.category = await canonicalCategory(this.prisma, data.category);
    await assertNotDuplicate(this.prisma, data, id);
    return this.prisma.questionBank.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.get(id);
    await this.prisma.questionBank.delete({ where: { id } });
    return { deleted: true, id };
  }

  /**
   * Import many questions at once. Every row is checked with the same rules as a
   * single question; rows that are invalid, or duplicate an existing question or an
   * earlier row, are reported and skipped. With dryRun nothing is saved.
   */
  async bulk(rows: Record<string, unknown>[], dryRun = false) {
    const existing = await this.prisma.questionBank.findMany({ select: { category: true, question: true } });
    const seen = new Set(existing.map((e) => key(e.category, e.question)));
    const categorySpelling = new Map(existing.map((e) => [e.category.trim().toLowerCase(), e.category]));

    const valid: McqData[] = [];
    const report: { row: number; status: 'ok' | 'invalid' | 'duplicate'; errors: string[]; question?: string }[] = [];

    rows.forEach((raw, i) => {
      const { data, errors } = parseMcq(raw ?? {});
      const row = i + 1;
      if (!data) {
        report.push({ row, status: 'invalid', errors, question: typeof raw?.question === 'string' ? raw.question.slice(0, 80) : undefined });
        return;
      }
      data.category = categorySpelling.get(data.category.toLowerCase()) ?? data.category;
      categorySpelling.set(data.category.toLowerCase(), data.category);
      const k = key(data.category, data.question);
      if (seen.has(k)) {
        report.push({ row, status: 'duplicate', errors: ['Already in the bank (or repeated in this file).'], question: data.question.slice(0, 80) });
        return;
      }
      seen.add(k);
      valid.push(data);
      report.push({ row, status: 'ok', errors: [], question: data.question.slice(0, 80) });
    });

    let created = 0;
    if (!dryRun && valid.length) {
      const res = await this.prisma.questionBank.createMany({ data: valid });
      created = res.count;
    }
    return {
      dryRun,
      total: rows.length,
      valid: valid.length,
      invalid: report.filter((r) => r.status === 'invalid').length,
      duplicates: report.filter((r) => r.status === 'duplicate').length,
      created,
      report,
    };
  }
}
