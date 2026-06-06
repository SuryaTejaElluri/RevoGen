import {
  Controller,
  Patch,
  Delete,
  Get,
  Req,
  UseGuards,
  Param,
  Body,
} from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';

import { AdminGuard } from '../auth/admin.guard';

import { UsersService } from './users.service';

import { SuperAdminGuard }
from '../auth/super-admin.guard';

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

  @Patch(':id/role')
@UseGuards(
  AuthGuard('jwt'),
  SuperAdminGuard,
)
updateRole(
  @Param('id') id: string,

  @Body()
  body: {
    role: string;
  },
) {
  return this.usersService.updateRole(
    id,
    body.role,
  );
}

@Delete(':id')
@UseGuards(
  AuthGuard('jwt'),
  SuperAdminGuard,
)
deleteUser(
  @Param('id') id: string,
) {
  return this.usersService.deleteUser(
    id,
  );
}

  @Get(':id/profile')
@UseGuards(
  AuthGuard('jwt'),
  AdminGuard,
)
getCandidateProfile(
  @Param('id') id: string,
) {
  return this.usersService.getCandidateProfile(
    id,
  );
}
@Get('leaderboard')
@UseGuards(
  AuthGuard('jwt'),
  AdminGuard,
)
getLeaderboard() {
  return this.usersService.getLeaderboard();
}
@Get('super-test')
@UseGuards(
  AuthGuard('jwt'),
  SuperAdminGuard,
)
superTest() {
  return {
    message:
      'Welcome Super Admin',
  };
}
}