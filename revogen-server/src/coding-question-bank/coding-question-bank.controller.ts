import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';

import { CodingQuestionBankService } from './coding-question-bank.service';

import { CreateCodingQuestionDto } from './dto/create-coding-question.dto';

@Controller('coding-question-bank')
export class CodingQuestionBankController {
  constructor(
    private readonly codingQuestionBankService: CodingQuestionBankService,
  ) {}

  @Post()
  create(
    @Body()
    dto: CreateCodingQuestionDto,
  ) {
    return this.codingQuestionBankService.create(
      dto,
    );
  }


@Get()
findAll() {
  return this.codingQuestionBankService.findAll();
}

@Get(':id')
findOne(
  @Param('id') id: string,
) {
  return this.codingQuestionBankService.findOne(
    id,
  );
}
}