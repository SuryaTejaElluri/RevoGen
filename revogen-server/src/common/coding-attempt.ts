import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Submissions are still accepted this long after the timer ends (network delays, auto-submit). */
export const SUBMIT_GRACE_SECONDS = 120;

export function attemptEndsAt(startedAt: Date, durationMinutes: number): Date {
  return new Date(new Date(startedAt).getTime() + durationMinutes * 60_000);
}

/** Seconds left on the clock, never negative. Based on the server's startedAt, so a page refresh can't reset it. */
export function remainingSeconds(
  startedAt: Date,
  durationMinutes: number,
  now = Date.now(),
): number {
  return Math.max(
    0,
    Math.floor(
      (attemptEndsAt(startedAt, durationMinutes).getTime() - now) / 1000,
    ),
  );
}

/**
 * Load an attempt the current candidate may still work on: it must be theirs,
 * still IN_PROGRESS, within its time limit (+ grace), and — when a question is
 * given — that question must belong to the attempt's test.
 */
export async function loadActiveAttempt(
  prisma: PrismaService,
  attemptId: string,
  userId: string,
  questionId?: string,
) {
  if (!attemptId) throw new BadRequestException('attemptId is required.');

  const attempt = await prisma.codingAttempt.findFirst({
    where: { id: attemptId, userId },
    include: {
      codingTest: { select: { id: true, duration: true, securityLevel: true } },
    },
  });
  if (!attempt) throw new NotFoundException('Test attempt not found.');
  if (attempt.status !== 'IN_PROGRESS') {
    throw new ForbiddenException('This test has already been submitted.');
  }

  const deadline =
    attemptEndsAt(attempt.startedAt, attempt.codingTest.duration).getTime() +
    SUBMIT_GRACE_SECONDS * 1000;
  if (Date.now() > deadline) {
    throw new ForbiddenException('Time is up for this test.');
  }

  if (questionId) {
    const inTest = await prisma.codingTestQuestion.findFirst({
      where: { codingTestId: attempt.codingTestId, questionId },
      select: { questionId: true },
    });
    if (!inTest)
      throw new BadRequestException('This question is not part of your test.');
  }

  return attempt;
}
