import { Module } from '@nestjs/common';

import { CodingSubmissionsController } from './coding-submissions.controller';
import { CodingSubmissionsService } from './coding-submissions.service';

import { PrismaModule } from '../prisma/prisma.module';
import { Judge0Module } from '../judge0/judge0.module';
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
})
export class CodingSubmissionsModule {}