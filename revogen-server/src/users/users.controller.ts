import {
  Controller,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';

import { AdminGuard } from '../auth/admin.guard';

import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  getProfile(@Req() req) {
    return req.user;
  }

  @Get()
  @UseGuards(
    AuthGuard('jwt'),
    AdminGuard,
  )
  findAll() {
    return this.usersService.findAll();
  }
}