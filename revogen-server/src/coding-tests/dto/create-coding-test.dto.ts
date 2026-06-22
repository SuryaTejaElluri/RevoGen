export class CreateCodingTestDto {
  title!: string;

  description?: string;

  duration!: number;

  securityLevel!: string;

  questionIds!: string[];
}