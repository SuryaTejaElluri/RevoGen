import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateRunCodeDto } from './dto/create-run-code.dto';
import { CreateSubmitCodeDto } from './dto/create-submit-code.dto';
import { Judge0Service } from '../judge0/judge0.service';
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
    await this.prisma.codingQuestion.findUnique({
      where: {
        id: dto.codingQuestionId,
      },
      include: {
        testCases: {
          where: {
            isHidden: false,
            isActive: true,
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
    this.getLanguageId(dto.language);

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

    const token = submission.token;

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

      await new Promise((resolve) =>
        setTimeout(resolve, 1000),
      );
    }

    // Compilation Error / Runtime Error
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
          executionResult.message ||
          executionResult.status
            ?.description,

        passedCases: 0,

        totalCases:
          question.testCases.length,
      };
    }

    const actualOutput = (
      executionResult.stdout || ''
    ).trim();

    const expectedOutput =
      testCase.expectedOutput.trim();

    const passed =
      actualOutput === expectedOutput;

    if (passed) {
      passedCases++;
    }

    results.push({
      testCaseNo: i + 1,
      passed,

      ...(passed
        ? {}
        : {
            input: testCase.input,
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
    await this.prisma.codingQuestion.findUnique({
      where: {
        id: dto.codingQuestionId,
      },
      include: {
        testCases: {
          where: {
            isHidden: true,
            isActive: true,
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
    this.getLanguageId(dto.language);

  let passedCases = 0;

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

    const token = submission.token;

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

      await new Promise((resolve) =>
        setTimeout(resolve, 1000),
      );
    }

    // Compilation Error / Runtime Error / TLE
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
          executionResult.message ||
          executionResult.status
            ?.description,
      };
    }

    const actualOutput = (
      executionResult.stdout || ''
    ).trim();

    const expectedOutput =
      testCase.expectedOutput.trim();

    const passed =
      actualOutput === expectedOutput;

    if (passed) {
      passedCases++;
    }
  }

  const totalCases =
    question.testCases.length;

  const status =
    passedCases === totalCases
      ? 'PASSED'
      : 'FAILED';

  const score =
    totalCases === 0
      ? 0
      : Math.round(
          (passedCases / totalCases) * 100,
        );

 const savedSubmission =
  await this.prisma.codingSubmission.create({
    data: {
      codingTestId:
        dto.codingTestId,

      codingQuestionId:
        dto.codingQuestionId,

      attemptId:
        dto.attemptId,

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
  };
}

}