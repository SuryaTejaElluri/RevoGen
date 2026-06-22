import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

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

  private getLanguageId(
    language: string,
  ): number {
    const map: Record<string, number> = {
      java: 62,
      python: 71,
      javascript: 63,
      c: 50,
      cpp: 54,
    };

    return map[language];
  }

  async runCode(
    dto: CreateRunCodeDto,
  ) {
    const question =
      await this.prisma.codingQuestionBank.findUnique({
        where: {
          id: dto.questionId,
        },

        include: {
          testCases: {
            where: {
              isHidden: false,
            },
          },
        },
      });

    if (!question) {
      throw new NotFoundException(
        'Question not found',
      );
    }

    const languageId =
      this.getLanguageId(
        dto.language,
      );

    let passedCases = 0;

    const results: any[] = [];

    for (
      let i = 0;
      i < question.testCases.length;
      i++
    ) {
      const testCase =
        question.testCases[i];

      const submission =
        await this.judge0Service.createSubmission(
          dto.sourceCode,
          languageId,
          testCase.input,
        );

      const token =
        submission.token;

      let executionResult;

      while (true) {
        executionResult =
          await this.judge0Service.getSubmissionResult(
            token,
          );

        if (
          executionResult.status?.id !==
            1 &&
          executionResult.status?.id !==
            2
        ) {
          break;
        }

        await new Promise(
          (resolve) =>
            setTimeout(
              resolve,
              1000,
            ),
        );
      }

      if (
        executionResult.status?.id !==
        3
      ) {
        return {
          success: false,

          status:
            executionResult.status
              ?.description,

          error:
            executionResult.compile_output ||
            executionResult.stderr ||
            executionResult.message,

          passedCases: 0,

          totalCases:
            question.testCases
              .length,
        };
      }

      const actualOutput =
        (
          executionResult.stdout ||
          ''
        ).trim();

      const expectedOutput =
        testCase.expectedOutput.trim();

      const passed =
        actualOutput ===
        expectedOutput;

      if (passed) {
        passedCases++;
      }

      results.push({
        testCaseNo:
          i + 1,

        passed,

        ...(passed
          ? {}
          : {
              input:
                testCase.input,

              expected:
                expectedOutput,

              received:
                actualOutput,
            }),
      });
    }

    return {
      success: true,

      status:
        passedCases ===
        question.testCases.length
          ? 'PASSED'
          : 'FAILED',

      passedCases,

      totalCases:
        question.testCases.length,

      results,
    };
  }

  async submitCode(
  dto: CreateSubmitCodeDto,
) {
  const question =
    await this.prisma.codingQuestionBank.findUnique({
      where: {
        id: dto.questionId,
      },
      include: {
        testCases: true,
      },
    });

  if (!question) {
    throw new NotFoundException(
      'Question not found',
    );
  }

  const languageId =
    this.getLanguageId(
      dto.language,
    );

  let passedCases = 0;

  const results: any[] = [];

  for (
    let i = 0;
    i < question.testCases.length;
    i++
  ) {
    const testCase =
      question.testCases[i];

    const submission =
      await this.judge0Service.createSubmission(
        dto.sourceCode,
        languageId,
        testCase.input,
      );

    const token =
      submission.token;

    let executionResult;

    while (true) {
      executionResult =
        await this.judge0Service.getSubmissionResult(
          token,
        );

      if (
        executionResult.status?.id !== 1 &&
        executionResult.status?.id !== 2
      ) {
        break;
      }

      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            1000,
          ),
      );
    }

    if (
      executionResult.status?.id !== 3
    ) {
      return {
        success: false,

        status:
          executionResult.status
            ?.description ||
          'Execution Error',

        error:
          executionResult.compile_output ||
          executionResult.stderr ||
          executionResult.message,
      };
    }

    const actualOutput =
      (
        executionResult.stdout ||
        ''
      ).trim();

    const expectedOutput =
      testCase.expectedOutput.trim();

    const passed =
      actualOutput ===
      expectedOutput;

    if (passed) {
      passedCases++;
    }

    results.push({
      testCaseNo: i + 1,
      passed,

      input:
        testCase.input,

      expected:
        expectedOutput,

      received:
        actualOutput,

      isHidden:
        testCase.isHidden,
    });
  }

  const totalCases =
    question.testCases.length;

  const score =
    totalCases === 0
      ? 0
      : Math.round(
          (passedCases /
            totalCases) *
            100,
        );

  let status = 'FAILED';

  if (score === 100) {
    status = 'PASSED';
  } else if (score > 0) {
    status = 'PARTIAL';
  }

  const savedSubmission =
    await this.prisma.codingSubmission.create({
      data: {
        attemptId:
          dto.attemptId,

        questionId:
          dto.questionId,

        language:
          dto.language,

        sourceCode:
          dto.sourceCode,

        passedCases,

        totalCases,

        score,

        status,
      },
    });

  return {
    success: true,

    submissionId:
      savedSubmission.id,

    status,

    passedCases,

    totalCases,

    score,

    sourceCode:
      dto.sourceCode,

    results,
  };
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