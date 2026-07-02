import { Module } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CodingTestsController } from './coding-tests.controller';

import { CodingTestsService } from './coding-tests.service';

import { CodingAttemptsModule } from '../coding-attempts/coding-attempts.module';
import { CreditsModule } from '../credits/credits.module';
import { MailModule } from '../mail/mail.module';
@Module({
  imports: [
    CodingAttemptsModule,
    CreditsModule,
    MailModule
  ],

  controllers: [
    CodingTestsController,
  ],

  providers: [
    CodingTestsService,
    PrismaService,
  ],
})
export class CodingTestsModule {}