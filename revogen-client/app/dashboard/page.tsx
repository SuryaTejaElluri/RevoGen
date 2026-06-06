'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
export default function DashboardPage() {
  const router = useRouter();

  const [dashboard, setDashboard] =
    useState<any>(null);

  useEffect(() => {
    const token =
      localStorage.getItem(
        'access_token',
      );

    if (!token) {
      router.push('/login');
      return;
    }

    fetch(
      'http://localhost:3000/dashboard',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )
      .then(async (res) => {
        const data =
          await res.json();

        if (!res.ok) {
          localStorage.removeItem(
            'access_token',
          );

          router.push('/login');
          return;
        }

        setDashboard(data);
      })
      .catch((err) => {
        console.error(err);
      });
  }, [router]);

  if (!dashboard) {
  return <h1>Loading...</h1>;
}

  return (
    <>
  <Navbar />

  <div
    style={{
      padding: '30px',
    }}
  ></div>
    <div
      style={{
        padding: '30px',
      }}
    >
      <h1>Dashboard</h1>

      <hr />

      

      <hr />

      
      
      
          <div
  style={{
    padding: '30px',
    maxWidth: '1200px',
    margin: '0 auto',
  }}
>
  <h1>
    Welcome Back 👋
  </h1>

  <p
    style={{
      color: '#666',
      marginBottom: '30px',
    }}
  >
    Continue your assessments and
    improve your profile.
  </p>

  {/* Resume Card */}

  <div
    style={{
      border: '1px solid #ddd',
      padding: '20px',
      borderRadius: '12px',
      marginBottom: '25px',
    }}
  >
    <h2>
      Resume Status
    </h2>

    <p>
      {dashboard.resumeUploaded
        ? '✅ Resume Uploaded'
        : '❌ Resume Not Uploaded'}
    </p>

    <p>
      ATS Score:
      {' '}
      {dashboard.atsScore}
    </p>
  </div>

  {/* Stats */}

  <div
    style={{
      display: 'grid',
      gridTemplateColumns:
        'repeat(auto-fit,minmax(250px,1fr))',
      gap: '20px',
      marginBottom: '30px',
    }}
  >
    <div
      style={{
        border: '1px solid #ddd',
        padding: '20px',
        borderRadius: '12px',
      }}
    >
      <h3>
        Assigned Assessments
      </h3>

      <h1>
        {
          dashboard.assignedAssessments
        }
      </h1>
    </div>

    <div
      style={{
        border: '1px solid #ddd',
        padding: '20px',
        borderRadius: '12px',
      }}
    >
      <h3>
        Practice Exams Taken
      </h3>

      <h1>
        {
          dashboard.practiceExamsTaken
        }
      </h1>
    </div>

    <div
      style={{
        border: '1px solid #ddd',
        padding: '20px',
        borderRadius: '12px',
      }}
    >
      <h3>
        Assessments Completed
      </h3>

      <h1>
        {
          dashboard.completedAssessments
        }
      </h1>
    </div>
  </div>

  {/* Quick Actions */}

  <div
    style={{
      border: '1px solid #ddd',
      padding: '20px',
      borderRadius: '12px',
    }}
  >
    <h2>
      Quick Actions
    </h2>

    <div
      style={{
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap',
      }}
    >
      <button
        onClick={() =>
          router.push(
            '/resume',
          )
        }
      >
        Upload Resume
      </button>

      <button
        onClick={() =>
          router.push(
            '/practice',
          )
        }
      >
        Practice Exams
      </button>

      <button
        onClick={() =>
          router.push(
            '/results',
          )
        }
      >
        My Assessments
      </button>
    </div>
  </div>
</div>
        
    </div>
    </>
  );
  
}