import { IsInt, IsString, IsNotEmpty, Min } from 'class-validator';

export class AdminAddCreditsDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsInt()
  @Min(1)
  credits: number;

  @IsString()
  @IsNotEmpty()
  description: string;
}
