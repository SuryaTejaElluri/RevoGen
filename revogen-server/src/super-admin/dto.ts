import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  NotEquals,
  ValidateNested,
} from 'class-validator';
import { ASSIGNABLE_ROLES, ROLES } from '../common/roles';
import { LANGUAGE_IDS } from '../judge0/judge0.service';

export const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'];
export const VALIDATORS = ['EXACT', 'IGNORE_ORDER', 'SET_COMPARE', 'FLOAT_COMPARE', 'CUSTOM'];
export const LANGUAGES = Object.keys(LANGUAGE_IDS);
export const CODING_LIMITS = {
  testCases: 100,
  caseText: 100_000,
  starterCode: 20_000,
  description: 20_000,
  runCases: 50,
  sourceCode: 50_000,
} as const;

// ─── Lists ───────────────────────────────────────────────────────────────────

export class ListQueryDto {
  @IsOptional() @IsString() @MaxLength(100)
  search?: string;

  @IsOptional() @IsInt() @Min(1)
  page?: number;

  @IsOptional() @IsInt() @Min(5) @Max(100)
  pageSize?: number;
}

export class ListUsersQueryDto extends ListQueryDto {
  @IsOptional() @IsIn([...ASSIGNABLE_ROLES, ROLES.SUSPENDED])
  role?: string;

  @IsOptional() @IsIn(['verified', 'unverified'])
  verified?: string;

  @IsOptional() @IsIn(['newest', 'oldest', 'name'])
  sort?: string;
}

export class ListMcqQueryDto extends ListQueryDto {
  @IsOptional() @IsString() @MaxLength(60)
  category?: string;
}

export class ListCodingQueryDto extends ListQueryDto {
  @IsOptional() @IsIn(DIFFICULTIES)
  difficulty?: string;

  @IsOptional() @IsString() @MaxLength(40)
  category?: string;
}

// ─── Users ───────────────────────────────────────────────────────────────────

export class UpdateRoleDto {
  @IsIn(ASSIGNABLE_ROLES, { message: 'Role must be Candidate, Recruiter or Super admin.' })
  role!: string;
}

export class SuspendDto {
  @IsBoolean()
  suspended!: boolean;

  /** Role to give back when reactivating (defaults to Candidate). */
  @IsOptional() @IsIn(ASSIGNABLE_ROLES)
  restoreRole?: string;
}

export class AdjustCreditsDto {
  @IsInt({ message: 'Credits must be a whole number.' })
  @Min(-100_000) @Max(100_000)
  @NotEquals(0, { message: 'Enter a number of credits other than 0.' })
  delta!: number;

  @IsString() @MinLength(3, { message: 'Give a short reason (at least 3 characters).' }) @MaxLength(200)
  reason!: string;
}

export class DeleteUserDto {
  /** Must equal the user's email — a deliberate, typed confirmation. */
  @IsString() @MaxLength(254)
  confirmEmail!: string;
}

// ─── MCQ ─────────────────────────────────────────────────────────────────────
// Field rules live in question-bank/mcq-input.ts (shared with the recruiter routes);
// these only check types so the shared parser gets strings.

export class McqDto {
  @IsString() @MaxLength(60) category!: string;
  @IsString() @MaxLength(2000) question!: string;
  @IsString() @MaxLength(500) optionA!: string;
  @IsString() @MaxLength(500) optionB!: string;
  @IsString() @MaxLength(500) optionC!: string;
  @IsString() @MaxLength(500) optionD!: string;
  /** A–D, or the text of the correct option. */
  @IsString() @MaxLength(500) correctAnswer!: string;
}

export class McqBulkDto {
  @IsArray() @ArrayMinSize(1, { message: 'Add at least one row.' }) @ArrayMaxSize(500, { message: 'Import at most 500 rows at a time.' })
  @IsObject({ each: true })
  rows!: Record<string, unknown>[];

  /** Validate only; nothing is saved. */
  @IsOptional() @IsBoolean()
  dryRun?: boolean;
}

// ─── Coding ──────────────────────────────────────────────────────────────────

export class TestCaseDto {
  @IsString() @MaxLength(CODING_LIMITS.caseText)
  input!: string;

  @IsString() @MaxLength(CODING_LIMITS.caseText)
  expectedOutput!: string;

  @IsOptional() @IsString() @MaxLength(1000)
  explanation?: string;

  @IsBoolean()
  isHidden!: boolean;
}

export class CodingQuestionDto {
  @IsString() @MinLength(3, { message: 'Title must be at least 3 characters.' }) @MaxLength(150)
  title!: string;

  @IsOptional() @IsString() @MaxLength(160)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'Slug can only use lowercase letters, numbers and single dashes.' })
  slug?: string;

  @IsString() @MinLength(2) @MaxLength(40)
  @Matches(/^[A-Za-z0-9 _&+./-]+$/, { message: 'Category can only use letters, numbers, spaces and _ & + . / -' })
  category!: string;

  @IsIn(DIFFICULTIES)
  difficulty!: string;

  @IsString() @MinLength(10, { message: 'Description must be at least 10 characters.' }) @MaxLength(CODING_LIMITS.description)
  description!: string;

  @IsOptional() @IsString() @MaxLength(5000) inputFormat?: string;
  @IsOptional() @IsString() @MaxLength(5000) outputFormat?: string;
  @IsOptional() @IsString() @MaxLength(5000) constraints?: string;

  /** { java: "...", python: "..." } — checked in the service. */
  @IsOptional() @IsObject()
  starterCodes?: Record<string, string>;

  @IsIn(VALIDATORS)
  outputValidator!: string;

  @IsInt() @Min(0) @Max(12)
  floatPrecision!: number;

  @IsArray()
  @ArrayMinSize(1, { message: 'Add at least one test case.' })
  @ArrayMaxSize(CODING_LIMITS.testCases, { message: `At most ${CODING_LIMITS.testCases} test cases.` })
  @ValidateNested({ each: true })
  @Type(() => TestCaseDto)
  testCases!: TestCaseDto[];
}

export class RunCaseDto {
  @IsString() @MaxLength(CODING_LIMITS.caseText)
  input!: string;

  @IsOptional() @IsString() @MaxLength(CODING_LIMITS.caseText)
  expectedOutput?: string;
}

export class RunReferenceDto {
  @IsIn(LANGUAGES)
  language!: string;

  @IsString() @MinLength(1, { message: 'Write a solution to run.' }) @MaxLength(CODING_LIMITS.sourceCode)
  sourceCode!: string;

  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(CODING_LIMITS.runCases)
  @ValidateNested({ each: true })
  @Type(() => RunCaseDto)
  testCases!: RunCaseDto[];

  @IsOptional() @IsIn(VALIDATORS)
  outputValidator?: string;

  @IsOptional() @IsInt() @Min(0) @Max(12)
  floatPrecision?: number;
}
