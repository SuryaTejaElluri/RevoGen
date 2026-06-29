import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CREDIT_COST } from '../common/constants/credits.constants';
import { AddCreditsDto } from './dto/add-credits.dto';
import { DeductCreditsDto } from './dto/deduct-credits.dto';
import { PurchasePreviewDto } from './dto/purchase-preview.dto';
import { EstimateCostDto } from './dto/estimate-cost.dto';
import { AdminAddCreditsDto } from './dto/admin-add-credits.dto';
import { AdminDeductCreditsDto } from './dto/admin-deduct-credits.dto';

@Injectable()
export class CreditsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Private helpers ─────────────────────────────────────────────────────────

  private async getOrCreateWallet(userId: string) {
    const existing = await this.prisma.adminCredits.findUnique({
      where: { userId },
    });
    if (existing) return existing;
    return this.prisma.adminCredits.create({
      data: { userId, balance: 0 },
    });
  }

  // ─── GET /credits ─────────────────────────────────────────────────────────────

  async getBalance(userId: string) {
    const wallet = await this.prisma.adminCredits.findUnique({
      where: { userId },
    });
    return {
      balance: wallet?.balance ?? 0,
      walletId: wallet?.id ?? null,
      updatedAt: wallet?.updatedAt ?? null,
    };
  }

  // ─── GET /credits/history ─────────────────────────────────────────────────────

  async getHistory(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.creditTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          type: true,
          credits: true,
          balanceAfter: true,
          description: true,
          referenceId: true,
          metadata: true,
          createdAt: true,
        },
      }),
      this.prisma.creditTransaction.count({ where: { userId } }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ─── GET /credits/packs ───────────────────────────────────────────────────────

  async getPacks() {
    return this.prisma.creditPack.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      select: {
        id: true,
        name: true,
        credits: true,
        bonusCredits: true,
        price: true,
        description: true,
        isPopular: true,
        displayOrder: true,
      },
    });
  }

  // ─── GET /credits/packs/:id ───────────────────────────────────────────────────

  async getPackById(id: string) {
    const pack = await this.prisma.creditPack.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        credits: true,
        bonusCredits: true,
        price: true,
        description: true,
        isPopular: true,
        isActive: true,
        displayOrder: true,
      },
    });
    if (!pack) {
      throw new NotFoundException('Credit pack not found.');
    }
    return pack;
  }

  // ─── POST /credits/purchase-preview ──────────────────────────────────────────

  async purchasePreview(dto: PurchasePreviewDto) {
    const pack = await this.prisma.creditPack.findUnique({
      where: { id: dto.packId },
    });
    if (!pack || !pack.isActive) {
      throw new NotFoundException('Credit pack not found or inactive.');
    }
    return {
      credits: pack.credits,
      bonusCredits: pack.bonusCredits,
      totalCredits: pack.credits + pack.bonusCredits,
      price: pack.price,
    };
  }

  // ─── POST /credits/estimate ───────────────────────────────────────────────────

  async estimateCost(userId: string, dto: EstimateCostDto) {
    const costPerCandidate = CREDIT_COST[dto.securityLevel] ?? 5;
    const requiredCredits = costPerCandidate * dto.candidateCount;

    const wallet = await this.prisma.adminCredits.findUnique({
      where: { userId },
    });
    const currentBalance = wallet?.balance ?? 0;
    const remainingBalance = currentBalance - requiredCredits;

    return {
      requiredCredits,
      currentBalance,
      remainingBalance,
      enoughCredits: currentBalance >= requiredCredits,
    };
  }

  // ─── POST /credits/add (self) ────────────────────────────────────────────────

  async addCredits(userId: string, dto: AddCreditsDto) {
    const wallet = await this.getOrCreateWallet(userId);
    const newBalance = wallet.balance + dto.credits;

    const [updatedWallet] = await this.prisma.$transaction([
      this.prisma.adminCredits.update({
        where: { userId },
        data: { balance: newBalance },
      }),
      this.prisma.creditTransaction.create({
        data: {
          userId,
          type: (dto.type ?? 'BONUS') as any,
          credits: dto.credits,
          balanceAfter: newBalance,
          description: dto.description,
        },
      }),
    ]);

    return { balance: updatedWallet.balance, added: dto.credits };
  }

  // ─── POST /credits/deduct (self) ─────────────────────────────────────────────

  async deductCredits(userId: string, dto: DeductCreditsDto) {
    const wallet = await this.prisma.adminCredits.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException('Credit wallet not found for this admin.');
    }

    if (wallet.balance < dto.credits) {
      throw new BadRequestException(
        `Insufficient credits. Available: ${wallet.balance}, Required: ${dto.credits}.`,
      );
    }

    const newBalance = wallet.balance - dto.credits;

    const [updatedWallet] = await this.prisma.$transaction([
      this.prisma.adminCredits.update({
        where: { userId },
        data: { balance: newBalance },
      }),
      this.prisma.creditTransaction.create({
        data: {
          userId,
          type: 'USAGE',
          credits: -dto.credits,
          balanceAfter: newBalance,
          description: dto.description,
          referenceId: dto.referenceId,
        },
      }),
    ]);

    return { balance: updatedWallet.balance, deducted: dto.credits };
  }

  // ─── POST /credits/admin/add ─────────────────────────────────────────────────

  async adminAddCredits(dto: AdminAddCreditsDto) {
    const wallet = await this.getOrCreateWallet(dto.userId);
    const newBalance = wallet.balance + dto.credits;

    const [updatedWallet] = await this.prisma.$transaction([
      this.prisma.adminCredits.update({
        where: { userId: dto.userId },
        data: { balance: newBalance },
      }),
      this.prisma.creditTransaction.create({
        data: {
          userId: dto.userId,
          type: 'ADMIN',
          credits: dto.credits,
          balanceAfter: newBalance,
          description: dto.description,
        },
      }),
    ]);

    return { balance: updatedWallet.balance, added: dto.credits };
  }

  // ─── POST /credits/admin/deduct ──────────────────────────────────────────────

  async adminDeductCredits(dto: AdminDeductCreditsDto) {
    const wallet = await this.prisma.adminCredits.findUnique({
      where: { userId: dto.userId },
    });

    if (!wallet) {
      throw new NotFoundException('Credit wallet not found for this user.');
    }

    if (wallet.balance < dto.credits) {
      throw new BadRequestException(
        `Insufficient credits. Available: ${wallet.balance}, Required: ${dto.credits}.`,
      );
    }

    const newBalance = wallet.balance - dto.credits;

    const [updatedWallet] = await this.prisma.$transaction([
      this.prisma.adminCredits.update({
        where: { userId: dto.userId },
        data: { balance: newBalance },
      }),
      this.prisma.creditTransaction.create({
        data: {
          userId: dto.userId,
          type: 'ADMIN',
          credits: -dto.credits,
          balanceAfter: newBalance,
          description: dto.description,
        },
      }),
    ]);

    return { balance: updatedWallet.balance, deducted: dto.credits };
  }

  // ─── Internal: deduct within a caller-provided Prisma transaction ─────────────
  // Used by CodingTestsService so assignment + deduction are fully atomic.

  async deductCreditsWithinTx(
    tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
    userId: string,
    amount: number,
    description: string,
    referenceId?: string,
    metadata?: Record<string, unknown>,
  ): Promise<{ newBalance: number }> {    const wallet = await tx.adminCredits.findUnique({ where: { userId } });

    if (!wallet) {
      throw new NotFoundException('Credit wallet not found for this admin.');
    }

    if (wallet.balance < amount) {
      throw new BadRequestException(
        `Insufficient Revo Credits. Available: ${wallet.balance}, Required: ${amount}.`,
      );
    }

    const newBalance = wallet.balance - amount;

    await tx.adminCredits.update({
      where: { userId },
      data: { balance: newBalance },
    });

    await tx.creditTransaction.create({
      data: {
        userId,
        type: 'USAGE',
        credits: -amount,
        balanceAfter: newBalance,
        description,
        referenceId: referenceId ?? null,
        metadata: metadata !== undefined
          ? (metadata as Prisma.InputJsonValue)
          : undefined,
      },
    });

    return { newBalance };
  }
}
