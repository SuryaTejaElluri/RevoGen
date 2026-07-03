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
import * as crypto from 'crypto';
import { UnauthorizedException } from '@nestjs/common';
import { MailService } from '../mail/mail.service';
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private readonly mailService: MailService,
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
    const verificationToken = crypto.randomBytes(32).toString('hex');

const verificationTokenExpires = new Date(
  Date.now() + 24 * 60 * 60 * 1000, // 24 hours
);
    const user = await this.usersService.create({
  name: dto.name,
  email: dto.email,
  password: hashedPassword,
  phone: dto.phone,
  role: dto.role ?? 'USER',

  verificationToken,
  verificationTokenExpires,
});

this.logger.log(
  `Registered user: ${dto.email} | role: ${dto.role ?? 'USER'}`,
);

const { password, ...safeUser } = user;

// Send verification email in the background
console.log("📧 Sending verification email to:", user.email);

this.mailService
  .sendVerificationEmail(
    user.email,
    user.name,
    `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`,
  )
  .then(() => {
    console.log("✅ Verification email sent");
  })
  .catch((err) => {
    console.error("❌ Verification email failed");
    console.error(err);
  });

    return {
  message:
    'Registration successful. Please check your email to verify your account.',
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

      if (!user.isVerified) {
  throw new UnauthorizedException(
    'Please verify your email before logging in.',
  );
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


  async verifyEmail(token: string) {

  const user = await this.prisma.user.findFirst({
    where: {
      verificationToken: token,
    },
  });

  if (!user) {
    throw new BadRequestException(
      'Invalid verification link.',
    );
  }

  if (
    !user.verificationTokenExpires ||
    user.verificationTokenExpires < new Date()
  ) {
    throw new BadRequestException(
      'Verification link has expired.',
    );
  }

  await this.prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      isVerified: true,
      verificationToken: null,
      verificationTokenExpires: null,
    },
  });

  return {
    success: true,
    message: 'Email verified successfully.',
  };
}
}

