'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

import AdminNavbar from '@/components/AdminNavbar';

export default function TestQuestionsPage() {
  const params = useParams();

  const testId = params.id as string;

  const [questions, setQuestions] =
    useState<any[]>([]);

  const [
    selectedQuestions,
    setSelectedQuestions,
  ] = useState<string[]>([]);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions =
    async () => {
      try {
        const token =
          localStorage.getItem(
            'access_token',
          );

        const response =
          await fetch(
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

        console.log(
          'API Response:',
          data,
        );

        if (
          Array.isArray(data)
        ) {
          setQuestions(data);
        } else {
          console.error(
            'Expected array but got:',
            data,
          );

          setQuestions([]);
        }
      } catch (error) {
        console.error(error);

        setQuestions([]);
      }
    };

  const toggleQuestion = (
    questionId: string,
  ) => {
    if (
      selectedQuestions.includes(
        questionId,
      )
    ) {
      setSelectedQuestions(
        selectedQuestions.filter(
          (id) =>
            id !== questionId,
        ),
      );
    } else {
      setSelectedQuestions([
        ...selectedQuestions,
        questionId,
      ]);
    }
  };

  const addQuestionsToTest =
    async () => {
      try {
        const token =
          localStorage.getItem(
            'access_token',
          );

        for (const questionId of selectedQuestions) {
          await fetch(
            `http://localhost:3000/tests/${testId}/questions-bank/${questionId}`,
            {
              method: 'POST',

              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          );
        }

        alert(
          `${selectedQuestions.length} questions added successfully`,
        );

        setSelectedQuestions([]);
      } catch (error) {
        console.error(error);

        alert(
          'Failed to add questions',
        );
      }
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
          Select Questions
        </h1>

        <p>
          Selected:{' '}
          {
            selectedQuestions.length
          }
        </p>

        <hr />

        {questions.length === 0 && (
          <p>
            No questions found
          </p>
        )}

        {Array.isArray(
          questions,
        ) &&
          questions.map(
            (question) => (
              <div
                key={
                  question.id
                }
                style={{
                  border:
                    '1px solid #ccc',
                  padding:
                    '15px',
                  marginTop:
                    '10px',
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedQuestions.includes(
                    question.id,
                  )}
                  onChange={() =>
                    toggleQuestion(
                      question.id,
                    )
                  }
                />

                {' '}

                <strong>
                  {
                    question.category
                  }
                </strong>

                <p>
                  {
                    question.question
                  }
                </p>
              </div>
            ),
          )}

        <br />

        <button
          onClick={
            addQuestionsToTest
          }
          disabled={
            selectedQuestions.length ===
            0
          }
        >
          Add Selected Questions
        </button>
      </div>
    </>
  );
}