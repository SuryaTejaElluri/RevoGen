import { Module } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CodingAttemptsController } from './coding-attempts.controller';

import { CodingAttemptsService } from './coding-attempts.service';

@Module({
  controllers: [
    CodingAttemptsController,
  ],

  providers: [
    CodingAttemptsService,
    PrismaService,
  ],

  exports: [
    CodingAttemptsService,
  ],
})
export class CodingAttemptsModule {}