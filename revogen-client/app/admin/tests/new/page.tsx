'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import AdminNavbar from '@/components/AdminNavbar';

export default function CreateTestPage() {
  const router = useRouter();

  const [title, setTitle] =
    useState('');

  const [category, setCategory] =
    useState('');

  const [duration, setDuration] =
    useState(30);

  const [loading, setLoading] =
    useState(false);

  const createTest =
    async () => {
      if (
        !title ||
        !category
      ) {
        alert(
          'Please fill all fields',
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
                category,
                duration,
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
          `/admin/tests/${data.id}/questions`,
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
          maxWidth: '600px',
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
        />

        <br />
        <br />

        <input
          placeholder="Category"
          value={category}
          onChange={(e) =>
            setCategory(
              e.target.value,
            )
          }
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
        />

        <br />
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