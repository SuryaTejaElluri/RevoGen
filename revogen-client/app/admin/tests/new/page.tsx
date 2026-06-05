'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import AdminNavbar from '@/components/AdminNavbar';

export default function CreateTestPage() {
  const router = useRouter();

  const [title, setTitle] =
    useState('');

  const [duration, setDuration] =
    useState(30);

  const [loading, setLoading] =
    useState(false);

  const [modules, setModules] =
    useState([
      {
        module: 'Java',
        questionCount: 0,
      },
      {
        module: 'Python',
        questionCount: 0,
      },
      {
        module: 'JavaScript',
        questionCount: 0,
      },
      {
        module: 'React',
        questionCount: 0,
      },
      {
        module: 'DBMS',
        questionCount: 0,
      },
      {
        module: 'SQL',
        questionCount: 0,
      },
      {
        module: 'DSA',
        questionCount: 0,
      },
      {
        module:
          'Operating Systems',
        questionCount: 0,
      },
      {
        module:
          'Computer Networks',
        questionCount: 0,
      },
      {
        module: 'Aptitude',
        questionCount: 0,
      },
    ]);

  const updateQuestionCount =
    (
      index: number,
      value: number,
    ) => {
      const updated = [
        ...modules,
      ];

      updated[index]
        .questionCount =
        value;

      setModules(updated);
    };

  const createTest =
    async () => {
      const selectedModules =
        modules.filter(
          (module) =>
            module.questionCount >
            0,
        );

      if (
        !title ||
        selectedModules.length ===
          0
      ) {
        alert(
          'Please enter title and select at least one module',
        );
        return;
      }

      try {
        setLoading(true);

        const token =
          localStorage.getItem(
            'access_token',
          );

        const response =
          await fetch(
            'http://localhost:3000/tests',
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',

                Authorization:
                  `Bearer ${token}`,
              },

              body: JSON.stringify({
                title,
                duration,
                modules:
                  selectedModules,
              }),
            },
          );

        const data =
          await response.json();

        if (!response.ok) {
          alert(
            data.message ||
              'Failed to create test',
          );

          return;
        }

        alert(
          'Test created successfully',
        );

        router.push(
          '/admin/tests',
        );
      } catch (error) {
        console.error(error);

        alert(
          'Something went wrong',
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <>
      <AdminNavbar />

      <div
        style={{
          padding: '30px',
          maxWidth: '700px',
        }}
      >
        <h1>
          Create Test
        </h1>

        <hr />

        <br />

        <input
          placeholder="Test Title"
          value={title}
          onChange={(e) =>
            setTitle(
              e.target.value,
            )
          }
          style={{
            width: '100%',
            padding: '10px',
          }}
        />

        <br />
        <br />

        <input
          type="number"
          value={duration}
          onChange={(e) =>
            setDuration(
              Number(
                e.target.value,
              ),
            )
          }
          style={{
            width: '100%',
            padding: '10px',
          }}
        />

        <br />
        <br />

        <h3>
          Modules &
          Question Counts
        </h3>

        {modules.map(
          (
            module,
            index,
          ) => (
            <div
              key={
                module.module
              }
              style={{
                display:
                  'flex',
                justifyContent:
                  'space-between',
                marginBottom:
                  '10px',
              }}
            >
              <span>
                {
                  module.module
                }
              </span>

              <input
                type="number"
                min="0"
                value={
                  module.questionCount
                }
                onChange={(
                  e,
                ) =>
                  updateQuestionCount(
                    index,
                    Number(
                      e.target
                        .value,
                    ),
                  )
                }
                style={{
                  width:
                    '100px',
                }}
              />
            </div>
          ),
        )}

        <br />

        <button
          onClick={createTest}
          disabled={loading}
        >
          {loading
            ? 'Creating...'
            : 'Create Test'}
        </button>
      </div>
    </>
  );
}