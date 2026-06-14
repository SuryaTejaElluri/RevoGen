import {
  IsString,
} from 'class-validator';

export class FinalSubmitDto {
  @IsString()
  codingTestId: string;

  @IsString()
  attemptId: string;
}