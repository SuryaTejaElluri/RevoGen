import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';

import { CodingSubmissionsService } from './coding-submissions.service';

import { CreateRunCodeDto } from './dto/create-run-code.dto';
import { CreateSubmitCodeDto } from './dto/create-submit-code.dto';

@Controller('coding-submissions')
export class CodingSubmissionsController {
  constructor(
    private readonly codingSubmissionsService: CodingSubmissionsService,
  ) {}

  @Post('run')
  async runCode(
    @Body() dto: CreateRunCodeDto,
  ) {
    return this.codingSubmissionsService.runCode(
      dto,
    );
  }

  @Post('submit')
  async submitCode(
    @Body() dto: CreateSubmitCodeDto,
  ) {
    return this.codingSubmissionsService.submitCode(
      dto,
    );
  }
}