import { IsInt, IsString, IsOptional, Min } from 'class-validator';

export class DeductCreditsDto {
  @IsInt()
  @Min(1)
  credits: number;

  @IsString()
  description: string;

  @IsString()
  @IsOptional()
  referenceId?: string;
}
