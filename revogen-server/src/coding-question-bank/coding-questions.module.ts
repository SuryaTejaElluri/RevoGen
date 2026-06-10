import { Module } from '@nestjs/common';

import { CodingQuestionsController } from './coding-questions.controller';
import { CodingQuestionsService } from './coding-questions.service';

import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CodingQuestionsController],
  providers: [CodingQuestionsService],
  exports: [CodingQuestionsService],
})
export class CodingQuestionsModule {}