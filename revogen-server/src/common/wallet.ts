import { PrismaService } from '../prisma/prisma.service';

export const WELCOME_CREDITS = 20;

/**
 * Give a recruiter their Revo Credits wallet with the welcome bonus.
 * Idempotent: returns false when the wallet already exists.
 */
export async function provisionRecruiterWallet(
  prisma: PrismaService,
  userId: string,
  reason = 'First Login',
): Promise<boolean> {
  const existing = await prisma.adminCredits.findUnique({ where: { userId } });
  if (existing) return false;

  await prisma.$transaction(async (tx) => {
    await tx.adminCredits.create({ data: { userId, balance: WELCOME_CREDITS } });
    await tx.creditTransaction.create({
      data: {
        userId,
        type: 'BONUS',
        credits: WELCOME_CREDITS,
        balanceAfter: WELCOME_CREDITS,
        description: 'Welcome Bonus',
        referenceId: null,
        metadata: { reason, source: 'System' },
      },
    });
  });
  return true;
}
