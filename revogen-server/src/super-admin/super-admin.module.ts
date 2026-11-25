import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Judge0Module } from '../judge0/judge0.module';
import { SuperAdminController } from './super-admin.controller';
import { SuperAdminUsersService } from './users.service';
import { SuperAdminMcqService } from './mcq.service';
import { SuperAdminCodingService } from './coding.service';
import { SuperAdminOverviewService } from './overview.service';

@Module({
  imports: [Judge0Module],
  controllers: [SuperAdminController],
  providers: [
    PrismaService,
    SuperAdminUsersService,
    SuperAdminMcqService,
    SuperAdminCodingService,
    SuperAdminOverviewService,
  ],
})
export class SuperAdminModule {}
