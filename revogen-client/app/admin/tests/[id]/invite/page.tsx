'use client';

import {
  useState,
  useEffect,
} from 'react';

import { useParams } from 'next/navigation';

import AdminNavbar from '@/components/AdminNavbar';

export default function InvitePage() {
  const params = useParams();

  const testId =
    params.id as string;

  const [emails, setEmails] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const [
    invitations,
    setInvitations,
  ] = useState<any[]>([]);

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations =
    async () => {
      try {
        const token =
          localStorage.getItem(
            'access_token',
          );

        const response =
          await fetch(
            `http://localhost:3000/tests/${testId}/invitations`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          );

        const data =
          await response.json();

        setInvitations(data);
      } catch (error) {
        console.error(error);
      }
    };

  const assignTest =
    async () => {
      try {
        setLoading(true);

        const token =
          localStorage.getItem(
            'access_token',
          );

        const emailList =
          emails
            .split('\n')
            .map((email) =>
              email.trim(),
            )
            .filter(Boolean);

        const response =
          await fetch(
            `http://localhost:3000/tests/${testId}/invite`,
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',

                Authorization:
                  `Bearer ${token}`,
              },

              body: JSON.stringify({
                emails:
                  emailList,
              }),
            },
          );

        const data =
          await response.json();

        alert(
          `${data.count} invitations created`,
        );

        setEmails('');

        loadInvitations();
      } catch (error) {
        console.error(error);

        alert(
          'Failed to assign test',
        );
      } finally {
        setLoading(false);
      }
    };

  const completedCount =
    invitations.filter(
      (i) =>
        i.status ===
        'COMPLETED',
    ).length;

  const pendingCount =
    invitations.filter(
      (i) =>
        i.status ===
        'PENDING',
    ).length;

  return (
    <>
      <AdminNavbar />

      <div
        style={{
          padding: '30px',
        }}
      >
        <h1>
          Assign Test
        </h1>

        <p>
          One email per line
        </p>

        <textarea
          rows={10}
          cols={50}
          value={emails}
          onChange={(e) =>
            setEmails(
              e.target.value,
            )
          }
        />

        <br />
        <br />

        <button
          onClick={assignTest}
          disabled={loading}
        >
          {loading
            ? 'Assigning...'
            : 'Assign Test'}
        </button>

        <hr
          style={{
            marginTop: '30px',
            marginBottom:
              '30px',
          }}
        />

        <h2>
          Assigned Candidates
        </h2>

        <p>
          Total Assigned:{' '}
          {
            invitations.length
          }
        </p>

        <p>
          Completed:{' '}
          {completedCount}
        </p>

        <p>
          Pending:{' '}
          {pendingCount}
        </p>

        {invitations.length ===
          0 && (
          <p>
            No candidates
            assigned yet.
          </p>
        )}

        {invitations.map(
          (invitation) => (
            <div
              key={
                invitation.id
              }
              style={{
                border:
                  '1px solid #ccc',
                padding:
                  '15px',
                marginTop:
                  '10px',
                borderRadius:
                  '8px',
              }}
            >
              <strong>
                {
                  invitation.email
                }
              </strong>

              <p>
                Status:{' '}
                {
                  invitation.status
                }
              </p>
            </div>
          ),
        )}
      </div>
    </>
  );
}