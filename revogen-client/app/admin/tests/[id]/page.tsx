'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AdminNavbar from '@/components/AdminNavbar';

export default function TestDetailsPage() {
  const params = useParams();

  const id = params.id as string;

  const [test, setTest] =
    useState<any>(null);

  useEffect(() => {
    loadTest();
  }, []);

  const loadTest =
    async () => {
      const token =
        localStorage.getItem(
          'access_token',
        );

      const response =
        await fetch(
          `http://localhost:3000/tests/${id}`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );

      const data =
        await response.json();

      setTest(data);
    };

  if (!test) {
    return (
      <>
        <AdminNavbar />
        <h1>
          Loading Test...
        </h1>
      </>
    );
  }

  return (
  <>
    <AdminNavbar />

    <div
      style={{
        padding: '30px',
      }}
    >
      <h1>
        {test.title}
      </h1>

      <p>
        Category: {test.category}
      </p>

      <p>
        Duration: {test.duration} mins
      </p>

      <p>
        Total Questions:
        {' '}
        {test.questions?.length}
      </p>

      <Link
        href={`/admin/tests/${id}/invite`}
      >
        <button
          style={{
            marginTop: '10px',
            marginBottom: '20px',
          }}
        >
          Assign Test
        </button>
      </Link>

      <hr />

      <h2>
        Questions
      </h2>

      {test.questions?.map(
        (
          question: any,
          index: number,
        ) => (
          <div
            key={question.id}
            style={{
              border:
                '1px solid #ccc',
              padding: '15px',
              marginTop: '10px',
            }}
          >
            <h3>
              Q{index + 1}.{' '}
              {question.question}
            </h3>

            <p>
              A. {question.optionA}
            </p>

            <p>
              B. {question.optionB}
            </p>

            <p>
              C. {question.optionC}
            </p>

            <p>
              D. {question.optionD}
            </p>

            <p>
              Correct:{' '}
              {question.correctAnswer}
            </p>
          </div>
        ),
      )}
    </div>
  </>
);
}