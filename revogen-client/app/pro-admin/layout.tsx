import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Shell from '@/components/super-admin/Shell';

export const metadata: Metadata = {
  title: 'Super admin · Revogen',
  robots: { index: false, follow: false },
};

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  return <Shell>{children}</Shell>;
}
