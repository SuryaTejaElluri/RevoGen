'use client';

import { useEffect, useState } from 'react';

import AdminNavbar from '@/components/AdminNavbar';

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

        {users.map(
          (user) => (
            <div
              key={user.id}
              style={{
                border:
                  '1px solid #ccc',
                padding: '15px',
                marginTop: '10px',
              }}
            >
              <h3>
                {user.name}
              </h3>

              <p>
                {user.email}
              </p>

              <p>
                Role:
                {' '}
                {user.role}
              </p>
            </div>
          ),
        )}
      </div>
    </>
  );
}