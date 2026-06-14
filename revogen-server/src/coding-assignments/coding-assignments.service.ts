import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { randomUUID } from 'crypto';

import { PrismaService } from '../prisma/prisma.service';

import { CreateCodingAssignmentDto } from './dto/create-coding-assignment.dto';

@Injectable()
export class CodingAssignmentsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
    dto: CreateCodingAssignmentDto,
  ) {
    const codingTest =
      await this.prisma.codingTest.findUnique({
        where: {
          id: dto.codingTestId,
        },
      });

    if (!codingTest) {
      throw new NotFoundException(
        'Coding test not found',
      );
    }

    const token =
      randomUUID();

    const assignment =
      await this.prisma.codingAssignment.create({
        data: {
          codingTestId:
            dto.codingTestId,

          candidateName:
            dto.candidateName,

          candidateEmail:
            dto.candidateEmail,

          accessToken:
            token,
        },
      });

    return {
      success: true,

      assignmentId:
        assignment.id,

      accessToken:
        token,
    };
  }
}