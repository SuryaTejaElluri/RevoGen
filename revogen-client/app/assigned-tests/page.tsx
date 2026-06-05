'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import Navbar from '@/components/Navbar';

export default function AssignedTestsPage() {
  const [tests, setTests] =
    useState<any[]>([]);

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests =
    async () => {
      const token =
        localStorage.getItem(
          'access_token',
        );

      const response =
        await fetch(
          'http://localhost:3000/tests/assigned',
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );

      const data =
        await response.json();

      setTests(data);
    };

  return (
    <>
      <Navbar />

      <div
        style={{
          padding: '30px',
        }}
      >
        <h1>
          Assigned Tests
        </h1>

        <hr />
        {tests.length === 0 && (
  <p>
    No assigned tests available.
  </p>
)}
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
                mins
              </p>

              <Link
                href={`/tests/${test.id}`}
              >
                <button>
                  Start Test
                </button>
              </Link>
            </div>
          ),
        )}
      </div>
    </>
  );
}