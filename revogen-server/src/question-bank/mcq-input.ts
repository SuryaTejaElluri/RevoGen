import { BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * One definition of a valid MCQ, used by the recruiter routes, the super admin
 * routes and the bulk import, so a question can't be valid in one place and not
 * another.
 */
export interface McqData {
  category: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  /** Stored as the option's text (the convention used by grading and seeds). */
  correctAnswer: string;
}

export const MCQ_LIMITS = { category: 60, question: 2000, option: 500 } as const;
const LETTERS = ['A', 'B', 'C', 'D'] as const;
const CATEGORY_CHARS = /^[\p{L}\p{N} .+#&/()_-]+$/u;

const clean = (v: unknown) => (typeof v === 'string' ? v.replace(/\r\n?/g, '\n').trim() : '');
const squashSpaces = (v: string) => v.replace(/\s+/g, ' ');

/** Validate and normalise; returns the clean data or the list of problems. */
export function parseMcq(input: Record<string, unknown>): { data?: McqData; errors: string[] } {
  const errors: string[] = [];
  const category = squashSpaces(clean(input.category));
  const question = clean(input.question);
  const options = LETTERS.map((l) => clean(input[`option${l}`]));

  if (!category) errors.push('Category is required.');
  else if (category.length > MCQ_LIMITS.category) errors.push(`Category must be at most ${MCQ_LIMITS.category} characters.`);
  else if (!CATEGORY_CHARS.test(category)) errors.push('Category can only use letters, numbers, spaces and . + # & / ( ) _ -');

  if (question.length < 5) errors.push('Question must be at least 5 characters.');
  else if (question.length > MCQ_LIMITS.question) errors.push(`Question must be at most ${MCQ_LIMITS.question} characters.`);

  options.forEach((o, i) => {
    if (!o) errors.push(`Option ${LETTERS[i]} is required.`);
    else if (o.length > MCQ_LIMITS.option) errors.push(`Option ${LETTERS[i]} must be at most ${MCQ_LIMITS.option} characters.`);
  });
  const lowered = options.map((o) => o.toLowerCase()).filter(Boolean);
  if (new Set(lowered).size !== lowered.length) errors.push('All four options must be different.');

  // The answer may be a letter (A–D) or the text of one of the options.
  const answer = clean(input.correctAnswer);
  let correctAnswer = '';
  if (!answer) errors.push('Choose the correct answer.');
  else if (/^[ABCD]$/i.test(answer)) correctAnswer = options[LETTERS.indexOf(answer.toUpperCase() as (typeof LETTERS)[number])];
  else {
    const exact = options.findIndex((o) => o === answer);
    const idx = exact >= 0 ? exact : options.findIndex((o) => o.toLowerCase() === answer.toLowerCase());
    if (idx < 0) errors.push('The correct answer must be one of the four options.');
    else correctAnswer = options[idx];
  }

  if (errors.length) return { errors };
  return {
    errors,
    data: { category, question, optionA: options[0], optionB: options[1], optionC: options[2], optionD: options[3], correctAnswer },
  };
}

/** parseMcq that throws a 400 listing every problem. */
export function requireMcq(input: Record<string, unknown>): McqData {
  const { data, errors } = parseMcq(input ?? {});
  if (!data) throw new BadRequestException(errors);
  return data;
}

/** Reuse an existing category's spelling ("java" → "Java") so the bank doesn't split. */
export async function canonicalCategory(prisma: PrismaService, category: string): Promise<string> {
  const existing = await prisma.questionBank.findFirst({
    where: { category: { equals: category, mode: 'insensitive' } },
    select: { category: true },
  });
  return existing?.category ?? category;
}

/** Throw 409 if the same question already exists in the same category. */
export async function assertNotDuplicate(prisma: PrismaService, data: McqData, exceptId?: string) {
  const dup = await prisma.questionBank.findFirst({
    where: {
      category: { equals: data.category, mode: 'insensitive' },
      question: { equals: data.question, mode: 'insensitive' },
      ...(exceptId ? { NOT: { id: exceptId } } : {}),
    },
    select: { id: true },
  });
  if (dup) throw new ConflictException('This question already exists in that category.');
}
