import {
  Controller,
  Get,
  Request,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard }
from '@nestjs/passport';

import { DashboardService }
from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService:
      DashboardService,
  ) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  getDashboard(
    @Request() req,
  ) {
    return this.dashboardService
      .getDashboard(
        req.user.userId,
      );
  }
}