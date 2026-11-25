import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ROLE_LABEL, ROLES } from '../common/roles';
import { provisionRecruiterWallet } from '../common/wallet';
import { AdjustCreditsDto, ListUsersQueryDto } from './dto';

/** Everything about a user that is safe to send to the browser (never the password or tokens). */
const SAFE_USER = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  isVerified: true,
  provider: true,
  createdAt: true,
  updatedAt: true,
} as const;

export interface Actor {
  userId: string;
  email: string;
}

@Injectable()
export class SuperAdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(q: ListUsersQueryDto) {
    const page = q.page ?? 1;
    const pageSize = q.pageSize ?? 20;
    const search = q.search?.trim();

    const where: Prisma.UserWhereInput = {
      ...(q.role ? { role: q.role } : {}),
      ...(q.verified ? { isVerified: q.verified === 'verified' } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const orderBy: Prisma.UserOrderByWithRelationInput =
      q.sort === 'oldest' ? { createdAt: 'asc' } : q.sort === 'name' ? { name: 'asc' } : { createdAt: 'desc' };

    const [total, rows, byRole] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          ...SAFE_USER,
          adminCredits: { select: { balance: true } },
          _count: { select: { attempts: true, codingAttempts: true, tests: true, codingTests: true, resumes: true } },
        },
      }),
      this.prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
    ]);

    return {
      total,
      page,
      pageSize,
      pages: Math.max(1, Math.ceil(total / pageSize)),
      roleCounts: Object.fromEntries(byRole.map((r) => [r.role, r._count._all])),
      items: rows.map(({ adminCredits, _count, ...u }) => ({
        ...u,
        roleLabel: ROLE_LABEL[u.role] ?? u.role,
        credits: adminCredits?.balance ?? null,
        counts: _count,
      })),
    };
  }

  async detail(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        ...SAFE_USER,
        profile: true,
        adminCredits: { select: { balance: true, updatedAt: true } },
        _count: { select: { attempts: true, codingAttempts: true, tests: true, codingTests: true, resumes: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const [attempts, codingAttempts, tests, codingTests, transactions] = await Promise.all([
      this.prisma.attempt.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, score: true, totalQuestions: true, percentage: true, createdAt: true, test: { select: { title: true, isPractice: true } } },
      }),
      this.prisma.codingAttempt.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, status: true, percentage: true, riskLevel: true, createdAt: true, codingTest: { select: { title: true } } },
      }),
      this.prisma.test.findMany({
        where: { createdById: id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, title: true, isPractice: true, createdAt: true, _count: { select: { attempts: true, invitations: true } } },
      }),
      this.prisma.codingTest.findMany({
        where: { createdById: id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, title: true, createdAt: true, _count: { select: { attempts: true, invitations: true } } },
      }),
      this.prisma.creditTransaction.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        take: 15,
        select: { id: true, type: true, credits: true, balanceAfter: true, description: true, createdAt: true },
      }),
    ]);

    const { adminCredits, _count, ...rest } = user;
    return {
      ...rest,
      roleLabel: ROLE_LABEL[rest.role] ?? rest.role,
      credits: adminCredits?.balance ?? null,
      counts: _count,
      attempts,
      codingAttempts,
      tests,
      codingTests,
      transactions,
    };
  }

  private async load(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: SAFE_USER });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private async assertAnotherSuperAdmin(exceptId: string) {
    const others = await this.prisma.user.count({ where: { role: ROLES.SUPER_ADMIN, NOT: { id: exceptId } } });
    if (!others) throw new BadRequestException('There must always be at least one super admin.');
  }

  async updateRole(actor: Actor, id: string, role: string) {
    if (id === actor.userId) throw new BadRequestException("You can't change your own role.");
    const user = await this.load(id);
    if (user.role === ROLES.SUSPENDED) {
      throw new BadRequestException('This account is suspended. Reactivate it and choose a role there.');
    }
    if (user.role === role) return { ...user, roleLabel: ROLE_LABEL[role] };
    if (user.role === ROLES.SUPER_ADMIN) await this.assertAnotherSuperAdmin(id);

    const updated = await this.prisma.user.update({ where: { id }, data: { role }, select: SAFE_USER });
    if (role === ROLES.RECRUITER) await provisionRecruiterWallet(this.prisma, id, 'Promoted to recruiter');
    return { ...updated, roleLabel: ROLE_LABEL[role] };
  }

  async setSuspended(actor: Actor, id: string, suspended: boolean, restoreRole?: string) {
    if (id === actor.userId) throw new BadRequestException("You can't suspend your own account.");
    const user = await this.load(id);

    if (suspended) {
      if (user.role === ROLES.SUSPENDED) return { ...user, roleLabel: ROLE_LABEL[user.role] };
      if (user.role === ROLES.SUPER_ADMIN) {
        throw new BadRequestException('Change this super admin to another role before suspending them.');
      }
      const updated = await this.prisma.user.update({ where: { id }, data: { role: ROLES.SUSPENDED }, select: SAFE_USER });
      return { ...updated, roleLabel: ROLE_LABEL[ROLES.SUSPENDED] };
    }

    if (user.role !== ROLES.SUSPENDED) throw new BadRequestException('This account is not suspended.');
    const role = restoreRole ?? ROLES.CANDIDATE;
    const updated = await this.prisma.user.update({ where: { id }, data: { role }, select: SAFE_USER });
    if (role === ROLES.RECRUITER) await provisionRecruiterWallet(this.prisma, id, 'Reactivated as recruiter');
    return { ...updated, roleLabel: ROLE_LABEL[role] };
  }

  async verifyEmail(id: string) {
    const user = await this.load(id);
    if (user.isVerified) return user;
    return this.prisma.user.update({
      where: { id },
      data: { isVerified: true, verificationToken: null, verificationTokenExpires: null },
      select: SAFE_USER,
    });
  }

  /** Add or remove Revo Credits with a reason; the balance can never go below 0. */
  async adjustCredits(actor: Actor, id: string, dto: AdjustCreditsDto) {
    const user = await this.load(id);
    if (user.role !== ROLES.RECRUITER && user.role !== ROLES.SUPER_ADMIN) {
      throw new BadRequestException('Only recruiters have a credits wallet.');
    }
    await provisionRecruiterWallet(this.prisma, id, 'Created by super admin');

    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.adminCredits.findUniqueOrThrow({ where: { userId: id } });
      const balance = wallet.balance + dto.delta;
      if (balance < 0) {
        throw new BadRequestException(`Can't remove ${-dto.delta} credits — the balance is only ${wallet.balance}.`);
      }
      await tx.adminCredits.update({ where: { userId: id }, data: { balance } });
      const transaction = await tx.creditTransaction.create({
        data: {
          userId: id,
          type: 'ADMIN',
          credits: dto.delta,
          balanceAfter: balance,
          description: dto.reason.trim(),
          metadata: { by: actor.email, source: 'Super admin' },
        },
      });
      return { balance, transaction };
    });
  }

  /**
   * Permanently delete an account. Refused for yourself, super admins, and anyone
   * who owns tests (their candidates' results would be orphaned) — suspend instead.
   * Their own attempts, resumes and wallet are removed with them.
   */
  async remove(actor: Actor, id: string, confirmEmail: string) {
    if (id === actor.userId) throw new BadRequestException("You can't delete your own account.");
    const user = await this.load(id);
    if (user.role === ROLES.SUPER_ADMIN) throw new BadRequestException('Change this super admin to another role before deleting them.');
    if ((confirmEmail ?? '').trim().toLowerCase() !== user.email.toLowerCase()) {
      throw new BadRequestException("The email you typed doesn't match this account.");
    }
    const [tests, codingTests] = await Promise.all([
      this.prisma.test.count({ where: { createdById: id } }),
      this.prisma.codingTest.count({ where: { createdById: id } }),
    ]);
    if (tests + codingTests > 0) {
      throw new ConflictException(
        `This recruiter owns ${tests + codingTests} test${tests + codingTests === 1 ? '' : 's'}. Suspend the account instead so candidates' results are kept.`,
      );
    }
    await this.prisma.user.delete({ where: { id } });
    return { deleted: true, id };
  }
}
