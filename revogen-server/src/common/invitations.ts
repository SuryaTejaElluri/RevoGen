import { PrismaService } from '../prisma/prisma.service';

/** Emails are compared trimmed and lower-cased everywhere ("Priya@Gmail.com " === "priya@gmail.com"). */
export function normalizeEmail(email: string | null | undefined): string {
  return (email ?? '').trim().toLowerCase();
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email);
}

/**
 * Attach coding-test invitations that were sent before the candidate had an
 * account. Invitations to unknown emails are stored with userId = null
 * ("pending"); once someone with that email exists we fill in their userId so
 * the test shows up under Assigned tests and they can start it.
 *
 * Only fills in a missing userId — never changes status, credits or anything
 * already linked — so it is safe to call on every login / page load.
 * Returns how many invitations were linked.
 */
export async function linkPendingCodingInvitations(
  prisma: PrismaService,
  userId: string,
  email?: string | null,
): Promise<number> {
  let address = normalizeEmail(email);
  if (!address) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    address = normalizeEmail(user?.email);
  }
  if (!address) return 0;

  const { count } = await prisma.codingInvitation.updateMany({
    where: {
      userId: null,
      candidateEmail: { equals: address, mode: 'insensitive' },
    },
    data: { userId },
  });
  return count;
}
