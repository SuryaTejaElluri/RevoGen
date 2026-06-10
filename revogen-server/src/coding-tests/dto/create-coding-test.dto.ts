export class CreateCodingTestDto {
  title!: string;

  description?: string;

  category?: string;

  duration!: number;

  questionIds!: string[];
}