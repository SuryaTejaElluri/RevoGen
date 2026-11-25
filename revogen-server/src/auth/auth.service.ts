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
import { ROLES, SELF_SIGNUP_ROLES } from '../common/roles';
import { provisionRecruiterWallet } from '../common/wallet';
import {
  linkPendingCodingInvitations,
  normalizeEmail,
} from '../common/invitations';
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
    // Store emails normalised so invitations and logins match regardless of case.
    dto.email = normalizeEmail(dto.email);
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
  // Only Candidate or Recruiter can be chosen at sign-up — never super admin.
  role: SELF_SIGNUP_ROLES.includes(dto.role ?? '') ? dto.role : ROLES.CANDIDATE,

  verificationToken,
  verificationTokenExpires,
});

this.logger.log(
  `Registered user: ${dto.email} | role: ${user.role}`,
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

    if (user.role === ROLES.SUSPENDED) {
      throw new UnauthorizedException('This account has been suspended. Contact support.');
    }

      if (!user.isVerified) {
  throw new UnauthorizedException(
    'Please verify your email before logging in.',
  );
}


    // Attach coding-test invitations sent before this account existed.
    try {
      const linked = await linkPendingCodingInvitations(this.prisma, user.id, user.email);
      if (linked) this.logger.log(`Linked ${linked} pending coding invitation(s) to ${user.email}`);
    } catch (err) {
      this.logger.error(`Failed to link pending invitations for ${user.email}: ${(err as Error).message}`);
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
      const created = await provisionRecruiterWallet(this.prisma, userId);
      if (!created) return; // wallet already provisioned — nothing to do
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


  async forgotPassword(email: string) {
    // Always return success — never reveal whether email exists
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: resetToken,
          resetPasswordExpires: resetExpires,
        },
      });

      this.mailService
        .sendResetPasswordEmail(
          user.email,
          user.name,
          `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`,
        )
        .catch((err) => {
          this.logger.error(`Failed to send reset email to ${email}: ${err.message}`);
        });
    }

    return {
      success: true,
      message: 'If an account exists with that email, a password reset link has been sent.',
    };
  }

  async validateResetToken(token: string) {
    const user = await this.prisma.user.findFirst({
      where: { resetPasswordToken: token },
    });

    if (!user || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      return { valid: false };
    }

    return { valid: true };
  }

  async resetPassword(token: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: { resetPasswordToken: token },
    });

    if (!user || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      throw new BadRequestException('Invalid or expired reset token.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return {
      success: true,
      message: 'Password updated successfully.',
    };
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

