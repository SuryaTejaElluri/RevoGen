'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import AdminNavbar from '@/components/AdminNavbar';

export default function TestsPage() {
  const [tests, setTests] =
    useState<any[]>([]);

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests =
    async () => {
      try {
        const response =
          await fetch(
            'http://localhost:3000/tests',
          );

        const data =
          await response.json();

        setTests(data);
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
          Test Management
        </h1>

        <hr />

        <br />

        <Link
          href="/admin/tests/new"
        >
          <button>
            Create Test
          </button>
        </Link>

        <br />
        <br />

        {tests.map(
  (test: any) => (
    <div
      key={test.id}
      style={{
        border:
          '1px solid #ccc',
        padding: '20px',
        marginTop: '10px',
      }}
    >
      <h2>
        {test.title}
      </h2>

      <p>
        Category:
        {' '}
        {test.category}
      </p>

      <p>
        Duration:
        {' '}
        {test.duration}
        {' '}
        mins
      </p>

      <div
        style={{
          display: 'flex',
          gap: '10px',
          marginTop: '10px',
        }}
      >
        <Link
          href={`/admin/tests/${test.id}`}
        >
          <button>
            View Test
          </button>
        </Link>

        <Link
          href={`/admin/tests/${test.id}/questions`}
        >
          <button>
            Manage Questions
          </button>
        </Link>

        <Link
  href={`/admin/tests/${test.id}/results`}
>
  <button
    style={{
      marginLeft: '10px',
    }}
  >
    View Results
  </button>
</Link>

        <Link
          href={`/admin/tests/${test.id}/invite`}
        >
          <button>
            Assign Test
          </button>
        </Link>
      </div>
    </div>
  ),
)}
      </div>
    </>
  );
}