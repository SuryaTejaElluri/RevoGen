import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';

import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { PrismaService } from '../prisma/prisma.service';

import { UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser =
      await this.usersService.findByEmail(
        dto.email,
      );

    if (existingUser) {
      throw new BadRequestException(
        'Email already exists',
      );
    }

    const hashedPassword =
      await bcrypt.hash(dto.password, 10);

    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      phone: dto.phone,
      role: dto.role ?? 'USER',
    });

    this.logger.log(`Registered user: ${dto.email} | role: ${dto.role ?? 'USER'}`);

    const { password, ...safeUser } = user;

    return {
      message: 'User registered successfully',
      user: safeUser,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.password!,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // ── Wallet auto-creation for ADMIN accounts ──────────────────────────────
    if (user.role === 'ADMIN') {
      await this.provisionAdminWallet(user.id, user.email);
    }
    // ────────────────────────────────────────────────────────────────────────

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      role: user.role,
    };
  }

  // ── Private: idempotent wallet provisioning ────────────────────────────────
  // Creates the wallet + welcome bonus in a single Prisma transaction.
  // Safe to call on every login — exits early if wallet already exists.

  private async provisionAdminWallet(
    userId: string,
    email: string,
  ): Promise<void> {
    try {
      const existing = await this.prisma.adminCredits.findUnique({
        where: { userId },
      });

      if (existing) return; // wallet already provisioned — nothing to do

      await this.prisma.$transaction(async (tx) => {
        await tx.adminCredits.create({
          data: { userId, balance: 20 },
        });

        await tx.creditTransaction.create({
          data: {
            userId,
            type: 'BONUS',
            credits: 20,
            balanceAfter: 20,
            description: 'Welcome Bonus',
            referenceId: null,
            metadata: {
              reason: 'First Login',
              source: 'System',
            },
          },
        });
      });

      this.logger.log(
        `Created Revo Credits wallet for admin: ${email} — Granted Welcome Bonus: 20 Credits`,
      );
    } catch (err) {
      // Wallet provisioning must never break login.
      // Log the error and continue — the token is still issued.
      this.logger.error(
        `Failed to provision wallet for admin ${email}: ${(err as Error).message}`,
      );
    }
  }
}

