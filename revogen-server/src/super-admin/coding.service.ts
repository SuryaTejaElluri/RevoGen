import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Judge0Service, LANGUAGE_IDS, STATUS } from '../judge0/judge0.service';
import { compareOutputs } from '../judge0/output-validator';
import { CODING_LIMITS, CodingQuestionDto, ListCodingQueryDto, RunReferenceDto } from './dto';

/** Suggested categories (the CodingCategory enum); existing free-text categories are kept too. */
export const CODING_CATEGORIES = [
  'ARRAYS', 'STRINGS', 'LINKED_LIST', 'STACK', 'QUEUE', 'TREE', 'GRAPH', 'DP', 'GREEDY', 'BINARY_SEARCH', 'RECURSION', 'MATH',
];

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 150) || 'question';

@Injectable()
export class SuperAdminCodingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly judge0: Judge0Service,
  ) {}

  async list(q: ListCodingQueryDto) {
    const page = q.page ?? 1;
    const pageSize = q.pageSize ?? 20;
    const search = q.search?.trim();
    const where: Prisma.CodingQuestionBankWhereInput = {
      ...(q.difficulty ? { difficulty: q.difficulty as Prisma.EnumCodingDifficultyFilter['equals'] } : {}),
      ...(q.category ? { category: { equals: q.category, mode: 'insensitive' } } : {}),
      ...(search
        ? { OR: [{ title: { contains: search, mode: 'insensitive' } }, { slug: { contains: search, mode: 'insensitive' } }] }
        : {}),
    };
    const [total, rows] = await Promise.all([
      this.prisma.codingQuestionBank.count({ where }),
      this.prisma.codingQuestionBank.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true, title: true, slug: true, category: true, difficulty: true, outputValidator: true,
          starterCodes: true, createdAt: true, updatedAt: true,
          _count: { select: { testCases: true, questions: true, submissions: true } },
        },
      }),
    ]);
    const hidden = rows.length
      ? await this.prisma.codingQuestionTestCase.groupBy({
          by: ['questionId'],
          where: { questionId: { in: rows.map((r) => r.id) }, isHidden: true },
          _count: { _all: true },
        })
      : [];
    const hiddenBy = new Map(hidden.map((h) => [h.questionId, h._count._all]));

    return {
      total,
      page,
      pageSize,
      pages: Math.max(1, Math.ceil(total / pageSize)),
      items: rows.map(({ _count, starterCodes, ...r }) => ({
        ...r,
        languages: Object.keys((starterCodes as Record<string, string>) ?? {}).filter((k) => k in LANGUAGE_IDS),
        testCases: _count.testCases,
        hiddenTestCases: hiddenBy.get(r.id) ?? 0,
        usedInTests: _count.questions,
        submissions: _count.submissions,
      })),
    };
  }

  async meta() {
    const [cats, byDifficulty] = await Promise.all([
      this.prisma.codingQuestionBank.findMany({ distinct: ['category'], select: { category: true } }),
      this.prisma.codingQuestionBank.groupBy({ by: ['difficulty'], _count: { _all: true } }),
    ]);
    const categories = [...new Set([...CODING_CATEGORIES, ...cats.map((c) => c.category)])].sort();
    return {
      categories,
      languages: Object.keys(LANGUAGE_IDS),
      byDifficulty: Object.fromEntries(byDifficulty.map((d) => [d.difficulty, d._count._all])),
    };
  }

  async get(id: string) {
    const q = await this.prisma.codingQuestionBank.findUnique({
      where: { id },
      include: {
        testCases: { orderBy: { createdAt: 'asc' } },
        questions: { select: { codingTest: { select: { id: true, title: true } } } },
        _count: { select: { submissions: true } },
      },
    });
    if (!q) throw new NotFoundException('Coding question not found');
    const { questions, _count, ...rest } = q;
    return { ...rest, usedIn: questions.map((x) => x.codingTest), submissions: _count.submissions };
  }

  /** Rules beyond field types: starter code languages, sample cases, empty outputs. */
  private checkContent(dto: CodingQuestionDto) {
    const errors: string[] = [];
    const starter: Record<string, string> = {};
    Object.entries(dto.starterCodes ?? {}).forEach(([lang, code]) => {
      if (!(lang in LANGUAGE_IDS)) errors.push(`Unknown starter code language "${lang}".`);
      else if (typeof code !== 'string') errors.push(`Starter code for ${lang} must be text.`);
      else if (code.length > CODING_LIMITS.starterCode) errors.push(`Starter code for ${lang} is too long.`);
      else if (code.trim()) starter[lang] = code;
    });
    if (!dto.testCases.some((t) => !t.isHidden)) {
      errors.push('Add at least one visible (sample) test case so candidates can see an example.');
    }
    dto.testCases.forEach((t, i) => {
      if (!t.expectedOutput.trim()) errors.push(`Test case ${i + 1}: expected output is empty.`);
    });
    if (errors.length) throw new BadRequestException(errors);
    return starter;
  }

  private async uniqueSlug(base: string, exceptId?: string) {
    let slug = base;
    for (let n = 2; ; n++) {
      const clash = await this.prisma.codingQuestionBank.findFirst({
        where: { slug, ...(exceptId ? { NOT: { id: exceptId } } : {}) },
        select: { id: true },
      });
      if (!clash) return slug;
      slug = `${base}-${n}`;
    }
  }

  /** Test cases keep the order they were written in (createdAt 1 ms apart). */
  private caseRows(questionId: string, dto: CodingQuestionDto) {
    const t0 = Date.now();
    return dto.testCases.map((t, i) => ({
      questionId,
      input: t.input.replace(/\r\n?/g, '\n'),
      expectedOutput: t.expectedOutput.replace(/\r\n?/g, '\n'),
      explanation: t.explanation?.trim() || null,
      isHidden: t.isHidden,
      createdAt: new Date(t0 + i),
    }));
  }

  private fields(dto: CodingQuestionDto, starterCodes: Record<string, string>) {
    return {
      title: dto.title.trim(),
      category: dto.category.trim(),
      difficulty: dto.difficulty as Prisma.CodingQuestionBankCreateInput['difficulty'],
      description: dto.description.trim(),
      inputFormat: dto.inputFormat?.trim() || null,
      outputFormat: dto.outputFormat?.trim() || null,
      constraints: dto.constraints?.trim() || null,
      starterCodes,
      outputValidator: dto.outputValidator as Prisma.CodingQuestionBankCreateInput['outputValidator'],
      floatPrecision: dto.floatPrecision,
    };
  }

  async create(dto: CodingQuestionDto) {
    const starter = this.checkContent(dto);
    const slug = dto.slug
      ? await this.assertSlugFree(dto.slug)
      : await this.uniqueSlug(slugify(dto.title));
    const question = await this.prisma.$transaction(async (tx) => {
      const q = await tx.codingQuestionBank.create({ data: { ...this.fields(dto, starter), slug } });
      await tx.codingQuestionTestCase.createMany({ data: this.caseRows(q.id, dto) });
      return q;
    });
    return this.get(question.id);
  }

  private async assertSlugFree(slug: string, exceptId?: string) {
    const clash = await this.prisma.codingQuestionBank.findFirst({
      where: { slug, ...(exceptId ? { NOT: { id: exceptId } } : {}) },
      select: { id: true },
    });
    if (clash) throw new ConflictException(`The slug "${slug}" is already used by another question.`);
    return slug;
  }

  /** Replace the question and its test cases in one transaction. */
  async update(id: string, dto: CodingQuestionDto) {
    const existing = await this.prisma.codingQuestionBank.findUnique({ where: { id }, select: { id: true, slug: true } });
    if (!existing) throw new NotFoundException('Coding question not found');
    const starter = this.checkContent(dto);
    const slug = dto.slug && dto.slug !== existing.slug ? await this.assertSlugFree(dto.slug, id) : existing.slug;
    await this.prisma.$transaction(async (tx) => {
      await tx.codingQuestionBank.update({ where: { id }, data: { ...this.fields(dto, starter), slug } });
      await tx.codingQuestionTestCase.deleteMany({ where: { questionId: id } });
      await tx.codingQuestionTestCase.createMany({ data: this.caseRows(id, dto) });
    });
    return this.get(id);
  }

  /**
   * Deleting a question cascades to every test that uses it and every candidate
   * submission for it, so it's refused while either exists.
   */
  async remove(id: string) {
    const q = await this.prisma.codingQuestionBank.findUnique({
      where: { id },
      select: {
        id: true,
        questions: { select: { codingTest: { select: { title: true } } }, take: 5 },
        _count: { select: { questions: true, submissions: true } },
      },
    });
    if (!q) throw new NotFoundException('Coding question not found');
    if (q._count.questions > 0) {
      const names = q.questions.map((x) => `"${x.codingTest.title}"`).join(', ');
      throw new ConflictException(
        `This question is used in ${q._count.questions} coding test${q._count.questions === 1 ? '' : 's'} (${names}${q._count.questions > 5 ? ', …' : ''}). Remove it from those tests first.`,
      );
    }
    if (q._count.submissions > 0) {
      throw new ConflictException(`Candidates have ${q._count.submissions} submission(s) for this question, so it can't be deleted.`);
    }
    await this.prisma.codingQuestionBank.delete({ where: { id } });
    return { deleted: true, id };
  }

  /**
   * Run a reference solution against test cases (saved or still in the editor).
   * Reports each case's output and, when an expected output is given, whether it
   * matches — so a super admin can check test cases, or fill expected outputs in.
   */
  async runReference(dto: RunReferenceDto) {
    const languageId = LANGUAGE_IDS[dto.language];
    const executions = await this.judge0.runBatch(dto.sourceCode, languageId, dto.testCases.map((t) => t.input));
    const validator = dto.outputValidator ?? 'EXACT';
    const precision = dto.floatPrecision ?? 6;

    const results = dto.testCases.map((t, i) => {
      const e = executions[i];
      const ran = e.status?.id === STATUS.ACCEPTED;
      const output = (e.stdout ?? '').replace(/\s+$/, '');
      const hasExpected = typeof t.expectedOutput === 'string' && t.expectedOutput.trim() !== '';
      return {
        index: i,
        status: e.status?.description ?? 'Unknown',
        ran,
        output,
        error: ran ? null : (e.compile_output || e.stderr || e.message || e.status?.description || 'Execution error').trim(),
        time: e.time ?? null,
        memory: e.memory ?? null,
        matches: ran && hasExpected ? compareOutputs(output, t.expectedOutput, validator, precision) : null,
      };
    });
    return {
      results,
      ran: results.filter((r) => r.ran).length,
      matched: results.filter((r) => r.matches === true).length,
      compared: results.filter((r) => r.matches !== null).length,
    };
  }
}
