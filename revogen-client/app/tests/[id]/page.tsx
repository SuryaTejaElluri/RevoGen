'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function TestInstructionsPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [test, setTest] =
    useState<any>(null);

  useEffect(() => {
    loadTest();
  }, []);

  const loadTest =
    async () => {
      try {
        const response =
          await fetch(
            `http://localhost:3000/tests/${id}`,
          );

        const data =
          await response.json();

        setTest(data);
      } catch (error) {
        console.error(error);
      }
    };

  if (!test) {
    return (
      <div
        style={{
          padding: '40px',
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f8fafc',
        padding: '40px',
      }}
    >
      <div
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          background: 'white',
          padding: '40px',
          borderRadius: '16px',
          boxShadow:
            '0 10px 25px rgba(0,0,0,0.08)',
        }}
      >
        <h1>
          {test.title}
        </h1>

        <p
          style={{
            color: '#64748b',
            marginTop: '10px',
          }}
        >
          Please read the instructions
          carefully before starting.
        </p>

        <hr
          style={{
            margin: '25px 0',
          }}
        />

        <h3>
          Assessment Details
        </h3>

        <p>
          Duration:
          {' '}
          {test.duration}
          {' '}
          Minutes
        </p>

        <p>
          Questions:
          {' '}
          {
            test.questions?.length
          }
        </p>

        <br />

        <h3>
          Instructions
        </h3>

        <ul
          style={{
            lineHeight: '2',
          }}
        >
          <li>
            Fullscreen mode is
            mandatory.
          </li>

          <li>
            Do not switch tabs or
            windows.
          </li>

          <li>
            Copy/Paste is disabled.
          </li>

          <li>
            Right click is disabled.
          </li>

          <li>
            The assessment will
            auto-submit when time
            expires.
          </li>

          <li>
            Multiple security
            violations may
            terminate the exam.
          </li>
        </ul>

        <div
          style={{
            marginTop: '30px',
          }}
        >
          <button
            onClick={() =>
              router.push(
                `/tests/${id}/exam`,
              )
            }
            style={{
              padding:
                '12px 24px',
              background:
                '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius:
                '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Start Assessment
          </button>
        </div>
      </div>
    </div>
  );
}