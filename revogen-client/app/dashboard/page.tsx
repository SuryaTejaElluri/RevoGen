'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
export default function DashboardPage() {
  const router = useRouter();

  const [dashboard, setDashboard] =
    useState<any>(null);

  useEffect(() => {
    const token =
      localStorage.getItem(
        'access_token',
      );

    if (!token) {
      router.push('/login');
      return;
    }

    fetch(
      'http://localhost:3000/dashboard',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )
      .then(async (res) => {
        const data =
          await res.json();

        if (!res.ok) {
          localStorage.removeItem(
            'access_token',
          );

          router.push('/login');
          return;
        }

        setDashboard(data);
      })
      .catch((err) => {
        console.error(err);
      });
  }, [router]);

  if (
    !dashboard ||
    !dashboard.recentAttempts
  ) {
    return <h1>Loading...</h1>;
  }

  return (
    <>
  <Navbar />

  <div
    style={{
      padding: '30px',
    }}
  ></div>
    <div
      style={{
        padding: '30px',
      }}
    >
      <h1>Dashboard</h1>

      <hr />

      <h2>
        ATS Score:{' '}
        {dashboard.atsScore}
      </h2>

      <h2>
        Tests Taken:{' '}
        {dashboard.testsTaken}
      </h2>

      <h2>
        Average Score:{' '}
        {dashboard.averageScore}%
      </h2>

      <h2>
        Tab Violations:{' '}
        {
          dashboard.totalTabSwitches
        }
      </h2>

      <h2>
        Fullscreen Violations:{' '}
        {
          dashboard
            .totalFullscreenViolations
        }
      </h2>

      <hr />

      <h2>Recent Attempts</h2>

      {dashboard.recentAttempts
        .length === 0 && (
        <p>
          No attempts found.
        </p>
      )}

      {dashboard.recentAttempts.map(
        (
          attempt: any,
          index: number,
        ) => (
          <div
            key={index}
            style={{
              border:
                '1px solid #ccc',
              padding: '15px',
              marginTop: '10px',
              borderRadius: '8px',
            }}
          >
            <h3>
              {attempt.test?.title ||
                'Unknown Test'}
            </h3>

            <p>
              Score:{' '}
              {attempt.score}/
              {
                attempt.totalQuestions
              }
            </p>

            <p>
              Percentage:{' '}
              {
                attempt.percentage
              }
              %
            </p>

            <p>
              Tab Switches:{' '}
              {
                attempt.tabSwitches
              }
            </p>

            <p>
              Fullscreen
              Violations:{' '}
              {
                attempt.fullscreenViolations
              }
            </p>

            <p>
              Date:{' '}
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