'use client';

import { useEffect, useState } from 'react';

import Navbar from '@/components/Navbar';

export default function MyResultsPage() {
  const [attempts, setAttempts] =
    useState<any[]>([]);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults =
    async () => {
      const token =
        localStorage.getItem(
          'access_token',
        );

      const response =
        await fetch(
          'http://localhost:3000/tests/my-attempts',
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );

      const data =
        await response.json();

      setAttempts(data);
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
          My Results
        </h1>

        <hr />

        {attempts.length === 0 && (
          <p>
            No attempts found.
          </p>
        )}

        {attempts.map(
          (attempt: any) => (
            <div
              key={attempt.id}
              style={{
                border:
                  '1px solid #ccc',
                padding: '20px',
                marginTop: '10px',
              }}
            >
              <h2>
                {
                  attempt.test
                    ?.title
                }
              </h2>

              <p>
                Score:
                {' '}
                {attempt.score}
                /
                {
                  attempt.totalQuestions
                }
              </p>

              <p>
                Percentage:
                {' '}
                {
                  attempt.percentage
                }
                %
              </p>

              <p>
                Tab Switches:
                {' '}
                {
                  attempt.tabSwitches
                }
              </p>

              <p>
                Fullscreen Violations:
                {' '}
                {
                  attempt.fullscreenViolations
                }
              </p>

              <p>
                Attempted On:
                {' '}
                {new Date(
                  attempt.createdAt,
                ).toLocaleString()}
              </p>
            </div>
          ),
        )}
      </div>
    </>
  );
}