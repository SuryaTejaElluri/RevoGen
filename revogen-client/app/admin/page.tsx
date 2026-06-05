'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';

import AdminNavbar from '@/components/AdminNavbar';

export default function AdminPage() {
  const [stats, setStats] =
    useState<any>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats =
    async () => {
      try {
        const token =
          localStorage.getItem(
            'access_token',
          );

        const response =
          await fetch(
            'http://localhost:3000/tests/dashboard/stats',
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          );

        const data =
          await response.json();

        setStats(data);
      } catch (error) {
        console.error(error);
      }
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
          Admin Dashboard
        </h1>

        <hr />

        {stats && (
          <div
            style={{
              display: 'flex',
              gap: '20px',
              marginTop: '20px',
              marginBottom: '30px',
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                border:
                  '1px solid gray',
                padding: '20px',
                minWidth: '200px',
              }}
            >
              <h2>
                Total Tests
              </h2>

              <h1>
                {
                  stats.totalTests
                }
              </h1>
            </div>

            <div
              style={{
                border:
                  '1px solid gray',
                padding: '20px',
                minWidth: '200px',
              }}
            >
              <h2>
                Candidates
              </h2>

              <h1>
                {
                  stats.totalCandidates
                }
              </h1>
            </div>

            <div
              style={{
                border:
                  '1px solid gray',
                padding: '20px',
                minWidth: '200px',
              }}
            >
              <h2>
                Attempts
              </h2>

              <h1>
                {
                  stats.totalAttempts
                }
              </h1>
            </div>
          </div>
        )}

        <div
  style={{
    border: '1px solid gray',
    padding: '20px',
    minWidth: '200px',
  }}
>
  <h2>
    Average Score
  </h2>

  <h1>
    {stats?.averageScore}%
  </h1>
</div>

<div
  style={{
    border: '1px solid gray',
    padding: '20px',
    minWidth: '200px',
  }}
>
  <h2>
    Completion Rate
  </h2>

  <h1>
    {stats?.completionRate}%
  </h1>
</div>

<div
  style={{
    border: '1px solid gray',
    padding: '20px',
    minWidth: '200px',
  }}
>
  <h2>
    Pending Invites
  </h2>

  <h1>
    {stats?.pendingInvitations}
  </h1>
</div>

<div
  style={{
    border: '1px solid gray',
    padding: '20px',
    minWidth: '200px',
  }}
>
  <h2>
    Completed Invites
  </h2>

  <h1>
   {stats?.completedInvitations}
  </h1>
</div>

        <div
          style={{
            display: 'flex',
            gap: '20px',
            marginTop: '20px',
            flexWrap: 'wrap',
          }}
        >
          <Link href="/admin/questions">
            <div
              style={{
                border:
                  '1px solid gray',
                padding:
                  '20px',
                cursor:
                  'pointer',
                width:
                  '250px',
              }}
            >
              <h2>
                Question Bank
              </h2>

              <p>
                Manage Questions
              </p>
            </div>
          </Link>

          <Link href="/admin/tests">
            <div
              style={{
                border:
                  '1px solid gray',
                padding:
                  '20px',
                cursor:
                  'pointer',
                width:
                  '250px',
              }}
            >
              <h2>
                Tests
              </h2>

              <p>
                Create & Manage
                Tests
              </p>
            </div>
          </Link>

          <Link href="/admin/users">
            <div
              style={{
                border:
                  '1px solid gray',
                padding:
                  '20px',
                cursor:
                  'pointer',
                width:
                  '250px',
              }}
            >
              <h2>
                Users
              </h2>

              <p>
                Manage Users
              </p>
            </div>
          </Link>
        </div>
      </div>
    </>
  );
}