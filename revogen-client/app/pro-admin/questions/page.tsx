'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProAdminNavbar from '@/components/ProAdminNavbar';
import { API_BASE_URL } from '@/lib/api';

export default function ProAdminQuestionsPage() {
  const [questions, setQuestions] =
    useState<any[]>([]);

  const [search, setSearch] =
    useState('');

  const [categoryFilter, setCategoryFilter] =
    useState('');

  const loadQuestions =
    async () => {
      try {
        const token =
          localStorage.getItem(
            'access_token',
          );

        const response =
          await fetch(
            `${API_BASE_URL}/question-bank`,
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
      } catch (error) {
        console.error(error);
      }
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

      if (!confirmed) return;

      try {
        const token =
          localStorage.getItem(
            'access_token',
          );

        await fetch(
          `${API_BASE_URL}/question-bank/${id}`,
          {
            method: 'DELETE',
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );

        loadQuestions();
      } catch (error) {
        console.error(error);
      }
    };

  const categories =
    Array.from(
      new Set(
        questions.map(
          (q) => q.category,
        ),
      ),
    );

  const filteredQuestions =
    questions.filter(
      (question) => {
        const matchesSearch =
          question.question
            .toLowerCase()
            .includes(
              search.toLowerCase(),
            );

        const matchesCategory =
          !categoryFilter ||
          question.category ===
            categoryFilter;

        return (
          matchesSearch &&
          matchesCategory
        );
      },
    );

  return (
    <>
      <ProAdminNavbar />

      <div
        style={{
          padding: '30px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent:
              'space-between',
            alignItems:
              'center',
          }}
        >
          <div>
            <h1>
              Question Bank
            </h1>

            <p>
              Total Questions:{' '}
              {
                questions.length
              }
            </p>
          </div>

          <Link href="/pro-admin/questions/new">
            <button>
              Add Question
            </button>
          </Link>
        </div>

        <hr />

        <br />

        <div
          style={{
            display: 'flex',
            gap: '10px',
            marginBottom:
              '20px',
          }}
        >
          <input
            placeholder="Search question..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value,
              )
            }
            style={{
              flex: 1,
              padding: '10px',
            }}
          />

          <select
            value={
              categoryFilter
            }
            onChange={(e) =>
              setCategoryFilter(
                e.target.value,
              )
            }
            style={{
              padding: '10px',
            }}
          >
            <option value="">
              All Categories
            </option>

            {categories.map(
              (category) => (
                <option
                  key={category}
                  value={category}
                >
                  {category}
                </option>
              ),
            )}
          </select>
        </div>

        <div
          style={{
            marginBottom:
              '20px',
          }}
        >
          <strong>
            Showing{' '}
            {
              filteredQuestions.length
            }{' '}
            Questions
          </strong>
        </div>

        {filteredQuestions.map(
          (question) => (
            <div
              key={question.id}
              style={{
                border:
                  '1px solid #ccc',
                padding: '20px',
                marginTop:
                  '15px',
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
                A.{' '}
                {
                  question.optionA
                }
              </p>

              <p>
                B.{' '}
                {
                  question.optionB
                }
              </p>

              <p>
                C.{' '}
                {
                  question.optionC
                }
              </p>

              <p>
                D.{' '}
                {
                  question.optionD
                }
              </p>

              <p>
                Correct:{' '}
                {
                  question.correctAnswer
                }
              </p>

              <div
                style={{
                  display:
                    'flex',
                  gap: '10px',
                }}
              >
                <Link
                  href={`/pro-admin/questions/${question.id}/edit`}
                >
                  <button>
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
            </div>
          ),
        )}
      </div>
    </>
  );
}