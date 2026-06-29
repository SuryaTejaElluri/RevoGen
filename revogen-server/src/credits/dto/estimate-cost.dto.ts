import { IsInt, IsIn, Min } from 'class-validator';

export class EstimateCostDto {
  @IsIn(['BASIC', 'PRO'])
  securityLevel: string;

  @IsInt()
  @Min(1)
  candidateCount: number;
}
