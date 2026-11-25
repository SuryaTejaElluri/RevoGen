import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../auth/admin.guard';
import { SuperAdminGuard } from '../auth/super-admin.guard';
import { CodingQuestionBankService } from './coding-question-bank.service';
import { CreateCodingQuestionDto } from './dto/create-coding-question.dto';

/**
 * The shared coding question bank. It includes hidden test cases, so it is never
 * public: recruiters can read it to build tests, only super admins can add to it
 * (the full editor lives under /super-admin/coding).
 */
@Controller('coding-question-bank')
@UseGuards(AuthGuard('jwt'), AdminGuard)
export class CodingQuestionBankController {
  constructor(private readonly codingQuestionBankService: CodingQuestionBankService) {}

  @Post()
  @UseGuards(SuperAdminGuard)
  create(@Body() dto: CreateCodingQuestionDto) {
    return this.codingQuestionBankService.create(dto);
  }

  @Get()
  findAll() {
    return this.codingQuestionBankService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.codingQuestionBankService.findOne(id);
  }
}
