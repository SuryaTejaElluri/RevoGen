import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';

import { CodingTestsService } from './coding-tests.service';

import { CreateCodingTestDto } from './dto/create-coding-test.dto';

import { UpdateCodingTestDto } from './dto/update-coding-test.dto';

@Controller('coding-tests')
export class CodingTestsController {
  constructor(
    private readonly codingTestsService: CodingTestsService,
  ) {}

  @Post()
  create(
    @Body() dto: CreateCodingTestDto,
  ) {
    return this.codingTestsService.create(dto);
  }

  @Get()
  findAll() {
    return this.codingTestsService.findAll();
  }
@Patch(':id')
update(
  @Param('id') id: string,
  @Body() dto: UpdateCodingTestDto,
) {
  return this.codingTestsService.update(
    id,
    dto,
  );
}
@Delete(':id')
remove(
  @Param('id') id: string,
) {
  return this.codingTestsService.remove(id);
}
  @Get(':id')
  findOne(
    @Param('id') id: string,
  ) {
    return this.codingTestsService.findOne(id);
  }
}