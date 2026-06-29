'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import ProAdminNavbar from '@/components/ProAdminNavbar';
import { API_BASE_URL } from '@/lib/api';


export default function NewQuestionPage() {
  const router = useRouter();

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

  const createQuestion =
    async () => {
      if (
        !category ||
        !question ||
        !optionA ||
        !optionB ||
        !optionC ||
        !optionD
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
            `${API_BASE_URL}/question-bank`,
            {
              method: 'POST',

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
              'Failed to create question',
          );
          return;
        }

        alert(
          'Question created successfully',
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
      <ProAdminNavbar />

      <div
        style={{
          padding: '30px',
          maxWidth: '700px',
        }}
      >
        <h1>
          Create Question
        </h1>

        <hr />

        <br />

        <select
  value={category}
  onChange={(e) =>
    setCategory(
      e.target.value,
    )
  }
  style={{
    width: '100%',
    padding: '10px',
  }}
>
  <option value="">
    Select Module
  </option>

  <option value="Java">
    Java
  </option>

  <option value="Python">
    Python
  </option>

  <option value="JavaScript">
    JavaScript
  </option>

  <option value="React">
    React
  </option>

  <option value="DBMS">
    DBMS
  </option>

  <option value="SQL">
    SQL
  </option>

  <option value="DSA">
    DSA
  </option>

  <option value="Operating Systems">
    Operating Systems
  </option>

  <option value="Computer Networks">
    Computer Networks
  </option>

  <option value="Aptitude">
    Aptitude
  </option>
</select>

        <br />
        <br />

        <textarea
          placeholder="Question"
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
            createQuestion
          }
          disabled={loading}
        >
          {loading
            ? 'Creating...'
            : 'Create Question'}
        </button>
      </div>
    </>
  );
}