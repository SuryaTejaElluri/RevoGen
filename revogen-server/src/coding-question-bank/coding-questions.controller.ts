import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query
} from '@nestjs/common';
import { CodingCategory } from './enums/coding-category.enum';
import { Difficulty } from './enums/difficulty.enum';

import { CodingQuestionsService } from './coding-questions.service';

import { CreateCodingQuestionDto } from './dto/create-coding-question.dto';
import { UpdateCodingQuestionDto } from './dto/update-coding-question.dto';

@Controller('coding-questions')
export class CodingQuestionsController {
  constructor(
    private readonly codingQuestionsService: CodingQuestionsService,
  ) {}

  @Post()
  create(
    @Body() dto: CreateCodingQuestionDto,
  ) {
    return this.codingQuestionsService.create(dto);
  }

  @Get('categories')
getCategories() {
  return Object.values(CodingCategory);
}

@Get('difficulties')
getDifficulties() {
  return Object.values(Difficulty);
}

  @Get()
findAll(
  @Query('difficulty') difficulty?: string,
  @Query('category') category?: string,
) {
  return this.codingQuestionsService.findAll(
    difficulty,
    category,
  );
}

  @Get(':id')
  findOne(
    @Param('id') id: string,
  ) {
    return this.codingQuestionsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCodingQuestionDto,
  ) {
    return this.codingQuestionsService.update(
      id,
      dto,
    );
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
  ) {
    return this.codingQuestionsService.remove(id);
  }
}