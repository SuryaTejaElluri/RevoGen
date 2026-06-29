import { Module } from '@nestjs/common';
import { CreditsController } from './credits.controller';
import { CreditsService } from './credits.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [CreditsController],
  providers: [CreditsService, PrismaService],
  exports: [CreditsService], // exported so future modules (e.g. coding-tests) can call deductCredits
})
export class CreditsModule {}
