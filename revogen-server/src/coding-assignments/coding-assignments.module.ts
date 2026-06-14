import { Module } from '@nestjs/common';
import { CodingAssignmentsController } from './coding-assignments.controller';
import { CodingAssignmentsService } from './coding-assignments.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CodingAssignmentsController],
  providers: [CodingAssignmentsService],
})
export class CodingAssignmentsModule {}