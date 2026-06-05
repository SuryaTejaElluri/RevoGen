'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function TestPage() {
  const params = useParams();
  const id = params.id as string;

  const [test, setTest] = useState<any>(null);
  const [tabSwitches, setTabSwitches] =
  useState(0);
  const [answers, setAnswers] = useState<
    Record<string, string>
  >({});
  const [
  fullscreenViolations,
  setFullscreenViolations,
] = useState(0);
  const [
  alreadyAttempted,
  setAlreadyAttempted,
] = useState(false);
  const [result, setResult] = useState<any>(null);

  const [timeLeft, setTimeLeft] =
    useState(0);

  const [submitted, setSubmitted] =
    useState(false);

  // Load Test
  const checkAttemptStatus =
  async () => {
    const token =
      localStorage.getItem(
        'access_token',
      );

    const response =
      await fetch(
        `http://localhost:3000/tests/${id}/attempt-status`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        },
      );

    const data =
      await response.json();

    setAlreadyAttempted(
      data.attempted,
    );
  };

// Load Test
useEffect(() => {
  if (!id) return;

  fetch(
    `http://localhost:3000/tests/${id}`,
  )
    .then((res) => res.json())
    .then((data) => {
      setTest(data);

      setTimeLeft(
        data.duration * 60,
      );
    })
    .catch(console.error);
}, [id]);

// Check Attempt Status
useEffect(() => {
  if (!id) return;

  checkAttemptStatus();
}, [id]);

// Timer
useEffect(() => {
  if (timeLeft <= 0) return;

  const timer = setInterval(
    () => {
      setTimeLeft(
        (prev) => prev - 1,
      );
    },
    1000,
  );

  return () =>
    clearInterval(timer);
}, [timeLeft]);

  const submitTest = async () => {
  if (submitted) return;

  setSubmitted(true);

  const token =
  localStorage.getItem(
    'access_token',
  );

const response = await fetch(
  `http://localhost:3000/tests/${id}/submit`,
  {
    method: 'POST',

    headers: {
      'Content-Type':
        'application/json',

      Authorization:
        `Bearer ${token}`,
    },

    body: JSON.stringify({
      answers,

      tabSwitches,

      fullscreenViolations,
    }),
  },
);


  const data = await response.json();

  setResult(data);

  if (document.fullscreenElement) {
    document.exitFullscreen();
  }
};

  // Auto Submit
  useEffect(() => {
  if (
    timeLeft === 0 &&
    test &&
    !submitted
  ) {
    submitTest();
  }
}, [timeLeft, test, submitted]);

  const minutes = Math.floor(
    timeLeft / 60,
  );

  useEffect(() => {
  const handleVisibilityChange = () => {
    if (
      document.hidden &&
      !submitted
    ) {
      setTabSwitches(
        (prev) => prev + 1,
      );
    }
  };

  document.addEventListener(
    'visibilitychange',
    handleVisibilityChange,
  );

  return () => {
    document.removeEventListener(
      'visibilitychange',
      handleVisibilityChange,
    );
  };
}, [submitted]);

useEffect(() => {
  if (!test || submitted) return;

  document.documentElement
    .requestFullscreen()
    .catch(console.error);
}, [test, submitted]);

useEffect(() => {
  const handleFullscreenChange =
    () => {
      if (
        !document.fullscreenElement &&
        !submitted
      ) {
        setFullscreenViolations(
          (prev) => prev + 1,
        );
      }
    };

  document.addEventListener(
    'fullscreenchange',
    handleFullscreenChange,
  );

  return () => {
    document.removeEventListener(
      'fullscreenchange',
      handleFullscreenChange,
    );
  };
}, [submitted]);
  const seconds = timeLeft % 60;

  if (!test) {
    return <h1>Loading Test...</h1>;
  }

if (alreadyAttempted) {
  return (
    <div
      style={{
        padding: '30px',
      }}
    >
      <h1>
        Assessment Completed
      </h1>

      <p>
        You have already completed this test.
      </p>
    </div>
  );
}

  

  return (
    <div
      style={{
        padding: '30px',
      }}
    >
      <h1>{test.title}</h1>

      <h2>
        Time Left:{' '}
        {minutes}:
        {seconds
          .toString()
          .padStart(2, '0')}
      </h2>
      <p>
  Tab Switches:
  {' '}
  {tabSwitches}
</p>
<p>
  Fullscreen Violations:
  {' '}
  {fullscreenViolations}
</p>
      <p>
        Category: {test.category}
      </p>

      <p>
        Duration: {test.duration} mins
      </p>

      <hr />

      {test.questions.map(
        (
          question: any,
          index: number,
        ) => (
          <div
            key={question.id}
            style={{
              marginTop: '20px',
              padding: '20px',
              border:
                '1px solid gray',
            }}
          >
            <h3>
              Q{index + 1}.{' '}
              {question.question}
            </h3>

            <label>
              <input
                type="radio"
                name={question.id}
                value="A"
                onChange={() =>
                  setAnswers({
                    ...answers,
                    [question.id]:
                      'A',
                  })
                }
              />
              A. {question.optionA}
            </label>

            <br />
            <br />

            <label>
              <input
                type="radio"
                name={question.id}
                value="B"
                onChange={() =>
                  setAnswers({
                    ...answers,
                    [question.id]:
                      'B',
                  })
                }
              />
              B. {question.optionB}
            </label>

            <br />
            <br />

            <label>
              <input
                type="radio"
                name={question.id}
                value="C"
                onChange={() =>
                  setAnswers({
                    ...answers,
                    [question.id]:
                      'C',
                  })
                }
              />
              C. {question.optionC}
            </label>

            <br />
            <br />

            <label>
              <input
                type="radio"
                name={question.id}
                value="D"
                onChange={() =>
                  setAnswers({
                    ...answers,
                    [question.id]:
                      'D',
                  })
                }
              />
              D. {question.optionD}
            </label>
          </div>
        ),
      )}

      <button
        onClick={submitTest}
        disabled={submitted}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          cursor: 'pointer',
        }}
      >
        {submitted
          ? 'Submitted'
          : 'Submit Test'}
      </button>

      {result && (
        <div
          style={{
            marginTop: '30px',
            padding: '20px',
            border:
              '2px solid green',
          }}
        >
          <h2>
            🎉 Test Completed
          </h2>

          <p>
            Score:{' '}
            {result.score}/
            {
              result.totalQuestions
            }
          </p>

          <p>
            Percentage:{' '}
            {result.percentage}%
          </p>
        </div>
      )}
    </div>
  );
}