export class CreateCodingQuestionDto {
  title!: string;

  slug!: string;

  description!: string;

  constraints!: string;

  inputFormat!: string;

  outputFormat!: string;

  difficulty!: string;

  category!: string;

  starterCode?: any;

  solutionCode?: string;

  timeLimit?: number;

  memoryLimit?: number;

  testCases?: {
    input: string;
    expectedOutput: string;
    isHidden: boolean;
  }[];
}