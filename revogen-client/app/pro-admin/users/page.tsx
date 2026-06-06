'use client';

import { useEffect, useState } from 'react';
import ProAdminNavbar from '@/components/ProAdminNavbar';

export default function ProAdminUsersPage() {
  const [users, setUsers] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
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
        console.log(data);
      setUsers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }

    
 };

 const updateRole = async (
  userId: string,
  role: string,
) => {
  try {
    const token =
      localStorage.getItem(
        'access_token',
      );

    await fetch(
      `http://localhost:3000/users/${userId}/role`,
      {
        method: 'PATCH',

        headers: {
          'Content-Type':
            'application/json',

          Authorization:
            `Bearer ${token}`,
        },

        body: JSON.stringify({
          role,
        }),
      },
    );

    loadUsers();
  } catch (error) {
    console.error(error);
  }
};

  const deleteUser = async (
  userId: string,
) => {
  const confirmed =
    confirm(
      'Delete this user?',
    );

  if (!confirmed) {
    return;
  }

  try {
    const token =
      localStorage.getItem(
        'access_token',
      );

    await fetch(
      `http://localhost:3000/users/${userId}`,
      {
        method: 'DELETE',

        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      },
    );

    loadUsers();
  } catch (error) {
    console.error(error);
  }
};

  return (
    <>
      <ProAdminNavbar />

      <div
        style={{
          padding: '30px',
        }}
      >
        <h1>
          User Management
        </h1>

        <hr />

        <br />

        {loading ? (
          <p>
            Loading...
          </p>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              style={{
                border:
                  '1px solid #ddd',
                borderRadius:
                  '10px',
                padding: '15px',
                marginBottom:
                  '10px',
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
                <strong>
                  {user.role}
                </strong>
              </p>
              <div
  style={{
    display: 'flex',
    gap: '10px',
    marginTop: '10px',
  }}
>
  {user.role ===
    'USER' && (
    <button
      onClick={() =>
        updateRole(
          user.id,
          'ADMIN',
        )
      }
    >
      Make Admin
    </button>
  )}

  {user.role ===
    'ADMIN' && (
    <button
      onClick={() =>
        updateRole(
          user.id,
          'USER',
        )
      }
    >
      Make User
    </button>
  )}

  {user.role !==
    'SUPER_ADMIN' && (
    <button
      onClick={() =>
        deleteUser(
          user.id,
        )
      }
    >
      Delete
    </button>
  )}
</div>
            </div>
          ))
        )}
      </div>
    </>
  );
}