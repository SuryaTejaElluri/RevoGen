'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function CodingInvitePage() {
  const params = useParams();

  const testId = params.id as string;

  const [emails, setEmails] = useState('');

  const [loading, setLoading] =
    useState(false);

  const [invitations, setInvitations] =
    useState<any[]>([]);

  const [fetching, setFetching] =
    useState(true);

  useEffect(() => {
    loadInvitations();
  }, []);

  async function loadInvitations() {
    try {
      setFetching(true);

      const token =
        localStorage.getItem(
          'access_token',
        );

      const res = await fetch(
        `http://localhost:3000/coding-tests/${testId}/invitations`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data =
        await res.json();

      console.log(data);

      setInvitations(
        Array.isArray(data)
          ? data
          : [],
      );
    } catch (err) {
      console.error(err);
      setInvitations([]);
    } finally {
      setFetching(false);
    }
  }

  async function assignCandidates() {
    try {
      setLoading(true);

      const token =
        localStorage.getItem(
          'access_token',
        );

      const emailList = emails
        .split('\n')
        .map((e) => e.trim())
        .filter(Boolean);

      const res = await fetch(
        `http://localhost:3000/coding-tests/${testId}/invite`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            emails: emailList,
          }),
        },
      );

      const data =
        await res.json();

      alert(
        `${data.count} candidates assigned`,
      );

      setEmails('');

      loadInvitations();
    } catch (err) {
      console.error(err);

      alert(
        'Failed to assign candidates',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 30 }}>
      <h1>
        Assign Coding Test
      </h1>

      <br />

      <textarea
        rows={10}
        style={{
          width: '100%',
        }}
        value={emails}
        onChange={(e) =>
          setEmails(e.target.value)
        }
        placeholder={`john@gmail.com\nsurya@gmail.com`}
      />

      <br />
      <br />

      <button
        onClick={assignCandidates}
        disabled={loading}
      >
        {loading
          ? 'Assigning...'
          : 'Assign Test'}
      </button>

      <hr
        style={{
          marginTop: 30,
          marginBottom: 30,
        }}
      />

      <h2>
        Assigned Candidates
      </h2>

      {fetching && (
        <p>Loading...</p>
      )}

      {!fetching &&
        invitations.length === 0 && (
          <p>
            No candidates assigned
          </p>
        )}

      {!fetching &&
        invitations.map(
          (invite: any) => (
            <div
              key={invite.id}
              style={{
                padding: 10,
                border:
                  '1px solid #ddd',
                marginBottom: 10,
              }}
            >
              <div>
                Email:
                {' '}
                {
                  invite.candidateEmail
                }
              </div>

              <div>
                Name:
                {' '}
                {
                  invite.candidateName
                }
              </div>

              <div>
                Status:
                {' '}
                {invite.status}
              </div>
            </div>
          ),
        )}
    </div>
  );
}