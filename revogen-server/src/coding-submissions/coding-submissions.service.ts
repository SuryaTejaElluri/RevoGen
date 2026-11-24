import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { loadActiveAttempt } from '../common/coding-attempt';

import { PrismaService } from '../prisma/prisma.service';

import { Judge0Service } from '../judge0/judge0.service';

import { CreateRunCodeDto } from './dto/create-run-code.dto';

import { CreateSubmitCodeDto } from './dto/create-submit-code.dto';

@Injectable()
export class CodingSubmissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly judge0Service: Judge0Service,
  ) {}

  private getLanguageId(language: string): number {
    const map: Record<string, number> = {
      java: 62, python: 71, javascript: 63, c: 50, cpp: 54,
    };
    return map[language];
  }

  // ─── Output Validator ────────────────────────────────────────────────────────
  private compareOutputs(
    actual: string,
    expected: string,
    validator: string,
    floatPrecision: number = 6,
  ): boolean {
    const a = actual.trim();
    const e = expected.trim();

    switch (validator) {
      case 'EXACT':
        return a === e;

      case 'IGNORE_ORDER': {
        // Tokenise by whitespace/newlines, sort both, compare
        const sortTokens = (s: string) =>
          s.split(/[\s\n]+/).filter(Boolean).sort().join(' ');
        return sortTokens(a) === sortTokens(e);
      }

      case 'SET_COMPARE': {
        // Same as IGNORE_ORDER but also deduplicates (useful for unique sets)
        const toSet = (s: string) =>
          [...new Set(s.split(/[\s\n]+/).filter(Boolean))].sort().join(' ');
        return toSet(a) === toSet(e);
      }

      case 'FLOAT_COMPARE': {
        // Each line is a float — compare with given precision
        const aLines = a.split(/[\s\n]+/).filter(Boolean);
        const eLines = e.split(/[\s\n]+/).filter(Boolean);
        if (aLines.length !== eLines.length) return false;
        const eps = Math.pow(10, -floatPrecision);
        return aLines.every((av, i) => {
          const af = parseFloat(av);
          const ef = parseFloat(eLines[i]);
          return !isNaN(af) && !isNaN(ef) && Math.abs(af - ef) <= eps;
        });
      }

      case 'CUSTOM':
        // Custom validator: for now fall back to EXACT.
        // Can be extended to call a custom judge endpoint in the future.
        return a === e;

      default:
        return a === e;
    }
  }

  // ─── Execution helpers ───────────────────────────────────────────────────────

  /** Judge0 status ids: 1 = in queue, 2 = processing, 3 = accepted. */
  private static readonly MAX_POLLS = 30; // ~30 s per test case

  private async executeCase(sourceCode: string, languageId: number, stdin: string): Promise<any> {
    const submission = await this.judge0Service.createSubmission(sourceCode, languageId, stdin);
    for (let i = 0; i < CodingSubmissionsService.MAX_POLLS; i++) {
      const result = await this.judge0Service.getSubmissionResult(submission.token);
      if (result.status?.id !== 1 && result.status?.id !== 2) return result;
      await new Promise((r) => setTimeout(r, 1000));
    }
    return { status: { id: -1, description: 'Time Limit Exceeded' }, message: 'Your code took too long to run.' };
  }

  private languageIdOrThrow(language: string): number {
    const id = this.getLanguageId(language);
    if (!id) throw new BadRequestException(`Unsupported language: ${language}`);
    return id;
  }

  private errorText(result: any): string {
    return result.compile_output || result.stderr || result.message || result.status?.description || 'Execution error';
  }

  // ─── Run: visible test cases only, nothing is saved ─────────────────────────

  async runCode(dto: CreateRunCodeDto, userId: string) {
    await loadActiveAttempt(this.prisma, dto.attemptId, userId, dto.questionId);
    if (!dto.sourceCode?.trim()) throw new BadRequestException('Write some code before running.');

    const question = await this.prisma.codingQuestionBank.findUnique({
      where: { id: dto.questionId },
      include: { testCases: { where: { isHidden: false } } },
    });
    if (!question) throw new NotFoundException('Question not found');

    const languageId = this.languageIdOrThrow(dto.language);
    const validator = (question as any).outputValidator ?? 'EXACT';
    const floatPrecision = (question as any).floatPrecision ?? 6;

    let passedCases = 0;
    const results: any[] = [];

    for (let i = 0; i < question.testCases.length; i++) {
      const testCase = question.testCases[i];
      const executionResult = await this.executeCase(dto.sourceCode, languageId, testCase.input);

      if (executionResult.status?.id !== 3) {
        return {
          success: false,
          status: executionResult.status?.description ?? 'Execution Error',
          error: this.errorText(executionResult),
          passedCases,
          totalCases: question.testCases.length,
          results,
        };
      }

      const actualOutput = (executionResult.stdout || '').trim();
      const expectedOutput = testCase.expectedOutput.trim();
      const passed = this.compareOutputs(actualOutput, expectedOutput, validator, floatPrecision);
      if (passed) passedCases++;

      results.push({ testCaseNo: i + 1, passed, input: testCase.input, expected: expectedOutput, received: actualOutput });
    }

    return {
      success: true,
      status: passedCases === question.testCases.length ? 'PASSED' : 'FAILED',
      passedCases,
      totalCases: question.testCases.length,
      results,
      validator,
    };
  }

  // ─── Submit: all test cases, saved and scored ───────────────────────────────

  async submitCode(dto: CreateSubmitCodeDto, userId: string) {
    await loadActiveAttempt(this.prisma, dto.attemptId, userId, dto.questionId);
    if (!dto.sourceCode?.trim()) throw new BadRequestException('Write some code before submitting.');

    const question = await this.prisma.codingQuestionBank.findUnique({
      where: { id: dto.questionId },
      include: { testCases: true },
    });
    if (!question) throw new NotFoundException('Question not found');

    const languageId = this.languageIdOrThrow(dto.language);
    const validator = (question as any).outputValidator ?? 'EXACT';
    const floatPrecision = (question as any).floatPrecision ?? 6;
    const totalCases = question.testCases.length;

    let passedCases = 0;
    let error: string | null = null;
    let errorStatus: string | null = null;
    const results: any[] = [];

    for (let i = 0; i < question.testCases.length; i++) {
      const testCase = question.testCases[i];
      const executionResult = await this.executeCase(dto.sourceCode, languageId, testCase.input);

      if (executionResult.status?.id !== 3) {
        // Compile error / runtime error / time limit: stop, but still save the
        // submission (remaining cases score 0) so the recruiter can see it.
        error = this.errorText(executionResult);
        errorStatus = executionResult.status?.description ?? 'Execution Error';
        break;
      }

      const actualOutput = (executionResult.stdout || '').trim();
      const expectedOutput = testCase.expectedOutput.trim();
      const passed = this.compareOutputs(actualOutput, expectedOutput, validator, floatPrecision);
      if (passed) passedCases++;

      // Hidden test cases only report pass/fail — never their input or expected output.
      results.push(
        testCase.isHidden
          ? { testCaseNo: i + 1, passed, isHidden: true }
          : { testCaseNo: i + 1, passed, isHidden: false, input: testCase.input, expected: expectedOutput, received: actualOutput },
      );
    }

    const score = totalCases === 0 ? 0 : Math.round((passedCases / totalCases) * 100);
    const status = score === 100 ? 'PASSED' : score > 0 ? 'PARTIAL' : 'FAILED';

    const savedSubmission = await this.prisma.codingSubmission.create({
      data: {
        attemptId: dto.attemptId,
        questionId: dto.questionId,
        language: dto.language,
        sourceCode: dto.sourceCode,
        passedCases,
        totalCases,
        score,
        status,
      },
    });

    return {
      success: !error,
      submissionId: savedSubmission.id,
      status: error ? (errorStatus as string) : status,
      scoreStatus: status,
      error,
      passedCases,
      totalCases,
      score,
      results,
      validator,
    };
  }

  /** Submissions for an attempt: the candidate who owns it, or the recruiter who owns the test. */
  async getSubmissionsFor(attemptId: string, userId: string) {
    const attempt = await this.prisma.codingAttempt.findFirst({
      where: { id: attemptId },
      select: { userId: true, codingTest: { select: { createdById: true } } },
    });
    if (!attempt) throw new NotFoundException('Test attempt not found.');
    if (attempt.userId !== userId && attempt.codingTest.createdById !== userId) {
      throw new ForbiddenException('You do not have access to these submissions.');
    }
    return this.getSubmissions(attemptId);
  }

  async getSubmissions(
    attemptId: string,
  ) {
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