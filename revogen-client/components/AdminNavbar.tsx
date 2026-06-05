'use client';

import Link from 'next/link';

export default function AdminNavbar() {
  return (
    <nav
      style={{
        padding: '20px',
        borderBottom:
          '1px solid #ccc',
        display: 'flex',
        gap: '20px',
      }}
    >
      <Link href="/admin">
        Dashboard
      </Link>

      <Link href="/admin/questions">
        Question Bank
      </Link>

      <Link href="/admin/tests">
        Tests
      </Link>

      <Link href="/admin/users">
        Users
      </Link>

      

      <button
        onClick={() => {
          localStorage.removeItem(
            'access_token',
          );

          window.location.href =
            '/login';
        }}
      >
        Logout
      </button>
    </nav>
  );
}