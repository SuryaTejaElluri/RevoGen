'use client';
import { API_BASE_URL } from '@/lib/api';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import AdminNavbar from '@/components/AdminNavbar';


export default function EditQuestionPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [category, setCategory] =
    useState('');

  const [question, setQuestion] =
    useState('');

  const [optionA, setOptionA] =
    useState('');

  const [optionB, setOptionB] =
    useState('');

  const [optionC, setOptionC] =
    useState('');

  const [optionD, setOptionD] =
    useState('');

  const [
    correctAnswer,
    setCorrectAnswer,
  ] = useState('A');

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    loadQuestion();
  }, []);

  const loadQuestion =
    async () => {
      const token =
        localStorage.getItem(
          'access_token',
        );

      const response =
        await fetch(
          `${API_BASE_URL}/question-bank/${id}`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );

      const data =
        await response.json();

      setCategory(
        data.category,
      );

      setQuestion(
        data.question,
      );

      setOptionA(
        data.optionA,
      );

      setOptionB(
        data.optionB,
      );

      setOptionC(
        data.optionC,
      );

      setOptionD(
        data.optionD,
      );

      setCorrectAnswer(
        data.correctAnswer,
      );
    };

  const updateQuestion =
    async () => {
      try {
        setLoading(true);

        const token =
          localStorage.getItem(
            'access_token',
          );

        const response =
          await fetch(
            `${API_BASE_URL}/question-bank/${id}`,
            {
              method: 'PATCH',

              headers: {
                'Content-Type':
                  'application/json',

                Authorization:
                  `Bearer ${token}`,
              },

              body: JSON.stringify({
                category,
                question,
                optionA,
                optionB,
                optionC,
                optionD,
                correctAnswer,
              }),
            },
          );

        const data =
          await response.json();

        if (!response.ok) {
          alert(
            data.message ||
              'Failed to update question',
          );
          return;
        }

        alert(
          'Question updated successfully',
        );

        router.push(
          '/admin/questions',
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
          Edit Question
        </h1>

        <hr />

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

        <textarea
          value={question}
          onChange={(e) =>
            setQuestion(
              e.target.value,
            )
          }
          rows={4}
          style={{
            width: '100%',
          }}
        />

        <br />
        <br />

        <input
          placeholder="Option A"
          value={optionA}
          onChange={(e) =>
            setOptionA(
              e.target.value,
            )
          }
        />

        <br />
        <br />

        <input
          placeholder="Option B"
          value={optionB}
          onChange={(e) =>
            setOptionB(
              e.target.value,
            )
          }
        />

        <br />
        <br />

        <input
          placeholder="Option C"
          value={optionC}
          onChange={(e) =>
            setOptionC(
              e.target.value,
            )
          }
        />

        <br />
        <br />

        <input
          placeholder="Option D"
          value={optionD}
          onChange={(e) =>
            setOptionD(
              e.target.value,
            )
          }
        />

        <br />
        <br />

        <select
          value={correctAnswer}
          onChange={(e) =>
            setCorrectAnswer(
              e.target.value,
            )
          }
        >
          <option value="A">
            A
          </option>

          <option value="B">
            B
          </option>

          <option value="C">
            C
          </option>

          <option value="D">
            D
          </option>
        </select>

        <br />
        <br />

        <button
          onClick={
            updateQuestion
          }
          disabled={loading}
        >
          {loading
            ? 'Updating...'
            : 'Update Question'}
        </button>
      </div>
    </>
  );
}