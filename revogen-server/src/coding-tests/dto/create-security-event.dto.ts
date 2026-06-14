import {
  IsString,
  IsOptional,
} from 'class-validator';

export class CreateSecurityEventDto {
  @IsString()
  codingTestId: string;

  @IsOptional()
  @IsString()
  attemptId?: string;

  @IsString()
  eventType:
    | 'TAB_SWITCH'
    | 'FULLSCREEN_EXIT'
    | 'DEVTOOLS_OPENED'
    | 'LARGE_PASTE'
    | 'REFRESH_ATTEMPT';

  @IsOptional()
  @IsString()
  details?: string;
}