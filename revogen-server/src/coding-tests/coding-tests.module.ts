import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';

import { CodingTestsController } from './coding-tests.controller';
import { CodingTestsService } from './coding-tests.service';

@Module({
  imports: [PrismaModule],
  controllers: [CodingTestsController],
  providers: [CodingTestsService],
  exports: [CodingTestsService],
})
export class CodingTestsModule {}