import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../auth/admin.guard';
import { TestsService } from './tests.service';

@Controller('tests')
export class TestsController {
  constructor(private readonly testsService: TestsService) {}

  // ─── Admin: Create Test ───────────────────────────────────────────────────────
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Post()
  createTest(@Body() body: any, @Request() req) {
    return this.testsService.createTest(body, req.user.userId);
  }

  // ─── Admin: Get All Tests (own only) ──────────────────────────────────────────
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Get()
  findAll(@Request() req) {
    return this.testsService.findAll(req.user.userId);
  }

  // ─── Admin: Dashboard Stats (own only) ────────────────────────────────────────
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Get('dashboard/stats')
  getDashboardStats(@Request() req) {
    return this.testsService.getDashboardStats(req.user.userId);
  }

  // ─── Admin: Get Results ───────────────────────────────────────────────────────
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Get(':id/results')
  getResults(@Param('id') id: string, @Request() req) {
    return this.testsService.getResults(id, req.user.userId);
  }

  // ─── Admin: Get Invitations ───────────────────────────────────────────────────
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Get(':id/invitations')
  getInvitations(@Param('id') id: string, @Request() req) {
    return this.testsService.getInvitations(id, req.user.userId);
  }

  // ─── Admin: Get Modules ───────────────────────────────────────────────────────
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Get(':id/modules')
  getModules(@Param('id') id: string, @Request() req) {
    return this.testsService.getModules(id, req.user.userId);
  }

  // ─── Admin: Add Question ──────────────────────────────────────────────────────
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Post(':id/questions')
  addQuestion(
    @Param('id') id: string,
    @Body() body: any,
    @Request() req,
  ) {
    return this.testsService.addQuestion(id, body, req.user.userId);
  }

  // ─── Admin: Add Question From Bank ────────────────────────────────────────────
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Post(':testId/questions-bank/:questionId')
  addQuestionFromBank(
    @Param('testId') testId: string,
    @Param('questionId') questionId: string,
    @Request() req,
  ) {
    return this.testsService.addQuestionFromBank(
      testId,
      questionId,
      req.user.userId,
    );
  }

  // ─── Admin: Invite Candidates ─────────────────────────────────────────────────
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Post(':id/invite')
  inviteCandidates(
    @Param('id') id: string,
    @Body() body: { emails: string[] },
    @Request() req,
  ) {
    return this.testsService.inviteCandidates(id, body.emails, req.user.userId);
  }

  // ─── Admin: Get Single Attempt Report ─────────────────────────────────────────
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Get('report/:attemptId')
  getAttemptReport(@Param('attemptId') attemptId: string, @Request() req) {
    return this.testsService.getAttemptReport(attemptId, req.user.userId);
  }

  // ─── Candidate: Get Assigned Tests ────────────────────────────────────────────
  @UseGuards(AuthGuard('jwt'))
  @Get('assigned')
  getAssignedTests(@Request() req) {
    return this.testsService.getAssignedTests(req.user.email);
  }

  // ─── Candidate: My Attempts ───────────────────────────────────────────────────
  @UseGuards(AuthGuard('jwt'))
  @Get('my-attempts')
  getMyAttempts(@Request() req) {
    return this.testsService.getUserAttempts(req.user.userId);
  }

  // ─── Candidate: Attempt Status ────────────────────────────────────────────────
  @UseGuards(AuthGuard('jwt'))
  @Get(':id/attempt-status')
  getAttemptStatus(@Param('id') id: string, @Request() req) {
    return this.testsService.hasAttempted(id, req.user.userId);
  }

  // ─── Candidate: Submit Test ───────────────────────────────────────────────────
  @UseGuards(AuthGuard('jwt'))
  @Post(':id/submit')
  submitTest(
    @Param('id') id: string,
    @Body() body: any,
    @Request() req,
  ) {
    return this.testsService.submitTest(
      id,
      req.user.userId,
      body.answers,
      body,
    );
  }

  // ─── Public: Get Single Test (candidate takes it) ────────────────────────────
  @Get(':id')
  findById(@Param('id') id: string) {
    // No adminId → no ownership check, candidate can load the test
    return this.testsService.findById(id);
  }

  // ─── Public: Practice Tests ───────────────────────────────────────────────────
  @Get('practice')
  getPracticeTests() {
    return this.testsService.getPracticeTests();
  }
}
