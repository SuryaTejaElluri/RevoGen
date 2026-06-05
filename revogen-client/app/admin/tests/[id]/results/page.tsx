'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

import AdminNavbar from '@/components/AdminNavbar';

export default function TestResultsPage() {
  const params = useParams();

  const id = params.id as string;

  const [results, setResults] =
    useState<any[]>([]);

  const [minPercentage, setMinPercentage] =
    useState(0);

  const [maxTabSwitches, setMaxTabSwitches] =
    useState(999);

  const [
    maxFullscreenViolations,
    setMaxFullscreenViolations,
  ] = useState(999);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults =
    async () => {
      const token =
        localStorage.getItem(
          'access_token',
        );

      const response =
        await fetch(
          `http://localhost:3000/tests/${id}/results`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );

      const data =
        await response.json();

      setResults(data);
    };

  const filteredResults =
    results.filter(
      (result: any) =>
        result.percentage >=
          minPercentage &&
        result.tabSwitches <=
          maxTabSwitches &&
        result.fullscreenViolations <=
          maxFullscreenViolations,
    );
const copyEmails = () => {
  const emails =
    filteredResults.map(
      (result: any) =>
        result.user.email,
    );

  navigator.clipboard.writeText(
    emails.join(','),
  );

  alert(
    `${emails.length} emails copied`,
  );
};
const exportCSV = () => {
  const headers =
    [
      'Name',
      'Email',
      'Percentage',
      'TabSwitches',
      'FullscreenViolations',
    ];

  const rows =
    filteredResults.map(
      (result: any) => [
        result.user.name,
        result.user.email,
        result.percentage,
        result.tabSwitches,
        result.fullscreenViolations,
      ],
    );

  const csvContent =
    [
      headers.join(','),
      ...rows.map(
        (row) =>
          row.join(','),
      ),
    ].join('\n');

  const blob =
    new Blob(
      [csvContent],
      {
        type: 'text/csv',
      },
    );

  const url =
    window.URL.createObjectURL(
      blob,
    );

  const link =
    document.createElement(
      'a',
    );

  link.href = url;

  link.download =
    'shortlisted-candidates.csv';

  document.body.appendChild(
    link,
  );

  link.click();

  document.body.removeChild(
    link,
  );

  window.URL.revokeObjectURL(
    url,
  );
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
          Test Results
        </h1>

        <hr />

        <div
          style={{
            border:
              '1px solid #ccc',
            padding: '20px',
            marginTop: '20px',
            marginBottom: '20px',
          }}
        >
          <h2>
            Filters
          </h2>

          <p>
            Minimum Percentage
          </p>

          <input
            type="number"
            value={minPercentage}
            onChange={(e) =>
              setMinPercentage(
                Number(
                  e.target.value,
                ),
              )
            }
          />

          <br />
          <br />

          <p>
            Maximum Tab Switches
          </p>

          <input
            type="number"
            value={maxTabSwitches}
            onChange={(e) =>
              setMaxTabSwitches(
                Number(
                  e.target.value,
                ),
              )
            }
          />

          <br />
          <br />

          <p>
            Maximum Fullscreen Violations
          </p>

          <input
            type="number"
            value={
              maxFullscreenViolations
            }
            onChange={(e) =>
              setMaxFullscreenViolations(
                Number(
                  e.target.value,
                ),
              )
            }
          />
        </div>

        <p>
          Shortlisted Candidates:
          {' '}
          {
            filteredResults.length
          }
        </p>
        <button
  onClick={copyEmails}
  disabled={
    filteredResults.length === 0
  }
  style={{
    marginBottom: '20px',
  }}
>
  Copy Emails
</button>
<button
  onClick={exportCSV}
  disabled={
    filteredResults.length === 0
  }
  style={{
    marginLeft: '10px',
    marginBottom: '20px',
  }}
>
  Export CSV
</button>
        <hr />
        

        {filteredResults.length ===
          0 && (
          <p>
            No matching
            candidates found.
          </p>
        )}

        {filteredResults.map(
          (
            result: any,
            index: number,
          ) => (
            <div
              key={result.id}
              style={{
                border:
                  '1px solid #ccc',
                padding: '20px',
                marginTop: '10px',
              }}
            >
              <h2>
                Rank #
                {index + 1}
              </h2>

              <p>
                Name:
                {' '}
                {
                  result.user.name
                }
              </p>

              <p>
                Email:
                {' '}
                {
                  result.user.email
                }
              </p>

              <p>
                Score:
                {' '}
                {result.score}
                /
                {
                  result.totalQuestions
                }
              </p>

              <p>
                Percentage:
                {' '}
                {
                  result.percentage
                }
                %
              </p>

              <p>
                Tab Switches:
                {' '}
                {
                  result.tabSwitches
                }
              </p>

              <p>
                Fullscreen
                Violations:
                {' '}
                {
                  result.fullscreenViolations
                }
              </p>
            </div>
          ),
        )}
      </div>
    </>
  );
}