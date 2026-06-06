'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import AdminNavbar from '@/components/AdminNavbar';

export default function CandidateProfilePage() {
  const params = useParams();

  const id =
    params.id as string;

  const [candidate, setCandidate] =
    useState<any>(null);

  useEffect(() => {
    loadCandidate();
  }, []);

  const loadCandidate =
    async () => {
      try {
        const token =
          localStorage.getItem(
            'access_token',
          );

        const response =
          await fetch(
            `http://localhost:3000/users/${id}/profile`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          );

        const data =
          await response.json();

        setCandidate(data);
      } catch (error) {
        console.error(error);
      }
    };

  if (!candidate) {
    return (
      <>
        <AdminNavbar />
        <div
          style={{
            padding: '30px',
          }}
        >
          Loading...
        </div>
      </>
    );
  }

  return (
    <>
      <AdminNavbar />

      <div
        style={{
          padding: '30px',
          background:
            '#0f172a',
          minHeight:
            '100vh',
          color: 'white',
        }}
      >
        <h1>
          {candidate.name}
        </h1>

        <p>
          {candidate.email}
        </p>

        <br />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(3,1fr)',
            gap: '20px',
          }}
        >
          <div
            style={{
              background:
                '#1e293b',
              padding:
                '20px',
              borderRadius:
                '12px',
            }}
          >
            <h3>
              ATS Score
            </h3>

            <h1>
              {
                candidate.atsScore
              }
            </h1>
          </div>

          <div
            style={{
              background:
                '#1e293b',
              padding:
                '20px',
              borderRadius:
                '12px',
            }}
          >
            <h3>
              Average Test
              Score
            </h3>

            <h1>
              {
                candidate.averageTestScore
              }
              %
            </h1>
          </div>

          <div
            style={{
              background:
                '#1e293b',
              padding:
                '20px',
              borderRadius:
                '12px',
            }}
          >
            <h3>
              Ranking
              Score
            </h3>

            <h1>
              {
                candidate.rankingScore
              }
            </h1>
          </div>
        </div>

        <br />

        <div
          style={{
            background:
              '#1e293b',
            padding:
              '20px',
            borderRadius:
              '12px',
          }}
        >
          <h2>
            Skills
          </h2>

          <pre>
            {JSON.stringify(
              candidate.skills,
              null,
              2,
            )}
          </pre>
        </div>

        <br />

        <div
          style={{
            background:
              '#1e293b',
            padding:
              '20px',
            borderRadius:
              '12px',
          }}
        >
          <h2>
            Missing Skills
          </h2>

          <pre>
            {JSON.stringify(
              candidate.missingSkills,
              null,
              2,
            )}
          </pre>
        </div>

        <br />

        <div
          style={{
            background:
              '#1e293b',
            padding:
              '20px',
            borderRadius:
              '12px',
          }}
        >
          <h2>
            Test History
          </h2>

          {candidate.attempts?.map(
            (
              attempt: any,
            ) => (
              <div
                key={
                  attempt.id
                }
                style={{
                  borderBottom:
                    '1px solid #334155',
                  padding:
                    '12px 0',
                }}
              >
                <strong>
                  {
                    attempt
                      .test
                      ?.title
                  }
                </strong>

                <div>
                  Score:
                  {' '}
                  {
                    attempt.percentage
                  }
                  %
                </div>
              </div>
            ),
          )}
        </div>
      </div>
    </>
  );
}