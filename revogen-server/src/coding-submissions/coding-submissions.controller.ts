import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';

import { CodingSubmissionsService } from './coding-submissions.service';

import { CreateRunCodeDto } from './dto/create-run-code.dto';

import { CreateSubmitCodeDto } from './dto/create-submit-code.dto';

@Controller('coding-submissions')
export class CodingSubmissionsController {
  constructor(
    private readonly codingSubmissionsService: CodingSubmissionsService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('run')
  runCode(
    @Body()
    dto: CreateRunCodeDto,
    @Request() req,
  ) {
    return this.codingSubmissionsService.runCode(dto, req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('submit')
  submitCode(
    @Body()
    dto: CreateSubmitCodeDto,
    @Request() req,
  ) {
    return this.codingSubmissionsService.submitCode(dto, req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('attempt/:attemptId')
  getSubmissions(
    @Param('attemptId')
    attemptId: string,
    @Request() req,
  ) {
    return this.codingSubmissionsService.getSubmissionsFor(
      attemptId,
      req.user.userId,
    );
  }



 
}