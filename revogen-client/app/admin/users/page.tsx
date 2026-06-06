'use client';

import { useEffect, useState } from 'react';

import AdminNavbar from '@/components/AdminNavbar';
import Link from 'next/link';
export default function UsersPage() {
  const [users, setUsers] =
    useState<any[]>([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers =
    async () => {
      const token =
        localStorage.getItem(
          'access_token',
        );

      const response =
        await fetch(
          'http://localhost:3000/users',
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );

      const data =
        await response.json();

      setUsers(data);
    };

  return (
    <>
      <AdminNavbar />

      <div
        style={{
          padding: '30px',
        }}
      >
        <h1>
          Users
        </h1>

        <hr />

        {users.map((user) => (
  <Link
    key={user.id}
    href={`/admin/users/${user.id}`}
    style={{
      textDecoration: 'none',
    }}
  >
    <div
      style={{
        border: '1px solid #334155',
        background: '#1e293b',
        borderRadius: '12px',
        padding: '20px',
        marginTop: '12px',
        cursor: 'pointer',
      }}
    >
      <h3
        style={{
          color: '#f8fafc',
        }}
      >
        {user.name}
      </h3>

      <p
        style={{
          color: '#94a3b8',
        }}
      >
        {user.email}
      </p>

      <p
        style={{
          color: '#cbd5e1',
        }}
      >
        Role: {user.role}
      </p>
    </div>
  </Link>
))}
      </div>
    </>
  );
}