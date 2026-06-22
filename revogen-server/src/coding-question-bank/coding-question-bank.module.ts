import { Module } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CodingQuestionBankController } from './coding-question-bank.controller';
import { CodingQuestionBankService } from './coding-question-bank.service';

@Module({
  controllers: [
    CodingQuestionBankController,
  ],
  providers: [
    CodingQuestionBankService,
    PrismaService,
  ],
})
export class CodingQuestionBankModule {}