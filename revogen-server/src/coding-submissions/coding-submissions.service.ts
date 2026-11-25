import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { loadActiveAttempt } from '../common/coding-attempt';

import { PrismaService } from '../prisma/prisma.service';

import {
  ExecutionResult,
  Judge0Service,
  LANGUAGE_IDS,
  STATUS,
} from '../judge0/judge0.service';
import { compareOutputs } from '../judge0/output-validator';

import { CreateRunCodeDto } from './dto/create-run-code.dto';

import { CreateSubmitCodeDto } from './dto/create-submit-code.dto';

@Injectable()
export class CodingSubmissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly judge0Service: Judge0Service,
  ) {}

  // ─── Execution helpers ───────────────────────────────────────────────────────

  private languageIdOrThrow(language: string): number {
    const id = LANGUAGE_IDS[String(language ?? '').toLowerCase()];
    if (!id) throw new BadRequestException(`Unsupported language: ${language}`);
    return id;
  }

  private errorText(result: ExecutionResult): string {
    return (
      result.compile_output ||
      result.stderr ||
      result.message ||
      result.status?.description ||
      'Execution error'
    ).trim();
  }

  /**
   * Run the code against every test case (in one Judge0 batch) and grade each one.
   * A case that crashes or times out fails on its own; the others are still graded.
   * `error` is the first failure's message (a compile error fails every case).
   */
  private async grade(
    sourceCode: string,
    language: string,
    question: {
      outputValidator?: string | null;
      floatPrecision?: number | null;
    },
    testCases: { input: string; expectedOutput: string; isHidden: boolean }[],
  ) {
    const languageId = this.languageIdOrThrow(language);
    const validator = question.outputValidator ?? 'EXACT';
    const floatPrecision = question.floatPrecision ?? 6;
    const executions = await this.judge0Service.runBatch(
      sourceCode,
      languageId,
      testCases.map((t) => t.input),
    );

    let passedCases = 0;
    let error: string | null = null;
    let errorStatus: string | null = null;

    const results = testCases.map((testCase, i) => {
      const exec = executions[i];
      const ran = exec.status?.id === STATUS.ACCEPTED;
      if (!ran && !error) {
        error = this.errorText(exec);
        errorStatus = exec.status?.description ?? 'Execution Error';
      }
      const received = (exec.stdout ?? '').trim();
      const expected = testCase.expectedOutput.trim();
      const passed =
        ran && compareOutputs(received, expected, validator, floatPrecision);
      if (passed) passedCases++;
      const status = ran ? undefined : exec.status?.description;
      // Hidden test cases only report pass/fail — never their input or expected output.
      return testCase.isHidden
        ? { testCaseNo: i + 1, passed, isHidden: true, status }
        : {
            testCaseNo: i + 1,
            passed,
            isHidden: false,
            input: testCase.input,
            expected,
            received,
            status,
          };
    });

    return {
      passedCases,
      totalCases: testCases.length,
      results,
      error: error as string | null,
      errorStatus: errorStatus as string | null,
      validator,
    };
  }

  // ─── Run: visible test cases only, nothing is saved ─────────────────────────

  async runCode(dto: CreateRunCodeDto, userId: string) {
    await loadActiveAttempt(this.prisma, dto.attemptId, userId, dto.questionId);
    if (!dto.sourceCode?.trim())
      throw new BadRequestException('Write some code before running.');

    const question = await this.prisma.codingQuestionBank.findUnique({
      where: { id: dto.questionId },
      include: { testCases: { where: { isHidden: false } } },
    });
    if (!question) throw new NotFoundException('Question not found');

    const g = await this.grade(
      dto.sourceCode,
      dto.language,
      question,
      question.testCases,
    );
    return {
      success: !g.error,
      status: g.error
        ? g.errorStatus
        : g.passedCases === g.totalCases
          ? 'PASSED'
          : 'FAILED',
      error: g.error,
      passedCases: g.passedCases,
      totalCases: g.totalCases,
      results: g.results,
      validator: g.validator,
    };
  }

  // ─── Submit: all test cases, saved and scored ───────────────────────────────

  async submitCode(dto: CreateSubmitCodeDto, userId: string) {
    await loadActiveAttempt(this.prisma, dto.attemptId, userId, dto.questionId);
    if (!dto.sourceCode?.trim())
      throw new BadRequestException('Write some code before submitting.');

    const question = await this.prisma.codingQuestionBank.findUnique({
      where: { id: dto.questionId },
      include: { testCases: true },
    });
    if (!question) throw new NotFoundException('Question not found');

    const g = await this.grade(
      dto.sourceCode,
      dto.language,
      question,
      question.testCases,
    );
    const score =
      g.totalCases === 0 ? 0 : Math.round((g.passedCases / g.totalCases) * 100);
    const status = score === 100 ? 'PASSED' : score > 0 ? 'PARTIAL' : 'FAILED';

    const savedSubmission = await this.prisma.codingSubmission.create({
      data: {
        attemptId: dto.attemptId,
        questionId: dto.questionId,
        language: dto.language,
        sourceCode: dto.sourceCode,
        passedCases: g.passedCases,
        totalCases: g.totalCases,
        score,
        status,
      },
    });

    return {
      success: !g.error,
      submissionId: savedSubmission.id,
      status: g.error ? g.errorStatus : status,
      scoreStatus: status,
      error: g.error,
      passedCases: g.passedCases,
      totalCases: g.totalCases,
      score,
      results: g.results,
      validator: g.validator,
    };
  }

  /** Submissions for an attempt: the candidate who owns it, or the recruiter who owns the test. */
  async getSubmissionsFor(attemptId: string, userId: string) {
    const attempt = await this.prisma.codingAttempt.findFirst({
      where: { id: attemptId },
      select: { userId: true, codingTest: { select: { createdById: true } } },
    });
    if (!attempt) throw new NotFoundException('Test attempt not found.');
    if (
      attempt.userId !== userId &&
      attempt.codingTest.createdById !== userId
    ) {
      throw new ForbiddenException(
        'You do not have access to these submissions.',
      );
    }
    return this.getSubmissions(attemptId);
  }

  async getSubmissions(attemptId: string) {
    return this.prisma.codingSubmission.findMany({
      where: {
        attemptId,
      },

      include: {
        question: {
          select: {
            id: true,
            title: true,
            difficulty: true,
            category: true,
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
