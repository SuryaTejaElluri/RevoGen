import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SuperAdminGuard } from '../auth/super-admin.guard';
import { queryParams, strictBody } from '../common/roles';
import {
  AdjustCreditsDto,
  CodingQuestionDto,
  DeleteUserDto,
  ListCodingQueryDto,
  ListMcqQueryDto,
  ListUsersQueryDto,
  McqBulkDto,
  McqDto,
  RunReferenceDto,
  SuspendDto,
  UpdateRoleDto,
} from './dto';
import { SuperAdminUsersService, Actor } from './users.service';
import { SuperAdminMcqService } from './mcq.service';
import { SuperAdminCodingService } from './coding.service';
import { SuperAdminOverviewService } from './overview.service';

const actorOf = (req: { user: { userId: string; email: string } }): Actor => ({
  userId: req.user.userId,
  email: req.user.email,
});
const uuid = new ParseUUIDPipe({ version: '4' });

/** Everything here is for super admins only; bodies are strictly validated. */
@Controller('super-admin')
@UseGuards(AuthGuard('jwt'), SuperAdminGuard)
export class SuperAdminController {
  constructor(
    private readonly users: SuperAdminUsersService,
    private readonly mcq: SuperAdminMcqService,
    private readonly coding: SuperAdminCodingService,
    private readonly overviewService: SuperAdminOverviewService,
  ) {}

  @Get('me')
  me(@Request() req) {
    return req.user;
  }

  @Get('overview')
  overview() {
    return this.overviewService.overview();
  }

  // ─── Users ───────────────────────────────────────────────────────────────────

  @Get('users')
  listUsers(@Query(queryParams()) q: ListUsersQueryDto) {
    return this.users.list(q);
  }

  @Get('users/:id')
  getUser(@Param('id', uuid) id: string) {
    return this.users.detail(id);
  }

  @Patch('users/:id/role')
  setRole(@Request() req, @Param('id', uuid) id: string, @Body(strictBody()) dto: UpdateRoleDto) {
    return this.users.updateRole(actorOf(req), id, dto.role);
  }

  @Patch('users/:id/suspend')
  suspend(@Request() req, @Param('id', uuid) id: string, @Body(strictBody()) dto: SuspendDto) {
    return this.users.setSuspended(actorOf(req), id, dto.suspended, dto.restoreRole);
  }

  @Patch('users/:id/verify')
  verify(@Param('id', uuid) id: string) {
    return this.users.verifyEmail(id);
  }

  @Post('users/:id/credits')
  credits(@Request() req, @Param('id', uuid) id: string, @Body(strictBody()) dto: AdjustCreditsDto) {
    return this.users.adjustCredits(actorOf(req), id, dto);
  }

  /** POST rather than DELETE so the typed confirmation travels in a body every client sends. */
  @Post('users/:id/delete')
  @HttpCode(200)
  deleteUser(@Request() req, @Param('id', uuid) id: string, @Body(strictBody()) dto: DeleteUserDto) {
    return this.users.remove(actorOf(req), id, dto.confirmEmail);
  }

  // ─── MCQ bank ────────────────────────────────────────────────────────────────

  @Get('mcq')
  listMcq(@Query(queryParams()) q: ListMcqQueryDto) {
    return this.mcq.list(q);
  }

  @Get('mcq/categories')
  mcqCategories() {
    return this.mcq.categories();
  }

  @Post('mcq/bulk')
  @HttpCode(200)
  bulkMcq(@Body(strictBody()) dto: McqBulkDto) {
    return this.mcq.bulk(dto.rows, dto.dryRun ?? false);
  }

  @Get('mcq/:id')
  getMcq(@Param('id', uuid) id: string) {
    return this.mcq.get(id);
  }

  @Post('mcq')
  createMcq(@Body(strictBody()) dto: McqDto) {
    return this.mcq.create({ ...dto });
  }

  @Put('mcq/:id')
  updateMcq(@Param('id', uuid) id: string, @Body(strictBody()) dto: McqDto) {
    return this.mcq.update(id, { ...dto });
  }

  @Delete('mcq/:id')
  deleteMcq(@Param('id', uuid) id: string) {
    return this.mcq.remove(id);
  }

  // ─── Coding bank ─────────────────────────────────────────────────────────────

  @Get('coding')
  listCoding(@Query(queryParams()) q: ListCodingQueryDto) {
    return this.coding.list(q);
  }

  @Get('coding/meta')
  codingMeta() {
    return this.coding.meta();
  }

  @Post('coding/run')
  @HttpCode(200)
  runReference(@Body(strictBody()) dto: RunReferenceDto) {
    return this.coding.runReference(dto);
  }

  @Get('coding/:id')
  getCoding(@Param('id', uuid) id: string) {
    return this.coding.get(id);
  }

  @Post('coding')
  createCoding(@Body(strictBody()) dto: CodingQuestionDto) {
    return this.coding.create(dto);
  }

  @Put('coding/:id')
  updateCoding(@Param('id', uuid) id: string, @Body(strictBody()) dto: CodingQuestionDto) {
    return this.coding.update(id, dto);
  }

  @Delete('coding/:id')
  deleteCoding(@Param('id', uuid) id: string) {
    return this.coding.remove(id);
  }
}
