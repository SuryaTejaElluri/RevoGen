'use client';

import { useEffect, useState } from 'react';
import AdminNavbar from '@/components/AdminNavbar';
import Link from 'next/link';
export default function AdminQuestionsPage() {
  const [questions, setQuestions] =
    useState<any[]>([]);

  const loadQuestions =
    async () => {
      const token =
        localStorage.getItem(
          'access_token',
        );

      const response = await fetch(
        'http://localhost:3000/question-bank',
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        },
      );

      const data =
        await response.json();

      setQuestions(data);
    };

  useEffect(() => {
    loadQuestions();
  }, []);

  const deleteQuestion =
    async (id: string) => {
      const confirmed =
        confirm(
          'Delete this question?',
        );

      if (!confirmed) {
        return;
      }

      const token =
        localStorage.getItem(
          'access_token',
        );

      await fetch(
        `http://localhost:3000/question-bank/${id}`,
        {
          method: 'DELETE',

          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        },
      );

      loadQuestions();
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
          Question Bank
        </h1>

        <p>
          Total Questions:
          {' '}
          {questions.length}
        </p>

        <hr />

        {questions.map(
          (question) => (
            <div
              key={question.id}
              style={{
                border:
                  '1px solid #ccc',
                padding: '20px',
                marginTop: '15px',
                borderRadius:
                  '8px',
              }}
            >
              <h3>
                {
                  question.category
                }
              </h3>

              <p>
                {
                  question.question
                }
              </p>

              <p>
                A.
                {' '}
                {
                  question.optionA
                }
              </p>

              <p>
                B.
                {' '}
                {
                  question.optionB
                }
              </p>

              <p>
                C.
                {' '}
                {
                  question.optionC
                }
              </p>

              <p>
                D.
                {' '}
                {
                  question.optionD
                }
              </p>

              <p>
                Correct:
                {' '}
                {
                  question.correctAnswer
                }
              </p>

              <Link
  href={`/admin/questions/${question.id}/edit`}
>
  <button
    style={{
      marginRight: '10px',
    }}
  >
    Edit
  </button>
</Link>

              <button
                onClick={() =>
                  deleteQuestion(
                    question.id,
                  )
                }
              >
                Delete
              </button>
            </div>
          ),
        )}
        <Link href="/admin/questions/new">
  <button>
    Add Question
  </button>
</Link>
      </div>
    </>
  );
}