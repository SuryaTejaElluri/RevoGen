import {
  Body,
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';

import { QuestionBankService } from './question-bank.service';
import { AdminGuard } from '../auth/admin.guard';

@Controller('question-bank')
export class QuestionBankController {
  constructor(
    private readonly questionBankService:
      QuestionBankService,
  ) {}

  @Post()
  @UseGuards(
    AuthGuard('jwt'),
    AdminGuard,
  )
  create(
    @Body() body: any,
  ) {
    return this.questionBankService.create(
      body,
    );
  }

  @Get('categories')
  @UseGuards(
    AuthGuard('jwt'),
    AdminGuard,
  )
  getCategories() {
    return this.questionBankService.getCategories();
  }

  @Get()
  @UseGuards(
    AuthGuard('jwt'),
    AdminGuard,
  )
  findAll(
    @Query('category')
    category?: string,
  ) {
    return this.questionBankService.findAll(
      category,
    );
  }

  @Get(':id')
  @UseGuards(
    AuthGuard('jwt'),
    AdminGuard,
  )
  findOne(
    @Param('id') id: string,
  ) {
    return this.questionBankService.findOne(
      id,
    );
  }

  @Patch(':id')
  @UseGuards(
    AuthGuard('jwt'),
    AdminGuard,
  )
  update(
    @Param('id') id: string,

    @Body() body: any,
  ) {
    return this.questionBankService.update(
      id,
      body,
    );
  }

  @Delete(':id')
  @UseGuards(
    AuthGuard('jwt'),
    AdminGuard,
  )
  remove(
    @Param('id') id: string,
  ) {
    return this.questionBankService.remove(
      id,
    );
  }
}