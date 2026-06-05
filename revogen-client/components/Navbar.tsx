'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Navbar() {
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
        padding: '15px',
        borderBottom:
          '1px solid #ccc',
        display: 'flex',
        gap: '20px',
      }}
    >
      <Link href="/">
        Home
      </Link>

      <Link href="/dashboard">
        Dashboard
      </Link>

      <Link href="/resumes">
        Resumes
      </Link>
      <Link href="/assigned-tests">
      Assigned Tests
      </Link>
      <Link href="/tests">
        Tests
      </Link>
      <Link href="/my-results">
  My Results
</Link>


      <button onClick={logout}>
        Logout
      </button>
    </nav>
  );
}