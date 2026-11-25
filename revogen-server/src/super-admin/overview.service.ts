import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ROLE_LABEL, ROLES } from '../common/roles';

const DAY = 24 * 60 * 60 * 1000;
const dayKey = (d: Date) => d.toISOString().slice(0, 10);

@Injectable()
export class SuperAdminOverviewService {
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    const now = Date.now();
    const since14 = new Date(now - 13 * DAY);
    since14.setUTCHours(0, 0, 0, 0);
    const since7 = new Date(now - 7 * DAY);
    const since30 = new Date(now - 30 * DAY);

    const [
      byRole, unverified, new7, new30, recentSignups, recentUsers,
      mcqCount, mcqByCategory, codingByDifficulty,
      mcqTests, practiceTests, codingTests,
      mcqAttempts, codingAttempts, attempts7, codingAttempts7,
      wallets, practice,
    ] = await Promise.all([
      this.prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
      this.prisma.user.count({ where: { isVerified: false } }),
      this.prisma.user.count({ where: { createdAt: { gte: since7 } } }),
      this.prisma.user.count({ where: { createdAt: { gte: since30 } } }),
      this.prisma.user.findMany({ where: { createdAt: { gte: since14 } }, select: { createdAt: true } }),
      this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: { id: true, name: true, email: true, role: true, isVerified: true, createdAt: true },
      }),
      this.prisma.questionBank.count(),
      this.prisma.questionBank.groupBy({ by: ['category'], _count: { _all: true } }),
      this.prisma.codingQuestionBank.groupBy({ by: ['difficulty'], _count: { _all: true } }),
      this.prisma.test.count({ where: { isPractice: false } }),
      this.prisma.test.count({ where: { isPractice: true } }),
      this.prisma.codingTest.count(),
      this.prisma.attempt.count(),
      this.prisma.codingAttempt.count(),
      this.prisma.attempt.count({ where: { createdAt: { gte: since7 } } }),
      this.prisma.codingAttempt.count({ where: { createdAt: { gte: since7 } } }),
      this.prisma.adminCredits.aggregate({ _sum: { balance: true }, _count: { _all: true } }),
      this.prisma.test.findMany({
        where: { isPractice: true },
        orderBy: { title: 'asc' },
        select: { id: true, title: true, modules: { select: { module: true, questionCount: true } } },
      }),
    ]);

    const roles = Object.fromEntries(byRole.map((r) => [r.role, r._count._all]));
    const totalUsers = byRole.reduce((n, r) => n + r._count._all, 0);

    // Signups per day for the last 14 days (UTC), zero-filled.
    const perDay = new Map<string, number>();
    for (let i = 0; i < 14; i++) perDay.set(dayKey(new Date(since14.getTime() + i * DAY)), 0);
    recentSignups.forEach((u) => {
      const k = dayKey(u.createdAt);
      if (perDay.has(k)) perDay.set(k, (perDay.get(k) ?? 0) + 1);
    });

    // MCQ bank per category (case-insensitive), used for practice coverage.
    const bank = new Map<string, { category: string; count: number }>();
    mcqByCategory.forEach((c) => {
      const k = c.category.trim().toLowerCase();
      const m = bank.get(k);
      if (m) m.count += c._count._all;
      else bank.set(k, { category: c.category.trim(), count: c._count._all });
    });

    const coverage = practice.map((t) => {
      const subjects = t.modules.map((m) => {
        const available = bank.get(m.module.trim().toLowerCase())?.count ?? 0;
        return { module: m.module, needed: m.questionCount, available, ok: available >= m.questionCount };
      });
      return { id: t.id, title: t.title, subjects, ready: subjects.every((s) => s.ok) };
    });

    const codingTotal = codingByDifficulty.reduce((n, d) => n + d._count._all, 0);

    return {
      users: {
        total: totalUsers,
        candidates: roles[ROLES.CANDIDATE] ?? 0,
        recruiters: roles[ROLES.RECRUITER] ?? 0,
        superAdmins: roles[ROLES.SUPER_ADMIN] ?? 0,
        suspended: roles[ROLES.SUSPENDED] ?? 0,
        unverified,
        new7,
        new30,
      },
      signups: [...perDay.entries()].map(([date, count]) => ({ date, count })),
      recentUsers: recentUsers.map((u) => ({ ...u, roleLabel: ROLE_LABEL[u.role] ?? u.role })),
      content: {
        mcqQuestions: mcqCount,
        mcqCategories: [...bank.values()].sort((a, b) => b.count - a.count),
        codingQuestions: codingTotal,
        codingByDifficulty: Object.fromEntries(codingByDifficulty.map((d) => [d.difficulty, d._count._all])),
        mcqTests,
        practiceTests,
        codingTests,
      },
      activity: { mcqAttempts, codingAttempts, attempts7: attempts7 + codingAttempts7 },
      credits: { wallets: wallets._count._all, outstanding: wallets._sum.balance ?? 0 },
      coverage,
    };
  }
}
