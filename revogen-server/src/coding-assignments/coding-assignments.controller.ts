import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';

import { CodingAssignmentsService }
from './coding-assignments.service';

import { CreateCodingAssignmentDto }
from './dto/create-coding-assignment.dto';

@Controller('coding-assignments')
export class CodingAssignmentsController {
  constructor(
    private readonly codingAssignmentsService: CodingAssignmentsService,
  ) {}

  @Post()
  create(
    @Body()
    dto: CreateCodingAssignmentDto,
  ) {
    return this.codingAssignmentsService.create(
      dto,
    );
  }
}