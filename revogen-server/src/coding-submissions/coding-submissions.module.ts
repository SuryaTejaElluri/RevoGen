import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';

import { Judge0Module } from '../judge0/judge0.module';

import { CodingSubmissionsController } from './coding-submissions.controller';

import { CodingSubmissionsService } from './coding-submissions.service';

@Module({
  imports: [
    PrismaModule,
    Judge0Module,
  ],

  controllers: [
    CodingSubmissionsController,
  ],

  providers: [
    CodingSubmissionsService,
  ],

  exports: [
    CodingSubmissionsService,
  ],
})
export class CodingSubmissionsModule {}