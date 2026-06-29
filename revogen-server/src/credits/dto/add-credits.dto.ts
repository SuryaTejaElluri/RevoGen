import { IsInt, IsString, IsOptional, IsIn, Min } from 'class-validator';

export class AddCreditsDto {
  @IsInt()
  @Min(1)
  credits: number;

  @IsString()
  description: string;

  @IsIn(['PURCHASE', 'USAGE', 'BONUS', 'REFUND', 'ADMIN'])
  @IsOptional()
  type?: string;
}
