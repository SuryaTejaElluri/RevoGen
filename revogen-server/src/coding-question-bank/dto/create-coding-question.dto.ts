export class CreateCodingQuestionDto {
  title!: string;

  slug!: string;

  category!: string;

  difficulty!: string;

  description!: string;

  inputFormat?: string;

  outputFormat?: string;

  constraints?: string;

  examples?: any;

  starterCode?: any;

  testCases?: {
    input: string;
    expectedOutput: string;
    explanation?: string;
    isHidden?: boolean;
  }[];
}