import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Request,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';
import { CodingTestsService } from './coding-tests.service';
import { CreateCodingTestDto } from './dto/create-coding-test.dto';
import { InviteCandidateDto } from './dto/invite-candidate.dto';

@Controller('coding-tests')
export class CodingTestsController {
  constructor(
    private readonly codingTestsService: CodingTestsService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(@Body() dto: CreateCodingTestDto, @Request() req) {
    return this.codingTestsService.create(dto, req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  findAll(@Request() req) {
    return this.codingTestsService.findAll(req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('dashboard/stats')
  getCodingDashboardStats(@Request() req) {
    return this.codingTestsService.getCodingDashboardStats(req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('assigned')
  getAssignedTests(@Request() req) {
    return this.codingTestsService.getAssignedTests(req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':testId/results')
  getResults(@Param('testId') testId: string, @Request() req) {
    return this.codingTestsService.getResults(testId, req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id/invitations')
  getInvitations(@Param('id') id: string, @Request() req) {
    return this.codingTestsService.getInvitations(id, req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id/invitations/:invitationId')
  removeInvitation(
    @Param('id') id: string,
    @Param('invitationId') invitationId: string,
    @Request() req,
  ) {
    return this.codingTestsService.removeInvitation(id, invitationId, req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/invite')
  inviteCandidate(@Param('id') id: string, @Body() dto: InviteCandidateDto, @Request() req) {
    return this.codingTestsService.inviteCandidate(id, dto, req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  deleteTest(@Param('id') id: string, @Request() req) {
    return this.codingTestsService.deleteTest(id, req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.codingTestsService.findOne(id, req.user.userId);
  }
}
