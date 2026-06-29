import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Request,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../auth/admin.guard';
import { CreditsService } from './credits.service';
import { AddCreditsDto } from './dto/add-credits.dto';
import { DeductCreditsDto } from './dto/deduct-credits.dto';
import { PurchasePreviewDto } from './dto/purchase-preview.dto';
import { EstimateCostDto } from './dto/estimate-cost.dto';
import { AdminAddCreditsDto } from './dto/admin-add-credits.dto';
import { AdminDeductCreditsDto } from './dto/admin-deduct-credits.dto';

@Controller('credits')
@UseGuards(AuthGuard('jwt'), AdminGuard)
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  // ── GET /credits ──────────────────────────────────────────────────────────────
  // Returns current wallet balance + wallet metadata
  @Get()
  getBalance(@Request() req) {
    return this.creditsService.getBalance(req.user.userId);
  }

  // ── GET /credits/history ──────────────────────────────────────────────────────
  // Paginated transaction history, newest first
  @Get('history')
  getHistory(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.creditsService.getHistory(
      req.user.userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  // ── GET /credits/packs ────────────────────────────────────────────────────────
  // All active credit packs sorted by displayOrder
  @Get('packs')
  getPacks() {
    return this.creditsService.getPacks();
  }

  // ── GET /credits/packs/:id ────────────────────────────────────────────────────
  // Single credit pack; 404 if not found
  @Get('packs/:id')
  getPackById(@Param('id') id: string) {
    return this.creditsService.getPackById(id);
  }

  // ── POST /credits/purchase-preview ───────────────────────────────────────────
  // Validate pack and return cost breakdown — no wallet change
  @Post('purchase-preview')
  purchasePreview(@Body() dto: PurchasePreviewDto) {
    return this.creditsService.purchasePreview(dto);
  }

  // ── POST /credits/estimate ────────────────────────────────────────────────────
  // Estimate credits required for a coding test assignment
  @Post('estimate')
  estimateCost(@Request() req, @Body() dto: EstimateCostDto) {
    return this.creditsService.estimateCost(req.user.userId, dto);
  }

  // ── POST /credits/add ─────────────────────────────────────────────────────────
  // Internal: add credits to own wallet
  @Post('add')
  addCredits(@Request() req, @Body() dto: AddCreditsDto) {
    return this.creditsService.addCredits(req.user.userId, dto);
  }

  // ── POST /credits/deduct ──────────────────────────────────────────────────────
  // Internal: deduct credits from own wallet
  @Post('deduct')
  deductCredits(@Request() req, @Body() dto: DeductCreditsDto) {
    return this.creditsService.deductCredits(req.user.userId, dto);
  }

  // ── POST /credits/admin/add ───────────────────────────────────────────────────
  // Super-admin: add credits to any user's wallet
  @Post('admin/add')
  adminAddCredits(@Body() dto: AdminAddCreditsDto) {
    return this.creditsService.adminAddCredits(dto);
  }

  // ── POST /credits/admin/deduct ────────────────────────────────────────────────
  // Super-admin: deduct credits from any user's wallet (never goes negative)
  @Post('admin/deduct')
  adminDeductCredits(@Body() dto: AdminDeductCreditsDto) {
    return this.creditsService.adminDeductCredits(dto);
  }
}
