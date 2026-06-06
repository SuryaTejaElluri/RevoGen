'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ProAdminNavbar() {
  const router = useRouter();

  const logout = () => {
    localStorage.removeItem(
      'access_token',
    );

    router.push('/login');
  };

  return (
    <nav
      style={{
        background: '#000',
        padding: '20px',
        display: 'flex',
        gap: '20px',
      }}
    >
      <Link href="/pro-admin">
        Dashboard
      </Link>

      <Link href="/pro-admin/users">
        Users
      </Link>

      <Link href="/pro-admin/questions">
        Question Bank
      </Link>

      <Link href="/pro-admin/analytics">
        Analytics
      </Link>

      <button
        onClick={logout}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'white',
        }}
      >
        Logout
      </button>
    </nav>
  );
}